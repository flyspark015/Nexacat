/**
 * HTML Processor - Clean and extract product-relevant content from raw HTML
 */

export interface ProcessedHTML {
  cleanedHtml: string;
  productImages: ExtractedImage[];
  structuredData?: any; // JSON-LD or microdata
  metadata: {
    title?: string;
    description?: string;
    price?: string;
    currency?: string;
    brand?: string;
    availability?: string;
  };
}

export interface ExtractedImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  type: 'main' | 'gallery' | 'thumbnail' | 'og' | 'unknown';
  quality: 'high' | 'medium' | 'low';
  source: 'img' | 'jsonld' | 'og' | 'meta';
}

/**
 * Process and clean HTML for product extraction
 */
export function processProductHTML(html: string, sourceUrl: string): ProcessedHTML {
  // Extract structured data (JSON-LD, microdata)
  const structuredData = extractStructuredData(html);
  
  // Extract metadata
  const metadata = extractMetadata(html, structuredData);
  
  // Extract product images
  const productImages = extractProductImages(html, sourceUrl, structuredData);
  
  // Clean HTML (remove scripts, ads, tracking, etc.)
  const cleanedHtml = cleanHTML(html);
  
  return {
    cleanedHtml,
    productImages,
    structuredData,
    metadata,
  };
}

/**
 * Extract JSON-LD structured data
 */
function extractStructuredData(html: string): any {
  const structuredDataList: any[] = [];
  
  // Extract JSON-LD
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      structuredDataList.push(data);
    } catch (error) {
      console.warn('Failed to parse JSON-LD:', error);
    }
  }
  
  // Find Product schema
  const productSchema = findProductSchema(structuredDataList);
  
  return productSchema || structuredDataList[0];
}

/**
 * Find Product schema from structured data
 */
function findProductSchema(dataList: any[]): any {
  for (const data of dataList) {
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item['@type'] === 'Product' || item['@type']?.includes('Product')) {
          return item;
        }
      }
    } else if (data['@type'] === 'Product' || data['@type']?.includes('Product')) {
      return data;
    } else if (data['@graph']) {
      const product = data['@graph'].find((item: any) => 
        item['@type'] === 'Product' || item['@type']?.includes('Product')
      );
      if (product) return product;
    }
  }
  return null;
}

/**
 * Extract metadata from HTML and structured data
 */
function extractMetadata(html: string, structuredData?: any): ProcessedHTML['metadata'] {
  const metadata: ProcessedHTML['metadata'] = {};
  
  // From JSON-LD
  if (structuredData) {
    metadata.title = structuredData.name;
    metadata.description = structuredData.description;
    metadata.brand = structuredData.brand?.name || structuredData.brand;
    
    if (structuredData.offers) {
      const offer = Array.isArray(structuredData.offers) 
        ? structuredData.offers[0] 
        : structuredData.offers;
      metadata.price = offer.price?.toString();
      metadata.currency = offer.priceCurrency;
      metadata.availability = offer.availability;
    }
  }
  
  // Fallback to meta tags
  if (!metadata.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    metadata.title = titleMatch?.[1]?.trim();
  }
  
  if (!metadata.description) {
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    metadata.description = descMatch?.[1]?.trim();
  }
  
  if (!metadata.price) {
    const ogPriceMatch = html.match(/<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i);
    metadata.price = ogPriceMatch?.[1]?.trim();
  }
  
  if (!metadata.currency) {
    const ogCurrencyMatch = html.match(/<meta[^>]*property=["']og:price:currency["'][^>]*content=["']([^"']+)["']/i);
    metadata.currency = ogCurrencyMatch?.[1]?.trim();
  }
  
  return metadata;
}

/**
 * Extract product images from HTML
 */
function extractProductImages(html: string, sourceUrl: string, structuredData?: any): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  const seenUrls = new Set<string>();
  
  // 1. Extract from JSON-LD (HIGHEST PRIORITY - most reliable)
  if (structuredData?.image) {
    const jsonLdImages = Array.isArray(structuredData.image) 
      ? structuredData.image 
      : [structuredData.image];
    
    for (const img of jsonLdImages) {
      const url = typeof img === 'string' ? img : img.url || img.contentUrl;
      if (url && !seenUrls.has(url)) {
        images.push({
          url: resolveUrl(url, sourceUrl),
          type: 'main',
          quality: 'high',
          source: 'jsonld',
        });
        seenUrls.add(url);
      }
    }
  }
  
  // 2. Extract from Open Graph
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    const url = ogImageMatch[1].trim();
    if (!seenUrls.has(url)) {
      images.push({
        url: resolveUrl(url, sourceUrl),
        type: 'og',
        quality: 'high',
        source: 'og',
      });
      seenUrls.add(url);
    }
  }
  
  // 3. Extract from common product gallery patterns
  const galleryImages = extractGalleryImages(html, sourceUrl);
  for (const img of galleryImages) {
    if (!seenUrls.has(img.url)) {
      images.push(img);
      seenUrls.add(img.url);
    }
  }
  
  // 4. Extract from product image containers (div/section with product-specific classes)
  const productContainerImages = extractProductContainerImages(html, sourceUrl);
  for (const img of productContainerImages) {
    if (!seenUrls.has(img.url)) {
      images.push(img);
      seenUrls.add(img.url);
    }
  }
  
  // 5. Extract from regular img tags (filtered for product relevance)
  const imgMatches = html.matchAll(/<img[^>]*>/gi);
  for (const match of imgMatches) {
    const imgTag = match[0];
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt=["']([^"']+)["']/i);
    const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
    const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);
    const classMatch = imgTag.match(/class=["']([^"']+)["']/i);
    
    if (srcMatch) {
      const url = srcMatch[1];
      const alt = altMatch?.[1];
      const className = classMatch?.[1] || '';
      
      // Enhanced filtering: skip non-product images
      if (isNonProductImage(url, alt, className)) continue;
      
      // Skip if already seen
      if (seenUrls.has(url)) continue;
      
      const width = widthMatch ? parseInt(widthMatch[1]) : undefined;
      const height = heightMatch ? parseInt(heightMatch[1]) : undefined;
      
      // Determine if this is likely a product image based on context
      const isLikelyProductImage = checkProductImageContext(imgTag, className, alt);
      
      images.push({
        url: resolveUrl(url, sourceUrl),
        alt,
        width,
        height,
        type: isLikelyProductImage ? 'gallery' : 'unknown',
        quality: assessImageQuality(url, width, height),
        source: 'img',
      });
      seenUrls.add(url);
    }
  }
  
  // 6. Filter out likely non-product images (banners, ads, related products)
  const filteredImages = images.filter(img => {
    // Keep high-confidence images (JSON-LD, OG, main)
    if (img.source === 'jsonld' || img.type === 'main' || img.type === 'og') {
      return true;
    }
    
    // Filter out obvious non-product images
    if (img.quality === 'low' && img.type === 'unknown') {
      return false;
    }
    
    return true;
  });
  
  // 7. Sort by priority: main → gallery → og → thumbnail → unknown
  // Within same type, sort by quality
  return filteredImages.sort((a, b) => {
    const typeOrder: Record<ExtractedImage['type'], number> = {
      main: 1,
      gallery: 2,
      og: 3,
      thumbnail: 4,
      unknown: 5,
    };
    
    const qualityOrder: Record<ExtractedImage['quality'], number> = {
      high: 1,
      medium: 2,
      low: 3,
    };
    
    const typeCompare = typeOrder[a.type] - typeOrder[b.type];
    if (typeCompare !== 0) return typeCompare;
    
    return qualityOrder[a.quality] - qualityOrder[b.quality];
  });
}

/**
 * Extract images from product-specific containers
 */
function extractProductContainerImages(html: string, sourceUrl: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  
  // Common product container patterns
  const containerPatterns = [
    // Product gallery containers
    /<div[^>]*class=["'][^"']*(?:product-gallery|gallery|product-images|image-gallery)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    // Product detail containers
    /<div[^>]*class=["'][^"']*(?:product-detail|product-media|media-gallery)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
    // Slider/carousel containers
    /<div[^>]*class=["'][^"']*(?:slider|carousel|swiper)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi,
  ];
  
  for (const pattern of containerPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const containerHtml = match[1];
      
      // Extract images from this container
      const imgMatches = containerHtml.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*/gi);
      for (const imgMatch of imgMatches) {
        const url = imgMatch[1];
        if (!isNonProductImage(url)) {
          images.push({
            url: resolveUrl(url, sourceUrl),
            type: 'gallery',
            quality: 'high',
            source: 'img',
          });
        }
      }
      
      // Also check data attributes in the container
      const dataImgMatches = containerHtml.matchAll(/data-(?:src|image|large-image|zoom)=["']([^"']+)["']/gi);
      for (const dataMatch of dataImgMatches) {
        const url = dataMatch[1];
        if (!isNonProductImage(url)) {
          images.push({
            url: resolveUrl(url, sourceUrl),
            type: 'gallery',
            quality: 'high',
            source: 'img',
          });
        }
      }
    }
  }
  
  return images;
}

/**
 * Check if image is in a product context
 */
function checkProductImageContext(imgTag: string, className: string, alt?: string): boolean {
  const productKeywords = [
    'product', 'item', 'gallery', 'main', 'primary',
    'detail', 'zoom', 'large', 'featured'
  ];
  
  const nonProductKeywords = [
    'banner', 'ad', 'advertisement', 'related', 'recommended',
    'similar', 'also-bought', 'review', 'logo', 'brand-logo'
  ];
  
  const combinedText = `${className} ${alt || ''}`.toLowerCase();
  
  // Check for non-product keywords (exclude)
  for (const keyword of nonProductKeywords) {
    if (combinedText.includes(keyword)) {
      return false;
    }
  }
  
  // Check for product keywords (include)
  for (const keyword of productKeywords) {
    if (combinedText.includes(keyword)) {
      return true;
    }
  }
  
  // Neutral - neither positive nor negative indicators
  return false;
}

/**
 * Check if URL/alt suggests non-product image (ENHANCED)
 */
function isNonProductImage(url: string, alt?: string, className?: string): boolean {
  const url_lower = url.toLowerCase();
  const alt_lower = alt?.toLowerCase() || '';
  const class_lower = className?.toLowerCase() || '';
  
  // Exclude patterns (expanded list)
  const excludePatterns = [
    // Branding
    'logo', 'brand-logo', 'icon', 'favicon',
    // Advertising
    'banner', 'ad', 'advertisement', 'promo',
    // Tracking
    'tracking', 'pixel', 'analytics', '1x1', 'spacer', 'blank',
    // Related products
    'related', 'recommended', 'similar', 'also-bought', 'you-may-like',
    'cross-sell', 'upsell', 'recently-viewed',
    // Reviews/ratings
    'review', 'rating', 'star', 'badge', 'award',
    // Social
    'social', 'share', 'facebook', 'twitter', 'instagram', 'pinterest',
    // Payment
    'payment', 'visa', 'mastercard', 'paypal', 'stripe',
    // UI elements
    'thumbnail-small', 'tiny', 'avatar', 'placeholder',
    // Category/navigation
    'category', 'nav', 'menu', 'header', 'footer',
  ];
  
  for (const pattern of excludePatterns) {
    if (url_lower.includes(pattern) || alt_lower.includes(pattern) || class_lower.includes(pattern)) {
      return true;
    }
  }
  
  // Exclude very small images (likely icons/badges)
  if (url_lower.match(/\d+x\d+/)) {
    const sizeMatch = url_lower.match(/(\d+)x(\d+)/);
    if (sizeMatch) {
      const w = parseInt(sizeMatch[1]);
      const h = parseInt(sizeMatch[2]);
      if (w < 100 || h < 100) return true;
    }
  }
  
  // Exclude SVG icons (unless explicitly product-related)
  if (url_lower.endsWith('.svg') && !alt_lower.includes('product')) {
    return true;
  }
  
  return false;
}

/**
 * Extract images from gallery patterns
 */
function extractGalleryImages(html: string, sourceUrl: string): ExtractedImage[] {
  const images: ExtractedImage[] = [];
  
  // Common gallery patterns
  const patterns = [
    // Data attributes commonly used for galleries
    /data-(?:image|src|large-image|zoom-image)=["']([^"']+)["']/gi,
    // Srcset attributes (take the largest)
    /srcset=["']([^"']+)["']/gi,
  ];
  
  for (const pattern of patterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      let url = match[1];
      
      // Handle srcset format (e.g., "image1.jpg 1x, image2.jpg 2x")
      if (url.includes(',')) {
        const srcsetParts = url.split(',').map(s => s.trim());
        // Take the largest (usually last)
        const largest = srcsetParts[srcsetParts.length - 1];
        url = largest.split(' ')[0];
      }
      
      if (!isNonProductImage(url)) {
        images.push({
          url: resolveUrl(url, sourceUrl),
          type: 'gallery',
          quality: 'high',
          source: 'img',
        });
      }
    }
  }
  
  return images;
}

/**
 * Assess image quality based on URL and dimensions
 */
function assessImageQuality(url: string, width?: number, height?: number): ExtractedImage['quality'] {
  // High quality indicators
  if (url.includes('original') || url.includes('large') || url.includes('hd') || url.includes('zoom')) {
    return 'high';
  }
  
  // Low quality indicators
  if (url.includes('thumb') || url.includes('small') || url.includes('preview') || url.includes('icon')) {
    return 'low';
  }
  
  // Based on dimensions
  if (width && height) {
    if (width >= 800 && height >= 800) return 'high';
    if (width < 300 || height < 300) return 'low';
  }
  
  return 'medium';
}

/**
 * Resolve relative URLs to absolute
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    // Already absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Protocol-relative
    if (url.startsWith('//')) {
      const base = new URL(baseUrl);
      return `${base.protocol}${url}`;
    }
    
    // Relative
    return new URL(url, baseUrl).href;
  } catch (error) {
    console.warn('Failed to resolve URL:', url, error);
    return url;
  }
}

/**
 * Clean HTML by removing scripts, ads, tracking, etc.
 */
function cleanHTML(html: string): string {
  let cleaned = html;
  
  // Remove scripts
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove styles
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove common ad/tracking elements
  const removePatterns = [
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi,
    // Remove elements with ad-related classes/ids
    /<[^>]*(class|id)=["'][^"']*(?:ad|advertisement|tracking|banner|popup)[^"']*["'][^>]*>(?:[\s\S]*?<\/[^>]+>)?/gi,
  ];
  
  for (const pattern of removePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/>\s+</g, '><');
  
  return cleaned.trim();
}

/**
 * Extract product-relevant sections from HTML
 * Returns key sections: title, description, price, specs, etc.
 */
export function extractProductSections(html: string): {
  title?: string;
  description?: string;
  price?: string;
  specifications?: string;
  features?: string;
} {
  const sections: any = {};
  
  // Extract title from h1 or title tag
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    sections.title = stripHtmlTags(h1Match[1]).trim();
  }
  
  // Extract price (common patterns)
  const pricePatterns = [
    /<[^>]*(class|id)=["'][^"']*price[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
    /[$€£¥₹]\s*[\d,]+\.?\d*/,
  ];
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      sections.price = stripHtmlTags(match[0]).trim();
      break;
    }
  }
  
  // Extract description (common patterns)
  const descPatterns = [
    /<[^>]*(class|id)=["'][^"']*(?:description|detail|about)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
  ];
  
  for (const pattern of descPatterns) {
    const match = html.match(pattern);
    if (match) {
      sections.description = stripHtmlTags(match[0]).trim();
      break;
    }
  }
  
  return sections;
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
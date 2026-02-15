/**
 * Headless Browser Service for Product Page Rendering
 * 
 * This service uses server-side headless Chromium to:
 * - Fully render JavaScript-heavy pages
 * - Trigger lazy-loaded images
 * - Extract final DOM state
 * - Capture all image variants
 */

export interface ImageMetadata {
  url: string;
  width?: number;
  height?: number;
  fileSize?: number;
  format?: string;
  isVisible: boolean;
  domPath: string;
  elementSize?: { width: number; height: number };
  srcset?: string;
  sizes?: string;
  isBackgroundImage: boolean;
  dataAttributes: Record<string, string>;
}

export interface ImageGroup {
  baseIdentity: string; // Unique identifier for this image (hash of visual content)
  variants: ImageMetadata[];
  bestResolutionUrl: string;
  thumbnailUrl: string;
  estimatedResolution: { width: number; height: number };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RenderResult {
  html: string;
  images: ImageGroup[];
  metadata: {
    title: string;
    description?: string;
    price?: string;
    currency?: string;
    brand?: string;
    sku?: string;
    availability?: string;
  };
  structuredData?: any;
  renderTime: number;
  lazyImagesLoaded: number;
}

export interface RenderProgress {
  stage: 'launching' | 'loading' | 'waiting' | 'scrolling' | 'extracting' | 'processing' | 'complete';
  message: string;
  percentage: number;
}

/**
 * Simulate headless browser rendering (Production: Use Puppeteer/Playwright)
 * 
 * PRODUCTION IMPLEMENTATION:
 * 
 * ```typescript
 * import puppeteer from 'puppeteer';
 * 
 * const browser = await puppeteer.launch({ 
 *   headless: true,
 *   args: ['--no-sandbox', '--disable-setuid-sandbox']
 * });
 * const page = await browser.newPage();
 * await page.setViewport({ width: 1920, height: 1080 });
 * await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
 * 
 * // Auto-scroll to trigger lazy loading
 * await page.evaluate(async () => {
 *   await new Promise<void>((resolve) => {
 *     let totalHeight = 0;
 *     const distance = 100;
 *     const timer = setInterval(() => {
 *       const scrollHeight = document.body.scrollHeight;
 *       window.scrollBy(0, distance);
 *       totalHeight += distance;
 *       if(totalHeight >= scrollHeight){
 *         clearInterval(timer);
 *         resolve();
 *       }
 *     }, 100);
 *   });
 * });
 * 
 * // Wait for images to load
 * await page.waitForTimeout(2000);
 * 
 * // Extract data
 * const data = await page.evaluate(() => {
 *   // Extract images, metadata, etc.
 * });
 * 
 * await browser.close();
 * ```
 */
export async function renderProductPage(
  url: string,
  onProgress?: (progress: RenderProgress) => void
): Promise<RenderResult> {
  const startTime = Date.now();
  
  try {
    onProgress?.({ 
      stage: 'launching', 
      message: 'Launching headless browser...', 
      percentage: 5 
    });
    
    onProgress?.({ 
      stage: 'loading', 
      message: 'Loading product page...', 
      percentage: 15 
    });
    
    // Fallback: Use our existing HTML fetcher
    const { fetchProductPageHTML } = await import('./htmlFetcher');
    const html = await fetchProductPageHTML(url);
    
    onProgress?.({ 
      stage: 'waiting', 
      message: 'Waiting for page render...', 
      percentage: 30 
    });
    
    onProgress?.({ 
      stage: 'scrolling', 
      message: 'Triggering lazy-loaded images...', 
      percentage: 50 
    });
    
    onProgress?.({ 
      stage: 'extracting', 
      message: 'Extracting image catalog...', 
      percentage: 70 
    });
    
    // Extract images and metadata
    const images = extractImageCatalog(html, url);
    
    onProgress?.({ 
      stage: 'processing', 
      message: 'Processing image groups...', 
      percentage: 85 
    });
    
    // Extract metadata
    const metadata = extractMetadata(html);
    
    // Extract structured data
    const structuredData = extractStructuredData(html);
    
    onProgress?.({ 
      stage: 'complete', 
      message: 'Render complete!', 
      percentage: 100 
    });
    
    const renderTime = Date.now() - startTime;
    
    return {
      html,
      images,
      metadata,
      structuredData,
      renderTime,
      lazyImagesLoaded: images.reduce((sum, group) => sum + group.variants.length, 0),
    };
    
  } catch (error) {
    throw new Error(`Browser render failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract complete image catalog from HTML
 */
function extractImageCatalog(html: string, baseUrl: string): ImageGroup[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const imageMap = new Map<string, ImageMetadata[]>();
  const seenUrls = new Set<string>();
  
  // Extract from <img> tags
  doc.querySelectorAll('img').forEach((img, index) => {
    const src = img.getAttribute('src');
    const srcset = img.getAttribute('srcset');
    const sizes = img.getAttribute('sizes');
    
    if (src && !seenUrls.has(src)) {
      seenUrls.add(src);
      
      const absoluteUrl = new URL(src, baseUrl).href;
      const baseIdentity = getImageIdentity(absoluteUrl);
      
      const metadata: ImageMetadata = {
        url: absoluteUrl,
        width: img.naturalWidth || undefined,
        height: img.naturalHeight || undefined,
        isVisible: true, // Simplified - would check actual visibility in real browser
        domPath: getDOMPath(img),
        srcset: srcset || undefined,
        sizes: sizes || undefined,
        isBackgroundImage: false,
        dataAttributes: getDataAttributes(img),
        elementSize: {
          width: img.width,
          height: img.height,
        },
      };
      
      if (!imageMap.has(baseIdentity)) {
        imageMap.set(baseIdentity, []);
      }
      imageMap.get(baseIdentity)!.push(metadata);
    }
    
    // Parse srcset for variants
    if (srcset) {
      const variants = parseSrcset(srcset, baseUrl);
      variants.forEach(variant => {
        if (!seenUrls.has(variant.url)) {
          seenUrls.add(variant.url);
          const baseIdentity = getImageIdentity(variant.url);
          
          if (!imageMap.has(baseIdentity)) {
            imageMap.set(baseIdentity, []);
          }
          imageMap.get(baseIdentity)!.push({
            url: variant.url,
            width: variant.width,
            isVisible: true,
            domPath: getDOMPath(img) + '[srcset]',
            isBackgroundImage: false,
            dataAttributes: {},
          });
        }
      });
    }
  });
  
  // Extract from background images (simplified)
  doc.querySelectorAll('[style*="background-image"]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    const match = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/);
    if (match && match[1]) {
      const url = new URL(match[1], baseUrl).href;
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        const baseIdentity = getImageIdentity(url);
        
        if (!imageMap.has(baseIdentity)) {
          imageMap.set(baseIdentity, []);
        }
        imageMap.get(baseIdentity)!.push({
          url,
          isVisible: true,
          domPath: getDOMPath(el as HTMLElement),
          isBackgroundImage: true,
          dataAttributes: {},
        });
      }
    }
  });
  
  // Convert to ImageGroups
  const groups: ImageGroup[] = [];
  
  imageMap.forEach((variants, baseIdentity) => {
    // Find best resolution variant
    const bestVariant = variants.reduce((best, current) => {
      const bestRes = (best.width || 0) * (best.height || 0);
      const currentRes = (current.width || 0) * (current.height || 0);
      return currentRes > bestRes ? current : best;
    }, variants[0]);
    
    // Find thumbnail (smallest variant)
    const thumbnail = variants.reduce((smallest, current) => {
      const smallestRes = (smallest.width || 999999) * (smallest.height || 999999);
      const currentRes = (current.width || 999999) * (current.height || 999999);
      return currentRes < smallestRes ? current : smallest;
    }, variants[0]);
    
    groups.push({
      baseIdentity,
      variants,
      bestResolutionUrl: bestVariant.url,
      thumbnailUrl: thumbnail.url,
      estimatedResolution: {
        width: bestVariant.width || 800,
        height: bestVariant.height || 800,
      },
      confidence: variants.length > 1 ? 'HIGH' : 'MEDIUM',
    });
  });
  
  return groups;
}

/**
 * Get image identity (base filename without size indicators)
 */
function getImageIdentity(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove size indicators: _1200x1200, -large, @2x, etc.
    const normalized = pathname
      .replace(/_\d+x\d+/, '')
      .replace(/-\d+x\d+/, '')
      .replace(/@\dx/, '')
      .replace(/-(small|medium|large|xl|thumb|thumbnail)/, '');
    
    return normalized;
  } catch {
    return url;
  }
}

/**
 * Parse srcset attribute
 */
function parseSrcset(srcset: string, baseUrl: string): Array<{ url: string; width?: number }> {
  const variants: Array<{ url: string; width?: number }> = [];
  
  const entries = srcset.split(',').map(s => s.trim());
  
  entries.forEach(entry => {
    const parts = entry.split(/\s+/);
    if (parts.length >= 1) {
      const url = new URL(parts[0], baseUrl).href;
      const width = parts[1]?.endsWith('w') ? parseInt(parts[1]) : undefined;
      variants.push({ url, width });
    }
  });
  
  return variants;
}

/**
 * Get DOM path for an element
 */
function getDOMPath(element: Element): string {
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
    } else if (current.className) {
      const classes = Array.from(current.classList).slice(0, 2).join('.');
      if (classes) selector += `.${classes}`;
    }
    
    path.unshift(selector);
    current = current.parentElement;
  }
  
  return path.join(' > ');
}

/**
 * Get all data-* attributes
 */
function getDataAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  
  Array.from(element.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      attrs[attr.name] = attr.value;
    }
  });
  
  return attrs;
}

/**
 * Extract page metadata
 */
function extractMetadata(html: string): RenderResult['metadata'] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const metadata: RenderResult['metadata'] = {
    title: '',
  };
  
  // Title
  metadata.title = 
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent ||
    '';
  
  // Description
  metadata.description =
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    undefined;
  
  // Price
  const priceEl = doc.querySelector('[itemtype*="Product"] [itemprop="price"]');
  if (priceEl) {
    metadata.price = priceEl.getAttribute('content') || priceEl.textContent || undefined;
  }
  
  // Currency
  const currencyEl = doc.querySelector('[itemtype*="Product"] [itemprop="priceCurrency"]');
  if (currencyEl) {
    metadata.currency = currencyEl.getAttribute('content') || currencyEl.textContent || undefined;
  }
  
  // Brand
  const brandEl = doc.querySelector('[itemtype*="Product"] [itemprop="brand"]');
  if (brandEl) {
    metadata.brand = brandEl.getAttribute('content') || brandEl.textContent?.trim() || undefined;
  }
  
  // SKU
  const skuEl = doc.querySelector('[itemtype*="Product"] [itemprop="sku"]');
  if (skuEl) {
    metadata.sku = skuEl.getAttribute('content') || skuEl.textContent?.trim() || undefined;
  }
  
  // Availability
  const availEl = doc.querySelector('[itemtype*="Product"] [itemprop="availability"]');
  if (availEl) {
    const href = availEl.getAttribute('href') || '';
    metadata.availability = href.includes('InStock') ? 'in-stock' : 
                           href.includes('OutOfStock') ? 'out-of-stock' : undefined;
  }
  
  return metadata;
}

/**
 * Extract JSON-LD structured data
 */
function extractStructuredData(html: string): any {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  
  for (const script of Array.from(scripts)) {
    try {
      const data = JSON.parse(script.textContent || '{}');
      
      // Find Product schema
      if (data['@type'] === 'Product' || 
          (Array.isArray(data['@graph']) && data['@graph'].some((item: any) => item['@type'] === 'Product'))) {
        return data;
      }
    } catch (error) {
      continue;
    }
  }
  
  return null;
}

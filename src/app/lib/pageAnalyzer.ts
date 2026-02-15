/**
 * Page Analyzer - Client-side DOM analysis for product image detection
 * Analyzes fully-rendered pages to identify main product images
 */

export interface DetectedImage {
  url: string;
  alt?: string;
  width: number;
  height: number;
  displayWidth: number;
  displayHeight: number;
  naturalWidth: number;
  naturalHeight: number;
  score: number;
  type: 'main-product' | 'gallery' | 'thumbnail' | 'ui-element' | 'unknown';
  reasoning: string[];
  position: {
    x: number;
    y: number;
    area: number;
  };
}

export interface PageAnalysisResult {
  images: DetectedImage[];
  mainProductImages: DetectedImage[];
  html: string;
  metadata: {
    title: string;
    description?: string;
    url: string;
  };
  stats: {
    totalImages: number;
    productImages: number;
    analysisTime: number;
  };
}

/**
 * Analyze a loaded iframe document for product images
 */
export async function analyzePageForProducts(
  iframeDocument: Document,
  sourceUrl: string
): Promise<PageAnalysisResult> {
  const startTime = Date.now();
  
  // Extract all images from DOM
  const allImages = Array.from(iframeDocument.querySelectorAll('img'));
  
  // Analyze each image
  const detectedImages: DetectedImage[] = [];
  
  for (const img of allImages) {
    const detected = await analyzeImage(img, iframeDocument);
    if (detected) {
      detectedImages.push(detected);
    }
  }
  
  // Sort by score (highest first)
  detectedImages.sort((a, b) => b.score - a.score);
  
  // Identify main product images
  const mainProductImages = identifyMainProductImages(detectedImages);
  
  // Extract final HTML
  const html = extractFinalHTML(iframeDocument);
  
  // Extract metadata
  const metadata = {
    title: iframeDocument.title || '',
    description: iframeDocument.querySelector('meta[name="description"]')?.getAttribute('content') || undefined,
    url: sourceUrl,
  };
  
  const analysisTime = Date.now() - startTime;
  
  return {
    images: detectedImages,
    mainProductImages,
    html,
    metadata,
    stats: {
      totalImages: allImages.length,
      productImages: mainProductImages.length,
      analysisTime,
    },
  };
}

/**
 * Analyze a single image element
 */
async function analyzeImage(
  img: HTMLImageElement,
  doc: Document
): Promise<DetectedImage | null> {
  try {
    // Wait for image to load if not already loaded
    if (!img.complete) {
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        // Timeout after 2 seconds
        setTimeout(resolve, 2000);
      });
    }
    
    // Skip if no valid source
    const url = img.currentSrc || img.src;
    if (!url || url.startsWith('data:') || url.includes('placeholder')) {
      return null;
    }
    
    // Get dimensions
    const rect = img.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(img);
    
    const naturalWidth = img.naturalWidth || 0;
    const naturalHeight = img.naturalHeight || 0;
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    
    // Skip tiny images (likely icons)
    if (naturalWidth < 100 || naturalHeight < 100) {
      return null;
    }
    
    // Skip hidden images
    if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
      return null;
    }
    
    // Calculate position and area
    const position = {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      area: rect.width * rect.height,
    };
    
    // Analyze image context
    const analysis = analyzeImageContext(img, doc);
    
    return {
      url,
      alt: img.alt,
      width: rect.width,
      height: rect.height,
      displayWidth,
      displayHeight,
      naturalWidth,
      naturalHeight,
      score: analysis.score,
      type: analysis.type,
      reasoning: analysis.reasoning,
      position,
    };
  } catch (error) {
    console.warn('Failed to analyze image:', error);
    return null;
  }
}

/**
 * Analyze image context to determine if it's a product image
 */
function analyzeImageContext(img: HTMLImageElement, doc: Document): {
  score: number;
  type: DetectedImage['type'];
  reasoning: string[];
} {
  let score = 0;
  const reasoning: string[] = [];
  let type: DetectedImage['type'] = 'unknown';
  
  // Get all relevant attributes and context
  const src = (img.currentSrc || img.src).toLowerCase();
  const alt = (img.alt || '').toLowerCase();
  const className = (img.className || '').toLowerCase();
  const parentClassName = (img.parentElement?.className || '').toLowerCase();
  const grandparentClassName = (img.parentElement?.parentElement?.className || '').toLowerCase();
  
  // Combined context text
  const context = `${src} ${alt} ${className} ${parentClassName} ${grandparentClassName}`;
  
  // === HIGH CONFIDENCE INDICATORS (Main Product) ===
  
  // JSON-LD or schema markup
  const schemaParent = img.closest('[itemtype*="Product"]');
  if (schemaParent) {
    score += 50;
    reasoning.push('Inside Product schema markup (+50)');
    type = 'main-product';
  }
  
  // Gallery/slider containers
  const galleryKeywords = ['product-gallery', 'image-gallery', 'product-image', 'main-image', 'primary-image'];
  if (galleryKeywords.some(kw => context.includes(kw))) {
    score += 40;
    reasoning.push('In product gallery container (+40)');
    if (type === 'unknown') type = 'gallery';
  }
  
  // Large high-quality images
  const naturalWidth = img.naturalWidth || 0;
  const naturalHeight = img.naturalHeight || 0;
  if (naturalWidth >= 800 && naturalHeight >= 800) {
    score += 30;
    reasoning.push(`High resolution: ${naturalWidth}x${naturalHeight} (+30)`);
    if (type === 'unknown') type = 'main-product';
  } else if (naturalWidth >= 400 && naturalHeight >= 400) {
    score += 15;
    reasoning.push(`Medium resolution: ${naturalWidth}x${naturalHeight} (+15)`);
    if (type === 'unknown') type = 'gallery';
  }
  
  // Zoom/detail functionality
  if (context.includes('zoom') || context.includes('enlarge') || context.includes('detail')) {
    score += 25;
    reasoning.push('Has zoom/enlarge functionality (+25)');
    type = 'main-product';
  }
  
  // Position (images near top are more likely main products)
  const rect = img.getBoundingClientRect();
  if (rect.top < 800) {
    score += 10;
    reasoning.push('Above the fold (+10)');
  }
  
  // Large display size
  const displayArea = rect.width * rect.height;
  if (displayArea > 200000) { // ~500x400
    score += 20;
    reasoning.push(`Large display area: ${Math.round(displayArea)} px² (+20)`);
  } else if (displayArea > 100000) { // ~350x300
    score += 10;
    reasoning.push(`Medium display area: ${Math.round(displayArea)} px² (+10)`);
  }
  
  // Product-specific alt text
  const productAltKeywords = ['product', 'item', 'main', 'primary', 'featured'];
  if (productAltKeywords.some(kw => alt.includes(kw))) {
    score += 15;
    reasoning.push('Product-related alt text (+15)');
  }
  
  // === NEGATIVE INDICATORS ===
  
  // Thumbnails
  const thumbnailKeywords = ['thumb', 'thumbnail', 'small', 'preview', 'mini'];
  if (thumbnailKeywords.some(kw => context.includes(kw))) {
    score -= 30;
    reasoning.push('Thumbnail indicator (-30)');
    type = 'thumbnail';
  }
  
  // UI elements
  const uiKeywords = ['logo', 'icon', 'badge', 'button', 'nav', 'menu', 'header', 'footer', 'banner'];
  if (uiKeywords.some(kw => context.includes(kw))) {
    score -= 50;
    reasoning.push('UI element indicator (-50)');
    type = 'ui-element';
  }
  
  // Related/recommended products
  const relatedKeywords = ['related', 'recommended', 'similar', 'also-bought', 'cross-sell', 'upsell'];
  if (relatedKeywords.some(kw => context.includes(kw))) {
    score -= 35;
    reasoning.push('Related product section (-35)');
    type = 'thumbnail';
  }
  
  // Ads/promotional
  const adKeywords = ['ad', 'advertisement', 'promo', 'banner'];
  if (adKeywords.some(kw => context.includes(kw))) {
    score -= 60;
    reasoning.push('Advertisement indicator (-60)');
    type = 'ui-element';
  }
  
  // Very small images
  if (naturalWidth < 200 || naturalHeight < 200) {
    score -= 20;
    reasoning.push(`Small image: ${naturalWidth}x${naturalHeight} (-20)`);
    if (type === 'unknown') type = 'thumbnail';
  }
  
  // === FINAL SCORING ===
  
  // Ensure score is not negative
  score = Math.max(0, score);
  
  // Finalize type based on score
  if (score >= 60 && type === 'unknown') type = 'main-product';
  else if (score >= 30 && type === 'unknown') type = 'gallery';
  else if (score < 0 && type === 'unknown') type = 'ui-element';
  
  return { score, type, reasoning };
}

/**
 * Identify main product images from all detected images
 */
function identifyMainProductImages(images: DetectedImage[]): DetectedImage[] {
  // Filter for high-scoring images
  const productCandidates = images.filter(img => 
    img.score >= 30 && 
    (img.type === 'main-product' || img.type === 'gallery')
  );
  
  // Group by similar URLs (detect duplicates with different sizes)
  const grouped = groupSimilarImages(productCandidates);
  
  // Select highest resolution from each group
  const mainImages: DetectedImage[] = [];
  for (const group of grouped) {
    // Sort by natural dimensions (prefer highest resolution)
    group.sort((a, b) => {
      const aPixels = a.naturalWidth * a.naturalHeight;
      const bPixels = b.naturalWidth * b.naturalHeight;
      return bPixels - aPixels;
    });
    
    // Take the highest resolution
    const best = group[0];
    best.reasoning.push(`Selected as highest resolution from ${group.length} variants`);
    mainImages.push(best);
  }
  
  // Sort by score
  mainImages.sort((a, b) => b.score - a.score);
  
  return mainImages;
}

/**
 * Group similar images (same product, different sizes/URLs)
 */
function groupSimilarImages(images: DetectedImage[]): DetectedImage[][] {
  const groups: DetectedImage[][] = [];
  const processed = new Set<number>();
  
  for (let i = 0; i < images.length; i++) {
    if (processed.has(i)) continue;
    
    const group: DetectedImage[] = [images[i]];
    processed.add(i);
    
    for (let j = i + 1; j < images.length; j++) {
      if (processed.has(j)) continue;
      
      if (areImagesSimilar(images[i], images[j])) {
        group.push(images[j]);
        processed.add(j);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

/**
 * Check if two images are similar (same product, different sizes)
 */
function areImagesSimilar(a: DetectedImage, b: DetectedImage): boolean {
  // Extract base URL (remove size suffixes)
  const urlA = normalizeImageUrl(a.url);
  const urlB = normalizeImageUrl(b.url);
  
  // Same base URL
  if (urlA === urlB) return true;
  
  // Similar alt text
  if (a.alt && b.alt) {
    const altSimilarity = calculateSimilarity(a.alt, b.alt);
    if (altSimilarity > 0.8) return true;
  }
  
  // Similar position and aspect ratio
  const aspectA = a.naturalWidth / a.naturalHeight;
  const aspectB = b.naturalWidth / b.naturalHeight;
  const aspectDiff = Math.abs(aspectA - aspectB);
  
  if (aspectDiff < 0.1) {
    // Check if positions are close
    const posXDiff = Math.abs(a.position.x - b.position.x);
    const posYDiff = Math.abs(a.position.y - b.position.y);
    
    if (posXDiff < 100 && posYDiff < 100) {
      return true;
    }
  }
  
  return false;
}

/**
 * Normalize image URL (remove size suffixes)
 */
function normalizeImageUrl(url: string): string {
  // Remove common size patterns
  let normalized = url.replace(/[-_](thumb|small|medium|large|xl|xxl|\d+x\d+)/gi, '');
  
  // Remove query parameters related to size
  normalized = normalized.replace(/[?&](w|h|width|height|size|scale)=\d+/gi, '');
  
  return normalized;
}

/**
 * Calculate string similarity (simple Jaccard)
 */
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  
  return intersection.size / union.size;
}

/**
 * Extract final HTML from iframe document
 */
export function extractFinalHTML(doc: Document): string {
  try {
    // Clone the document to avoid modifying the original
    const clone = doc.documentElement.cloneNode(true) as HTMLElement;
    
    // Remove scripts (optional - keep if you want to see what scripts were loaded)
    // const scripts = clone.querySelectorAll('script');
    // scripts.forEach(s => s.remove());
    
    // Get the complete HTML
    const html = clone.outerHTML;
    
    return html;
  } catch (error) {
    console.error('Failed to extract HTML:', error);
    return '';
  }
}

/**
 * Format analysis result as markdown for display
 */
export function formatAnalysisResultAsMarkdown(result: PageAnalysisResult): string {
  const { images, mainProductImages, metadata, stats } = result;
  
  let md = `# Page Analysis Results\n\n`;
  md += `**Page:** ${metadata.title}\n`;
  md += `**URL:** ${metadata.url}\n\n`;
  
  md += `## Statistics\n`;
  md += `- Total images analyzed: ${stats.totalImages}\n`;
  md += `- Product images detected: ${stats.productImages}\n`;
  md += `- Analysis time: ${stats.analysisTime}ms\n\n`;
  
  md += `## Main Product Images (${mainProductImages.length})\n\n`;
  
  if (mainProductImages.length === 0) {
    md += `*No main product images detected*\n\n`;
  } else {
    mainProductImages.forEach((img, idx) => {
      md += `### Image ${idx + 1}\n`;
      md += `- **URL:** ${img.url}\n`;
      md += `- **Resolution:** ${img.naturalWidth} × ${img.naturalHeight} (${(img.naturalWidth * img.naturalHeight / 1000000).toFixed(2)} MP)\n`;
      md += `- **Display Size:** ${Math.round(img.displayWidth)} × ${Math.round(img.displayHeight)}\n`;
      md += `- **Score:** ${img.score}\n`;
      md += `- **Type:** ${img.type}\n`;
      if (img.alt) md += `- **Alt:** ${img.alt}\n`;
      md += `- **Reasoning:**\n`;
      img.reasoning.forEach(r => md += `  - ${r}\n`);
      md += `\n`;
    });
  }
  
  md += `## All Detected Images (Top 10)\n\n`;
  images.slice(0, 10).forEach((img, idx) => {
    md += `${idx + 1}. **${img.url.split('/').pop()}** - ${img.naturalWidth}×${img.naturalHeight}, Score: ${img.score}, Type: ${img.type}\n`;
  });
  
  return md;
}

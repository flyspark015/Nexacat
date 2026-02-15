/**
 * Product Processing Orchestrator
 * 
 * Coordinates the complete end-to-end product processing workflow:
 * 1. Fetch & render page
 * 2. Extract images
 * 3. Rewrite branding
 * 4. Convert prices
 * 5. Generate clean HTML
 */

import { renderProductPage, RenderResult, ImageGroup } from './headlessBrowser';
import { rewriteProductForFlySpark, RewrittenProduct, ProductData } from './brandRewriter';
import { autoConvertPrice, PriceConversion } from './currencyConverter';
import { generateModernHTML, cleanProductHTML } from '../components/admin/HTMLDescriptionPreview';

export interface ProcessingProgress {
  phase: 'fetch' | 'extract' | 'rewrite' | 'convert' | 'finalize';
  step: string;
  percentage: number;
  details?: string;
}

export interface ProcessedProduct {
  // Core product data
  name: string;
  brand: string;
  sku: string;
  description: string;
  shortDescription: string;
  specifications: Record<string, string>;
  
  // Images
  selectedImage: ImageGroup;
  allImages: ImageGroup[];
  
  // Pricing
  price?: {
    original?: {
      amount: number;
      currency: string;
    };
    inr: number;
    conversion?: PriceConversion;
  };
  
  // Variants
  variants?: Array<{
    name: string;
    sku: string;
    attributes: Record<string, string>;
  }>;
  
  // Metadata
  sourceUrl: string;
  extractedHtml: string;
  rewriteLog: string[];
  originalBrand?: string;
  originalSku?: string;
  
  // Processing metadata
  processingTime: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  warnings: string[];
}

/**
 * Main orchestrator function
 */
export async function processProductFromURL(
  url: string,
  selectedImageIndex: number,
  options: {
    onProgress?: (progress: ProcessingProgress) => void;
    customInstructions?: string[];
    priceMarkup?: number;
  } = {}
): Promise<ProcessedProduct> {
  const startTime = Date.now();
  const warnings: string[] = [];
  
  // Phase 1: Fetch & Render
  options.onProgress?.({
    phase: 'fetch',
    step: 'Launching headless browser and rendering page...',
    percentage: 10,
  });
  
  let renderResult: RenderResult;
  try {
    renderResult = await renderProductPage(url, (progress) => {
      options.onProgress?.({
        phase: 'fetch',
        step: progress.message,
        percentage: 10 + (progress.percentage * 0.3), // 10-40%
      });
    });
  } catch (error) {
    throw new Error(`Failed to render page: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  if (renderResult.images.length === 0) {
    warnings.push('No images detected on page. You may need to upload images manually.');
  }
  
  // Phase 2: Image Selection (handled by UI, we just validate)
  options.onProgress?.({
    phase: 'extract',
    step: 'Processing selected image...',
    percentage: 45,
  });
  
  if (selectedImageIndex < 0 || selectedImageIndex >= renderResult.images.length) {
    throw new Error('Invalid image selection');
  }
  
  const selectedImage = renderResult.images[selectedImageIndex];
  
  // Phase 3: Extract product data and rewrite branding
  options.onProgress?.({
    phase: 'rewrite',
    step: 'Rewriting branding to FlySpark standards...',
    percentage: 55,
  });
  
  const productData: ProductData = {
    title: renderResult.metadata.title,
    description: cleanProductHTML(renderResult.html),
    shortDescription: renderResult.metadata.description || '',
    brand: renderResult.metadata.brand,
    sku: renderResult.metadata.sku,
    specifications: extractSpecifications(renderResult),
  };
  
  const rewritten = rewriteProductForFlySpark(productData);
  
  // Phase 4: Price conversion
  options.onProgress?.({
    phase: 'convert',
    step: 'Converting prices to INR...',
    percentage: 70,
  });
  
  let priceData: ProcessedProduct['price'] | undefined;
  
  if (renderResult.metadata.price) {
    const converted = await autoConvertPrice(
      renderResult.metadata.price,
      renderResult.metadata.currency
    );
    
    if (converted) {
      priceData = {
        original: {
          amount: converted.originalPrice,
          currency: converted.originalCurrency,
        },
        inr: converted.inrPrice,
        conversion: converted.conversion,
      };
    }
  }
  
  // Phase 5: Generate clean HTML description
  options.onProgress?.({
    phase: 'finalize',
    step: 'Generating modern HTML description...',
    percentage: 85,
  });
  
  const features = extractFeatures(renderResult.html);
  
  const modernHTML = generateModernHTML({
    title: rewritten.title,
    description: rewritten.description,
    features,
    specifications: rewritten.specifications,
    images: [selectedImage.bestResolutionUrl],
  });
  
  // Calculate confidence
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  
  if (selectedImage.confidence === 'HIGH' && renderResult.structuredData && priceData) {
    confidence = 'HIGH';
  } else if (renderResult.images.length === 0 || !renderResult.metadata.title) {
    confidence = 'LOW';
  }
  
  // Finalize
  options.onProgress?.({
    phase: 'finalize',
    step: 'Product processing complete!',
    percentage: 100,
  });
  
  const processingTime = Date.now() - startTime;
  
  return {
    name: rewritten.title,
    brand: 'FlySpark',
    sku: rewritten.sku || 'FS-PENDING',
    description: modernHTML,
    shortDescription: rewritten.shortDescription,
    specifications: rewritten.specifications,
    selectedImage,
    allImages: renderResult.images,
    price: priceData,
    variants: rewritten.variants,
    sourceUrl: url,
    extractedHtml: renderResult.html,
    rewriteLog: rewritten.rewriteLog,
    originalBrand: rewritten.originalBrand,
    originalSku: rewritten.originalSku,
    processingTime,
    confidence,
    warnings,
  };
}

/**
 * Extract specifications from render result
 */
function extractSpecifications(result: RenderResult): Record<string, string> {
  const specs: Record<string, string> = {};
  
  // From metadata
  if (result.metadata.brand) specs['Brand'] = result.metadata.brand;
  if (result.metadata.sku) specs['SKU'] = result.metadata.sku;
  
  // From structured data
  if (result.structuredData) {
    const data = result.structuredData;
    
    // Map common schema.org properties
    if (data.color) specs['Color'] = data.color;
    if (data.material) specs['Material'] = data.material;
    if (data.weight) specs['Weight'] = data.weight;
    if (data.width) specs['Width'] = data.width;
    if (data.height) specs['Height'] = data.height;
    if (data.depth) specs['Depth'] = data.depth;
  }
  
  // Parse from HTML (simplified - would use more sophisticated extraction in production)
  const parser = new DOMParser();
  const doc = parser.parseFromString(result.html, 'text/html');
  
  // Look for spec tables
  doc.querySelectorAll('table').forEach(table => {
    table.querySelectorAll('tr').forEach(row => {
      const cells = row.querySelectorAll('td, th');
      if (cells.length === 2) {
        const key = cells[0].textContent?.trim();
        const value = cells[1].textContent?.trim();
        if (key && value && key.length < 50) {
          specs[key] = value;
        }
      }
    });
  });
  
  return specs;
}

/**
 * Extract features from HTML
 */
function extractFeatures(html: string): string[] {
  const features: string[] = [];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Look for feature lists
  const featureContainers = [
    ...Array.from(doc.querySelectorAll('[class*="feature"]')),
    ...Array.from(doc.querySelectorAll('[class*="highlight"]')),
    ...Array.from(doc.querySelectorAll('[id*="feature"]')),
  ];
  
  featureContainers.forEach(container => {
    container.querySelectorAll('li').forEach(li => {
      const text = li.textContent?.trim();
      if (text && text.length > 10 && text.length < 200) {
        features.push(text);
      }
    });
  });
  
  // Deduplicate
  return Array.from(new Set(features)).slice(0, 10); // Max 10 features
}

/**
 * Validate processed product before submission
 */
export function validateProcessedProduct(product: ProcessedProduct): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [...product.warnings];
  
  // Required fields
  if (!product.name || product.name.trim().length < 3) {
    errors.push('Product name is required and must be at least 3 characters');
  }
  
  if (!product.sku) {
    errors.push('SKU is required');
  }
  
  if (!product.description || product.description.trim().length < 50) {
    errors.push('Description is required and must be at least 50 characters');
  }
  
  if (!product.selectedImage) {
    errors.push('At least one product image must be selected');
  }
  
  // Warnings
  if (!product.price) {
    warnings.push('No price detected - you will need to set pricing manually');
  }
  
  if (product.confidence === 'LOW') {
    warnings.push('Low confidence extraction - please review all fields carefully');
  }
  
  if (Object.keys(product.specifications).length < 3) {
    warnings.push('Few specifications detected - consider adding more product details');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

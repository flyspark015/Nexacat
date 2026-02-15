/**
 * Brand Rewriting Agent for FlySpark
 * 
 * Automatically replaces brand names and rewrites model numbers
 * to match FlySpark's catalog standards.
 */

export interface ProductData {
  title: string;
  description: string;
  shortDescription: string;
  brand?: string;
  sku?: string;
  modelNumber?: string;
  specifications: Record<string, string>;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  name: string;
  sku?: string;
  attributes: Record<string, string>;
}

export interface RewrittenProduct extends ProductData {
  originalBrand?: string;
  originalSku?: string;
  rewriteLog: string[];
}

/**
 * Main rewriting function
 */
export function rewriteProductForFlySpark(product: ProductData): RewrittenProduct {
  const rewriteLog: string[] = [];
  const originalBrand = product.brand;
  const originalSku = product.sku;

  // Step 1: Detect original brand mentions
  const detectedBrands = detectBrandMentions(product);
  if (detectedBrands.length > 0) {
    rewriteLog.push(`Detected brands: ${detectedBrands.join(', ')}`);
  }

  // Step 2: Replace brand with FlySpark
  let title = product.title;
  let description = product.description;
  let shortDescription = product.shortDescription;
  const specifications = { ...product.specifications };

  detectedBrands.forEach(brand => {
    const regex = new RegExp(`\\b${escapeRegex(brand)}\\b`, 'gi');
    
    title = title.replace(regex, 'FlySpark');
    description = description.replace(regex, 'FlySpark');
    shortDescription = shortDescription.replace(regex, 'FlySpark');
    
    // Update specs
    Object.keys(specifications).forEach(key => {
      if (key.toLowerCase() === 'brand' || key.toLowerCase() === 'manufacturer') {
        specifications[key] = 'FlySpark';
      } else {
        specifications[key] = specifications[key].replace(regex, 'FlySpark');
      }
    });
    
    rewriteLog.push(`Replaced "${brand}" with "FlySpark" throughout content`);
  });

  // Step 3: Rewrite model number to FlySpark format
  const newSku = rewriteModelNumber(product.sku || product.modelNumber || '', product);
  if (newSku !== product.sku) {
    rewriteLog.push(`Rewrote SKU: ${product.sku || 'N/A'} → ${newSku}`);
  }

  // Step 4: Update specifications
  if (!specifications['Brand']) {
    specifications['Brand'] = 'FlySpark';
    rewriteLog.push('Added FlySpark brand to specifications');
  }

  if (newSku && !specifications['Model']) {
    specifications['Model'] = newSku;
    rewriteLog.push(`Added model number: ${newSku}`);
  }

  // Step 5: Rewrite variants if present
  const rewrittenVariants = product.variants?.map(variant => ({
    ...variant,
    sku: rewriteModelNumber(variant.sku || '', product, variant.name),
  }));

  if (rewrittenVariants && rewrittenVariants.length > 0) {
    rewriteLog.push(`Rewrote ${rewrittenVariants.length} variant SKUs`);
  }

  return {
    title,
    description,
    shortDescription,
    brand: 'FlySpark',
    sku: newSku,
    modelNumber: newSku,
    specifications,
    variants: rewrittenVariants,
    originalBrand,
    originalSku,
    rewriteLog,
  };
}

/**
 * Detect brand mentions in product data
 */
function detectBrandMentions(product: ProductData): string[] {
  const brands = new Set<string>();
  
  // From explicit brand field
  if (product.brand) {
    brands.add(product.brand);
  }
  
  // From specifications
  Object.entries(product.specifications).forEach(([key, value]) => {
    if (key.toLowerCase() === 'brand' || key.toLowerCase() === 'manufacturer') {
      brands.add(value);
    }
  });
  
  // Common brand patterns in title (simplified list)
  const commonBrands = [
    'Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus',
    'Acer', 'Microsoft', 'Google', 'Amazon', 'Xiaomi', 'Huawei', 'OnePlus',
    'Oppo', 'Vivo', 'Realme', 'Motorola', 'Nokia', 'Panasonic', 'Philips',
    'Bosch', 'Siemens', 'Canon', 'Nikon', 'Fujifilm', 'GoPro', 'DJI',
    'Intel', 'AMD', 'Nvidia', 'Corsair', 'Logitech', 'Razer', 'SteelSeries',
  ];
  
  const text = `${product.title} ${product.description}`.toLowerCase();
  
  commonBrands.forEach(brand => {
    if (text.includes(brand.toLowerCase())) {
      brands.add(brand);
    }
  });
  
  return Array.from(brands);
}

/**
 * Rewrite model number to FlySpark format
 * 
 * FlySpark SKU Format: FS-[CATEGORY]-[SERIES]-[VERSION]
 * Examples:
 * - FS-LED-PRO-100W
 * - FS-ELEC-SMART-V2
 * - FS-TOOL-POWER-X500
 */
function rewriteModelNumber(
  originalSku: string, 
  product: ProductData,
  variantName?: string
): string {
  // If no original SKU, generate from product data
  if (!originalSku || originalSku.trim() === '') {
    return generateFlySparISku(product, variantName);
  }
  
  // Clean original SKU
  const cleaned = originalSku
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .trim();
  
  // If already in FlySpark format, return as-is
  if (cleaned.startsWith('FS-')) {
    return cleaned;
  }
  
  // Extract meaningful parts
  const category = inferCategory(product);
  const series = inferSeries(product, cleaned);
  const version = extractVersion(cleaned) || inferVersion(product);
  
  // Build FlySpark SKU
  const parts = ['FS', category, series];
  if (version) parts.push(version);
  
  return parts.join('-');
}

/**
 * Generate FlySpark SKU from scratch
 */
function generateFlySparISku(product: ProductData, variantName?: string): string {
  const category = inferCategory(product);
  const series = inferSeries(product, '');
  const version = inferVersion(product) || 'V1';
  
  const parts = ['FS', category, series, version];
  
  if (variantName) {
    const variantCode = variantName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);
    parts.push(variantCode);
  }
  
  return parts.join('-');
}

/**
 * Infer product category
 */
function inferCategory(product: ProductData): string {
  const text = `${product.title} ${product.description}`.toLowerCase();
  
  // Category mapping
  const categories: Record<string, string[]> = {
    'LED': ['led', 'light', 'lamp', 'bulb', 'lighting'],
    'ELEC': ['electronic', 'circuit', 'electrical', 'power supply', 'adapter'],
    'TOOL': ['tool', 'equipment', 'machine', 'drill', 'saw'],
    'COMP': ['computer', 'laptop', 'desktop', 'pc', 'processor'],
    'MOBL': ['mobile', 'phone', 'smartphone', 'tablet'],
    'GADG': ['gadget', 'device', 'smart', 'wearable'],
    'AUDI': ['audio', 'speaker', 'headphone', 'earphone', 'sound'],
    'VIDE': ['video', 'camera', 'webcam', 'monitor', 'display'],
    'NETW': ['network', 'router', 'modem', 'wifi', 'ethernet'],
    'STOR': ['storage', 'drive', 'ssd', 'hdd', 'memory'],
  };
  
  for (const [code, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return code;
    }
  }
  
  return 'PROD'; // Generic product
}

/**
 * Infer product series
 */
function inferSeries(product: ProductData, originalSku: string): string {
  const text = `${product.title} ${originalSku}`.toLowerCase();
  
  // Series patterns
  if (text.includes('pro')) return 'PRO';
  if (text.includes('plus')) return 'PLUS';
  if (text.includes('max')) return 'MAX';
  if (text.includes('ultra')) return 'ULTRA';
  if (text.includes('mini')) return 'MINI';
  if (text.includes('lite')) return 'LITE';
  if (text.includes('smart')) return 'SMART';
  if (text.includes('premium')) return 'PREM';
  if (text.includes('standard')) return 'STD';
  if (text.includes('basic')) return 'BASE';
  
  // Extract first meaningful word from title
  const words = product.title
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length >= 3 && w.length <= 6)
    .filter(w => !['THE', 'AND', 'FOR', 'WITH'].includes(w));
  
  if (words.length > 0) {
    return words[0].slice(0, 5);
  }
  
  return 'GEN'; // Generic
}

/**
 * Extract version from original SKU
 */
function extractVersion(sku: string): string | null {
  // Pattern: V1, V2, 2.0, etc.
  const versionMatch = sku.match(/V?\d+(\.\d+)?/);
  if (versionMatch) {
    const version = versionMatch[0];
    return version.startsWith('V') ? version : `V${version}`;
  }
  
  return null;
}

/**
 * Infer version from product data
 */
function inferVersion(product: ProductData): string {
  const text = `${product.title} ${product.description}`.toLowerCase();
  
  // Look for generation indicators
  if (text.includes('gen 3') || text.includes('3rd gen')) return 'V3';
  if (text.includes('gen 2') || text.includes('2nd gen')) return 'V2';
  if (text.includes('gen 1') || text.includes('1st gen')) return 'V1';
  
  // Look for year indicators (2024 → V24, 2023 → V23)
  const yearMatch = text.match(/20(\d{2})/);
  if (yearMatch) {
    return `V${yearMatch[1]}`;
  }
  
  return 'V1'; // Default to version 1
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate rewrite summary for logging
 */
export function generateRewriteSummary(rewritten: RewrittenProduct): string {
  const lines: string[] = [
    '=== FlySpark Brand Rewrite Summary ===',
    '',
  ];
  
  if (rewritten.originalBrand) {
    lines.push(`Original Brand: ${rewritten.originalBrand}`);
    lines.push(`New Brand: FlySpark`);
    lines.push('');
  }
  
  if (rewritten.originalSku && rewritten.originalSku !== rewritten.sku) {
    lines.push(`Original SKU: ${rewritten.originalSku}`);
    lines.push(`New SKU: ${rewritten.sku}`);
    lines.push('');
  }
  
  lines.push('Changes Made:');
  rewritten.rewriteLog.forEach((log, i) => {
    lines.push(`  ${i + 1}. ${log}`);
  });
  
  return lines.join('\n');
}

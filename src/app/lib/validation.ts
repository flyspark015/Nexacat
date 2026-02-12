/**
 * Validation utilities for FlySpark
 * All validation functions with comprehensive error messages
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

/**
 * Validate password
 */
export function validatePassword(password: string, minLength: number = 6): ValidationResult {
  if (!password || password.trim() === '') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `Password must be at least ${minLength} characters` };
  }

  return { valid: true };
}

/**
 * Validate phone number (Indian format)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove spaces, hyphens, and parentheses
  const cleanPhone = phone.replace(/[\s\-()]/g, '');

  // Check for valid Indian mobile number (10 digits) or with country code
  const indianMobileRegex = /^(\+91)?[6-9]\d{9}$/;
  
  if (!indianMobileRegex.test(cleanPhone)) {
    return { valid: false, error: 'Please enter a valid Indian mobile number' };
  }

  return { valid: true };
}

/**
 * Validate required text field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  return { valid: true };
}

/**
 * Validate product name
 */
export function validateProductName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Product name is required' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Product name must be at least 3 characters' };
  }

  if (name.length > 200) {
    return { valid: false, error: 'Product name must not exceed 200 characters' };
  }

  return { valid: true };
}

/**
 * Validate product SKU
 */
export function validateSKU(sku: string, required: boolean = false): ValidationResult {
  if (!required && (!sku || sku.trim() === '')) {
    return { valid: true };
  }

  if (required && (!sku || sku.trim() === '')) {
    return { valid: false, error: 'SKU is required' };
  }

  // SKU should be alphanumeric with hyphens and underscores allowed
  const skuRegex = /^[A-Za-z0-9\-_]+$/;
  if (!skuRegex.test(sku)) {
    return { valid: false, error: 'SKU can only contain letters, numbers, hyphens, and underscores' };
  }

  if (sku.length > 50) {
    return { valid: false, error: 'SKU must not exceed 50 characters' };
  }

  return { valid: true };
}

/**
 * Validate price
 */
export function validatePrice(price: number | string, required: boolean = true): ValidationResult {
  if (!required && (price === '' || price === null || price === undefined)) {
    return { valid: true };
  }

  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice)) {
    return { valid: false, error: 'Please enter a valid price' };
  }

  if (numPrice < 0) {
    return { valid: false, error: 'Price cannot be negative' };
  }

  if (numPrice > 10000000) {
    return { valid: false, error: 'Price is too large' };
  }

  return { valid: true };
}

/**
 * Validate YouTube URL
 */
export function validateYouTubeUrl(url: string, required: boolean = false): ValidationResult {
  if (!required && (!url || url.trim() === '')) {
    return { valid: true };
  }

  if (required && (!url || url.trim() === '')) {
    return { valid: false, error: 'YouTube URL is required' };
  }

  // YouTube URL patterns
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+(&.*)?$/;
  
  if (!youtubeRegex.test(url)) {
    return { valid: false, error: 'Please enter a valid YouTube URL' };
  }

  return { valid: true };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): ValidationResult {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must not exceed 5MB' };
  }

  return { valid: true };
}

/**
 * Validate GSTIN (Indian GST Number)
 */
export function validateGSTIN(gstin: string, required: boolean = false): ValidationResult {
  if (!required && (!gstin || gstin.trim() === '')) {
    return { valid: true };
  }

  if (required && (!gstin || gstin.trim() === '')) {
    return { valid: false, error: 'GSTIN is required' };
  }

  // GSTIN format: 15 characters (2 digits state code + 10 alphanumeric PAN + 1 letter + 1 digit + 1 letter)
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(gstin.toUpperCase())) {
    return { valid: false, error: 'Please enter a valid GSTIN (15 characters)' };
  }

  return { valid: true };
}

/**
 * Validate variation name
 */
export function validateVariationName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Variation name is required' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Variation name must be at least 2 characters' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Variation name must not exceed 100 characters' };
  }

  return { valid: true };
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Category name is required' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Category name must be at least 2 characters' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Category name must not exceed 100 characters' };
  }

  return { valid: true };
}

/**
 * Validate WhatsApp number
 */
export function validateWhatsAppNumber(number: string): ValidationResult {
  if (!number || number.trim() === '') {
    return { valid: false, error: 'WhatsApp number is required' };
  }

  // Remove spaces, hyphens, and parentheses
  const cleanNumber = number.replace(/[\s\-()]/g, '');

  // Must start with + and country code
  const whatsappRegex = /^\+[1-9]\d{1,14}$/;
  
  if (!whatsappRegex.test(cleanNumber)) {
    return { valid: false, error: 'Please enter a valid WhatsApp number with country code (e.g., +919876543210)' };
  }

  return { valid: true };
}

/**
 * Validate company name
 */
export function validateCompanyName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Company name is required' };
  }

  if (name.length < 2) {
    return { valid: false, error: 'Company name must be at least 2 characters' };
  }

  if (name.length > 200) {
    return { valid: false, error: 'Company name must not exceed 200 characters' };
  }

  return { valid: true };
}

/**
 * Validate URL
 */
export function validateUrl(url: string, required: boolean = false): ValidationResult {
  if (!required && (!url || url.trim() === '')) {
    return { valid: true };
  }

  if (required && (!url || url.trim() === '')) {
    return { valid: false, error: 'URL is required' };
  }

  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Please enter a valid URL' };
  }
}

/**
 * Validate multiple fields at once
 */
export function validateFields(
  fields: Array<{ value: any; validator: (value: any) => ValidationResult }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of fields) {
    const result = field.validator(field.value);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

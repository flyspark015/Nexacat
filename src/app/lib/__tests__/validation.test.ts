import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
  validateProductName,
  validateSKU,
  validatePrice,
  validateYouTubeUrl,
  validateImageFile,
  validateGSTIN,
  validateVariationName,
  validateCategoryName,
  validateWhatsAppNumber,
  validateCompanyName,
  validateUrl,
} from '../validation';

describe('Validation Functions', () => {
  describe('validateEmail', () => {
    it('should accept valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Email is required');
    });

    it('should reject email without @', () => {
      const result = validateEmail('testexample.com');
      expect(result.valid).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = validateEmail('test@');
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password', () => {
      const result = validatePassword('password123');
      expect(result.valid).toBe(true);
    });

    it('should reject empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Password is required');
    });

    it('should reject password shorter than minimum length', () => {
      const result = validatePassword('12345');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 6 characters');
    });

    it('should accept custom minimum length', () => {
      const result = validatePassword('12345678', 8);
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePhone', () => {
    it('should accept valid Indian mobile number', () => {
      const result = validatePhone('9876543210');
      expect(result.valid).toBe(true);
    });

    it('should accept number with country code', () => {
      const result = validatePhone('+919876543210');
      expect(result.valid).toBe(true);
    });

    it('should accept number with spaces and hyphens', () => {
      const result = validatePhone('+91 98765-43210');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid number starting with wrong digit', () => {
      const result = validatePhone('1234567890');
      expect(result.valid).toBe(false);
    });

    it('should reject empty phone', () => {
      const result = validatePhone('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('should accept non-empty value', () => {
      const result = validateRequired('Some value', 'Field');
      expect(result.valid).toBe(true);
    });

    it('should reject empty value', () => {
      const result = validateRequired('', 'Field Name');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Field Name is required');
    });

    it('should reject whitespace-only value', () => {
      const result = validateRequired('   ', 'Field');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateProductName', () => {
    it('should accept valid product name', () => {
      const result = validateProductName('Test Product');
      expect(result.valid).toBe(true);
    });

    it('should reject name shorter than 3 characters', () => {
      const result = validateProductName('AB');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    it('should reject name longer than 200 characters', () => {
      const longName = 'A'.repeat(201);
      const result = validateProductName(longName);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not exceed 200 characters');
    });

    it('should reject empty name', () => {
      const result = validateProductName('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateSKU', () => {
    it('should accept valid SKU', () => {
      const result = validateSKU('PROD-123-ABC');
      expect(result.valid).toBe(true);
    });

    it('should accept SKU with underscores', () => {
      const result = validateSKU('PROD_123');
      expect(result.valid).toBe(true);
    });

    it('should reject SKU with special characters', () => {
      const result = validateSKU('PROD@123');
      expect(result.valid).toBe(false);
    });

    it('should accept empty SKU when not required', () => {
      const result = validateSKU('', false);
      expect(result.valid).toBe(true);
    });

    it('should reject empty SKU when required', () => {
      const result = validateSKU('', true);
      expect(result.valid).toBe(false);
    });

    it('should reject SKU longer than 50 characters', () => {
      const longSKU = 'A'.repeat(51);
      const result = validateSKU(longSKU);
      expect(result.valid).toBe(false);
    });
  });

  describe('validatePrice', () => {
    it('should accept valid price as number', () => {
      const result = validatePrice(99.99);
      expect(result.valid).toBe(true);
    });

    it('should accept valid price as string', () => {
      const result = validatePrice('99.99');
      expect(result.valid).toBe(true);
    });

    it('should reject negative price', () => {
      const result = validatePrice(-10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });

    it('should reject non-numeric value', () => {
      const result = validatePrice('abc');
      expect(result.valid).toBe(false);
    });

    it('should reject price that is too large', () => {
      const result = validatePrice(20000000);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should accept empty value when not required', () => {
      const result = validatePrice('', false);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateYouTubeUrl', () => {
    it('should accept standard YouTube URL', () => {
      const result = validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result.valid).toBe(true);
    });

    it('should accept short YouTube URL', () => {
      const result = validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
      expect(result.valid).toBe(true);
    });

    it('should accept embed YouTube URL', () => {
      const result = validateYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = validateYouTubeUrl('https://example.com');
      expect(result.valid).toBe(false);
    });

    it('should accept empty URL when not required', () => {
      const result = validateYouTubeUrl('', false);
      expect(result.valid).toBe(true);
    });

    it('should reject empty URL when required', () => {
      const result = validateYouTubeUrl('', true);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    it('should accept JPEG image', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept PNG image', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept WebP image', () => {
      const file = new File([''], 'test.webp', { type: 'image/webp' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });

    it('should reject non-image file', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JPEG, PNG, and WebP');
    });

    it('should reject file larger than 5MB', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('5MB');
    });
  });

  describe('validateGSTIN', () => {
    it('should accept valid GSTIN', () => {
      const result = validateGSTIN('29ABCDE1234F1Z5');
      expect(result.valid).toBe(true);
    });

    it('should accept lowercase GSTIN', () => {
      const result = validateGSTIN('29abcde1234f1z5');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid GSTIN format', () => {
      const result = validateGSTIN('INVALID123');
      expect(result.valid).toBe(false);
    });

    it('should accept empty GSTIN when not required', () => {
      const result = validateGSTIN('', false);
      expect(result.valid).toBe(true);
    });

    it('should reject empty GSTIN when required', () => {
      const result = validateGSTIN('', true);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateVariationName', () => {
    it('should accept valid variation name', () => {
      const result = validateVariationName('Large/Red');
      expect(result.valid).toBe(true);
    });

    it('should reject name shorter than 2 characters', () => {
      const result = validateVariationName('A');
      expect(result.valid).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const longName = 'A'.repeat(101);
      const result = validateVariationName(longName);
      expect(result.valid).toBe(false);
    });

    it('should reject empty name', () => {
      const result = validateVariationName('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCategoryName', () => {
    it('should accept valid category name', () => {
      const result = validateCategoryName('Electronics');
      expect(result.valid).toBe(true);
    });

    it('should reject name shorter than 2 characters', () => {
      const result = validateCategoryName('A');
      expect(result.valid).toBe(false);
    });

    it('should reject empty name', () => {
      const result = validateCategoryName('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateWhatsAppNumber', () => {
    it('should accept valid WhatsApp number with country code', () => {
      const result = validateWhatsAppNumber('+919876543210');
      expect(result.valid).toBe(true);
    });

    it('should accept number with spaces', () => {
      const result = validateWhatsAppNumber('+91 98765 43210');
      expect(result.valid).toBe(true);
    });

    it('should reject number without country code', () => {
      const result = validateWhatsAppNumber('9876543210');
      expect(result.valid).toBe(false);
    });

    it('should reject empty number', () => {
      const result = validateWhatsAppNumber('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCompanyName', () => {
    it('should accept valid company name', () => {
      const result = validateCompanyName('FlySpark Technologies');
      expect(result.valid).toBe(true);
    });

    it('should reject name shorter than 2 characters', () => {
      const result = validateCompanyName('A');
      expect(result.valid).toBe(false);
    });

    it('should reject empty name', () => {
      const result = validateCompanyName('');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should accept valid HTTP URL', () => {
      const result = validateUrl('http://example.com');
      expect(result.valid).toBe(true);
    });

    it('should accept valid HTTPS URL', () => {
      const result = validateUrl('https://example.com');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = validateUrl('not-a-url');
      expect(result.valid).toBe(false);
    });

    it('should accept empty URL when not required', () => {
      const result = validateUrl('', false);
      expect(result.valid).toBe(true);
    });

    it('should reject empty URL when required', () => {
      const result = validateUrl('', true);
      expect(result.valid).toBe(false);
    });
  });
});

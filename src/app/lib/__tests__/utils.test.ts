import { describe, it, expect } from 'vitest';
import {
  generateOrderCode,
  formatPrice,
  generateSlug,
  isValidEmail,
  isValidPhone,
  truncate,
  getYouTubeVideoId,
  generateWhatsAppOrderMessage,
  getWhatsAppLink,
} from '../utils';

describe('Utility Functions', () => {
  describe('generateOrderCode', () => {
    it('should generate order code in correct format', () => {
      const code = generateOrderCode();
      expect(code).toMatch(/^ORD-\d{4}-\d{5}$/);
    });

    it('should include current year', () => {
      const code = generateOrderCode();
      const year = new Date().getFullYear();
      expect(code).toContain(`ORD-${year}`);
    });
  });

  describe('formatPrice', () => {
    it('should format price with rupee symbol', () => {
      expect(formatPrice(1000)).toBe('₹1,000');
    });

    it('should format price without decimals', () => {
      expect(formatPrice(1500.50)).toBe('₹1,501');
    });

    it('should handle large numbers', () => {
      expect(formatPrice(100000)).toBe('₹1,00,000');
    });
  });

  describe('generateSlug', () => {
    it('should convert text to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('Product Name')).toBe('product-name');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Product@Name#123')).toBe('productname123');
    });

    it('should handle multiple spaces', () => {
      expect(generateSlug('Product   Name')).toBe('product-name');
    });

    it('should trim leading/trailing hyphens', () => {
      expect(generateSlug('-Product-')).toBe('product');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('should reject email without @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate 10-digit phone number', () => {
      expect(isValidPhone('1234567890')).toBe(true);
    });

    it('should validate phone with country code', () => {
      expect(isValidPhone('+911234567890')).toBe(true);
    });

    it('should validate phone with hyphens', () => {
      expect(isValidPhone('123-456-7890')).toBe(true);
    });

    it('should reject too short numbers', () => {
      expect(isValidPhone('12345')).toBe(false);
    });
  });

  describe('truncate', () => {
    it('should truncate text longer than limit', () => {
      const text = 'This is a very long text';
      expect(truncate(text, 10)).toBe('This is a ...');
    });

    it('should not truncate text within limit', () => {
      const text = 'Short text';
      expect(truncate(text, 20)).toBe('Short text');
    });

    it('should handle exact length', () => {
      const text = '12345';
      expect(truncate(text, 5)).toBe('12345');
    });
  });

  describe('getYouTubeVideoId', () => {
    it('should extract video ID from standard URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(getYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(getYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(getYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      expect(getYouTubeVideoId('https://example.com')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getYouTubeVideoId('')).toBeNull();
    });
  });

  describe('generateWhatsAppOrderMessage', () => {
    it('should generate complete order message', () => {
      const order = {
        orderCode: 'ORD-2026-12345',
        customerName: 'John Doe',
        items: [
          {
            productName: 'Product A',
            quantity: 2,
            price: 100,
          },
        ],
        phone: '1234567890',
        city: 'Mumbai',
        address: '123 Main St',
      };

      const message = generateWhatsAppOrderMessage(order);
      
      expect(message).toContain('ORD-2026-12345');
      expect(message).toContain('John Doe');
      expect(message).toContain('Product A');
      expect(message).toContain('Mumbai');
      expect(message).toContain('123 Main St');
    });

    it('should include variation name when present', () => {
      const order = {
        orderCode: 'ORD-2026-12345',
        customerName: 'John Doe',
        items: [
          {
            productName: 'T-Shirt',
            variationName: 'Large/Red',
            quantity: 1,
            price: 500,
          },
        ],
        phone: '1234567890',
        city: 'Mumbai',
        address: '123 Main St',
      };

      const message = generateWhatsAppOrderMessage(order);
      
      expect(message).toContain('Large/Red');
    });

    it('should include GSTIN when present', () => {
      const order = {
        orderCode: 'ORD-2026-12345',
        customerName: 'John Doe',
        items: [
          {
            productName: 'Product A',
            quantity: 1,
            price: 100,
          },
        ],
        phone: '1234567890',
        city: 'Mumbai',
        address: '123 Main St',
        gstin: '29ABCDE1234F1Z5',
      };

      const message = generateWhatsAppOrderMessage(order);
      
      expect(message).toContain('29ABCDE1234F1Z5');
    });

    it('should calculate total correctly', () => {
      const order = {
        orderCode: 'ORD-2026-12345',
        customerName: 'John Doe',
        items: [
          {
            productName: 'Product A',
            quantity: 2,
            price: 100,
          },
          {
            productName: 'Product B',
            quantity: 1,
            price: 300,
          },
        ],
        phone: '1234567890',
        city: 'Mumbai',
        address: '123 Main St',
      };

      const message = generateWhatsAppOrderMessage(order);
      
      expect(message).toContain('₹500'); // Total: (100*2) + (300*1)
    });
  });

  describe('getWhatsAppLink', () => {
    it('should generate WhatsApp link with encoded message', () => {
      const link = getWhatsAppLink('+911234567890', 'Hello World');
      
      expect(link).toContain('wa.me');
      expect(link).toContain('911234567890');
      expect(link).toContain('Hello%20World');
    });

    it('should clean phone number', () => {
      const link = getWhatsAppLink('+91-123-456-7890', 'Test');
      
      expect(link).toContain('911234567890');
      expect(link).not.toContain('+');
      expect(link).not.toContain('-');
    });

    it('should encode special characters in message', () => {
      const link = getWhatsAppLink('1234567890', 'Hello & Welcome!');
      
      expect(link).toContain('%26'); // & encoded
    });
  });
});

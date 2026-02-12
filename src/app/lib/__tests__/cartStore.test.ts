import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../cartStore';

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset cart before each test
    useCartStore.getState().clearCart();
  });

  it('should add simple product to cart', () => {
    const { addItem, items } = useCartStore.getState();
    
    addItem({
      productId: 'prod-1',
      productName: 'Test Product',
      productSlug: 'test-product',
      productType: 'simple',
      price: 100,
      quantity: 1,
      sku: 'TEST-001',
      imageLocalPath: '/test.jpg',
    });

    expect(items).toHaveLength(1);
    expect(items[0].productName).toBe('Test Product');
    expect(items[0].quantity).toBe(1);
  });

  it('should increase quantity when adding same simple product', () => {
    const { addItem, items } = useCartStore.getState();
    
    const product = {
      productId: 'prod-1',
      productName: 'Test Product',
      productSlug: 'test-product',
      productType: 'simple' as const,
      price: 100,
      quantity: 1,
      sku: 'TEST-001',
      imageLocalPath: '/test.jpg',
    };

    addItem(product);
    addItem(product);

    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('should add variable product with different variations separately', () => {
    const { addItem, items } = useCartStore.getState();
    
    addItem({
      productId: 'prod-2',
      productName: 'Variable Product',
      productSlug: 'variable-product',
      productType: 'variable',
      variationId: 'var-1',
      variationName: 'Red',
      price: 150,
      quantity: 1,
      imageLocalPath: '/var.jpg',
    });

    addItem({
      productId: 'prod-2',
      productName: 'Variable Product',
      productSlug: 'variable-product',
      productType: 'variable',
      variationId: 'var-2',
      variationName: 'Blue',
      price: 150,
      quantity: 1,
      imageLocalPath: '/var.jpg',
    });

    expect(items).toHaveLength(2);
  });

  it('should update item quantity', () => {
    const { addItem, updateQuantity, items } = useCartStore.getState();
    
    addItem({
      productId: 'prod-1',
      productName: 'Test Product',
      productSlug: 'test-product',
      productType: 'simple',
      price: 100,
      quantity: 1,
      imageLocalPath: '/test.jpg',
    });

    updateQuantity('prod-1', undefined, 5);

    expect(items[0].quantity).toBe(5);
  });

  it('should remove item from cart', () => {
    const { addItem, removeItem, items } = useCartStore.getState();
    
    addItem({
      productId: 'prod-1',
      productName: 'Test Product',
      productSlug: 'test-product',
      productType: 'simple',
      price: 100,
      quantity: 1,
      imageLocalPath: '/test.jpg',
    });

    removeItem('prod-1', undefined);

    expect(items).toHaveLength(0);
  });

  it('should calculate total correctly', () => {
    const { addItem, total } = useCartStore.getState();
    
    addItem({
      productId: 'prod-1',
      productName: 'Product 1',
      productSlug: 'product-1',
      productType: 'simple',
      price: 100,
      quantity: 2,
      imageLocalPath: '/test1.jpg',
    });

    addItem({
      productId: 'prod-2',
      productName: 'Product 2',
      productSlug: 'product-2',
      productType: 'simple',
      price: 50,
      quantity: 3,
      imageLocalPath: '/test2.jpg',
    });

    expect(total).toBe(350); // (100 * 2) + (50 * 3)
  });

  it('should clear cart', () => {
    const { addItem, clearCart, items } = useCartStore.getState();
    
    addItem({
      productId: 'prod-1',
      productName: 'Test Product',
      productSlug: 'test-product',
      productType: 'simple',
      price: 100,
      quantity: 1,
      imageLocalPath: '/test.jpg',
    });

    clearCart();

    expect(items).toHaveLength(0);
  });

  it('should count total items correctly', () => {
    const { addItem, totalItems } = useCartStore.getState();
    
    addItem({
      productId: 'prod-1',
      productName: 'Product 1',
      productSlug: 'product-1',
      productType: 'simple',
      price: 100,
      quantity: 3,
      imageLocalPath: '/test1.jpg',
    });

    addItem({
      productId: 'prod-2',
      productName: 'Product 2',
      productSlug: 'product-2',
      productType: 'simple',
      price: 50,
      quantity: 2,
      imageLocalPath: '/test2.jpg',
    });

    expect(totalItems).toBe(5); // 3 + 2
  });
});

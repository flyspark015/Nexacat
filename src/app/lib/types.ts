// Firebase Data Types

export interface User {
  uid: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageLocalPath: string;
}

export interface ProductVariation {
  id: string;
  variationName: string;
  price: number;
  sku?: string;
  variationImageIndex?: number; // Index to product.images array
  status?: "active" | "draft";
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  categoryId: string;
  brand?: string;
  tags: string[];
  description: string;
  specs: Record<string, string>;
  productType: "simple" | "variable";
  price?: number; // Only for simple products
  isPriceVisible: boolean;
  images: string[]; // Firebase Storage download URLs
  mainImageIndex?: number;
  stockStatus: "in-stock" | "out-of-stock" | "preorder";
  videoUrl?: string; // YouTube video URL
  status: "active" | "draft";
  createdAt: Date;
  variations?: ProductVariation[]; // Only for variable products
  
  // Deprecated fields (for backward compatibility with old mock data)
  imagesLocalPaths?: string[];
}

export interface OrderItem {
  productId: string;
  productName: string;
  variationName?: string;
  price: number;
  quantity: number;
  sku?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  customerUid: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  gstin?: string;
  note?: string;
  items: OrderItem[];
  status: "NEW" | "CONTACTED" | "QUOTED" | "CLOSED";
  createdAt: Date;
}

// System Settings
export interface SystemSettings {
  id: string;
  logoUrl?: string;
  faviconUrl?: string;
  companyName: string;
  companyAddress?: string;
  gstNumber?: string;
  iecCode?: string;
  whatsappNumber: string;
  currency: string;
  supportEmail: string;
  footerAddress?: string;
  websites?: string[];
  
  // Payment Details
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankUcic?: string;
  bankName?: string;
  upiId?: string;
  paymentQrCodeUrl?: string;
}

// Cart types (local storage + Zustand)
export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  productType: "simple" | "variable";
  variationId?: string;
  variationName?: string;
  price: number;
  quantity: number;
  sku?: string;
  imageLocalPath: string;
}
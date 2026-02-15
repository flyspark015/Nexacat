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
  shortDescription: string[]; // Key feature lines
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

// FAQ System
export interface FAQ {
  id: string;
  productId: string;
  productName: string;
  question: string;
  answer?: string;
  status: "pending" | "answered";
  askedBy: string; // Name
  mobile: string;
  contactId: string; // Reference to Contact
  createdAt: Date;
  answeredAt?: Date;
  isPublished: boolean; // Admin can hide/show
}

// Contact Database for Marketing
export interface Contact {
  id: string;
  name: string;
  mobile: string;
  firstSeen: Date;
  lastSeen: Date;
  relatedProducts: string[]; // Product IDs
  totalQuestions: number;
}

// AI Assistant System Types
export interface AITask {
  id: string;
  adminId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage: 'analyzing_input' | 'extracting_data' | 'processing_images' | 
         'generating_content' | 'suggesting_category' | 'creating_draft' | 'completed';
  progress: number; // 0-100
  input: {
    url?: string;
    screenshots?: string[]; // Storage URLs
    additionalText?: string;
    referenceCategory?: string;
  };
  output?: {
    draftId: string;
    warnings?: string[];
  };
  error?: {
    message: string;
    code: string;
    stage: string;
  };
  metadata: {
    model: string;
    tokensUsed: number;
    cost: number; // USD
    duration: number; // seconds
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDraft {
  id: string;
  adminId: string;
  taskId: string;
  status: 'review_required' | 'approved' | 'published' | 'discarded';
  product: {
    name: string;
    description: string; // Rich HTML
    shortDescription: string[];
    images: string[]; // Storage URLs
    specs: Record<string, string>;
    tags: string[];
    price?: number; // Always null initially
    currency: 'INR';
    stockStatus: 'in-stock' | 'out-of-stock' | 'preorder';
    productType: 'simple' | 'variable';
    videoUrl?: string;
  };
  suggestedCategory: {
    path: string; // "Electronics > Smartphones"
    categoryId?: string; // If exists
    confidence: number; // 0-1
    shouldCreate: boolean;
    newCategoryDetails?: {
      name: string;
      parentPath?: string;
      description: string;
      suggestedImage: string;
    };
  };
  aiMetadata: {
    sourceUrl?: string;
    model: string;
    extractionMethod: 'vision' | 'manual';
    qualityScore: number; // 0-100
    warnings: string[];
  };
  adminChanges?: {
    field: string;
    originalValue: any;
    newValue: any;
    timestamp: Date;
  }[];
  createdAt: Date;
  publishedAt?: Date;
}

export interface AIConversation {
  id: string;
  adminId: string;
  messages: {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
      taskId?: string;
      draftId?: string;
      type?: 'text' | 'image' | 'progress' | 'category_approval';
    };
  }[];
  context: {
    mode: 'add_product' | 'bulk_import' | 'update_product' | 'idle';
    activeTaskId?: string;
    activeDraftId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AIUsage {
  id: string; // adminId-YYYY-MM
  adminId: string;
  month: string; // "2025-02"
  totalRequests: number;
  totalTokens: number;
  totalCost: number; // USD
  requestsToday: number;
  costToday: number;
  byModel: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
  dailyBreakdown: Record<string, { // "2025-02-13"
    requests: number;
    cost: number;
  }>;
  updatedAt: Date;
}

export interface AISettings {
  id: string; // adminId
  openaiApiKey: string; // Encrypted
  model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
  maxTokensPerRequest: number;
  monthlyBudgetINR: number;
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
# FlySpark API Documentation

**Version:** 1.0.0  
**Last Updated:** February 12, 2026

This document describes all Firebase Firestore operations, storage operations, and authentication methods used in FlySpark.

---

## Table of Contents

1. [Authentication API](#authentication-api)
2. [Firestore API](#firestore-api)
3. [Storage API](#storage-api)
4. [State Management](#state-management)
5. [Utility Functions](#utility-functions)
6. [Error Handling](#error-handling)

---

## Authentication API

### File: `/src/app/lib/authService.ts`

#### `registerUser(email, password, name)`

Register a new user with email and password.

**Parameters:**
- `email` (string): User email address
- `password` (string): User password (min 6 characters)
- `name` (string): User full name

**Returns:** `Promise<User>`

**Example:**
```typescript
const user = await registerUser(
  'user@example.com',
  'password123',
  'John Doe'
);
```

**Errors:**
- `auth/email-already-in-use`: Email is already registered
- `auth/invalid-email`: Invalid email format
- `auth/weak-password`: Password too weak

---

#### `loginUser(email, password)`

Login existing user.

**Parameters:**
- `email` (string): User email
- `password` (string): User password

**Returns:** `Promise<User>`

**Example:**
```typescript
const user = await loginUser('user@example.com', 'password123');
```

**Errors:**
- `auth/user-not-found`: No account with this email
- `auth/wrong-password`: Incorrect password
- `auth/invalid-credential`: Invalid credentials

---

#### `logoutUser()`

Logout current user.

**Returns:** `Promise<void>`

**Example:**
```typescript
await logoutUser();
```

---

#### `getCurrentUser()`

Get currently authenticated user.

**Returns:** `User | null`

**Example:**
```typescript
const user = getCurrentUser();
if (user) {
  console.log(user.email);
}
```

---

## Firestore API

### File: `/src/app/lib/firestoreService.ts`

---

### Products

#### `getProducts(status?)`

Get all products, optionally filtered by status.

**Parameters:**
- `status` (optional): `"active" | "draft"`

**Returns:** `Promise<Product[]>`

**Example:**
```typescript
// Get all active products
const products = await getProducts('active');

// Get all products (active + draft)
const allProducts = await getProducts();
```

---

#### `getProduct(id)`

Get single product by ID.

**Parameters:**
- `id` (string): Product ID

**Returns:** `Promise<Product | null>`

**Example:**
```typescript
const product = await getProduct('product-123');
if (product) {
  console.log(product.name);
}
```

---

#### `getProductBySlug(slug)`

Get product by URL slug.

**Parameters:**
- `slug` (string): Product slug (e.g., "arduino-uno-r3")

**Returns:** `Promise<Product | null>`

**Example:**
```typescript
const product = await getProductBySlug('arduino-uno-r3');
```

---

#### `getProductsByCategory(categoryId)`

Get all active products in a category.

**Parameters:**
- `categoryId` (string): Category ID

**Returns:** `Promise<Product[]>`

**Example:**
```typescript
const products = await getProductsByCategory('electronics');
```

---

#### `searchProducts(searchTerm)`

Search products by name, SKU, brand, or tags.

**Parameters:**
- `searchTerm` (string): Search query

**Returns:** `Promise<Product[]>`

**Example:**
```typescript
const results = await searchProducts('arduino');
```

---

#### `createProduct(productData, variations?)`

Create new product.

**Parameters:**
- `productData` (Omit<Product, "id" | "createdAt">): Product data
- `variations` (optional): Array of ProductVariation

**Returns:** `Promise<string>` (Product ID)

**Example:**
```typescript
const productId = await createProduct({
  name: 'Arduino Uno R3',
  slug: 'arduino-uno-r3',
  categoryId: 'electronics',
  brand: 'Arduino',
  tags: ['microcontroller', 'arduino'],
  description: 'ATmega328P based board',
  specs: { 'Voltage': '5V', 'Clock': '16MHz' },
  productType: 'simple',
  price: 599,
  isPriceVisible: true,
  images: ['https://...'],
  stockStatus: 'in-stock',
  status: 'active',
});
```

---

#### `updateProduct(id, productData, variations?)`

Update existing product.

**Parameters:**
- `id` (string): Product ID
- `productData` (Partial<Product>): Updated fields
- `variations` (optional): Updated variations array

**Returns:** `Promise<void>`

**Example:**
```typescript
await updateProduct('product-123', {
  price: 699,
  stockStatus: 'out-of-stock',
});
```

---

#### `deleteProduct(id)`

Delete product and all its variations.

**Parameters:**
- `id` (string): Product ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await deleteProduct('product-123');
```

---

### Categories

#### `getCategories()`

Get all categories.

**Returns:** `Promise<Category[]>`

**Example:**
```typescript
const categories = await getCategories();
```

---

#### `getCategory(id)`

Get single category by ID.

**Parameters:**
- `id` (string): Category ID

**Returns:** `Promise<Category | null>`

**Example:**
```typescript
const category = await getCategory('electronics');
```

---

#### `createCategory(data)`

Create new category.

**Parameters:**
- `data` (Omit<Category, "id">): Category data

**Returns:** `Promise<string>` (Category ID)

**Example:**
```typescript
const categoryId = await createCategory({
  name: 'Electronics',
  slug: 'electronics',
  imageLocalPath: 'https://...',
});
```

---

#### `updateCategory(id, data)`

Update category.

**Parameters:**
- `id` (string): Category ID
- `data` (Partial<Category>): Updated fields

**Returns:** `Promise<void>`

**Example:**
```typescript
await updateCategory('electronics', { name: 'Electronic Components' });
```

---

#### `deleteCategory(id)`

Delete category.

**Parameters:**
- `id` (string): Category ID

**Returns:** `Promise<void>`

**Example:**
```typescript
await deleteCategory('electronics');
```

---

### Orders

#### `getOrders()`

Get all orders (admin only).

**Returns:** `Promise<Order[]>`

**Example:**
```typescript
const orders = await getOrders();
```

---

#### `getOrdersByCustomer(customerUid)`

Get orders for specific customer.

**Parameters:**
- `customerUid` (string): Customer user ID

**Returns:** `Promise<Order[]>`

**Example:**
```typescript
const myOrders = await getOrdersByCustomer(currentUser.uid);
```

---

#### `createOrder(orderData)`

Create new order.

**Parameters:**
- `orderData` (Omit<Order, "id" | "createdAt">): Order data

**Returns:** `Promise<string>` (Order ID)

**Example:**
```typescript
const orderId = await createOrder({
  orderCode: 'ORD-2026-12345',
  customerUid: user.uid,
  customerName: 'John Doe',
  phone: '+919876543210',
  city: 'Mumbai',
  address: '123 Main St',
  items: [
    {
      productId: 'prod-123',
      productName: 'Arduino Uno',
      price: 599,
      quantity: 2,
      sku: 'ARD-UNO-R3',
    },
  ],
  status: 'NEW',
});
```

---

#### `updateOrderStatus(id, status)`

Update order status.

**Parameters:**
- `id` (string): Order ID
- `status`: `"NEW" | "CONTACTED" | "QUOTED" | "CLOSED"`

**Returns:** `Promise<void>`

**Example:**
```typescript
await updateOrderStatus('order-123', 'CONTACTED');
```

---

### Users

#### `getUserProfile(uid)`

Get user profile by ID.

**Parameters:**
- `uid` (string): User ID

**Returns:** `Promise<User | null>`

**Example:**
```typescript
const user = await getUserProfile(currentUser.uid);
```

---

#### `updateUserProfile(uid, data)`

Update user profile.

**Parameters:**
- `uid` (string): User ID
- `data` (Partial<User>): Updated fields

**Returns:** `Promise<void>`

**Example:**
```typescript
await updateUserProfile(user.uid, { name: 'Jane Doe' });
```

---

### Settings

#### `getSettings()`

Get system settings.

**Returns:** `Promise<SystemSettings | null>`

**Example:**
```typescript
const settings = await getSettings();
console.log(settings?.companyName);
```

---

#### `updateSettings(data)`

Update system settings.

**Parameters:**
- `data` (Partial<SystemSettings>): Updated settings

**Returns:** `Promise<void>`

**Example:**
```typescript
await updateSettings({
  companyName: 'FlySpark Technologies',
  whatsappNumber: '+919876543210',
  currency: 'INR',
});
```

---

## Storage API

### File: `/src/app/lib/storageService.ts`

#### `uploadImage(file, path, onProgress?)`

Upload image to Firebase Storage.

**Parameters:**
- `file` (File): Image file
- `path` (string): Storage path (e.g., "products/product-123/image.jpg")
- `onProgress` (optional): (progress: number) => void

**Returns:** `Promise<string>` (Download URL)

**Example:**
```typescript
const url = await uploadImage(
  imageFile,
  `products/${productId}/main.jpg`,
  (progress) => console.log(`Upload: ${progress}%`)
);
```

---

#### `deleteImage(url)`

Delete image from storage.

**Parameters:**
- `url` (string): Image download URL

**Returns:** `Promise<void>`

**Example:**
```typescript
await deleteImage('https://firebasestorage.googleapis.com/...');
```

---

#### `uploadProductImages(productId, files, onProgress?)`

Upload multiple product images.

**Parameters:**
- `productId` (string): Product ID
- `files` (File[]): Array of image files
- `onProgress` (optional): (progress: number) => void

**Returns:** `Promise<string[]>` (Array of download URLs)

**Example:**
```typescript
const urls = await uploadProductImages(
  'product-123',
  [file1, file2, file3],
  (progress) => setUploadProgress(progress)
);
```

---

## State Management

### Cart Store (Zustand)

**File:** `/src/app/lib/cartStore.ts`

#### State

```typescript
interface CartStore {
  items: CartItem[];
  totalItems: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variationId?: string) => void;
  updateQuantity: (productId: string, variationId: string | undefined, quantity: number) => void;
  clearCart: () => void;
}
```

#### Usage

```typescript
import { useCartStore } from './lib/cartStore';

function MyComponent() {
  const { items, total, addItem, clearCart } = useCartStore();
  
  const handleAddToCart = () => {
    addItem({
      productId: 'prod-123',
      productName: 'Arduino Uno',
      productSlug: 'arduino-uno',
      productType: 'simple',
      price: 599,
      quantity: 1,
      sku: 'ARD-UNO',
      imageLocalPath: 'https://...',
    });
  };
  
  return (
    <div>
      <p>Total: ₹{total}</p>
      <p>Items: {items.length}</p>
      <button onClick={handleAddToCart}>Add to Cart</button>
      <button onClick={clearCart}>Clear Cart</button>
    </div>
  );
}
```

---

### Auth Store (Zustand)

**File:** `/src/app/lib/authStore.ts`

#### State

```typescript
interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}
```

#### Usage

```typescript
import { useAuthStore } from './lib/authStore';

function MyComponent() {
  const { user, loading } = useAuthStore();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;
  
  return <div>Welcome, {user.name}!</div>;
}
```

---

## Utility Functions

### File: `/src/app/lib/utils.ts`

#### `formatPrice(price)`

Format number as Indian Rupee.

```typescript
formatPrice(1000); // "₹1,000"
```

---

#### `generateSlug(text)`

Generate URL-safe slug.

```typescript
generateSlug('Arduino Uno R3'); // "arduino-uno-r3"
```

---

#### `generateOrderCode()`

Generate unique order code.

```typescript
generateOrderCode(); // "ORD-2026-12345"
```

---

#### `getYouTubeVideoId(url)`

Extract YouTube video ID.

```typescript
getYouTubeVideoId('https://www.youtube.com/watch?v=ABC123');
// "ABC123"
```

---

#### `generateWhatsAppOrderMessage(order)`

Generate WhatsApp message for order.

```typescript
const message = generateWhatsAppOrderMessage({
  orderCode: 'ORD-2026-12345',
  customerName: 'John Doe',
  items: [...],
  phone: '+919876543210',
  city: 'Mumbai',
  address: '123 Main St',
});
```

---

#### `getWhatsAppLink(phone, message)`

Generate WhatsApp deep link.

```typescript
const link = getWhatsAppLink('+919876543210', 'Hello!');
// "https://wa.me/919876543210?text=Hello!"
```

---

## Error Handling

### File: `/src/app/lib/errorHandler.ts`

#### `getErrorMessage(error)`

Get user-friendly error message.

```typescript
try {
  await someOperation();
} catch (error) {
  const message = getErrorMessage(error);
  alert(message); // User-friendly message
}
```

---

#### `showErrorToast(error, context?)`

Show error as toast notification.

```typescript
try {
  await createProduct(data);
} catch (error) {
  showErrorToast(error, 'Product Creation');
}
```

---

#### `showSuccessToast(message)`

Show success toast.

```typescript
await createProduct(data);
showSuccessToast('Product created successfully!');
```

---

#### `handleAsyncOperation(operation, options)`

Execute async operation with error handling.

```typescript
const { success, data, error } = await handleAsyncOperation(
  () => createProduct(productData),
  {
    successMessage: 'Product created!',
    errorContext: 'Product Creation',
    onSuccess: (id) => navigate(`/admin/products/${id}`),
  }
);
```

---

## TypeScript Types

### File: `/src/app/lib/types.ts`

All TypeScript interfaces are defined in this file:

- `User`
- `Category`
- `Product`
- `ProductVariation`
- `Order`
- `OrderItem`
- `SystemSettings`
- `CartItem`

See the file for complete type definitions.

---

## Firebase Collections Structure

### users
```
{
  uid: string (document ID)
  name: string
  email: string
  role: "customer" | "admin"
  createdAt: Timestamp
}
```

### products
```
{
  id: string (document ID)
  name: string
  slug: string
  sku?: string
  categoryId: string
  brand?: string
  tags: string[]
  description: string
  specs: { [key: string]: string }
  productType: "simple" | "variable"
  price?: number
  isPriceVisible: boolean
  images: string[]
  mainImageIndex?: number
  stockStatus: "in-stock" | "out-of-stock" | "preorder"
  videoUrl?: string
  status: "active" | "draft"
  createdAt: Timestamp
  
  // Subcollection: variations
  variations/{variationId}: {
    id: string
    variationName: string
    price: number
    sku?: string
    variationImageIndex?: number
    status?: "active" | "draft"
  }
}
```

### categories
```
{
  id: string (document ID)
  name: string
  slug: string
  imageLocalPath: string
}
```

### orders
```
{
  id: string (document ID)
  orderCode: string
  customerUid: string
  customerName: string
  phone: string
  city: string
  address: string
  gstin?: string
  note?: string
  items: OrderItem[]
  status: "NEW" | "CONTACTED" | "QUOTED" | "CLOSED"
  createdAt: Timestamp
}
```

### settings
```
{
  id: "system" (fixed document ID)
  logoUrl?: string
  faviconUrl?: string
  companyName: string
  whatsappNumber: string
  currency: string
  supportEmail: string
  footerAddress?: string
}
```

---

## Storage Structure

```
/products/{productId}/{filename}.jpg
/categories/{categoryId}/{filename}.jpg
/settings/{filename}.jpg
```

---

**Last Updated:** February 12, 2026  
**Version:** 1.0.0  
**Status:** Production Ready

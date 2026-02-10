# FlySpark Firebase Integration Guide

## 🔥 Firebase Project Details

- **Project Name:** flyspark
- **Project ID:** flyspark-cb85e
- **Public Name:** FlySpark Catalog
- **Support Email:** seminest015@gmail.com

## ✅ Completed Integration

### 1. Firebase SDK Installed
- Firebase package installed and configured
- Configuration file: `/src/app/lib/firebase.ts`

### 2. Authentication System
- Email/Password authentication enabled
- Login page: `/login`
- Register page: `/register`
- Forgot password page: `/forgot-password`
- Profile page: `/profile` (protected)

**Default Role:** Every new user registration gets **customer** role automatically.

### 3. Role-Based Access Control

**Customer Role:**
- Browse catalog (all products and categories)
- Search products
- Add items to cart
- Checkout via WhatsApp
- View own orders only
- Access profile page

**Admin Role:**
- All customer permissions
- Access admin dashboard at `/admin`
- Manage products (create, edit, delete, publish/draft)
- Manage categories
- View all orders
- Change order status
- Manage users and promote to admin
- Admin panel with dedicated layout

**Important:** Users CANNOT promote themselves to admin. Only existing admins can change user roles via the `/admin/users` page.

### 4. Database Structure (Firestore)

```
users/{uid}
├── name: string
├── email: string
├── role: "customer" | "admin"
└── createdAt: timestamp

categories/{categoryId}
├── name: string
├── slug: string
└── imageLocalPath: string

products/{productId}
├── name: string
├── slug: string
├── sku: string (optional)
├── categoryId: string
├── brand: string (optional)
├── tags: array
├── description: string
├── specs: map
├── productType: "simple" | "variable"
├── price: number (simple products only)
├── isPriceVisible: boolean
├── imagesLocalPaths: array (local paths only)
├── status: "active" | "draft"
├── createdAt: timestamp
└── variations (subcollection for variable products)
    └── {variationId}
        ├── variationName: string
        ├── price: number
        └── sku: string (optional)

orders/{orderId}
├── orderCode: string
├── customerUid: string
├── customerName: string
├── phone: string
├── city: string
├── address: string
├── gstin: string (optional)
├── note: string (optional)
├── items: array of objects
│   ├── productId: string
│   ├── productName: string
│   ├── variationName: string (optional)
│   ├── price: number
│   ├── quantity: number
│   └── sku: string (optional)
├── status: "NEW" | "CONTACTED" | "QUOTED" | "CLOSED"
└── createdAt: timestamp
```

### 5. Product Types

**Simple Product:**
- Single fixed price
- Direct add to cart
- No variations

**Variable Product:**
- Multiple variations (e.g., size, color, capacity)
- Each variation has:
  - Variation name
  - Individual price
  - Optional SKU
- User must select variation before adding to cart
- Price updates dynamically when variation is selected

### 6. Image Storage

**IMPORTANT:** All product images are stored **LOCALLY** in the project, NOT in Firebase Storage.

- Product images should be placed in `/public/products/` or `/src/assets/products/`
- Firestore only stores the **local path** to images
- Example: `imagesLocalPaths: ["/products/drone-x1.jpg", "/products/drone-x1-2.jpg"]`

### 7. Order Flow & WhatsApp Integration

1. Customer adds products to cart
2. Navigates to checkout (requires login)
3. Fills shipping information
4. Submits order
5. Order is created in Firestore with status "NEW"
6. Unique order code is generated
7. WhatsApp link opens with pre-filled message:
   - Order ID
   - Customer name
   - Item summary
   - Order details

**WhatsApp Message Format:**
```
Hello! I've placed an order on FlySpark.

Order ID: #ORD-2026-XXXXX
Customer: John Doe
Items:
- Product 1 (Variation A) x 2
- Product 2 x 1

Please confirm my order. Thank you!
```

### 8. Search Functionality

Search works across:
- Product name
- SKU
- Brand
- Tags

**Note:** For production, consider integrating Algolia or similar for advanced search capabilities.

### 9. Admin Features

**Admin Dashboard** (`/admin`):
- Overview statistics
- Quick access to all admin functions
- Recent orders
- Low stock alerts (when implemented)

**Product Management** (`/admin/products`):
- List all products
- Filter by status (active/draft)
- Create new products
- Edit existing products
- Delete products
- Variable product editor with inline variation management

**Category Management** (`/admin/categories`):
- List all categories
- Create new categories
- Edit categories
- Delete categories

**Order Management** (`/admin/orders`):
- View all orders from all customers
- Filter by status (NEW, CONTACTED, QUOTED, CLOSED)
- Update order status
- View customer details

**User Management** (`/admin/users`):
- View all users
- See user roles
- Promote customer to admin
- Demote admin to customer
- View registration date

### 10. Security Rules

Security rules are defined in `/FIRESTORE_SECURITY_RULES.txt`

**Key Security Features:**
- Public read for products and categories
- Authenticated users can create orders
- Users can only read their own orders
- Admins can read all orders
- Only admins can modify products, categories, and order status
- Users cannot self-promote to admin role
- Users cannot delete their accounts

## 📋 Setup Checklist

### In Firebase Console:

1. **Authentication**
   - ✅ Go to Authentication > Sign-in method
   - ✅ Enable Email/Password authentication
   - ✅ Disable Email link and Phone authentication

2. **Firestore Database**
   - ✅ Go to Firestore Database
   - ✅ Create database (Start in production mode)
   - ✅ Choose your region
   - ✅ Go to Rules tab
   - ✅ Copy rules from `/FIRESTORE_SECURITY_RULES.txt`
   - ✅ Publish rules

3. **Create First Admin User**
   ```
   Option 1: Via Console
   - Register a user via the app at /register
   - Go to Firestore Database
   - Open users collection
   - Find your user document
   - Edit the document
   - Change role from "customer" to "admin"
   - Save
   
   Option 2: Via Firebase CLI or Script
   - Use Firebase Admin SDK to create user with admin role
   ```

4. **Indexes** (if needed)
   - Firestore will prompt you to create indexes
   - Click the provided links in console errors
   - Or create manually:
     - Collection: orders
       - Fields: customerUid (Ascending), createdAt (Descending)
     - Collection: products
       - Fields: categoryId (Ascending), status (Ascending)

## 🎨 Design System

**CRITICAL:** The existing design is LOCKED and must NOT be changed.

- Theme colors: Deep blue/black + Electric blue accents
- Typography: Modern SaaS aesthetic
- Layout: Clean, spacious, professional
- Mobile: Bottom navigation preserved
- All existing components styled consistently

## 🚀 Development Workflow

### Working with Mock Data

The app currently uses mock data from `/src/app/lib/mockData.ts` for development.

### Migrating to Firebase

To fully migrate from mock data to Firebase:

1. **Categories:**
   - Import mock categories into Firestore
   - Update HomePage, CategoryPage to use Firestore service

2. **Products:**
   - Import mock products into Firestore
   - Add local images to project
   - Update product pages to use Firestore service

3. **Test Flow:**
   - Register a new user
   - Browse products
   - Add to cart
   - Checkout and create order
   - Check Firestore to verify order creation

4. **Admin Testing:**
   - Promote user to admin (via Firestore console)
   - Log in as admin
   - Access `/admin`
   - Create/edit products
   - Manage orders

## 📱 Mobile Experience

Mobile bottom navigation includes:
- Home
- Categories
- Cart
- Profile (when logged in) or Login (when logged out)

All features are fully responsive and maintain the exact same design language.

## 🔐 Environment Variables (Optional)

For production, consider using environment variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Then update `/src/app/lib/firebase.ts` to use these variables.

## 📊 Analytics

Firebase Analytics is initialized but optional. Remove if not needed:

```typescript
// In /src/app/lib/firebase.ts
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
```

## ✨ Next Steps

1. ✅ Firebase configuration is complete
2. ✅ Authentication pages are ready
3. ✅ Admin panel is functional
4. ✅ Security rules are defined
5. ⏳ Import initial categories and products
6. ⏳ Test complete user flow
7. ⏳ Deploy to production

## 🎯 Production Deployment

When deploying to production:

1. Ensure Firestore rules are published
2. Verify authentication is enabled
3. Test admin user access
4. Test customer registration and ordering
5. Verify WhatsApp integration
6. Check mobile responsiveness
7. Test security rules thoroughly

## 📞 Support

For questions or issues with Firebase integration, refer to:
- Firebase Documentation: https://firebase.google.com/docs
- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Firebase Authentication: https://firebase.google.com/docs/auth

---

**FlySpark Catalog** - Modern B2B Product Catalog System
Built with React, TypeScript, Tailwind CSS, and Firebase

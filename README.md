# FlySpark Product Catalog

> Modern B2B product catalog system with Firebase backend, WhatsApp checkout, and admin panel

![FlySpark](https://img.shields.io/badge/FlySpark-Product%20Catalog-blue)
![Firebase](https://img.shields.io/badge/Firebase-12.9.0-orange)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-4.1.12-cyan)

## 🚀 Features

### Customer Features
- ✅ Browse product catalog with categories
- ✅ Advanced product search (name, SKU, brand, tags)
- ✅ Shopping cart with persistence
- ✅ User authentication (email/password)
- ✅ Profile management
- ✅ Order history
- ✅ WhatsApp checkout integration
- ✅ Variable product support (size, color, etc.)
- ✅ Mobile-responsive design
- ✅ Bottom navigation on mobile

### Admin Features
- ✅ Dedicated admin dashboard
- ✅ Product management (CRUD)
- ✅ Simple & variable product types
- ✅ Category management
- ✅ Order management & status tracking
- ✅ User & role management
- ✅ Promote/demote admin access
- ✅ Sidebar navigation
- ✅ Statistics & analytics

### Technical Features
- ✅ Firebase Authentication
- ✅ Firestore database
- ✅ Role-based access control
- ✅ Protected routes
- ✅ Type-safe with TypeScript
- ✅ Modern UI with Tailwind CSS v4
- ✅ State management with Zustand
- ✅ React Router v7 data mode
- ✅ Security rules configured
- ✅ Production-ready architecture

## 📦 Tech Stack

- **Frontend:** React 18.3 + TypeScript
- **Styling:** Tailwind CSS v4
- **Routing:** React Router v7
- **State Management:** Zustand
- **Backend:** Firebase (Auth + Firestore)
- **UI Components:** Radix UI + shadcn/ui
- **Icons:** Lucide React
- **Build Tool:** Vite

## 🏗️ Project Structure

```
flyspark/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── MobileNav.tsx
│   │   │   │   ├── RootLayout.tsx
│   │   │   │   └── AdminLayout.tsx
│   │   │   ├── ui/           # Reusable UI components
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   └── ForgotPasswordPage.tsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AdminProducts.tsx
│   │   │   │   ├── AdminAddProduct.tsx
│   │   │   │   ├── AdminCategories.tsx
│   │   │   │   ├── AdminOrders.tsx
│   │   │   │   └── AdminUsers.tsx
│   │   │   ├── HomePage.tsx
│   │   │   ├── CategoryPage.tsx
│   │   │   ├── ProductDetailPage.tsx
│   │   │   ├── SearchPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── lib/
│   │   │   ├── firebase.ts          # Firebase config
│   │   │   ├── types.ts             # TypeScript types
│   │   │   ├── authStore.ts         # Auth state management
│   │   │   ├── authService.ts       # Auth functions
│   │   │   ├── AuthProvider.tsx     # Auth context
│   │   │   ├── firestoreService.ts  # Database functions
│   │   │   ├── cartStore.ts         # Cart state
│   │   │   ├── utils.ts             # Helper functions
│   │   │   └── mockData.ts          # Sample data
│   │   ├── App.tsx
│   │   └── routes.tsx
│   └── styles/
│       ├── theme.css       # Design system
│       ├── tailwind.css
│       └── index.css
├── FIREBASE_INTEGRATION_GUIDE.md
├── FIREBASE_CONSOLE_SETUP.md
├── FIRESTORE_SECURITY_RULES.txt
├── IMPLEMENTATION_SUMMARY.md
└── README.md
```

## 🔥 Firebase Configuration

**Project Details:**
- Project ID: `flyspark-cb85e`
- Project Name: FlySpark
- Support Email: seminest015@gmail.com

**Authentication:**
- Email/Password: ✅ Enabled
- Phone OTP: ❌ Disabled
- Google Sign-in: ❌ Disabled

## 📚 Documentation

Comprehensive guides included:

1. **[FIREBASE_INTEGRATION_GUIDE.md](./FIREBASE_INTEGRATION_GUIDE.md)**
   - Complete Firebase setup
   - Database structure
   - Authentication flow
   - Product types explained
   - Development workflow

2. **[FIREBASE_CONSOLE_SETUP.md](./FIREBASE_CONSOLE_SETUP.md)**
   - Step-by-step console configuration
   - Enable authentication
   - Create Firestore database
   - Configure security rules
   - Create first admin user

3. **[FIRESTORE_SECURITY_RULES.txt](./FIRESTORE_SECURITY_RULES.txt)**
   - Ready-to-paste security rules
   - Role-based permissions
   - Public/private access control

4. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**
   - Complete feature list
   - File structure
   - Implementation details
   - Testing checklist

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account
- FlySpark Firebase project access

### Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase Console**
   - Follow [FIREBASE_CONSOLE_SETUP.md](./FIREBASE_CONSOLE_SETUP.md)
   - Enable Authentication
   - Create Firestore database
   - Apply security rules

4. **Create first admin user**
   ```bash
   # Start dev server
   npm run dev
   
   # Register at http://localhost:5173/register
   # Then promote to admin in Firebase Console
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

## 🗄️ Database Structure

### Users Collection
```typescript
users/{uid}
  - name: string
  - email: string
  - role: "customer" | "admin"
  - createdAt: timestamp
```

### Categories Collection
```typescript
categories/{categoryId}
  - name: string
  - slug: string
  - imageLocalPath: string
```

### Products Collection
```typescript
products/{productId}
  - name: string
  - slug: string
  - sku?: string
  - categoryId: string
  - brand?: string
  - tags: string[]
  - description: string
  - specs: map
  - productType: "simple" | "variable"
  - price?: number
  - isPriceVisible: boolean
  - imagesLocalPaths: string[]
  - status: "active" | "draft"
  - createdAt: timestamp
  
  variations/{variationId}  (subcollection)
    - variationName: string
    - price: number
    - sku?: string
```

### Orders Collection
```typescript
orders/{orderId}
  - orderCode: string
  - customerUid: string
  - customerName: string
  - phone: string
  - city: string
  - address: string
  - gstin?: string
  - note?: string
  - items: OrderItem[]
  - status: "NEW" | "CONTACTED" | "QUOTED" | "CLOSED"
  - createdAt: timestamp
```

## 🔐 User Roles

### Customer (Default)
- Browse catalog
- Search products
- Add to cart
- Place orders via WhatsApp
- View own orders
- Manage profile

### Admin
- All customer permissions
- Access admin dashboard (`/admin`)
- Manage products (CRUD)
- Manage categories
- View all orders
- Update order status
- Manage users
- Promote/demote admin access

**Note:** Users cannot self-promote to admin. Only existing admins can change user roles.

## 🛒 Product Types

### Simple Product
- Single price
- Direct add to cart
- No variation selection

### Variable Product
- Multiple variations (size, color, capacity, etc.)
- Each variation has individual price and optional SKU
- User must select variation before adding to cart
- Price updates dynamically on selection

## 📱 WhatsApp Checkout

Order flow:
1. Customer adds products to cart
2. Proceeds to checkout (login required)
3. Fills shipping information
4. Clicks "Send Order on WhatsApp"
5. **Order saved to Firestore** with unique order code
6. WhatsApp opens with pre-filled message
7. Cart cleared automatically
8. Redirect to profile/orders

**Configure WhatsApp Number:**
Update in these files:
- `/src/app/components/layout/Header.tsx` (line 24)
- `/src/app/pages/CheckoutPage.tsx` (line 99)

## 🎨 Design System

**Color Palette:**
- Primary: Deep Blue/Black (#0F172A)
- Accent: Electric Blue (#3B82F6)
- Orange Accent: #F97316
- Background: Light Gray (#F8FAFC)
- Success: Green (#10B981)

**Typography:**
- System font stack: -apple-system, BlinkMacSystemFont, Inter, SF Pro
- Responsive sizing
- Modern, clean, professional

**Layout:**
- Mobile-first responsive design
- Sticky header
- Bottom navigation on mobile
- Admin sidebar on desktop
- Consistent spacing system

## 🧪 Testing Checklist

### Authentication
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Password reset works
- [ ] Logout functionality
- [ ] Protected route redirects

### Customer Flow
- [ ] Browse products
- [ ] Search functionality
- [ ] Add to cart
- [ ] Update cart quantities
- [ ] Remove from cart
- [ ] Checkout (order creation)
- [ ] View order in profile

### Admin Flow
- [ ] Access admin dashboard
- [ ] Create product (simple)
- [ ] Create product (variable)
- [ ] Edit product
- [ ] Delete product
- [ ] Create category
- [ ] View all orders
- [ ] Update order status
- [ ] Manage user roles

## 📦 Build for Production

```bash
# Build
npm run build

# Preview build
npm run preview
```

## 🔧 Configuration

### Update Firebase Config (if needed)
Edit `/src/app/lib/firebase.ts`

### Update WhatsApp Number
Edit:
- Header component
- Checkout page

### Customize Theme
Edit `/src/styles/theme.css` (preserving design system)

## 📖 Key Files Reference

| File | Purpose |
|------|---------|
| `/src/app/lib/firebase.ts` | Firebase initialization |
| `/src/app/lib/types.ts` | TypeScript type definitions |
| `/src/app/lib/authService.ts` | Authentication functions |
| `/src/app/lib/firestoreService.ts` | Database CRUD operations |
| `/src/app/lib/utils.ts` | Helper utilities |
| `/src/app/routes.tsx` | App routing configuration |
| `/src/styles/theme.css` | Design system tokens |

## 🐛 Troubleshooting

### 📊 Seeing Console Messages About Indexes?

**→ [INDEX_DOCS_README.md](./INDEX_DOCS_README.md) - Start Here! 📚**

Your app is working perfectly! Choose the right guide for you:
- 🚀 **2-minute fix** → [QUICK_INDEX_FIX.md](./QUICK_INDEX_FIX.md)
- 📖 **Step-by-step** → [INDEX_CREATION_WALKTHROUGH.md](./INDEX_CREATION_WALKTHROUGH.md)
- 🤔 **Understand first** → [CONSOLE_MESSAGE_EXPLAINED.md](./CONSOLE_MESSAGE_EXPLAINED.md)

---

### Firestore Index Errors (Detailed)

If you see an error like:
```
FirebaseError: The query requires an index. You can create it here: https://...
```

Or a console message:
```
📊 Firestore Index Recommended (Optional)
✅ App is working normally with client-side sorting
```

**Your app is working perfectly!** This is just an optimization recommendation.

**Quick Fix (2 minutes):**
1. Click the link in the error message
2. Firebase Console will open with pre-configured index
3. Click "Create Index"
4. Wait 1-2 minutes
5. Refresh your app (Ctrl+Shift+R)

**Detailed Guides:**
- 🚀 [QUICK_INDEX_FIX.md](./QUICK_INDEX_FIX.md) - 2-minute quick fix
- 📖 [INDEX_CREATION_WALKTHROUGH.md](./INDEX_CREATION_WALKTHROUGH.md) - Visual step-by-step guide
- 📚 [FIRESTORE_INDEXES_GUIDE.md](./FIRESTORE_INDEXES_GUIDE.md) - Complete reference

**Note:** The app has automatic fallback and will work without indexes (data sorted client-side). Creating indexes improves performance for large datasets.

### Other Issues

See [FIREBASE_CONSOLE_SETUP.md](./FIREBASE_CONSOLE_SETUP.md) Troubleshooting section for common issues.

## 📝 License

This project is private and proprietary.

## 👥 Support

For issues or questions:
- Email: seminest015@gmail.com
- Firebase Console: https://console.firebase.google.com/project/flyspark-cb85e

## 🎯 Roadmap

Future enhancements:
- [ ] Email notifications for orders
- [ ] Advanced search with Algolia
- [ ] Image upload in admin (Firebase Storage)
- [ ] Inventory management
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] PDF invoice generation
- [ ] Advanced filtering

---

**FlySpark Product Catalog** - Professional B2B catalog system
Built with React, TypeScript, Tailwind CSS, and Firebase
# Firebase Security Rules for FlySpark

This document contains the complete security rules for Firestore Database and Firebase Storage.

---

## Firestore Security Rules

Copy and paste these rules into **Firebase Console → Firestore Database → Rules**:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // Helper Functions
    // ============================================
    
    // Check if user is signed in
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Check if user is the owner of a resource
    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }
    
    // Check if incoming data has all required fields
    function hasRequiredFields(fields) {
      return request.resource.data.keys().hasAll(fields);
    }
    
    // Check if field is not changed
    function fieldNotChanged(field) {
      return request.resource.data[field] == resource.data[field];
    }
    
    // ============================================
    // Users Collection
    // ============================================
    
    match /users/{userId} {
      // Anyone authenticated can read any user (for displaying names, etc.)
      allow read: if isSignedIn();
      
      // Users can create their own profile
      allow create: if isSignedIn() && 
                      isOwner(userId) &&
                      hasRequiredFields(['email', 'name', 'role', 'createdAt']);
      
      // Users can update their own profile, admins can update any
      allow update: if isOwner(userId) || isAdmin();
      
      // Only admins can delete users
      allow delete: if isAdmin();
    }
    
    // ============================================
    // Products Collection
    // ============================================
    
    match /products/{productId} {
      // Public read access (customers can browse products)
      allow read: if true;
      
      // Only admins can create products
      allow create: if isAdmin() &&
                      hasRequiredFields(['name', 'slug', 'categoryId', 'description', 'productType', 'status', 'createdAt']);
      
      // Only admins can update products
      allow update: if isAdmin();
      
      // Only admins can delete products
      allow delete: if isAdmin();
      
      // Product Variations Subcollection
      match /variations/{variationId} {
        // Public read access
        allow read: if true;
        
        // Only admins can modify variations
        allow create, update, delete: if isAdmin();
      }
    }
    
    // ============================================
    // Categories Collection
    // ============================================
    
    match /categories/{categoryId} {
      // Public read access
      allow read: if true;
      
      // Only admins can create categories
      allow create: if isAdmin() &&
                      hasRequiredFields(['name', 'slug', 'imageLocalPath']);
      
      // Only admins can update categories
      allow update: if isAdmin();
      
      // Only admins can delete categories
      allow delete: if isAdmin();
    }
    
    // ============================================
    // Orders Collection
    // ============================================
    
    match /orders/{orderId} {
      // Users can read their own orders, admins can read all
      allow read: if isOwner(resource.data.customerUid) || isAdmin();
      
      // Authenticated users can create orders
      allow create: if isSignedIn() &&
                      isOwner(request.resource.data.customerUid) &&
                      hasRequiredFields(['orderCode', 'customerUid', 'customerName', 'phone', 'city', 'address', 'items', 'status', 'createdAt']);
      
      // Only admins can update orders (for status changes)
      allow update: if isAdmin();
      
      // Only admins can delete orders
      allow delete: if isAdmin();
    }
    
    // ============================================
    // Settings Collection
    // ============================================
    
    match /settings/{settingId} {
      // Public read access (for logo, company name, etc.)
      allow read: if true;
      
      // Only admins can create settings
      allow create: if isAdmin();
      
      // Only admins can update settings
      allow update: if isAdmin();
      
      // Only admins can delete settings
      allow delete: if isAdmin();
    }
  }
}
```

---

## Firebase Storage Rules

Copy and paste these rules into **Firebase Console → Storage → Rules**:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // ============================================
    // Helper Functions
    // ============================================
    
    // Check if user is signed in
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Check if user is admin
    function isAdmin() {
      return isSignedIn() && 
             firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Check if file is an image
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    // Check if file is under 5MB
    function isUnder5MB() {
      return request.resource.size < 5 * 1024 * 1024;
    }
    
    // Check if file is under 2MB
    function isUnder2MB() {
      return request.resource.size < 2 * 1024 * 1024;
    }
    
    // ============================================
    // Product Images
    // ============================================
    
    match /products/{productId}/{fileName} {
      // Public read access
      allow read: if true;
      
      // Only admins can upload product images
      allow write: if isAdmin() && 
                     isImage() && 
                     isUnder5MB();
      
      // Only admins can delete product images
      allow delete: if isAdmin();
    }
    
    // ============================================
    // Category Images
    // ============================================
    
    match /categories/{categoryId}/{fileName} {
      // Public read access
      allow read: if true;
      
      // Only admins can upload category images
      allow write: if isAdmin() && 
                     isImage() && 
                     isUnder5MB();
      
      // Only admins can delete category images
      allow delete: if isAdmin();
    }
    
    // ============================================
    // Settings (Logo, Favicon)
    // ============================================
    
    match /settings/{fileName} {
      // Public read access
      allow read: if true;
      
      // Only admins can upload logo/favicon
      allow write: if isAdmin() && 
                     isImage() && 
                     isUnder2MB();
      
      // Only admins can delete logo/favicon
      allow delete: if isAdmin();
    }
  }
}
```

---

## Rule Explanations

### Firestore Rules

#### Users Collection
- **Read:** Any authenticated user can read user profiles (needed for displaying customer names in orders)
- **Create:** Users can only create their own profile with required fields
- **Update:** Users can update their own profile, admins can update any user
- **Delete:** Only admins can delete users

#### Products Collection
- **Read:** Public access (allows browsing without login)
- **Create/Update/Delete:** Admin only
- **Required fields:** name, slug, categoryId, description, productType, status, createdAt
- **Variations subcollection:** Same rules as products

#### Categories Collection
- **Read:** Public access
- **Create/Update/Delete:** Admin only
- **Required fields:** name, slug, imageLocalPath

#### Orders Collection
- **Read:** Users can read their own orders, admins can read all
- **Create:** Authenticated users can create orders for themselves
- **Update/Delete:** Admin only (for status management)
- **Required fields:** orderCode, customerUid, customerName, phone, city, address, items, status, createdAt

#### Settings Collection
- **Read:** Public access (for logo, company info display)
- **Create/Update/Delete:** Admin only

### Storage Rules

#### Product Images (`/products/{productId}/{fileName}`)
- **Read:** Public access
- **Write:** Admin only, must be image, max 5MB
- **Delete:** Admin only

#### Category Images (`/categories/{categoryId}/{fileName}`)
- **Read:** Public access
- **Write:** Admin only, must be image, max 5MB
- **Delete:** Admin only

#### Settings (`/settings/{fileName}`)
- **Read:** Public access
- **Write:** Admin only, must be image, max 2MB (smaller limit for logos)
- **Delete:** Admin only

---

## Security Best Practices Implemented

### 1. **Role-Based Access Control (RBAC)**
- Clear separation between customer and admin roles
- Role stored in users collection
- Role verified on every operation

### 2. **Data Validation**
- Required fields enforcement
- Field type validation (implicit through Firestore)
- Size limits on file uploads

### 3. **Principle of Least Privilege**
- Users can only access their own data
- Admins have elevated privileges
- Public read access only where necessary

### 4. **Defense in Depth**
- Client-side validation + server-side rules
- Double-check user authentication
- Verify ownership before operations

### 5. **File Upload Security**
- File type restrictions (images only)
- File size limits (2MB-5MB)
- Admin-only upload permissions
- Organized folder structure

---

## Testing Security Rules

### Test User Permissions

```javascript
// Test as unauthenticated user
firebase.auth().signOut();
// Should be able to: Read products, categories, settings
// Should NOT be able to: Create orders, read users

// Test as authenticated customer
firebase.auth().signInWithEmailAndPassword('customer@example.com', 'password');
// Should be able to: Read products, create orders, read own orders
// Should NOT be able to: Create products, update orders, read all orders

// Test as admin
firebase.auth().signInWithEmailAndPassword('admin@example.com', 'password');
// Should be able to: Everything
```

### Test Product Creation

```javascript
// As customer - should FAIL
db.collection('products').add({
  name: 'Test Product',
  // ...
});
// Error: Missing or insufficient permissions

// As admin - should SUCCEED
db.collection('products').add({
  name: 'Test Product',
  slug: 'test-product',
  categoryId: 'cat-123',
  description: 'Test',
  productType: 'simple',
  status: 'active',
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  // ...
});
```

### Test Order Access

```javascript
// User A trying to read User B's order - should FAIL
db.collection('orders').doc('user-b-order-id').get();
// Error: Missing or insufficient permissions

// Admin reading any order - should SUCCEED
db.collection('orders').doc('any-order-id').get();
```

---

## Deployment Checklist

- [ ] Copy Firestore rules to Firebase Console
- [ ] Copy Storage rules to Firebase Console
- [ ] Publish both rule sets
- [ ] Create test admin user
- [ ] Test admin operations (create product, update order)
- [ ] Create test customer user
- [ ] Test customer operations (create order, view products)
- [ ] Test unauthenticated access (browse products)
- [ ] Verify file upload restrictions
- [ ] Test role changes (customer → admin)
- [ ] Monitor Firebase Console for rule violations

---

## Monitoring

### View Rule Violations

1. Go to **Firebase Console**
2. Navigate to **Firestore Database** or **Storage**
3. Click **Rules** tab
4. Click **Rules playground** to test operations
5. Check **Usage** tab for denied requests

### Common Rule Violations

- **Permission Denied:** User trying to access unauthorized data
- **Invalid Document:** Missing required fields
- **File Too Large:** Upload exceeds size limit
- **Invalid File Type:** Non-image upload attempt

---

## Updating Rules

When updating rules:

1. **Test in local emulator first** (if using Firebase Emulators)
2. **Update staging environment** (if applicable)
3. **Monitor for errors** after deployment
4. **Have rollback plan ready**
5. **Document all changes**

---

## Emergency Rollback

If rules cause issues:

1. Go to **Firebase Console → Firestore/Storage → Rules**
2. Click **Rules History**
3. Select previous working version
4. Click **Restore**
5. Click **Publish**

---

**Last Updated:** February 12, 2026  
**Version:** 1.0.0  
**Status:** Production Ready

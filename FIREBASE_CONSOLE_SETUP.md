# Firebase Console Setup Guide - Quick Reference

## 🔥 Step-by-Step Firebase Console Configuration

### Step 1: Enable Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **flyspark-cb85e**
3. Click **Authentication** in left sidebar
4. Click **Get Started** (if first time)
5. Click **Sign-in method** tab
6. Enable **Email/Password**:
   - Click on **Email/Password**
   - Toggle **Enable** to ON
   - Toggle **Email link (passwordless sign-in)** to OFF
   - Click **Save**

### Step 2: Create Firestore Database

1. Click **Firestore Database** in left sidebar
2. Click **Create database**
3. Select **Start in production mode**
4. Choose your region (recommended: closest to your users)
   - Example: `asia-south1` (Mumbai) for India
5. Click **Enable**
6. Wait for database creation (1-2 minutes)

### Step 3: Configure Firestore Security Rules

1. In Firestore Database, click **Rules** tab
2. Delete all existing rules
3. Copy the entire content from `/FIRESTORE_SECURITY_RULES.txt` file
4. Paste into the Firebase Console editor
5. Click **Publish**
6. Wait for confirmation "Rules published successfully"

**Your rules should start with:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
```

### Step 4: Create First Admin User

**Option A: Via App + Console (Recommended)**

1. Open your app at `http://localhost:5173/register`
2. Register with your email (e.g., `admin@flyspark.com`)
3. Complete registration
4. Go back to Firebase Console
5. Click **Firestore Database**
6. Click on **users** collection
7. Find your user document (by UID)
8. Click on the document
9. Click **Edit field** (pencil icon) next to `role`
10. Change value from `"customer"` to `"admin"` (include quotes)
11. Click **Update**
12. Logout and login again in the app
13. You should now see "Admin" button in header

**Option B: Manual Creation via Console**

1. Go to **Firestore Database**
2. Click **Start collection**
3. Collection ID: `users`
4. Click **Next**
5. Document ID: (copy your user UID from Authentication)
6. Add fields:
   - Field: `name`, Type: string, Value: Your Name
   - Field: `email`, Type: string, Value: your@email.com
   - Field: `role`, Type: string, Value: admin
   - Field: `createdAt`, Type: timestamp, Value: (click current timestamp)
7. Click **Save**

### Step 5: Create Initial Collections Structure (Optional)

While Firestore auto-creates collections on first write, you can pre-create them:

**Categories Collection:**
1. Click **Start collection**
2. Collection ID: `categories`
3. Add a sample document:
   - Document ID: Auto-ID
   - Fields:
     - `name`: string, "Drones"
     - `slug`: string, "drones"
     - `imageLocalPath`: string, "/images/categories/drones.jpg"
4. Click **Save**

**Products Collection:**
1. Click **Start collection**
2. Collection ID: `products`
3. Add a sample product:
   - Document ID: Auto-ID
   - Fields:
     - `name`: string, "FlyX Pro Drone"
     - `slug`: string, "flyx-pro-drone"
     - `sku`: string, "FX-001"
     - `categoryId`: string, (paste category document ID)
     - `brand`: string, "FlySpark"
     - `tags`: array, ["drone", "camera", "4k"]
     - `description`: string, "Professional 4K drone"
     - `specs`: map, {camera: "4K", battery: "30min"}
     - `productType`: string, "simple"
     - `price`: number, 45000
     - `isPriceVisible`: boolean, true
     - `imagesLocalPaths`: array, ["/images/products/drone1.jpg"]
     - `status`: string, "active"
     - `createdAt`: timestamp, (now)
4. Click **Save**

### Step 6: Set Up Indexes (As Needed)

Firestore will prompt you when an index is needed. Common indexes:

**IMPORTANT: The app now has automatic fallback and will work without indexes!**
You'll see a warning in console, but data will still load (sorted client-side).

**Easiest Method - Click the Link:**

When you see an index error, it includes a clickable link:
```
FirebaseError: The query requires an index. You can create it here: 
https://console.firebase.google.com/v1/r/project/flyspark-cb85e/...
```

1. **Click that link** (or copy/paste in browser)
2. Firebase Console opens with pre-configured index
3. Click **Create Index**
4. Wait 1-2 minutes
5. Refresh your app
6. Done!

**Manual Method (if needed):**

**Orders - Customer + Date:**
1. Click **Indexes** tab in Firestore
2. Click **Create index**
3. Collection ID: `orders`
4. Fields:
   - `customerUid` - Ascending
   - `createdAt` - Descending
5. Query scope: Collection
6. Click **Create**

**Orders - All by Date:**
1. Create another index
2. Collection ID: `orders`
3. Fields:
   - `createdAt` - Descending
4. Click **Create**

**Products - Category + Status:**
1. Create another index
2. Collection ID: `products`
3. Fields:
   - `categoryId` - Ascending
   - `status` - Ascending
4. Click **Create**

**Note:** Creating indexes is optional at first. The app has fallback logic and will work without them (just slightly slower for large datasets). See `/FIRESTORE_INDEXES_GUIDE.md` for details.

### Step 7: Configure App Settings (Optional)

**Email Templates:**
1. Go to **Authentication**
2. Click **Templates** tab
3. Customize:
   - Password reset email
   - Email address change
   - SMS verification (if enabled later)

**Authorized Domains:**
1. Go to **Authentication**
2. Click **Settings** tab
3. Click **Authorized domains**
4. Add your production domain when deploying:
   - Example: `flyspark.com`

### Step 8: Test the Integration

**Test Authentication:**
1. Open app at `/register`
2. Create account
3. Check Firebase Console > Authentication > Users
4. Verify user appears

**Test Login:**
1. Logout
2. Go to `/login`
3. Login with created account
4. Check that profile loads

**Test Order Creation:**
1. Add product to cart
2. Go to checkout
3. Fill form and submit
4. Check Firebase Console > Firestore > orders collection
5. Verify order document created

**Test Admin Access:**
1. Promote user to admin (Step 4)
2. Login as admin
3. Navigate to `/admin`
4. Verify admin panel loads
5. Try creating a product
6. Check Firestore > products collection

### Step 9: Monitoring & Analytics (Optional)

**Enable Analytics:**
1. Click **Analytics** in sidebar
2. Click **Enable Google Analytics**
3. Follow setup wizard
4. Analytics will auto-track page views

**Set Up Monitoring:**
1. Click **Performance** to monitor app performance
2. Click **Crashlytics** for error tracking (web SDK)

## 🔧 Troubleshooting

### Authentication Issues

**Problem:** "Auth domain not authorized"
**Solution:** Add domain to authorized domains in Authentication > Settings

**Problem:** "User not found after registration"
**Solution:** Check Firestore rules allow user document creation

### Firestore Issues

**Problem:** "Missing or insufficient permissions"
**Solution:** Verify security rules are published correctly

**Problem:** "PERMISSION_DENIED: Missing or insufficient permissions"
**Solution:** Ensure user is logged in and has correct role

**Problem:** "Indexes required"
**Solution:** Click the link in error message to create index automatically

### Order Creation Issues

**Problem:** Orders not appearing in Firestore
**Solution:** Check browser console for errors, verify auth state

**Problem:** Order created but WhatsApp not opening
**Solution:** Verify WhatsApp number format (no spaces, include country code)

## 📊 Firebase Console Quick Links

- **Dashboard:** https://console.firebase.google.com/project/flyspark-cb85e
- **Authentication:** https://console.firebase.google.com/project/flyspark-cb85e/authentication/users
- **Firestore:** https://console.firebase.google.com/project/flyspark-cb85e/firestore
- **Rules:** https://console.firebase.google.com/project/flyspark-cb85e/firestore/rules
- **Indexes:** https://console.firebase.google.com/project/flyspark-cb85e/firestore/indexes

## 🎯 Verification Checklist

Before going live, verify:

- [ ] Email/Password authentication enabled
- [ ] Firestore database created
- [ ] Security rules published
- [ ] First admin user created
- [ ] Test user can register
- [ ] Test user can login
- [ ] Test order creation works
- [ ] Admin can access `/admin`
- [ ] Admin can create products
- [ ] Admin can view all orders
- [ ] Admin can manage user roles
- [ ] WhatsApp integration works
- [ ] Cart persists on page reload
- [ ] Protected routes redirect correctly

## 🚀 Ready to Launch!

Once all checks pass:
1. Import your real product catalog
2. Update WhatsApp business number
3. Test complete user journey
4. Deploy to production
5. Monitor Firestore usage in Console > Usage tab

---

**Need Help?**
- Firebase Support: https://firebase.google.com/support
- FlySpark Project Email: seminest015@gmail.com
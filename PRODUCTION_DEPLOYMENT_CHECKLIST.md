# 🚀 FLYSPARK PRODUCTION DEPLOYMENT CHECKLIST

**Project:** FlySpark B2B Product Catalog  
**Company:** ANUSHAKTI INFOTECH PVT. LTD.  
**Firebase Project:** flyspark-cb85e  
**Storage:** gs://flyspark-cb85e.firebasestorage.app

---

## ✅ PHASE 1: FIREBASE CONFIGURATION (30 minutes)

### 1.1 Firebase Authentication ✓
- [ ] Go to: https://console.firebase.google.com/project/flyspark-cb85e/authentication
- [ ] Enable **Email/Password** sign-in method
- [ ] Click "Email/Password" → Enable → Save
- [ ] **Status:** Should show "Enabled" ✅

### 1.2 Firestore Database ✓
- [ ] Go to: https://console.firebase.google.com/project/flyspark-cb85e/firestore
- [ ] If not created, click "Create Database"
- [ ] Select **Production Mode**
- [ ] Choose location: **asia-south1** (Mumbai) or nearest to Gujarat
- [ ] Wait for database to initialize

### 1.3 Firestore Security Rules ✓ CRITICAL
- [ ] Go to Firestore → Rules tab
- [ ] Copy rules from `/FIRESTORE_SECURITY_RULES.txt`
- [ ] Paste into Firebase Console
- [ ] **Click "Publish"** (MUST DO THIS!)
- [ ] Wait 30 seconds for deployment
- [ ] Verify: Rules should show "Last deployed" timestamp

### 1.4 Firebase Storage ✓
- [ ] Go to: https://console.firebase.google.com/project/flyspark-cb85e/storage
- [ ] Click "Get Started" if not initialized
- [ ] Select **Production Mode**
- [ ] Choose same location as Firestore
- [ ] Apply Storage Rules from `/FIREBASE_STORAGE_SETUP.md`
- [ ] **Click "Publish"** rules

### 1.5 Upload Payment QR Code ✓ IMPORTANT
- [ ] Go to Storage → Files
- [ ] Create folder: `/payment/`
- [ ] Upload your payment QR code as `qr-code.png`
- [ ] Click on file → Copy download URL
- [ ] **Save this URL** (needed for Step 3.2)

**Example URL:**
```
https://firebasestorage.googleapis.com/v0/b/flyspark-cb85e.firebasestorage.app/o/payment%2Fqr-code.png?alt=media&token=abc123...
```

---

## ✅ PHASE 2: CREATE ADMIN ACCOUNT (10 minutes)

### 2.1 Register First Admin User
- [ ] Run the application locally: `npm run dev`
- [ ] Go to: http://localhost:5173/register
- [ ] Register with:
  - **Email:** admin@anushakti.com (or your preferred admin email)
  - **Password:** [Strong password - save it securely!]
  - **Name:** Admin
- [ ] Check console for User UID (copy this!)

### 2.2 Set Admin Role in Firestore
- [ ] Go to Firestore Database in Firebase Console
- [ ] Navigate to: `users` collection
- [ ] Find your user document (click on the UID)
- [ ] Edit the document:
  - Field: `role`
  - Change from: `"customer"`
  - Change to: `"admin"`
- [ ] Click "Update"

### 2.3 Verify Admin Access
- [ ] Log out from the application
- [ ] Log back in with admin credentials
- [ ] Navigate to: http://localhost:5173/admin
- [ ] You should see the Admin Dashboard ✅

---

## ✅ PHASE 3: CONFIGURE SYSTEM SETTINGS (15 minutes)

### 3.1 Company Settings
- [ ] Go to: `/admin/settings`
- [ ] Verify Company Information:
  ```
  Company Name: ANUSHAKTI INFOTECH PVT. LTD.
  Address: E-317, Siddhraj Z-Square, Podar International School Road, 
           Kudasan, Gandhinagar, Gujarat - 382421, India
  GST Number: 24ABCCA1331J1Z5
  IEC Code: ABCCA1331J
  ```

### 3.2 Contact Details
- [ ] Update/Verify:
  ```
  WhatsApp: +91-9461785001
  Support Email: contact@anushakti.com (or your preferred email)
  ```

### 3.3 Payment Information
- [ ] Verify Bank Details:
  ```
  Account Name: ANUSHAKTI INFOTECH PVT. LTD.
  Account Number: 63773716130
  IFSC Code: IDFB0040303
  UCIC: 6583633571
  Bank Name: IDFC FIRST Bank
  UPI ID: anushaktiinfotech@idfcbank
  ```
- [ ] **Paste Payment QR Code URL** (from Step 1.5)
- [ ] Click **"Save Settings"**

### 3.4 Optional: Upload Company Logo
- [ ] Upload your logo to Firebase Storage → `/logos/company-logo.png`
- [ ] Copy download URL
- [ ] Paste in Admin Settings → "Logo URL"
- [ ] Save and verify logo appears in header

---

## ✅ PHASE 4: CREATE PRODUCT CATALOG (30-60 minutes)

### 4.1 Create Categories
- [ ] Go to: `/admin/categories`
- [ ] Click "Add Category"
- [ ] Create your product categories (e.g., Electronics, Components, etc.)
- [ ] Upload category images to Storage first, then paste URLs

### 4.2 Add Products
- [ ] Go to: `/admin/products`
- [ ] Click "Add Product"
- [ ] Fill in product details:
  - Name, SKU, Category
  - Description, Specifications
  - Product Type: Simple or Variable
  - Stock Status
  - Images (upload to Storage first)
  - YouTube video (optional)
- [ ] Save each product

### 4.3 Test Product Display
- [ ] Go to homepage: `/`
- [ ] Verify products display correctly
- [ ] Click on product → check detail page
- [ ] Test "Add to Cart" functionality
- [ ] Verify WhatsApp share works

---

## ✅ PHASE 5: DEPLOYMENT TO HOSTING (20 minutes)

### Option A: Firebase Hosting (Recommended)

#### 5.1 Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### 5.2 Login to Firebase
```bash
firebase login
```

#### 5.3 Initialize Firebase Hosting
```bash
firebase init hosting
```

**Select:**
- [ ] Use existing project: `flyspark-cb85e`
- [ ] Public directory: `dist`
- [ ] Configure as single-page app: **Yes**
- [ ] Set up automatic builds: **No** (for now)
- [ ] Don't overwrite `dist/index.html` if asked

#### 5.4 Build Production App
```bash
npm run build
```

#### 5.5 Deploy to Firebase
```bash
firebase deploy --only hosting
```

#### 5.6 Get Your Live URL
After deployment, you'll get:
```
✔ Deploy complete!

Hosting URL: https://flyspark-cb85e.web.app
```

- [ ] **Save this URL** - This is your live website!
- [ ] Open URL in browser and test

### Option B: Vercel (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set framework preset to "Vite"
# - Done!
```

### Option C: Netlify (Alternative)

1. Go to: https://app.netlify.com/
2. Drag and drop your `/dist` folder
3. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy!

---

## ✅ PHASE 6: POST-DEPLOYMENT VERIFICATION (15 minutes)

### 6.1 Test Complete User Flow
- [ ] **Homepage:** Products load correctly
- [ ] **Categories:** Category pages work
- [ ] **Search:** Search functionality works
- [ ] **Product Detail:** All product info displays
- [ ] **Add to Cart:** Cart adds items
- [ ] **Checkout:** Form validation works
- [ ] **WhatsApp Order:** Opens WhatsApp with order details
- [ ] **Payment Details Page:** `/payment-details` shows QR code

### 6.2 Test Authentication
- [ ] Register new customer account
- [ ] Login/Logout works
- [ ] Profile page shows orders
- [ ] Admin dashboard (admin only)

### 6.3 Test Mobile Responsiveness
- [ ] Open on mobile device
- [ ] Bottom navigation works
- [ ] All pages are mobile-friendly
- [ ] Cart, checkout mobile-optimized

### 6.4 Test Admin Functions
- [ ] Add new product
- [ ] Edit existing product
- [ ] Add category
- [ ] View orders
- [ ] Update settings

### 6.5 Performance Check
- [ ] Run Lighthouse audit (Right-click → Inspect → Lighthouse)
- [ ] Target scores:
  - Performance: > 85
  - Accessibility: > 90
  - Best Practices: > 90
  - SEO: > 90

---

## ✅ PHASE 7: FINAL PRODUCTION SETUP

### 7.1 Configure Custom Domain (Optional)
- [ ] Go to Firebase Console → Hosting → Add Custom Domain
- [ ] Follow instructions to:
  - Add DNS records at your domain registrar
  - Verify domain ownership
  - Wait for SSL certificate (automatic)

**For flyspark.in:**
1. Add A record: `185.199.108.153`
2. Add TXT record for verification
3. Wait 24-48 hours for propagation

### 7.2 Set Up Monitoring
- [ ] Go to Firebase Console → Performance
- [ ] Enable Performance Monitoring
- [ ] Add to your app (already included in SDK)

### 7.3 Configure Email for Orders
- [ ] Set up email forwarding for `contact@anushakti.com`
- [ ] Test email delivery
- [ ] Add to spam whitelist if needed

### 7.4 Backup Strategy
- [ ] Go to Firestore → Backups
- [ ] Enable automatic backups (if on Blaze plan)
- [ ] Or schedule manual exports

### 7.5 Security Checklist
- [ ] ✅ Firestore rules deployed
- [ ] ✅ Storage rules deployed
- [ ] ✅ Admin role properly set
- [ ] ✅ No API keys exposed in code
- [ ] ✅ CORS configured
- [ ] ✅ HTTPS enabled (automatic with Firebase/Vercel/Netlify)

---

## 🎯 CRITICAL ENVIRONMENT VARIABLES

Create `.env.production` file with your Firebase config:

```env
# ALREADY IN /src/lib/firebase.ts
# Just verify these match your Firebase project

VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=flyspark-cb85e.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=flyspark-cb85e
VITE_FIREBASE_STORAGE_BUCKET=flyspark-cb85e.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

**Note:** These are already configured in your Firebase setup. No changes needed unless you're using environment variables.

---

## 🔥 COMMON ISSUES & FIXES

### Issue 1: "Permission Denied" in Firestore
**Fix:** Deploy security rules (Phase 1.3)

### Issue 2: Images not loading
**Fix:** Check Storage rules are published + CORS configured

### Issue 3: Admin panel not accessible
**Fix:** Set user role to "admin" in Firestore (Phase 2.2)

### Issue 4: WhatsApp link not working
**Fix:** Verify WhatsApp number format: `+91-9461785001` (include country code)

### Issue 5: Build fails
**Fix:** 
```bash
rm -rf node_modules
npm install
npm run build
```

---

## 📊 PRODUCTION READINESS SCORE

Check all boxes above. You should have:
- [x] 100% Firebase configured
- [x] 100% Admin account created
- [x] 100% Company settings saved
- [x] 100% Products added
- [x] 100% Application deployed
- [x] 100% Testing complete

**When all boxes are checked: 🎉 YOU ARE LIVE! 🎉**

---

## 🆘 SUPPORT & RESOURCES

- **Firebase Console:** https://console.firebase.google.com/project/flyspark-cb85e
- **Firestore Rules:** See `/FIRESTORE_SECURITY_RULES.txt`
- **Storage Setup:** See `/FIREBASE_STORAGE_SETUP.md`
- **Firebase Docs:** https://firebase.google.com/docs
- **Deployment Docs:** See `/DEPLOYMENT.md`

---

## 📞 FINAL STEPS

1. **Test with Real Customer:**
   - Share live URL with a colleague
   - Have them place a test order
   - Verify WhatsApp message received

2. **Go Live Announcement:**
   - Update flyspark.in DNS (if using custom domain)
   - Announce on social media
   - Send to distributors/dealers

3. **Monitor First Week:**
   - Check Firebase Console → Analytics
   - Review orders in Admin Dashboard
   - Collect customer feedback

---

## ✅ YOU'RE DONE!

Your FlySpark B2B Catalog is now:
- ✅ Fully configured with Firebase
- ✅ ANUSHAKTI INFOTECH branding
- ✅ Payment details integrated
- ✅ Deployed and live
- ✅ Production-ready
- ✅ Mobile-optimized
- ✅ Secure and scalable

**Live URL:** https://flyspark-cb85e.web.app (or your custom domain)

🚀 **Congratulations on launching FlySpark!** 🚀

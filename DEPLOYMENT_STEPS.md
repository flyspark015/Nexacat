# 🚀 DEPLOYMENT STEPS - FLYSPARK

**Company:** ANUSHAKTI INFOTECH PVT. LTD.  
**Firebase Project:** flyspark-cb85e  
**Storage:** gs://flyspark-cb85e.firebasestorage.app

---

## ⚡ FASTEST PATH TO PRODUCTION (1 hour)

Follow these steps in exact order:

---

## STEP 1: FIREBASE CONFIGURATION (15 min)

### 1.1 Deploy Firestore Security Rules ⭐ CRITICAL
```bash
# Open Firebase Console
https://console.firebase.google.com/project/flyspark-cb85e/firestore/rules

# Copy ALL content from: /FIRESTORE_SECURITY_RULES.txt
# Paste into Firebase Console
# Click "Publish"
# Wait 30 seconds
```

**✅ Verify:** Rules tab shows "Last deployed: Just now"

### 1.2 Deploy Storage Security Rules
```bash
# Open Storage Rules
https://console.firebase.google.com/project/flyspark-cb85e/storage/rules

# Paste these rules:
```

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read for all files
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Only admins can write
    match /{allPaths=**} {
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
```

```bash
# Click "Publish"
```

### 1.3 Enable Authentication
```bash
# Open Authentication
https://console.firebase.google.com/project/flyspark-cb85e/authentication

# Click "Get Started" (if needed)
# Click "Email/Password"
# Toggle "Enable"
# Click "Save"
```

**✅ Verify:** Email/Password shows "Enabled"

### 1.4 Upload Payment QR Code ⭐ IMPORTANT
```bash
# Open Storage
https://console.firebase.google.com/project/flyspark-cb85e/storage

# Click "Upload File"
# Create folder: payment
# Upload your QR code as: qr-code.png
# Click on uploaded file
# Copy the download URL (looks like):
# https://firebasestorage.googleapis.com/v0/b/flyspark-cb85e...
```

**💾 SAVE THIS URL - You'll need it in Step 3!**

---

## STEP 2: CREATE ADMIN ACCOUNT (10 min)

### 2.1 Run App Locally
```bash
npm install
npm run dev
```

Open: http://localhost:5173

### 2.2 Register Admin
```bash
# Click "Register" or go to /register
# Fill in:
Email: admin@anushakti.com  # Or your email
Password: [Create strong password]
Name: Admin

# Click Register
# You're now logged in as a customer (we'll fix this!)
```

### 2.3 Upgrade to Admin Role ⭐ CRITICAL
```bash
# Open Firestore Database
https://console.firebase.google.com/project/flyspark-cb85e/firestore/data

# Click on "users" collection
# Find your user document (by email)
# Click to open document
# Find field: role
# Click on "customer"
# Change to: admin
# Click Update
```

### 2.4 Verify Admin Access
```bash
# Log out from app
# Log back in with your admin credentials
# Navigate to: http://localhost:5173/admin
```

**✅ Verify:** You see the Admin Dashboard with stats

---

## STEP 3: CONFIGURE COMPANY SETTINGS (10 min)

### 3.1 Open Admin Settings
```bash
# While logged in as admin:
http://localhost:5173/admin/settings
```

### 3.2 Verify Company Information
All these should be pre-filled:

```
COMPANY DETAILS:
✓ Company Name: ANUSHAKTI INFOTECH PVT. LTD.
✓ GST Number: 24ABCCA1331J1Z5
✓ IEC Code: ABCCA1331J
✓ Address: E-317, Siddhraj Z-Square, Podar International School Road,
           Kudasan, Gandhinagar, Gujarat - 382421, India

CONTACT:
✓ WhatsApp: +91-9461785001
✓ Support Email: contact@anushakti.com

PAYMENT:
✓ Bank Account: 63773716130
✓ Account Name: ANUSHAKTI INFOTECH PVT. LTD.
✓ IFSC Code: IDFB0040303
✓ UCIC: 6583633571
✓ Bank Name: IDFC FIRST Bank
✓ UPI ID: anushaktiinfotech@idfcbank
```

### 3.3 Add Payment QR Code URL
```bash
# Scroll to "Payment Information" section
# Find: "Payment QR Code URL"
# Paste the URL from Step 1.4
# Click "Save Settings"
```

**✅ Verify:** Settings saved successfully message appears

### 3.4 Test Payment Page
```bash
# Open in new tab:
http://localhost:5173/payment-details

# You should see:
✓ Company details
✓ Bank account info
✓ UPI ID
✓ Payment QR code image
```

---

## STEP 4: ADD SAMPLE CONTENT (10 min) - Optional

### 4.1 Create First Category
```bash
# Go to: http://localhost:5173/admin/categories
# Click "Add Category"
# Fill in:
Name: Electronics
Slug: electronics  # Auto-generated
Image: [Upload to Storage first or use placeholder]
# Click Save
```

### 4.2 Add First Product
```bash
# Go to: http://localhost:5173/admin/products
# Click "Add Product"
# Fill in:
Name: Sample Product
SKU: PROD-001
Category: Electronics
Product Type: Simple
Price: 1000
Description: Test product
Stock Status: In Stock
# Click Save
```

### 4.3 Test Frontend
```bash
# Go to: http://localhost:5173
# You should see your product on homepage
# Click on it to view details
```

---

## STEP 5: DEPLOY TO PRODUCTION (15 min)

### 5.1 Build Production Version
```bash
# Make sure you're in project root
npm run build
```

**✅ Verify:** `dist/` folder is created with production files

### 5.2 Install Firebase CLI (First Time Only)
```bash
npm install -g firebase-tools
```

### 5.3 Login to Firebase
```bash
firebase login
```

This opens your browser for authentication.

### 5.4 Initialize Firebase Hosting (First Time Only)
```bash
firebase init hosting
```

**Answer these questions:**
```
? What do you want to use as your public directory? 
→ dist

? Configure as a single-page app (rewrite all urls to /index.html)? 
→ Yes

? Set up automatic builds and deploys with GitHub? 
→ No

? File dist/index.html already exists. Overwrite? 
→ No
```

### 5.5 Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

Wait for deployment (~2-3 minutes)

### 5.6 Get Your Live URL! 🎉

After successful deployment:
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/flyspark-cb85e
Hosting URL: https://flyspark-cb85e.web.app
```

**🌐 YOUR LIVE WEBSITE:** https://flyspark-cb85e.web.app

---

## STEP 6: POST-DEPLOYMENT TESTING (10 min)

### 6.1 Test Public Features
Open: https://flyspark-cb85e.web.app

- [ ] Homepage loads
- [ ] Products display
- [ ] Search works
- [ ] Category pages work
- [ ] Product detail pages work
- [ ] Add to cart works
- [ ] Login/Register works

### 6.2 Test Payment Page
```bash
# Open: https://flyspark-cb85e.web.app/payment-details
```

- [ ] Company details show
- [ ] Bank account info displays
- [ ] UPI ID visible
- [ ] QR code image loads

### 6.3 Test Admin Panel
```bash
# Login with your admin account
# Go to: https://flyspark-cb85e.web.app/admin
```

- [ ] Admin dashboard loads
- [ ] Can view products
- [ ] Can view categories
- [ ] Settings page loads

### 6.4 Test Checkout Flow
```bash
# Add product to cart
# Go to cart → checkout
# Fill in details
# Click "Send Order on WhatsApp"
```

- [ ] WhatsApp opens with order details
- [ ] Order saved in Firebase
- [ ] Order visible in admin panel

### 6.5 Test Mobile
```bash
# Open site on mobile device
# Check bottom navigation
# Test all features
```

- [ ] Mobile responsive
- [ ] Bottom nav works
- [ ] All pages mobile-friendly

---

## ✅ YOU'RE LIVE!

### Your Production URLs:
- **Main Site:** https://flyspark-cb85e.web.app
- **Admin Panel:** https://flyspark-cb85e.web.app/admin
- **Payment Details:** https://flyspark-cb85e.web.app/payment-details

### Firebase Console:
- **Dashboard:** https://console.firebase.google.com/project/flyspark-cb85e
- **Firestore:** https://console.firebase.google.com/project/flyspark-cb85e/firestore
- **Storage:** https://console.firebase.google.com/project/flyspark-cb85e/storage
- **Authentication:** https://console.firebase.google.com/project/flyspark-cb85e/authentication
- **Hosting:** https://console.firebase.google.com/project/flyspark-cb85e/hosting

---

## 🔄 FUTURE DEPLOYMENTS

After making changes to your code:

```bash
# 1. Build new version
npm run build

# 2. Deploy
firebase deploy --only hosting

# That's it! ~2 minutes and you're live.
```

---

## 🌐 CUSTOM DOMAIN SETUP (Optional)

To use flyspark.in instead of flyspark-cb85e.web.app:

### Step 1: Add Domain in Firebase
```bash
# Go to: Firebase Console → Hosting → Add Custom Domain
# Enter: flyspark.in
# Click "Continue"
```

### Step 2: Verify Ownership
```bash
# Firebase will show a TXT record
# Add this to your domain's DNS settings at your registrar
# Wait for verification (can take 24 hours)
```

### Step 3: Connect Domain
```bash
# After verification, Firebase shows A records
# Add these A records to your DNS:
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

### Step 4: Wait for SSL
```bash
# Firebase auto-generates SSL certificate
# Takes 24-48 hours
# Your site will be live at: https://flyspark.in
```

---

## 📊 MONITORING & ANALYTICS

### View Site Traffic
```bash
# Firebase Console → Analytics
https://console.firebase.google.com/project/flyspark-cb85e/analytics
```

### Monitor Performance
```bash
# Firebase Console → Performance
https://console.firebase.google.com/project/flyspark-cb85e/performance
```

### Check Errors
```bash
# Browser Console (F12) → Console tab
# Look for any red errors
```

---

## 💰 COST ESTIMATION

**Firebase Free Tier (Spark Plan):**
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 1 GB storage
- ✅ 10 GB hosting/month
- ✅ 50,000 active users

**Expected for Small B2B Site:**
- 100-500 products
- 50-200 orders/month
- 1000-5000 page views/month

**Result: FREE for first 6-12 months** 🎉

When you outgrow free tier:
- **Blaze Plan:** Pay as you go
- Expected: **$5-20/month** for medium traffic

---

## 🆘 TROUBLESHOOTING

### Issue: "Permission Denied" errors
```bash
Fix: Deploy Firestore rules (Step 1.1)
Go to: Firestore → Rules → Publish
```

### Issue: Can't access admin panel
```bash
Fix: Set user role to "admin" (Step 2.3)
Go to: Firestore → users → [your-user] → role: "admin"
```

### Issue: Images not loading
```bash
Fix: Deploy Storage rules (Step 1.2)
Go to: Storage → Rules → Publish
```

### Issue: Payment QR code not showing
```bash
Fix: Add QR code URL in settings (Step 3.3)
Go to: Admin → Settings → Payment QR Code URL
```

### Issue: Build fails
```bash
# Clear and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Issue: WhatsApp not opening
```bash
Fix: Check WhatsApp number format
Should be: +91-9461785001 (with country code)
```

---

## 📚 ADDITIONAL RESOURCES

- **Full Deployment Guide:** `/PRODUCTION_DEPLOYMENT_CHECKLIST.md`
- **Quick Start:** `/QUICK_START_GUIDE.md`
- **Storage Setup:** `/FIREBASE_STORAGE_SETUP.md`
- **Firebase Docs:** https://firebase.google.com/docs

---

## ✅ DEPLOYMENT CHECKLIST

- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Authentication enabled
- [ ] Payment QR code uploaded
- [ ] Admin account created
- [ ] Admin role set in Firestore
- [ ] Company settings configured
- [ ] Payment QR URL added
- [ ] Production build successful
- [ ] Deployed to Firebase Hosting
- [ ] Live URL tested
- [ ] Mobile tested
- [ ] Payment page tested
- [ ] Admin panel tested
- [ ] Checkout flow tested

**When all checked: YOU'RE PRODUCTION READY! 🚀**

---

**Deployment completed by:** ANUSHAKTI INFOTECH PVT. LTD.  
**Live URL:** https://flyspark-cb85e.web.app  
**Firebase Project:** flyspark-cb85e  
**Version:** 1.0.0

🎊 **Congratulations on your successful deployment!** 🎊

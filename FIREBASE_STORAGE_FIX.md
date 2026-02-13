# 🔥 Firebase Storage Permission Fix

## Problem
You're getting `storage/unauthorized` errors when uploading category images because Firebase Storage security rules don't include the `categories` folder.

## Solution
Update Firebase Storage security rules to allow admin users to upload category images.

---

## 📋 Step-by-Step Fix Instructions

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **flyspark-cb85e**

### Step 2: Navigate to Storage Rules
1. Click **"Storage"** in the left sidebar
2. Click the **"Rules"** tab at the top

### Step 3: Update the Rules
1. **Delete all existing rules** in the editor
2. **Copy** the complete rules from `/FIREBASE_STORAGE_RULES.txt` in your project
3. **Paste** them into the Firebase Console editor
4. Click **"Publish"** button

### Step 4: Verify the Update
1. Look for the success message: "Rules published successfully"
2. The rules should now show:
   - `products/{fileName}` - Product images
   - `categories/{fileName}` - **Category images (NEW!)**
   - `logos/{fileName}` - Logo uploads
   - `favicons/{fileName}` - Favicon uploads
   - `payment/{fileName}` - Payment QR codes

---

## ✅ What Changed

### Added New Rules for:
- **Category Images** (`categories/{fileName}`)
- **Logos** (`logos/{fileName}`)
- **Favicons** (`favicons/{fileName}`)
- **Payment QR Codes** (`payment/{fileName}`)

### Security Model:
- ✅ **Read (Public)**: Anyone can view images
- ✅ **Write (Admin Only)**: Only authenticated admin users can upload/update/delete
- ✅ **File Validation**: Max 5MB, images only

---

## 🧪 Test After Deployment

1. **Login as Admin** in your FlySpark app
2. Go to **Admin → Categories**
3. Click **"Add Category"**
4. Try **uploading an image**
5. Should see: ✅ "Category created successfully!"

---

## 🚨 Troubleshooting

### Still getting permission errors?
1. **Verify you're logged in as admin**
   - Check user role in Firestore: `users/{userId}` → `role: "admin"`
2. **Clear browser cache** and reload
3. **Check Firebase Storage is enabled**
   - Go to Firebase Console → Storage
   - Make sure Storage is initialized
4. **Verify rules are published**
   - Check the "Rules" tab shows the updated rules

### Error: "get(/databases/...)" fails
This means the admin check is trying to read from Firestore. Make sure:
1. Firestore security rules allow reading user documents
2. Your user document exists with `role: "admin"`

---

## 📚 Related Files
- `/FIREBASE_STORAGE_RULES.txt` - Complete storage rules
- `/FIRESTORE_SECURITY_RULES.txt` - Firestore security rules
- `/src/app/lib/storageService.ts` - Storage upload service
- `/src/app/pages/admin/AdminCategoryForm.tsx` - Category form with upload

---

## 🎯 Summary

**Before**: Storage rules only covered `products` and `settings` folders
**After**: Storage rules cover all upload paths: products, categories, logos, favicons, payment QR codes

**Impact**: Category image uploads now work for admin users! 🎉

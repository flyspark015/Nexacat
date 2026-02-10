# 🔥 Firebase Security Rules Deployment Guide

## ⚠️ CRITICAL: Deploy Security Rules to Fix Permission Error

The error **"Missing or insufficient permissions"** means the Firestore security rules haven't been deployed yet.

---

## 📋 Quick Fix Steps

### Step 1: Open Firebase Console Rules Page
Go to: **Firebase Console > Firestore Database > Rules**

Or use this direct link:
```
https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore/rules
```

### Step 2: Copy the Security Rules
The complete security rules are in `/FIRESTORE_SECURITY_RULES.txt`

### Step 3: Paste and Publish

1. **Delete** all existing rules in the Firebase Console editor
2. **Copy** the entire contents of `/FIRESTORE_SECURITY_RULES.txt` 
3. **Paste** into the Firebase Console rules editor
4. Click **"Publish"** button

### Step 4: Wait for Deployment
- Rules typically deploy in 10-30 seconds
- You'll see a success message when complete

### Step 5: Refresh Your App
- Refresh the browser window
- The error should be gone!

---

## 🔍 What These Rules Do

```
Settings Collection:
✅ Everyone can READ settings (for logo, company name, etc.)
✅ Only ADMINS can CREATE/UPDATE settings
❌ NO ONE can DELETE settings

Users Collection:
✅ Everyone can READ user profiles
✅ Users can CREATE their own account
✅ Users can UPDATE their own profile (not role)
✅ Only ADMINS can change user roles
❌ NO ONE can DELETE users

Categories Collection:
✅ Everyone can READ categories
✅ Only ADMINS can CREATE/UPDATE/DELETE

Products Collection:
✅ Everyone can READ products
✅ Only ADMINS can CREATE/UPDATE/DELETE

Orders Collection:
✅ Customers can READ their own orders
✅ ADMINS can READ all orders
✅ Customers can CREATE orders
✅ Only ADMINS can UPDATE orders
❌ NO ONE can DELETE orders
```

---

## 🧪 Testing Rules

After deployment, test that:

1. ✅ **Settings load** - Logo and company name appear in header
2. ✅ **Products display** - Catalog pages show products
3. ✅ **Categories work** - Category navigation functions
4. ✅ **Admin panel** - Only admins can access admin pages

---

## 🚨 Common Issues

### Issue: "Rules are published but still getting errors"
**Solution:** 
- Wait 30-60 seconds for rules to propagate
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for specific error details

### Issue: "Cannot access admin features"
**Solution:**
- Verify your user document in Firestore has `role: "admin"`
- Path: `users/{your-uid}` should have field `role` = `admin`

### Issue: "Settings not loading"
**Solution:**
- Create the settings document manually in Firestore:
  - Collection: `settings`
  - Document ID: `app-settings`
  - Fields: `companyName`, `logoUrl`, `currency` (all optional)

---

## 📝 Quick Settings Document Setup

If settings document doesn't exist, create it in Firebase Console:

**Collection:** `settings`
**Document ID:** `app-settings`
**Fields:**
```
companyName: "FlySpark" (string)
currency: "INR" (string)
logoUrl: "" (string, optional)
```

---

## ✅ Verification Checklist

- [ ] Opened Firebase Console > Firestore Database > Rules
- [ ] Copied rules from `/FIRESTORE_SECURITY_RULES.txt`
- [ ] Pasted into Firebase Console editor
- [ ] Clicked "Publish" button
- [ ] Waited for deployment confirmation
- [ ] Refreshed browser
- [ ] Settings load without errors
- [ ] Created settings document if needed

---

## 🆘 Still Having Issues?

Check these:

1. **Firebase initialization:** Verify `/src/app/lib/firebase.ts` has correct config
2. **Internet connection:** Ensure you can reach Firebase servers
3. **Project ID:** Confirm you're in the correct Firebase project
4. **Browser console:** Look for specific error messages

---

## 📚 Related Files

- `/FIRESTORE_SECURITY_RULES.txt` - Complete security rules
- `/FIREBASE_CONSOLE_SETUP.md` - Initial Firebase setup guide
- `/FIREBASE_INTEGRATION_GUIDE.md` - Integration instructions
- `/src/app/lib/firebase.ts` - Firebase configuration

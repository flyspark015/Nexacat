# 🚨 FIX PERMISSION ERRORS - QUICK GUIDE

## ❌ Current Errors:
```
Error getting admin conversation: FirebaseError: [code=permission-denied]
Error getting AI settings: FirebaseError: [code=permission-denied]
Error getting AI usage: FirebaseError: [code=permission-denied]
```

## ✅ Solution (3 Minutes):

### 🔥 STEP 1: Open Firebase Console
```
https://console.firebase.google.com/
→ Select your project
→ Click "Firestore Database"
→ Click "Rules" tab
```

### 📝 STEP 2: Copy Complete Rules
**Open this file and copy all rules:**
👉 `/FIRESTORE_SECURITY_RULES.txt`

Or copy from section below ⬇️

### 📋 STEP 3: Replace Rules in Firebase
1. Select ALL text in Firebase Console editor
2. Delete it
3. Paste the new rules
4. Click "Publish" button

### ⏱️ STEP 4: Wait 10 Seconds
Rules take ~5-10 seconds to propagate

### 🔄 STEP 5: Refresh Your App
Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)

---

## 🎯 Quick Copy Rules (Copy Everything Below)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }
    
    match /users/{userId} {
      allow read: if true;
      allow create: if isAuthenticated() && 
                      request.auth.uid == userId &&
                      request.resource.data.role == 'customer';
      allow update: if isOwner(userId) && 
                      request.resource.data.role == resource.data.role;
      allow update: if isAdmin();
      allow delete: if false;
    }
    
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
      
      match /variations/{variationId} {
        allow read: if true;
        allow create, update, delete: if isAdmin();
      }
    }
    
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.customerUid);
      allow read: if isAdmin();
      allow create: if isAuthenticated() && 
                      request.auth.uid == request.resource.data.customerUid;
      allow update: if isAdmin();
      allow delete: if false;
    }
    
    match /settings/{settingId} {
      allow read: if true;
      allow create, update: if isAdmin();
      allow delete: if false;
    }
    
    match /faqs/{faqId} {
      allow read: if true;
      allow create: if true;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    match /contacts/{contactId} {
      allow read: if true;
      allow create, update: if true;
      allow delete: if isAdmin();
    }
    
    match /aiSettings/{adminId} {
      allow read: if isOwner(adminId) && isAdmin();
      allow create, update: if isOwner(adminId) && isAdmin();
      allow delete: if false;
    }
    
    match /aiTasks/{taskId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    match /productDrafts/{draftId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    match /aiConversations/{conversationId} {
      allow read: if isAdmin();
      allow create: if isAdmin() && request.resource.data.adminId == request.auth.uid;
      allow update: if isAdmin() && resource.data.adminId == request.auth.uid;
      allow delete: if isAdmin() && resource.data.adminId == request.auth.uid;
    }
    
    match /aiUsage/{usageId} {
      allow read: if isAdmin();
      allow create, update: if isAdmin();
      allow delete: if false;
    }
  }
}
```

---

## ✅ Checklist After Deployment:

- [ ] Rules deployed in Firebase Console
- [ ] "Publish" button clicked
- [ ] Waited 10 seconds
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Logged out and logged back in
- [ ] Verified user role is "admin" in Firestore

---

## 🔍 Verify Your Admin Role:

1. Go to Firebase Console
2. Firestore Database → Data tab
3. Open `users` collection
4. Find your user document
5. Check `role` field = **`"admin"`**
6. If it says "customer", click Edit and change to "admin"

---

## 🎉 After Fixing:

You should be able to:
✅ Access AI Assistant page
✅ Load conversations
✅ Configure AI settings
✅ Create product drafts
✅ Use all AI features

---

## 📞 Still Not Working?

**Most Common Issues:**

1. **Rules not deployed** → Click "Publish" in Firebase Console
2. **User not admin** → Update role in Firestore users collection
3. **Old cache** → Hard refresh browser (Ctrl+Shift+R)
4. **Not logged in** → Logout and login again

---

## ⚡ TL;DR (Too Long; Didn't Read):

1. Firebase Console → Firestore → Rules
2. Copy rules from `/FIRESTORE_SECURITY_RULES.txt`
3. Paste and click "Publish"
4. Refresh app
5. Done! 🎉

---

**Time**: 3 minutes  
**Difficulty**: Easy  
**Required**: Firebase Console access

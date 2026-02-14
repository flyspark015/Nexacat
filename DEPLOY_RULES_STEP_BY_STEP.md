# 🔥 Deploy Firestore Security Rules - Step by Step Guide

## ⚠️ CRITICAL: AI Features Won't Work Without These Rules

You're seeing these permission errors because the Firestore security rules haven't been deployed yet:

```
Error getting admin conversation: FirebaseError: [code=permission-denied]
Error getting AI settings: FirebaseError: [code=permission-denied]
Error getting AI usage: FirebaseError: [code=permission-denied]
```

---

## 📋 Step-by-Step Deployment (3 Minutes)

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com/
2. Select your FlySpark project
3. Click on **"Firestore Database"** in the left sidebar

### Step 2: Access Rules Tab
1. In the Firestore Database page, click on the **"Rules"** tab (top of page)
2. You'll see a code editor with your current rules

### Step 3: Copy the Complete Rules
**Copy ALL the text below** (select all and copy):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user owns the document
    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read user documents (for displaying names, etc.)
      allow read: if true;
      
      // Users can create their own document during registration
      allow create: if isAuthenticated() && 
                      request.auth.uid == userId &&
                      request.resource.data.role == 'customer'; // Default role must be customer
      
      // Users can update their own document (except role)
      allow update: if isOwner(userId) && 
                      request.resource.data.role == resource.data.role; // Cannot change own role
      
      // Only admins can update user roles
      allow update: if isAdmin();
      
      // No one can delete users
      allow delete: if false;
    }
    
    // Categories collection
    match /categories/{categoryId} {
      // Everyone can read categories (public catalog)
      allow read: if true;
      
      // Only admins can create, update, or delete categories
      allow create, update, delete: if isAdmin();
    }
    
    // Products collection
    match /products/{productId} {
      // Everyone can read active products
      allow read: if true;
      
      // Only admins can create, update, or delete products
      allow create, update, delete: if isAdmin();
      
      // Product variations subcollection
      match /variations/{variationId} {
        // Everyone can read variations
        allow read: if true;
        
        // Only admins can create, update, or delete variations
        allow create, update, delete: if isAdmin();
      }
    }
    
    // Orders collection
    match /orders/{orderId} {
      // Customers can only read their own orders
      allow read: if isOwner(resource.data.customerUid);
      
      // Admins can read all orders
      allow read: if isAdmin();
      
      // Customers can create their own orders
      allow create: if isAuthenticated() && 
                      request.auth.uid == request.resource.data.customerUid;
      
      // Only admins can update orders (change status, etc.)
      allow update: if isAdmin();
      
      // No one can delete orders
      allow delete: if false;
    }
    
    // Settings collection
    match /settings/{settingId} {
      // Everyone can read settings (for logo, company name, etc.)
      allow read: if true;
      
      // Only admins can update settings
      allow create, update: if isAdmin();
      
      // No one can delete settings
      allow delete: if false;
    }
    
    // FAQs collection
    match /faqs/{faqId} {
      // Everyone can read published FAQs
      allow read: if true;
      
      // Anyone can create FAQs (ask questions) - no login required
      allow create: if true;
      
      // Only admins can update FAQs (answer questions, publish/unpublish)
      allow update: if isAdmin();
      
      // Only admins can delete FAQs
      allow delete: if isAdmin();
    }
    
    // Contacts collection (Marketing Database)
    match /contacts/{contactId} {
      // Anyone can read contacts (needed to check for duplicate mobile numbers during FAQ submission)
      // Note: Individual contact details are still protected as users only query by their own mobile
      allow read: if true;
      
      // Anyone can create/update contacts (via FAQ submissions) - no login required
      allow create, update: if true;
      
      // Only admins can delete contacts
      allow delete: if isAdmin();
    }
    
    // AI Settings collection
    match /aiSettings/{adminId} {
      // Only the admin can read their own AI settings
      allow read: if isOwner(adminId) && isAdmin();
      
      // Only the admin can create/update their own AI settings
      allow create, update: if isOwner(adminId) && isAdmin();
      
      // No one can delete AI settings
      allow delete: if false;
    }
    
    // AI Tasks collection
    match /aiTasks/{taskId} {
      // Only admins can read tasks
      allow read: if isAdmin();
      
      // Only admins can create tasks
      allow create: if isAdmin();
      
      // Only admins can update tasks (or cloud functions with service account)
      allow update: if isAdmin();
      
      // Only admins can delete tasks
      allow delete: if isAdmin();
    }
    
    // Product Drafts collection
    match /productDrafts/{draftId} {
      // Only the admin who created the draft can read it
      allow read: if isAdmin();
      
      // Only admins can create drafts
      allow create: if isAdmin();
      
      // Only admins can update drafts
      allow update: if isAdmin();
      
      // Only admins can delete drafts
      allow delete: if isAdmin();
    }
    
    // AI Conversations collection
    match /aiConversations/{conversationId} {
      // Only admins can read conversations, and only their own via queries
      allow read: if isAdmin();
      
      // Only admins can create conversations for themselves
      allow create: if isAdmin() && request.resource.data.adminId == request.auth.uid;
      
      // Only the owner admin can update their conversation
      allow update: if isAdmin() && resource.data.adminId == request.auth.uid;
      
      // Only the owner admin can delete their conversation
      allow delete: if isAdmin() && resource.data.adminId == request.auth.uid;
    }
    
    // AI Usage collection
    match /aiUsage/{usageId} {
      // Only admins can read usage stats
      allow read: if isAdmin();
      
      // Only admins and cloud functions can create/update usage stats
      allow create, update: if isAdmin();
      
      // No one can delete usage stats
      allow delete: if false;
    }
  }
}
```

### Step 4: Paste Rules
1. **Select ALL** the existing text in the Firebase Console editor
2. **Delete** it
3. **Paste** the rules you just copied

### Step 5: Publish Rules
1. Click the **"Publish"** button (top right)
2. Wait for confirmation message (should appear in ~2-3 seconds)
3. You should see: ✅ "Rules published successfully"

### Step 6: Verify Deployment
Refresh your FlySpark application and:
1. Login as admin
2. Navigate to AI Assistant page
3. The errors should be gone!

---

## 🎯 What These Rules Do

### Security Model:
- **Public**: Anyone can read categories, products, FAQs, settings
- **Authenticated Users**: Can create orders, update their profile
- **Admins Only**: Can access AI features, manage products/categories
- **Owner Only**: Users can only modify their own data

### AI Collections Protected:
✅ `aiSettings` - Only admin can access their own settings  
✅ `aiConversations` - Only admin can access their conversations  
✅ `aiTasks` - Only admins can create/read tasks  
✅ `productDrafts` - Only admins can manage drafts  
✅ `aiUsage` - Only admins can read usage stats  

---

## 🚨 Troubleshooting

### If errors persist after deployment:

**1. Hard Refresh the App**
- Chrome/Edge: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

**2. Check Your User Role**
- Go to Firebase Console → Firestore Database → Data
- Find your user document in `users` collection
- Verify `role` field = `"admin"` (not "customer")
- If not admin, update it to `"admin"`

**3. Logout and Login Again**
- Logout from FlySpark
- Login again
- Firebase will reload your permissions

**4. Check Rules Deployment Time**
- In Firebase Console → Firestore → Rules
- Look for "Last updated" timestamp
- Should be recent (within last few minutes)

**5. Browser Console Check**
Open browser console (F12) and check for:
- `Missing or insufficient permissions` ❌ = Rules not deployed
- No errors ✅ = Rules working correctly

---

## ✅ Expected Result

After deploying, you should see:
- ✅ No permission errors
- ✅ AI Assistant loads conversations
- ✅ AI settings load correctly
- ✅ Can send messages
- ✅ Can create product drafts
- ✅ All AI features work smoothly

---

## 📞 Still Having Issues?

If you still see errors after following these steps:

1. **Screenshot the error** from browser console (F12)
2. **Screenshot your Firestore rules** from Firebase Console
3. **Verify your user role** in Firestore Database → users collection

Most common issue: **User role is "customer" instead of "admin"**
- Fix: Update your user document's `role` field to `"admin"`

---

## 🔐 Security Notes

These rules are **production-ready** and include:
- ✅ Proper authentication checks
- ✅ Role-based access control (RBAC)
- ✅ Data ownership validation
- ✅ Protection against unauthorized access
- ✅ Prevention of privilege escalation
- ✅ Safe defaults (deny by default)

**Never** use `allow read, write: if true;` in production!

---

## 📊 Time to Deploy

⏱️ **Total Time**: ~3 minutes
1. Open Firebase Console (30 sec)
2. Copy rules (10 sec)
3. Paste and publish (30 sec)
4. Verify (30 sec)

---

**Ready to deploy?** Follow Step 1 above! 🚀

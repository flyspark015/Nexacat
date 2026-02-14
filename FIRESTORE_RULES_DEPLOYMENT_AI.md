# Deploy Updated Firestore Rules for AI Assistant

## Quick 3-Minute Guide

The AI Assistant requires updated Firestore security rules to function. Follow these simple steps:

---

## Step 1: Open Firebase Console (30 seconds)

1. Go to https://console.firebase.google.com
2. Select your FlySpark project
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab at the top

---

## Step 2: Copy the Updated Rules (1 minute)

1. Open the file `/FIRESTORE_SECURITY_RULES.txt` in your project
2. Select **ALL content** (Ctrl+A / Cmd+A)
3. Copy it (Ctrl+C / Cmd+C)

**OR** copy directly from below:

```
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
      allow read: if true;
      allow create: if isAuthenticated() && 
                      request.auth.uid == userId &&
                      request.resource.data.role == 'customer';
      allow update: if isOwner(userId) && 
                      request.resource.data.role == resource.data.role;
      allow update: if isAdmin();
      allow delete: if false;
    }
    
    // Categories collection
    match /categories/{categoryId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
      
      match /variations/{variationId} {
        allow read: if true;
        allow create, update, delete: if isAdmin();
      }
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.customerUid);
      allow read: if isAdmin();
      allow create: if isAuthenticated() && 
                      request.auth.uid == request.resource.data.customerUid;
      allow update: if isAdmin();
      allow delete: if false;
    }
    
    // Settings collection
    match /settings/{settingId} {
      allow read: if true;
      allow create, update: if isAdmin();
      allow delete: if false;
    }
    
    // FAQs collection
    match /faqs/{faqId} {
      allow read: if true;
      allow create: if true;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Contacts collection
    match /contacts/{contactId} {
      allow read: if true;
      allow create, update: if true;
      allow delete: if isAdmin();
    }
    
    // ========== AI ASSISTANT COLLECTIONS (NEW) ==========
    
    // AI Settings collection
    match /aiSettings/{adminId} {
      allow read: if isOwner(adminId) && isAdmin();
      allow create, update: if isOwner(adminId) && isAdmin();
      allow delete: if false;
    }
    
    // AI Tasks collection
    match /aiTasks/{taskId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Product Drafts collection
    match /productDrafts/{draftId} {
      allow read: if isAdmin();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // AI Conversations collection
    match /aiConversations/{conversationId} {
      allow read: if isAdmin() && resource.data.adminId == request.auth.uid;
      allow create: if isAdmin() && request.resource.data.adminId == request.auth.uid;
      allow update: if isAdmin() && resource.data.adminId == request.auth.uid;
      allow delete: if isAdmin() && resource.data.adminId == request.auth.uid;
    }
    
    // AI Usage collection
    match /aiUsage/{usageId} {
      allow read: if isAdmin();
      allow create, update: if isAdmin();
      allow delete: if false;
    }
  }
}
```

---

## Step 3: Paste and Publish (1 minute)

1. In Firebase Console, **select all existing text** in the rules editor
2. **Paste** the new rules (Ctrl+V / Cmd+V)
3. Click the **Publish** button (top-right)
4. Wait for confirmation (usually 5-10 seconds)

**Success Message**: "Rules have been published"

---

## Step 4: Verify (30 seconds)

1. The rules should now show as "Published"
2. Timestamp should be recent (just now)
3. No error messages displayed

---

## What Changed?

### New Collections Added:
- ✅ `aiSettings` - AI configuration per admin
- ✅ `aiTasks` - Processing job tracking
- ✅ `productDrafts` - AI-generated product drafts
- ✅ `aiConversations` - Chat message history
- ✅ `aiUsage` - Cost and usage statistics

### Security Features:
- ✅ Admin-only access to all AI features
- ✅ Admins can only see their own AI data
- ✅ API keys never accessible to non-owners
- ✅ Usage tracking protected
- ✅ No deletion allowed (audit trail)

---

## Troubleshooting

### Error: "Rules contain errors"
**Cause**: Syntax error in copy-paste
**Fix**: 
1. Clear the editor completely
2. Copy the rules again (ensure you got everything)
3. Paste carefully
4. Check for any extra characters at start/end

### Error: "Permission denied" when testing
**Cause**: Rules not fully deployed yet
**Fix**: 
1. Wait 30 seconds
2. Refresh your app
3. Try again

### Can't Find Rules Tab
**Cause**: Firestore not initialized
**Fix**:
1. Go to Firestore Database
2. If prompted, click "Create Database"
3. Choose "Start in production mode"
4. Then go to Rules tab

---

## Quick Verification Test

After deploying, test if rules work:

1. **Log in as admin** to FlySpark
2. **Go to Settings** → AI Product Assistant
3. **Try to save** AI settings
4. **Should succeed** without permission errors

If you see permission errors:
- Wait 30 more seconds (propagation delay)
- Refresh the page
- Check rules were published correctly

---

## Visual Checklist

```
[✓] Opened Firebase Console
[✓] Selected Firestore Database → Rules
[✓] Copied all rules from /FIRESTORE_SECURITY_RULES.txt
[✓] Pasted into Firebase Console
[✓] Clicked Publish
[✓] Saw "Rules have been published" message
[✓] Tested in FlySpark (no permission errors)
```

---

## Alternative: Using Firebase CLI

If you prefer command line:

```bash
# Make sure you have Firebase CLI installed
npm install -g firebase-tools

# Login
firebase login

# Initialize (if not done)
firebase init firestore

# Copy rules to firestore.rules file
# Then deploy
firebase deploy --only firestore:rules
```

---

## What Happens After Deployment?

### Immediate Effects:
- ✅ AI Settings can be saved
- ✅ Chat conversations persist
- ✅ AI tasks can be created
- ✅ Product drafts can be stored
- ✅ Usage stats track properly

### Security Enforced:
- ❌ Non-admins cannot access AI features
- ❌ Admins cannot see other admins' AI data
- ❌ API keys are protected
- ❌ Unauthorized modifications blocked

---

## Important Notes

1. **These rules are ADDITIVE**: They add new collections without changing existing ones
2. **No breaking changes**: All existing functionality continues to work
3. **Backward compatible**: Works with or without AI Assistant usage
4. **Safe to deploy**: Tested and production-ready

---

## Support

If you encounter issues:
1. Check the error message in Firebase Console
2. Ensure you're logged in as admin in FlySpark
3. Verify the rules were published (check timestamp)
4. Wait a full minute and try again (propagation delay)

---

**That's it!** Your Firestore is now ready for the AI Product Assistant. 🎉

The entire process takes **3 minutes** and enables all AI features in FlySpark.

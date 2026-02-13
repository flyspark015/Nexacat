# FAQ System Setup - Firebase Rules Update Required

## 🚨 IMPORTANT: Update Firestore Security Rules

The FAQ system has been added, but you need to update your Firestore security rules to allow access to the new collections.

### Quick Fix (5 minutes)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project: **flyspark-cb85e**

2. **Navigate to Firestore Rules**
   - Click **Firestore Database** in left sidebar
   - Click **Rules** tab at the top

3. **Update Rules**
   - See the updated rules in `/FIRESTORE_SECURITY_RULES.txt`
   - Copy the entire content from that file
   - **Replace all existing rules** in the Firebase Console editor
   - Click **Publish** button
   - Wait for "Rules published successfully" confirmation

### What Changed?

Two new collections have been added:

#### 1. FAQs Collection (`/faqs/{faqId}`)
- **Read**: Everyone can read (public FAQs)
- **Create**: Anyone can ask questions (no login required!)
- **Update**: Only admins can answer/publish
- **Delete**: Only admins can delete

#### 2. Contacts Collection (`/contacts/{contactId}`)
- **Read**: Only admins
- **Create/Update**: Anyone (for FAQ submissions, no login required)
- **Delete**: Only admins

### New Rules Added:

```javascript
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
  // Only admins can read contacts
  allow read: if isAdmin();
  
  // Anyone can create/update contacts (via FAQ submissions) - no login required
  allow create, update: if true;
  
  // Only admins can delete contacts
  allow delete: if isAdmin();
}
```

## Verify It's Working

1. **User Side**:
   - Navigate to any product page
   - Scroll to the FAQ section at the bottom
   - You should see "Product Questions & Answers" section
   - Click "Ask a Question" and submit a test question
   - Should show success message

2. **Admin Side**:
   - Login as admin
   - Navigate to Admin Panel → FAQs
   - Should see the test question in "Pending" status
   - Click Edit, add an answer, and click "Save & Publish"
   - Go back to the product page
   - Your answered FAQ should now be visible

## Features Overview

### User Features:
- ✅ View all published FAQs for each product
- ✅ Ask questions with name and mobile number
- ✅ See question submission confirmation
- ✅ Clean, modern UI matching your B2B theme

### Admin Features:
- ✅ View all pending and answered FAQs
- ✅ Filter by status, product, or search keywords
- ✅ Answer questions inline
- ✅ Publish/unpublish FAQs
- ✅ Delete inappropriate questions
- ✅ Track customer contact information

### Marketing Database:
- ✅ Automatic contact deduplication (same mobile = same contact)
- ✅ Track first seen and last seen dates
- ✅ Monitor related products per contact
- ✅ Count total questions per customer
- ✅ Available for future marketing campaigns

## Troubleshooting

**Error: "Missing or insufficient permissions"**
- Solution: Update Firestore rules as described above

**FAQs not showing on product page**
- Ensure FAQ is marked as "Answered" AND "Published" in admin panel
- Check that the FAQ is linked to the correct product

**Can't submit questions as guest**
- Currently requires authentication
- To allow guest questions, you can modify the ProductFAQ component

## Need Help?

If you encounter any issues:
1. Check browser console for detailed error messages
2. Verify Firebase rules are published correctly
3. Ensure you're logged in with proper permissions
4. Check that collections "faqs" and "contacts" exist in Firestore
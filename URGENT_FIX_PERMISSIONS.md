# 🚨 URGENT: Fix Permission Denied Error

## The Error You're Seeing:
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

## Why It's Happening:
The FAQ and Contact collections are new, but your Firebase security rules don't know about them yet.

## How to Fix (2 Minutes):

### Step 1: Open Firebase Console
Go to: **https://console.firebase.google.com/**

### Step 2: Navigate to Rules
1. Select your project: **flyspark-cb85e**
2. Click **Firestore Database** (left sidebar)
3. Click **Rules** tab (top of page)

### Step 3: Copy New Rules
Open the file `/FIRESTORE_SECURITY_RULES.txt` in this project and copy ALL the content.

### Step 4: Replace & Publish
1. **Select all text** in the Firebase Console rules editor
2. **Delete it**
3. **Paste** the new rules from `/FIRESTORE_SECURITY_RULES.txt`
4. Click **Publish** button
5. Wait for "✅ Rules published successfully"

## That's It!

The error should be gone immediately. Refresh your browser and:

1. **Navigate to any product page** → Scroll down → See FAQ section
2. **Click "Ask a Question"** → Fill form → Submit → Success!
3. **Go to Admin Panel** → Click **FAQs** → See your question listed

---

## What Got Added to Rules:

Two new sections at the bottom:

```javascript
// FAQs collection
match /faqs/{faqId} {
  allow read: if true;              // Everyone can read FAQs
  allow create: if true;             // Anyone can ask questions
  allow update: if isAdmin();        // Only admins can answer
  allow delete: if isAdmin();        // Only admins can delete
}

// Contacts collection (Marketing Database)
match /contacts/{contactId} {
  allow read: if isAdmin();          // Only admins can view
  allow create, update: if true;     // Anyone can create (via FAQ)
  allow delete: if isAdmin();        // Only admins can delete
}
```

---

## Still Getting Errors?

**Double-check:**
- [ ] Rules are published (not just saved as draft)
- [ ] You copied the ENTIRE content from `/FIRESTORE_SECURITY_RULES.txt`
- [ ] The rules start with `rules_version = '2';`
- [ ] You refreshed your browser after publishing

**Common Mistakes:**
- Forgetting to click "Publish" button
- Only copying part of the rules
- Having a typo in the rules (copy-paste avoids this!)

---

## Technical Details (Optional Reading)

The FAQ system creates two Firestore collections:

1. **`/faqs`** - Stores questions and answers
   - Fields: productId, question, answer, status, askedBy, mobile, contactId, timestamps, isPublished

2. **`/contacts`** - Marketing database of customers
   - Fields: name, mobile, firstSeen, lastSeen, relatedProducts[], totalQuestions
   - Auto-deduplicates by mobile number

Without the security rules, Firestore blocks all access to these collections by default (secure by design).

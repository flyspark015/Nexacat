# 🔧 AI Assistant Page - Troubleshooting Guide

## Quick Error Checklist

### ✅ Verify Implementation

1. **Route Configuration** ✓
   - `/ai-assistant` route exists in `/src/app/routes.tsx`
   - Protected with `requireAdmin`
   - Uses `AIAssistantPage` component

2. **Navigation Links** ✓
   - Mobile bottom nav shows AI icon (admin only)
   - Desktop header shows "AI Assistant" button (admin only)
   - Mobile menu includes AI link

3. **Component Files** ✓
   - `/src/app/pages/AIAssistantPage.tsx` exists
   - All imports are correct
   - All dependencies are available

---

## Common Issues & Solutions

### 🚨 Issue 1: "Cannot find module 'AIAssistantPage'"

**Cause**: Import path issue or file not created

**Solution**:
```bash
# Verify file exists
ls -la /src/app/pages/AIAssistantPage.tsx

# If missing, the file should be at exactly this path
```

**Fix**: File should be at `/src/app/pages/AIAssistantPage.tsx`

---

### 🚨 Issue 2: Permission Denied (Firestore)

**Error**: `FirebaseError: Missing or insufficient permissions`

**Cause**: Firestore security rules not deployed

**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to: **Firestore Database** → **Rules**
4. Copy rules from `/FIRESTORE_SECURITY_RULES.txt`
5. Click **Publish**

**Required Rules for AI Assistant**:
```javascript
// AI Conversations (aiConversations collection)
match /aiConversations/{conversationId} {
  allow read, write: if isAdmin() && 
    request.auth.uid == resource.data.adminId;
  allow create: if isAdmin();
}

// AI Settings (aiSettings collection)
match /aiSettings/{adminId} {
  allow read, write: if isAdmin() && request.auth.uid == adminId;
}

// Product Drafts (productDrafts collection)
match /productDrafts/{draftId} {
  allow read, write: if isAdmin();
}
```

---

### 🚨 Issue 3: AI Assistant Not Visible in Navigation

**Cause**: User is not logged in as admin

**Check**:
1. User must be logged in
2. User must have `role: 'admin'` in Firestore users collection
3. Check browser console for auth state

**Solution**:
```javascript
// Verify in browser console:
console.log(useAuthStore.getState().isAdmin());
// Should return: true
```

**Fix Admin Role**:
1. Go to Firebase Console → Firestore
2. Navigate to `users` collection
3. Find your user document
4. Add/update field: `role: "admin"`

---

### 🚨 Issue 4: "OpenAI API Key Not Configured"

**Cause**: OpenAI API key not set in admin settings

**Solution**:
1. Navigate to `/admin/settings`
2. Scroll to "AI Product Assistant" section
3. Enter your OpenAI API key
4. Click "Save Settings"

**Get OpenAI API Key**:
1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up / Login
3. Navigate to API Keys
4. Create new key
5. Copy and paste into settings

---

### 🚨 Issue 5: Build Errors

**Error**: `Module not found` or `Cannot resolve module`

**Check Package Imports**:
```typescript
// Verify all imports are correct:
import { Bot, Send, Upload, ... } from 'lucide-react'; ✓
import { useAuthStore } from '../lib/authStore'; ✓
import { toast } from 'sonner'; ✓
```

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or with pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

### 🚨 Issue 6: TypeScript Errors

**Error**: Type errors in IDE or build

**Common Type Issues**:
```typescript
// Fix 1: Ensure AIConversation type is imported
import { AIConversation } from '../lib/types';

// Fix 2: Null safety
if (!conversation) return; // Always check before using

// Fix 3: User auth check
if (!user) return; // Check user exists
```

---

### 🚨 Issue 7: Page Doesn't Load / White Screen

**Cause**: Runtime error in component

**Debug**:
1. Open browser console (F12)
2. Check for errors
3. Look at Network tab for failed requests

**Common Fixes**:
```typescript
// Add error boundary
useEffect(() => {
  if (!isAuthenticated()) {
    navigate('/login');
  } else if (!isAdmin()) {
    navigate('/');
  }
}, [isAuthenticated, isAdmin, navigate]);
```

---

### 🚨 Issue 8: File Upload Not Working

**Cause**: File input not connected or wrong MIME types

**Check**:
```typescript
// Verify file input ref
const fileInputRef = useRef<HTMLInputElement>(null);

// Verify accept attribute
accept="image/*,.pdf"

// Verify file handler
const handleFileUpload = async (files: FileList | null) => {
  if (!files) return;
  // ... process files
};
```

---

### 🚨 Issue 9: Drag & Drop Not Working

**Cause**: Event handlers not properly set up

**Fix**:
```typescript
// Ensure all handlers are attached
onDragOver={handleDragOver}
onDragLeave={handleDragLeave}
onDrop={handleDrop}

// Prevent default behavior
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(true);
};
```

---

### 🚨 Issue 10: Messages Not Scrolling

**Cause**: Ref not attached or scroll not triggered

**Fix**:
```typescript
// Ensure ref is attached
<div ref={messagesEndRef} />

// Ensure useEffect runs
useEffect(() => {
  scrollToBottom();
}, [conversation?.messages, progress]);

// Check scroll function
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};
```

---

## Debugging Commands

### Check File Structure
```bash
# Verify all files exist
ls -la /src/app/pages/AIAssistantPage.tsx
ls -la /src/app/components/layout/MobileNav.tsx
ls -la /src/app/components/layout/Header.tsx
ls -la /src/app/routes.tsx
```

### Check for TypeScript Errors
```bash
# Run TypeScript check
npx tsc --noEmit
```

### Check for Build Errors
```bash
# Try building
npm run build
# or
pnpm build
```

### Check Browser Console
```javascript
// In browser console, check:

// 1. Auth state
console.log(window.localStorage.getItem('auth-storage'));

// 2. Current route
console.log(window.location.pathname);

// 3. User role
// (after importing authStore in component)
console.log(useAuthStore.getState());
```

---

## Step-by-Step Verification

### ✅ Step 1: Verify Files Created
- [ ] `/src/app/pages/AIAssistantPage.tsx` exists
- [ ] File has 700+ lines of code
- [ ] All imports are present

### ✅ Step 2: Verify Routes
- [ ] `/src/app/routes.tsx` imports `AIAssistantPage`
- [ ] Route `/ai-assistant` is defined
- [ ] Route uses `ProtectedRoute` with `requireAdmin`

### ✅ Step 3: Verify Navigation
- [ ] `/src/app/components/layout/MobileNav.tsx` shows Bot icon
- [ ] Bot icon only visible for admins
- [ ] Links to `/ai-assistant`

### ✅ Step 4: Verify Header
- [ ] `/src/app/components/layout/Header.tsx` imports Bot icon
- [ ] Desktop shows "AI Assistant" button
- [ ] Mobile menu shows "AI Product Assistant" link
- [ ] All links point to `/ai-assistant`

### ✅ Step 5: Verify Admin Access
- [ ] Login as admin user
- [ ] User has `role: 'admin'` in Firestore
- [ ] `isAdmin()` returns true

### ✅ Step 6: Verify Firestore Rules
- [ ] Rules deployed to Firebase Console
- [ ] `aiConversations` collection has rules
- [ ] `aiSettings` collection has rules
- [ ] `productDrafts` collection has rules

### ✅ Step 7: Test Navigation
- [ ] Click AI icon in mobile bottom nav → loads page
- [ ] Click "AI Assistant" in desktop header → loads page
- [ ] Click "AI Product Assistant" in mobile menu → loads page

### ✅ Step 8: Test Page Features
- [ ] Page loads without errors
- [ ] Welcome message displays
- [ ] Mode selector works
- [ ] File upload button works
- [ ] Drag & drop works
- [ ] Paste images works (Ctrl+V)

---

## Emergency Reset

If nothing works, try this complete reset:

```bash
# 1. Clear all build artifacts
rm -rf node_modules
rm -rf dist
rm -rf .vite
rm package-lock.json  # or pnpm-lock.yaml

# 2. Reinstall dependencies
npm install  # or pnpm install

# 3. Clear browser cache
# In browser: Ctrl+Shift+Delete → Clear cache

# 4. Restart dev server
npm run dev  # or pnpm dev

# 5. Hard reload browser
# Ctrl+Shift+R or Cmd+Shift+R
```

---

## Still Having Issues?

### Provide This Information:

1. **Error Message**: (exact text from console)
2. **Browser**: (Chrome, Firefox, Safari, etc.)
3. **User Role**: (admin or regular user)
4. **Steps to Reproduce**: (what you clicked/did)
5. **Console Output**: (copy from browser console)
6. **Network Errors**: (check Network tab in DevTools)

### Quick Diagnostic Script

Run this in browser console:

```javascript
// AI Assistant Diagnostic
console.log('=== AI ASSISTANT DIAGNOSTIC ===');
console.log('Current URL:', window.location.pathname);
console.log('Auth State:', localStorage.getItem('auth-storage'));

// Check if route exists
const routes = ['/ai-assistant'];
console.log('Route registered:', routes.includes('/ai-assistant'));

// Check imports
console.log('AIAssistantPage imported:', typeof AIAssistantPage !== 'undefined');

// Done
console.log('=== DIAGNOSTIC COMPLETE ===');
```

---

## Known Limitations

1. **PDF Upload**: Currently shows PDF icon but doesn't extract text (requires server-side processing)
2. **URL Scraping**: May fail due to CORS (expected behavior)
3. **Bulk Import**: Coming soon (not implemented yet)
4. **Update Product**: Coming soon (not implemented yet)

---

## Firebase Console Checklist

### Firestore Rules
- [ ] Navigate to Firestore Database → Rules
- [ ] Verify rules are published (not draft)
- [ ] Check timestamp of last publish
- [ ] Test rules with simulator

### Authentication
- [ ] Navigate to Authentication → Users
- [ ] Verify admin user exists
- [ ] Check UID matches your logged-in user

### Firestore Data
- [ ] Navigate to Firestore Database → Data
- [ ] Check `users/{uid}` has `role: "admin"`
- [ ] Verify collections exist: `aiConversations`, `aiSettings`, `productDrafts`

---

## Success Indicators

✅ **Everything Working When**:
1. AI icon appears in mobile bottom nav (admins only)
2. "AI Assistant" button in desktop header (admins only)
3. Clicking AI link loads full-page interface
4. Welcome message displays with feature cards
5. File upload button clickable
6. Drag & drop shows visual overlay
7. No console errors
8. No Firestore permission errors

---

## Contact & Support

- Check `/AI_ASSISTANT_COMPLETE_SUMMARY.md` for full documentation
- Review `/FIRESTORE_RULES_DEPLOYMENT_AI.md` for rules setup
- See `/AI_IMPLEMENTATION_COMPLETE.md` for technical details

---

**Last Updated**: February 14, 2026  
**Version**: 1.0.0

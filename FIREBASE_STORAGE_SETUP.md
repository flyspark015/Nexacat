# Firebase Storage Setup Guide

## Your Firebase Storage URL
```
gs://flyspark-cb85e.firebasestorage.app
```

## Step 1: Upload Payment QR Code

### Method A: Using Firebase Console (Recommended)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/project/flyspark-cb85e/storage
   - Navigate to Storage → Files

2. **Create Folder Structure**
   ```
   /payment/
     └── qr-code.png  (your payment QR code)
   /logos/
     └── company-logo.png  (optional)
   /products/
     └── (product images will go here)
   /categories/
     └── (category images will go here)
   ```

3. **Upload Payment QR Code**
   - Click "Upload File"
   - Select your payment QR code image
   - Upload to `/payment/qr-code.png`

4. **Get Public URL**
   - Click on the uploaded file
   - Click "Get Download URL" or make it public
   - Copy the URL (it will look like):
     ```
     https://firebasestorage.googleapis.com/v0/b/flyspark-cb85e.firebasestorage.app/o/payment%2Fqr-code.png?alt=media&token=...
     ```

5. **Add URL to Admin Settings**
   - Go to Admin Settings → Payment Information
   - Paste the URL in "Payment QR Code URL" field
   - Click Save

### Method B: Using Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Upload file
firebase storage:upload payment-qr.png payment/qr-code.png --project flyspark-cb85e
```

---

## Step 2: Configure Storage Rules

**Go to Firebase Console → Storage → Rules**

Replace with these production-ready rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read for all files (images, QR codes, logos)
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Only admins can write/delete
    match /{allPaths=**} {
      allow write, delete: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
    
    // Specific rules for different folders
    match /payment/{fileName} {
      allow read: if true; // Public QR code
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
    
    match /logos/{fileName} {
      allow read: if true; // Public company logo
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
    
    match /products/{fileName} {
      allow read: if true; // Public product images
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
    
    match /categories/{fileName} {
      allow read: if true; // Public category images
      allow write: if request.auth != null && 
        request.auth.token.role == 'admin';
    }
  }
}
```

**Click "Publish" to deploy the rules.**

---

## Step 3: Configure CORS (If needed for direct uploads)

If you plan to upload images directly from the app:

1. Create a `cors.json` file:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

2. Apply CORS configuration:
```bash
gsutil cors set cors.json gs://flyspark-cb85e.firebasestorage.app
```

---

## Step 4: Verify Storage is Working

1. **Test Upload:**
   - Go to Admin Dashboard
   - Try uploading a category image
   - Verify it appears in Firebase Storage

2. **Test QR Code:**
   - Go to `/payment-details` page
   - Verify QR code displays correctly

3. **Check Public Access:**
   - Open the storage URL in incognito browser
   - Verify images load without authentication

---

## Best Practices

✅ **DO:**
- Organize files in folders (`/payment/`, `/logos/`, `/products/`, etc.)
- Use descriptive filenames
- Compress images before uploading (optimize for web)
- Keep QR code at reasonable size (500x500px recommended)

❌ **DON'T:**
- Store sensitive data in Storage (it's public-read)
- Upload uncompressed large images
- Use special characters in filenames

---

## Troubleshooting

### Issue: "Permission Denied" when uploading
**Solution:** Check Storage Rules are published and admin role is set

### Issue: Images not loading
**Solution:** Verify CORS settings and public read permissions

### Issue: Slow image loading
**Solution:** Compress images, use WebP format, or enable CDN

---

## Next: Update Admin Settings

After uploading QR code:
1. Copy the download URL
2. Go to `/admin/settings`
3. Paste in "Payment QR Code URL"
4. Save settings
5. Test on `/payment-details` page

✅ Storage setup complete!

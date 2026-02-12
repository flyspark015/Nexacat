# FlySpark Deployment Guide

## Prerequisites

### Required Accounts
1. **Firebase Account** - [firebase.google.com](https://firebase.google.com)
2. **Node.js** - v18 or higher
3. **pnpm** - v8 or higher (or npm/yarn)

### Firebase Project Setup
The application is already configured with a Firebase project. However, for production deployment, you should create your own Firebase project.

## Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name (e.g., "flyspark-production")
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Firebase Services

#### A. Authentication
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Click **Save**

#### B. Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Start in **production mode**
4. Choose location (e.g., asia-south1 for India)
5. Click **Enable**

#### C. Storage
1. Go to **Storage**
2. Click **Get started**
3. Start in **production mode**
4. Use default location
5. Click **Done**

### 3. Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps**
3. Click web icon (</>)
4. Register app name (e.g., "FlySpark Web")
5. Copy the `firebaseConfig` object

### 4. Update Application Config

Replace the config in `/src/app/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
  measurementId: "G-XXXXXXXXXX",
};
```

## Firestore Security Rules

### 1. Database Rules

Go to **Firestore Database** → **Rules** and paste:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true; // Public read
      allow create, update, delete: if isAdmin();
      
      // Product variations subcollection
      match /variations/{variationId} {
        allow read: if true;
        allow create, update, delete: if isAdmin();
      }
    }
    
    // Categories collection
    match /categories/{categoryId} {
      allow read: if true; // Public read
      allow create, update, delete: if isAdmin();
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if isOwner(resource.data.customerUid) || isAdmin();
      allow create: if isSignedIn();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Settings collection
    match /settings/{settingId} {
      allow read: if true; // Public read for logo, etc.
      allow create, update, delete: if isAdmin();
    }
  }
}
```

### 2. Storage Rules

Go to **Storage** → **Rules** and paste:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isImage() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isUnder5MB() {
      return request.resource.size < 5 * 1024 * 1024;
    }
    
    // Product images
    match /products/{productId}/{fileName} {
      allow read: if true; // Public read
      allow write: if isAdmin() && isImage() && isUnder5MB();
      allow delete: if isAdmin();
    }
    
    // Category images
    match /categories/{categoryId}/{fileName} {
      allow read: if true;
      allow write: if isAdmin() && isImage() && isUnder5MB();
      allow delete: if isAdmin();
    }
    
    // Settings (logo, favicon)
    match /settings/{fileName} {
      allow read: if true;
      allow write: if isAdmin() && isImage() && isUnder5MB();
      allow delete: if isAdmin();
    }
  }
}
```

## Initial Data Setup

### 1. Create Admin User

After deploying, you'll need to create an admin user:

1. Open the application
2. Register a new account with your admin email
3. Go to Firebase Console → **Firestore Database**
4. Find your user document in the `users` collection
5. Edit the document and change `role` to `"admin"`
6. Save the change

### 2. Seed Demo Data (Optional)

The application includes a data seeding utility. To seed demo data:

1. Log in as admin
2. Go to Admin Dashboard
3. Click "Seed Demo Data" button
4. Wait for confirmation

Or run the seed function directly in your code if needed.

## Build for Production

### 1. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 2. Build Application

```bash
pnpm build
# or
npm run build
# or
yarn build
```

This creates an optimized production build in the `dist` folder.

### 3. Test Production Build Locally

```bash
pnpm preview
# or
npm run preview
# or
yarn preview
```

## Deployment Options

### Option 1: Firebase Hosting (Recommended)

#### A. Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### B. Login to Firebase

```bash
firebase login
```

#### C. Initialize Firebase Hosting

```bash
firebase init hosting
```

Select:
- Use existing project → Select your project
- Public directory: `dist`
- Configure as single-page app: **Yes**
- Set up automatic builds: **No**
- Overwrite index.html: **No**

#### D. Deploy

```bash
firebase deploy --only hosting
```

Your application will be live at: `https://your-project.firebaseapp.com`

#### E. Custom Domain (Optional)

1. Go to Firebase Console → **Hosting**
2. Click **Add custom domain**
3. Follow the verification steps
4. Update DNS records as instructed
5. Wait for SSL certificate (automatic)

### Option 2: Vercel

#### A. Install Vercel CLI

```bash
npm install -g vercel
```

#### B. Deploy

```bash
vercel
```

Follow the prompts to deploy.

#### C. Add Environment Variables

If you're using environment variables, add them in Vercel dashboard:

1. Go to project settings
2. Navigate to **Environment Variables**
3. Add your Firebase config as environment variables

### Option 3: Netlify

#### A. Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### B. Deploy

```bash
netlify deploy --prod
```

Select the `dist` folder as the publish directory.

### Option 4: Custom Server

Deploy the `dist` folder to any static hosting service:

- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- GitHub Pages
- Any web server (nginx, Apache)

## Post-Deployment Checklist

### 1. Verify Services

- [ ] Authentication works (login/register)
- [ ] Products display correctly
- [ ] Images load properly
- [ ] Search functionality works
- [ ] Cart operations work
- [ ] WhatsApp checkout generates correct links
- [ ] Admin dashboard accessible
- [ ] Admin can create/edit products
- [ ] Admin can manage orders
- [ ] Settings page works

### 2. Security

- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] Admin user created
- [ ] Test customer permissions
- [ ] HTTPS enabled
- [ ] API keys secured

### 3. Performance

- [ ] Run Lighthouse audit
- [ ] Check mobile performance
- [ ] Test on different browsers
- [ ] Verify image optimization
- [ ] Check load times

### 4. SEO (Optional)

- [ ] Add meta tags
- [ ] Configure sitemap
- [ ] Set up robots.txt
- [ ] Add Open Graph tags
- [ ] Configure Google Analytics

## Environment Variables (Optional)

For enhanced security, you can use environment variables:

### 1. Create `.env` file

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Update `firebase.ts`

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
```

### 3. Add to `.gitignore`

```
.env
.env.local
.env.production
```

## Monitoring

### Firebase Console

Monitor your application:

1. **Authentication** → User registrations
2. **Firestore** → Database usage
3. **Storage** → File uploads
4. **Hosting** → Traffic and performance
5. **Analytics** → User behavior (if enabled)

### Error Tracking

Consider adding error tracking services:

- **Sentry** - [sentry.io](https://sentry.io)
- **LogRocket** - [logrocket.com](https://logrocket.com)
- **Firebase Crashlytics** - Built-in

## Backup & Restore

### Backup Firestore

```bash
gcloud firestore export gs://[BUCKET_NAME]
```

### Backup Storage

Use Firebase Console or `gsutil`:

```bash
gsutil -m cp -r gs://your-bucket gs://backup-bucket
```

## Troubleshooting

### Build Errors

```bash
# Clear cache
rm -rf node_modules dist
pnpm install
pnpm build
```

### Firebase Connection Issues

- Check Firebase config values
- Verify project is active
- Check Firestore/Storage rules
- Ensure services are enabled

### Image Upload Issues

- Check Storage rules
- Verify file size limits
- Check CORS configuration
- Ensure proper permissions

### WhatsApp Not Working

- Verify WhatsApp number format: +[country][number]
- Check URL encoding
- Test on mobile device

## Support

For issues or questions:

1. Check Firebase Console logs
2. Review browser console errors
3. Check Firestore rules
4. Verify authentication status

---

## Quick Start Summary

```bash
# 1. Create Firebase project
# 2. Enable Auth, Firestore, Storage
# 3. Update firebase.ts with your config
# 4. Deploy Firestore rules
# 5. Deploy Storage rules
# 6. Build application
pnpm build

# 7. Deploy to Firebase Hosting
firebase init hosting
firebase deploy --only hosting

# 8. Create admin user
# 9. Seed demo data (optional)
# 10. Test everything!
```

---

**Last Updated:** February 12, 2026  
**Version:** 1.0.0  
**Status:** Production Ready

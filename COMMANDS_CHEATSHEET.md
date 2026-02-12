# ⚡ COMMANDS CHEAT SHEET - FLYSPARK

Quick reference for all deployment and maintenance commands.

---

## 🚀 DEPLOYMENT COMMANDS

### First-Time Setup
```bash
# Install dependencies
npm install

# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting
firebase init hosting
# Select: flyspark-cb85e
# Public: dist
# SPA: Yes
# GitHub: No
```

### Deploy to Production
```bash
# Build production app
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Deploy everything (hosting + functions if any)
firebase deploy
```

### Quick Redeploy
```bash
npm run build && firebase deploy --only hosting
```

---

## 💻 DEVELOPMENT COMMANDS

### Local Development
```bash
# Start dev server
npm run dev

# Open browser at: http://localhost:5173
```

### Build & Preview
```bash
# Build production version
npm run build

# Preview production build locally
npm run preview
```

### Clean Build
```bash
# Remove old builds
rm -rf dist node_modules

# Fresh install
npm install

# Build
npm run build
```

---

## 🧪 TESTING COMMANDS

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Lint & Format
```bash
# Check TypeScript types
npm run type-check

# Lint code (if configured)
npm run lint

# Format code (if configured)
npm run format
```

---

## 🔥 FIREBASE COMMANDS

### Firebase Login
```bash
# Login to Firebase
firebase login

# Logout
firebase logout

# Check current user
firebase login:list
```

### Firebase Projects
```bash
# List all projects
firebase projects:list

# Use specific project
firebase use flyspark-cb85e

# Show current project
firebase use
```

### Firebase Deploy
```bash
# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage

# Deploy everything
firebase deploy
```

### Firebase Serve (Local)
```bash
# Serve hosting locally (after build)
firebase serve --only hosting

# Serve on specific port
firebase serve --only hosting --port 8080
```

---

## 📦 STORAGE COMMANDS

### Upload to Firebase Storage
```bash
# Upload single file
firebase storage:upload local-file.png path/in/storage/file.png

# Upload QR code
firebase storage:upload qr-code.png payment/qr-code.png
```

### List Storage Files
```bash
# List all files
firebase storage:list

# List files in specific folder
firebase storage:list payment/
```

---

## 🗄️ FIRESTORE COMMANDS

### Export Data (Backup)
```bash
# Export entire database
firebase firestore:export backup-folder

# Export specific collection
firebase firestore:export backup-folder --collection users
```

### Import Data (Restore)
```bash
# Import from backup
firebase firestore:import backup-folder
```

---

## 🔐 SECURITY RULES

### Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Test Firestore Rules
```bash
firebase emulators:start --only firestore
```

### Deploy Storage Rules
```bash
firebase deploy --only storage
```

---

## 📊 MONITORING COMMANDS

### Open Firebase Console
```bash
# Open project overview
firebase open

# Open specific service
firebase open hosting
firebase open firestore
firebase open storage
firebase open auth
```

### Check Hosting Info
```bash
# List all hosting sites
firebase hosting:sites:list

# Get hosting site details
firebase hosting:sites:get flyspark-cb85e
```

---

## 🌐 DOMAIN COMMANDS

### Add Custom Domain
```bash
# Via Firebase Console only
# Go to: Hosting → Add Custom Domain
```

---

## 🛠️ TROUBLESHOOTING COMMANDS

### Clear Cache
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules

# Remove dist
rm -rf dist

# Fresh install
npm install
```

### Check Firebase Status
```bash
# Check Firebase CLI version
firebase --version

# Check project info
firebase projects:list

# Check current project
firebase use
```

### Debug Build Issues
```bash
# Verbose build
npm run build -- --debug

# Check TypeScript errors
npx tsc --noEmit
```

---

## 📱 ADMIN TASKS (Via Web UI)

### Create Admin User
```
1. Register at: /register
2. Go to Firestore Console
3. users collection → [user-id]
4. Edit field: role = "admin"
5. Login again
```

### Update Settings
```
1. Login as admin
2. Go to: /admin/settings
3. Update fields
4. Click "Save Settings"
```

### Add Products
```
1. Go to: /admin/products
2. Click "Add Product"
3. Fill form
4. Click "Save"
```

---

## 🔄 COMMON WORKFLOWS

### Make Code Changes and Deploy
```bash
# 1. Make your changes in code

# 2. Test locally
npm run dev

# 3. Build production
npm run build

# 4. Deploy
firebase deploy --only hosting
```

### Add New Product
```bash
# 1. Upload product images to Firebase Storage
# 2. Copy image URLs
# 3. Go to /admin/products
# 4. Add product with image URLs
# 5. Save
```

### Update Company Info
```bash
# 1. Login as admin
# 2. Go to /admin/settings
# 3. Update fields
# 4. Save
# 5. Refresh page to see changes
```

### Check Orders
```bash
# 1. Login as admin
# 2. Go to /admin/orders
# 3. View all orders
# 4. Update status as needed
```

---

## 🎯 QUICK DEPLOY SEQUENCE

**Copy and paste this entire block:**

```bash
# Full deployment in one go
npm install && \
npm run build && \
firebase deploy --only hosting
```

---

## 📋 FIREBASE URLS (Quick Access)

### Firebase Console Links
```bash
# Main Console
https://console.firebase.google.com/project/flyspark-cb85e

# Firestore Database
https://console.firebase.google.com/project/flyspark-cb85e/firestore

# Storage
https://console.firebase.google.com/project/flyspark-cb85e/storage

# Authentication
https://console.firebase.google.com/project/flyspark-cb85e/authentication

# Hosting
https://console.firebase.google.com/project/flyspark-cb85e/hosting

# Analytics
https://console.firebase.google.com/project/flyspark-cb85e/analytics
```

### Production URLs
```bash
# Live Website
https://flyspark-cb85e.web.app

# Admin Panel
https://flyspark-cb85e.web.app/admin

# Payment Details
https://flyspark-cb85e.web.app/payment-details
```

---

## 💡 PRO TIPS

### Alias for Quick Deploy
Add to your `~/.bashrc` or `~/.zshrc`:
```bash
alias flydeploy="npm run build && firebase deploy --only hosting"
```

Then just run:
```bash
flydeploy
```

### Watch and Build
```bash
# Auto-rebuild on file changes (in another terminal)
npm run dev -- --watch
```

### Deploy with Message
```bash
firebase deploy --only hosting -m "Updated payment info"
```

### Check Deployment History
```bash
# View in Firebase Console → Hosting → Release History
```

---

## 🆘 EMERGENCY COMMANDS

### Rollback Deployment
```bash
# Via Firebase Console only
# Go to: Hosting → Release History
# Click "..." → Rollback on previous version
```

### Check Logs
```bash
# View hosting logs
firebase hosting:logs

# View function logs (if using functions)
firebase functions:log
```

### Force Rebuild
```bash
rm -rf dist node_modules package-lock.json
npm install
npm run build
firebase deploy --only hosting
```

---

## 📚 DOCUMENTATION FILES

```bash
# Quick Start
cat QUICK_START_GUIDE.md

# Full Deployment
cat DEPLOYMENT_STEPS.md

# Production Checklist
cat PRODUCTION_DEPLOYMENT_CHECKLIST.md

# Storage Setup
cat FIREBASE_STORAGE_SETUP.md

# This Cheat Sheet
cat COMMANDS_CHEATSHEET.md
```

---

## ✅ DAILY COMMANDS

**Morning Routine:**
```bash
git pull
npm install
npm run dev
```

**After Making Changes:**
```bash
npm run build
firebase deploy --only hosting
```

**Check Orders:**
```bash
# Open: https://flyspark-cb85e.web.app/admin/orders
```

**Update Products:**
```bash
# Open: https://flyspark-cb85e.web.app/admin/products
```

---

**Project:** FlySpark  
**Company:** ANUSHAKTI INFOTECH PVT. LTD.  
**Firebase:** flyspark-cb85e  
**Live:** https://flyspark-cb85e.web.app

💪 Keep this file handy for quick reference!

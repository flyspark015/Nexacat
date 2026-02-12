import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Suppress Firebase Installations errors before initialization
// These errors are common in sandboxed environments and don't affect functionality
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const errorString = String(args[0] || '');
    // Filter out Firebase Installations offline errors
    if (errorString.includes('installations/app-offline') || 
        errorString.includes('Installations:') ||
        errorString.includes('FirebaseError: Installations:')) {
      return; // Silently ignore
    }
    originalError.apply(console, args);
  };
}

const firebaseConfig = {
  apiKey: "AIzaSyA1NXJac5yAj0bPtiqO5XfwjjKAbCbGiUU",
  authDomain: "flyspark-cb85e.firebaseapp.com",
  projectId: "flyspark-cb85e",
  storageBucket: "flyspark-cb85e.firebasestorage.app",
  messagingSenderId: "613723769054",
  appId: "1:613723769054:web:3da69329c9992201759a4f",
  measurementId: "G-RV10FFT576",
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

// Initialize services with error handling
let auth;
let db;
let storage;

try {
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');
} catch (error) {
  console.error('❌ Firebase Auth initialization error:', error);
  throw error;
}

try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized');
} catch (error) {
  console.error('❌ Firestore initialization error:', error);
  throw error;
}

try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized');
} catch (error) {
  console.error('❌ Firebase Storage initialization error:', error);
  throw error;
}

export { auth, db, storage };

// Analytics (only in browser and gracefully handle errors in sandboxed environments)
let analyticsInstance: Analytics | null = null;
// Don't initialize analytics in sandboxed/development environments
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  isSupported().then(supported => {
    if (supported) {
      try {
        analyticsInstance = getAnalytics(app);
        console.log('✅ Firebase Analytics initialized');
      } catch (error) {
        console.warn('⚠️ Firebase Analytics initialization failed:', error);
      }
    }
  }).catch((error) => {
    // Silently ignore if isSupported check fails - common in sandboxed environments
    console.warn('⚠️ Analytics not supported in this environment');
  });
}

export const analytics = analyticsInstance;

export default app;
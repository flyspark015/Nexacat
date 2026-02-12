import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";
import { getStorage } from "firebase/storage";

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
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics (only in browser and gracefully handle errors in sandboxed environments)
let analyticsInstance: Analytics | null = null;
// Don't initialize analytics in sandboxed/development environments
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  isSupported().then(supported => {
    if (supported) {
      try {
        analyticsInstance = getAnalytics(app);
      } catch (error) {
        console.warn('Firebase Analytics initialization failed:', error);
      }
    }
  }).catch(() => {
    // Silently ignore if isSupported check fails
  });
}
export const analytics = analyticsInstance;

export default app;
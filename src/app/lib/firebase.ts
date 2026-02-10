import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

// Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

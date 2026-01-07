import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInAnonymously } from "firebase/auth";
import { getDatabase } from "firebase/database"; // For Realtime DB (Calendar)
import { getFirestore } from "firebase/firestore"; // For Firestore (Contact Form)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Main Exports
export const auth = getAuth(app);
export const db = getDatabase(app);         // Used by Calendar.jsx and CalendarManager.jsx
export const firestore = getFirestore(app); // Used by ContactForm.jsx
export const googleProvider = new GoogleAuthProvider();

// Guest login for students to see live updates without an account
export const loginGuest = () => signInAnonymously(auth);

export default app; // Added default export for general use
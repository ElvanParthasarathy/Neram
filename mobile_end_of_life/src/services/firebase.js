import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Configuration verified from web/.env
const firebaseConfig = {
    apiKey: "AIzaSyC56yIPyKr3GZMc27T-2xGN0N1wslJB2kQ",
    authDomain: "rmdneramportal.firebaseapp.com",
    databaseURL: "https://rmdneramportal-default-rtdb.firebaseio.com",
    projectId: "rmdneramportal",
    storageBucket: "rmdneramportal.firebasestorage.app",
    messagingSenderId: "85578742222",
    appId: "1:85578742222:web:03470e1ebe449d6c2c139f"
};

// Initialize Firebase (Web SDK with Native Persistence)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence, getAuth as getAuthOnly } from 'firebase/auth';

const app = initializeApp(firebaseConfig);

// Initialize Auth with Persistence
// Check if auth is already initialized to avoid errors in hot reload
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (e) {
    auth = getAuthOnly(app); // Fallback if already initialized
}

export { auth };
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export default app;

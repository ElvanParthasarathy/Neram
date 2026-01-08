import { initializeApp } from "firebase/app";
// @ts-ignore: TS sometimes incorrectly resolves the web types instead of React Native types
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your specific configuration
const firebaseConfig = {
  apiKey: "AIzaSyC56yIPyKr3GZMc27T-2xGN0N1wslJB2kQ",
  authDomain: "rmdneramportal.firebaseapp.com",
  databaseURL: "https://rmdneramportal-default-rtdb.firebaseio.com",
  projectId: "rmdneramportal",
  storageBucket: "rmdneramportal.firebasestorage.app",
  messagingSenderId: "85578742222",
  appId: "1:85578742222:web:03470e1ebe449d6c2c139f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with Persistence (Keeps user logged in offline)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Database (Realtime DB)
const db = getDatabase(app);

// Initialize Firestore with Offline Persistence
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export { auth, db, firestore };
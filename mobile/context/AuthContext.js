import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
// FIX 1: Correct import path matching your folder structure
import { auth, db } from '../config/firebase'; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Auth User + DB Data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDb; // Variable to track the DB listener

    // 1. Listen for Auth State Changes (Login/Logout)
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      
      // FIX 2: Always clean up the previous database listener
      if (unsubscribeDb) {
        unsubscribeDb();
        unsubscribeDb = null;
      }

      if (currentUser) {
        // 2. If logged in, fetch their Academic Details
        const userRef = ref(db, `users/${currentUser.uid}`);
        
        // Start Real-time DB listener
        unsubscribeDb = onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          
          // Merge Auth Object with Database Data
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            ...userData // This adds batch, department, section
          });
          setLoading(false);
        });
      } else {
        // User is logged out
        setUser(null);
        setLoading(false);
      }
    });

    // Cleanup listeners when the app closes or component unmounts
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeDb) unsubscribeDb();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
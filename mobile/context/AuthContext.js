import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { auth, db } from '../config/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDb;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // 1. Cleanup previous DB listener if exists
      if (unsubscribeDb) {
        unsubscribeDb();
        unsubscribeDb = null;
      }

      if (currentUser) {
        // 2. User is logged in - Try to fetch details
        const userRef = ref(db, `users/${currentUser.uid}`);

        unsubscribeDb = onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            ...userData
          });
          setLoading(false); // Success: Stop loading
        }, (error) => {
          console.error("Auth DB Error:", error);
          // Safety: Even if DB fails, set the basic auth user so app opens
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            photoURL: currentUser.photoURL
          });
          setLoading(false); // Error: Stop loading
        });

      } else {
        // 3. User is logged out
        setUser(null);
        setLoading(false);
      }
    });

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
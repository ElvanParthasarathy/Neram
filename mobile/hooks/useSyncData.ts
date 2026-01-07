import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';

export const useSyncData = (path: string, storageKey: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const sync = async () => {
      // 1. LOAD FROM CACHE IMMEDIATELY (Offline support)
      try {
        const cached = await AsyncStorage.getItem(storageKey);
        if (cached && mounted) {
          setData(JSON.parse(cached));
          setLoading(false); // Show content immediately
        }
      } catch (e) {
        console.log("Cache miss");
      }

      // 2. LISTEN FOR LIVE UPDATES (Background Sync)
      const dbRef = ref(db, path);
      const unsubscribe = onValue(dbRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          if (mounted) setData(val);
          // 3. UPDATE CACHE
          AsyncStorage.setItem(storageKey, JSON.stringify(val));
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    sync();
    return () => { mounted = false; };
  }, [path, storageKey]);

  return { data, loading };
};
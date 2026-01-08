import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export function useSyncData(dbPath: string, cacheKey: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        // 1. Load from Offline Cache IMMEDIATELY
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached && isMounted) {
          console.log(`[Offline] Loaded ${cacheKey} from cache`);
          setData(JSON.parse(cached));
          setLoading(false); // Show data instantly
        }

        // 2. Check Internet Connection
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
          setIsOffline(true);
          setLoading(false);
          return; // Stop here if offline
        }

        // 3. Sync with Firebase (Realtime)
        const dbRef = ref(db, dbPath);
        onValue(dbRef, async (snapshot) => {
          if (isMounted) {
            const val = snapshot.val();
            if (val) {
              console.log(`[Online] Synced ${dbPath}`);
              setData(val);
              // 4. Save new data to Cache silently
              await AsyncStorage.setItem(cacheKey, JSON.stringify(val));
            }
            setLoading(false);
          }
        }, (error) => {
          console.warn("Firebase Error:", error);
          setLoading(false);
        });

      } catch (e) {
        console.error("Sync Error:", e);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      const dbRef = ref(db, dbPath);
      off(dbRef); // Cleanup listener
    };
  }, [dbPath, cacheKey]);

  return { data, loading, isOffline };
}
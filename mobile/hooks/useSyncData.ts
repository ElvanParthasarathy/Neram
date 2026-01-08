import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export function useSyncData(dbPath: string, storageKey: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const synchronizeData = async () => {
      try {
        // 1. READ FROM PHONE STORAGE (Instant Offline Access)
        const storedData = await AsyncStorage.getItem(storageKey);
        
        if (storedData && isMounted) {
          console.log(`[Disk] Loaded ${storageKey} from device storage`);
          setData(JSON.parse(storedData));
          setLoading(false); // <--- SHOW APP IMMEDIATELY
        }

        // 2. CHECK NETWORK
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
          console.log(`[Offline] Using stored data for ${storageKey}`);
          setLoading(false); 
          return; // Stop here if no internet
        }

        // 3. BACKGROUND SYNC (Download & Save to Disk)
        const dbRef = ref(db, dbPath);
        onValue(dbRef, async (snapshot) => {
          if (isMounted) {
            const val = snapshot.val();
            if (val) {
              console.log(`[Cloud] New data found for ${storageKey}`);
              
              // A. Update the Screen (Live)
              setData(val);
              
              // B. Write to Phone Storage (Persistent)
              await AsyncStorage.setItem(storageKey, JSON.stringify(val));
            }
            setLoading(false);
          }
        }, (error) => {
          console.warn("[Sync Error]", error);
          setLoading(false);
        });

      } catch (e) {
        console.error("Storage Error:", e);
        setLoading(false);
      }
    };

    synchronizeData();

    return () => {
      isMounted = false;
      const dbRef = ref(db, dbPath);
      off(dbRef);
    };
  }, [dbPath, storageKey]);

  return { data, loading };
}
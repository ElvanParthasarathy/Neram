import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { adminEmails } from '../data/admins';
import { DataRepository } from '../services/DataRepository';
import NetInfo from '@react-native-community/netinfo';

const GlobalContext = createContext();

export const useGlobal = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [previewProfile, setPreviewProfile] = useState(null); // { batch, department, section }

    const [loading, setLoading] = useState(true); // Profile/Data loading
    const [authResolved, setAuthResolved] = useState(false); // Auth check completed?

    // Global Data
    const [masterData, setMasterData] = useState({ courses: [], timetable: {}, exams: [], counseling: { counselors: [], coordinators: {} } });
    const [allCalendar, setAllCalendar] = useState([]);
    const [sectionUpdates, setSectionUpdates] = useState({ live: {}, general: "" });

    // Sync Status
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [dataSource, setDataSource] = useState('loading'); // 'loading' | 'local' | 'firebase'

    // 0. Initialize DB and Load Cached Auth (FAST STARTUP)
    useEffect(() => {
        const fastStartup = async () => {
            try {
                await DataRepository.initialize();

                // Load cached profile IMMEDIATELY for instant startup
                const cachedProfile = await DataRepository.getLocalUserProfile();
                if (cachedProfile && cachedProfile.uid) {
                    // We have a cached logged-in user - show app immediately!
                    setUserProfile(cachedProfile);
                    setUser({ uid: cachedProfile.uid, email: cachedProfile.email }); // Fake user object for navigation
                    setAuthResolved(true); // Resolve auth instantly from cache
                } else {
                    // No cached user - wait for Firebase (first login or logged out)
                    setAuthResolved(false);
                }
            } catch (e) {
                console.warn("Fast startup error:", e);
            }
        };
        fastStartup();
    }, []);

    // 1. Firebase Auth Listener (runs in background, updates if different)
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Firebase confirmed user - update with real user object
                setUser(firebaseUser);
            } else {
                // Not logged in according to Firebase
                setUser(null);
                setUserProfile(null);
                setMasterData({});
                setAllCalendar([]);
                DataRepository.saveUserProfile(null);
                setLoading(false);
            }
            // Always mark as resolved after Firebase responds
            setAuthResolved(true);
        });
        return unsubAuth;
    }, []);

    // 2. User Profile Listener (Firebase -> Local DB -> State)
    useEffect(() => {
        if (!user) return;
        const userRef = ref(db, `users/${user.uid}`);

        // Note: We use onValue to get real-time profile updates (e.g. if admin changes role)
        const unsubUser = onValue(userRef, (snap) => {
            const data = snap.val();

            // SYSTEM ADMIN OVERRIDE
            if (data && user && adminEmails.includes(user.email)) {
                data.role = 'admin';
            }

            if (data) {
                setUserProfile(data);
                DataRepository.saveUserProfile(data); // Sync to DB
            }
            setLoading(false); // Auth + Profile loaded
        });

        return unsubUser;
    }, [user]);

    // 3. Effective Profile (Merge Real Profile + Preview Overrides)
    const effectiveProfile = useMemo(() => {
        if (previewProfile && userProfile) {
            return { ...userProfile, ...previewProfile };
        }
        return userProfile;
    }, [userProfile, previewProfile]);

    // 4. Global Data Sync (Timetable, Calendar, Updates)
    useEffect(() => {
        if (!effectiveProfile?.batch || !effectiveProfile?.section) return;

        setIsSyncing(true);
        const { batch, department, section } = effectiveProfile;

        // --- Load Local Data Immediately ---
        const loadLocalContent = async () => {
            // Master Data
            const localMaster = await DataRepository.getLocalMasterData(batch, department, section);
            if (localMaster) {
                setMasterData(localMaster);
                setDataSource('local'); // Mark as loaded from cache
            }

            // Calendar
            const localCalendar = await DataRepository.getLocalCalendar(batch);
            if (localCalendar) setAllCalendar(localCalendar);

            // Updates
            const localUpdates = await DataRepository.getLocalSectionUpdates(batch, department, section);
            if (localUpdates) setSectionUpdates(localUpdates);
        };
        loadLocalContent();

        // --- Start Firebase Listeners (Sync) ---

        // A. Master Data (Timetable, Courses, Exams)
        const scheduleRef = ref(db, `schedules/${batch}/${department}/${section}`);
        const unsubSched = onValue(scheduleRef, (snap) => {
            if (snap.exists()) {
                const data = snap.val();
                setMasterData(data);
                DataRepository.saveMasterData(batch, department, section, data);
                setDataSource('firebase'); // Mark as synced from Firebase
            } else {
                setMasterData({ courses: [], timetable: {}, exams: [] });
            }
            setIsSyncing(false);
        });

        // B. Calendar Events
        const calendarRef = ref(db, `calendars/${batch}/events`);
        const unsubCal = onValue(calendarRef, (snap) => {
            const data = snap.val();
            // Convert object to array if needed (Firebase sometimes returns objects for arrays)
            const eventsList = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
            setAllCalendar(eventsList);
            DataRepository.saveCalendar(batch, eventsList);
        });

        // C. Daily Updates (Live Notes)
        const updatesRef = ref(db, `updates/${batch}/${department}/${section}`);
        const unsubUpdates = onValue(updatesRef, (snap) => {
            const data = snap.val() || {};
            const newData = {
                live: data.live_daily || {},
                general: { text: data.general_text || "", author: data.general_author || "" }
            };
            setSectionUpdates(newData);
            DataRepository.saveSectionUpdates(batch, department, section, newData);
        });

        return () => {
            unsubSched();
            unsubCal();
            unsubUpdates();
        };
    }, [effectiveProfile]);

    // 5. Network State Listener
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOffline(!state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    // 6. Manual Sync Function
    const manualSync = useCallback(async () => {
        if (!effectiveProfile?.batch || !effectiveProfile?.section) return;

        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
            return; // Can't sync without connection
        }

        setIsSyncing(true);
        const { batch, department, section } = effectiveProfile;

        try {
            // Force refresh from Firebase
            const scheduleSnap = await get(ref(db, `schedules/${batch}/${department}/${section}`));
            if (scheduleSnap.exists()) {
                const data = scheduleSnap.val();
                setMasterData(data);
                await DataRepository.saveMasterData(batch, department, section, data);
                setDataSource('firebase');
            }

            const calendarSnap = await get(ref(db, `calendars/${batch}/events`));
            const calData = calendarSnap.val();
            const eventsList = calData ? (Array.isArray(calData) ? calData : Object.values(calData)) : [];
            setAllCalendar(eventsList);
            await DataRepository.saveCalendar(batch, eventsList);

            const updatesSnap = await get(ref(db, `updates/${batch}/${department}/${section}`));
            const upData = updatesSnap.val() || {};
            const newData = {
                live: upData.live_daily || {},
                general: { text: upData.general_text || "", author: upData.general_author || "" }
            };
            setSectionUpdates(newData);
            await DataRepository.saveSectionUpdates(batch, department, section, newData);
        } catch (error) {
            console.warn('Manual sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [effectiveProfile]);

    return (
        <GlobalContext.Provider value={{
            user,
            userProfile: effectiveProfile, // Consumers see the Previewed Profile transparently
            realProfile: userProfile, // For Admin UI to revert
            loading,
            authResolved,
            masterData,
            allCalendar,
            sectionUpdates,
            isSyncing,
            isOffline,
            dataSource,
            manualSync,
            setPreviewProfile, // Function to enable/disable preview
            isPreviewing: !!previewProfile
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

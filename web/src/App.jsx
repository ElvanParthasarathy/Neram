import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { db, auth } from "./firebase";
import { ref, onValue, get, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import "@fontsource-variable/inter";

// Styles
import "./App.css";
import "./mobile.css";
import "./mobileapp.css";

// Data & Components
import { adminEmails } from "./data/admins";
import Navbar from "./components/Navbar";
import MobileNavbar from "./components/MobileNavbar";
import Footer from "./components/Footer";
import SetupModal from "./components/SetupModal";
import Home from "./pages/Home";
import Schedule from "./pages/Schedule";
import Calendar from "./pages/Calendar";
import CollegeSites from "./pages/CollegeSites";
import Contact from "./pages/Contact";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import Settings from "./pages/Settings";
import AdminPanel from "./pages/AdminPanel";
import Notes from "./pages/Notes";

// --- UTILITY HELPERS ---
const toLocalISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseAsLocal = (dateStr) => {
  if (!dateStr) return new Date();
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [y, m, d] = cleanDate.split('-').map(Number);
  return new Date(y, m - 1, d);
};

function AppContent({ user, isAdminUser, isMobile, loading, showForcedSetup, globalData, dbUserProfile, activeProfile }) {
  const navigate = useNavigate();
  const location = useLocation();

  // --- MOBILE SCROLL ENGINE STATE ---
  const scrollRef = useRef(null);
  const isAnimating = useRef(false);
  const animationFrameId = useRef(null);

  const tabs = ["/", "/schedule", "/calendar", "/notes"];
  const currentTabIndex = tabs.indexOf(location.pathname);
  const isMainTab = currentTabIndex !== -1;

  // 1. CLICK NAVIGATION (Standard Navigation)
  const scrollToTab = (index) => {
    navigate(tabs[index], { replace: true });
  };






  // --- BACK BUTTON LOGIC ---
  useEffect(() => {
    if (!user) return;
    const handleBackButton = (event) => {
      const mainPaths = ["/schedule", "/calendar", "/notes", "/college-sites", "/contact"];
      const isMainPath = mainPaths.includes(location.pathname);
      if (location.pathname === "/") return;
      if (isMainPath) {
        event.preventDefault();
        navigate("/", { replace: true });
      }
    };
    window.addEventListener("popstate", handleBackButton);
    if (location.pathname === "/") {
      window.history.pushState(null, document.title, window.location.href);
    }
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [location.pathname, user, navigate]);


  if (loading) return (
    <div className="ios-loader-container">
      <div className="ios-loading-wrapper">
        <div className="mac-loader-spinner">
          {[...Array(12)].map((_, i) => <div key={i} className="bar"></div>)}
        </div>
        <p className="mac-loader-text">Verifying Access</p>
      </div>
    </div>
  );

  return (
    <>
      {!user ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div id="app-shell" className={isMobile ? "mobile-mode-active" : "desktop-mode-active"}>

          <MobileNavbar
            isAdmin={isAdminUser}
            activeTab={currentTabIndex}
            onTabClick={scrollToTab}
          />

          <Navbar
            user={user}
            userProfile={dbUserProfile}
            isAdmin={isAdminUser}
            isSyncing={globalData.isSyncing}
          />

          <main id="main-viewport">

            {/* MOBILE VIEW: No Swipe */}
            {isMobile && isMainTab ? (
              <div className="mobile-page-container">
                <Routes>
                  <Route path="/" element={<Home isAdmin={isAdminUser} globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                  <Route path="/schedule" element={<Schedule globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                  <Route path="/calendar" element={<Calendar isAdmin={isAdminUser} globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                  <Route path="/notes" element={<Notes />} />
                </Routes>
              </div>
            ) : (
              /* DESKTOP VIEW: Standard Routing */
              <div className="main-content-area">
                <Routes>
                  <Route path="/" element={<Home isAdmin={isAdminUser} globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                  <Route path="/schedule" element={<Schedule globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                  <Route path="/calendar" element={<Calendar isAdmin={isAdminUser} globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                  <Route path="/notes" element={<Notes />} />
                  <Route path="/college-sites" element={<CollegeSites />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin" element={isAdminUser ? <AdminPanel /> : <Navigate to="/" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Footer />
              </div>
            )}

          </main>
          {showForcedSetup && <SetupModal uid={user.uid} />}
        </div>
      )}
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showForcedSetup, setShowForcedSetup] = useState(false);
  const [dbUserProfile, setDbUserProfile] = useState({ batch: "", department: "", section: "" });
  const [activeProfile, setActiveProfile] = useState(null);

  const [globalData, setGlobalData] = useState({
    masterData: { courses: [], timetable: {}, exams: [], counseling: { counselors: [], coordinators: {} } },
    allCalendar: [],
    sectionUpdates: { live: {}, general: "" },
    isSyncing: true
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const expandGoogleEvent = useCallback((event) => {
    const startVal = event.start.dateTime || event.start.date;
    const endVal = event.end.dateTime || event.end.date;
    const startDate = parseAsLocal(startVal);
    const endDate = parseAsLocal(endVal);
    let curr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let stop = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    let days = [];
    const isAllDay = !event.start.dateTime;
    const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    while (isAllDay ? curr < stop : curr <= stop) {
      const dateStr = toLocalISO(curr);
      let timeRange = "All Day";
      if (!isAllDay) {
        const sTime = new Date(startVal);
        const eTime = new Date(endVal);
        timeRange = `${formatTime(sTime)} - ${formatTime(eTime)}`;
      }
      days.push({ id: `${event.id}_${dateStr}`, title: event.summary || "Untitled", date: dateStr, fullTime: timeRange });
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, []);

  const runGlobalCalendarSync = useCallback(async (batchName) => {
    try {
      const configSnap = await get(ref(db, `calendars/${batchName}`));
      if (!configSnap.exists()) {
        setGlobalData(prev => ({ ...prev, isSyncing: false }));
        return;
      }

      const { config, semConfig, events: firebaseEvents } = configSnap.val();
      if (!config?.apiKey || !config?.calendarId) {
        setGlobalData(prev => ({ ...prev, isSyncing: false }));
        return;
      }

      const timeMin = new Date(semConfig?.start || '2025-12-01').toISOString();
      const timeMax = new Date(semConfig?.end || '2026-05-31').toISOString();
      const url = `https://www.googleapis.com/calendar/v3/calendars/${config.calendarId}/events?key=${config.apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.error) {
        setGlobalData(prev => ({ ...prev, isSyncing: false }));
        return;
      }

      let allExpanded = [];
      data.items?.forEach(item => { allExpanded = [...allExpanded, ...expandGoogleEvent(item)]; });
      allExpanded.sort((a, b) => new Date(a.date) - new Date(b.date));

      setGlobalData(prev => ({ ...prev, allCalendar: allExpanded, isSyncing: false }));

      const getQuickHash = (evs) => JSON.stringify((evs || []).map(e => `${e.id}|${e.title}|${e.fullTime}`));
      if (getQuickHash(firebaseEvents) !== getQuickHash(allExpanded)) {
        await set(ref(db, `calendars/${batchName}/events`), allExpanded);
      }
    } catch (err) {
      console.error("Global Sync error:", err);
      setGlobalData(prev => ({ ...prev, isSyncing: false }));
    }
  }, [expandGoogleEvent]);

  useEffect(() => {
    let userUnsubscribe = null;

    const authUnsubscribe = onAuthStateChanged(auth, (u) => {
      if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = null;
      }

      if (u) {
        setUser(u);
        const userRef = ref(db, `users/${u.uid}`);
        userUnsubscribe = onValue(userRef, (snapshot) => {
          const userData = snapshot.val() || {};
          setDbUserProfile(userData);
          setIsAdminUser(adminEmails.includes(u.email) || userData?.role === 'admin');
          setShowForcedSetup(!userData?.batch || !userData?.department || !userData?.section);

          const savedTemp = sessionStorage.getItem("admin_preview_session");
          if (savedTemp) {
            try {
              setActiveProfile(JSON.parse(savedTemp));
            } catch (err) {
              sessionStorage.removeItem("admin_preview_session");
              setActiveProfile(userData);
            }
          } else {
            setActiveProfile(userData);
          }

          setLoading(false);
        });
      } else {
        setUser(null); setIsAdminUser(false); setShowForcedSetup(false); setLoading(false);
      }
    });

    const handleViewChange = () => {
      const savedTemp = sessionStorage.getItem("admin_preview_session");
      if (savedTemp) {
        try {
          setActiveProfile(JSON.parse(savedTemp));
        } catch (e) {
          sessionStorage.removeItem("admin_preview_session");
        }
      }
    };

    window.addEventListener('adminViewChanged', handleViewChange);

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
      window.removeEventListener('adminViewChanged', handleViewChange);
    };
  }, []);

  useEffect(() => {
    if (!activeProfile?.batch || !activeProfile?.section) return;
    const { batch, department, section } = activeProfile;
    setGlobalData(prev => ({ ...prev, isSyncing: true }));
    const unsubCal = onValue(ref(db, `calendars/${batch}/events`), (snap) => {
      const data = snap.val();
      setGlobalData(prev => ({ ...prev, allCalendar: Array.isArray(data) ? data : Object.values(data || {}) }));
    }, (error) => {
      console.error("Calendar sync error:", error);
      // Even if calendar fails, we might still want to show other data, 
      // but we shouldn't block the UI if this was the only thing pending?
      // Actually globalData.isSyncing is shared. We should disable it on error too.
      // But typically we wait for MasterData.
    });

    const unsubSched = onValue(ref(db, `schedules/${batch}/${department}/${section}`), (snap) => {
      setGlobalData(prev => ({
        ...prev,
        masterData: snap.exists() ? snap.val() : { courses: [], timetable: {}, exams: [], counseling: { counselors: [], coordinators: {} } },
        isSyncing: false
      }));
    }, (error) => {
      console.error("Schedule sync error:", error);
      setGlobalData(prev => ({ ...prev, isSyncing: false }));
    });

    const unsubUpdates = onValue(ref(db, `updates/${batch}/${department}/${section}`), (snap) => {
      const data = snap.val() || {};
      setGlobalData(prev => ({
        ...prev,
        sectionUpdates: {
          live: data.daily_update || {},
          general: { text: data.general_text || "", author: data.general_author || "" }
        }
      }));
    }, (error) => {
      console.error("Updates sync error:", error);
    });

    runGlobalCalendarSync(batch);
    return () => { unsubCal(); unsubSched(); unsubUpdates(); };
  }, [activeProfile, runGlobalCalendarSync]);

  return (
    <BrowserRouter>
      <AppContent
        user={user} isAdminUser={isAdminUser} isMobile={isMobile}
        loading={loading} showForcedSetup={showForcedSetup}
        globalData={globalData} dbUserProfile={dbUserProfile} activeProfile={activeProfile}
      />
    </BrowserRouter>
  );
}

export default App;
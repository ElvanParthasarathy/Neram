import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSystemTheme } from "./hooks/useSystemTheme";
import { db, auth } from "./firebase";
import { ref, onValue, get, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import "@fontsource-variable/inter";

// Styles
import "./App.css";
import "./mobile.css";

import "./styles/admin-sidebar.css";
import "./styles/schedule2.css";

// Data & Components
import { adminEmails, getHardcodedRole } from "./data/admins";
import StudentSidebar from "./components/StudentSidebar";
import Navbar from "./components/Navbar";
import MobileNavbar from "./components/MobileNavbar";

import SetupPage from "./pages/SetupPage";
import Home from "./pages/Home";
import Schedule from "./pages/Schedule";
import Calendar from "./pages/Calendar";
import CollegeSites from "./pages/CollegeSites";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import WelcomePage from "./pages/WelcomePage";
import Settings2 from "./pages/Settings2";
import AdminPanel from "./pages/AdminPanel";
import Notes from "./pages/Notes";
import SplashScreen from "./components/SplashScreen";

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

  // DETECT ADMIN ROUTE
  const isAdminRoute = location.pathname.startsWith('/admin');

  // --- MOBILE SCROLL ENGINE STATE ---
  const scrollRef = useRef(null);
  const isAnimating = useRef(false);
  const animationFrameId = useRef(null);

  const tabs = ["/", "/schedule", "/calendar", "/notes"];
  const currentTabIndex = tabs.indexOf(location.pathname);
  const isMainTab = currentTabIndex !== -1;

  // 1. CLICK NAVIGATION (Standard Navigation)
  const scrollToTab = (index) => {
    const target = tabs[index];

    // If we are navigating to Home, and we are NOT at Home: Push (so Back works)
    // If we are navigating from Home to Subpage: Push (so Back works)
    // If we are navigating Subpage -> Subpage: Replace (to keep "Back -> Home" logic clean)

    if (target === "/" || location.pathname === "/") {
      navigate(target);
    } else {
      // Subpage -> Subpage
      navigate(target, { replace: true });
    }
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
    return () => window.removeEventListener("popstate", handleBackButton);
  }, [location.pathname, user, navigate]);






  if (loading) return <SplashScreen />;

  return (
    <>
      {!user ? (
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (() => {
        // --- BLOCK PURE ADMINS (Super/Faculty) FROM STUDENT PORTAL ---
        const emailRole = user?.email ? getHardcodedRole(user.email) : null;
        const userRole = emailRole || dbUserProfile?.role || 'student';
        const isPureAdmin = (userRole === 'super_admin' || userRole === 'faculty') && (!dbUserProfile?.batch || !dbUserProfile?.section);

        if (isPureAdmin) {
          return (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100vh', width: '100vw', background: 'var(--mac-bg-primary)',
              fontFamily: "'Inter', system-ui, sans-serif", color: 'var(--mac-text)',
              flexDirection: 'column', gap: '20px', textAlign: 'center'
            }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>Admin Account Detected</h1>
              <p style={{ fontSize: '15px', color: 'var(--mac-text-secondary)', maxWidth: '400px', lineHeight: 1.6 }}>
                Your account is registered as a <strong style={{ color: 'var(--mac-traffic-yellow)' }}>{userRole === 'super_admin' ? 'Super Admin' : 'Faculty Admin'}</strong>.
                The Student Portal requires student data (Batch, Section) which is not available for your role.
              </p>
              <a href="/admin.html" style={{
                background: 'var(--mac-blue)', color: '#fff', padding: '14px 32px',
                borderRadius: '50px', textDecoration: 'none', fontWeight: 600,
                fontSize: '14px', marginTop: '10px'
              }}>
                Go to Admin Portal →
              </a>
            </div>
          );
        }

        return (
          <div id="app-shell" className={isMobile ? "mobile-mode-active" : "desktop-mode-active"}>

            {/* User Mobile Navbar */}
            <MobileNavbar
              isAdmin={isAdminUser}
              activeTab={currentTabIndex}
              onTabClick={scrollToTab}
            />

            {/* Sidebar Navigation */}
            <StudentSidebar
              user={user}
              userProfile={dbUserProfile}
              isAdmin={isAdminUser}
            />

            <main id="main-viewport">

              {/* MOBILE VIEW: No Swipe */}
              {isMobile && isMainTab ? (
                <div className="mobile-page-container">
                  <Routes>
                    <Route path="/" element={<Home isAdmin={isAdminUser} globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                    <Route path="/schedule" element={<Schedule globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                    <Route path="/calendar" element={<Calendar isMobile={true} isAdmin={isAdminUser} globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                    <Route path="/notes" element={<Notes />} />
                  </Routes>
                </div>
              ) : (
                /* DESKTOP VIEW */
                <div className="main-content-area">
                  <Routes>
                    <Route path="/" element={<Home isAdmin={isAdminUser} globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                    <Route path="/schedule" element={<Schedule globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                    <Route path="/calendar" element={<Calendar isMobile={isMobile} isAdmin={isAdminUser} globalData={globalData} userProfile={dbUserProfile} activeProfile={activeProfile} />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/college-sites" element={<CollegeSites />} />

                    <Route path="/settings" element={<Settings2 userProfile={dbUserProfile} />} />

                    {/* Redirect /admin to the separate admin site */}
                    <Route path="/admin" element={<div style={{ padding: 50 }}>Please use <a href="/admin.html">/admin.html</a> or the Admin Portal URL.</div>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>

                </div>
              )}

            </main>
            {showForcedSetup && <SetupPage user={user} onComplete={() => setShowForcedSetup(false)} />}
          </div>
        );
      })()}
    </>
  );
}

function App() {
  useSystemTheme();
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
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);

      // SAFETY: No longer forcing remove dark mode on desktop
      /*
      if (!mobile) {
        document.documentElement.classList.remove("dark");
      }
      */
    };

    // Initial Check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- DYNAMIC STATUS BAR COLOR ---
  useEffect(() => {
    const updateThemeColor = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const metaThemeColor = document.querySelector("meta[name='theme-color']");
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", isDark ? "#000000" : "#F5F5F7");
      }
    };

    // Initial check
    updateThemeColor();

    // Observe html class changes (for theme switching)
    const observer = new MutationObserver(updateThemeColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
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

        // --- OPTIMISTIC LOAD FROM CACHE ---
        const cachedProfile = localStorage.getItem(`user_profile_cache_${u.uid}`);
        if (cachedProfile) {
          try {
            const parsed = JSON.parse(cachedProfile);
            setDbUserProfile(parsed);

            // Re-apply admin/setup logic based on cache
            setIsAdminUser(adminEmails.includes(u.email) || parsed?.role === 'admin');
            setShowForcedSetup(!parsed?.batch || !parsed?.department || !parsed?.section);

            const savedTemp = sessionStorage.getItem("admin_preview_session");
            setActiveProfile(savedTemp ? JSON.parse(savedTemp) : parsed);

            setLoading(false); // <--- UNBLOCK UI IMMEDIATELY
          } catch (e) {
            console.warn("Cache parse failed", e);
          }
        }

        const userRef = ref(db, `users/${u.uid}`);
        userUnsubscribe = onValue(userRef, (snapshot) => {
          const userData = snapshot.val() || {};

          // Update Cache
          localStorage.setItem(`user_profile_cache_${u.uid}`, JSON.stringify(userData));

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
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, onValue } from "firebase/database";


// =================================================================================
//  IOS "26" ULTIMATE ICONS (Redesigned: Filled, Centered, Geometric)
// =================================================================================

const IconDots = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
    <circle cx="5" cy="12" r="2" />
  </svg>
);

// 2. HOME (Main Nav)
const IconHome = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.71,11.29l-9-9a1,1,0,0,0-1.42,0l-9,9a1,1,0,0,0-.21,1.09A1,1,0,0,0,3,13H4v7.3A1.77,1.77,0,0,0,5.83,22H8.5a1,1,0,0,0,1-1V16.1a1,1,0,0,1,1-1h3a1,1,0,0,1,1,1V21a1,1,0,0,0,1,1h2.67A1.77,1.77,0,0,0,20,20.3V13h1a1,1,0,0,0,.92-.62A1,1,0,0,0,21.71,11.29Z" />
  </svg>
);

// 3. CLOCK (Schedule)
const IconClock = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm11-5a1 1 0 1 0-2 0v3.764a3 3 0 0 0 1.658 2.683l2.895 1.447a1 1 0 1 0 .894-1.788l-2.894-1.448a1 1 0 0 1-.553-.894V7z"
      clipRule="evenodd"
    />
  </svg>
);

// 4. CALENDAR
const IconCalendar = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none">
    <path d="M22 14V12C22 11.161 22 10.4153 21.9871 9.75H2.0129C2 10.4153 2 11.161 2 12V14C2 17.7712 2 19.6569 3.17157 20.8284C4.34315 22 6.22876 22 10 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14Z" fill="currentColor" />
    <path d="M7.75 2.5C7.75 2.08579 7.41421 1.75 7 1.75C6.58579 1.75 6.25 2.08579 6.25 2.5V4.07926C4.81067 4.19451 3.86577 4.47737 3.17157 5.17157C2.47737 5.86577 2.19451 6.81067 2.07926 8.25H21.9207C21.8055 6.81067 21.5226 5.86577 20.8284 5.17157C20.1342 4.47737 19.1893 4.19451 17.75 4.07926V2.5C17.75 2.08579 17.4142 1.75 17 1.75C16.5858 1.75 16.25 2.08579 16.25 2.5V4.0129C15.5847 4 14.839 4 14 4H10C9.16097 4 8.41527 4 7.75 4.0129V2.5Z" fill="currentColor" />
  </svg>
);

// 5. USER (Profile)
const IconUser = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
  </svg>
);

// 6.5 NOTES (Book)
const IconBook = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
  </svg>
);

// 7. SITES (App Drawer)
const IconSites = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.5 4.5a3 3 0 0 1 3-3h1.5a3 3 0 0 1 3 3v1.5a3 3 0 0 1-3 3H7.5a3 3 0 0 1-3-3V4.5ZM15 4.5a3 3 0 0 1 3-3h1.5a3 3 0 0 1 3 3v1.5a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V4.5ZM4.5 15a3 3 0 0 1 3-3h1.5a3 3 0 0 1 3 3v1.5a3 3 0 0 1-3 3H7.5a3 3 0 0 1-3-3V15ZM15 15a3 3 0 0 1 3-3h1.5a3 3 0 0 1 3 3v1.5a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V15Z" />
  </svg>
);

// 8. ADMIN (Shield with User)
const IconAdmin = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167V11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914V10.4167ZM14 9C14 10.1046 13.1046 11 12 11C10.8954 11 10 10.1046 10 9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9ZM12 17C16 17 16 16.1046 16 15C16 13.8954 14.2091 13 12 13C9.79086 13 8 13.8954 8 15C8 16.1046 8 17 12 17Z"
      fill="currentColor"
    />
  </svg>
);

// 9. EYE (Preview)
const IconEye = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clipRule="evenodd" />
  </svg>
);

// 10. MOON/SUN (Appearance Menu)
const IconMoonSun = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75s-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25Zm0 1.5v16.5c4.557 0 8.25-3.693 8.25-8.25 0-4.557-3.693-8.25-8.25-8.25Z" clipRule="evenodd" />
  </svg>
);

// 11. LOGOUT (Power)
const IconLogOut = (props) => (
  <svg {...props} viewBox="0 0 512 512" fill="#FF3B30">
    <g>
      <path d="M423.262,91.992c-16.877-15.91-43.434-15.098-59.32,1.778c-15.894,16.877-15.098,43.434,1.779,59.32 c32.082,30.213,49.754,71.238,49.754,115.5c0,87.934-71.541,159.476-159.476,159.476S96.525,356.524,96.525,268.59 c0-44.262,17.668-85.287,49.754-115.5c16.877-15.885,17.672-42.442,1.779-59.32c-15.885-16.885-42.455-17.688-59.32-1.778 C40.344,137.557,12.59,201.926,12.59,268.59C12.59,402.803,121.783,512,256,512c134.213,0,243.41-109.197,243.41-243.41 C499.41,201.926,471.656,137.557,423.262,91.992z" />
      <path d="M256,268.59c23.178,0,41.967-15.033,41.967-33.574V33.574C297.967,15.033,279.178,0,256,0 c-23.178,0-41.967,15.033-41.967,33.574v201.443C214.033,253.557,232.822,268.59,256,268.59z" />
    </g>
  </svg>
);

// 12. AUTO (Device)
const IconAuto = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M10.5 18.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" />
    <path fillRule="evenodd" d="M8.625 1.5A3.375 3.375 0 0 0 5.25 4.875v14.25a3.375 3.375 0 0 0 3.375 3.375h6.75a3.375 3.375 0 0 0 3.375-3.375V4.875A3.375 3.375 0 0 0 15.375 1.5h-6.75ZM7.5 4.875a1.125 1.125 0 0 1 1.125-1.125h6.75a1.125 1.125 0 0 1 1.125 1.125v14.25a1.125 1.125 0 0 1-1.125 1.125h-6.75A1.125 1.125 0 0 1 7.5 19.125V4.875Z" clipRule="evenodd" />
  </svg>
);

// 13. LIGHT (Sun)
const IconSun = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
  </svg>
);

// 14. DARK (Moon)
const IconMoon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
  </svg>
);

// 15. CHEVRON RIGHT
const IconChevronRight = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
  </svg>
);

// 15.5 CHEVRON LEFT
const IconChevronLeft = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" />
  </svg>
);

// 16. ARROW LEFT
const IconArrowLeft = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
  </svg>
);

const IconBell = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none">
    <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="currentColor" />
  </svg>
);

const IconSettings = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);


// CUSTOM MONTH VIEW ICON (Replication of ic_month_view_custom.xml)
const IconCustomMonth = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none">
    <path
      d="M22 16H2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M2 8C2 5.79086 3.79086 4 6 4H18C20.2091 4 22 5.79086 22 8V18C22 20.2091 20.2091 22 18 22H6C3.79086 22 2 20.2091 2 18V8Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M9 11.5H15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M8 2V5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M16 2V5.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

// CUSTOM LIST VIEW ICON (Replication of ic_list_view_custom.xml)
const IconCustomList = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none">
    {/* Bullet 1 */}
    <path
      d="M4 5H4.01"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Line 1 */}
    <path
      d="M9 5H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Bullet 2 */}
    <path
      d="M4 12H4.01"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Line 2 */}
    <path
      d="M9 12H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Bullet 3 */}
    <path
      d="M4 19H4.01"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Line 3 */}
    <path
      d="M9 19H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);


const MobileNavbar = ({ isAdmin, activeTab, onTabClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(auth.currentUser);
  const [dbUser, setDbUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState('main'); // 'main' or 'appearance'
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('auto');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const showBackButton = !['/', '/schedule', '/calendar', '/notes'].includes(location.pathname);

  // Toggle CSS class for frame overlay adjustment (Kotlin: bottomMargin changes per screen)
  useEffect(() => {
    if (showBackButton) {
      document.documentElement.classList.add('secondary-screen');
    } else {
      document.documentElement.classList.remove('secondary-screen');
    }
  }, [showBackButton]);

  const getScreenTitle = (path) => {
    switch (path) {
      case '/': return "Neram";
      case '/schedule': return "Schedule";
      case '/calendar': return "Calendar";
      case '/notes': return "Notes";
      case '/settings': return "Settings";
      case '/profile': return "Edit Profile";
      case '/college-sites': return "Important Sites";
      case '/contact': return "Contact";
      default: return "";
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 7. LISTEN FOR CUSTOM NAV UPDATES (Settings Sub-pages) ---
  const [navOverride, setNavOverride] = useState(null);

  useEffect(() => {
    const handleNavUpdate = (e) => {
      // e.detail can be { title, onBack: 'goHub' } or just { title }
      setNavOverride(e.detail);
    };
    window.addEventListener('neram-update-nav', handleNavUpdate);
    return () => window.removeEventListener('neram-update-nav', handleNavUpdate);
  }, []);

  // Also reset override on route change
  useEffect(() => {
    setNavOverride(null);
  }, [location.pathname]);

  useEffect(() => {
    const syncTheme = () => {
      setCurrentTheme(localStorage.getItem("neram-theme") || "auto");
    };
    syncTheme();
    window.addEventListener("theme-change", syncTheme);
    return () => window.removeEventListener("theme-change", syncTheme);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setDbUser(null); return; }
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snap) => {
      if (snap.exists()) setDbUser(snap.val());
    });
    return () => unsubscribe();
  }, [user]);

  if (!isMobile) return null;

  const handleBack = () => {
    if (navOverride?.onBack === 'goHub') {
      // Dispatch event for settings to catch
      window.dispatchEvent(new Event('neram-go-hub'));
      return;
    }
    window.history.back();
  };

  const currentTitle = navOverride?.title || getScreenTitle(location.pathname);

  const handleNav = (targetPath, index) => {
    if (index !== undefined && onTabClick) {
      onTabClick(index);
    } else {
      setIsMenuOpen(false);
      if (location.pathname === targetPath) return;

      const isTabSwitch = index !== undefined;
      const rootTabs = ["/", "/schedule", "/calendar", "/notes", "/settings"];
      const isCurrentlyRoot = rootTabs.includes(location.pathname);

      if (isTabSwitch) {
        if (!isCurrentlyRoot) {
          // We are on a subpage. Pop it off before switching tabs.
          navigate(-1);
          setTimeout(() => {
            const poppedToHome = window.location.pathname === '/' || window.location.pathname === '/home';
            navigate(targetPath, { replace: !poppedToHome });
          }, 10);
        } else {
          // We are on a root tab. PUSH from Home, REPLACE from other tabs.
          navigate(targetPath, { replace: location.pathname !== '/' });
        }
      } else {
        // Menu item (subpages like settings, profile, etc)
        navigate(targetPath);
      }
    }
  };

  const requestLogout = () => { setIsMenuOpen(false); setShowLogoutConfirm(true); };

  const performLogout = async () => {
    try {
      sessionStorage.removeItem("admin_preview_session");
      await signOut(auth);
      navigate('/login', { replace: true });
    } catch (e) { console.error(e); }
  };

  const handleThemeChange = (theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("neram-theme", theme);
    window.dispatchEvent(new Event("theme-change"));
  };

  return (
    <>
      {/* 2. LOGOUT CONFIRM */}
      {showLogoutConfirm && (
        <>
          <div className="switcher-backdrop" style={{ zIndex: 10002, background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowLogoutConfirm(false)} />
          <div className="logout-confirm-modal">
            <h3 className="confirm-title">Sign Out?</h3>
            <p className="confirm-text">Are you sure you want to log out?</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
              <button className="confirm-btn confirm" onClick={performLogout}>Sign Out</button>
            </div>
          </div>
        </>
      )}

      {/* 3. TOP BAR — Ported from Kotlin TopBar + SecondaryTopBar.kt */}
      <div className="mobile-top-bar">
        {(showBackButton || navOverride) ? (
          <>
            <button className="top-back-btn" onClick={handleBack}>
              <IconChevronLeft style={{ width: '24px', height: '24px' }} />
            </button>
            <span className="secondary-top-title">{currentTitle}</span>
          </>
        ) : (
          <span className="top-bar-title">{currentTitle}</span>
        )}

        {/* Action buttons */}
        <div className="top-bar-actions">
          {location.pathname === '/calendar' ? (
            <>
              <button
                className="top-action-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('neram-cal-view', { detail: 'month' }))}
                title="Month View"
              >
                <IconCustomMonth style={{ width: '22px', height: '22px' }} />
              </button>
              <button
                className="top-action-btn"
                onClick={() => window.dispatchEvent(new CustomEvent('neram-cal-view', { detail: 'schedule' }))}
                title="Schedule View"
              >
                <IconCustomList style={{ width: '22px', height: '22px' }} />
              </button>
              <button
                className="top-action-btn"
                onClick={() => window.dispatchEvent(new Event('neram-cal-today'))}
                title="Today"
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid currentColor',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '900',
                  lineHeight: '1',
                  paddingTop: '1px'
                }}>
                  {new Date().getDate()}
                </div>
              </button>
            </>
          ) : ['/settings', '/college-sites'].includes(location.pathname) ? (
            null
          ) : (
            <>
              <button className="top-back-btn" onClick={() => navigate('/notifications')} style={{ marginRight: '8px' }}>
                <IconBell style={{ width: '22px', height: '22px' }} />
              </button>
              {/* Standard 3-Dot Menu */}
              <button className="top-back-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                <IconDots style={{ width: '24px', height: '24px' }} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4. MENU DROPDOWN (PRESERVING ORIGINAL CONTENT & ICONS) */}
      {isMenuOpen && (
        <>
          <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div className="top-menu-dropdown" style={{ height: menuView === 'main' ? '168px' : '220px' }}>
            <div className="menu-slider-track" style={{ transform: menuView === 'main' ? 'translateX(0%)' : 'translateX(-50%)' }}>

              {/* MAIN MENU (Kotlin Match: settings, important sites, appearance) */}
              <div className="menu-view">
                <button onClick={() => handleNav('/college-sites')} className="menu-item">
                  <IconSites className="menu-icon" /> Important Sites
                </button>
                <button onClick={() => handleNav('/settings')} className="menu-item">
                  <IconSettings className="menu-icon" /> Settings
                </button>
                <div className="menu-divider" />
                <button onClick={() => setMenuView('appearance')} className="menu-item space-between">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IconMoonSun className="menu-icon" />
                    <span>Appearance</span>
                  </div>
                  <IconChevronRight style={{ width: '18px', height: '18px', opacity: 0.4 }} />
                </button>
              </div>

              {/* APPEARANCE MENU */}
              <div className="menu-view">
                <button onClick={() => setMenuView('main')} className="menu-item back-btn">
                  <IconChevronLeft style={{ width: '20px', height: '20px' }} /> Back
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleThemeChange('auto')} className={`menu-item ${currentTheme === 'auto' ? 'selected' : ''}`}>
                  <IconAuto className="menu-icon" /> Auto System
                </button>
                <button onClick={() => handleThemeChange('light')} className={`menu-item ${currentTheme === 'light' ? 'selected' : ''}`}>
                  <IconSun className="menu-icon" /> Light Mode
                </button>
                <button onClick={() => handleThemeChange('dark')} className={`menu-item ${currentTheme === 'dark' ? 'selected' : ''}`}>
                  <IconMoon className="menu-icon" /> Dark Mode
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 5. BOTTOM BAR — Only on main tabs (Kotlin: if currentScreen == "tabs") */}
      {!showBackButton && (
        <div className="mobile-bottom-bar">
          <div className="nav-links">
            <button className={`nav-item ${activeTab === 0 ? 'active' : ''}`} onClick={() => handleNav('/', 0)}>
              <div className="nav-icon-container">
                <IconHome />
              </div>
              <span className="nav-label">Home</span>
            </button>

            <button className={`nav-item ${activeTab === 1 ? 'active' : ''}`} onClick={() => handleNav('/schedule', 1)}>
              <div className="nav-icon-container">
                <IconClock />
              </div>
              <span className="nav-label">Schedule</span>
            </button>

            <button className={`nav-item ${activeTab === 2 ? 'active' : ''}`} onClick={() => handleNav('/calendar', 2)}>
              <div className="nav-icon-container">
                <IconCalendar />
              </div>
              <span className="nav-label">Calendar</span>
            </button>

            <button className={`nav-item ${activeTab === 3 ? 'active' : ''}`} onClick={() => handleNav('/notes', 3)}>
              <div className="nav-icon-container">
                <IconBook />
              </div>
              <span className="nav-label">Notes</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavbar;
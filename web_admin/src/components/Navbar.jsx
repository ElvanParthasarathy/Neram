import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import Logo from "../assets/neramv.svg";
import AdminViewSwitcher from "./AdminViewSwitcher";
import ThemeToggle from "./ThemeToggle";

import { RiUser3Fill } from 'react-icons/ri';

// UPDATED: Added 'userProfile' to props
const Navbar = ({ user, userProfile, isAdmin }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // 1. Fetch Real User Profile (Kept for internal logic)
  useEffect(() => {
    if (!user) { setDbUser(null); return; }
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) setDbUser(snapshot.val());
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Logic to detect if Preview Mode is active
  useEffect(() => {
    const checkPreviewStatus = () => {
      const saved = sessionStorage.getItem("admin_preview_session");
      if (saved && dbUser) {
        const previewData = JSON.parse(saved);
        const isDifferent =
          previewData.batch !== dbUser.batch ||
          previewData.department !== dbUser.department ||
          previewData.section !== dbUser.section;
        setIsPreviewActive(isDifferent);
      } else {
        setIsPreviewActive(false);
      }
    };

    checkPreviewStatus();
    window.addEventListener('adminViewChanged', checkPreviewStatus);
    return () => window.removeEventListener('adminViewChanged', checkPreviewStatus);
  }, [dbUser]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsPopupOpen(false);
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("admin_preview_session");
      await signOut(auth);
      setIsPopupOpen(false);
      setIsSwitcherOpen(false);
      navigate("/login");
    } catch (error) { console.error("Logout Error:", error); }
  };

  const togglePreviewSystem = () => {
    setIsSwitcherOpen(!isSwitcherOpen);
  };

  // --- SMART NAME LOGIC ---
  // Prioritizes the explicit firstName from the prop, then local fetch, then fallback splitting
  const firstName = userProfile?.firstName || dbUser?.firstName || (user?.displayName || "").split(' ')[0] || "User";

  return (
    <div className="sidebar">
      {/* 1. BRANDING */}
      <div className="sidebar-branding">
        <Link to="/" className="logo-link">
          <img src={Logo} alt="NERAM Logo" className="sidebar-logo-img" />
        </Link>
      </div>

      {/* PREVIEW MODE BADGE */}
      {isAdmin && isPreviewActive && (
        <div className="preview-mode-badge">
          Preview Mode Active
        </div>
      )}

      {/* 2. MAIN NAVIGATION */}
      <nav className="sidebar-nav">
        {["/", "/schedule", "/calendar", "/notes", "/college-sites", "/contact"].map((path) => {
          const label = path === "/" ? "Home" :
            path === "/college-sites" ? "Sites" :
              path.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <Link
              key={path}
              to={path}
              /* LOGIC: If not Home, use 'replace'. 
                 This prevents building a history stack between main pages.
                 Clicking 'Back' from Schedule will now go straight to Home.
              */
              replace={path !== "/"}
              className={`nav-link ${location.pathname === path ? "active" : ""}`}
            >
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. AUTH & ACTION ZONE */}
      <div className="user-auth-zone" ref={containerRef}>
        {!user ? (
          <button onClick={() => signInWithPopup(auth, googleProvider)} className="login-pill">
            STAFF LOGIN
          </button>
        ) : (
          <div className="auth-stack">
            <div className="profile-container">

              <div
                className={`profile-trigger ${isPopupOpen ? 'active-trigger' : ''}`}
                onClick={() => {
                  setIsPopupOpen(!isPopupOpen);
                  if (isSwitcherOpen) setIsSwitcherOpen(false);
                }}
              >
                <div className="user-avatar-circle">
                  {user.photoURL ? <img src={user.photoURL} alt="User" /> : <RiUser3Fill />}
                </div>
                <div className="trigger-text">
                  {/* UPDATED: Uses the smart 'firstName' variable */}
                  <span className="first-name">{firstName}</span>
                  <p className="role-subtext">{isAdmin ? "Admin" : "Student"}</p>
                </div>
              </div>

              {isPopupOpen && (
                <div className="logout-popup-solid">
                  <div className="dropdown-info">
                    {/* UPDATED: Uses the smart 'firstName' variable */}
                    <h3>Hi, {firstName}</h3>
                    <span className="p-email-small">{user.email}</span>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="popup-actions">
                    {/* Theme Toggle Integration */}
                    <ThemeToggle asMenuItem={true} />
                    <div className="dropdown-divider"></div>

                    {isAdmin && dbUser && (
                      <div
                        className={`popup-item switcher-trigger ${isSwitcherOpen ? 'active-item' : ''}`}
                        onClick={togglePreviewSystem}
                      >
                        <span>Preview System</span>
                      </div>
                    )}

                    {/* SETTINGS & ADMIN: No 'replace' attribute here.
                        This allows them to have their own history stack as requested.
                    */}
                    <Link to="/settings" className="popup-item" onClick={() => { setIsPopupOpen(false); setIsSwitcherOpen(false); }}>
                      <span>Settings</span>
                    </Link>

                    {isAdmin && (
                      <Link to="/admin" className="popup-item" onClick={() => { setIsPopupOpen(false); setIsSwitcherOpen(false); }}>
                        <span>Admin Panel</span>
                      </Link>
                    )}
                  </div>

                  <div className="dropdown-divider"></div>

                  <button onClick={handleLogout} className="popup-logout-btn">
                    Sign Out
                  </button>
                </div>
              )}

              {isSwitcherOpen && isAdmin && dbUser && (
                <AdminViewSwitcher
                  realProfile={dbUser}
                  onClose={() => setIsSwitcherOpen(false)}
                />
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
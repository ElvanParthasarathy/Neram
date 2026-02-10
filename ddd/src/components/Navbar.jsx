import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import Logo from "../assets/neramv.svg";
import ThemeToggle from "./ThemeToggle";

import { RiUser3Fill } from 'react-icons/ri';

const Navbar = ({ user, userProfile, isAdmin }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [dbUser, setDbUser] = useState(null);

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

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsPopupOpen(false);
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
      navigate("/login");
    } catch (error) { console.error("Logout Error:", error); }
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
          <button onClick={() => navigate("/login")} className="btn-login-sidebar">
            Sign In
          </button>
        ) : (
          <div className="user-profile-trigger">
            <div className="user-mini-card" onClick={() => setIsPopupOpen(!isPopupOpen)}>
              <div className="user-avatar-circle">
                {(user.email[0] || "U").toUpperCase()}
              </div>
              <div className="user-text-info">
                <span className="user-name">{firstName}</span>
                <span className="user-subtext">View Profile</span>
              </div>
            </div>

            {/* FLOATING POPUP MENU */}
            {isPopupOpen && (
              <div className="profile-popup-menu">
                <div className="popup-header">
                  <div className="popup-avatar-large">
                    <RiUser3Fill />
                  </div>
                  <div className="popup-user-details">
                    <h4>{firstName}</h4>
                    <p>{user.email}</p>
                  </div>
                </div>

                <div className="popup-actions">
                  <Link to="/settings" className="popup-item" onClick={() => setIsPopupOpen(false)}>
                    Settings
                  </Link>
                  <div className="popup-divider" />
                  <button className="popup-item logout" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* THEME TOGGLE (Separate from profile now) */}
        <div className="sidebar-theme-toggle-container">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
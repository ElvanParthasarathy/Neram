import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import Logo from "../assets/neramv.svg";
import ThemeToggle from "./ThemeToggle";
import {
  RiHomeLine,
  RiCalendarScheduleLine,
  RiCalendarEventLine,
  RiFilePdfLine,
  RiGlobalLine,
  RiContactsLine,
  RiUser3Fill
} from "react-icons/ri";

// UPDATED: Added 'userProfile' to props
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
  const firstName = userProfile?.firstName || dbUser?.firstName || (user?.displayName || "").split(' ')[0] || "User";

  return (
    <div className="admin-sidebar minimal-sidebar">
      {/* 1. BRANDING */}
      <div className="admin-sidebar-branding">
        <Link to="/" className="logo-link">
          <img src={Logo} alt="NERAM Logo" className="admin-sidebar-logo-img" />
        </Link>
      </div>

      <div className="nav-spacer" style={{ flex: 1 }}></div>

      {/* 2. AUTH & ACTION ZONE */}
      <div className="user-auth-zone" ref={containerRef}>
        {!user ? (
          <button onClick={() => signInWithPopup(auth, googleProvider)} className="login-pill">
            LOGIN
          </button>
        ) : (
          <div className="auth-stack">
            <div className="profile-container">

              <div
                className={`profile-trigger ${isPopupOpen ? 'active-trigger' : ''}`}
                onClick={() => {
                  setIsPopupOpen(!isPopupOpen);
                }}
              >
                <div className="user-avatar-circle">
                  {user.photoURL ? <img src={user.photoURL} alt="User" /> : <RiUser3Fill />}
                </div>
                <div className="trigger-text">
                  <span className="first-name">{firstName}</span>
                  <p className="role-subtext">{isAdmin ? "Admin" : "Student"}</p>
                </div>
              </div>

              {isPopupOpen && (
                <div className="logout-popup-solid">
                  <div className="dropdown-info">
                    <h3>Hi, {firstName}</h3>
                    <span className="p-email-small">{user.email}</span>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="popup-actions">
                    <ThemeToggle asMenuItem={true} />
                    <Link to="/settings" className="popup-item" onClick={() => { setIsPopupOpen(false); }}>
                      <span>Settings</span>
                    </Link>
                  </div>

                  <div className="dropdown-divider"></div>

                  <button onClick={handleLogout} className="popup-logout-btn">
                    Sign Out
                  </button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import Logo from "../assets/neramv.svg";
import AdminViewSwitcher from "./AdminViewSwitcher";
import ThemeToggle from "./ThemeToggle";
import {
  RiHomeLine,
  RiGroupLine,
  RiShieldUserLine,
  RiCalendarScheduleLine,
  RiTrophyLine,
  RiFlagLine,
  RiCalendarEventLine,
  RiFilePdfLine,
  RiListCheck,
  RiUser3Fill
} from "react-icons/ri";
import { getHardcodedRole } from "../data/admins";

const Navbar = ({ user, userProfile, isAdmin }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [dbUser, setDbUser] = useState(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  // ADDED: Missing hooks
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

  // --- ROLE DETERMINATION ---
  const emailRole = user?.email ? getHardcodedRole(user.email) : null;
  const dbRole = userProfile?.role;
  const finalRole = emailRole || dbRole || 'student';

  const isRep = finalRole === 'rep';
  const isFacultyOrSuper = finalRole === 'faculty' || finalRole === 'super_admin' || finalRole === 'admin';

  // --- SMART NAME LOGIC ---
  const firstName = userProfile?.firstName || (user?.displayName || "").split(' ')[0] || "User";

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

        {/* DASHBOARD */}
        <Link to="/?mod=home" className={`nav-link ${location.search.includes('mod=home') || (!location.search && location.pathname === '/') ? "active" : ""}`}>
          <RiHomeLine className="nav-icon" />
          <span>Home</span>
        </Link>

        {/* GROUP 1: PERSONS - HIDDEN FOR REPS */}
        {!isRep && (
          <>
            <div className="nav-group-label">Persons</div>
            <Link to="/?mod=users" className={`nav-link ${location.search.includes('mod=users') || (!location.search && location.pathname === '/') ? "active" : ""}`}>
              <RiGroupLine className="nav-icon" />
              <span>Users</span>
            </Link>
            <Link to="/?mod=roles" className={`nav-link ${location.search.includes('mod=roles') ? "active" : ""}`}>
              <RiShieldUserLine className="nav-icon" />
              <span>Admins</span>
            </Link>
          </>
        )}

        {/* GROUP 2: PLANNING */}
        <div className="nav-group-label">Planning</div>
        <Link to="/?mod=schedules" className={`nav-link ${location.search.includes('mod=schedules') ? "active" : ""}`}>
          <RiCalendarScheduleLine className="nav-icon" />
          <span>Schedule</span>
        </Link>
        <Link to="/?mod=exams" className={`nav-link ${location.search.includes('mod=exams') ? "active" : ""}`}>
          <RiTrophyLine className="nav-icon" />
          <span>Exams</span>
        </Link>
        <Link to="/?mod=events" className={`nav-link ${location.search.includes('mod=events') ? "active" : ""}`}>
          <RiFlagLine className="nav-icon" />
          <span>Events</span>
        </Link>

        {/* GROUP 3: ACADEMIC */}
        <div className="nav-group-label">Academic</div>
        <Link to="/?mod=calendar" className={`nav-link ${location.search.includes('mod=calendar') ? "active" : ""}`}>
          <RiCalendarEventLine className="nav-icon" />
          <span>Calendar</span>
        </Link>
        <Link to="/?mod=resources" className={`nav-link ${location.search.includes('mod=resources') ? "active" : ""}`}>
          <RiFilePdfLine className="nav-icon" />
          <span>Resources</span>
        </Link>

        {/* STRUCTURE - HIDDEN FOR REPS */}
        {!isRep && (
          <Link to="/?mod=structure" className={`nav-link ${location.search.includes('mod=structure') ? "active" : ""}`}>
            <RiListCheck className="nav-icon" />
            <span>Structure</span>
          </Link>
        )}


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
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, googleProvider, db } from "../../firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import Logo from "../../assets/neramv.svg";
import LogoIcon from "../../assets/neram.svg";
// import AdminViewSwitcher from "../AdminViewSwitcher"; // REMOVED
import ThemeToggle from "../ui/ThemeToggle";
import {
  RiHomeLine,
  RiGroupLine,
  RiShieldUserLine,
  RiCalendarScheduleLine,
  RiTrophyLine,
  RiFlagLine,
  RiCalendarEventLine,
  RiFilePdfLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
  RiListCheck,
  RiUser3Fill,
  RiTimeLine,
  RiInboxArchiveLine,
  RiScanLine,
  RiComputerLine,
  RiFolderLine
} from "react-icons/ri";
import { getHardcodedRole } from "../../data/admins";

// Styles
import "../../styles/navigation/admin-sidebar.css";

const AdminNavbar = ({ user, userProfile, isAdmin }) => {
  // ... hooks ...
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });
  // const [isSwitcherOpen, setIsSwitcherOpen] = useState(false); // REMOVED
  const [dbUser, setDbUser] = useState(null);
  // const [isPreviewActive, setIsPreviewActive] = useState(false); // REMOVED

  // ADDED: Missing hooks
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  // 1. Fetch Real User Profile (Kept for internal logic)
  useEffect(() => {
    if (!user) { setDbUser(null); return; }
    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDbUser(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsPopupOpen(false);
        // setIsSwitcherOpen(false); // REMOVED
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
      // setIsSwitcherOpen(false); // REMOVED
      navigate("/login");
    } catch (error) { console.error("Logout Error:", error); }
  };

  // REMOVED togglePreviewSystem and checkPreviewStatus effect

  // --- ROLE DETERMINATION ---
  const emailRole = user?.email ? getHardcodedRole(user.email) : null;
  const dbRole = userProfile?.role;
  const finalRole = emailRole || dbRole || 'student';

  const isSuper = finalRole === 'super_admin';
  const isFaculty = finalRole === 'faculty';
  const isRep = finalRole === 'rep';

  // Computed Access Permissions
  const canViewUsers = isSuper || isFaculty;              // Users tab: Super + Faculty
  const canViewAdmins = isSuper || isFaculty || isRep;  // Admins tab: all roles
  const canViewFacultyDir = isSuper;                    // Faculty Directory: Super only
  const canViewCalendar = isSuper || isFaculty;         // Calendar: Super + Faculty
  const canViewResources = isSuper || isFaculty;        // Resources: Super + Faculty
  const canViewNotes = isSuper || isFaculty || isRep;   // Notes: all roles
  const canViewStructure = isSuper;                     // Structure: Super only

  // --- SMART NAME LOGIC ---
  const firstName = userProfile?.firstName || (user?.displayName || "").split(' ')[0] || "User";

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <div className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* 1. BRANDING / LOGO */}
      <div className="admin-sidebar-branding">
        <Link to="/" className="logo-link">
          <img src={isCollapsed ? LogoIcon : Logo} alt="NERAM Logo" className="admin-sidebar-logo-img" />
        </Link>
        <button className="sidebar-collapse-btn" onClick={toggleCollapse} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {isCollapsed ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
        </button>
      </div>

      {/* 2. MAIN NAVIGATION */}
      <nav className="admin-sidebar-nav">

        {/* DASHBOARD */}
        <Link to="/?mod=home" className={`admin-nav-link ${location.search.includes('mod=home') || (!location.search && location.pathname === '/') ? "active" : ""}`}>
          <RiHomeLine className="admin-nav-icon" />
          <span>Home</span>
        </Link>

        {/* GROUP 1: PLANNER — Scheduling & timetable tools */}
        <div className="nav-group-label">Planner</div>
        <Link to="/?mod=schedules" className={`admin-nav-link ${location.search.includes('mod=schedules') ? "active" : ""}`}>
          <RiCalendarScheduleLine className="admin-nav-icon" />
          <span>Schedule</span>
        </Link>
        <Link to="/?mod=exams" className={`admin-nav-link ${location.search.includes('mod=exams') ? "active" : ""}`}>
          <RiTrophyLine className="admin-nav-icon" />
          <span>Exams</span>
        </Link>
        <Link to="/?mod=events" className={`admin-nav-link ${location.search.includes('mod=events') ? "active" : ""}`}>
          <RiFlagLine className="admin-nav-icon" />
          <span>Events</span>
        </Link>
        <Link to="/?mod=special_classes" className={`admin-nav-link ${location.search.includes('mod=special_classes') ? "active" : ""}`}>
          <RiComputerLine className="admin-nav-icon" />
          <span>Special Classes</span>
        </Link>

        {/* GROUP 2: CONTENT — Calendar, materials & notes */}
        {(canViewCalendar || canViewResources || canViewNotes) && (
          <>
            <div className="nav-group-label">Content</div>
            {canViewCalendar && (
              <Link to="/?mod=calendar" className={`admin-nav-link ${location.search.includes('mod=calendar') ? "active" : ""}`}>
                <RiCalendarEventLine className="admin-nav-icon" />
                <span>Calendar</span>
              </Link>
            )}
            {canViewResources && (
              <Link to="/?mod=resources" className={`admin-nav-link ${location.search.includes('mod=resources') ? "active" : ""}`}>
                <RiFilePdfLine className="admin-nav-icon" />
                <span>Resources</span>
              </Link>
            )}
            {canViewNotes && (
              <Link to="/?mod=notes" className={`admin-nav-link ${location.search.includes('mod=notes') ? "active" : ""}`}>
                <RiFolderLine className="admin-nav-icon" />
                <span>Notes Manager</span>
              </Link>
            )}
          </>
        )}

        {/* GROUP 3: ADMIN — People & access management */}
        {(canViewUsers || canViewAdmins) && (
          <>
            <div className="nav-group-label">Admin</div>
            {canViewUsers && (
              <Link to="/?mod=users" className={`admin-nav-link ${location.search.includes('mod=users') ? "active" : ""}`}>
                <RiGroupLine className="admin-nav-icon" />
                <span>Users</span>
              </Link>
            )}
            {canViewAdmins && (
              <Link to="/?mod=roles" className={`admin-nav-link ${location.search.includes('mod=roles') ? "active" : ""}`}>
                <RiShieldUserLine className="admin-nav-icon" />
                <span>Admins</span>
              </Link>
            )}
            {canViewFacultyDir && (
              <Link to="/?mod=faculty" className={`admin-nav-link ${location.search.includes('mod=faculty') ? "active" : ""}`}>
                <RiUser3Fill className="admin-nav-icon" />
                <span>Faculty Directory</span>
              </Link>
            )}
            {isSuper && (
              <Link to="/?mod=pending" className={`admin-nav-link ${location.search.includes('mod=pending') ? "active" : ""}`}>
                <RiTimeLine className="admin-nav-icon" />
                <span>Pending</span>
              </Link>
            )}
          </>
        )}

        {/* GROUP 4: SYSTEM — Infrastructure & structure */}
        {canViewStructure && (
          <>
            <div className="nav-group-label">System</div>
            <Link to="/?mod=structure" className={`admin-nav-link ${location.search.includes('mod=structure') ? "active" : ""}`}>
              <RiListCheck className="admin-nav-icon" />
              <span>Structure</span>
            </Link>
            <Link to="/?mod=archives" className={`admin-nav-link ${location.search.includes('mod=archives') ? "active" : ""}`}>
              <RiInboxArchiveLine className="admin-nav-icon" />
              <span>Archive Tool</span>
            </Link>
          </>
        )}

        <div className="nav-spacer" style={{ height: '20px' }}></div>

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
                    <ThemeToggle asMenuItem={true} />

                    {/* SETTINGS & ADMIN: No 'replace' attribute here.
                        This allows them to have their own history stack as requested.
                    */}
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

export default AdminNavbar;
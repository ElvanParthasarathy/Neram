import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
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

// Styles - Using the same premium sidebar CSS
import "../styles/admin-sidebar.css";
import "../styles/profile.css";

const StudentSidebar = ({ user, userProfile, isAdmin }) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [dbUser, setDbUser] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();
    const containerRef = useRef(null);

    // 1. Fetch Real User Profile for name synchronization
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

    // Handle clicking outside the profile popup
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
            await signOut(auth);
            setIsPopupOpen(false);
            navigate("/login");
        } catch (error) { console.error("Logout Error:", error); }
    };

    // --- SMART NAME LOGIC ---
    const firstName = userProfile?.firstName || dbUser?.firstName || (user?.displayName || "").split(' ')[0] || "User";

    return (
        <div className="admin-sidebar">
            {/* 1. BRANDING / LOGO */}
            <div className="admin-sidebar-branding">
                <Link to="/" className="logo-link">
                    <img src={Logo} alt="NERAM Logo" className="admin-sidebar-logo-img" />
                </Link>
            </div>

            {/* 2. MAIN NAVIGATION */}
            <nav className="admin-sidebar-nav">

                {/* ACADEMICS */}
                <div className="nav-group-label">Academics</div>
                <Link to="/" className={`admin-nav-link ${location.pathname === "/" ? "active" : ""}`}>
                    <RiHomeLine className="admin-nav-icon" />
                    <span>Home</span>
                </Link>
                <Link to="/schedule" replace className={`admin-nav-link ${location.pathname === "/schedule" ? "active" : ""}`}>
                    <RiCalendarScheduleLine className="admin-nav-icon" />
                    <span>Schedule</span>
                </Link>
                <Link to="/calendar" replace className={`admin-nav-link ${location.pathname === "/calendar" ? "active" : ""}`}>
                    <RiCalendarEventLine className="admin-nav-icon" />
                    <span>Calendar</span>
                </Link>
                <Link to="/notes" replace className={`admin-nav-link ${location.pathname === "/notes" ? "active" : ""}`}>
                    <RiFilePdfLine className="admin-nav-icon" />
                    <span>Notes</span>
                </Link>

                {/* RESOURCES */}
                <div className="nav-group-label">Resources</div>
                <Link to="/college-sites" replace className={`admin-nav-link ${location.pathname === "/college-sites" ? "active" : ""}`}>
                    <RiGlobalLine className="admin-nav-icon" />
                    <span>Sites</span>
                </Link>
                <Link to="/contact" replace className={`admin-nav-link ${location.pathname === "/contact" ? "active" : ""}`}>
                    <RiContactsLine className="admin-nav-icon" />
                    <span>Contact</span>
                </Link>

                <div className="nav-spacer" style={{ height: '20px' }}></div>
            </nav>

            {/* 3. AUTH & ACTION ZONE */}
            <div className="user-auth-zone" ref={containerRef}>
                {!user ? (
                    <div style={{ padding: '0 12px 20px 12px' }}>
                        <Link to="/login" className="admin-nav-link" style={{ background: 'var(--mac-blue)', color: 'white', justifyContent: 'center' }}>
                            Login
                        </Link>
                    </div>
                ) : (
                    <div className="auth-stack">
                        <div className="profile-container">
                            <div
                                className={`profile-trigger ${isPopupOpen ? 'active-trigger' : ''}`}
                                onClick={() => setIsPopupOpen(!isPopupOpen)}
                            >
                                <div className="user-avatar-circle">
                                    {user.photoURL ? <img src={user.photoURL} alt="User" /> : <RiUser3Fill />}
                                </div>
                                <div className="trigger-text">
                                    <span className="first-name">{firstName}</span>
                                    <p className="role-subtext">Student</p>
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
                                        <Link to="/settings" className="popup-item" onClick={() => setIsPopupOpen(false)}>
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

export default StudentSidebar;

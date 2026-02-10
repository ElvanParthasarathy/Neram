import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import Logo from "../assets/neramv.svg";

// Icons
import {
    RiDashboardLine,
    RiCalendarScheduleLine,
    RiTrophyLine,
    RiCalendarEventLine,
    RiUser3Line,
    RiShieldUserLine,
    RiBuilding2Line,
    RiFileList3Line
} from 'react-icons/ri';

import "../styles/sidebar.css";

const Sidebar = ({ user, userProfile }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/login");
        } catch (error) { console.error("Logout Error:", error); }
    };

    return (
        <div className="sidebar">
            {/* BRANDING */}
            <div className="sidebar-branding">
                <Link to="/" className="logo-link">
                    <img src={Logo} alt="NERAM Logo" className="sidebar-logo-img" />
                </Link>
            </div>

            {/* NAVIGATION */}
            <nav className="sidebar-nav">
                {/* DASHBOARD */}
                <Link
                    to="/"
                    className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
                >
                    <RiDashboardLine className="nav-icon" />
                    <span>Dashboard</span>
                </Link>

                {/* ACADEMICS */}
                <div className="nav-group-header">ACADEMICS</div>
                <Link
                    to="/schedule"
                    className={`nav-link ${location.pathname === "/schedule" ? "active" : ""}`}
                >
                    <RiCalendarScheduleLine className="nav-icon" />
                    <span>Schedule</span>
                </Link>
                <Link
                    to="/exams"
                    className={`nav-link ${location.pathname === "/exams" ? "active" : ""}`}
                >
                    <RiTrophyLine className="nav-icon" />
                    <span>Exams</span>
                </Link>
                <Link
                    to="/calendar"
                    className={`nav-link ${location.pathname === "/calendar" ? "active" : ""}`}
                >
                    <RiCalendarEventLine className="nav-icon" />
                    <span>Calendar</span>
                </Link>

                {/* PEOPLE */}
                <div className="nav-group-header">PEOPLE</div>
                <Link
                    to="/users"
                    className={`nav-link ${location.pathname === "/users" ? "active" : ""}`}
                >
                    <RiUser3Line className="nav-icon" />
                    <span>User Directory</span>
                </Link>
                <Link
                    to="/admins"
                    className={`nav-link ${location.pathname === "/admins" ? "active" : ""}`}
                >
                    <RiShieldUserLine className="nav-icon" />
                    <span>Admins</span>
                </Link>

                {/* CAMPUS */}
                <div className="nav-group-header">CAMPUS</div>
                <Link
                    to="/structure"
                    className={`nav-link ${location.pathname === "/structure" ? "active" : ""}`}
                >
                    <RiBuilding2Line className="nav-icon" />
                    <span>Structure</span>
                </Link>
                <Link
                    to="/resources"
                    className={`nav-link ${location.pathname === "/resources" ? "active" : ""}`}
                >
                    <RiFileList3Line className="nav-icon" />
                    <span>Resources</span>
                </Link>
            </nav>

            {/* USER PROFILE & LOGOUT */}
            <div className="user-auth-zone">
                <div className="user-mini-profile">
                    <div className="user-avatar-circle">
                        {(user?.email?.[0] || "A").toUpperCase()}
                    </div>
                    <div className="user-info-col">
                        <span className="user-name-text">{user?.displayName || "Admin"}</span>
                        <span className="user-role-text">Administrator</span>
                    </div>
                </div>
                <button className="btn-logout-sidebar" onClick={handleLogout}>
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default Sidebar;

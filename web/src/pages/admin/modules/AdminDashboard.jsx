import React, { useState, useEffect } from 'react';
import { db } from "../../../firebase";
import { ref, onValue } from "firebase/database";
import { getHardcodedRole } from '../../../data/admins';
import {
    RiUser3Fill, RiLayoutGridLine, RiArrowDownSLine, RiShieldUserLine, RiUserSettingsLine, RiSearchLine, RiInformationLine
} from 'react-icons/ri';

// IMPORT HOME & DATA HOOK
import Home from '../../student/Home';
import { useSectionData } from '../../../hooks/useSectionData';
import '../../../styles/admin/home-preview.css';

const AdminDashboard = ({ user, userProfile }) => {
    // --- 1. ROLE & PROFILE LOGIC ---
    const emailRole = user?.email ? getHardcodedRole(user.email) : null;
    const finalRole = emailRole || userProfile?.role || 'student';
    const isSuper = finalRole === 'super_admin';
    const isFaculty = finalRole === 'faculty';
    const isRep = finalRole === 'rep';

    // --- 2. STATE ---
    const [hierarchy, setHierarchy] = useState({});
    const [loading, setLoading] = useState(true);

    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSec, setSelectedSec] = useState("");

    // UI STATE for Custom Dropdowns
    const [openDropdown, setOpenDropdown] = useState(null); // 'batch', 'dept', 'sec'

    // STATS STATE
    const [pendingCount, setPendingCount] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);

    // --- 3. LOAD DATA & INITIALIZE ---
    useEffect(() => {
        const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => {
            const data = snap.val() || {};
            setHierarchy(data);
            setLoading(false);
        });

        // 3b. Fetch Admin Stats (Pending & Total)
        const usersRef = ref(db, 'users');
        const unsubUsers = onValue(usersRef, (snap) => {
            const data = snap.val() || {};
            const usersArray = Object.values(data);
            setPendingCount(usersArray.filter(u => u.role === 'pending').length);
            setTotalUsers(usersArray.filter(u => u.role !== 'pending').length);
        });

        // Click outside listener for dropdowns
        const handleClickOutside = (e) => {
            if (!e.target.closest('.custom-dropdown-container')) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('click', handleClickOutside);

        return () => {
            unsub();
            unsubUsers();
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    // ... (Context Restoration & Persistence logic remains same - skipped for brevity if unchanged, but included for safety if I replace block) ...

    // --- 4. CONTEXT RESTORATION & DEFAULTING ---
    useEffect(() => {
        if (loading) return;

        // Try to load saved context
        const savedContext = JSON.parse(localStorage.getItem('admin_dashboard_context') || '{}');

        if (isRep) {
            setSelectedBatch(userProfile?.batch || "");
            setSelectedDept(userProfile?.department || "");
            setSelectedSec(userProfile?.section || "");
        }
        else if (isFaculty) {
            // Fixed Batch/Dept
            const fixedBatch = userProfile?.batch || savedContext.batch || "";
            const fixedDept = userProfile?.department || savedContext.dept || "";
            setSelectedBatch(fixedBatch);
            setSelectedDept(fixedDept);

            // Section is selectable, try saved, else default
            if (savedContext.sec) setSelectedSec(savedContext.sec);
        }
        else {
            // Super Admin - Full restoration
            if (savedContext.batch) setSelectedBatch(savedContext.batch);
            if (savedContext.dept) setSelectedDept(savedContext.dept);
            if (savedContext.sec) setSelectedSec(savedContext.sec);
        }

    }, [loading, isRep, isFaculty, userProfile]);

    // --- 5. PERSISTENCE ---
    useEffect(() => {
        if (selectedBatch || selectedDept || selectedSec) {
            localStorage.setItem('admin_dashboard_context', JSON.stringify({
                batch: selectedBatch,
                dept: selectedDept,
                sec: selectedSec
            }));
        }
    }, [selectedBatch, selectedDept, selectedSec]);

    // --- 6. DATA FETCHING FOR HOME COMPONENT ---
    // Construct the active profile object based on selection
    const activeProfile = React.useMemo(() => ({
        batch: selectedBatch,
        department: selectedDept,
        section: selectedSec
    }), [selectedBatch, selectedDept, selectedSec]);

    // Fetch data using the hook (same as AdminHomeWrapper)
    const globalData = useSectionData(activeProfile);


    // --- HELPER: Get Dropdown Options ---
    const getBatches = () => Object.keys(hierarchy).sort().reverse();
    const getDepts = () => selectedBatch ? Object.keys(hierarchy[selectedBatch] || {}).filter(k => k !== 'initialized') : [];
    const getSections = () => (selectedBatch && selectedDept) ? (hierarchy[selectedBatch]?.[selectedDept] || []) : [];

    // --- HELPER: Render Custom Dropdown ---
    // --- HELPER: Render Custom Dropdown ---
    // Refactored to place label OUTSIDE the trigger container
    const renderCustomDropdown = (key, label, value, options, onSelect, disabled = false) => {
        const isOpen = openDropdown === key;

        return (
            <div className={`custom-dropdown-container ${disabled ? 'disabled' : ''}`}>
                <div className="stat-label" style={{ marginBottom: '8px', marginLeft: '4px' }}>{label}</div>
                <div
                    className={`dropdown-trigger full-width ${isOpen ? 'active' : ''}`}
                    onClick={() => !disabled && setOpenDropdown(isOpen ? null : key)}
                >
                    <div className="dropdown-trigger-content">
                        <div className={value ? 'stat-value-slim' : 'placeholder-text'}>
                            {value || `Select ${label}`}
                        </div>
                    </div>
                    <RiArrowDownSLine className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
                </div>

                {isOpen && !disabled && (
                    <div className="dropdown-menu">
                        {options.length > 0 ? options.map((opt, idx) => (
                            <div
                                key={idx}
                                className={`dropdown-item ${value === opt ? 'selected' : ''}`}
                                onClick={() => {
                                    onSelect(opt);
                                    setOpenDropdown(null);
                                }}
                            >
                                {opt}
                            </div>
                        )) : <div className="dropdown-item empty">No options</div>}
                    </div>
                )}
            </div>
        );
    };

    // --- PRESENTATION ---
    // Full Name Logic
    const fullName = userProfile?.firstName
        ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
        : (user?.displayName || "User");

    const photoURL = user?.photoURL || userProfile?.photoURL;

    return (
        <div className="admin-dashboard-container">
            <header className="page-header">
                <div className="header-main">
                    <h1 className="page-title">Admin Panel</h1>
                </div>
            </header>

            {/* NEW LAYOUT: 2 COLUMNS (LEFT: PROFILE+CONTEXT, RIGHT: STATS) */}
            <div className={`admin-dashboard-new-layout ${isRep ? 'rep-layout' : ''}`}>
                {/* LEFT COLUMN */}
                <div className="admin-left-column">
                    {/* 1. SLIM PROFILE CARD */}
                    <div className="admin-profile-slim box-flat">
                        <div className="hero-avatar-slim">
                            {photoURL ? <img src={photoURL} alt="Profile" /> : <RiUser3Fill />}
                        </div>
                        <div className="hero-text-slim">
                            <h1>{fullName}</h1>
                            <p className="role-subtext">{finalRole === 'super_admin' ? 'Super Administrator' : finalRole === 'faculty' ? 'Faculty Administrator' : 'Student Representative'}</p>
                        </div>
                    </div>

                    {/* 2. CONTEXT BOX (Formerly Top Row) */}
                    {!isRep && (
                        <div className="admin-context-box box-flat">
                            <h3>Command Center</h3>
                            <div className="context-list">
                                {/* BATCH */}
                                <div className="context-row">

                                    <div className="context-info">
                                        {(isSuper || isFaculty) ? (
                                            renderCustomDropdown(
                                                'batch',
                                                'Batch',
                                                selectedBatch,
                                                getBatches(),
                                                (val) => { setSelectedBatch(val); if (isSuper) setSelectedDept(""); setSelectedSec(""); }
                                            )
                                        ) : <div className="stat-value-slim">{selectedBatch || "-"}</div>}
                                    </div>
                                </div>

                                {/* DEPT */}
                                <div className="context-row">

                                    <div className="context-info">
                                        {isSuper ? (
                                            renderCustomDropdown(
                                                'dept',
                                                'Department',
                                                selectedDept,
                                                getDepts(),
                                                (val) => { setSelectedDept(val); setSelectedSec(""); },
                                                !selectedBatch
                                            )
                                        ) : <div className="stat-value-slim">{selectedDept || "-"}</div>}
                                    </div>
                                </div>

                                {/* SECTION */}
                                <div className="context-row">

                                    <div className="context-info">
                                        {renderCustomDropdown(
                                            'sec',
                                            'Section',
                                            selectedSec,
                                            getSections(),
                                            (val) => setSelectedSec(val),
                                            !selectedDept
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: VERTICAL STATS */}
                <div className="admin-right-column">
                    <div className="stat-card-premium stat-vertical">
                        <div className="stat-header">
                            <div className="stat-icon-box pending"><RiShieldUserLine /></div>
                            <div className="stat-meta">
                                <div className="stat-value">{pendingCount}</div>
                                <div className="stat-label">Pending Approvals</div>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card-premium stat-vertical">
                        <div className="stat-header">
                            <div className="stat-icon-box users"><RiUserSettingsLine /></div>
                            <div className="stat-meta">
                                <div className="stat-value">{totalUsers}</div>
                                <div className="stat-label">Active Users</div>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card-premium stat-vertical">
                        <div className="stat-header">
                            <div className="stat-icon-box context"><RiInformationLine /></div>
                            <div className="stat-meta">
                                <div className="stat-value">Online</div>
                                <div className="stat-label">System Status</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* 2.2 HOME DASHBOARD PREVIEW */}
            <div className="admin-home-preview-v2">
                {selectedBatch && selectedDept && selectedSec ? (
                    <Home
                        isAdmin={true}
                        hideHeader={true}
                        globalData={globalData}
                        userProfile={userProfile}
                        activeProfile={activeProfile}
                    />
                ) : (
                    <div className="empty-state-v2">
                        <RiLayoutGridLine className="empty-icon" />
                        <h3>System Idle</h3>
                        <p>Select a <b>Batch, Department, and Section</b> to load the Command Center view.</p>
                    </div>
                )}
            </div>


            <style>{`
                .admin-badge-inline { font-size: 10px; background: var(--mac-blue); color: #fff; padding: 2px 8px; border-radius: 6px; vertical-align: middle; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                .role-subtext { margin-top: 4px !important; opacity: 0.7; }
                .highlight-name { color: var(--mac-blue); }
            `}</style>
        </div>
    );
};

export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
    RiHomeLine,
    RiCalendarScheduleLine,
    RiCalendarEventLine,
    RiTrophyLine,
    RiMenuLine,
    RiGroupLine,
    RiShieldUserLine,
    RiFilePdfLine,
    RiListCheck,
    RiCloseLine,
    RiArrowLeftSLine,
    RiTimeLine,
    RiSettings3Line,
    RiInboxArchiveLine,
    RiScanLine,
    RiFolderLine,
    RiComputerLine,
    RiUser3Fill
} from "react-icons/ri";
import { getHardcodedRole } from '../../data/admins';
import ThemeToggle from '../ui/ThemeToggle';

const AdminMobileNavbar = ({ isAdminUser, user, userProfile }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const activeModule = searchParams.get('mod') || 'home';
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Show on admin panel and settings
    const isOnSettings = location.pathname === '/settings';

    // --- SETTINGS SUB-SECTION DYNAMIC TITLE (same as student MobileNavbar) ---
    const [navOverride, setNavOverride] = useState(null);

    useEffect(() => {
        const handleNavUpdate = (e) => {
            setNavOverride(e.detail);
        };
        window.addEventListener('neram-update-nav', handleNavUpdate);
        return () => window.removeEventListener('neram-update-nav', handleNavUpdate);
    }, []);

    // Reset override on route change
    useEffect(() => {
        setNavOverride(null);
    }, [location.pathname]);

    // Handle bottom spacing (hide bar spacing on secondary screens like settings)
    useEffect(() => {
        if (isOnSettings) {
            document.documentElement.classList.add('secondary-screen');
        } else {
            document.documentElement.classList.remove('secondary-screen');
        }
        // Cleanup on unmount
        return () => document.documentElement.classList.remove('secondary-screen');
    }, [isOnSettings]);

    // --- EARLY RETURNS (must be after all hooks) ---
    if (location.pathname !== '/' && !isOnSettings) return null;
    if (!isAdminUser) return null;

    // --- ROLE DETERMINATION (Matches AdminNavbar) ---
    const emailRole = user?.email ? getHardcodedRole(user.email) : null;
    const dbRole = userProfile?.role;
    const finalRole = emailRole || dbRole || 'student';

    const isSuper = finalRole === 'super_admin';
    const isFaculty = finalRole === 'faculty';
    const isRep = finalRole === 'rep';

    const canViewUsers = isSuper || isFaculty;              // Users: Super + Faculty
    const canViewAdmins = isSuper || isFaculty || isRep;   // Admins: all roles
    const canViewFacultyDir = isSuper;                      // Faculty Directory: Super only
    const canViewCalendar = isSuper || isFaculty;           // Calendar: Super + Faculty
    const canViewResources = isSuper || isFaculty;          // Resources: Super + Faculty
    const canViewNotes = isSuper || isFaculty || isRep;     // Notes: all roles
    const canViewStructure = isSuper;                       // Structure: Super only

    const handleNav = (mod) => {
        setIsSidebarOpen(false);

        const currentMod = searchParams.get('mod') || 'home';
        if (currentMod === mod) return;

        // Always PUSH to history so back button works in order
        // Exception: if we're ON home and going somewhere, push (normal)
        // If we're going TO home, also push (so back returns to where we were)
        setSearchParams({ mod }, { replace: false });
    };

    const topBarTitle = {
        home: 'Admin Panel',
        schedules: 'Schedule',
        exams: 'Exams',
        events: 'Events',
        users: 'Users',
        roles: 'Admins',
        faculty: 'Faculty Directory',
        calendar: 'Calendar',
        resources: 'Resources',
        notes: 'Notes Manager',
        structure: 'Structure',
        pending: 'Pending Requests',
        special_classes: 'Special Classes',
    }[activeModule] || 'Admin Panel';

    // --- MOBILE BACK NAVIGATION ---
    // The mobile chevron back button should behave exactly like the browser/system back button.
    // All module navigation (drawer, sub-page drill-downs) pushes to history properly,
    // so history.back() / navigate(-1) steps back correctly in all cases.
    const handleBack = () => navigate(-1);

    // Determine current settings title
    const settingsTitle = navOverride?.title || 'Settings';
    const isInSubSection = isOnSettings && navOverride?.title;

    const handleSettingsBack = () => {
        if (isInSubSection) {
            window.dispatchEvent(new Event('neram-go-hub'));
        } else {
            navigate(-1);
        }
    };

    return (
        <>
            {/* 1. TOP BAR */}
            <div className="mobile-top-bar" style={{ justifyContent: 'flex-start' }}>
                {isOnSettings ? (
                    <>
                        <span className="top-bar-title" style={{ flex: 1 }}>{settingsTitle}</span>
                        <button
                            className="top-back-btn"
                            onClick={handleSettingsBack}
                            style={{ marginLeft: 'auto' }}
                        >
                            <RiArrowLeftSLine style={{ width: '24px', height: '24px', color: 'var(--text-primary)' }} />
                        </button>
                    </>
                ) : (
                    <>
                        <button className="top-action-btn" onClick={() => setIsSidebarOpen(true)}>
                            <RiMenuLine style={{ width: '24px', height: '24px', color: 'var(--text-primary)' }} />
                        </button>
                        <span className="top-bar-title" style={{ marginLeft: 0, flex: 1 }}>{topBarTitle}</span>
                        {activeModule !== 'home' && (
                            <button
                                className="top-back-btn"
                                onClick={handleBack}
                                style={{ marginLeft: 'auto' }}
                            >
                                <RiArrowLeftSLine style={{ width: '24px', height: '24px', color: 'var(--text-primary)' }} />
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* 2. SLIDING SIDE DRAWER (Left Side) */}
            {isSidebarOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="menu-backdrop"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 10002, background: 'rgba(0,0,0,0.5)', opacity: 1, transition: 'opacity 0.3s ease' }}
                    />
                    {/* Drawer Panel */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            bottom: 0,
                            width: '280px',
                            zIndex: 10003,
                            background: 'var(--mac-sidebar-bg, var(--bg-card, #ffffff))',
                            boxShadow: '10px 0 40px rgba(0,0,0,0.15)',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}
                    >
                        {/* Drawer Header */}
                        <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                            <span style={{ fontSize: '18px', fontWeight: '800' }}>Admin Menu</span>
                            <button className="top-back-btn" onClick={() => setIsSidebarOpen(false)}>
                                <RiCloseLine style={{ width: '24px', height: '24px' }} />
                            </button>
                        </div>

                        {/* Custom scrollbar styles */}
                        <style>{`
                            .admin-drawer-scroll {
                                scrollbar-width: thin;
                                scrollbar-color: rgba(120,120,128,0.35) transparent;
                            }
                            .admin-drawer-scroll::-webkit-scrollbar {
                                width: 4px;
                            }
                            .admin-drawer-scroll::-webkit-scrollbar-track {
                                background: transparent;
                            }
                            .admin-drawer-scroll::-webkit-scrollbar-thumb {
                                background: rgba(120,120,128,0.35);
                                border-radius: 100px;
                            }
                            html.dark .admin-drawer-scroll::-webkit-scrollbar-thumb {
                                background: rgba(255,255,255,0.18);
                            }
                            .admin-drawer-item {
                                width: calc(100% - 24px);
                                margin: 2px 12px;
                                min-height: 44px;
                                padding: 10px 18px;
                                display: flex;
                                align-items: center;
                                gap: 12px;
                                border: none;
                                border-radius: 100px;
                                font-size: 15px;
                                text-align: left;
                                font-weight: 500;
                                cursor: pointer;
                                background: transparent;
                                color: var(--mac-sidebar-item-text, var(--text-primary));
                                transition: background 0.1s ease, transform 0.1s;
                                -webkit-tap-highlight-color: transparent;
                                user-select: none;
                            }
                            .admin-drawer-item:active {
                                transform: scale(0.97);
                            }
                            .admin-drawer-item .drawer-icon {
                                font-size: 20px;
                                opacity: 0.8;
                                flex-shrink: 0;
                                display: flex;
                                align-items: center;
                            }
                            .admin-drawer-item.active {
                                background: var(--mac-sidebar-item-active-bg, rgba(10,132,255,0.12));
                                color: var(--mac-sidebar-item-active-text, var(--mac-blue));
                                font-weight: 600;
                            }
                            .admin-drawer-item.active .drawer-icon {
                                opacity: 1;
                            }
                            .drawer-group-label {
                                padding: 4px 30px 2px 30px;
                                font-size: 11.5px;
                                font-weight: 700;
                                text-transform: none;
                                color: var(--mac-sidebar-header-text, var(--text-secondary));
                                letter-spacing: -0.1px;
                            }
                            .drawer-divider {
                                height: 1px;
                                background: var(--border-color);
                                margin: 10px 20px;
                            }
                        `}</style>

                        {/* Drawer Links */}
                        <div className="admin-drawer-scroll" style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                            <button onClick={() => handleNav('home')} className={`admin-drawer-item ${activeModule === 'home' ? 'active' : ''}`}>
                                <div className="drawer-icon"><RiHomeLine /></div> <span>Home</span>
                            </button>

                            {/* PLANNER */}
                            <div className="drawer-divider" />
                            <div className="drawer-group-label">Planner</div>
                            <button onClick={() => handleNav('schedules')} className={`admin-drawer-item ${activeModule === 'schedules' ? 'active' : ''}`}>
                                <div className="drawer-icon"><RiCalendarScheduleLine /></div> <span>Schedule</span>
                            </button>
                            <button onClick={() => handleNav('exams')} className={`admin-drawer-item ${activeModule === 'exams' ? 'active' : ''}`}>
                                <div className="drawer-icon"><RiTrophyLine /></div> <span>Exams</span>
                            </button>
                            <button onClick={() => handleNav('events')} className={`admin-drawer-item ${activeModule === 'events' ? 'active' : ''}`}>
                                <div className="drawer-icon"><RiCalendarEventLine /></div> <span>Events</span>
                            </button>
                            <button onClick={() => handleNav('special_classes')} className={`admin-drawer-item ${activeModule === 'special_classes' ? 'active' : ''}`}>
                                <div className="drawer-icon"><RiComputerLine /></div> <span>Special Classes</span>
                            </button>

                            {/* CONTENT */}
                            {(canViewCalendar || canViewResources || canViewNotes) && (
                                <>
                                    <div className="drawer-divider" />
                                    <div className="drawer-group-label">Content</div>
                                    {canViewCalendar && (
                                    <button onClick={() => handleNav('calendar')} className={`admin-drawer-item ${activeModule === 'calendar' ? 'active' : ''}`}>
                                        <div className="drawer-icon"><RiCalendarEventLine /></div> <span>Calendar</span>
                                    </button>
                                    )}
                                    {canViewResources && (
                                    <button onClick={() => handleNav('resources')} className={`admin-drawer-item ${activeModule === 'resources' ? 'active' : ''}`}>
                                        <div className="drawer-icon"><RiFilePdfLine /></div> <span>Resources</span>
                                    </button>
                                    )}
                                    {canViewNotes && (
                                    <button onClick={() => handleNav('notes')} className={`admin-drawer-item ${activeModule === 'notes' ? 'active' : ''}`}>
                                        <div className="drawer-icon"><RiFolderLine /></div> <span>Notes Manager</span>
                                    </button>
                                    )}
                                </>
                            )}

                            {/* ADMIN */}
                            {(canViewUsers || canViewAdmins) && (
                                <>
                                    <div className="drawer-divider" />
                                    <div className="drawer-group-label">Admin</div>
                                    {canViewUsers && (
                                        <button onClick={() => handleNav('users')} className={`admin-drawer-item ${activeModule === 'users' ? 'active' : ''}`}>
                                            <div className="drawer-icon"><RiGroupLine /></div> <span>Users</span>
                                        </button>
                                    )}
                                    {canViewAdmins && (
                                        <button onClick={() => handleNav('roles')} className={`admin-drawer-item ${activeModule === 'roles' ? 'active' : ''}`}>
                                            <div className="drawer-icon"><RiShieldUserLine /></div> <span>Admins</span>
                                        </button>
                                    )}
                                    {canViewFacultyDir && (
                                        <button onClick={() => handleNav('faculty')} className={`admin-drawer-item ${activeModule === 'faculty' ? 'active' : ''}`}>
                                            <div className="drawer-icon"><RiUser3Fill /></div> <span>Faculty Directory</span>
                                        </button>
                                    )}
                                    {isSuper && (
                                        <button onClick={() => handleNav('pending')} className={`admin-drawer-item ${activeModule === 'pending' ? 'active' : ''}`}>
                                            <div className="drawer-icon"><RiTimeLine /></div> <span>Pending</span>
                                        </button>
                                    )}
                                </>
                            )}

                            {/* SYSTEM */}
                            {canViewStructure && (
                                <>
                                    <div className="drawer-divider" />
                                    <div className="drawer-group-label">System</div>
                                    <button onClick={() => handleNav('structure')} className={`admin-drawer-item ${activeModule === 'structure' ? 'active' : ''}`}>
                                        <div className="drawer-icon"><RiListCheck /></div> <span>Structure</span>
                                    </button>
                                </>
                            )}

                        </div>

                        {/* Pinned Bottom: Settings + Appearance */}
                        <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 0', flexShrink: 0 }}>
                            <div style={{ padding: '0 16px' }}>
                                <ThemeToggle asMenuItem={true} />
                            </div>
                            <button onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }} className="admin-drawer-item" style={{ marginTop: '4px' }}>
                                <div className="drawer-icon"><RiSettings3Line /></div> <span>Settings</span>
                            </button>
                        </div>
                    </div>
                    <style>{`
            @keyframes slideInLeft {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          `}</style>
                </>
            )}

        </>
    );
};

export default AdminMobileNavbar;

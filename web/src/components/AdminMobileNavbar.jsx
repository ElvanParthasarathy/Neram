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
import { getHardcodedRole } from '../data/admins';
import ThemeToggle from './ThemeToggle';

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
        archives: 'Archive Tool',
    }[activeModule] || 'Admin Panel';

    // Schedule Manager deep view detection
    const schedLevel = searchParams.get('slvl');
    const isInScheduleDeep = activeModule === 'schedules' && schedLevel && schedLevel !== 'batches';

    // Exam Manager & Event Manager deep view detection
    const examEventLevel = searchParams.get('elvl');
    const isInExamDeep = (activeModule === 'exams' || activeModule === 'events') && examEventLevel && examEventLevel !== 'batches';

    // Special Class deep view
    const scLevel = searchParams.get('sclvl');
    const isInScDeep = activeModule === 'special_classes' && scLevel && scLevel !== 'batches';

    // Notes Manager deep view
    let isInNotesDeep = false;
    try {
        const nfpBase = searchParams.get('nfp');
        const nfpPath = nfpBase ? JSON.parse(decodeURIComponent(nfpBase)) : [];
        isInNotesDeep = activeModule === 'notes' && nfpPath.length > 1;
    } catch (e) {}

    // Users deep view
    const ulvl = searchParams.get('ulvl');
    const isInUsersDeep = activeModule === 'users' && ulvl && !['batches', 'faculty_depts', 'admin_list'].includes(ulvl);

    const isDeepView = isInScheduleDeep || isInExamDeep || isInScDeep || isInNotesDeep || isInUsersDeep;
    const handleDeepBack = () => navigate(-1);

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
                        {isDeepView ? (
                            <button className="top-back-btn" onClick={handleDeepBack} style={{ marginLeft: 'auto' }}>
                            <RiArrowLeftSLine style={{ width: '24px', height: '24px', color: 'var(--text-primary)' }} />
                            </button>
                        ) : activeModule !== 'home' && (
                            <button
                                className="top-back-btn"
                                onClick={() => navigate(-1)}
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
                        <div style={{ padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '18px', fontWeight: '800' }}>Admin Menu</span>
                            <button className="top-back-btn" onClick={() => setIsSidebarOpen(false)}>
                                <RiCloseLine style={{ width: '24px', height: '24px' }} />
                            </button>
                        </div>

                        {/* Drawer Links */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
                            {/* Primary Tabs (moved from bottom bar) */}
                            <button onClick={() => handleNav('home')} className={`menu-item ${activeModule === 'home' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'home' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'home' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'home' ? '600' : '500' }}>
                                <RiHomeLine style={{ fontSize: '20px' }} /> <span>Home</span>
                            </button>
                            <button onClick={() => handleNav('schedules')} className={`menu-item ${activeModule === 'schedules' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'schedules' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'schedules' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'schedules' ? '600' : '500' }}>
                                <RiCalendarScheduleLine style={{ fontSize: '20px' }} /> <span>Schedule</span>
                            </button>
                            <button onClick={() => handleNav('exams')} className={`menu-item ${activeModule === 'exams' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'exams' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'exams' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'exams' ? '600' : '500' }}>
                                <RiTrophyLine style={{ fontSize: '20px' }} /> <span>Exams</span>
                            </button>
                            <button onClick={() => handleNav('events')} className={`menu-item ${activeModule === 'events' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'events' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'events' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'events' ? '600' : '500' }}>
                                <RiCalendarEventLine style={{ fontSize: '20px' }} /> <span>Events</span>
                            </button>

                            <button onClick={() => handleNav('special_classes')} className={`menu-item ${activeModule === 'special_classes' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'special_classes' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'special_classes' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'special_classes' ? '600' : '500' }}>
                                <RiComputerLine style={{ fontSize: '20px' }} /> <span>Special Classes</span>
                            </button>

                            <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '16px 24px' }} />
                            <div className="nav-group-label" style={{ padding: '8px 24px', opacity: 0.5, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Management</div>

                            {canViewUsers && (
                                <button onClick={() => handleNav('users')} className={`menu-item ${activeModule === 'users' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'users' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'users' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'users' ? '600' : '500' }}>
                                    <RiGroupLine style={{ fontSize: '20px' }} /> <span>Users</span>
                                </button>
                            )}

                            {canViewAdmins && (
                                <button onClick={() => handleNav('roles')} className={`menu-item ${activeModule === 'roles' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'roles' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'roles' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'roles' ? '600' : '500' }}>
                                    <RiShieldUserLine style={{ fontSize: '20px' }} /> <span>Admins</span>
                                </button>
                            )}

                            {canViewFacultyDir && (
                                <button onClick={() => handleNav('faculty')} className={`menu-item ${activeModule === 'faculty' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'faculty' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'faculty' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'faculty' ? '600' : '500' }}>
                                    <RiUser3Fill style={{ fontSize: '20px' }} /> <span>Faculty Directory</span>
                                </button>
                            )}

                            {(canViewCalendar || canViewResources || canViewNotes) && (
                                <>
                                    <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '16px 24px' }} />
                                    <div className="nav-group-label" style={{ padding: '8px 24px', opacity: 0.5, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Academic</div>
                                    {canViewCalendar && (
                                    <button onClick={() => handleNav('calendar')} className={`menu-item ${activeModule === 'calendar' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'calendar' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'calendar' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'calendar' ? '600' : '500' }}>
                                        <RiCalendarEventLine style={{ fontSize: '20px' }} /> <span>Calendar</span>
                                    </button>
                                    )}
                                    {canViewResources && (
                                    <button onClick={() => handleNav('resources')} className={`menu-item ${activeModule === 'resources' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'resources' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'resources' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'resources' ? '600' : '500' }}>
                                        <RiFilePdfLine style={{ fontSize: '20px' }} /> <span>Resources</span>
                                    </button>
                                    )}
                                    {canViewNotes && (
                                    <button onClick={() => handleNav('notes')} className={`menu-item ${activeModule === 'notes' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'notes' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'notes' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'notes' ? '600' : '500' }}>
                                        <RiFolderLine style={{ fontSize: '20px' }} /> <span>Notes Manager</span>
                                    </button>
                                    )}
                                </>
                            )}

                            {canViewStructure && (
                                <>
                                    <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '16px 24px' }} />
                                    <div className="nav-group-label" style={{ padding: '8px 24px', opacity: 0.5, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>System</div>
                                    <button onClick={() => handleNav('structure')} className={`menu-item ${activeModule === 'structure' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'structure' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'structure' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'structure' ? '600' : '500' }}>
                                        <RiListCheck style={{ fontSize: '20px' }} /> <span>Structure</span>
                                    </button>
                                    <button onClick={() => handleNav('archives')} className={`menu-item ${activeModule === 'archives' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'archives' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'archives' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'archives' ? '600' : '500' }}>
                                        <RiInboxArchiveLine style={{ fontSize: '20px' }} /> <span>Archive Tool</span>
                                    </button>
                                </>
                            )}

                            {isSuper && (
                                <>
                                    <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '16px 24px' }} />
                                    <div className="nav-group-label" style={{ padding: '8px 24px', opacity: 0.5, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Requests</div>
                                    <button onClick={() => handleNav('pending')} className={`menu-item ${activeModule === 'pending' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'pending' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'pending' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'pending' ? '600' : '500' }}>
                                        <RiTimeLine style={{ fontSize: '20px' }} /> <span>Pending</span>
                                    </button>
                                </>
                            )}

                        </div>

                        {/* Pinned Bottom: Settings + Appearance */}
                        <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 0', flexShrink: 0 }}>
                            <div style={{ padding: '0 16px' }}>
                                <ThemeToggle asMenuItem={true} />
                            </div>
                            <button onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }} style={{ width: '100%', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: '500' }}>
                                <RiSettings3Line style={{ fontSize: '20px' }} /> <span>Settings</span>
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

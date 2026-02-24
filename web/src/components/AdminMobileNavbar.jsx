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
    RiSettings3Line
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

    const canViewUsers = isSuper || isFaculty;
    const canViewAdmins = isSuper || isFaculty || isRep;
    const canViewStructure = isSuper;
    const canViewExtras = isSuper;

    const handleNav = (mod) => {
        setSearchParams({ mod });
        setIsSidebarOpen(false); // Close sidebar if it was open
    };

    const topBarTitle = {
        home: 'Admin Panel',
        schedules: 'Schedule',
        exams: 'Exams',
        events: 'Events',
        users: 'Users',
        roles: 'Admins',
        calendar: 'Calendar',
        resources: 'Resources',
        structure: 'Structure',
        pending: 'Pending Requests',
    }[activeModule] || 'Admin Panel';

    // Schedule Manager back navigation (read URL params)
    const schedLevel = searchParams.get('slvl');
    const schedBatch = searchParams.get('sb') || '';
    const schedDept = searchParams.get('sd') || '';
    const isInScheduleDeep = activeModule === 'schedules' && schedLevel && schedLevel !== 'batches';

    const handleScheduleBack = () => {
        const params = { mod: 'schedules' };
        if (schedLevel === 'editor') {
            params.slvl = 'secs'; params.sb = schedBatch; params.sd = schedDept;
        } else if (schedLevel === 'secs') {
            params.slvl = 'depts'; params.sb = schedBatch;
        } else if (schedLevel === 'depts') {
            // go back to batches — no extra params needed
        }
        setSearchParams(params);
    };

    // Exam Manager back navigation (read URL params)
    const examLevel = searchParams.get('elvl');
    const examBatch = searchParams.get('eb') || '';
    const examDept = searchParams.get('ed') || '';
    const isInExamDeep = activeModule === 'exams' && examLevel && examLevel !== 'batches';

    const handleExamBack = () => {
        const params = { mod: 'exams' };
        if (examLevel === 'editor') {
            params.elvl = 'secs'; params.eb = examBatch; params.ed = examDept;
        } else if (examLevel === 'secs') {
            params.elvl = 'depts'; params.eb = examBatch;
        } else if (examLevel === 'depts') {
            // go back to batches
        }
        setSearchParams(params);
    };

    const isDeepView = isInScheduleDeep || isInExamDeep;
    const handleDeepBack = isInScheduleDeep ? handleScheduleBack : handleExamBack;

    // Determine current settings title
    const settingsTitle = navOverride?.title || 'Settings';
    const isInSubSection = isOnSettings && navOverride?.title;

    const handleSettingsBack = () => {
        if (isInSubSection) {
            // Go back to settings hub
            window.dispatchEvent(new Event('neram-go-hub'));
        } else {
            navigate('/');
        }
    };

    return (
        <>
            {/* 1. TOP BAR */}
            <div className="mobile-top-bar" style={{ justifyContent: 'flex-start' }}>
                {isOnSettings ? (
                    <>
                        <span className="top-bar-title" style={{ marginLeft: '16px', flex: 1 }}>{settingsTitle}</span>
                        <button
                            className="top-action-btn"
                            onClick={handleSettingsBack}
                            style={{
                                marginLeft: 'auto',
                                marginRight: '8px',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'var(--mac-bg-secondary, rgba(120,120,128,0.12))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none'
                            }}
                        >
                            <RiArrowLeftSLine style={{ width: '22px', height: '22px', color: 'var(--text-primary)' }} />
                        </button>
                    </>
                ) : (
                    <>
                        <button className="top-action-btn" onClick={() => setIsSidebarOpen(true)} style={{ marginRight: '12px' }}>
                            <RiMenuLine style={{ width: '24px', height: '24px', color: 'var(--text-primary)' }} />
                        </button>
                        <span className="top-bar-title" style={{ marginLeft: 0, flex: 1 }}>{topBarTitle}</span>
                        {isDeepView && (
                            <button className="top-back-btn" onClick={handleDeepBack} style={{ marginLeft: 'auto' }}>
                                <RiArrowLeftSLine style={{ width: '24px', height: '24px', color: 'var(--text-primary)', marginLeft: '-2px' }} />
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

                            {canViewExtras && (
                                <>
                                    <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '16px 24px' }} />
                                    <div className="nav-group-label" style={{ padding: '8px 24px', opacity: 0.5, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Academic</div>
                                    <button onClick={() => handleNav('calendar')} className={`menu-item ${activeModule === 'calendar' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'calendar' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'calendar' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'calendar' ? '600' : '500' }}>
                                        <RiCalendarEventLine style={{ fontSize: '20px' }} /> <span>Calendar Editor</span>
                                    </button>
                                    <button onClick={() => handleNav('resources')} className={`menu-item ${activeModule === 'resources' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'resources' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'resources' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'resources' ? '600' : '500' }}>
                                        <RiFilePdfLine style={{ fontSize: '20px' }} /> <span>Resources</span>
                                    </button>
                                </>
                            )}

                            {canViewStructure && (
                                <>
                                    <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '16px 24px' }} />
                                    <div className="nav-group-label" style={{ padding: '8px 24px', opacity: 0.5, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>System</div>
                                    <button onClick={() => handleNav('structure')} className={`menu-item ${activeModule === 'structure' ? 'selected' : ''}`} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: activeModule === 'structure' ? 'var(--mac-blue-15)' : 'transparent', border: 'none', color: activeModule === 'structure' ? 'var(--mac-blue)' : 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: activeModule === 'structure' ? '600' : '500' }}>
                                        <RiListCheck style={{ fontSize: '20px' }} /> <span>Structure</span>
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

                            <div className="menu-divider" style={{ height: '1px', background: 'var(--border-color)', margin: '16px 24px' }} />
                            <div className="nav-group-label" style={{ padding: '8px 24px', opacity: 0.5, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Preferences</div>
                            <button onClick={() => { navigate('/settings'); setIsSidebarOpen(false); }} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '16px', textAlign: 'left', fontWeight: '500' }}>
                                <RiSettings3Line style={{ fontSize: '20px' }} /> <span>Settings</span>
                            </button>
                            <div style={{ padding: '0 16px' }}>
                                <ThemeToggle asMenuItem={true} />
                            </div>
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

            {/* 3. BOTTOM TABS (4 Items) - HIDDEN ON SETTINGS */}
            {!isOnSettings && (
                <div className="mobile-bottom-bar admin-bottom-bar" style={{ zIndex: 10000, paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
                    <div className="nav-links" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '0 8px' }}>

                        <button className={`nav-item ${activeModule === 'home' ? 'active' : ''}`} onClick={() => handleNav('home')}>
                            <div className="nav-icon-container">
                                <RiHomeLine style={{ width: '24px', height: '24px' }} />
                            </div>
                            <span className="nav-label">Home</span>
                        </button>

                        <button className={`nav-item ${activeModule === 'schedules' ? 'active' : ''}`} onClick={() => handleNav('schedules')}>
                            <div className="nav-icon-container">
                                <RiCalendarScheduleLine style={{ width: '24px', height: '24px' }} />
                            </div>
                            <span className="nav-label">Schedule</span>
                        </button>

                        <button className={`nav-item ${activeModule === 'exams' ? 'active' : ''}`} onClick={() => handleNav('exams')}>
                            <div className="nav-icon-container">
                                <RiTrophyLine style={{ width: '24px', height: '24px' }} />
                            </div>
                            <span className="nav-label">Exams</span>
                        </button>

                        <button className={`nav-item ${activeModule === 'events' ? 'active' : ''}`} onClick={() => handleNav('events')}>
                            <div className="nav-icon-container">
                                <RiCalendarEventLine style={{ width: '24px', height: '24px' }} />
                            </div>
                            <span className="nav-label">Events</span>
                        </button>

                    </div>
                </div>
            )}
        </>
    );
};

export default AdminMobileNavbar;

import React, { useState, useEffect, useRef } from "react";
import "../styles/settings2.css";
import { motion, AnimatePresence } from "framer-motion";

import SettingsHub from "./settings/SettingsHub";
import DisplaySettings from "./settings/DisplaySettings";
import StorageSettings from "./settings/StorageSettings";
import SecuritySettings from "./settings/SecuritySettings";
import UserDirectoryView from "./settings/UserDirectoryView";
import ProfileView from "./settings/ProfileView";
import FeedbackView from "./settings/FeedbackView";
import DeveloperPage from "./settings/DeveloperPage";
import AboutPage from "./settings/AboutPage";
import AboutRMKPage from "./settings/AboutRMKPage";

/* ── Welcome placeholder for empty detail panel ── */
const SettingsWelcome = () => (
    <div className="s2-welcome-card">
        <div className="s2-welcome-icon-ring">
            <svg viewBox="0 0 24 24" fill="none" className="s2-welcome-gear">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        </div>
        <div className="s2-welcome-title">Settings</div>
        <div className="s2-welcome-text">Select an option from the left to get started</div>
    </div>
);

const Settings2 = ({ userProfile }) => {
    // 1. Initialize State
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [direction, setDirection] = useState(0); // 1: Forward (Right to Left), -1: Back (Left to Right)

    const [currentView, setCurrentView] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        const mainView = hash.split('/')[0];
        if (window.innerWidth > 768) return mainView || "profile";
        return mainView || "hub";
    });

    const prevViewRef = useRef(currentView);

    // Track Resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 2. Listen for Hash Changes (System Back Button Support)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            const mainView = hash.split('/')[0] || (isMobile ? 'hub' : 'profile');

            // Determine Direction using Ref to avoid closure staleness if we used state directly without dependency issue, 
            // but here we are in an effect.
            // Logic: Hub -> Detail (Forward/1), Detail -> Hub (Back/-1)
            // Detail -> Detail (Replace/0 or Forward/1?) -> Let's say 0 for now (Fade) or 1.

            const prev = prevViewRef.current;
            if (prev === 'hub' && mainView !== 'hub') {
                setDirection(1);
            } else if (prev !== 'hub' && mainView === 'hub') {
                setDirection(-1);
            } else {
                setDirection(0); // Sibilng or unknown
            }

            setCurrentView(mainView);
            prevViewRef.current = mainView;
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [isMobile]);

    // 3. Navigation Handler
    const handleNavigate = (view) => {
        if (isMobile) {
            setDirection(1); // Explicit forward triggers immediately
            window.location.hash = view;
        } else {
            setCurrentView(view);
            window.history.replaceState(null, null, `#${view}`);
        }
    };

    const goHub = () => {
        if (!isMobile) {
            setCurrentView("profile");
            window.history.replaceState(null, null, '#profile');
        } else {
            // Mobile: Pop history (which triggers hashchange -> direction -1 via logic above)
            // For smoother feel, we could set direction here, but hashchange is fast enough.
            if (window.location.hash && window.location.hash !== '#hub') {
                window.history.back();
            } else {
                setDirection(-1);
                setCurrentView("hub");
                window.location.hash = '';
            }
        }
    };

    // --- NAV OVERRIDE LOGIC ---
    useEffect(() => {
        if (currentView === 'hub') {
            window.dispatchEvent(new CustomEvent('neram-update-nav', { detail: null }));
        } else {
            const titles = {
                profile: 'Edit Profile',
                display: 'Appearance',
                notifications: 'Notifications',
                storage: 'Storage & Data',
                security: 'Security',
                directory: 'User Directory',
                complaints: 'Report Issue',
                developer: 'About Developer',
                rmk: 'About RMK Group',
                about: 'About App'
            };
            const title = titles[currentView] || 'Settings';

            window.dispatchEvent(new CustomEvent('neram-update-nav', {
                detail: { title }
            }));
        }
    }, [currentView]);

    // Cleanup navigation override
    useEffect(() => {
        return () => window.dispatchEvent(new CustomEvent('neram-update-nav', { detail: null }));
    }, []);

    // Listen for goHub (Fallback)
    useEffect(() => {
        const handleGoHub = () => goHub();
        window.addEventListener('neram-go-hub', handleGoHub);
        return () => window.removeEventListener('neram-go-hub', handleGoHub);
    }, [isMobile]); // Add isMobile dep

    const renderDetailView = () => {
        const hash = window.location.hash.replace('#', '');
        const parts = hash.split('/');
        const mainView = parts[0] || (isMobile ? 'hub' : 'profile'); // Robust fallback
        const subPath = parts.slice(1).join('/');

        /* Only render actual content if not hub (optimization) */
        if (mainView === 'hub' && isMobile) return null;

        const effectiveView = mainView === 'hub' && !isMobile ? 'profile' : mainView;

        switch (effectiveView) {
            case "profile": return <ProfileView userProfile={userProfile} onBack={goHub} />;
            case "display": return <DisplaySettings onBack={goHub} />;
            case "storage": return <StorageSettings userProfile={userProfile} onBack={goHub} />;
            case "security": return <SecuritySettings onBack={goHub} />;
            case "directory": return <UserDirectoryView onBack={goHub} subPath={subPath} />;
            case "complaints": return <FeedbackView userProfile={userProfile} onBack={goHub} />;
            case "developer": return <DeveloperPage onBack={goHub} />;
            case "rmk": return <AboutRMKPage onBack={goHub} />;
            case "about": return <AboutPage onBack={goHub} />;
            default:
                if (!isMobile) return <ProfileView userProfile={userProfile} onBack={goHub} />;
                return <div className="s2-not-found">View not found</div>;
        }
    };

    const detailContent = renderDetailView();

    // --- ANIMATION VARIANTS ---
    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? "100%" : (direction < 0 ? "-100%" : 0),
            opacity: 0,
            zIndex: 1 // Enter on top?
        }),
        center: {
            x: 0,
            opacity: 1,
            zIndex: 0
        },
        exit: (direction) => ({
            x: direction < 0 ? "100%" : (direction > 0 ? "-100%" : 0),
            opacity: 0,
            zIndex: 0
        })
    };

    const transition = { type: "spring", stiffness: 300, damping: 30 };

    return (
        <div className="s2-page-view" style={isMobile ? { position: 'relative', overflow: 'hidden', height: '100%' } : {}}>
            {isMobile ? (
                <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                    {currentView === 'hub' ? (
                        <motion.div
                            key="hub"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={transition}
                            className="s2-col-left"
                            style={{ width: '100%', height: '100%' }} // Flex basis?
                        >
                            <SettingsHub userProfile={userProfile} onNavigate={handleNavigate} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail"
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={transition}
                            className="s2-col-right"
                            style={{ width: '100%', height: '100%' }}
                        >
                            {detailContent}
                        </motion.div>
                    )}
                </AnimatePresence>
            ) : (
                <div className="s2-content-grid">
                    {/* LEFT: Hub navigation */}
                    <div className="s2-col-left">
                        <SettingsHub userProfile={userProfile} onNavigate={handleNavigate} />
                    </div>

                    {/* RIGHT: Detail view */}
                    <div className="s2-col-right">
                        {detailContent || <SettingsWelcome />}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings2;

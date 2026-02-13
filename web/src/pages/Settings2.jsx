import React, { useState } from "react";
import "../styles/settings2.css";

import SettingsHub from "./settings/SettingsHub";
import DisplaySettings from "./settings/DisplaySettings";
import NotificationSettings from "./settings/NotificationSettings";
import StorageSettings from "./settings/StorageSettings";
import SecuritySettings from "./settings/SecuritySettings";
import UserDirectoryView from "./settings/UserDirectoryView";
import ProfileView from "./settings/ProfileView";
import FeedbackView from "./settings/FeedbackView";
import DeveloperPage from "./settings/DeveloperPage";
import AboutPage from "./settings/AboutPage";

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
    const [currentView, setCurrentView] = useState("hub");

    const goHub = () => setCurrentView("hub");

    const renderDetailView = () => {
        switch (currentView) {
            case "profile":
                return <ProfileView userProfile={userProfile} onBack={goHub} />;
            case "display":
                return <DisplaySettings onBack={goHub} />;
            case "notifications":
                return <NotificationSettings onBack={goHub} />;
            case "storage":
                return <StorageSettings userProfile={userProfile} onBack={goHub} />;
            case "security":
                return <SecuritySettings onBack={goHub} />;
            case "directory":
                return <UserDirectoryView onBack={goHub} />;
            case "complaints":
                return <FeedbackView onBack={goHub} />;
            case "developer":
                return <DeveloperPage onBack={goHub} />;
            case "about":
                return <AboutPage onBack={goHub} />;
            default:
                return null;
        }
    };

    const detailContent = renderDetailView();

    return (
        <div className="s2-page-view">
            <div className="s2-content-grid">
                {/* LEFT: Hub navigation */}
                <div className={`s2-col-left ${currentView !== "hub" ? "s2-hide-mobile" : ""}`}>
                    <SettingsHub userProfile={userProfile} onNavigate={setCurrentView} />
                </div>

                {/* RIGHT: Detail view */}
                <div className={`s2-col-right ${currentView === "hub" ? "s2-hide-mobile" : ""}`}>
                    {detailContent || <SettingsWelcome />}
                </div>
            </div>
        </div>
    );
};

export default Settings2;

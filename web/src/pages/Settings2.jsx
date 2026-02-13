import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ref, query, orderByKey, endAt, startAt, get, update } from "firebase/database";
import "../styles/settings2.css";

import {
    RiSunLine,
    RiDatabase2Line,
    RiNotification3Line,
    RiShieldKeyholeLine,
    RiUser3Line,
    RiFeedbackLine,
    RiCodeSSlashLine,
    RiInformationLine,
    RiLogoutBoxRLine,
    RiArrowLeftSLine,
    RiCheckboxCircleFill,
    RiCheckboxBlankCircleLine,
    RiCalendarEventLine,
    RiAlertLine,
    RiNotificationBadgeLine,
    RiDeleteBinLine,
    RiCalendarLine,
    RiKeyLine,
    RiLinkM,
    RiErrorWarningLine,
    RiUser3Fill,
} from "react-icons/ri";

import LogoIcon from "../assets/neram.svg";

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS 2 — KOTLIN PORT
// ═══════════════════════════════════════════════════════════════════════════════

const Settings2 = ({ userProfile }) => {
    const [currentView, setCurrentView] = useState("hub");

    return (
        <div className="settings2-view">
            {currentView === "hub" && (
                <SettingsHub
                    userProfile={userProfile}
                    onNavigate={setCurrentView}
                />
            )}
            {currentView === "display" && (
                <DisplaySettings onBack={() => setCurrentView("hub")} />
            )}
            {currentView === "notifications" && (
                <NotificationSettings onBack={() => setCurrentView("hub")} />
            )}
            {currentView === "storage" && (
                <StorageSettings userProfile={userProfile} onBack={() => setCurrentView("hub")} />
            )}
            {currentView === "security" && (
                <SecurityPlaceholder onBack={() => setCurrentView("hub")} />
            )}
            {currentView === "directory" && (
                <DirectoryPlaceholder onBack={() => setCurrentView("hub")} />
            )}
            {currentView === "complaints" && (
                <ComplaintsPlaceholder onBack={() => setCurrentView("hub")} />
            )}
            {currentView === "developer" && (
                <DeveloperPlaceholder onBack={() => setCurrentView("hub")} />
            )}
            {currentView === "about" && (
                <AboutPage onBack={() => setCurrentView("hub")} />
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HUB
// ═══════════════════════════════════════════════════════════════════════════════

const SettingsHub = ({ userProfile, onNavigate }) => {
    const [showLogout, setShowLogout] = useState(false);

    const handleLogout = () => {
        signOut(auth);
        setShowLogout(false);
    };

    return (
        <>
            {/* Profile Card */}
            <div
                className="s2-profile-card"
                onClick={() => onNavigate("directory")}
            >
                <div className="s2-avatar">
                    {userProfile?.photoURL ? (
                        <img
                            src={userProfile.photoURL}
                            alt="Profile"
                        />
                    ) : (
                        <RiUser3Fill className="s2-avatar-icon" />
                    )}
                </div>
                <div className="s2-profile-text">
                    <div className="s2-profile-title">Neram Account</div>
                    <div className="s2-profile-sub">
                        {userProfile?.displayName || "User"}
                    </div>
                </div>
            </div>

            <div className="s2-spacer-md" />

            {/* Group 1: Display / Storage / Notifications */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiSunLine />}
                    iconColor="green"
                    title="Display"
                    desc="Theme, appearance"
                    onClick={() => onNavigate("display")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiDatabase2Line />}
                    iconColor="orange"
                    title="Storage & Data"
                    desc="Manage cached content"
                    onClick={() => onNavigate("storage")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiNotification3Line />}
                    iconColor="purple"
                    title="Notifications"
                    desc="Manage alerts and reminders"
                    onClick={() => onNavigate("notifications")}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />

            {/* Group 2: Security / User Directory */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiShieldKeyholeLine />}
                    iconColor="purple"
                    title="Security"
                    desc="Password & account"
                    onClick={() => onNavigate("security")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiUser3Line />}
                    iconColor="blue"
                    title="User Directory"
                    desc="View students"
                    onClick={() => onNavigate("directory")}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />

            {/* Group 3: Support */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiFeedbackLine />}
                    iconColor="orange"
                    title="Complaints"
                    desc="Send feedback & reports"
                    onClick={() => onNavigate("complaints")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiCodeSSlashLine />}
                    iconColor="green"
                    title="About Developer"
                    desc="Elvan Parthasarathy"
                    onClick={() => onNavigate("developer")}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />

            {/* Group 4: About */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiInformationLine />}
                    iconColor="blue"
                    title="About App"
                    desc="Version, licenses"
                    onClick={() => onNavigate("about")}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />

            {/* Group 5: Sign Out */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiLogoutBoxRLine />}
                    iconColor="red"
                    title="Sign Out"
                    desc="Log out of your Neram account"
                    onClick={() => setShowLogout(true)}
                    danger
                />
            </SettingsGroup>

            {/* Logout Dialog */}
            {showLogout && (
                <div
                    className="s2-dialog-overlay"
                    onClick={() => setShowLogout(false)}
                >
                    <div
                        className="s2-dialog"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="s2-dialog-title">Sign Out</div>
                        <div className="s2-dialog-text">
                            Are you sure you want to sign out?
                        </div>
                        <div className="s2-dialog-actions">
                            <button
                                className="s2-dialog-btn cancel"
                                onClick={() => setShowLogout(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="s2-dialog-btn confirm"
                                onClick={handleLogout}
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DISPLAY SETTINGS — Theme Selector
// ═══════════════════════════════════════════════════════════════════════════════

const DisplaySettings = ({ onBack }) => {
    // Read current theme from html class
    const getInitialTheme = () => {
        const saved = localStorage.getItem("neram-theme");
        if (saved) return saved;
        return "auto";
    };

    const [theme, setTheme] = useState(getInitialTheme);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem("neram-theme", newTheme);
        const html = document.documentElement;

        if (newTheme === "auto") {
            const prefersDark = window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;
            html.classList.toggle("dark", prefersDark);
        } else if (newTheme === "dark") {
            html.classList.add("dark");
        } else {
            html.classList.remove("dark");
        }
    };

    return (
        <>
            <SubHeader title="Display" onBack={onBack} />

            <SettingsGroup>
                {/* Light / Dark Preview */}
                <div className="s2-theme-row">
                    <button
                        className="s2-theme-option"
                        onClick={() => handleThemeChange("light")}
                    >
                        <div
                            className={`s2-theme-preview light-preview ${theme === "light" ? "selected" : ""}`}
                        >
                            <div className="s2-theme-bar" />
                            <div className="s2-theme-line" />
                            <div className="s2-theme-line short" />
                        </div>
                        <span
                            className={`s2-theme-label ${theme === "light" ? "selected" : ""}`}
                        >
                            Light
                        </span>
                        <span
                            className={`s2-theme-radio ${theme === "light" ? "selected" : "unselected"}`}
                        >
                            {theme === "light" ? (
                                <RiCheckboxCircleFill />
                            ) : (
                                <RiCheckboxBlankCircleLine />
                            )}
                        </span>
                    </button>

                    <button
                        className="s2-theme-option"
                        onClick={() => handleThemeChange("dark")}
                    >
                        <div
                            className={`s2-theme-preview dark-preview ${theme === "dark" ? "selected" : ""}`}
                        >
                            <div className="s2-theme-bar" />
                            <div className="s2-theme-line" />
                            <div className="s2-theme-line short" />
                        </div>
                        <span
                            className={`s2-theme-label ${theme === "dark" ? "selected" : ""}`}
                        >
                            Dark
                        </span>
                        <span
                            className={`s2-theme-radio ${theme === "dark" ? "selected" : "unselected"}`}
                        >
                            {theme === "dark" ? (
                                <RiCheckboxCircleFill />
                            ) : (
                                <RiCheckboxBlankCircleLine />
                            )}
                        </span>
                    </button>
                </div>

                {/* Divider */}
                <div
                    style={{
                        height: 1,
                        background: "var(--mac-divider)",
                        margin: "0 24px",
                    }}
                />

                {/* System Auto Toggle */}
                <div className="s2-auto-row" style={{ paddingTop: 16 }}>
                    <div className="s2-auto-text">
                        <div className="s2-auto-title">System Auto</div>
                        <div className="s2-auto-desc">
                            Follow your device's theme settings
                        </div>
                    </div>
                    <ToggleSwitch
                        checked={theme === "auto"}
                        onChange={(v) =>
                            handleThemeChange(v ? "auto" : "light")
                        }
                    />
                </div>
            </SettingsGroup>
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

const NotificationSettings = ({ onBack }) => {
    const loadPref = (key, def = true) => {
        const saved = localStorage.getItem(`neram-notif-${key}`);
        return saved !== null ? saved === "true" : def;
    };

    const [dailyBriefing, setDailyBriefing] = useState(
        loadPref("daily_briefing")
    );
    const [examAlerts, setExamAlerts] = useState(loadPref("exam_alerts"));
    const [eventReminders, setEventReminders] = useState(
        loadPref("event_reminders")
    );
    const [instantAlerts, setInstantAlerts] = useState(
        loadPref("instant_alerts")
    );

    const toggle = (key, value, setter) => {
        const newVal = !value;
        setter(newVal);
        localStorage.setItem(`neram-notif-${key}`, String(newVal));
    };

    return (
        <>
            <SubHeader title="Notifications" onBack={onBack} />

            <div className="s2-section-label">Push Notifications</div>

            <SettingsGroup>
                <NotifItem
                    icon={<RiSunLine />}
                    iconColor="orange"
                    title="Daily Briefing"
                    desc="Morning summary with schedule and updates"
                    checked={dailyBriefing}
                    onChange={() =>
                        toggle("daily_briefing", dailyBriefing, setDailyBriefing)
                    }
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiAlertLine />}
                    iconColor="red"
                    title="Exam Alerts"
                    desc="Reminders for upcoming exams"
                    checked={examAlerts}
                    onChange={() =>
                        toggle("exam_alerts", examAlerts, setExamAlerts)
                    }
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiCalendarEventLine />}
                    iconColor="blue"
                    title="Event Reminders"
                    desc="Holidays and special events"
                    checked={eventReminders}
                    onChange={() =>
                        toggle(
                            "event_reminders",
                            eventReminders,
                            setEventReminders
                        )
                    }
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiNotificationBadgeLine />}
                    iconColor="purple"
                    title="Instant Alerts"
                    desc="Critical announcements from college"
                    checked={instantAlerts}
                    onChange={() =>
                        toggle(
                            "instant_alerts",
                            instantAlerts,
                            setInstantAlerts
                        )
                    }
                />
            </SettingsGroup>

            <div className="s2-spacer-md" />

            <p className="s2-info-text">
                Note: You can also manage notification permissions in your
                browser's site settings.
            </p>
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STORAGE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════════

const StorageSettings = ({ userProfile, onBack }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [showRange, setShowRange] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
    const [statusMsg, setStatusMsg] = useState("");

    const batch = userProfile?.batch || "";
    const dept = userProfile?.department || "";
    const section = userProfile?.section || "";

    const cleanupOldUpdates = async () => {
        if (!batch || !dept || !section) {
            setStatus("error");
            setStatusMsg("Profile missing batch/department/section.");
            setShowConfirm(false);
            return;
        }
        setStatus("loading");
        setStatusMsg("Cleaning up...");
        setShowConfirm(false);

        try {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            const cutoffStr = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

            const dbRef = ref(db, `updates/${batch}/${dept}/${section}/daily_update`);
            const q = query(dbRef, orderByKey(), endAt(cutoffStr));
            const snapshot = await get(q);

            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach((child) => {
                    if (child.key < cutoffStr) {
                        updates[child.key] = null;
                    }
                });
                if (Object.keys(updates).length > 0) {
                    await update(ref(db, `updates/${batch}/${dept}/${section}/daily_update`), updates);
                    setStatus("success");
                    setStatusMsg(`Deleted ${Object.keys(updates).length} old update(s).`);
                } else {
                    setStatus("success");
                    setStatusMsg("No old updates to delete.");
                }
            } else {
                setStatus("success");
                setStatusMsg("No old updates found.");
            }
        } catch (e) {
            console.error("Cleanup failed:", e);
            setStatus("error");
            setStatusMsg("Cleanup failed. Please try again.");
        }
    };

    const cleanupRange = async () => {
        if (!batch || !dept || !section) {
            setStatus("error");
            setStatusMsg("Profile missing batch/department/section.");
            setShowRange(false);
            return;
        }
        if (!startDate || !endDate) {
            setStatus("error");
            setStatusMsg("Please select both start and end dates.");
            return;
        }
        if (startDate > endDate) {
            setStatus("error");
            setStatusMsg("Start date must be before end date.");
            return;
        }

        setStatus("loading");
        setStatusMsg("Deleting updates in range...");
        setShowRange(false);

        try {
            const dbRef = ref(db, `updates/${batch}/${dept}/${section}/daily_update`);
            const q = query(dbRef, orderByKey(), startAt(startDate), endAt(endDate));
            const snapshot = await get(q);

            if (snapshot.exists()) {
                const updates = {};
                snapshot.forEach((child) => {
                    if (child.key >= startDate && child.key <= endDate) {
                        updates[child.key] = null;
                    }
                });
                if (Object.keys(updates).length > 0) {
                    await update(ref(db, `updates/${batch}/${dept}/${section}/daily_update`), updates);
                    setStatus("success");
                    setStatusMsg(`Deleted ${Object.keys(updates).length} update(s) from ${startDate} to ${endDate}.`);
                } else {
                    setStatus("success");
                    setStatusMsg("No updates found in that range.");
                }
            } else {
                setStatus("success");
                setStatusMsg("No updates found in that range.");
            }
        } catch (e) {
            console.error("Range cleanup failed:", e);
            setStatus("error");
            setStatusMsg("Range cleanup failed. Please try again.");
        }
    };

    return (
        <>
            <SubHeader title="Storage & Data" onBack={onBack} />

            <div className="s2-section-label">Cleanup Options</div>

            <SettingsGroup>
                <SettingsItem
                    icon={<RiDeleteBinLine />}
                    iconColor="blue"
                    title="Clear Old Updates"
                    desc="Remove news & notices older than 30 days"
                    onClick={() => setShowConfirm(true)}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiCalendarLine />}
                    iconColor="orange"
                    title="Custom Range Deletion"
                    desc="Select a date range to wipe updates"
                    onClick={() => setShowRange(true)}
                />
            </SettingsGroup>

            <div className="s2-spacer-md" />

            {status && (
                <p className="s2-info-text" style={{
                    color: status === "error" ? "#F44336" : status === "success" ? "#4CAF50" : "var(--mac-text-secondary)"
                }}>
                    {statusMsg}
                </p>
            )}

            <p className="s2-info-text">
                Optimization helps keep the app responsive and saves local
                storage by removing old media and text records.
            </p>

            {/* Clear Old Updates Dialog */}
            {showConfirm && (
                <div className="s2-dialog-overlay" onClick={() => setShowConfirm(false)}>
                    <div className="s2-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="s2-dialog-title">Clear Old Updates</div>
                        <div className="s2-dialog-text">
                            This will delete all live updates and notices older
                            than 30 days. This action cannot be undone.
                        </div>
                        <div className="s2-dialog-actions">
                            <button className="s2-dialog-btn cancel" onClick={() => setShowConfirm(false)}>
                                Cancel
                            </button>
                            <button className="s2-dialog-btn confirm" style={{ background: "#2196F3" }} onClick={cleanupOldUpdates}>
                                Clear Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Range Dialog */}
            {showRange && (
                <div className="s2-dialog-overlay" onClick={() => setShowRange(false)}>
                    <div className="s2-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="s2-dialog-title">Custom Range Deletion</div>
                        <div className="s2-dialog-text">
                            Select a date range. All updates within this range will be permanently deleted.
                        </div>
                        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    flex: 1, padding: "10px 12px", borderRadius: 12,
                                    border: "1px solid var(--mac-divider)",
                                    background: "var(--mac-bg)", color: "var(--mac-text)",
                                    fontFamily: "inherit", fontSize: 14
                                }}
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{
                                    flex: 1, padding: "10px 12px", borderRadius: 12,
                                    border: "1px solid var(--mac-divider)",
                                    background: "var(--mac-bg)", color: "var(--mac-text)",
                                    fontFamily: "inherit", fontSize: 14
                                }}
                            />
                        </div>
                        <div className="s2-dialog-actions">
                            <button className="s2-dialog-btn cancel" onClick={() => setShowRange(false)}>
                                Cancel
                            </button>
                            <button className="s2-dialog-btn confirm" onClick={cleanupRange}>
                                Delete Range
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY — Placeholder
// ═══════════════════════════════════════════════════════════════════════════════

const SecurityPlaceholder = ({ onBack }) => {
    return (
        <>
            <SubHeader title="Security" onBack={onBack} />

            <div className="s2-section-label">Account</div>
            <SettingsGroup>
                <SettingsItem
                    icon={<RiKeyLine />}
                    iconColor="purple"
                    title="Change Password"
                    desc="Update your login password"
                    onClick={() => { }}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiLinkM />}
                    iconColor="blue"
                    title="Linked Accounts"
                    desc="Manage Google sign-in"
                    onClick={() => { }}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />

            <div className="s2-section-label">Danger Zone</div>
            <SettingsGroup>
                <SettingsItem
                    icon={<RiErrorWarningLine />}
                    iconColor="red"
                    title="Delete Account"
                    desc="Permanently remove your account"
                    onClick={() => { }}
                    danger
                />
            </SettingsGroup>
        </>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DIRECTORY — Placeholder
// ═══════════════════════════════════════════════════════════════════════════════

const DirectoryPlaceholder = ({ onBack }) => (
    <>
        <SubHeader title="User Directory" onBack={onBack} />
        <SettingsGroup>
            <div style={{ padding: 24, textAlign: "center" }}>
                <p className="s2-info-text">
                    User directory is available on the mobile app.
                </p>
            </div>
        </SettingsGroup>
    </>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLAINTS — Placeholder
// ═══════════════════════════════════════════════════════════════════════════════

const ComplaintsPlaceholder = ({ onBack }) => (
    <>
        <SubHeader title="Complaints" onBack={onBack} />
        <SettingsGroup>
            <div style={{ padding: 24, textAlign: "center" }}>
                <p className="s2-info-text">
                    Feedback and complaints can be submitted via the mobile app.
                </p>
            </div>
        </SettingsGroup>
    </>
);

// ═══════════════════════════════════════════════════════════════════════════════
// DEVELOPER — Placeholder
// ═══════════════════════════════════════════════════════════════════════════════

const DeveloperPlaceholder = ({ onBack }) => (
    <>
        <SubHeader title="About Developer" onBack={onBack} />
        <SettingsGroup>
            <div style={{ padding: 32, textAlign: "center" }}>
                <div
                    className="s2-about-name"
                    style={{ fontSize: 20, marginBottom: 8 }}
                >
                    Elvan Parthasarathy
                </div>
                <p className="s2-info-text" style={{ margin: 0 }}>
                    Developer of Neram
                </p>
            </div>
        </SettingsGroup>
    </>
);

// ═══════════════════════════════════════════════════════════════════════════════
// ABOUT APP
// ═══════════════════════════════════════════════════════════════════════════════

const AboutPage = ({ onBack }) => (
    <>
        <SubHeader title="About App" onBack={onBack} />
        <SettingsGroup>
            <div className="s2-about-center">
                <img src={LogoIcon} alt="Neram" className="s2-about-logo" />
                <div className="s2-about-name">Neram</div>
                <div className="s2-about-version">Version 1.0.0</div>
                <div className="s2-about-tagline">
                    Your all-in-one college companion. Built with care for RMD
                    Engineering College students.
                </div>
            </div>
        </SettingsGroup>
    </>
);

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SubHeader = ({ title, onBack }) => (
    <div className="s2-sub-header">
        <button className="s2-back-btn" onClick={onBack}>
            <RiArrowLeftSLine />
        </button>
        <span className="s2-sub-title">{title}</span>
    </div>
);

const SettingsGroup = ({ children }) => (
    <div className="s2-group">{children}</div>
);

const SettingsDivider = () => <div className="s2-divider" />;

const SettingsItem = ({ icon, iconColor, title, desc, onClick, danger }) => (
    <button className="s2-item" onClick={onClick}>
        <span className={`s2-icon-circle ${iconColor}`}>{icon}</span>
        <div className="s2-item-text">
            <div className={`s2-item-title ${danger ? "danger" : ""}`}>
                {title}
            </div>
            {desc && <div className="s2-item-desc">{desc}</div>}
        </div>
    </button>
);

const NotifItem = ({ icon, iconColor, title, desc, checked, onChange }) => (
    <div className="s2-notif-item">
        <span className={`s2-icon-circle ${iconColor}`}>{icon}</span>
        <div className="s2-item-text">
            <div className="s2-item-title">{title}</div>
            {desc && <div className="s2-item-desc">{desc}</div>}
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
);

const ToggleSwitch = ({ checked, onChange }) => (
    <button
        className={`s2-toggle ${checked ? "on" : ""}`}
        onClick={() => (typeof onChange === "function" ? onChange(!checked) : null)}
    >
        <span className="s2-toggle-knob" />
    </button>
);

export default Settings2;

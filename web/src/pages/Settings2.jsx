import React, { useState } from "react";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider, GoogleAuthProvider, linkWithPopup, unlink, deleteUser } from "firebase/auth";
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
    RiCalendar2Line,
    RiMegaphoneLine,
    RiWifiOffLine,
    RiRefreshLine,
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
                <SecuritySettings onBack={() => setCurrentView("hub")} />
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
// SECURITY — Full Implementation (Kotlin Port)
// ═══════════════════════════════════════════════════════════════════════════════

const SecuritySettings = ({ onBack }) => {
    const [secView, setSecView] = useState("hub");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteStatus, setDeleteStatus] = useState(null);
    const [deleteMsg, setDeleteMsg] = useState("");

    if (secView === "change_password") {
        return <ChangePasswordView onBack={() => setSecView("hub")} />;
    }
    if (secView === "linked_accounts") {
        return <LinkedAccountsView onBack={() => setSecView("hub")} />;
    }

    // Hub view
    const user = auth.currentUser;
    const hasPassword = user?.providerData?.some(p => p.providerId === "password");

    const handleDeleteAccount = async () => {
        if (!user) return;
        setDeleteStatus("loading");
        setDeleteMsg("Deleting account...");
        try {
            // Re-authenticate if password provider exists
            if (hasPassword && deletePassword) {
                const credential = EmailAuthProvider.credential(user.email, deletePassword);
                await reauthenticateWithCredential(user, credential);
            }
            // Delete user profile from RTDB
            const { ref: dbRef, remove } = await import("firebase/database");
            await remove(ref(db, `users/${user.uid}`));
            // Delete auth account
            await deleteUser(user);
        } catch (e) {
            console.error("Delete account failed:", e);
            setDeleteStatus("error");
            if (e.code === "auth/wrong-password") {
                setDeleteMsg("Incorrect password. Please try again.");
            } else if (e.code === "auth/requires-recent-login") {
                setDeleteMsg("Please sign out and sign back in, then try again.");
            } else {
                setDeleteMsg(e.message || "Failed to delete account.");
            }
            setShowDeleteConfirm(false);
        }
    };

    return (
        <>
            <SubHeader title="Security" onBack={onBack} />

            <div className="s2-section-label">Account</div>
            <SettingsGroup>
                <SettingsItem
                    icon={<RiKeyLine />}
                    iconColor="purple"
                    title={hasPassword ? "Change Password" : "Create Password"}
                    desc={hasPassword ? "Update your login password" : "Add a password to your account"}
                    onClick={() => setSecView("change_password")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiLinkM />}
                    iconColor="blue"
                    title="Linked Accounts"
                    desc="Manage Google sign-in"
                    onClick={() => setSecView("linked_accounts")}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />

            <div className="s2-section-label">Danger Zone</div>
            <SettingsGroup>
                <SettingsItem
                    icon={<RiErrorWarningLine />}
                    iconColor="red"
                    title="Delete Account"
                    desc="Permanently remove your account and all data"
                    onClick={() => setShowDeleteConfirm(true)}
                    danger
                />
            </SettingsGroup>

            {deleteStatus === "error" && (
                <>
                    <div className="s2-spacer-sm" />
                    <p className="s2-info-text" style={{ color: "#F44336" }}>{deleteMsg}</p>
                </>
            )}

            {/* Delete Account Dialog */}
            {showDeleteConfirm && (
                <div className="s2-dialog-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="s2-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="s2-dialog-title">Delete Account</div>
                        <div className="s2-dialog-text">
                            This will permanently delete your account and all associated data. This action cannot be undone.
                        </div>
                        {hasPassword && (
                            <input
                                type="password"
                                placeholder="Enter your password to confirm"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                style={{
                                    width: "100%", padding: "10px 12px", borderRadius: 12,
                                    border: "1px solid var(--mac-divider)",
                                    background: "var(--mac-bg)", color: "var(--mac-text)",
                                    fontFamily: "inherit", fontSize: 14, marginBottom: 16,
                                    boxSizing: "border-box"
                                }}
                            />
                        )}
                        <div className="s2-dialog-actions">
                            <button className="s2-dialog-btn cancel" onClick={() => setShowDeleteConfirm(false)}>
                                Cancel
                            </button>
                            <button className="s2-dialog-btn confirm" onClick={handleDeleteAccount}>
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ── Change / Create Password ──

const ChangePasswordView = ({ onBack }) => {
    const user = auth.currentUser;
    const hasPassword = user?.providerData?.some(p => p.providerId === "password");

    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [status, setStatus] = useState(null);
    const [statusMsg, setStatusMsg] = useState("");

    const handleSubmit = async () => {
        if (newPw.length < 6) {
            setStatus("error");
            setStatusMsg("Password must be at least 6 characters.");
            return;
        }
        if (newPw !== confirmPw) {
            setStatus("error");
            setStatusMsg("Passwords do not match.");
            return;
        }

        setStatus("loading");
        setStatusMsg(hasPassword ? "Changing password..." : "Creating password...");

        try {
            // Re-authenticate with current password if changing
            if (hasPassword && currentPw) {
                const credential = EmailAuthProvider.credential(user.email, currentPw);
                await reauthenticateWithCredential(user, credential);
            }
            await updatePassword(user, newPw);
            setStatus("success");
            setStatusMsg(hasPassword ? "Password changed successfully!" : "Password created successfully!");
            setCurrentPw("");
            setNewPw("");
            setConfirmPw("");
        } catch (e) {
            console.error("Password update failed:", e);
            setStatus("error");
            if (e.code === "auth/wrong-password") {
                setStatusMsg("Current password is incorrect.");
            } else if (e.code === "auth/requires-recent-login") {
                setStatusMsg("Please sign out and sign back in, then try again.");
            } else {
                setStatusMsg(e.message || "Failed to update password.");
            }
        }
    };

    const inputStyle = {
        width: "100%", padding: "12px 16px", borderRadius: 12,
        border: "1px solid var(--mac-divider)",
        background: "var(--mac-bg)", color: "var(--mac-text)",
        fontFamily: "inherit", fontSize: 14, boxSizing: "border-box"
    };

    return (
        <>
            <SubHeader title={hasPassword ? "Change Password" : "Create Password"} onBack={onBack} />

            <SettingsGroup>
                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                    {hasPassword && (
                        <input
                            type="password"
                            placeholder="Current password"
                            value={currentPw}
                            onChange={(e) => setCurrentPw(e.target.value)}
                            style={inputStyle}
                        />
                    )}
                    <input
                        type="password"
                        placeholder="New password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        style={inputStyle}
                    />
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        style={inputStyle}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={status === "loading"}
                        style={{
                            padding: "12px", borderRadius: 100, border: "none",
                            background: "#9C27B0", color: "#fff",
                            fontWeight: 600, fontSize: 14, cursor: "pointer",
                            fontFamily: "inherit", opacity: status === "loading" ? 0.6 : 1
                        }}
                    >
                        {status === "loading" ? "Please wait..." : hasPassword ? "Change Password" : "Create Password"}
                    </button>
                </div>
            </SettingsGroup>

            {status && status !== "loading" && (
                <>
                    <div className="s2-spacer-sm" />
                    <p className="s2-info-text" style={{
                        color: status === "error" ? "#F44336" : "#4CAF50"
                    }}>
                        {statusMsg}
                    </p>
                </>
            )}
        </>
    );
};

// ── Linked Accounts ──

const LinkedAccountsView = ({ onBack }) => {
    const user = auth.currentUser;
    const isGoogleLinked = user?.providerData?.some(p => p.providerId === "google.com");
    const [linked, setLinked] = useState(isGoogleLinked);
    const [status, setStatus] = useState(null);
    const [statusMsg, setStatusMsg] = useState("");

    const googleEmail = user?.providerData?.find(p => p.providerId === "google.com")?.email || "";

    const handleLink = async () => {
        setStatus("loading");
        setStatusMsg("Linking Google account...");
        try {
            const provider = new GoogleAuthProvider();
            await linkWithPopup(user, provider);
            setLinked(true);
            setStatus("success");
            setStatusMsg("Google account linked successfully!");
        } catch (e) {
            console.error("Google link failed:", e);
            setStatus("error");
            if (e.code === "auth/credential-already-in-use") {
                setStatusMsg("This Google account is already linked to another user.");
            } else {
                setStatusMsg(e.message || "Failed to link Google account.");
            }
        }
    };

    const handleUnlink = async () => {
        // Only allow unlink if user has password provider (so they don't get locked out)
        const hasPassword = user?.providerData?.some(p => p.providerId === "password");
        if (!hasPassword) {
            setStatus("error");
            setStatusMsg("Create a password first before unlinking Google.");
            return;
        }
        setStatus("loading");
        setStatusMsg("Unlinking Google account...");
        try {
            await unlink(user, "google.com");
            setLinked(false);
            setStatus("success");
            setStatusMsg("Google account unlinked.");
        } catch (e) {
            console.error("Google unlink failed:", e);
            setStatus("error");
            setStatusMsg(e.message || "Failed to unlink Google account.");
        }
    };

    return (
        <>
            <SubHeader title="Linked Accounts" onBack={onBack} />

            <SettingsGroup>
                <div className="s2-notif-item">
                    <span className="s2-icon-circle blue" style={{ background: "#4285F4" }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="#fff">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    </span>
                    <div className="s2-item-text">
                        <div className="s2-item-title">Google</div>
                        <div className="s2-item-desc">
                            {linked ? (googleEmail || "Connected") : "Not connected"}
                        </div>
                    </div>
                    <button
                        onClick={linked ? handleUnlink : handleLink}
                        disabled={status === "loading"}
                        style={{
                            padding: "8px 16px", borderRadius: 100, border: "none",
                            background: linked ? "rgba(244,67,54,0.1)" : "rgba(33,150,243,0.1)",
                            color: linked ? "#F44336" : "#2196F3",
                            fontWeight: 600, fontSize: 13, cursor: "pointer",
                            fontFamily: "inherit"
                        }}
                    >
                        {linked ? "Unlink" : "Link"}
                    </button>
                </div>
            </SettingsGroup>

            {status && status !== "loading" && (
                <>
                    <div className="s2-spacer-sm" />
                    <p className="s2-info-text" style={{
                        color: status === "error" ? "#F44336" : "#4CAF50"
                    }}>
                        {statusMsg}
                    </p>
                </>
            )}

            <div className="s2-spacer-md" />
            <p className="s2-info-text">
                Linking a Google account lets you sign in with Google.
                You need at least one sign-in method active.
            </p>
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

        <div className="s2-about-header">
            <div className="s2-about-tamil">நேரம்</div>
            <div className="s2-about-english">Neram</div>
        </div>

        <SettingsGroup>
            <div style={{ padding: 24 }}>
                <div className="s2-about-card-title">What is Neram?</div>
                <div className="s2-about-desc">
                    Neram (நேரம், meaning 'Time') is a sleek, all-in-one campus
                    companion app designed specifically for RMD Engineering
                    College students. It brings together everything you need to
                    stay organized and informed throughout your academic day.
                </div>
            </div>
        </SettingsGroup>

        <div className="s2-spacer-md" />

        <div className="s2-section-label">Features</div>
        <SettingsGroup>
            <div style={{ padding: "4px 20px" }}>
                <FeatureItem
                    icon={<RiCalendar2Line />}
                    color="blue"
                    title="Smart Timetable"
                    desc="View your daily class schedule with faculty info, room numbers, and real-time updates."
                />
                <SettingsDivider />
                <FeatureItem
                    icon={<RiCalendarEventLine />}
                    color="purple"
                    title="Exam Calendar"
                    desc="Track upcoming exams, internals, and important academic events with countdown timers."
                />
                <SettingsDivider />
                <FeatureItem
                    icon={<RiMegaphoneLine />}
                    color="orange"
                    title="Campus Announcements"
                    desc="Get instant notifications for news, circulars, and announcements from the college."
                />
                <SettingsDivider />
                <FeatureItem
                    icon={<RiWifiOffLine />}
                    color="green"
                    title="Offline Support"
                    desc="Access your timetable and cached data even without an internet connection."
                />
                <SettingsDivider />
                <FeatureItem
                    icon={<RiRefreshLine />}
                    color="red"
                    title="Cloud Sync"
                    desc="Your schedule and preferences sync seamlessly across devices with Firebase."
                />
            </div>
        </SettingsGroup>

        <div className="s2-about-footer">
            Built with ❤️ by Elvan Parthasarathy
        </div>
    </>
);

const FeatureItem = ({ icon, color, title, desc }) => (
    <div className="s2-feature-item">
        <span className={`s2-icon-circle ${color}`}>{icon}</span>
        <div className="s2-feature-text">
            <div className="s2-feature-title">{title}</div>
            <div className="s2-feature-desc">{desc}</div>
        </div>
    </div>
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

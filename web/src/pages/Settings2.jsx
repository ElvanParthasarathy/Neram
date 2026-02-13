import React, { useState, useEffect } from "react";
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
    RiLockPasswordLine,
    RiLoader4Line,
    RiEyeLine,
    RiEyeOffLine,
    RiGoogleFill,
    RiCheckboxCircleLine,
    RiUser3Fill,
    RiCalendar2Line,
    RiMegaphoneLine,
    RiWifiOffLine,
    RiRefreshLine,
    RiPhoneLine,
    RiMailLine,
    RiLinkedinFill,
    RiGithubFill,
    RiMapPin2Line,
    RiArrowRightSLine,
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
                <DeveloperPage onBack={() => setCurrentView("hub")} />
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

    useEffect(() => {
        const handleStorageChange = () => {
            setTheme(localStorage.getItem("neram-theme") || "auto");
        };

        window.addEventListener("theme-change", handleStorageChange);
        return () =>
            window.removeEventListener("theme-change", handleStorageChange);
    }, []);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem("neram-theme", newTheme);
        window.dispatchEvent(new Event("theme-change"));

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
    const [step, setStep] = useState(1); // 1: Warning, 2: Confirm
    const [deletePassword, setDeletePassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    // Reset state when dialog closes
    const closeDeleteDialog = () => {
        setShowDeleteConfirm(false);
        setStep(1);
        setDeletePassword("");
        setError(null);
        setIsProcessing(false);
    };

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
        if (!deletePassword && hasPassword) return setError("Please enter your password to confirm");
        setIsProcessing(true);
        setError(null);
        try {
            // Re-authenticate if password provider exists
            if (hasPassword) {
                const credential = EmailAuthProvider.credential(user.email, deletePassword);
                await reauthenticateWithCredential(user, credential);
            }
            // Delete user profile from RTDB
            const { ref: dbRef, remove } = await import("firebase/database");
            await remove(ref(db, `users/${user.uid}`));
            // Delete auth account
            await deleteUser(user);
            // Redirect happens via App.jsx auth listener
        } catch (e) {
            console.error("Delete account failed:", e);
            setError(e.message || "Failed to delete account.");
            if (e.code === "auth/wrong-password") {
                setError("Incorrect password. Please try again.");
            } else if (e.code === "auth/requires-recent-login") {
                setError("Please sign out and sign back in, then try again.");
            }
            setIsProcessing(false);
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

            {/* Delete Account Dialog */}
            {showDeleteConfirm && (
                <div className="s2-dialog-overlay" onClick={closeDeleteDialog}>
                    <div className="s2-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="s2-dialog-title">Delete Account</div>

                        {step === 1 && (
                            <>
                                <div className="s2-dialog-text">
                                    <div style={{ background: "rgba(244, 67, 54, 0.1)", padding: 12, borderRadius: 8, color: "#D32F2F", fontSize: 13, marginBottom: 12 }}>
                                        <strong>⚠️ This action is permanent</strong><br />
                                        All your data, schedule, and preferences will be lost forever.
                                    </div>
                                    Are you sure you want to proceed?
                                </div>
                                <div className="s2-dialog-actions">
                                    <button className="s2-dialog-btn cancel" onClick={closeDeleteDialog}>
                                        Cancel
                                    </button>
                                    <button className="s2-dialog-btn confirm" style={{ background: "#F44336" }} onClick={() => setStep(2)}>
                                        Continue
                                    </button>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="s2-dialog-text">
                                    Please enter your password to confirm deletion.
                                </div>
                                {hasPassword && (
                                    <div style={{ position: "relative", marginBottom: 16 }}>
                                        <input
                                            type={showPass ? "text" : "password"}
                                            placeholder="Enter your password"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            style={{
                                                width: "100%", padding: "10px 40px 10px 12px", borderRadius: 12,
                                                border: "1px solid var(--mac-divider)",
                                                background: "var(--mac-bg)", color: "var(--mac-text)",
                                                fontFamily: "inherit", fontSize: 14,
                                                boxSizing: "border-box"
                                            }}
                                        />
                                        <button
                                            onClick={() => setShowPass(!showPass)}
                                            style={{
                                                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                                                background: "none", border: "none", cursor: "pointer", color: "var(--mac-text-secondary)",
                                                display: "flex", alignItems: "center"
                                            }}
                                        >
                                            {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                                        </button>
                                    </div>
                                )}
                                {error && <p className="s2-info-text" style={{ color: "#F44336", marginTop: 0, marginBottom: 12 }}>{error}</p>}
                                <div className="s2-dialog-actions">
                                    <button className="s2-dialog-btn cancel" onClick={closeDeleteDialog}>
                                        Cancel
                                    </button>
                                    <button className="s2-dialog-btn confirm" style={{ background: "#F44336" }} onClick={handleDeleteAccount} disabled={isProcessing}>
                                        {isProcessing ? "Deleting..." : "Delete Forever"}
                                    </button>
                                </div>
                            </>
                        )}
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

    const [step, setStep] = useState(hasPassword ? 1 : 2); // 1: Verify, 2: New Password, 3: Success
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handleVerify = async () => {
        if (!currentPw) return setError("Please enter your current password");
        setIsProcessing(true);
        setError(null);
        try {
            const cred = EmailAuthProvider.credential(user.email, currentPw);
            await reauthenticateWithCredential(user, cred);
            setStep(2);
        } catch (err) {
            setError("Incorrect password");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpdate = async () => {
        if (newPw.length < 6) return setError("Password must be at least 6 characters");
        if (newPw !== confirmPw) return setError("Passwords do not match");

        setIsProcessing(true);
        setError(null);
        try {
            await updatePassword(user, newPw);
            setStep(3);
            setTimeout(onBack, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const inputStyle = {
        width: "100%", padding: "12px 40px 12px 16px", borderRadius: 12,
        border: "1px solid var(--mac-divider)",
        background: "var(--mac-bg)", color: "var(--mac-text)",
        fontFamily: "inherit", fontSize: 14, boxSizing: "border-box"
    };

    const InputWithEye = ({ value, onChange, placeholder }) => (
        <div style={{ position: "relative" }}>
            <input
                type={showPass ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                style={inputStyle}
            />
            <button
                onClick={() => setShowPass(!showPass)}
                style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "var(--mac-text-secondary)",
                    display: "flex", alignItems: "center"
                }}
            >
                {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
            </button>
        </div>
    );

    return (
        <>
            <SubHeader title={hasPassword ? "Change Password" : "Create Password"} onBack={onBack} />

            <div style={{ padding: "0 24px" }}>
                {/* Progress Steps */}
                {hasPassword && step < 3 && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 24, justifyContent: "center" }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: step >= 1 ? "#9C27B0" : "var(--mac-divider)" }} />
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: step >= 2 ? "#9C27B0" : "var(--mac-divider)" }} />
                    </div>
                )}

                {step === 1 && (
                    <SettingsGroup>
                        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                            <div className="s2-info-text" style={{ margin: 0 }}>
                                Please verify your identity by entering your current password.
                            </div>
                            <InputWithEye value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current Password" />
                            {error && <p className="s2-info-text" style={{ color: "#F44336", margin: 0 }}>{error}</p>}
                            <button
                                onClick={handleVerify}
                                disabled={isProcessing}
                                style={{
                                    padding: "12px", borderRadius: 100, border: "none",
                                    background: "#9C27B0", color: "#fff",
                                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                                    fontFamily: "inherit", opacity: isProcessing ? 0.6 : 1,
                                    display: "flex", justifyContent: "center", alignItems: "center", gap: 8
                                }}
                            >
                                {isProcessing && <RiLoader4Line className="s2-spin" />}
                                Verify & Continue
                            </button>
                        </div>
                    </SettingsGroup>
                )}

                {step === 2 && (
                    <SettingsGroup>
                        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                            {!hasPassword && (
                                <div style={{ background: "rgba(33, 150, 243, 0.1)", padding: 12, borderRadius: 12, display: "flex", gap: 8, alignItems: "start" }}>
                                    <RiInformationLine style={{ color: "#2196F3", fontSize: 18, marginTop: 2 }} />
                                    <p style={{ margin: 0, fontSize: 13, color: "#2196F3", lineHeight: 1.4 }}>
                                        You signed in with Google. Create a password to enable email sign-in.
                                    </p>
                                </div>
                            )}
                            <InputWithEye value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New Password (min 6 chars)" />
                            <InputWithEye value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Confirm Password" />

                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: newPw.length >= 6 ? "#4CAF50" : "var(--mac-text-secondary)" }}>
                                    <RiCheckboxCircleLine /> At least 6 characters
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: newPw && newPw === confirmPw ? "#4CAF50" : "var(--mac-text-secondary)" }}>
                                    <RiCheckboxCircleLine /> Passwords match
                                </div>
                            </div>

                            {error && <p className="s2-info-text" style={{ color: "#F44336", margin: 0 }}>{error}</p>}

                            <button
                                onClick={handleUpdate}
                                disabled={isProcessing || newPw.length < 6 || newPw !== confirmPw}
                                style={{
                                    padding: "12px", borderRadius: 100, border: "none",
                                    background: "#9C27B0", color: "#fff",
                                    fontWeight: 600, fontSize: 14, cursor: "pointer",
                                    fontFamily: "inherit", opacity: (isProcessing || newPw.length < 6 || newPw !== confirmPw) ? 0.6 : 1,
                                    display: "flex", justifyContent: "center", alignItems: "center", gap: 8
                                }}
                            >
                                {isProcessing && <RiLoader4Line className="s2-spin" />}
                                {hasPassword ? "Update Password" : "Create Password"}
                            </button>
                        </div>
                    </SettingsGroup>
                )}

                {step === 3 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40, gap: 16 }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#4CAF50", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32 }}>
                            <RiCheckboxCircleLine />
                        </div>
                        <h3 style={{ margin: 0, fontSize: 20 }}>Success!</h3>
                        <p style={{ margin: 0, color: "var(--mac-text-secondary)" }}>Your password has been updated.</p>
                    </div>
                )}
            </div>
        </>
    );
};

// ── Linked Accounts ──

const LinkedAccountsView = ({ onBack }) => {
    const user = auth.currentUser;
    const isGoogleLinked = user?.providerData?.some(p => p.providerId === "google.com");
    const [linked, setLinked] = useState(isGoogleLinked);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState(null);
    const [statusMsg, setStatusMsg] = useState("");

    const googleEmail = user?.providerData?.find(p => p.providerId === "google.com")?.email || "";

    const handleLink = async () => {
        setIsProcessing(true);
        setStatus(null);
        try {
            const provider = new GoogleAuthProvider();
            await linkWithPopup(user, provider);
            setLinked(true);
            setStatus("success");
            setStatusMsg("Google account linked successfully!");
        } catch (e) {
            console.error("Link failed:", e);
            setStatus("error");
            if (e.code === "auth/credential-already-in-use") {
                setStatusMsg("This Google account is already linked to another user.");
            } else {
                setStatusMsg(e.message || "Failed to link Google account.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUnlink = async () => {
        const hasPassword = user?.providerData?.some(p => p.providerId === "password");
        if (!hasPassword) {
            setStatus("error");
            setStatusMsg("Create a password first before unlinking Google.");
            return;
        }

        setIsProcessing(true);
        setStatus(null);
        try {
            await unlink(user, "google.com");
            setLinked(false);
            setStatus("success");
            setStatusMsg("Google account unlinked.");
        } catch (e) {
            console.error("Unlink failed:", e);
            setStatus("error");
            setStatusMsg(e.message || "Failed to unlink Google account.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <SubHeader title="Linked Accounts" onBack={onBack} />

        </p >
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

const DeveloperPage = ({ onBack }) => (
    <>
        <SubHeader title="About Developer" onBack={onBack} />

        <div className="s2-dev-hero">
            <div className="s2-dev-hello">Hello, I'm</div>
            <div className="s2-dev-name">Elvan Parthasarathy</div>
            <div className="s2-dev-role">Vibe Coder | Prompt Engineer</div>
            <a
                href="https://jaiprakashpartha.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="s2-dev-portfolio-btn"
            >
                Visit Portfolio
            </a>
        </div>

        <div className="s2-section-label">Contact Info</div>
        <div style={{ padding: "0 2px" }}>
            <ContactItem
                icon={<RiPhoneLine />}
                color="black"
                label="+91 93451 28797"
                onClick={() => window.open("tel:+919345128797")}
            />
            <ContactItem
                icon={<RiMailLine />}
                color="pink"
                label="jaiprakashpartha@gmail.com"
                onClick={() => window.open("mailto:jaiprakashpartha@gmail.com")}
            />
            <ContactItem
                icon={<RiLinkedinFill />}
                color="blue"
                label="linkedin.com/in/jaiprakashpartha"
                onClick={() => window.open("https://www.linkedin.com/in/jaiprakashpartha", "_blank")}
            />
            <ContactItem
                icon={<RiGithubFill />}
                color="black"
                label="github.com/elvanparthasarathy"
                onClick={() => window.open("https://github.com/elvanparthasarathy", "_blank")}
            />
            <ContactItem
                icon={<RiMapPin2Line />}
                color="red"
                label="Arani, Tamil Nadu - 632317"
                subLabel="(Currently in Chennai)"
            />
        </div>

        <div className="s2-spacer-md" />
    </>
);

const ContactItem = ({ icon, color, label, subLabel, onClick }) => {
    // Map colors to CSS values
    const colorMap = {
        black: "var(--mac-text)",
        pink: "#E1306C",
        blue: "#0077B5",
        red: "#FF0000",
    };

    // For icon circle background
    const bgMap = {
        black: "rgba(128,128,128,0.2)",
        pink: "rgba(225, 48, 108, 0.15)",
        blue: "rgba(0, 119, 181, 0.15)",
        red: "rgba(255, 0, 0, 0.15)",
    };

    return (
        <a className="s2-contact-item" onClick={onClick}>
            <span
                className="s2-icon-circle"
                style={{
                    background: bgMap[color] || bgMap.black,
                    color: colorMap[color] || colorMap.black,
                }}
            >
                {icon}
            </span>
            <div className="s2-contact-text">
                <div className="s2-contact-label">{label}</div>
                {subLabel && <div className="s2-contact-sub">{subLabel}</div>}
            </div>
            {onClick && <RiArrowRightSLine className="s2-chevron-right" />}
        </a>
    );
};

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
                    Neram (<span className="s2-tamil">நேரம்</span>, meaning 'Time') is a sleek, all-in-one campus
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

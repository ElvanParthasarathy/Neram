import React, { useState } from "react";
import { auth } from "../../firebase";
import { updatePassword, reauthenticateWithCredential, reauthenticateWithPopup, EmailAuthProvider, GoogleAuthProvider, linkWithPopup, linkWithCredential, unlink, deleteUser } from "firebase/auth";
import { db } from "../../firebase";
import { ref, remove } from "firebase/database";
import {
    RiKeyLine,
    RiLinkM,
    RiErrorWarningLine,
    RiEyeLine,
    RiEyeOffLine,
    RiGoogleFill,
    RiCheckboxCircleLine,
    RiLoader4Line,
    RiInformationLine,
} from "react-icons/ri";
import { SubHeader, SettingsGroup, SettingsDivider, SettingsItem } from "./SettingsShared";

// ── Password Input with Eye Toggle ──

const InputWithEye = ({ value, onChange, placeholder }) => {
    const [showPass, setShowPass] = useState(false);
    return (
        <div style={{ position: "relative" }}>
            <input
                type={showPass ? "text" : "password"}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="s2-complaint-input"
                style={{
                    paddingLeft: 16,
                    paddingRight: 40,
                }}
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
};

// ── Change / Create Password ──

const ChangePasswordView = ({ onBack }) => {
    const user = auth.currentUser;
    const hasPassword = user?.providerData?.some(p => p.providerId === "password");

    const [step, setStep] = useState(hasPassword ? 1 : 2); // 1: Verify, 2: New Password, 3: Success
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
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
            if (hasPassword) {
                // Update existing password
                await updatePassword(user, newPw);
            } else {
                // Create NEW password for Google/Provider account
                const credential = EmailAuthProvider.credential(user.email, newPw);
                await linkWithCredential(user, credential);
            }
            setStep(3);
            setTimeout(onBack, 2000);
        } catch (err) {
            console.error("Password change failed:", err);

            if (err.code === "auth/requires-recent-login") {
                // Session stale - trigger re-auth ONLY when needed
                try {
                    const provider = new GoogleAuthProvider();
                    await reauthenticateWithPopup(user, provider);

                    // Retry original operation after re-auth
                    if (hasPassword) {
                        await updatePassword(user, newPw);
                    } else {
                        const credential = EmailAuthProvider.credential(user.email, newPw);
                        await linkWithCredential(user, credential);
                    }
                    setStep(3);
                    setTimeout(onBack, 2000);
                } catch (reAuthErr) {
                    setError("Identity verification failed. Please sign out and sign back in.");
                }
            } else if (err.code === "auth/email-already-in-use") {
                setError("This email is already associated with a password account. Try signing in with it.");
            } else {
                setError(err.message);
            }
        } finally {
            setIsProcessing(false);
        }
    };

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

            <div className="s2-section-label">Sign-in Methods</div>
            <SettingsGroup>
                <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                            <RiGoogleFill style={{ fontSize: 24, color: "#EA4335" }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>Google</div>
                            <div style={{ fontSize: 13, color: "var(--mac-text-secondary)" }}>
                                {linked ? googleEmail : "Not connected"}
                            </div>
                        </div>
                    </div>
                    {linked ? (
                        <button
                            onClick={handleUnlink}
                            disabled={isProcessing}
                            style={{
                                padding: "8px 16px", borderRadius: 20, border: "1px solid #ddd",
                                background: "var(--mac-bg)", color: "var(--mac-text)",
                                fontSize: 13, fontWeight: 500, cursor: "pointer",
                                opacity: isProcessing ? 0.6 : 1
                            }}
                        >
                            {isProcessing ? "Wait..." : "Unlink"}
                        </button>
                    ) : (
                        <button
                            onClick={handleLink}
                            disabled={isProcessing}
                            style={{
                                padding: "8px 16px", borderRadius: 20, border: "none",
                                background: "#2196F3", color: "#fff",
                                fontSize: 13, fontWeight: 500, cursor: "pointer",
                                opacity: isProcessing ? 0.6 : 1
                            }}
                        >
                            {isProcessing ? "Wait..." : "Connect"}
                        </button>
                    )}
                </div>
            </SettingsGroup>

            <div className="s2-spacer-md" />

            <div className="s2-info-text">
                <RiInformationLine style={{ verticalAlign: "middle", marginRight: 4 }} />
                Linking multiple sign-in methods ensures you never lose access to your account.
            </div>

            {status && (
                <p className="s2-info-text" style={{
                    color: status === "error" ? "#F44336" : "#4CAF50",
                    marginTop: 16
                }}>
                    {statusMsg}
                </p>
            )}
        </>
    );
};

// ── Security Hub ──

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
        if (!hasPassword) return setError("Please create a password first to verify your identity.");
        if (!deletePassword) return setError("Please enter your password to confirm");
        setIsProcessing(true);
        setError(null);
        try {
            // Re-authenticate if password provider exists
            if (hasPassword) {
                const credential = EmailAuthProvider.credential(user.email, deletePassword);
                await reauthenticateWithCredential(user, credential);
            }
            // Delete user profile from RTDB
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
                                    {!hasPassword ? (
                                        <div style={{ color: "var(--mac-text-secondary)", fontSize: 13, marginBottom: 12 }}>
                                            You must <strong>create a password</strong> first to verify your identity before deleting your account.
                                        </div>
                                    ) : (
                                        "Are you sure you want to proceed?"
                                    )}
                                </div>
                                <div className="s2-dialog-actions">
                                    <button className="s2-dialog-btn cancel" onClick={closeDeleteDialog}>
                                        Cancel
                                    </button>
                                    {!hasPassword ? (
                                        <button
                                            className="s2-dialog-btn confirm"
                                            style={{ background: "#9C27B0" }}
                                            onClick={() => { closeDeleteDialog(); setSecView("change_password"); }}
                                        >
                                            Create Password
                                        </button>
                                    ) : (
                                        <button className="s2-dialog-btn confirm" style={{ background: "#F44336" }} onClick={() => setStep(2)}>
                                            Continue
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="s2-dialog-text">
                                    Please enter your password to confirm deletion.
                                </div>
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
                                {error && <p className="s2-info-text" style={{ color: "#F44336", marginTop: 0, marginBottom: 12 }}>{error}</p>}
                                <div className="s2-dialog-actions">
                                    <button className="s2-dialog-btn cancel" onClick={closeDeleteDialog}>
                                        Cancel
                                    </button>
                                    <button className="s2-dialog-btn confirm" style={{ background: "#F44336" }} onClick={handleDeleteAccount} disabled={isProcessing || !deletePassword}>
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

export default SecuritySettings;

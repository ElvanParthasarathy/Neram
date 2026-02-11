import React, { useState, useEffect } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "firebase/auth";
import { ref, get, update, onValue } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import { RiShieldKeyholeLine, RiArrowRightLine, RiErrorWarningLine } from "react-icons/ri";
import { adminEmails, HARDCODED_ADMINS } from "../data/admins";

// IMPORT THE LOGO ASSET
import Logo from "../assets/neramv.svg";

const AdminLoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const navigate = useNavigate();

    // Profile Setup States
    const [showSetupPopup, setShowSetupPopup] = useState(false);
    const [hierarchy, setHierarchy] = useState({});
    const [tempUser, setTempUser] = useState(null);
    const [setupRole, setSetupRole] = useState("faculty"); // Default to Faculty for new admins
    const [selection, setSelection] = useState({ batch: "", dept: "", sec: "" });

    // Load hierarchy for setup
    useEffect(() => {
        const hierarchyRef = ref(db, 'academic_hierarchy');
        onValue(hierarchyRef, (snap) => {
            if (snap.exists()) setHierarchy(snap.val());
        });
    }, []);

    // ---- ADMIN CHECK LOGIC ----
    const checkAdminStatus = async (user) => {
        setErrorMsg("");
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        // 1. Initial Sync
        await update(userRef, {
            uid: user.uid,
            email: user.email,
            photoURL: user.photoURL || "",
            lastLogin: new Date().toISOString(),
            // Ensure displayName is set
            displayName: userData?.displayName || user.displayName || "Admin User"
        });

        // 1.5 CHECK & FIX HARDCODED ROLES
        // If user is in our hardcoded list, FORCE their role to match.
        // This fixes issues where Super Admins might be listed as 'student' in DB.
        let currentRole = userData?.role;
        if (HARDCODED_ADMINS[user.email]) {
            const predefinedRole = HARDCODED_ADMINS[user.email];
            if (currentRole !== predefinedRole) {
                await update(userRef, { role: predefinedRole });
                currentRole = predefinedRole; // Update local var for next checks
            }
        }

        // 2. CHECK ROLE
        const role = currentRole;

        // CASE A: EXISTING ADMIN (Super Admin, Faculty with Dept, Rep with Section)
        if (role === 'super_admin') {
            navigate("/"); return;
        }
        if (role === 'faculty' && userData.department) {
            navigate("/"); return;
        }
        if (role === 'rep' && userData.batch && userData.department && userData.section) {
            navigate("/"); return;
        }
        if (role === 'admin') {
            navigate("/"); return;
        }

        // CASE B: NEW USER / NO ADMIN ROLE
        // If not hardcoded and no admin role -> Set to 'pending' so Super Admin can approve
        if (!role || role === 'student') {
            await update(userRef, { role: 'pending' });
            navigate("/"); // Will show PendingApproval screen
            return;
        }

        // CASE C: USER HAS A ROLE BUT INCOMPLETE SETUP (e.g. faculty without dept)
        setTempUser(user);
        if (role) setSetupRole(role);
        setShowSetupPopup(true);
        setIsLoggingIn(false);
    };

    const handleFinishSetup = async () => {
        if (!setupRole) return alert("Select a role.");

        let updates = { role: setupRole };

        if (setupRole === 'faculty') {
            if (!selection.dept) return alert("Please select your Department.");
            updates.department = selection.dept;
            updates.batch = ""; // Faculty don't belong to a batch
            updates.section = "";
        } else if (setupRole === 'rep') {
            if (!selection.sec) return alert("Please select Batch, Dept, and Section.");
            updates.batch = selection.batch;
            updates.department = selection.dept;
            updates.section = selection.sec;
        }

        try {
            await update(ref(db, `users/${tempUser.uid}`), updates);
            setShowSetupPopup(false);
            navigate("/");
        } catch (e) {
            alert("Setup failed: " + e.message);
        }
    };

    // ---- LOGIC HANDLERS ----
    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await checkAdminStatus(result.user);
        } catch (err) {
            console.error(err);
            setIsLoggingIn(false);
            setErrorMsg(err.message);
        }
    };

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            await checkAdminStatus(result.user);
        } catch (err) {
            setIsLoggingIn(false);
            setErrorMsg("Invalid Email or Password.");
        }
    };

    const handleForgotPassword = () => {
        if (!email) return alert("Enter email first.");
        sendPasswordResetEmail(auth, email)
            .then(() => alert("Reset link sent! Check your inbox."))
            .catch((err) => alert(err.message));
    };

    if (isLoggingIn) {
        return (
            <div className="ios-loader-container">
                <div className="ios-loading-wrapper">
                    <div className="mac-loader-spinner">
                        {[...Array(12)].map((_, i) => <div key={i} className="bar"></div>)}
                    </div>
                    <p className="mac-loader-text">Verifying Admin Access</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-body-wrapper">
            <div className="glass-login-card admin-login-card">
                <div className="admin-badge-top">
                    <RiShieldKeyholeLine /> Admin Portal
                </div>

                <img src={Logo} alt="Logo" className="admin-login-logo" />

                {errorMsg && (
                    <div className="error-banner animate-fade-in">
                        <RiErrorWarningLine /> {errorMsg}
                    </div>
                )}

                <button onClick={handleGoogleLogin} className="google-btn">
                    <img src="https://www.google.com/favicon.ico" alt="Google" width="18" height="18" />
                    Admin Sign in with Google
                </button>

                <div className="divider"><span>Or Credentials</span></div>

                <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
                    <div className="input-group">
                        <input type="email" className="glass-input" placeholder="Admin Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <input type={showPassword ? "text" : "password"} className="glass-input" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="button" className="eye-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? "Hide" : "Show"}
                        </button>
                    </div>
                    <button type="submit" className="login-btn admin-theme-btn">Secure Login <RiArrowRightLine /></button>

                    <div className="bottom-links" style={{ justifyContent: 'center' }}>
                        <span onClick={handleForgotPassword} className="link-text" style={{ cursor: 'pointer' }}>Forgot Admin Password?</span>
                    </div>
                </form>
            </div>

            {/* --- ADMIN SETUP MODAL --- */}
            {showSetupPopup && (
                <div className="setup-modal-overlay">
                    <div className="setup-modal-card animate-pop-in">
                        <header className="setup-header">
                            <RiShieldKeyholeLine className="setup-icon" />
                            <h2>Admin Setup</h2>
                            <p>Complete your profile to access the Admin Panel.</p>
                        </header>

                        <div className="setup-body">
                            {/* ROLE SELECTION */}
                            <div className="select-box">
                                <label>I am a...</label>
                                <select value={setupRole} onChange={(e) => setSetupRole(e.target.value)}>
                                    <option value="faculty">Faculty Member</option>
                                    <option value="rep">Student Representative</option>
                                    {/* Super Admin cannot be self-selected */}
                                </select>
                            </div>

                            {/* FACULTY FLOW: DEPT ONLY */}
                            {setupRole === 'faculty' && (
                                <div className="select-box animate-fade-in">
                                    <label>My Department</label>
                                    <select
                                        value={selection.dept}
                                        onChange={(e) => setSelection({ ...selection, dept: e.target.value })}
                                    >
                                        <option value="">Select Department</option>
                                        {Array.from(new Set(
                                            Object.values(hierarchy).flatMap(b => Object.keys(b || {}))
                                        )).filter(d => d !== 'initialized').sort().map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* REP FLOW: FULL DETAILS */}
                            {setupRole === 'rep' && (
                                <>
                                    <div className="select-box animate-fade-in">
                                        <label>Batch</label>
                                        <select
                                            value={selection.batch}
                                            onChange={(e) => setSelection({ ...selection, batch: e.target.value, dept: "", sec: "" })}
                                        >
                                            <option value="">Select Batch</option>
                                            {Object.keys(hierarchy).sort().reverse().map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {selection.batch && (
                                        <div className="select-box animate-fade-in">
                                            <label>Department</label>
                                            <select
                                                value={selection.dept}
                                                onChange={(e) => setSelection({ ...selection, dept: e.target.value, sec: "" })}
                                            >
                                                <option value="">Select Dept</option>
                                                {Object.keys(hierarchy[selection.batch] || {})
                                                    .filter(k => k !== 'initialized')
                                                    .map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {selection.dept && (
                                        <div className="select-box animate-fade-in">
                                            <label>Section</label>
                                            <select
                                                value={selection.sec}
                                                onChange={(e) => setSelection({ ...selection, sec: e.target.value })}
                                            >
                                                <option value="">Select Section</option>
                                                {hierarchy[selection.batch][selection.dept]?.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="setup-footer">
                            <button className="finish-btn" onClick={handleFinishSetup}>
                                Complete Setup <RiArrowRightLine />
                            </button>
                            <button className="cancel-btn-alt" onClick={() => { auth.signOut(); setShowSetupPopup(false); }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLoginPage;

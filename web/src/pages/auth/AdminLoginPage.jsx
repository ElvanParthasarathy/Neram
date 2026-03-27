import React, { useState, useEffect } from "react";
import { auth, googleProvider, db } from "../../firebase";
import {
    signInWithPopup,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithCredential
} from "firebase/auth";
import { ref, get, update, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { RiShieldKeyholeLine, RiArrowRightLine } from "react-icons/ri";
import { HARDCODED_ADMINS } from "../../data/admins";
import {
    AuthLayout,
    AuthHeader,
    AuthInput,
    AuthButton,
    AuthDivider,
    AuthLink
} from "../../components/auth/AuthComponents";

// IMPORT THE LOGO ASSET
import Logo from "../../assets/branding/app-logo-wordmark.svg"; // Use same logo as student portal

const AdminLoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

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
        const unsubscribe = onValue(hierarchyRef, (snap) => {
            if (snap.exists()) setHierarchy(snap.val());
        });
        return () => unsubscribe();
    }, []);

    // ---- ADMIN CHECK LOGIC ----
    const checkAdminStatus = async (user) => {
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
    // Setup listeners for Native Android Google Login response
    useEffect(() => {
        window.handleNativeGoogleResult = async (idToken) => {
            try {
                // Build credential from the ID token passed by Android
                const credential = GoogleAuthProvider.credential(idToken);
                // Sign in to Firebase Auth using the credential
                const result = await signInWithCredential(auth, credential);
                await checkAdminStatus(result.user);
            } catch (err) {
                console.error("Native Google Login via Firebase failed:", err);
                setIsLoggingIn(false);
                alert("Native Sign-In Verification Failed: " + err.message);
            }
        };

        window.handleNativeGoogleError = (errorMsg) => {
            console.error("Native Google Login failed:", errorMsg);
            setIsLoggingIn(false);
            alert(errorMsg);
        };

        return () => {
            delete window.handleNativeGoogleResult;
            delete window.handleNativeGoogleError;
        };
    }, []);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        // Check if running inside the Android App WebView
        if (window.NativeBridge && window.NativeBridge.loginWithGoogle) {
            try {
                // Trigger Native Android Google Sign-In
                window.NativeBridge.loginWithGoogle();
                // We do NOT set isLoggingIn(false) here because we are waiting for 
                // window.handleNativeGoogleResult() to be called by the native app.
            } catch (err) {
                console.error("Failed to bridge to native login:", err);
                setIsLoggingIn(false);
            }
        } else {
            // Running in regular browser, use standard popup
            try {
                const result = await signInWithPopup(auth, googleProvider);
                await checkAdminStatus(result.user);
            } catch (err) {
                console.error(err);
                setIsLoggingIn(false);
                alert(err.message);
            }
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
            alert("Invalid Email or Password.");
        }
    };

    const handleForgotPassword = () => {
        if (!email) return alert("Enter email first.");
        sendPasswordResetEmail(auth, email)
            .then(() => alert("Reset link sent! Check your inbox."))
            .catch((err) => alert(err.message));
    };

    return (
        <AuthLayout>
            <div style={{ height: '60px' }} />

            <AuthHeader
                title="Admin Portal"
                subtitle="Secure access for administrators"
            />

            <div style={{ height: '32px' }} />

            <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
                <AuthInput
                    label="Admin Email"
                    placeholder="Enter Admin Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                />

                <AuthInput
                    label="Password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    required
                />

                <div style={{ height: '24px' }} />

                <AuthButton
                    type="submit"
                    loading={isLoggingIn}
                >
                    Secure Login
                </AuthButton>
            </form>

            <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                <AuthLink
                    prefix=""
                    linkText="Forgot Admin Password?"
                    onClick={handleForgotPassword}
                />
            </div>

            <AuthDivider />

            <div style={{ width: '100%' }}>
                <AuthButton
                    onClick={handleGoogleLogin}
                    loading={isLoggingIn}
                    secondary
                >
                    <img src="https://www.google.com/favicon.ico" alt="G" style={{ width: '20px', marginRight: '12px' }} />
                    Admin Sign in with Google
                </AuthButton>
            </div>

            <div style={{ marginTop: '32px' }}>
                <AuthLink
                    prefix="Don't have an account?"
                    linkText="Sign Up"
                    onClick={() => navigate('/signup')}
                />
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
        </AuthLayout>
    );
};

export default AdminLoginPage;

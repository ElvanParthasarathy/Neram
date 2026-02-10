import React, { useState, useEffect } from "react";
import { auth, googleProvider, db } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from "firebase/auth";
import { ref, update, get, onValue } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import { RiShieldUserLine, RiArrowRightLine, RiCloseLine } from "react-icons/ri";

// IMPORT THE LOGO ASSET
import Logo from "../assets/neramv.svg";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Profile Setup States
  const [showSetupPopup, setShowSetupPopup] = useState(false);
  const [hierarchy, setHierarchy] = useState({});
  const [tempUser, setTempUser] = useState(null);
  const [selection, setSelection] = useState({ batch: "", dept: "", sec: "" });

  const navigate = useNavigate();

  // Load the hierarchy once so the user can select from existing batches/depts
  useEffect(() => {
    const hierarchyRef = ref(db, 'academic_hierarchy');
    const unsub = onValue(hierarchyRef, (snap) => {
      if (snap.exists()) setHierarchy(snap.val());
    });
    return () => unsub();
  }, []);

  // ---- SYNC & CHECK LOGIC ----
  const checkUserStatus = async (user) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();

    // 1. Initial Sync (Updates basic auth info every login)
    const updatePayload = {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL || "",
      lastLogin: new Date().toISOString(),
    };

    // Keep custom name if Admin set it, otherwise use Auth name
    if (!userData?.displayName) {
      updatePayload.displayName = user.displayName || "New User";
    }
    await update(userRef, updatePayload);

    // 2. CHECK ROLE: BLOCK ADMINS/FACULTY
    const role = userData?.role || 'student';
    if (['admin', 'faculty', 'super_admin'].includes(role)) {
      alert("Faculty & Admins must use the Admin Portal.");
      await signOut(auth);
      setIsLoggingIn(false);
      return;
    }

    // 3. CRITICAL CHECK: If any academic field is missing, FORCE the Pop-up
    if (!userData?.batch || !userData?.department || !userData?.section) {
      setTempUser(user);
      setShowSetupPopup(true); // This triggers the modal
      setIsLoggingIn(false);
    } else {
      // User is fully registered with all details -> Go to Home
      navigate("/");
    }
  };

  // ---- LOGIC HANDLERS ----
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await checkUserStatus(result.user);
    } catch (err) {
      console.error(err);
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkUserStatus(result.user);
    } catch (err) {
      alert("Invalid Email or Password.");
      setIsLoggingIn(false);
    }
  };

  // HANDLER: When user clicks "Continue to Dashboard" in the popup
  const handleFinishSetup = async () => {
    if (!selection.batch || !selection.dept || !selection.sec) {
      alert("Please complete all selections.");
      return;
    }

    setIsLoggingIn(true);
    try {
      // Update the missing fields in Firebase
      await update(ref(db, `users/${tempUser.uid}`), {
        batch: selection.batch,
        department: selection.dept,
        section: selection.sec
      });

      // Close popup and go home
      setShowSetupPopup(false);
      navigate("/");
    } catch (err) {
      alert("Setup Error: " + err.message);
      setIsLoggingIn(false);
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
          {/* Native-style macOS 12-bar Spinner */}
          <div className="mac-loader-spinner">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bar"></div>
            ))}
          </div>
          <p className="mac-loader-text">Verifying Account</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-body-wrapper">
      <div className="glass-login-card">
        <img src={Logo} alt="Logo" style={{ height: '60px', margin: '0 auto 10px auto', display: 'block' }} />
        <p className="brand-subtitle">Student Portal Access</p>

        <button onClick={handleGoogleLogin} className="google-btn">
          <img src="https://www.google.com/favicon.ico" alt="Google" width="18" height="18" />
          Student Sign in with Google
        </button>

        <div className="divider"><span>Or Manual Login</span></div>

        <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
          <div className="input-group">
            <input type="email" className="glass-input" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="input-group">
            <input type={showPassword ? "text" : "password"} className="glass-input" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="eye-icon-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <button type="submit" className="login-btn">Sign In</button>
          <div className="bottom-links">
            <Link to="/signup" className="link-text link-blue">Register</Link>
            <span onClick={handleForgotPassword} className="link-text" style={{ cursor: 'pointer' }}>Forgot Password?</span>
          </div>
        </form>
      </div>

      {/* --- SETUP POP-UP MODAL: ONLY SHOWS IF DETAILS ARE MISSING --- */}
      {showSetupPopup && (
        <div className="setup-modal-overlay">
          <div className="setup-modal-card animate-pop-in">
            <header className="setup-header">
              <RiShieldUserLine className="setup-icon" />
              <h2>Profile Setup</h2>
              <p>Welcome! Please select your academic details to access your dashboard.</p>
            </header>

            <div className="setup-body">
              {/* 1. Batch Selection */}
              <div className="select-box">
                <label>Batch / Year</label>
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

              {/* 2. Department Selection (Shows after Batch is chosen) */}
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

              {/* 3. Section Selection (Shows after Dept is chosen) */}
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
            </div>

            <div className="setup-footer">
              <button
                className="finish-btn"
                disabled={!selection.sec}
                onClick={handleFinishSetup}
              >
                Continue to Dashboard <RiArrowRightLine />
              </button>
              <button className="cancel-btn-alt" onClick={() => { signOut(auth); setShowSetupPopup(false); }}>
                Sign Out (Switch Account)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
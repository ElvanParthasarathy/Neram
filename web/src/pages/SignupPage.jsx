import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set, serverTimestamp } from "firebase/database";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/neramv.svg";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    dobDay: "",
    dobMonth: "",
    dobYear: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const navigate = useNavigate();

  const splitName = (fullName) => {
    const cleanName = fullName.trim();
    const lastSpaceIndex = cleanName.lastIndexOf(" ");

    if (lastSpaceIndex === -1) {
      return { first: cleanName, last: "" };
    }

    return {
      first: cleanName.substring(0, lastSpaceIndex),
      last: cleanName.substring(lastSpaceIndex + 1)
    };
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSigningUp(true);

    try {
      // 1. Construct DOB String (YYYY-MM-DD)
      let birthDateString = "";
      if (formData.dobDay && formData.dobMonth && formData.dobYear) {
        const d = String(formData.dobDay).padStart(2, '0');
        const m = String(formData.dobMonth).padStart(2, '0');
        const y = formData.dobYear;
        birthDateString = `${y}-${m}-${d}`;
      }

      // 2. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 3. Update Auth Profile
      await updateProfile(user, { displayName: formData.name });

      // 4. Save to Database
      const { first, last } = splitName(formData.name);

      await set(ref(db, `users/${user.uid}`), {
        uid: user.uid,
        displayName: formData.name,
        firstName: first,
        lastName: last,
        email: formData.email,
        mobile: formData.phone,
        birthday: birthDateString,
        photoURL: "",
        role: "student",
        joinedAt: serverTimestamp(),
        lastLogin: new Date().toISOString(),
        batch: "",
        department: "",
        section: "",
      });

      alert("Registration Successful!");
      navigate("/");
    } catch (error) {
      alert(error.message);
      setIsSigningUp(false);
    }
  };

  if (isSigningUp) {
    return (
      <div className="loader-overlay">
        <div className="liquid-loader"></div>
        <div className="loading-text">CREATING ACCOUNT</div>
      </div>
    );
  }

  // --- LOGIC FIX: Generate Years from 1900 to Current Year ---
  const currentYear = new Date().getFullYear();
  const startYear = 1900;
  // Creates an array: [2026, 2025, ..., 1901, 1900]
  const years = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => currentYear - i
  );

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="signup-body-wrapper">
      <div className="glass-signup-card">
        <img src={Logo} alt="RMD Neram Logo" className="signup-logo" />
        <p className="brand-subtitle">Create Student Account</p>

        <form onSubmit={handleSignup} style={{ width: '100%' }}>

          <div className="input-group">
            <input type="text" className="glass-input" placeholder="Full Name" required
              value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>

          <div className="input-group">
            <input type="email" className="glass-input" placeholder="Email Address" required
              value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>

          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="phone-prefix">+91</span>
            <input
              type="tel"
              className="glass-input"
              placeholder="Mobile Number"
              required
              value={formData.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData({ ...formData, phone: digits });
              }}
              style={{ flex: 1, paddingLeft: '8px' }}
              maxLength={10}
            />
          </div>

          {/* --- 3-PILL DOB SELECTOR (NOW WITH ALL YEARS) --- */}
          <div className="dob-group-label">Date of Birth</div>
          <div className="dob-pill-container">

            {/* 1. DAY */}
            <div className="select-wrapper day">
              <select
                className="glass-select-pill"
                required
                value={formData.dobDay}
                onChange={(e) => setFormData({ ...formData, dobDay: e.target.value })}
              >
                <option value="" disabled>Day</option>
                {[...Array(31)].map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            {/* 2. MONTH */}
            <div className="select-wrapper month">
              <select
                className="glass-select-pill"
                required
                value={formData.dobMonth}
                onChange={(e) => setFormData({ ...formData, dobMonth: e.target.value })}
              >
                <option value="" disabled>Month</option>
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>

            {/* 3. YEAR (FIXED RANGE) */}
            <div className="select-wrapper year">
              <select
                className="glass-select-pill"
                required
                value={formData.dobYear}
                onChange={(e) => setFormData({ ...formData, dobYear: e.target.value })}
              >
                <option value="" disabled>Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <input type={showPassword ? "text" : "password"} className="glass-input" placeholder="Password" required
              value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />

            <button type="button" className="eye-icon-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button type="submit" className="signup-btn">Register</button>

          <div className="bottom-links">
            Already have an account?
            <Link to="/login" className="link-blue">Sign In</Link>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SignupPage;
import React, { useState } from "react";
import { auth, db, googleProvider } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { ref, set, get, update, serverTimestamp } from "firebase/database";
import { useNavigate } from "react-router-dom";
import {
  AuthLayout,
  AuthHeader,
  AuthInput,
  AuthButton,
  AuthLink,
  AuthDivider
} from "../components/auth/AuthComponents";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    regNo: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const writeUserToDatabase = async (user, data) => {
    const displayName = `${data.firstName} ${data.lastName}`.trim();
    await set(ref(db, `users/${user.uid}`), {
      uid: user.uid,
      displayName: displayName,
      firstName: data.firstName,
      lastName: data.lastName,
      regNo: data.regNo || "",
      email: user.email,
      photoURL: user.photoURL || "",
      role: "student",
      joinedAt: serverTimestamp(),
      lastLogin: new Date().toISOString(),
      batch: "",
      department: "",
      section: ""
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Basic Validation (matching Kotlin logic roughly)
    if (formData.firstName.length < 2) {
      alert("First Name must be at least 2 characters");
      setLoading(false);
      return;
    }
    if (!formData.lastName) {
      alert("Last Name is required");
      setLoading(false);
      return;
    }
    if (formData.regNo.length < 5) {
      alert("Invalid Register Number");
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // 1. Create Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Update Profile
      await updateProfile(user, { displayName: `${formData.firstName} ${formData.lastName}`.trim() });

      // 3. Save DB
      await writeUserToDatabase(user, formData);

      alert("Registration Successful!");
      navigate("/");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user already exists in DB
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        // Existing user — just update lastLogin and let them in
        await update(userRef, {
          lastLogin: new Date().toISOString(),
          photoURL: user.photoURL || "",
        });
      } else {
        // New user — write full profile
        const fullName = user.displayName || "";
        const lastSpace = fullName.lastIndexOf(" ");
        const firstName = lastSpace === -1 ? fullName : fullName.substring(0, lastSpace);
        const lastName = lastSpace === -1 ? "" : fullName.substring(lastSpace + 1);

        await writeUserToDatabase(user, { firstName, lastName, regNo: "" });
      }

      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Google Sign Up Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ height: '80px' }} />

      <AuthHeader
        title="Create Account"
        subtitle="Fill in your details to get started"
      />

      <div style={{ height: '40px' }} />

      <form onSubmit={handleSignup} style={{ width: '100%' }}>
        <div className="auth-grid">
          <AuthInput
            label="First Name"
            placeholder="Enter First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
          <AuthInput
            label="Last Name"
            placeholder="Enter Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />

          <AuthInput
            label="Register Number"
            placeholder="Enter Register Number"
            value={formData.regNo}
            onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
            required
          />
          <AuthInput
            label="Email Address"
            placeholder="Enter Email Address"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            type="email"
            required
          />

          <div className="span-2">
            <AuthInput
              label="Password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              type="password"
              required
            />
          </div>
        </div>

        <div style={{ height: '24px' }} />

        <AuthButton
          type="submit"
          loading={loading}
        >
          Create Account
        </AuthButton>
      </form>

      <AuthDivider />

      <div style={{ width: '100%' }}>
        <AuthButton
          onClick={handleGoogleSignup}
          loading={loading}
          secondary
        >
          <img src="https://www.google.com/favicon.ico" alt="G" style={{ width: '20px', marginRight: '12px' }} />
          Sign up with Google
        </AuthButton>
      </div>

      <div style={{ marginTop: '32px', marginBottom: '120px' }}>
        <AuthLink
          prefix="Already have an account?"
          linkText="Log In"
          onClick={() => navigate('/login')}
        />
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
import React, { useState } from "react";
import { auth, googleProvider } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { ref, update, get } from "firebase/database";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  AuthLayout,
  AuthHeader,
  AuthInput,
  AuthButton,
  AuthDivider,
  AuthLink
} from "../components/auth/AuthComponents";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkUserStatus = async (user) => {
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();

    // 1. Initial Sync
    const updatePayload = {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL || "",
      lastLogin: new Date().toISOString(),
    };

    if (!userData?.displayName) {
      updatePayload.displayName = user.displayName || "New User";
    }
    await update(userRef, updatePayload);

    // 2. Role Check
    const role = userData?.role || 'student';
    if (['admin', 'faculty', 'super_admin'].includes(role)) {
      alert("Faculty & Admins must use the Admin Portal.");
      await signOut(auth);
      return;
    }

    navigate("/");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await checkUserStatus(result.user);
    } catch (err) {
      console.error(err);
      alert("Google Sign In Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await checkUserStatus(result.user);
    } catch (err) {
      alert(err.message || "Invalid Email or Password");
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div style={{ height: '60px' }} />

      <AuthHeader
        title="Welcome Back"
        subtitle="Sign in to continue"
      />

      <div style={{ height: '32px' }} />

      <form onSubmit={handleEmailLogin} style={{ width: '100%' }}>
        <AuthInput
          label="Email Address"
          placeholder="Enter Email Address"
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
          loading={loading}
        >
          Sign In
        </AuthButton>
      </form>

      <AuthDivider />

      <div style={{ width: '100%' }}>
        <AuthButton
          onClick={handleGoogleLogin}
          loading={loading}
          secondary
        >
          <img src="https://www.google.com/favicon.ico" alt="G" style={{ width: '20px', marginRight: '12px' }} />
          Sign in with Google
        </AuthButton>
      </div>

      <div style={{ marginTop: '32px' }}>
        <AuthLink
          prefix="Don't have an account?"
          linkText="Sign Up"
          onClick={() => navigate('/signup')}
        />
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
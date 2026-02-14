import React, { useState } from "react";
import { auth, db, googleProvider } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { ref, set, serverTimestamp } from "firebase/database";
import { useNavigate } from "react-router-dom";
import {
    AuthLayout,
    AuthHeader,
    AuthInput,
    AuthButton,
    AuthLink,
    AuthDivider
} from "../components/auth/AuthComponents";

const AdminSignupPage = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
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
            email: user.email,
            photoURL: user.photoURL || "",
            // Important: Admin/Faculty/Rep roles must be approved or set via Setup
            // Default to 'pending' to trigger the PendingApproval screen if they aren't pre-approved
            role: "pending",
            joinedAt: serverTimestamp(),
            lastLogin: new Date().toISOString(),
            // Empty init for admin flow
            batch: "",
            department: "",
            section: ""
        });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);

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

            // 4. Navigate to Login (or root, which will showing Pending Approval)
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

            // Extract names
            const fullName = user.displayName || "";
            const lastSpace = fullName.lastIndexOf(" ");
            const firstName = lastSpace === -1 ? fullName : fullName.substring(0, lastSpace);
            const lastName = lastSpace === -1 ? "" : fullName.substring(lastSpace + 1);

            // Write to DB
            await writeUserToDatabase(user, { firstName, lastName });

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
                title="Create Admin Account"
                subtitle="Sign up to request admin access"
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
                        label="Email Address"
                        placeholder="Enter Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        type="email"
                        required
                    />
                    <AuthInput
                        label="Password"
                        placeholder="Enter Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        type="password"
                        required
                    />
                </div>

                <div style={{ height: '24px' }} />

                <AuthButton
                    type="submit"
                    loading={loading}
                >
                    Create Admin Account
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

export default AdminSignupPage;

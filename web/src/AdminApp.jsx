import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useSystemTheme } from "./hooks/useSystemTheme";
import { db, auth } from "./firebase";
import { ref, onValue, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import "@fontsource-variable/inter";

// Styles
import "./App.css";
import "./mobile.css";
import "./mobileapp.css";

// Admin Components
import { adminEmails, getHardcodedRole } from "./data/admins";
import AdminNavbar from "./components/AdminNavbar";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminWelcomePage from "./pages/AdminWelcomePage";
import AdminSignupPage from "./pages/AdminSignupPage";
import AdminPanel from "./pages/AdminPanel";
import AdminSettings from "./pages/AdminSettings";
import AdminDashboard from "./pages/admins/AdminDashboard";
import PendingApproval from "./pages/PendingApproval";
import SplashScreen from "./components/SplashScreen";

function AdminAppContent({ user, isAdminUser, isMobile, loading, dbUserProfile }) {
    // Admin App is simple: 
    // - If not logged in -> Login
    // - If logged in but not admin -> Show "Access Denied" or redirect to Main Site
    // - If admin -> Show Admin Panel

    return (
        <>
            {!user ? (
                <Routes>
                    <Route path="/" element={<AdminWelcomePage />} />
                    <Route path="/login" element={<AdminLoginPage />} />
                    <Route path="/signup" element={<AdminSignupPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            ) : !isAdminUser ? (
                /* NOT AN ADMIN: Show blocking "Pending Approval" screen */
                <PendingApproval user={user} />
            ) : (
                <div id="app-shell" className="desktop-mode-active">
                    <AdminNavbar
                        user={user}
                        userProfile={dbUserProfile}
                        isAdmin={isAdminUser}
                    />

                    <main id="main-viewport" className="admin-content-area">
                        <Routes>
                            <Route path="/" element={<AdminPanel user={user} userProfile={dbUserProfile} />} />
                            <Route path="/settings" element={<AdminSettings userProfile={dbUserProfile} />} />
                            <Route path="/admin" element={<Navigate to="/" replace />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
            )}
        </>
    );
}

function AdminApp() {
    useSystemTheme();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [dbUserProfile, setDbUserProfile] = useState({ batch: "", department: "", section: "" });

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            // if (!mobile) document.documentElement.classList.remove("dark");
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        let userUnsubscribe = null;
        const authUnsubscribe = onAuthStateChanged(auth, (u) => {
            if (userUnsubscribe) { userUnsubscribe(); userUnsubscribe = null; }

            if (u) {
                setUser(u);

                // 1. Check Hardcoded Role IMMEDIATELY (Avoids "Pending" flash)
                const hardcodedRole = getHardcodedRole(u.email);
                const isHardcodedAdmin = !!hardcodedRole;

                if (isHardcodedAdmin) {
                    setIsAdminUser(true);
                    // Still fetch DB profile for other data, but access is already granted
                }

                const userRef = ref(db, `users/${u.uid}`);
                userUnsubscribe = onValue(userRef, (snapshot) => {
                    const userData = snapshot.val() || {};
                    setDbUserProfile(userData);

                    // 2. Database Role check (for extensive admins)
                    const dbRole = userData?.role;
                    const isDbAdmin = dbRole === 'admin' || dbRole === 'faculty' || dbRole === 'rep' || dbRole === 'super_admin';

                    if (!isHardcodedAdmin) {
                        setIsAdminUser(isDbAdmin);
                    }
                    setLoading(false);
                });
            } else {
                setUser(null); setIsAdminUser(false); setLoading(false);
            }
        });
        return () => { authUnsubscribe(); if (userUnsubscribe) userUnsubscribe(); };
    }, []);


    if (loading) return <SplashScreen />;

    return (
        <HashRouter>
            <AdminAppContent
                user={user} isAdminUser={isAdminUser} isMobile={isMobile}
                loading={loading} dbUserProfile={dbUserProfile}
            />
        </HashRouter>
    );
}

export default AdminApp;

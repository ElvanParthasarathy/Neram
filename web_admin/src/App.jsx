import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import "@fontsource-variable/inter";

// Styles
import "./App.css";
import "./mobile.css";
// import "./mobileapp.css"; // Optional, might not need for Admin Desktop

// Components
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SetupModal from "./components/SetupModal";

// Admin Managers
import ScheduleManager from "./pages/admins/ScheduleManager";
import ExamManager from "./pages/admins/ExamManager";
import CalendarManager from "./pages/admins/CalendarManager";
import UserManagement from "./pages/admins/UserManagement";
import AdminRoleManager from "./pages/admins/AdminRoleManager";
import StructureManager from "./pages/admins/StructureManager";
import ResourceManager from "./pages/admins/ResourceManager";
import EventManager from "./pages/admins/EventManager"; // Added EventManager

function AppContent({ user, loading, dbUserProfile }) {
  const isMobile = window.innerWidth <= 768;

  if (loading) return (
    <div className="ios-loader-container">
      <div className="ios-loading-wrapper">
        <div className="mac-loader-spinner">
          {[...Array(12)].map((_, i) => <div key={i} className="bar"></div>)}
        </div>
        <p className="mac-loader-text">Verifying Access</p>
      </div>
    </div>
  );

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // DESKTOP ADMIN LAYOUT
  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f7' }}>
      {!isMobile && <Sidebar user={user} userProfile={dbUserProfile} />}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '0px', marginLeft: isMobile ? 0 : '250px', overflowX: 'hidden' }}>
        {isMobile ? (
          <div style={{ padding: 20, textAlign: 'center', marginTop: 50 }}>
            <h2>Desktop Only</h2>
            <p>Please use a computer to access the Admin Dashboard.</p>
          </div>
        ) : (
          <Routes>
            {/* Dashboard Redirects to Structure for now, or a Welcome Page */}
            <Route path="/" element={<Navigate to="/structure" replace />} />

            {/* ACADEMICS */}
            <Route path="/schedule" element={<ScheduleManager />} />
            <Route path="/exams" element={<ExamManager />} />
            <Route path="/calendar" element={<CalendarManager />} />

            {/* PEOPLE */}
            <Route path="/users" element={<UserManagement />} />
            <Route path="/admins" element={<AdminRoleManager />} />

            {/* CAMPUS */}
            <Route path="/structure" element={<StructureManager />} />
            <Route path="/resources" element={<ResourceManager />} />
            <Route path="/events" element={<EventManager />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbUserProfile, setDbUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch Admin Profile
        onValue(ref(db, `users/${currentUser.uid}`), (snap) => {
          setDbUserProfile(snap.val() || {});
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <AppContent user={user} loading={loading} dbUserProfile={dbUserProfile} />
    </BrowserRouter>
  );
}

export default App;
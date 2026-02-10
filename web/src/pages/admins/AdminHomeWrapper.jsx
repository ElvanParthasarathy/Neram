import React, { useState, useEffect } from 'react';
import Home from '../Home';
import AdminViewSwitcher from '../../components/AdminViewSwitcher';
// Styles
import '../../styles/admin-switcher.css';
import { useSectionData } from '../../hooks/useSectionData';

const AdminHomeWrapper = ({ user, userProfile }) => {
    // 1. Initialize Active Profile (Default to admin's own profile, or saved session)
    const [activeProfile, setActiveProfile] = useState(() => {
        const saved = sessionStorage.getItem("admin_preview_session");
        return saved ? JSON.parse(saved) : (userProfile || { batch: "", department: "", section: "" });
    });

    // 2. Fetch Data using the Hook
    const globalData = useSectionData(activeProfile);

    // 3. Listen for Switcher Changes (Event-based, matching App.jsx pattern)
    useEffect(() => {
        const handleViewChange = () => {
            const savedTemp = sessionStorage.getItem("admin_preview_session");
            if (savedTemp) {
                try {
                    setActiveProfile(JSON.parse(savedTemp));
                } catch (e) {
                    // Fallback
                }
            } else {
                // If cleared, revert to userProfile
                setActiveProfile(userProfile);
            }
        };

        window.addEventListener('adminViewChanged', handleViewChange);
        return () => window.removeEventListener('adminViewChanged', handleViewChange);
    }, [userProfile]);

    return (
        <div className="admin-home-wrapper" style={{ position: 'relative', width: '100%' }}>

            {/* SWITCHER COMPONENT: FLOWS NATURALLY AT TOP */}
            <div style={{ padding: '20px 20px 0 20px', marginBottom: '10px' }}>
                <AdminViewSwitcher realProfile={userProfile} />
            </div>

            {/* REUSED HOME COMPONENT */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <Home
                    isAdmin={true}
                    globalData={globalData}
                    userProfile={userProfile} /* The ADMIN'S real profile */
                    activeProfile={activeProfile} /* The STUDENT view profile */
                />
            </div>
        </div>
    );
};

export default AdminHomeWrapper;

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminProfile from './admins/AdminProfile';
import Security from './settings/Security';
import ThemeToggle from '../components/ThemeToggle';
import { RiUserLine, RiShieldKeyholeLine } from 'react-icons/ri';

const AdminSettings = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'personal';

    const handleTabChange = (newTab) => {
        setSearchParams({ tab: newTab });
    };

    return (
        <div className="settings-view-dead-end">
            <ThemeToggle />

            {/* HEADER: LOCKED TO TOP-LEFT EDGE */}
            <header className="settings-top-nav-bar">
                <h1 className="settings-label-main">Admin Settings</h1>

                <nav className="shifter-group-left">
                    <button
                        className={`shifter-item ${activeTab === 'personal' ? 'active' : ''}`}
                        onClick={() => handleTabChange('personal')}
                    >
                        <RiUserLine /> <span>Admin Profile</span>
                    </button>

                    <button
                        className={`shifter-item ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => handleTabChange('security')}
                    >
                        <RiShieldKeyholeLine /> <span>Security</span>
                    </button>
                </nav>
            </header>

            {/* MAIN CONTENT */}
            <main className="settings-content-flow">
                {activeTab === 'personal' && <AdminProfile />}
                {activeTab === 'security' && <Security />}
            </main>
        </div>
    );
};

export default AdminSettings;

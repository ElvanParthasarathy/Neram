import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminProfile from './admins/AdminProfile';
import Security from './settings/Security';
import Maintenance from './settings/Maintenance';
import About from './settings/About';
import { RiUserLine, RiShieldKeyholeLine, RiToolsLine, RiInformationLine } from 'react-icons/ri';
import '../styles/admin-settings.css';

const AdminSettings = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'personal';

    const handleTabChange = (newTab) => {
        setSearchParams({ tab: newTab });
    };

    return (
        <div className="settings-view-dead-end">

            {/* HEADER: LOCKED TO TOP-LEFT EDGE */}
            <header className="settings-top-nav-bar">
                <h1 className="settings-label-main">Admin Settings</h1>

                <div className="settings-shifter-container">
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

                        <button
                            className={`shifter-item ${activeTab === 'maintenance' ? 'active' : ''}`}
                            onClick={() => handleTabChange('maintenance')}
                        >
                            <RiToolsLine /> <span>Maintenance</span>
                        </button>

                        <button
                            className={`shifter-item ${activeTab === 'about' ? 'active' : ''}`}
                            onClick={() => handleTabChange('about')}
                        >
                            <RiInformationLine /> <span>About</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="settings-content-flow">
                {activeTab === 'personal' && <AdminProfile />}
                {activeTab === 'security' && <Security />}
                {activeTab === 'maintenance' && <Maintenance />}
                {activeTab === 'about' && <About />}
            </main>
        </div>
    );
};

export default AdminSettings;

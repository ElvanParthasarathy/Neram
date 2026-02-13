import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PersonalInfo from './settings/PersonalInfo';
import Security from './settings/Security';
import UserDirectory from './settings/UserDirectory';
import Maintenance from './settings/Maintenance';
import About from './settings/About';
// MAC-STYLE LINE ICONS
import { RiUserLine, RiShieldKeyholeLine, RiGroupLine, RiToolsLine, RiInformationLine } from 'react-icons/ri';

const Settings = ({ userProfile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'personal';

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="settings-view-dead-end">

      {/* HEADER: LOCKED TO TOP-LEFT EDGE */}
      <header className="settings-top-nav-bar">
        <h1 className="settings-label-main">Settings</h1>

        <nav className="shifter-group-left">
          <button
            className={`shifter-item ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => handleTabChange('personal')}
          >
            <RiUserLine /> <span>Profile</span>
          </button>

          <button
            className={`shifter-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => handleTabChange('security')}
          >
            <RiShieldKeyholeLine /> <span>Security</span>
          </button>

          <button
            className={`shifter-item ${activeTab === 'directory' ? 'active' : ''}`}
            onClick={() => handleTabChange('directory')}
          >
            <RiGroupLine /> <span>Users</span>
          </button>

          <button
            className={`shifter-item ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => handleTabChange('maintenance')}
          >
            <RiToolsLine /> <span>Storage</span>
          </button>

          <button
            className={`shifter-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => handleTabChange('about')}
          >
            <RiInformationLine /> <span>About</span>
          </button>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="settings-content-flow">
        {activeTab === 'personal' && <PersonalInfo />}
        {activeTab === 'security' && <Security />}
        {activeTab === 'directory' && <UserDirectory />}
        {activeTab === 'maintenance' && (
          <Maintenance
            batch={userProfile?.batch}
            department={userProfile?.department}
            section={userProfile?.section}
          />
        )}
        {activeTab === 'about' && <About />}
      </main>
    </div>
  );
};

export default Settings;
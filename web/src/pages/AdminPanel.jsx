import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  RiListCheck,
  RiUserSettingsLine,
  RiAdminLine,
  RiCalendarScheduleLine,
  RiCalendarEventLine,
  RiTrophyLine,
  RiShieldUserLine,
  RiComputerLine,
  RiArrowLeftLine,
  RiFlagLine,
  RiFilePdfLine // <--- ADD THIS HERE
} from 'react-icons/ri';

// Import sub-components
import StructureManager from './admins/StructureManager';
import UserManagement from './admins/UserManagement';
import ScheduleManager from './admins/ScheduleManager';
import CalendarManager from './admins/CalendarManager';
import ExamManager from './admins/ExamManager';
import AdminRoleManager from './admins/AdminRoleManager';
import EventManager from './admins/EventManager';
import ResourceManager from './admins/ResourceManager'; // Add this line

const AdminPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeModule = searchParams.get('mod') || 'structure';

  // --- 1. INTERNAL MOBILE CHECK ---
  // We check window width immediately on mount
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleModuleChange = (newMod) => {
    setSearchParams({ mod: newMod });
  };

  // --- 2. MOBILE BLOCKER UI ---
  // If user is on mobile, we return this VIEW instead of the Admin Panel
  if (isMobile) {
    return (
      <div className="mobile-admin-blocker">
        <div className="blocker-card">
          <div className="blocker-icon-circle">
            <RiComputerLine className="blocker-icon" />
          </div>
          <h2 className="blocker-title">Desktop Only</h2>
          <p className="blocker-msg">
            The Admin Panel is optimized for desktop usage.<br />
            Please access this page from a <strong>Laptop</strong> or <strong>PC</strong>.
          </p>
          <div className="blocker-actions">
            <button className="blocker-back-btn" onClick={() => navigate('/')}>
              <RiArrowLeftLine /> Go Home
            </button>
            <button className="blocker-settings-btn" onClick={() => navigate('/settings')}>
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. STANDARD DESKTOP ADMIN VIEW ---
  return (
    <div className="admin-view-dead-end">
      {/* HEADER: LOCKED TO TOP-LEFT EDGE */}
      <header className="admin-top-nav-bar">
        <h1 className="admin-label-main">Admin Panel</h1>

        <div className="admin-nav-sections">
          {/* GROUP 1: ACADEMIC SETUP */}
          <div className="shifter-category">
            <span className="category-tag">Academic</span>
            <nav className="shifter-group-left">
              <button
                className={`shifter-item ${activeModule === 'structure' ? 'active' : ''}`}
                onClick={() => handleModuleChange('structure')}
              >
                <RiListCheck /> Structure
              </button>
              <button
                className={`shifter-item ${activeModule === 'users' ? 'active' : ''}`}
                onClick={() => handleModuleChange('users')}
              >
                <RiUserSettingsLine /> Users
              </button>
              <button
                className={`shifter-item ${activeModule === 'roles' ? 'active' : ''}`}
                onClick={() => handleModuleChange('roles')}
              >
                <RiShieldUserLine /> Admins
              </button>
            </nav>
          </div>

          {/* GROUP 2: PLANNING & SYNC */}
          <div className="shifter-category">
            <span className="category-tag">Planning</span>
            <nav className="shifter-group-left">
              <button
                className={`shifter-item ${activeModule === 'schedules' ? 'active' : ''}`}
                onClick={() => handleModuleChange('schedules')}
              >
                <RiCalendarScheduleLine /> Schedule
              </button>
              <button
                className={`shifter-item ${activeModule === 'exams' ? 'active' : ''}`}
                onClick={() => handleModuleChange('exams')}
              >
                <RiTrophyLine /> Exams
              </button>
              <button
                className={`shifter-item ${activeModule === 'events' ? 'active' : ''}`}
                onClick={() => handleModuleChange('events')}
              >
                <RiFlagLine /> Events
              </button>
              <button
                className={`shifter-item ${activeModule === 'calendar' ? 'active' : ''}`}
                onClick={() => handleModuleChange('calendar')}
              >
                <RiCalendarEventLine /> Calendar
              </button>
              <button
                className={`shifter-item ${activeModule === 'resources' ? 'active' : ''}`}
                onClick={() => handleModuleChange('resources')}
              >
                <RiFilePdfLine /> Resources
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT: EXPANDS TO FULL BREADTH */}
      <main className="admin-content-flow">
        {activeModule === 'structure' && <StructureManager />}
        {activeModule === 'users' && <UserManagement />}
        {activeModule === 'roles' && <AdminRoleManager />}
        {activeModule === 'schedules' && <ScheduleManager />}
        {activeModule === 'exams' && <ExamManager />}
        {activeModule === 'events' && <EventManager />}
        {activeModule === 'calendar' && <CalendarManager />}
        {activeModule === 'resources' && <ResourceManager />}
      </main>
    </div>
  );
};

export default AdminPanel;
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
import { getHardcodedRole } from '../data/admins';

// Import sub-components
import StructureManager from './admins/StructureManager';
import UserManagement from './admins/UserManagement';
import ScheduleManager from './admins/ScheduleManager';
import CalendarManager from './admins/CalendarManager';
import ExamManager from './admins/ExamManager';
import AdminRoleManager from './admins/AdminRoleManager';
import EventManager from './admins/EventManager';
import ResourceManager from './admins/ResourceManager';
import AdminDashboard from './admins/AdminDashboard';

const AdminPanel = ({ user, userProfile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeModule = searchParams.get('mod') || 'home';

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

  // --- ROLE CHECK FOR ACCESS CONTROL ---
  const emailRole = user?.email ? getHardcodedRole(user.email) : null;
  const dbRole = userProfile?.role;
  const finalRole = emailRole || dbRole || 'student';
  const isRep = finalRole === 'rep';

  // Restricted modules for Reps
  const restrictedModules = ['users', 'roles', 'structure'];

  // Redirect Reps trying to access restricted modules
  useEffect(() => {
    if (isRep && restrictedModules.includes(activeModule)) {
      // Force redirect to home
      setSearchParams({ mod: 'home' });
      alert("Access Denied: You do not have permission to view this module.");
    }
  }, [activeModule, isRep]);

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
      {/* MAIN CONTENT: EXPANDS TO FULL BREADTH */}
      <main className="admin-content-flow" style={{ paddingTop: '0' }}>
        {activeModule !== 'home' && (
          <header className="page-header">
            <h1 className="page-title">
              {activeModule === 'users' && 'Users'}
              {activeModule === 'roles' && 'Admins'}
              {activeModule === 'schedules' && 'Schedule'}
              {activeModule === 'exams' && 'Exams'}
              {activeModule === 'events' && 'Events'}
              {activeModule === 'calendar' && 'Calendar'}
              {activeModule === 'resources' && 'Resources'}
              {activeModule === 'structure' && 'Structure'}
            </h1>
          </header>
        )}
        {activeModule === 'home' && <AdminDashboard user={user} userProfile={userProfile} />}
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
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
  RiFilePdfLine,
  RiInboxArchiveLine
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
import PendingRequests from './admins/PendingRequests';
import SemesterTransitionManager from './admins/SemesterTransitionManager';
import SpecialClassManager from './admins/SpecialClassManager';
import NotesManager from './admins/NotesManager';

const AdminPanel = ({ user, userProfile, isMobile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeModule = searchParams.get('mod') || 'home';


  const handleModuleChange = (newMod) => {
    setSearchParams({ mod: newMod });
  };

  // --- ROLE CHECK FOR ACCESS CONTROL ---
  const emailRole = user?.email ? getHardcodedRole(user.email) : null;
  const dbRole = userProfile?.role;
  const finalRole = emailRole || dbRole || 'student';
  const isSuper = finalRole === 'super_admin';
  const isFaculty = finalRole === 'faculty';
  const isRep = finalRole === 'rep';

  // --- ACCESS CONTROL LIST ---
  // Super Admin: Has access to EVERYTHING.
  // Faculty: users, roles, schedules, exams, events. (Block: structure, calendar, resources)
  // Rep: roles, schedules, exams, events. (Block: users, structure, calendar, resources)

  useEffect(() => {
    let unauthorized = false;

    if (isFaculty) {
      if (['structure', 'calendar', 'resources', 'archives'].includes(activeModule)) unauthorized = true;
    }
    else if (isRep) {
      // Reps can see 'roles' (Admins) as per request, but not 'users'.
      if (['structure', 'calendar', 'resources', 'users', 'archives'].includes(activeModule)) unauthorized = true;
    }

    if (unauthorized) {
      // Force redirect to home
      setSearchParams({ mod: 'home' });
      // alert("Access Denied: You do not have permission to view this module."); // Optional: verify if alert is annoying
    }
  }, [activeModule, isFaculty, isRep]);


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
              {activeModule === 'notes' && 'Notes Manager'}
              {activeModule === 'pending' && 'Pending Requests'}
              {activeModule === 'structure' && 'Structure'}
              {activeModule === 'archives' && 'Semester Archive Tool'}
              {activeModule === 'special_classes' && 'Special Classes'}
            </h1>
          </header>
        )}
        {activeModule === 'home' && <AdminDashboard user={user} userProfile={userProfile} />}
        {activeModule === 'structure' && <StructureManager />}
        {activeModule === 'users' && <UserManagement />}
        {activeModule === 'roles' && <AdminRoleManager userProfile={userProfile} />}
        {activeModule === 'schedules' && <ScheduleManager user={user} userProfile={userProfile} isMobile={isMobile} />}

        {activeModule === 'exams' && <ExamManager user={user} userProfile={userProfile} isMobile={isMobile} />}
        {activeModule === 'events' && <EventManager user={user} userProfile={userProfile} isMobile={isMobile} />}
        {activeModule === 'calendar' && <CalendarManager />}
        {activeModule === 'resources' && <ResourceManager />}
        {activeModule === 'notes' && <NotesManager />}
        {activeModule === 'pending' && <PendingRequests />}
        {activeModule === 'archives' && <SemesterTransitionManager user={user} userProfile={userProfile} isMobile={isMobile} />}
        {activeModule === 'special_classes' && <SpecialClassManager user={user} userProfile={userProfile} isMobile={isMobile} />}
      </main>
    </div>
  );
};

export default AdminPanel;
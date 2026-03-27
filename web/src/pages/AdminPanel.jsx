import React, { useState, useEffect, Suspense } from 'react';
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

// Lazy-load sub-components for smooth skeleton transitions
const UserManagement = React.lazy(() => import('./admins/UserManagement'));
const ScheduleManager = React.lazy(() => import('./admins/ScheduleManager'));
const CalendarManager = React.lazy(() => import('./admins/CalendarManager'));
const ExamManager = React.lazy(() => import('./admins/ExamManager'));
const AdminRoleManager = React.lazy(() => import('./admins/AdminRoleManager'));
const EventManager = React.lazy(() => import('./admins/EventManager'));
const ResourceManager = React.lazy(() => import('./admins/ResourceManager'));
const AdminDashboard = React.lazy(() => import('./admins/AdminDashboard'));
const StructureManager = React.lazy(() => import("./admins/StructureManager"));
const FacultyDirectory = React.lazy(() => import("./admins/FacultyDirectory"));
const PendingRequests = React.lazy(() => import('./admins/PendingRequests'));
const SemesterTransitionManager = React.lazy(() => import('./admins/SemesterTransitionManager'));
const SpecialClassManager = React.lazy(() => import('./admins/SpecialClassManager'));
const NotesManager = React.lazy(() => import('./admins/NotesManager'));

// --- Skeleton Fallback ---
const AdminSkeletonFallback = () => (
  <div className="admin-skeleton-page" style={{ padding: '20px' }}>
    <div className="skeleton skeleton-title" style={{ width: '40%', height: '18px', marginBottom: '24px' }}></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div className="skeleton skeleton-explorer-card"></div>
      <div className="skeleton skeleton-explorer-card"></div>
      <div className="skeleton skeleton-explorer-card"></div>
    </div>
    <div className="skeleton skeleton-card" style={{ height: '140px' }}></div>
    <div className="skeleton skeleton-card" style={{ height: '100px' }}></div>
  </div>
);

const AdminPanel = ({ user, userProfile, isMobile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeModule = searchParams.get('mod') || 'home';


  const handleModuleChange = (newMod) => {
    setSearchParams({ mod: newMod }, { replace: false });
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
      // Faculty: blocked from faculty directory, structure, archives
      if (['structure', 'archives', 'faculty', 'pending'].includes(activeModule)) unauthorized = true;
    }
    else if (isRep) {
      // Reps: only planning tools + admins + notes. Blocked from everything else.
      if (['structure', 'calendar', 'resources', 'users', 'faculty', 'archives', 'pending'].includes(activeModule)) unauthorized = true;
    }

    if (unauthorized) {
      // Force redirect to home
      setSearchParams({ mod: 'home' });
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
              {activeModule === 'faculty' && 'Faculty Directory'}
              {activeModule === 'schedules' && 'Schedule'}
              {activeModule === 'exams' && 'Exams'}
              {activeModule === 'events' && 'Events'}
              {activeModule === 'calendar' && 'Calendar'}
              {activeModule === 'resources' && 'Resources'}
              {activeModule === 'notes' && 'Notes Manager'}
              {activeModule === 'pending' && 'Pending Requests'}
              {activeModule === 'structure' && 'Structure Manager'}
              {activeModule === 'archives' && 'Semester Archive Tool'}
              {activeModule === 'special_classes' && 'Special Classes'}
            </h1>
          </header>
        )}
        <Suspense fallback={<AdminSkeletonFallback />}>
          {activeModule === 'home' && <AdminDashboard user={user} userProfile={userProfile} isMobile={isMobile} />}
          {activeModule === 'structure' && <StructureManager isMobile={isMobile} />}
          {activeModule === 'users' && <UserManagement isMobile={isMobile} />}
          {activeModule === 'roles' && <AdminRoleManager userProfile={userProfile} isMobile={isMobile} />}
          {activeModule === 'faculty' && <FacultyDirectory isMobile={isMobile} />}
          {activeModule === 'schedules' && <ScheduleManager user={user} userProfile={userProfile} isMobile={isMobile} />}

          {activeModule === 'exams' && <ExamManager user={user} userProfile={userProfile} isMobile={isMobile} />}
          {activeModule === 'events' && <EventManager user={user} userProfile={userProfile} isMobile={isMobile} />}
          {activeModule === 'calendar' && <CalendarManager isMobile={isMobile} />}
          {activeModule === 'resources' && <ResourceManager isMobile={isMobile} />}
          {activeModule === 'notes' && <NotesManager isMobile={isMobile} />}
          {activeModule === 'pending' && <PendingRequests isMobile={isMobile} />}
          {activeModule === 'archives' && <SemesterTransitionManager user={user} userProfile={userProfile} isMobile={isMobile} />}
          {activeModule === 'special_classes' && <SpecialClassManager user={user} userProfile={userProfile} isMobile={isMobile} />}
        </Suspense>
      </main>
    </div>
  );
};

export default AdminPanel;
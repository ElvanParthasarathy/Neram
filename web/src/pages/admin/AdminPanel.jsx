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
import { getHardcodedRole } from '../../data/admins';

// Lazy-load sub-components for smooth skeleton transitions
const UserManagement = React.lazy(() => import('./modules/UserManagement'));
const ScheduleManager = React.lazy(() => import('./modules/ScheduleManager'));
const CalendarManager = React.lazy(() => import('./modules/CalendarManager'));
const ExamManager = React.lazy(() => import('./modules/ExamManager'));
const AdminRoleManager = React.lazy(() => import('./modules/AdminRoleManager'));
const EventManager = React.lazy(() => import('./modules/EventManager'));
const ResourceManager = React.lazy(() => import('./modules/ResourceManager'));
const AdminDashboard = React.lazy(() => import('./modules/AdminDashboard'));
const StructureManager = React.lazy(() => import("./modules/StructureManager"));
const FacultyDirectory = React.lazy(() => import("./modules/FacultyDirectory"));
const PendingRequests = React.lazy(() => import('./modules/PendingRequests'));
const SemesterTransitionManager = React.lazy(() => import('./modules/SemesterTransitionManager'));
const SpecialClassManager = React.lazy(() => import('./modules/SpecialClassManager'));
const NotesManager = React.lazy(() => import('./modules/NotesManager'));

// --- Neutral Fallback to prevent "double skeleton" flash ---
const AdminSkeletonFallback = () => (
  <div className="admin-skeleton-page" style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <div className="skeleton-circle" style={{ width: 40, height: 40, border: '3px solid var(--mac-blue-15)', borderTopColor: 'var(--mac-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    <style>{`
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `}</style>
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
        {/* Global Page Header removed; titles are now localized to match back button alignment */}
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
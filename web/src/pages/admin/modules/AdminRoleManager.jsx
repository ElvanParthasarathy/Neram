import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, auth } from "../../../firebase";
import { ref, onValue, update } from "firebase/database";
import { adminEmails, getHardcodedRole } from "../../../data/admins";
import {
  RiLockLine,
  RiMore2Fill,
  RiTeamLine,
  RiLayoutGridLine,
  RiShieldUserLine,
  RiArrowRightSLine,
  RiArrowLeftLine,
  RiMailLine,
  RiGoogleFill
} from 'react-icons/ri';
import "../../../styles/admin/user-management.css";
import { AdminPageSkeleton } from '../../../components/ui/AdminSkeletons';
import { useToast } from '../../../contexts/ToastContext';


const AdminRoleManager = ({ userProfile }) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState({});
  const [hierarchy, setHierarchy] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const viewLevel = searchParams.get('rlvl') || 'batches'; // Default to batches
  const selectedCategory = searchParams.get('rcat') || 'Student Admins'; // Default category
  const drillPath = {
    batch: searchParams.get('rb') || '',
    dept: searchParams.get('rd') || ''
  };

  const updateParams = (updates = {}, forceReplace = false) => {
    const params = {
      mod: 'roles',
      rlvl: viewLevel,
      rcat: selectedCategory,
      rb: drillPath.batch,
      rd: drillPath.dept,
      ...updates
    };
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    setSearchParams(params, { replace: forceReplace });
  };
  const [activeMenuId, setActiveMenuId] = useState(null);

  // --- DERIVE CURRENT USER ROLE ---
  const currentUser = auth.currentUser;
  const emailRole = currentUser?.email ? getHardcodedRole(currentUser.email) : null;
  const dbRole = userProfile?.role;
  const myRole = emailRole || dbRole || 'student';

  const iAmSuper = myRole === 'super_admin';
  const iAmFaculty = myRole === 'faculty';
  const iAmRep = myRole === 'rep';
  const iAmFacultyOrSuper = iAmFaculty || iAmSuper;

  // Tab edit access: who can promote/demote in each tab
  const canEditStudentsTab = iAmSuper || iAmFaculty || iAmRep;
  const canEditFacultyTab  = iAmSuper || iAmFaculty;
  const canEditSuperTab    = iAmSuper;

  // Grant buttons available in Promote view
  const canGrantRep     = canEditStudentsTab;
  const canGrantFaculty = iAmFacultyOrSuper;
  const canGrantSuper   = iAmSuper;

  // Helper: does the viewer have at least one action on a given user card?
  const canManageUser = (targetRole, isHardcoded) => {
    if (isHardcoded) return false;
    if (targetRole === 'rep')         return canEditStudentsTab;
    if (targetRole === 'faculty')     return canEditFacultyTab;
    if (targetRole === 'super_admin') return canEditSuperTab;
    return false;
  };

  // 1. Fetch Data
  useEffect(() => {
    const usersRef = ref(db, 'users');
    const hierarchyRef = ref(db, 'academic_hierarchy');

    const unsubUsers = onValue(usersRef, (snapshot) => {
      setUsers(snapshot.exists() ? snapshot.val() : {});
    });

    const unsubHierarchy = onValue(hierarchyRef, (snapshot) => {
      setHierarchy(snapshot.exists() ? snapshot.val() : {});
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubHierarchy();
    };
  }, []);

  const isSpecialAdmin = (email) => adminEmails.includes(email);

  const updateRole = async (uid, newRole) => {
    let action = "Update Role";
    if (newRole === 'student') action = "Remove Admin Access";
    else if (newRole === 'faculty') action = "Grant Faculty Admin Access";
    else if (newRole === 'rep') action = "Grant Student Admin Access";
    else if (newRole === 'super_admin') action = "Grant Super Admin Access";

    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      await update(ref(db, `users/${uid}`), { role: newRole });
      showToast(`✅ ${action} successful.`);
    } catch (err) {
      showToast("Error: " + err.message);
    }
  };

  const resetToRoot = () => {
    updateParams({ rlvl: 'root', rcat: '', rb: '', rd: '' }, true);
    setSearchTerm("");
  };

  const handleTabChange = (category) => {
    setSearchTerm("");
    if (category === 'Super Admins') {
      updateParams({ rcat: category, rlvl: 'list', rb: '', rd: '' }, true);
    } else if (category === 'Faculty Admins') {
      updateParams({ rcat: category, rlvl: 'depts', rb: '', rd: '' }, true);
    } else if (category === 'Student Admins') {
      updateParams({ rcat: category, rlvl: 'batches', rb: '', rd: '' }, true);
    }
  };

  const navigateBack = () => {
    if (viewLevel === 'promote') {
      // Go back to the tab's root view
      if (selectedCategory === 'Student Admins') {
        updateParams({ rlvl: 'batches', rb: '', rd: '' }, true);
      } else if (selectedCategory === 'Faculty Admins') {
        updateParams({ rlvl: 'depts', rb: '', rd: '' }, true);
      } else {
        updateParams({ rlvl: 'list', rb: '', rd: '' }, true);
      }
    } else if (viewLevel === 'list') {
      if (selectedCategory === 'Student Admins') {
        updateParams({ rlvl: 'depts', rd: '' }, true);
      } else if (selectedCategory === 'Faculty Admins') {
        updateParams({ rlvl: 'depts', rd: '' }, true);
      } else {
        setSearchParams({ mod: 'home' }, { replace: true });
      }
    } else if (viewLevel === 'depts') {
      if (selectedCategory === 'Student Admins' && drillPath.batch) {
        updateParams({ rlvl: 'batches', rb: '', rd: '' }, true);
      } else {
        setSearchParams({ mod: 'home' }, { replace: true });
      }
    } else {
      setSearchParams({ mod: 'home' }, { replace: true });
    }
  };

  const getAdminsByRole = (roleTitle) => {
    return Object.entries(users)
      .filter(([_, u]) => {
        const hardcodedRole = getHardcodedRole(u.email);

        let category = '';
        if (hardcodedRole) {
          category = hardcodedRole === 'super_admin' ? 'Super Admins' : (hardcodedRole === 'faculty' ? 'Faculty Admins' : 'Student Admins');
        } else {
          // STRICT ROLES: only include these
          if (u.role === 'super_admin') category = 'Super Admins';
          else if (u.role === 'faculty' || u.role === 'admin') category = 'Faculty Admins';
          else if (u.role === 'rep') category = 'Student Admins';
          else return false; // SKIP NORMAL STUDENTS
        }

        // Match base category
        if (category !== roleTitle) return false;

        // Drill-down filters (Simplified - No section)
        if (roleTitle === 'Student Admins') {
          if (drillPath.batch && u.batch !== drillPath.batch) return false;
          if (drillPath.dept && u.department !== drillPath.dept) return false;
        } else if (roleTitle === 'Faculty Admins') {
          if (drillPath.dept && u.department !== drillPath.dept) return false;
        }

        return true;
      })
      .sort((a, b) => (a[1].displayName || "").localeCompare(b[1].displayName || ""));
  };

  const getProviderIcon = (u) => {
    if (u.photoURL?.includes('googleusercontent') || u.email?.endsWith('@rmd.ac.in')) {
      return <RiGoogleFill className="provider-icon google" title="Google Account" />;
    }
    return <RiMailLine className="provider-icon email" title="Email Account" />;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.admin-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) return (
    <div className="admin-subpage">
      <AdminPageSkeleton />
    </div>
  );


  return (
    <div className="admin-subpage">
      <style>{`
        .admin-menu-container {
          position: relative;
        }
        .admin-dropdown-menu {
          position: absolute;
          right: 4px;
          top: 38px;
          background: var(--mac-sidebar-bg);
          backdrop-filter: blur(25px) saturate(200%);
          -webkit-backdrop-filter: blur(25px) saturate(200%);
          border: 1px solid var(--mac-border);
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.3);
          z-index: 1000;
          min-width: 160px;
          overflow: hidden;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          transform-origin: top right;
          animation: menu-pop 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        @keyframes menu-pop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .menu-item {
          background: transparent;
          border: none;
          padding: 10px 14px;
          text-align: left;
          font-size: 13px;
          font-weight: 500;
          color: var(--mac-text);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .menu-item:hover {
          background: var(--mac-blue);
          color: white;
        }
        .menu-item.text-red {
          color: #FF3B30;
        }
        .menu-item.text-red:hover {
          background: #FF3B30;
          color: white;
        }
        /* Disable hover push-up ONLY for user cards to keep menus stable */
        .user-management-card:hover {
          transform: none !important;
        }
        .explorer-card.variant-dept .card-icon { color: #5856D6; }
        .explorer-card.variant-sec .card-initial { 
          width: 48px; height: 48px; background: var(--mac-bg-secondary); 
          color: var(--mac-text); border-radius: 12px; display: flex; 
          align-items: center; justify-content: center; font-size: 18px; 
          font-weight: 700; margin-bottom: 20px;
        }
      `}</style>

      {/* 0. ROLE SWITCHER (Persistent) */}
      <div className="role-switcher-container">
        <div className="role-pill-switcher">
          <button
            className={`role-pill ${selectedCategory === 'Student Admins' ? 'active' : ''}`}
            onClick={() => handleTabChange('Student Admins')}
          >
            Students
          </button>
          <button
            className={`role-pill ${selectedCategory === 'Faculty Admins' ? 'active' : ''}`}
            onClick={() => handleTabChange('Faculty Admins')}
          >
            Faculty
          </button>
          <button
            className={`role-pill ${selectedCategory === 'Super Admins' ? 'active' : ''}`}
            onClick={() => handleTabChange('Super Admins')}
          >
            Super
          </button>
        </div>
      </div>

      {/* 2. HEADER & BREADCRUMBS */}
      <header className="explorer-header" style={{ marginBottom: '20px' }}>
        <div className="breadcrumb-nav">
          <div className="breadcrumb-list">
            {selectedCategory === 'Student Admins' && drillPath.batch && (
              <>
                <span className="crumb-btn level-root" onClick={() => updateParams({ rlvl: 'batches', rb: '', rd: '' }, true)}>
                  Batches
                </span>
                <RiArrowRightSLine className="crumb-sep" />
                <span className="crumb-btn" onClick={() => updateParams({ rlvl: 'depts', rd: '' }, true)}>
                  {drillPath.batch}
                </span>
              </>
            )}
            {selectedCategory === 'Faculty Admins' && drillPath.dept && (
              <>
                <span className="crumb-btn level-root" onClick={() => updateParams({ rlvl: 'depts', rb: '', rd: '' }, true)}>
                  Departments
                </span>
              </>
            )}
            {drillPath.dept && (
              <>
                <RiArrowRightSLine className="crumb-sep" />
                <span className="crumb-static">{drillPath.dept}</span>
              </>
            )}
            {selectedCategory === 'Super Admins' && (
              <span className="crumb-static level-root">System Owners</span>
            )}
            {!drillPath.batch && !drillPath.dept && selectedCategory !== 'Super Admins' && viewLevel !== 'promote' && (
              <span className="crumb-static level-root" style={{ opacity: 0.5 }}>
                {selectedCategory === 'Student Admins' ? 'Select Batch' : 'Select Department'}
              </span>
            )}
            {viewLevel === 'promote' && (
              <span className="crumb-static level-root">Promote New Admin</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="explorer-back-btn" onClick={navigateBack}>
            <RiArrowLeftLine /> Back
          </button>
        </div>
      </header>

      {/* 3. BATCHES VIEW (STUDENTS ONLY) */}
      {viewLevel === 'batches' && (
        <div className="explorer-view animate-fade-in">
          <div className="explorer-grid">
            {canEditStudentsTab && (
            <div className="explorer-card" onClick={() => { setSearchTerm(''); updateParams({ rlvl: 'promote' }); }}>
              <RiShieldUserLine className="card-icon" />
              <div className="card-info">
                <h3>Promote Admin</h3>
                <p>Add new staff/student admin</p>
              </div>
            </div>
            )}
            {Object.keys(hierarchy).sort().reverse().map(batch => (
              <div key={batch} className="explorer-card" onClick={() => updateParams({ rb: batch, rlvl: 'depts' })}>
                <RiTeamLine className="card-icon" />
                <div className="card-info">
                  <h3>Batch {batch}</h3>
                  <p>Explore Departments</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. DEPTS VIEW (FACULTY & STUDENTS) */}
      {viewLevel === 'depts' && (
        <div className="explorer-view animate-fade-in">
          <div className="explorer-grid">
            {!drillPath.dept && (() => {
              const tabEditAccess = selectedCategory === 'Student Admins' ? canEditStudentsTab
                : selectedCategory === 'Faculty Admins' ? canEditFacultyTab
                : canEditSuperTab;
              return tabEditAccess ? (
                <div className="explorer-card" onClick={() => { setSearchTerm(''); updateParams({ rlvl: 'promote' }); }}>
                  <RiShieldUserLine className="card-icon" />
                  <div className="card-info">
                    <h3>Promote Admin</h3>
                    <p>Add new staff/student admin</p>
                  </div>
                </div>
              ) : null;
            })()}
            {(() => {
              const depts = selectedCategory === 'Faculty Admins'
                ? Array.from(new Set(Object.values(users).filter(u => u.role === 'faculty' && u.department).map(u => u.department)))
                : Object.keys(hierarchy[drillPath.batch] || {}).filter(k => k !== 'initialized');

              return depts.sort().map(dept => (
                <div key={dept} className="explorer-card variant-dept" onClick={() => updateParams({ rd: dept, rlvl: 'list' })}>
                  <RiLayoutGridLine className="card-icon" />
                  <div className="card-info">
                    <h3>{dept}</h3>
                    <p>View Admins</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* 5. LIST VIEW */}
      {viewLevel === 'list' && (
        <div className="explorer-view animate-fade-in">
          <div className="admin-card search-card">
            <input
              type="text"
              placeholder={`Search ${selectedCategory.toLowerCase()}...`}
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />
          </div>

          <div className="user-directory-grid">
            {getAdminsByRole(selectedCategory)
              .filter(([_, u]) =>
                u.displayName?.toLowerCase().includes(searchTerm) ||
                u.email?.toLowerCase().includes(searchTerm)
              )
              .map(([uid, u]) => {
                const hardcodedRole = getHardcodedRole(u.email);
                const badgeRole = hardcodedRole
                  ? (hardcodedRole === 'super_admin' ? 'Super Admin' : (hardcodedRole === 'faculty' ? 'Faculty Admin' : 'Student Admin'))
                  : (u.role === 'super_admin' ? 'Super Admin' : (u.role === 'rep' ? 'Student Admin' : 'Faculty Admin'));

                return (
                  <div key={uid} className="user-management-card" style={{ position: 'relative' }}>
                    <div className="card-top">
                      <img src={u.photoURL || "/default-avatar.png"} className="user-card-avatar" alt="" />
                      {getProviderIcon(u)}
                    </div>
                    <div className="card-info">
                      <h4 className="u-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {u.displayName}
                        {hardcodedRole && <RiLockLine size={13} style={{ color: 'var(--mac-blue)' }} />}
                      </h4>
                      <p className="u-email">{u.email}</p>
                      <div className="u-badges">
                        <span className={`role-tag ${hardcodedRole || u.role}`}>{badgeRole}</span>
                        <span className="u-tag" style={{ marginLeft: '8px', opacity: 0.6 }}>{u.section ? `Sec ${u.section}` : u.department}</span>
                      </div>
                    </div>

                    {canManageUser(hardcodedRole || u.role, !!hardcodedRole) && (
                      <div className="admin-menu-container">
                        <button
                          className="btn-icon-only"
                          style={{ background: 'transparent', border: 'none', color: 'var(--mac-text-secondary)', cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === uid ? null : uid);
                          }}
                        >
                          <RiMore2Fill size={20} />
                        </button>

                        {activeMenuId === uid && (
                          <div className="admin-dropdown-menu">
                            {/* STRICT ROLE TRACKS:
                                Student track: student → rep (max). No promotion to faculty.
                                Faculty track: faculty → super_admin. No demotion to rep/student.
                            */}

                            {/* Rep → can only be removed (back to student) */}
                            {u.role === 'rep' && canEditStudentsTab && (
                              <button className="menu-item text-red" onClick={() => { updateRole(uid, 'student'); setActiveMenuId(null); }}>Remove Admin</button>
                            )}

                            {/* Faculty → can only be promoted to Super Admin */}
                            {u.role === 'faculty' && iAmSuper && (
                              <button className="menu-item" onClick={() => { updateRole(uid, 'super_admin'); setActiveMenuId(null); }}>Make Super Admin</button>
                            )}

                            {/* Super Admin → can only be downgraded to Faculty */}
                            {u.role === 'super_admin' && iAmSuper && (
                              <button className="menu-item text-red" onClick={() => { updateRole(uid, 'faculty'); setActiveMenuId(null); }}>Downgrade to Faculty</button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
          {getAdminsByRole(selectedCategory).length === 0 && (
            <div className="s2-dir-empty" style={{ background: 'transparent' }}>
              No {selectedCategory.toLowerCase()} found in this selection.
            </div>
          )}
        </div>
      )}

      {/* 6. PROMOTE VIEW */}
      {viewLevel === 'promote' && (
        <div className="explorer-view animate-fade-in">
          <div className="admin-card search-card">
            <input
              type="text"
              placeholder="Search Users by Name or Email..."
              className="search-input"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />
          </div>

          <div className="user-directory-grid">
            {Object.entries(users)
              .filter(([_, u]) => {
                if (searchTerm.length <= 2) return false;
                if (isSpecialAdmin(u.email)) return false;
                const nameMatch = u.displayName?.toLowerCase().includes(searchTerm) || u.email?.toLowerCase().includes(searchTerm);
                if (!nameMatch) return false;

                // STRICT ROLE TRACKS:
                // Super tab: only show existing faculty admins (faculty track promotion)
                if (selectedCategory === 'Super Admins') {
                  return u.role === 'faculty';
                }
                // Students/Faculty tabs: show regular users (no existing admins)
                return !['admin', 'faculty', 'rep', 'super_admin'].includes(u.role);
              })
              .slice(0, 12)
              .map(([uid, u]) => (
                <div key={uid} className="user-management-card">
                  <div className="card-top">
                    <img src={u.photoURL || "/default-avatar.png"} className="user-card-avatar" alt="" />
                  </div>
                  <div className="card-info">
                    <h4 className="u-name">{u.displayName}</h4>
                    <p className="u-email">{u.email} • {u.batch}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {/* TAB-AWARE: Only show the grant button relevant to the current tab */}
                      {selectedCategory === 'Student Admins' && canGrantRep && (
                        <button onClick={() => updateRole(uid, 'rep')} style={{ background: '#007AFF', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Grant Class Rep</button>
                      )}
                      {selectedCategory === 'Faculty Admins' && canGrantFaculty && (
                        <button onClick={() => updateRole(uid, 'faculty')} style={{ background: '#FF9500', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Grant Faculty</button>
                      )}
                      {selectedCategory === 'Super Admins' && canGrantSuper && (
                        <button onClick={() => updateRole(uid, 'super_admin')} style={{ background: '#5856D6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Grant Super Admin</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
          {searchTerm.length > 0 && searchTerm.length <= 2 && (
            <p style={{ textAlign: 'center', color: 'var(--mac-text-secondary)', marginTop: '20px' }}>Type at least 3 characters to search...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminRoleManager;
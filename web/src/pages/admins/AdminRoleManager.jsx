import React, { useState, useEffect } from 'react';
import { db, auth } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import { adminEmails, getHardcodedRole } from "../../data/admins";
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
import "../../styles/user-management.css";
import { AdminPageSkeleton } from '../../components/AdminSkeletons';


const AdminRoleManager = ({ userProfile }) => {
  const [users, setUsers] = useState({});
  const [hierarchy, setHierarchy] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Navigation State
  const [viewLevel, setViewLevel] = useState('batches'); // Default to batches
  const [selectedCategory, setSelectedCategory] = useState('Student Admins'); // Default category
  const [drillPath, setDrillPath] = useState({ batch: '', dept: '' }); // Simplified: no section

  const [activeMenuId, setActiveMenuId] = useState(null);

  // --- DERIVE CURRENT USER ROLE ---
  const currentUser = auth.currentUser;
  const emailRole = currentUser?.email ? getHardcodedRole(currentUser.email) : null;
  const dbRole = userProfile?.role;
  const myRole = emailRole || dbRole || 'student';

  const iAmSuper = myRole === 'super_admin';
  const iAmFaculty = myRole === 'faculty';
  const iAmFacultyOrSuper = iAmFaculty || iAmSuper;

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
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const resetToRoot = () => {
    setViewLevel('root');
    setSelectedCategory('');
    setDrillPath({ batch: '', dept: '' });
    setSearchTerm("");
  };

  const handleTabChange = (category) => {
    setSelectedCategory(category);
    setSearchTerm("");
    if (category === 'Super Admins') {
      setViewLevel('list');
      setDrillPath({ batch: '', dept: '' });
    } else if (category === 'Faculty Admins') {
      setViewLevel('depts');
      setDrillPath({ batch: '', dept: '' });
    } else if (category === 'Student Admins') {
      setViewLevel('batches');
      setDrillPath({ batch: '', dept: '' });
    }
  };

  const navigateBack = () => {
    if (viewLevel === 'promote') {
      // Go back to the previous list view or batches
      if (selectedCategory === 'Student Admins') setViewLevel('batches');
      else if (selectedCategory === 'Faculty Admins') setViewLevel('depts');
      else setViewLevel('list');
    }
    else if (viewLevel === 'list') {
      if (selectedCategory === 'Super Admins') setViewLevel('list'); // Nowhere else to go
      else setViewLevel('depts');
    }
    else if (viewLevel === 'depts') {
      if (selectedCategory === 'Student Admins') setViewLevel('batches');
      else setViewLevel('depts');
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
      <AdminPageSkeleton type="grid" />
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
          {selectedCategory === 'Student Admins' && drillPath.batch && (
            <>
              <span className="crumb-btn" onClick={() => { setViewLevel('batches'); setDrillPath({ batch: '', dept: '' }); }}>
                Batches
              </span>
              <RiArrowRightSLine />
              <span className="crumb-btn" onClick={() => { setViewLevel('depts'); setDrillPath(prev => ({ ...prev, dept: '' })); }}>
                {drillPath.batch}
              </span>
            </>
          )}
          {selectedCategory === 'Faculty Admins' && drillPath.dept && (
            <>
              <span className="crumb-btn" onClick={() => { setViewLevel('depts'); setDrillPath({ batch: '', dept: '' }); }}>
                Departments
              </span>
            </>
          )}
          {drillPath.dept && (
            <>
              <RiArrowRightSLine />
              <span className="crumb-static">{drillPath.dept}</span>
            </>
          )}
          {selectedCategory === 'Super Admins' && (
            <span className="crumb-static">System Owners</span>
          )}
          {!drillPath.batch && !drillPath.dept && selectedCategory !== 'Super Admins' && viewLevel !== 'promote' && (
            <span className="crumb-static" style={{ opacity: 0.5 }}>
              {selectedCategory === 'Student Admins' ? 'Select Batch' : 'Select Department'}
            </span>
          )}
          {viewLevel === 'promote' && (
            <span className="crumb-static">Promote New Admin</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {((selectedCategory === 'Student Admins' && viewLevel !== 'batches') ||
            (selectedCategory === 'Faculty Admins' && viewLevel !== 'depts') ||
            (viewLevel === 'promote')) && (
              <button className="explorer-back-btn" onClick={navigateBack}>
                <RiArrowLeftLine /> Back
              </button>
            )}
        </div>
      </header>

      {/* 3. BATCHES VIEW (STUDENTS ONLY) */}
      {viewLevel === 'batches' && (
        <div className="explorer-view animate-fade-in">
          <div className="explorer-grid">
            <div className="explorer-card" onClick={() => { setSearchTerm(''); setViewLevel('promote'); }}>
              <RiShieldUserLine className="card-icon" />
              <div className="card-info">
                <h3>Promote Admin</h3>
                <p>Add new staff/student admin</p>
              </div>
            </div>
            {Object.keys(hierarchy).sort().reverse().map(batch => (
              <div key={batch} className="explorer-card" onClick={() => { setDrillPath(prev => ({ ...prev, batch })); setViewLevel('depts'); }}>
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
            {!drillPath.dept && (
              <div className="explorer-card" onClick={() => { setSearchTerm(''); setViewLevel('promote'); }}>
                <RiShieldUserLine className="card-icon" />
                <div className="card-info">
                  <h3>Promote Admin</h3>
                  <p>Add new staff/student admin</p>
                </div>
              </div>
            )}
            {(() => {
              const depts = selectedCategory === 'Faculty Admins'
                ? Array.from(new Set(Object.values(users).filter(u => u.role === 'faculty' && u.department).map(u => u.department)))
                : Object.keys(hierarchy[drillPath.batch] || {}).filter(k => k !== 'initialized');

              return depts.sort().map(dept => (
                <div key={dept} className="explorer-card variant-dept" onClick={() => {
                  setDrillPath(prev => ({ ...prev, dept }));
                  setViewLevel('list'); // DIRECTLY TO LIST
                }}>
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

                    {!hardcodedRole && (
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
                            {u.role !== 'faculty' && iAmFacultyOrSuper && (
                              <button className="menu-item" onClick={() => { updateRole(uid, 'faculty'); setActiveMenuId(null); }}>Make Faculty</button>
                            )}
                            {u.role !== 'rep' && iAmSuper && (
                              <button className="menu-item" onClick={() => { updateRole(uid, 'rep'); setActiveMenuId(null); }}>Make Student Admin</button>
                            )}
                            {u.role !== 'super_admin' && iAmSuper && (
                              <button className="menu-item" onClick={() => { updateRole(uid, 'super_admin'); setActiveMenuId(null); }}>Make Super Admin</button>
                            )}
                            {(iAmSuper || (u.role === 'rep')) && (
                              <button className="menu-item text-red" onClick={() => { updateRole(uid, 'student'); setActiveMenuId(null); }}>Remove Admin</button>
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
              .filter(([_, u]) =>
                searchTerm.length > 2 &&
                !['admin', 'faculty', 'rep', 'super_admin'].includes(u.role) &&
                !isSpecialAdmin(u.email) &&
                (u.displayName?.toLowerCase().includes(searchTerm) || u.email?.toLowerCase().includes(searchTerm))
              )
              .slice(0, 12)
              .map(([uid, u]) => (
                <div key={uid} className="user-management-card">
                  <div className="card-top">
                    <img src={u.photoURL || "/default-avatar.png"} className="user-card-avatar" alt="" />
                  </div>
                  <div className="card-info">
                    <h4 className="u-name">{u.displayName}</h4>
                    <p className="u-email">{u.email} • {u.batch}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      {iAmFacultyOrSuper && (
                        <button onClick={() => updateRole(uid, 'faculty')} style={{ background: '#FF9500', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Grant Faculty</button>
                      )}
                      <button onClick={() => updateRole(uid, 'rep')} style={{ background: '#007AFF', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Grant Class Rep</button>
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
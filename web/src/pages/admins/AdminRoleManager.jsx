import React, { useState, useEffect } from 'react';
import { db, auth } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import { adminEmails, getHardcodedRole } from "../../data/admins";
import { RiLockLine, RiMore2Fill } from 'react-icons/ri';
import "../../styles/admin-role-manager.css";

const AdminRoleManager = ({ userProfile }) => {
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDirectoryLoaded, setIsDirectoryLoaded] = useState(false);
  const [currentView, setCurrentView] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // --- DERIVE CURRENT USER ROLE ---
  const currentUser = auth.currentUser;
  const emailRole = currentUser?.email ? getHardcodedRole(currentUser.email) : null;
  const dbRole = userProfile?.role;
  const myRole = emailRole || dbRole || 'student';

  const iAmSuper = myRole === 'super_admin';
  const iAmFaculty = myRole === 'faculty';
  const iAmFacultyOrSuper = iAmFaculty || iAmSuper;

  // 1. Listen for View Changes
  useEffect(() => {
    const syncView = () => {
      const saved = sessionStorage.getItem("admin_preview_session");
      if (saved) {
        setCurrentView(JSON.parse(saved));
      } else {
        setCurrentView(userProfile);
      }
    };

    syncView();
    window.addEventListener('adminViewChanged', syncView);
    return () => window.removeEventListener('adminViewChanged', syncView);
  }, [userProfile]);

  // 2. Fetch User Database
  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsub = onValue(usersRef, (snapshot) => {
      setUsers(snapshot.exists() ? snapshot.val() : {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isSpecialAdmin = (email) => adminEmails.includes(email);

  const isPreviewModeActive = currentView && userProfile && (
    currentView.batch !== userProfile.batch ||
    currentView.department !== userProfile.department ||
    currentView.section !== userProfile.section
  );

  const updateRole = async (uid, newRole) => {
    let action = "Update Role";
    if (newRole === 'student') action = "Remove Admin Access";
    else if (newRole === 'faculty') action = "Grant Faculty Admin Access";
    else if (newRole === 'rep') action = "Grant Student Admin Access";
    else if (newRole === 'admin') action = "Grant Full Admin Access";

    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      await update(ref(db, `users/${uid}`), { role: newRole });
    } catch (err) {
      alert("Error: " + err.message);
    }
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

  if (loading) return <div className="admin-loader">Syncing Permissions...</div>;

  return (
    <div className="admin-container">
      <div className="header-section">
        {isPreviewModeActive && (
          <div className="status-banner">
            Viewing as: {currentView.batch} | {currentView.department} | {currentView.section}
          </div>
        )}
      </div>

      {/* --- SECTION 1: ADD NEW ADMIN --- */}
      <div className="promotion-section">
        <h2 className="section-heading">Add New Admin</h2>

        {!isDirectoryLoaded ? (
          <div className="action-box">
            <button className="btn-load-database" onClick={() => setIsDirectoryLoaded(true)}>
              Fetch User Database
            </button>
            <p className="helper-text">Load the full directory to promote students.</p>
          </div>
        ) : (
          <div className="search-container">
            <input
              className="admin-search-input"
              type="text"
              placeholder="Search by Name or Email..."
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            />
          </div>
        )}

        {isDirectoryLoaded && searchTerm && (
          <div className="results-list">
            {Object.entries(users)
              .filter(([_, u]) =>
                u.role !== 'admin' &&
                !isSpecialAdmin(u.email) &&
                (u.displayName?.toLowerCase().includes(searchTerm) || u.email?.toLowerCase().includes(searchTerm))
              )
              .map(([uid, u]) => {
                const isFromCurrentPreview = u.batch === currentView?.batch && u.section === currentView?.section;

                return (
                  <div key={uid} className="user-row">
                    <div className="user-details">
                      <img src={u.photoURL || ""} alt="" className="user-avatar-mini" />
                      <div className="user-info-text">
                        <strong className="user-name-bold">{u.displayName}</strong>
                        {isFromCurrentPreview && <span className="view-tag">In View</span>}
                        <div className="user-meta-sub">{u.email} • {u.batch}</div>
                      </div>
                    </div>
                    <div className="action-buttons-row">
                      {iAmFacultyOrSuper && (
                        <button className="btn-grant-admin faculty-bg" onClick={() => updateRole(uid, 'faculty')}>
                          Grant Faculty
                        </button>
                      )}
                      <button className="btn-grant-admin primary-bg" onClick={() => updateRole(uid, 'rep')}>
                        Grant Class Rep
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="section-divider" />

      {/* --- SECTION 2: ACTIVE ADMINS LIST --- */}
      <div className="admin-list-section">
        <h2 className="section-heading">Active Administrators</h2>
        <div className="admin-grid">
          {Object.entries(users)
            .filter(([_, u]) => u.role === 'admin' || u.role === 'faculty' || u.role === 'rep' || u.role === 'super_admin' || getHardcodedRole(u.email))
            .sort((a, b) => (a[1].displayName || "").localeCompare(b[1].displayName || ""))
            .map(([uid, u]) => {
              const hardcodedRole = getHardcodedRole(u.email);
              const displayRole = hardcodedRole
                ? (hardcodedRole === 'super_admin' ? 'Super Admin' : (hardcodedRole === 'faculty' ? 'Faculty Admin' : 'Student Admin'))
                : (u.role === 'rep' ? 'Student Admin' : 'Faculty Admin');

              return (
                <div key={uid} className="admin-card" style={{ zIndex: activeMenuId === uid ? 1001 : 1 }}>
                  <div className="admin-info-wrap">
                    <img src={u.photoURL || ""} alt="" className="admin-avatar-main" />
                    <div className="admin-text-content">
                      <h4 className="admin-name-row">
                        {u.displayName}
                        {hardcodedRole && (
                          <RiLockLine className="admin-system-lock-icon" title="Hardcoded System Admin" />
                        )}
                      </h4>
                      <p className="admin-email-text">{u.email}</p>
                      <span className={`role-badge ${u.role === 'rep' ? 'rep' : 'faculty'}`}>{displayRole}</span>
                    </div>
                  </div>

                  <div className="admin-menu-container" style={{ zIndex: activeMenuId === uid ? 1002 : 1 }}>
                    {!hardcodedRole && (
                      <>
                        <button
                          className="btn-icon-only"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === uid ? null : uid);
                          }}
                        >
                          <RiMore2Fill />
                        </button>

                        {activeMenuId === uid && (
                          <div className="admin-dropdown-menu">
                            {u.role !== 'faculty' && iAmFacultyOrSuper && (
                              <button
                                className="menu-item"
                                onClick={() => { updateRole(uid, 'faculty'); setActiveMenuId(null); }}
                              >
                                Make Faculty
                              </button>
                            )}

                            {u.role !== 'rep' && iAmSuper && (
                              <button
                                className="menu-item"
                                onClick={() => { updateRole(uid, 'rep'); setActiveMenuId(null); }}
                              >
                                Make Student Admin
                              </button>
                            )}

                            {u.role !== 'super_admin' && iAmSuper && (
                              <button
                                className="menu-item"
                                onClick={() => { updateRole(uid, 'super_admin'); setActiveMenuId(null); }}
                              >
                                Make Super Admin
                              </button>
                            )}

                            {(iAmSuper || (u.role === 'rep')) && (
                              <button
                                className="menu-item text-red"
                                onClick={() => { updateRole(uid, 'student'); setActiveMenuId(null); }}
                              >
                                Remove Admin
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  );
};

export default AdminRoleManager;
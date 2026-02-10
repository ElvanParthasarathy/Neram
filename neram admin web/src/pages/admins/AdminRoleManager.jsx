import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import { adminEmails, getHardcodedRole } from "../../data/admins";
// Import the lock icon
import { RiLockLine, RiMore2Fill } from 'react-icons/ri';

const AdminRoleManager = ({ userProfile }) => {
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDirectoryLoaded, setIsDirectoryLoaded] = useState(false);
  const [currentView, setCurrentView] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null); // Add state for active menu

  // 1. Listen for View Changes (Preview Mode Logic)
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
      alert(`Success: User role updated.`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Closes menu when clicking outside
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
        {/* <h1 className="admin-main-title">Admin Management</h1> */}
        {/* <p className="admin-subtitle">Manage System Admins and promote new users from the database.</p> */}

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
                    <div className="action-buttons-row" style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-grant-admin" onClick={() => updateRole(uid, 'faculty')} style={{ background: '#34c759' }}>
                        Grant Faculty
                      </button>
                      <button className="btn-grant-admin" onClick={() => updateRole(uid, 'rep')} style={{ background: '#007aff' }}>
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
                <div key={uid} className="admin-card">
                  <div className="admin-info-wrap">
                    <img src={u.photoURL || ""} alt="" className="admin-avatar-main" />
                    <div className="admin-text-content">
                      <h4 className="admin-name-row">
                        {u.displayName}
                        {/* SYSTEM LOCK ICON - Replaces text badge */}
                        {hardcodedRole && (
                          <RiLockLine className="admin-system-lock-icon" title="Hardcoded System Admin" />
                        )}
                      </h4>
                      <p className="admin-email-text">{u.email} • <span style={{ color: u.role === 'rep' ? '#007aff' : '#34c759', fontWeight: 600 }}>{displayRole}</span></p>
                    </div>
                  </div>

                  <div className="admin-actions-area admin-menu-container" style={{ position: 'relative' }}>
                    {!hardcodedRole && (
                      <>
                        <button
                          className="btn-icon-only"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === uid ? null : uid);
                          }}
                          style={{ padding: '8px', borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        >
                          <RiMore2Fill style={{ fontSize: '1.2rem', color: '#666' }} />
                        </button>

                        {activeMenuId === uid && (
                          <div className="admin-dropdown-menu" style={{
                            position: 'absolute',
                            top: '100%',
                            right: '0',
                            background: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            borderRadius: '8px',
                            zIndex: 10,
                            minWidth: '160px',
                            overflow: 'hidden',
                            border: '1px solid #eee'
                          }}>
                            {u.role !== 'faculty' && (
                              <button
                                className="menu-item"
                                onClick={() => { updateRole(uid, 'faculty'); setActiveMenuId(null); }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  color: '#333',
                                  borderBottom: '1px solid #f5f5f5'
                                }}
                              >
                                Make Faculty
                              </button>
                            )}
                            {u.role !== 'rep' && (
                              <button
                                className="menu-item"
                                onClick={() => { updateRole(uid, 'rep'); setActiveMenuId(null); }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  color: '#333',
                                  borderBottom: '1px solid #f5f5f5'
                                }}
                              >
                                Make Student Admin
                              </button>
                            )}
                            <button
                              className="menu-item text-red"
                              onClick={() => { updateRole(uid, 'student'); setActiveMenuId(null); }}
                              style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '10px 16px',
                                border: 'none',
                                background: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                color: '#ff3b30'
                              }}
                            >
                              Remove Admin
                            </button>
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
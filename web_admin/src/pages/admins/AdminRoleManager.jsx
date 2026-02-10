import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import { adminEmails } from "../../data/admins"; 
// Import the lock icon
import { RiLockLine } from 'react-icons/ri';

const AdminRoleManager = ({ userProfile }) => {
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDirectoryLoaded, setIsDirectoryLoaded] = useState(false);
  const [currentView, setCurrentView] = useState(null);

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
    const action = newRole === 'admin' ? "Grant Admin Access" : "Remove Admin Access";
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    try {
      await update(ref(db, `users/${uid}`), { role: newRole });
      alert(`Success: User role updated.`);
    } catch (err) { 
      alert("Error: " + err.message); 
    }
  };

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
                    <button className="btn-grant-admin" onClick={() => updateRole(uid, 'admin')}>
                      Grant Admin
                    </button>
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
            .filter(([_, u]) => u.role === 'admin' || isSpecialAdmin(u.email))
            .sort((a, b) => (a[1].displayName || "").localeCompare(b[1].displayName || ""))
            .map(([uid, u]) => (
              <div key={uid} className="admin-card">
                <div className="admin-info-wrap">
                  <img src={u.photoURL || ""} alt="" className="admin-avatar-main" />
                  <div className="admin-text-content">
                    <h4 className="admin-name-row">
                      {u.displayName} 
                      {/* SYSTEM LOCK ICON - Replaces text badge */}
                      {isSpecialAdmin(u.email) && (
                        <RiLockLine className="admin-system-lock-icon" title="Core System Administrator" />
                      )}
                    </h4>
                    <p className="admin-email-text">{u.email}</p>
                  </div>
                </div>
                
                <div className="admin-actions-area">
                  {!isSpecialAdmin(u.email) && (
                    <button className="btn-remove-admin" onClick={() => updateRole(uid, 'student')}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminRoleManager;
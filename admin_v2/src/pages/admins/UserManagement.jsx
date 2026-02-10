import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { db } from "../../firebase";
import { ref, onValue, update, remove } from "firebase/database";
import {
  RiUserSettingsLine, RiArrowLeftLine, RiUserLine, RiPhoneLine,
  RiSave3Line, RiCloseLine, RiMailLine, RiGoogleFill,
  RiDeleteBin6Line, RiHashtag, RiCake2Line, RiUserSharedLine,
  RiRefreshLine, RiArrowRightSLine, RiTeamLine, RiLayoutGridLine
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';

const UserManagement = () => {
  const navigate = useNavigate();

  // Data States
  const [users, setUsers] = useState({});
  const [hierarchy, setHierarchy] = useState({});
  const [loading, setLoading] = useState(true);

  // Hierarchy Navigation States
  const [viewLevel, setViewLevel] = useState('batches');
  const [currentPath, setCurrentPath] = useState({ batch: '', dept: '', sec: '' });

  // UI States
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Ref to store scroll position
  const scrollPos = useRef(0);

  // 1. Fetch Data
  useEffect(() => {
    const hierarchyRef = ref(db, 'academic_hierarchy');
    const usersRef = ref(db, 'users');

    const unsubHierarchy = onValue(hierarchyRef, (snapshot) => {
      setHierarchy(snapshot.exists() ? snapshot.val() : {});
    });

    const unsubUsers = onValue(usersRef, (snapshot) => {
      setUsers(snapshot.exists() ? snapshot.val() : {});
      setLoading(false);
    });

    return () => {
      unsubHierarchy();
      unsubUsers();
    };
  }, []);

  // 2. SCROLL LOCK LOGIC
  useEffect(() => {
    const mainViewport = document.getElementById('main-viewport');

    if (selectedUser) {
      if (mainViewport) {
        // Capture position and Lock
        scrollPos.current = mainViewport.scrollTop;
        mainViewport.style.overflow = 'hidden';
        mainViewport.scrollTop = scrollPos.current; // Force stay
      }
    } else {
      if (mainViewport) {
        // Unlock and Restore
        mainViewport.style.overflow = '';
        mainViewport.scrollTop = scrollPos.current;
      }
    }

    return () => {
      if (mainViewport) mainViewport.style.overflow = '';
    };
  }, [selectedUser]);

  // --- NAVIGATION LOGIC ---
  const handleDrillDown = (level, value) => {
    setCurrentPath(prev => ({ ...prev, [level]: value }));
    if (level === 'batch') setViewLevel('depts');
    if (level === 'dept') setViewLevel('secs');
    if (level === 'sec') setViewLevel('students');
  };

  const navigateBack = () => {
    if (viewLevel === 'students') setViewLevel('secs');
    else if (viewLevel === 'secs') setViewLevel('depts');
    else if (viewLevel === 'depts') setViewLevel('batches');
  };

  const resetToRoot = () => {
    setCurrentPath({ batch: '', dept: '', sec: '' });
    setViewLevel('batches');
  };

  // --- LOGIC: Handle User Selection (UPDATED SMART NAME) ---
  const openUserModal = (u, uid) => {
    let firstName = "";
    let lastName = "";

    // 1. Check for existing separate fields
    if (u.firstName || u.lastName) {
      firstName = u.firstName || "";
      lastName = u.lastName || "";
    } else {
      // 2. Fallback: Use "Last Space" logic
      const full = u.displayName || "";
      const lastSpaceIndex = full.lastIndexOf(" ");

      if (lastSpaceIndex === -1) {
        firstName = full;
        lastName = "";
      } else {
        firstName = full.substring(0, lastSpaceIndex);
        lastName = full.substring(lastSpaceIndex + 1);
      }
    }

    // Extract just the 10-digit phone number (strip any 91 prefix or spaces)
    let phoneNumber = "";
    if (u.mobile) {
      const clean = u.mobile.replace(/\s/g, '').replace(/\+/g, '');
      phoneNumber = clean.startsWith('91') && clean.length > 10 ? clean.substring(2) : clean;
    }

    setSelectedUser({
      ...u,
      uid,
      firstName,
      lastName,
      phoneNumber,
      dob: u.dob || "",
      gender: u.gender || ""
    });
  };

  const handleLocalChange = (field, value) => {
    setSelectedUser(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'batch') { updated.department = ""; updated.section = ""; }
      if (field === 'department') { updated.section = ""; }
      return updated;
    });
  };

  // --- SAVE LOGIC (UPDATED TO SAVE SEPARATE NAMES) ---
  const handleFinalSave = async () => {
    if (!selectedUser) return;
    try {
      const fullDisplayName = `${selectedUser.firstName} ${selectedUser.lastName}`.trim();

      // Extract fields to save, ensuring we don't duplicate local temp vars
      const { uid, firstName, lastName, phoneNumber, ...dataToSave } = selectedUser;

      const finalPayload = {
        ...dataToSave,
        displayName: fullDisplayName,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        mobile: selectedUser.phoneNumber // Save just the 10-digit number
      };

      await update(ref(db, `users/${uid}`), finalPayload);
      alert("Database updated successfully!");
      setSelectedUser(null);
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  const getProviderIcon = (u) => {
    if (u.photoURL?.includes('googleusercontent') || u.email?.endsWith('@rmd.ac.in')) {
      return <RiGoogleFill className="provider-icon google" title="Google Account" />;
    }
    return <RiMailLine className="provider-icon email" title="Email Account" />;
  };

  if (loading) return <div className="admin-loader">Syncing User Database...</div>;

  // --- MODAL JSX CONTENT ---
  const modalContent = selectedUser ? (
    <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <div className="user-control-modal full-control animate-pop-in">
        <div className="modal-header">
          <div className="modal-title">
            <RiUserSettingsLine />
            <h3>Edit Profile: {selectedUser.firstName}</h3>
          </div>
          <RiCloseLine className="modal-close-btn" onClick={() => setSelectedUser(null)} />
        </div>

        <div className="modal-scroll-body">
          <div className="modal-section photo-sync-area">
            <img src={selectedUser.photoURL || "/default-avatar.png"} className="modal-avatar-preview" alt="" />
            <div className="sync-controls">
              <label>Profile Picture</label>
              <button className="admin-btn-outline" onClick={() => alert("Re-sync success")}>
                <RiRefreshLine /> Refresh Google Sync
              </button>
            </div>
          </div>

          <div className="control-divider">Personal Information</div>
          <div className="input-row">
            <div className="field">
              <label><RiUserLine /> First Name (e.g. John David)</label>
              <input type="text" value={selectedUser.firstName} onChange={e => handleLocalChange('firstName', e.target.value)} className="modal-input" />
            </div>
            <div className="field">
              <label>Last Name</label>
              <input type="text" value={selectedUser.lastName} onChange={e => handleLocalChange('lastName', e.target.value)} className="modal-input" />
            </div>
          </div>

          <div className="input-row">
            <div className="field">
              <label><RiPhoneLine /> Mobile Number</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 12px' }}>
                <span style={{ fontWeight: '600', color: 'var(--text-secondary)', marginRight: '8px' }}>+91</span>
                <input
                  type="tel"
                  value={selectedUser.phoneNumber}
                  onChange={e => {
                    // STRICT: Allow ONLY digits, max 10
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    handleLocalChange('phoneNumber', digits);
                  }}
                  className="modal-input"
                  style={{ border: 'none', background: 'transparent', paddingLeft: 0, flex: 1 }}
                  placeholder="10-digit number"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          <div className="input-row">
            <div className="field">
              <label><RiCake2Line /> Date of Birth</label>
              <input type="date" value={selectedUser.dob} onChange={e => handleLocalChange('dob', e.target.value)} className="modal-input" />
            </div>
            <div className="field">
              <label><RiUserSharedLine /> Gender</label>
              <select value={selectedUser.gender} onChange={e => handleLocalChange('gender', e.target.value)} className="modal-select">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="control-divider">Academic Assignment</div>
          <div className="field">
            <label><RiHashtag /> Register Number</label>
            <input type="text" value={selectedUser.registerNo || ""} onChange={e => handleLocalChange('registerNo', e.target.value)} className="modal-input" />
          </div>

          <div className="select-triple-grid">
            <div className="field">
              <label>Batch</label>
              <select value={selectedUser.batch || ""} onChange={e => handleLocalChange('batch', e.target.value)} className="modal-select">
                <option value="">Select Batch</option>
                {Object.keys(hierarchy).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Dept</label>
              <select disabled={!selectedUser.batch} value={selectedUser.department || ""} onChange={e => handleLocalChange('department', e.target.value)} className="modal-select">
                <option value="">Select Dept</option>
                {selectedUser.batch && hierarchy[selectedUser.batch] &&
                  Object.keys(hierarchy[selectedUser.batch]).filter(d => d !== 'initialized').map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Sec</label>
              <select disabled={!selectedUser.department} value={selectedUser.section || ""} onChange={e => handleLocalChange('section', e.target.value)} className="modal-select">
                <option value="">Sec</option>
                {selectedUser.batch && selectedUser.department && hierarchy[selectedUser.batch][selectedUser.department]?.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-danger-outline" onClick={() => {
            if (window.confirm("Delete record?")) {
              remove(ref(db, `users/${selectedUser.uid}`));
              setSelectedUser(null);
            }
          }}>
            <RiDeleteBin6Line /> Delete Record
          </button>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={() => setSelectedUser(null)}>Cancel</button>
            <button className="btn-save-master" onClick={handleFinalSave}>
              <RiSave3Line /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="admin-subpage">
      <header className="explorer-header">
        <div className="breadcrumb-nav">
          <span className="crumb-btn" onClick={resetToRoot}>Directory</span>
          {currentPath.batch && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => setViewLevel('depts')}>{currentPath.batch}</span></>}
          {currentPath.dept && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => setViewLevel('secs')}>{currentPath.dept}</span></>}
          {currentPath.sec && <><RiArrowRightSLine /> <span className="crumb-static">Sec {currentPath.sec}</span></>}
        </div>
        {viewLevel !== 'batches' && (
          <button className="explorer-back-btn" onClick={navigateBack}>
            <RiArrowLeftLine /> Back
          </button>
        )}
      </header>

      {viewLevel === 'students' && (
        <div className="admin-card search-card">
          <input
            type="text"
            placeholder="Search students in this section..."
            className="admin-input search-input"
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>
      )}

      <div className="explorer-view animate-fade-in">
        {viewLevel === 'batches' && (
          <div className="explorer-grid">
            {Object.keys(hierarchy).sort().reverse().map(batch => (
              <div key={batch} className="explorer-card" onClick={() => handleDrillDown('batch', batch)}>
                <RiTeamLine className="card-icon" />
                <div className="card-info">
                  <h3>Batch {batch}</h3>
                  <p>Explore Departments</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewLevel === 'depts' && (
          <div className="explorer-grid">
            {Object.keys(hierarchy[currentPath.batch] || {})
              .filter(k => k !== 'initialized')
              .map(dept => (
                <div key={dept} className="explorer-card variant-dept" onClick={() => handleDrillDown('dept', dept)}>
                  <RiLayoutGridLine className="card-icon" />
                  <div className="card-info">
                    <h3>{dept}</h3>
                    <p>Select Section</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {viewLevel === 'secs' && (
          <div className="explorer-grid">
            {hierarchy[currentPath.batch][currentPath.dept]?.map(sec => (
              <div key={sec} className="explorer-card variant-sec" onClick={() => handleDrillDown('sec', sec)}>
                <div className="card-initial">{sec}</div>
                <div className="card-info">
                  <h3>Section {sec}</h3>
                  <p>View Alphabetical List</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewLevel === 'students' && (
          <div className="user-directory-grid">
            {Object.entries(users)
              .filter(([_, u]) => u.batch === currentPath.batch && u.department === currentPath.dept && u.section === currentPath.sec)
              .filter(([_, u]) => u.displayName?.toLowerCase().includes(searchTerm) || u.registerNo?.includes(searchTerm))
              .sort((a, b) => (a[1].displayName || "").localeCompare(b[1].displayName || ""))
              .map(([uid, u]) => (
                <div key={uid} className="user-management-card" onClick={() => openUserModal(u, uid)}>
                  <div className="card-top">
                    <img src={u.photoURL || "/default-avatar.png"} className="user-card-avatar" alt="" />
                    {getProviderIcon(u)}
                  </div>
                  <div className="card-info">
                    <h4 className="u-name">{u.displayName || 'Unnamed User'}</h4>
                    <p className="u-email">{u.email}</p>
                    <div className="u-badges">
                      <span className="u-tag">{u.registerNo || 'No Reg No'}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* RENDER THE MODAL OUTSIDE THE SCROLL FLOW USING PORTAL */}
      {selectedUser && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
};

export default UserManagement;
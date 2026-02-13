import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { db } from "../../firebase";
import { ref, onValue, update, remove } from "firebase/database";
import {
  RiUserSettingsLine, RiArrowLeftLine, RiUserLine, RiPhoneLine,
  RiSave3Line, RiCloseLine, RiMailLine, RiGoogleFill,
  RiDeleteBin6Line, RiHashtag, RiCake2Line, RiUserSharedLine,
  RiRefreshLine, RiArrowRightSLine, RiTeamLine, RiLayoutGridLine,
  RiCalendarEventLine
} from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import "../../styles/user-management.css";

const UserManagement = () => {
  const navigate = useNavigate();

  // Data States
  const [users, setUsers] = useState({});
  const [hierarchy, setHierarchy] = useState({});
  const [loading, setLoading] = useState(true);

  // Hierarchy Navigation States
  const [viewLevel, setViewLevel] = useState('batches');
  const [currentPath, setCurrentPath] = useState({ batch: '', dept: '', sec: '' });
  const [roleGroup, setRoleGroup] = useState('student'); // 'student' | 'faculty' | 'admin'

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
    if (level === 'dept') {
      if (roleGroup === 'faculty') setViewLevel('faculty_members');
      else setViewLevel('secs');
    }
    if (level === 'sec') setViewLevel('students');
  };

  const navigateBack = () => {
    if (viewLevel === 'students') setViewLevel('secs');
    else if (viewLevel === 'secs') setViewLevel('depts');
    else if (viewLevel === 'depts') setViewLevel('batches');
    else if (viewLevel === 'faculty_members') setViewLevel('faculty_depts');
  };

  const resetToRoot = () => {
    setCurrentPath({ batch: '', dept: '', sec: '' });
    setViewLevel('batches');
    setRoleGroup('student');
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

  // --- DATE HELPERS: Bridge between DB (yyyy-mm-dd) and DatePicker (Date Object) ---
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // --- HYBRID DOB LOGIC: AUTO-SLASH & NATIVE PICKER ---
  const getDisplayDOB = (dobStr) => {
    if (!dobStr) return "";
    const [y, m, d] = dobStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleDOBInput = (val) => {
    // 1. Clean and Filter
    let clean = val.replace(/\D/g, '').slice(0, 8);

    // 2. Auto-Slash Logic
    let display = clean;
    if (clean.length > 2) display = clean.slice(0, 2) + '/' + clean.slice(2);
    if (clean.length > 4) display = display.slice(0, 5) + '/' + display.slice(5);

    // 3. Sync to State (Back-Map to YYYY-MM-DD if complete)
    if (clean.length === 8) {
      const d = clean.slice(0, 2);
      const m = clean.slice(2, 4);
      const y = clean.slice(4, 8);
      handleLocalChange('dob', `${y}-${m}-${d}`);
    } else {
      // Just update local display temp if needed, or keep partial
      handleLocalChange('dob', display); // Temporary storage in dob for display
    }
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
              <label><RiUserLine /> First Name</label>
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
              <div className="phone-entry-group">
                <span className="phone-prefix-label">+91</span>
                <input
                  type="tel"
                  value={selectedUser.phoneNumber}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    handleLocalChange('phoneNumber', digits);
                  }}
                  className="phone-input-clean"
                  placeholder="10-digit number"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          <div className="input-row">
            <div className="field">
              <label><RiCake2Line /> Date of Birth</label>
              <div className="hybrid-date-field">
                <input
                  type="text"
                  value={selectedUser.dob?.includes('-') ? getDisplayDOB(selectedUser.dob) : selectedUser.dob}
                  onChange={e => handleDOBInput(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="modal-input date-text-input"
                  maxLength={10}
                />
                <div className="native-picker-trigger">
                  <RiCalendarEventLine className="calendar-icon" />
                  <input
                    type="date"
                    value={selectedUser.dob?.includes('-') ? selectedUser.dob : ""}
                    onChange={e => handleLocalChange('dob', e.target.value)}
                    className="hidden-native-picker"
                  />
                </div>
              </div>
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


          {/* --- ROLE-SPECIFIC ACADEMIC FIELDS --- */}
          {(selectedUser.role === 'student' || !selectedUser.role) && (
            <>
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
            </>
          )}

          {selectedUser.role === 'faculty' && (
            <>
              <div className="control-divider">Faculty Assignment</div>
              <div className="field">
                <label>Department</label>
                <select
                  value={selectedUser.department || ""}
                  onChange={e => handleLocalChange('department', e.target.value)}
                  className="modal-select"
                >
                  <option value="">Select Dept</option>
                  {/* For faculty, we can just list all unique depts found in hierarchy */}
                  {Array.from(new Set(Object.values(hierarchy).flatMap(b => Object.keys(b)).filter(d => d !== 'initialized'))).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Super Admins see no academic assignment fields */}
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
              <RiSave3Line /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="admin-subpage">
      <div className="role-switcher-container">
        <div className="role-pill-switcher">
          <button
            className={`role-pill ${roleGroup === 'student' ? 'active' : ''}`}
            onClick={() => {
              setRoleGroup('student');
              setViewLevel('batches');
              setCurrentPath({ batch: '', dept: '', sec: '' });
            }}
          >
            Students
          </button>
          <button
            className={`role-pill ${roleGroup === 'faculty' ? 'active' : ''}`}
            onClick={() => {
              setRoleGroup('faculty');
              setViewLevel('faculty_depts');
              setCurrentPath({ batch: '', dept: '', sec: '' });
            }}
          >
            Faculty
          </button>
          <button
            className={`role-pill ${roleGroup === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setRoleGroup('admin');
              setViewLevel('admin_list');
            }}
          >
            Admins
          </button>
        </div>
      </div>

      <header className="explorer-header" style={{ marginTop: '10px' }}>
        <div className="breadcrumb-nav">
          <span className="crumb-btn" onClick={resetToRoot}>Directory</span>
          {roleGroup !== 'student' && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => {
            if (roleGroup === 'faculty') setViewLevel('faculty_depts');
            else setViewLevel('admin_list');
          }}>{roleGroup.charAt(0).toUpperCase() + roleGroup.slice(1)}s</span></>}
          {roleGroup === 'student' && currentPath.batch && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => setViewLevel('depts')}>{currentPath.batch}</span></>}
          {(roleGroup === 'student' || roleGroup === 'faculty') && currentPath.dept && <><RiArrowRightSLine /> <span className="crumb-static">{currentPath.dept}</span></>}
          {roleGroup === 'student' && currentPath.sec && <><RiArrowRightSLine /> <span className="crumb-static">Sec {currentPath.sec}</span></>}
        </div>
        {viewLevel !== 'batches' && viewLevel !== 'faculty_depts' && viewLevel !== 'admin_list' && (
          <button className="explorer-back-btn" onClick={navigateBack}>
            <RiArrowLeftLine /> Back
          </button>
        )}
      </header>

      {(viewLevel === 'students' || viewLevel === 'faculty_members' || viewLevel === 'admin_list') && (
        <div className="admin-card search-card">
          <input
            type="text"
            placeholder={`Search ${roleGroup}s...`}
            className="admin-input search-input"
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          />
        </div>
      )}

      <div className="explorer-view animate-fade-in">
        {roleGroup === 'student' && viewLevel === 'batches' && (
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

        {roleGroup === 'student' && viewLevel === 'depts' && (
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

        {roleGroup === 'student' && viewLevel === 'secs' && (
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

        {roleGroup === 'faculty' && viewLevel === 'faculty_depts' && (
          <div className="explorer-grid">
            {Array.from(new Set(Object.values(users)
              .filter(u => u.role === 'faculty' && u.department)
              .map(u => u.department)))
              .sort()
              .map(dept => (
                <div key={dept} className="explorer-card variant-dept" onClick={() => handleDrillDown('dept', dept)}>
                  <RiLayoutGridLine className="card-icon" />
                  <div className="card-info">
                    <h3>{dept}</h3>
                    <p>View Faculty Members</p>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* --- DYNAMIC USER LIST (STUDENTS, FACULTY, ADMINS) --- */}
        {(viewLevel === 'students' || viewLevel === 'faculty_members' || viewLevel === 'admin_list') && (
          <div className="user-directory-grid">
            {Object.entries(users)
              .filter(([_, u]) => {
                if (roleGroup === 'student') {
                  return u.batch === currentPath.batch && u.department === currentPath.dept && u.section === currentPath.sec;
                }
                if (roleGroup === 'faculty') {
                  return u.role === 'faculty' && u.department === currentPath.dept;
                }
                if (roleGroup === 'admin') {
                  return u.role === 'super_admin' || u.role === 'admin';
                }
                return false;
              })
              .filter(([_, u]) =>
                u.displayName?.toLowerCase().includes(searchTerm) ||
                u.email?.toLowerCase().includes(searchTerm) ||
                u.registerNo?.includes(searchTerm)
              )
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
                      {roleGroup === 'student' ? (
                        <span className="u-tag">{u.registerNo || 'No Reg No'}</span>
                      ) : (
                        <span className={`u-tag role-tag ${u.role}`}>
                          {u.role === 'super_admin' ? 'Super Admin' :
                            u.role === 'faculty' ? 'Faculty' : 'Admin'}
                        </span>
                      )}
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
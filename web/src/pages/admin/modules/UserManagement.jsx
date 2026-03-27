import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { db } from "../../../firebase";
import { ref, onValue, update, push, set, remove } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatDateDDMMYYYY, handleAutoSlash, parseDMYToISO } from "../../../utils/timeUtils";
import HybridDateInput from '../../../components/ui/HybridDateInput';
import {
  RiUserSettingsLine, RiArrowLeftLine, RiUserLine, RiPhoneLine,
  RiSave3Line, RiCloseLine, RiMailLine, RiGoogleFill,
  RiDeleteBin6Line, RiHashtag, RiCake2Line, RiUserSharedLine,
  RiRefreshLine, RiArrowRightSLine, RiTeamLine, RiLayoutGridLine,
  RiCalendarEventLine, RiCalendarLine
} from 'react-icons/ri';
import { useNavigate, useSearchParams } from 'react-router-dom';
import "../../../styles/admin/user-management.css";
import { AdminPageSkeleton } from '../../../components/ui/AdminSkeletons';


const UserManagement = () => {
  const navigate = useNavigate();

  // Data States
  const [users, setUsers] = useState({});
  const [hierarchy, setHierarchy] = useState({});
  const [loading, setLoading] = useState(true);

  // Edit List & Bulk Delete States
  const [isEditListMode, setIsEditListMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();

  // Hierarchy Navigation States (Now URL-driven)
  const viewLevel = searchParams.get('ulvl') || 'batches';
  const roleGroup = searchParams.get('urg') || 'student';
  const currentPath = {
    batch: searchParams.get('ub') || '',
    dept: searchParams.get('ud') || '',
    sec: searchParams.get('us') || ''
  };

  const updateParams = (updates = {}, forceReplace = false) => {
    const params = {
      mod: 'users',
      ulvl: viewLevel,
      urg: roleGroup,
      ub: currentPath.batch,
      ud: currentPath.dept,
      us: currentPath.sec,
      ...updates
    };
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    setSearchParams(params, { replace: forceReplace });
  };

  // UI States
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);

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

  // Detect mobile for hybrid date picker
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- NAVIGATION LOGIC ---
  const handleDrillDown = (level, value) => {
    const nextPath = { ...currentPath, [level]: value };
    let nextLevel = viewLevel;
    
    if (level === 'batch') nextLevel = 'depts';
    if (level === 'dept') {
      if (roleGroup === 'faculty') nextLevel = 'faculty_members';
      else nextLevel = 'secs';
    }
    if (level === 'sec') nextLevel = 'students';
    
    updateParams({ ulvl: nextLevel, ub: nextPath.batch, ud: nextPath.dept, us: nextPath.sec });
  };

  const navigateBack = () => {
    if (viewLevel === 'students') {
      updateParams({ ulvl: 'secs', us: '' });
    } else if (viewLevel === 'secs') {
      updateParams({ ulvl: 'depts', ud: '', us: '' });
    } else if (viewLevel === 'depts') {
      updateParams({ ulvl: 'batches', ub: '', ud: '', us: '' });
    } else if (viewLevel === 'faculty_members') {
      updateParams({ ulvl: 'faculty_depts', ud: '' });
    } else {
      setSearchParams({ mod: 'home' }, { replace: true });
    }
  };

  const resetToRoot = () => {
    updateParams({ ulvl: 'batches', urg: 'student', ub: '', ud: '', us: '' }, true);
  };

  const setViewLevel = (lvl) => updateParams({ ulvl: lvl }, true);

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

  // --- BULK DELETE HANDLERS ---
  const handleToggleUserSelect = (uid) => {
    setSelectedUsers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const handleSelectAllUsers = () => {
    const currentList = Object.entries(users).filter(([_, u]) => {
      if (roleGroup === 'student') return u.batch === currentPath.batch && u.department === currentPath.dept && u.section === currentPath.sec;
      if (roleGroup === 'faculty') return u.role === 'faculty' && u.department === currentPath.dept;
      if (roleGroup === 'admin') return u.role === 'super_admin' || u.role === 'admin';
      return false;
    }).filter(([_, u]) =>
      u.displayName?.toLowerCase().includes(searchTerm) ||
      u.email?.toLowerCase().includes(searchTerm) ||
      u.registerNo?.includes(searchTerm)
    );

    if (selectedUsers.length === currentList.length && currentList.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(currentList.map(([uid]) => uid));
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (!selectedUsers.length) return;
    if (window.confirm(`Delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
      try {
        const updates = {};
        selectedUsers.forEach(uid => {
          updates[`users/${uid}`] = null;
        });
        await update(ref(db), updates);
        setSelectedUsers([]);
        setIsDeleteMode(false);
      } catch (err) {
        alert("Error during bulk delete: " + err.message);
      }
    }
  };

  const currentDisplayListSize = Object.entries(users).filter(([_, u]) => {
    if (roleGroup === 'student') return u.batch === currentPath.batch && u.department === currentPath.dept && u.section === currentPath.sec;
    if (roleGroup === 'faculty') return u.role === 'faculty' && u.department === currentPath.dept;
    if (roleGroup === 'admin') return u.role === 'super_admin' || u.role === 'admin';
    return false;
  }).filter(([_, u]) =>
    u.displayName?.toLowerCase().includes(searchTerm) ||
    u.email?.toLowerCase().includes(searchTerm) ||
    u.registerNo?.includes(searchTerm)
  ).length;

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

  if (loading) return (
    <div className="admin-subpage">
      <AdminPageSkeleton />
    </div>
  );


  // --- MODAL JSX CONTENT ---
  const modalContent = selectedUser ? (
    <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <div className="user-control-modal full-control animate-pop-in">
        <div className="modal-header">
          <div className="modal-title">
            <RiUserSettingsLine />
            <h3>Edit Profile</h3>
          </div>
          <RiCloseLine className="modal-close-btn" onClick={() => setSelectedUser(null)} />
        </div>

        <div className="modal-scroll-body">
          <div className="modal-section photo-sync-area">
            <img src={selectedUser.photoURL || "/default-avatar.png"} className="modal-avatar-preview" alt="" />
            <div className="sync-controls" style={{ flex: 1 }}>
              <label>Profile Picture</label>
              <button className="admin-btn-outline" style={{ width: '100%', justifyContent: 'center' }} onClick={() => alert("Re-sync success")}>
                <RiRefreshLine /> Sync
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
                        <HybridDateInput
                            value={selectedUser.dob}
                            onChange={(val) => setSelectedUser({ ...selectedUser, dob: val })}
                            inputClass="modal-input"
                            isMobileProp={isMobile}
                        />
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
          {selectedUser.role !== 'faculty' && (selectedUser.role === 'student' || selectedUser.role === 'rep' || !selectedUser.role || ((selectedUser.role === 'admin' || selectedUser.role === 'super_admin') && (selectedUser.batch || selectedUser.registerNo || selectedUser.section))) && (
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

        </div>

        <div className="modal-footer" style={{ padding: '24px 30px 32px' }}>
          <div className="footer-actions" style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button 
              onClick={() => setSelectedUser(null)}
              style={{
                background: 'var(--mac-button-bg, rgba(255, 255, 255, 0.1))',
                color: 'var(--mac-text, #fff)',
                border: 'none',
                height: '42px',
                borderRadius: '100px',
                flex: 1,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleFinalSave}
              style={{
                background: 'var(--mac-blue, #007AFF)',
                color: '#fff',
                border: 'none',
                height: '42px',
                borderRadius: '100px',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Save
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
              updateParams({ urg: 'student', ulvl: 'batches', ub: '', ud: '', us: '' }, true);
              setIsEditListMode(false);
              setIsDeleteMode(false);
              setSelectedUsers([]);
            }}
          >
            Students
          </button>
          <button
            className={`role-pill ${roleGroup === 'faculty' ? 'active' : ''}`}
            onClick={() => {
              updateParams({ urg: 'faculty', ulvl: 'faculty_depts', ub: '', ud: '', us: '' }, true);
              setIsEditListMode(false);
              setIsDeleteMode(false);
              setSelectedUsers([]);
            }}
          >
            Faculty
          </button>
          <button
            className={`role-pill ${roleGroup === 'admin' ? 'active' : ''}`}
            onClick={() => {
              updateParams({ urg: 'admin', ulvl: 'admin_list', ub: '', ud: '', us: '' }, true);
              setIsEditListMode(false);
              setIsDeleteMode(false);
              setSelectedUsers([]);
            }}
          >
            Admins
          </button>
        </div>
      </div>

      <header className="explorer-header" style={{ marginTop: '10px' }}>
        <div className="breadcrumb-nav">
          <div className="breadcrumb-list">
            <span className="crumb-btn level-root" onClick={resetToRoot}>Directory</span>
            {roleGroup !== 'student' && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-btn" onClick={() => {
              if (roleGroup === 'faculty') setViewLevel('faculty_depts');
              else setViewLevel('admin_list');
            }}>{roleGroup.charAt(0).toUpperCase() + roleGroup.slice(1)}s</span></>}
            {roleGroup === 'student' && currentPath.batch && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-btn" onClick={() => setViewLevel('depts')}>{currentPath.batch}</span></>}
            {(roleGroup === 'student' || roleGroup === 'faculty') && currentPath.dept && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-static">{currentPath.dept}</span></>}
            {roleGroup === 'student' && currentPath.sec && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-static">Sec {currentPath.sec}</span></>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {viewLevel !== 'batches' && viewLevel !== 'faculty_depts' && viewLevel !== 'admin_list' && (
            <button className="explorer-back-btn" onClick={navigateBack}>
              <RiArrowLeftLine /> Back
            </button>
          )}
        </div>
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
          <>
            <div className="edit-list-toggle-row" style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              marginBottom: '20px', 
              width: '100%', 
              padding: '0 8px', 
              boxSizing: 'border-box',
              minHeight: '40px',
              alignItems: 'center'
            }}>
              {isEditListMode ? (
                <button className="edit-toggle-btn" onClick={() => {
                  setIsEditListMode(false);
                  setIsDeleteMode(false);
                  setSelectedUsers([]);
                }}>
                  Cancel
                </button>
              ) : (
                <button className="edit-toggle-btn" onClick={() => setIsEditListMode(true)}>
                  Edit
                </button>
              )}
            </div>

            <div className={`user-directory-grid ${isEditListMode ? 'edit-mode' : ''}`}>
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
                  <div key={uid} className="user-management-card" onClick={() => isEditListMode && !isDeleteMode && openUserModal(u, uid)}>
                    {isEditListMode && isDeleteMode && (
                        <input
                            type="checkbox"
                            className="mac-checkbox"
                            checked={selectedUsers.includes(uid)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => handleToggleUserSelect(uid)}
                        />
                    )}
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

            {/* BULK ACTION FOOTER - only in Edit List mode */}
            {isEditListMode && (
                <div className={`bulk-action-footer-premium animate-slide-up ${isDeleteMode ? 'danger-mode' : ''}`}>
                    {isDeleteMode ? (
                        <div className="bulk-delete-action-row">
                            <div className="bulk-delete-info">
                                <div className="info-icon">
                                    <RiDeleteBin6Line />
                                </div>
                                <div className="bulk-delete-text">
                                    <span className="bulk-delete-title">
                                        {selectedUsers.length === 0 ? "Select Items" : `${selectedUsers.length} Selected`}
                                    </span>
                                    <span className="bulk-delete-desc">Choose users to delete</span>
                                </div>
                            </div>
                            <div className="pill-group">
                                <button
                                    className="premium-pill-btn primary"
                                    onClick={handleSelectAllUsers}
                                >
                                    {selectedUsers.length === currentDisplayListSize && currentDisplayListSize > 0 ? 'Deselect All' : 'Select All'}
                                </button>
                                <button className="premium-pill-btn secondary" onClick={() => { setSelectedUsers([]); setIsDeleteMode(false); }}>Cancel</button>
                                <button className="premium-pill-btn danger" onClick={handleBulkDeleteUsers} disabled={selectedUsers.length === 0}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bulk-delete-start-row">
                            <div className="bulk-delete-info">
                                <div className="info-icon">
                                    <RiTeamLine />
                                </div>
                                <div className="bulk-delete-text">
                                    <span className="bulk-delete-title">Manage Users</span>
                                    <span className="bulk-delete-desc">Select and remove multiple users at once</span>
                                </div>
                            </div>
                            <button className="premium-pill-btn danger" onClick={() => setIsDeleteMode(true)}>
                                <RiDeleteBin6Line /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
          </>
        )}

      </div>

      {/* RENDER THE MODAL OUTSIDE THE SCROLL FLOW USING PORTAL */}
      {selectedUser && ReactDOM.createPortal(modalContent, document.body)}
    </div>
  );
};

export default UserManagement;
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from "../../../firebase";
import { ref, onValue, set, get, update } from "firebase/database";
import {
  RiAddLine, RiDeleteBin6Line, RiDeleteBin6Fill, RiEditLine,
  RiArrowRightSLine, RiLayoutGridLine, RiTeamLine, RiArrowLeftLine
} from 'react-icons/ri';

// --- IMPORT STYLES ---
import "../../../styles/admin/settings.css";
import "../../../styles/student/schedule-desktop.css";
import "../../../styles/admin/user-management.css";
import { useToast } from '../../../contexts/ToastContext';

// --- UTILITIES FOR FACULTY STRINGS ---
const formatFaculties = (faculties) => {
  if (!faculties || faculties.length === 0) return '';
  if (faculties.length === 1) return faculties[0];
  if (faculties.length === 2) return faculties.join(' & ');
  const last = faculties[faculties.length - 1];
  const initial = faculties.slice(0, -1).join(', ');
  return `${initial} & ${last}`;
};

const parseFaculties = (facultyStr) => {
  if (!facultyStr) return [''];
  const parts = facultyStr.split(/, | & | &amp; /).map(f => f.trim()).filter(f => f);
  return parts.length > 0 ? parts : [''];
};

const FacultyDirectory = ({ isMobile }) => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Navigation Source of Truth: URL Params
  const targetFacultyDept = searchParams.get('fdept') || "";

  const [departmentsList, setDepartmentsList] = useState(["ECE", "IT", "CSE", "CSBS", "AIML"]);
  const [targetFacultyRole, setTargetFacultyRole] = useState("Faculty");
  const [facultyList, setFacultyList] = useState([]);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [editingFacultyIdx, setEditingFacultyIdx] = useState(null);
  const [tempFacultyName, setTempFacultyName] = useState("");
  const [tempFacultyRole, setTempFacultyRole] = useState("Faculty");
  const [allFacultyDeptKeys, setAllFacultyDeptKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit/Delete mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState([]);

  // Move Faculty State
  const [movingFacultyIdx, setMovingFacultyIdx] = useState(null);
  const [moveToDept, setMoveToDept] = useState("");

  // Faculty count per dept
  const [deptCounts, setDeptCounts] = useState({});

  const extraFacultyDepts = ["S&H", "Leadership"];
  const mergedDepartments = [...new Set([...departmentsList, ...extraFacultyDepts, ...allFacultyDeptKeys])].sort();

  // Navigation helper
  const navigateToLevel = (dept) => {
    const params = new URLSearchParams(searchParams);
    if (dept) {
      params.set('fdept', dept);
    } else {
      params.delete('fdept');
    }
    setSearchParams(params);
  };

  const handleBack = () => {
    if (targetFacultyDept) {
      navigateToLevel("");
    } else {
      setSearchParams({ mod: 'home' }, { replace: true });
    }
  };

  // Load all faculty directory keys + counts + global departments
  useEffect(() => {
    const deptsRef = ref(db, 'departments');
    const unsubDepts = onValue(deptsRef, (snap) => {
      if (snap.exists()) {
        setDepartmentsList(snap.val());
      }
    });

    const facDirRef = ref(db, 'faculties_directory');
    const unsubFac = onValue(facDirRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setAllFacultyDeptKeys(Object.keys(data));
        const counts = {};
        Object.entries(data).forEach(([dept, list]) => {
          counts[dept] = Array.isArray(list) ? list.length : 0;
        });
        setDeptCounts(counts);
      } else {
        setAllFacultyDeptKeys([]);
        setDeptCounts({});
      }
    });

    return () => {
      unsubDepts();
      unsubFac();
    };
  }, []);

  useEffect(() => {
    if (targetFacultyDept) {
      if (targetFacultyDept === 'Leadership') {
        setTargetFacultyRole('Principal');
      } else {
        setTargetFacultyRole('Faculty');
      }

      const facRef = ref(db, `faculties_directory/${targetFacultyDept}`);
      const unsub = onValue(facRef, (snap) => {
        const rawList = snap.exists() ? snap.val() : [];
        if (!Array.isArray(rawList)) {
          setFacultyList([]);
          return;
        }

        const mergedMap = new Map();
        rawList.forEach(item => {
          let obj = typeof item === 'string' ? { name: item, role: 'Faculty' } : item;
          if (obj && obj.name) {
            const existing = mergedMap.get(obj.name);
            if (!existing || existing.role === 'Faculty' || !existing.role) {
              mergedMap.set(obj.name, obj);
            }
          }
        });

        const normalizedList = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
        setFacultyList(normalizedList);
      });
      return () => unsub();
    }
  }, [targetFacultyDept]);

  const handleAddFaculty = async () => {
    if (!targetFacultyDept || !newFacultyName.trim()) return;
    const cleanName = newFacultyName.trim();
    if (facultyList.some(f => (f.name || f) === cleanName)) return showToast("Faculty already exists in this department!");
    const newFacultyObj = { name: cleanName, role: targetFacultyRole };
    const updatedList = [...facultyList, newFacultyObj].sort((a, b) => (a.name || a).localeCompare(b.name || b));
    await set(ref(db, `faculties_directory/${targetFacultyDept}`), updatedList);
    showToast("✅ Faculty added successfully.");
    setNewFacultyName("");
  };

  const handleUpdateFaculty = async () => {
    const cleanName = tempFacultyName.trim();
    if (!cleanName) return setEditingFacultyIdx(null);
    const oldFacultyItem = facultyList[editingFacultyIdx];
    const oldName = (oldFacultyItem.name || oldFacultyItem).trim();
    const existingIdx = facultyList.findIndex(f => (f.name || f) === cleanName);
    if (existingIdx !== -1 && existingIdx !== editingFacultyIdx) {
      return showToast("Another faculty with this name already exists in this department!");
    }
    const updatedList = [...facultyList];
    updatedList[editingFacultyIdx] = { name: cleanName, role: tempFacultyRole };
    updatedList.sort((a, b) => (a.name || a).localeCompare(b.name || b));

    let cascadeUpdates = {};
    if (oldName !== cleanName) {
      if (window.confirm(`You are renaming "${oldName}" to "${cleanName}".\nDo you want to automatically update this name across ALL course schedules?`)) {
        try {
          const schedSnap = await get(ref(db, 'schedules'));
          if (schedSnap.exists()) {
            const schedules = schedSnap.val();
            Object.keys(schedules).forEach(batch => {
              Object.keys(schedules[batch] || {}).forEach(dept => {
                Object.keys(schedules[batch][dept] || {}).forEach(sec => {
                  const sectionData = schedules[batch][dept][sec];
                  if (sectionData && sectionData.courses) {
                    let modified = false;
                    const updatedCourses = sectionData.courses.map(course => {
                      if (!course.faculty) return course;
                      const facParts = parseFaculties(course.faculty);
                      const oldIdx = facParts.indexOf(oldName);
                      if (oldIdx !== -1) {
                        facParts[oldIdx] = cleanName;
                        modified = true;
                        return { ...course, faculty: formatFaculties(facParts) };
                      }
                      return course;
                    });
                    if (modified) cascadeUpdates[`schedules/${batch}/${dept}/${sec}/courses`] = updatedCourses;
                  }
                });
              });
            });
          }
        } catch (err) { console.error("Error fetching schedules:", err); }
      }
    }

    try {
      cascadeUpdates[`faculties_directory/${targetFacultyDept}`] = updatedList;
      await update(ref(db), cascadeUpdates);
      showToast("✅ Faculty updated successfully.");
      setEditingFacultyIdx(null);
    } catch (err) { showToast("Error updating: " + err.message); }
  };

  const handleMoveFaculty = async (idx) => {
    if (!moveToDept || moveToDept === targetFacultyDept) return showToast("Select a different department.");
    const facultyToMove = facultyList[idx];
    const facName = facultyToMove.name || facultyToMove;
    if (window.confirm(`Move ${facName} to ${moveToDept}?`)) {
      try {
        const targetFacRef = ref(db, `faculties_directory/${moveToDept}`);
        const targetSnap = await get(targetFacRef);
        const targetList = Array.isArray(targetSnap.val()) ? targetSnap.val() : [];
        const exists = targetList.some(f => (f.name || f) === facName);
        if (!exists) {
          const objToAdd = typeof facultyToMove === 'string' ? { name: facultyToMove, role: 'Faculty' } : facultyToMove;
          const updatedTargetList = [...targetList, objToAdd].sort((a,b) => (a.name || a).localeCompare(b.name || b));
          await set(targetFacRef, updatedTargetList);
        }
        const updatedList = facultyList.filter((_, i) => i !== idx);
        await set(ref(db, `faculties_directory/${targetFacultyDept}`), updatedList);
        showToast(`✅ ${facName} moved to ${moveToDept}.`);
        setMovingFacultyIdx(null);
        setMoveToDept("");
      } catch (err) { showToast("Error moving: " + err.message); }
    }
  };

  // Bulk delete
  const handleToggleFacultySelect = (index) => {
    setSelectedFaculty(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleSelectAllFaculty = () => {
    if (selectedFaculty.length === filteredFaculty.length) {
      setSelectedFaculty([]);
    } else {
      setSelectedFaculty(filteredFaculty.map((_, i) => i));
    }
  };

  const handleBulkDeleteFaculty = async () => {
    if (selectedFaculty.length === 0) return;
    if (window.confirm(`Delete ${selectedFaculty.length} selected faculty from ${targetFacultyDept}?`)) {
      const remaining = facultyList.filter((_, i) => !selectedFaculty.includes(i));
      await set(ref(db, `faculties_directory/${targetFacultyDept}`), remaining);
      showToast(`✅ ${selectedFaculty.length} faculty deleted.`);
      setSelectedFaculty([]);
      setIsDeleteMode(false);
    }
  };

  // Role badge styling
  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'HOD':
        return { background: 'rgba(255, 69, 58, 0.12)', color: '#FF453A' };
      case 'Principal':
      case 'Dean':
        return { background: 'rgba(48, 209, 88, 0.12)', color: '#30D158' };
      case 'Academic Coordinator':
        return { background: 'rgba(10, 132, 255, 0.12)', color: '#0A84FF' };
      default:
        return { background: 'rgba(142, 142, 147, 0.12)', color: 'var(--mac-text-secondary)' };
    }
  };

  // Role options
  const getRoleOptions = () => {
    if (targetFacultyDept === 'Leadership') {
      return [{ value: 'Principal', label: 'Principal' }, { value: 'Dean', label: 'Dean' }];
    }
    return [
      { value: 'HOD', label: 'HOD' },
      { value: 'Academic Coordinator', label: 'Academic Coordinator' },
      { value: 'Faculty', label: 'Faculty' }
    ];
  };

  // Filter faculty by search
  const filteredFaculty = facultyList.filter(f =>
    (f.name || f).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ========================================================================
  //  RENDER
  // ========================================================================
  return (
    <div className="admin-subpage animate-fade-in central-schedule-manager">
      <div className="schedule-editor-workspace">
        
        {/* EXPLORER HEADER BREADCRUMBS */}
        <header className="explorer-header focus-mode" style={{ marginBottom: '24px', borderBottom: '1px solid var(--mac-divider)', paddingBottom: '16px' }}>
          <div className="breadcrumb-nav">
            <div className="breadcrumb-list" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`crumb-btn ${!targetFacultyDept ? 'crumb-static' : 'level-root'}`} onClick={() => navigateToLevel("")}>
                Directory
              </span>
              {targetFacultyDept && (
                <>
                  <RiArrowRightSLine style={{ opacity: 0.3 }} />
                  <span className="crumb-static">{targetFacultyDept}</span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="explorer-back-btn" onClick={handleBack}>
              <RiArrowLeftLine /> Back
            </button>
          </div>
        </header>

        <div className="tab-content-area" style={{ paddingTop: 0 }}>

          {!targetFacultyDept ? (
            /* ==================== 1. DIRECTORY (DEPT GRID) ==================== */
            <div className="course-manager">
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                {mergedDepartments.map(dept => {
                  const isNonAcademic = extraFacultyDepts.includes(dept);
                  return (
                    <div key={dept} className="settings-card" 
                      style={{ 
                        padding: '16px 20px', 
                        borderRadius: '20px', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease',
                        background: 'var(--mac-card-bg)',
                        border: 'none',
                        boxShadow: 'none',
                        margin: 0
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--mac-selection-hover)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--mac-card-bg)';
                      }}
                      onClick={() => navigateToLevel(dept)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '16px',
                          background: isNonAcademic ? 'rgba(255,149,0,0.1)' : 'rgba(10,132,255,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <RiLayoutGridLine style={{ fontSize: '24px', color: isNonAcademic ? 'var(--mac-warning-text)' : 'var(--mac-blue)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--mac-text)', letterSpacing: '0.4px' }}>{dept}</div>
                            {isNonAcademic && <span style={{ background: 'rgba(255,149,0,0.08)', color: 'var(--mac-warning-text)', fontSize: '10px', padding: '2px 8px', borderRadius: '50px', fontWeight: 700, textTransform: 'uppercase' }}>Fixed</span>}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--mac-text-secondary)', marginTop: '2px' }}>{deptCounts[dept] || 0} Faculty</div>
                        </div>
                        <RiArrowRightSLine style={{ opacity: 0.2, fontSize: '20px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {mergedDepartments.length === 0 && (
                <div className="settings-card empty-card-wrap"><div className="empty-placeholder"><RiTeamLine /><p>No departments found.</p></div></div>
              )}
            </div>
          ) : (
            /* ==================== 2. FACULTY LIST ==================== */
            <div className="course-manager">
              
              {/* Search */}
              <div className="admin-card search-card" style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder={`Search in ${targetFacultyDept}...`}
                  className="admin-input search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Edit List / Done / Cancel Header */}
              <div className="master-header-row animate-fade-in" style={{ marginBottom: '20px', minHeight: 'auto', justifyContent: 'flex-end', paddingRight: 0, paddingLeft: 0 }}>
                <div className="header-actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
                  {facultyList.length > 0 && (
                    isEditMode ? (
                      <div className="master-header-row" style={{ display: 'flex', gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
                        <button className="role-header-pill secondary" onClick={() => { setIsEditMode(false); setIsDeleteMode(false); }} style={{ minWidth: '90px' }}>Cancel</button>
                        <button className="role-header-pill active" onClick={() => { setIsEditMode(false); setIsDeleteMode(false); }} style={{ minWidth: '90px' }}>Done</button>
                      </div>
                    ) : (
                      <button className="edit-list-btn" onClick={() => setIsEditMode(true)}><RiEditLine style={{ marginRight: '6px' }} /> Edit List</button>
                    )
                  )}
                </div>
              </div>

              {/* Add Faculty Card */}
              {((isEditMode && !isDeleteMode) || facultyList.length === 0) && (
                <div className="master-add-card-premium animate-slide-down" style={{ marginBottom: '24px' }}>
                  <div className="add-card-title-row"><span>Add Member to {targetFacultyDept}</span></div>
                  <div className="add-card-grid">
                    <div className="add-input-section" style={{ width: isMobile ? '100%' : '180px' }}>
                      <label className="add-input-label">DESIGNATION / ROLE</label>
                      <select
                        className="premium-add-input"
                        value={targetFacultyRole}
                        onChange={e => setTargetFacultyRole(e.target.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        {getRoleOptions().map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="add-input-section grow">
                      <label className="add-input-label">FULL NAME</label>
                      <input
                        className="premium-add-input"
                        placeholder="e.g. Dr. Jane Cooper"
                        value={newFacultyName}
                        onChange={(e) => setNewFacultyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddFaculty()}
                      />
                    </div>
                  </div>
                  {isMobile ? (
                    <button className="premium-add-submit-btn" style={{ marginTop: '16px' }} onClick={handleAddFaculty}>Add Faculty</button>
                  ) : (
                    <button className="premium-add-submit-btn" onClick={handleAddFaculty}><RiAddLine /> Add Faculty</button>
                  )}
                </div>
              )}

              {/* Faculty Items Grid */}
              <div className="master-items-container individual-cards" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                {filteredFaculty.length === 0 ? (
                  <div className="settings-card empty-card-wrap" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-placeholder">
                      <RiTeamLine />
                      <p>{searchTerm ? `No results for "${searchTerm}"` : `The Faculty List for ${targetFacultyDept} is currently empty.`}</p>
                    </div>
                  </div>
                ) : (
                  filteredFaculty.map((f, i) => (
                    <div key={i} className={`settings-card master-item-card ${editingFacultyIdx === i || movingFacultyIdx === i ? 'editing' : ''}`} 
                      style={{ 
                        borderRadius: '20px',
                        boxShadow: 'none',
                        border: 'none',
                        margin: 0
                      }}>
                      {editingFacultyIdx === i ? (
                        /* ── Inline Edit Mode ── */
                        <div className="pill-edit-row">
                          <div className="edit-item-fields">
                            <div className="edit-field">
                              <label className="edit-label">ROLE</label>
                              <select
                                className="edit-input-field"
                                value={tempFacultyRole}
                                onChange={e => setTempFacultyRole(e.target.value)}
                              >
                                {getRoleOptions().map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="edit-field">
                              <label className="edit-label">FULL NAME</label>
                              <input
                                autoFocus
                                className="edit-input-field"
                                placeholder="Name"
                                value={tempFacultyName}
                                onChange={(e) => setTempFacultyName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateFaculty()}
                              />
                            </div>
                          </div>
                          <div className="creator-action-pills" style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginTop: '20px', width: '100%' }}>
                            <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingFacultyIdx(null)}>Cancel</button>
                            <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUpdateFaculty}>Save</button>
                          </div>
                        </div>
                      ) : movingFacultyIdx === i ? (
                        /* ── Move Mode ── */
                        <div className="pill-edit-row">
                          <div className="edit-item-fields">
                            <div className="edit-field" style={{ flex: 'none', width: 'auto' }}>
                              <label className="edit-label">MEMBER</label>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mac-text)', padding: '12px 0' }}>{f.name || f}</span>
                            </div>
                            <div className="edit-field">
                              <label className="edit-label">MOVE TO DEPARTMENT</label>
                              <select
                                className="edit-input-field"
                                value={moveToDept}
                                onChange={e => setMoveToDept(e.target.value)}
                              >
                                <option value="">— Select Target Dept —</option>
                                {mergedDepartments.filter(d => d !== targetFacultyDept).map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="creator-action-pills" style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginTop: '20px', width: '100%' }}>
                            <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setMovingFacultyIdx(null); setMoveToDept(""); }}>Cancel</button>
                            <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleMoveFaculty(i)} disabled={!moveToDept}>Move</button>
                          </div>
                        </div>
                      ) : (
                        /* ── Display Mode ── */
                        <>
                          <div className="item-content" style={{ display: 'flex', flexDirection: isMobile && isEditMode ? 'column' : 'row', alignItems: isMobile && isEditMode ? 'flex-start' : 'center', gap: '16px', width: '100%', padding: '4px 0' }}>
                            
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '16px' }}>
                              {isDeleteMode && (
                                <input
                                  type="checkbox"
                                  className="mac-checkbox"
                                  checked={selectedFaculty.includes(i)}
                                  onChange={() => handleToggleFacultySelect(i)}
                                  style={{ transform: 'scale(1.1)' }}
                                />
                              )}
                              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                <span className="course-name-text" style={{ fontSize: '15.5px', fontWeight: 600, letterSpacing: '0.2px' }}>{f.name || f}</span>
                                <span style={{
                                  display: 'inline-flex', alignSelf: 'flex-start', marginTop: '6px',
                                  fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '50px',
                                  textTransform: 'uppercase', letterSpacing: '0.6px',
                                  ...getRoleBadgeStyle(f.role || 'Faculty')
                                }}>{f.role || 'Faculty'}</span>
                              </div>

                              {/* Desktop Actions */}
                              {!isMobile && isEditMode && (
                                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexShrink: 0 }}>
                                  <button className="pill-inline-edit" onClick={() => setMovingFacultyIdx(i)} title="Move">
                                    <RiArrowRightSLine style={{ fontSize: '18px' }} />
                                  </button>
                                  <button className="pill-inline-edit" onClick={() => { setEditingFacultyIdx(i); setTempFacultyName(f.name || f); setTempFacultyRole(f.role || 'Faculty'); }}>
                                    <RiEditLine style={{ fontSize: '16px' }} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Mobile Actions */}
                            {isMobile && isEditMode && !isDeleteMode && (
                              <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '4px' }}>
                                <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center', height: '36px', fontSize: '13px' }} onClick={() => setMovingFacultyIdx(i)}>
                                  <RiArrowRightSLine style={{ fontSize: '16px', marginRight: '4px' }} /> Move
                                </button>
                                <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center', height: '36px', fontSize: '13px' }} onClick={() => { setEditingFacultyIdx(i); setTempFacultyName(f.name || f); setTempFacultyRole(f.role || 'Faculty'); }}>
                                  <RiEditLine style={{ fontSize: '14px', marginRight: '4px' }} /> Edit
                                </button>
                              </div>
                            )}

                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* ───────── BULK ACTION FOOTER ───────── */}
              {isEditMode && (
                <div className={`bulk-action-footer-premium animate-slide-up ${isDeleteMode ? 'danger-mode' : ''}`}>
                  {isDeleteMode ? (
                    <div className="bulk-delete-action-row">
                      <div className="bulk-delete-info">
                        <div className="info-icon"><RiDeleteBin6Fill /></div>
                        <div className="bulk-delete-text">
                          <span className="bulk-delete-title">
                            {selectedFaculty.length === 0 ? "Select Faculty" : `${selectedFaculty.length} Selected`}
                          </span>
                          <span className="bulk-delete-desc">Choose members to remove from {targetFacultyDept}</span>
                        </div>
                      </div>
                      <div className="pill-group">
                        <button className="premium-pill-btn primary" onClick={handleSelectAllFaculty}>
                          {selectedFaculty.length === filteredFaculty.length && filteredFaculty.length > 0 ? 'Deselect All' : 'Select All'}
                        </button>
                        <button className="premium-pill-btn secondary" onClick={() => { setSelectedFaculty([]); setIsDeleteMode(false); }}>Cancel</button>
                        <button className="premium-pill-btn danger" onClick={handleBulkDeleteFaculty} disabled={selectedFaculty.length === 0}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bulk-delete-start-row">
                      <div className="bulk-delete-info">
                        <div className="info-icon"><RiTeamLine /></div>
                        <div className="bulk-delete-text">
                          <span className="bulk-delete-title">Bulk Actions</span>
                          <span className="bulk-delete-desc">Manage multiple members in {targetFacultyDept} at once</span>
                        </div>
                      </div>
                      <button className="premium-pill-btn danger" onClick={() => setIsDeleteMode(true)}>
                        <RiDeleteBin6Fill /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FacultyDirectory;

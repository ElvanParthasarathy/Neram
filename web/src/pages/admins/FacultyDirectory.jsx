import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, get, update } from "firebase/database";
import {
  RiAddLine, RiDeleteBin6Line, RiDeleteBin6Fill, RiEditLine,
  RiCloseLine, RiCheckLine, RiArrowLeftLine, RiArrowRightSLine,
  RiUserVoiceLine, RiLayoutGridLine, RiTeamLine, RiBookOpenLine
} from 'react-icons/ri';

// --- IMPORT STYLES ---
import "../../styles/schedule.desktop.css";
import "../../styles/user-management.css";

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

const FacultyDirectory = () => {
  const departmentsList = ["ECE", "IT", "CSE", "CSBS", "AIML"];
  const [targetFacultyDept, setTargetFacultyDept] = useState("");
  const [targetFacultyRole, setTargetFacultyRole] = useState("Faculty");
  const [facultyList, setFacultyList] = useState([]);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [editingFacultyIdx, setEditingFacultyIdx] = useState(null);
  const [tempFacultyName, setTempFacultyName] = useState("");
  const [tempFacultyRole, setTempFacultyRole] = useState("Faculty");
  const [allFacultyDeptKeys, setAllFacultyDeptKeys] = useState([]);
  const [newFacultyDept, setNewFacultyDept] = useState("");
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

  // Load all faculty directory keys + counts
  useEffect(() => {
    const facDirRef = ref(db, 'faculties_directory');
    const unsub = onValue(facDirRef, (snap) => {
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
    return () => unsub();
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
    if (facultyList.some(f => (f.name || f) === cleanName)) return alert("Faculty already exists in this department!");
    const newFacultyObj = { name: cleanName, role: targetFacultyRole };
    const updatedList = [...facultyList, newFacultyObj].sort((a, b) => (a.name || a).localeCompare(b.name || b));
    await set(ref(db, `faculties_directory/${targetFacultyDept}`), updatedList);
    setNewFacultyName("");
  };

  const handleUpdateFaculty = async () => {
    const cleanName = tempFacultyName.trim();
    if (!cleanName) return setEditingFacultyIdx(null);
    const oldFacultyItem = facultyList[editingFacultyIdx];
    const oldName = (oldFacultyItem.name || oldFacultyItem).trim();
    const existingIdx = facultyList.findIndex(f => (f.name || f) === cleanName);
    if (existingIdx !== -1 && existingIdx !== editingFacultyIdx) {
      return alert("Another faculty with this name already exists in this department!");
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
      setEditingFacultyIdx(null);
    } catch (err) { alert("Error updating: " + err.message); }
  };

  const handleDeleteFaculty = async (idx) => {
    const facultyToRemove = facultyList[idx];
    const facName = facultyToRemove.name || facultyToRemove;
    if (window.confirm(`Remove ${facName} from ${targetFacultyDept}?`)) {
      const updatedList = facultyList.filter((_, i) => i !== idx);
      await set(ref(db, `faculties_directory/${targetFacultyDept}`), updatedList);
    }
  };

  const handleMoveFaculty = async (idx) => {
    if (!moveToDept || moveToDept === targetFacultyDept) return alert("Select a different department.");
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
        setMovingFacultyIdx(null);
        setMoveToDept("");
      } catch (err) { alert("Error moving: " + err.message); }
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
      setSelectedFaculty([]);
      setIsDeleteMode(false);
    }
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setIsDeleteMode(false);
    setSelectedFaculty([]);
    setEditingFacultyIdx(null);
    setMovingFacultyIdx(null);
    setMoveToDept("");
  };

  const navigateBack = () => {
    setTargetFacultyDept("");
    exitEditMode();
    setSearchTerm("");
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
    <div className="admin-subpage animate-fade-in" style={{ padding: 0, width: '100%' }}>

      {/* ───────── BREADCRUMB HEADER ───────── */}
      <header className="explorer-header" style={{ marginTop: '10px' }}>
        <div className="breadcrumb-nav">
          <div className="breadcrumb-list">
            <span className="crumb-btn level-root" onClick={navigateBack}>Directory</span>
            {targetFacultyDept && (
              <>
                <RiArrowRightSLine className="crumb-sep" />
                <span className="crumb-static">{targetFacultyDept}</span>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {targetFacultyDept && (
            <button className="explorer-back-btn" onClick={navigateBack}>
              <RiArrowLeftLine /> Back
            </button>
          )}
        </div>
      </header>

      {/* ───────── DEPARTMENT EXPLORER GRID ───────── */}
      {!targetFacultyDept && (
        <div className="explorer-content animate-fade-in">
          {/* Add custom dept card */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', maxWidth: '360px' }}>
            <input
              type="text"
              className="premium-add-input"
              placeholder="New dept (e.g. S&H)"
              value={newFacultyDept}
              onChange={e => setNewFacultyDept(e.target.value.toUpperCase())}
              style={{ flex: 1 }}
            />
            <button className="premium-add-submit-btn" onClick={() => {
              if (!newFacultyDept.trim()) return;
              const deptName = newFacultyDept.trim();
              if (mergedDepartments.includes(deptName)) return alert('Department exists!');
              set(ref(db, `faculties_directory/${deptName}`), []);
              setNewFacultyDept('');
              setTargetFacultyDept(deptName);
            }}>
              <RiAddLine /> Add
            </button>
          </div>

          <div className="explorer-grid">
            {mergedDepartments.map(dept => (
              <div key={dept} className="explorer-card" onClick={() => setTargetFacultyDept(dept)}>
                <RiLayoutGridLine className="card-icon" />
                <div className="card-info">
                  <h3>{dept}</h3>
                  <p>{deptCounts[dept] || 0} Faculty</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ───────── FACULTY ROSTER VIEW ───────── */}
      {targetFacultyDept && (
        <div className="explorer-content animate-fade-in">

          {/* Search */}
          <div className="admin-card search-card" style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder={`Search ${targetFacultyDept} faculty...`}
              className="admin-input search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Header Actions Row */}
          <div className="master-header-row animate-fade-in" style={{ width: '100%', marginBottom: '16px', padding: '0 4px', display: 'flex' }}>
            <div className="header-actions" style={{ marginLeft: 'auto', alignSelf: 'flex-end', display: 'flex' }}>
              {facultyList.length > 0 && (
                isEditMode ? (
                  <div className="master-header-row" style={{ display: 'flex', gap: '8px', flexDirection: 'row', alignItems: 'center', margin: 0, padding: 0 }}>
                    <button
                      className="role-header-pill secondary"
                      onClick={exitEditMode}
                      style={{ minWidth: '90px' }}
                    >
                      Cancel
                    </button>
                    <button
                      className="role-header-pill active"
                      onClick={exitEditMode}
                      style={{ minWidth: '90px' }}
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button className="edit-list-btn" onClick={() => setIsEditMode(true)}>
                    <RiEditLine style={{ marginRight: '6px' }} /> Edit List
                  </button>
                )
              )}
            </div>
          </div>

          {/* Add Faculty Card */}
          {(isEditMode || facultyList.length === 0) && (
            <div className="master-add-card-premium animate-slide-down">
              <div className="add-card-title-row">
                <span>Add New Faculty Member</span>
              </div>
              <div className="add-card-grid">
                <div className="add-input-section" style={{ width: '160px' }}>
                  <label className="add-input-label">ROLE</label>
                  <select
                    className="premium-add-input"
                    value={targetFacultyRole}
                    onChange={e => setTargetFacultyRole(e.target.value)}
                    style={{ padding: '10px 16px' }}
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
                    placeholder="e.g. Dr. A. Smith"
                    value={newFacultyName}
                    onChange={(e) => setNewFacultyName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFaculty()}
                  />
                </div>
              </div>
              <button className="premium-add-submit-btn" onClick={handleAddFaculty}>
                <RiAddLine /> Add Faculty
              </button>
            </div>
          )}

          {/* Faculty Items */}
          <div className="master-items-container individual-cards">
            {filteredFaculty.length === 0 ? (
              <div className="settings-card empty-card-wrap">
                <div className="empty-placeholder">
                  <RiTeamLine />
                  <p>{searchTerm ? `No results for "${searchTerm}"` : `No faculty found for ${targetFacultyDept}.`}</p>
                </div>
              </div>
            ) : (
              filteredFaculty.map((f, i) => (
                <div key={i} className={`settings-card master-item-card ${editingFacultyIdx === i || movingFacultyIdx === i ? 'editing' : ''}`}>
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
                      <div className="pill-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingFacultyIdx(null)}>Cancel</button>
                        <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUpdateFaculty}>Save Changes</button>
                      </div>
                    </div>
                  ) : movingFacultyIdx === i ? (
                    /* ── Move Mode (replaces card content) ── */
                    <div className="pill-edit-row">
                      <div className="edit-item-fields">
                        <div className="edit-field" style={{ flex: 'none', width: 'auto' }}>
                          <label className="edit-label">FACULTY</label>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--mac-text)', padding: '12px 0' }}>{f.name || f}</span>
                        </div>
                        <div className="edit-field">
                          <label className="edit-label">MOVE TO DEPARTMENT</label>
                          <select
                            className="edit-input-field"
                            value={moveToDept}
                            onChange={e => setMoveToDept(e.target.value)}
                          >
                            <option value="">— Select Department —</option>
                            {mergedDepartments.filter(d => d !== targetFacultyDept).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="pill-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                        <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setMovingFacultyIdx(null); setMoveToDept(""); }}>Cancel</button>
                        <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleMoveFaculty(i)} disabled={!moveToDept}>Confirm Move</button>
                      </div>
                    </div>
                  ) : (
                    /* ── Display Mode ── */
                    <>
                      <div className="item-content">
                        {isDeleteMode && (
                          <input
                            type="checkbox"
                            className="mac-checkbox"
                            checked={selectedFaculty.includes(i)}
                            onChange={() => handleToggleFacultySelect(i)}
                          />
                        )}
                        <div className="item-text-stack">
                          <div className="course-code-badge" style={getRoleBadgeStyle(f.role || 'Faculty')}>
                            {f.role || 'Faculty'}
                          </div>
                          <span className="course-name-text">{f.name || f}</span>
                        </div>
                      </div>

                      {/* Edit mode item actions */}
                      {isEditMode && (
                        <div className="fd-card-actions">
                          <button className="pill-inline-edit" onClick={() => setMovingFacultyIdx(i)} title="Move">
                            <RiArrowRightSLine /> <span className="fd-action-label">Move</span>
                          </button>
                          <button className="pill-inline-edit" onClick={() => { setEditingFacultyIdx(i); setTempFacultyName(f.name || f); setTempFacultyRole(f.role || 'Faculty'); }}>
                            <RiEditLine /> <span className="fd-action-label">Edit</span>
                          </button>
                        </div>
                      )}
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
                    <div className="info-icon">
                      <RiDeleteBin6Fill />
                    </div>
                    <div className="bulk-delete-text">
                      <span className="bulk-delete-title">
                        {selectedFaculty.length === 0 ? "Select Items" : `${selectedFaculty.length} Selected`}
                      </span>
                      <span className="bulk-delete-desc">Choose faculty to remove</span>
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
                    <div className="info-icon">
                      <RiTeamLine />
                    </div>
                    <div className="bulk-delete-text">
                      <span className="bulk-delete-title">Manage Faculty</span>
                      <span className="bulk-delete-desc">Select and remove multiple faculty at once</span>
                    </div>
                  </div>
                  <button className="premium-pill-btn danger" onClick={() => setIsDeleteMode(true)}>
                    <RiDeleteBin6Line /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        /* Fix dropdown options not respecting dark mode (Native pickers fail on CSS vars sometimes) */
        html.dark select option {
          background-color: #1A1A1A !important;
          color: #FFFFFF !important;
        }
        select option {
          background-color: #FFFFFF;
          color: #000000;
        }
        
        .fd-card-actions {
          display: flex;
          gap: 6px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .fd-card-actions .pill-inline-edit {
          border-radius: 100px !important;
          padding: 8px 16px !important;
          gap: 6px !important;
          display: flex !important;
          align-items: center !important;
          width: auto !important;
          height: auto !important;
        }
        .fd-action-label {
          font-size: 13px;
          font-weight: 600;
        }
        @media (min-width: 769px) {
          .master-items-container.individual-cards {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            align-items: start;
          }
        }
        @media (max-width: 768px) {
          .fd-card-actions {
            flex-direction: column;
            width: 100%;
            margin-left: 0;
            margin-top: 12px;
          }
          .fd-card-actions .pill-inline-edit {
            width: 100%;
            justify-content: center;
            padding: 10px 16px;
            border-radius: 12px;
          }
          .settings-card.master-item-card {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default FacultyDirectory;

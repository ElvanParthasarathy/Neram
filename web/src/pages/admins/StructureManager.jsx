import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, get, update } from "firebase/database";
import { RiLock2Line, RiLockUnlockLine, RiAddLine, RiDeleteBinLine, RiEditLine, RiSave3Line, RiCloseLine, RiInformationLine, RiCheckLine, RiDeleteBin6Line } from 'react-icons/ri';

// --- IMPORT STYLES ---
import "../../styles/structure-manager.css";

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

const StructureManager = () => {
  const departmentsList = ["ECE", "IT", "CSE", "CSBS", "AIML"];
  const [hierarchy, setHierarchy] = useState({});
  const [isEditing, setIsEditing] = useState(false); // Default: Locked

  // Tab Navigation
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' or 'faculty'

  // Tree View State
  const [batchStart, setBatchStart] = useState("");
  const [batchEnd, setBatchEnd] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [newSection, setNewSection] = useState("");

  const [editingSec, setEditingSec] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingDept, setEditingDept] = useState(null);

  // Faculty Directory State
  const [targetFacultyDept, setTargetFacultyDept] = useState("");
  const [targetFacultyRole, setTargetFacultyRole] = useState("Faculty");
  const [facultyList, setFacultyList] = useState([]);
  const [newFacultyName, setNewFacultyName] = useState("");
  const [editingFacultyIdx, setEditingFacultyIdx] = useState(null);
  const [tempFacultyName, setTempFacultyName] = useState("");
  const [tempFacultyRole, setTempFacultyRole] = useState("Faculty");
  const [allFacultyDeptKeys, setAllFacultyDeptKeys] = useState([]);
  const [newFacultyDept, setNewFacultyDept] = useState("");

  // Move Faculty State
  const [movingFacultyIdx, setMovingFacultyIdx] = useState(null);
  const [moveToDept, setMoveToDept] = useState("");

  const extraFacultyDepts = ["S&H", "Leadership"];

  // Merged departments: academic depts + faculty-only depts + extra default depts
  const mergedDepartments = [...new Set([...departmentsList, ...extraFacultyDepts, ...allFacultyDeptKeys])].sort();

  useEffect(() => {
    const configRef = ref(db, 'academic_hierarchy');
    const unsubscribe = onValue(configRef, (snapshot) => {
      setHierarchy(snapshot.exists() ? snapshot.val() : {});
    });
    return () => unsubscribe();
  }, []);

  // Load all faculty directory keys to discover faculty-only departments
  useEffect(() => {
    const facDirRef = ref(db, 'faculties_directory');
    const unsub = onValue(facDirRef, (snap) => {
      if (snap.exists()) {
        setAllFacultyDeptKeys(Object.keys(snap.val()));
      } else {
        setAllFacultyDeptKeys([]);
      }
    });
    return () => unsub();
  }, []);

  const [migrationStatus, setMigrationStatus] = useState('');

  // One-time migration: scan ALL schedules, extract faculty names, write to faculties_directory
  const runFacultyMigration = async () => {
    setMigrationStatus('Reading schedules...');
    try {
      const schedulesSnap = await get(ref(db, 'schedules'));
      const allSchedules = schedulesSnap.val() || {};
      const facDirSnap = await get(ref(db, 'faculties_directory'));
      const existingFacDir = facDirSnap.val() || {};

      const deptFaculties = {};

      const addFacultyNames = (dept, nameStr) => {
        if (!nameStr || typeof nameStr !== 'string') return;
        const parts = nameStr.split(/&|\band\b|\/|,/i);
        parts.forEach(p => {
          const trimmed = p.trim();
          if (trimmed && trimmed.length > 1) {
            if (!deptFaculties[dept]) deptFaculties[dept] = new Set();
            deptFaculties[dept].add(trimmed);
          }
        });
      };

      setMigrationStatus('Extracting faculty from schedules...');

      Object.keys(allSchedules).forEach(batch => {
        const batchData = allSchedules[batch];
        Object.keys(batchData || {}).forEach(dept => {
          const deptData = batchData[dept];
          Object.keys(deptData || {}).forEach(secKey => {
            const sec = deptData[secKey];

            // _master faculties
            if (secKey === '_master' && sec.faculties && Array.isArray(sec.faculties)) {
              sec.faculties.forEach(f => addFacultyNames(dept, f));
            }
            if (secKey === '_master') return;

            // Courses
            if (sec.courses && Array.isArray(sec.courses)) {
              sec.courses.forEach(c => {
                if (c.faculty) addFacultyNames(dept, c.faculty);
              });
            }

            // Counseling
            if (sec.counseling) {
              if (sec.counseling.counselors && Array.isArray(sec.counseling.counselors)) {
                sec.counseling.counselors.forEach(c => addFacultyNames(dept, c));
              }
              if (sec.counseling.coordinators) {
                Object.values(sec.counseling.coordinators).forEach(name => {
                  addFacultyNames(dept, name);
                });
              }
            }
          });
        });
      });

      // Merge with existing and deduplicate
      const finalDir = { ...existingFacDir };
      const allDepts = new Set([...Object.keys(finalDir), ...Object.keys(deptFaculties)]);

      allDepts.forEach(dept => {
        const mergedMap = new Map();

        const existingList = finalDir[dept] || [];
        (Array.isArray(existingList) ? existingList : []).forEach(item => {
          if (typeof item === 'string') {
            if (!mergedMap.has(item)) mergedMap.set(item, { name: item, role: 'Faculty' });
          } else if (item && item.name) {
            const existing = mergedMap.get(item.name);
            if (!existing || existing.role === 'Faculty' || !existing.role) {
              mergedMap.set(item.name, item);
            }
          }
        });

        if (deptFaculties[dept]) {
          deptFaculties[dept].forEach(f => {
            if (!mergedMap.has(f)) {
              mergedMap.set(f, { name: f, role: 'Faculty' });
            }
          });
        }

        finalDir[dept] = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      });

      // Ensure S&H exists
      if (!finalDir['S&H']) finalDir['S&H'] = [];

      setMigrationStatus('Writing to faculties_directory...');
      await set(ref(db, 'faculties_directory'), finalDir);

      const totalFac = Object.values(finalDir).reduce((s, arr) => s + arr.length, 0);
      setMigrationStatus(`✅ Done! Migrated ${totalFac} faculty across ${Object.keys(finalDir).length} departments.`);
    } catch (err) {
      setMigrationStatus(`❌ Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (activeTab === 'faculty' && targetFacultyDept) {
      if (targetFacultyDept === 'Leadership') {
        setTargetFacultyRole('Principal');
      } else {
        setTargetFacultyRole('Faculty');
      }

      const facRef = ref(db, `faculties_directory/${targetFacultyDept}`);
      const unsub = onValue(facRef, (snap) => {
        // Ensure backwards compatibility with legacy string arrays and dynamically deduplicate
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
  }, [activeTab, targetFacultyDept]);

  const runGlobalMigration = async (type, oldPath, newPath, oldVal, newVal) => {
    const updates = {};
    const scheduleSnapshot = await get(ref(db, `schedules/${oldPath}`));
    if (scheduleSnapshot.exists()) {
      updates[`schedules/${newPath}`] = scheduleSnapshot.val();
      updates[`schedules/${oldPath}`] = null;
    }

    const usersSnapshot = await get(ref(db, 'users'));
    if (usersSnapshot.exists()) {
      const allUsers = usersSnapshot.val();
      Object.keys(allUsers).forEach(uid => {
        const user = allUsers[uid];
        if (type === 'batch' && user.batch === oldVal) updates[`users/${uid}/batch`] = newVal;
        if (type === 'dept' && user.batch === oldPath.split('/')[0] && user.department === oldVal) updates[`users/${uid}/department`] = newVal;
        if (type === 'sec' && user.batch === oldPath.split('/')[0] && user.department === oldPath.split('/')[1] && user.section === oldVal) updates[`users/${uid}/section`] = newVal;
      });
    }

    const hierarchyData = await get(ref(db, `academic_hierarchy/${oldPath}`));
    updates[`academic_hierarchy/${newPath}`] = hierarchyData.val();
    updates[`academic_hierarchy/${oldPath}`] = null;
    await update(ref(db), updates);
  };

  const handleCreateBatch = async () => {
    if (!batchStart || !batchEnd) return alert("Please enter both years");
    const label = `${batchStart}-${batchEnd}`;
    await set(ref(db, `academic_hierarchy/${label}`), { initialized: true });
    setBatchStart(""); setBatchEnd("");
  };

  const handleUpdateBatch = async () => {
    const { oldVal, newVal } = editingBatch;
    const cleanNewVal = newVal.trim();
    if (!cleanNewVal || oldVal === cleanNewVal) return setEditingBatch(null);
    if (hierarchy[cleanNewVal]) return alert("Batch already exists!");
    if (window.confirm(`Rename Batch to "${cleanNewVal}"?`)) {
      try {
        await runGlobalMigration('batch', oldVal, cleanNewVal, oldVal, cleanNewVal);
        setEditingBatch(null);
      } catch (err) { alert(err.message); }
    }
  };

  const handleDeleteBatch = async (batch) => {
    const batchData = hierarchy[batch];
    // Check if batch has departments (keys other than 'initialized')
    const departments = Object.keys(batchData || {}).filter(k => k !== 'initialized');

    if (departments.length > 0) {
      alert(`Cannot delete Batch ${batch} because it contains Departments.\n\nPlease delete all Departments in this Batch first.`);
      return;
    }

    if (window.confirm(`Permanently delete empty Batch ${batch}?`)) {
      const updates = {};
      updates[`academic_hierarchy/${batch}`] = null;
      updates[`schedules/${batch}`] = null;
      await update(ref(db), updates);
    }
  };

  const handleUpdateDept = async () => {
    const { batch, oldVal, newVal } = editingDept;
    const cleanNewVal = newVal.toUpperCase().trim();
    if (!cleanNewVal || oldVal === cleanNewVal) return setEditingDept(null);
    if (window.confirm(`Rename Dept to "${cleanNewVal}"?`)) {
      try {
        await runGlobalMigration('dept', `${batch}/${oldVal}`, `${batch}/${cleanNewVal}`, oldVal, cleanNewVal);
        setEditingDept(null);
      } catch (err) { alert(err.message); }
    }
  };

  const handleDeleteDept = async (batch, dept) => {
    const sections = hierarchy[batch]?.[dept];
    if (Array.isArray(sections) && sections.length > 0) {
      alert(`Cannot delete Department ${dept} because it contains Sections.\n\nPlease delete all Sections in this Department first.`);
      return;
    }

    if (window.confirm(`Permanently delete empty Department ${dept}?`)) {
      const updates = {};
      updates[`academic_hierarchy/${batch}/${dept}`] = null;
      updates[`schedules/${batch}/${dept}`] = null;
      await update(ref(db), updates);
    }
  };

  const handleAddSection = async () => {
    if (!selectedBatch || !selectedDept || !newSection) return alert("Complete all fields.");
    const sec = newSection.toUpperCase().trim();
    const currentSections = hierarchy[selectedBatch]?.[selectedDept] || [];
    const updatedSections = [...currentSections, sec].sort();
    await set(ref(db, `academic_hierarchy/${selectedBatch}/${selectedDept}`), updatedSections);
    setNewSection("");
  };

  const handleUpdateSection = async () => {
    const { batch, dept, oldVal, newVal } = editingSec;
    const cleanNewVal = newVal.toUpperCase().trim();
    if (window.confirm(`Rename Section to "${cleanNewVal}"?`)) {
      try {
        const currentSections = hierarchy[batch][dept];
        const updatedSections = currentSections.map(s => s === oldVal ? cleanNewVal : s);
        const updates = {};
        updates[`academic_hierarchy/${batch}/${dept}`] = updatedSections;
        const schedSnap = await get(ref(db, `schedules/${batch}/${dept}/${oldVal}`));
        if (schedSnap.exists()) {
          updates[`schedules/${batch}/${dept}/${cleanNewVal}`] = schedSnap.val();
          updates[`schedules/${batch}/${dept}/${oldVal}`] = null;
        }
        const usersSnap = await get(ref(db, 'users'));
        if (usersSnap.exists()) {
          Object.entries(usersSnap.val()).forEach(([uid, u]) => {
            if (u.batch === batch && u.department === dept && u.section === oldVal) updates[`users/${uid}/section`] = cleanNewVal;
          });
        }
        await update(ref(db), updates);
        setEditingSec(null);
      } catch (err) { alert(err.message); }
    }
  };

  const handleDeleteSection = async (batch, dept, sec) => {
    if (window.confirm(`Permanently delete Section ${sec} from ${batch} - ${dept}?`)) {
      const updates = {};
      updates[`academic_hierarchy/${batch}/${dept}`] = hierarchy[batch][dept].filter(s => s !== sec);
      updates[`schedules/${batch}/${dept}/${sec}`] = null;
      await update(ref(db), updates);
    }
  };

  // --- FACULTY HANDLERS ---
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

    // Confirm cascade update
    let cascadeUpdates = {};
    if (oldName !== cleanName) {
      if (window.confirm(`You are renaming "${oldName}" to "${cleanName}".\nDo you want to automatically update this name across ALL course schedules?`)) {
        try {
          const schedSnap = await get(ref(db, 'schedules'));
          if (schedSnap.exists()) {
            const schedules = schedSnap.val();
            // Iterate through batch > dept > sec
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
                    if (modified) {
                      cascadeUpdates[`schedules/${batch}/${dept}/${sec}/courses`] = updatedCourses;
                    }
                  }
                });
              });
            });
          }
        } catch (err) {
          console.error("Error fetching schedules for cascade rename:", err);
        }
      }
    }

    try {
      cascadeUpdates[`faculties_directory/${targetFacultyDept}`] = updatedList;
      await update(ref(db), cascadeUpdates);
      setEditingFacultyIdx(null);
    } catch (err) {
      alert("Error updating faculty: " + err.message);
    }
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
    if (!moveToDept || moveToDept === targetFacultyDept) return alert("Select a different department to move to.");

    const facultyToMove = facultyList[idx];
    const facName = facultyToMove.name || facultyToMove;
    if (window.confirm(`Move ${facName} to ${moveToDept}?`)) {
      try {
        // 1. Add to new department
        const targetFacRef = ref(db, `faculties_directory/${moveToDept}`);
        const targetSnap = await get(targetFacRef);
        const targetListRaw = targetSnap.exists() ? targetSnap.val() : [];
        const targetList = Array.isArray(targetListRaw) ? targetListRaw : [];

        const exists = targetList.some(f => (f.name || f) === facName);

        if (exists) {
          alert(`${facName} already exists in ${moveToDept}. They will just be removed from ${targetFacultyDept}.`);
        } else {
          const objToAdd = typeof facultyToMove === 'string' ? { name: facultyToMove, role: 'Faculty' } : facultyToMove;
          const updatedTargetList = [...targetList, objToAdd].sort((a, b) => {
            const nameA = a.name || a;
            const nameB = b.name || b;
            return nameA.localeCompare(nameB);
          });
          await set(targetFacRef, updatedTargetList);
        }

        // 2. Remove from current department
        const updatedList = facultyList.filter((_, i) => i !== idx);
        await set(ref(db, `faculties_directory/${targetFacultyDept}`), updatedList);

        setMovingFacultyIdx(null);
        setMoveToDept("");
      } catch (err) {
        alert("Error moving faculty: " + err.message);
      }
    }
  };

  return (
    <div className="admin-subpage animate-fade-in resources-page-wrapper">
      {/* HEADER BAR */}
      <header className="explorer-header focus-mode" style={{ marginBottom: '24px', flexDirection: 'column', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '0' }}>
        <div className="breadcrumb-nav" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RiInformationLine className="card-icon-mini" />
            <span className="crumb-static">Academic Hierarchy & Faculty</span>
          </div>
          <button
            className={`btn-toggle-explicit ${isEditing ? 'editing' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <><RiCloseLine /> Done Editing</> : <><RiEditLine /> Edit Mode</>}
          </button>
        </div>

        <nav className="folder-tabs" style={{ marginBottom: '-1px' }}>
          <button className={activeTab === 'tree' ? 'active' : ''} onClick={() => setActiveTab('tree')}><RiAddLine style={{ display: 'none' }} /> Academic Tree</button>
          <button className={activeTab === 'faculty' ? 'active' : ''} onClick={() => setActiveTab('faculty')}><RiAddLine style={{ display: 'none' }} /> Faculty Directory</button>
        </nav>
      </header>

      <div className="admin-grid-layout" style={{ paddingTop: '24px' }}>

        {/* --- ACADEMIC TREE TAB --- */}
        {activeTab === 'tree' && (
          <>
            {/* COMMAND COLUMN - HIDDEN WHEN LOCKED */}
            {isEditing && (
              <div className="admin-forms-column slide-in-left">
                <section className="settings-card security-module">
                  <h3><RiAddLine /> Initialize New Batch</h3>
                  <div className="settings-row-vertical">
                    <div className="input-split-row">
                      <div className="input-group">
                        <label>Start Year</label>
                        <input type="number" placeholder="YYYY" value={batchStart} onChange={e => setBatchStart(e.target.value)} className="mac-input" />
                      </div>
                      <div className="input-group">
                        <label>End Year</label>
                        <input type="number" placeholder="YYYY" value={batchEnd} onChange={e => setBatchEnd(e.target.value)} className="mac-input" />
                      </div>
                    </div>
                    <button onClick={handleCreateBatch} className="btn-save-master" style={{ justifyContent: 'center', marginTop: '10px' }}>Create Batch</button>
                  </div>
                </section>

                <section className="settings-card security-module">
                  <h3><RiAddLine /> Map Sections</h3>
                  <div className="settings-row-vertical" style={{ gap: '20px' }}>
                    <div className="input-group">
                      <label>Target Batch</label>
                      <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} className="mac-input">
                        <option value="">Select Batch</option>
                        {Object.keys(hierarchy).map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>

                    <div className="input-split-row">
                      <div className="input-group">
                        <label>Department</label>
                        <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="mac-input">
                          <option value="">Select Dept</option>
                          {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Section Name</label>
                        <input type="text" placeholder="e.g. A" value={newSection} onChange={e => setNewSection(e.target.value)} className="mac-input" />
                      </div>
                    </div>

                    <button onClick={handleAddSection} className="btn-save-master" style={{ justifyContent: 'center', marginTop: '10px' }}>Add Map</button>
                  </div>
                </section>
              </div>
            )}

            {/* DATA COLUMN - TREE VIEW OR FLAT LIST EDITOR */}
            <div className={`admin-tree-column settings-card ${isEditing ? '' : 'full-width'}`}>
              {!isEditing && (
                <div className="tree-viewport">
                  <div className="read-only-banner">
                    <RiInformationLine size={18} />
                    Read-Only View. Enable Edit Mode to make changes.
                  </div>

                  {Object.keys(hierarchy).sort().reverse().map(batch => (
                    <div key={batch} className="tree-batch-node">
                      <div className="tree-node-container">
                        <div className="node-label batch">
                          <span>Batch {batch}</span>
                        </div>
                      </div>

                      <div className="tree-dept-list">
                        {Object.keys(hierarchy[batch]).map(dept => dept !== 'initialized' && (
                          <div key={dept} className="tree-dept-node">
                            <div className="tree-node-container">
                              <div className="node-label dept">
                                <span>{dept}</span>
                              </div>
                            </div>

                            <div className="tree-section-grid">
                              {Array.isArray(hierarchy[batch][dept]) && hierarchy[batch][dept].map(sec => (
                                <div key={sec} className="tree-sec-pill-wrapper">
                                  <div className="tree-node-container">
                                    <div className="node-label sec">
                                      <span>{sec}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isEditing && (
                <div className="flat-editor-viewport animate-fade-in">
                  <h2 className="editor-section-title">Batches</h2>
                  <div className="flat-editor-list">
                    {Object.keys(hierarchy).sort().reverse().map(batch => (
                      <div key={`batch-${batch}`} className="editor-list-item">
                        <div className="list-item-content">
                          <span className="item-badge batch-badge">Batch</span>
                          {editingBatch?.oldVal === batch ? (
                            <input value={editingBatch.newVal} onChange={e => setEditingBatch({ ...editingBatch, newVal: e.target.value })} autoFocus className="mac-input inline-edit-input wide" />
                          ) : (
                            <span className="item-text">{batch}</span>
                          )}
                        </div>
                        <div className="node-actions">
                          {editingBatch?.oldVal === batch ? (
                            <>
                              <button className="labeled-btn save" onClick={handleUpdateBatch}><RiSave3Line /> Save</button>
                              <button className="labeled-btn danger" onClick={() => handleDeleteBatch(batch)}><RiDeleteBinLine /> Delete</button>
                              <button className="labeled-btn cancel" onClick={() => setEditingBatch(null)}><RiCloseLine /> Cancel</button>
                            </>
                          ) : (
                            <button className="labeled-btn edit" onClick={() => setEditingBatch({ oldVal: batch, newVal: batch })}><RiEditLine /> Edit</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <h2 className="editor-section-title mt-4">Departments</h2>
                  {Object.keys(hierarchy).sort().reverse().map(batch => {
                    const depts = Object.keys(hierarchy[batch]).filter(d => d !== 'initialized');
                    if (depts.length === 0) return null;
                    return (
                      <div key={`deptgroup-${batch}`} className="editor-group">
                        <p className="editor-group-label">{batch}</p>
                        <div className="flat-editor-list">
                          {depts.map(dept => (
                            <div key={`dept-${batch}-${dept}`} className="editor-list-item">
                              <div className="list-item-content">
                                <span className="item-badge dept-badge">Dept</span>
                                {editingDept?.oldVal === dept && editingDept?.batch === batch ? (
                                  <input value={editingDept.newVal} onChange={e => setEditingDept({ ...editingDept, newVal: e.target.value })} autoFocus className="mac-input inline-edit-input wide" />
                                ) : (
                                  <span className="item-text">{dept}</span>
                                )}
                              </div>
                              <div className="node-actions">
                                {editingDept?.oldVal === dept && editingDept?.batch === batch ? (
                                  <>
                                    <button className="labeled-btn save" onClick={handleUpdateDept}><RiSave3Line /> Save</button>
                                    <button className="labeled-btn danger" onClick={() => handleDeleteDept(batch, dept)}><RiDeleteBinLine /> Delete</button>
                                    <button className="labeled-btn cancel" onClick={() => setEditingDept(null)}><RiCloseLine /> Cancel</button>
                                  </>
                                ) : (
                                  <button className="labeled-btn edit" onClick={() => setEditingDept({ batch, oldVal: dept, newVal: dept })}><RiEditLine /> Edit</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <h2 className="editor-section-title mt-4">Sections</h2>
                  {Object.keys(hierarchy).sort().reverse().map(batch =>
                    Object.keys(hierarchy[batch]).map(dept => {
                      if (dept === 'initialized') return null;
                      const secs = Array.isArray(hierarchy[batch][dept]) ? hierarchy[batch][dept] : [];
                      if (secs.length === 0) return null;
                      return (
                        <div key={`secgroup-${batch}-${dept}`} className="editor-group">
                          <p className="editor-group-label">{batch} — {dept}</p>
                          <div className="flat-editor-list">
                            {secs.map(sec => (
                              <div key={`sec-${batch}-${dept}-${sec}`} className="editor-list-item">
                                <div className="list-item-content">
                                  <span className="item-badge sec-badge">Sec</span>
                                  {editingSec?.oldVal === sec && editingSec?.dept === dept && editingSec?.batch === batch ? (
                                    <input value={editingSec.newVal} onChange={e => setEditingSec({ ...editingSec, newVal: e.target.value })} autoFocus className="mac-input inline-edit-input thin" />
                                  ) : (
                                    <span className="item-text">{sec}</span>
                                  )}
                                </div>
                                <div className="node-actions">
                                  {editingSec?.oldVal === sec && editingSec?.dept === dept && editingSec?.batch === batch ? (
                                    <>
                                      <button className="labeled-btn save" onClick={handleUpdateSection}><RiSave3Line /> Save</button>
                                      <button className="labeled-btn danger" onClick={() => handleDeleteSection(batch, dept, sec)}><RiDeleteBinLine /> Delete</button>
                                      <button className="labeled-btn cancel" onClick={() => setEditingSec(null)}><RiCloseLine /> Cancel</button>
                                    </>
                                  ) : (
                                    <button className="labeled-btn edit" onClick={() => setEditingSec({ batch, dept, oldVal: sec, newVal: sec })}><RiEditLine /> Edit</button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* --- FACULTY DIRECTORY TAB --- */}
        {activeTab === 'faculty' && (
          <div className="faculty-directory-grid" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* MIGRATION BANNER */}
            <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '14px', color: '#fff', marginBottom: '4px' }}>📋 Import Old Faculty Data</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                  {migrationStatus || 'Scan all existing schedules and auto-populate the Faculty Directory for each department.'}
                </p>
              </div>
              <button
                className="btn-add"
                onClick={runFacultyMigration}
                disabled={migrationStatus.startsWith('Reading') || migrationStatus.startsWith('Extracting') || migrationStatus.startsWith('Writing')}
                style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {migrationStatus.startsWith('✅') ? '↻ Run Again' : '⚡ Migrate Now'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>

              {/* LEFT: DEPT SELECTOR */}
              <div className="settings-card slide-in-left" style={{ width: '320px', flexShrink: 0 }}>
                <h3><RiInformationLine /> Target Department</h3>
                <p style={{ color: 'var(--mac-text-muted)', fontSize: '13px', marginBottom: '16px' }}>Select a department to manage its globally available faculty members.</p>
                <div className="settings-row-vertical">
                  <select
                    value={targetFacultyDept}
                    onChange={e => setTargetFacultyDept(e.target.value)}
                    className="mac-input"
                  >
                    <option value="">-- Choose Department --</option>
                    {mergedDepartments.map(d => (
                      <option key={d} value={d}>
                        {d}{!departmentsList.includes(d) ? ' (Faculty Only)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mac-text)', marginBottom: '8px' }}><RiAddLine style={{ verticalAlign: 'middle' }} /> Add Faculty-Only Dept</p>
                  <p style={{ color: 'var(--mac-text-muted)', fontSize: '11px', marginBottom: '10px' }}>For departments like S&H that don't have batches/sections.</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className="mac-input"
                      placeholder="e.g. S&H"
                      value={newFacultyDept}
                      onChange={e => setNewFacultyDept(e.target.value.toUpperCase())}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newFacultyDept.trim()) {
                          const deptName = newFacultyDept.trim();
                          if (mergedDepartments.includes(deptName)) return alert('Department already exists!');
                          set(ref(db, `faculties_directory/${deptName}`), []);
                          setNewFacultyDept('');
                          setTargetFacultyDept(deptName);
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn-add-mini"
                      onClick={() => {
                        if (!newFacultyDept.trim()) return;
                        const deptName = newFacultyDept.trim();
                        if (mergedDepartments.includes(deptName)) return alert('Department already exists!');
                        set(ref(db, `faculties_directory/${deptName}`), []);
                        setNewFacultyDept('');
                        setTargetFacultyDept(deptName);
                      }}
                    ><RiAddLine /></button>
                  </div>
                </div>
              </div>

              {/* RIGHT: DIRECTORY MANAGER */}
              <div className="flat-editor-viewport animate-fade-in" style={{ flex: 1, background: 'var(--mac-card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
                <h2 className="editor-section-title">Global Faculty Roster</h2>

                {!targetFacultyDept ? (
                  <div className="empty-state" style={{ marginTop: '40px' }}>
                    <RiInformationLine size={24} style={{ opacity: 0.5, marginBottom: '12px' }} />
                    <p>Please select a Target Department on the left to begin.</p>
                  </div>
                ) : (
                  <>
                    <div className="add-item-bar inline" style={{ marginBottom: '24px', background: 'var(--mac-blue-15)', border: 'none', gap: '8px' }}>
                      <select
                        className="mac-input"
                        value={targetFacultyRole}
                        onChange={e => setTargetFacultyRole(e.target.value)}
                        style={{ flexShrink: 0, width: '150px' }}
                      >
                        {targetFacultyDept === 'Leadership' ? (
                          <>
                            <option value="Principal">Principal</option>
                            <option value="Dean">Dean</option>
                          </>
                        ) : (
                          <>
                            <option value="HOD">HOD</option>
                            <option value="Academic Coordinator">Academic Coordinator</option>
                            <option value="Faculty">Faculty</option>
                          </>
                        )}
                      </select>
                      <input
                        type="text"
                        placeholder="e.g. Dr. A. Smith"
                        value={newFacultyName}
                        onChange={(e) => setNewFacultyName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddFaculty()}
                        style={{ flex: 1 }}
                      />
                      <button className="btn-add-mini" onClick={handleAddFaculty}>
                        <RiAddLine /> Add Faculty
                      </button>
                    </div>

                    <div className="counselor-items-v2">
                      {facultyList.length === 0 ? (
                        <div className="empty-state">No faculties found for {targetFacultyDept}. Add some above.</div>
                      ) : (
                        facultyList.map((f, i) => (
                          <div key={i} className={`counselor-item-row ${editingFacultyIdx === i ? 'editing' : ''}`}>
                            {editingFacultyIdx === i ? (
                              <div className="inline-edit-pill-wrap">
                                <select
                                  className="mac-input"
                                  value={tempFacultyRole}
                                  onChange={e => setTempFacultyRole(e.target.value)}
                                  style={{ flexShrink: 0, width: '120px', padding: '4px 8px', fontSize: '13px' }}
                                >
                                  {targetFacultyDept === 'Leadership' ? (
                                    <>
                                      <option value="Principal">Principal</option>
                                      <option value="Dean">Dean</option>
                                    </>
                                  ) : (
                                    <>
                                      <option value="HOD">HOD</option>
                                      <option value="Academic Coordinator">Academic Coordinator</option>
                                      <option value="Faculty">Faculty</option>
                                    </>
                                  )}
                                </select>
                                <input
                                  autoFocus
                                  value={tempFacultyName}
                                  onChange={(e) => setTempFacultyName(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleUpdateFaculty()}
                                  style={{ flex: 1 }}
                                />
                                <div className="edit-pill-actions">
                                  <button className="action-btn action-edit" onClick={handleUpdateFaculty}><RiCheckLine /> <span className="action-label">Save</span></button>
                                  <button className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--mac-text)' }} onClick={() => setEditingFacultyIdx(null)}><RiCloseLine /> <span className="action-label">Cancel</span></button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="counselor-name-chip" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: f.role === 'HOD' ? 'rgba(255, 69, 58, 0.15)' :
                                      f.role === 'Principal' || f.role === 'Dean' ? 'rgba(48, 209, 88, 0.15)' :
                                        f.role === 'Academic Coordinator' ? 'rgba(10, 132, 255, 0.15)' :
                                          'rgba(255,255,255,0.1)',
                                    color: f.role === 'HOD' ? 'rgb(255, 105, 97)' :
                                      f.role === 'Principal' || f.role === 'Dean' ? 'rgb(48, 209, 88)' :
                                        f.role === 'Academic Coordinator' ? 'rgb(10, 132, 255)' :
                                          'var(--mac-text-muted)',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {f.role || 'Faculty'}
                                  </span>
                                  <strong style={{ color: 'var(--mac-text)' }}>{f.name || f}</strong>
                                  {movingFacultyIdx === i && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
                                      <select
                                        className="mac-input"
                                        style={{ padding: '4px 8px', fontSize: '12px', minWidth: '120px' }}
                                        value={moveToDept}
                                        onChange={e => setMoveToDept(e.target.value)}
                                      >
                                        <option value="">Move to...</option>
                                        {mergedDepartments.filter(d => d !== targetFacultyDept).map(d => (
                                          <option key={d} value={d}>{d}</option>
                                        ))}
                                      </select>
                                      <button className="btn-add-mini" onClick={() => handleMoveFaculty(i)}><RiCheckLine /></button>
                                      <button className="btn-add-mini" style={{ background: 'transparent', color: 'var(--mac-text)' }} onClick={() => setMovingFacultyIdx(null)}><RiCloseLine /></button>
                                    </div>
                                  )}
                                </div>
                                <div className="counselor-row-actions">
                                  {movingFacultyIdx !== i && (
                                    <>
                                      <button className="action-btn action-edit" onClick={() => { setMovingFacultyIdx(i); setMoveToDept(""); }}>
                                        <span className="action-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Move</span>
                                      </button>
                                      <button className="action-btn action-edit" onClick={() => { setEditingFacultyIdx(i); setTempFacultyName(f.name || f); setTempFacultyRole(f.role || 'Faculty'); }}>
                                        <RiEditLine /> <span className="action-label">Edit</span>
                                      </button>
                                      <button className="action-btn action-delete" onClick={() => handleDeleteFaculty(i)}>
                                        <RiDeleteBin6Line />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StructureManager;
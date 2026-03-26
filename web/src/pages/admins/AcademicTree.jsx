import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, get, update } from "firebase/database";
import {
  RiAddLine, RiDeleteBin6Line, RiEditLine, RiCloseLine,
  RiSave3Line, RiGlobalLine, RiBookOpenLine,
  RiTeamLine, RiLayoutGridLine, RiDeleteBin6Fill,
  RiCalendarLine
} from 'react-icons/ri';

import "../../styles/admin-settings.css";

const AcademicTree = ({ isMobile }) => {
  const [activeTab, setActiveTab] = useState('hierarchy');

  // --- DATA ---
  const [departmentsList, setDepartmentsList] = useState([]);
  const [hierarchy, setHierarchy] = useState({});

  // Form State
  const [newDeptCode, setNewDeptCode] = useState("");
  const [batchStart, setBatchStart] = useState("");
  const [batchEnd, setBatchEnd] = useState("");
  const [secBatch, setSecBatch] = useState("");
  const [secDept, setSecDept] = useState("");
  const [newSection, setNewSection] = useState("");

  // Editing State
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingGlobalDept, setEditingGlobalDept] = useState(null);
  const [editGlobalDeptVal, setEditGlobalDeptVal] = useState("");
  const [editingSec, setEditingSec] = useState(null);

  // --- BULK EDIT STATE ---
  const [isBatchEditMode, setIsBatchEditMode] = useState(false);
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false);
  const [selectedBatches, setSelectedBatches] = useState([]);

  const [isDeptEditMode, setIsDeptEditMode] = useState(false);
  const [isDeptDeleteMode, setIsDeptDeleteMode] = useState(false);
  const [selectedDepts, setSelectedDepts] = useState([]);

  const [isSecEditMode, setIsSecEditMode] = useState(false);
  const [isSecDeleteMode, setIsSecDeleteMode] = useState(false);
  const [selectedSecs, setSelectedSecs] = useState([]);

  // --- FIREBASE ---
  useEffect(() => {
    const unsubH = onValue(ref(db, 'academic_hierarchy'), snap => setHierarchy(snap.exists() ? snap.val() : {}));
    const unsubD = onValue(ref(db, 'departments'), snap => {
      if (snap.exists()) setDepartmentsList(snap.val());
      else { const d = ["ECE", "IT", "CSE", "CSBS", "AIML"]; setDepartmentsList(d); set(ref(db, 'departments'), d); }
    });
    return () => { unsubH(); unsubD(); };
  }, []);

  // --- MIGRATION ENGINE ---
  const runGlobalMigration = async (type, oldPath, newPath, oldVal, newVal) => {
    const updates = {};
    const schedSnap = await get(ref(db, `schedules/${oldPath}`));
    if (schedSnap.exists()) { updates[`schedules/${newPath}`] = schedSnap.val(); updates[`schedules/${oldPath}`] = null; }
    const usersSnap = await get(ref(db, 'users'));
    if (usersSnap.exists()) {
      Object.entries(usersSnap.val()).forEach(([uid, user]) => {
        if (type === 'batch' && user.batch === oldVal) updates[`users/${uid}/batch`] = newVal;
        if (type === 'dept' && user.batch === oldPath.split('/')[0] && user.department === oldVal) updates[`users/${uid}/department`] = newVal;
        if (type === 'sec' && user.batch === oldPath.split('/')[0] && user.department === oldPath.split('/')[1] && user.section === oldVal) updates[`users/${uid}/section`] = newVal;
      });
    }
    const hrData = await get(ref(db, `academic_hierarchy/${oldPath}`));
    updates[`academic_hierarchy/${newPath}`] = hrData.val();
    updates[`academic_hierarchy/${oldPath}`] = null;
    await update(ref(db), updates);
  };

  // --- BATCH CRUD ---
  const handleCreateBatch = async () => {
    if (!batchStart || !batchEnd) return alert("Please enter both years");
    await set(ref(db, `academic_hierarchy/${batchStart}-${batchEnd}`), { initialized: true });
    setBatchStart(""); setBatchEnd("");
  };

  const handleUpdateBatch = async () => {
    const { oldVal, newVal } = editingBatch;
    const v = newVal.trim();
    if (!v || oldVal === v) return setEditingBatch(null);
    if (hierarchy[v]) return alert("Batch already exists!");
    if (window.confirm(`Rename batch to "${v}"?`)) {
      try { await runGlobalMigration('batch', oldVal, v, oldVal, v); setEditingBatch(null); }
      catch (err) { alert(err.message); }
    }
  };

  const handleDeleteBatch = async (batch) => {
    const depts = Object.keys(hierarchy[batch] || {}).filter(k => k !== 'initialized');
    if (depts.length > 0) return alert(`Cannot delete — ${batch} still has ${depts.length} department(s).`);
    if (window.confirm(`Permanently delete empty Batch ${batch}?`)) {
      await update(ref(db), { [`academic_hierarchy/${batch}`]: null, [`schedules/${batch}`]: null });
    }
  };

  const handleToggleBatchSelect = (batch) => setSelectedBatches(p => p.includes(batch) ? p.filter(b => b !== batch) : [...p, batch]);
  const handleSelectAllBatches = (allBatches) => setSelectedBatches(selectedBatches.length === allBatches.length ? [] : allBatches);
  const handleBulkDeleteBatches = async () => {
    if (selectedBatches.length === 0) return;
    const nonDeletable = selectedBatches.filter(b => Object.keys(hierarchy[b] || {}).filter(k => k !== 'initialized').length > 0);
    if (nonDeletable.length > 0) return alert(`Cannot delete ${nonDeletable.length} batch(es) because they still contain departments.`);
    if (window.confirm(`Permanently delete ${selectedBatches.length} empty Batches?`)) {
      const updates = {};
      selectedBatches.forEach(b => { updates[`academic_hierarchy/${b}`] = null; updates[`schedules/${b}`] = null; });
      await update(ref(db), updates);
      setSelectedBatches([]); setIsBatchDeleteMode(false);
    }
  };

  // --- GLOBAL DEPARTMENT CRUD ---
  const handleAddDepartment = async () => {
    if (!newDeptCode) return alert("Enter a department code");
    const code = newDeptCode.toUpperCase().trim();
    if (departmentsList.includes(code)) return alert("Already exists.");
    await set(ref(db, 'departments'), [...departmentsList, code].sort());
    setNewDeptCode("");
  };

  const handleUpdateGlobalDept = async (oldVal, newVal) => {
    const v = newVal.toUpperCase().trim();
    if (!v || oldVal === v) return;
    if (departmentsList.includes(v)) return alert("Code already exists!");
    if (!window.confirm(`Globally rename "${oldVal}" → "${v}"?\n\nThis updates all schedules, faculty, users, events, and courses.`)) return;
    try {
      const updates = {};
      updates['departments'] = departmentsList.map(d => d === oldVal ? v : d).sort();
      for (const node of ['academic_hierarchy', 'schedules', 'events', 'courses']) {
        const snap = await get(ref(db, node));
        if (snap.exists()) Object.keys(snap.val()).forEach(batch => {
          if (snap.val()[batch]?.[oldVal]) {
            updates[`${node}/${batch}/${v}`] = snap.val()[batch][oldVal];
            updates[`${node}/${batch}/${oldVal}`] = null;
          }
        });
      }
      const facSnap = await get(ref(db, `faculties_directory/${oldVal}`));
      if (facSnap.exists()) { updates[`faculties_directory/${v}`] = facSnap.val(); updates[`faculties_directory/${oldVal}`] = null; }
      const usersSnap = await get(ref(db, 'users'));
      if (usersSnap.exists()) Object.entries(usersSnap.val()).forEach(([uid, u]) => {
        if (u.department === oldVal) updates[`users/${uid}/department`] = v;
      });
      await update(ref(db), updates);
      alert(`Migrated ${oldVal} → ${v} globally!`);
    } catch (err) { alert("Migration failed: " + err.message); }
  };

  const handleDeleteGlobalDept = async (dept) => {
    let isUsed = false;
    Object.values(hierarchy).forEach(b => { if (b?.[dept] && Object.keys(b[dept]).filter(k => k !== 'initialized').length > 0) isUsed = true; });
    if (isUsed) return alert(`Cannot delete "${dept}" — it's mapped in the hierarchy.`);
    if (window.confirm(`Remove "${dept}" from the Global Registry?`))
      await set(ref(db, 'departments'), departmentsList.filter(d => d !== dept));
  };

  const handleToggleDeptSelect = (dept) => setSelectedDepts(p => p.includes(dept) ? p.filter(d => d !== dept) : [...p, dept]);
  const handleSelectAllDepts = (allDepts) => setSelectedDepts(selectedDepts.length === allDepts.length ? [] : allDepts);
  const handleBulkDeleteDepts = async () => {
    if (selectedDepts.length === 0) return;
    const usedDepts = selectedDepts.filter(dept => {
      let used = false;
      Object.values(hierarchy).forEach(b => { if (b?.[dept] && Object.keys(b[dept]).filter(k => k !== 'initialized').length > 0) used = true; });
      return used;
    });
    if (usedDepts.length > 0) return alert(`Cannot delete ${usedDepts.length} department(s) because they are mapped in the hierarchy.`);
    if (window.confirm(`Remove ${selectedDepts.length} unused departments from the Global Registry?`)) {
      await set(ref(db, 'departments'), departmentsList.filter(d => !selectedDepts.includes(d)));
      setSelectedDepts([]); setIsDeptDeleteMode(false);
    }
  };

  // --- SECTION CRUD ---
  const handleAddSection = async () => {
    if (!secBatch || !secDept || !newSection) return alert("Complete all fields.");
    const sec = newSection.toUpperCase().trim();
    const cur = hierarchy[secBatch]?.[secDept] || [];
    await set(ref(db, `academic_hierarchy/${secBatch}/${secDept}`), [...cur, sec].sort());
    setNewSection("");
  };

  const handleUpdateSection = async () => {
    const { batch, dept, oldVal, newVal } = editingSec;
    const v = newVal.toUpperCase().trim();
    if (!v || oldVal === v) return setEditingSec(null);
    if (window.confirm(`Rename Section "${oldVal}" → "${v}"?`)) {
      try {
        const updates = {};
        updates[`academic_hierarchy/${batch}/${dept}`] = hierarchy[batch][dept].map(s => s === oldVal ? v : s);
        const schedSnap = await get(ref(db, `schedules/${batch}/${dept}/${oldVal}`));
        if (schedSnap.exists()) { updates[`schedules/${batch}/${dept}/${v}`] = schedSnap.val(); updates[`schedules/${batch}/${dept}/${oldVal}`] = null; }
        const usersSnap = await get(ref(db, 'users'));
        if (usersSnap.exists()) Object.entries(usersSnap.val()).forEach(([uid, u]) => {
          if (u.batch === batch && u.department === dept && u.section === oldVal) updates[`users/${uid}/section`] = v;
        });
        await update(ref(db), updates);
        setEditingSec(null);
      } catch (err) { alert(err.message); }
    }
  };

  const handleDeleteSection = async (batch, dept, sec) => {
    if (window.confirm(`Delete Section ${sec}?`)) {
      await update(ref(db), {
        [`academic_hierarchy/${batch}/${dept}`]: hierarchy[batch][dept].filter(s => s !== sec),
        [`schedules/${batch}/${dept}/${sec}`]: null,
      });
    }
  };

  const handleToggleSecSelect = (secKey) => setSelectedSecs(p => p.includes(secKey) ? p.filter(s => s !== secKey) : [...p, secKey]);
  const handleSelectAllSecs = (allSecKeys) => setSelectedSecs(selectedSecs.length === allSecKeys.length ? [] : allSecKeys);
  const handleBulkDeleteSecs = async (allSectionsList) => {
    if (selectedSecs.length === 0) return;
    if (window.confirm(`Delete ${selectedSecs.length} assigned sections?`)) {
      const updates = {};
      
      // Group selections by paths to update hierarchy structure appropriately
      const selectionsMap = {};
      selectedSecs.forEach(secKey => {
        const item = allSectionsList.find(s => `${s.batch}-${s.dept}-${s.sec}` === secKey);
        if(item) {
           if(!selectionsMap[`${item.batch}/${item.dept}`]) selectionsMap[`${item.batch}/${item.dept}`] = [];
           selectionsMap[`${item.batch}/${item.dept}`].push(item.sec);
           updates[`schedules/${item.batch}/${item.dept}/${item.sec}`] = null;
        }
      });

      Object.keys(selectionsMap).forEach(hierPath => {
         const [b, d] = hierPath.split('/');
         const currentList = hierarchy[b][d] || [];
         const toRemove = selectionsMap[hierPath];
         updates[`academic_hierarchy/${b}/${d}`] = currentList.filter(s => !toRemove.includes(s));
      });

      await update(ref(db), updates);
      setSelectedSecs([]); setIsSecDeleteMode(false);
    }
  };

  // --- COMPUTED: sections for selected batch+dept ---
  const filteredSections = (secBatch && secDept && Array.isArray(hierarchy[secBatch]?.[secDept]))
    ? hierarchy[secBatch][secDept] : [];

  return (
    <div className="admin-subpage animate-fade-in central-schedule-manager">
      <div className="schedule-editor-workspace">
        <nav className="editor-tabs" style={{ marginBottom: '24px' }}>
          <button className={activeTab === 'hierarchy' ? 'active' : ''} onClick={() => setActiveTab('hierarchy')}>{isMobile ? 'Tree' : 'Hierarchy'}</button>
          <button className={activeTab === 'batches' ? 'active' : ''} onClick={() => setActiveTab('batches')}>Batches</button>
          <button className={activeTab === 'departments' ? 'active' : ''} onClick={() => setActiveTab('departments')}>{isMobile ? 'Depts' : 'Departments'}</button>
          <button className={activeTab === 'sections' ? 'active' : ''} onClick={() => setActiveTab('sections')}>{isMobile ? 'Secs' : 'Sections'}</button>
        </nav>

        <div className="tab-content-area" style={{ paddingTop: 0 }}>

          {/* ==================== 1. HIERARCHY (TREE VIEW) ==================== */}
          {activeTab === 'hierarchy' && (
            <div className="course-manager">
              <div style={{ marginBottom: '24px' }}>
                <h2 className="section-title-premium" style={{ margin: 0 }}>Live Structure</h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--mac-text-secondary)' }}>Read-only tree view of all batches, departments and sections.</p>
              </div>

              {Object.keys(hierarchy).length === 0 && (
                <div className="settings-card empty-card-wrap">
                  <div className="empty-placeholder"><RiBookOpenLine /><p>No batches yet. Go to the Batches tab to create one.</p></div>
                </div>
              )}

              {Object.keys(hierarchy).sort().reverse().map(batch => {
                const batchData = hierarchy[batch] || {};
                const depts = Object.keys(batchData).filter(k => k !== 'initialized');
                return (
                  <div key={batch} className="settings-card" style={{ marginBottom: '16px', padding: '20px 24px', borderRadius: '20px' }}>
                    {/* BATCH NODE */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '10px 20px', borderRadius: '50px',
                        background: 'rgba(10,132,255,0.1)', color: 'var(--mac-blue)', fontWeight: 700, fontSize: '15px'
                      }}>Batch {batch}</span>
                    </div>

                    {/* DEPT BRANCH */}
                    {depts.length > 0 && (
                      <div style={{
                        marginLeft: '15px', paddingLeft: '25px',
                        borderLeft: '1.5px solid var(--mac-divider)',
                        display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px'
                      }}>
                        {depts.map(dept => {
                          const sections = Array.isArray(batchData[dept]) ? batchData[dept] : [];
                          return (
                            <div key={dept} style={{ position: 'relative' }}>
                              {/* Horizontal connector */}
                              <div style={{
                                position: 'absolute', left: '-26.5px', top: '18px',
                                width: '25px', height: '1.5px', background: 'var(--mac-divider)'
                              }} />

                              {/* DEPT NODE */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '10px 20px', borderRadius: '50px',
                                  background: 'var(--mac-bg-secondary)', border: '1px solid var(--mac-divider)',
                                  fontWeight: 700, fontSize: '13px', color: 'var(--mac-text)'
                                }}>{dept}</span>
                              </div>

                              {/* SECTION BRANCH */}
                              {sections.length > 0 && (
                                <div style={{
                                  marginLeft: '20px', paddingLeft: '25px',
                                  borderLeft: '1.5px solid var(--mac-divider)',
                                  display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px'
                                }}>
                                  {sections.map(sec => (
                                    <div key={sec} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                      {/* Horizontal connector */}
                                      <div style={{
                                        position: 'absolute', left: '-26.5px', top: '50%',
                                        width: '25px', height: '1.5px', background: 'var(--mac-divider)'
                                      }} />
                                      <span style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '8px 18px', borderRadius: '50px',
                                        background: 'var(--mac-bg-secondary)', border: '1px solid var(--mac-divider)',
                                        fontWeight: 600, fontSize: '13px', color: 'var(--mac-text)'
                                      }}>{sec}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ==================== 2. BATCHES ==================== */}
          {activeTab === 'batches' && (
            <div className="course-manager">
              <div className="master-header-row animate-fade-in" style={{ marginBottom: '16px', minHeight: 'auto', justifyContent: 'flex-end', paddingRight: 0, paddingLeft: 0 }}>
                <div className="header-actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
                  {isBatchEditMode ? (
                    <div className="master-header-row" style={{ display: 'flex', gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
                      <button className="role-header-pill secondary" onClick={() => { setSelectedBatches([]); setIsBatchDeleteMode(false); setIsBatchEditMode(false); setEditingBatch(null); }} style={{ minWidth: '90px' }}>Cancel</button>
                      <button className="role-header-pill active" onClick={() => { setSelectedBatches([]); setIsBatchDeleteMode(false); setIsBatchEditMode(false); setEditingBatch(null); }} style={{ minWidth: '90px' }}>Done</button>
                    </div>
                  ) : (
                    <button className="edit-list-btn" onClick={() => setIsBatchEditMode(true)}><RiEditLine style={{ marginRight: '6px' }} /> Edit List</button>
                  )}
                </div>
              </div>

              {isBatchEditMode && (
              <div className="master-add-card-premium animate-slide-down" style={{ marginBottom: '24px' }}>
                <div className="add-card-title-row"><span>Create New Batch</span></div>
                <div className="add-card-grid">
                  <div className="add-input-section grow">
                    <label className="add-input-label">START YEAR</label>
                    <input className="premium-add-input" placeholder="YYYY" type="number" value={batchStart} onChange={e => setBatchStart(e.target.value)} />
                  </div>
                  <div className="add-input-section grow">
                    <label className="add-input-label">END YEAR</label>
                    <input className="premium-add-input" placeholder="YYYY" type="number" value={batchEnd} onChange={e => setBatchEnd(e.target.value)} />
                  </div>
                </div>
                {isMobile ? (
                  <button className="premium-add-submit-btn" style={{ marginTop: '16px' }} onClick={handleCreateBatch}>Create Batch</button>
                ) : (
                  <button className="premium-add-submit-btn" onClick={handleCreateBatch}><RiAddLine /> Create Batch</button>
                )}
              </div>
              )}

              <div className="master-items-container individual-cards" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                {Object.keys(hierarchy).sort().reverse().map(batch => {
                  const deptCount = Object.keys(hierarchy[batch] || {}).filter(k => k !== 'initialized').length;
                  return (
                    <div key={batch} className={`settings-card master-item-card ${editingBatch?.oldVal === batch ? 'editing' : ''}`}>
                      {editingBatch?.oldVal === batch ? (
                        <div className="pill-edit-row">
                          <div className="edit-item-fields">
                            <div className="edit-item-fields-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', width: '100%' }}>
                              <div className="edit-field">
                                <label className="edit-label">START YEAR</label>
                                <input 
                                  autoFocus 
                                  type="number"
                                  className="edit-input-field" 
                                  value={editingBatch.startYear || ''} 
                                  onChange={e => setEditingBatch({ ...editingBatch, startYear: e.target.value })} 
                                />
                              </div>
                              <div className="edit-field">
                                <label className="edit-label">END YEAR</label>
                                <input 
                                  type="number"
                                  className="edit-input-field" 
                                  value={editingBatch.endYear || ''} 
                                  onChange={e => setEditingBatch({ ...editingBatch, endYear: e.target.value })} 
                                />
                              </div>
                            </div>
                          </div>
                          <div className="pill-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingBatch(null)}>Cancel</button>
                            <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                                const newStart = (editingBatch.startYear || '').toString().trim();
                                const newEnd = (editingBatch.endYear || '').toString().trim();
                                if (!newStart || !newEnd) return alert("Please enter both years");
                                handleUpdateBatch();
                              }}> Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="item-content" style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '4px 0' }}>
                            {isBatchDeleteMode && (
                              <input type="checkbox" className="mac-checkbox" checked={selectedBatches.includes(batch)} onChange={() => handleToggleBatchSelect(batch)} />
                            )}
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,149,0,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              <RiCalendarLine style={{ fontSize: '20px', color: '#ff9500' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--mac-text)', letterSpacing: '-0.3px' }}>{batch}</div>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--mac-text-secondary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>{deptCount} Department{deptCount !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          {isBatchEditMode && (
                            <button 
                              className="pill-inline-edit" 
                              onClick={() => {
                                const parts = batch.split('-');
                                setEditingBatch({ 
                                  oldVal: batch, 
                                  startYear: parts[0] || '', 
                                  endYear: parts[1] || '' 
                                });
                              }}
                            >
                              <RiEditLine />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                {Object.keys(hierarchy).length === 0 && (
                  <div className="settings-card empty-card-wrap"><div className="empty-placeholder"><RiBookOpenLine /><p>No batches created yet.</p></div></div>
                )}
              </div>

              {isBatchEditMode && (
                <div className={`bulk-action-footer-premium animate-slide-up ${isBatchDeleteMode ? 'danger-mode' : ''}`}>
                  {isBatchDeleteMode ? (
                    <div className="bulk-delete-action-row">
                      <div className="bulk-delete-info">
                        <div className="info-icon"><RiDeleteBin6Fill /></div>
                        <div className="bulk-delete-text">
                          <span className="bulk-delete-title">{selectedBatches.length === 0 ? "Select Items" : `${selectedBatches.length} Selected`}</span>
                          <span className="bulk-delete-desc">Choose batches to delete</span>
                        </div>
                      </div>
                      <div className="pill-group">
                        <button className="premium-pill-btn primary" onClick={() => handleSelectAllBatches(Object.keys(hierarchy))}>{selectedBatches.length === Object.keys(hierarchy).length && Object.keys(hierarchy).length > 0 ? 'Deselect All' : 'Select All'}</button>
                        <button className="premium-pill-btn secondary" onClick={() => { setSelectedBatches([]); setIsBatchDeleteMode(false); }}>Cancel</button>
                        <button className="premium-pill-btn danger" onClick={handleBulkDeleteBatches} disabled={selectedBatches.length === 0}>Delete</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bulk-delete-start-row">
                      <div className="bulk-delete-info">
                        <div className="info-icon"><RiTeamLine /></div>
                        <div className="bulk-delete-text">
                          <span className="bulk-delete-title">Manage Batches</span>
                          <span className="bulk-delete-desc">Select and remove empty batches</span>
                        </div>
                      </div>
                      <button className="premium-pill-btn danger" onClick={() => setIsBatchDeleteMode(true)}><RiDeleteBin6Fill /> Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== 3. DEPARTMENTS ==================== */}
          {activeTab === 'departments' && (
            <div className="course-manager">
              <div className="master-header-row animate-fade-in" style={{ marginBottom: '16px', minHeight: 'auto', justifyContent: 'flex-end', paddingRight: 0, paddingLeft: 0 }}>
                <div className="header-actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
                  {isDeptEditMode ? (
                    <div className="master-header-row" style={{ display: 'flex', gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
                      <button className="role-header-pill secondary" onClick={() => { setSelectedDepts([]); setIsDeptDeleteMode(false); setIsDeptEditMode(false); setEditingGlobalDept(null); }} style={{ minWidth: '90px' }}>Cancel</button>
                      <button className="role-header-pill active" onClick={() => { setSelectedDepts([]); setIsDeptDeleteMode(false); setIsDeptEditMode(false); setEditingGlobalDept(null); }} style={{ minWidth: '90px' }}>Done</button>
                    </div>
                  ) : (
                    <button className="edit-list-btn" onClick={() => setIsDeptEditMode(true)}><RiEditLine style={{ marginRight: '6px' }} /> Edit List</button>
                  )}
                </div>
              </div>

              {isDeptEditMode && (
              <div className="master-add-card-premium animate-slide-down" style={{ marginBottom: '24px' }}>
                <div className="add-card-title-row"><span>Register New Department</span></div>
                <div className="add-card-grid">
                  <div className="add-input-section grow">
                    <label className="add-input-label">DEPARTMENT CODE</label>
                    <input className="premium-add-input" placeholder="e.g. MECH" value={newDeptCode}
                      onChange={e => setNewDeptCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddDepartment()} />
                  </div>
                </div>
                {isMobile ? (
                  <button className="premium-add-submit-btn" style={{ marginTop: '16px' }} onClick={handleAddDepartment}>Add Department</button>
                ) : (
                  <button className="premium-add-submit-btn" onClick={handleAddDepartment}><RiAddLine /> Add Department</button>
                )}
              </div>
              )}

              <div className="master-items-container individual-cards" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                {departmentsList.map(dept => (
                  <div key={dept} className={`settings-card master-item-card ${editingGlobalDept === dept ? 'editing' : ''}`}>
                    {editingGlobalDept === dept ? (
                      <div className="pill-edit-row">
                        <div className="edit-item-fields">
                          <div className="edit-field">
                            <label className="edit-label">DEPARTMENT CODE</label>
                            <input autoFocus className="edit-input-field" value={editGlobalDeptVal}
                              onChange={e => setEditGlobalDeptVal(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') { const v = editGlobalDeptVal.toUpperCase().trim(); if (v && v !== dept) handleUpdateGlobalDept(dept, v); setEditingGlobalDept(null); } if (e.key === 'Escape') setEditingGlobalDept(null); }} />
                          </div>
                        </div>
                        <div className="pill-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                          <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingGlobalDept(null)}>Cancel</button>
                          <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                            const v = editGlobalDeptVal.toUpperCase().trim();
                            if (v && v !== dept) handleUpdateGlobalDept(dept, v);
                            setEditingGlobalDept(null);
                          }}> Save</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="item-content" style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '4px 0' }}>
                          {isDeptDeleteMode && (
                            <input type="checkbox" className="mac-checkbox" checked={selectedDepts.includes(dept)} onChange={() => handleToggleDeptSelect(dept)} />
                          )}
                          <div style={{
                            width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(10,132,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            <RiBookOpenLine style={{ fontSize: '20px', color: 'var(--mac-blue)' }} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--mac-text)', letterSpacing: '1px' }}>{dept}</div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--mac-text-secondary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>Department</div>
                          </div>
                        </div>
                        {isDeptEditMode && (
                          <button className="pill-inline-edit" onClick={() => { setEditingGlobalDept(dept); setEditGlobalDeptVal(dept); }}><RiEditLine /></button>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {departmentsList.length === 0 && (
                  <div className="settings-card empty-card-wrap"><div className="empty-placeholder"><RiBookOpenLine /><p>No departments registered.</p></div></div>
                )}
              </div>

              {isDeptEditMode && (
                <div className={`bulk-action-footer-premium animate-slide-up ${isDeptDeleteMode ? 'danger-mode' : ''}`}>
                  {isDeptDeleteMode ? (
                    <div className="bulk-delete-action-row">
                      <div className="bulk-delete-info">
                        <div className="info-icon"><RiDeleteBin6Fill /></div>
                        <div className="bulk-delete-text">
                          <span className="bulk-delete-title">{selectedDepts.length === 0 ? "Select Items" : `${selectedDepts.length} Selected`}</span>
                          <span className="bulk-delete-desc">Choose departments to delete</span>
                        </div>
                      </div>
                      <div className="pill-group">
                        <button className="premium-pill-btn primary" onClick={() => handleSelectAllDepts(departmentsList)}>{selectedDepts.length === departmentsList.length && departmentsList.length > 0 ? 'Deselect All' : 'Select All'}</button>
                        <button className="premium-pill-btn secondary" onClick={() => { setSelectedDepts([]); setIsDeptDeleteMode(false); }}>Cancel</button>
                        <button className="premium-pill-btn danger" onClick={handleBulkDeleteDepts} disabled={selectedDepts.length === 0}>Delete</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bulk-delete-start-row">
                      <div className="bulk-delete-info">
                        <div className="info-icon"><RiBookOpenLine /></div>
                        <div className="bulk-delete-text">
                          <span className="bulk-delete-title">Manage Registry</span>
                          <span className="bulk-delete-desc">Select and remove unused departments</span>
                        </div>
                      </div>
                      <button className="premium-pill-btn danger" onClick={() => setIsDeptDeleteMode(true)}><RiDeleteBin6Fill /> Delete</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== 4. SECTIONS ==================== */}
          {activeTab === 'sections' && (
            <div className="course-manager">
              <div className="master-header-row animate-fade-in" style={{ marginBottom: '16px', minHeight: 'auto', justifyContent: 'flex-end', paddingRight: 0, paddingLeft: 0 }}>
                <div className="header-actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
                  {isSecEditMode ? (
                    <div className="master-header-row" style={{ display: 'flex', gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
                      <button className="role-header-pill secondary" onClick={() => { setSelectedSecs([]); setIsSecDeleteMode(false); setIsSecEditMode(false); setEditingSec(null); }} style={{ minWidth: '90px' }}>Cancel</button>
                      <button className="role-header-pill active" onClick={() => { setSelectedSecs([]); setIsSecDeleteMode(false); setIsSecEditMode(false); setEditingSec(null); }} style={{ minWidth: '90px' }}>Done</button>
                    </div>
                  ) : (
                    <button className="edit-list-btn" onClick={() => setIsSecEditMode(true)}><RiEditLine style={{ marginRight: '6px' }} /> Edit List</button>
                  )}
                </div>
              </div>

              {isSecEditMode && (
              <div className="master-add-card-premium animate-slide-down" style={{ marginBottom: '24px' }}>
                <div className="add-card-title-row"><span>Map New Section</span></div>
                <div className="add-card-grid">
                  <div className="add-input-section grow">
                    <label className="add-input-label">BATCH</label>
                    <select className="premium-add-input" style={{ cursor: 'pointer' }} value={secBatch} onChange={e => { setSecBatch(e.target.value); setSecDept(""); }}>
                      <option value="">Select Batch</option>
                      {Object.keys(hierarchy).sort().reverse().map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="add-input-section grow">
                    <label className="add-input-label">DEPARTMENT</label>
                    <select className="premium-add-input" style={{ cursor: 'pointer' }} value={secDept} onChange={e => setSecDept(e.target.value)} disabled={!secBatch}>
                      <option value="">Select Dept</option>
                      {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="add-input-section grow">
                    <label className="add-input-label">SECTION NAME</label>
                    <input className="premium-add-input" placeholder="e.g. A" value={newSection} onChange={e => setNewSection(e.target.value)} disabled={!secDept} />
                  </div>
                </div>
                {isMobile ? (
                  <button className="premium-add-submit-btn" style={{ marginTop: '16px' }} onClick={handleAddSection}>Add Section</button>
                ) : (
                  <button className="premium-add-submit-btn" onClick={handleAddSection}><RiAddLine /> Add Section</button>
                )}
              </div>
              )}

              {/* All Sections List */}
              <div className="master-items-container individual-cards" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                {(() => {
                  const allSections = [];
                  Object.keys(hierarchy).sort().reverse().forEach(batch => {
                    const depts = Object.keys(hierarchy[batch] || {}).filter(k => k !== 'initialized').sort();
                    depts.forEach(dept => {
                      const sections = Array.isArray(hierarchy[batch][dept]) ? hierarchy[batch][dept] : [];
                      sections.forEach(sec => {
                        allSections.push({ batch, dept, sec });
                      });
                    });
                  });

                  if (allSections.length === 0) {
                    return <div className="settings-card empty-card-wrap"><div className="empty-placeholder"><RiBookOpenLine /><p>No sections mapped yet.</p></div></div>;
                  }

                  return allSections.map(({ batch, dept, sec }) => (
                    <div key={`${batch}-${dept}-${sec}`} className={`settings-card master-item-card ${editingSec?.oldVal === sec && editingSec?.batch === batch && editingSec?.dept === dept ? 'editing' : ''}`}>
                      {editingSec?.oldVal === sec && editingSec?.batch === batch && editingSec?.dept === dept ? (
                        <div className="pill-edit-row">
                          <div className="edit-item-fields">
                            <div className="edit-field">
                              <label className="edit-label">SECTION NAME</label>
                              <input autoFocus className="edit-input-field" value={editingSec.newVal} onChange={e => setEditingSec({ ...editingSec, newVal: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleUpdateSection()} />
                            </div>
                          </div>
                          <div className="pill-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingSec(null)}>Cancel</button>
                            <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUpdateSection}> Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="item-content" style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%', padding: '4px 0' }}>
                            {isSecDeleteMode && (
                              <input type="checkbox" className="mac-checkbox" checked={selectedSecs.includes(`${batch}-${dept}-${sec}`)} onChange={() => handleToggleSecSelect(`${batch}-${dept}-${sec}`)} />
                            )}
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(52,199,89,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              <RiLayoutGridLine style={{ fontSize: '20px', color: '#34c759' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--mac-text)', letterSpacing: '-0.3px' }}>Section {sec}</div>
                              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--mac-text-secondary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>{batch} · {dept}</div>
                            </div>
                          </div>
                          {isSecEditMode && (
                            <button className="pill-inline-edit" onClick={() => setEditingSec({ batch, dept, oldVal: sec, newVal: sec })}><RiEditLine /></button>
                          )}
                        </>
                      )}
                    </div>
                  ));
                })()}
              </div>

              {isSecEditMode && (
                <div className={`bulk-action-footer-premium animate-slide-up ${isSecDeleteMode ? 'danger-mode' : ''}`}>
                  {isSecDeleteMode ? (
                    <div className="bulk-delete-action-row">
                      <div className="bulk-delete-info">
                        <div className="info-icon"><RiDeleteBin6Fill /></div>
                        <div className="bulk-delete-text">
                          <span className="bulk-delete-title">{selectedSecs.length === 0 ? "Select Items" : `${selectedSecs.length} Selected`}</span>
                          <span className="bulk-delete-desc">Choose sections to delete</span>
                        </div>
                      </div>
                      <div className="pill-group">
                        <button className="premium-pill-btn primary" onClick={() => {
                          const allSecKeys = [];
                          Object.keys(hierarchy).forEach(b => {
                            Object.keys(hierarchy[b] || {}).filter(k => k !== 'initialized').forEach(d => {
                              const arr = Array.isArray(hierarchy[b][d]) ? hierarchy[b][d] : [];
                              arr.forEach(s => allSecKeys.push(`${b}-${d}-${s}`));
                            });
                          });
                          handleSelectAllSecs(allSecKeys);
                        }}>{selectedSecs.length > 0 ? 'Deselect All' : 'Select All'}</button>
                        <button className="premium-pill-btn secondary" onClick={() => { setSelectedSecs([]); setIsSecDeleteMode(false); }}>Cancel</button>
                        <button className="premium-pill-btn danger" onClick={() => {
                           const allSectionsList = [];
                           Object.keys(hierarchy).forEach(b => {
                             Object.keys(hierarchy[b]||{}).filter(k=>k!=='initialized').forEach(d => {
                               const arr = Array.isArray(hierarchy[b][d]) ? hierarchy[b][d] : [];
                               arr.forEach(s => allSectionsList.push({batch: b, dept: d, sec: s}));
                             });
                           });
                           handleBulkDeleteSecs(allSectionsList);
                        }} disabled={selectedSecs.length === 0}>Delete</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bulk-delete-start-row">
                      <div className="bulk-delete-info">
                        <div className="info-icon"><RiLayoutGridLine /></div>
                        <div className="bulk-delete-text">
                          <span className="bulk-delete-title">Manage Sections</span>
                          <span className="bulk-delete-desc">Select and remove mapped sections</span>
                        </div>
                      </div>
                      <button className="premium-pill-btn danger" onClick={() => setIsSecDeleteMode(true)}><RiDeleteBin6Fill /> Delete</button>
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

export default AcademicTree;

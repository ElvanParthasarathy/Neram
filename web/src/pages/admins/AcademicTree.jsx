import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, get, update } from "firebase/database";
import {
  RiAddLine, RiDeleteBin6Line, RiEditLine, RiCloseLine,
  RiSave3Line, RiGlobalLine, RiBookOpenLine
} from 'react-icons/ri';

import "../../styles/admin-settings.css";

const AcademicTree = () => {
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
  const [editingSec, setEditingSec] = useState(null);

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

  // --- COMPUTED: sections for selected batch+dept ---
  const filteredSections = (secBatch && secDept && Array.isArray(hierarchy[secBatch]?.[secDept]))
    ? hierarchy[secBatch][secDept] : [];

  return (
    <div className="admin-subpage animate-fade-in central-schedule-manager">
      <div className="schedule-editor-workspace">
        <nav className="editor-tabs box-flat">
          <button className={activeTab === 'hierarchy' ? 'active' : ''} onClick={() => setActiveTab('hierarchy')}>Hierarchy</button>
          <button className={activeTab === 'batches' ? 'active' : ''} onClick={() => setActiveTab('batches')}>Batches</button>
          <button className={activeTab === 'departments' ? 'active' : ''} onClick={() => setActiveTab('departments')}>Departments</button>
          <button className={activeTab === 'sections' ? 'active' : ''} onClick={() => setActiveTab('sections')}>Sections</button>
        </nav>

        <div className="tab-content-area">

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
                  <div key={batch} style={{ marginBottom: '32px' }}>
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
              <div style={{ marginBottom: '16px' }}>
                <h2 className="section-title-premium" style={{ margin: 0 }}>Batch Manager</h2>
              </div>

              <div className="master-add-card-premium animate-slide-down" style={{ marginBottom: '24px' }}>
                <div className="add-card-title-row"><span>Create New Batch</span></div>
                <div className="add-card-grid">
                  <div className="add-input-section">
                    <label className="add-input-label">START YEAR</label>
                    <input className="premium-add-input" placeholder="YYYY" type="number" value={batchStart} onChange={e => setBatchStart(e.target.value)} />
                  </div>
                  <div className="add-input-section">
                    <label className="add-input-label">END YEAR</label>
                    <input className="premium-add-input" placeholder="YYYY" type="number" value={batchEnd} onChange={e => setBatchEnd(e.target.value)} />
                  </div>
                </div>
                <button className="premium-add-submit-btn" onClick={handleCreateBatch}><RiAddLine /> Create Batch</button>
              </div>

              <div className="master-items-container individual-cards">
                {Object.keys(hierarchy).sort().reverse().map(batch => {
                  const deptCount = Object.keys(hierarchy[batch] || {}).filter(k => k !== 'initialized').length;
                  return (
                    <div key={batch} className={`settings-card master-item-card ${editingBatch?.oldVal === batch ? 'editing' : ''}`}>
                      {editingBatch?.oldVal === batch ? (
                        <div className="pill-edit-row">
                          <div className="edit-item-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                          <div className="pill-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingBatch(null)}>Cancel</button>
                            <button className="premium-pill-btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleDeleteBatch(batch)}><RiDeleteBin6Line /> Delete</button>
                            <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => {
                              const newStart = (editingBatch.startYear || '').toString().trim();
                              const newEnd = (editingBatch.endYear || '').toString().trim();
                              if (!newStart || !newEnd) return alert("Please enter both years");
                              handleUpdateBatch(batch, `${newStart}-${newEnd}`);
                            }}><RiSave3Line /> Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="item-content">
                            <div className="item-text-stack">
                              <div className="course-code-badge">{batch}</div>
                              <span className="course-name-text">{deptCount} Department{deptCount !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
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
                        </>
                      )}
                    </div>
                  );
                })}
                {Object.keys(hierarchy).length === 0 && (
                  <div className="settings-card empty-card-wrap"><div className="empty-placeholder"><RiBookOpenLine /><p>No batches created yet.</p></div></div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. DEPARTMENTS ==================== */}
          {activeTab === 'departments' && (
            <div className="course-manager">
              <div style={{ marginBottom: '16px' }}>
                <h2 className="section-title-premium" style={{ margin: 0 }}>Global Department Registry</h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--mac-text-secondary)' }}>Renaming a department here triggers a global migration across all schedules, users, faculty, events, and courses.</p>
              </div>

              <div className="master-add-card-premium animate-slide-down" style={{ marginBottom: '24px' }}>
                <div className="add-card-title-row"><span>Register New Department</span></div>
                <div className="add-card-grid">
                  <div className="add-input-section grow">
                    <label className="add-input-label">DEPARTMENT CODE</label>
                    <input className="premium-add-input" placeholder="e.g. MECH" value={newDeptCode}
                      onChange={e => setNewDeptCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddDepartment()} />
                  </div>
                </div>
                <button className="premium-add-submit-btn" onClick={handleAddDepartment}><RiAddLine /> Add Department</button>
              </div>

              <div className="master-items-container individual-cards">
                {departmentsList.map(dept => (
                  <div key={dept} className={`settings-card master-item-card ${editingGlobalDept === dept ? 'editing' : ''}`}>
                    {editingGlobalDept === dept ? (
                      <div className="pill-edit-row">
                        <div className="edit-item-fields">
                          <div className="edit-field">
                            <label className="edit-label">DEPARTMENT CODE</label>
                            <input autoFocus className="edit-input-field" defaultValue={dept}
                              onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingGlobalDept(null); }}
                              onBlur={e => {
                                const v = e.target.value.toUpperCase().trim();
                                if (v && v !== dept) handleUpdateGlobalDept(dept, v);
                                setEditingGlobalDept(null);
                              }} />
                          </div>
                        </div>
                        <div className="pill-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                          <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingGlobalDept(null)}>Cancel</button>
                          <button className="premium-pill-btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { handleDeleteGlobalDept(dept); setEditingGlobalDept(null); }}><RiDeleteBin6Line /> Delete</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="item-content">
                          <div className="item-text-stack">
                            <div className="course-code-badge">{dept}</div>
                            <span className="course-name-text">Department</span>
                          </div>
                        </div>
                        <button className="pill-inline-edit" onClick={() => setEditingGlobalDept(dept)}><RiEditLine /></button>
                      </>
                    )}
                  </div>
                ))}
                {departmentsList.length === 0 && (
                  <div className="settings-card empty-card-wrap"><div className="empty-placeholder"><RiBookOpenLine /><p>No departments registered.</p></div></div>
                )}
              </div>
            </div>
          )}

          {/* ==================== 4. SECTIONS ==================== */}
          {activeTab === 'sections' && (
            <div className="course-manager">
              <div style={{ marginBottom: '16px' }}>
                <h2 className="section-title-premium" style={{ margin: 0 }}>Section Manager</h2>
                <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--mac-text-secondary)' }}>Select a batch and department, then add or edit sections.</p>
              </div>

              <div className="master-add-card-premium animate-slide-down" style={{ marginBottom: '24px' }}>
                <div className="add-card-title-row"><span>Map New Section</span></div>
                <div className="add-card-grid">
                  <div className="add-input-section">
                    <label className="add-input-label">BATCH</label>
                    <select className="premium-add-input" style={{ cursor: 'pointer' }} value={secBatch} onChange={e => { setSecBatch(e.target.value); setSecDept(""); }}>
                      <option value="">Select Batch</option>
                      {Object.keys(hierarchy).sort().reverse().map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="add-input-section">
                    <label className="add-input-label">DEPARTMENT</label>
                    <select className="premium-add-input" style={{ cursor: 'pointer' }} value={secDept} onChange={e => setSecDept(e.target.value)} disabled={!secBatch}>
                      <option value="">Select Dept</option>
                      {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="add-input-section">
                    <label className="add-input-label">SECTION NAME</label>
                    <input className="premium-add-input" placeholder="e.g. A" value={newSection} onChange={e => setNewSection(e.target.value)} />
                  </div>
                </div>
                <button className="premium-add-submit-btn" onClick={handleAddSection}><RiAddLine /> Add Section</button>
              </div>

              {/* All Sections List */}
              <div className="master-items-container individual-cards">
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
                            <button className="premium-pill-btn danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { handleDeleteSection(batch, dept, sec); setEditingSec(null); }}><RiDeleteBin6Line /> Delete</button>
                            <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUpdateSection}><RiSave3Line /> Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="item-content">
                            <div className="item-text-stack">
                              <div className="course-code-badge">Section {sec}</div>
                              <span className="course-name-text">{batch} · {dept}</span>
                            </div>
                          </div>
                          <button className="pill-inline-edit" onClick={() => setEditingSec({ batch, dept, oldVal: sec, newVal: sec })}><RiEditLine /></button>
                        </>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AcademicTree;

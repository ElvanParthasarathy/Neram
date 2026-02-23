import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, get, update } from "firebase/database";
import { RiLock2Line, RiLockUnlockLine, RiAddLine, RiDeleteBinLine, RiEditLine, RiSave3Line, RiCloseLine, RiInformationLine } from 'react-icons/ri';

// --- IMPORT STYLES ---
import "../../styles/structure-manager.css";

const StructureManager = () => {
  const departmentsList = ["ECE", "IT", "CSE", "CSBS", "AIML"];
  const [hierarchy, setHierarchy] = useState({});
  const [isEditing, setIsEditing] = useState(false); // Default: Locked

  const [batchStart, setBatchStart] = useState("");
  const [batchEnd, setBatchEnd] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [newSection, setNewSection] = useState("");

  const [editingSec, setEditingSec] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);
  const [editingDept, setEditingDept] = useState(null);

  useEffect(() => {
    const configRef = ref(db, 'academic_hierarchy');
    const unsubscribe = onValue(configRef, (snapshot) => {
      setHierarchy(snapshot.exists() ? snapshot.val() : {});
    });
    return () => unsubscribe();
  }, []);

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

  return (
    <div className="admin-subpage animate-fade-in resources-page-wrapper">
      {/* HEADER BAR */}
      <header className="explorer-header" style={{ marginBottom: '24px' }}>
        <div className="breadcrumb-nav">
          <RiInformationLine className="card-icon-mini" />
          <span className="crumb-static">Academic Hierarchy</span>
        </div>
        <button
          className={`btn-toggle-explicit ${isEditing ? 'editing' : ''}`}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <><RiCloseLine /> Done Editing</> : <><RiEditLine /> Edit Structure</>}
        </button>
      </header>

      <div className="admin-grid-layout">

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

        {/* TREE COLUMN - ALWAYS VISIBLE, BUT CONTROLS HIDDEN */}
        <div className={`admin-tree-column settings-card ${isEditing ? '' : 'full-width'}`}>
          <div className="tree-viewport">
            {!isEditing && (
              <div className="read-only-banner">
                <RiInformationLine size={18} />
                Read-Only View. Enable Edit Mode to make changes.
              </div>
            )}

            {Object.keys(hierarchy).sort().reverse().map(batch => (
              <div key={batch} className="tree-batch-node">
                <div className="node-label batch">
                  {editingBatch?.oldVal === batch ? (
                    <div className="pill-edit">
                      <input value={editingBatch.newVal} onChange={e => setEditingBatch({ ...editingBatch, newVal: e.target.value })} autoFocus className="mac-input" style={{ height: '32px' }} />
                      <button className="text-btn save" onClick={handleUpdateBatch}><RiSave3Line /></button>
                      <button className="text-btn cancel" onClick={() => setEditingBatch(null)}><RiCloseLine /></button>
                    </div>
                  ) : (
                    <>
                      <span>Batch {batch}</span>
                      {isEditing && (
                        <div className="pill-btns">
                          <button className="text-btn edit" onClick={() => setEditingBatch({ oldVal: batch, newVal: batch })}><RiEditLine /></button>
                          <button className="text-btn delete" onClick={() => handleDeleteBatch(batch)}><RiDeleteBinLine /></button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="tree-dept-list">
                  {Object.keys(hierarchy[batch]).map(dept => dept !== 'initialized' && (
                    <div key={dept} className="tree-dept-node">
                      <div className="node-label dept">
                        {editingDept?.oldVal === dept && editingDept?.batch === batch ? (
                          <div className="pill-edit">
                            <input value={editingDept.newVal} onChange={e => setEditingDept({ ...editingDept, newVal: e.target.value })} autoFocus className="mac-input" style={{ height: '32px' }} />
                            <button className="text-btn save" onClick={handleUpdateDept}><RiSave3Line /></button>
                            <button className="text-btn cancel" onClick={() => setEditingDept(null)}><RiCloseLine /></button>
                          </div>
                        ) : (
                          <>
                            <span>{dept}</span>
                            {isEditing && (
                              <div className="pill-btns">
                                <button className="text-btn edit" onClick={() => setEditingDept({ batch, oldVal: dept, newVal: dept })}><RiEditLine /></button>
                                <button className="text-btn delete" onClick={() => handleDeleteDept(batch, dept)}><RiDeleteBinLine /></button>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="tree-section-grid">
                        {Array.isArray(hierarchy[batch][dept]) && hierarchy[batch][dept].map(sec => (
                          <div key={sec} className="tree-sec-pill">
                            {editingSec?.oldVal === sec && editingSec?.dept === dept && editingSec?.batch === batch ? (
                              <div className="pill-edit">
                                <input value={editingSec.newVal} onChange={e => setEditingSec({ ...editingSec, newVal: e.target.value })} className="mac-input" style={{ height: '32px' }} />
                                <button className="text-btn save" onClick={handleUpdateSection}><RiSave3Line /></button>
                                <button className="text-btn cancel" onClick={() => setEditingSec(null)}><RiCloseLine /></button>
                              </div>
                            ) : (
                              <>
                                <span>{sec}</span>
                                {isEditing && (
                                  <div className="pill-btns">
                                    <button className="text-btn edit" onClick={() => setEditingSec({ batch, dept, oldVal: sec, newVal: sec })}><RiEditLine /></button>
                                    <button className="text-btn delete" onClick={() => handleDeleteSection(batch, dept, sec)}><RiDeleteBinLine /></button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StructureManager;
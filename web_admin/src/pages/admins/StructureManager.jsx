import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, get, update } from "firebase/database";

const StructureManager = () => {
  const departmentsList = ["ECE", "IT", "CSE", "CSBS", "AIML"];
  const [hierarchy, setHierarchy] = useState({});
  
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
            if(schedSnap.exists()) {
                updates[`schedules/${batch}/${dept}/${cleanNewVal}`] = schedSnap.val();
                updates[`schedules/${batch}/${dept}/${oldVal}`] = null;
            }
            const usersSnap = await get(ref(db, 'users'));
            if(usersSnap.exists()) {
                Object.entries(usersSnap.val()).forEach(([uid, u]) => {
                    if(u.batch === batch && u.department === dept && u.section === oldVal) updates[`users/${uid}/section`] = cleanNewVal;
                });
            }
            await update(ref(db), updates);
            setEditingSec(null);
        } catch (err) { alert(err.message); }
    }
  };

  return (
    <div className="settings-section-content">
      <div className="admin-grid-layout">
        
        {/* COMMAND COLUMN */}
        <div className="admin-forms-column">
          <section className="security-module">
            <h3>1. Initialize New Batch</h3>
            <div className="settings-row-vertical">
              <div className="dual-input">
                <input type="number" placeholder="Start Year" value={batchStart} onChange={e => setBatchStart(e.target.value)} />
                <span className="input-divider">-</span>
                <input type="number" placeholder="End Year" value={batchEnd} onChange={e => setBatchEnd(e.target.value)} />
              </div>
              <button onClick={handleCreateBatch} className="btn-primary-full">Create Batch</button>
            </div>
          </section>

          <section className="security-module">
            <h3>2. Map Sections</h3>
            <div className="settings-row-vertical">
              <label>Target Batch</label>
              <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                <option value="">Select Batch</option>
                {Object.keys(hierarchy).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <label>Department</label>
              <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
                <option value="">Select Dept</option>
                {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <label>Section Name</label>
              <div className="input-with-btn">
                <input type="text" placeholder="e.g. A" value={newSection} onChange={e => setNewSection(e.target.value)} />
                <button onClick={handleAddSection} className="btn-success-sq">Add</button>
              </div>
            </div>
          </section>
        </div>

        {/* TREE COLUMN */}
        <div className="admin-tree-column">
          <div className="tree-viewport">
            <h3>3. Current Academic Tree</h3>
            {Object.keys(hierarchy).sort().reverse().map(batch => (
              <div key={batch} className="tree-batch-node">
                <div className="node-label batch">
                  {editingBatch?.oldVal === batch ? (
                    <div className="pill-edit">
                      <input value={editingBatch.newVal} onChange={e => setEditingBatch({...editingBatch, newVal: e.target.value})} autoFocus />
                      <button className="text-btn save" onClick={handleUpdateBatch}>Save</button>
                      <button className="text-btn cancel" onClick={() => setEditingBatch(null)}>Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span>Batch {batch}</span>
                      <div className="pill-btns">
                        <button className="text-btn edit" onClick={() => setEditingBatch({oldVal: batch, newVal: batch})}>Edit</button>
                        <button className="text-btn delete" onClick={async () => {
                          if(window.confirm(`Delete Batch ${batch}?`)) {
                            const updates = {};
                            updates[`academic_hierarchy/${batch}`] = null;
                            updates[`schedules/${batch}`] = null;
                            await update(ref(db), updates);
                          }
                        }}>Delete</button>
                      </div>
                    </>
                  )}
                </div>

                <div className="tree-dept-list">
                  {Object.keys(hierarchy[batch]).map(dept => dept !== 'initialized' && (
                    <div key={dept} className="tree-dept-node">
                      <div className="node-label dept">
                        {editingDept?.oldVal === dept && editingDept?.batch === batch ? (
                          <div className="pill-edit">
                            <input value={editingDept.newVal} onChange={e => setEditingDept({...editingDept, newVal: e.target.value})} autoFocus />
                            <button className="text-btn save" onClick={handleUpdateDept}>Save</button>
                            <button className="text-btn cancel" onClick={() => setEditingDept(null)}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <span>{dept}</span>
                            <div className="pill-btns">
                              <button className="text-btn edit" onClick={() => setEditingDept({batch, oldVal: dept, newVal: dept})}>Edit</button>
                              <button className="text-btn delete" onClick={async () => {
                                if(window.confirm(`Delete Dept ${dept}?`)) {
                                  const updates = {};
                                  updates[`academic_hierarchy/${batch}/${dept}`] = null;
                                  updates[`schedules/${batch}/${dept}`] = null;
                                  await update(ref(db), updates);
                                }
                              }}>Delete</button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="tree-section-grid">
                        {Array.isArray(hierarchy[batch][dept]) && hierarchy[batch][dept].map(sec => (
                          <div key={sec} className="tree-sec-pill">
                            {editingSec?.oldVal === sec && editingSec?.dept === dept && editingSec?.batch === batch ? (
                              <div className="pill-edit">
                                <input value={editingSec.newVal} onChange={e => setEditingSec({...editingSec, newVal: e.target.value})} />
                                <button className="text-btn save" onClick={handleUpdateSection}>Save</button>
                                <button className="text-btn cancel" onClick={() => setEditingSec(null)}>Cancel</button>
                              </div>
                            ) : (
                              <>
                                <span>{sec}</span>
                                <div className="pill-btns">
                                  <button className="text-btn edit" onClick={() => setEditingSec({batch, dept, oldVal: sec, newVal: sec})}>Edit</button>
                                  <button className="text-btn delete" onClick={async () => {
                                      if(window.confirm("Delete Section?")) {
                                          const updates = {};
                                          updates[`academic_hierarchy/${batch}/${dept}`] = hierarchy[batch][dept].filter(s => s !== sec);
                                          updates[`schedules/${batch}/${dept}/${sec}`] = null;
                                          await update(ref(db), updates);
                                      }
                                  }}>Delete</button>
                                </div>
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
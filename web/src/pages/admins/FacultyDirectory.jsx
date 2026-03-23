import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, get, update } from "firebase/database";
import { RiAddLine, RiDeleteBin6Line, RiEditLine, RiCloseLine, RiInformationLine, RiCheckLine, RiLoader4Line } from 'react-icons/ri';

// --- IMPORT STYLES ---
import "../../styles/structure-manager.css";
import "../../styles/admin-settings.css";

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
  
  // Move Faculty State
  const [movingFacultyIdx, setMovingFacultyIdx] = useState(null);
  const [moveToDept, setMoveToDept] = useState("");

  const extraFacultyDepts = ["S&H", "Leadership"];
  const mergedDepartments = [...new Set([...departmentsList, ...extraFacultyDepts, ...allFacultyDeptKeys])].sort();

  // Load all faculty directory keys
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

  return (
    <div className="admin-subpage animate-fade-in" style={{ padding: 0, width: '100%' }}>

      <div className="faculty-directory-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <div className="settings-card slide-in-left" style={{ width: '320px', flexShrink: 0 }}>
            <h3><RiInformationLine /> Target Department</h3>
            <p style={{ color: 'var(--mac-text-muted)', fontSize: '13px', marginBottom: '16px' }}>Select a department to manage its global faculty roster.</p>
            <select value={targetFacultyDept} onChange={e => setTargetFacultyDept(e.target.value)} className="mac-input">
              <option value="">-- Choose Department --</option>
              {mergedDepartments.map(d => (
                <option key={d} value={d}>{d}{!departmentsList.includes(d) ? ' (Faculty Only)' : ''}</option>
              ))}
            </select>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border-color)' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--mac-text)', marginBottom: '8px' }}><RiAddLine style={{ verticalAlign: 'middle' }} /> Add Faculty-Only Dept</p>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input type="text" className="mac-input" placeholder="e.g. S&H" value={newFacultyDept} onChange={e => setNewFacultyDept(e.target.value.toUpperCase())} style={{ flex: 1 }} />
                <button className="btn-add-mini" onClick={() => {
                  if (!newFacultyDept.trim()) return;
                  const deptName = newFacultyDept.trim();
                  if (mergedDepartments.includes(deptName)) return alert('Department exists!');
                  set(ref(db, `faculties_directory/${deptName}`), []);
                  setNewFacultyDept('');
                  setTargetFacultyDept(deptName);
                }}><RiAddLine /></button>
              </div>
            </div>
          </div>

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
                  <select className="mac-input" value={targetFacultyRole} onChange={e => setTargetFacultyRole(e.target.value)} style={{ flexShrink: 0, width: '150px' }}>
                    {targetFacultyDept === 'Leadership' ? (
                      <><option value="Principal">Principal</option><option value="Dean">Dean</option></>
                    ) : (
                      <><option value="HOD">HOD</option><option value="Academic Coordinator">Academic Coordinator</option><option value="Faculty">Faculty</option></>
                    )}
                  </select>
                  <input type="text" placeholder="e.g. Dr. A. Smith" value={newFacultyName} onChange={(e) => setNewFacultyName(e.target.value)} style={{ flex: 1 }} />
                  <button className="btn-add-mini" onClick={handleAddFaculty}><RiAddLine /> Add Faculty</button>
                </div>

                <div className="counselor-items-v2">
                  {facultyList.length === 0 ? (
                    <div className="empty-state">No faculties found for {targetFacultyDept}.</div>
                  ) : (
                    facultyList.map((f, i) => (
                      <div key={i} className={`counselor-item-row ${editingFacultyIdx === i ? 'editing' : ''}`}>
                        {editingFacultyIdx === i ? (
                          <div className="inline-edit-pill-wrap">
                            <select className="mac-input" value={tempFacultyRole} onChange={e => setTempFacultyRole(e.target.value)} style={{ flexShrink: 0, width: '120px' }}>
                              {targetFacultyDept === 'Leadership' ? (
                                <><option value="Principal">Principal</option><option value="Dean">Dean</option></>
                              ) : (
                                <><option value="HOD">HOD</option><option value="Academic Coordinator">Academic Coordinator</option><option value="Faculty">Faculty</option></>
                              )}
                            </select>
                            <input autoFocus value={tempFacultyName} onChange={(e) => setTempFacultyName(e.target.value)} style={{ flex: 1 }} />
                            <div className="edit-pill-actions">
                              <button className="action-btn action-edit" onClick={handleUpdateFaculty}><RiCheckLine /> Save</button>
                              <button className="action-btn" onClick={() => setEditingFacultyIdx(null)}><RiCloseLine /> Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="counselor-name-chip" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, background: f.role === 'HOD' ? 'rgba(255, 69, 58, 0.15)' : f.role === 'Principal' || f.role === 'Dean' ? 'rgba(48, 209, 88, 0.15)' : f.role === 'Academic Coordinator' ? 'rgba(10, 132, 255, 0.15)' : 'rgba(255,255,255,0.1)', color: f.role === 'HOD' ? 'rgb(255, 105, 97)' : f.role === 'Principal' || f.role === 'Dean' ? 'rgb(48, 209, 88)' : f.role === 'Academic Coordinator' ? 'rgb(10, 132, 255)' : 'var(--mac-text-muted)' }}>{f.role || 'Faculty'}</span>
                              <strong style={{ color: 'var(--mac-text)' }}>{f.name || f}</strong>
                              {movingFacultyIdx === i && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
                                  <select className="mac-input" style={{ padding: '4px 8px', fontSize: '12px' }} value={moveToDept} onChange={e => setMoveToDept(e.target.value)}>
                                    <option value="">Move to...</option>
                                    {mergedDepartments.filter(d => d !== targetFacultyDept).map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                  <button onClick={() => handleMoveFaculty(i)} className="btn-add-mini"><RiCheckLine /></button>
                                  <button onClick={() => setMovingFacultyIdx(null)} className="btn-add-mini" style={{ background: 'transparent' }}><RiCloseLine /></button>
                                </div>
                              )}
                            </div>
                            <div className="counselor-row-actions">
                              {movingFacultyIdx !== i && (
                                <>
                                  <button className="action-btn action-edit" onClick={() => setMovingFacultyIdx(i)}>Move</button>
                                  <button className="action-btn action-edit" onClick={() => { setEditingFacultyIdx(i); setTempFacultyName(f.name || f); setTempFacultyRole(f.role || 'Faculty'); }}><RiEditLine /> Edit</button>
                                  <button className="action-btn action-delete" onClick={() => handleDeleteFaculty(i)}><RiDeleteBin6Line /></button>
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
    </div>
  );
};

export default FacultyDirectory;

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set, update } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { RiCalendarEventLine, RiTimeLine, RiHashtag, RiGroupLine, RiSave3Line, RiCloseLine, RiDeleteBin6Line, RiFileCopyLine, RiCheckLine, RiExternalLinkLine, RiHistoryLine, RiRefreshLine, RiCalendarLine, RiArrowRightSLine, RiArrowLeftLine, RiTeamLine, RiLayoutGridLine, RiComputerLine, RiAddLine, RiEditLine, RiArrowDownSLine, RiDeleteBin6Fill } from "react-icons/ri";
import { formatDateDDMMYYYY, handleAutoSlash, parseDMYToISO, convertTo12Hour } from "../../utils/timeUtils";
import HybridDateInput from '../../components/HybridDateInput';

const SpecialClassManager = ({ user, userProfile, isMobile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasAutoNavigated = useRef(false);

  // --- ROLE DETECTION ---
  const emailRole = user?.email ? getHardcodedRole(user.email) : null;
  const finalRole = emailRole || userProfile?.role || 'student';
  const isRep = finalRole === 'rep';

  const viewLevel = searchParams.get('slvl') || 'batches';
  const path = {
    batch: searchParams.get('sb') || '',
    dept: searchParams.get('sd') || ''
  };

  const updateLevel = (level, newPath = {}) => {
    const params = {
      mod: 'special_classes',
      slvl: level,
      sb: newPath.batch !== undefined ? newPath.batch : path.batch,
      sd: newPath.dept !== undefined ? newPath.dept : path.dept
    };
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    setSearchParams(params);
  };

  const handleBack = () => {
    if (viewLevel === 'editor') updateLevel('depts', { dept: '' });
    else if (viewLevel === 'depts') updateLevel('batches', { batch: '' });
  };

  // --- DATA STATE ---
  const [hierarchy, setHierarchy] = useState({});
  const [specialClasses, setSpecialClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [rawDeptData, setRawDeptData] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);

  const [isEditListMode, setIsEditListMode] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);

  const [expandedClasses, setExpandedClasses] = useState([]);

  // Form State
  const [newClass, setNewClass] = useState({
    id: null,
    date: '',
    typeTitle: 'Special Class',
    title: '',
    desc: '',
    batches: []
  });

  const [editingClassId, setEditingClassId] = useState(null);
  const [editBuffer, setEditBuffer] = useState(null);

  // --- CONFIRMATION MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };
  const closeConfirm = () => setConfirmModal({ ...confirmModal, show: false });

  // --- FETCH HIERARCHY ---
  useEffect(() => {
    const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => setHierarchy(snap.val() || {}));
    return () => unsub();
  }, []);

  // --- AUTO-NAVIGATE FOR REPS ---
  useEffect(() => {
    if (isRep && !hasAutoNavigated.current && userProfile?.batch && userProfile?.department) {
      hasAutoNavigated.current = true;
      updateLevel('editor', { batch: userProfile.batch, dept: userProfile.department });
    }
  }, [isRep, userProfile]);

  const sectionsForDeptStr = Array.isArray(hierarchy[path.batch]?.[path.dept]) ? hierarchy[path.batch][path.dept].join(',') : '';

  // --- FETCH SPECIAL CLASSES & MASTER DATA ---
  useEffect(() => {
    if (viewLevel === 'editor' && path.batch && path.dept) {
      setIsSyncing(true);
      const dataRef = ref(db, `schedules/${path.batch}/${path.dept}`);
      const unsub = onValue(dataRef, (snap) => {
        const val = snap.val() || {};
        
        let sectionIds = sectionsForDeptStr ? sectionsForDeptStr.split(',') : [];
        if (sectionIds.length === 0) {
          sectionIds = Object.keys(val).filter(k => k !== 'initialized' && k !== '_master' && typeof val[k] === 'object');
        }
        setSections(sectionIds);

        // Fetch courses securely
        const allCoursesMap = {};
        if (val._master && val._master.courses) {
            val._master.courses.forEach(c => allCoursesMap[c.code] = c);
        } else {
            const firstSec = sectionIds[0];
            const secCourses = firstSec && val[firstSec] ? (val[firstSec].courses || []) : [];
            secCourses.forEach(c => allCoursesMap[c.code] = c);
        }
        setCourses(Object.values(allCoursesMap).sort((a,b) => a.name.localeCompare(b.name)));
        
        // Merge special classes 
        const scMap = {};
        sectionIds.forEach(secId => {
            const secData = val[secId] || {};
            const scArray = Array.isArray(secData.specialClasses) ? secData.specialClasses : Object.values(secData.specialClasses || {});
            
            scArray.forEach(sc => {
                if (!scMap[sc.id]) {
                    scMap[sc.id] = { ...sc, batches: [] };
                }
                
                // Merge batches safely
                sc.batches?.forEach(b => {
                    const existingB = scMap[sc.id].batches.find(mb => mb.id === b.id || (mb.startTime === b.startTime && mb.subjectName === b.subjectName));
                    if (existingB) {
                        if (!existingB.scopes) existingB.scopes = [existingB.scope || 'Common'];
                        if (!existingB.scopes.includes(secId)) {
                            existingB.scopes.push(secId);
                            existingB.scopes.sort();
                        }
                    } else {
                        scMap[sc.id].batches.push({ ...b, scopes: [secId] });
                    }
                });
            });
        });

        // Format batch scopes
        const mergedSc = Object.values(scMap).map(sc => {
            sc.batches.forEach(b => {
                if (!b.scopes) return;
                if (b.scopes.length === sectionIds.length || sectionIds.length === 0) {
                    b.scope = 'Common';
                } else {
                    b.scope = b.scopes.length === 1 ? b.scopes[0] : b.scopes.join(', ');
                }
            });
            sc.batches.sort((a, b) => a.startTime.localeCompare(b.startTime));
            return sc;
        });
        
        mergedSc.sort((a,b) => b.date.localeCompare(a.date));

        setSpecialClasses(mergedSc);
        setRawDeptData(val);
        setIsSyncing(false);
      });
      return () => unsub();
    }
  }, [viewLevel, path.batch, path.dept, sectionsForDeptStr]);

  // --- HELPERS ---
  const toISODate = (d) => {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const parseDate = (s) => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // --- FORM ACTIONS ---
  const addBatchRow = () => {
    setNewClass(prev => ({
      ...prev,
      batches: [...prev.batches, { id: Date.now(), circleLabel: String(prev.batches.length + 1), startTime: '08:30', endTime: '10:15', subjectCode: '', subjectName: '', faculty: '', scope: 'Common' }]
    }));
  };

  const removeBatchRow = (id) => {
    if (newClass.batches.length === 1) return;
    setNewClass(prev => ({
      ...prev,
      batches: prev.batches.filter(b => b.id !== id)
    }));
  };

  const updateBatchField = (id, field, value) => {
    setNewClass(prev => ({
      ...prev,
      batches: prev.batches.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const handleEditEntry = (sc) => {
    setEditingClassId(sc.id);
    setEditBuffer({
      id: sc.id,
      date: sc.date,
      typeTitle: sc.typeTitle || 'Special Class',
      title: sc.title || '',
      desc: sc.desc || '',
      batches: sc.batches.map(b => ({
        ...b,
        id: b.id || Date.now() + Math.random(),
        scope: b.scopes && b.scopes.length === sections.length ? 'Common' : (b.scopes?.[0] || 'Common')
      }))
    });
  };

  const saveClassEntry = async (classObj) => {
    if (!classObj.date) { alert("Please select a date."); return false; }
    if (classObj.batches.some(b => !b.subjectName)) { alert("Please enter subject names for all classes."); return false; }

    try {
      const payloadId = classObj.id || `sc_${Date.now()}`;
      const updates = {};
      
      sections.forEach(secId => {
          const secCourses = rawDeptData[secId]?.courses || [];
          
          const applicableBatches = classObj.batches.filter(b => b.scope === 'Common' || b.scope === secId)
              .map(b => {
                  const newB = { ...b };
                  const matchedSecCourse = secCourses.find(c => c.name === newB.subjectName || c.code === newB.subjectCode);
                  if (matchedSecCourse && matchedSecCourse.faculty) {
                      newB.faculty = matchedSecCourse.faculty;
                  } else if (rawDeptData._master?.courses) {
                      const masterCourse = rawDeptData._master.courses.find(c => c.name === newB.subjectName || c.code === newB.subjectCode);
                      if (masterCourse && masterCourse.faculty) {
                           newB.faculty = masterCourse.faculty;
                      }
                  }
                  if (!newB.faculty) newB.faculty = '';
                  delete newB.scopes; 
                  delete newB.scope; 
                  return newB;
              });
              
          const secSc = specialClasses.filter(sc => sc.id !== payloadId)
              .filter(sc => sc.batches.some(b => b.scopes?.includes(secId) || b.scope === 'Common'))
              .map(sc => {
                  const newSc = { ...sc };
                  newSc.batches = newSc.batches.filter(b => b.scopes?.includes(secId) || b.scope === 'Common')
                      .map(b => { const nb = {...b}; delete nb.scopes; delete nb.scope; return nb; });
                  return newSc;
              });

          if (applicableBatches.length > 0) {
              const finalPayload = { id: payloadId, date: classObj.date, typeTitle: classObj.typeTitle, title: classObj.title, desc: classObj.desc, batches: applicableBatches };
              updates[`schedules/${path.batch}/${path.dept}/${secId}/specialClasses`] = [...secSc, finalPayload];
          } else {
              const oldExistedHere = specialClasses.some(sc => sc.id === payloadId && sc.batches.some(b => b.scopes?.includes(secId) || b.scope === 'Common'));
              if (oldExistedHere) {
                  updates[`schedules/${path.batch}/${path.dept}/${secId}/specialClasses`] = secSc;
              }
          }
      });

      if (Object.keys(updates).length > 0) await update(ref(db), updates);
      return true;
    } catch (err) {
      alert("Error saving: " + err.message);
      return false;
    }
  };

  const handleSave = async () => {
    const success = await saveClassEntry(newClass);
    if (success) setNewClass({ id: null, date: '', typeTitle: 'Special Class', title: '', desc: '', batches: [] });
  };

  const saveEdit = async () => {
    const success = await saveClassEntry(editBuffer);
    if (success) {
      setEditingClassId(null);
      setEditBuffer(null);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Delete this special class entry?")) return;
    try {
      const updates = {};
      sections.forEach(secId => {
          const existingForSec = specialClasses.find(sc => sc.id === entryId && sc.batches.some(b => b.scopes?.includes(secId) || b.scope === 'Common'));
          if (existingForSec) {
              const secSc = specialClasses.filter(sc => sc.id !== entryId && sc.batches.some(b => b.scopes?.includes(secId) || b.scope === 'Common'))
                  .map(sc => {
                      const newSc = { ...sc };
                      newSc.batches = newSc.batches.filter(b => b.scopes?.includes(secId) || b.scope === 'Common')
                          .map(b => { const nb = {...b}; delete nb.scopes; delete nb.scope; return nb; });
                      return newSc;
                  });
              updates[`schedules/${path.batch}/${path.dept}/${secId}/specialClasses`] = secSc;
          }
      });
      if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
      }
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleBulkDeleteEntries = async () => {
    if (!window.confirm(`Delete ${selectedClasses.length} special class(es)?`)) return;
    try {
      const updates = {};
      sections.forEach(secId => {
          const hasAny = selectedClasses.some(entryId => 
              specialClasses.find(sc => sc.id === entryId && sc.batches.some(b => b.scopes?.includes(secId) || b.scope === 'Common'))
          );
          
          if (hasAny) {
              const secSc = specialClasses
                  .filter(sc => !selectedClasses.includes(sc.id) && sc.batches.some(b => b.scopes?.includes(secId) || b.scope === 'Common'))
                  .map(sc => {
                      const newSc = { ...sc };
                      newSc.batches = newSc.batches.filter(b => b.scopes?.includes(secId) || b.scope === 'Common')
                          .map(b => { const nb = {...b}; delete nb.scopes; delete nb.scope; return nb; });
                      return newSc;
                  });
              updates[`schedules/${path.batch}/${path.dept}/${secId}/specialClasses`] = secSc;
          }
      });
      if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
      }
      setSelectedClasses([]);
      setIsDeleteMode(false);
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleSelectAllClasses = () => {
    if (selectedClasses.length === specialClasses.length && specialClasses.length > 0) {
        setSelectedClasses([]);
    } else {
        setSelectedClasses(specialClasses.map(sc => sc.id));
    }
  };

  const toggleSelectClass = (id) => {
    setSelectedClasses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const getDisplayFaculty = (b) => {
    if (!b.subjectName) return 'Auto-filled';
    
    const targetSecs = b.scope === 'Common' ? sections : [b.scope];
    const faculties = new Set();
    
    targetSecs.forEach(secId => {
        const secCourses = rawDeptData[secId]?.courses || [];
        const matched = secCourses.find(c => c.name === b.subjectName || c.code === b.subjectCode);
        if (matched && matched.faculty) {
            faculties.add(matched.faculty);
        } else if (rawDeptData._master?.courses) {
            const master = rawDeptData._master.courses.find(c => c.name === b.subjectName || c.code === b.subjectCode);
            if (master && master.faculty) faculties.add(master.faculty);
        }
    });
    
    const arr = Array.from(faculties);
    if (arr.length === 0) return 'No faculty mapped';
    if (arr.length === 1) return arr[0];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0' }}>
        {arr.map((f, i) => <div key={i}>• {f}</div>)}
      </div>
    );
  };

  const renderEditor = (item, setItem, isEditMode) => {
      const updateBatchFieldLocal = (bid, field, val) => {
          setItem({
              ...item, 
              batches: item.batches.map(b => b.id === bid ? { ...b, [field]: val } : b)
          });
      };
      const addBatchRowLocal = () => {
          const last = item.batches[item.batches.length - 1];
          const nId = Date.now() + Math.random();
          setItem({
              ...item,
              batches: [...item.batches, {
                  id: nId,
                  circleLabel: last ? String(parseInt(last.circleLabel || 0) + 1) : "1",
                  startTime: last ? last.endTime : '08:30',
                  endTime: last ? '12:30' : '10:30',
                  subjectCode: '', subjectName: '', faculty: '', scope: 'Common'
              }]
          });
      };
      const removeBatchRowLocal = (bid) => {
          setItem({
              ...item,
              batches: item.batches.filter(b => b.id !== bid)
          });
      };

      return (
          <>
          {/* BOX 1: Tag / Title / Date / Description */}
          <div className="settings-card exam-creator-card" style={isEditMode ? { marginTop: '16px', border: '1px solid var(--mac-blue-30)', background: 'var(--mac-bg)' } : { border: '2px solid var(--mac-blue-15)' }}>
            {!isEditMode && (
              <>
                <h2 className="editor-title" style={{ color: 'var(--mac-blue)' }}><RiComputerLine /> Create Special Class</h2>
                <p style={{ opacity: 0.7, marginBottom: '20px', fontSize: '13px' }}>Add special or online classes that appear like Practical Exam cards.</p>
              </>
            )}
            <div className="exam-config-grid">
              <div className="field">
                <label>Date</label>
                <HybridDateInput value={item.date} onChange={(val) => setItem({ ...item, date: val })} />
              </div>
              <div className="field">
                <label>Tag</label>
                <input className="event-input" value={item.typeTitle} onChange={e => setItem({ ...item, typeTitle: e.target.value })} placeholder="e.g. Online Class" />
              </div>
              <div className="field">
                <label>Headline</label>
                <input className="event-input" value={item.title} onChange={e => setItem({ ...item, title: e.target.value })} placeholder="Scheduled for Today" style={{ fontWeight: '500' }} />
              </div>
              <div className="field">
                <label>Description</label>
                <input className="event-input" value={item.desc} onChange={e => setItem({ ...item, desc: e.target.value })} placeholder="e.g. Lab Session / Zoom link" />
              </div>
            </div>
          </div>

          {/* BOX 2: Batch rows + actions */}
          <div className="settings-card exam-creator-card">
            <div className="subject-mapping-section">
              {item.batches.map((b, idx) => (
                <div key={b.id} className="exam-subject-row professional animate-slide-down" style={{ position: 'relative' }}>
                  <div className="input-group-vertical">
                    <label>Label</label>
                    <input className="event-input" style={{ textAlign: 'center' }} value={b.circleLabel} onChange={e => updateBatchFieldLocal(b.id, 'circleLabel', e.target.value)} placeholder="1" />
                  </div>
                  <div className="input-group-vertical">
                    <label>Start</label>
                    <input className="event-input" type="time" value={b.startTime} onChange={e => updateBatchFieldLocal(b.id, 'startTime', e.target.value)} />
                  </div>
                  <div className="input-group-vertical">
                    <label>End</label>
                    <input className="event-input" type="time" value={b.endTime} onChange={e => updateBatchFieldLocal(b.id, 'endTime', e.target.value)} />
                  </div>
                  <div className="input-group-vertical variant-code">
                    <label>Subject</label>
                    <select className="event-input" value={b.subjectName} onChange={e => {
                        const course = courses.find(c => c.name === e.target.value);
                        let updated = [...item.batches];
                        const bIdx = updated.findIndex(ub => ub.id === b.id);
                        if (bIdx > -1) {
                            updated[bIdx].subjectCode = course ? course.code : '';
                            updated[bIdx].faculty = course?.faculty || '';
                            updated[bIdx].subjectName = e.target.value;
                            setItem({ ...item, batches: updated });
                        }
                    }}>
                      <option value="">Select</option>
                      {courses.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group-vertical variant-scope">
                    <label>Scope</label>
                    <select className="event-input" value={b.scope || 'Common'} onChange={e => updateBatchFieldLocal(b.id, 'scope', e.target.value)}>
                        <option value="Common">Common (All Secs)</option>
                        {sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                    </select>
                  </div>
                  
                  <button 
                    className="btn-del-mini" 
                    onClick={() => {
                      showConfirm(
                        "Delete Class Period?",
                        "Are you sure you want to remove this class period?",
                        () => removeBatchRowLocal(b.id)
                      );
                    }}
                    title="Remove Class Batch"
                  >
                    <RiDeleteBin6Line />
                  </button>
                </div>
              ))}
              <button className="btn-add-line" onClick={addBatchRowLocal} style={{ marginTop: '16px' }}>
                <RiAddLine /> Add
              </button>
            </div>

            {item.batches.length > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button className="btn-save-master" style={{ flex: 1, height: '36px', fontSize: '13px', padding: '0 18px', borderRadius: '50px' }} onClick={() => isEditMode ? saveEdit() : handleSave()}>
                  Save
                </button>
                <button className="btn-cancel-mini" style={{ flex: 1, padding: '0 18px', height: '36px', fontSize: '13px', borderRadius: '50px' }} onClick={() => {
                    if (isEditMode) {
                        setEditingClassId(null);
                        setEditBuffer(null);
                    } else {
                        setItem({ id: null, date: '', typeTitle: 'Special Class', title: '', desc: '', batches: [] });
                    }
                }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
          </>
      );
  };

  return (
    <div className="exam-manager-container admin-subpage animate-fade-in">
      <header className="explorer-header focus-mode">
        <div className="breadcrumb-nav">
          {!isRep && viewLevel !== 'batches' && (
            <button className="explorer-back-btn" onClick={handleBack} style={{ marginRight: '12px' }}>
              <RiArrowLeftLine /> Back
            </button>
          )}

          <div className="breadcrumb-list">
            <span className="crumb-btn level-root" onClick={() => updateLevel('batches', { batch: '', dept: '' })}>Classes</span>

            {/* Mobile Truncation Ellipsis */}
            <span className="crumb-ellipsis-container">
                <RiArrowRightSLine className="crumb-sep" />
                <span className="crumb-static">...</span>
            </span>

            {path.batch && <><RiArrowRightSLine className="crumb-sep level-batch-sep" /> <span className="crumb-btn level-batch" onClick={() => updateLevel('depts', { dept: '' })}>{path.batch}</span></>}
            {path.dept && <><RiArrowRightSLine className="crumb-sep level-dept-sep" /> <span className="crumb-static level-dept">{path.dept}</span></>}
          </div>
        </div>
      </header>

      {viewLevel !== 'editor' ? (
        <div className="explorer-content explorer-grid">
           {viewLevel === 'batches' && Object.keys(hierarchy || {}).sort().reverse().map(b => (
            <div key={b} className="explorer-card" onClick={() => updateLevel('depts', { batch: b })}>
              <RiTeamLine className="card-icon" /> <div className="card-info"><h3>Batch {b}</h3><p>Select Department</p></div>
            </div>
          ))}
          {viewLevel === 'depts' && path.batch && Object.keys(hierarchy[path.batch] || {}).filter(k => k !== 'initialized').map(d => (
            <div key={d} className="explorer-card" onClick={() => updateLevel('editor', { dept: d })}>
              <RiLayoutGridLine className="card-icon" /> <div className="card-info"><h3>{d}</h3><p>Manage Special Classes</p></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="exam-editor-workspace">
          {/* SECTION HEADER WITH EDIT LIST BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-divider-title" style={{ margin: 0, border: 'none', color: 'var(--mac-text)', textTransform: 'none', fontSize: '15px', fontWeight: 700, padding: 0 }}>Special Classes</h3>
              {isEditListMode ? (
                  <div className="master-header-row" style={{ display: 'flex', gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
                      <button
                          className="role-header-pill secondary"
                          onClick={() => { setIsEditListMode(false); setShowCreator(false); }}
                          style={{ minWidth: '90px' }}
                      >
                          Cancel
                      </button>
                      <button
                          className="role-header-pill active"
                          onClick={() => { setIsEditListMode(false); setShowCreator(false); }}
                          style={{ minWidth: '90px' }}
                      >
                          Done
                      </button>
                  </div>
              ) : (
                  <button
                       className="edit-list-btn"
                       onClick={() => { setIsEditListMode(true); setShowCreator(true); }}
                   >
                       <RiEditLine style={{ marginRight: '6px' }} /> Edit List
                   </button>
              )}
          </div>

          {/* 1. CREATOR SECTION */}
          {isEditListMode && showCreator && renderEditor(newClass, setNewClass, false)}

          <div className="published-exams-section">
            {/* The section title and edit list button were moved to the top */}
            {isSyncing ? (
              <p style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>Syncing...</p>
            ) : specialClasses.length > 0 ? (
              specialClasses.map(sc => {
                const isEditing = editingClassId === sc.id;
                const currentData = isEditing ? editBuffer : sc;

                return (
                  <React.Fragment key={sc.id}>
                    {/* Desktop Save/Cancel above card — exactly like ExamManager */}
                    {isEditing && (
                        <div className="master-header-row pill-group-row desktop-edit-actions" style={{ justifyContent: 'flex-end', marginBottom: '8px' }}>
                            <button className="role-header-pill secondary" onClick={() => { setEditingClassId(null); setEditBuffer(null); }}>Cancel</button>
                            <button className="role-header-pill active" onClick={saveEdit}>Save</button>
                        </div>
                    )}
                    <div className={`settings-card published-exam-card ${isEditing ? 'editing-active' : ''}`}>
                  <header 
                    className="published-header" 
                    style={{ alignItems: 'center', cursor: !isEditing ? 'pointer' : 'default' }}
                    onClick={(e) => {
                        if (isEditing) return;
                        if (e.target.closest('button') || e.target.closest('input')) return;
                        if (isDeleteMode) return;
                        setExpandedClasses(prev => prev.includes(sc.id) ? prev.filter(id => id !== sc.id) : [...prev, sc.id]);
                    }}
                  >
                    {isEditing ? (
                        <div className="edit-meta-inputs" style={{ flex: 1 }}>
                            {/* Mobile Save/Cancel inside header — exactly like ExamManager */}
                            <div className="mobile-edit-actions pill-group-row master-header-row" style={{ width: '100%', flexDirection: 'row', gap: '8px', marginBottom: '16px' }}>
                                <button className="role-header-pill secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setEditingClassId(null); setEditBuffer(null); }}>Cancel</button>
                                <button className="role-header-pill active" style={{ flex: 1, justifyContent: 'center' }} onClick={saveEdit}>Save</button>
                            </div>
                            <input className="edit-title-input" value={currentData.typeTitle || ''} onChange={e => setEditBuffer({ ...editBuffer, typeTitle: e.target.value })} placeholder="Tag e.g. Special Class" />
                            <div className="exam-config-grid" style={{ marginTop: '20px', marginBottom: '0', paddingBottom: '0', borderBottom: 'none' }}>
                                <div className="input-group-vertical">
                                    <label>Date</label>
                                    <HybridDateInput value={currentData.date} onChange={(val) => setEditBuffer({ ...editBuffer, date: val })} />
                                </div>
                                <div className="input-group-vertical">
                                    <label>Headline</label>
                                    <input className="event-input" value={currentData.title || ''} onChange={e => setEditBuffer({ ...editBuffer, title: e.target.value })} placeholder="Scheduled for Today" />
                                </div>
                                <div className="input-group-vertical" style={{ gridColumn: '1 / -1' }}>
                                    <label>Description</label>
                                    <input className="event-input" value={currentData.desc || ''} onChange={e => setEditBuffer({ ...editBuffer, desc: e.target.value })} placeholder="e.g. Lab Session / Zoom link" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isDeleteMode && (
                                <input
                                    type="checkbox"
                                    className="mac-checkbox"
                                    style={{ marginRight: '16px', flexShrink: 0 }}
                                    checked={selectedClasses.includes(sc.id)}
                                    onChange={(e) => { e.stopPropagation(); toggleSelectClass(sc.id); }}
                                />
                            )}
                            <div className="pub-title-group" style={{ flex: 1 }}>
                              <RiComputerLine className="icon-main" style={{ color: 'var(--mac-blue)' }} />
                              <div>
                                <h3>{sc.typeTitle} {sc.title && `— ${sc.title}`}</h3>
                                <p>{parseDate(sc.date)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              </div>
                            </div>
                        </>
                    )}
                    <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {!isEditing && isEditListMode && !isMobile && (
                              <button className="pill-inline-edit" style={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); handleEditEntry(sc); }}><RiEditLine /></button>
                          )}
                          {!isEditing && (
                              <div className={`manager-collapsible-icon ${expandedClasses.includes(sc.id) ? 'open' : ''}`}>
                                  <RiArrowDownSLine />
                              </div>
                          )}
                    </div>
                  </header>

                  {!isEditing && isEditListMode && isMobile && (
                      <button className="pill-inline-edit" style={{ opacity: 1, margin: '0 auto 12px' }} onClick={(e) => { e.stopPropagation(); handleEditEntry(sc); }}><RiEditLine /></button>
                  )}

                  <div className={`manager-collapsible-body-anim ${expandedClasses.includes(sc.id) || isEditing ? 'open' : ''}`}>
                      <div className="manager-collapsible-body-inner">
                          <div className="published-subjects-container">
                    {isEditing ? (
                        <>
                            {currentData.batches.map((b, idx) => (
                                <div key={b.id} className="exam-subject-row professional editing">
                                    <div className="input-group-vertical">
                                        <label>Label</label>
                                        <input className="event-input" style={{ textAlign: 'center' }} value={b.circleLabel} onChange={e => { let batches = [...editBuffer.batches]; batches[idx].circleLabel = e.target.value; setEditBuffer({ ...editBuffer, batches }); }} placeholder="1" />
                                    </div>
                                    <div className="input-group-vertical">
                                        <label>Start</label>
                                        <input className="event-input" type="time" value={b.startTime} onChange={e => { let batches = [...editBuffer.batches]; batches[idx].startTime = e.target.value; setEditBuffer({ ...editBuffer, batches }); }} />
                                    </div>
                                    <div className="input-group-vertical">
                                        <label>End</label>
                                        <input className="event-input" type="time" value={b.endTime} onChange={e => { let batches = [...editBuffer.batches]; batches[idx].endTime = e.target.value; setEditBuffer({ ...editBuffer, batches }); }} />
                                    </div>
                                    <div className="input-group-vertical variant-code">
                                        <label>Subject</label>
                                        <select className="event-input" value={b.subjectName} onChange={e => {
                                            const course = courses.find(c => c.name === e.target.value);
                                            let batches = [...editBuffer.batches];
                                            batches[idx].subjectCode = course ? course.code : '';
                                            batches[idx].faculty = course?.faculty || '';
                                            batches[idx].subjectName = e.target.value;
                                            setEditBuffer({ ...editBuffer, batches });
                                        }}>
                                            <option value="">Select</option>
                                            {courses.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group-vertical variant-scope">
                                        <label>Scope</label>
                                        <select className="event-input" value={b.scope || 'Common'} onChange={e => { let batches = [...editBuffer.batches]; batches[idx].scope = e.target.value; setEditBuffer({ ...editBuffer, batches }); }}>
                                            <option value="Common">Common (All Secs)</option>
                                            {sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                                        </select>
                                    </div>
                                    <button className="btn-del-mini" onClick={() => {
                                        showConfirm("Remove Period?", "Remove this class period?", () => { let batches = editBuffer.batches.filter((_, i) => i !== idx); setEditBuffer({ ...editBuffer, batches }); });
                                    }}><RiDeleteBin6Line /></button>
                                </div>
                            ))}
                            <button className="btn-add-line" onClick={() => {
                                const last = editBuffer.batches[editBuffer.batches.length - 1];
                                const nId = Date.now() + Math.random();
                                setEditBuffer({
                                    ...editBuffer,
                                    batches: [...editBuffer.batches, {
                                        id: nId,
                                        circleLabel: last ? String(parseInt(last.circleLabel || 0) + 1) : "1",
                                        startTime: last ? last.endTime : '08:30',
                                        endTime: last ? '12:30' : '10:30',
                                        subjectCode: '', subjectName: '', faculty: '', scope: 'Common'
                                    }]
                                });
                            }}><RiAddLine /> Add Period</button>
                        </>
                    ) : (
                        sc.batches.map((b, i) => (
                            <div key={i} className="exam-subject-row professional view-mode">
                                <div className="view-cell date-cell"><label>Label</label><span>{b.circleLabel}</span></div>
                                <div className="view-cell subject-cell"><label>Subject</label><span><strong>{b.subjectCode}</strong>: {b.subjectName}</span></div>
                                <div className="view-cell portion-cell" style={{ maxWidth: '100px' }}>
                                    <label>Scope</label>
                                    <span className="portion-badge" style={{ background: b.scope === 'Common' ? 'rgba(40,200,64,0.1)' : 'rgba(255,149,0,0.1)', color: b.scope === 'Common' ? 'var(--mac-success-text)' : 'var(--mac-warning-text)' }}>{b.scope || 'Common'}</span>
                                </div>
                                <div className="view-cell time-cell"><label>Time</label><span>{convertTo12Hour(b.startTime)} - {convertTo12Hour(b.endTime)}</span></div>
                            </div>
                        ))
                    )}
                          </div>
                      </div>
                  </div>
                </div>
                  </React.Fragment>
              )})
            ) : (
              <div className="event-empty-state" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                No special classes scheduled for this section.
              </div>
            )}

            {/* BULK ACTION FOOTER */}
            {isEditListMode && (
                <div className={`bulk-action-footer-premium animate-slide-up ${isDeleteMode ? 'danger-mode' : ''}`}>
                    {isDeleteMode ? (
                        <div className="bulk-delete-action-row">
                            <div className="bulk-delete-info">
                                <div className="info-icon">
                                    <RiDeleteBin6Fill />
                                </div>
                                <div className="bulk-delete-text">
                                    <span className="bulk-delete-title">
                                        {selectedClasses.length === 0 ? "Select Items" : `${selectedClasses.length} Selected`}
                                    </span>
                                    <span className="bulk-delete-desc">Choose classes to delete</span>
                                </div>
                            </div>
                            <div className="pill-group">
                                <button
                                    className="premium-pill-btn primary"
                                    onClick={handleSelectAllClasses}
                                >
                                    {selectedClasses.length === specialClasses.length && specialClasses.length > 0 ? 'Deselect All' : 'Select All'}
                                </button>
                                <button className="premium-pill-btn secondary" onClick={() => { setSelectedClasses([]); setIsDeleteMode(false); }}>Cancel</button>
                                <button className="premium-pill-btn danger" onClick={handleBulkDeleteEntries} disabled={selectedClasses.length === 0}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bulk-delete-start-row">
                            <div className="bulk-delete-info">
                                <div className="info-icon">
                                    <RiComputerLine />
                                </div>
                                <div className="bulk-delete-text">
                                    <span className="bulk-delete-title">Manage Classes</span>
                                    <span className="bulk-delete-desc">Select and remove multiple classes at once</span>
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
        </div>
      )}
      
      {/* --- CONFIRMATION MODAL (PORTAL) --- */}
      {confirmModal.show && createPortal(
          <div className="modal-overlay animate-fade-in" onClick={closeConfirm}>
              <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                      <RiDeleteBin6Line className="modal-icon-danger" />
                      <h3>{confirmModal.title}</h3>
                  </div>
                  <p className="modal-message">{confirmModal.message}</p>
                  <div className="modal-footer">
                      <button className="btn-modal-cancel" onClick={closeConfirm}>Cancel</button>
                      <button className="btn-modal-confirm" onClick={() => { 
                          if (confirmModal.onConfirm) confirmModal.onConfirm(); 
                          closeConfirm(); 
                      }}>Delete</button>
                  </div>
              </div>
          </div>,
          document.body
      )}

    </div>
  );
};

export default SpecialClassManager;

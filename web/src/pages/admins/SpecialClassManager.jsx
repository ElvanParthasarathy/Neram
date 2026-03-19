import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set, update } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  RiComputerLine, RiTimeLine, RiDeleteBin6Line, RiEditLine,
  RiAddLine, RiArrowRightSLine, RiTeamLine, RiLayoutGridLine, RiArrowLeftLine,
  RiUserLine, RiBookOpenLine, RiHashtag
} from 'react-icons/ri';
import { convertTo12Hour } from '../../utils/timeUtils';

const SpecialClassManager = ({ user, userProfile }) => {
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

  // Form State
  const [newClass, setNewClass] = useState({
    id: null,
    date: '',
    typeTitle: 'Special Class',
    title: '',
    desc: '',
    batches: [
      { id: Date.now(), circleLabel: '1', startTime: '08:30', endTime: '10:15', subjectCode: '', subjectName: '', faculty: '', scope: 'Common' }
    ]
  });

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
    setNewClass({
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!newClass.date) return alert("Please select a date.");
    if (newClass.batches.some(b => !b.subjectName)) return alert("Please enter subject names for all classes.");

    try {
      const payloadId = newClass.id || `sc_${Date.now()}`;
      const updates = {};
      
      sections.forEach(secId => {
          const secCourses = rawDeptData[secId]?.courses || [];
          
          const applicableBatches = newClass.batches.filter(b => b.scope === 'Common' || b.scope === secId)
              .map(b => {
                  const newB = { ...b };
                  
                  // Dynamically resolve the correct faculty for this highly-specific section
                  const matchedSecCourse = secCourses.find(c => c.name === newB.subjectName || c.code === newB.subjectCode);
                  if (matchedSecCourse && matchedSecCourse.faculty) {
                      newB.faculty = matchedSecCourse.faculty;
                  } else if (rawDeptData._master?.courses) {
                      const masterCourse = rawDeptData._master.courses.find(c => c.name === newB.subjectName || c.code === newB.subjectCode);
                      if (masterCourse && masterCourse.faculty) {
                           newB.faculty = masterCourse.faculty;
                      }
                  }
                  
                  // Ensure no undefined values to prevent Firebase crash
                  if (!newB.faculty) newB.faculty = '';
                  
                  delete newB.scopes; 
                  delete newB.scope; // STRIP scope out for standard mobile consumer view
                  return newB;
              });
              
              // Filter out the EXISTING one (if editing) AND filter batches for scope
          const secSc = specialClasses.filter(sc => sc.id !== payloadId)
              .filter(sc => sc.batches.some(b => b.scopes?.includes(secId) || b.scope === 'Common'))
              .map(sc => {
                  const newSc = { ...sc };
                  newSc.batches = newSc.batches.filter(b => b.scopes?.includes(secId) || b.scope === 'Common')
                      .map(b => { const nb = {...b}; delete nb.scopes; delete nb.scope; return nb; });
                  return newSc;
              });

          if (applicableBatches.length > 0) {
              const finalPayload = { id: payloadId, date: newClass.date, typeTitle: newClass.typeTitle, title: newClass.title, desc: newClass.desc, batches: applicableBatches };
              updates[`schedules/${path.batch}/${path.dept}/${secId}/specialClasses`] = [...secSc, finalPayload];
          } else {
              // If we are editing and this section no longer has applicable batches, we push the filtered array to delete it
              const oldExistedHere = specialClasses.some(sc => sc.id === payloadId && sc.batches.some(b => b.scopes?.includes(secId) || b.scope === 'Common'));
              if (oldExistedHere) {
                  updates[`schedules/${path.batch}/${path.dept}/${secId}/specialClasses`] = secSc;
              }
          }
      });

      if (Object.keys(updates).length > 0) {
          await update(ref(db), updates);
      }
      
      // Reset
      setNewClass({
        id: null,
        date: '',
        typeTitle: 'Special Class',
        title: '',
        desc: '',
        batches: [{ id: Date.now(), circleLabel: '1', startTime: '08:30', endTime: '10:15', subjectCode: '', subjectName: '', faculty: '', scope: 'Common' }]
      });
    } catch (err) {
      alert("Error saving: " + err.message);
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
            <span className="crumb-btn" onClick={() => updateLevel('batches', { batch: '', dept: '' })}>Hierarchy</span>
            {path.batch && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-btn" onClick={() => updateLevel('depts', { dept: '' })}>{path.batch}</span></>}
            {path.dept && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-static">{path.dept}</span></>}
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
          <div className="settings-card exam-creator-card" style={{ border: '2px solid var(--mac-blue-15)' }}>
            <h2 className="editor-title" style={{ color: 'var(--mac-blue)' }}><RiComputerLine /> Create Special Class</h2>
            <p style={{ opacity: 0.7, marginBottom: '20px', fontSize: '13px' }}>Add special or online classes that appear like Practical Exam cards.</p>

            <div className="exam-config-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="field">
                <label>Date</label>
                <DatePicker
                  selected={parseDate(newClass.date)}
                  onChange={(date) => setNewClass({ ...newClass, date: toISODate(date) })}
                  dateFormat="dd/MM/yyyy"
                  className="custom-datepicker-input"
                  placeholderText="Pick Date"
                />
              </div>
              <div className="field">
                <label>Tag (e.g. Special Class)</label>
                <input
                  className="event-input"
                  value={newClass.typeTitle}
                  onChange={e => setNewClass({ ...newClass, typeTitle: e.target.value })}
                  placeholder="e.g. Online Class"
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Main Headline</label>
                <input
                  className="event-input"
                  value={newClass.title}
                  onChange={e => setNewClass({ ...newClass, title: e.target.value })}
                  placeholder="Scheduled for Today"
                  style={{ fontWeight: '500' }}
                />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Description (Subtitle)</label>
                <input
                  className="event-input"
                  value={newClass.desc}
                  onChange={e => setNewClass({ ...newClass, desc: e.target.value })}
                  placeholder="Special classroom session or online meeting"
                />
              </div>
            </div>

            <div className="batch-rows-container" style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.6, marginBottom: '10px' }}>Class Batches / Periods</h4>
              {newClass.batches.map((b, idx) => (
                <div key={b.id} className="exam-subject-row professional" style={{ padding: '15px', background: 'var(--mac-bg-alt)', borderRadius: '12px', marginBottom: '10px', gap: '10px' }}>
                  <div className="input-group-vertical" style={{ width: '60px' }}>
                    <label>Label</label>
                    <input style={{ textAlign: 'center' }} value={b.circleLabel} onChange={e => updateBatchField(b.id, 'circleLabel', e.target.value)} placeholder="1" />
                  </div>
                  <div className="input-group-vertical" style={{ width: '100px' }}>
                    <label>Start</label>
                    <input type="time" value={b.startTime} onChange={e => updateBatchField(b.id, 'startTime', e.target.value)} />
                  </div>
                  <div className="input-group-vertical" style={{ width: '100px' }}>
                    <label>End</label>
                    <input type="time" value={b.endTime} onChange={e => updateBatchField(b.id, 'endTime', e.target.value)} />
                  </div>
                  <div className="input-group-vertical" style={{ flex: 1 }}>
                    <label>Subject</label>
                    <select className="event-input" value={b.subjectName} onChange={e => {
                        const course = courses.find(c => c.name === e.target.value);
                        updateBatchField(b.id, 'subjectCode', course ? course.code : '');
                        updateBatchField(b.id, 'faculty', course?.faculty || '');
                        updateBatchField(b.id, 'subjectName', e.target.value);
                    }}>
                      <option value="">Select Subject</option>
                      {courses.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group-vertical" style={{ flex: 0.6 }}>
                    <label>Faculty</label>
                    <div style={{ padding: '8px 12px', background: 'var(--mac-bg)', borderRadius: '8px', fontSize: '13px', opacity: 0.7, border: '1px solid transparent', display: 'flex', alignItems: 'center', minHeight: '38px', boxSizing: 'border-box' }}>
                      {getDisplayFaculty(b)}
                    </div>
                  </div>
                  <div className="input-group-vertical" style={{ width: '100px' }}>
                    <label>Scope</label>
                    <select className="event-input" value={b.scope || 'Common'} onChange={e => updateBatchField(b.id, 'scope', e.target.value)}>
                        <option value="Common">Common</option>
                        {sections.map(sec => <option key={sec} value={sec}>Sec {sec}</option>)}
                    </select>
                  </div>
                  <button className="row-del-btn" onClick={() => removeBatchRow(b.id)} style={{ color: 'var(--mac-red)', alignSelf: 'center' }}>
                    <RiDeleteBin6Line />
                  </button>
                </div>
              ))}
              <button className="btn-add-subject" onClick={addBatchRow} style={{ marginTop: '5px' }}>
                <RiAddLine /> Add Another Class/Period
              </button>
            </div>

            <button className="btn-save-master publish-btn" onClick={handleSave} style={{ marginTop: '20px' }}>
              {newClass.id ? 'Save Changes' : 'Save Special Class Entry'}
            </button>
            {newClass.id && (
              <button className="btn-save-master" onClick={() => setNewClass({ id: null, date: '', typeTitle: 'Special Class', title: '', desc: '', batches: [{ id: Date.now(), circleLabel: '1', startTime: '08:30', endTime: '10:15', subjectCode: '', subjectName: '', faculty: '', scope: 'Common' }] })} style={{ marginTop: '10px', background: 'transparent', border: '1px solid var(--mac-border)', color: 'var(--mac-text)' }}>
                Cancel Edit
              </button>
            )}
          </div>

          <div className="published-exams-section">
            <h3 className="section-divider-title">Existing Special Classes</h3>
            {isSyncing ? (
              <p style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>Syncing...</p>
            ) : specialClasses.length > 0 ? (
              specialClasses.map(sc => (
                <div key={sc.id} className="settings-card published-exam-card">
                  <header className="published-header">
                    <div className="pub-title-group">
                      <RiComputerLine className="icon-main" style={{ color: 'var(--mac-blue)' }} />
                      <div>
                        <h3>{sc.typeTitle} {sc.title && `— ${sc.title}`}</h3>
                        <p>{parseDate(sc.date)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-del-mini" onClick={() => handleEditEntry(sc)} style={{ color: 'var(--mac-blue)' }}>
                        <RiEditLine /> Edit
                      </button>
                      <button className="btn-del-mini" onClick={() => handleDeleteEntry(sc.id)}>
                        <RiDeleteBin6Line /> Delete
                      </button>
                    </div>
                  </header>
                  <div className="published-content" style={{ padding: '0 16px 16px' }}>
                    {sc.batches.map((b, i) => (
                      <div key={i} className="mini-batch-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i === sc.batches.length - 1 ? 'none' : '1px solid var(--mac-border)' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--mac-blue-15)', color: 'var(--mac-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600 }}>
                          {b.circleLabel}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>
                            {b.subjectName} {b.scope && <span style={{ opacity: 0.7, fontWeight: 'normal' }}>({b.scope})</span>}
                          </p>
                          <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>{b.faculty} • {convertTo12Hour(b.startTime)} - {convertTo12Hour(b.endTime)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="event-empty-state" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                No special classes scheduled for this section.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialClassManager;

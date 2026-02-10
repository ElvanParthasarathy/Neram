import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
// IMPORT DATEPICKER
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  RiTrophyLine, RiArrowRightSLine, RiTeamLine, RiLayoutGridLine,
  RiSave3Line, RiAddLine, RiDeleteBin6Line, RiBookOpenLine, RiEditLine, RiCloseLine, RiArrowLeftLine
} from 'react-icons/ri';

const PORTION_DEFAULTS = {
  'CT1': 'Unit 1',
  'IA1': 'Unit 1 & 2',
  'CT2': 'Unit 3',
  'IA2': 'Unit 3 & 4',
  'Model': 'Full Syllabus',
  'Practical': 'All Experiments',
  'Semester': 'Full Syllabus'
};

const ExamManager = ({ user, userProfile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasAutoNavigated = useRef(false);

  // --- ROLE DETECTION ---
  const emailRole = user?.email ? getHardcodedRole(user.email) : null;
  const finalRole = emailRole || userProfile?.role || 'student';
  const isRep = finalRole === 'rep';

  // --- HISTORY LOGIC (Classic Back Support) ---
  const viewLevel = searchParams.get('elvl') || 'batches';
  const path = {
    batch: searchParams.get('eb') || '',
    dept: searchParams.get('ed') || '',
    sec: searchParams.get('es') || ''
  };

  const updateLevel = (level, newPath = {}) => {
    const params = {
      mod: 'exams',
      elvl: level,
      eb: newPath.batch || path.batch,
      ed: newPath.dept || path.dept,
      es: newPath.sec || path.sec
    };
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    setSearchParams(params);
  };

  // Physical Back Button Logic
  const handleBack = () => {
    if (viewLevel === 'editor') updateLevel('secs', { sec: '' });
    else if (viewLevel === 'secs') updateLevel('depts', { dept: '' });
    else if (viewLevel === 'depts') updateLevel('batches', { batch: '' });
  };

  const [hierarchy, setHierarchy] = useState({});
  const [masterData, setMasterData] = useState({ courses: [], exams: [] });
  const [newExam, setNewExam] = useState({ type: 'CT1', title: '', startDate: '', endDate: '', subjects: [] });

  const [editingExamId, setEditingExamId] = useState(null);
  const [editBuffer, setEditBuffer] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => setHierarchy(snap.val() || {}));
    return () => unsub();
  }, []);

  // --- AUTO-NAVIGATE FOR REPS: Skip hierarchy, go straight to their section ---
  useEffect(() => {
    if (isRep && !hasAutoNavigated.current && userProfile?.batch && userProfile?.department && userProfile?.section) {
      hasAutoNavigated.current = true;
      const params = {
        mod: 'exams',
        elvl: 'editor',
        eb: userProfile.batch,
        ed: userProfile.department,
        es: userProfile.section
      };
      setSearchParams(params, { replace: true });
    }
  }, [isRep, userProfile]);

  useEffect(() => {
    if (viewLevel === 'editor' && path.sec) {
      const examRef = ref(db, `schedules/${path.batch}/${path.dept}/${path.sec}`);
      const unsub = onValue(examRef, (snap) => {
        const data = snap.val() || {};
        setMasterData({ courses: data.courses || [], exams: data.exams || [] });
      });
      return () => unsub();
    }
  }, [viewLevel, path.batch, path.dept, path.sec]);

  // --- DATE HELPERS: Bridge between DB (yyyy-mm-dd) and DatePicker (Date Object) ---
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    // Handle yyyy-mm-dd
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return "";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getSubjectName = (code) => {
    return masterData.courses.find(c => c.code === code)?.name || "Unknown Subject";
  };

  const syncExamsToDB = async (updatedExams) => {
    try {
      await set(ref(db, `schedules/${path.batch}/${path.dept}/${path.sec}/exams`), updatedExams);
      alert("Database Updated!");
    } catch (err) { alert(err.message); }
  };

  // --- PORTION LOGIC: Update portions when Exam Type changes ---
  const handleTypeChange = (newType) => {
    const defaultPortion = PORTION_DEFAULTS[newType] || 'Full Syllabus';
    const updatedSubjects = newExam.subjects.map(s => ({ ...s, portion: defaultPortion }));
    setNewExam({ ...newExam, type: newType, subjects: updatedSubjects });
  };

  const startEditing = (ex) => {
    const migratedSubjects = (ex.subjects || []).map(s => ({
      ...s,
      startTime: s.startTime || (s.time ? s.time.split('-')[0].trim() : '08:30'),
      endTime: s.endTime || (s.time ? s.time.split('-')[1].trim() : '11:30'),
      portion: s.portion || PORTION_DEFAULTS[ex.type] || 'Full Syllabus'
    }));
    setEditBuffer({ ...ex, subjects: migratedSubjects });
    setEditingExamId(ex.id);
  };

  const saveEdit = () => {
    if (!editBuffer) return;
    const updatedList = (masterData.exams || []).map(e => e.id === editingExamId ? editBuffer : e);
    syncExamsToDB(updatedList);
    setEditingExamId(null);
    setEditBuffer(null);
  };

  const handlePublish = () => {
    if (!newExam.title || newExam.subjects.length === 0) return alert("Fill details first");
    const updated = [...(masterData.exams || []), { ...newExam, id: Date.now() }];
    syncExamsToDB(updated);
    setNewExam({ type: 'CT1', title: '', startDate: '', endDate: '', subjects: [] });
  };

  return (
    <div className="exam-manager-container admin-subpage animate-fade-in">
      <header className="explorer-header">
        <div className="breadcrumb-nav">
          {!isRep && viewLevel !== 'batches' && (
            <button className="back-btn-minimal" onClick={handleBack} style={{ marginRight: '12px' }}>
              <RiArrowLeftLine /> Back
            </button>
          )}

          {isRep ? (
            /* STATIC HEADER FOR REPS - FULL BLOCKING */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--mac-text)', fontSize: '15px' }}>
              <RiTrophyLine style={{ fontSize: '18px', color: 'var(--mac-accent)' }} />
              <span>{path.batch}</span>
              <span style={{ color: 'var(--mac-text-secondary)' }}>/</span>
              <span>{path.dept}</span>
              <span style={{ color: 'var(--mac-text-secondary)' }}>/</span>
              <span>Sec {path.sec}</span>
            </div>
          ) : (
            /* INTERACTIVE BREADCRUMBS FOR OTHERS */
            <>
              <span className="crumb-btn" onClick={() => updateLevel('batches', { batch: '', dept: '', sec: '' })}>Exams</span>
              {path.batch && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => updateLevel('depts', { dept: '', sec: '' })}>{path.batch}</span></>}
              {path.dept && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => updateLevel('secs', { sec: '' })}>{path.dept}</span></>}
              {path.sec && <><RiArrowRightSLine /> <span className="crumb-static">Sec {path.sec}</span></>}
            </>
          )}
        </div>
      </header>

      {viewLevel !== 'editor' ? (
        <div className="explorer-content explorer-grid">
          {viewLevel === 'batches' && Object.keys(hierarchy || {}).sort().reverse().map(b => (
            <div key={b} className="explorer-card" onClick={() => updateLevel('depts', { batch: b })}>
              <RiTeamLine className="card-icon" /> <div className="card-info"><h3>Batch {b}</h3><p>Manage Exams</p></div>
            </div>
          ))}
          {viewLevel === 'depts' && path.batch && Object.keys(hierarchy[path.batch] || {}).filter(k => k !== 'initialized').map(d => (
            <div key={d} className="explorer-card" onClick={() => updateLevel('secs', { dept: d })}>
              <RiLayoutGridLine className="card-icon" /> <div className="card-info"><h3>{d}</h3><p>Select Section</p></div>
            </div>
          ))}
          {viewLevel === 'secs' && path.batch && path.dept && (hierarchy[path.batch]?.[path.dept] || []).map(s => (
            <div key={s} className="explorer-card" onClick={() => updateLevel('editor', { sec: s })}>
              <div className="card-initial">{s}</div> <div className="card-info"><h3>Section {s}</h3><p>Manage Exams</p></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="exam-editor-workspace">

          {/* 1. CREATOR SECTION */}
          <div className="settings-card exam-creator-card">
            <h2 className="editor-title"><RiTrophyLine /> Create New Timetable</h2>
            <div className="exam-config-grid">
              <div className="field">
                <label>Exam Type</label>
                <select value={newExam.type} onChange={e => handleTypeChange(e.target.value)}>
                  {Object.keys(PORTION_DEFAULTS).map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div className="field"><label>Title</label><input value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} placeholder="e.g. IA-1 Oct" /></div>

              {/* DATEPICKER: Show From */}
              <div className="field">
                <label>Show From</label>
                <DatePicker
                  selected={parseDate(newExam.startDate)}
                  onChange={(date) => setNewExam({ ...newExam, startDate: formatDate(date) })}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  className="custom-datepicker-input"
                />
              </div>

              {/* DATEPICKER: Show Until */}
              <div className="field">
                <label>Show Until</label>
                <DatePicker
                  selected={parseDate(newExam.endDate)}
                  onChange={(date) => setNewExam({ ...newExam, endDate: formatDate(date) })}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  className="custom-datepicker-input"
                />
              </div>
            </div>

            <div className="subject-mapping-section">
              {newExam.subjects.map((sub, idx) => (
                <div key={idx} className="exam-subject-row professional">
                  <div className="input-group-vertical">
                    <label>Date</label>
                    {/* DATEPICKER: Subject Date */}
                    <DatePicker
                      selected={parseDate(sub.date)}
                      onChange={(date) => { let s = [...newExam.subjects]; s[idx].date = formatDate(date); setNewExam({ ...newExam, subjects: s }); }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="dd/mm/yyyy"
                      className="custom-datepicker-input"
                    />
                  </div>
                  <div className="input-group-vertical" style={{ flex: 2 }}>
                    <label>Subject</label>
                    <select value={sub.code} onChange={e => { let s = [...newExam.subjects]; s[idx].code = e.target.value; setNewExam({ ...newExam, subjects: s }); }}>
                      <option value="">Select Course</option>
                      {masterData.courses.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group-vertical" style={{ flex: 1.5 }}>
                    <label>Portion</label>
                    <input
                      list="portion-presets"
                      value={sub.portion}
                      onChange={e => { let s = [...newExam.subjects]; s[idx].portion = e.target.value; setNewExam({ ...newExam, subjects: s }); }}
                      placeholder="Portion..."
                    />
                  </div>
                  <div className="input-group-vertical"><label>Start</label><input type="time" value={sub.startTime} onChange={e => { let s = [...newExam.subjects]; s[idx].startTime = e.target.value; setNewExam({ ...newExam, subjects: s }); }} /></div>
                  <div className="input-group-vertical"><label>End</label><input type="time" value={sub.endTime} onChange={e => { let s = [...newExam.subjects]; s[idx].endTime = e.target.value; setNewExam({ ...newExam, subjects: s }); }} /></div>
                  <button className="btn-del-mini" style={{ marginTop: '20px' }} onClick={() => setNewExam({ ...newExam, subjects: newExam.subjects.filter((_, i) => i !== idx) })}><RiDeleteBin6Line /></button>
                </div>
              ))}

              <datalist id="portion-presets">
                {Object.values(PORTION_DEFAULTS).map(p => <option key={p} value={p} />)}
              </datalist>

              <button className="btn-add-line" onClick={() => setNewExam({ ...newExam, subjects: [...newExam.subjects, { date: '', code: '', startTime: '08:30', endTime: '11:30', portion: PORTION_DEFAULTS[newExam.type] }] })}><RiAddLine /> Add Subject Day</button>
              <button className="btn-save-master" onClick={handlePublish} style={{ width: '100%', marginTop: '15px' }}>Publish New Exam</button>
            </div>
          </div>


          {/* 2. PUBLISHED SECTION */}
          <div className="published-exams-section">
            <h3 className="section-divider-title">Active Timetables</h3>
            {(masterData.exams || []).map(ex => {
              const isEditing = editingExamId === ex.id;
              const currentData = isEditing ? editBuffer : ex;

              return (
                <div key={ex.id} className={`settings-card published-exam-card ${isEditing ? 'editing-active' : ''}`}>
                  <header className="published-header">
                    {isEditing ? (
                      <div className="edit-meta-inputs">
                        <input className="edit-title-input" value={currentData.title} onChange={e => setEditBuffer({ ...editBuffer, title: e.target.value })} />
                        <div className="date-group">
                          <label>Range:</label>
                          {/* DATEPICKER: Edit Start */}
                          <DatePicker
                            selected={parseDate(currentData.startDate)}
                            onChange={date => setEditBuffer({ ...editBuffer, startDate: formatDate(date) })}
                            dateFormat="dd/MM/yyyy"
                            className="inline-datepicker"
                          />
                          <span>to</span>
                          {/* DATEPICKER: Edit End */}
                          <DatePicker
                            selected={parseDate(currentData.endDate)}
                            onChange={date => setEditBuffer({ ...editBuffer, endDate: formatDate(date) })}
                            dateFormat="dd/MM/yyyy"
                            className="inline-datepicker"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="pub-title-group">
                        <RiTrophyLine className="icon-main" />
                        <div>
                          <h3>{ex.title} <span>({ex.type})</span></h3>
                          {/* DISPLAY: View Mode Range */}
                          <p>Visible: {parseDate(ex.startDate)?.toLocaleDateString('en-GB') || ex.startDate} to {parseDate(ex.endDate)?.toLocaleDateString('en-GB') || ex.endDate}</p>
                        </div>
                      </div>
                    )}

                    <div className="header-actions">
                      {isEditing ? (
                        <>
                          <button className="btn-save-mini" onClick={saveEdit}>Save</button>
                          <button className="btn-cancel-mini" onClick={() => { setEditingExamId(null); setEditBuffer(null); }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-edit-mini" onClick={() => startEditing(ex)}><RiEditLine /> Edit</button>
                          <button className="btn-del-mini" onClick={() => { if (window.confirm("Delete entire timetable?")) syncExamsToDB(masterData.exams.filter(e => e.id !== ex.id)); }}><RiDeleteBin6Line /> Delete</button>
                        </>
                      )}
                    </div>
                  </header>

                  <table className="preview-table published-style">
                    <thead><tr><th>Date</th><th>Subject</th><th>Time</th><th>Portion</th>{isEditing && <th>Action</th>}</tr></thead>
                    <tbody>
                      {(currentData.subjects || []).map((s, i) => (
                        <tr key={i}>
                          {isEditing ? (
                            <>
                              <td>
                                {/* DATEPICKER: Edit Table Row */}
                                <DatePicker
                                  selected={parseDate(s.date)}
                                  onChange={date => { let subs = [...editBuffer.subjects]; subs[i].date = formatDate(date); setEditBuffer({ ...editBuffer, subjects: subs }); }}
                                  dateFormat="dd/MM/yyyy"
                                  className="table-input"
                                  placeholderText="dd/mm/yyyy"
                                />
                              </td>
                              <td>
                                <select className="table-input" value={s.code} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].code = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }}>
                                  <option value="">Select</option>
                                  {masterData.courses.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                </select>
                              </td>
                              <td>
                                <div className="time-edit-cell">
                                  <input type="time" value={s.startTime} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].startTime = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }} />
                                  <input type="time" value={s.endTime} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].endTime = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }} />
                                </div>
                              </td>
                              <td>
                                <input
                                  list="portion-presets"
                                  className="table-input"
                                  value={s.portion}
                                  onChange={e => { let subs = [...editBuffer.subjects]; subs[i].portion = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }}
                                />
                              </td>
                              <td><button className="btn-del-mini" onClick={() => { let subs = editBuffer.subjects.filter((_, idx) => idx !== i); setEditBuffer({ ...editBuffer, subjects: subs }); }}><RiDeleteBin6Line /></button></td>
                            </>
                          ) : (
                            <>
                              {/* DISPLAY: View Mode Row */}
                              <td>{parseDate(s.date)?.toLocaleDateString('en-GB') || s.date}</td>
                              <td style={{ textAlign: 'left' }}><strong>{s.code}</strong>: {getSubjectName(s.code)}</td>
                              <td>{s.startTime} - {s.endTime}</td>
                              <td><span className="portion-badge">{s.portion}</span></td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {isEditing && <button className="btn-add-line" onClick={() => setEditBuffer({ ...editBuffer, subjects: [...editBuffer.subjects, { date: '', code: '', startTime: '08:30', endTime: '11:30', portion: PORTION_DEFAULTS[editBuffer.type] }] })}><RiAddLine /> Add Subject Day</button>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManager;
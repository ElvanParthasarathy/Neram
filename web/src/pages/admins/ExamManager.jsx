import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
// Using Native Browser Date Inputs
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

  // --- CONFIRMATION MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const closeConfirm = () => setConfirmModal({ ...confirmModal, show: false });

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

  // --- TIME HELPERS: Normalize between 12h display and 24h input ---
  const to24h = (time) => {
    if (!time) return "08:30";
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let [_, hours, minutes, modifier] = match;
      hours = parseInt(hours, 10);
      if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
    return time;
  };

  const to12h = (time) => {
    if (!time) return "";
    const match = time.match(/(\d+):(\d+)/);
    if (!match) return time;
    let [_, hours, minutes] = match;
    hours = parseInt(hours, 10);
    let modifier = 'AM';
    if (hours >= 12) {
      modifier = 'PM';
      if (hours > 12) hours -= 12;
    }
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;
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
      startTime: to24h(s.startTime || (s.time ? s.time.split('-')[0].trim() : '08:30')),
      endTime: to24h(s.endTime || (s.time ? s.time.split('-')[1].trim() : '11:30')),
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
      <header className="explorer-header focus-mode">
        <div className="breadcrumb-nav">
          {!isRep && viewLevel !== 'batches' && (
            <button className="explorer-back-btn" onClick={handleBack}>
              <RiArrowLeftLine /> Back
            </button>
          )}

          {isRep ? (
            /* STATIC HEADER FOR REPS - FULL BLOCKING */
            <div className="rep-static-path">
              <RiTrophyLine className="path-icon" />
              <span>{path.batch}</span>
              <span className="path-sep">/</span>
              <span>{path.dept}</span>
              <span className="path-sep">/</span>
              <span className="path-final">Sec {path.sec}</span>
            </div>
          ) : (
            /* INTERACTIVE BREADCRUMBS FOR OTHERS */
            <div className="breadcrumb-list">
              <span className="crumb-btn" onClick={() => updateLevel('batches', { batch: '', dept: '', sec: '' })}>Directory</span>
              {path.batch && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-btn" onClick={() => updateLevel('depts', { dept: '', sec: '' })}>{path.batch}</span></>}
              {path.dept && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-btn" onClick={() => updateLevel('secs', { sec: '' })}>{path.dept}</span></>}
              {path.sec && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-static">Sec {path.sec}</span></>}
            </div>
          )}
        </div>
      </header>

      {/* REP SETUP WARNING */}
      {isRep && (!userProfile?.batch || !userProfile?.department || !userProfile?.section) && (
        <div className="rep-setup-warning settings-card" style={{ margin: '20px', textAlign: 'center', padding: '40px' }}>
          <RiTrophyLine size={48} style={{ color: 'var(--mac-warning-text)', marginBottom: '16px' }} />
          <h3>Class Assignment Required</h3>
          <p style={{ color: 'var(--mac-text-secondary)', marginBottom: '24px' }}>
            You are logged in as a Class Representative, but your account is not assigned to a specific class.
            <br />
            Please go to <strong>Settings {'>'} Admin Profile</strong> and select your <strong>Assigned Class</strong>.
          </p>
          <button className="btn-save-master" onClick={() => updateLevel('home')}>Go to Dashboard</button>
        </div>
      )}

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
          {viewLevel === 'secs' && path.batch && path.dept && Object.values(hierarchy[path.batch]?.[path.dept] || {}).map(s => (
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

              {/* NATIVE DATE INPUT: Show From */}
              <div className="field">
                <label>Show From</label>
                <input
                  type="date"
                  value={newExam.startDate || ''}
                  onChange={(e) => setNewExam({ ...newExam, startDate: e.target.value })}
                  className="custom-datepicker-input"
                />
              </div>

              {/* NATIVE DATE INPUT: Show Until */}
              <div className="field">
                <label>Show Until</label>
                <input
                  type="date"
                  value={newExam.endDate || ''}
                  onChange={(e) => setNewExam({ ...newExam, endDate: e.target.value })}
                  className="custom-datepicker-input"
                />
              </div>
            </div>

            <div className="subject-mapping-section">
              {newExam.subjects.map((sub, idx) => (
                <div key={idx} className="exam-subject-row professional">
                  <div className="input-group-vertical">
                    <label>Date</label>
                    {/* NATIVE DATE INPUT */}
                    <input
                      type="date"
                      value={sub.date || ''}
                      onChange={(e) => { let s = [...newExam.subjects]; s[idx].date = e.target.value; setNewExam({ ...newExam, subjects: s }); }}
                      className="custom-datepicker-input"
                    />
                  </div>
                  <div className="input-group-vertical variant-code">
                    <label>Subject</label>
                    <select value={sub.code} onChange={e => { let s = [...newExam.subjects]; s[idx].code = e.target.value; setNewExam({ ...newExam, subjects: s }); }}>
                      <option value="">Select Course</option>
                      {masterData.courses.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group-vertical variant-portion">
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
                  <button className="btn-del-mini" onClick={() => {
                    showConfirm(
                      "Delete Subject?",
                      `Are you sure you want to remove ${getSubjectName(sub.code) || 'this subject'} from the draft?`,
                      () => setNewExam({ ...newExam, subjects: newExam.subjects.filter((_, i) => i !== idx) })
                    );
                  }}><RiDeleteBin6Line /></button>
                </div>
              ))}

              <datalist id="portion-presets">
                {[...new Set(Object.values(PORTION_DEFAULTS))].map(p => <option key={p} value={p} />)}
              </datalist>

              <button className="btn-add-line" onClick={() => {
                const lastSub = newExam.subjects[newExam.subjects.length - 1];
                setNewExam({
                  ...newExam,
                  subjects: [...newExam.subjects, {
                    date: '',
                    code: '',
                    startTime: lastSub ? to24h(lastSub.startTime) : '08:30',
                    endTime: lastSub ? to24h(lastSub.endTime) : '11:30',
                    portion: PORTION_DEFAULTS[newExam.type]
                  }]
                });
              }}><RiAddLine /> Add Subject Day</button>
              <button className="btn-save-master publish-btn" onClick={handlePublish}>Publish New Exam</button>
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
                          {/* NATIVE DATE INPUT: Edit Start */}
                          <input
                            type="date"
                            value={currentData.startDate || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, startDate: e.target.value })}
                            className="inline-datepicker"
                          />
                          <span>to</span>
                          {/* NATIVE DATE INPUT: Edit End */}
                          <input
                            type="date"
                            value={currentData.endDate || ''}
                            onChange={(e) => setEditBuffer({ ...editBuffer, endDate: e.target.value })}
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
                          <button className="btn-del-mini" onClick={() => {
                            showConfirm(
                              "Delete Timetable?",
                              `This will permanently remove "${ex.title}". This action cannot be undone.`,
                              () => syncExamsToDB(masterData.exams.filter(e => e.id !== ex.id))
                            );
                          }}><RiDeleteBin6Line /> Delete</button>
                          <button className="btn-save-mini" onClick={saveEdit}>Save</button>
                          <button className="btn-cancel-mini" onClick={() => { setEditingExamId(null); setEditBuffer(null); }}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-edit-mini" onClick={() => startEditing(ex)}><RiEditLine /> Edit</button>
                        </>
                      )}
                    </div>
                  </header>

                  <div className="published-subjects-container">
                    {(currentData.subjects || []).map((s, i) => (
                      <div key={i} className={`exam-subject-row ${isEditing ? 'professional editing' : 'professional view-mode'}`}>
                        {isEditing ? (
                          <>
                            <div className="input-group-vertical">
                              <label>Date</label>
                              <input
                                type="date"
                                value={s.date || ''}
                                onChange={(e) => { let subs = [...editBuffer.subjects]; subs[i].date = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }}
                                className="custom-datepicker-input"
                              />
                            </div>
                            <div className="input-group-vertical variant-code">
                              <label>Subject</label>
                              <select value={s.code} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].code = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }}>
                                <option value="">Select</option>
                                {masterData.courses.map(c => <option key={c.code} value={c.code}>{c.code} - {getSubjectName(c.code)}</option>)}
                              </select>
                            </div>
                            <div className="input-group-vertical variant-portion">
                              <label>Portion</label>
                              <input
                                list="portion-presets"
                                value={s.portion}
                                onChange={e => { let subs = [...editBuffer.subjects]; subs[i].portion = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }}
                              />
                            </div>
                            <div className="input-group-vertical"><label>Start</label><input type="time" value={s.startTime} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].startTime = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }} /></div>
                            <div className="input-group-vertical"><label>End</label><input type="time" value={s.endTime} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].endTime = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }} /></div>
                            <button className="btn-del-mini" onClick={() => {
                              showConfirm(
                                "Remove Day?",
                                "Remove this subject day from the timetable?",
                                () => { let subs = editBuffer.subjects.filter((_, idx) => idx !== i); setEditBuffer({ ...editBuffer, subjects: subs }); }
                              );
                            }}><RiDeleteBin6Line /></button>
                          </>
                        ) : (
                          <>
                            <div className="view-cell date-cell">
                              <label>Date</label>
                              <span>{parseDate(s.date)?.toLocaleDateString('en-GB') || s.date}</span>
                            </div>
                            <div className="view-cell subject-cell">
                              <label>Subject</label>
                              <span><strong>{s.code}</strong>: {getSubjectName(s.code)}</span>
                            </div>
                            <div className="view-cell time-cell">
                              <label>Time</label>
                              <span>{to12h(s.startTime)} - {to12h(s.endTime)}</span>
                            </div>
                            <div className="view-cell portion-cell">
                              <label>Portion</label>
                              <span className="portion-badge">{s.portion}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  {isEditing && (
                    <button className="btn-add-line" onClick={() => {
                      const lastSub = editBuffer.subjects[editBuffer.subjects.length - 1];
                      setEditBuffer({
                        ...editBuffer,
                        subjects: [...editBuffer.subjects, {
                          date: '',
                          code: '',
                          startTime: lastSub ? to24h(lastSub.startTime) : '08:30',
                          endTime: lastSub ? to24h(lastSub.endTime) : '11:30',
                          portion: PORTION_DEFAULTS[editBuffer.type]
                        }]
                      });
                    }}><RiAddLine /> Add Subject Day</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- PREMIUM CONFIRMATION MODAL --- */}
      {confirmModal.show && createPortal(
        <div className="modal-overlay animate-fade-in" onClick={closeConfirm}>
          <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <RiDeleteBin6Line className="modal-icon-danger" />
              <h3>{confirmModal.title}</h3>
            </div>
            <p className="modal-message">{confirmModal.message}</p>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={closeConfirm}>Keep It</button>
              <button className="btn-modal-confirm" onClick={() => { confirmModal.onConfirm(); closeConfirm(); }}>Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ExamManager;
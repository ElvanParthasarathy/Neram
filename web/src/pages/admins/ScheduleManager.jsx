import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import {
  RiCalendarScheduleLine, RiArrowRightSLine, RiTeamLine,
  RiLayoutGridLine, RiSave3Line, RiBookOpenLine,
  RiUserVoiceLine, RiAddLine, RiDeleteBin6Line, RiEditLine,
  RiCloseLine, RiCheckLine, RiArrowLeftLine
} from 'react-icons/ri';

const ScheduleManager = ({ user, userProfile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasAutoNavigated = useRef(false);

  // --- ROLE DETECTION ---
  const emailRole = user?.email ? getHardcodedRole(user.email) : null;
  const finalRole = emailRole || userProfile?.role || 'student';
  const isRep = finalRole === 'rep';

  // Extract level and path from URL
  const viewLevel = searchParams.get('slvl') || 'batches'; // slvl = schedule level
  const path = {
    batch: searchParams.get('sb') || '', // sb = schedule batch
    dept: searchParams.get('sd') || '',  // sd = schedule dept
    sec: searchParams.get('ss') || ''    // ss = schedule sec
  };

  // Helper to update specific sub-params while keeping 'mod=schedules' intact
  const updateLevel = (level, newPath = {}) => {
    const params = {
      mod: 'schedules', // Maintain the main AdminPanel tab
      slvl: level,
      sb: newPath.batch !== undefined ? newPath.batch : path.batch,
      sd: newPath.dept !== undefined ? newPath.dept : path.dept,
      ss: newPath.sec !== undefined ? newPath.sec : path.sec
    };
    // Remove empty params to keep URL clean
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    setSearchParams(params);
  };

  // --- PHYSICAL BACK BUTTON LOGIC ---
  const handleBack = () => {
    if (viewLevel === 'editor') updateLevel('secs', { sec: '' });
    else if (viewLevel === 'secs') updateLevel('depts', { dept: '' });
    else if (viewLevel === 'depts') updateLevel('batches', { batch: '' });
  };

  const [hierarchy, setHierarchy] = useState({});
  const [activeTab, setActiveTab] = useState('courses'); // Local tab state resets on refresh

  // Master Data State
  const [masterData, setMasterData] = useState({
    courses: [],
    counseling: { counselors: [], coordinators: {} },
    timetable: { Tuesday: Array(7).fill(""), Wednesday: Array(7).fill(""), Thursday: Array(7).fill(""), Friday: Array(7).fill(""), Saturday: Array(7).fill("") }
  });

  const [timetableBuffer, setTimetableBuffer] = useState(null);
  const [isEditingTimetable, setIsEditingTimetable] = useState(false);
  const [newCourse, setNewCourse] = useState({ code: '', name: '', faculty: '', periods: '' });
  const [newCounselor, setNewCounselor] = useState("");

  const [editingCourseIdx, setEditingCourseIdx] = useState(null);
  const [tempCourse, setTempCourse] = useState({});

  // --- NEW: Counselor Editing State ---
  const [counselorEditingIdx, setCounselorEditingIdx] = useState(null);
  const [tempCounselor, setTempCounselor] = useState("");

  // Load Hierarchy once
  useEffect(() => {
    const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => setHierarchy(snap.val() || {}));
    return () => unsub();
  }, []);

  // --- AUTO-NAVIGATE FOR REPS: Skip hierarchy, go straight to their section ---
  useEffect(() => {
    if (isRep && !hasAutoNavigated.current && userProfile?.batch && userProfile?.department && userProfile?.section) {
      hasAutoNavigated.current = true;
      const params = {
        mod: 'schedules',
        slvl: 'editor',
        sb: userProfile.batch,
        sd: userProfile.department,
        ss: userProfile.section
      };
      setSearchParams(params, { replace: true });
    }
  }, [isRep, userProfile]);

  // Fetch Schedule data whenever the URL path changes
  useEffect(() => {
    if (viewLevel === 'editor' && path.sec) {
      const scheduleRef = ref(db, `schedules/${path.batch}/${path.dept}/${path.sec}`);
      const unsub = onValue(scheduleRef, (snap) => {
        const data = snap.val();
        const cleanData = {
          courses: data?.courses || [],
          counseling: {
            counselors: data?.counseling?.counselors || [],
            coordinators: data?.counseling?.coordinators || {}
          },
          timetable: data?.timetable || {
            Tuesday: Array(7).fill(""), Wednesday: Array(7).fill(""),
            Thursday: Array(7).fill(""), Friday: Array(7).fill(""), Saturday: Array(7).fill("")
          }
        };
        setMasterData(cleanData);
        if (!isEditingTimetable) setTimetableBuffer(cleanData.timetable);
      });
      return () => unsub();
    }
  }, [viewLevel, path.batch, path.dept, path.sec]);

  const syncToDB = async (updatedData) => {
    try {
      await set(ref(db, `schedules/${path.batch}/${path.dept}/${path.sec}`), updatedData);
      alert("Database Updated!");
    } catch (err) { alert("Sync Error: " + err.message); }
  };

  // --- ACTIONS (Timetable, Courses, Counseling) ---
  const startEditingTimetable = () => {
    setTimetableBuffer(JSON.parse(JSON.stringify(masterData.timetable)));
    setIsEditingTimetable(true);
  };

  const saveTimetableEdit = () => {
    syncToDB({ ...masterData, timetable: timetableBuffer });
    setIsEditingTimetable(false);
  };

  const updateBufferCell = (day, idx, val) => {
    setTimetableBuffer(prev => ({
      ...prev,
      [day]: prev[day].map((cell, i) => i === idx ? val : cell)
    }));
  };

  const handleAddCourse = () => {
    if (!newCourse.code || !newCourse.name) return alert("Required fields missing");
    syncToDB({ ...masterData, courses: [...(masterData.courses || []), newCourse] });
    setNewCourse({ code: '', name: '', faculty: '', periods: '' });
  };

  const handleUpdateCourse = () => {
    const updatedCourses = [...masterData.courses];
    updatedCourses[editingCourseIdx] = tempCourse;
    syncToDB({ ...masterData, courses: updatedCourses });
    setEditingCourseIdx(null);
  };

  const handleCoordUpdate = (role, val) => {
    setMasterData(prev => ({
      ...prev,
      counseling: { ...prev.counseling, coordinators: { ...prev.counseling.coordinators, [role]: val } }
    }));
  };

  const addCounselor = () => {
    if (!newCounselor) return;
    syncToDB({
      ...masterData,
      counseling: { ...masterData.counseling, counselors: [...(masterData.counseling.counselors || []), newCounselor] }
    });
    setNewCounselor("");
  };

  const removeCounselor = (index) => {
    const filtered = masterData.counseling.counselors.filter((_, i) => i !== index);
    syncToDB({ ...masterData, counseling: { ...masterData.counseling, counselors: filtered } });
  };

  // --- NEW: Counselor Update Logic ---
  const handleUpdateCounselor = () => {
    if (!tempCounselor) return;
    const updated = [...masterData.counseling.counselors];
    updated[counselorEditingIdx] = tempCounselor;
    syncToDB({
      ...masterData,
      counseling: { ...masterData.counseling, counselors: updated }
    });
    setCounselorEditingIdx(null);
  };

  return (
    <div className="admin-subpage animate-fade-in">
      <header className="explorer-header">
        <div className="breadcrumb-nav">
          {/* PHYSICAL BACK BUTTON - HIDDEN FOR REPS */}
          {!isRep && viewLevel !== 'batches' && (
            <button className="back-btn-minimal" onClick={handleBack} style={{ marginRight: '12px' }}>
              <RiArrowLeftLine /> Back
            </button>
          )}

          {isRep ? (
            /* STATIC HEADER FOR REPS - FULL BLOCKING */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--mac-text)', fontSize: '15px' }}>
              <RiCalendarScheduleLine style={{ fontSize: '18px', color: 'var(--mac-accent)' }} />
              <span>{path.batch}</span>
              <span style={{ color: 'var(--mac-text-secondary)' }}>/</span>
              <span>{path.dept}</span>
              <span style={{ color: 'var(--mac-text-secondary)' }}>/</span>
              <span>Sec {path.sec}</span>
            </div>
          ) : (
            /* INTERACTIVE BREADCRUMBS FOR OTHERS */
            <>
              <span className="crumb-btn" onClick={() => updateLevel('batches', { batch: '', dept: '', sec: '' })}>Schedules</span>
              {path.batch && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => updateLevel('depts', { dept: '', sec: '' })}>{path.batch}</span></>}
              {path.dept && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => updateLevel('secs', { sec: '' })}>{path.dept}</span></>}
              {path.sec && <><RiArrowRightSLine /> <span className="crumb-static">Sec {path.sec}</span></>}
            </>
          )}
        </div>
      </header>

      {viewLevel !== 'editor' ? (
        <div className="explorer-content">
          {viewLevel === 'batches' && (
            <div className="explorer-grid">
              {Object.keys(hierarchy).sort().reverse().map(b => (
                <div key={b} className="explorer-card" onClick={() => updateLevel('depts', { batch: b })}>
                  <RiTeamLine className="card-icon" />
                  <div className="card-info"><h3>Batch {b}</h3><p>Manage Schedules</p></div>
                </div>
              ))}
            </div>
          )}
          {viewLevel === 'depts' && (
            <div className="explorer-grid">
              {Object.keys(hierarchy[path.batch] || {}).map(d => (
                <div key={d} className="explorer-card" onClick={() => updateLevel('secs', { dept: d })}>
                  <RiLayoutGridLine className="card-icon" />
                  <div className="card-info"><h3>{d}</h3><p>Select Section</p></div>
                </div>
              ))}
            </div>
          )}
          {viewLevel === 'secs' && (
            <div className="explorer-grid">
              {(hierarchy[path.batch]?.[path.dept] || []).map(s => (
                <div key={s} className="explorer-card" onClick={() => updateLevel('editor', { sec: s })}>
                  <div className="card-initial">{s}</div>
                  <div className="card-info"><h3>Section {s}</h3><p>Manage Data</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="schedule-editor-workspace">
          <nav className="editor-tabs">
            <button className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}><RiBookOpenLine /> Courses</button>
            <button className={activeTab === 'timetable' ? 'active' : ''} onClick={() => setActiveTab('timetable')}><RiCalendarScheduleLine /> Timetable</button>
            <button className={activeTab === 'counseling' ? 'active' : ''} onClick={() => setActiveTab('counseling')}><RiUserVoiceLine /> Counseling</button>
          </nav>

          <div className="tab-content-area">
            {activeTab === 'timetable' && (
              <div className="timetable-builder">
                <div className="timetable-controls settings-card">
                  {!isEditingTimetable ? (
                    <button className="btn-edit-mode" onClick={startEditingTimetable}><RiEditLine /> Edit Timetable</button>
                  ) : (
                    <div className="edit-actions">
                      <button className="btn-cancel" onClick={() => setIsEditingTimetable(false)}><RiCloseLine /> Cancel</button>
                      <button className="btn-save-master" onClick={saveTimetableEdit}><RiSave3Line /> Update</button>
                    </div>
                  )}
                </div>
                <datalist id="course-list">
                  {masterData.courses?.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </datalist>
                <table className={`admin-timetable ${isEditingTimetable ? 'editing-active' : ''}`}>
                  <thead><tr><th>Day</th>{[1, 2, 3, 4, 5, 6, 7].map(n => <th key={n}>P{n}</th>)}</tr></thead>
                  <tbody>
                    {['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <tr key={day}>
                        <td className="day-label">{day}</td>
                        {[0, 1, 2, 3, 4, 5, 6].map(idx => (
                          <td key={idx}>
                            {isEditingTimetable ? (
                              <input list="course-list" value={timetableBuffer?.[day]?.[idx] || ""} onChange={(e) => updateBufferCell(day, idx, e.target.value)} className="timetable-combo-input" />
                            ) : (
                              <span className="cell-static-text">{masterData.timetable?.[day]?.[idx] || "-"}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="course-manager">
                <div className="add-item-bar settings-card">
                  <input placeholder="Code" value={newCourse.code} onChange={e => setNewCourse({ ...newCourse, code: e.target.value })} />
                  <input placeholder="Name" value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} />
                  <input placeholder="Faculty" value={newCourse.faculty} onChange={e => setNewCourse({ ...newCourse, faculty: e.target.value })} />
                  <input type="number" placeholder="Prds" value={newCourse.periods} onChange={e => setNewCourse({ ...newCourse, periods: e.target.value })} />
                  <button className="btn-add" onClick={handleAddCourse}><RiAddLine /> Add</button>
                </div>
                <div className="items-list">
                  {(masterData.courses || []).map((c, i) => (
                    <div key={i} className="list-item-card">
                      {editingCourseIdx === i ? (
                        <div className="inline-edit-row full-fields">
                          <input className="edit-code" placeholder="Code" value={tempCourse.code} onChange={e => setTempCourse({ ...tempCourse, code: e.target.value })} />
                          <input className="edit-name" placeholder="Name" value={tempCourse.name} onChange={e => setTempCourse({ ...tempCourse, name: e.target.value })} />
                          <input className="edit-faculty" placeholder="Faculty" value={tempCourse.faculty} onChange={e => setTempCourse({ ...tempCourse, faculty: e.target.value })} />
                          <input className="edit-periods" type="number" placeholder="Prds" value={tempCourse.periods} onChange={e => setTempCourse({ ...tempCourse, periods: e.target.value })} />
                          <div className="edit-btn-group">
                            <button onClick={handleUpdateCourse} className="btn-save-mini"><RiCheckLine /></button>
                            <button onClick={() => setEditingCourseIdx(null)} className="btn-cancel-mini"><RiCloseLine /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="item-main">
                            <strong>{c.code}</strong> - {c.name}
                            <span className="item-meta-info">({c.faculty || 'No Faculty'} • {c.periods || 0} Periods)</span>
                          </div>
                          <div className="item-actions">
                            <RiEditLine className="icon-edit" onClick={() => { setEditingCourseIdx(i); setTempCourse(c); }} />
                            <RiDeleteBin6Line className="icon-del" onClick={() => syncToDB({ ...masterData, courses: masterData.courses.filter((_, idx) => idx !== i) })} />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'counseling' && (
              <div className="counseling-manager-grid">
                <div className="settings-card">
                  <h3>Coordinators</h3>
                  {['Class Advisor', 'Year Coordinator', 'Chairperson'].map(role => (
                    <div className="field-group-horizontal" key={role}>
                      <label>{role}</label>
                      <div className="input-group">
                        <input value={masterData.counseling?.coordinators?.[role] || ""} onChange={(e) => handleCoordUpdate(role, e.target.value)} />
                        <button className="btn-save-mini" onClick={() => syncToDB(masterData)}><RiCheckLine /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="settings-card">
                  <h3>Counselors List</h3>
                  <div className="add-counselor-box">
                    <input placeholder="Name..." value={newCounselor} onChange={e => setNewCounselor(e.target.value)} />
                    <button onClick={addCounselor}><RiAddLine /></button>
                  </div>
                  <div className="counselor-pills">
                    {(masterData.counseling?.counselors || []).map((name, i) => (
                      <div key={i} className={`counselor-pill ${counselorEditingIdx === i ? 'editing' : ''}`}>
                        {counselorEditingIdx === i ? (
                          <>
                            <input
                              autoFocus
                              className="inline-pill-input"
                              value={tempCounselor}
                              onChange={(e) => setTempCounselor(e.target.value)}
                            />
                            <RiCheckLine className="pill-action-icon save" onClick={handleUpdateCounselor} />
                            <RiCloseLine className="pill-action-icon" onClick={() => setCounselorEditingIdx(null)} />
                          </>
                        ) : (
                          <>
                            <span onClick={() => { setCounselorEditingIdx(i); setTempCounselor(name); }}>{name}</span>
                            <RiCloseLine onClick={() => removeCounselor(i)} className="pill-action-icon del" />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;
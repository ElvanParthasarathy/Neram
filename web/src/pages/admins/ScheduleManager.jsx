import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import {
  RiCalendarScheduleLine, RiArrowRightSLine, RiTeamLine,
  RiLayoutGridLine, RiSave3Line, RiBookOpenLine,
  RiUserVoiceLine, RiAddLine, RiDeleteBin6Line, RiEditLine,
  RiCloseLine, RiCheckLine, RiArrowLeftLine, RiUserLine, RiTimeLine
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
  const [editingDay, setEditingDay] = useState('Tuesday');
  const [newCourse, setNewCourse] = useState({ code: '', name: '', faculty: '', periods: '' });
  const [newCounselor, setNewCounselor] = useState("");

  const [editingCourseIdx, setEditingCourseIdx] = useState(null);
  const [tempCourse, setTempCourse] = useState({});

  // --- NEW: Counselor Editing State ---
  const [counselorEditingIdx, setCounselorEditingIdx] = useState(null);
  const [tempCounselor, setTempCounselor] = useState("");
  const [confirmDelete, setConfirmDelete] = useState({ type: null, index: null, name: '' });

  // --- Coordinator Editing State ---
  const [editingCoordRole, setEditingCoordRole] = useState(null);
  const [tempCoordValue, setTempCoordValue] = useState("");

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
    setConfirmDelete({ type: null, index: null, name: '' });
  };

  const removeCourse = (index) => {
    const filtered = masterData.courses.filter((_, i) => i !== index);
    syncToDB({ ...masterData, courses: filtered });
    setConfirmDelete({ type: null, index: null, name: '' });
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
            <>
              {/* FULL BREADCRUMB — Desktop only */}
              <span className="breadcrumb-full">
                <span className="crumb-btn" onClick={() => updateLevel('batches', { batch: '', dept: '', sec: '' })}>Schedules</span>
                {path.batch && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => updateLevel('depts', { dept: '', sec: '' })}>{path.batch}</span></>}
                {path.dept && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => updateLevel('secs', { sec: '' })}>{path.dept}</span></>}
                {path.sec && <><RiArrowRightSLine /> <span className="crumb-static">Sec {path.sec}</span></>}
              </span>

              {/* MOBILE ONLY — Current level label */}
              <span className="breadcrumb-mobile">
                {viewLevel === 'batches' && 'Schedules'}
                {viewLevel === 'depts' && path.batch}
                {viewLevel === 'secs' && path.dept}
                {viewLevel === 'editor' && `Sec ${path.sec}`}
              </span>
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
              {Object.keys(hierarchy[path.batch]?.[path.dept] || {}).map(s => (
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
          <nav className="editor-tabs box-flat">
            <button className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}><RiBookOpenLine /> Courses</button>
            <button className={activeTab === 'timetable' ? 'active' : ''} onClick={() => setActiveTab('timetable')}><RiCalendarScheduleLine /> Timetable</button>
            <button className={activeTab === 'counseling' ? 'active' : ''} onClick={() => setActiveTab('counseling')}><RiUserVoiceLine /> Counseling</button>
          </nav>

          <div className="tab-content-area">
            {activeTab === 'timetable' && (
              <div className="timetable-builder-v2">
                {/* Day Selector Tabs — Same design as student Schedule page */}
                {(() => {
                  const days = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const shortLabels = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const selectedIndex = days.indexOf(editingDay);
                  const tabWidth = 100 / days.length;
                  return (
                    <div className="s2-day-tabs">
                      <div
                        className="s2-day-indicator"
                        style={{
                          left: `calc(${selectedIndex * tabWidth}% + 5px)`,
                          width: `calc(${tabWidth}% - 10px)`
                        }}
                      />
                      {days.map((day, i) => (
                        <button
                          key={day}
                          className={editingDay === day ? 'active' : ''}
                          onClick={() => setEditingDay(day)}
                        >
                          {shortLabels[i]}
                        </button>
                      ))}
                    </div>
                  );
                })()}

                {/* Edit / Save / Cancel Controls */}
                <div className="tt-controls">
                  <h3 className="tt-day-title">{editingDay}</h3>
                  {!isEditingTimetable ? (
                    <button className="action-btn action-edit" onClick={startEditingTimetable}>
                      <RiEditLine /> <span className="action-label">Edit</span>
                    </button>
                  ) : (
                    <div className="tt-edit-actions">
                      <button className="action-btn action-edit" onClick={saveTimetableEdit}>
                        <RiSave3Line /> <span className="action-label">Save</span>
                      </button>
                      <button className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--mac-text)' }} onClick={() => setIsEditingTimetable(false)}>
                        <RiCloseLine /> <span className="action-label">Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Datalist for autocomplete */}
                <datalist id="course-list">
                  {masterData.courses?.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  <option value="Library">Library</option>
                  <option value="Placement">Placement</option>
                  <option value="Sports">Sports</option>
                </datalist>

                {/* Period Cards */}
                <div className="tt-period-grid">
                  {[0, 1, 2, 3, 4, 5, 6].map(idx => (
                    <div key={idx} className={`tt-period-card ${isEditingTimetable ? 'editing' : ''}`}>
                      <div className="tt-period-label">Period {idx + 1}</div>
                      {isEditingTimetable ? (
                        <input
                          list="course-list"
                          className="tt-period-input"
                          placeholder="Enter code or type freely..."
                          value={timetableBuffer?.[editingDay]?.[idx] || ""}
                          onChange={(e) => updateBufferCell(editingDay, idx, e.target.value)}
                        />
                      ) : (
                        <div className="tt-period-value">
                          {masterData.timetable?.[editingDay]?.[idx] || <span className="tt-empty">—</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
                          <div className="edit-field-group">
                            <label className="edit-field-label">Subject Code</label>
                            <input className="edit-code" placeholder="Code" value={tempCourse.code} onChange={e => setTempCourse({ ...tempCourse, code: e.target.value })} />
                          </div>
                          <div className="edit-field-group">
                            <label className="edit-field-label">Subject Name</label>
                            <input className="edit-name" placeholder="Name" value={tempCourse.name} onChange={e => setTempCourse({ ...tempCourse, name: e.target.value })} />
                          </div>
                          <div className="edit-field-group">
                            <label className="edit-field-label">Faculty</label>
                            <input className="edit-faculty" placeholder="Faculty" value={tempCourse.faculty} onChange={e => setTempCourse({ ...tempCourse, faculty: e.target.value })} />
                          </div>
                          <div className="edit-field-group">
                            <label className="edit-field-label">Periods</label>
                            <input className="edit-periods" type="number" placeholder="Prds" value={tempCourse.periods} onChange={e => setTempCourse({ ...tempCourse, periods: e.target.value })} />
                          </div>
                          <div className="edit-btn-group">
                            <button onClick={handleUpdateCourse} className="action-btn action-edit"><RiCheckLine /> <span className="action-label">Save</span></button>
                            <button onClick={() => setEditingCourseIdx(null)} className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--mac-text)' }}><RiCloseLine /> <span className="action-label">Cancel</span></button>
                            <button className="action-btn action-delete" onClick={() => setConfirmDelete({ type: 'course', index: i, name: `${tempCourse.code} - ${tempCourse.name}` })}>
                              <RiDeleteBin6Line /> <span className="action-label">Delete</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="item-main">
                            <span className="course-code-badge">{c.code}</span>
                            <span className="course-name">{c.name}</span>
                            <div className="course-meta-row">
                              <span className="course-meta-tag"><RiUserLine /> {c.faculty || 'No Faculty'}</span>
                              <span className="course-meta-tag"><RiTimeLine /> {c.periods || 0} Periods</span>
                            </div>
                          </div>
                          <div className="item-actions">
                            <button className="action-btn action-edit" onClick={() => { setEditingCourseIdx(i); setTempCourse(c); }}>
                              <RiEditLine /> <span className="action-label">Edit</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'counseling' && (
              <div className="counseling-manager-v2">
                <div className="counseling-grid-modern">
                  {/* COORDINATORS SECTION */}
                  <div className="coordinator-card-v2">
                    <div className="card-header-modern">
                      <div className="icon-wrap"><RiTeamLine /></div>
                      <div className="text-wrap">
                        <h3>Coordinators</h3>
                        <p>Manage primary academic contacts</p>
                      </div>
                    </div>

                    <div className="coordinator-fields-list">
                      {['Class Advisor', 'Year Coordinator', 'Chairperson'].map(role => (
                        <div className="coordinator-row-v2" key={role}>
                          <div className="role-info">
                            <span className="role-tag">{role}</span>
                          </div>
                          {editingCoordRole === role ? (
                            <div className="input-group-modern">
                              <input
                                autoFocus
                                placeholder={`Enter ${role} name`}
                                value={tempCoordValue}
                                onChange={(e) => setTempCoordValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    handleCoordUpdate(role, tempCoordValue);
                                    syncToDB({ ...masterData, counseling: { ...masterData.counseling, coordinators: { ...masterData.counseling.coordinators, [role]: tempCoordValue } } });
                                    setEditingCoordRole(null);
                                  }
                                  if (e.key === 'Escape') setEditingCoordRole(null);
                                }}
                              />
                              <div className="counselor-row-actions">
                                <button className="action-btn action-edit" onClick={() => {
                                  handleCoordUpdate(role, tempCoordValue);
                                  syncToDB({ ...masterData, counseling: { ...masterData.counseling, coordinators: { ...masterData.counseling.coordinators, [role]: tempCoordValue } } });
                                  setEditingCoordRole(null);
                                }}><RiCheckLine /> <span className="action-label">Save</span></button>
                                <button className="action-btn action-delete" onClick={() => setEditingCoordRole(null)}><RiCloseLine /> <span className="action-label">Cancel</span></button>
                              </div>
                            </div>
                          ) : (
                            <div className="coordinator-display">
                              <span className="coordinator-value">{masterData.counseling?.coordinators?.[role] || 'Not set'}</span>
                              <button className="action-btn action-edit" onClick={() => { setEditingCoordRole(role); setTempCoordValue(masterData.counseling?.coordinators?.[role] || ''); }}>
                                <RiEditLine /> <span className="action-label">Edit</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COUNSELORS SECTION */}
                  <div className="counselor-list-card-v2">
                    <div className="card-header-modern">
                      <div className="icon-wrap"><RiUserVoiceLine /></div>
                      <div className="text-wrap">
                        <h3>Counselors List</h3>
                        <p>Individual student mentorship</p>
                      </div>
                    </div>

                    <div className="add-counselor-v2">
                      <input
                        placeholder="Add new counselor name..."
                        value={newCounselor}
                        onChange={e => setNewCounselor(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addCounselor()}
                      />
                      <button className="action-btn action-edit" onClick={addCounselor} style={{ borderRadius: '50px', padding: '10px 18px' }}><RiAddLine /> <span className="action-label">Add</span></button>
                    </div>

                    <div className="counselor-items-v2">
                      {(masterData.counseling?.counselors || []).map((name, i) => (
                        <div key={i} className={`counselor-item-row ${counselorEditingIdx === i ? 'editing' : ''}`}>
                          {counselorEditingIdx === i ? (
                            <div className="inline-edit-pill-wrap">
                              <input
                                autoFocus
                                value={tempCounselor}
                                onChange={(e) => setTempCounselor(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleUpdateCounselor();
                                  if (e.key === 'Escape') setCounselorEditingIdx(null);
                                }}
                              />
                              <div className="edit-pill-actions">
                                <button className="action-btn action-edit" onClick={handleUpdateCounselor}><RiCheckLine /> <span className="action-label">Save</span></button>
                                <button className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--mac-text)' }} onClick={() => setCounselorEditingIdx(null)}><RiCloseLine /> <span className="action-label">Cancel</span></button>
                                <button className="action-btn action-delete" onClick={() => setConfirmDelete({ type: 'counselor', index: i, name })}>
                                  <RiDeleteBin6Line /> <span className="action-label">Delete</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="counselor-name-chip">
                                {name}
                              </div>
                              <div className="counselor-row-actions">
                                <button className="action-btn action-edit" onClick={() => { setCounselorEditingIdx(i); setTempCounselor(name); }}>
                                  <RiEditLine /> <span className="action-label">Edit</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete.type && (
        <div className="delete-modal-overlay" onClick={() => setConfirmDelete({ type: null, index: null, name: '' })}>
          <div className="delete-modal-card" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">⚠️</div>
            <h3 className="delete-modal-title">Delete Confirmation</h3>
            <p className="delete-modal-desc">
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button className="delete-modal-btn cancel" onClick={() => setConfirmDelete({ type: null, index: null, name: '' })}>
                Cancel
              </button>
              <button className="delete-modal-btn confirm" onClick={() => {
                if (confirmDelete.type === 'course') removeCourse(confirmDelete.index);
                if (confirmDelete.type === 'counselor') removeCounselor(confirmDelete.index);
              }}>
                <RiDeleteBin6Line /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;
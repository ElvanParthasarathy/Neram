import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { convertTo12Hour } from '../../utils/timeUtils';
import { db } from "../../firebase";
import { ref, onValue, set, update } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/event-manager.css";
import {
  RiCalendarEventLine, RiTimeLine, RiDeleteBin6Line, RiEditLine,
  RiAddLine, RiInformationLine, RiFlagLine,
  RiArrowRightSLine, RiTeamLine, RiLayoutGridLine, RiArrowLeftLine, RiTrophyLine
} from 'react-icons/ri';

const EventManager = ({ user, userProfile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasAutoNavigated = useRef(false);

  // --- ROLE DETECTION ---
  const emailRole = user?.email ? getHardcodedRole(user.email) : null;
  const finalRole = emailRole || userProfile?.role || 'student';
  const isRep = finalRole === 'rep';

  const viewLevel = searchParams.get('elvl') || 'batches';
  const path = {
    batch: searchParams.get('eb') || '',
    dept: searchParams.get('ed') || ''
  };

  const updateLevel = (level, newPath = {}) => {
    const params = {
      mod: 'events',
      elvl: level,
      eb: newPath.batch !== undefined ? newPath.batch : path.batch,
      ed: newPath.dept !== undefined ? newPath.dept : path.dept
    };
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    setSearchParams(params);
  };

  const handleBack = () => {
    if (viewLevel === 'editor') updateLevel('depts', { dept: '' });
    else if (viewLevel === 'depts') updateLevel('batches', { batch: '' });
  };

  // --- 2. DATA STATE ---
  const [hierarchy, setHierarchy] = useState({});
  const [masterData, setMasterData] = useState({ events: [], sections: [], rawDeptData: {} });

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    type: 'Event', // Options: Event, FullDay, HalfDay
    description: '',
    startTime: '09:00',
    endTime: '12:00',
    scope: 'Common'
  });

  // --- 3. FETCH HIERARCHY ---
  useEffect(() => {
    const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => setHierarchy(snap.val() || {}));
    return () => unsub();
  }, []);

  // --- AUTO-NAVIGATE FOR REPS ---
  useEffect(() => {
    if (isRep && !hasAutoNavigated.current && userProfile?.batch && userProfile?.department) {
      hasAutoNavigated.current = true;
      const params = {
        mod: 'events',
        elvl: 'editor',
        eb: userProfile.batch,
        ed: userProfile.department
      };
      setSearchParams(params, { replace: true });
    }
  }, [isRep, userProfile]);

  // --- 4. FETCH DEPT DATA (Aggregation) ---
  // Path: schedules/{batch}/{dept}
  const sectionsForDeptStr = Array.isArray(hierarchy[path.batch]?.[path.dept]) ? hierarchy[path.batch][path.dept].join(',') : '';

  useEffect(() => {
    if (viewLevel === 'editor' && path.dept) {
      const deptRef = ref(db, `events/${path.batch}/${path.dept}`);
      const unsub = onValue(deptRef, (snap) => {
        const deptData = snap.val() || {};

        const eventsMap = {};
        let sectionIds = sectionsForDeptStr ? sectionsForDeptStr.split(',') : [];
        if (sectionIds.length === 0) {
          sectionIds = Object.keys(deptData).filter(k => k !== 'initialized' && k !== '_master' && typeof deptData[k] === 'object');
        }

        sectionIds.forEach(secId => {
          const secEvents = deptData[secId] || [];
          const eventsArr = Array.isArray(secEvents) ? secEvents : Object.values(secEvents);

          eventsArr.forEach(ex => {
            if (!eventsMap[ex.id]) {
              eventsMap[ex.id] = { ...ex, scopes: [] };
            }
            if (!eventsMap[ex.id].scopes.includes(secId)) {
              eventsMap[ex.id].scopes.push(secId);
              eventsMap[ex.id].scopes.sort();
            }
          });
        });

        // Format scopes for display
        const mergedEvents = Object.values(eventsMap).map(ex => {
          if (ex.scopes.length === sectionIds.length || sectionIds.length === 0) {
            ex.scope = 'Common';
          } else {
            ex.scope = ex.scopes.length === 1 ? ex.scopes[0] : ex.scopes.join(', ');
          }
          return ex;
        });

        mergedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

        setMasterData({
          events: mergedEvents,
          sections: sectionIds,
          rawDeptData: deptData
        });
      });
      return () => unsub();
    }
  }, [viewLevel, path.batch, path.dept, sectionsForDeptStr]);

  const syncCentralEventToDB = async (eventObj, isDelete = false) => {
    if (!path.dept) return;

    try {
      const updates = {};
      const sections = masterData.sections;

      sections.forEach(secId => {
        const existingSecEvents = (masterData.rawDeptData[secId] || []);
        const existingEventsArr = Array.isArray(existingSecEvents) ? existingSecEvents : Object.values(existingSecEvents);
        const filteredEvents = existingEventsArr.filter(e => e.id !== eventObj.id);

        if (!isDelete) {
          const scopeStr = eventObj.scope || 'Common';
          const appliesToSection = scopeStr === 'Common' || scopeStr.split(',').map(s => s.trim()).includes(secId);

          if (appliesToSection) {
            const newSecEvent = { ...eventObj };
            delete newSecEvent.scope;
            delete newSecEvent.scopes;
            updates[`events/${path.batch}/${path.dept}/${secId}`] = [...filteredEvents, newSecEvent];
          } else {
            // Even if it no longer applies, update the DB minus this event we already filtered out
            updates[`events/${path.batch}/${path.dept}/${secId}`] = filteredEvents;
          }

        } else {
          updates[`events/${path.batch}/${path.dept}/${secId}`] = filteredEvents;
        }
      });

      await update(ref(db), updates);
    } catch (err) {
      console.error("Firebase Sync Error:", err);
      alert("Database Error: " + err.message);
    }
  };

  // --- HELPERS ---
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
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

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return alert("Title and Date are required!");

    const payload = {
      id: Date.now(),
      title: newEvent.title,
      date: newEvent.date,
      type: newEvent.type,
      description: newEvent.description,
      scope: newEvent.scope
    };

    if (newEvent.type === 'HalfDay') {
      payload.startTime = newEvent.startTime;
      payload.endTime = newEvent.endTime;
    }

    syncCentralEventToDB(payload);
    setNewEvent({ ...newEvent, title: '', description: '', type: 'Event' });
  };

  // --- 4.5 TIME FORMAT HELPERS ---
  const parseTimeForInput = (timeStr) => {
    if (!timeStr) return '';
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      if (match[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${match[2]}`;
    }
    return timeStr;
  };

  const formatTimeForDisplay = (timeStr) => convertTo12Hour(timeStr);

  const handleDelete = (id) => {
    if (!window.confirm("Remove this event?")) return;
    const eventToDelete = masterData.events.find(e => e.id === id);
    if (eventToDelete) syncCentralEventToDB(eventToDelete, true);
  };

  // --- 5. EDITING LOGIC ---
  const [editingEventId, setEditingEventId] = useState(null);
  const [editBuffer, setEditBuffer] = useState(null);

  const startEditing = (ev) => {
    setEditingEventId(ev.id);
    setEditBuffer({ ...ev, scope: ev.scope || 'Common' });
  };

  const saveEdit = () => {
    if (!editBuffer.title || !editBuffer.date) return alert("Title and Date are required!");
    syncCentralEventToDB(editBuffer);
    setEditingEventId(null);
    setEditBuffer(null);
  };

  return (
    <div className="exam-manager-container admin-subpage animate-fade-in">
      {/* 1. HEADER WITH BREADCRUMBS */}
      <header className="explorer-header focus-mode">
        <div className="breadcrumb-nav">
          {!isRep && viewLevel !== 'batches' && (
            <button className="explorer-back-btn" onClick={handleBack} style={{ marginRight: '12px' }}>
              <RiArrowLeftLine /> Back
            </button>
          )}

          {isRep ? (
            /* STATIC HEADER FOR REPS - FULL BLOCKING */
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--mac-text)', fontSize: '15px' }}>
              <RiCalendarEventLine style={{ fontSize: '18px', color: 'var(--mac-accent)' }} />
              <span>{path.batch}</span>
              <span style={{ color: 'var(--mac-text-secondary)' }}>/</span>
              <span>{path.dept} Manager</span>
            </div>
          ) : (
            /* INTERACTIVE BREADCRUMBS FOR OTHERS */
            <div className="breadcrumb-list">
              <span className="crumb-btn" onClick={() => updateLevel('batches', { batch: '', dept: '' })}>Central Directory</span>
              {path.batch && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-btn" onClick={() => updateLevel('depts', { dept: '' })}>{path.batch}</span></>}
              {path.dept && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-static">{path.dept} Central Setup</span></>}
            </div>
          )}
        </div>
      </header>

      {/* 2. EXPLORER CONTENT (Selection Grid) */}
      {viewLevel !== 'editor' ? (
        <div className="explorer-content explorer-grid">
          {/* A. BATCH SELECTION */}
          {viewLevel === 'batches' && Object.keys(hierarchy || {}).sort().reverse().map(b => (
            <div key={b} className="explorer-card" onClick={() => updateLevel('depts', { batch: b })}>
              <RiTeamLine className="card-icon" /> <div className="card-info"><h3>Batch {b}</h3><p>Manage Events Centrally</p></div>
            </div>
          ))}
          {/* B. DEPT SELECTION */}
          {viewLevel === 'depts' && path.batch && Object.keys(hierarchy[path.batch] || {}).filter(k => k !== 'initialized').map(d => (
            <div key={d} className="explorer-card" onClick={() => updateLevel('editor', { dept: d })}>
              <RiLayoutGridLine className="card-icon" /> <div className="card-info"><h3>{d}</h3><p>Open Dept Manager</p></div>
            </div>
          ))}
        </div>
      ) : (
        /* 3. EDITOR WORKSPACE */
        <div className="exam-editor-workspace">

          {/* CREATOR CARD */}
          <div className="settings-card exam-creator-card" style={{ border: '2px solid var(--mac-blue-15)' }}>
            <h2 className="editor-title" style={{ color: 'var(--mac-blue)' }}><RiCalendarEventLine /> Create Central Event</h2>
            <p style={{ opacity: 0.7, marginBottom: '20px', fontSize: '13px' }}>Events published here will automatically distribute to <strong>applicable</strong> sections in {path.dept}.</p>

            <div className="exam-config-grid">
              <div className="field" style={{ gridColumn: 'span 2' }}>
                <label>Event Title</label>
                <input
                  className="event-input"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Workshop"
                />
              </div>

              <div className="field">
                <label>Date</label>
                <DatePicker
                  selected={parseDate(newEvent.date)}
                  onChange={(date) => setNewEvent({ ...newEvent, date: formatDate(date) })}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select Date"
                  className="custom-datepicker-input"
                />
              </div>

              <div className="field">
                <label>Event Type</label>
                <select className="event-select" value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                  <option value="Event">Regular Notice</option>
                  <option value="FullDay">Full Day (Suspended)</option>
                  <option value="HalfDay">Half Day (Classes + Event)</option>
                </select>
              </div>

              <div className="field">
                <label>Scope (Sections)</label>
                <select className="event-select" value={newEvent.scope} onChange={e => setNewEvent({ ...newEvent, scope: e.target.value })}>
                  <option value="Common">Common (All Secs)</option>
                  {masterData.sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                </select>
              </div>
            </div>

            {newEvent.type === 'HalfDay' && (
              <div className="event-time-row animate-slide-down">
                <div className="event-time-field">
                  <label><RiTimeLine /> Start</label>
                  <input className="event-input" type="time" value={parseTimeForInput(newEvent.startTime) || '09:00'} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                </div>
                <div className="event-time-field">
                  <label><RiTimeLine /> End</label>
                  <input className="event-input" type="time" value={parseTimeForInput(newEvent.endTime) || '12:00'} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} />
                </div>
                <div className="event-time-info">
                  <RiInformationLine /> Schedule blocks visible + Event Badge
                </div>
              </div>
            )}

            <div className="field" style={{ marginTop: '16px', gridColumn: '1 / -1' }}>
              <label>Description / Note</label>
              <textarea
                className="event-textarea"
                placeholder="Optional details..."
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>

            <button className="btn-save-master publish-btn" onClick={handleAddEvent}>Publish to Selected Sections</button>
          </div>

          {/* LIST CARD */}
          <div className="published-exams-section">
            <h3 className="section-divider-title">Active Central Events</h3>

            {masterData.events.length > 0 ? masterData.events.map((ev) => (
              <div key={ev.id} className={`settings-card published-exam-card ${editingEventId === ev.id ? 'editing-active' : ''}`}>
                {editingEventId === ev.id ? (
                  /* EDIT MODE UI */
                  <>
                    <header className="published-header">
                      <div className="edit-meta-inputs">
                        <input className="edit-title-input" value={editBuffer.title} onChange={e => setEditBuffer({ ...editBuffer, title: e.target.value })} />
                        <div className="date-group">
                          <label>Date:</label>
                          <DatePicker selected={parseDate(editBuffer.date)} onChange={(date) => setEditBuffer({ ...editBuffer, date: formatDate(date) })} dateFormat="dd/MM/yyyy" className="inline-datepicker" />
                        </div>
                      </div>
                      <div className="header-actions">
                        <button className="btn-save-mini" onClick={saveEdit}>Save & Distribute</button>
                        <button className="btn-cancel-mini" onClick={() => { setEditingEventId(null); setEditBuffer(null); }}>Cancel</button>
                      </div>
                    </header>

                    <div className="published-subjects-container">
                      <div className="exam-subject-row professional editing">
                        <div className="input-group-vertical variant-code">
                          <label>Event Type</label>
                          <select value={editBuffer.type} onChange={e => setEditBuffer({ ...editBuffer, type: e.target.value })}>
                            <option value="Event">Notice</option>
                            <option value="FullDay">Full Day</option>
                            <option value="HalfDay">Half Day</option>
                          </select>
                        </div>

                        <div className="input-group-vertical variant-scope">
                          <label>Scope</label>
                          <select value={editBuffer.scope} onChange={e => setEditBuffer({ ...editBuffer, scope: e.target.value })}>
                            <option value="Common">Common (All Secs)</option>
                            {masterData.sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                            {editBuffer.scope && editBuffer.scope !== 'Common' && !masterData.sections.includes(editBuffer.scope) && (
                              <option value={editBuffer.scope}>{editBuffer.scope} (Mixed)</option>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>

                    {editBuffer.type === 'HalfDay' && (
                      <div className="event-time-row" style={{ marginBottom: '16px', padding: '12px 16px' }}>
                        <div className="event-time-field">
                          <label><RiTimeLine /> Start</label>
                          <input className="event-input" type="time" value={parseTimeForInput(editBuffer.startTime) || '09:00'} onChange={e => setEditBuffer({ ...editBuffer, startTime: e.target.value })} />
                        </div>
                        <div className="event-time-field">
                          <label><RiTimeLine /> End</label>
                          <input className="event-input" type="time" value={parseTimeForInput(editBuffer.endTime) || '12:00'} onChange={e => setEditBuffer({ ...editBuffer, endTime: e.target.value })} />
                        </div>
                      </div>
                    )}

                    <div className="field" style={{ marginTop: '16px', padding: '0 16px', paddingBottom: '16px' }}>
                      <label>Description / Note</label>
                      <textarea
                        className="event-textarea"
                        value={editBuffer.description}
                        onChange={e => setEditBuffer({ ...editBuffer, description: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  /* VIEW MODE UI */
                  <>
                    <header className="published-header">
                      <div className="pub-title-group">
                        <RiCalendarEventLine className="icon-main" style={{ color: 'var(--mac-blue)' }} />
                        <div>
                          <h3>{ev.title} <span>({ev.type === 'Event' ? 'Notice' : ev.type})</span></h3>
                          <p>Date: {parseDate(ev.date)?.toLocaleDateString('en-GB')}</p>
                        </div>
                      </div>

                      <div className="header-actions">
                        <button className="btn-del-mini" onClick={() => handleDelete(ev.id)}>
                          <RiDeleteBin6Line /> Delete
                        </button>
                        <button className="btn-edit-mini" onClick={() => startEditing(ev)}>
                          <RiEditLine /> Edit Central
                        </button>
                      </div>
                    </header>

                    <div className="published-subjects-container">
                      <div className="exam-subject-row professional view-mode">
                        <div className="view-cell portion-cell">
                          <label>Scope</label>
                          <span className="portion-badge" style={{ background: ev.scope === 'Common' ? 'rgba(40,200,64,0.1)' : 'rgba(255,149,0,0.1)', color: ev.scope === 'Common' ? 'var(--mac-success-text)' : 'var(--mac-warning-text)' }}>
                            {ev.scope}
                          </span>
                        </div>
                        {ev.type === 'HalfDay' && (
                          <div className="view-cell time-cell">
                            <label>Timings</label>
                            <span>{formatTimeForDisplay(ev.startTime)} - {formatTimeForDisplay(ev.endTime)}</span>
                          </div>
                        )}
                        {ev.description && (
                          <div className="view-cell" style={{ flex: 1 }}>
                            <label>Description</label>
                            <span style={{ color: 'var(--mac-text)', opacity: 0.8 }}>{ev.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )) : (
              <div className="event-empty-state" style={{ padding: '40px', textAlign: 'center', opacity: 0.5, color: 'var(--mac-text)' }}>
                No central events added for this department.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManager;
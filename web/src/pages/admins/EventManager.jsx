import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/event-manager.css";
import {
  RiCalendarEventLine, RiTimeLine, RiDeleteBin6Line, RiEditLine,
  RiAddLine, RiInformationLine, RiFlagLine,
  RiArrowRightSLine, RiTeamLine, RiLayoutGridLine, RiArrowLeftLine
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
    dept: searchParams.get('ed') || '',
    sec: searchParams.get('es') || ''
  };

  const updateLevel = (level, newPath = {}) => {
    const params = {
      mod: 'events', // Keeping user on the Events module
      elvl: level,
      eb: newPath.batch || path.batch,
      ed: newPath.dept || path.dept,
      es: newPath.sec || path.sec
    };
    // Clean up empty params
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    setSearchParams(params);
  };

  const handleBack = () => {
    if (viewLevel === 'editor') updateLevel('secs', { sec: '' });
    else if (viewLevel === 'secs') updateLevel('depts', { dept: '' });
    else if (viewLevel === 'depts') updateLevel('batches', { batch: '' });
  };

  // --- 2. DATA STATE ---
  const [hierarchy, setHierarchy] = useState({});
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    type: 'Event', // Options: Event, FullDay, HalfDay
    description: '',
    startTime: '09:00',
    endTime: '12:00'
  });

  // --- 3. FETCH HIERARCHY ---
  useEffect(() => {
    const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => setHierarchy(snap.val() || {}));
    return () => unsub();
  }, []);

  // --- AUTO-NAVIGATE FOR REPS: Skip hierarchy, go straight to their section ---
  useEffect(() => {
    if (isRep && !hasAutoNavigated.current && userProfile?.batch && userProfile?.department && userProfile?.section) {
      hasAutoNavigated.current = true;
      const params = {
        mod: 'events',
        elvl: 'editor',
        eb: userProfile.batch,
        ed: userProfile.department,
        es: userProfile.section
      };
      setSearchParams(params, { replace: true });
    }
  }, [isRep, userProfile]);

  // --- 4. FETCH EVENTS (Dynamic Path) ---
  // Path: events/{batch}/{dept}/{section}
  useEffect(() => {
    if (viewLevel === 'editor' && path.sec) {
      const eventsRef = ref(db, `events/${path.batch}/${path.dept}/${path.sec}`);
      const unsub = onValue(eventsRef, (snap) => {
        const data = snap.val() || [];
        const loadedEvents = Array.isArray(data) ? data : Object.values(data);
        setEvents(loadedEvents.sort((a, b) => new Date(a.date) - new Date(b.date)));
      });
      return () => unsub();
    }
  }, [viewLevel, path.batch, path.dept, path.sec]);

  const syncToDB = async (updatedList) => {
    if (!path.sec) {
      alert("Error: Section path is missing. Cannot save.");
      return;
    }

    const savePath = `events/${path.batch}/${path.dept}/${path.sec}`;

    try {
      await set(ref(db, savePath), updatedList);
    } catch (err) {
      console.error("Firebase Save Error:", err);
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
      description: newEvent.description
    };

    if (newEvent.type === 'HalfDay') {
      payload.startTime = newEvent.startTime;
      payload.endTime = newEvent.endTime;
    }

    const updated = [...events, payload];
    syncToDB(updated);
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

  const formatTimeForDisplay = (timeStr) => {
    if (!timeStr) return '';
    const match = timeStr.match(/^(\d{2}):(\d{2})$/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours.toString().padStart(2, '0')}:${match[2]} ${ampm}`;
    }
    return timeStr; // Return as-is if already formatted
  };

  const handleDelete = (id) => {
    if (!window.confirm("Remove this event?")) return;
    const updated = events.filter(e => e.id !== id);
    syncToDB(updated);
  };

  // --- 5. EDITING LOGIC ---
  const [editingEventId, setEditingEventId] = useState(null);
  const [editBuffer, setEditBuffer] = useState(null);

  const startEditing = (ev) => {
    setEditingEventId(ev.id);
    setEditBuffer({ ...ev });
  };

  const saveEdit = () => {
    if (!editBuffer.title || !editBuffer.date) return alert("Title and Date are required!");

    const updated = events.map(e => (e.id === editingEventId ? editBuffer : e));
    syncToDB(updated);
    setEditingEventId(null);
    setEditBuffer(null);
  };

  return (
    <div className="exam-manager-container admin-subpage animate-fade-in">
      {/* 1. HEADER WITH BREADCRUMBS */}
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
              <RiCalendarEventLine style={{ fontSize: '18px', color: 'var(--mac-accent)' }} />
              <span>{path.batch}</span>
              <span style={{ color: 'var(--mac-text-secondary)' }}>/</span>
              <span>{path.dept}</span>
              <span style={{ color: 'var(--mac-text-secondary)' }}>/</span>
              <span>Sec {path.sec}</span>
            </div>
          ) : (
            /* INTERACTIVE BREADCRUMBS FOR OTHERS */
            <>
              <span className="crumb-btn" onClick={() => updateLevel('batches', { batch: '', dept: '', sec: '' })}>Events</span>
              {path.batch && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => updateLevel('depts', { dept: '', sec: '' })}>{path.batch}</span></>}
              {path.dept && <><RiArrowRightSLine /> <span className="crumb-btn" onClick={() => updateLevel('secs', { sec: '' })}>{path.dept}</span></>}
              {path.sec && <><RiArrowRightSLine /> <span className="crumb-static">Sec {path.sec}</span></>}
            </>
          )}
        </div>
      </header>

      {/* 2. EXPLORER CONTENT (Selection Grid) */}
      {viewLevel !== 'editor' ? (
        <div className="explorer-content explorer-grid">
          {/* A. BATCH SELECTION */}
          {viewLevel === 'batches' && Object.keys(hierarchy || {}).sort().reverse().map(b => (
            <div key={b} className="explorer-card" onClick={() => updateLevel('depts', { batch: b })}>
              <RiTeamLine className="card-icon" />
              <div className="card-info"><h3>Batch {b}</h3><p>Manage Events</p></div>
            </div>
          ))}
          {/* B. DEPT SELECTION */}
          {viewLevel === 'depts' && path.batch && Object.keys(hierarchy[path.batch] || {}).filter(k => k !== 'initialized').map(d => (
            <div key={d} className="explorer-card" onClick={() => updateLevel('secs', { dept: d })}>
              <RiLayoutGridLine className="card-icon" />
              <div className="card-info"><h3>{d}</h3><p>Select Section</p></div>
            </div>
          ))}
          {/* C. SECTION SELECTION */}
          {viewLevel === 'secs' && path.batch && path.dept && Object.keys(hierarchy[path.batch]?.[path.dept] || {}).map(s => (
            <div key={s} className="explorer-card" onClick={() => updateLevel('editor', { sec: s })}>
              <div className="card-initial">{s}</div>
              <div className="card-info"><h3>Section {s}</h3><p>Open Event Manager</p></div>
            </div>
          ))}
        </div>
      ) : (
        /* 3. EDITOR WORKSPACE (Your existing Event Logic) */
        <div className="event-editor-workspace">

          {/* CREATOR CARD */}
          <div className="event-creator-card">
            <h2 className="event-creator-title"><RiCalendarEventLine /> Create New Event</h2>

            <div className="event-config-grid">
              <div className="event-field" style={{ gridColumn: 'span 2' }}>
                <label>Event Title</label>
                <input
                  className="event-input"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Class Party"
                />
              </div>

              <div className="event-field">
                <label>Date</label>
                <DatePicker
                  selected={parseDate(newEvent.date)}
                  onChange={(date) => setNewEvent({ ...newEvent, date: formatDate(date) })}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select Date"
                  className="event-input"
                />
              </div>

              <div className="event-field">
                <label>Event Type</label>
                <select className="event-select" value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                  <option value="Event">Regular Notice</option>
                  <option value="FullDay">Full Day (Suspended)</option>
                  <option value="HalfDay">Half Day (Classes + Event)</option>
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

            <div className="event-field" style={{ marginTop: '8px' }}>
              <label>Description / Note</label>
              <textarea
                className="event-textarea"
                placeholder="Optional details..."
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>

            <button className="btn-save-master" onClick={handleAddEvent} style={{ width: '100%', marginTop: '24px', height: '48px', fontSize: '15px' }}>
              <RiAddLine /> Add to Section Calendar
            </button>
          </div>

          {/* LIST CARD */}
          <div className="events-list-section">
            <h3 className="events-list-title"><RiCalendarEventLine /> Events for {path.dept} - {path.sec}</h3>

            <div className="events-list-container">
              {events.length > 0 ? events.map((ev) => (
                <div key={ev.id} className={`published-event-card ${editingEventId === ev.id ? 'editing-active' : ''}`}>
                  {editingEventId === ev.id ? (
                    /* EDIT MODE UI */
                    <div className="event-edit-mode">
                      <div className="event-config-grid" style={{ marginBottom: '16px' }}>
                        <div className="event-field" style={{ gridColumn: 'span 2' }}>
                          <label>Event Title</label>
                          <input
                            className="event-input"
                            value={editBuffer.title}
                            onChange={e => setEditBuffer({ ...editBuffer, title: e.target.value })}
                          />
                        </div>

                        <div className="event-field">
                          <label>Date</label>
                          <DatePicker
                            selected={parseDate(editBuffer.date)}
                            onChange={(date) => setEditBuffer({ ...editBuffer, date: formatDate(date) })}
                            dateFormat="dd/MM/yyyy"
                            className="event-input"
                          />
                        </div>

                        <div className="event-field">
                          <label>Event Type</label>
                          <select className="event-select" value={editBuffer.type} onChange={e => setEditBuffer({ ...editBuffer, type: e.target.value })}>
                            <option value="Event">Regular Notice</option>
                            <option value="FullDay">Full Day (Suspended)</option>
                            <option value="HalfDay">Half Day (Classes + Event)</option>
                          </select>
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

                      <div className="event-field">
                        <label>Description / Note</label>
                        <textarea
                          className="event-textarea"
                          value={editBuffer.description}
                          onChange={e => setEditBuffer({ ...editBuffer, description: e.target.value })}
                        />
                      </div>

                      <div className="event-actions-area" style={{ justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--mac-divider)' }}>
                        <button className="btn-event-delete" onClick={() => handleDelete(ev.id)}>
                          <RiDeleteBin6Line /> Delete
                        </button>
                        <button className="btn-save-mini" onClick={saveEdit}>Save</button>
                        <button className="btn-cancel-mini" onClick={() => { setEditingEventId(null); setEditBuffer(null); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    /* VIEW MODE UI */
                    <>
                      <header className={`event-card-header ${(!ev.description && ev.type !== 'HalfDay') ? 'no-details' : ''}`}>

                        <div className="event-title-area">
                          <div className="event-icon-box">
                            <RiCalendarEventLine />
                          </div>
                          <div className="event-name-box">
                            <h3>{ev.title}</h3>
                            <p>{parseDate(ev.date)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>

                        <div className="event-actions-area">
                          <span className={`event-type-badge ${ev.type.toLowerCase()}`}>
                            {ev.type === 'Event' ? 'Regular Notice' : ev.type === 'FullDay' ? 'Full Day Off' : 'Half Day Off'}
                          </span>
                          <button className="btn-edit-mini" onClick={() => startEditing(ev)}>
                            <RiEditLine /> Edit
                          </button>
                        </div>

                      </header>

                      {(ev.description || ev.type === 'HalfDay') && (
                        <div className="event-details-area">
                          {ev.description && (
                            <div className="event-detail-block" style={{ flex: 1 }}>
                              <label>Description</label>
                              <span>{ev.description}</span>
                            </div>
                          )}
                          {ev.type === 'HalfDay' && (
                            <div className="event-detail-block time-block">
                              <label>Timings</label>
                              <span>{formatTimeForDisplay(ev.startTime)} - {formatTimeForDisplay(ev.endTime)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )) : (
                <div className="event-empty-state">
                  No events added for this section.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManager;
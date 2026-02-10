import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  RiCalendarEventLine, RiTimeLine, RiDeleteBin6Line,
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
    // DEBUG LOGGING: Check what path we are trying to save to
    console.log("Attempting to save event...");
    console.log("Batch:", path.batch);
    console.log("Dept:", path.dept);
    console.log("Sec:", path.sec);

    if (!path.sec) {
      alert("Error: Section path is missing. Cannot save.");
      return;
    }

    const savePath = `events/${path.batch}/${path.dept}/${path.sec}`;
    console.log("Saving to Firebase Path:", savePath);

    try {
      await set(ref(db, savePath), updatedList);
      console.log("Save Success!");
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

  const handleDelete = (id) => {
    if (!window.confirm("Remove this event?")) return;
    const updated = events.filter(e => e.id !== id);
    syncToDB(updated);
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
          {viewLevel === 'secs' && path.batch && path.dept && (hierarchy[path.batch]?.[path.dept] || []).map(s => (
            <div key={s} className="explorer-card" onClick={() => updateLevel('editor', { sec: s })}>
              <div className="card-initial">{s}</div>
              <div className="card-info"><h3>Section {s}</h3><p>Open Event Manager</p></div>
            </div>
          ))}
        </div>
      ) : (
        /* 3. EDITOR WORKSPACE (Your existing Event Logic) */
        <div className="exam-editor-workspace">

          {/* CREATOR CARD */}
          <div className="settings-card exam-creator-card">
            <h2 className="editor-title"><RiCalendarEventLine /> Create New Event</h2>

            <div className="exam-config-grid">
              <div className="field" style={{ flex: 2 }}>
                <label>Event Title</label>
                <input
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Class Party"
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
                <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
                  <option value="Event">Regular Notice</option>
                  <option value="FullDay">Full Day (Suspended)</option>
                  <option value="HalfDay">Half Day (Classes + Event)</option>
                </select>
              </div>
            </div>

            {newEvent.type === 'HalfDay' && (
              <div className="subject-mapping-section animate-slide-down">
                <div className="exam-subject-row professional" style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
                  <div className="input-group-vertical" style={{ flex: 1 }}>
                    <label><RiTimeLine /> Start Time</label>
                    <input type="time" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                  </div>
                  <div className="input-group-vertical" style={{ flex: 1 }}>
                    <label><RiTimeLine /> End Time</label>
                    <input type="time" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} />
                  </div>
                  <div className="input-group-vertical" style={{ flex: 3, justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.9em', color: '#b45309' }}>
                      <RiInformationLine style={{ verticalAlign: 'middle' }} /> Schedule visible + Event Badge.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="field" style={{ marginTop: '15px' }}>
              <label>Description / Note</label>
              <textarea
                className="admin-textarea"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                rows="2"
                placeholder="Optional details..."
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              />
            </div>

            <button className="btn-save-master" onClick={handleAddEvent} style={{ width: '100%', marginTop: '20px' }}>
              <RiAddLine /> Add to Section Calendar
            </button>
          </div>

          {/* LIST CARD */}
          <div className="published-exams-section">
            <h3 className="section-divider-title">Events for {path.dept} - {path.sec}</h3>

            <div className="settings-card">
              <table className="preview-table published-style">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event Details</th>
                    <th>Type</th>
                    <th>Timings</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length > 0 ? events.map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{parseDate(ev.date)?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>{parseDate(ev.date)?.getFullYear()}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--primary)' }}>{ev.title}</div>
                        <div style={{ fontSize: '0.85em' }}>{ev.description}</div>
                      </td>
                      <td>
                        <span className={`portion-badge ${ev.type === 'FullDay' ? 'danger' : ev.type === 'HalfDay' ? 'warning' : 'success'}`}
                          style={{
                            background: ev.type === 'FullDay' ? '#fee2e2' : ev.type === 'HalfDay' ? '#fef3c7' : '#dcfce7',
                            color: ev.type === 'FullDay' ? '#dc2626' : ev.type === 'HalfDay' ? '#d97706' : '#16a34a'
                          }}>
                          {ev.type}
                        </span>
                      </td>
                      <td>
                        {ev.type === 'HalfDay' ? (
                          <span style={{ fontFamily: 'monospace' }}>{ev.startTime} - {ev.endTime}</span>
                        ) : (
                          <span style={{ opacity: 0.5 }}>-</span>
                        )}
                      </td>
                      <td>
                        <button className="btn-del-mini" onClick={() => handleDelete(ev.id)}>
                          <RiDeleteBin6Line />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                        No events added for this section.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManager;
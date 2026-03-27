import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { formatDateDDMMYYYY, handleAutoSlash, parseDMYToISO } from "../../utils/timeUtils";
import HybridDateInput from '../../components/HybridDateInput';
import { db } from "../../firebase";
import { ref, onValue, set, update } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../styles/event-manager.css";
import {
  RiCalendarEventLine, RiTimeLine, RiDeleteBin6Line, RiDeleteBin6Fill, RiEditLine,
  RiAddLine, RiInformationLine, RiFlagLine,
  RiArrowRightSLine, RiTeamLine, RiLayoutGridLine, RiArrowLeftLine, RiTrophyLine, RiArrowDownSLine, RiArrowUpSLine
} from 'react-icons/ri';

const EventManager = ({ user, userProfile, isMobile }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const hasAutoNavigated = useRef(false);

  // --- ROLE DETECTION ---
  const emailRole = user?.email ? getHardcodedRole(user.email) : null;
  const finalRole = emailRole || userProfile?.role || 'student';
  const isRep = finalRole === 'rep';

  let viewLevel = searchParams.get('elvl') || 'batches';
  let path = {
    batch: searchParams.get('eb') || '',
    dept: searchParams.get('ed') || ''
  };

  // Pre-render override for Reps to prevent UI flicker
  if (isRep && userProfile?.batch && userProfile?.department) {
      if (path.batch !== userProfile.batch || path.dept !== userProfile.department || viewLevel === 'batches' || viewLevel === 'depts') {
          viewLevel = 'editor';
          path.batch = userProfile.batch;
          path.dept = userProfile.department;
      }
  }

  const updateLevel = (level, newPath = {}, forceReplace = false) => {
    const params = {
      mod: 'events',
      elvl: level,
      eb: newPath.batch !== undefined ? newPath.batch : path.batch,
      ed: newPath.dept !== undefined ? newPath.dept : path.dept
    };
    Object.keys(params).forEach(key => !params[key] && delete params[key]);
    setSearchParams(params, { replace: forceReplace });
  };

  const navigate = useNavigate();

  const handleBack = () => {
    const elvl = searchParams.get('elvl') || 'batches';
    if (elvl === 'depts') {
      updateLevel('batches', { batch: '', dept: '' });
    } else if (elvl !== 'batches') {
      updateLevel('depts', { dept: '' });
    } else {
      setSearchParams({ mod: 'home' }, { replace: true });
    }
  };

  // --- 2. DATA STATE ---
  const [hierarchy, setHierarchy] = useState({});
  const [masterData, setMasterData] = useState({ events: [], sections: [], rawDeptData: {} });

  const [isEditListMode, setIsEditListMode] = useState(false);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [expandedEvents, setExpandedEvents] = useState([]);

  const newBlankEvent = () => ({
    title: '',
    date: '',
    type: 'Event',
    startTime: '09:00',
    endTime: '12:00',
    description: '',
    scope: 'Common'
  });

  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: '',
    endDate: '',
    events: []
  });

  const [showCreator, setShowCreator] = useState(false);

  // --- 3. FETCH HIERARCHY ---
  useEffect(() => {
    const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => setHierarchy(snap.val() || {}));
    return () => unsub();
  }, []);

  // Sync URL with pre-render override for Reps to ensure history matches UI
  useEffect(() => {
      if (isRep && userProfile?.batch && userProfile?.department) {
          const repBatch = userProfile.batch;
          const repDept = userProfile.department;
          const currentElvl = searchParams.get('elvl');
          const currentEb = searchParams.get('eb');
          const currentEd = searchParams.get('ed');
          
          if (currentEb !== repBatch || currentEd !== repDept || currentElvl === 'batches' || currentElvl === 'depts' || !currentElvl) {
              const params = new URLSearchParams(searchParams);
              params.set('elvl', 'editor');
              params.set('eb', repBatch);
              params.set('ed', repDept);
              setSearchParams(params, { replace: true });
          }
      }
  }, [isRep, userProfile, searchParams, setSearchParams]);

  // --- 4. FETCH DEPT DATA (Aggregation) ---
  // Path: schedules/{batch}/{dept}
  const sectionsForDeptStr = Array.isArray(hierarchy[path.batch]?.[path.dept]) ? hierarchy[path.batch][path.dept].join(',') : '';

  useEffect(() => {
    if (viewLevel === 'editor' && path.dept) {
      const deptRef = ref(db, `list_events/${path.batch}/${path.dept}`);
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

          if (!ex.events) {
             ex.events = [{
                title: ex.title || '',
                date: ex.startDate || ex.date || '',
                type: ex.type || 'Event',
                startTime: ex.startTime || '09:00',
                endTime: ex.endTime || '12:00',
                description: ex.description || '',
                scope: ex.scope || 'Common'
             }];
          }

          return ex;
        });

        mergedEvents.sort((a, b) => new Date(a.startDate || a.date) - new Date(b.startDate || b.date));

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
            updates[`list_events/${path.batch}/${path.dept}/${secId}`] = [...filteredEvents, newSecEvent];
          } else {
            // Even if it no longer applies, update the DB minus this event we already filtered out
            updates[`list_events/${path.batch}/${path.dept}/${secId}`] = filteredEvents;
          }

        } else {
          updates[`list_events/${path.batch}/${path.dept}/${secId}`] = filteredEvents;
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
    if (!newEvent.title || !newEvent.startDate || !newEvent.endDate) return alert("Group Title, Start and End Dates are required!");
    if (newEvent.events.length === 0) return alert("Please add at least one event entry to the group!");

    const payload = {
      id: Date.now(),
      title: newEvent.title,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate,
      type: newEvent.events[0]?.type || 'Event',
      events: newEvent.events
    };

    syncCentralEventToDB(payload);
    setNewEvent({ title: '', startDate: '', endDate: '', events: [] });
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

  const convertTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr; // Already 12-hour
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let h = parseInt(parts[0], 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${parts[1]} ${ampm}`;
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

  // --- CONFIRMATION MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };
  const closeConfirm = () => setConfirmModal({ ...confirmModal, show: false });

  // Reset delete mode when edit list mode is off
  useEffect(() => {
    if (!isEditListMode) {
      setIsDeleteMode(false);
      setSelectedEvents([]);
    }
  }, [isEditListMode]);

  const handleToggleEventSelect = (id) => {
    setSelectedEvents(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAllEvents = () => {
    const allIds = (masterData.events || []).map(ev => ev.id);
    if (selectedEvents.length === allIds.length && allIds.length > 0) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(allIds);
    }
  };

  const handleBulkDeleteEvents = async () => {
    if (selectedEvents.length === 0) return;
    showConfirm(
      `Delete ${selectedEvents.length} Event(s)?`,
      "This action cannot be undone. All selected events will be removed.",
      async () => {
        for (const id of selectedEvents) {
          const eventToDelete = masterData.events.find(e => e.id === id);
          if (eventToDelete) {
            await syncCentralEventToDB(eventToDelete, true);
          }
        }
        setSelectedEvents([]);
        setIsDeleteMode(false);
      }
    );
  };


  const startEditing = (ev) => {
    setEditingEventId(ev.id);
    setEditBuffer({ 
      ...ev, 
      startDate: ev.startDate || ev.date || '',
      endDate: ev.endDate || ev.date || '',
      type: ev.type || ev.events?.[0]?.type || 'Event',
      events: ev.events || [{
         title: ev.title || '',
         date: ev.startDate || ev.date || '',
         type: ev.type || 'Event',
         startTime: ev.startTime || '09:00',
         endTime: ev.endTime || '12:00',
         description: ev.description || '',
         scope: ev.scope || 'Common'
      }]
    });
  };

  const saveEdit = () => {
    if (!editBuffer.title || !editBuffer.startDate || !editBuffer.endDate) return alert("Group Title, Start Date, and End Date are required!");
    if (!editBuffer.events || editBuffer.events.length === 0) return alert("Please add at least one event entry!");
    syncCentralEventToDB(editBuffer);
    setEditingEventId(null);
    setEditBuffer(null);
  };

  const renderEventItemEditor = (evItem, idx, parentObj, setParentObj) => {
    return (
      <div key={idx} className="exam-subject-row professional animate-slide-down" style={{ position: 'relative', marginTop: '16px', display: 'block' }}>


        <div className="event-item-grid">
            <div className="input-group-vertical">
              <label>Date</label>
              <HybridDateInput
                value={evItem.date}
                onChange={(val) => { let s = [...parentObj.events]; s[idx].date = val; setParentObj({ ...parentObj, events: s }); }}
              />
            </div>

            <div className="input-group-vertical">
              <label>Title (Optional override)</label>
              <input 
                className="event-input"
                placeholder={parentObj.title || "Inherits Group Title"}
                value={evItem.title} 
                onChange={e => { let s = [...parentObj.events]; s[idx].title = e.target.value; setParentObj({ ...parentObj, events: s }); }} 
              />
            </div>

            <div className="input-group-vertical">
                <label>Type</label>
                <select className="event-select" value={evItem.type} onChange={e => { let s = [...parentObj.events]; s[idx].type = e.target.value; setParentObj({ ...parentObj, events: s }); }}>
                  <option value="Event">Regular Notice</option>
                  <option value="FullDay">Full Day</option>
                  <option value="HalfDay">Half Day</option>
                </select>
            </div>

            <div className="input-group-vertical variant-scope">
                <label>Scope</label>
                <select className="event-select" value={evItem.scope} onChange={e => { let s = [...parentObj.events]; s[idx].scope = e.target.value; setParentObj({ ...parentObj, events: s }); }}>
                    <option value="Common">Common (All Secs)</option>
                    {masterData.sections.map(sec => <option key={sec} value={sec}>Sec {sec}</option>)}
                </select>
            </div>

            {evItem.type === 'HalfDay' && (
              <>
                 <div className="input-group-vertical">
                  <label><RiTimeLine /> Start Time</label>
                  <input className="event-input" type="time" value={parseTimeForInput(evItem.startTime) || '09:00'} onChange={e => { let s = [...parentObj.events]; s[idx].startTime = e.target.value; setParentObj({ ...parentObj, events: s }); }} />
                </div>
                <div className="input-group-vertical">
                  <label><RiTimeLine /> End Time</label>
                  <input className="event-input" type="time" value={parseTimeForInput(evItem.endTime) || '12:00'} onChange={e => { let s = [...parentObj.events]; s[idx].endTime = e.target.value; setParentObj({ ...parentObj, events: s }); }} />
                </div>
              </>
            )}

            <div className="input-group-vertical variant-description" style={{ width: '100%' }}>
                <label>Description / Note</label>
                <input 
                  className="event-input"
                  placeholder="Optional details..."
                  value={evItem.description || ''} 
                  onChange={e => { let s = [...parentObj.events]; s[idx].description = e.target.value; setParentObj({ ...parentObj, events: s }); }} 
                />
            </div>

            <button 
              className="btn-del-mini" 
              onClick={() => {
                showConfirm(
                  "Delete Event Day?", 
                  `Remove ${evItem.title || parentObj.title || 'this entry'}?`,
                  () => {
                    const newEvents = parentObj.events.filter((_, i) => i !== idx);
                    setParentObj({ ...parentObj, events: newEvents });
                  }
                );
              }}
              title="Remove Event"
              style={{ gridColumn: '1 / -1', width: '100%', marginTop: '16px', borderRadius: '100px', height: '38px' }}
            >
              <RiDeleteBin6Line /> Delete Event Day
            </button>
        </div>
      </div>
    );
  };

  // Don't render until Rep path is resolved (prevents header flash)
  if (isRep && (!path.batch || !path.dept)) return null;

  return (
    <div className="exam-manager-container admin-subpage animate-fade-in">
      {/* 1. HEADER WITH BREADCRUMBS */}
      <header className="explorer-header focus-mode">
        <div className="breadcrumb-nav">          {isRep ? (
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
              <span className="crumb-btn level-root" onClick={() => updateLevel('batches', { batch: '', dept: '' }, true)}>Events</span>
              
              {/* Mobile Truncation Ellipsis */}
              <span className="crumb-ellipsis-container">
                  <RiArrowRightSLine className="crumb-sep" />
                  <span className="crumb-static">...</span>
              </span>

              {path.batch && <><RiArrowRightSLine className="crumb-sep level-batch-sep" /> <span className="crumb-btn level-batch" onClick={() => updateLevel('depts', { dept: '' }, true)}>{path.batch}</span></>}
              {path.dept && <><RiArrowRightSLine className="crumb-sep level-dept-sep" /> <span className="crumb-static level-dept">{path.dept}</span></>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isRep && viewLevel !== 'batches' && (
            <button className="explorer-back-btn" onClick={handleBack}>
              <RiArrowLeftLine /> Back
            </button>
          )}
        </div>
      </header>

      {/* 2. EXPLORER CONTENT (Selection Grid) */}
      {viewLevel !== 'editor' ? (
        isRep ? null : (
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
        )
      ) : (
        /* 3. EDITOR WORKSPACE */
        <div className="exam-editor-workspace">
          {/* SECTION HEADER WITH EDIT LIST BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="section-divider-title" style={{ margin: 0, border: 'none', color: 'var(--mac-text)', textTransform: 'none', fontSize: '15px', fontWeight: 700, padding: 0 }}>Events</h3>
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
          {isEditListMode && showCreator && (
          <>
          {/* CREATOR CARD */}
          <div className="settings-card exam-creator-card" style={{ border: '2px solid var(--mac-blue-15)' }}>
            <h2 className="editor-title" style={{ color: 'var(--mac-blue)' }}><RiCalendarEventLine /> Create Event</h2>
            <p style={{ opacity: 0.7, marginBottom: '20px', fontSize: '13px' }}>Events published here will automatically distribute to <strong>applicable</strong> sections in {path.dept}.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--mac-divider)' }}>
              <div className="field">
                <label>Event Title</label>
                <input
                  className="event-input"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="e.g. Workshop"
                />
              </div>

              <div className="event-date-row">
                <div className="field" style={{ flex: 1 }}>
                  <label>Start Date</label>
                  <HybridDateInput
                    value={newEvent.startDate}
                    onChange={(val) => setNewEvent({ ...newEvent, startDate: val })}
                  />
                </div>

                <div className="field" style={{ flex: 1 }}>
                  <label>End Date</label>
                  <HybridDateInput
                    value={newEvent.endDate}
                    onChange={(val) => setNewEvent({ ...newEvent, endDate: val })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="settings-card exam-creator-card">
            <div className="subject-mapping-section">
              <h4 style={{ marginBottom: '12px', color: 'var(--mac-text)', fontSize: '14px', fontWeight: 600 }}>Event Schedule</h4>
              {newEvent.events.map((evItem, idx) => renderEventItemEditor(evItem, idx, newEvent, setNewEvent))}
              
              <button 
                className="btn-add-line" 
                onClick={() => setNewEvent({ ...newEvent, events: [...newEvent.events, newBlankEvent()] })}
                style={{ marginTop: '16px' }}
              >
                <RiAddLine /> Add Event Entry
              </button>
            </div>

              {newEvent.events.length > 0 && (
                <div className="creator-action-pills" style={{ display: 'flex', flexDirection: 'row', gap: '12px', marginTop: '16px', width: '100%' }}>
                  <button 
                    className="premium-pill-btn primary" 
                    style={{ flex: 1, justifyContent: 'center' }} 
                    onClick={handleAddEvent}
                  >
                    Publish
                  </button>
                  <button 
                    className="premium-pill-btn secondary" 
                    style={{ flex: 1, justifyContent: 'center' }} 
                    onClick={() => { setNewEvent({ title: '', startDate: '', endDate: '', events: [] }); }}
                  >
                    Cancel
                  </button>
                </div>
              )}
          </div>
          </>
          )}

          {/* LIST CARD */}
          <div className="published-exams-section">
            {/* The section title and edit list button were moved to the top */}

            {masterData.events.length > 0 ? masterData.events.map((ev) => (
              <React.Fragment key={ev.id}>
                {!isMobile && editingEventId === ev.id && (
                  <div className="master-header-row pill-group-row desktop-edit-actions" style={{ justifyContent: 'flex-end', marginBottom: '12px' }}>
                    <button className="role-header-pill secondary" onClick={() => { setEditingEventId(null); setEditBuffer(null); }}>Cancel</button>
                    <button className="role-header-pill active" onClick={saveEdit}>Save</button>
                  </div>
                )}
                <div className={`settings-card published-exam-card ${editingEventId === ev.id ? 'editing-active' : ''}`}>
                {editingEventId === ev.id ? (
                  /* EDIT MODE UI */
                  <>
                    <header className="published-header">
                      <div className="edit-meta-inputs" style={{ flex: 1 }}>
                        {isMobile && (
                          <div className="mobile-edit-actions pill-group-row master-header-row show-only-mobile" style={{ width: '100%', flexDirection: 'row', gap: '8px', marginBottom: '16px' }}>
                            <button 
                              className="role-header-pill secondary" 
                              style={{ flex: 1, justifyContent: 'center' }} 
                              onClick={() => { setEditingEventId(null); setEditBuffer(null); }}
                            >
                              Cancel
                            </button>
                            <button 
                              className="role-header-pill active" 
                              style={{ flex: 1, justifyContent: 'center' }} 
                              onClick={saveEdit}
                            >
                              Save
                            </button>
                          </div>
                        )}
                        <input className="edit-title-input" value={editBuffer.title} onChange={e => setEditBuffer({ ...editBuffer, title: e.target.value })} />
                        <div className="event-date-row" style={{ marginTop: '16px' }}>
                          <div className="field" style={{ flex: 1 }}>
                            <label>Start Date</label>
                            <HybridDateInput
                              value={editBuffer.startDate}
                              onChange={(val) => setEditBuffer({ ...editBuffer, startDate: val })}
                            />
                          </div>
                          <div className="field" style={{ flex: 1 }}>
                            <label>End Date</label>
                            <HybridDateInput
                              value={editBuffer.endDate}
                              onChange={(val) => setEditBuffer({ ...editBuffer, endDate: val })}
                            />
                          </div>
                        </div>
                      </div>
                    </header>

                    <div className="subject-mapping-section" style={{ padding: '0 16px 16px' }}>
                      <h4 style={{ marginBottom: '12px', color: 'var(--mac-text)', fontSize: '14px', fontWeight: 600 }}>Event Schedule</h4>
                      {editBuffer.events.map((evItem, idx) => renderEventItemEditor(evItem, idx, editBuffer, setEditBuffer))}
                      
                      <button 
                        className="btn-add-line" 
                        onClick={() => setEditBuffer({ ...editBuffer, events: [...editBuffer.events, newBlankEvent()] })}
                        style={{ marginTop: '16px' }}
                      >
                        <RiAddLine /> Add Event Entry
                      </button>

                    </div>
                  </>
                ) : (
                  /* VIEW MODE UI */
                  <>
                    <header 
                        className="published-header" 
                        style={{ alignItems: 'center', cursor: 'pointer' }}
                        onClick={(e) => {
                            if (e.target.closest('button') || e.target.closest('input')) return;
                            if (isDeleteMode) return;
                            setExpandedEvents(prev => prev.includes(ev.id) ? prev.filter(id => id !== ev.id) : [...prev, ev.id]);
                        }}
                    >
                      {isDeleteMode && (
                        <div className="mac-checkbox-wrapper" onClick={e => e.stopPropagation()}>
                           <input 
                             type="checkbox" 
                             className="mac-checkbox"
                             checked={selectedEvents.includes(ev.id)}
                             onChange={() => handleToggleEventSelect(ev.id)}
                           />
                        </div>
                      )}
                      <div className="pub-title-group" style={{ flex: 1 }}>
                        <RiCalendarEventLine className="icon-main" style={{ color: 'var(--mac-blue)' }} />
                        <div>
                          <h3>{ev.title} <span>({(ev.type || ev.events?.[0]?.type || 'Event') === 'Event' ? 'Notice' : (ev.type || ev.events?.[0]?.type)})</span></h3>
                          <p>Date: {parseDate(ev.startDate || ev.date)?.toLocaleDateString('en-GB')} {ev.endDate && ev.endDate !== (ev.startDate || ev.date) ? ` - ${parseDate(ev.endDate)?.toLocaleDateString('en-GB')}` : ''}</p>
                        </div>
                      </div>

                      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          {!isMobile && isEditListMode && (
                              <button className="pill-inline-edit" style={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); startEditing(ev); }}><RiEditLine /></button>
                          )}
                          <div className={`manager-collapsible-icon ${expandedEvents.includes(ev.id) ? 'open' : ''}`}>
                              <RiArrowDownSLine />
                          </div>
                      </div>
                    </header>

                    {isEditListMode && isMobile && (
                        <button className="pill-inline-edit" style={{ opacity: 1, margin: '0 auto 12px' }} onClick={(e) => { e.stopPropagation(); startEditing(ev); }}><RiEditLine /></button>
                    )}

                    <div className={`manager-collapsible-body-anim ${expandedEvents.includes(ev.id) ? 'open' : ''}`}>
                        <div className="manager-collapsible-body-inner">
                            <div className="published-subjects-container">
                               {ev.events?.map((evItem, idx) => (
                                  <div key={idx} className="exam-subject-row professional view-mode" style={{ gap: '16px', flexWrap: 'wrap', borderBottom: idx < ev.events.length - 1 ? '1px solid var(--mac-border)' : 'none' }}>
                                    <div className="view-cell" style={{ flex: '1 1 120px' }}><label>Date</label><span>{parseDate(evItem.date)?.toLocaleDateString('en-GB') || '-'}</span></div>
                                    <div className="view-cell" style={{ flex: '2 1 200px' }}><label>Title</label><span>{evItem.title || ev.title}</span></div>
                                    <div className="view-cell" style={{ flex: '1 1 100px' }}><label>Type</label><span>{evItem.type === 'Event' ? 'Notice' : evItem.type}</span></div>
                                    <div className="view-cell portion-cell" style={{ flex: '1 1 120px' }}>
                                      <label>Scope</label>
                                      <span className="portion-badge" style={{ background: evItem.scope === 'Common' ? 'rgba(40,200,64,0.1)' : 'rgba(255,149,0,0.1)', color: evItem.scope === 'Common' ? 'var(--mac-success-text)' : 'var(--mac-warning-text)' }}>
                                        {evItem.scope}
                                      </span>
                                    </div>
                                    {evItem.type === 'HalfDay' && (
                                      <div className="view-cell time-cell" style={{ flex: '1 1 150px' }}>
                                        <label>Timings</label>
                                        <span>{formatTimeForDisplay(evItem.startTime)} - {formatTimeForDisplay(evItem.endTime)}</span>
                                      </div>
                                    )}
                                    {evItem.description && (
                                      <div className="view-cell" style={{ flex: '100%', marginTop: '8px' }}>
                                        <label>Description</label>
                                        <span style={{ color: 'var(--mac-text)', opacity: 0.8 }}>{evItem.description}</span>
                                      </div>
                                    )}
                                  </div>
                               ))}
                            </div>
                        </div>
                    </div>
                  </>
                )}
              </div>
              </React.Fragment>
            )) : (
              <div className="event-empty-state" style={{ padding: '40px', textAlign: 'center', opacity: 0.5, color: 'var(--mac-text)' }}>
                No central events added for this department.
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
                                        {selectedEvents.length === 0 ? "Select Items" : `${selectedEvents.length} Selected`}
                                    </span>
                                    <span className="bulk-delete-desc">Choose events to delete</span>
                                </div>
                            </div>
                            <div className="pill-group">
                                <button
                                    className="premium-pill-btn primary"
                                    onClick={handleSelectAllEvents}
                                >
                                    {selectedEvents.length === masterData.events.length && masterData.events.length > 0 ? 'Deselect All' : 'Select All'}
                                </button>
                                <button className="premium-pill-btn secondary" onClick={() => { setSelectedEvents([]); setIsDeleteMode(false); }}>Cancel</button>
                                <button className="premium-pill-btn danger" onClick={handleBulkDeleteEvents} disabled={selectedEvents.length === 0}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bulk-delete-start-row">
                            <div className="bulk-delete-info">
                                <div className="info-icon">
                                    <RiCalendarEventLine />
                                </div>
                                <div className="bulk-delete-text">
                                    <span className="bulk-delete-title">Manage Events</span>
                                    <span className="bulk-delete-desc">Select and remove multiple events at once</span>
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
      {/* --- PREM CONF MODAL --- */}
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
                      <button className="btn-modal-confirm" onClick={() => { confirmModal.onConfirm(); closeConfirm(); }}>Delete</button>
                  </div>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default EventManager;
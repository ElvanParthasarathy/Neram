import React, { useState, useEffect, useRef } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, remove, get } from "firebase/database";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  RiTeamLine, RiRefreshLine, RiArrowLeftLine, RiDeleteBin6Line, RiArrowRightSLine,
  RiDownloadCloud2Line, RiUploadCloud2Line, RiCloseLine, RiAddLine
} from 'react-icons/ri';

import "../../styles/calendar-manager.css";
import "../../styles/event-manager.css";

const CalendarManager2 = () => {
  const [hierarchy, setHierarchy] = useState({});
  const [viewLevel, setViewLevel] = useState('batches'); // 'batches' | 'editor'
  const [selectedBatch, setSelectedBatch] = useState('');

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    id: '', title: '', start: '', end: '', allDay: true, type: 'Default'
  });

  const fullCalendarRef = useRef(null);

  // --- EVENT COLORING LOGIC ---
  const getEventClassname = (title, type) => {
    const t = title.toLowerCase();
    if (t.includes("holiday") || t.includes("vacation")) return "fc-custom-holiday";
    if (t.includes("exam") || t.includes("test") || t.includes("sia") || t.includes("fia") || t.includes("assessment")) return "fc-custom-exam";
    if (t.includes("working day") && t.includes("order")) return "fc-custom-order";
    if (type === "FullDay" || type === "HalfDay") return "fc-custom-special";
    return "fc-custom-default";
  };

  useEffect(() => {
    onValue(ref(db, 'academic_hierarchy'), (snap) => {
      setHierarchy(snap.val() || {});
    });
  }, []);

  useEffect(() => {
    if (viewLevel !== 'editor' || !selectedBatch) return;
    setIsLoading(true);

    get(ref(db, `calendars/${selectedBatch}/calendar2_raw`)).then((snap) => {
      if (snap.exists() && Array.isArray(snap.val())) {
        const decoratedEvents = snap.val().map(ev => ({
            ...ev,
            className: getEventClassname(ev.title, ev.extendedProps?.type)
        }));
        setEvents(decoratedEvents);
        setIsLoading(false);
      } else {
        // Fallback: Read legacy published events and convert them to FullCalendar format
        get(ref(db, `calendars/${selectedBatch}/events`)).then((legacySnap) => {
          if (legacySnap.exists()) {
            const rawEvents = Array.isArray(legacySnap.val()) ? legacySnap.val() : Object.values(legacySnap.val());
            
            // Reconstruct multi-day events from flattened daily rows using groupId or title matching
            const eventMap = new Map();
            rawEvents.forEach(ev => {
              const dateObj = new Date(ev.date || ev.startDate);
              const dateStr = dateObj.toISOString().split('T')[0];
              const groupKey = ev.groupId || ev.title; // Group by groupId if available, else title

              if (!eventMap.has(groupKey)) {
                eventMap.set(groupKey, {
                  id: ev.id || String(Date.now() + Math.random()),
                  title: ev.title,
                  start: dateStr,
                  end: dateStr,
                  allDay: ev.fullTime === 'All Day' || ev.fullTime?.includes('08:20 AM'), // Treat standard working day as all day on the grid for visual simplicity
                  className: getEventClassname(ev.title, ev.type),
                  extendedProps: { type: ev.type || 'Default' }
                });
              } else {
                // Extend the end date of the existing group
                const existing = eventMap.get(groupKey);
                if (dateStr > existing.end) {
                   existing.end = dateStr;
                }
                if (dateStr < existing.start) {
                   existing.start = dateStr;
                }
              }
            });

            // For FullCalendar, the exclusive 'end' date needs to be the day *after* the inclusive end date
            const fullCalendarEvents = Array.from(eventMap.values()).map(ev => {
                if (ev.start !== ev.end) {
                    const eDate = new Date(ev.end);
                    eDate.setDate(eDate.getDate() + 1); // Exclusive end
                    return { ...ev, end: eDate.toISOString().split('T')[0] };
                }
                return ev;
            });

            setEvents(fullCalendarEvents);
          } else {
            setEvents([]);
          }
          setIsLoading(false);
        }).catch(() => setIsLoading(false));
      }
    }).catch(() => {
      setIsLoading(false);
    });
  }, [viewLevel, selectedBatch]);

  // --- FULL CALENDAR ACTIONS ---
  const handleDateSelect = (selectInfo) => {
    // Click or drag across multiple days
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
    
    setEditingEvent(null);
    setModalFormData({
      id: String(Date.now()),
      title: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
      type: 'Default'
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo) => {
    const ev = clickInfo.event;
    setEditingEvent(ev);
    setModalFormData({
      id: ev.id,
      title: ev.title,
      start: ev.startStr,
      end: ev.endStr || ev.startStr, // Single day might not have endStr
      allDay: ev.allDay,
      type: ev.extendedProps.type || 'Default'
    });
    setIsModalOpen(true);
  };

  const handleEventDropOrResize = (changeInfo) => {
    const updatedEvents = events.map(ev => {
      // String coercion to ensure ID type mismatches don't break mapping
      if (String(ev.id) === String(changeInfo.event.id)) {
        return {
          ...ev,
          start: changeInfo.event.startStr,
          end: changeInfo.event.endStr || changeInfo.event.startStr, // Ensure single-day drags don't corrupt bounds
          allDay: changeInfo.event.allDay
        };
      }
      return ev;
    });
    setEvents(updatedEvents);
  };

  // --- MODAL ACTIONS ---
  const handleModalSave = () => {
    if (!modalFormData.title.trim()) return alert("Title is required");

    const newEvent = {
        id: modalFormData.id,
        title: modalFormData.title,
        start: modalFormData.start,
        end: modalFormData.end,
        allDay: modalFormData.allDay,
        className: getEventClassname(modalFormData.title, modalFormData.type),
        extendedProps: {
            type: modalFormData.type
        }
    };

    if (editingEvent) {
      setEvents(events.map(ev => ev.id === newEvent.id ? newEvent : ev));
    } else {
      setEvents([...events, newEvent]);
    }
    setIsModalOpen(false);
  };

  const handleModalDelete = () => {
    if (editingEvent) {
      setEvents(events.filter(ev => ev.id !== editingEvent.id));
    }
    setIsModalOpen(false);
  };

  // --- FIREBASE SAVING ---
  const handlePushLiveToFirebase = async () => {
    if (!confirm(`Save changes? This will instantly update the apps for Batch ${selectedBatch}.`)) return;
    setIsPushing(true);
    try {
      // Save raw for Calendar V2 editor state
      await set(ref(db, `calendars/${selectedBatch}/calendar2_raw`), events);

      // Compile to flattened v2 format for App consumption
      const compiledEvents = events.map(ev => {
          // Format ISO to YYYY-MM-DD
          const sDate = ev.start.split('T')[0];
          let eDate = ev.end ? ev.end.split('T')[0] : sDate;
          
          return {
              id: ev.id,
              title: ev.title,
              date: sDate,
              startDate: sDate,
              endDate: eDate,
              isHoliday: ev.title.toLowerCase().includes('holiday'),
              type: ev.extendedProps?.type || 'Default',
              fullTime: ev.allDay ? 'All Day' : 'Check Schedule'
          };
      });
      await set(ref(db, `calendars/${selectedBatch}/events_v2`), compiledEvents);
      alert(`✅ Changes saved live to Batch ${selectedBatch}`);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="pc-container admin-subpage" style={{ paddingBottom: '30px', position: 'static', transform: 'none' }}>
      {/* 1. HEADER WITH BREADCRUMBS */}
      <header className="explorer-header focus-mode" style={{ background: 'transparent', padding: '0 0 20px 0', borderBottom: viewLevel === 'editor' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none', height: 'auto', marginBottom: 0, position: 'static' }}>
        <div className="breadcrumb-nav">
          {viewLevel === 'editor' && (
            <button className="explorer-back-btn" onClick={() => { setViewLevel('batches'); }} style={{ marginRight: '12px' }}>
              <RiArrowLeftLine /> Back
            </button>
          )}

          <div className="breadcrumb-list">
            <span className="crumb-btn" onClick={() => { setViewLevel('batches'); }}>Calendars V2 (Google Parity)</span>
            {viewLevel === 'editor' && (
              <>
                <RiArrowRightSLine className="crumb-sep" />
                <span className="crumb-static">Batch {selectedBatch}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="pc-content-area flex-1-overflow" style={{ position: 'static', transform: 'none' }}>
        {/* LEVEL 1: BATCH EXPLORER */}
        {viewLevel === 'batches' && (
          <div className="explorer-content explorer-grid" style={{ paddingTop: '10px', position: 'static' }}>
            {Object.keys(hierarchy).filter(k => k !== 'initialized').sort().reverse().map(batch => (
              <div key={batch} className="explorer-card" onClick={() => { setSelectedBatch(batch); setViewLevel('editor'); }}>
                <RiTeamLine className="card-icon" />
                <div className="card-info">
                  <h3>Batch {batch}</h3>
                  <p>Manage Timeline & Events</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEVEL 2: EDITOR */}
        {viewLevel === 'editor' && (
          <div className="pc-workspace-full" style={{ padding: '0', background: 'var(--mac-bg)', border: 'none', display: 'flex', flexDirection: 'column', position: 'static', transform: 'none' }}>
            
            {/* Editor Header */}
            <div className="pc-live-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(255, 255, 255, 0.02)', padding: '16px 20px', position: 'static' }}>
                <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Google-Style Calendar Editor</h3>
                <p style={{ color: 'var(--mac-text-secondary)', margin: '4px 0 0 0', fontSize: '14px' }}>Click or drag on dates to create events. Drag events to move them.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    className="pc-btn-primary"
                    onClick={handlePushLiveToFirebase}
                    disabled={isPushing}
                    style={{ padding: '8px 16px', fontSize: '14px', background: 'var(--mac-blue)' }}
                >
                    {isPushing ? 'Saving...' : 'Save & Publish Sync'}
                </button>
                </div>
            </div>

            {/* FULL CALENDAR WRAPPER */}
            <div className="full-calendar-wrapper" style={{ flex: 1, minHeight: '600px' }}>
                {isLoading ? (
                    <div className="pc-empty-state"><RiRefreshLine className="spin" /> Loading calendar data...</div>
                ) : (
                    <FullCalendar
                        ref={fullCalendarRef}
                        plugins={[ dayGridPlugin, interactionPlugin ]}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth'
                        }}
                        initialView="dayGridMonth"
                        editable={true}
                        selectable={true}
                        selectMirror={true}
                        dayMaxEvents={true}
                        weekends={true}
                        events={events} // Alternatively, you can provide an array of objects
                        select={handleDateSelect}
                        eventClick={handleEventClick}
                        eventDrop={handleEventDropOrResize}
                        eventResize={handleEventDropOrResize}
                        dragScroll={false}
                        height="100%"
                    />
                )}
            </div>

          </div>
        )}
      </div>

      {/* EVENT MODAL */}
      {isModalOpen && (
        <div className="ea-cal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="settings-card" style={{ width: '400px', background: 'var(--mac-card-bg)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>{editingEvent ? 'Edit Event' : 'New Event'}</h3>
                <RiCloseLine style={{ fontSize: '24px', cursor: 'pointer' }} onClick={() => setIsModalOpen(false)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label className="mac-label">Event Title</label>
                    <input 
                        type="text" 
                        className="mac-input" 
                        placeholder="e.g. SIA 1 Exams, Holiday..."
                        value={modalFormData.title}
                        onChange={(e) => setModalFormData({...modalFormData, title: e.target.value})}
                    />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label className="mac-label">Start</label>
                        <input 
                            type={modalFormData.allDay ? "date" : "datetime-local"} 
                            className="mac-input" 
                            value={modalFormData.start.substring(0, modalFormData.allDay ? 10 : 16)}
                            onChange={(e) => setModalFormData({...modalFormData, start: e.target.value})}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="mac-label">End</label>
                        <input 
                            type={modalFormData.allDay ? "date" : "datetime-local"}  
                            className="mac-input" 
                            value={modalFormData.end ? modalFormData.end.substring(0, modalFormData.allDay ? 10 : 16) : ''}
                            onChange={(e) => setModalFormData({...modalFormData, end: e.target.value})}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                        type="checkbox" 
                        className="mac-checkbox" 
                        checked={modalFormData.allDay}
                        onChange={(e) => setModalFormData({...modalFormData, allDay: e.target.checked})}
                        id="allDayCheck"
                    />
                    <label htmlFor="allDayCheck" style={{ color: 'var(--mac-text)' }}>All Day Event</label>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    {editingEvent && (
                        <button className="pc-btn-primary danger-btn" onClick={handleModalDelete} style={{ background: 'rgba(255, 59, 48, 0.15)', color: '#FF3B30' }}>
                            <RiDeleteBin6Line /> Delete
                        </button>
                    )}
                    <button className="pc-btn-primary" onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', marginLeft: editingEvent ? 'auto' : '0' }}>
                        Cancel
                    </button>
                    <button className="pc-btn-primary" onClick={handleModalSave} style={{ background: 'var(--mac-blue)', marginLeft: !editingEvent ? 'auto' : '0' }}>
                        Save Event
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Global override for FullCalendar dark mode styles to match Neram */}
      <style>{`
         .fc { color: var(--mac-text); }
         .fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid { border-color: rgba(255,255,255,0.1); }
         .fc .fc-button-primary { background-color: var(--mac-bg-secondary); border-color: transparent; color: var(--mac-text); text-transform: capitalize; border-radius: 8px; }
         .fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: var(--mac-blue); border-color: transparent; }
         .fc-day-today { background-color: rgba(10, 132, 255, 0.1) !important; }
         .fc-event { border-radius: 4px; border: none; padding: 2px 4px; font-size: 12px; font-weight: 500; cursor: pointer; transition: transform 0.1s ease; }
         .fc-event:hover { transform: scale(1.02); }
         .fc-h-event { background-color: var(--mac-blue); color: white; }
         .fc-daygrid-event-dot { border-color: var(--mac-blue); }
         .fc-col-header-cell-cushion { padding: 8px 4px; color: var(--mac-text-secondary); font-weight: 500; }
         .fc-daygrid-day-number { color: var(--mac-text); padding: 8px; opacity: 0.8; }
         /* Dynamic Color Classes */
         .fc-custom-holiday { background-color: #8B5CF6 !important; border-color: #8B5CF6 !important; color: white !important; }
         .fc-custom-exam { background-color: #22C55E !important; border-color: #22C55E !important; color: white !important; }
         .fc-custom-order { background-color: #00BCD4 !important; border-color: #00BCD4 !important; color: white !important; }
         .fc-custom-special { background-color: #FBC02D !important; border-color: #FBC02D !important; color: white !important; }
         .fc-custom-default { background-color: var(--mac-blue) !important; border-color: var(--mac-blue) !important; color: white !important; }
         /* Fix button icon lines */
         .fc-icon { font-family: inherit !important; }
      `}</style>
    </div>
  );
};

export default CalendarManager2;

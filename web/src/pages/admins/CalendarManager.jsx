import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, remove, push, get } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatDateDDMMYYYY, handleAutoSlash, parseDMYToISO } from "../../utils/timeUtils";
import HybridDateInput from '../../components/HybridDateInput';
import {
  RiCalendarEventLine, RiTeamLine, RiRefreshLine, RiAddCircleLine,
  RiFileList3Line, RiInformationLine, RiArrowLeftLine, RiScanLine, RiDeleteBin6Line, RiArrowRightSLine,
  RiDownloadCloud2Line, RiUploadCloud2Line, RiCloseLine, RiEditLine, RiArrowDownSLine, RiAddLine
} from 'react-icons/ri';

// --- SHARED COMPONENTS ---
import CalendarBuilder from '../../components/CalendarBuilder';
import { buildRTDBEvents, downloadRTDBJson } from './elvan-agazhi/utils/calendarExport';
import ElvanAgazhi from './elvan-agazhi/ElvanAgazhi';

// --- IMPORT STYLES ---
import "../../styles/calendar-manager.css";
// Apply the global explorer theme for the grid
import "../../styles/event-manager.css";

const CalendarManager = () => {
  // --- EXPLORER STATE ---
  const [hierarchy, setHierarchy] = useState({});
  const [viewLevel, setViewLevel] = useState('batches'); // 'batches' | 'editor'
  const [selectedBatch, setSelectedBatch] = useState('');

  // --- EDITOR TABS ---
  const [activeTab, setActiveTab] = useState('published'); // 'published' | 'manual' | 'agazhi'
  const [viewDate, setViewDate] = useState(new Date(2025, 11, 1)); // Default Dec 2025

  // --- LIVE DATA -> EDITOR STATE ---
  const [liveFlatEvents, setLiveFlatEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLivePushing, setIsLivePushing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Track raw event count for empty states
  const [hasLiveEvents, setHasLiveEvents] = useState(false);

  // --- MANUAL BUILDER STATE ---
  const [manualStartDate, setManualStartDate] = useState('');
  const [manualEndDate, setManualEndDate] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [showManualBuilder, setShowManualBuilder] = useState(false);
  const [manualCalendar, setManualCalendar] = useState([]);
  const [isManualPushing, setIsManualPushing] = useState(false);

  const [isEditListMode, setIsEditListMode] = useState(false);
  const [editingDateStr, setEditingDateStr] = useState(null);
  const [editBuffer, setEditBuffer] = useState([]);
  const [expandedDates, setExpandedDates] = useState([]);

  // --- MOBILE DETECTION ---
  const [isMobile, setIsMobile] = useState(false);

  // 1. Load batches on mount
  useEffect(() => {
    onValue(ref(db, 'academic_hierarchy'), (snap) => {
      setHierarchy(snap.val() || {});
    });
  }, []);

  // Mobile detection on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. Load and Transform Events when entering Batch Workspace
  useEffect(() => {
    if (viewLevel !== 'editor' || !selectedBatch || activeTab !== 'published') return;
    setIsLoading(true);

    get(ref(db, `calendars/${selectedBatch}/events`)).then((snap) => {
      if (snap.exists() && Array.isArray(snap.val())) {
        const events = snap.val();
        setHasLiveEvents(events.length > 0);
        setLiveFlatEvents(events); // Re-added this missing state update

        // Auto-set the viewDate to the first event's month
        if (events.length > 0 && events[0].date) {
          const [y, m, d] = events[0].date.split('-');
          setViewDate(new Date(parseInt(y), parseInt(m) - 1, 1));
        }

      } else {
        setHasLiveEvents(false);
        setLiveFlatEvents([]);
      }
      setIsLoading(false);
    }).catch(() => {
      setHasLiveEvents(false);
      setIsLoading(false);
    });
  }, [viewLevel, selectedBatch, activeTab]);

  const fileInputRef = useRef(null);

  // --- LIVE EDITOR LOGIC ---
  const startEditing = (dateStr, groupedEvents) => {
    setEditingDateStr(dateStr);
    setEditBuffer(groupedEvents[dateStr].map(ev => ({ ...ev })));
  };

  const cancelEditing = () => {
    setEditingDateStr(null);
    setEditBuffer([]);
  };

  const saveEdit = () => {
    setLiveFlatEvents(prev => {
      const filtered = prev.filter(ev => ev.date !== editingDateStr);
      return [...filtered, ...editBuffer];
    });
    setEditingDateStr(null);
    setEditBuffer([]);
  };



  const handleExportLiveJSON = () => {
    if (liveFlatEvents.length === 0) return alert('No events to export');
    setIsExporting(true);
    setTimeout(() => {
      downloadRTDBJson(liveFlatEvents);
      setIsExporting(false);
    }, 500); // Give UI time to render loading state
  };

  const handleImportLiveJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          setLiveFlatEvents(imported);
          setHasLiveEvents(imported.length > 0);

          if (imported.length > 0 && imported[0].date) {
            const [y, m, d] = imported[0].date.split('-');
            setViewDate(new Date(parseInt(y), parseInt(m) - 1, 1));
          }

          alert('Calendar imported from JSON! Click "Save Live Changes" to apply this to the live apps.');
        } else {
          alert("Invalid file format: Expected an array of events.");
        }
      } catch (err) {
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Reset input
  };

  const handlePushLiveToFirebase = async () => {
    if (liveFlatEvents.length === 0) return alert('No events to push');
    if (!confirm(`Save changes? This will instantly update the apps for Batch ${selectedBatch}.`)) return;

    setIsLivePushing(true);
    try {
      await set(ref(db, `calendars/${selectedBatch}/events`), liveFlatEvents);
      alert(`✅ Changes saved live to Batch ${selectedBatch}`);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setIsLivePushing(false);
    }
  };

  const handleDeleteLiveCalendar = async () => {
    const code = prompt(`TYPE "${selectedBatch}" TO CONFIRM DELETION:\nThis will permanently remove the calendar for Batch ${selectedBatch} from all apps.`);
    if (code !== selectedBatch) {
      if (code !== null) alert("Incorrect verification code. Deletion cancelled.");
      return;
    }

    setIsLoading(true);
    try {
      await remove(ref(db, `calendars/${selectedBatch}/events`));
      setLiveFlatEvents([]);
      setHasLiveEvents(false);
      alert(`🗑️ Calendar deleted for Batch ${selectedBatch}`);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };


  // --- MANUAL BUILDER LOGIC ---
  const handleGenerateManual = () => {
    if (!manualStartDate || !manualEndDate) return alert("Please select both start and end dates.");

    const start = new Date(manualStartDate);
    const end = new Date(manualEndDate);
    if (end < start) return alert("End date cannot be before start date.");

    setIsBuilding(true);
    const monthsData = [];
    let currentDate = new Date(start);
    let currentWorkingDay = 1;

    while (currentDate <= end) {
      const year = currentDate.getFullYear();
      const monthName = currentDate.toLocaleString('default', { month: 'long' });

      let monthBlock = monthsData.find(m => m.year === year && m.month === monthName);
      if (!monthBlock) {
        monthBlock = { year, month: monthName, sourceIdx: null, rows: [] };
        monthsData.push(monthBlock);
      }

      const dayOfWeek = currentDate.getDay(); // 0 = Sunday
      const isSunday = dayOfWeek === 0;
      const dayStr = currentDate.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3);
      const dateStr = String(currentDate.getDate()).padStart(2, '0');

      const isWorking = !isSunday;

      monthBlock.rows.push({
        date: dateStr,
        day: dayStr,
        workingDay: isWorking ? String(currentWorkingDay++) : '',
        event: isSunday ? 'Sunday' : 'Working Day',
        fullTime: isWorking ? '08:20 AM - 03:00 PM' : 'All Day',
        type: isWorking ? 'FullDay' : 'Holiday',
        isHoliday: isSunday,
        fullDateObj: new Date(currentDate)
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    setManualCalendar(monthsData);
    setShowManualBuilder(true);
    setIsBuilding(false);
  };

  const handleManualCellChange = useCallback((mi, ri, field, value) => {
    setManualCalendar(prev => {
      const updated = [...prev];
      if (updated[mi] && updated[mi].rows[ri]) {
        updated[mi] = { ...updated[mi], rows: [...updated[mi].rows] };

        // Handle row deletion natively in Builder if user requested
        if (field === '_DELETE_ROW' && value === true) {
          updated[mi].rows.splice(ri, 1);
        } else {
          updated[mi].rows[ri] = { ...updated[mi].rows[ri], [field]: value };
        }
      }
      return updated;
    });
  }, []);

  const handlePushManualToFirebase = async () => {
    const events = buildRTDBEvents(manualCalendar);
    if (events.length === 0) return alert('No events to push');
    if (!confirm(`Overwrite existing calendar with this new manual build for Batch ${selectedBatch}?`)) return;

    setIsManualPushing(true);
    try {
      await set(ref(db, `calendars/${selectedBatch}/events`), events);
      alert(`✅ Manual Calendar pushed to Batch ${selectedBatch}`);
      setShowManualBuilder(false);
      setActiveTab('published'); // Switch back to see the live result
    } catch (err) {
      alert('Push failed: ' + err.message);
    } finally {
      setIsManualPushing(false);
    }
  };

  const filteredLiveEvents = liveFlatEvents.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === viewDate.getMonth() && itemDate.getFullYear() === viewDate.getFullYear();
  });

  const liveGroupedByDate = filteredLiveEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  // Duplicates removed

  // --- RENDER ---
  return (
    <div className="pc-container admin-subpage">

      {/* 1. HEADER WITH BREADCRUMBS */}
      <header className="explorer-header focus-mode" style={{ background: 'transparent', padding: '0 0 20px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', height: 'auto', marginBottom: 0 }}>
        <div className="breadcrumb-nav">
          {viewLevel === 'editor' && (
            <button className="explorer-back-btn" onClick={() => { setViewLevel('batches'); setActiveTab('published'); }} style={{ marginRight: '12px' }}>
              <RiArrowLeftLine /> Back
            </button>
          )}

          <div className="breadcrumb-list">
            <span className="crumb-btn" onClick={() => { setViewLevel('batches'); setActiveTab('published'); }}>Calendars</span>
            {viewLevel === 'editor' && (
              <>
                <RiArrowRightSLine className="crumb-sep" />
                <span className="crumb-static">Batch {selectedBatch}</span>
              </>
            )}
          </div>
        </div>

        {viewLevel === 'editor' && (
          <div className="pc-tabs" style={{ marginTop: '16px' }}>
            <button className={`pc-tab-btn ${activeTab === 'published' ? 'active' : ''}`} onClick={() => setActiveTab('published')}>
              <RiFileList3Line /> Live Published
            </button>
            <button className={`pc-tab-btn ${activeTab === 'agazhi' ? 'active' : ''}`} onClick={() => setActiveTab('agazhi')}>
              <RiScanLine /> PDF Builder
            </button>
            <button className={`pc-tab-btn ${activeTab === 'manual' ? 'active' : ''}`} onClick={() => setActiveTab('manual')}>
              <RiAddCircleLine /> Manual Builder
            </button>
          </div>
        )}
      </header>


      {/* CONTENT AREA */}
      <div className="pc-content-area flex-1-overflow">

        {/* LEVEL 1: GRID EXPLORER (Using event-manager.css theme) */}
        {viewLevel === 'batches' && (
          <div className="explorer-content explorer-grid" style={{ paddingTop: '10px' }}>
            {Object.keys(hierarchy).filter(k => k !== 'initialized').sort().reverse().map(batch => (
              <div
                key={batch}
                className="explorer-card"
                onClick={() => { setSelectedBatch(batch); setViewLevel('editor'); }}
              >
                <RiTeamLine className="card-icon" />
                <div className="card-info">
                  <h3>Batch {batch}</h3>
                  <p>Manage Timeline & Events</p>
                </div>
              </div>
            ))}
            {Object.keys(hierarchy).filter(k => k !== 'initialized').length === 0 && (
              <div className="pc-empty-state" style={{ gridColumn: '1 / -1', padding: '40px' }}>
                <RiInformationLine />
                <p>No batches found in hierarchy.</p>
              </div>
            )}
          </div>
        )}

        {/* LEVEL 2: EDITOR WORKSPACE */}
        {viewLevel === 'editor' && (
          <div
            className="pc-workspace-full"
            style={activeTab === 'published' ? { background: 'transparent', border: 'none' } : {}}
          >

            {/* TAB 1: EDITABLE PUBLISHED VIEWER */}
            {activeTab === 'published' && (
              <div className="pc-live-view full-width pc-editor-mode-container">
                {/* Always mount the file input so the ref works from any button */}
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImportLiveJSON}
                />

                {isLoading ? (
                  <div className="pc-empty-state"><RiRefreshLine className="spin" /> Loading live data...</div>
                ) : !hasLiveEvents ? (
                  <div className="pc-empty-state">
                    <RiInformationLine />
                    <p>No calendar data published for Batch {selectedBatch}</p>
                    <span className="pc-hint">Use the PDF Builder or Manual Builder tabs above to publish a calendar.</span>
                    <button
                      className="pc-btn-primary"
                      onClick={() => fileInputRef.current.click()}
                      style={{ marginTop: '20px', padding: '10px 20px', fontSize: '14px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--mac-text)' }}
                    >
                      <RiUploadCloud2Line /> Import Backup JSON
                    </button>
                  </div>
                ) : (
                  <>
                    {/* EXPORTING LOADING OVERLAY */}
                    {isExporting && (
                      <div className="ea-cal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                        <div className="settings-card" style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--mac-card-bg)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <RiRefreshLine className="spin" style={{ fontSize: '32px', color: 'var(--mac-blue)' }} />
                          <h3 style={{ margin: 0 }}>Creating JSON Backup...</h3>
                          <p style={{ margin: 0, color: 'var(--mac-text-secondary)', fontSize: '14px' }}>Please wait while the file is compiled.</p>
                        </div>
                      </div>
                    )}

                    <div className="pc-live-header" style={{ borderBottom: 'none', background: 'rgba(255, 255, 255, 0.05)' }}>
                      <div>
                        <h3>Currently Live for Batch {selectedBatch}</h3>
                        <p style={{ color: 'var(--mac-success-text)' }}>Changes made below can be pushed directly to the live apps.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          className="pc-btn-primary"
                          onClick={() => fileInputRef.current.click()}
                          style={{ padding: '8px 16px', fontSize: '14px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--mac-text)' }}
                        >
                          <RiUploadCloud2Line /> Import
                        </button>
                        <button
                          className="pc-btn-primary"
                          onClick={handleExportLiveJSON}
                          disabled={isExporting}
                          style={{ padding: '8px 16px', fontSize: '14px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--mac-text)' }}
                        >
                          <RiDownloadCloud2Line /> Backup
                        </button>
                        <button
                          className="pc-btn-primary danger-btn"
                          onClick={handleDeleteLiveCalendar}
                          style={{ padding: '8px 16px', fontSize: '14px', background: 'rgba(255, 59, 48, 0.15)', color: '#FF3B30' }}
                        >
                          <RiDeleteBin6Line /> Delete
                        </button>
                        <button
                          className="pc-btn-primary"
                          onClick={handlePushLiveToFirebase}
                          disabled={isLivePushing}
                          style={{ padding: '8px 16px', fontSize: '14px' }}
                        >
                          {isLivePushing ? 'Saving...' : 'Save Live Changes'}
                        </button>
                      </div>
                    </div>

                    {/* PUBLISHED VERTICAL CARDS WITH INLINE EDITING */}
                    <div className="calendar-editable-list" style={{ marginTop: '20px' }}>
                      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <nav className="table-navigation" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
                          <button className="nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>Prev</button>
                          <h4 className="current-month-display">{viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h4>
                          <button className="nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>Next</button>
                        </nav>
                        <button 
                          className={`pill-inline-edit ${isEditListMode ? 'active' : ''}`} 
                          onClick={() => setIsEditListMode(!isEditListMode)}
                        >
                          <RiEditLine /> {isEditListMode ? 'Done' : 'Edit List'}
                        </button>
                      </div>

                      <div className="published-exams-section">
                        {Object.keys(liveGroupedByDate).sort().map((dateStr) => {
                          const [year, month, day] = dateStr.includes('-') ? dateStr.split('-') : [viewDate.getFullYear(), viewDate.getMonth() + 1, dateStr];
                          const displayDate = `${day}/${month}/${year}`;
                          const dayName = new Date(dateStr.includes('-') ? dateStr : `${year}-${month}-${day}`).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
                          const isEditing = editingDateStr === dateStr;
                          const currentEvents = isEditing ? editBuffer : liveGroupedByDate[dateStr];
                          const isExpanded = expandedDates.includes(dateStr);

                          return (
                            <React.Fragment key={dateStr}>
                              {isEditing && !isMobile && (
                                  <div className="master-header-row pill-group-row desktop-edit-actions" style={{ justifyContent: 'flex-end', marginBottom: '8px' }}>
                                      <button className="role-header-pill secondary" onClick={cancelEditing}>Cancel</button>
                                      <button className="role-header-pill active" onClick={saveEdit}>Save</button>
                                  </div>
                              )}
                              <div className={`settings-card published-exam-card ${isEditing ? 'editing-active' : ''}`}>
                                  <header 
                                      className="published-header" 
                                      style={{ alignItems: 'center', cursor: !isEditing ? 'pointer' : 'default' }}
                                      onClick={(e) => {
                                          if (isEditing) return;
                                          if (e.target.closest('button') || e.target.closest('input')) return;
                                          setExpandedDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
                                      }}
                                  >
                                      {isEditing ? (
                                          <div className="edit-meta-inputs" style={{ flex: 1 }}>
                                              {isMobile && (
                                                  <div className="mobile-edit-actions pill-group-row master-header-row" style={{ width: '100%', flexDirection: 'row', gap: '8px', marginBottom: '16px' }}>
                                                      <button className="role-header-pill secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={cancelEditing}>Cancel</button>
                                                      <button className="role-header-pill active" style={{ flex: 1, justifyContent: 'center' }} onClick={saveEdit}>Save</button>
                                                  </div>
                                              )}
                                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--mac-text)' }}>
                                                {displayDate} <span style={{ color: 'var(--mac-blue)', marginLeft: '8px' }}>{dayName}</span>
                                              </div>
                                          </div>
                                      ) : (
                                          <>
                                              <div className="pub-title-group" style={{ flex: 1 }}>
                                                  <RiCalendarEventLine className="icon-main" style={{ color: 'var(--mac-blue)' }} />
                                                  <div>
                                                      <h3>{displayDate}</h3>
                                                      <p style={{ color: 'var(--mac-blue)', fontWeight: 600, fontSize: '12px' }}>{dayName}</p>
                                                  </div>
                                              </div>
                                          </>
                                      )}

                                      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                          {!isEditing && isEditListMode && !isMobile && (
                                              <button className="pill-inline-edit" style={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); startEditing(dateStr, liveGroupedByDate); }}><RiEditLine /></button>
                                          )}
                                          {!isEditing && (
                                                  <div className={`manager-collapsible-icon ${isExpanded ? 'open' : ''}`}>
                                                      <RiArrowDownSLine />
                                                  </div>
                                          )}
                                      </div>
                                  </header>

                                  {!isEditing && isEditListMode && isMobile && (
                                      <button className="pill-inline-edit" style={{ opacity: 1, margin: '0 auto 12px' }} onClick={(e) => { e.stopPropagation(); startEditing(dateStr, liveGroupedByDate); }}><RiEditLine /></button>
                                  )}

                                  <div className={`manager-collapsible-body-anim ${isExpanded || isEditing ? 'open' : ''}`}>
                                      <div className="manager-collapsible-body-inner">
                                          <div className="published-subjects-container">
                                              {currentEvents.map((ev, i) => (
                                                  <div key={ev.id || i} className={`exam-subject-row ${isEditing ? 'professional editing' : 'professional view-mode'}`}>
                                                      {isEditing ? (
                                                          <>
                                                              <div className="input-group-vertical" style={{ flex: 2 }}>
                                                                  <label>Event Title</label>
                                                                  <input 
                                                                      value={ev.title || ''} 
                                                                      onChange={e => {
                                                                          const newBuf = [...editBuffer];
                                                                          newBuf[i].title = e.target.value;
                                                                          setEditBuffer(newBuf);
                                                                      }} 
                                                                      placeholder="Event Title..." 
                                                                  />
                                                              </div>
                                                              <div className="input-group-vertical" style={{ flex: 1 }}>
                                                                  <label>Time</label>
                                                                  <input 
                                                                      value={ev.fullTime || ''} 
                                                                      onChange={e => {
                                                                          const newBuf = [...editBuffer];
                                                                          newBuf[i].fullTime = e.target.value;
                                                                          setEditBuffer(newBuf);
                                                                      }} 
                                                                      placeholder="All Day" 
                                                                  />
                                                              </div>
                                                              <button className="btn-del-mini" onClick={() => {
                                                                  if(window.confirm("Remove this event?")) {
                                                                      setEditBuffer(editBuffer.filter((_, idx) => idx !== i));
                                                                  }
                                                              }}><RiDeleteBin6Line /></button>
                                                          </>
                                                      ) : (
                                                          <>
                                                              <div className="sub-info-group" style={{ flex: 2 }}>
                                                                  <strong className="sub-code" style={{ fontSize: '14px' }}>{ev.title || "Untitled Event"}</strong>
                                                              </div>
                                                              <div className="sub-meta-group" style={{ flex: 1, justifyContent: 'flex-end' }}>
                                                                  <span className="time-badge">{ev.fullTime || "All Day"}</span>
                                                              </div>
                                                          </>
                                                      )}
                                                  </div>
                                              ))}
                                              
                                              {isEditing && (
                                                  <button className="btn-add-line" style={{ marginTop: '12px' }} onClick={() => {
                                                      setEditBuffer([...editBuffer, {
                                                          id: `temp-${Date.now()}`,
                                                          date: dateStr,
                                                          title: '',
                                                          fullTime: '',
                                                          type: 'FullDay'
                                                      }]);
                                                  }}>
                                                      <RiAddLine /> Add Event Row
                                                  </button>
                                              )}
                                              {!isEditing && currentEvents.length === 0 && (
                                                  <div style={{ padding: '16px', color: 'var(--mac-text-secondary)', fontSize: '13px', textAlign: 'center' }}>No events for this date.</div>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                        {Object.keys(liveGroupedByDate).length === 0 && (
                          <div className="pc-empty-state">
                            <RiInformationLine />
                            <p>No calendar data published for {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: PDF BUILDER (ELVAN AGAZHI) */}
            {activeTab === 'agazhi' && (
              <div className="pc-agazhi-wrapper">
                <ElvanAgazhi preselectedBatch={selectedBatch} />
              </div>
            )}

            {/* TAB 3: MANUAL CALENDAR BUILDER */}
            {activeTab === 'manual' && (
              <div className="pc-manual-mode">
                {!showManualBuilder ? (
                  <div className="pc-manual-setup-card">
                    <h3>Initialize Manual Calendar</h3>
                    <p>Generate a blank working-day calendar for Batch {selectedBatch}.</p>

                    <div className="pc-date-inputs">
                      <div className="field">
                        <label>Start Date</label>
                        <HybridDateInput
                          value={manualStartDate}
                          onChange={(val) => setManualStartDate(val)}
                        />
                      </div>

                      <div className="field">
                        <label>End Date</label>
                        <HybridDateInput
                          value={manualEndDate}
                          onChange={(val) => setManualEndDate(val)}
                        />
                      </div>
                    </div>

                    <button
                      className="pc-btn-primary"
                      onClick={handleGenerateManual}
                      disabled={isBuilding}
                      style={{ marginTop: '20px' }}
                    >
                      <RiAddCircleLine /> Generate Blank Table
                    </button>
                  </div>
                ) : (
                  <CalendarBuilder
                    isOpen={showManualBuilder}
                    onClose={() => setShowManualBuilder(false)}
                    parsedCalendar={manualCalendar}
                    batchResults={null}
                    onCellChange={handleManualCellChange}
                    onExport={() => alert("RTDB Export requires saving via push first in manual mode.")}
                    onPushToFirebase={handlePushManualToFirebase}
                    isPushing={isManualPushing}
                    batches={[selectedBatch]}
                    selectedBatch={selectedBatch}
                  />
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarManager;
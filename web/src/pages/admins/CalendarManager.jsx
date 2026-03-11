import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, get, remove } from "firebase/database";
import {
  RiCalendarEventLine, RiTeamLine, RiRefreshLine, RiAddCircleLine,
  RiFileList3Line, RiInformationLine, RiArrowLeftLine, RiScanLine, RiDeleteBin6Line, RiArrowRightSLine,
  RiDownloadCloud2Line, RiUploadCloud2Line, RiCloseLine
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

  // 1. Load batches on mount
  useEffect(() => {
    onValue(ref(db, 'academic_hierarchy'), (snap) => {
      setHierarchy(snap.val() || {});
    });
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
  const handleLiveEventChange = (id, updates) => {
    setLiveFlatEvents(prev => prev.map(ev => ev.id === id ? { ...ev, ...updates } : ev));
  };

  const handleDeleteLiveEvent = (id) => {
    if (window.confirm('Delete this event?')) {
      setLiveFlatEvents(prev => prev.filter(ev => ev.id !== id));
    }
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

      monthBlock.rows.push({
        date: dateStr,
        day: dayStr,
        workingDay: isSunday ? '' : String(currentWorkingDay++),
        event: isSunday ? 'Sunday' : '',
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
            <span className="crumb-btn" onClick={() => { setViewLevel('batches'); setActiveTab('published'); }}>Calendar Datastore</span>
            {viewLevel === 'editor' && (
              <>
                <RiArrowRightSLine className="crumb-sep" />
                <span className="crumb-static">Batch {selectedBatch} Workspace</span>
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

                    {/* RESTORED OLD VISUAL GRID WITH INLINE EDITING */}
                    <div className="calendar-editable-list">
                      <nav className="table-navigation">
                        <button className="nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>Prev</button>
                        <h4 className="current-month-display">{viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h4>
                        <button className="nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>Next</button>
                      </nav>

                      <div className="admin-table-wrapper">
                        <div className="calendar-table">
                          <div className="calendar-thead">
                            <div className="date-cell hd">Date</div>
                            <div className="day-cell hd">Day</div>
                            <div className="events-cell hd">Events & Descriptions</div>
                          </div>
                          <div className="calendar-tbody">
                            {Object.keys(liveGroupedByDate).sort().map((dateStr) => {
                              const [year, month, day] = dateStr.includes('-') ? dateStr.split('-') : [viewDate.getFullYear(), viewDate.getMonth() + 1, dateStr];
                              const displayDate = `${day}/${month}/${year}`;

                              return (
                                <div key={dateStr} className="calendar-tr">
                                  <div className="date-cell">
                                    {displayDate}
                                  </div>
                                  <div className="day-cell">
                                    {new Date(dateStr.includes('-') ? dateStr : `${year}-${month}-${day}`).toLocaleDateString('en-GB', { weekday: 'short' })}
                                  </div>
                                  <div className="events-cell">
                                    <div className="events-list-vertical">
                                      {liveGroupedByDate[dateStr].map((event, i) => (
                                        <div key={event.id || i} className="event-item-pill" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', width: '100%' }}>
                                          <input
                                            className="inline-edit-input"
                                            value={event.title}
                                            onChange={e => handleLiveEventChange(event.id, { title: e.target.value })}
                                            placeholder="Event title..."
                                            style={{ flex: 2, background: 'transparent', border: 'none', color: 'var(--mac-text)', minWidth: 150 }}
                                          />
                                          <input
                                            className="inline-edit-input"
                                            value={event.fullTime || ''}
                                            onChange={e => handleLiveEventChange(event.id, { fullTime: e.target.value })}
                                            placeholder="All Day"
                                            style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 6px', color: 'var(--mac-text-secondary)', fontSize: '12px', minWidth: 100 }}
                                          />
                                          <select
                                            value={event.type || 'FullDay'}
                                            onChange={e => handleLiveEventChange(event.id, { type: e.target.value })}
                                            style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '2px', fontSize: '12px', width: 90 }}
                                          >
                                            <option value="FullDay" style={{ color: '#000' }}>FullDay</option>
                                            <option value="HalfDay" style={{ color: '#000' }}>HalfDay</option>
                                            <option value="Holiday" style={{ color: '#000' }}>Holiday</option>
                                            <option value="None" style={{ color: '#000' }}>None</option>
                                          </select>
                                          <button
                                            onClick={() => handleDeleteLiveEvent(event.id)}
                                            style={{ background: 'transparent', border: 'none', color: '#ff453a', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                            title="Delete Event"
                                          >
                                            <RiCloseLine size={16} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
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
                <div className="pc-manual-setup-card">
                  <h3>Initialize Manual Calendar</h3>
                  <p>Generate a blank working-day calendar for Batch {selectedBatch}.</p>

                  <div className="pc-date-inputs">
                    <div className="pc-input-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        value={manualStartDate}
                        onChange={e => setManualStartDate(e.target.value)}
                        className="pc-input"
                      />
                    </div>
                    <div className="pc-input-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        value={manualEndDate}
                        onChange={e => setManualEndDate(e.target.value)}
                        className="pc-input"
                      />
                    </div>

                    <button
                      className="pc-btn-primary"
                      onClick={handleGenerateManual}
                      disabled={isBuilding}
                    >
                      <RiAddCircleLine /> Generate Blank Table
                    </button>
                  </div>
                </div>

                {showManualBuilder && (
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
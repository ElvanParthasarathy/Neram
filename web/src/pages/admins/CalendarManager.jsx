import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from "../../firebase";
import { ref, onValue, set, remove, push, get, update } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatDateDDMMYYYY, handleAutoSlash, parseDMYToISO } from "../../utils/timeUtils";
import HybridDateInput from '../../components/HybridDateInput';
import {
  RiCalendarEventLine, RiCalendarLine, RiTeamLine, RiRefreshLine, RiAddCircleLine,
  RiFileList3Line, RiInformationLine, RiArrowLeftLine, RiScanLine, RiDeleteBin6Line, RiDeleteBin6Fill, RiArrowRightSLine,
  RiDownloadCloud2Line, RiUploadCloud2Line, RiCloseLine, RiEditLine, RiArrowDownSLine, RiAddLine,
  RiArrowLeftSLine, RiCheckboxCircleLine
} from 'react-icons/ri';

// --- SHARED COMPONENTS ---
import CalendarBuilder from '../../components/CalendarBuilder';
import { buildRTDBEvents, downloadRTDBJson } from './elvan-agazhi/utils/calendarExport';
import ElvanAgazhi from './elvan-agazhi/ElvanAgazhi';

import "../../styles/calendar-manager.css";
import "../../styles/event-manager.css";
import "../../styles/exam-manager.css";

// --- HELPERS ---
const t24to12 = (time24) => {
    if (!time24) return "";
    let [hours, minutes] = time24.split(":");
    hours = parseInt(hours);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
};

const t12to24 = (time12) => {
    if (!time12 || time12 === "All Day") return "";
    // Handle cases where the string might be "08:30 AM - 03:00 PM" by taking only the first part if needed
    // But usually we call this on single parts
    const parts = time12.trim().split(" ");
    if (parts.length < 2) return time12; // Fallback
    const [time, ampm] = parts;
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours);
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${minutes}`;
};

const getSpannedEvents = (events) => {
    const sorted = [...events].sort((a, b) => {
        if (a.title !== b.title) return a.title.localeCompare(b.title);
        if ((a.fullTime || '') !== (b.fullTime || '')) return (a.fullTime || '').localeCompare(b.fullTime || '');
        return a.date.localeCompare(b.date);
    });

    const spans = [];
    if (sorted.length === 0) return spans;

    let currentSpan = {
        title: sorted[0].title,
        fullTime: sorted[0].fullTime || 'All Day',
        type: sorted[0].type || 'FullDay',
        startDate: sorted[0].date,
        endDate: sorted[0].date,
        ids: [sorted[0].id]
    };

    for (let i = 1; i < sorted.length; i++) {
        const ev = sorted[i];
        const lastDate = new Date(currentSpan.endDate);
        const thisDate = new Date(ev.date);
        const diff = Math.ceil((thisDate - lastDate) / (1000 * 60 * 60 * 24));

        if (ev.title === currentSpan.title && 
            (ev.fullTime || 'All Day') === currentSpan.fullTime && 
            (ev.type || 'FullDay') === currentSpan.type && 
            diff === 1) {
            currentSpan.endDate = ev.date;
            currentSpan.ids.push(ev.id);
        } else {
            spans.push(currentSpan);
            currentSpan = {
                title: ev.title,
                fullTime: ev.fullTime || 'All Day',
                type: ev.type || 'FullDay',
                startDate: ev.date,
                endDate: ev.date,
                ids: [ev.id]
            };
        }
    }
    spans.push(currentSpan);
    return spans.sort((a, b) => a.startDate.localeCompare(b.startDate));
};

const CalendarManager = () => {
  // --- EXPLORER STATE ---
  const [hierarchy, setHierarchy] = useState({});
  const [viewLevel, setViewLevel] = useState('batches'); // 'batches' | 'editor'
  const [selectedBatch, setSelectedBatch] = useState('');

  // --- EDITOR TABS ---
  const [activeTab, setActiveTab] = useState('published'); // 'published' | 'manual' | 'agazhi'
  const [viewDate, setViewDate] = useState(new Date()); // Default to current month

  // --- LIVE DATA -> EDITOR STATE ---
  const [liveFlatEvents, setLiveFlatEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLivePushing, setIsLivePushing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Track raw event count for empty states
  const [hasLiveEvents, setHasLiveEvents] = useState(false);



  const [isEditListMode, setIsEditListMode] = useState(false);
  const [editingDateStr, setEditingDateStr] = useState(null);
  const [editBuffer, setEditBuffer] = useState([]);

  // --- BULK DELETE STATE ---
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);

  // --- CONFIRM MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null, actionText: 'Delete', isDanger: true });
  const closeConfirm = () => setConfirmModal({ show: false, title: '', message: '', onConfirm: null, actionText: 'Delete', isDanger: true });

  // --- MULTI-EVENT BATCH STATE ---
  const [batchEvents, setBatchEvents] = useState([
    { id: Date.now(), title: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], fullTime: '08:30 AM - 03:00 PM', type: 'Event' }
  ]);
  const [isAddingNew, setIsAddingNew] = useState(false); // Sacrificial state to prevent ghost crashes
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const addBatchRow = () => {
    const today = new Date().toISOString().split('T')[0];
    setBatchEvents(prev => [...prev, { id: Date.now() + Math.random(), title: '', startDate: today, endDate: today, fullTime: '08:30 AM - 03:00 PM', type: 'Event' }]);
  };

  const removeBatchRow = (id) => {
    if (batchEvents.length > 1) {
      setBatchEvents(prev => prev.filter(ev => ev.id !== id));
    }
  };

  const updateBatchRow = (id, field, value) => {
    setBatchEvents(prev => prev.map(ev => ev.id === id ? { ...ev, [field]: value } : ev));
  };

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

        // Removed logic that auto-sets viewDate to the first event's month


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
  const cancelEditing = () => {
    setEditingDateStr(null);
    setEditBuffer([]);
  };

  const handleImportLiveJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          setConfirmModal({
            show: true,
            title: 'Confirm Import',
            message: hasLiveEvents 
              ? `Are you sure you want to overwrite the existing live calendar with ${imported.length} new events? This action cannot be undone.`
              : `Are you sure you want to import ${imported.length} new events to the live calendar?`,
            actionText: 'Import',
            isDanger: false,
            onConfirm: async () => {
              try {
                // Ensure array structure is intact
                const validArray = Array.isArray(imported) ? imported : [];
                await set(ref(db, `calendars/${selectedBatch}/events`), validArray);
                
                // --- INSTANT LOCAL STATE REFRESH ---
                setLiveFlatEvents(validArray);
                setHasLiveEvents(validArray.length > 0);
                
                // Auto-pan to first imported date so user sees results instantly
                if (validArray.length > 0 && validArray[0].date) {
                  const [y, m, d] = validArray[0].date.split('-');
                  setViewDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                }

                alert('Calendar imported and pushed to Live successfully!');
              } catch (err) {
                alert('Failed to save to server: ' + err.message);
              }
            }
          });
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


  const handleAddNewEvent = () => {
    addBatchRow();
  };

  // Generate a groupId matching ElvanAgazhi's buildRTDBEvents convention
  const generateGroupId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 26; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  };

  const saveBatchEvents = async () => {
    const validEvents = batchEvents.filter(ev => ev.title.trim());
    if (validEvents.length === 0) return alert("At least one event with a title is required");

    const allNewEntries = [];
    
    validEvents.forEach(batchEv => {
      const start = new Date(batchEv.startDate);
      const end = new Date(batchEv.endDate);
      const groupId = generateGroupId(); // One groupId per batch event span
      
      let current = new Date(start);
      while (current <= end) {
        const dStr = current.toISOString().split('T')[0];
        allNewEntries.push({
          date: dStr,
          fullTime: batchEv.fullTime,
          type: batchEv.type || 'FullDay',
          groupId: groupId,
          id: `${groupId}_${dStr}`,
          title: batchEv.title
        });
        current.setDate(current.getDate() + 1);
      }
    });

    const updatedEvents = [...liveFlatEvents, ...allNewEntries];
    setLiveFlatEvents(updatedEvents);
    setHasLiveEvents(true);

    // PERSIST IMMEDIATELY to academic calendar path
    try {
      await set(ref(db, `calendars/${selectedBatch}/events`), updatedEvents);
      showToast(`✅ ${validEvents.length} event(s) saved log!`);
    } catch (err) {
      alert("Events created locally but failed to save to server: " + err.message);
    }

    // Reset to one fresh row
    const today = new Date().toISOString().split('T')[0];
    setBatchEvents([{ id: Date.now(), title: '', startDate: today, endDate: today, fullTime: 'All Day', type: 'Event' }]);
  };

  // --- BULK DELETE HANDLERS ---
  const handleToggleEventSelect = (spanId) => {
    setSelectedEvents(prev => prev.includes(spanId) ? prev.filter(i => i !== spanId) : [...prev, spanId]);
  };

  const handleSelectAllEvents = () => {
    const allIds = spannedEvents.map(s => s.startDate + '-' + s.title);
    if (selectedEvents.length === allIds.length && allIds.length > 0) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(allIds);
    }
  };

  const handleBulkDeleteEvents = async () => {
    if (selectedEvents.length === 0) return;
    if (!window.confirm(`Delete ${selectedEvents.length} selected event(s)?`)) return;

    // Build set of spans to delete
    const spansToDelete = selectedEvents.map(sid => {
      const span = spannedEvents.find(s => (s.startDate + '-' + s.title) === sid);
      return span;
    }).filter(Boolean);

    const updated = liveFlatEvents.filter(ev => {
      return !spansToDelete.some(span =>
        ev.title === span.title && ev.date >= span.startDate && ev.date <= span.endDate
      );
    });

    setLiveFlatEvents(updated);

    // Persist immediately
    try {
      await set(ref(db, `calendars/${selectedBatch}/events`), updated);
      showToast(`✅ ${selectedEvents.length} event(s) deleted!`);
    } catch (err) {
      alert('Delete failed locally, save needed: ' + err.message);
    }

    setSelectedEvents([]);
    setIsDeleteMode(false);
  };





  const saveEdit = async (oldStartDate, oldEndDate, oldTitle) => {
    if (editBuffer.length === 0) return;
    const spanInfo = editBuffer[0]; 

    const filtered = liveFlatEvents.filter(ev => {
      const isMatch = (ev.title === oldTitle && ev.date >= oldStartDate && ev.date <= oldEndDate);
      return !isMatch;
    });

    const newEvents = [];
    const gId = generateGroupId();
    const start = new Date(spanInfo.startDate);
    const end = new Date(spanInfo.endDate);
    let current = new Date(start);
    while (current <= end) {
      const dStr = current.toISOString().split('T')[0];
      newEvents.push({
        date: dStr,
        fullTime: spanInfo.fullTime,
        type: spanInfo.type || 'FullDay', // Preserves Occasion (Academic), Holiday, or Event (Working Day)
        groupId: gId,
        id: `${gId}_${dStr}`,
        title: spanInfo.title
      });
      current.setDate(current.getDate() + 1);
    }
    const finalEvents = [...filtered, ...newEvents];
    setLiveFlatEvents(finalEvents);

    setEditingDateStr(null);
    setEditBuffer([]);

    // Persist to Firebase instantly (like Bulk Add/Delete)
    try {
      if (finalEvents.length > 0) {
        await set(ref(db, `calendars/${selectedBatch}/events`), finalEvents);
        showToast("✅ Edit saved successfully!");
      }
    } catch (err) {
      alert('Edit failed to save to server: ' + err.message);
    }
  };

  const startEditingSpan = (span) => {
    setEditingDateStr(span.startDate + '-' + span.title); // Unique key
    setEditBuffer([{ ...span }]);
  };

  const handleExportLiveJSON = () => {
    if (liveFlatEvents.length === 0) return alert('No events to export');
    setIsExporting(true);
    setTimeout(() => {
      downloadRTDBJson(liveFlatEvents);
      setIsExporting(false);
    }, 500); 
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

  const handleDeleteLiveCalendar = () => {
    setConfirmModal({
      show: true,
      title: 'Delete Entire Calendar',
      message: `This will permanently remove every single event for Batch ${selectedBatch} across all months. This action is destructive and cannot be undone.`,
      actionText: 'Delete',
      isDanger: true,
      onConfirm: async () => {
        const code = prompt(`TYPE "${selectedBatch}" TO CONFIRM DELETION:`);
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
      }
    });
  };


  // --- Auto-color mapping (matches Calendar.jsx — colors NOT saved in DB) ---
  const getCardColor = (event) => {
    const t = (event.title || '').toLowerCase();
    
    // Priority 1: Exam override (Green)
    if (t.includes('exam') || t.includes('test') || t.includes('sia') || t.includes('fia')) return { text: '#66BB6A', bg: '#66BB6A20' };
    
    // Priority 2: Order override (Cyan)
    if (t.includes('order')) return { text: '#00BCD4', bg: '#00BCD420' };
    
    // Priority 3: Assigned Types & Exact matches
    if (event.type === 'Holiday' || t.includes('holiday')) return { text: '#9C27B0', bg: '#9C27B020' }; // Purple
    if (event.type === 'Academic') return { text: '#FFCA28', bg: '#FFCA2820' }; // Yellow
    
    // Default: Working Day
    return { text: 'var(--mac-blue)', bg: 'rgba(10, 132, 255, 0.1)' }; // Working Day / Default
  };

  // --- Base Type Color mapping (No Overrides) ---
  const getBaseTypeColor = (type) => {
    if (type === 'Holiday') return { text: '#9C27B0', bg: '#9C27B020' };
    if (type === 'Academic') return { text: '#FFCA28', bg: '#FFCA2820' };
    return { text: 'var(--mac-blue)', bg: 'rgba(10, 132, 255, 0.1)' };
  };

  const filteredLiveEvents = liveFlatEvents.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === viewDate.getMonth() && itemDate.getFullYear() === viewDate.getFullYear();
  });

  const spannedEvents = getSpannedEvents(filteredLiveEvents);

  // Duplicates removed

  // --- RENDER ---
  return (
    <div className="pc-container admin-subpage">
      {toastMsg && createPortal(
        <div className="admin-toast-popup animate-slide-up">
          {toastMsg}
        </div>,
        document.body
      )}

      {/* 1. HEADER WITH BREADCRUMBS */}
      <header className="explorer-header focus-mode" style={{ background: 'transparent', padding: '0 0 20px 0', borderBottom: '1px solid var(--mac-divider)', height: 'auto', marginBottom: 0 }}>
        <div className="breadcrumb-nav">
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
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {viewLevel === 'editor' && (
            <button className="explorer-back-btn" onClick={() => { setViewLevel('batches'); setActiveTab('published'); }}>
              <RiArrowLeftLine /> Back
            </button>
          )}
        </div>
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
          <div className="pc-editor-workspace-free">
            {!isMobile && (
              <nav className="editor-tabs box-flat">
                <button className={activeTab === 'published' ? 'active' : ''} onClick={() => setActiveTab('published')}>
                  Live Calendar
                </button>
                <button className={activeTab === 'agazhi' ? 'active' : ''} onClick={() => setActiveTab('agazhi')}>
                  PDF Agazhi
                </button>
              </nav>
            )}

            {/* TAB 1: EDITABLE PUBLISHED VIEWER */}
            {activeTab === 'published' && (
              <div className="pc-live-view full-width">
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
                  <div className="empty-placeholder" style={{ background: 'var(--mac-sidebar-bg)', borderRadius: '24px', padding: '60px 20px', margin: '20px 0', border: '1px solid var(--mac-border)' }}>
                    <div style={{ background: 'rgba(0, 122, 255, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                      <RiCalendarEventLine style={{ fontSize: '32px', color: 'var(--mac-blue)', opacity: 1 }} />
                    </div>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mac-text)', margin: '0 0 8px 0', textAlign: 'center' }}>No calendar published for Batch {selectedBatch}</h3>
                    <p style={{ fontSize: '13px', color: 'var(--mac-text-secondary)', margin: '0 0 24px 0', textAlign: 'center', maxWidth: '300px', lineHeight: 1.5 }}>
                      Use the PDF Agazhi tab above to generate a new live calendar for this batch.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '150px' }}>
                      <button
                        className="premium-pill-btn secondary"
                        onClick={() => fileInputRef.current.click()}
                        style={{ flex: 1, height: '44px' }}
                      >
                        <RiUploadCloud2Line style={{ fontSize: '18px' }} /> Import JSON
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* EXPORTING LOADING OVERLAY */}
                    {isExporting && (
                      <div className="ea-cal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                        <div className="settings-card" style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'var(--mac-card-bg)', border: '1px solid var(--mac-divider)' }}>
                          <RiRefreshLine className="spin" style={{ fontSize: '32px', color: 'var(--mac-blue)' }} />
                          <h3 style={{ margin: 0 }}>Creating JSON Backup...</h3>
                          <p style={{ margin: 0, color: 'var(--mac-text-secondary)', fontSize: '14px' }}>Please wait while the file is compiled.</p>
                        </div>
                      </div>
                    )}



                    {/* PUBLISHED VERTICAL CARDS WITH INLINE EDITING */}
                    <div className="calendar-editable-list" style={{ marginTop: '20px', paddingBottom: '100px' }}>
                      <div className="section-header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 className="section-divider-title" style={{ margin: 0, border: 'none', color: 'var(--mac-text)', textTransform: 'none', fontSize: '15px', fontWeight: 700, padding: 0 }}>Events</h3>
                        {isEditListMode ? (
                            <div className="master-header-row" style={{ display: 'flex', gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
                                <button
                                    className="role-header-pill secondary"
                                    onClick={() => { setIsEditListMode(false); setIsDeleteMode(false); setSelectedEvents([]); cancelEditing(); }}
                                    style={{ minWidth: '90px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="role-header-pill active"
                                    onClick={() => { setIsEditListMode(false); setIsDeleteMode(false); setSelectedEvents([]); cancelEditing(); }}
                                    style={{ minWidth: '90px' }}
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <button className="edit-list-btn" onClick={() => setIsEditListMode(true)}>
                                <RiEditLine style={{ marginRight: '6px' }} /> Edit List
                            </button>
                        )}
                      </div>

                      {/* MULTI-EVENT BATCH CREATOR — Only in Edit List Mode, Exam Creator Parity */}
                      {isEditListMode && (
                      <div className="exam-manager-container">
                      <div className="settings-card exam-creator-card" style={{ border: '2px solid var(--mac-blue-15)' }}>
                          <h2 className="editor-title" style={{ color: 'var(--mac-blue)', marginBottom: '24px' }}><RiAddCircleLine /> Create Events</h2>

                          {batchEvents.map((ev, idx) => (
                            <div key={ev.id} className="subject-mapping-section" style={{ marginBottom: idx < batchEvents.length - 1 ? '24px' : '0' }}>
                              {batchEvents.length > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--mac-blue)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Event #{idx + 1}</span>
                                  <button className="btn-del-mini" onClick={() => {
                                    setConfirmModal({
                                      show: true,
                                      title: 'Remove Event',
                                      message: 'Are you sure you want to remove this event from the batch creator?',
                                      actionText: 'Remove',
                                      isDanger: true,
                                      onConfirm: () => removeBatchRow(ev.id)
                                    });
                                  }} style={{ borderRadius: '100px', width: 'auto', height: 'auto', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}><RiDeleteBin6Line /> Remove</button>
                                </div>
                              )}
                              <div className="exam-config-grid" style={{ marginBottom: '0', paddingBottom: idx < batchEvents.length - 1 ? '20px' : '0', borderBottom: idx < batchEvents.length - 1 ? '1px solid var(--mac-divider)' : 'none' }}>
                                <div className="field">
                                  <label>Event Name</label>
                                  <input
                                    placeholder="e.g. Holiday, Working Day, SIA"
                                    value={ev.title}
                                    onChange={(e) => updateBatchRow(ev.id, 'title', e.target.value)}
                                  />
                                </div>

                                <div className="field">
                                  <label>Event Type</label>
                                  <div style={{ display: 'flex', gap: '6px', background: 'var(--mac-button-bg)', borderRadius: '100px', padding: '4px', height: '44px', width: '100%', boxSizing: 'border-box' }}>
                                    {[{label: 'Working Day', val: 'Event'}, {label: 'Holiday', val: 'Holiday'}, {label: 'Occasion', val: 'Academic'}].map(t => {
                                      const isActive = ev.type === t.val || (!ev.type && t.val === 'Event');
                                      const activeColor = t.val === 'Holiday' ? '#9C27B0' : (t.val === 'Academic' ? '#FFCA28' : 'var(--mac-blue)');
                                      const isTinted = t.val === 'Academic';
                                      return (
                                        <button
                                          key={t.val}
                                          onClick={() => {
                                              updateBatchRow(ev.id, 'type', t.val);
                                              if (t.val === 'Holiday') {
                                                  updateBatchRow(ev.id, 'fullTime', 'All Day');
                                              } else {
                                                  // Default for Working Day and Occasion is custom time
                                                  if (ev.fullTime === 'All Day') updateBatchRow(ev.id, 'fullTime', '08:30 AM - 03:00 PM');
                                              }
                                          }}
                                          style={{
                                            flex: 1, padding: '0 8px', border: 'none', borderRadius: '100px',
                                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                            background: isActive ? (isTinted ? `${activeColor}25` : activeColor) : 'transparent',
                                            color: isActive ? (isTinted ? activeColor : '#fff') : 'var(--mac-text-secondary)',
                                            transition: 'all 0.2s ease', height: '100%'
                                          }}
                                        >
                                          {t.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {false && (
                                <div className="field animate-slide-up">
                                  <label>Time Setting</label>
                                  <div style={{ display: 'flex', gap: '6px', background: 'var(--mac-button-bg)', borderRadius: '100px', padding: '4px', height: '44px', width: '100%', boxSizing: 'border-box' }}>
                                    {['All Day', 'Custom'].map(t => {
                                      const isActive = ev.fullTime === t || (t === 'Custom' && ev.fullTime !== 'All Day');
                                      return (
                                        <button
                                          key={t}
                                          onClick={() => updateBatchRow(ev.id, 'fullTime', t === 'Custom' ? '08:30 AM - 03:00 PM' : t)}
                                          style={{
                                            flex: 1, padding: '0 16px', border: 'none', borderRadius: '100px',
                                            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                            background: isActive ? 'var(--mac-blue)' : 'transparent',
                                            color: isActive ? '#fff' : 'var(--mac-text-secondary)',
                                            transition: 'all 0.2s ease', height: '100%'
                                          }}
                                        >
                                          {t}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                                )}

                                <div className="field">
                                  <label>Start Date</label>
                                  <HybridDateInput
                                    value={ev.startDate}
                                    onChange={(val) => updateBatchRow(ev.id, 'startDate', val)}
                                  />
                                </div>

                                <div className="field">
                                  <label>End Date</label>
                                  <HybridDateInput
                                    value={ev.endDate}
                                    onChange={(val) => updateBatchRow(ev.id, 'endDate', val)}
                                  />
                                </div>

                                {ev.type !== 'Holiday' && ev.fullTime !== 'All Day' && (
                                  <>
                                    <div className="field animate-slide-up">
                                      <label>Start Time</label>
                                      <input
                                        type="time"
                                        value={t12to24(ev.fullTime.split(' - ')[0] || '08:30 AM')}
                                        onChange={(e) => {
                                          const parts = ev.fullTime.split(' - ');
                                          const newStart = t24to12(e.target.value);
                                          updateBatchRow(ev.id, 'fullTime', `${newStart} - ${parts[1] || '03:00 PM'}`);
                                        }}
                                      />
                                    </div>
                                    <div className="field animate-slide-up">
                                      <label>End Time</label>
                                      <input
                                        type="time"
                                        value={t12to24(ev.fullTime.split(' - ')[1] || '03:00 PM')}
                                        onChange={(e) => {
                                          const parts = ev.fullTime.split(' - ');
                                          const newEnd = t24to12(e.target.value);
                                          updateBatchRow(ev.id, 'fullTime', `${parts[0] || '08:30 AM'} - ${newEnd}`);
                                        }}
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}

                           <button 
                             className="premium-pill-btn secondary" 
                             style={{ width: '100%', marginTop: '12px', height: '44px', border: '1px dashed var(--mac-border)' }} 
                             onClick={addBatchRow}
                           >
                             <RiAddLine /> Add Extra Event
                           </button>

                          {batchEvents.some(ev => ev.title.trim()) && (
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                              <button className="btn-save-master" style={{ flex: 1, height: '36px', fontSize: '13px', padding: '0 18px', borderRadius: '50px' }} onClick={saveBatchEvents}>Publish</button>
                              <button className="btn-cancel-mini" style={{ flex: 1, padding: '0 18px', height: '36px', fontSize: '13px', borderRadius: '50px', background: 'var(--mac-sidebar-bg)', border: '1px solid var(--mac-border)', color: 'var(--mac-text)', cursor: 'pointer', fontWeight: 600 }} onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                setBatchEvents([{ id: Date.now(), title: '', startDate: today, endDate: today, fullTime: 'All Day', type: 'Event' }]);
                              }}>Cancel</button>
                            </div>
                          )}
                      </div>
                      </div>
                      )}

                      <div className="nav-toolbar-shifter">
                        <button className="nav-shifter-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>
                          <RiArrowLeftSLine />
                        </button>
                        <h4 className="nav-shifter-month">{viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h4>
                        <button className="nav-shifter-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>
                          <RiArrowRightSLine />
                        </button>
                      </div>

                      <div className="published-exams-section" style={{ paddingBottom: 0 }}>
                        {spannedEvents.map((span) => {
                          const spanId = span.startDate + '-' + span.title;
                          const isEditing = editingDateStr === spanId;
                          const currentSpan = isEditing ? (editBuffer[0] || span) : span;
                          
                          if (!currentSpan) return null;

                          // Format display dates
                          const startDisplay = new Date(currentSpan.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                          const endDisplay = new Date(currentSpan.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                          const sameDay = currentSpan.startDate === currentSpan.endDate;

                          return (
                            <React.Fragment key={spanId}>
                              {isEditing && !isMobile && (
                                  <div className="master-header-row pill-group-row desktop-edit-actions" style={{ justifyContent: 'flex-end', marginBottom: '8px' }}>
                                      <button className="premium-pill-btn secondary" onClick={cancelEditing}>Cancel</button>
                                      <button className="premium-pill-btn primary" onClick={() => saveEdit(span.startDate, span.endDate, span.title)}>Save</button>
                                  </div>
                              )}
                              <div className={`settings-card published-exam-card compact-card ${isEditing ? 'editing-active' : ''}`}>
                                  {!isEditing && (
                                      <div className="compact-card-inner">
                                          {isDeleteMode && (
                                              <input
                                                  type="checkbox"
                                                  className="mac-checkbox"
                                                  style={{ marginRight: '16px', flexShrink: 0, width: '22px', height: '22px', accentColor: 'var(--mac-blue)' }}
                                                  checked={selectedEvents.includes(spanId)}
                                                  onChange={(e) => { e.stopPropagation(); handleToggleEventSelect(spanId); }}
                                              />
                                          )}
                                          <div className="compact-date-badge" style={{ background: getCardColor(currentSpan).bg, color: getCardColor(currentSpan).text }}>
                                              <span className="day-num">{new Date(currentSpan.startDate).getDate()}</span>
                                              <span className="month-name">{new Date(currentSpan.startDate).toLocaleString('default', { month: 'short' })}</span>
                                          </div>
                                          <div className="compact-details">
                                              <h3>{currentSpan.title}</h3>
                                              <div className="time-row">
                                                  <span className="time-badge-mini" style={{ color: getBaseTypeColor(currentSpan.type).text }}>
                                                      {currentSpan.fullTime || 'All Day'}
                                                  </span>
                                                  {!sameDay && <span style={{ opacity: 0.4 }}>•</span>}
                                                  {!sameDay && <span className="range-subtext">Until {endDisplay}</span>}
                                              </div>
                                          </div>
                                          <div className="compact-actions">
                                              {!isEditing && isEditListMode && !isDeleteMode && (
                                                  <button className="pill-inline-edit" onClick={(e) => { e.stopPropagation(); startEditingSpan(span); }}><RiEditLine /></button>
                                              )}
                                          </div>
                                      </div>
                                  )}

                                  {isEditing && (
                                      <div className="event-editor-card exam-manager-container" style={{ padding: '0 0 24px 0', borderBottom: '1px solid var(--mac-divider)', marginBottom: '24px' }}>
                                          {isMobile && (
                                              <div className="mobile-edit-actions" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                                  <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={cancelEditing}>Cancel</button>
                                                  <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => saveEdit(span.startDate, span.endDate, span.title)}>Save</button>
                                              </div>
                                          )}
                                          
                                          <div className="exam-config-grid" style={{ marginBottom: '16px', paddingBottom: '0', borderBottom: 'none' }}>
                                              {/* 1. Title */}
                                              <div className="field">
                                                  <label>Event Name</label>
                                                  <input 
                                                      placeholder="e.g. Holiday, Working Day, SIA"
                                                      value={currentSpan.title}
                                                      onChange={e => {
                                                          const nb = [...editBuffer];
                                                          nb[0].title = e.target.value;
                                                          setEditBuffer(nb);
                                                      }}
                                                  />
                                              </div>

                                              <div className="field">
                                                   <label>Event Type</label>
                                                   <div style={{ display: 'flex', gap: '6px', background: 'var(--mac-button-bg)', borderRadius: '100px', padding: '4px', height: '44px', width: '100%', boxSizing: 'border-box' }}>
                                                      {[{label: 'Working Day', val: 'Event'}, {label: 'Holiday', val: 'Holiday'}, {label: 'Occasion', val: 'Academic'}].map(t => {
                                                          const isActive = currentSpan.type === t.val || (!currentSpan.type && t.val === 'Event');
                                                          const activeColor = t.val === 'Holiday' ? '#9C27B0' : (t.val === 'Academic' ? '#FFCA28' : 'var(--mac-blue)');
                                                          const isTinted = t.val === 'Academic'; // Yellow uses tinted style
                                                          return (
                                                              <button
                                                                  key={t.val}
                                                                  onClick={() => {
                                                                      const nb = [...editBuffer];
                                                                      nb[0].type = t.val;
                                                                      if (t.val === 'Holiday') {
                                                                          nb[0].fullTime = 'All Day';
                                                                      } else {
                                                                          if (nb[0].fullTime === 'All Day') nb[0].fullTime = '08:30 AM - 03:00 PM';
                                                                      }
                                                                      setEditBuffer(nb);
                                                                  }}
                                                                  style={{
                                                                      flex: 1, padding: '0 8px', border: 'none', borderRadius: '100px',
                                                                      fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                                                      background: isActive ? (isTinted ? `${activeColor}25` : activeColor) : 'transparent',
                                                                      color: isActive ? (isTinted ? activeColor : '#fff') : 'var(--mac-text-secondary)',
                                                                      transition: 'all 0.2s ease', height: '100%'
                                                                  }}
                                                              >
                                                                  {t.label}
                                                              </button>
                                                          );
                                                      })}
                                                  </div>
                                               </div>
                                              {/* 2. Time Setting (Uniform Flex Toggle) - REMOVED per user request */}
                                              {false && (
                                              <div className="field animate-slide-up">
                                                  <label>Time Setting</label>
                                                  <div style={{ display: 'flex', gap: '6px', background: 'var(--mac-button-bg)', borderRadius: '100px', padding: '4px', height: '44px', width: '100%', boxSizing: 'border-box' }}>
                                                      {['All Day', 'Custom'].map(t => {
                                                          const isActive = currentSpan.fullTime === t || (t === 'Custom' && currentSpan.fullTime !== 'All Day');
                                                          return (
                                                              <button
                                                                  key={t}
                                                                  onClick={() => {
                                                                      const nb = [...editBuffer];
                                                                      nb[0].fullTime = t === 'Custom' ? '08:30 AM - 03:00 PM' : t;
                                                                      setEditBuffer(nb);
                                                                  }}
                                                                  style={{
                                                                      flex: 1, padding: '0 16px', border: 'none', borderRadius: '100px',
                                                                      fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                                                      background: isActive ? 'var(--mac-blue)' : 'transparent',
                                                                      color: isActive ? '#fff' : 'var(--mac-text-secondary)',
                                                                      transition: 'all 0.2s ease', height: '100%'
                                                                  }}
                                                              >
                                                                  {t}
                                                              </button>
                                                          );
                                                      })}
                                                  </div>
                                              </div>
                                              )}

                                              {/* 3. Start Date */}
                                              <div className="field">
                                                  <label>Start Date</label>
                                                  <HybridDateInput 
                                                      value={currentSpan.startDate}
                                                      onChange={val => {
                                                          const nb = [...editBuffer];
                                                          nb[0].startDate = val;
                                                          setEditBuffer(nb);
                                                      }}
                                                  />
                                              </div>

                                              {/* 4. End Date */}
                                              <div className="field">
                                                  <label>End Date</label>
                                                  <HybridDateInput 
                                                      value={currentSpan.endDate}
                                                      onChange={val => {
                                                          const nb = [...editBuffer];
                                                          nb[0].endDate = val;
                                                          setEditBuffer(nb);
                                                      }}
                                                  />
                                              </div>

                                              {/* Start/End Time Extract for Custom */}
                                              {currentSpan.type !== 'Holiday' && currentSpan.fullTime !== 'All Day' && (
                                                <>
                                                  <div className="field animate-slide-up">
                                                    <label>Start Time</label>
                                                    <input
                                                      type="time"
                                                      value={t12to24(currentSpan.fullTime?.split(' - ')[0] || '08:30 AM')}
                                                      onChange={(e) => {
                                                        const nb = [...editBuffer];
                                                        const parts = currentSpan.fullTime?.split(' - ') || ['08:30 AM', '03:00 PM'];
                                                        const newStart = t24to12(e.target.value);
                                                        nb[0].fullTime = `${newStart} - ${parts[1] || '03:00 PM'}`;
                                                        setEditBuffer(nb);
                                                      }}
                                                    />
                                                  </div>
                                                  <div className="field animate-slide-up">
                                                    <label>End Time</label>
                                                    <input
                                                      type="time"
                                                      value={t12to24(currentSpan.fullTime?.split(' - ')[1] || '03:00 PM')}
                                                      onChange={(e) => {
                                                        const nb = [...editBuffer];
                                                        const parts = currentSpan.fullTime?.split(' - ') || ['08:30 AM', '03:00 PM'];
                                                        const newEnd = t24to12(e.target.value);
                                                        nb[0].fullTime = `${parts[0] || '08:30 AM'} - ${newEnd}`;
                                                        setEditBuffer(nb);
                                                      }}
                                                    />
                                                  </div>
                                                </>
                                              )}
                                          </div>


                                      </div>
                                  )}
                              </div>
                            </React.Fragment>
                          );
                        })}
                        {spannedEvents.length === 0 && (
                          <div className="empty-placeholder" style={{ background: 'var(--mac-sidebar-bg)', borderRadius: '24px', padding: '60px 20px', margin: '20px 0', border: '1px solid var(--mac-border)' }}>
                            <div style={{ background: 'rgba(0, 122, 255, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                              <RiCalendarEventLine style={{ fontSize: '32px', color: 'var(--mac-blue)', opacity: 1 }} />
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--mac-text)', margin: '0 0 8px 0', textAlign: 'center' }}>No Events to Display</h3>
                            <p style={{ fontSize: '13px', color: 'var(--mac-text-secondary)', margin: '0', textAlign: 'center', maxWidth: '300px', lineHeight: 1.5 }}>
                              There is no calendar data published for {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* LIVE STATUS FOOTER — Same style as Bulk Delete */}
                      {!isEditListMode && (
                        <div className="bulk-action-footer-premium animate-slide-up" style={{ margin: '0 0 40px 0' }}>
                          <div className="bulk-delete-start-row">
                            <div className="bulk-delete-info">
                              <div className="info-icon" style={{ background: 'rgba(40, 200, 64, 0.1)', color: 'var(--mac-success-text)' }}>
                                <RiCheckboxCircleLine />
                              </div>
                              <div className="bulk-delete-text">
                                <span className="bulk-delete-title">Live: Batch {selectedBatch}</span>
                                <span className="bulk-delete-desc" style={{ color: 'var(--mac-success-text)', opacity: 0.8 }}>All changes publish instantly</span>
                              </div>
                            </div>
                            <div className="pill-group">

                              <button
                                className="premium-pill-btn secondary"
                                onClick={() => fileInputRef.current.click()}
                              >
                                <RiUploadCloud2Line /> Import
                              </button>
                              <button
                                className="premium-pill-btn secondary"
                                onClick={handleExportLiveJSON}
                                disabled={isExporting}
                              >
                                <RiDownloadCloud2Line /> Backup
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* BULK ACTION FOOTER — Exam Manager Parity */}
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
                                                {selectedEvents.length === 0 ? 'Select Items' : `${selectedEvents.length} Selected`}
                                            </span>
                                            <span className="bulk-delete-desc">Choose events to delete</span>
                                        </div>
                                    </div>
                                    <div className="pill-group">
                                        <button
                                            className="premium-pill-btn tinted-primary"
                                            onClick={handleSelectAllEvents}
                                        >
                                            {selectedEvents.length === spannedEvents.length && spannedEvents.length > 0 ? 'Deselect All' : 'Select All'}
                                        </button>
                                        <button 
                                            className="premium-pill-btn tinted-danger" 
                                            onClick={handleDeleteLiveCalendar}
                                        >
                                            Wipe All
                                        </button>
                                        <button className="premium-pill-btn secondary" onClick={() => { setSelectedEvents([]); setIsDeleteMode(false); }}>Cancel</button>
                                        <button className="premium-pill-btn tinted-danger" onClick={handleBulkDeleteEvents} disabled={selectedEvents.length === 0}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bulk-delete-start-row">
                                    <div className="bulk-delete-info">
                                        <div className="info-icon">
                                            <RiCalendarLine />
                                        </div>
                                        <div className="bulk-delete-text">
                                            <span className="bulk-delete-title">Manage Calendar Events</span>
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
                  </>
                )}
              </div>
            )}



            {/* TAB 2: PDF BUILDER (ELVAN AGAZHI) */}
            {!isMobile && activeTab === 'agazhi' && (
              <div className="pc-agazhi-wrapper">
                <ElvanAgazhi preselectedBatch={selectedBatch} />
              </div>
            )}


          </div>
        )}
      </div>

      {/* --- PREM CONF MODAL --- */}
      {confirmModal.show && createPortal(
          <div className="modal-overlay animate-fade-in" onClick={closeConfirm}>
              <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                      {confirmModal.isDanger ? (
                          <RiDeleteBin6Line className="modal-icon-danger" />
                      ) : (
                          <RiInformationLine style={{ fontSize: '24px', color: 'var(--mac-blue)' }} />
                      )}
                      <h3>{confirmModal.title}</h3>
                  </div>
                  <p className="modal-message">{confirmModal.message}</p>
                   <div className="modal-footer">
                       <button className="btn-modal-cancel" onClick={closeConfirm}>Cancel</button>
                       <button 
                           className={`premium-pill-btn ${confirmModal.isDanger ? 'danger' : 'primary'}`} 
                           style={{ flex: 1, height: '44px' }}
                           onClick={() => { confirmModal.onConfirm(); closeConfirm(); }}
                       >
                           {confirmModal.actionText}
                       </button>
                   </div>
              </div>
          </div>,
          document.body
      )}

    </div>
  );
};

export default CalendarManager;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { db } from "../../firebase";
import { ref, onValue, set, get } from "firebase/database";
import {
  RiArrowRightSLine, RiTeamLine, RiRefreshLine, RiGoogleFill,
  RiSettings4Line, RiCloseLine, RiArrowLeftLine, RiCheckLine, RiSave3Line, RiUploadCloud2Line
} from 'react-icons/ri';

// --- IMPORT STYLES ---
import "../../styles/calendar-manager.css";

const CalendarManager = () => {
  const [hierarchy, setHierarchy] = useState({});
  const [viewLevel, setViewLevel] = useState(sessionStorage.getItem('cm_viewLevel') || 'batches');
  const [selectedBatch, setSelectedBatch] = useState(sessionStorage.getItem('cm_batch') || '');
  const [config, setConfig] = useState({ apiKey: '', calendarId: '' });
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [editableEvents, setEditableEvents] = useState([]);

  const lastPublishedHash = useRef("");

  const [semConfig, setSemConfig] = useState({
    name: 'Even Semester 2025-26',
    start: '2025-12-01',
    end: '2026-05-31'
  });

  const getHash = (events) => JSON.stringify(events.map(e => `${e.id}-${e.title}-${e.fullTime}`));

  const toLocalISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseAsLocal = (dateStr) => {
    if (dateStr.includes('T')) return new Date(dateStr);
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const expandGoogleEvent = useCallback((event) => {
    const startVal = event.start.dateTime || event.start.date;
    const endVal = event.end.dateTime || event.end.date;
    const startDate = parseAsLocal(startVal);
    const endDate = parseAsLocal(endVal);
    let curr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    let stop = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    let days = [];
    const isAllDay = !event.start.dateTime;

    const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    while (isAllDay ? curr < stop : curr <= stop) {
      const dateStr = toLocalISO(curr);
      let timeRange = "All Day";
      if (!isAllDay) {
        timeRange = `${formatTime(startDate)} - ${formatTime(endDate)}`;
      }
      days.push({
        id: `${event.id}_${dateStr}`,
        title: event.summary || "Untitled",
        date: dateStr,
        fullTime: timeRange
      });
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, []);

  const syncFromGoogle = useCallback(async (isManual = false) => {
    if (!config.apiKey || !config.calendarId || viewLevel !== 'editor') return;
    setLoading(true);
    let allFetched = [];
    let pageToken = null;
    try {
      const timeMin = new Date(semConfig.start).toISOString();
      const timeMax = new Date(semConfig.end).toISOString();
      do {
        let url = `https://www.googleapis.com/calendar/v3/calendars/${config.calendarId}/events?key=${config.apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`;
        if (pageToken) url += `&pageToken=${pageToken}`;
        const data = await (await fetch(url)).json();
        if (data.error) throw new Error(data.error.message);
        allFetched = [...allFetched, ...(data.items || [])];
        pageToken = data.nextPageToken;
      } while (pageToken);

      let allExpanded = [];
      allFetched.forEach(item => { allExpanded = [...allExpanded, ...expandGoogleEvent(item)]; });
      allExpanded.sort((a, b) => new Date(a.date) - new Date(b.date));

      const newHash = getHash(allExpanded);
      if (newHash !== lastPublishedHash.current) {
        setEditableEvents(allExpanded);
        lastPublishedHash.current = newHash;
        await set(ref(db, `calendars/${selectedBatch}/events`), allExpanded);
      }
      if (isManual) alert("Manual Sync Complete!");
    } catch (err) {
      console.error("Sync Error:", err.message);
      if (isManual) alert("Sync Failed: " + err.message);
    } finally { setLoading(false); }
  }, [config, semConfig, viewLevel, selectedBatch, expandGoogleEvent]);

  useEffect(() => {
    onValue(ref(db, 'academic_hierarchy'), (snap) => setHierarchy(snap.val() || {}));
    if (viewLevel === 'editor' && selectedBatch) {
      get(ref(db, `calendars/${selectedBatch}`)).then((snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setConfig(data.config || { apiKey: '', calendarId: '' });
          setSemConfig(data.semConfig || { name: 'Even Semester', start: '2025-12-01', end: '2026-05-31' });
          setEditableEvents(data.events || []);
          lastPublishedHash.current = getHash(data.events || []);
        }
      });
    }
  }, [viewLevel, selectedBatch]);

  useEffect(() => {
    const timer = setTimeout(() => syncFromGoogle(false), 2000);
    return () => clearTimeout(timer);
  }, [config.apiKey, config.calendarId, semConfig.start, semConfig.end, syncFromGoogle]);

  const saveSettingsToFirebase = async () => {
    try {
      await set(ref(db, `calendars/${selectedBatch}/config`), config);
      await set(ref(db, `calendars/${selectedBatch}/semConfig`), semConfig);
      setIsEditingConfig(false);
      alert("Settings Saved Permanently!");
    } catch (e) { alert("Save Failed: " + e.message); }
  };

  const forcePushToFirebase = async () => {
    try {
      setLoading(true);
      await set(ref(db, `calendars/${selectedBatch}/events`), editableEvents);
      alert("Manual Force-Push Successful!");
    } catch (e) { alert("Push Failed: " + e.message); }
    finally { setLoading(false); }
  };

  const filteredEvents = editableEvents.filter(item => {
    const itemDate = parseAsLocal(item.date);
    return itemDate.getMonth() === viewDate.getMonth() && itemDate.getFullYear() === viewDate.getFullYear();
  });

  const groupedByDate = filteredEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  return (
    /* --- UPDATED: SCOPED CONTAINER CLASS ADDED HERE --- */
    <div className="calendar-manager-container admin-subpage">
      <header className="explorer-header">
        <div className="breadcrumb-nav">
          {viewLevel === 'editor' ? (
            <button className="back-btn-minimal" onClick={() => setViewLevel('batches')}>
              <RiArrowLeftLine /> Back
            </button>
          ) : <span className="crumb-static">Calendar Manager</span>}
          {selectedBatch && viewLevel === 'editor' && (
            <><RiArrowRightSLine /> <span className="crumb-static">Batch {selectedBatch} (Live Sync)</span></>
          )}
        </div>
        {loading && <div className="loading-indicator-mini"><RiRefreshLine className="spin" /> Updating...</div>}
      </header>

      <div className="explorer-content">
        {viewLevel === 'batches' ? (
          <div className="explorer-grid">
            {Object.keys(hierarchy).sort().reverse().map(batch => (
              <div key={batch} className="explorer-card" onClick={() => { setSelectedBatch(batch); setViewLevel('editor'); }}>
                <RiTeamLine className="card-icon" />
                <div className="card-info"><h3>Batch {batch}</h3><p>Real-time Google Mirror</p></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-admin-workspace">
            {/* 1. NEW TOP-BAR CONFIGURATION MODULE */}
            <div className="cm-desktop-header settings-card">
              <div className="cm-header-top-row">
                <div className="cm-header-title">
                  <RiGoogleFill className="google-icon" />
                  <div>
                    <h3>API Configuration</h3>
                    <p>Google Calendar Live Sync Settings</p>
                  </div>
                </div>

                <div className="cm-header-actions">
                  <button className="btn-modify-mini" onClick={() => setIsEditingConfig(!isEditingConfig)}>
                    {isEditingConfig ? <RiCloseLine /> : <RiSettings4Line />}
                  </button>
                  <div className="cm-divider-vert"></div>
                  <button className="btn-safety" onClick={() => syncFromGoogle(true)}>
                    <RiRefreshLine /> Manual Sync
                  </button>
                  <button className="btn-safety push" onClick={forcePushToFirebase}>
                    <RiUploadCloud2Line /> Force Push
                  </button>
                </div>
              </div>

              <div className={`cm-config-dropdown ${isEditingConfig ? 'active' : ''}`}>
                <div className="cm-config-grid">
                  <div className="cm-input-group">
                    <label>API Key</label>
                    <input disabled={!isEditingConfig} value={config.apiKey} onChange={e => setConfig({ ...config, apiKey: e.target.value })} />
                  </div>
                  <div className="cm-input-group">
                    <label>Calendar ID</label>
                    <input disabled={!isEditingConfig} value={config.calendarId} onChange={e => setConfig({ ...config, calendarId: e.target.value })} />
                  </div>
                  <div className="cm-input-group">
                    <label>Fetch Start</label>
                    <input type="date" disabled={!isEditingConfig} value={semConfig.start} onChange={e => setSemConfig({ ...semConfig, start: e.target.value })} />
                  </div>
                  <div className="cm-input-group">
                    <label>Fetch End</label>
                    <input type="date" disabled={!isEditingConfig} value={semConfig.end} onChange={e => setSemConfig({ ...semConfig, end: e.target.value })} />
                  </div>
                </div>
                {isEditingConfig && (
                  <div className="cm-config-footer">
                    <button className="btn-save-settings" onClick={saveSettingsToFirebase}>
                      <RiSave3Line /> Save & Lock Range
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. FULL-WIDTH EVENT GRID MODULE */}
            <div className="calendar-editable-list settings-card">
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
                    <div className="events-cell hd">Events</div>
                  </div>
                  <div className="calendar-tbody">
                    {Object.keys(groupedByDate).sort().map((dateStr) => {
                      const [year, month, day] = dateStr.split('-');
                      const displayDate = `${day}/${month}/${year}`;

                      return (
                        <div key={dateStr} className="calendar-tr">
                          <div className="date-cell">
                            {displayDate}
                          </div>
                          <div className="day-cell">
                            {new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'short' })}
                          </div>
                          <div className="events-cell">
                            <div className="events-list-vertical">
                              {groupedByDate[dateStr].map((event, i) => (
                                <div key={i} className="event-item-pill">
                                  <strong>{event.title}</strong>
                                  <span>{event.fullTime}</span>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarManager;

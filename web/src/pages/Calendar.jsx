import React, { useState, useEffect, forwardRef } from "react";
import LiveCalendarEmbed from "../components/LiveCalendarEmbed";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { RiCalendarEventLine } from 'react-icons/ri';

const CustomCalendarButton = forwardRef(({ onClick }, ref) => (
  <button className="calendar-trigger-btn" onClick={onClick} ref={ref} type="button">
    <RiCalendarEventLine size={20} />
  </button>
));

function CalendarPage({ globalData, userProfile, activeProfile }) {
  // 1. Instantly use data from props
  const allCalendar = globalData?.allCalendar || []; 
  const isSyncing = globalData?.isSyncing;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [eventResults, setEventResults] = useState([]); 
  const [viewDate, setViewDate] = useState(new Date()); 

  const toLocalISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseAsLocal = (dateStr) => {
    if (!dateStr) return new Date();
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [y, m, d] = cleanDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  // 2. React to prop changes instantly
  useEffect(() => {
    const dateStr = toLocalISO(selectedDate);
    setEventResults(allCalendar.filter(e => e.date === dateStr));
  }, [selectedDate, allCalendar]);

  const currentMonthEvents = allCalendar.filter(item => {
    const d = parseAsLocal(item.date);
    return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
  });

  const groupedEvents = currentMonthEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="calendar-view">
      <div className="calendar-container">
        <header className="page-header">
          <h1 className="page-title">Academic Calendar</h1>
          {activeProfile?.batch !== userProfile?.batch && (
            <div className="preview-indicator-chip" style={{ background: '#3b82f6', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', display: 'inline-block', marginBottom: '10px' }}>
              Previewing Batch: <strong>{activeProfile?.batch}</strong>
            </div>
          )}
          <p className="page-subtitle">Academic Events for {activeProfile?.batch}</p>
        </header>

                <section className="calendar-checker-grid">
          {/* Left Card: Select Date */}
          <div className="checker-card select-date-card">
            <label className="input-label">VIEW BY DATE</label>
            <div className="checker-controls-pill">
              <div className="date-display-pill">
                {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })}
              </div>
              <div className="picker-container">
                <DatePicker 
                  selected={selectedDate} 
                  onChange={(date) => setSelectedDate(date)} 
                  customInput={<CustomCalendarButton />} 
                  popperPlacement="bottom-end" 
                />
              </div>
            </div>
          </div>

          {/* Right Card: Academic Events */}
          <div className="checker-card event-results-card">
            <label className="input-label">TODAYS EVENT</label>
            <div className="result-text-stack">
              {eventResults.length > 0 ? eventResults.map((ev, i) => (
                <div key={i} className="checker-event-item">
                  <div className="event-indicator-line"></div>
                  <div className="event-details">
                    <div className="event-title-text">{ev.title}</div>
                    <div className="event-time-text">{ev.fullTime}</div>
                  </div>
                </div>
              )) : <div className="no-event-text">No academic event scheduled.</div>}
            </div>
          </div>
        </section>

        <section className="grid-view-section">
          <h3 className="section-heading">Monthly Grid View</h3>
          <nav className="table-navigation">
            <button className="nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>Prev</button>
            <h4 className="current-month-display">{viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h4>
            <button className="nav-btn" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>Next</button>
          </nav>

          <div className="table-wrapper">
            {isSyncing && allCalendar.length === 0 ? (
                <div className="loading-shimmer">Synchronizing live calendar...</div>
            ) : (
                <table className="calendar-table compact-stack">
                    <thead><tr><th style={{ width: '80px' }}>Date</th><th>Events & Timing</th></tr></thead>
                    <tbody>
                        {sortedDates.length > 0 ? sortedDates.map((dateStr) => {
                            const [y, m, d] = dateStr.split('-');
                            const displayDate = `${d}/${m}/${y}`;
                            const dayName = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
                            return (
                              <tr key={dateStr} className={dateStr === toLocalISO(new Date()) ? "row-today" : ""}>
                                <td className="cell-date-stack">
                                  <div className="day-label">{dayName}</div>
                                  <div className="date-label">{displayDate}</div>
                                </td>
                                <td className="cell-event-stack">
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {groupedEvents[dateStr].map((item, idx) => (
                                      <div key={idx} className="event-info-group">
                                        <span className="event-title">{item.title}</span>
                                        <span className="event-time">{item.fullTime}</span>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                        }) : <tr className="empty-row"><td colSpan="2">No academic events for {activeProfile?.batch} this month.</td></tr>}
                    </tbody>
                </table>
            )}
          </div>
        </section>

        <section className="live-feed-section">
          <h3 className="section-heading">Live Calendar Feed</h3>
          <LiveCalendarEmbed />
        </section>

        <section className="download-section">
          <h3 className="section-heading">Official Documents</h3>
          <p className="download-text">Download the official academic calendar PDF for offline use.</p>
          <a href="/pdfs/academic-calendar.pdf" target="_blank" rel="noopener noreferrer" className="download-btn">Download PDF</a>
        </section>
      </div>
    </div>
  );
}

export default CalendarPage;
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarEventLine,
  RiFileList2Line,
  RiDownloadLine,
  RiInformationLine
} from 'react-icons/ri';
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import "../App.css";
import "../styles/calendar-desktop.css";

/**
 * Calendar Component - Android Parity Version
 * 
 * Logic Parity:
 * - Greedy Slot Allocation for multi-day events
 * - Sunday-start month grid logic
 * - Section-specific event merging
 * - Standard indicator styles (Holiday, Exam, Special, Bar)
 * 
 * UI Parity:
 * - Centered month navigation
 * - Card-style sliding Agenda (Shutter)
 * - Chronological Schedule View
 * - Sequoia Pro Aesthetics
 */

// --- CONSTANTS ---
const HOLIDAY_COLOR = "#9C27B0"; // Samsung Deep Purple
const EXAM_COLOR = "#66BB6A"; // Samsung Green
const SPECIAL_COLOR = "#FFCA28"; // Special Yellow
const ORDER_COLOR = "#00BCD4"; // Cyan for Working Day Order
const BAR_DEFAULT_COLOR = "#42A5F5"; // Samsung Blue
const SUNDAY_RED = "#EF5350"; // Samsung Red

const EVENT_POSITION = {
  SINGLE: 'Single',
  START: 'Start',
  MIDDLE: 'Middle',
  END: 'End'
};

const CalendarPage = ({ globalData, userProfile, activeProfile }) => {
  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month' or 'schedule'
  const [officialDocUrl, setOfficialDocUrl] = useState("/pdfs/academic-calendar.pdf");
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);

  // --- DATA ---
  const allEvents = useMemo(() => {
    const events = globalData?.allCalendar || [];
    // Include all events including "Order" overrides as they are part of the academic flow
    return [...events].sort((a, b) => a.date.localeCompare(b.date));
  }, [globalData]);

  // --- FIREBASE SYNC ---
  useEffect(() => {
    const unsub = onValue(ref(db, 'official_docs/academic_calendar'), (snapshot) => {
      const data = snapshot.val();
      if (data) setOfficialDocUrl(data.originalUrl || data.url || "/pdfs/academic-calendar.pdf");
    });
    return () => unsub();
  }, []);

  // --- HELPERS ---
  const toISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getMonthDays = useCallback((viewDate) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = firstDay.getDay();
    const startDate = new Date(year, month, 1 - startOffset);

    const days = [];
    let curr = new Date(startDate);
    const totalSlots = (lastDay.getDate() + startOffset) > 35 ? 42 : 35;

    for (let i = 0; i < totalSlots; i++) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return days;
  }, []);

  // --- GREEDY ALLOCATION LOGIC ---
  const eventIndicators = useMemo(() => {
    const indicatorMap = {};
    const expandedEvents = [];
    allEvents.forEach(event => {
      const start = new Date(event.date);
      const end = event.endDate ? new Date(event.endDate) : start;
      const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        expandedEvents.push({ date: toISO(d), event, index: i, total: diffDays });
      }
    });

    // --- CONSECUTIVE GROUPING (Android Parity) ---
    const consecutiveGroups = [];
    const eventsByTitle = {};

    // Sort all events by date first
    const sortedAll = [...allEvents].sort((a, b) => a.date.localeCompare(b.date));

    sortedAll.forEach(e => {
      const title = e.title;
      if (!eventsByTitle[title]) eventsByTitle[title] = [];
      eventsByTitle[title].push(e);
    });

    Object.keys(eventsByTitle).forEach(title => {
      const titleEvents = eventsByTitle[title];
      let currentGroup = [];

      titleEvents.forEach((e, idx) => {
        if (currentGroup.length === 0) {
          currentGroup.push(e);
        } else {
          const lastEvent = currentGroup[currentGroup.length - 1];
          const lastDate = new Date(lastEvent.date);
          const currDate = new Date(e.date);
          const diff = (currDate - lastDate) / (1000 * 60 * 60 * 24);

          // If consecutive or overlapping, add to group
          if (diff <= 1) {
            currentGroup.push(e);
          } else {
            consecutiveGroups.push(currentGroup);
            currentGroup = [e];
          }
        }
      });
      if (currentGroup.length > 0) consecutiveGroups.push(currentGroup);
    });

    // Transform groups into allocatable entities
    const allocGroups = consecutiveGroups.map((group, idx) => {
      const start = new Date(group[0].date);
      const endStr = group[group.length - 1].endDate || group[group.length - 1].date;
      const end = new Date(endStr);
      const duration = Math.floor((end - start) / 86400000) + 1;

      return {
        id: `group-${idx}-${group[0].title}`,
        title: group[0].title,
        start,
        end,
        duration,
        events: group
      };
    });

    allocGroups.sort((a, b) => (b.duration - a.duration) || a.start - b.start);

    const laneAssignments = {};
    const occupied = {};

    allocGroups.forEach(group => {
      let lane = 0;
      while (lane < 4) {
        let available = true;
        for (let i = 0; i < group.duration; i++) {
          const d = new Date(group.start);
          d.setDate(d.getDate() + i);
          const ds = toISO(d);
          if (occupied[ds]?.has(lane)) {
            available = false;
            break;
          }
        }
        if (available) {
          laneAssignments[group.id] = lane;
          for (let i = 0; i < group.duration; i++) {
            const d = new Date(group.start);
            d.setDate(d.getDate() + i);
            const ds = toISO(d);
            if (!occupied[ds]) occupied[ds] = new Set();
            occupied[ds].add(lane);
          }
          break;
        }
        lane++;
      }
    });

    // Expand groups into a daily map for rendering
    allocGroups.forEach(group => {
      const lane = laneAssignments[group.id];
      if (lane === undefined || lane >= 4) return;

      for (let i = 0; i < group.duration; i++) {
        const d = new Date(group.start);
        d.setDate(d.getDate() + i);
        const ds = toISO(d);

        if (!indicatorMap[ds]) indicatorMap[ds] = Array(4).fill(null);

        let pos = EVENT_POSITION.SINGLE;
        if (group.duration > 1) {
          if (i === 0) pos = EVENT_POSITION.START;
          else if (i === group.duration - 1) pos = EVENT_POSITION.END;
          else pos = EVENT_POSITION.MIDDLE;
        }

        const title = group.title.toLowerCase();
        let color = BAR_DEFAULT_COLOR;
        if (title.includes("holiday")) color = HOLIDAY_COLOR;
        else if (title.includes("exam") || title.includes("test") || title.includes("sia") || title.includes("fia")) color = EXAM_COLOR;
        else if (title.includes("order")) color = ORDER_COLOR;
        else if (group.events[0].type === "FullDay" || group.events[0].isSection) color = SPECIAL_COLOR;

        indicatorMap[ds][lane] = {
          color,
          position: pos,
          title: group.title,
          isSection: group.events[0].isSection
        };
      }
    });
    return indicatorMap;
  }, [allEvents]);

  // --- RENDER: EVENT COLOR HELPER ---
  const getEventColor = (title) => {
    const t = title.toLowerCase();
    if (t.includes('holiday')) return HOLIDAY_COLOR;
    if (t.includes('exam') || t.includes('test') || t.includes('sia') || t.includes('fia')) return EXAM_COLOR;
    if (t.includes('order')) return ORDER_COLOR;
    return BAR_DEFAULT_COLOR;
  };

  const getColorCategory = (title) => {
    const t = title.toLowerCase();
    if (t.includes('holiday')) return 'holiday';
    if (t.includes('order')) return 'order';
    return 'default';
  };

  // --- RENDER: MONTH GRID ---
  const renderMonthView = () => {
    const days = getMonthDays(currentMonth);
    const rows = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

    return (
      <div className="cal-grid">
        <div className="cal-weekdays">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className={`cal-weekday ${i === 0 ? 'sun' : ''}`}>{d}</div>
          ))}
        </div>
        <div className="cal-weeks">
          {rows.map((row, ri) => (
            <div key={ri} className="cal-week-row">
              {row.map((day, di) => {
                const ds = toISO(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isSelected = toISO(selectedDate) === ds;
                const isToday = toISO(new Date()) === ds;
                const indicators = eventIndicators[ds] || [];

                return (
                  <div
                    key={di}
                    className={`cal-day ${isCurrentMonth ? '' : 'faded'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDate(day);
                      if (!isCurrentMonth) {
                        setCurrentMonth(new Date(day.getFullYear(), day.getMonth(), 1));
                      }
                      if (window.innerWidth < 1024) setIsAgendaOpen(true);
                    }}
                  >
                    <div className={`cal-day-num ${isToday ? 'today' : ''}`}>
                      {day.getDate()}
                    </div>
                    <div className="cal-events">
                      {indicators.map((ind, ii) => (
                        <div
                          key={ii}
                          className={`cal-event-bar ${ind ? ind.position.toLowerCase() : 'spacer'}`}
                          style={ind ? { backgroundColor: ind.color } : {}}
                          data-color={ind?.color === SPECIAL_COLOR ? 'special' : getColorCategory(ind?.title || '')}
                        >
                          {ind && (ind.position === EVENT_POSITION.START || ind.position === EVENT_POSITION.SINGLE) && (
                            <span className="cal-event-label">{ind.title}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- RENDER: SCHEDULE VIEW ---
  const renderScheduleView = () => {
    const monthEvents = allEvents.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    });
    const grouped = monthEvents.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
    const sortedDates = Object.keys(grouped).sort();

    return (
      <div className="cal-schedule">
        {sortedDates.length > 0 ? sortedDates.map(dateStr => {
          const d = new Date(dateStr);
          const dayEvents = grouped[dateStr];
          return (
            <div key={dateStr} className="cal-sched-group">
              <div className="cal-sched-date">
                <div className={`cal-sched-num ${toISO(new Date()) === dateStr ? 'today' : ''}`}>
                  {d.getDate()}
                </div>
                <div>
                  <div className="cal-sched-day">{d.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                  <div className="cal-sched-monthyr">{d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                </div>
              </div>
              <div className="cal-sched-events">
                {dayEvents.map((e, i) => (
                  <div key={i} className="cal-sched-item">
                    <div className="cal-sched-strip" style={{ backgroundColor: getEventColor(e.title) }}></div>
                    <div>
                      <div className="cal-sched-title">{e.title}</div>
                      <div className="cal-sched-time">{e.fullTime || "Full Day"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }) : (
          <div className="cal-empty-state">
            <RiInformationLine />
            <p>No events scheduled for this month.</p>
          </div>
        )}
      </div>
    );
  };

  // --- RENDER: AGENDA CONTENT (shared between sidebar & shutter) ---
  const renderAgendaContent = () => {
    const todaysEvents = allEvents.filter(e => e.date === toISO(selectedDate));
    return (
      <div className="cal-agenda-list">
        {todaysEvents.length > 0 ? todaysEvents.map((e, i) => (
          <div key={i} className="cal-agenda-card">
            <div className="cal-agenda-dot" style={{ backgroundColor: getEventColor(e.title) }}></div>
            <div>
              <div className="cal-agenda-title">{e.title}</div>
              <div className="cal-agenda-time">{e.fullTime || "All Day Event"}</div>
            </div>
          </div>
        )) : (
          <div className="cal-empty-state">
            <RiInformationLine />
            <p>No events scheduled for this day.</p>
          </div>
        )}
      </div>
    );
  };

  const handleMonthChange = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  // --- MAIN RETURN ---
  return (
    <div className="cal-page">
      {/* ─── Toolbar ─── */}
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <h1>Calendar</h1>
          <span className="cal-batch-label">
            {activeProfile?.batch || "2023-2027"}
          </span>
        </div>

        <div className="cal-toolbar-center">
          <button className="cal-nav-btn" onClick={() => handleMonthChange(-1)}>
            <RiArrowLeftSLine />
          </button>
          <span className="cal-month-label">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button className="cal-nav-btn" onClick={() => handleMonthChange(1)}>
            <RiArrowRightSLine />
          </button>
          <button className="cal-today-btn" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>
            Today
          </button>
        </div>

        <div className="cal-toolbar-right">
          <div className="cal-view-toggle">
            <button className={viewType === 'month' ? 'active' : ''} onClick={() => setViewType('month')}>
              <RiCalendarEventLine /> Month
            </button>
            <button className={viewType === 'schedule' ? 'active' : ''} onClick={() => setViewType('schedule')}>
              <RiFileList2Line /> Schedule
            </button>
          </div>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="cal-body">
        <div className="cal-main">
          {viewType === 'month' ? renderMonthView() : renderScheduleView()}
        </div>

        {/* Desktop Sidebar — only in month view */}
        {viewType === 'month' && (
          <div className="cal-sidebar cal-desktop-only">
            <div className="cal-sidebar-inner">
              <div className="cal-agenda-header">
                <h3>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'short' })},{' '}
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </h3>
                {toISO(new Date()) === toISO(selectedDate) && (
                  <span className="cal-today-badge">TODAY</span>
                )}
              </div>
              {renderAgendaContent()}
              <a href={officialDocUrl} target="_blank" rel="noopener noreferrer" className="cal-doc-btn">
                <RiDownloadLine /> Official Document
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ─── Mobile Shutter ─── */}
      <div className={`cal-mobile-shutter cal-mobile-only ${isAgendaOpen ? 'open' : ''}`}>
        <div className="cal-shutter-handle" onClick={() => setIsAgendaOpen(false)}></div>
        <div className="cal-shutter-body">
          <div className="cal-shutter-header">
            <div>
              <h2>{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</h2>
              <p>{selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <a href={officialDocUrl} target="_blank" rel="noopener noreferrer" className="cal-doc-btn-round">
              <RiDownloadLine />
            </a>
          </div>
          {renderAgendaContent()}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
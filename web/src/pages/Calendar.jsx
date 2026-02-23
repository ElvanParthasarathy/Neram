import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCalendarEventLine,
  RiFileList2Line,
  RiDownloadLine,
  RiInformationLine,
  RiRefreshLine,
  RiEmotionHappyLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiFilePdfLine
} from 'react-icons/ri';
import { MdCalendarViewMonth, MdViewAgenda, MdCalendarToday } from "react-icons/md";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import "../App.css";
import "../styles/calendar-desktop.css";
import "../styles/mobile-calendar.css";

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

// Mobile Specific Colors (Matching Kotlin)
const MOB_RED = "#EF5350";
const MOB_GREEN = "#66BB6A";
const MOB_BLUE = "#42A5F5";
const MOB_PURPLE = "#9C27B0";
const MOB_YELLOW = "#FFCA28";
const MOB_CYAN = "#00BCD4";

const EVENT_POSITION = {
  SINGLE: 'Single',
  START: 'Start',
  MIDDLE: 'Middle',
  END: 'End'
};

// --- DATA LOGIC: SHARED ---
const useCalendarData = (globalData, selectedDate, currentMonth) => {
  const allEvents = useMemo(() => {
    const events = globalData?.allCalendar || [];
    return [...events].sort((a, b) => a.date.localeCompare(b.date));
  }, [globalData]);

  const toISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // --- GREEDY ALLOCATION LOGIC ---
  const eventIndicators = useMemo(() => {
    const indicatorMap = {};
    const expandedEvents = [];

    // 1. Expand events into daily entries
    allEvents.forEach(event => {
      const start = new Date(event.date);
      const end = event.endDate ? new Date(event.endDate) : start;
      const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

      // Filter out 'order' unless it's a working day order (matches Kotlin logic)
      const title = event.title.toLowerCase();
      const isWorkingDayOrder = title.includes("working day") && title.includes("order");
      if (title.includes("order") && !isWorkingDayOrder) return;

      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        expandedEvents.push({ date: toISO(d), event, index: i, total: diffDays });
      }
    });

    // 2. Group Consecutive Events
    const consecutiveGroups = [];
    const eventsByTitle = {};
    const sortedAll = [...allEvents].sort((a, b) => a.date.localeCompare(b.date));

    sortedAll.forEach(e => {
      const title = e.title;
      if (!eventsByTitle[title]) eventsByTitle[title] = [];
      eventsByTitle[title].push(e);
    });

    Object.keys(eventsByTitle).forEach(title => {
      const titleEvents = eventsByTitle[title];
      let currentGroup = [];

      titleEvents.forEach((e) => {
        if (currentGroup.length === 0) {
          currentGroup.push(e);
        } else {
          const lastEvent = currentGroup[currentGroup.length - 1];
          const lastDate = new Date(lastEvent.date);
          const currDate = new Date(e.date);
          const diff = (currDate - lastDate) / (1000 * 60 * 60 * 24);

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

    // 3. Transform groups into allocatable entities
    const allocGroups = consecutiveGroups.map((group, idx) => {
      const firstEvent = group[0];
      const start = new Date(firstEvent.date);
      // Logic for end date of group needed adjustment? 
      // Simplified: Find min start and max end of all events in group if needed, 
      // but consecutive logic implies linear sequence.
      // Actually Kotlin logic builds groups differently. 
      // Let's stick to the current Desktop Logic which works well, 
      // but ensure we map colors correctly for Mobile.

      // Recalculating duration based on group start/end
      const lastEvent = group[group.length - 1];
      const endStr = lastEvent.endDate || lastEvent.date;
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
      while (lane < 4) { // Max 4 lanes
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

  return { allEvents, eventIndicators, toISO };
};


// ==========================================
// MOBILE COMPONENT
// ==========================================
// --- INFINITE PAGER COMPONENT ---
const InfinitePager = ({ pageKey, onChange, renderItem }) => {
  const x = useMotionValue(0);
  const containerRef = useRef(null);
  const isInternal = useRef(false);
  const prevKey = useRef(pageKey);

  // Handle External Updates
  useEffect(() => {
    if (prevKey.current !== pageKey) {
      if (isInternal.current) {
        // Reset flag, already at correct visual state (handled by drag completion)
        isInternal.current = false;
      } else {
        // External Trigger -> Animate!
        // Determine direction (heuristic: comparison if possible, or just default?)
        // For dates, we can compare strings or rely on parent passing hint?
        // Simple string comparison for ISO dates works for direction often, but not always reliable.
        // However, for "Film Roll", we just want a slide.
        // Let's assume forward/backward based on comparison.
        const width = containerRef.current?.offsetWidth || 300;
        let direction = 1;
        if (pageKey < prevKey.current) direction = -1; // New < Old -> Left (Prev)

        // If Next (direction 1): We want to slide IN from Right. So initially item is at Right.
        // Wait.
        // Render: [-1 (Prev), 0 (Curr), 1 (Next)]
        // Pager Logic:
        // If I drag LEFT (offset < 0), I see Next.
        // Validation: 0 becomes -1. Next becomes 0.

        // Animation Logic:
        // We are now at New State (0).
        // If we came from "Prev" (New > Old, e.g. Feb > Jan):
        // We want to look like we swiped Left (Movement from Right to Left? No, View moves Right)
        // "Next" comes from Right.
        // So we start with View viewing "Prev" (x = width).
        x.set(width);
        animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
        // If I am at Feb. I want to animate entry from Jan.
        // Jan is "Prev" (-1).
        // So I position viewer at `-1` (x = +width) and slide to 0.

        if (pageKey > prevKey.current) {
          // Key Increased (Next Month/Day).
          // Simulate Swipe Left (Movement from Right to Left? No, View moves Right)
          // "Next" comes from Right.
          // So we start with View viewing "Prev" (x = width).
          x.set(width);
          animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
        } else {
          // Key Decreased (Prev Month/Day).
          // Simulate Swipe Right. "Prev" comes from Left.
          // Start with View viewing "Next" (x = -width) relative to new center?
          x.set(-width);
          animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
        }
      }
      prevKey.current = pageKey;
    }
  }, [pageKey, x]);

  const handleDragEnd = (_, { offset, velocity }) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    const width = containerRef.current?.offsetWidth || 300;
    const threshold = width * 0.25;

    if (offset.x < -threshold || swipe < -10000) {
      // Next
      animate(x, -width, {
        type: "spring", stiffness: 300, damping: 30, onComplete: () => {
          isInternal.current = true;
          onChange(1);
          x.set(0);
        }
      });
    } else if (offset.x > threshold || swipe > 10000) {
      // Prev
      animate(x, width, {
        type: "spring", stiffness: 300, damping: 30, onComplete: () => {
          isInternal.current = true;
          onChange(-1);
          x.set(0);
        }
      });
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 40 });
    }
  };

  return (
    <div className="infinite-pager-wrapper" ref={containerRef} style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
      <motion.div
        className="infinite-pager-track"
        style={{ x, display: 'flex', width: '100%', marginLeft: '-100%', touchAction: 'pan-y' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
      >
        {[-1, 0, 1].map(offset => (
          <div key={offset} className="infinite-pager-item" style={{ minWidth: '100%', width: '100%', flexShrink: 0, padding: '0 10px', boxSizing: 'border-box' }}>
            {renderItem(offset)}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// ==========================================
// MOBILE COMPONENTS (NEW)
// ==========================================

/* --- MOBILE COMPONENTS (NEW) --- */
const MobileOfficialDocs = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("https://raw.githubusercontent.com/ElvanParthasarathy/RmdNeramPublic/main/Pdfs/academic-calendar.pdf");

  useEffect(() => {
    try {
      // Reusing logic (or new listener) - keeping simple fetch
      const dbRef = ref(db, 'official_docs/academic_calendar');
      onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data && (data.url || data.originalUrl)) {
          setPdfUrl(data.url || data.originalUrl);
        }
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="cal-mob-docs-container">
      <div className="cal-mob-docs-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="cal-mob-docs-title">Official Documents</span>
        {isExpanded ? <RiArrowUpSLine size={20} /> : <RiArrowDownSLine size={20} />}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="cal-mob-docs-content"
          >
            <div className="cal-mob-docs-item" onClick={() => window.open(pdfUrl, '_blank')}>
              <div className="cal-mob-docs-icon-box">
                <RiFilePdfLine size={20} color="#EF5350" />
              </div>
              <div className="cal-mob-docs-info">
                <span className="cal-mob-docs-name">Academic Calendar</span>
                <span className="cal-mob-docs-desc">Download PDF for offline use</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getEventObjColor = (event) => {
  const title = (event.title || "").toLowerCase();
  if (title.includes("holiday")) return HOLIDAY_COLOR;
  if (title.includes("exam") || title.includes("test") || title.includes("sia") || title.includes("fia")) return EXAM_COLOR;
  if (title.includes("order")) return ORDER_COLOR;
  if (event.type === "FullDay" || event.isSection) return SPECIAL_COLOR;
  return BAR_DEFAULT_COLOR;
};

/* --- MOBILE COMPONENTS (NEW) --- */

const MobileScheduleView = ({ allEvents, currentMonth, onEventClick, onMonthChange }) => {
  const [direction, setDirection] = useState(0);

  const grouped = useMemo(() => {
    // FILTER: Only show events for the current month
    const monthEvents = allEvents.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
    });

    const groups = {};
    monthEvents.forEach(e => {
      if (!groups[e.date]) groups[e.date] = [];
      groups[e.date].push(e);
    });
    return Object.keys(groups).sort().map(date => ({
      date,
      events: groups[date]
    }));
  }, [allEvents, currentMonth]);

  const handleNav = (dir) => {
    setDirection(dir);
    onMonthChange(dir);
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <div className="cal-mob-schedule-list" style={{ padding: 0, overflowX: 'hidden' }}>
      {/* Month Navigation Header */}
      <div className="cal-mob-sched-nav-header">
        <div className="cal-mob-sched-title-text">
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div className="cal-mob-sched-nav-actions">
          <button className="cal-mob-sched-nav-btn" onClick={() => handleNav(-1)}>
            <RiArrowLeftSLine />
          </button>
          <button className="cal-mob-sched-nav-btn" onClick={() => handleNav(1)}>
            <RiArrowRightSLine />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false} custom={direction} mode='popLayout'>
        <motion.div
          key={currentMonth.toISOString()}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          style={{ width: '100%' }}
        >
          {/* Official Docs (Scrolls with list) */}
          <MobileOfficialDocs />

          {grouped.length === 0 ? (
            <div className="cal-mob-empty-state">No events found.</div>
          ) : (
            grouped.map(group => {
              const date = new Date(group.date);
              const isToday = group.date === new Date().toISOString().split('T')[0];

              return (
                <div key={group.date} className="cal-mob-sched-group">
                  {/* Sticky Header */}
                  <div className="cal-mob-sched-header">
                    <div className={`cal-mob-sched-date-badge ${isToday ? 'today' : ''}`}>
                      {date.getDate()}
                    </div>
                    <div className="cal-mob-sched-date-text">
                      <div className="cal-mob-sched-day">{date.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                      <div className="cal-mob-sched-month">{date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="cal-mob-sched-items">
                    {group.events.map((ev, i) => {
                      const derivedColor = getEventObjColor(ev);
                      return (
                        <div key={i} className="cal-mob-sched-card" onClick={() => onEventClick && onEventClick(ev)}>
                          <div className="cal-mob-sched-bar" style={{ backgroundColor: derivedColor }}></div>
                          <div className="cal-mob-sched-content">
                            <div className="cal-mob-sched-title">{ev.title}</div>
                            <div className="cal-mob-sched-time">{ev.fullTime}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// MOBILE CONTAINER
// ==========================================
const MobileCalendar = ({ globalData, userProfile, activeProfile }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewType, setViewType] = useState('month'); // 'month' | 'schedule'

  const { allEvents, eventIndicators, toISO } = useCalendarData(globalData, selectedDate, currentMonth);

  // --- TOP BAR EVENTS (From MobileNavbar) ---
  useEffect(() => {
    const handleToday = () => {
      const today = new Date();
      setSelectedDate(today);
      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
      setViewType('month');
    };

    const handleViewToggle = (e) => {
      if (e.detail) setViewType(e.detail);
    };

    window.addEventListener('neram-cal-today', handleToday);
    window.addEventListener('neram-cal-view', handleViewToggle);
    return () => {
      window.removeEventListener('neram-cal-today', handleToday);
      window.removeEventListener('neram-cal-view', handleViewToggle);
    };
  }, []);

  // --- HELPERS ---
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

  const handleMonthChange = (step) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + step, 1);
    setCurrentMonth(newMonth);
    // Sync: Wiping calendar wipes agenda -> Update selected date to 1st of new month
    setSelectedDate(new Date(newMonth));
  };

  const handleDayChange = (step) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + step);
    setSelectedDate(newDate);

    // Sync month if needed
    if (newDate.getMonth() !== currentMonth.getMonth()) {
      const newM = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
      setCurrentMonth(newM);
    }
  };

  const getEventObjColor = (e) => {
    const t = e.title.toLowerCase();
    if (t.includes('holiday')) return MOB_PURPLE;
    if (t.includes('exam') || t.includes('test') || t.includes('sia') || t.includes('fia')) return MOB_GREEN;
    if (t.includes('working day') && t.includes('order')) return MOB_CYAN;
    if (e.type === "FullDay" || e.type === "HalfDay" || e.isSection) return MOB_YELLOW;
    return MOB_BLUE;
  }

  // --- RENDERERS ---
  const renderGrid = (offset) => {
    const monthToView = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    const days = getMonthDays(monthToView);
    const rows = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));

    return (
      <div className="cal-mob-grid-month" style={{ width: '100%' }}>
        {rows.map((row, ri) => (
          <div key={ri} className="cal-mob-week-row">
            {row.map((day, di) => {
              const ds = toISO(day);
              const isCurrentMonth = day.getMonth() === monthToView.getMonth();
              const isSelected = toISO(selectedDate) === ds;
              const isToday = toISO(new Date()) === ds;
              const indicators = eventIndicators[ds] || [];

              return (
                <div key={di}
                  className={`cal-mob-day-cell ${!isCurrentMonth ? 'faded' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(day);
                    if (!isCurrentMonth) {
                      const newM = new Date(day.getFullYear(), day.getMonth(), 1);
                      setCurrentMonth(newM);
                    }
                  }}
                >
                  <div className={`cal-mob-day-content ${isToday ? 'today' : ''}`}>
                    {day.getDate()}
                  </div>
                  <div className="cal-mob-indicators">
                    {[0, 1, 2, 3].map((idx) => {
                      const ind = indicators[idx];
                      if (!ind) return <div key={idx} className="cal-mob-bar spacer" style={{ height: '3.5px' }}></div>;

                      let radiusClass = 'single';
                      if (ind.position === EVENT_POSITION.START) radiusClass = 'start';
                      if (ind.position === EVENT_POSITION.END) radiusClass = 'end';
                      if (ind.position === EVENT_POSITION.MIDDLE) radiusClass = 'middle';

                      return (
                        <div key={idx} className={`cal-mob-bar ${radiusClass}`}>
                          <div className="cal-mob-bar-inner" style={{ backgroundColor: ind.color }}></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderAgenda = (offset) => {
    const dateToView = new Date(selectedDate);
    dateToView.setDate(selectedDate.getDate() + offset);
    const ds = toISO(dateToView);
    const events = allEvents.filter(e => e.date === ds);

    return (
      <div className="cal-mob-agenda-list" style={{ width: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {events.length === 0 ? (
          <div className="cal-mob-empty-msg">No academic events scheduled.</div>
        ) : (
          events.map((ev, i) => {
            const color = getEventObjColor(ev);
            return (
              <div key={i} className="cal-mob-card" style={{
                backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                background: `${color}26`
              }}>
                <RiCalendarEventLine className="cal-mob-card-icon" style={{ color: color }} />
                <div className="cal-mob-card-content">
                  <div className="cal-mob-card-title">{ev.title}</div>
                  <div className="cal-mob-card-time">{ev.fullTime || "All Day"}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };



  return (
    <div className="cal-mob-container">
      {/* CONTENT AREA */}
      <div className="cal-mob-content-card">
        {viewType === 'schedule' ? (
          <MobileScheduleView
            allEvents={allEvents}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            onEventClick={(ev) => console.log("Event Click", ev)}
          />
        ) : (
          <>
            {/* STICKY HEADER WRAPPER */}
            <div className="cal-mob-sticky-header">
              {/* MONTH VIEW: GRID + AGENDA */}
              <div className="cal-mob-month-title">
                {currentMonth.getFullYear() === new Date().getFullYear()
                  ? currentMonth.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                  : currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()
                }
              </div>

              {/* Weekdays */}
              <div className="cal-mob-weekdays">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className={`cal-mob-weekday ${i === 0 ? 'sun' : ''}`}>{d}</div>
                ))}
              </div>

              <div className="cal-mob-grid">
                <InfinitePager
                  pageKey={currentMonth.toISOString()}
                  onChange={handleMonthChange}
                  renderItem={renderGrid}
                />
              </div>

              {/* Selected Date Header (Below Grid) */}
              <div className="cal-mob-header">
                <div className="cal-mob-date-display">
                  <span className="cal-mob-day-num">{selectedDate.getDate()}</span>
                  <span className="cal-mob-day-name">{selectedDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
                </div>
                <button className="cal-mob-refresh-btn" onClick={() => window.location.reload()}>
                  <RiEmotionHappyLine />
                </button>
              </div>
            </div>

            {/* Agenda Swiper */}
            <div className="cal-mob-agenda">
              <InfinitePager
                pageKey={selectedDate.toISOString()}
                onChange={handleDayChange}
                renderItem={renderAgenda}
              />
            </div>
          </>
        )}
      </div>
    </div >
  );
};


// ==========================================
// DESKTOP COMPONENT
// ==========================================
const DesktopCalendar = ({ globalData, userProfile, activeProfile }) => {
  // ... (Existing CalendarPage Logic)
  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [direction, setDirection] = useState(0);
  const [agendaDirection, setAgendaDirection] = useState(0);
  const [viewType, setViewType] = useState('month');
  const [officialDocUrl, setOfficialDocUrl] = useState("/pdfs/academic-calendar.pdf");
  const [isAgendaOpen, setIsAgendaOpen] = useState(false);

  const { allEvents, eventIndicators, toISO } = useCalendarData(globalData, selectedDate, currentMonth);

  // --- FIREBASE SYNC ---
  useEffect(() => {
    const unsub = onValue(ref(db, 'official_docs/academic_calendar'), (snapshot) => {
      const data = snapshot.val();
      if (data) setOfficialDocUrl(data.originalUrl || data.url || "/pdfs/academic-calendar.pdf");
    });
    return () => unsub();
  }, []);

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

  // --- RENDER HELPERS ---
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
                      const prevDate = new Date(selectedDate);
                      setAgendaDirection(day > prevDate ? 1 : -1);
                      setSelectedDate(day);
                      if (!isCurrentMonth) {
                        const dayMonth = new Date(day.getFullYear(), day.getMonth(), 1);
                        setDirection(dayMonth > currentMonth ? 1 : -1);
                        setCurrentMonth(dayMonth);
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

  const renderAgendaContent = () => {
    const todaysEvents = allEvents.filter(e => e.date === toISO(selectedDate));
    return (
      <AnimatePresence mode="popLayout" initial={false} custom={agendaDirection}>
        <motion.div
          key={selectedDate.toISOString()}
          custom={agendaDirection}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 400, damping: 35 },
            opacity: { duration: 0.2 }
          }}
          className="cal-agenda-list"
        >
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
        </motion.div>
      </AnimatePresence>
    );
  };

  const handleMonthChange = (step) => {
    setDirection(step);
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + step, 1));
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.98
    })
  };

  return (
    <div className="cal-page">
      {/* ─── Toolbar ─── */}
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <div className="cal-view-toggle">
            <button className={viewType === 'month' ? 'active' : ''} onClick={() => setViewType('month')}>
              Month
            </button>
            <button className={viewType === 'schedule' ? 'active' : ''} onClick={() => setViewType('schedule')}>
              Schedule
            </button>
          </div>
        </div>

        <div className="cal-toolbar-right">
          <div className="cal-month-nav">
            <button className="cal-nav-btn" onClick={() => handleMonthChange(-1)}>
              <RiArrowLeftSLine />
            </button>
            <span className="cal-month-label">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button className="cal-nav-btn" onClick={() => handleMonthChange(1)}>
              <RiArrowRightSLine />
            </button>
            <button className="cal-today-btn" onClick={() => {
              const today = new Date();
              const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              const cm = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

              if (today.getTime() !== selectedDate.getTime()) {
                setAgendaDirection(today > selectedDate ? 1 : -1);
              }

              if (todayMonth.getTime() !== cm.getTime()) {
                setDirection(todayMonth > cm ? 1 : -1);
                setCurrentMonth(todayMonth);
              }
              setSelectedDate(today);
            }}>
              Today
            </button>
          </div>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="cal-body">
        <div className={`cal-main ${viewType === 'month' ? 'hide-scrollbar' : ''}`}>
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={`${viewType}-${currentMonth.getTime()}`}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 400, damping: 35 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
              }}
              style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              {viewType === 'month' ? renderMonthView() : renderScheduleView()}
            </motion.div>
          </AnimatePresence>
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

// ==========================================
// MAIN PAGE WRAPPER
// ==========================================
const CalendarPage = ({ isMobile, globalData, userProfile, activeProfile }) => {
  if (isMobile) {
    return <MobileCalendar globalData={globalData} userProfile={userProfile} activeProfile={activeProfile} />;
  }
  return <DesktopCalendar globalData={globalData} userProfile={userProfile} activeProfile={activeProfile} />;
};

export default CalendarPage;
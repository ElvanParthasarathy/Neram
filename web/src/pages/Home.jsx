import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { db } from "../firebase";
import { ref, update, onValue } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  RiTrophyLine,
  RiTimeLine,
  RiFilePaperLine,
  RiInformationLine,
  RiEditLine,
  RiCalendarEventLine,
  RiUserVoiceLine
} from 'react-icons/ri';

const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CustomCalendarButton = forwardRef(({ onClick }, ref) => (
  <button className="round-calendar-btn" onClick={onClick} ref={ref} type="button">
    <RiCalendarEventLine />
  </button>
));

const Home = ({ isAdmin, globalData, userProfile, activeProfile }) => {
  // --- DESTRUCTURE CENTRALIZED DATA ---
  // Fix: Default to empty object if globalData is null to prevent crash
  const { masterData = {}, allCalendar = [], sectionUpdates = {}, isSyncing } = globalData || {};

  const [currentDate, setCurrentDate] = useState(new Date());

  // SCHEDULE STATE
  const [dayOrder, setDayOrder] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState("");

  // --- 1. SPLIT STATE (Prevents Race Conditions) ---
  const [globalEvents, setGlobalEvents] = useState([]);   // Events from Academic Calendar
  const [sectionEvents, setSectionEvents] = useState([]); // Events from Section Manager

  // --- 2. MERGE LOGIC (Combines them automatically) ---
  const todayEvents = useMemo(() => {
    const combined = [...globalEvents, ...sectionEvents];
    // Remove duplicates based on ID or Title
    return Array.from(new Map(combined.map(item => [item.id || item.title, item])).values());
  }, [globalEvents, sectionEvents]);

  const [activeExamPeriod, setActiveExamPeriod] = useState(null);
  const [activeExamToday, setActiveExamToday] = useState(null);

  // Editing States
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [tempGeneral, setTempGeneral] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [areEventsLoading, setAreEventsLoading] = useState(true);

  const formatDate = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = formatDate(currentDate);

  // --- Retrieve Note & Author ---
  // Fix: Use ?. to safely access nested properties
  const liveUpdateData = sectionUpdates?.live?.[todayStr] || {};
  const liveUpdateNote = liveUpdateData.note || "No special updates for today.";
  const liveUpdateAuthor = liveUpdateData.author || "";

  // --- Retrieve General & Author ---
  const generalData = sectionUpdates?.general || {};
  const generalText = generalData.text || "";
  const generalAuthor = generalData.author || "";

  const getSubjectName = (code) => masterData.courses?.find(c => c.code === code)?.name || "General Subject";

  // --- LOGIC RESOLUTION (Prop-Driven) ---
  useEffect(() => {
    if (!allCalendar || !masterData) return;

    // 1. Filter Calendar Events for the selected day
    const events = allCalendar.filter((e) => e.date === todayStr);
    setGlobalEvents(events); // <--- FIX 1: Use setGlobalEvents

    // 2. Resolve Exams
    const currentPeriod = masterData.exams?.find(ex => todayStr >= ex.startDate && todayStr <= ex.endDate);
    setActiveExamPeriod(currentPeriod || null);

    if (currentPeriod) {
      const subToday = currentPeriod.subjects?.find(s => s.date === todayStr);
      setActiveExamToday(subToday ? { ...currentPeriod, todaySub: subToday } : null);
    } else {
      setActiveExamToday(null);
    }

    // 3. Resolve Day Order & Status
    const weekdayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const holidayEvent = events.find(e => e.title.toLowerCase().includes("holiday"));
    const manualOrderEvent = events.find(e => e.title.toLowerCase().includes("order"));

    let resolvedOrder = "";
    let resolvedStatus = "";

    if (holidayEvent) {
      resolvedOrder = "";
      resolvedStatus = `Holiday: ${holidayEvent.title}`;
    } else if (manualOrderEvent) {
      const foundDay = ["Monday", ...daysOrder].find(day => manualOrderEvent.title.includes(day));
      if (foundDay) {
        resolvedOrder = foundDay;
        resolvedStatus = `Following ${foundDay} Order`;
      } else {
        resolvedOrder = weekdayName === "Sunday" ? "" : weekdayName;
        resolvedStatus = `Regular ${resolvedOrder}`;
      }
    } else {
      if (weekdayName === "Sunday") {
        resolvedOrder = "";
        resolvedStatus = "Sunday (Holiday)";
      } else {
        resolvedOrder = weekdayName;
        resolvedStatus = `Regular ${weekdayName}`;
      }
    }

    setDayOrder(resolvedOrder);
    setScheduleStatus(resolvedStatus);

  }, [currentDate, allCalendar, masterData, todayStr]);

  // --- NEW: FETCH SECTION-SPECIFIC EVENTS (With Anti-Flicker) ---
  useEffect(() => {
    // Only run if we have a valid section and date
    if (activeProfile?.section && todayStr) {
      setAreEventsLoading(true);

      const { batch, department, section } = activeProfile;
      const sectionEventsRef = ref(db, `events/${batch}/${department}/${section}`);

      const unsub = onValue(sectionEventsRef, (snap) => {
        const data = snap.val() || [];
        const sectionEvents = Array.isArray(data) ? data : Object.values(data);

        // Filter for TODAY's events
        const todaysSpecialEvents = sectionEvents.filter(e => e.date === todayStr);

        setSectionEvents(todaysSpecialEvents); // <--- FIX 2: Use setSectionEvents (Simple Set)
        setAreEventsLoading(false);
      });

      return () => unsub();
    } else {
      setSectionEvents([]); // Clear section events if not applicable
      setAreEventsLoading(false);
    }
  }, [activeProfile, todayStr]);

  // --- DETECT SPECIAL EVENTS ---
  const fullDayEvent = todayEvents.find(e => e.type === "FullDay");
  const halfDayEvent = todayEvents.find(e => e.type === "HalfDay");

  // --- DATABASE UPDATE ACTIONS ---
  const handleSaveNote = async () => {
    if (!activeProfile) return;
    const { batch, department, section } = activeProfile;
    setIsSaving(true);
    try {
      await update(ref(db, `updates/${batch}/${department}/${section}/live_daily/${todayStr}`), {
        note: tempNote,
        author: userProfile?.displayName || "Admin"
      });
      setIsEditingNote(false);
    } catch (error) { console.error(error); }
    finally { setIsSaving(false); }
  };

  const handleSaveGeneral = async () => {
    if (!activeProfile) return;
    const { batch, department, section } = activeProfile;
    setIsSaving(true);
    try {
      await update(ref(db, `updates/${batch}/${department}/${section}`), {
        general_text: tempGeneral,
        general_author: userProfile?.displayName || "Admin"
      });
      setIsEditingGeneral(false);
    } catch (error) { console.error(error); }
    finally { setIsSaving(false); }
  };

  // --- UPDATED: SMART COURSE RESOLVER ---
  const getPeriodDetails = (cellContent) => {
    if (!cellContent || !masterData.courses) return { name: cellContent, faculty: "", code: cellContent };

    if (cellContent.includes("/")) {
      const parts = cellContent.split("/");

      const results = parts.map(part => {
        const trimmedPart = part.trim();
        const pureCode = trimmedPart.split(" ")[0];
        const course = masterData.courses.find(c => c.code === pureCode);

        return course
          ? { name: course.name, faculty: course.faculty }
          : { name: trimmedPart, faculty: "" };
      });

      return {
        name: results.map(r => r.name).join(" / "),
        faculty: results.map(r => r.faculty).join(" / "),
        code: cellContent
      };
    }

    const pureCode = cellContent.split(" ")[0].trim();
    const course = masterData.courses.find((c) => c.code === pureCode);
    return course
      ? { ...course, code: cellContent }
      : { name: cellContent, faculty: "", code: cellContent };
  };

  return (
    <div className="home-view">
      <div className="home-container">

        <header className="page-header">
          <div className="header-main">
            <h1 className="page-title">Home Dashboard</h1>
            {isAdmin && activeProfile?.section === userProfile?.section && (
              <span className="admin-status-badge">Admin Mode</span>
            )}
          </div>

          {activeProfile?.section !== userProfile?.section && (
            <div className="global-preview-tag animate-slide-down">
              <RiInformationLine />
              <span>Viewing Preview: <strong>{activeProfile?.department}-{activeProfile?.section}</strong></span>
            </div>
          )}
        </header>

        <section className="date-section">
          <label className="input-label">Select date</label>
          <div className="date-input-group">
            <input
              type="text"
              className="date-display"
              readOnly
              value={currentDate.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
            />
            <div className="date-picker-trigger">
              <DatePicker selected={currentDate} onChange={(date) => setCurrentDate(date)} customInput={<CustomCalendarButton />} popperPlacement="bottom-end" />
            </div>
          </div>
        </section>

        {/* Academic Calendar Section */}
        <section className="calendar-section">
          <h2 className="section-title">Academic Calendar</h2>
          <div className="calendar-content">
            {todayEvents.length > 0 ? todayEvents.map((ev, i) => (
              <div key={i} className="home-event-pill">
                <div className="event-indicator"></div>
                <div className="event-info">
                  <p className="calendar-text"><strong>{ev.title}</strong></p>
                  <p className="calendar-subtext">{ev.fullTime}</p>
                </div>
              </div>
            )) : <p className="calendar-text-empty">Regular Working Day</p>}
          </div>
        </section>

        {/* Dynamic Schedule Section */}
        <section className="timetable-section">
          <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Schedule</h2>
            <span className="status-badge-small">{scheduleStatus}</span>
          </div>

          {(isSyncing || areEventsLoading) ? <div className="loading-shimmer">Checking Schedule...</div> : (
            <>
              {/* --- 1. FULL DAY EVENT (Highest Priority) --- */}
              {fullDayEvent ? (
                <>
                  <div className="exam-mini-card major">
                    <div className="exam-tag">TODAY'S EVENT</div>
                    <div className="exam-content-flex">
                      <RiCalendarEventLine className="exam-icon-large" />
                      <div className="exam-info">
                        <h3>{fullDayEvent.title}</h3>
                        <p>{fullDayEvent.description || "Full Day Event"}</p>
                        <div className="exam-meta">
                          <span><RiTimeLine /> Full Day</span>
                          <span className="portion-tag"><RiInformationLine /> No Classes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="major-exam-notice">
                    <RiInformationLine />
                    <div>
                      <p className="notice-bold">Classes Suspended</p>
                      <p className="notice-sub">Day reserved for {fullDayEvent.title}.</p>
                    </div>
                  </div>
                </>
              ) : (
                /* --- 2. REGULAR / EXAM / HALF DAY VIEW --- */
                <>
                  {/* A. TODAY'S EXAM CARD */}
                  {activeExamToday && (
                    <div className={`exam-mini-card ${activeExamToday.type.includes('CT') ? 'cycle' : 'major'}`}>
                      <div className="exam-tag">TODAY'S EXAM</div>
                      <div className="exam-content-flex">
                        <RiTrophyLine className="exam-icon-large" />
                        <div className="exam-info">
                          <h3>{activeExamToday.title}</h3>
                          <p><strong>{activeExamToday.todaySub.code}</strong>: {getSubjectName(activeExamToday.todaySub.code)}</p>
                          <div className="exam-meta">
                            <span><RiTimeLine /> {activeExamToday.todaySub.startTime} - {activeExamToday.todaySub.endTime}</span>
                            <span className="portion-tag"><RiFilePaperLine /> {activeExamToday.todaySub.portion}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* B. HALF DAY EVENT CARD */}
                  {halfDayEvent && !activeExamToday && (
                    <div className="exam-mini-card cycle">
                      <div className="exam-tag">SPECIAL EVENT</div>
                      <div className="exam-content-flex">
                        <RiCalendarEventLine className="exam-icon-large" />
                        <div className="exam-info">
                          <h3>{halfDayEvent.title}</h3>
                          <p>{halfDayEvent.description || "Special Session"}</p>
                          <div className="exam-meta">
                            <span><RiTimeLine /> {halfDayEvent.startTime || "09:00"} - {halfDayEvent.endTime || "12:00"}</span>
                            <span className="portion-tag"><RiInformationLine /> Event</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* C. TIMETABLE vs MAJOR EXAM SUSPENSION */}
                  {(!activeExamPeriod || activeExamPeriod.type.includes('CT')) ? (
                    dayOrder && masterData.timetable?.[dayOrder] ? (
                      <div className="table-overflow">
                        <table className="schedule-table">
                          <thead><tr><th>#</th><th>Course Details</th><th>Faculty</th></tr></thead>
                          <tbody>
                            {masterData.timetable[dayOrder].map((code, index) => {
                              const { name, faculty } = getPeriodDetails(code);
                              return (
                                <tr key={index}>
                                  <td className="cell-hour">{index + 1}</td>
                                  <td className="cell-course">
                                    <div className="course-code">{code}</div>
                                    <div className="course-name">{name}</div>
                                  </td>
                                  <td className="cell-faculty">{faculty}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="no-classes-msg">
                        No classes scheduled.<br />
                        <span style={{ fontSize: '0.9em', opacity: 0.8 }}>({scheduleStatus})</span>
                      </div>
                    )
                  ) : (
                    <div className="major-exam-notice">
                      <RiInformationLine />
                      <div>
                        <p className="notice-bold">Classes Suspended</p>
                        <p className="notice-sub">Suspended for {activeExamPeriod.title}.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

        {/* Live Daily Update Section */}
        <section className="updates-live-section">
          <div className="section-header">
            <h2 className="section-title">Live Updates ({activeProfile?.section})</h2>
            {/* FIX 3: ADDED ADMIN CHECK HERE */}
            {isAdmin && !isEditingNote && (
              <button onClick={() => { setTempNote(liveUpdateNote); setIsEditingNote(true); }} className="edit-trigger">
                <RiEditLine /> Edit
              </button>
            )}
          </div>
          {isEditingNote ? (
            <div className="edit-form">
              <textarea className="edit-textarea" value={tempNote} onChange={(e) => setTempNote(e.target.value)} placeholder="Type update for today..." />
              <div className="form-buttons">
                <button onClick={handleSaveNote} disabled={isSaving} className="save-btn">
                  {isSaving ? "Saving..." : "Save Update"}
                </button>
                <button onClick={() => setIsEditingNote(false)} disabled={isSaving} className="cancel-btn">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="message-container">
                <p className="message-body">{liveUpdateNote}</p>
              </div>
              {liveUpdateAuthor && (
                <div className="last-edited-badge right-aligned">
                  <RiUserVoiceLine /> Posted by {liveUpdateAuthor}
                </div>
              )}
            </>
          )}
        </section>

        {/* General Updates Section */}
        <section className="updates-general-section">
          <div className="section-header">
            <h2 className="section-title">General Notice</h2>
            {/* FIX 3: ADDED ADMIN CHECK HERE */}
            {isAdmin && !isEditingGeneral && (
              <button onClick={() => { setTempGeneral(generalText); setIsEditingGeneral(true); }} className="edit-trigger">
                <RiEditLine /> Edit
              </button>
            )}
          </div>
          {isEditingGeneral ? (
            <div className="edit-form">
              <textarea className="edit-textarea" value={tempGeneral} onChange={(e) => setTempGeneral(e.target.value)} placeholder="Type general notice..." />
              <div className="form-buttons">
                <button onClick={handleSaveGeneral} disabled={isSaving} className="save-btn">
                  {isSaving ? "Saving..." : "Save Notice"}
                </button>
                <button onClick={() => setIsEditingGeneral(false)} disabled={isSaving} className="cancel-btn">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="message-container">
                <p className="message-body">{generalText || "No general notices."}</p>
              </div>
              {generalAuthor && (
                <div className="last-edited-badge right-aligned">
                  <RiUserVoiceLine /> Posted by {generalAuthor}
                </div>
              )}
            </>
          )}
        </section>

        {/* Academic Context Details */}
        <section className="user-academic-details">
          <div className="info-grid-small">
            <div className="info-item">
              <span className="info-label">Batch</span>
              <span className="info-value">{activeProfile?.batch}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Dept</span>
              <span className="info-value">{activeProfile?.department}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Sec</span>
              <span className="info-value">{activeProfile?.section}</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
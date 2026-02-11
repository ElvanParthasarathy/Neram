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
  RiUserVoiceLine,
  RiCalendarLine
} from 'react-icons/ri';

const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CustomCalendarButton = forwardRef(({ onClick }, ref) => (
  <button className="round-calendar-btn" onClick={onClick} ref={ref} type="button">
    <RiCalendarEventLine />
  </button>
));

const Home = ({ isAdmin = false, globalData, userProfile, activeProfile, hideHeader = false }) => {
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  // --- DESTRUCTURE CENTRALIZED DATA ---
  // Fix: Default to empty object if globalData is null to prevent crash
  const { masterData = {}, allCalendar = [], sectionUpdates = {}, isSyncing } = globalData || {};

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

  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours, 10);
    const m = minutes || "00";
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  const todayStr = formatDate(currentDate);

  // --- Retrieve Note & Author ---
  const liveUpdateData = sectionUpdates?.live?.[todayStr] || {};
  let liveUpdateNote = liveUpdateData.note || "";
  const liveUpdateAuthor = liveUpdateData.author || "";

  // --- Retrieve General & Author ---
  const generalData = sectionUpdates?.general || {};
  const generalText = generalData.text || "";
  const generalAuthor = generalData.author || "";

  // --- AUTOMATED NOTICES LOGIC (Matching Kotlin HomeViewModel) ---
  const getSubjectName = (code) => masterData.courses?.find(c => c.code === code)?.name || "General Subject";

  // Helper to check if a code is a Lab (Simplified Version of resolvePeriod)
  const isLabCourse = (code) => {
    if (!code || !masterData.courses) return false;

    // Check if code contains "/" (split course)
    if (code.includes("/")) {
      return code.split("/").some(part => isLabCourse(part.trim()));
    }

    const trimmed = code.trim();
    // 1. Check exact match properties
    const course = masterData.courses.find(c => c.code === trimmed.split(" ")[0]);
    if (course) {
      if (course.name.toLowerCase().includes("lab") || course.type?.toLowerCase().includes("lab")) return true;
    }

    // 2. Check Batch Pattern (A1, B2)
    const parts = trimmed.split(" ");
    if (parts.length > 1 && /^[A-Za-z]\d+$/.test(parts[1])) return true; // Batch detected -> likely lab

    // 3. Fallback text check
    return trimmed.toLowerCase().includes("lab");
  };

  // Determine today's context for automated messages
  const currentExamPeriod = masterData.exams?.find(ex => todayStr >= ex.startDate && todayStr <= ex.endDate);
  const isExamToday = currentExamPeriod?.subjects?.some(s => s.date === todayStr);
  const examTitle = currentExamPeriod?.title?.toLowerCase() || "";
  const isCycleTest = examTitle.includes("cycle test");
  const isMajorExam = isExamToday && !isCycleTest; // FIA, SIA, Final, etc.

  // Check Schedule for Labs
  let hasLabToday = false;
  const eventsForDay = allCalendar?.filter((e) => e.date === todayStr) || [];
  const holidayEvent = eventsForDay.find(e => e.title.toLowerCase().includes("holiday"));

  if (!holidayEvent && !isMajorExam) { // Allow for regular days and Cycle Tests
    // We need to know the Day Order to check the timetable
    let tempOrder = "";
    const manualOrderEvent = eventsForDay.find(e => e.title.toLowerCase().includes("order"));
    const weekdayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (manualOrderEvent) {
      const foundDay = ["Monday", ...daysOrder].find(day => manualOrderEvent.title.includes(day));
      tempOrder = foundDay || (weekdayName === "Sunday" ? "" : weekdayName);
    } else {
      tempOrder = weekdayName === "Sunday" ? "" : weekdayName;
    }

    if (tempOrder && masterData.timetable?.[tempOrder]) {
      hasLabToday = masterData.timetable[tempOrder].some(code => isLabCourse(code));
    }
  }

  // Append Automated Messages
  const automatedNotices = [];
  if (hasLabToday) {
    automatedNotices.push("📚 Bring Labcoats, Laptops & Lab Essentials");
  }
  if (isExamToday) {
    automatedNotices.push("📖 Study well for the test! Score well and get full marks! All the best! 🎯");
  }

  if (automatedNotices.length > 0) {
    const comboNotice = automatedNotices.join("\n\n");
    liveUpdateNote = liveUpdateNote ? `${liveUpdateNote}\n\n${comboNotice}` : comboNotice;
  }

  // If no note exists at all, provide default
  if (!liveUpdateNote) liveUpdateNote = "No special updates for today.";

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
      resolvedStatus = "Holiday";
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
        resolvedStatus = "Holiday";
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
      await update(ref(db, `updates/${batch}/${department}/${section}/daily_update/${todayStr}`), {
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

  // --- REPLACED: KOTLIN-PARITY COURSE RESOLVER ---
  const resolvePeriod = (cellContent) => {
    if (!cellContent || !masterData.courses) {
      return { entries: [{ code: cellContent, name: cellContent, faculty: "" }], isLab: false };
    }

    // Helper to process a single entry
    const processEntry = (entryStr) => {
      const trimmed = entryStr.trim();

      // 1. Try exact match first
      let course = masterData.courses.find(c => c.code === trimmed);
      let batch = null;

      // 2. If no exact match, try First Word match (e.g. "22EC602 A1")
      if (!course) {
        const parts = trimmed.split(" ");
        const pureCode = parts[0];
        course = masterData.courses.find(c => c.code === pureCode);

        // Check if suffix looks like a batch (A1, B2, etc.)
        if (course && parts.length > 1) {
          const suffix = parts[1];
          // Kotlin Regex: ^[A-Za-z]\d+$ matches A1, B2, etc.
          if (/^[A-Za-z]\d+$/.test(suffix)) {
            batch = suffix;
          }
        }
      }

      if (!course) {
        return { code: trimmed, name: trimmed, faculty: "", isLab: false };
      }

      // 3. Clean Course Name (Remove "Lab Integrated", "Integrated Lab", etc.)
      let cleanName = course.name;
      const patterns = [
        /\s*\(Lab Integrated\)/i,
        /\s*\(Integrated Lab\)/i,
        /\s*Lab Integrated/i,
        /\s*Integrated Lab/i,
        /\s*\(Integrated\)/i,
        /\s*\(Lab\)/i,
        /\s*Integrated/i,
        /\s*Lab/i
      ];

      patterns.forEach(p => {
        cleanName = cleanName.replace(p, "").trim();
      });

      // Remove trailing chars
      cleanName = cleanName.replace(/[-/]+$/, "").trim();

      // If batch exists, remove it from end of name if present
      if (batch) {
        const batchRegex = new RegExp(`\\s+${batch}$`, 'i');
        cleanName = cleanName.replace(batchRegex, "").trim();
      }

      // 4. Resolve Faculty (Handle "Faculty (A1) / Faculty (B2)")
      let faculty = course.faculty;
      if (batch && faculty.includes(`(${batch})`)) {
        const parts = faculty.split("/").map(f => f.trim());
        const match = parts.find(f => f.includes(`(${batch})`));
        if (match) {
          faculty = match.replace(`(${batch})`, "").trim();
        }
      }

      return {
        code: batch ? `${course.code} ${batch}` : course.code, // Keep batch in code display
        name: cleanName,
        faculty: faculty,
        isLab: !!batch // It's a lab if a batch was detected
      };
    };

    // Handle Split Courses (e.g. "22EC919 A1 / 22EC611 A2")
    if (cellContent.includes("/")) {
      const parts = cellContent.split("/").map(p => p.trim());
      const entries = parts.map(processEntry);

      return {
        entries: entries,
        isLab: entries.some(e => e.isLab)
      };
    }

    // Single Course
    const entry = processEntry(cellContent);
    return {
      entries: [entry],
      isLab: entry.isLab
    };
  };

  return (
    <div className="home-view" style={window.innerWidth <= 768 ? { padding: '0 16px', marginTop: 0 } : {}}>
      <div className="home-container">

        {!hideHeader && (
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
        )}

        <section className="date-section">
          <label className="input-label">Select date</label>
          <div className="date-input-group">
            <input
              type="text"
              className="date-display"
              readOnly
              value={currentDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            />
            <div className="date-picker-trigger">
              <DatePicker
                selected={currentDate}
                onChange={(date) => setCurrentDate(date)}
                customInput={<CustomCalendarButton />}
                popperPlacement="bottom-end"
                portalId="root"
              />
            </div>
          </div>
        </section>

        {/* Academic Calendar Section */}
        <section className="calendar-section">
          <h2 className="section-title">Academic Calendar</h2>
          <div className="calendar-content">
            {todayEvents.length > 0 ? todayEvents.map((ev, i) => {
              // Dynamic Coloring Logic (Matches Mobile)
              const getEventClass = (event) => {
                const title = event.title.toLowerCase();
                if (title.includes("holiday")) return "indicator-holiday";
                if (title.includes("exam") || title.includes("test") || title.includes("sia") || title.includes("fia")) return "indicator-exam";
                if (title.includes("working day") && title.includes("order")) return "indicator-order";
                if (event.type === "FullDay" || event.type === "HalfDay" || event.isSection) return "indicator-special";
                return "indicator-default";
              };

              return (
                <div key={i} className="home-event-pill">
                  <div className={`event-indicator ${getEventClass(ev)}`}></div>
                  <div className="event-info">
                    <p className="calendar-text"><strong>{ev.title}</strong></p>
                    <p className="calendar-subtext">{ev.fullTime}</p>
                  </div>
                </div>
              );
            }) : <p className="calendar-text-empty">Regular Working Day</p>}
          </div>
        </section>

        {/* Dynamic Schedule Section */}
        <section className="timetable-section">
          <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Schedule</h2>
            <span className="status-badge-small">{scheduleStatus}</span>
          </div>

          {(isSyncing || areEventsLoading) ? (
            <div className="home-loading-card">
              <div className="btn-spinner grey"></div>
              <span>Checking Schedule...</span>
            </div>
          ) : (
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
                            <span><RiTimeLine /> {convertTo12Hour(activeExamToday.todaySub.startTime)} - {convertTo12Hour(activeExamToday.todaySub.endTime)}</span>
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
                            <span><RiTimeLine /> {convertTo12Hour(halfDayEvent.startTime || "09:00")} - {convertTo12Hour(halfDayEvent.endTime || "12:00")}</span>
                            <span className="portion-tag"><RiInformationLine /> Event</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* C. TIMETABLE vs MAJOR EXAM SUSPENSION */}
                  {(!activeExamPeriod || activeExamPeriod.type.includes('CT')) ? (
                    dayOrder && masterData.timetable?.[dayOrder] ? (
                      <div className="schedule-list">
                        {masterData.timetable[dayOrder].map((rawCode, index) => {
                          const { entries, isLab } = resolvePeriod(rawCode);

                          return (
                            <div key={index} className="period-card">
                              <div className="period-left">
                                <div className="period-circle">{index + 1}</div>
                              </div>

                              <div className="period-content">
                                {entries.map((entry, idx) => (
                                  <div key={idx} className="course-entry">
                                    <div className="course-header-row">
                                      <span className="course-code">{entry.code}</span>
                                      {entry.isLab && (
                                        <span className="lab-badge">LAB</span>
                                      )}
                                    </div>

                                    <div className="course-name">{entry.name}</div>

                                    {entry.faculty && (
                                      <div className="course-faculty">{entry.faculty}</div>
                                    )}

                                    {/* Spacer/Divider for split entries */}
                                    {idx < entries.length - 1 && <div className="entry-divider"></div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="no-classes-card">
                        <RiCalendarLine className="empty-icon" />
                        <div className="empty-text">
                          <p className="main-msg">No classes scheduled</p>
                          <p className="sub-msg">Enjoy your {scheduleStatus}</p>
                        </div>
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
            {!isEditingNote && (
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
                  {isSaving ? <div className="btn-spinner"></div> : "Save Update"}
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
            {!isEditingGeneral && (
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
                  {isSaving ? <div className="btn-spinner"></div> : "Save Notice"}
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

        {/* Academic Detail Cards */}
        <section className="academic-card batch-card">
          <span className="info-label">Batch</span>
          <span className="info-value">{activeProfile?.batch}</span>
        </section>
        <section className="academic-card dept-card">
          <span className="info-label">Dept</span>
          <span className="info-value">{activeProfile?.department}</span>
        </section>
        <section className="academic-card sec-card">
          <span className="info-label">Sec</span>
          <span className="info-value">{activeProfile?.section}</span>
        </section>

      </div>
    </div>
  );
};

export default Home;
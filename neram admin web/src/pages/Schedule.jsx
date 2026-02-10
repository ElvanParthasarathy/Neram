import React, { useState, useEffect, forwardRef, useMemo } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Icons
import {
  RiCalendarEventLine,
  RiTrophyLine,
  RiTimeLine,
  RiFilePaperLine,
  RiInformationLine,
  RiUserVoiceLine,
  RiHashtag
} from 'react-icons/ri';

const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Unified Button Component matching Home Dashboard
const CustomCalendarButton = forwardRef(({ onClick }, ref) => (
  <button className="round-calendar-btn" onClick={onClick} ref={ref} type="button">
    <RiCalendarEventLine />
  </button>
));

const Schedule = ({ globalData, userProfile, activeProfile }) => {
  // --- 1. SAFE DESTRUCTURING (Crash Prevention) ---
  const { masterData = {}, allCalendar = [], isSyncing } = globalData || {};

  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayOrder, setDayOrder] = useState("");
  const [todayNote, setTodayNote] = useState("");
  const [activeTab, setActiveTab] = useState("class");

  // --- 2. SPLIT STATE FOR EVENTS ---
  const [globalEvents, setGlobalEvents] = useState([]);
  const [sectionEvents, setSectionEvents] = useState([]);
  const [areEventsLoading, setAreEventsLoading] = useState(true);

  const [activeExamPeriod, setActiveExamPeriod] = useState(null);
  const [activeExamToday, setActiveExamToday] = useState(null);
  const [activeExamTomorrow, setActiveExamTomorrow] = useState(null);

  const getSubjectName = (code) => {
    return masterData.courses?.find(c => c.code === code)?.name || "General Subject";
  };

  // --- 3. MERGE LOGIC ---
  const todayEvents = useMemo(() => {
    const combined = [...globalEvents, ...sectionEvents];
    return Array.from(new Map(combined.map(item => [item.id || item.title, item])).values());
  }, [globalEvents, sectionEvents]);

  // Detect Special Events
  const fullDayEvent = todayEvents.find(e => e.type === "FullDay");
  const halfDayEvent = todayEvents.find(e => e.type === "HalfDay");

  // --- 4. FETCH SECTION EVENTS ---
  useEffect(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    if (activeProfile?.section) {
      setAreEventsLoading(true);
      const { batch, department, section } = activeProfile;
      const sectionEventsRef = ref(db, `events/${batch}/${department}/${section}`);

      const unsub = onValue(sectionEventsRef, (snap) => {
        const data = snap.val() || [];
        const rawEvents = Array.isArray(data) ? data : Object.values(data);
        const todaysSpecialEvents = rawEvents.filter(e => e.date === todayStr);

        setSectionEvents(todaysSpecialEvents);
        setAreEventsLoading(false);
      }, (error) => {
        console.error("Section events sync error:", error);
        setAreEventsLoading(false);
      });
      return () => unsub();
    } else {
      setSectionEvents([]);
      setAreEventsLoading(false);
    }
  }, [activeProfile, currentDate]);

  // --- 5. LOGIC RESOLUTION (Day Order & Global Events) ---
  useEffect(() => {
    if (!masterData || !allCalendar) return;

    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    // Set Global Events
    const gEvents = allCalendar.filter(event => event.date === todayStr);
    setGlobalEvents(gEvents);

    // Exam Logic
    const currentPeriod = masterData.exams?.find(ex => todayStr >= ex.startDate && todayStr <= ex.endDate);
    setActiveExamPeriod(currentPeriod || null);

    if (currentPeriod) {
      const subToday = currentPeriod.subjects?.find(s => s.date === todayStr);
      setActiveExamToday(subToday ? { ...currentPeriod, todaySub: subToday } : null);

      // Calculate Tomorrow
      const tomorrowDate = new Date(currentDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const ty = tomorrowDate.getFullYear();
      const tm = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
      const td = String(tomorrowDate.getDate()).padStart(2, '0');
      const tomorrowStr = `${ty}-${tm}-${td}`;

      const subTom = currentPeriod.subjects?.find(s => s.date === tomorrowStr);
      setActiveExamTomorrow(subTom ? { ...currentPeriod, tomSub: subTom } : null);
    } else {
      setActiveExamToday(null);
      setActiveExamTomorrow(null);
    }

    // Day Order Logic (Using MERGED todayEvents would be ideal, but here we use Global + Check)
    // We re-derive specific flags for the Note display
    const holidayEvent = gEvents.find(e => e.title.toLowerCase().includes("holiday"));
    const orderEvent = gEvents.find(e => e.title.toLowerCase().includes("order"));

    if (holidayEvent) {
      setTodayNote(`Holiday: ${holidayEvent.title}`);
      setDayOrder("");
    } else if (orderEvent) {
      const order = ["Monday", ...daysOrder].find(day => orderEvent.title.includes(day));
      if (order) { setDayOrder(order); setTodayNote(`Following ${order} Order.`); }
    } else {
      const weekday = currentDate.getDay();
      if (weekday === 0) { setTodayNote("Today is Sunday. No classes."); setDayOrder(""); }
      else {
        const order = ["Monday", ...daysOrder][weekday - 1];
        if (order === "Monday") { setTodayNote("Today is Monday. No classes."); setDayOrder(""); }
        else { setDayOrder(order); setTodayNote(`Today is ${order}.`); }
      }
    }
  }, [currentDate, globalData, allCalendar, masterData]);

  // --- SMART COURSE RESOLVER ---
  const getPeriodDetails = (cellContent) => {
    if (!cellContent || !masterData.courses) return { name: "", faculty: "", code: "" };

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

  const isLoading = isSyncing || (activeProfile?.section && areEventsLoading);

  if (isSyncing && (!masterData.courses || masterData.courses.length === 0)) {
    return <div className="loading-container">Syncing Schedule Data...</div>;
  }

  return (
    <div className="schedule-view" style={window.innerWidth <= 768 ? { padding: '0 var(--screen-edge-spacing)', marginTop: 0 } : {}}>
      <div className="schedule-container">

        <header className="page-header">
          <h1 className="page-title">Academic Portal</h1>
          {activeProfile && userProfile && activeProfile.section !== userProfile.section && (
            <div className="global-preview-tag">
              <RiInformationLine />
              <span>Previewing Schedule: <strong>{activeProfile.department}-{activeProfile.section}</strong></span>
            </div>
          )}
          <nav className="view-switcher-tabs">
            <button className={activeTab === 'class' ? 'active' : ''} onClick={() => setActiveTab('class')}><RiCalendarEventLine /> Class</button>
            <button className={activeTab === 'exams' ? 'active' : ''} onClick={() => setActiveTab('exams')}><RiTrophyLine /> Exams</button>
          </nav>
        </header>

        {/* --- FIXED PREMIUM PILL BAR --- */}
        <section className="controls-section premium-pill-bar">
          <div className="status-pill-group">
            <div className={`status-dot ${dayOrder ? 'active' : 'holiday'}`}></div>
            <div className="status-banner">{todayNote}</div>
          </div>

          <div className="date-controls-group">
            <div className="date-picker-wrapper">
              <DatePicker
                selected={currentDate}
                onChange={(date) => setCurrentDate(date)}
                customInput={
                  <div className="date-display-pill">
                    {currentDate.toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                }
                popperPlacement="bottom-end"
              />
            </div>

            <button
              className="round-calendar-btn"
              onClick={() => document.querySelector('.date-display-pill').click()}
              type="button"
            >
              <RiCalendarEventLine />
            </button>
          </div>
        </section>

        {activeTab === 'class' ? (
          <>
            {/* LOGIC: Check Full Day Event -> Check Exam -> Check Schedule */}
            {isLoading ? <div className="loading-shimmer" style={{ margin: '20px 0' }}>Loading Schedule...</div> : (
              <>
                {/* 1. FULL DAY EVENT (Highest Priority) */}
                {fullDayEvent ? (
                  <section className="today-schedule-section">
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
                        <h4 className="notice-bold">Classes Suspended</h4>
                        <p className="notice-sub">Day reserved for <strong>{fullDayEvent.title}</strong>.</p>
                      </div>
                    </div>
                  </section>
                ) : (
                  /* 2. REGULAR / EXAM VIEW */
                  (activeExamToday || (dayOrder && masterData.timetable?.[dayOrder]) || (activeExamPeriod && !activeExamPeriod.type.includes('CT'))) && (
                    <section className="today-schedule-section">

                      {/* A. TODAY'S EXAM */}
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

                      {/* B. HALF DAY EVENT */}
                      {halfDayEvent && !activeExamToday && (
                        <div className="exam-mini-card cycle" style={{ marginBottom: '15px' }}>
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

                      {/* C. TIMETABLE vs SUSPENSION */}
                      {(!activeExamPeriod || activeExamPeriod.type.includes('CT')) ? (
                        dayOrder && masterData.timetable?.[dayOrder] && (
                          <>
                            <h2 className="section-title">Timetable for {activeProfile?.section} ({dayOrder})</h2>
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
                          </>
                        )
                      ) : (
                        <div className="major-exam-notice">
                          <RiInformationLine />
                          <div>
                            <h4 className="notice-bold">Classes Suspended</h4>
                            <p className="notice-sub">Regular classes are suspended during the <strong>{activeExamPeriod.title}</strong> period.</p>
                          </div>
                        </div>
                      )}
                    </section>
                  )
                )}
              </>
            )}

            <section className="weekly-overview-section">
              {daysOrder.map(day => (
                <article key={day} className="day-card">
                  <h3 className="day-title">{day}</h3>
                  {masterData.timetable?.[day] && masterData.timetable[day].length > 0 ? (
                    <div className="table-overflow">
                      <table className="schedule-table mini">
                        <thead><tr><th>#</th><th>Course</th><th>Faculty</th></tr></thead>
                        <tbody>
                          {masterData.timetable[day].map((code, index) => {
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
                  ) : <p className="no-data-text">No classes scheduled.</p>}
                </article>
              ))}
            </section>
          </>
        ) : (
          <section className="all-exams-directory animate-fade-in">
            {masterData.exams?.length > 0 ? (
              masterData.exams.map((ex, idx) => (
                <div key={idx} className="full-exam-schedule-card">
                  <div className="exam-full-header">
                    <RiTrophyLine className="header-icon" />
                    <div>
                      <h3>{ex.title} <span>({ex.type})</span></h3>
                      <p className="exam-subtitle">Academic Assessment Plan</p>
                    </div>
                  </div>
                  <div className="table-overflow">
                    <table className="schedule-table exam-table">
                      <thead>
                        <tr>
                          <th>Date & Timing</th>
                          <th>Subject Details</th>
                          <th>Portion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.subjects.map((s, i) => (
                          <tr key={i} className={s.date === currentDate.toISOString().split('T')[0] ? 'highlight-today' : ''}>
                            <td className="cell-date-time">
                              <span className="date-primary">
                                {new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                              </span>
                              <span className="time-subtext">{s.startTime} - {s.endTime}</span>
                            </td>

                            <td className="cell-subject-main">
                              <div className="course-code">{s.code}</div>
                              <div className="course-name">{getSubjectName(s.code)}</div>
                            </td>

                            <td className="cell-portion">
                              <span className="portion-badge-pill">{s.portion}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : <div className="no-data-text">No Exam Timetables published for this section.</div>}
          </section>
        )}

        <section className="courses-directory-section">
          <h2 className="section-title">Academic Courses ({activeProfile?.department})</h2>
          <div className="table-overflow">
            <table className="schedule-table courses-list-stacked">
              <thead>
                <tr>
                  <th>Course Details</th>
                  <th>Faculty & Load</th>
                </tr>
              </thead>
              <tbody>
                {masterData.courses?.length > 0 ? masterData.courses.map((course, idx) => (
                  <tr key={idx}>
                    <td className="cell-stacked-main">
                      <div className="stacked-primary-text">{course.name}</div>
                      <div className="stacked-secondary-text"><RiHashtag /> {course.code}</div>
                    </td>
                    <td className="cell-stacked-sub">
                      <div className="stacked-primary-text">{course.faculty}</div>
                      <div className="stacked-secondary-text"><RiTimeLine /> {course.periods} Periods Total</div>
                    </td>
                  </tr>
                )) : <tr><td colSpan="2" className="no-data-text">No course data available.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="staff-info-section">
          <article className="info-card">
            <h2 className="section-title">Class Counselors</h2>
            <ul className="info-list">
              {masterData.counseling?.counselors?.length > 0 ? masterData.counseling.counselors.map((counselor, idx) => (
                <li key={idx}><RiUserVoiceLine /> {counselor}</li>
              )) : <li>No counselors assigned.</li>}
            </ul>
          </article>
          <article className="info-card">
            <h2 className="section-title">Key Coordinators</h2>
            <ul className="info-list">
              {masterData.counseling?.coordinators && Object.entries(masterData.counseling.coordinators).length > 0 ? Object.entries(masterData.counseling.coordinators).map(([title, name]) => (
                <li key={title}>
                  <RiUserVoiceLine />
                  <div>
                    <span className="info-label">{title}</span>
                    <span className="coordinator-name">{name}</span>
                  </div>
                </li>
              )) : <li>No coordinators assigned.</li>}
            </ul>
          </article>
        </section>

      </div>
    </div>
  );
};

export default Schedule;
import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  RiCalendarEventLine,
  RiTrophyLine,
  RiTimeLine,
  RiFilePaperLine,
  RiInformationLine,
  RiUserLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowDownSLine,
} from "react-icons/ri";

// ======================= HELPER FUNCTIONS =======================

const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortDays = ["Tue", "Wed", "Thu", "Fri", "Sat"];
export const periodTimes = [
  "9:00 - 9:50", "9:50 - 10:40", "10:50 - 11:40", "11:40 - 12:30",
  "1:30 - 2:20", "2:20 - 3:10", "3:20 - 4:10", "4:10 - 5:00"
];

/** Clean subject name (remove Lab Integrated, etc.) */
export const getCleanSubjectName = (code, courses) => {
  let name = courses?.find(c => c.code === code)?.name || "Subject";
  name = name.replace(/\s*\(.*?\)/g, "").trim();
  ["Lab Integrated", "Integrated Lab", "Integrated", "Lab"].forEach(term => {
    name = name.replace(new RegExp(`\\s*${term}`, "gi"), "").trim();
  });
  return name.replace(/[-\s/]+$/, "");
};

/** Resolve period details: handles split courses (/) and lab detection */
export const getPeriodDetails = (cellContent, courses) => {
  if (!cellContent || !courses) return { entries: [], isLab: false };

  if (cellContent.includes("/")) {
    const parts = cellContent.split("/").map(p => p.trim());
    const results = parts.map(part => resolveSingle(part, courses));
    return {
      entries: results.flatMap(r => r.entries),
      isLab: results.some(r => r.isLab)
    };
  }
  return resolveSingle(cellContent, courses);
};

const resolveSingle = (entry, courses) => {
  const trimmed = entry.trim();
  const directMatch = courses.find(c => c.code === trimmed);
  if (directMatch) return processCourse(directMatch, null, trimmed);

  const parts = trimmed.split(" ");
  const pureCode = parts[0];
  const courseByCode = courses.find(c => c.code === pureCode);
  if (courseByCode) {
    const suffix = parts[1] || "";
    const isLabBatch = /^[A-Za-z]\d+$/.test(suffix);
    return processCourse(courseByCode, isLabBatch ? suffix : null, trimmed);
  }

  return { entries: [{ code: trimmed, name: "", faculty: "" }], isLab: false };
};

const processCourse = (course, batch, originalCode) => {
  let name = course.name;
  let faculty = course.faculty;
  const isLab = batch != null;

  if (isLab) {
    [/\s*\(Lab Integrated\)/gi, /\s*\(Integrated Lab\)/gi, /\s*Lab Integrated/gi,
      /\s*Integrated Lab/gi, /\s*\(Integrated\)/gi, /\s*\(Lab\)/gi,
      /\s*Integrated/gi, /\s*Lab/gi].forEach(pattern => {
        name = name.replace(pattern, "").trim();
      });
    name = name.replace(/[-\s/]+$/, "");

    if (batch && course.faculty.includes(`(${batch})`)) {
      const splitFaculties = course.faculty.split("/").map(f => f.trim());
      const matching = splitFaculties.find(f => f.includes(`(${batch})`));
      if (matching) faculty = matching.replace(`(${batch})`, "").trim();
    }
  }

  return { entries: [{ code: originalCode, name, faculty }], isLab };
};

/** Calculate display config (port of ScheduleLogic.kt) */
const calculateDisplayConfig = (state) => {
  if (state.fullDayEvent) {
    return {
      showFullDayEvent: true, showExamCard: false, showHalfDayEvent: false,
      showTimetable: false, showSuspensionNotice: false,
      suspensionReason: `Day reserved for ${state.fullDayEvent.title}.`
    };
  }

  let showExam = !!state.todayExam;
  let showHalfDay = !!state.halfDayEvent && !state.todayExam;
  let showTimetable = false;
  let showSuspended = false;
  let suspensionReason = "";

  const isExamPeriod = !!state.activeExamPeriod;
  const isCycleTest = state.activeExamPeriod?.type?.includes("CT");
  const hasPeriods = state.periods && state.periods.length > 0;

  if ((!isExamPeriod || isCycleTest) && hasPeriods) {
    showTimetable = true;
  } else if (isExamPeriod && !isCycleTest) {
    showSuspended = true;
    suspensionReason = `Regular classes are suspended during the ${state.activeExamPeriod.title} period.`;
  }

  return { showFullDayEvent: false, showExamCard: showExam, showHalfDayEvent: showHalfDay, showTimetable, showSuspensionNotice: showSuspended, suspensionReason };
};

/** Format date for display */
const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return dateStr; }
};

export const formatDateLong = (date) => {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// ======================= SUB-COMPONENTS =======================

/** Pill tab switcher (Class / Exams) */
export const ViewTypeTabsRow = ({ activeTab, onTabSelected }) => (
  <div className="s2-view-tabs">
    <div className={`s2-tab-indicator ${activeTab === "exams" ? "exams" : ""}`} />
    <button className={activeTab === "class" ? "active" : ""} onClick={() => onTabSelected("class")}>
      <RiCalendarEventLine /> Class
    </button>
    <button className={activeTab === "exams" ? "active" : ""} onClick={() => onTabSelected("exams")}>
      <RiTrophyLine /> Exams
    </button>
  </div>
);

/** Date navigation section — uses manually toggled inline calendar */
export const DateSection = ({ date, onPrev, onNext, onDateChange }) => {
  const [calOpen, setCalOpen] = useState(false);
  const wrapperRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setCalOpen(false);
      }
    };
    if (calOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calOpen]);

  // Swipe Logic
  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const onTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onNext();
    } else if (isRightSwipe) {
      onPrev();
    }
  };

  // Helper to format date for input
  const toISODateLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  return (
    <div
      className="s2-date-section-unified"
      ref={wrapperRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="s2-date-nav-group">
        <button className="s2-date-arrow" onClick={onPrev}><RiArrowLeftSLine /></button>
        <div className="s2-date-text" onClick={() => setCalOpen(!calOpen)}>{formatDateLong(date)}</div>
        <button className="s2-date-arrow" onClick={onNext}><RiArrowRightSLine /></button>
      </div>

      <div className="s2-calendar-divider" />

      <div className="s2-calendar-trigger-wrapper">
        <button className="s2-calendar-trigger-btn" onClick={() => setCalOpen(!calOpen)}>
          <RiCalendarEventLine />
        </button>
        {/* Native Mobile Date Picker */}
        <input
          type="date"
          className="s2-mobile-date-input"
          value={toISODateLocal(date)}
          onChange={(e) => {
            if (e.target.valueAsDate) {
              onDateChange(e.target.valueAsDate);
            }
          }}
        />
      </div>

      {calOpen && (
        <div className="s2-calendar-dropdown">
          <DatePicker
            selected={date}
            onChange={(d) => { onDateChange(d); setCalOpen(false); }}
            inline
          />
        </div>
      )}
    </div>
  );
};

/** Period row in schedule table */
export const PeriodRow = ({ number, entries, isLab, time }) => (
  <div className="s2-period-row">
    <div className="s2-period-num">{number}</div>
    <div className="s2-period-details">
      {entries.map((entry, i) => (
        <div key={i} className="s2-period-entry">
          <div className="s2-course-code-row">
            <span className="s2-course-code">{entry.code}</span>
            {isLab && <span className="s2-lab-badge">LAB</span>}
          </div>
          {entry.name && <div className="s2-course-name">{entry.name}</div>}
          {entry.faculty && <div className="s2-faculty">{entry.faculty}</div>}
        </div>
      ))}
    </div>
  </div>
);

/** Event card (full-day, half-day, exam) */
export const EventCard = ({ tag, title, subtitle, meta1, meta2, meta1Icon, meta2Icon }) => (
  <div className="s2-event-card s2-fade-in">
    <div className="s2-event-tag">{tag}</div>
    <div className="s2-event-content">
      <RiCalendarEventLine className="s2-event-icon" />
      <div className="s2-event-info">
        <h3>{title}</h3>
        <p>{subtitle}</p>
        <div className="s2-event-meta">
          {meta1 && <span className="s2-meta-chip">{meta1Icon || <RiTimeLine />} {meta1}</span>}
          {meta2 && <span className="s2-meta-chip">{meta2Icon || <RiInformationLine />} {meta2}</span>}
        </div>
      </div>
    </div>
  </div>
);

/** Exam event card (same blue card but with trophy icon) */
export const ExamEventCard = ({ exam }) => (
  <div className="s2-event-card s2-fade-in">
    <div className="s2-event-tag">TODAY'S EXAM</div>
    <div className="s2-event-content">
      <RiTrophyLine className="s2-event-icon" />
      <div className="s2-event-info">
        <h3>{exam.title}</h3>
        <p><strong>{exam.todaySub.code}</strong>: {exam.subjectName}</p>
        <div className="s2-event-meta">
          <span className="s2-meta-chip"><RiTimeLine /> {exam.todaySub.startTime} - {exam.todaySub.endTime}</span>
          {exam.todaySub.portion && (
            <span className="s2-meta-chip"><RiFilePaperLine /> {exam.todaySub.portion}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

/** Notice card (suspension) */
export const NoticeCard = ({ title, message }) => (
  <div className="s2-notice-card s2-fade-in">
    <div className="s2-notice-icon"><RiInformationLine /></div>
    <div>
      <h4 className="s2-notice-title">{title}</h4>
      <p className="s2-notice-sub">{message}</p>
    </div>
  </div>
);

/** Collapsible section */
const Collapsible = ({ title, children, defaultOpen = false, integratedContent = null }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`s2-collapsible-wrapper ${isOpen ? "is-open" : ""}`}>
      <div className="s2-collapsible-card">
        <div className="s2-collapsible-header" onClick={() => setIsOpen(!isOpen)}>
          <span className="s2-section-title muted">{title}</span>
          <div className={`s2-collapsible-icon ${isOpen ? "open" : ""}`}>
            <RiArrowDownSLine />
          </div>
        </div>

        {integratedContent && (
          <div className={`s2-collapsible-integrated-anim ${isOpen ? "open" : ""}`}>
            <div className="s2-collapsible-integrated-inner">
              <div className="s2-collapsible-integrated-content">
                {integratedContent}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`s2-collapsible-body-anim ${isOpen ? "open" : ""}`}>
        <div className="s2-collapsible-body-inner">
          <div className="s2-collapsible-body-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Day tabs row (Tue–Sat) */
const DayTabsRow = ({ selectedDay, onDaySelected }) => {
  const selectedIndex = daysOrder.indexOf(selectedDay);
  const tabWidth = 100 / shortDays.length;

  return (
    <div className="s2-day-tabs">
      <div
        className="s2-day-indicator"
        style={{
          left: `calc(${selectedIndex * tabWidth}% + 5px)`,
          width: `calc(${tabWidth}% - 10px)`
        }}
      />
      {shortDays.map((day, i) => (
        <button
          key={day}
          className={daysOrder[i] === selectedDay ? "active" : ""}
          onClick={() => onDaySelected(daysOrder[i])}
        >
          {day}
        </button>
      ))}
    </div>
  );
};

/** Exam schedule card */
const ExamScheduleCard = ({ exam, courses }) => (
  <div className="s2-exam-card s2-fade-in">
    <div className="s2-exam-header">
      <RiTrophyLine className="s2-exam-header-icon" />
      <div>
        <h3 className="s2-exam-title">{exam.title}</h3>
        <p className="s2-exam-type">{exam.type}</p>
      </div>
    </div>
    {exam.subjects && exam.subjects.length > 0 ? (
      exam.subjects.map((sub, i) => (
        <div key={i} className="s2-exam-subject-row">
          <div className="s2-period-num">{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div className="s2-exam-date">{formatDate(sub.date)}</div>
            <div className="s2-exam-code-name">
              {sub.code}: {getCleanSubjectName(sub.code, courses)}
            </div>
            <div className="s2-exam-time-portion">
              <span>{sub.startTime} - {sub.endTime}</span>
              {sub.portion && <span>  •  {sub.portion}</span>}
            </div>
          </div>
        </div>
      ))
    ) : (
      <p className="s2-exam-empty">No subjects scheduled</p>
    )}
  </div>
);

/** Course directory list */
const CourseDirectory = ({ courses }) => (
  <div className="s2-course-list">
    {courses && courses.length > 0 ? courses.map((course, i) => (
      <div key={i} className="s2-course-card">
        <div className="s2-course-header-row">
          <span className="s2-course-code">{course.code}</span>
          {course.periods > 0 && <span className="s2-course-periods">• {course.periods} periods</span>}
        </div>
        <div className="s2-course-name">{course.name}</div>
        <div className="s2-faculty">{course.faculty}</div>
      </div>
    )) : (
      <div className="s2-empty-card"><p>No courses found</p></div>
    )}
  </div>
);

/** Staff info card */
const InfoCard = ({ title, items }) => (
  <div className="s2-info-card">
    <h3 className="s2-info-title">{title}</h3>
    {items && items.length > 0 ? items.map((item, i) => (
      <div key={i} className="s2-info-item">
        <div className="s2-info-avatar"><RiUserLine /></div>
        <span className="s2-info-name">{item}</span>
      </div>
    )) : (
      <span className="s2-info-empty">No info available</span>
    )}
  </div>
);

/** Empty state card */
const EmptyCard = ({ message }) => (
  <div className="s2-empty-card"><p>{message}</p></div>
);

// ======================= MAIN COMPONENT =======================

const Schedule = ({ globalData, userProfile, activeProfile }) => {
  const { masterData = {}, allCalendar = [], isSyncing } = globalData || {};

  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("class");
  const [dayOrder, setDayOrder] = useState("");
  const [todayNote, setTodayNote] = useState("");
  const [slideAnim, setSlideAnim] = useState("");

  // Events
  const [globalEvents, setGlobalEvents] = useState([]);
  const [sectionEvents, setSectionEvents] = useState([]);
  const [areEventsLoading, setAreEventsLoading] = useState(true);

  // Exam state
  const [activeExamPeriod, setActiveExamPeriod] = useState(null);
  const [activeExamToday, setActiveExamToday] = useState(null);

  // Weekly overview
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    return daysOrder.includes(today) ? today : "Tuesday";
  });

  // --- Fetch section events ---
  useEffect(() => {
    const todayStr = toISODate(currentDate);
    if (activeProfile?.section) {
      setAreEventsLoading(true);
      const { batch, department, section } = activeProfile;
      const sectionEventsRef = ref(db, `events/${batch}/${department}/${section}`);
      const unsub = onValue(sectionEventsRef, (snap) => {
        const data = snap.val() || [];
        const rawEvents = Array.isArray(data) ? data : Object.values(data);
        setSectionEvents(rawEvents.filter(e => e.date === todayStr));
        setAreEventsLoading(false);
      }, () => setAreEventsLoading(false));
      return () => unsub();
    } else {
      setSectionEvents([]);
      setAreEventsLoading(false);
    }
  }, [activeProfile, currentDate]);

  // --- Logic resolution ---
  useEffect(() => {
    if (!masterData || !allCalendar) return;
    const todayStr = toISODate(currentDate);

    // Global events
    const gEvents = allCalendar.filter(e => e.date === todayStr);
    setGlobalEvents(gEvents);

    // Exam logic
    const currentPeriod = masterData.exams?.find(ex => todayStr >= ex.startDate && todayStr <= ex.endDate);
    setActiveExamPeriod(currentPeriod || null);

    if (currentPeriod) {
      const subToday = currentPeriod.subjects?.find(s => s.date === todayStr);
      setActiveExamToday(subToday ? { ...currentPeriod, todaySub: subToday, subjectName: getCleanSubjectName(subToday.code, masterData.courses) } : null);
    } else {
      setActiveExamToday(null);
    }

    // Day order
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

  // Merged events
  const todayEvents = useMemo(() => {
    const combined = [...globalEvents, ...sectionEvents];
    return Array.from(new Map(combined.map(item => [item.id || item.title, item])).values());
  }, [globalEvents, sectionEvents]);

  const fullDayEvent = todayEvents.find(e => e.type === "FullDay");
  const halfDayEvent = todayEvents.find(e => e.type === "HalfDay");

  // Build periods for today
  const todayPeriods = useMemo(() => {
    if (!dayOrder || !masterData.timetable?.[dayOrder]) return [];
    return masterData.timetable[dayOrder].map((code, index) => {
      const details = getPeriodDetails(code, masterData.courses);
      return { number: index + 1, time: periodTimes[index] || "", entries: details.entries, isLab: details.isLab };
    });
  }, [dayOrder, masterData]);

  // Schedule display config
  const scheduleState = { fullDayEvent, halfDayEvent, todayExam: activeExamToday, activeExamPeriod, periods: todayPeriods };
  const displayConfig = calculateDisplayConfig(scheduleState);

  // Exam partitioning for exams tab
  const { ongoingExams, upcomingExams, finishedExams } = useMemo(() => {
    const todayStr = toISODate(currentDate);
    const allExams = masterData.exams || [];

    const ongoing = [];
    const upcoming = [];
    const finished = [];

    allExams.forEach(exam => {
      try {
        if (exam.startDate && exam.endDate) {
          if (todayStr >= exam.startDate && todayStr <= exam.endDate) ongoing.push(exam);
          else if (todayStr < exam.startDate) upcoming.push(exam);
          else finished.push(exam);
        } else {
          finished.push(exam);
        }
      } catch { finished.push(exam); }
    });

    return { ongoingExams: ongoing, upcomingExams: upcoming, finishedExams: finished };
  }, [masterData.exams, currentDate]);

  const isLoading = isSyncing || (activeProfile?.section && areEventsLoading);

  // Date navigation
  const goDatePrev = () => {
    setSlideAnim("s2-slide-right");
    setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() - 1); return d; });
    setTimeout(() => setSlideAnim(""), 350);
  };
  const goDateNext = () => {
    setSlideAnim("s2-slide-left");
    setCurrentDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + 1); return d; });
    setTimeout(() => setSlideAnim(""), 350);
  };

  if (isSyncing && (!masterData.courses || masterData.courses.length === 0)) {
    return (
      <div className="s2-loading-card">
        <div className="s2-spinner" />
        <span className="s2-loading-text">Syncing Schedule Data...</span>
      </div>
    );
  }

  return (
    <div className="s2-page">
      <h1 className="s2-page-title">Schedule</h1>

      {/* Preview Tag */}
      {activeProfile && userProfile && activeProfile.section !== userProfile.section && (
        <div className="s2-preview-tag">
          <RiInformationLine />
          <span>Previewing: <strong>{activeProfile.department}-{activeProfile.section}</strong></span>
        </div>
      )}

      {/* Header Row: Tabs (Left) + Date (Right) */}
      <div className="s2-header-row">
        <ViewTypeTabsRow activeTab={activeTab} onTabSelected={setActiveTab} />
        <DateSection
          date={currentDate}
          onPrev={goDatePrev}
          onNext={goDateNext}
          onDateChange={(d) => { setSlideAnim(""); setCurrentDate(d); }}
        />
      </div>
      <div className="s2-spacer-md" />

      {/* =================== CLASS TAB =================== */}
      {activeTab === "class" && (
        <div key={toISODate(currentDate)} className={`${slideAnim} s2-desktop-layout`}>

          {/* LEFT COLUMN: EXTRAS (Now on Left) */}
          <div className="s2-desktop-side">
            {/* Weekly Overview (Collapsible) */}
            <Collapsible
              title="Weekly Schedule"
              integratedContent={
                <DayTabsRow selectedDay={selectedDay} onDaySelected={setSelectedDay} />
              }
            >
              {masterData.timetable?.[selectedDay] && masterData.timetable[selectedDay].length > 0 ? (
                <div className="s2-schedule-list">
                  {masterData.timetable[selectedDay].map((code, index) => {
                    const details = getPeriodDetails(code, masterData.courses);
                    return (
                      <PeriodRow
                        key={index}
                        number={index + 1}
                        time={periodTimes[index] || ""}
                        entries={details.entries}
                        isLab={details.isLab}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyCard message={`No classes on ${selectedDay}`} />
              )}
              <div className="s2-spacer-lg" />
            </Collapsible>

            <div className="s2-spacer-sm" />

            {/* Course Directory (Collapsible) */}
            <Collapsible title="Academic Courses">
              <CourseDirectory courses={masterData.courses} />
              <div className="s2-spacer-lg" />
            </Collapsible>

            <div className="s2-spacer-sm" />

            {/* Staff Info */}
            <InfoCard
              title="Class Counselors"
              items={masterData.counseling?.counselors || []}
            />
            <InfoCard
              title="Key Coordinators"
              items={
                masterData.counseling?.coordinators
                  ? Object.entries(masterData.counseling.coordinators).map(([k, v]) => `${k}: ${v}`)
                  : []
              }
            />
          </div>

          {/* RIGHT COLUMN: TODAY'S SCHEDULE (Now on Right) */}
          <div className="s2-desktop-main">
            {isLoading ? (
              <div className="s2-loading-card">
                <div className="s2-spinner" />
                <span className="s2-loading-text">Loading Schedule...</span>
              </div>
            ) : (
              <>
                {/* Schedule Section Header */}
                <div className="s2-status-row s2-mobile-only">
                  <h2 className="s2-section-title">Schedule</h2>
                  <span className="s2-status-badge">
                    {todayNote.includes("Holiday") ? "HOLIDAY" : dayOrder ? dayOrder.toUpperCase() : "NO CLASS"}
                  </span>
                </div>

                {/* Full Day Event */}
                {displayConfig.showFullDayEvent && fullDayEvent && (
                  <>
                    <EventCard
                      tag="TODAY'S EVENT"
                      title={fullDayEvent.title}
                      subtitle={fullDayEvent.description || "Full Day Event"}
                      meta1="Full Day"
                      meta2="No Classes"
                    />
                    <NoticeCard title="Classes Suspended" message={displayConfig.suspensionReason} />
                  </>
                )}

                {/* Exam Card */}
                {displayConfig.showExamCard && activeExamToday && (
                  <ExamEventCard exam={activeExamToday} />
                )}

                {/* Half Day Event */}
                {displayConfig.showHalfDayEvent && halfDayEvent && (
                  <EventCard
                    tag="SPECIAL EVENT"
                    title={halfDayEvent.title}
                    subtitle={halfDayEvent.description || "Special Session"}
                    meta1={`${halfDayEvent.startTime || "09:00"} - ${halfDayEvent.endTime || "12:00"}`}
                    meta2="Event"
                  />
                )}

                {/* Timetable */}
                {displayConfig.showTimetable && todayPeriods.length > 0 && (
                  <div className="s2-schedule-list">
                    {todayPeriods.map((period, i) => (
                      <PeriodRow key={i} {...period} />
                    ))}
                  </div>
                )}

                {/* Suspension Notice */}
                {displayConfig.showSuspensionNotice && (
                  <NoticeCard title="Classes Suspended" message={displayConfig.suspensionReason} />
                )}

                {/* Empty State */}
                {!displayConfig.showFullDayEvent && !displayConfig.showExamCard &&
                  !displayConfig.showHalfDayEvent && !displayConfig.showTimetable &&
                  !displayConfig.showSuspensionNotice && (
                    <EmptyCard message={todayNote || "No schedule for this day."} />
                  )}
              </>
            )}
          </div>

        </div>
      )}

      {/* =================== EXAMS TAB =================== */}
      {activeTab === "exams" && (
        <div key={`exams-${toISODate(currentDate)}`} className={`${slideAnim} s2-desktop-layout`}>

          {/* LEFT COLUMN: UPCOMING & FINISHED (Now on Left) */}
          <div className="s2-desktop-side">
            {/* Upcoming */}
            {upcomingExams.length > 0 && (
              <>
                <h2 className="s2-section-title" style={{ padding: "0 0 8px" }}>Upcoming Exams</h2>
                {upcomingExams.map((exam, i) => (
                  <ExamScheduleCard key={i} exam={exam} courses={masterData.courses || []} />
                ))}
                <div className="s2-spacer-md" />
              </>
            )}

            {/* Finished (Collapsible) */}
            {finishedExams.length > 0 && (
              <Collapsible title="Finished Exams">
                {finishedExams.map((exam, i) => (
                  <ExamScheduleCard key={i} exam={exam} courses={masterData.courses || []} />
                ))}
                <div className="s2-spacer-md" />
              </Collapsible>
            )}

            {/* Spacer if empty side to maintain layout integrity if needed */}
            {upcomingExams.length === 0 && finishedExams.length === 0 && (
              <div className="s2-spacer-lg" />
            )}
          </div>

          {/* RIGHT COLUMN: ONGOING EXAMS (Now on Right) */}
          <div className="s2-desktop-main">
            {ongoingExams.length > 0 ? (
              <>
                <h2 className="s2-section-title" style={{ padding: "0 0 8px" }}>Ongoing Exams</h2>
                {ongoingExams.map((exam, i) => (
                  <ExamScheduleCard key={i} exam={exam} courses={masterData.courses || []} />
                ))}
              </>
            ) : (
              <>
                <EmptyCard message={
                  (upcomingExams.length > 0 || finishedExams.length > 0)
                    ? "No ongoing exams"
                    : "No exam timetables published for this section."
                } />
                <div className="s2-spacer-lg" />
              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Schedule;

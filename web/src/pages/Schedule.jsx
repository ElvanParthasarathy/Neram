import React, { useState, useEffect, useMemo, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { convertTo12Hour } from "../utils/timeUtils";

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
  RiComputerLine,
} from "react-icons/ri";

// ======================= HELPER FUNCTIONS =======================

const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const shortDays = ["Tue", "Wed", "Thu", "Fri", "Sat"];
export const periodTimes = [
  "09:00 - 09:50 AM", "09:50 - 10:40 AM", "10:50 - 11:40 AM", "11:40 - 12:30 PM",
  "01:30 - 02:20 PM", "02:20 - 03:10 PM", "03:20 - 04:10 PM", "04:10 - 05:00 PM"
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
  if (state.activeSpecialClass) {
    return {
      showSpecialClass: true,
      showFullDayEvent: false,
      showExamCard: false, 
      showHalfDayEvent: false,
      showTimetable: false,
      showSuspensionNotice: true,
      suspensionReason: `Classes suspended due to ${state.activeSpecialClass.typeTitle}.`
    };
  }

  if (state.fullDayEvent) {
    return {
      showFullDayEvent: true, showExamCard: false, showHalfDayEvent: false,
      showTimetable: false, showSuspensionNotice: false, showSpecialClass: false,
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

  return {
    showFullDayEvent: !state.fullDayEvent ? false : true,
    showExamCard: showExam,
    showHalfDayEvent: showHalfDay,
    showTimetable,
    showSuspensionNotice: showSuspended,
    showSpecialClass: !!state.activeSpecialClass,
    suspensionReason
  };
};

/** Format date for display */
const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return dateStr; }
};

export const formatDateLong = (date) => {
  return date.toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
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
export const DateSection = ({ date, onPrev, onNext, onDateChange, isMobile: isMobileProp }) => {
  const [calOpen, setCalOpen] = useState(false);
  const [isMobileLocal, setIsMobileLocal] = useState(false);
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileLocal;
  const wrapperRef = useRef(null);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Auto-detect mobile if prop not provided
  useEffect(() => {
    const check = () => setIsMobileLocal(window.matchMedia('(max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
        <input
          type="date"
          className="s2-mobile-date-input"
          value={date.toISOString().split('T')[0]}
          onChange={(e) => {
            if (e.target.value) {
              onDateChange(new Date(e.target.value));
            }
          }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0, cursor: 'pointer', zIndex: 10,
            width: '100%', height: '100%', display: isMobile ? 'block' : 'none'
          }}
        />
        <button className="s2-calendar-trigger-btn" onClick={() => !isMobile && setCalOpen(!calOpen)}>
          <RiCalendarEventLine />
        </button>
      </div>

      {calOpen && !isMobile && (
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
        {(meta1 || meta2) && (
          <div className="s2-event-meta">
            {meta1 && <span className="s2-meta-chip">{meta1Icon || <RiTimeLine />} {meta1}</span>}
            {meta2 && <span className="s2-meta-chip">{meta2Icon || <RiInformationLine />} {meta2}</span>}
          </div>
        )}
      </div>
    </div>
  </div>
);

/** Exam event card (same blue card but with trophy icon) */
export const ExamEventCard = ({ exam, specialClass }) => {
  if (specialClass) {
    return (
      <div className="s2-prac-today-cards">
        <div style={{ marginBottom: '0' }}>
          {/* Blue header card */}
          <div className="s2-event-card s2-fade-in" style={{ marginBottom: '12px' }}>
            <div className="s2-event-tag">{specialClass.typeTitle?.toUpperCase() || "SPECIAL CLASS"}</div>
            <div className="s2-event-content">
              <RiComputerLine className="s2-event-icon" />
              <div className="s2-event-info">
                <h3>{specialClass.title || "Scheduled for Today"}</h3>
                <p>{specialClass.desc || "Special classroom session or online meeting"}</p>
              </div>
            </div>
          </div>
          {/* Individual class cards */}
          <div className="s2-schedule-list">
            {(specialClass.batches || []).map((b, j) => (
              <div key={j} className="s2-period-row">
                <div className="s2-period-num">{b.circleLabel || (j + 1)}</div>
                <div className="s2-period-details">
                  <div className="s2-period-entry">
                    <div className="s2-course-code-row">
                      <span className="s2-course-code">
                        {convertTo12Hour(b.startTime)} - {convertTo12Hour(b.endTime)}
                      </span>
                    </div>
                    <div className="s2-course-name" style={{ marginTop: '4px' }}>
                      {b.subjectName}
                    </div>
                    <div className="s2-faculty" style={{ marginTop: '2px' }}>
                      {b.faculty} {b.subjectCode ? `• ${b.subjectCode}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isPractical = exam?.type === 'Practical';

  if (isPractical && exam?.todayBatches) {
    return (
      <div className="s2-prac-today-cards">
        {exam.todayBatches.map((tb, i) => (
          <div key={i} style={{ marginBottom: i < exam.todayBatches.length - 1 ? '24px' : '0' }}>
            {/* Blue header card — same style as standard exam */}
            <div className="s2-event-card s2-fade-in" style={{ marginBottom: '12px' }}>
              <div className="s2-event-tag">TODAY'S PRACTICAL EXAM</div>
              <div className="s2-event-content">
                <RiTrophyLine className="s2-event-icon" />
                <div className="s2-event-info">
                  <h3>{exam.title}</h3>
                  <p><strong>{tb.code}</strong>: {tb.subjectName}</p>
                </div>
              </div>
            </div>
            {/* Individual batch cards for this subject — PeriodRow style */}
            <div className="s2-schedule-list">
              {tb.batches.map((b, j) => (
                <div key={j} className="s2-period-row">
                  <div className="s2-period-num">{b.label || String.fromCharCode(65 + j)}</div>
                  <div className="s2-period-details">
                    <div className="s2-period-entry">
                      <div className="s2-course-code-row">
                        <span className="s2-course-code">
                          {convertTo12Hour(b.startTime)} - {convertTo12Hour(b.endTime)}
                        </span>
                      </div>
                      {b.registerRange && (
                        <div className="s2-course-name" style={{ marginTop: '4px' }}>
                          {b.registerRange}
                        </div>
                      )}
                      <div className="s2-faculty" style={{ marginTop: '2px' }}>
                        {b.totalCount ? `${b.totalCount} Students` : ''}{b.totalCount ? ' • ' : ''}{tb.code}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="s2-event-card s2-fade-in">
      <div className="s2-event-tag">TODAY'S EXAM</div>
      <div className="s2-event-content">
        <RiTrophyLine className="s2-event-icon" />
        <div className="s2-event-info">
          <h3>{exam.title}</h3>
          <p><strong>{exam.todaySub?.code}</strong>: {exam.subjectName}</p>
          <div className="s2-event-meta">
            <span className="s2-meta-chip"><RiTimeLine /> {convertTo12Hour(exam.todaySub?.startTime)} - {convertTo12Hour(exam.todaySub?.endTime)}</span>
            {exam.todaySub?.portion && (
              <span className="s2-meta-chip"><RiFilePaperLine /> {exam.todaySub.portion}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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

/** Collapsible date group for practical exams */
const PracDateGroup = ({ date, subGroups, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  useEffect(() => { setIsOpen(defaultOpen); }, [defaultOpen]);
  return (
    <div className="s2-prac-date-group">
      <div className="s2-prac-date-header" onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{formatDate(date)}</span>
        <div className={`s2-collapsible-icon ${isOpen ? 'open' : ''}`} style={{ fontSize: '16px' }}>
          <RiArrowDownSLine />
        </div>
      </div>
      <div className={`s2-collapsible-body-anim ${isOpen ? 'open' : ''}`}>
        <div className="s2-collapsible-body-inner">
          <div className="s2-collapsible-body-content" style={{ padding: '20px 0 8px 0' }}>
            {Object.entries(subGroups).map(([code, { name, batches }], si) => (
              <div key={si} className="s2-prac-subject-group">
                <div className="s2-prac-subject-hdr" style={{ marginBottom: '10px', padding: '0 8px' }}>
                  <span className="s2-prac-code">{code}</span>
                  <span className="s2-prac-name">{name}</span>
                </div>
                <div className="s2-prac-batch-list-circle">
                  {batches.map((b, bi) => (
                    <div key={bi} className="s2-period-row" style={{ marginBottom: '4px', padding: '8px 8px' }}>
                      <div className="s2-period-num">{b.label || String.fromCharCode(65 + b.idx)}</div>
                      <div className="s2-period-details">
                        <div className="s2-period-entry">
                          <div className="s2-course-code-row">
                            <span className="s2-course-code">{convertTo12Hour(b.startTime)} - {convertTo12Hour(b.endTime)}</span>
                          </div>
                          {b.registerRange && (
                            <div className="s2-course-name" style={{ fontSize: '11.5px', color: 'var(--mac-text)', marginTop: '3px' }}>{b.registerRange}</div>
                          )}
                          {b.totalCount && (
                            <div className="s2-faculty" style={{ marginTop: '2px' }}>{b.totalCount} Students</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Exam schedule card — collapsible */
const ExamScheduleCard = ({ exam, courses, defaultExpanded = false, viewDate }) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const isPractical = exam.type === 'Practical';
  const dateRange = exam.startDate && exam.endDate
    ? `${formatDate(exam.startDate)} — ${formatDate(exam.endDate)}`
    : '';

  return (
    <div className="s2-exam-card s2-fade-in" style={{ marginBottom: '10px' }}>
      <div className="s2-exam-header" onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer', marginBottom: isOpen ? undefined : 0 }}>
        <RiTrophyLine className="s2-exam-header-icon" />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 className="s2-exam-title" style={{ margin: 0 }}>{exam.title}</h3>
          </div>
          {dateRange && <p className="s2-exam-type" style={{ marginTop: '2px' }}>{dateRange}</p>}
        </div>
        <div className={`s2-collapsible-icon ${isOpen ? 'open' : ''}`} style={{ marginLeft: '8px' }}>
          <RiArrowDownSLine />
        </div>
      </div>

      <div className={`s2-collapsible-body-anim ${isOpen ? 'open' : ''}`}>
        <div className="s2-collapsible-body-inner">
          <div className="s2-collapsible-body-content" style={{ padding: '0' }}>
            {exam.subjects && exam.subjects.length > 0 ? (
              isPractical ? (
                (() => {
                  const allEntries = [];
                  (exam.subjects || []).forEach(sub => {
                    (sub.batches || []).forEach((b, j) => {
                      allEntries.push({ ...b, subCode: sub.code, subName: getCleanSubjectName(sub.code, courses), idx: j });
                    });
                  });
                  const dateGroups = {};
                  allEntries.forEach(e => { const d = e.date || 'Unknown'; if (!dateGroups[d]) dateGroups[d] = []; dateGroups[d].push(e); });
                  const todayStr = viewDate ? toISODate(viewDate) : "";
                  const sortedGroups = Object.entries(dateGroups).sort((a, b) => {
                    const dateA = a[0];
                    const dateB = b[0];
                    const scoreA = dateA === todayStr ? 0 : dateA > todayStr ? 1 : 2;
                    const scoreB = dateB === todayStr ? 0 : dateB > todayStr ? 1 : 2;
                    if (scoreA !== scoreB) return scoreA - scoreB;
                    return dateA.localeCompare(dateB);
                  });
                  
                  return sortedGroups.map(([date, entries], gi) => {
                    const subGroups = {};
                    entries.forEach(e => { if (!subGroups[e.subCode]) subGroups[e.subCode] = { name: e.subName, batches: [] }; subGroups[e.subCode].batches.push(e); });
                    return (
                      <PracDateGroup key={gi} date={date} subGroups={subGroups} defaultOpen={viewDate ? date === todayStr : false} />
                    );
                  });
                })()
              ) : (
                exam.subjects.map((sub, i) => (
                  <div key={i} className="s2-exam-subject-row">
                    <div className="s2-period-num">{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div className="s2-exam-date">{formatDate(sub.date)}</div>
                      <div className="s2-exam-code-name">{sub.code}: {getCleanSubjectName(sub.code, courses)}</div>
                      <div className="s2-exam-time-portion">
                        <span>{convertTo12Hour(sub.startTime)} - {convertTo12Hour(sub.endTime)}</span>
                        {sub.portion && <span>  •  {sub.portion}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              <p className="s2-exam-empty">No subjects scheduled</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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

const Schedule = ({ globalData, userProfile, activeProfile, isMobile }) => {
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
    const today = new Date().toLocaleDateString("en-GB", { weekday: "long" });
    return daysOrder.includes(today) ? today : "Tuesday";
  });

  // --- Fetch section events ---
  useEffect(() => {
    const todayStr = toISODate(currentDate);
    if (activeProfile?.section) {
      setAreEventsLoading(true);
      const { batch, department, section } = activeProfile;
      const sectionEventsRef = ref(db, `list_events/${batch}/${department}/${section}`);
      const unsub = onValue(sectionEventsRef, (snap) => {
        const data = snap.val() || [];
        const rawEvents = Array.isArray(data) ? data : Object.values(data);
        const flattenedToday = [];
        rawEvents.forEach(group => {
            if (group.events && Array.isArray(group.events)) {
                group.events.forEach(ev => {
                    if (ev.date === todayStr) {
                        const { events: _ignored, scopes: _s, ...groupRest } = group;
                        flattenedToday.push({ ...groupRest, ...ev, title: ev.title || group.title });
                    }
                });
            } else {
                if (todayStr >= (group.startDate || group.date) && todayStr <= (group.endDate || group.date)) {
                    flattenedToday.push(group);
                }
            }
        });
        setSectionEvents(flattenedToday);
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
    const gEvents = allCalendar.filter(e => todayStr >= (e.startDate || e.date) && todayStr <= (e.endDate || e.date));
    setGlobalEvents(gEvents);

    // Exam logic
    const currentPeriod = masterData.exams?.find(ex => todayStr >= ex.startDate && todayStr <= ex.endDate);
    setActiveExamPeriod(currentPeriod || null);

    if (currentPeriod) {
      if (currentPeriod.type === 'Practical') {
        // Practical: find subjects with batches matching today
        const todayBatches = (currentPeriod.subjects || []).map(sub => {
          const matchingBatches = (sub.batches || []).filter(b => b.date === todayStr);
          if (matchingBatches.length === 0) return null;
          return { code: sub.code, subjectName: getCleanSubjectName(sub.code, masterData.courses), batches: matchingBatches };
        }).filter(Boolean);
        setActiveExamToday(todayBatches.length > 0 ? { ...currentPeriod, todayBatches, subjectName: todayBatches[0]?.subjectName } : null);
      } else {
        const subToday = currentPeriod.subjects?.find(s => s.date === todayStr);
        setActiveExamToday(subToday ? { ...currentPeriod, todaySub: subToday, subjectName: getCleanSubjectName(subToday.code, masterData.courses) } : null);
      }
    } else {
      setActiveExamToday(null);
    }

    // Day order
    const hol = gEvents.find(e => e.type === "Holiday" || e.title.toLowerCase().includes("holiday"));
    const acEvt = gEvents.find(e => e.type === "Academic");
    const workingDayEvent = gEvents.find(e => 
      e.type === 'Event' || 
      e.title.toLowerCase().includes('working day') || 
      e.title.toLowerCase().includes('order')
    );
    const specialClassToday = (masterData.specialClasses || []).find(sc => sc.date === todayStr);

    if (specialClassToday) {
      setTodayNote(`Special Schedule: ${specialClassToday.typeTitle}`);
      setDayOrder("SPECIAL");
    } else if (hol) {
      setTodayNote(`Holiday: ${hol.title}`);
      setDayOrder("");
    } else if (acEvt) {
      setTodayNote(`Occasion: ${acEvt.title}`);
      setDayOrder("");
    } else if (workingDayEvent) {
      const order = ["Monday", ...daysOrder].find(day => workingDayEvent.title.includes(day));
      const weekday = currentDate.getDay();
      const fallback = ["Monday", ...daysOrder][weekday - 1] || "";
      const finalOrder = order || (fallback === "Monday" ? "" : fallback);
      setDayOrder(finalOrder);
      setTodayNote(order ? `Following ${order} Order.` : `Working Day (${finalOrder})`);
    } else {
      const weekday = currentDate.getDay();
      setTodayNote(weekday === 0 ? "Today is Sunday. No classes." : "No Academic Calendar Scheduled");
      setDayOrder("");
    }
  }, [currentDate, globalData, allCalendar, masterData]);

  const fullDayEvent = sectionEvents.find(e => e.type === "FullDay" || (e.type === "Event" && e.fullTime === "All Day"));
  const halfDayEvent = sectionEvents.find(e => e.type === "HalfDay" || (e.type === "Event" && e.fullTime !== "All Day"));

  // Build periods for today
  const todayPeriods = useMemo(() => {
    if (!dayOrder || !masterData.timetable?.[dayOrder]) return [];
    return masterData.timetable[dayOrder].map((code, index) => {
      const details = getPeriodDetails(code, masterData.courses);
      return { number: index + 1, time: periodTimes[index] || "", entries: details.entries, isLab: details.isLab };
    });
  }, [dayOrder, masterData]);

  // Detect special class for current date
  const activeSpecialClass = useMemo(() => {
    const todayStr = toISODate(currentDate);
    return (masterData.specialClasses || []).find(sc => sc.date === todayStr);
  }, [masterData.specialClasses, currentDate]);

  // Schedule display config
  const scheduleState = {
    fullDayEvent,
    halfDayEvent,
    todayExam: activeExamToday,
    activeExamPeriod,
    activeSpecialClass,
    periods: todayPeriods
  };
  const displayConfig = calculateDisplayConfig(scheduleState);

  const { ongoingExams, upcomingExams, finishedExams } = useMemo(() => {
    const todayStr = toISODate(currentDate);
    const allExams = masterData.exams || [];
    const ongoing = [], upcoming = [], finished = [];
    allExams.forEach(exam => {
      try {
        if (exam.startDate && exam.endDate) {
          if (todayStr >= exam.startDate && todayStr <= exam.endDate) ongoing.push(exam);
          else if (todayStr < exam.startDate) upcoming.push(exam);
          else finished.push(exam);
        } else finished.push(exam);
    } catch { finished.push(exam); }
    });
    return {
      ongoingExams: ongoing,
      upcomingExams: upcoming.sort((a, b) => (a.startDate || "").localeCompare(b.startDate || "")),
      finishedExams: finished.sort((a, b) => (b.endDate || b.startDate || "").localeCompare(a.endDate || a.startDate || ""))
    };
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
          isMobile={isMobile}
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

                {/* Special Class Card */}
                {displayConfig.showSpecialClass && activeSpecialClass && (
                  <ExamEventCard specialClass={activeSpecialClass} />
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
                    {...(halfDayEvent.type !== "Event" ? {
                      meta1: `${convertTo12Hour(halfDayEvent.startTime || "09:00")} - ${convertTo12Hour(halfDayEvent.endTime || "12:00")}`,
                      meta2: "Event"
                    } : {})}
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
        <div key={toISODate(currentDate)} className={`${slideAnim} s2-desktop-layout`}>

          {/* LEFT COLUMN: UPCOMING & FINISHED */}
          <div className="s2-desktop-side">
            {/* Upcoming */}
            {upcomingExams.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h2 className="s2-section-title" style={{ padding: '0 0 8px' }}>Upcoming Exams</h2>
                {upcomingExams.map((exam, i) => (
                  <ExamScheduleCard key={i} exam={exam} courses={masterData.courses || []} defaultExpanded={false} viewDate={currentDate} />
                ))}
              </div>
            )}

            {/* Finished */}
            {finishedExams.length > 0 && (
              <Collapsible title="Finished Exams">
                {finishedExams.map((exam, i) => (
                  <ExamScheduleCard key={i} exam={exam} courses={masterData.courses || []} defaultExpanded={false} viewDate={currentDate} />
                ))}
              </Collapsible>
            )}

            {upcomingExams.length === 0 && finishedExams.length === 0 && (
              <div className="s2-spacer-lg" />
            )}
          </div>

          {/* RIGHT COLUMN: ONGOING */}
          <div className="s2-desktop-main">
            {ongoingExams.length > 0 ? (
              <>
                <h2 className="s2-section-title" style={{ padding: '0 0 8px' }}>Ongoing Exams</h2>
                {ongoingExams.map((exam, i) => (
                  <ExamScheduleCard key={i} exam={exam} courses={masterData.courses || []} defaultExpanded={true} viewDate={currentDate} />
                ))}
              </>
            ) : (
              <EmptyCard message={
                (upcomingExams.length > 0 || finishedExams.length > 0)
                  ? "No ongoing exams"
                  : "No exam timetables published for this section."
              } />
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default Schedule;

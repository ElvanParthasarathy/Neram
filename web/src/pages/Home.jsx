import React, { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../firebase";
import { ref, update, onValue } from "firebase/database";
import "../styles/home.css";
import "../styles/schedule2.css"; // Ensure schedule styles are available
import { PeriodRow, getPeriodDetails, periodTimes, DateSection, EventCard, ExamEventCard, NoticeCard } from "./Schedule"; // Import shared components
import {
    RiCalendarEventLine,
    RiCalendarLine,
    RiTimeLine,
    RiFilePaperLine,
    RiInformationLine,
    RiTrophyLine,
    RiEditLine,
    RiUserVoiceLine,
} from "react-icons/ri";

/* =====================================================================
   Home2 — Kotlin-parity Home Dashboard
   Port of HomeScreen.kt / HomeLayout.kt / HomeComponents.kt
   ===================================================================== */

const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const Home = ({
    isAdmin = false,
    globalData,
    userProfile,
    activeProfile,
    hideHeader = false,
}) => {
    // ---------- STATE ----------
    const [currentDate, setCurrentDate] = useState(new Date());
    const { masterData = {}, allCalendar = [], sectionUpdates = {}, isSyncing } =
        globalData || {};

    const [dayOrder, setDayOrder] = useState("");
    const [scheduleStatus, setScheduleStatus] = useState("");

    const [globalEvents, setGlobalEvents] = useState([]);
    const [sectionEvts, setSectionEvts] = useState([]);

    const todayEvents = useMemo(() => {
        const combined = [...globalEvents, ...sectionEvts];
        return Array.from(
            new Map(combined.map((i) => [i.id || i.title, i])).values()
        );
    }, [globalEvents, sectionEvts]);

    const [activeExamPeriod, setActiveExamPeriod] = useState(null);
    const [activeExamToday, setActiveExamToday] = useState(null);

    // Editing state
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [tempNote, setTempNote] = useState("");
    const [isEditingGeneral, setIsEditingGeneral] = useState(false);
    const [tempGeneral, setTempGeneral] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const [areEventsLoading, setAreEventsLoading] = useState(true);
    const [slideAnim, setSlideAnim] = useState("");

    // Calendar dropdown
    const [calOpen, setCalOpen] = useState(false);
    const calDropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (calDropdownRef.current && !calDropdownRef.current.contains(e.target))
                setCalOpen(false);
        };
        if (calOpen) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [calOpen]);

    const handlePrevDay = () => {
        setSlideAnim("h2-slide-right");
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 1);
        setCurrentDate(d);
        setTimeout(() => setSlideAnim(""), 350);
    };

    const handleNextDay = () => {
        setSlideAnim("h2-slide-left");
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 1);
        setCurrentDate(d);
        setTimeout(() => setSlideAnim(""), 350);
    };

    // ---------- HELPERS ----------
    const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
    };

    const todayStr = formatDate(currentDate);

    const convertTo12Hour = (t) => {
        if (!t) return "";
        const [hours, minutes] = t.split(":");
        let h = parseInt(hours, 10);
        const m = minutes || "00";
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
    };

    // ---------- LIVE UPDATE DATA ----------
    const liveUpdateData = sectionUpdates?.live?.[todayStr] || {};
    let liveUpdateNote = liveUpdateData.note || "";
    const liveUpdateAuthor = liveUpdateData.author || "";

    const generalData = sectionUpdates?.general || {};
    const generalText = generalData.text || "";
    const generalAuthor = generalData.author || "";

    // ---------- AUTOMATED NOTICES (KOTLIN PARITY) ----------
    const getSubjectName = (code) =>
        masterData.courses?.find((c) => c.code === code)?.name || "General Subject";

    const isLabCourse = (code) => {
        if (!code || !masterData.courses) return false;
        if (code.includes("/"))
            return code
                .split("/")
                .some((p) => isLabCourse(p.trim()));
        const trimmed = code.trim();
        const course = masterData.courses.find(
            (c) => c.code === trimmed.split(" ")[0]
        );
        if (course) {
            if (
                course.name.toLowerCase().includes("lab") ||
                course.type?.toLowerCase().includes("lab")
            )
                return true;
        }
        const parts = trimmed.split(" ");
        if (parts.length > 1 && /^[A-Za-z]\d+$/.test(parts[1])) return true;
        return trimmed.toLowerCase().includes("lab");
    };

    const currentExamPeriod = masterData.exams?.find(
        (ex) => todayStr >= ex.startDate && todayStr <= ex.endDate
    );
    const isExamToday = currentExamPeriod?.subjects?.some(
        (s) => s.date === todayStr
    );
    const examTitle = currentExamPeriod?.title?.toLowerCase() || "";
    const isCycleTest = examTitle.includes("cycle test");
    const isMajorExam = isExamToday && !isCycleTest;

    let hasLabToday = false;
    const eventsForDay = allCalendar?.filter((e) => e.date === todayStr) || [];
    const holidayEvent = eventsForDay.find((e) =>
        e.title.toLowerCase().includes("holiday")
    );

    if (!holidayEvent && !isMajorExam) {
        let tempOrder = "";
        const manualOrderEvent = eventsForDay.find((e) =>
            e.title.toLowerCase().includes("order")
        );
        const weekdayName = currentDate.toLocaleDateString("en-US", {
            weekday: "long",
        });
        if (manualOrderEvent) {
            const foundDay = ["Monday", ...daysOrder].find((d) =>
                manualOrderEvent.title.includes(d)
            );
            tempOrder = foundDay || (weekdayName === "Sunday" ? "" : weekdayName);
        } else {
            tempOrder = weekdayName === "Sunday" ? "" : weekdayName;
        }
        if (tempOrder && masterData.timetable?.[tempOrder]) {
            hasLabToday = masterData.timetable[tempOrder].some((c) => isLabCourse(c));
        }
    }

    const automatedNotices = [];
    if (hasLabToday)
        automatedNotices.push("📚 Bring Labcoats, Laptops & Lab Essentials");
    if (isExamToday)
        automatedNotices.push(
            "📖 Study well for the test! Score well and get full marks! All the best! 🎯"
        );
    if (automatedNotices.length > 0) {
        const combo = automatedNotices.join("\n\n");
        liveUpdateNote = liveUpdateNote ? `${liveUpdateNote}\n\n${combo}` : combo;
    }
    if (!liveUpdateNote) liveUpdateNote = "No special updates for today.";

    // ---------- LOGIC RESOLUTION ----------
    useEffect(() => {
        if (!allCalendar || !masterData) return;
        const events = allCalendar.filter((e) => e.date === todayStr);
        setGlobalEvents(events);

        const cp = masterData.exams?.find(
            (ex) => todayStr >= ex.startDate && todayStr <= ex.endDate
        );
        setActiveExamPeriod(cp || null);
        if (cp) {
            const sub = cp.subjects?.find((s) => s.date === todayStr);
            setActiveExamToday(sub ? { ...cp, todaySub: sub } : null);
        } else {
            setActiveExamToday(null);
        }

        const weekdayName = currentDate.toLocaleDateString("en-US", {
            weekday: "long",
        });
        const hol = events.find((e) => e.title.toLowerCase().includes("holiday"));
        const manual = events.find((e) =>
            e.title.toLowerCase().includes("order")
        );

        let ro = "";
        let rs = "";
        if (hol) {
            ro = "";
            rs = "Holiday";
        } else if (manual) {
            const found = ["Monday", ...daysOrder].find((d) =>
                manual.title.includes(d)
            );
            if (found) {
                ro = found;
                rs = `Following ${found} Order`;
            } else {
                ro = weekdayName === "Sunday" ? "" : weekdayName;
                rs = `Regular ${ro}`;
            }
        } else {
            if (weekdayName === "Sunday") {
                ro = "";
                rs = "Holiday";
            } else {
                ro = weekdayName;
                rs = `Regular ${weekdayName}`;
            }
        }
        setDayOrder(ro);
        setScheduleStatus(rs);
    }, [currentDate, allCalendar, masterData, todayStr]);

    // ---------- SECTION EVENTS ----------
    useEffect(() => {
        if (activeProfile?.section && todayStr) {
            setAreEventsLoading(true);
            const { batch, department, section } = activeProfile;
            const sRef = ref(db, `events/${batch}/${department}/${section}`);
            const unsub = onValue(sRef, (snap) => {
                const data = snap.val() || [];
                const arr = Array.isArray(data) ? data : Object.values(data);
                setSectionEvts(arr.filter((e) => e.date === todayStr));
                setAreEventsLoading(false);
            });
            return () => unsub();
        } else {
            setSectionEvts([]);
            setAreEventsLoading(false);
        }
    }, [activeProfile, todayStr]);

    const fullDayEvent = todayEvents.find((e) => e.type === "FullDay");
    const halfDayEvent = todayEvents.find((e) => e.type === "HalfDay");

    // ---------- SAVE ACTIONS ----------
    const handleSaveNote = async () => {
        if (!activeProfile) return;
        const { batch, department, section } = activeProfile;
        setIsSaving(true);
        try {
            await update(
                ref(db, `updates/${batch}/${department}/${section}/daily_update/${todayStr}`),
                { note: tempNote, author: userProfile?.displayName || "Admin" }
            );
            setIsEditingNote(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveGeneral = async () => {
        if (!activeProfile) return;
        const { batch, department, section } = activeProfile;
        setIsSaving(true);
        try {
            await update(ref(db, `updates/${batch}/${department}/${section}`), {
                general_text: tempGeneral,
                general_author: userProfile?.displayName || "Admin",
            });
            setIsEditingGeneral(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    // ---------- KOTLIN-PARITY COURSE RESOLVER ----------


    // ---------- EVENT CLASS ----------
    const getEventClass = (event) => {
        const t = event.title.toLowerCase();
        if (t.includes("holiday")) return "holiday";
        if (
            t.includes("exam") ||
            t.includes("test") ||
            t.includes("sia") ||
            t.includes("fia")
        )
            return "exam";
        if (t.includes("working day") && t.includes("order")) return "order";
        if (event.type === "FullDay" || event.type === "HalfDay" || event.isSection)
            return "special";
        return "default";
    };

    // ======================= RENDER =======================
    return (
        <div className="h2-view">
            <h1 className="h2-page-title">Home Dashboard</h1>
            <div className="h2-container">
                {/* ========== 1. HEADER — Kotlin PageHeader Pill ========== */}
                {!hideHeader && activeProfile?.section !== userProfile?.section && (
                    <div className="h2-page-header">
                        {/* Preview Tag (when viewing another section) */}
                        <div className="h2-preview-tag" style={{ marginTop: 0, marginBottom: 16 }}>
                            <RiInformationLine />
                            <span>
                                Viewing Preview:{" "}
                                <strong>
                                    {activeProfile?.department}-{activeProfile?.section}
                                </strong>
                            </span>
                        </div>
                    </div>
                )}

                <div className="h2-content-grid">
                    {/* ========== LEFT COLUMN (Was Right) ========== */}
                    <div className="h2-col-left">
                        {/* ========== PROFILE CARD (Static) ========== */}
                        <div className="h2-profile-section">
                            <div className="h2-section-title">Profile</div>
                            <div className="h2-profile-pill">
                                <div className="h2-avatar">
                                    {userProfile?.photoURL ? (
                                        <img
                                            src={userProfile.photoURL}
                                            alt="Profile"
                                            className="h2-avatar-img"
                                        />
                                    ) : (
                                        <span className="h2-avatar-emoji">👤</span>
                                    )}
                                </div>
                                <div className="h2-greeting-col">
                                    <div className="h2-greeting-row">
                                        <span className="h2-greeting-text">Vanakkam!</span>
                                        <span className="h2-sparkle">✨</span>
                                    </div>
                                    <span className="h2-user-name">
                                        {userProfile?.displayName || "Student"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ANIMATED SIDEBAR CONTENT */}
                        <div key={`side-${todayStr}`} className={slideAnim} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* ========== 3. ACADEMIC CALENDAR (Kotlin Grouped Card) ========== */}
                            <div className="h2-calendar-section">
                                <div className="h2-section-title">Academic Calendar</div>
                                <div className="h2-grouped-card">
                                    {todayEvents.length > 0 ? (
                                        todayEvents.map((ev, i) => (
                                            <React.Fragment key={i}>
                                                <div className="h2-event-row">
                                                    <div className={`h2-event-bar ${getEventClass(ev)}`} />
                                                    <div className="h2-event-details">
                                                        <p className="h2-event-title-text">{ev.title}</p>
                                                        <p className="h2-event-time-text">
                                                            {ev.fullTime || "All Day"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Add divider except for the last item */}
                                                {i < todayEvents.length - 1 && <div className="h2-event-divider" />}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <div className="h2-empty-events">Regular Working Day</div>
                                    )}
                                </div>
                            </div>

                            {/* ========== 5. LIVE UPDATES (Kotlin EditableSection) ========== */}
                            <div className="h2-editable-section">
                                <div className="h2-section-header">
                                    <div className="h2-section-title">
                                        Live Updates ({activeProfile?.section})
                                    </div>
                                    {!isEditingNote && (
                                        <button
                                            className="h2-edit-trigger"
                                            onClick={() => {
                                                setTempNote(liveUpdateNote);
                                                setIsEditingNote(true);
                                            }}
                                        >
                                            <RiEditLine /> Edit
                                        </button>
                                    )}
                                </div>
                                {isEditingNote ? (
                                    <div className="h2-edit-form">
                                        <textarea
                                            className="h2-edit-textarea"
                                            value={tempNote}
                                            onChange={(e) => setTempNote(e.target.value)}
                                            placeholder="Type update for today..."
                                        />
                                        <div className="h2-form-buttons">
                                            <button
                                                onClick={handleSaveNote}
                                                disabled={isSaving}
                                                className="h2-save-btn"
                                            >
                                                {isSaving ? (
                                                    <div className="h2-btn-spinner" />
                                                ) : (
                                                    "Save"
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingNote(false)}
                                                disabled={isSaving}
                                                className="h2-cancel-btn"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h2-message-surface">
                                            <p className="h2-message-body">{liveUpdateNote}</p>
                                        </div>
                                        {liveUpdateAuthor && (
                                            <div className="h2-author-row">
                                                <span className="h2-author-pill">
                                                    Posted by <RiUserVoiceLine /> {liveUpdateAuthor}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* ========== 6. GENERAL NOTICE (Kotlin EditableSection) ========== */}
                            <div className="h2-editable-section">
                                <div className="h2-section-header">
                                    <div className="h2-section-title">General Notice</div>
                                    {!isEditingGeneral && (
                                        <button
                                            className="h2-edit-trigger"
                                            onClick={() => {
                                                setTempGeneral(generalText);
                                                setIsEditingGeneral(true);
                                            }}
                                        >
                                            <RiEditLine /> Edit
                                        </button>
                                    )}
                                </div>
                                {isEditingGeneral ? (
                                    <div className="h2-edit-form">
                                        <textarea
                                            className="h2-edit-textarea"
                                            value={tempGeneral}
                                            onChange={(e) => setTempGeneral(e.target.value)}
                                            placeholder="Type general notice..."
                                        />
                                        <div className="h2-form-buttons">
                                            <button
                                                onClick={handleSaveGeneral}
                                                disabled={isSaving}
                                                className="h2-save-btn"
                                            >
                                                {isSaving ? (
                                                    <div className="h2-btn-spinner" />
                                                ) : (
                                                    "Save"
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setIsEditingGeneral(false)}
                                                disabled={isSaving}
                                                className="h2-cancel-btn"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="h2-message-surface">
                                            <p className="h2-message-body">
                                                {generalText || "No general notices."}
                                            </p>
                                        </div>
                                        {generalAuthor && (
                                            <div className="h2-author-row">
                                                <span className="h2-author-pill">
                                                    Posted by <RiUserVoiceLine /> {generalAuthor}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* ========== 7. ACADEMIC DETAILS (Static) ========== */}
                        <div className="h2-info-grid" style={{ marginTop: '32px' }}>
                            <div className="h2-academic-card">
                                <span className="h2-info-label">Batch</span>
                                <span className="h2-info-value">{activeProfile?.batch}</span>
                            </div>
                            <div className="h2-academic-card">
                                <span className="h2-info-label">Dept</span>
                                <span className="h2-info-value">
                                    {activeProfile?.department}
                                </span>
                            </div>
                            <div className="h2-academic-card">
                                <span className="h2-info-label">Sec</span>
                                <span className="h2-info-value">{activeProfile?.section}</span>
                            </div>
                        </div>
                    </div>

                    {/* ========== RIGHT COLUMN (Was Left) ========== */}
                    <div className="h2-col-right">

                        {/* ========== 2. DATE SECTION (Static) ========== */}
                        <div className="h2-date-section">
                            <div className="h2-section-title">Select date</div>
                            <DateSection
                                date={currentDate}
                                onPrev={handlePrevDay}
                                onNext={handleNextDay}
                                onDateChange={(d) => { setSlideAnim(""); setCurrentDate(d); }}
                            />
                        </div>

                        {/* ANIMATED CONTENT KEYED BY DATE */}
                        <div key={todayStr} className={slideAnim}>
                            {/* 4. SCHEDULE */}
                            <div className="h2-timetable-section">
                                <div className="h2-schedule-header">
                                    <div className="h2-section-title">Schedule</div>
                                    <span className="h2-status-badge">{scheduleStatus}</span>
                                </div>

                                {isSyncing || areEventsLoading ? (
                                    <div className="h2-loading-card">
                                        <div className="h2-spinner" />
                                        <span>Checking Schedule...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* 4a. FULL DAY EVENT */}
                                        {fullDayEvent ? (
                                            <>
                                                <EventCard
                                                    tag="TODAY'S EVENT"
                                                    title={fullDayEvent.title}
                                                    subtitle={fullDayEvent.description || "Full Day Event"}
                                                    meta1="Full Day"
                                                    meta1Icon={<RiTimeLine />}
                                                />
                                                <NoticeCard
                                                    title="Classes Suspended"
                                                    message={`Day reserved for ${fullDayEvent.title}.`}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                {/* 4b. EXAM CARD */}
                                                {activeExamToday && (
                                                    <ExamEventCard
                                                        exam={{
                                                            title: activeExamToday.title,
                                                            subjectName: getSubjectName(activeExamToday.todaySub.code),
                                                            todaySub: {
                                                                ...activeExamToday.todaySub,
                                                                startTime: convertTo12Hour(activeExamToday.todaySub.startTime),
                                                                endTime: convertTo12Hour(activeExamToday.todaySub.endTime)
                                                            }
                                                        }}
                                                    />
                                                )}

                                                {/* 4c. HALF DAY */}
                                                {halfDayEvent && !activeExamToday && (
                                                    <EventCard
                                                        tag="SPECIAL EVENT"
                                                        title={halfDayEvent.title}
                                                        subtitle={halfDayEvent.description || "Special Session"}
                                                        meta1={`${convertTo12Hour(halfDayEvent.startTime || "09:00")} - ${convertTo12Hour(halfDayEvent.endTime || "12:00")}`}
                                                        meta1Icon={<RiTimeLine />}
                                                        meta2="Event"
                                                        meta2Icon={<RiInformationLine />}
                                                    />
                                                )}

                                                {/* 4d. TIMETABLE or SUSPENDED (Kotlin List Style) */}
                                                {!activeExamPeriod ||
                                                    activeExamPeriod.type.includes("CT") ? (
                                                    dayOrder && masterData.timetable?.[dayOrder] ? (
                                                        <div className="h2-schedule-list">
                                                            {masterData.timetable[dayOrder].map((rawCode, index) => {
                                                                const { entries, isLab } = getPeriodDetails(rawCode, masterData.courses);
                                                                return (
                                                                    <PeriodRow
                                                                        key={index}
                                                                        number={index + 1}
                                                                        time={periodTimes[index]}
                                                                        entries={entries}
                                                                        isLab={isLab}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="h2-no-classes">
                                                            <p className="h2-no-classes-title">
                                                                No classes scheduled.
                                                            </p>
                                                            <p className="h2-no-classes-sub">{scheduleStatus}</p>
                                                        </div>
                                                    )
                                                ) : (
                                                    <NoticeCard
                                                        title="Classes Suspended"
                                                        message={`Suspended for ${activeExamPeriod.title}.`}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;

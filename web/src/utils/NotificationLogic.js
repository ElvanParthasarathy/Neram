export class NotificationLogic {
    constructor(dispatchNotification, globalData, userProfile) {
        this.dispatch = dispatchNotification;
        this.globalData = globalData;
        this.userProfile = userProfile;
    }

    loadPref(key, def = true) {
        const saved = localStorage.getItem(`neram-notif-${key}`);
        return saved !== null ? saved === "true" : def;
    }

    loadTimePref(key, def = "00:00") {
        const saved = localStorage.getItem(`neram-notif-${key}`);
        return saved !== null ? saved : def;
    }

    checkTimeTriggers() {
        const now = new Date();
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHour}:${currentMinute}`;

        const todayDateStr = now.toISOString().split('T')[0];

        // 1. Load User Settings
        const useCustomTimes = this.loadPref("use_custom_times", false);
        const time1 = useCustomTimes ? this.loadTimePref("custom_time_1", "05:30") : "05:30";
        const time2 = useCustomTimes ? this.loadTimePref("custom_time_2", "06:30") : "06:30";
        const time3 = useCustomTimes ? this.loadTimePref("custom_time_3", "07:30") : "07:30";

        // Toggles
        const dailyUpdate = this.loadPref("daily_update", true);
        const generalNotice = this.loadPref("general_notice", true);
        const classSchedule = this.loadPref("class_schedule", true);
        const labReminders = this.loadPref("lab_reminders", true);
        const examAlerts = this.loadPref("exam_alerts", true);

        // 2. Check Match
        if (currentTime === time1) {
            this.fireMorningWake(todayDateStr, dailyUpdate, generalNotice, examAlerts);
        } else if (currentTime === time2) {
            this.firePreCollege(todayDateStr, classSchedule, labReminders);
        } else if (currentTime === time3) {
            this.fireCollegeEntry();
        }
    }

    // --- Helpers to Avoid Duplicate Fires on the same day ---
    hasFired(key, dateStr) {
        const fired = localStorage.getItem(`neram-fired-${key}-${dateStr}`);
        return fired === "true";
    }

    markFired(key, dateStr) {
        localStorage.setItem(`neram-fired-${key}-${dateStr}`, "true");
    }

    // === TRIGGERS ===

    fireMorningWake(dateStr, showDaily, showNotice, showExams) {
        if (this.hasFired("morning", dateStr)) return;

        let sentAny = false;

        // General Notice (Live Updates from DB)
        if (showNotice && this.globalData?.sectionUpdates?.general?.text) {
            this.dispatch("📢 Important Notice", this.globalData.sectionUpdates.general.text);
            sentAny = true;
        }

        // Exam Alerts (check if exam is today)
        if (showExams && this.globalData?.masterData?.exams) {
            const todayExams = this.globalData.masterData.exams.filter(e => e.date === dateStr);
            if (todayExams.length > 0) {
                this.dispatch(
                    "📝 Exam Today!",
                    `${todayExams[0].title} - Best of luck! Preparation is the key.`
                );
                sentAny = true;
            }
        }

        // Fallback or Daily Update if no other major alerts were sent, but daily is enabled
        if (showDaily && !sentAny) {
            this.dispatch("🌅 Good Morning", "Have a great day at college! Check your schedule for today.");
        }

        this.markFired("morning", dateStr);
    }

    firePreCollege(dateStr, showSchedule, showLabs) {
        if (this.hasFired("precollege", dateStr)) return;

        const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
        const todayTimetable = this.globalData?.masterData?.timetable?.[dayOfWeek];

        if (!todayTimetable) return;

        // Lab Reminders
        if (showLabs) {
            const userBatch = this.userProfile?.batch || ""; // e.g., "A1" or "A2"
            const labs = todayTimetable.filter(period =>
                period.type?.toLowerCase().includes('lab') ||
                period.subject?.toLowerCase().includes('lab')
            );

            if (labs.length > 0) {
                const isBatchLab = labs.some(l => l.batch && l.batch === userBatch);
                // Fire if it explicitly matches batch, or if there's no specific batch assigned
                if (isBatchLab || labs.some(l => !l.batch)) {
                    this.dispatch(
                        "🔬 Lab Day Today!",
                        `Lab for Batch ${userBatch || "All"}: Don't forget your Labcoat and essentials!`
                    );
                    this.markFired("precollege", dateStr);
                    return; // Return early to not spam with schedule right after
                }
            }
        }

        // Standard Class Schedule
        if (showSchedule) {
            const firstClass = todayTimetable.find(period => period.type !== "break" && period.type !== "lunch");
            if (firstClass) {
                this.dispatch(
                    "📅 Today's First Class",
                    `${firstClass.subject} at ${firstClass.time}. Don't be late!`
                );
            }
        }

        this.markFired("precollege", dateStr);
    }

    fireCollegeEntry() {
        const dateStr = new Date().toISOString().split('T')[0];
        if (this.hasFired("entry", dateStr)) return;

        // This could be tied to location logic if added later, or just a simple reminder to scan ID

        this.markFired("entry", dateStr);
    }
}

import React, { useState } from "react";
import {
    RiSunLine,
    RiAlertLine,
    RiCalendarEventLine,
    RiNotificationBadgeLine,
    RiMegaphoneLine,
    RiCalendar2Line,
    RiFlaskLine,
    RiBookOpenLine,
    RiTimeLine
} from "react-icons/ri";
import { SubHeader, SettingsGroup, SettingsDivider, NotifItem } from "./SettingsShared";

const NotificationSettings = ({ onBack }) => {
    // Shared loader
    const loadPref = (key, def = true) => {
        const saved = localStorage.getItem(`neram-notif-${key}`);
        return saved !== null ? saved === "true" : def;
    };

    const loadTimePref = (key, def = "00:00") => {
        const saved = localStorage.getItem(`neram-notif-${key}`);
        return saved !== null ? saved : def;
    };

    // Granular Toggles
    const [dailyUpdate, setDailyUpdate] = useState(loadPref("daily_update"));
    const [generalNotice, setGeneralNotice] = useState(loadPref("general_notice"));
    const [classSchedule, setClassSchedule] = useState(loadPref("class_schedule"));
    const [labReminders, setLabReminders] = useState(loadPref("lab_reminders"));
    const [studyReminders, setStudyReminders] = useState(loadPref("study_reminders"));
    const [examAlerts, setExamAlerts] = useState(loadPref("exam_alerts"));
    const [eventReminders, setEventReminders] = useState(loadPref("event_reminders"));
    const [instantAlerts, setInstantAlerts] = useState(loadPref("instant_alerts"));

    // Timing Settings
    const [useCustomTimes, setUseCustomTimes] = useState(loadPref("use_custom_times", false));
    const [customTime1, setCustomTime1] = useState(loadTimePref("custom_time_1", "05:30"));
    const [customTime2, setCustomTime2] = useState(loadTimePref("custom_time_2", "06:30"));
    const [customTime3, setCustomTime3] = useState(loadTimePref("custom_time_3", "07:30"));

    const toggle = (key, value, setter) => {
        const newVal = !value;
        setter(newVal);
        localStorage.setItem(`neram-notif-${key}`, String(newVal));
    };

    const updateTime = (key, value, setter) => {
        setter(value);
        localStorage.setItem(`neram-notif-${key}`, value);
    };

    return (
        <>
            <SubHeader title="Notifications" onBack={onBack} />

            <div className="s2-section-label">Notification Timings</div>
            <SettingsGroup>
                <NotifItem
                    icon={<RiTimeLine />}
                    iconColor="teal"
                    title="Use Custom Times"
                    desc={useCustomTimes ? "Using 3 custom alarm times" : "Using default college timings"}
                    checked={useCustomTimes}
                    onChange={() => toggle("use_custom_times", useCustomTimes, setUseCustomTimes)}
                />
                <SettingsDivider />

                {/* Time Slots */}
                {[
                    { label: "Morning Wake", time: useCustomTimes ? customTime1 : "05:30", setter: setCustomTime1, key: "custom_time_1" },
                    { label: "Pre-College", time: useCustomTimes ? customTime2 : "06:30", setter: setCustomTime2, key: "custom_time_2" },
                    { label: "College Entry", time: useCustomTimes ? customTime3 : "07:30", setter: setCustomTime3, key: "custom_time_3" }
                ].map((slot, idx) => (
                    <React.Fragment key={slot.key}>
                        <div className="s2-notif-item" style={{ opacity: useCustomTimes ? 1 : 0.5, pointerEvents: useCustomTimes ? "auto" : "none", display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <RiTimeLine size={20} color="var(--mac-text-secondary)" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--mac-text)' }}>{slot.label}</span>
                                </div>
                            </div>
                            <input
                                type="time"
                                value={slot.time}
                                onChange={(e) => updateTime(slot.key, e.target.value, slot.setter)}
                                disabled={!useCustomTimes}
                                style={{
                                    background: 'transparent', border: 'none', color: 'var(--mac-blue)',
                                    fontSize: '18px', fontWeight: 'bold', outline: 'none', fontFamily: 'inherit'
                                }}
                            />
                        </div>
                        {idx < 2 && <SettingsDivider />}
                    </React.Fragment>
                ))}
            </SettingsGroup>

            <div className="s2-spacer-md" />

            <div className="s2-section-label">Push Notifications</div>
            <SettingsGroup>
                <NotifItem
                    icon={<RiSunLine />}
                    iconColor="orange"
                    title="Daily Updates"
                    desc="Morning summary with schedule and updates"
                    checked={dailyUpdate}
                    onChange={() => toggle("daily_update", dailyUpdate, setDailyUpdate)}
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiMegaphoneLine />}
                    iconColor="blue"
                    title="General Notices"
                    desc="General announcements from coordinators"
                    checked={generalNotice}
                    onChange={() => toggle("general_notice", generalNotice, setGeneralNotice)}
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiCalendar2Line />}
                    iconColor="green"
                    title="Class Schedule"
                    desc="Daily timetable and room assignments"
                    checked={classSchedule}
                    onChange={() => toggle("class_schedule", classSchedule, setClassSchedule)}
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiFlaskLine />}
                    iconColor="purple"
                    title="Lab Reminders"
                    desc="Batch-specific lab schedules and coat reminders"
                    checked={labReminders}
                    onChange={() => toggle("lab_reminders", labReminders, setLabReminders)}
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiBookOpenLine />}
                    iconColor="teal"
                    title="Study Reminders"
                    desc="Evening study plans and homework updates"
                    checked={studyReminders}
                    onChange={() => toggle("study_reminders", studyReminders, setStudyReminders)}
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiAlertLine />}
                    iconColor="red"
                    title="Exam Alerts"
                    desc="Reminders for upcoming exams"
                    checked={examAlerts}
                    onChange={() => toggle("exam_alerts", examAlerts, setExamAlerts)}
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiCalendarEventLine />}
                    iconColor="pink"
                    title="Event Reminders"
                    desc="Holidays and special events"
                    checked={eventReminders}
                    onChange={() => toggle("event_reminders", eventReminders, setEventReminders)}
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiNotificationBadgeLine />}
                    iconColor="indigo"
                    title="Instant Alerts"
                    desc="Critical announcements from college"
                    checked={instantAlerts}
                    onChange={() => toggle("instant_alerts", instantAlerts, setInstantAlerts)}
                />
            </SettingsGroup>

            <div className="s2-spacer-md" />

            <p className="s2-info-text">
                Note: In-App notifications will also request native browser Push Notification permissions.
            </p>
        </>
    );
};

export default NotificationSettings;

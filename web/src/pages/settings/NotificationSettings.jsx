import React, { useState } from "react";
import {
    RiSunLine,
    RiAlertLine,
    RiCalendarEventLine,
    RiNotificationBadgeLine,
} from "react-icons/ri";
import { SubHeader, SettingsGroup, SettingsDivider, NotifItem } from "./SettingsShared";

const NotificationSettings = ({ onBack }) => {
    const loadPref = (key, def = true) => {
        const saved = localStorage.getItem(`neram-notif-${key}`);
        return saved !== null ? saved === "true" : def;
    };

    const [dailyBriefing, setDailyBriefing] = useState(
        loadPref("daily_briefing")
    );
    const [examAlerts, setExamAlerts] = useState(loadPref("exam_alerts"));
    const [eventReminders, setEventReminders] = useState(
        loadPref("event_reminders")
    );
    const [instantAlerts, setInstantAlerts] = useState(
        loadPref("instant_alerts")
    );

    const toggle = (key, value, setter) => {
        const newVal = !value;
        setter(newVal);
        localStorage.setItem(`neram-notif-${key}`, String(newVal));
    };

    return (
        <>
            <SubHeader title="Notifications" onBack={onBack} />

            <div className="s2-section-label">Push Notifications</div>

            <SettingsGroup>
                <NotifItem
                    icon={<RiSunLine />}
                    iconColor="orange"
                    title="Daily Briefing"
                    desc="Morning summary with schedule and updates"
                    checked={dailyBriefing}
                    onChange={() =>
                        toggle("daily_briefing", dailyBriefing, setDailyBriefing)
                    }
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiAlertLine />}
                    iconColor="red"
                    title="Exam Alerts"
                    desc="Reminders for upcoming exams"
                    checked={examAlerts}
                    onChange={() =>
                        toggle("exam_alerts", examAlerts, setExamAlerts)
                    }
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiCalendarEventLine />}
                    iconColor="blue"
                    title="Event Reminders"
                    desc="Holidays and special events"
                    checked={eventReminders}
                    onChange={() =>
                        toggle(
                            "event_reminders",
                            eventReminders,
                            setEventReminders
                        )
                    }
                />
                <SettingsDivider />
                <NotifItem
                    icon={<RiNotificationBadgeLine />}
                    iconColor="purple"
                    title="Instant Alerts"
                    desc="Critical announcements from college"
                    checked={instantAlerts}
                    onChange={() =>
                        toggle(
                            "instant_alerts",
                            instantAlerts,
                            setInstantAlerts
                        )
                    }
                />
            </SettingsGroup>

            <div className="s2-spacer-md" />

            <p className="s2-info-text">
                Note: You can also manage notification permissions in your
                browser's site settings.
            </p>
        </>
    );
};

export default NotificationSettings;

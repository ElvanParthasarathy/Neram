import React from "react";
import {
    RiCalendar2Line,
    RiCalendarEventLine,
    RiMegaphoneLine,
    RiWifiOffLine,
    RiRefreshLine,
} from "react-icons/ri";
import { SubHeader, SettingsGroup, SettingsDivider } from "./SettingsShared";

const FeatureItem = ({ icon, color, title, desc }) => (
    <div className="s2-feature-item">
        <span className={`s2-icon-circle ${color}`}>{icon}</span>
        <div className="s2-feature-text">
            <div className="s2-feature-title">{title}</div>
            <div className="s2-feature-desc">{desc}</div>
        </div>
    </div>
);

const AboutPage = ({ onBack }) => (
    <>
        <SubHeader title="About App" onBack={onBack} />

        <div className="s2-about-header">
            <div className="s2-about-tamil">நேரம்</div>
            <div className="s2-about-english">Neram</div>
        </div>

        <SettingsGroup>
            <div style={{ padding: 24 }}>
                <div className="s2-about-card-title">What is Neram?</div>
                <div className="s2-about-desc">
                    Neram (<span className="s2-tamil">நேரம்</span>, meaning 'Time') is a sleek, all-in-one campus
                    companion app designed specifically for RMD Engineering
                    College students. It brings together everything you need to
                    stay organized and informed throughout your academic day.
                </div>
            </div>
        </SettingsGroup>

        <div className="s2-spacer-md" />

        <div className="s2-section-label">Features</div>
        <SettingsGroup>
            <div style={{ padding: "4px 20px" }}>
                <FeatureItem
                    icon={<RiCalendar2Line />}
                    color="blue"
                    title="Smart Timetable"
                    desc="View your daily class schedule with faculty info, room numbers, and real-time updates."
                />
                <SettingsDivider />
                <FeatureItem
                    icon={<RiCalendarEventLine />}
                    color="purple"
                    title="Exam Calendar"
                    desc="Track upcoming exams, internals, and important academic events with countdown timers."
                />
                <SettingsDivider />
                <FeatureItem
                    icon={<RiMegaphoneLine />}
                    color="orange"
                    title="Campus Announcements"
                    desc="Get instant notifications for news, circulars, and announcements from the college."
                />
                <SettingsDivider />
                <FeatureItem
                    icon={<RiWifiOffLine />}
                    color="green"
                    title="Offline Support"
                    desc="Access your timetable and cached data even without an internet connection."
                />
                <SettingsDivider />
                <FeatureItem
                    icon={<RiRefreshLine />}
                    color="red"
                    title="Cloud Sync"
                    desc="Your schedule and preferences sync seamlessly across devices with Firebase."
                />
            </div>
        </SettingsGroup>

        <div className="s2-about-footer">
            Built with ❤️ by Elvan Parthasarathy
        </div>
    </>
);

export default AboutPage;

import React from 'react';
import {
    RiInformationLine,
    RiCalendarEventLine,
    RiTimeLine,
    RiShieldCheckLine,
    RiCloudLine,
    RiHeartFill,
    RiArrowRightSLine
} from 'react-icons/ri';
import '../../styles/admin-settings.css';

const About = () => {
    return (
        <div className="settings-section-content">
            {/* APP HEADER */}
            <div className="about-app-hero">
                <div className="app-logo-accent">
                    <span className="logo-tamil">நேரம்</span>
                    <h2 className="logo-english">Neram</h2>
                </div>
            </div>

            {/* DESCRIPTION CARD */}
            <div className="settings-group-card no-padding">
                <div className="about-description-box">
                    <h3>What is Neram?</h3>
                    <p>
                        <strong>Neram</strong> (நேரம், meaning 'Time') is a sleek, all-in-one campus companion app designed specifically for RMD Engineering College students. It brings together everything you need to stay organized and informed throughout your academic day.
                    </p>
                </div>
            </div>

            <h3 className="settings-group-label">CORE FEATURES</h3>

            {/* FEATURES GRID */}
            <div className="settings-group-card">
                <FeatureItem
                    icon={<RiTimeLine />}
                    color="#007AFF"
                    title="Smart Timetable"
                    desc="View your daily class schedule with faculty info, room numbers, and real-time updates."
                />
                <FeatureItem
                    icon={<RiCalendarEventLine />}
                    color="#5856D6"
                    title="Exam Calendar"
                    desc="Track upcoming exams, internals, and important academic events with countdown timers."
                />
                <FeatureItem
                    icon={<RiShieldCheckLine />}
                    color="#34C759"
                    title="Verified Access"
                    desc="Seamless institutional login ensures that all schedule data is secure and official."
                />
                <FeatureItem
                    icon={<RiCloudLine />}
                    color="#FF9500"
                    title="Cloud Architecture"
                    desc="Your schedule and profile preferences sync across all devices via the Neram Portal."
                />
            </div>

            {/* DEVELOPER FOOTER */}
            <div className="about-footer">
                <p>Built with <RiHeartFill className="heart-icon" /> by Elvan Parthasarathy</p>

            </div>
        </div>
    );
};

const FeatureItem = ({ icon, color, title, desc }) => (
    <div className="settings-row item-interaction">
        <div className="row-content">
            <div className="row-info">
                <div className="feature-icon-box" style={{ background: `${color}15`, color: color }}>
                    {icon}
                </div>
                <div className="feature-text">
                    <h4>{title}</h4>
                    <p>{desc}</p>
                </div>
            </div>
            <RiArrowRightSLine className="row-chevron" />
        </div>
    </div>
);

export default About;

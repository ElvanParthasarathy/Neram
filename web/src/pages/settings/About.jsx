import React, { useState } from 'react';
import {
    RiInformationLine,
    RiCalendarEventLine,
    RiTimeLine,
    RiShieldCheckLine,
    RiCloudLine,
    RiHeartFill,
    RiArrowRightSLine,
    RiUser6Line,
    RiFeedbackLine,
    RiArrowLeftSLine,
    RiPhoneLine,
    RiMailLine,
    RiLinkedinBoxLine,
    RiGithubLine,
    RiMapPinLine,
    RiSendPlaneLine,
    RiGlobalLine
} from 'react-icons/ri';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../firebase';
import '../../styles/admin-settings.css';

const About = () => {
    const [view, setView] = useState('hub'); // 'hub', 'app', 'developer', 'feedback'

    // VIEWS
    if (view === 'app') return <AboutApp onBack={() => setView('hub')} />;
    if (view === 'developer') return <DeveloperInfo onBack={() => setView('hub')} />;
    if (view === 'feedback') return <ContactFeedback onBack={() => setView('hub')} />;

    return (
        <div className="settings-section-content">
            <h3 className="settings-sub-label">ABOUT NERAM</h3>

            <div className="settings-group-card no-padding about-menu-card">
                <MenuButton
                    icon={<RiInformationLine />}
                    color="#007AFF"
                    title="About App"
                    onClick={() => setView('app')}
                />
                <MenuButton
                    icon={<RiUser6Line />}
                    color="#5856D6"
                    title="Developer Info"
                    onClick={() => setView('developer')}
                />
                <MenuButton
                    icon={<RiFeedbackLine />}
                    color="#FF9500"
                    title="Contact & Complaints"
                    onClick={() => setView('feedback')}
                />
            </div>

        </div>
    );
};

// --- SUB-VIEWS ---

const AboutApp = ({ onBack }) => (
    <div className="settings-section-content slide-in-left">
        <div className="flow-header">
            <button className="btn-icon-circular" onClick={onBack} title="Back">
                <RiArrowLeftSLine />
            </button>
            <h3 className="item-title" style={{ fontSize: '20px' }}>About App</h3>
        </div>

        <div className="about-app-hero">
            <div className="app-logo-accent">
                <span className="logo-tamil">நேரம்</span>
                <h2 className="logo-english">Neram</h2>
            </div>
        </div>

        <div className="settings-group-card no-padding">
            <div className="about-description-box">
                <h3>What is Neram?</h3>
                <p>
                    <strong>Neram</strong> (நேரம், meaning 'Time') is a sleek, all-in-one campus companion app designed specifically for RMD Engineering College students. It brings together everything you need to stay organized and informed throughout your academic day.
                </p>
            </div>
        </div>

        <h3 className="settings-sub-label">CORE FEATURES</h3>
        <div className="settings-group-card">
            <FeatureItem icon={<RiTimeLine />} color="#007AFF" title="Smart Timetable" desc="Daily schedules with faculty info and room numbers." />
            <FeatureItem icon={<RiCalendarEventLine />} color="#5856D6" title="Exam Calendar" desc="Upcoming exams and academic events with countdowns." />
            <FeatureItem icon={<RiShieldCheckLine />} color="#34C759" title="Verified Access" desc="Institutional login ensures secure and official data." />
            <FeatureItem icon={<RiCloudLine />} color="#FF9500" title="Cloud Sync" desc="Profiles and preferences sync across all your devices." />
        </div>
    </div>
);

const DeveloperInfo = ({ onBack }) => (
    <div className="settings-section-content slide-in-left">
        <div className="flow-header">
            <button className="btn-icon-circular" onClick={onBack} title="Back">
                <RiArrowLeftSLine />
            </button>
            <h3 className="item-title" style={{ fontSize: '20px' }}>Developer Info</h3>
        </div>

        <div className="developer-hero-card">
            <span className="hero-greeting">HELLO, I'M</span>
            <h2>Elvan Parthasarathy</h2>
            <p className="hero-subtitle">Vibe Coder | Prompt Engineer</p>
            <button
                className="btn-portfolio"
                onClick={() => window.open('https://jaiprakashpartha.vercel.app/', '_blank')}
            >
                Visit Portfolio
            </button>
        </div>

        <h3 className="settings-sub-label">CONTACT INFO</h3>
        <div className="settings-group-card no-padding">
            <ContactRow
                icon={<RiPhoneLine />}
                color="#34C759"
                label="+91 93451 28797"
                onClick={() => window.location.href = 'tel:+919345128797'}
            />
            <ContactRow
                icon={<RiMailLine />}
                color="#FF3B30"
                label="jaiprakashpartha@gmail.com"
                onClick={() => window.location.href = 'mailto:jaiprakashpartha@gmail.com'}
            />
            <ContactRow
                icon={<RiLinkedinBoxLine />}
                color="#0077B5"
                label="linkedin.com/in/jaiprakashpartha"
                onClick={() => window.open('https://www.linkedin.com/in/jaiprakashpartha', '_blank')}
            />
            <ContactRow
                icon={<RiGithubLine />}
                color="var(--mac-text)"
                label="github.com/elvanparthasarathy"
                onClick={() => window.open('https://github.com/elvanparthasarathy', '_blank')}
            />
            <ContactRow
                icon={<RiMapPinLine />}
                color="#FF9500"
                label="Arani, Tamil Nadu - 632317"
                desc="(Currently in Chennai)"
                notClickable
            />
        </div>
    </div>
);

const ContactFeedback = ({ onBack }) => {
    const [formData, setFormData] = useState({ name: '', mobile: '', email: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(null); // 'success', 'error'

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.mobile || !formData.email || !formData.message) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, 'contacts'), {
                ...formData,
                timestamp: serverTimestamp()
            });
            setStatus('success');
            setFormData({ name: '', mobile: '', email: '', message: '' });
        } catch (error) {
            console.error('Error submitting feedback:', error);
            setStatus('error');
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    return (
        <div className="settings-section-content slide-in-left">
            <div className="flow-header">
                <button className="btn-icon-circular" onClick={onBack} title="Back">
                    <RiArrowLeftSLine />
                </button>
                <h3 className="item-title" style={{ fontSize: '20px' }}>Contact & Complaints</h3>
            </div>

            <div className="settings-group-card no-padding">
                <div className="feedback-form-container">
                    <h3>Send a Message</h3>
                    <p className="item-description" style={{ marginBottom: '20px' }}>Reach out for queries, feedback, or complaints.</p>

                    <form className="feedback-form" onSubmit={handleSubmit}>
                        <div className="form-field">
                            <label>Your Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Mobile Number</label>
                            <input
                                type="tel"
                                className="form-input"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                placeholder="+91 00000 00000"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label>Your Message / Query</label>
                            <textarea
                                className="form-textarea"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="How can we help you?"
                                required
                            />
                        </div>

                        {status === 'success' && <div className="status-banner success" style={{ marginTop: '16px' }}>Message sent successfully!</div>}
                        {status === 'error' && <div className="status-banner error" style={{ marginTop: '16px' }}>Failed to send message.</div>}

                        <button className="btn-submit-form full-width" disabled={isSubmitting}>
                            {isSubmitting ? <span className="spin"><RiSendPlaneLine /></span> : <><RiSendPlaneLine /> Send Message</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTS ---

const MenuButton = ({ icon, color, title, onClick }) => (
    <button className="settings-list-item" onClick={onClick}>
        <div className="item-icon-wrapper" style={{ background: `${color}15`, color: color }}>
            {icon}
        </div>
        <div className="item-content">
            <div className="item-title">{title}</div>
        </div>
        <RiArrowRightSLine className="chevron-right" />
    </button>
);

const FeatureItem = ({ icon, color, title, desc }) => (
    <div className="settings-row item-interaction" style={{ padding: '16px 24px', borderBottom: '1px solid var(--mac-divider)' }}>
        <div className="row-content">
            <div className="row-info">
                <div className="feature-icon-box" style={{ background: `${color}15`, color: color, width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {icon}
                </div>
                <div className="feature-text">
                    <h4 style={{ margin: 0, fontSize: '15px' }}>{title}</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--mac-text-secondary)' }}>{desc}</p>
                </div>
            </div>
        </div>
    </div>
);

const ContactRow = ({ icon, color, label, desc, onClick, notClickable }) => (
    <div
        className={`settings-list-item ${notClickable ? 'not-clickable' : ''}`}
        onClick={notClickable ? undefined : onClick}
        style={{ cursor: notClickable ? 'default' : 'pointer' }}
    >
        <div className="item-icon-wrapper" style={{ background: `${color}15`, color: color }}>
            {icon}
        </div>
        <div className="item-content">
            <div className="item-title">{label}</div>
            {desc && <div className="item-description">{desc}</div>}
        </div>
        {!notClickable && <RiArrowRightSLine className="chevron-right" />}
    </div>
);

export default About;

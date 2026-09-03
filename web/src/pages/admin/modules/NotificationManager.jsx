import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../../firebase';
import { ref, onValue, set } from 'firebase/database';
import { 
    RiNotificationBadgeLine, 
    RiArrowLeftLine, 
    RiAlertLine,
    RiLoader4Line
} from 'react-icons/ri';
import { ToggleSwitch } from '../../student/settings/SettingsShared';
import { useToast } from '../../../contexts/ToastContext';

const NotificationManager = ({ isMobile }) => {
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const settingsRef = ref(db, 'settings/system_notifications_enabled');
        const unsub = onValue(settingsRef, (snap) => {
            const val = snap.val();
            const actualValue = val === null ? true : val;
            setEnabled(actualValue);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleToggle = async (newVal) => {
        setUpdating(true);
        try {
            await set(ref(db, 'settings/system_notifications_enabled'), newVal);
            setEnabled(newVal);
            showToast(newVal ? "✅ Notifications enabled globally" : "⚠️ Notifications disabled globally");
        } catch (error) {
            console.error("Failed to save notifications:", error);
            showToast("❌ Failed to update notification switch");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-subpage animate-fade-in central-schedule-manager" style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--mac-text-secondary)' }}>
                    <RiLoader4Line className="nm-spin" style={{ fontSize: '28px' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="admin-subpage animate-fade-in central-schedule-manager" style={{ maxWidth: '800px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
            {/* Standard Explorer Header */}
            <header className="explorer-header focus-mode" style={{ marginBottom: '24px', borderBottom: '1px solid var(--mac-divider)', paddingBottom: '16px' }}>
                <div className="breadcrumb-nav">
                    <div className="breadcrumb-list" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="crumb-static" style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 700, color: 'var(--mac-text)' }}>
                            Notifications
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button 
                        className="explorer-back-btn" 
                        onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.set('mod', 'home');
                            setSearchParams(params);
                        }}
                    >
                        <RiArrowLeftLine /> Back
                    </button>
                </div>
            </header>

            {/* Main Settings Card */}
            <div 
                className="settings-card"
                style={{
                    background: 'var(--mac-card-bg)',
                    border: '1px solid var(--mac-border)',
                    borderRadius: '24px',
                    padding: isMobile ? '20px' : '28px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
                    marginBottom: '20px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: enabled ? 'rgba(0, 122, 255, 0.12)' : 'rgba(142, 142, 147, 0.12)',
                            color: enabled ? 'var(--mac-blue)' : 'var(--mac-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                            flexShrink: 0
                        }}>
                            <RiNotificationBadgeLine />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--mac-text)' }}>
                                    System Push Notifications
                                </h3>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '3px 8px',
                                    borderRadius: '100px',
                                    letterSpacing: '0.4px',
                                    background: enabled ? 'rgba(48, 209, 88, 0.12)' : 'rgba(255, 59, 48, 0.12)',
                                    color: enabled ? '#30D158' : '#FF3B30'
                                }}>
                                    {enabled ? 'ACTIVE' : 'MUTED'}
                                </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--mac-text-secondary)', lineHeight: 1.5, maxWidth: '520px' }}>
                                Global master kill-switch controlling automated notifications. When disabled, scheduled timetable reminders, exam announcements, and daily updates are immediately suppressed across all devices.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                        {updating && <RiLoader4Line className="nm-spin" style={{ color: 'var(--mac-blue)', fontSize: '18px' }} />}
                        <ToggleSwitch checked={enabled} onChange={handleToggle} disabled={updating} />
                    </div>
                </div>

                {!enabled && (
                    <div style={{
                        marginTop: '20px',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: 'rgba(255, 59, 48, 0.08)',
                        border: '1px solid rgba(255, 59, 48, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#FF3B30',
                        fontSize: '13px',
                        fontWeight: 500
                    }}>
                        <RiAlertLine style={{ fontSize: '20px', flexShrink: 0 }} />
                        <span>
                            All automated system notifications are currently <strong>turned off</strong>. Students will not receive any daily alert notifications until this is re-enabled.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationManager;

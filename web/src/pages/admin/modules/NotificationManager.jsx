import React, { useState, useEffect } from 'react';
import { db } from "../../../firebase";
import { ref, onValue, set } from "firebase/database";
import { ProfileField, ToggleSwitch } from "../../student/settings/SettingsShared";
import { useToast } from "../../../contexts/ToastContext";
import "../../../styles/student/settings.css"; 

const NotificationManager = ({ isMobile }) => {
    const { showToast } = useToast();
    const [enabled, setEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [tempEnabled, setTempEnabled] = useState(true);

    useEffect(() => {
        const settingsRef = ref(db, 'settings/system_notifications_enabled');
        const unsub = onValue(settingsRef, (snap) => {
            const val = snap.val();
            const actualValue = val === null ? true : val;
            setEnabled(actualValue);
            setTempEnabled(actualValue);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await set(ref(db, 'settings/system_notifications_enabled'), tempEnabled);
            setIsEditMode(false);
            showToast("✅ Master Kill Switch updated successfully");
        } catch (error) {
            console.error("Failed to save notifications:", error);
            showToast("❌ Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setTempEnabled(enabled);
        setIsEditMode(false);
    };

    if (loading) return null;

    return (
        <div className="admin-dashboard-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <header className="page-header" style={{ marginBottom: '24px' }}>
                <div className="header-main">
                    <h1 className="page-title">System Notifications</h1>
                    <p style={{ marginTop: '8px', color: 'var(--text-secondary)' }}>Manage the global state of the automated out-of-app notification system.</p>
                </div>
            </header>

            <div style={{ padding: '0 20px' }}>
                <ProfileField 
                    label="Master Kill Switch"
                    value={enabled ? "Notifications are ON" : "Notifications are OFF"}
                    isEditing={isEditMode}
                    onEdit={() => setIsEditMode(true)}
                    onCancel={handleCancel}
                    onSave={handleSave}
                >
                    <div style={{ padding: '8px 0 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--mac-text)' }}>Enable Notifications</span>
                            <ToggleSwitch checked={tempEnabled} onChange={setTempEnabled} />
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--mac-text-secondary)', lineHeight: 1.5 }}>
                            When disabled, the mobile app will immediately abort all background processes related to sending automated notifications. Students will not receive daily updates, exam reminders, or schedule alerts until this is turned back on.
                        </p>
                    </div>
                </ProfileField>

                {!enabled && !isEditMode && (
                    <div style={{ marginTop: '16px', background: 'rgba(255, 59, 48, 0.1)', color: 'var(--mac-red)', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>⚠️</span>
                        All out-of-app system notifications are currently suppressed.
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationManager;

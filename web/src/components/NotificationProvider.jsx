import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCloseLine } from 'react-icons/ri';
import { NotificationLogic } from '../utils/NotificationLogic';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children, globalData, userProfile }) => {
    const [toasts, setToasts] = useState([]);
    const [nativePerm, setNativePerm] = useState(Notification.permission);

    // Initial permission request
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then(perm => setNativePerm(perm));
        }
    }, []);

    // Dispatch a single notification (handles both Toast & Native)
    const dispatchNotification = useCallback((title, body, icon = null) => {
        const id = Date.now() + Math.random();

        // 1. Render In-App Toast
        setToasts(prev => [...prev, { id, title, body, icon }]);

        // 2. Fire Native Browser Notification
        if (nativePerm === "granted" && "Notification" in window) {
            new Notification(title, {
                body: body,
                icon: "/neramv.svg" // Use the app's logo
            });
        }

        // Auto-dismiss toast
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000);
    }, [nativePerm]);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // Foreground Background worker engine (simulating Android's DailyWorker)
    useEffect(() => {
        if (!globalData || !userProfile) return;

        // Run engine logic
        const logicEngine = new NotificationLogic(dispatchNotification, globalData, userProfile);

        // Check immediately on load (helpful for Instant Alerts if we implement a last-seen flag)

        // Poll every minute to check if system time matches user's defined alarm
        const interval = setInterval(() => {
            logicEngine.checkTimeTriggers();
        }, 60000);

        return () => clearInterval(interval);
    }, [globalData, userProfile, dispatchNotification]);

    return (
        <NotificationContext.Provider value={{ dispatchNotification, setNativePerm }}>
            {children}

            {/* In-App Toasts UI Viewport */}
            <div style={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none' // Don't block underlying UI clicks
            }}>
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            style={{
                                pointerEvents: 'auto',
                                background: 'var(--mac-surface)',
                                border: '1px solid var(--mac-glass-border)',
                                borderRadius: '14px',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                padding: '16px',
                                width: '320px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)'
                            }}
                        >
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                background: 'var(--mac-blue)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                {toast.icon ? toast.icon : <img src="/neramv.svg" width={24} height={24} />}
                            </div>

                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--mac-text)' }}>
                                    {toast.title}
                                </h4>
                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--mac-text-secondary)', lineHeight: 1.4 }}>
                                    {toast.body}
                                </p>
                            </div>

                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--mac-text-secondary)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <RiCloseLine size={20} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);

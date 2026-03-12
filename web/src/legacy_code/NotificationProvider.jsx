import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem('neram-notifications-history');
        return saved ? JSON.parse(saved) : [];
    });
    const [nativePerm, setNativePerm] = useState(Notification.permission);

    // Initial permission request
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().then(perm => setNativePerm(perm));
        }
    }, []);

    // Dispatch a single manual notification (used for testing or forced UI alerts)
    const dispatchNotification = useCallback((title, body, icon = null) => {
        const newNotif = {
            id: Date.now() + Math.random(),
            title,
            body,
            icon,
            timestamp: Date.now()
        };

        // 1. Save to History
        setHistory(prev => {
            const updated = [...prev, newNotif];
            localStorage.setItem('neram-notifications-history', JSON.stringify(updated));
            return updated;
        });

        // 2. Fire Native Browser Notification
        if (nativePerm === "granted" && "Notification" in window) {
            new Notification(title, {
                body: body,
                icon: "/neramv.svg" // Use the app's logo
            });
        }
    }, [nativePerm]);

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('neram-notifications-history');
    };

    // Note: Complex Time-Based logic engine and Dev Tools have been 
    // moved to legacy_code to simplify Web App experience per user request.

    return (
        <NotificationContext.Provider value={{ dispatchNotification, setNativePerm, history, clearHistory }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);

import { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { ref, onValue, get, set } from "firebase/database";

// Helper for Google Calendar Events
const toLocalISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const parseAsLocal = (dateStr) => {
    if (!dateStr) return new Date();
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [y, m, d] = cleanDate.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const useSectionData = (activeProfile) => {
    const [globalData, setGlobalData] = useState({
        masterData: { courses: [], timetable: {}, exams: [], counseling: { counselors: [], coordinators: {} } },
        allCalendar: [],
        sectionUpdates: { live: {}, general: "" },
        isSyncing: true
    });

    const expandGoogleEvent = useCallback((event) => {
        const startVal = event.start.dateTime || event.start.date;
        const endVal = event.end.dateTime || event.end.date;
        const startDate = parseAsLocal(startVal);
        const endDate = parseAsLocal(endVal);
        let curr = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        let stop = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        let days = [];
        const isAllDay = !event.start.dateTime;
        const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        while (isAllDay ? curr < stop : curr <= stop) {
            const dateStr = toLocalISO(curr);
            let timeRange = "All Day";
            if (!isAllDay) {
                const sTime = new Date(startVal);
                const eTime = new Date(endVal);
                timeRange = `${formatTime(sTime)} - ${formatTime(eTime)}`;
            }
            days.push({ id: `${event.id}_${dateStr}`, title: event.summary || "Untitled", date: dateStr, fullTime: timeRange });
            curr.setDate(curr.getDate() + 1);
        }
        return days;
    }, []);

    const runGlobalCalendarSync = useCallback(async (batchName) => {
        try {
            const configSnap = await get(ref(db, `calendars/${batchName}`));
            if (!configSnap.exists()) {
                setGlobalData(prev => ({ ...prev, isSyncing: false }));
                return;
            }

            const { config, semConfig, events: firebaseEvents } = configSnap.val();
            if (!config?.apiKey || !config?.calendarId) {
                setGlobalData(prev => ({ ...prev, isSyncing: false }));
                return;
            }

            const timeMin = new Date(semConfig?.start || '2025-12-01').toISOString();
            const timeMax = new Date(semConfig?.end || '2026-05-31').toISOString();
            const url = `https://www.googleapis.com/calendar/v3/calendars/${config.calendarId}/events?key=${config.apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=250`;

            const response = await fetch(url);
            const data = await response.json();
            if (data.error) {
                setGlobalData(prev => ({ ...prev, isSyncing: false }));
                return;
            }

            let allExpanded = [];
            data.items?.forEach(item => { allExpanded = [...allExpanded, ...expandGoogleEvent(item)]; });
            allExpanded.sort((a, b) => new Date(a.date) - new Date(b.date));

            setGlobalData(prev => ({ ...prev, allCalendar: allExpanded, isSyncing: false }));

            const getQuickHash = (evs) => JSON.stringify((evs || []).map(e => `${e.id}|${e.title}|${e.fullTime}`));
            if (getQuickHash(firebaseEvents) !== getQuickHash(allExpanded)) {
                await set(ref(db, `calendars/${batchName}/events`), allExpanded);
            }
        } catch (err) {
            console.error("Global Sync error:", err);
            setGlobalData(prev => ({ ...prev, isSyncing: false }));
        }
    }, [expandGoogleEvent]);

    useEffect(() => {
        if (!activeProfile?.batch || !activeProfile?.section) {
            setGlobalData(prev => ({ ...prev, isSyncing: false }));
            return;
        }

        const { batch, department, section } = activeProfile;
        setGlobalData(prev => ({ ...prev, isSyncing: true }));

        const unsubCal = onValue(ref(db, `calendars/${batch}/events`), (snap) => {
            const data = snap.val();
            setGlobalData(prev => ({ ...prev, allCalendar: Array.isArray(data) ? data : Object.values(data || {}) }));
        }, (error) => {
            console.error("Calendar sync error:", error);
        });

        const unsubSched = onValue(ref(db, `schedules/${batch}/${department}/${section}`), (snap) => {
            setGlobalData(prev => ({
                ...prev,
                masterData: snap.exists() ? snap.val() : { courses: [], timetable: {}, exams: [], counseling: { counselors: [], coordinators: {} } },
                isSyncing: false
            }));
        }, (error) => {
            console.error("Schedule sync error:", error);
            setGlobalData(prev => ({ ...prev, isSyncing: false }));
        });

        const unsubUpdates = onValue(ref(db, `updates/${batch}/${department}/${section}`), (snap) => {
            const data = snap.val() || {};
            setGlobalData(prev => ({
                ...prev,
                sectionUpdates: {
                    live: data.daily_update || {},
                    general: { text: data.general_text || "", author: data.general_author || "" }
                }
            }));
        }, (error) => {
            console.error("Updates sync error:", error);
        });

        runGlobalCalendarSync(batch);

        return () => { unsubCal(); unsubSched(); unsubUpdates(); };
    }, [activeProfile?.batch, activeProfile?.department, activeProfile?.section, runGlobalCalendarSync]);

    return globalData;
};

import React, { useState, useEffect } from 'react';
import { getDatabase, ref, query, orderByKey, endAt, get, remove } from 'firebase/database';
import { RiDeleteBin7Line, RiCalendarLine, RiInformationLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';
import '../../styles/admin-settings.css';

const Maintenance = () => {
    const [stats, setStats] = useState({
        totalUpdates: 0,
        oldUpdates: 0,
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [range, setRange] = useState({ start: '', end: '' });

    const db = getDatabase();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const updatesRef = ref(db, 'daily_updates');
            const snapshot = await get(updatesRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const total = Object.keys(data).length;

                // Calculate old updates (older than 30 days)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

                const old = Object.keys(data).filter(key => key < thirtyDaysAgoStr).length;
                setStats({ totalUpdates: total, oldUpdates: old });
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const clearOldUpdates = async () => {
        setLoading(true);
        setStatus({ type: 'info', message: 'Cleaning up old updates...' });
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

            const updatesRef = ref(db, 'daily_updates');
            const oldUpdatesQuery = query(updatesRef, orderByKey(), endAt(thirtyDaysAgoStr));
            const snapshot = await get(oldUpdatesQuery);

            if (snapshot.exists()) {
                const keysToRemove = Object.keys(snapshot.val()).filter(k => k < thirtyDaysAgoStr);
                const promises = keysToRemove.map(key => remove(ref(db, `daily_updates/${key}`)));
                await Promise.all(promises);
                setStatus({ type: 'success', message: `Successfully cleared ${keysToRemove.length} updates.` });
                fetchStats();
            } else {
                setStatus({ type: 'info', message: 'No old updates to clear.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to clear updates: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const clearRangeUpdates = async () => {
        if (!range.start || !range.end) {
            setStatus({ type: 'error', message: 'Please select both start and end dates.' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'info', message: 'Wiping data in specified range...' });
        try {
            const updatesRef = ref(db, 'daily_updates');
            const snapshot = await get(updatesRef);

            if (snapshot.exists()) {
                const keysInRange = Object.keys(snapshot.val()).filter(key =>
                    key >= range.start && key <= range.end
                );

                if (keysInRange.length === 0) {
                    setStatus({ type: 'info', message: 'No updates found in the selected range.' });
                    setLoading(false);
                    return;
                }

                const promises = keysInRange.map(key => remove(ref(db, `daily_updates/${key}`)));
                await Promise.all(promises);
                setStatus({ type: 'success', message: `Successfully cleared ${keysInRange.length} updates between ${range.start} and ${range.end}.` });
                fetchStats();
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Failed to clear updates: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-section-content">
            <div className="settings-header-card">
                <div className="header-info">
                    <h2>Maintenance & Optimization</h2>
                    <p>Keep your system responsive by managing historical data and clearing old logs.</p>
                </div>
                <div className="maintenance-stats">
                    <div className="stat-pill">
                        <span className="stat-value">{stats.totalUpdates}</span>
                        <span className="stat-label">Total Records</span>
                    </div>
                    <div className="stat-pill warning">
                        <span className="stat-value">{stats.oldUpdates}</span>
                        <span className="stat-label">Old Records</span>
                    </div>
                </div>
            </div>

            {status.message && (
                <div className={`status-banner ${status.type}`}>
                    {status.type === 'success' ? <RiCheckLine /> : <RiErrorWarningLine />}
                    <span>{status.message}</span>
                </div>
            )}

            <div className="settings-group-card">
                <div className="settings-row">
                    <div className="row-content">
                        <div className="row-info">
                            <RiDeleteBin7Line className="row-icon accent-blue" />
                            <div>
                                <h3>Clear Old Updates</h3>
                                <p>Permanently remove news and notices older than 30 days.</p>
                            </div>
                        </div>
                        <button
                            className="btn-primary"
                            onClick={clearOldUpdates}
                            disabled={loading || stats.oldUpdates === 0}
                        >
                            {loading ? 'Processing...' : 'Clear Now'}
                        </button>
                    </div>
                </div>

                <div className="settings-row vertical">
                    <div className="row-info">
                        <RiCalendarLine className="row-icon accent-orange" />
                        <div>
                            <h3>Custom Range Deletion</h3>
                            <p>Select a specific date range to wipe all daily updates.</p>
                        </div>
                    </div>

                    <div className="maintenance-range-picker">
                        <div className="date-input-group">
                            <label>From</label>
                            <input
                                type="date"
                                className="settings-input"
                                value={range.start}
                                onChange={(e) => setRange({ ...range, start: e.target.value })}
                            />
                        </div>
                        <div className="date-input-group">
                            <label>To</label>
                            <input
                                type="date"
                                className="settings-input"
                                value={range.end}
                                onChange={(e) => setRange({ ...range, end: e.target.value })}
                            />
                        </div>
                        <button
                            className="btn-danger"
                            onClick={clearRangeUpdates}
                            disabled={loading || !range.start || !range.end}
                        >
                            {loading ? 'Processing...' : 'Delete Data'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="info-box">
                <RiInformationLine />
                <p>Optimization helps keep the app responsive and saves local storage by removing old media and text records. <strong>Action cannot be undone.</strong></p>
            </div>
        </div>
    );
};

export default Maintenance;

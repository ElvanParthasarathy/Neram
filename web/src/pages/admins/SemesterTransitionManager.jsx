import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, get, update, onValue } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import { RiHistoryLine, RiArrowGoBackLine, RiAlertLine, RiInboxArchiveLine, RiCheckLine, RiLoader4Line, RiArrowDownSLine } from 'react-icons/ri';
import "../../styles/admin-settings.css";
import "../../styles/event-manager.css";

const SemesterTransitionManager = ({ user, userProfile, isMobile }) => {
    const role = user?.email ? getHardcodedRole(user.email) : (userProfile?.role || 'student');
    const isSuperAdmin = role === 'super_admin';

    const [hierarchy, setHierarchy] = useState({});
    const [selectedBatch, setSelectedBatch] = useState('');
    const [archiveSemNumber, setArchiveSemNumber] = useState('');

    // Restore State
    const [archivedSemesters, setArchivedSemesters] = useState([]);
    const [selectedRestoreSem, setSelectedRestoreSem] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [actionStatus, setActionStatus] = useState({ type: '', message: '' }); // success, error

    // Fetch Hierarchy
    useEffect(() => {
        const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => {
            const data = snap.val() || {};
            setHierarchy(data);
            const batches = Object.keys(data).sort().reverse();
            if (batches.length > 0) setSelectedBatch(batches[0]);
        });
        return () => unsub();
    }, []);

    // Fetch archives when batch changes
    useEffect(() => {
        if (!selectedBatch) return;
        const archivesRef = ref(db, `archives/${selectedBatch}`);
        get(archivesRef).then(snap => {
            if (snap.exists()) {
                const sems = Object.keys(snap.val()).filter(k => k.startsWith('semester_')).map(k => k.replace('semester_', ''));
                setArchivedSemesters(sems.sort((a, b) => Number(b) - Number(a))); // Descending
            } else {
                setArchivedSemesters([]);
            }
        });
    }, [selectedBatch, actionStatus]); // Re-fetch on batch change or successful action

    if (!isSuperAdmin) {
        return (
            <div className="admin-subpage animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
                <RiAlertLine style={{ fontSize: '48px', color: 'var(--mac-warning-text)', marginBottom: '16px' }} />
                <h2>Access Denied</h2>
                <p>Only Super Admins can perform semester transitions.</p>
            </div>
        );
    }

    const showMessage = (type, text) => {
        setActionStatus({ type, message: text });
        setTimeout(() => setActionStatus({ type: '', message: '' }), 6000);
    };

    const handleArchiveAndReset = async () => {
        if (!selectedBatch || !archiveSemNumber) {
            showMessage('error', 'Please select a batch and enter a semester number.');
            return;
        }

        const confirmMsg = `WARNING: You are about to ARCHIVE Semester ${archiveSemNumber} for Batch ${selectedBatch} and WIPE ALL ACTIVE TIMETABLES, EXAMS, SPECIAL CLASSES, AND CALENDAR.\n\nThis will take the active app offline for this batch until new data is entered.\n\nType "CONFIRM" to proceed.`;
        if (window.prompt(confirmMsg) !== "CONFIRM") return;

        setIsLoading(true);
        try {
            // 1. Fetch Snapshot (all semester-specific data paths)
            const snapshotPaths = [
                `schedules/${selectedBatch}`,
                `list_events/${selectedBatch}`,
                `courses/${selectedBatch}`,
                `calendars/${selectedBatch}/events`
            ];

            const snapshots = await Promise.all(snapshotPaths.map(p => get(ref(db, p))));
            const [schedulesSnap, eventsSnap, coursesSnap, calendarSnap] = snapshots;

            // 2. Build Archive Updates
            const updates = {};
            const archiveBasePath = `archives/${selectedBatch}/semester_${archiveSemNumber}`;

            if (schedulesSnap.exists()) updates[`${archiveBasePath}/schedules`] = schedulesSnap.val();
            if (eventsSnap.exists()) updates[`${archiveBasePath}/list_events`] = eventsSnap.val();
            if (coursesSnap.exists()) updates[`${archiveBasePath}/courses`] = coursesSnap.val();
            if (calendarSnap.exists()) updates[`${archiveBasePath}/calendars`] = calendarSnap.val();

            // 3. Build Wipe Updates (Selective deletion)
            const schedulesData = schedulesSnap.val() || {};

            // Iterate through Depts -> Sections to nullify specific leaves
            Object.keys(schedulesData).forEach(dept => {
                if (dept === 'initialized') return;
                const deptData = schedulesData[dept] || {};

                // Keep the _master structure for courses if you want, or wipe it? We decided to wipe master courses so they start fresh
                if (deptData._master) {
                    updates[`schedules/${selectedBatch}/${dept}/_master/courses`] = null;
                }

                Object.keys(deptData).forEach(sec => {
                    if (sec === '_master' || sec === 'initialized') return;

                    // Wipe timetable, exams, local courses, and special classes. Keep counseling intact.
                    updates[`schedules/${selectedBatch}/${dept}/${sec}/timetable`] = null;
                    updates[`schedules/${selectedBatch}/${dept}/${sec}/exams`] = null;
                    updates[`schedules/${selectedBatch}/${dept}/${sec}/courses`] = null;
                    updates[`schedules/${selectedBatch}/${dept}/${sec}/specialClasses`] = null;
                });
            });

            // Wipe central events entirely
            updates[`list_events/${selectedBatch}`] = null;
            // Wipe central courses entirely
            updates[`courses/${selectedBatch}`] = null;
            // Wipe academic calendar events for this batch
            updates[`calendars/${selectedBatch}/events`] = null;

            // 4. Commit Transaction
            await update(ref(db), updates);

            setArchiveSemNumber('');
            showMessage('success', `Semester ${archiveSemNumber} archived successfully! Active boards wiped.`);

        } catch (err) {
            console.error("Archive Error:", err);
            showMessage('error', `Failed to archive: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedBatch || !selectedRestoreSem) {
            showMessage('error', 'Please select a batch and an archived semester to restore.');
            return;
        }

        if (!window.confirm(`Are you sure you want to RESTORE Semester ${selectedRestoreSem} for Batch ${selectedBatch}?\n\nThis will OVERWRITE the currently active timetables, exams, special classes, and calendar for this batch.`)) return;

        setIsLoading(true);
        try {
            // 1. Fetch Archive
            const archiveRef = ref(db, `archives/${selectedBatch}/semester_${selectedRestoreSem}`);
            const archiveSnap = await get(archiveRef);

            if (!archiveSnap.exists()) {
                showMessage('error', 'Archive data not found!');
                setIsLoading(false);
                return;
            }

            const archiveData = archiveSnap.val();

            // 2. Build Overwrite Updates
            const updates = {};

            // Overwrite whole nodes
            if (archiveData.schedules) updates[`schedules/${selectedBatch}`] = archiveData.schedules;
            if (archiveData.list_events) updates[`list_events/${selectedBatch}`] = archiveData.list_events;
            if (archiveData.courses) updates[`courses/${selectedBatch}`] = archiveData.courses;
            if (archiveData.calendars) updates[`calendars/${selectedBatch}/events`] = archiveData.calendars;

            // 3. Commit
            await update(ref(db), updates);

            setSelectedRestoreSem('');
            showMessage('success', `Semester ${selectedRestoreSem} restrored successfully as the active semester.`);

        } catch (err) {
            console.error("Restore Error:", err);
            showMessage('error', `Failed to restore: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteArchive = async () => {
        if (!selectedBatch || !selectedRestoreSem) {
            showMessage('error', 'Please select a batch and an archived semester to delete.');
            return;
        }

        const confirmMsg = `DANGER: You are about to PERMANENTLY DELETE the Archive for Semester ${selectedRestoreSem} (Batch ${selectedBatch}).\n\nThis action is IRREVERSIBLE. Type "DELETE" to confirm.`;
        if (window.prompt(confirmMsg) !== "DELETE") return;

        setIsLoading(true);
        try {
            await update(ref(db), { [`archives/${selectedBatch}/semester_${selectedRestoreSem}`]: null });

            setSelectedRestoreSem('');
            showMessage('success', `Semester ${selectedRestoreSem} archive has been permanently deleted.`);
        } catch (err) {
            console.error("Delete Error:", err);
            showMessage('error', `Failed to delete archive: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className={`admin-subpage ${isMobile ? 'mobile-page-container' : ''} animate-fade-in`}>
            {!isMobile && (
                <header className="explorer-header focus-mode" style={{ background: 'transparent', padding: '0 0 20px 0', borderBottom: '1px solid var(--mac-divider)', height: 'auto', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <p style={{ color: 'var(--mac-text)', opacity: 0.6, margin: 0, fontSize: '15px' }}>
                            Safely transition between academic semesters by archiving old timetables and restoring historical ones.
                        </p>
                    </div>
                </header>
            )}

            <div className="scroll-container-mac" style={{ marginTop: isMobile ? '0' : '0' }}>
                {actionStatus.message && (
                    <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        background: actionStatus.type === 'success' ? 'rgba(40,200,64,0.1)' : 'rgba(255,59,48,0.1)',
                        color: actionStatus.type === 'success' ? 'var(--mac-success-text)' : 'var(--mac-warning-text)',
                        border: `1px solid ${actionStatus.type === 'success' ? 'rgba(40,200,64,0.2)' : 'rgba(255,59,48,0.2)'}`,
                        display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
                    }}>
                        {actionStatus.type === 'success' ? <RiCheckLine size={20} /> : <RiAlertLine size={20} />}
                        {actionStatus.message}
                    </div>
                )}

                <div className="settings-card" style={{ marginBottom: '32px', padding: isMobile ? '20px' : '30px' }}>
                    <div className="field">
                        <label>Target Batch</label>
                        <div className="s2-date-input-wrap">
                            <select
                                className="event-select s2-select-input"
                                value={selectedBatch}
                                onChange={(e) => { setSelectedBatch(e.target.value); setSelectedRestoreSem(''); }}
                            >
                                <option value="">-- Select Batch --</option>
                                {Object.keys(hierarchy).sort().reverse().map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                            <RiArrowDownSLine className="s2-date-icon" />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                    {/* ARCHIVE CARD */}
                    <div className="settings-card" style={{ padding: isMobile ? '20px' : '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,59,48,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mac-warning-text)', fontSize: '20px' }}>
                                <RiInboxArchiveLine />
                            </div>
                            <h3 style={{ margin: 0, color: 'var(--mac-text)', fontSize: '18px', fontWeight: 700 }}>Archive & Reset</h3>
                        </div>

                        <p style={{ color: 'var(--mac-text)', opacity: 0.7, fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
                            Snapshots schedules, exams, events, special classes, and calendar for <strong>Batch {selectedBatch || '...'}</strong>, copies them to the Archive Vault, and <strong>wipes the active boards clean</strong> for the new semester.
                        </p>

                        <div className="field" style={{ marginBottom: '24px' }}>
                            <label>Semester Number to Archive (e.g. "5")</label>
                            <input
                                type="number"
                                className="event-input"
                                placeholder="Current Sem Number"
                                value={archiveSemNumber}
                                onChange={e => setArchiveSemNumber(e.target.value)}
                            />
                        </div>

                        <button
                            className="btn-danger"
                            onClick={handleArchiveAndReset}
                            disabled={isLoading || !selectedBatch || !archiveSemNumber}
                            style={{ width: '100%', height: '48px', opacity: (isLoading || !selectedBatch || !archiveSemNumber) ? 0.5 : 1 }}
                        >
                            {isLoading ? <RiLoader4Line className="spin" /> : <RiInboxArchiveLine style={{ fontSize: '18px' }} />}
                            {isLoading ? 'Archiving...' : 'Confirm Archive & Reset'}
                        </button>
                    </div>

                    {/* RESTORE CARD */}
                    <div className="settings-card" style={{ padding: isMobile ? '20px' : '30px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(40,200,64,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mac-success-text)', fontSize: '20px' }}>
                                <RiArrowGoBackLine />
                            </div>
                            <h3 style={{ margin: 0, color: 'var(--mac-text)', fontSize: '18px', fontWeight: 700 }}>Restore Past Semester</h3>
                        </div>

                        <p style={{ color: 'var(--mac-text)', opacity: 0.7, fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
                            Copies a previously archived semester and <strong>overwrites</strong> the currently active boards for <strong>Batch {selectedBatch || '...'}</strong> to revert back in time.
                        </p>

                        <div className="field" style={{ marginBottom: '24px' }}>
                            <label>Available Archives</label>
                            <div className="s2-date-input-wrap">
                                <select
                                    className="event-select s2-select-input"
                                    value={selectedRestoreSem}
                                    onChange={e => setSelectedRestoreSem(e.target.value)}
                                    disabled={archivedSemesters.length === 0}
                                >
                                    <option value="">{archivedSemesters.length > 0 ? '-- Select Archive --' : 'No Archives Found'}</option>
                                    {archivedSemesters.map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                                <RiArrowDownSLine className="s2-date-icon" />
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleRestore}
                            disabled={isLoading || !selectedBatch || !selectedRestoreSem}
                            style={{ width: '100%', height: '48px', marginBottom: '12px', opacity: (isLoading || !selectedBatch || !selectedRestoreSem) ? 0.5 : 1 }}
                        >
                            {isLoading ? <RiLoader4Line className="spin" /> : <RiArrowGoBackLine style={{ fontSize: '18px' }} />}
                            {isLoading ? 'Restoring...' : 'Restore As Active'}
                        </button>

                        <button
                            className="btn-cancel"
                            onClick={handleDeleteArchive}
                            disabled={isLoading || !selectedBatch || !selectedRestoreSem}
                            style={{ width: '100%', height: '48px', color: 'var(--mac-warning-text)', opacity: (isLoading || !selectedBatch || !selectedRestoreSem) ? 0.5 : 1 }}
                        >
                            {isLoading ? <RiLoader4Line className="spin" /> : <RiInboxArchiveLine style={{ fontSize: '18px' }} />}
                            {isLoading ? 'Deleting...' : 'Delete Forever'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SemesterTransitionManager;

import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, get, update, onValue } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import { RiHistoryLine, RiArrowGoBackLine, RiAlertLine, RiInboxArchiveLine, RiCheckLine, RiLoader4Line } from 'react-icons/ri';
import "../../styles/admin-settings.css";

const SemesterTransitionManager = ({ user, userProfile }) => {
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

        const confirmMsg = `WARNING: You are about to ARCHIVE Semester ${archiveSemNumber} for Batch ${selectedBatch} and WIPE ALL ACTIVE TIMETABLES AND EXAMS.\n\nThis will take the active app offline for this batch until new data is entered.\n\nType "CONFIRM" to proceed.`;
        if (window.prompt(confirmMsg) !== "CONFIRM") return;

        setIsLoading(true);
        try {
            // 1. Fetch Snapshot
            const snapshotPaths = [
                `schedules/${selectedBatch}`,
                `events/${selectedBatch}`,
                `courses/${selectedBatch}`
            ];

            const snapshots = await Promise.all(snapshotPaths.map(p => get(ref(db, p))));
            const [schedulesSnap, eventsSnap, coursesSnap] = snapshots;

            // 2. Build Archive Updates
            const updates = {};
            const archiveBasePath = `archives/${selectedBatch}/semester_${archiveSemNumber}`;

            if (schedulesSnap.exists()) updates[`${archiveBasePath}/schedules`] = schedulesSnap.val();
            if (eventsSnap.exists()) updates[`${archiveBasePath}/events`] = eventsSnap.val();
            if (coursesSnap.exists()) updates[`${archiveBasePath}/courses`] = coursesSnap.val();

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

                    // Wipe timetable, exams, and local courses. Keep counseling intact.
                    updates[`schedules/${selectedBatch}/${dept}/${sec}/timetable`] = null;
                    updates[`schedules/${selectedBatch}/${dept}/${sec}/exams`] = null;
                    updates[`schedules/${selectedBatch}/${dept}/${sec}/courses`] = null;
                });
            });

            // Wipe central events entirely
            updates[`events/${selectedBatch}`] = null;
            // Wipe central courses entirely (if you store them independently, usually Neo puts them in schedules/master)
            updates[`courses/${selectedBatch}`] = null;

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

        if (!window.confirm(`Are you sure you want to RESTORE Semester ${selectedRestoreSem} for Batch ${selectedBatch}?\n\nThis will OVERWRITE the currently active timetables and exams for this batch.`)) return;

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
            if (archiveData.events) updates[`events/${selectedBatch}`] = archiveData.events;
            if (archiveData.courses) updates[`courses/${selectedBatch}`] = archiveData.courses;

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
        <div className="admin-subpage animate-fade-in" style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px', margin: 0, color: 'var(--mac-text)' }}>
                    <RiHistoryLine style={{ color: 'var(--mac-blue)' }} /> Semester Timeline
                </h1>
                <p style={{ color: 'var(--mac-text)', opacity: 0.6, marginTop: '8px', fontSize: '15px' }}>
                    Safely transition between academic semesters by archiving old timetables and restoring historical ones.
                </p>
            </div>

            {actionStatus.message && (
                <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    background: actionStatus.type === 'success' ? 'rgba(40,200,64,0.1)' : 'rgba(255,59,48,0.1)',
                    color: actionStatus.type === 'success' ? 'var(--mac-success-text)' : 'var(--mac-warning-text)',
                    border: `1px solid ${actionStatus.type === 'success' ? 'rgba(40,200,64,0.2)' : 'rgba(255,59,48,0.2)'}`,
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    {actionStatus.type === 'success' ? <RiCheckLine /> : <RiAlertLine />}
                    {actionStatus.message}
                </div>
            )}

            <div style={{ padding: '24px', background: 'var(--mac-card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--mac-text-secondary)', marginBottom: '8px' }}>Target Batch</label>
                <select
                    className="s2-complaint-input s2-select-input"
                    style={{ width: '100%', maxWidth: '300px', padding: '12px', borderRadius: '8px', background: 'var(--mac-container-bg)', border: '1px solid var(--border-color)', color: 'var(--mac-text)', fontSize: '16px' }}
                    value={selectedBatch}
                    onChange={(e) => { setSelectedBatch(e.target.value); setSelectedRestoreSem(''); }}
                >
                    <option value="">-- Select Batch --</option>
                    {Object.keys(hierarchy).sort().reverse().map(b => (
                        <option key={b} value={b}>{b}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>

                {/* ARCHIVE CARD */}
                <div style={{ padding: '24px', background: 'rgba(255,59,48,0.03)', borderRadius: '12px', border: '1px solid rgba(255,59,48,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,59,48,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mac-warning-text)', fontSize: '20px' }}>
                            <RiInboxArchiveLine />
                        </div>
                        <h3 style={{ margin: 0, color: 'var(--mac-warning-text)', fontSize: '18px' }}>Archive & Reset</h3>
                    </div>

                    <p style={{ color: 'var(--mac-text)', opacity: 0.7, fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
                        Snapshots the active schedules, exams, and events for <strong>Batch {selectedBatch || '...'}</strong>, copies them to the Archive Vault, and <strong>wipes the active boards clean</strong> for the new semester.
                    </p>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--mac-text-secondary)', marginBottom: '8px' }}>Semester Number to Archive (e.g. "5")</label>
                        <input
                            type="number"
                            placeholder="Current Sem Number"
                            value={archiveSemNumber}
                            onChange={e => setArchiveSemNumber(e.target.value)}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--mac-card-bg)', border: '1px solid rgba(255,59,48,0.2)', color: 'var(--mac-warning-text)', fontSize: '16px', outline: 'none' }}
                        />
                    </div>

                    <button
                        onClick={handleArchiveAndReset}
                        disabled={isLoading || !selectedBatch || !archiveSemNumber}
                        style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--mac-warning-text)', color: '#fff', border: 'none', fontSize: '15px', fontWeight: 600, cursor: (isLoading || !selectedBatch || !archiveSemNumber) ? 'not-allowed' : 'pointer', opacity: (isLoading || !selectedBatch || !archiveSemNumber) ? 0.5 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        {isLoading ? <RiLoader4Line className="spin" /> : <RiInboxArchiveLine />}
                        {isLoading ? 'Archiving...' : 'Confirm Archive & Reset'}
                    </button>
                </div>

                {/* RESTORE CARD */}
                <div style={{ padding: '24px', background: 'rgba(40,200,64,0.03)', borderRadius: '12px', border: '1px solid rgba(40,200,64,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(40,200,64,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mac-success-text)', fontSize: '20px' }}>
                            <RiArrowGoBackLine />
                        </div>
                        <h3 style={{ margin: 0, color: 'var(--mac-success-text)', fontSize: '18px' }}>Restore Past Semester</h3>
                    </div>

                    <p style={{ color: 'var(--mac-text)', opacity: 0.7, fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
                        Copies a previously archived semester and <strong>overwrites</strong> the currently active boards for <strong>Batch {selectedBatch || '...'}</strong> to revert back in time.
                    </p>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--mac-text-secondary)', marginBottom: '8px' }}>Available Archives</label>
                        <select
                            className="s2-complaint-input s2-select-input"
                            value={selectedRestoreSem}
                            onChange={e => setSelectedRestoreSem(e.target.value)}
                            disabled={archivedSemesters.length === 0}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--mac-card-bg)', border: '1px solid rgba(40,200,64,0.2)', color: 'var(--mac-success-text)', fontSize: '16px', outline: 'none' }}
                        >
                            <option value="">{archivedSemesters.length > 0 ? '-- Select Archive --' : 'No Archives Found'}</option>
                            {archivedSemesters.map(sem => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleRestore}
                        disabled={isLoading || !selectedBatch || !selectedRestoreSem}
                        style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'var(--mac-success-text)', color: '#fff', border: 'none', fontSize: '15px', fontWeight: 600, cursor: (isLoading || !selectedBatch || !selectedRestoreSem) ? 'not-allowed' : 'pointer', opacity: (isLoading || !selectedBatch || !selectedRestoreSem) ? 0.5 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
                    >
                        {isLoading ? <RiLoader4Line className="spin" /> : <RiArrowGoBackLine />}
                        {isLoading ? 'Restoring...' : 'Restore As Active'}
                    </button>

                    <button
                        onClick={handleDeleteArchive}
                        disabled={isLoading || !selectedBatch || !selectedRestoreSem}
                        style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'transparent', color: 'var(--mac-warning-text)', border: '1px solid var(--mac-warning-text)', fontSize: '15px', fontWeight: 600, cursor: (isLoading || !selectedBatch || !selectedRestoreSem) ? 'not-allowed' : 'pointer', opacity: (isLoading || !selectedBatch || !selectedRestoreSem) ? 0.5 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        {isLoading ? <RiLoader4Line className="spin" /> : <RiInboxArchiveLine />}
                        {isLoading ? 'Deleting...' : 'Delete Forever'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SemesterTransitionManager;

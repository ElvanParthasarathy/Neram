import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { convertTo12Hour, formatDateDDMMYYYY } from '../../utils/timeUtils';
import HybridDateInput from '../../components/HybridDateInput';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Using Native Browser Date Inputs
import {
    RiTrophyLine, RiArrowRightSLine, RiTeamLine, RiLayoutGridLine,
    RiSave3Line, RiAddLine, RiDeleteBin6Line, RiDeleteBin6Fill, RiBookOpenLine, RiEditLine, RiCloseLine, RiArrowLeftLine, RiArrowDownSLine, RiArrowUpSLine,
    RiCalendarEventLine, RiTimeLine, RiHashtag, RiGroupLine, RiFileCopyLine, RiCheckLine, RiExternalLinkLine, RiHistoryLine, RiRefreshLine, RiCalendarLine
} from 'react-icons/ri';

const PORTION_DEFAULTS = {
    'CT1': 'Unit 1',
    'IA1': 'Unit 1 & 2',
    'CT2': 'Unit 3',
    'IA2': 'Unit 3 & 4',
    'Model': 'Full Syllabus',
    'Practical': 'All Experiments',
    'Semester': 'Full Syllabus'
};

const newBlankPracticalSubject = () => ({
    code: '', scope: 'Common',
    batches: [{ label: '', date: '', startTime: '08:30', endTime: '10:30', registerRange: '', totalCount: '' }]
});

const ExamManager = ({ user, userProfile, isMobile }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const hasAutoNavigated = useRef(false);

    // --- ROLE DETECTION ---
    const emailRole = user?.email ? getHardcodedRole(user.email) : null;
    const finalRole = emailRole || userProfile?.role || 'student';
    const isRep = finalRole === 'rep';

    // --- HISTORY LOGIC ---
    const viewLevel = searchParams.get('elvl') || 'batches';
    const path = {
        batch: searchParams.get('eb') || '',
        dept: searchParams.get('ed') || ''
    };

    const updateLevel = (level, newPath = {}) => {
        const params = {
            mod: 'exams',
            elvl: level,
            eb: newPath.batch !== undefined ? newPath.batch : path.batch,
            ed: newPath.dept !== undefined ? newPath.dept : path.dept
        };
        Object.keys(params).forEach(key => !params[key] && delete params[key]);
        setSearchParams(params);
    };

    // Physical Back Button Logic
    const handleBack = () => {
        if (viewLevel === 'editor') updateLevel('depts', { dept: '' });
        else if (viewLevel === 'depts') updateLevel('batches', { batch: '' });
    };

    const [hierarchy, setHierarchy] = useState({});
    const [masterData, setMasterData] = useState({ courses: [], exams: [], sections: [], rawDeptData: {} });

    // Default scope for new subjects
    const [newExam, setNewExam] = useState({ type: 'CT1', title: '', startDate: '', endDate: '', subjects: [] });

    const [editingExamId, setEditingExamId] = useState(null);
    const [editBuffer, setEditBuffer] = useState(null);
    const [showCreator, setShowCreator] = useState(false);
    const [expandedExams, setExpandedExams] = useState([]);
    const [isEditListMode, setIsEditListMode] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedExams, setSelectedExams] = useState([]);

    // Auto-close editor if edit mode is toggled off
    useEffect(() => {
        if (!isEditListMode) {
            setEditingExamId(null);
            setEditBuffer(null);
            setIsDeleteMode(false);
            setSelectedExams([]);
        }
    }, [isEditListMode]);

    // --- CONFIRMATION MODAL STATE ---
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });

    const showConfirm = (title, message, onConfirm) => {
        setConfirmModal({ show: true, title, message, onConfirm });
    };
    const closeConfirm = () => setConfirmModal({ ...confirmModal, show: false });

    // Fetch Hierarchy
    useEffect(() => {
        const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => setHierarchy(snap.val() || {}));
        return () => unsub();
    }, []);

    // --- AUTO-NAVIGATE FOR REPS ---
    useEffect(() => {
        if (isRep && !hasAutoNavigated.current && userProfile?.batch && userProfile?.department) {
            hasAutoNavigated.current = true;
            const params = {
                mod: 'exams',
                elvl: 'editor',
                eb: userProfile.batch,
                ed: userProfile.department
            };
            setSearchParams(params, { replace: true });
        }
    }, [isRep, userProfile]);

    const sectionsForDeptStr = Array.isArray(hierarchy[path.batch]?.[path.dept]) ? hierarchy[path.batch][path.dept].join(',') : '';

    // --- FETCH DEPT DATA (Aggregation) ---
    useEffect(() => {
        if (viewLevel === 'editor' && path.dept) {
            const deptRef = ref(db, `schedules/${path.batch}/${path.dept}`);
            const unsub = onValue(deptRef, (snap) => {
                const deptData = snap.val() || {};

                const allCoursesMap = {};
                const examsMap = {};
                let sectionIds = sectionsForDeptStr ? Array.from(new Set(sectionsForDeptStr.split(','))) : [];
                if (sectionIds.length === 0) {
                    sectionIds = Array.from(new Set(Object.keys(deptData).filter(k => k !== 'initialized' && k !== '_master' && typeof deptData[k] === 'object')));
                }

                // Aggregate Courses from Master definitions instead of using Section-level faculty overrides
                if (deptData._master && deptData._master.courses) {
                    deptData._master.courses.forEach(c => allCoursesMap[c.code] = c);
                }

                sectionIds.forEach(secId => {
                    const secData = deptData[secId] || {};

                    // Aggregate Exams
                    const secExams = secData.exams || [];
                    secExams.forEach(ex => {
                        if (!examsMap[ex.id]) {
                            examsMap[ex.id] = { ...ex, subjects: [] };
                        }

                        // Merge Subjects
                        (ex.subjects || []).forEach(sub => {
                            const existingSub = examsMap[ex.id].subjects.find(s => s.code === sub.code && s.date === sub.date);
                            if (existingSub) {
                                if (!existingSub.scopes.includes(secId)) {
                                    existingSub.scopes.push(secId);
                                    existingSub.scopes.sort();
                                }
                            } else {
                                examsMap[ex.id].subjects.push({ ...sub, scopes: [secId] });
                            }
                        });
                    });
                });

                const uniqueCourses = Object.values(allCoursesMap).sort((a, b) => a.code.localeCompare(b.code));

                // Format scopes for display
                const mergedExams = Object.values(examsMap).map(ex => {
                    ex.subjects.forEach(sub => {
                        if (sub.scopes.length === sectionIds.length || sectionIds.length === 0) {
                            sub.scope = 'Common';
                            // Strip auto-generated section-letter labels so admin edit sees blank
                            if (sub.batches) {
                                sub.batches = sub.batches.map(b => ({
                                    ...b,
                                    label: sectionIds.includes(b.label) ? '' : b.label
                                }));
                            }
                        } else {
                            // If it's single section, just store the ID (e.g., 'A'), else join
                            sub.scope = sub.scopes.length === 1 ? sub.scopes[0] : sub.scopes.join(', ');
                        }
                    });
                    ex.subjects.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
                    return ex;
                });

                // Sort exams natively (newest last or by startDate)
                mergedExams.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));

                setMasterData({
                    courses: uniqueCourses,
                    exams: mergedExams,
                    sections: sectionIds,
                    rawDeptData: deptData
                });
            });
            return () => unsub();
        }
    }, [viewLevel, path.batch, path.dept, sectionsForDeptStr]);

    // --- DATE/TIME HELPERS ---
    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
    };
    const toLocalISO = (date) => {
        if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    // to24h definition removed
    const to24hHelper = (time) => {
        if (!time) return "08:20";
        const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
            let [_, hours, minutes, modifier] = match;
            hours = parseInt(hours, 10);
            if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
            return `${String(hours).padStart(2, '0')}:${minutes}`;
        }
        return time;
    };
    const to12h = (time) => convertTo12Hour(time);

    const getSubjectName = (code) => masterData.courses.find(c => c.code === code)?.name || "Unknown Subject";

    // --- MULTIPOINT DB SAVE ---
    const syncCentralExamToDB = async (examObj, isDelete = false) => {
        try {
            const updates = {};
            const sections = masterData.sections;

            sections.forEach(secId => {
                const existingSecExams = (masterData.rawDeptData[secId]?.exams || []).filter(e => e.id !== examObj.id);

                if (!isDelete) {
                    let secSubjects;

                    if (examObj.type === 'Practical') {
                        secSubjects = examObj.subjects
                            .filter(sub => {
                                const scopeStr = sub.scope || 'Common';
                                return scopeStr === 'Common' || scopeStr.split(',').map(s => s.trim()).includes(secId);
                            })
                            .map(sub => {
                                if (sub.scope === 'Common') {
                                    // Common scope: ALL batches go to ALL sections
                                    // Each section gets a copy with label set to section letter
                                    const filteredBatches = sub.batches.map((b) => ({
                                        ...b,
                                        label: b.label || secId
                                    }));
                                    return {
                                        code: sub.code,
                                        scope: sub.scope,
                                        batches: filteredBatches
                                    };
                                } else {
                                    // Section-specific: all batches belong to that scope section
                                    const scopeSection = sub.scope;
                                    const filteredBatches = sub.batches.map((b, bIdx) => ({
                                        ...b,
                                        section: scopeSection,
                                        label: b.label || scopeSection || String.fromCharCode(65 + bIdx)
                                    }));
                                    return {
                                        code: sub.code,
                                        scope: sub.scope,
                                        batches: filteredBatches
                                    };
                                }
                            });
                    } else {
                        secSubjects = examObj.subjects
                            .filter(sub => {
                                const scopeStr = sub.scope || 'Common';
                                return scopeStr === 'Common' || scopeStr.split(',').map(s => s.trim()).includes(secId);
                            })
                            .map(sub => {
                                const cleanSub = { ...sub };
                                delete cleanSub.scope;
                                delete cleanSub.scopes;
                                return cleanSub;
                            });
                    }

                    updates[`schedules/${path.batch}/${path.dept}/${secId}/exams`] = [
                        ...existingSecExams,
                        {
                            id: examObj.id,
                            type: examObj.type,
                            title: examObj.title,
                            startDate: examObj.startDate,
                            endDate: examObj.endDate,
                            subjects: secSubjects
                        }
                    ];
                } else {
                    updates[`schedules/${path.batch}/${path.dept}/${secId}/exams`] = existingSecExams;
                }
            });

            await update(ref(db), updates);
            alert(isDelete ? "Central Exam Deleted!" : "Central Exam Sync Complete!");
        } catch (err) { alert(err.message); }
    };

    const handleTypeChange = (newType) => {
        if (newType === 'Practical') {
            setNewExam({ ...newExam, type: newType, subjects: [] });
        } else {
            const defaultPortion = PORTION_DEFAULTS[newType] || 'Full Syllabus';
            const updatedSubjects = newExam.subjects.map(s => ({ ...s, portion: defaultPortion }));
            setNewExam({ ...newExam, type: newType, subjects: updatedSubjects });
        }
    };

    const startEditing = (ex) => {
        if (ex.type === 'Practical') {
            const migratedSubjects = (ex.subjects || []).map(s => {
                // Already new shape
                if (s.batches) return { ...s };
                // Old flat shape — migrate into single batch row
                return {
                    code: s.code,
                    scope: s.scope || 'Common',
                    batches: [{
                        label: s.portion || '',
                        section: '',
                        date: s.date || '',
                        startTime: to24hHelper(s.startTime || '08:30'),
                        endTime: to24hHelper(s.endTime || '10:30'),
                        registerRange: '',
                        totalCount: ''
                    }]
                };
            });
            setEditBuffer({ ...ex, subjects: migratedSubjects });
        } else {
            const migratedSubjects = (ex.subjects || []).map(s => ({
                ...s,
                startTime: to24hHelper(s.startTime || (s.time ? s.time.split('-')[0].trim() : '08:20')),
                endTime: to24hHelper(s.endTime || (s.time ? s.time.split('-')[1].trim() : '11:30')),
                portion: s.portion || PORTION_DEFAULTS[ex.type] || 'Full Syllabus',
                scope: s.scope || 'Common'
            }));
            setEditBuffer({ ...ex, subjects: migratedSubjects });
        }
        setEditingExamId(ex.id);
    };

    const handleToggleExamSelect = (id) => {
        setSelectedExams(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAllExams = () => {
        const allIds = (masterData.exams || []).map(ex => ex.id);
        if (selectedExams.length === allIds.length && allIds.length > 0) {
            setSelectedExams([]);
        } else {
            setSelectedExams(allIds);
        }
    };

    const handleBulkDeleteExams = async () => {
        if (selectedExams.length === 0) return;
        if (window.confirm(`Delete ${selectedExams.length} selected exam(s)?`)) {
            for (const id of selectedExams) {
                const examToDelete = masterData.exams.find(e => e.id === id);
                if (examToDelete) {
                    await syncCentralExamToDB(examToDelete, true);
                }
            }
            setSelectedExams([]);
            setIsDeleteMode(false);
        }
    };

    const saveEdit = () => {
        if (!editBuffer) return;
        syncCentralExamToDB(editBuffer);
        setEditingExamId(null);
        setEditBuffer(null);
    };

    const handlePublish = () => {
        if (!newExam.title || newExam.subjects.length === 0) return alert("Fill details first");
        const readyExam = { ...newExam, id: Date.now() };
        syncCentralExamToDB(readyExam);
        setNewExam({ type: 'CT1', title: '', startDate: '', endDate: '', subjects: [] });
    };

    // ---- PRACTICAL SUBJECT CARD (used in creator + edit mode) ----
    const renderPracticalSubjectEditor = (sub, subIdx, examState, setExamState) => {
        const isCommon = sub.scope === 'Common';

        const updateSub = (field, value) => {
            const subs = [...examState.subjects];
            subs[subIdx] = { ...subs[subIdx], [field]: value };
            setExamState({ ...examState, subjects: subs });
        };

        const updateBatch = (bIdx, field, value) => {
            const subs = [...examState.subjects];
            const batches = [...subs[subIdx].batches];
            batches[bIdx] = { ...batches[bIdx], [field]: value };
            subs[subIdx] = { ...subs[subIdx], batches };
            setExamState({ ...examState, subjects: subs });
        };

        const addBatch = () => {
            const subs = [...examState.subjects];
            const last = subs[subIdx].batches.at(-1);
            subs[subIdx].batches = [...subs[subIdx].batches, {
                label: '',
                date: last?.date || '',
                startTime: last?.startTime || '08:30',
                endTime: last?.endTime || '10:30',
                registerRange: '', totalCount: ''
            }];
            setExamState({ ...examState, subjects: subs });
        };

        const removeBatch = (bIdx) => {
            const subs = [...examState.subjects];
            subs[subIdx].batches = subs[subIdx].batches.filter((_, i) => i !== bIdx);
            setExamState({ ...examState, subjects: subs });
        };

        const removeSub = () => {
            showConfirm("Remove Subject?", `Remove ${getSubjectName(sub.code)}?`, () => {
                setExamState({ ...examState, subjects: examState.subjects.filter((_, i) => i !== subIdx) });
            });
        };

        return (
            <div key={subIdx} className="practical-subject-card">
                {/* Subject header row */}
                <div className="practical-header-row">
                    <div className="input-group-vertical variant-code">
                        <label>Subject</label>
                        <select value={sub.code} onChange={e => updateSub('code', e.target.value)}>
                            <option value="">Select Course</option>
                            {masterData.courses.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                        </select>
                    </div>
                    <div className="input-group-vertical variant-scope">
                        <label>Scope</label>
                        <select value={sub.scope} onChange={e => updateSub('scope', e.target.value)}>
                            <option value="Common">Common (All Secs)</option>
                            {masterData.sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                        </select>
                    </div>
                    <button className="btn-del-mini practical-remove-btn" onClick={removeSub}><RiDeleteBin6Line /> Remove</button>
                </div>

                {/* Batch rows */}
                <div className="practical-batch-wrap">
                    <table className="practical-batch-table">
                        <thead>
                            <tr>
                                <th>Batch</th>
                                <th>Date</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Register Range</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sub.batches.map((b, bIdx) => (
                                <tr key={bIdx}>
                                    <td data-label="Batch">
                                        <input value={b.label} onChange={e => updateBatch(bIdx, 'label', e.target.value)} placeholder={!isCommon ? sub.scope : ''} />
                                    </td>
                                    <td data-label="Date">
                                        <div className="field">
                                            <HybridDateInput
                                                value={b.date}
                                                onChange={(val) => updateBatch(bIdx, 'date', val)}
                                            />
                                        </div>
                                    </td>
                                    <td data-label="Start"><input type="time" value={b.startTime} onChange={e => updateBatch(bIdx, 'startTime', e.target.value)} /></td>
                                    <td data-label="End"><input type="time" value={b.endTime} onChange={e => updateBatch(bIdx, 'endTime', e.target.value)} /></td>
                                    <td data-label="Reg. Range"><input value={b.registerRange} onChange={e => updateBatch(bIdx, 'registerRange', e.target.value)} placeholder="111523104001–4032" /></td>
                                    <td data-label="Total"><input value={b.totalCount} onChange={e => updateBatch(bIdx, 'totalCount', e.target.value)} placeholder="32" /></td>
                                    <td data-label="" className="batch-action-cell">
                                        <button className="btn-del-mini" onClick={() => {
                                            showConfirm("Remove Batch?", `Remove batch ${b.label || sub.scope}?`, () => removeBatch(bIdx));
                                        }}><RiDeleteBin6Line /> Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <button className="btn-add-line" style={{ marginTop: '8px' }} onClick={addBatch}><RiAddLine /> Add Batch Row</button>
            </div>
        );
    };

    // ---- PRACTICAL VIEW MODE (published card) ----
    const renderPracticalSubjectView = (sub, examType) => {
        const isCommon = sub.scope === 'Common';
        return (
            <div className="practical-view-card">
                <div className="practical-view-header">
                    <strong>{sub.code}</strong>
                    <span className="practical-view-name">— {getSubjectName(sub.code)}</span>
                    <span className={`portion-badge ${isCommon ? 'scope-common' : 'scope-specific'}`}>{sub.scope}</span>
                </div>
                <div className="practical-batch-wrap">
                    <table className="practical-batch-table view-mode">
                        <thead>
                            <tr>
                                <th>Batch</th>
                                <th>Date</th>
                                <th>Time</th>
                                {(sub.batches || []).some(b => b.registerRange) && <th>Register Range</th>}
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sub.batches || []).map((b, i) => (
                                <tr key={i}>
                                    <td data-label="Batch"><strong>{b.label || (!isCommon ? sub.scope : 'All Sections')}</strong></td>
                                    <td data-label="Date">{parseDate(b.date)?.toLocaleDateString('en-GB') || b.date}</td>
                                    <td data-label="Time">{to12h(b.startTime)} – {to12h(b.endTime)}</td>
                                    {(sub.batches || []).some(b => b.registerRange) && <td data-label="Reg. Range">{b.registerRange || '—'}</td>}
                                    <td data-label="Total">{b.totalCount || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="exam-manager-container admin-subpage animate-fade-in">
            <header className="explorer-header focus-mode">
                <div className="breadcrumb-nav">
                    {!isRep && viewLevel !== 'batches' && (
                        <button className="explorer-back-btn" onClick={handleBack}>
                            <RiArrowLeftLine /> Back
                        </button>
                    )}

                    <div className="breadcrumb-list">
                        <span className="crumb-btn level-root" onClick={() => updateLevel('batches', { batch: '', dept: '' })}>Exams</span>

                        {/* Mobile Truncation Ellipsis */}
                        <span className="crumb-ellipsis-container">
                            <RiArrowRightSLine className="crumb-sep" />
                            <span className="crumb-static">...</span>
                        </span>

                        {path.batch && <><RiArrowRightSLine className="crumb-sep level-batch-sep" /> <span className="crumb-btn level-batch" onClick={() => updateLevel('depts', { dept: '' })}>{path.batch}</span></>}
                        {path.dept && <><RiArrowRightSLine className="crumb-sep level-dept-sep" /> <span className="crumb-static level-dept">{path.dept}</span></>}
                    </div>
                </div>
            </header>

            {viewLevel !== 'editor' ? (
                <div className="explorer-content explorer-grid">
                    {viewLevel === 'batches' && Object.keys(hierarchy || {}).sort().reverse().map(b => (
                        <div key={b} className="explorer-card" onClick={() => updateLevel('depts', { batch: b })}>
                            <RiTeamLine className="card-icon" /> <div className="card-info"><h3>Batch {b}</h3><p>Manage Exams Centrally</p></div>
                        </div>
                    ))}
                    {viewLevel === 'depts' && path.batch && Object.keys(hierarchy[path.batch] || {}).filter(k => k !== 'initialized').map(d => (
                        <div key={d} className="explorer-card" onClick={() => updateLevel('editor', { dept: d })}>
                            <RiLayoutGridLine className="card-icon" /> <div className="card-info"><h3>{d}</h3><p>Open Dept Manager</p></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="exam-editor-workspace">
                    {/* SECTION HEADER WITH EDIT LIST BUTTON */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 className="section-divider-title" style={{ margin: 0, border: 'none', color: 'var(--mac-text)', textTransform: 'none', fontSize: '15px', fontWeight: 700, padding: 0 }}>Exams</h3>
                        {isEditListMode ? (
                            <div className="master-header-row" style={{ display: 'flex', gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
                                <button
                                    className="role-header-pill secondary"
                                    onClick={() => { setIsEditListMode(false); setShowCreator(false); }}
                                    style={{ minWidth: '90px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="role-header-pill active"
                                    onClick={() => { setIsEditListMode(false); setShowCreator(false); }}
                                    style={{ minWidth: '90px' }}
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <button
                                 className="edit-list-btn"
                                 onClick={() => { setIsEditListMode(true); setShowCreator(true); }}
                             >
                                 <RiEditLine style={{ marginRight: '6px' }} /> Edit List
                             </button>
                        )}
                    </div>

                    {/* 1. CREATOR SECTION */}
                    {isEditListMode && showCreator && (
                    <>
                        {/* BOX 1: Type / Title / Dates */}
                        <div className="settings-card exam-creator-card" style={{ border: '2px solid var(--mac-blue-15)' }}>
                            <h2 className="editor-title" style={{ color: 'var(--mac-blue)' }}><RiTrophyLine /> Create Exam</h2>
                            <p style={{ opacity: 0.7, marginBottom: '20px', fontSize: '13px' }}>Changes published here will automatically distribute to <strong>all</strong> sections in {path.dept}.</p>
                            <div className="exam-config-grid">
                                <div className="field">
                                    <label>Exam Type</label>
                                    <select value={newExam.type} onChange={e => handleTypeChange(e.target.value)}>
                                        {Object.keys(PORTION_DEFAULTS).map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                </div>
                                <div className="field"><label>Title</label><input value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} placeholder="e.g. Model Exams" /></div>

                                <div className="field">
                                    <label>Show From</label>
                                    <HybridDateInput
                                        value={newExam.startDate}
                                        onChange={(val) => setNewExam({ ...newExam, startDate: val })}
                                    />
                                </div>

                                <div className="field">
                                    <label>Show Until</label>
                                    <HybridDateInput
                                        value={newExam.endDate}
                                        onChange={(val) => setNewExam({ ...newExam, endDate: val })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* BOX 2: Type-specific subjects + actions */}
                        <div className="settings-card exam-creator-card">
                            <div className="subject-mapping-section">
                                {newExam.type === 'Practical' ? (
                                    <>
                                        {newExam.subjects.map((sub, idx) =>
                                            renderPracticalSubjectEditor(sub, idx, newExam, setNewExam)
                                        )}
                                        <button className="btn-add-line" onClick={() =>
                                            setNewExam({ ...newExam, subjects: [...newExam.subjects, newBlankPracticalSubject()] })
                                        }><RiAddLine /> Add Subject</button>
                                    </>
                                ) : (
                                    <>
                                        {newExam.subjects.map((sub, idx) => (
                                            <div key={idx} className="exam-subject-row professional">
                                                <div className="input-group-vertical">
                                                    <label>Date</label>
                                                    <HybridDateInput
                                                        value={sub.date}
                                                        onChange={(val) => { let s = [...newExam.subjects]; s[idx].date = val; setNewExam({ ...newExam, subjects: s }); }}
                                                    />
                                                </div>
                                                <div className="input-group-vertical variant-code">
                                                    <label>Subject</label>
                                                    <select value={sub.code} onChange={e => { let s = [...newExam.subjects]; s[idx].code = e.target.value; setNewExam({ ...newExam, subjects: s }); }}>
                                                        <option value="">Select Course</option>
                                                        {masterData.courses.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="input-group-vertical variant-scope">
                                                    <label>Scope</label>
                                                    <select value={sub.scope} onChange={e => { let s = [...newExam.subjects]; s[idx].scope = e.target.value; setNewExam({ ...newExam, subjects: s }); }}>
                                                        <option value="Common">Common (All Secs)</option>
                                                        {masterData.sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                                                        {sub.scope && sub.scope !== 'Common' && !masterData.sections.includes(sub.scope) && (
                                                            <option value={sub.scope}>{sub.scope} (Mixed)</option>
                                                        )}
                                                    </select>
                                                </div>
                                                <div className="input-group-vertical variant-portion">
                                                    <label>Portion</label>
                                                    <input list="portion-presets" value={sub.portion} onChange={e => { let s = [...newExam.subjects]; s[idx].portion = e.target.value; setNewExam({ ...newExam, subjects: s }); }} placeholder="Portion..." />
                                                </div>
                                                <div className="input-group-vertical"><label>Start</label><input type="time" value={sub.startTime} onChange={e => { let s = [...newExam.subjects]; s[idx].startTime = e.target.value; setNewExam({ ...newExam, subjects: s }); }} /></div>
                                                <div className="input-group-vertical"><label>End</label><input type="time" value={sub.endTime} onChange={e => { let s = [...newExam.subjects]; s[idx].endTime = e.target.value; setNewExam({ ...newExam, subjects: s }); }} /></div>
                                                <button className="btn-del-mini" onClick={() => {
                                                    showConfirm("Delete Subject?", `Remove ${getSubjectName(sub.code)}?`, () => setNewExam({ ...newExam, subjects: newExam.subjects.filter((_, i) => i !== idx) }));
                                                }}><RiDeleteBin6Line /></button>
                                            </div>
                                        ))}
                                        <datalist id="portion-presets">
                                            {[...new Set(Object.values(PORTION_DEFAULTS))].map(p => <option key={p} value={p} />)}
                                        </datalist>
                                        <button className="btn-add-line" onClick={() => {
                                            const lastSub = newExam.subjects[newExam.subjects.length - 1];
                                            setNewExam({
                                                ...newExam,
                                                subjects: [...newExam.subjects, {
                                                    date: '', code: '',
                                                    startTime: lastSub ? to24hHelper(lastSub.startTime) : '08:20',
                                                    endTime: lastSub ? to24hHelper(lastSub.endTime) : '11:30',
                                                    portion: PORTION_DEFAULTS[newExam.type],
                                                    scope: 'Common'
                                                }]
                                            });
                                        }}><RiAddLine /> Add Subject Day</button>
                                    </>
                                )}
                                {newExam.subjects.length > 0 && (
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                        <button className="btn-save-master" style={{ flex: 1, height: '36px', fontSize: '13px', padding: '0 18px', borderRadius: '50px' }} onClick={handlePublish}>Publish</button>
                                        <button className="btn-cancel-mini" style={{ flex: 1, padding: '0 18px', height: '36px', fontSize: '13px', borderRadius: '50px' }} onClick={() => { setNewExam({ type: 'CT1', title: '', startDate: '', endDate: '', subjects: [] }); }}>Cancel</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                    )}


                    {/* 2. PUBLISHED SECTION */}
                    <div className="published-exams-section">
                        {/* The section title and edit list button were moved to the top */}
                        {(masterData.exams || []).map(ex => {
                            const isEditing = editingExamId === ex.id;
                            const currentData = isEditing ? editBuffer : ex;

                            return (
                                <React.Fragment key={ex.id}>
                                {isEditing && (
                                    <div className="master-header-row pill-group-row desktop-edit-actions" style={{ justifyContent: 'flex-end', marginBottom: '8px' }}>
                                        <button className="role-header-pill secondary" onClick={() => { setEditingExamId(null); setEditBuffer(null); }}>Cancel</button>
                                        <button className="role-header-pill active" onClick={saveEdit}>Save</button>
                                    </div>
                                )}
                                <div key={ex.id} className={`settings-card published-exam-card ${isEditing ? 'editing-active' : ''}`}>
                                    <header 
                                        className="published-header" 
                                        style={{ alignItems: 'center', cursor: !isEditing ? 'pointer' : 'default' }}
                                        onClick={(e) => {
                                            if (isEditing) return;
                                            if (e.target.closest('button') || e.target.closest('input')) return;
                                            setExpandedExams(prev => prev.includes(ex.id) ? prev.filter(id => id !== ex.id) : [...prev, ex.id]);
                                        }}
                                    >
                                        {isEditing ? (
                                            <div className="edit-meta-inputs" style={{ flex: 1 }}>
                                                <div className="mobile-edit-actions pill-group-row master-header-row" style={{ width: '100%', flexDirection: 'row', gap: '8px', marginBottom: '16px' }}>
                                                    <button className="role-header-pill secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setEditingExamId(null); setEditBuffer(null); }}>Cancel</button>
                                                    <button className="role-header-pill active" style={{ flex: 1, justifyContent: 'center' }} onClick={saveEdit}>Save</button>
                                                </div>
                                                <input className="edit-title-input" value={currentData.title} onChange={e => setEditBuffer({ ...editBuffer, title: e.target.value })} />
                                                <div className="exam-config-grid" style={{ marginTop: '20px', marginBottom: '0', paddingBottom: '0', borderBottom: 'none' }}>
                                                    <div className="input-group-vertical">
                                                        <label>Range From</label>
                                                        <HybridDateInput value={currentData.startDate} onChange={(val) => setEditBuffer({ ...editBuffer, startDate: val })} />
                                                    </div>
                                                    <div className="input-group-vertical">
                                                        <label>Range To</label>
                                                        <HybridDateInput value={currentData.endDate} onChange={(val) => setEditBuffer({ ...editBuffer, endDate: val })} />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {isDeleteMode && (
                                                    <input
                                                        type="checkbox"
                                                        className="mac-checkbox"
                                                        style={{ marginRight: '16px', flexShrink: 0 }}
                                                        checked={selectedExams.includes(ex.id)}
                                                        onChange={(e) => { e.stopPropagation(); handleToggleExamSelect(ex.id); }}
                                                    />
                                                )}
                                                <div className="pub-title-group" style={{ flex: 1 }}>
                                                    <RiTrophyLine className="icon-main" style={{ color: 'var(--mac-blue)' }} />
                                                    <div>
                                                        <h3>{ex.title} <span>({ex.type})</span></h3>
                                                        <p>Visible: {parseDate(ex.startDate)?.toLocaleDateString('en-GB') || ex.startDate} to {parseDate(ex.endDate)?.toLocaleDateString('en-GB') || ex.endDate}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            {!isEditing && isEditListMode && !isMobile && (
                                                <button className="pill-inline-edit" style={{ opacity: 1 }} onClick={(e) => { e.stopPropagation(); startEditing(ex); }}><RiEditLine /></button>
                                            )}
                                            {!isEditing && (
                                                    <div className={`manager-collapsible-icon ${expandedExams.includes(ex.id) ? 'open' : ''}`}>
                                                        <RiArrowDownSLine />
                                                    </div>
                                            )}
                                        </div>
                                    </header>

                                    {!isEditing && isEditListMode && isMobile && (
                                        <button className="pill-inline-edit" style={{ opacity: 1, margin: '0 auto 12px' }} onClick={(e) => { e.stopPropagation(); startEditing(ex); }}><RiEditLine /></button>
                                    )}

                                    <div className={`manager-collapsible-body-anim ${expandedExams.includes(ex.id) || isEditing ? 'open' : ''}`}>
                                        <div className="manager-collapsible-body-inner">
                                            <div className="published-subjects-container">
                                        {ex.type === 'Practical' ? (
                                            isEditing ? (
                                                <>
                                                    {editBuffer.subjects.map((s, i) =>
                                                        renderPracticalSubjectEditor(s, i, editBuffer, setEditBuffer)
                                                    )}
                                                    <button className="btn-add-line" onClick={() =>
                                                        setEditBuffer({ ...editBuffer, subjects: [...editBuffer.subjects, newBlankPracticalSubject()] })
                                                    }><RiAddLine /> Add Subject</button>
                                                </>
                                            ) : (
                                                (currentData.subjects || []).map((s, i) =>
                                                    renderPracticalSubjectView(s, ex.type)
                                                )
                                            )
                                        ) : (
                                            <>
                                                {(currentData.subjects || []).map((s, i) => (
                                                    <div key={i} className={`exam-subject-row ${isEditing ? 'professional editing' : 'professional view-mode'}`}>
                                                        {isEditing ? (
                                                            <>
                                                                <div className="input-group-vertical">
                                                                    <label>Date</label>
                                                                    <HybridDateInput value={s.date} onChange={(val) => { let subs = [...editBuffer.subjects]; subs[i].date = val; setEditBuffer({ ...editBuffer, subjects: subs }); }} />
                                                                </div>
                                                                <div className="input-group-vertical variant-code">
                                                                    <label>Subject</label>
                                                                    <select value={s.code} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].code = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }}>
                                                                        <option value="">Select</option>
                                                                        {masterData.courses.map(c => <option key={c.code} value={c.code}>{c.code} - {getSubjectName(c.code)}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="input-group-vertical variant-scope">
                                                                    <label>Scope</label>
                                                                    <select value={s.scope} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].scope = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }}>
                                                                        <option value="Common">Common (All Secs)</option>
                                                                        {masterData.sections.map(sec => <option key={sec} value={sec}>Section {sec}</option>)}
                                                                        {s.scope && s.scope !== 'Common' && !masterData.sections.includes(s.scope) && (
                                                                            <option value={s.scope}>{s.scope} (Mixed)</option>
                                                                        )}
                                                                    </select>
                                                                </div>
                                                                <div className="input-group-vertical variant-portion">
                                                                    <label>Portion</label>
                                                                    <input list="portion-presets" value={s.portion} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].portion = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }} placeholder="Portion..." />
                                                                </div>
                                                                <div className="input-group-vertical"><label>Start</label><input type="time" value={s.startTime} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].startTime = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }} /></div>
                                                                <div className="input-group-vertical"><label>End</label><input type="time" value={s.endTime} onChange={e => { let subs = [...editBuffer.subjects]; subs[i].endTime = e.target.value; setEditBuffer({ ...editBuffer, subjects: subs }); }} /></div>
                                                                <button className="btn-del-mini" onClick={() => {
                                                                    showConfirm("Remove Day?", "Remove this subject day?", () => { let subs = editBuffer.subjects.filter((_, idx) => idx !== i); setEditBuffer({ ...editBuffer, subjects: subs }); });
                                                                }}><RiDeleteBin6Line /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="view-cell date-cell"><label>Date</label><span>{parseDate(s.date)?.toLocaleDateString('en-GB') || s.date}</span></div>
                                                                <div className="view-cell subject-cell"><label>Subject</label><span><strong>{s.code}</strong>: {getSubjectName(s.code)}</span></div>
                                                                <div className="view-cell portion-cell" style={{ maxWidth: '100px' }}>
                                                                    <label>Scope</label>
                                                                    <span className="portion-badge" style={{ background: s.scope === 'Common' ? 'rgba(40,200,64,0.1)' : 'rgba(255,149,0,0.1)', color: s.scope === 'Common' ? 'var(--mac-success-text)' : 'var(--mac-warning-text)' }}>{s.scope}</span>
                                                                </div>
                                                                <div className="view-cell time-cell"><label>Time</label><span>{to12h(s.startTime)} - {to12h(s.endTime)}</span></div>
                                                                <div className="view-cell portion-cell"><label>Portion</label><span className="portion-badge">{s.portion}</span></div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                                {isEditing && (
                                                    <button className="btn-add-line" onClick={() => {
                                                        const lastSub = editBuffer.subjects[editBuffer.subjects.length - 1];
                                                        setEditBuffer({
                                                            ...editBuffer,
                                                            subjects: [...editBuffer.subjects, {
                                                                date: '', code: '',
                                                                startTime: lastSub ? to24hHelper(lastSub.startTime) : '08:20',
                                                                endTime: lastSub ? to24hHelper(lastSub.endTime) : '11:30',
                                                                portion: PORTION_DEFAULTS[editBuffer.type],
                                                                scope: 'Common'
                                                            }]
                                                        });
                                                    }}><RiAddLine /> Add Subject Day</button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    </div>
                                    </div>
                                </div>
                                </React.Fragment>
                            );
                        })}

                    {/* BULK ACTION FOOTER */}
                    {isEditListMode && (
                        <div className={`bulk-action-footer-premium animate-slide-up ${isDeleteMode ? 'danger-mode' : ''}`}>
                            {isDeleteMode ? (
                                <div className="bulk-delete-action-row">
                                    <div className="bulk-delete-info">
                                        <div className="info-icon">
                                            <RiDeleteBin6Fill />
                                        </div>
                                        <div className="bulk-delete-text">
                                            <span className="bulk-delete-title">
                                                {selectedExams.length === 0 ? "Select Items" : `${selectedExams.length} Selected`}
                                            </span>
                                            <span className="bulk-delete-desc">Choose exams to delete</span>
                                        </div>
                                    </div>
                                    <div className="pill-group">
                                        <button
                                            className="premium-pill-btn primary"
                                            onClick={handleSelectAllExams}
                                        >
                                            {selectedExams.length === (masterData.exams || []).length && (masterData.exams || []).length > 0 ? 'Deselect All' : 'Select All'}
                                        </button>
                                        <button className="premium-pill-btn secondary" onClick={() => { setSelectedExams([]); setIsDeleteMode(false); }}>Cancel</button>
                                        <button className="premium-pill-btn danger" onClick={handleBulkDeleteExams} disabled={selectedExams.length === 0}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bulk-delete-start-row">
                                    <div className="bulk-delete-info">
                                        <div className="info-icon">
                                            <RiTrophyLine />
                                        </div>
                                        <div className="bulk-delete-text">
                                            <span className="bulk-delete-title">Manage Published Exams</span>
                                            <span className="bulk-delete-desc">Select and remove multiple exams at once</span>
                                        </div>
                                    </div>
                                    <button className="premium-pill-btn danger" onClick={() => setIsDeleteMode(true)}>
                                        <RiDeleteBin6Fill /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    </div>
                </div>
            )}

            {/* --- PREM CONF MODAL --- */}
            {confirmModal.show && createPortal(
                <div className="modal-overlay animate-fade-in" onClick={closeConfirm}>
                    <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <RiDeleteBin6Line className="modal-icon-danger" />
                            <h3>{confirmModal.title}</h3>
                        </div>
                        <p className="modal-message">{confirmModal.message}</p>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={closeConfirm}>Cancel</button>
                            <button className="btn-modal-confirm" onClick={() => { confirmModal.onConfirm(); closeConfirm(); }}>Delete</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ExamManager;

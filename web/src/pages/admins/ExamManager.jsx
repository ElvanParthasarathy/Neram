import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { convertTo12Hour } from '../../utils/timeUtils';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Using Native Browser Date Inputs
import {
    RiTrophyLine, RiArrowRightSLine, RiTeamLine, RiLayoutGridLine,
    RiSave3Line, RiAddLine, RiDeleteBin6Line, RiBookOpenLine, RiEditLine, RiCloseLine, RiArrowLeftLine
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
    batches: [{ label: '', section: '', date: '', startTime: '08:30', endTime: '10:30', registerRange: '', totalCount: '' }]
});

const ExamManager = ({ user, userProfile }) => {
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
                let sectionIds = sectionsForDeptStr ? sectionsForDeptStr.split(',') : [];
                if (sectionIds.length === 0) {
                    sectionIds = Object.keys(deptData).filter(k => k !== 'initialized' && k !== '_master' && typeof deptData[k] === 'object');
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
                                // Filter batches for this section
                                // If scope is Common, include all batches
                                // If scope is specific, filter batches where batch.section matches or is empty
                                const filteredBatches = sub.scope === 'Common'
                                    ? sub.batches
                                    : sub.batches.filter(b => !b.section || b.section === secId);
                                return {
                                    code: sub.code,
                                    scope: sub.scope,
                                    batches: filteredBatches
                                };
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
                label: '', section: '',
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
                                {!isCommon && <th>Section</th>}
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
                                        <input value={b.label} onChange={e => updateBatch(bIdx, 'label', e.target.value)} placeholder="A, A1..." />
                                    </td>
                                    {!isCommon && (
                                        <td data-label="Section">
                                            <select value={b.section} onChange={e => updateBatch(bIdx, 'section', e.target.value)}>
                                                <option value="">—</option>
                                                {masterData.sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                                            </select>
                                        </td>
                                    )}
                                    <td data-label="Date">
                                        <DatePicker
                                            selected={parseDate(b.date)}
                                            onChange={date => updateBatch(bIdx, 'date', toLocalISO(date))}
                                            dateFormat="dd/MM/yyyy"
                                            placeholderText="dd/mm/yyyy"
                                            className="custom-datepicker-input"
                                        />
                                    </td>
                                    <td data-label="Start"><input type="time" value={b.startTime} onChange={e => updateBatch(bIdx, 'startTime', e.target.value)} /></td>
                                    <td data-label="End"><input type="time" value={b.endTime} onChange={e => updateBatch(bIdx, 'endTime', e.target.value)} /></td>
                                    <td data-label="Reg. Range"><input value={b.registerRange} onChange={e => updateBatch(bIdx, 'registerRange', e.target.value)} placeholder="111523104001–4032" /></td>
                                    <td data-label="Total"><input type="number" value={b.totalCount} onChange={e => updateBatch(bIdx, 'totalCount', e.target.value)} placeholder="32" /></td>
                                    <td data-label="" className="batch-action-cell">
                                        <button className="btn-del-mini" onClick={() => {
                                            showConfirm("Remove Batch?", `Remove batch ${b.label}?`, () => removeBatch(bIdx));
                                        }}><RiDeleteBin6Line /></button>
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
                                {!isCommon && <th>Section</th>}
                                <th>Date</th>
                                <th>Time</th>
                                {(sub.batches || []).some(b => b.registerRange) && <th>Register Range</th>}
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sub.batches || []).map((b, i) => (
                                <tr key={i}>
                                    <td data-label="Batch"><strong>{b.label}</strong></td>
                                    {!isCommon && <td data-label="Section">{b.section || '—'}</td>}
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
                        <span className="crumb-btn" onClick={() => updateLevel('batches', { batch: '', dept: '' })}>Central Directory</span>
                        {path.batch && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-btn" onClick={() => updateLevel('depts', { dept: '' })}>{path.batch}</span></>}
                        {path.dept && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-static">{path.dept} Manager</span></>}
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

                    {/* 1. CREATOR SECTION */}
                    <div className="settings-card exam-creator-card" style={{ border: '2px solid var(--mac-blue-15)' }}>
                        <h2 className="editor-title" style={{ color: 'var(--mac-blue)' }}><RiTrophyLine /> Create Central Timetable</h2>
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
                                <DatePicker selected={parseDate(newExam.startDate)} onChange={(date) => setNewExam({ ...newExam, startDate: toLocalISO(date) })} dateFormat="dd/MM/yyyy" placeholderText="dd/mm/yyyy" className="custom-datepicker-input" />
                            </div>

                            <div className="field">
                                <label>Show Until</label>
                                <DatePicker selected={parseDate(newExam.endDate)} onChange={(date) => setNewExam({ ...newExam, endDate: toLocalISO(date) })} dateFormat="dd/MM/yyyy" placeholderText="dd/mm/yyyy" className="custom-datepicker-input" />
                            </div>
                        </div>

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
                                                <DatePicker selected={parseDate(sub.date)} onChange={(date) => { let s = [...newExam.subjects]; s[idx].date = toLocalISO(date); setNewExam({ ...newExam, subjects: s }); }} dateFormat="dd/MM/yyyy" placeholderText="dd/mm/yyyy" className="custom-datepicker-input" />
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
                            <button className="btn-save-master publish-btn" onClick={handlePublish}>Publish to All Sections</button>
                        </div>
                    </div>


                    {/* 2. PUBLISHED SECTION */}
                    <div className="published-exams-section">
                        <h3 className="section-divider-title">Active Central Timetables</h3>
                        {(masterData.exams || []).map(ex => {
                            const isEditing = editingExamId === ex.id;
                            const currentData = isEditing ? editBuffer : ex;

                            return (
                                <div key={ex.id} className={`settings-card published-exam-card ${isEditing ? 'editing-active' : ''}`}>
                                    <header className="published-header">
                                        {isEditing ? (
                                            <div className="edit-meta-inputs">
                                                <input className="edit-title-input" value={currentData.title} onChange={e => setEditBuffer({ ...editBuffer, title: e.target.value })} />
                                                <div className="date-group">
                                                    <label>Range:</label>
                                                    <DatePicker selected={parseDate(currentData.startDate)} onChange={(date) => setEditBuffer({ ...editBuffer, startDate: toLocalISO(date) })} dateFormat="dd/MM/yyyy" placeholderText="dd/mm/yyyy" className="inline-datepicker" />
                                                    <span>to</span>
                                                    <DatePicker selected={parseDate(currentData.endDate)} onChange={(date) => setEditBuffer({ ...editBuffer, endDate: toLocalISO(date) })} dateFormat="dd/MM/yyyy" placeholderText="dd/mm/yyyy" className="inline-datepicker" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pub-title-group">
                                                <RiTrophyLine className="icon-main" style={{ color: 'var(--mac-blue)' }} />
                                                <div>
                                                    <h3>{ex.title} <span>({ex.type})</span></h3>
                                                    <p>Visible: {parseDate(ex.startDate)?.toLocaleDateString('en-GB') || ex.startDate} to {parseDate(ex.endDate)?.toLocaleDateString('en-GB') || ex.endDate}</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="header-actions">
                                            {isEditing ? (
                                                <>
                                                    <button className="btn-del-mini" onClick={() => {
                                                        showConfirm("Delete Central Exam?", `Removes "${ex.title}" from ALL sections.`, () => syncCentralExamToDB(ex, true));
                                                    }}><RiDeleteBin6Line /> Delete</button>
                                                    <button className="btn-save-mini" onClick={saveEdit}>Save & Distribute</button>
                                                    <button className="btn-cancel-mini" onClick={() => { setEditingExamId(null); setEditBuffer(null); }}>Cancel</button>
                                                </>
                                            ) : (
                                                <button className="btn-edit-mini" onClick={() => startEditing(ex)}><RiEditLine /> Edit Central</button>
                                            )}
                                        </div>
                                    </header>

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
                                                                    <DatePicker selected={parseDate(s.date)} onChange={(date) => { let subs = [...editBuffer.subjects]; subs[i].date = toLocalISO(date); setEditBuffer({ ...editBuffer, subjects: subs }); }} dateFormat="dd/MM/yyyy" placeholderText="dd/mm/yyyy" className="custom-datepicker-input" />
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
                            );
                        })}
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
                            <button className="btn-modal-cancel" onClick={closeConfirm}>Keep It</button>
                            <button className="btn-modal-confirm" onClick={() => { confirmModal.onConfirm(); closeConfirm(); }}>Confirm Delete</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ExamManager;

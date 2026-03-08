import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set, update } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import {
    RiCalendarScheduleLine, RiArrowRightSLine, RiTeamLine,
    RiLayoutGridLine, RiSave3Line, RiBookOpenLine,
    RiUserVoiceLine, RiAddLine, RiDeleteBin6Line, RiEditLine,
    RiCloseLine, RiCheckLine, RiArrowLeftLine, RiUserLine,
    RiGlobalLine, RiLinksLine, RiRefreshLine
} from 'react-icons/ri';

// --- IMPORT UTILS & SHARED ---
import { convertTo12Hour } from "../../utils/timeUtils";
import { periodTimes } from "../Schedule";

// --- UTILITIES FOR FACULTY STRINGS ---
const formatFaculties = (faculties) => {
    if (!faculties || faculties.length === 0) return '';
    if (faculties.length === 1) return faculties[0];
    if (faculties.length === 2) return faculties.join(' & ');

    const last = faculties[faculties.length - 1];
    const initial = faculties.slice(0, -1).join(', ');
    return `${initial} & ${last}`;
};

const parseFaculties = (facultyStr) => {
    if (!facultyStr) return [''];
    const parts = facultyStr.split(/, | & | &amp; /).map(f => f.trim()).filter(f => f);
    return parts.length > 0 ? parts : [''];
};

const ScheduleManager = ({ user, userProfile }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const hasAutoNavigated = useRef(false);

    // --- ROLE DETECTION ---
    const emailRole = user?.email ? getHardcodedRole(user.email) : null;
    const finalRole = emailRole || userProfile?.role || 'student';
    const isRep = finalRole === 'rep';

    // Extract level and path from URL
    const viewLevel = searchParams.get('slvl') || 'batches'; // slvl = schedule level
    const path = {
        batch: searchParams.get('sb') || '',
        dept: searchParams.get('sd') || '',
        sec: searchParams.get('ss') || ''
    };

    const updateLevel = (level, newPath = {}) => {
        const params = {
            mod: 'schedules',
            slvl: level,
            sb: newPath.batch !== undefined ? newPath.batch : path.batch,
            sd: newPath.dept !== undefined ? newPath.dept : path.dept,
            ss: newPath.sec !== undefined ? newPath.sec : path.sec
        };
        Object.keys(params).forEach(key => !params[key] && delete params[key]);
        setSearchParams(params);
    };

    const handleBack = () => {
        if (viewLevel === 'editor' || viewLevel === 'master') updateLevel('secs', { sec: '' });
        else if (viewLevel === 'secs') updateLevel('depts', { dept: '' });
        else if (viewLevel === 'depts') updateLevel('batches', { batch: '' });
    };

    const [hierarchy, setHierarchy] = useState({});
    const [activeTab, setActiveTab] = useState('courses'); // courses | timetable | counseling

    // --- STATE ---
    const [masterData, setMasterData] = useState({
        courses: [], // Department level 
        coordinator: '' // Department level (Year Coordinator)
    });

    const [globalFaculties, setGlobalFaculties] = useState([]); // Fetched from faculties_directory/DEPT
    const [allDeptFaculties, setAllDeptFaculties] = useState({}); // { dept: [faculty1, ...], ... }

    const [sectionData, setSectionData] = useState({
        courses: [], // Section level mapped courses
        counseling: { counselors: [], coordinators: {} }, // Section level specific
        timetable: { Tuesday: Array(7).fill(""), Wednesday: Array(7).fill(""), Thursday: Array(7).fill(""), Friday: Array(7).fill(""), Saturday: Array(7).fill("") }
    });

    // Central Roles Edit State
    const [isRolesEditMode, setIsRolesEditMode] = useState(false);
    const [tempCoordinator, setTempCoordinator] = useState('');

    // Editor states
    const [newMasterCourse, setNewMasterCourse] = useState({ code: '', name: '' });

    const [editingMasterCourseIdx, setEditingMasterCourseIdx] = useState(null);
    const [tempMasterCourse, setTempMasterCourse] = useState({ code: '', name: '' });

    // Master List Bulk Edit State
    const [isMasterEditMode, setIsMasterEditMode] = useState(false);
    const [isMasterDeleteMode, setIsMasterDeleteMode] = useState(false);
    const [selectedMasterCourses, setSelectedMasterCourses] = useState([]);

    // Section Mapping State
    const [newMappedCourse, setNewMappedCourse] = useState({ code: '', name: '', faculties: [''], periods: '' });
    const [newCounselor, setNewCounselor] = useState('');

    // Mapped List Bulk Edit State
    const [isMappedEditMode, setIsMappedEditMode] = useState(false);
    const [isMappedDeleteMode, setIsMappedDeleteMode] = useState(false);
    const [selectedMappedCourses, setSelectedMappedCourses] = useState([]);

    const [editingMappedCourseIdx, setEditingMappedCourseIdx] = useState(null);
    const [tempMappedCourse, setTempMappedCourse] = useState({ code: '', name: '', faculties: [''], periods: '' });

    const [editingCounselorIdx, setEditingCounselorIdx] = useState(null);
    const [tempCounselor, setTempCounselor] = useState('');

    // Counselor Bulk Edit State
    const [isCounselorEditMode, setIsCounselorEditMode] = useState(false);
    const [isCounselorDeleteMode, setIsCounselorDeleteMode] = useState(false);
    const [selectedCounselors, setSelectedCounselors] = useState([]);

    // Section Roles Edit State
    const [isSectionRolesEditMode, setIsSectionRolesEditMode] = useState(false);
    const [tempSectionRoles, setTempSectionRoles] = useState({});

    // Timetable
    const [timetableBuffer, setTimetableBuffer] = useState(null);
    const [isEditingTimetable, setIsEditingTimetable] = useState(false);
    const [editingDay, setEditingDay] = useState('Tuesday');

    useEffect(() => {
        const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => setHierarchy(snap.val() || {}));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (path.dept) {
            const facRef = ref(db, `faculties_directory/${path.dept}`);
            const unsubFac = onValue(facRef, (snap) => {
                const raw = snap.exists() ? snap.val() : [];
                setGlobalFaculties(raw.map(f => typeof f === 'object' && f !== null ? f.name : f));
            });
            return () => unsubFac();
        }
    }, [path.dept]);

    // Load ALL departments' faculty lists for cross-dept selection
    useEffect(() => {
        const facDirRef = ref(db, 'faculties_directory');
        const unsub = onValue(facDirRef, (snap) => {
            const raw = snap.exists() ? snap.val() : {};
            const normalized = {};
            Object.keys(raw).forEach(dept => {
                normalized[dept] = (raw[dept] || []).map(f => typeof f === 'object' && f !== null ? f.name : f);
            });
            setAllDeptFaculties(normalized);
        });
        return () => unsub();
    }, []);

    // Auto-import: when a faculty from another dept is selected, add to current dept
    const handleCrossDeptFacultySelect = async (facultyName) => {
        if (!path.dept || !facultyName) return facultyName;
        // DISABLED: We no longer auto-copy faculty into the current department's global directory.
        // They remain strictly in their home department, but can be mapped locally.
        return facultyName;
    };

    // Render faculty <option> groups: own dept first, then other depts
    const renderFacultyOptions = () => {
        const otherDepts = Object.keys(allDeptFaculties)
            .filter(d => d !== path.dept)
            .sort();

        return (
            <>
                <option value="">-- Select Faculty --</option>
                <optgroup label={`${path.dept} (Your Dept)`}>
                    {globalFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                    {globalFaculties.length === 0 && <option disabled>No faculty added</option>}
                </optgroup>
                {otherDepts.map(dept => {
                    const deptFac = (allDeptFaculties[dept] || []).filter(f => !globalFaculties.includes(f));
                    if (deptFac.length === 0) return null;
                    return (
                        <optgroup key={dept} label={`↗ ${dept}`}>
                            {deptFac.map(f => <option key={`${dept}-${f}`} value={f}>{f}</option>)}
                        </optgroup>
                    );
                })}
            </>
        );
    };

    // Fetch Master Data (at SECS view - Dept level)
    useEffect(() => {
        if ((viewLevel === 'secs' || viewLevel === 'editor') && path.dept) {
            // 1. Fetch Master Data
            const masterRef = ref(db, `schedules/${path.batch}/${path.dept}/_master`);
            const unsubMaster = onValue(masterRef, (snap) => {
                const data = snap.val() || { courses: [], coordinator: '' };
                setMasterData({
                    courses: data.courses || [],
                    coordinator: data.coordinator || ''
                });
            });

            // 2. Fetch all sections to aggregate existing data (so old data is not lost)
            const deptSchedulesRef = ref(db, `schedules/${path.batch}/${path.dept}`);
            const unsubData = onValue(deptSchedulesRef, (snap) => {
                if (snap.exists()) {
                    const deptData = snap.val();
                    let aggregatedCourses = [];
                    let aggregatedFaculties = new Set();

                    // Helper to safely split and add faculty names
                    const addFacultyNames = (nameStr) => {
                        if (!nameStr) return;
                        // Split by '&', 'and', '/', ','
                        const parts = nameStr.split(/&|\band\b|\/|,/i);
                        parts.forEach(p => {
                            const trimmed = p.trim();
                            if (trimmed) aggregatedFaculties.add(trimmed);
                        });
                    };

                    // Loop through all sections (skip _master)
                    Object.keys(deptData).forEach(secKey => {
                        if (secKey === '_master') return;
                        const sec = deptData[secKey];

                        // Aggregate Courses
                        if (sec.courses && Array.isArray(sec.courses)) {
                            sec.courses.forEach(c => {
                                // Add course code/name if we haven't seen this code yet
                                if (!aggregatedCourses.find(ac => ac.code === c.code)) {
                                    aggregatedCourses.push({ code: c.code, name: c.name });
                                }
                                addFacultyNames(c.faculty);
                            });
                        }

                        // Aggregate Faculty from Counselors & Coordinators
                        if (sec.counseling) {
                            if (sec.counseling.counselors) {
                                sec.counseling.counselors.forEach(c => addFacultyNames(c));
                            }
                            if (sec.counseling.coordinators) {
                                Object.values(sec.counseling.coordinators).forEach(name => {
                                    addFacultyNames(name);
                                });
                            }
                        }
                    });

                    // We now have aggregated items from the wild. 
                    // We need to merge them WITH the explicit master data using a one-time save structure if missing.
                    // We do this silently in the background so the user's master list auto-updates.

                    setMasterData(currentMaster => {
                        const currentCourseCodes = new Set(currentMaster.courses.map(c => c.code));
                        const newCourses = aggregatedCourses.filter(c => !currentCourseCodes.has(c.code));

                        // If there are new courses, auto-save to master
                        if (newCourses.length > 0) {
                            const updatedMaster = {
                                ...currentMaster,
                                courses: [...currentMaster.courses, ...newCourses]
                            };
                            set(ref(db, `schedules/${path.batch}/${path.dept}/_master`), updatedMaster);
                            return updatedMaster;
                        }
                        return currentMaster;
                    });

                    // One-Time Global Migration for Faculties
                    // Take the old 'master.faculties' AND the aggregated section faculties and push them global
                    if (deptData._master && deptData._master.faculties && Array.isArray(deptData._master.faculties)) {
                        deptData._master.faculties.forEach(f => addFacultyNames(f));
                    }

                    if (aggregatedFaculties.size > 0) {
                        get(ref(db, `faculties_directory/${path.dept}`)).then(snap => {
                            const currentGlobal = new Set(snap.exists() ? snap.val() : []);
                            let isDirty = false;

                            aggregatedFaculties.forEach(f => {
                                if (!currentGlobal.has(f)) {
                                    currentGlobal.add(f);
                                    isDirty = true;
                                }
                            });

                            if (isDirty) {
                                const newGlobalList = Array.from(currentGlobal).sort();
                                set(ref(db, `faculties_directory/${path.dept}`), newGlobalList);
                            }
                        });
                    }
                }
            });

            return () => { unsubMaster(); unsubData(); };
        }
    }, [viewLevel, path.batch, path.dept]);

    // Fetch Section Data
    useEffect(() => {
        if (viewLevel === 'editor' && path.sec) {
            const scheduleRef = ref(db, `schedules/${path.batch}/${path.dept}/${path.sec}`);
            const unsub = onValue(scheduleRef, (snap) => {
                const data = snap.val();
                const cleanData = {
                    courses: data?.courses || [],
                    exams: data?.exams || [],
                    counseling: {
                        counselors: data?.counseling?.counselors || [],
                        coordinators: data?.counseling?.coordinators || {}
                    },
                    timetable: data?.timetable || {
                        Tuesday: Array(7).fill(""), Wednesday: Array(7).fill(""),
                        Thursday: Array(7).fill(""), Friday: Array(7).fill(""), Saturday: Array(7).fill("")
                    }
                };
                setSectionData(cleanData);
                if (!isEditingTimetable) setTimetableBuffer(cleanData.timetable);
            });
            return () => unsub();
        }
    }, [viewLevel, path.batch, path.dept, path.sec]);

    // --- SAVE LOGIC ---
    const saveMaster = async (newData) => {
        try {
            await set(ref(db, `schedules/${path.batch}/${path.dept}/_master`), newData);
        } catch (e) { alert(e.message); }
    };

    const saveSection = async (newData) => {
        try {
            await set(ref(db, `schedules/${path.batch}/${path.dept}/${path.sec}`), newData);
        } catch (e) { alert(e.message); }
    }

    // --- MASTER ACTIONS (Dept Level) ---
    const handleAddMasterCourse = () => {
        if (!newMasterCourse.code || !newMasterCourse.name) return;
        saveMaster({ ...masterData, courses: [...masterData.courses, newMasterCourse] });
        setNewMasterCourse({ code: '', name: '' });
    };

    const handleUpdateMasterCourse = () => {
        const updatedCourses = [...masterData.courses];
        updatedCourses[editingMasterCourseIdx] = tempMasterCourse;
        saveMaster({ ...masterData, courses: updatedCourses });
        setEditingMasterCourseIdx(null);
    };

    const handleDeleteMasterCourse = (idx) => {
        if (window.confirm("Delete this master course?")) {
            saveMaster({ ...masterData, courses: masterData.courses.filter((_, i) => i !== idx) });
        }
    };

    const handleToggleMasterCourseSelect = (index) => {
        setSelectedMasterCourses(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleSelectAllMasterCourses = () => {
        if (selectedMasterCourses.length === masterData.courses.length) {
            setSelectedMasterCourses([]);
        } else {
            setSelectedMasterCourses(masterData.courses.map((_, i) => i));
        }
    };

    const handleBulkDeleteMasterCourses = () => {
        if (selectedMasterCourses.length === 0) return;
        if (window.confirm(`Delete ${selectedMasterCourses.length} selected courses?`)) {
            const remaining = masterData.courses.filter((_, i) => !selectedMasterCourses.includes(i));
            const newData = { ...masterData, courses: remaining };
            saveMaster(newData);
            setSelectedMasterCourses([]);
            setIsMasterDeleteMode(false);
        }
    };

    const handleSetCoordinator = async (name) => {
        const updatedMaster = { ...masterData, coordinator: name };
        // 1. Save to master
        await saveMaster(updatedMaster);

        // 2. Propagate to ALL existing sections (Multi-path update)
        const updates = {};
        const sections = Object.keys(hierarchy[path.batch]?.[path.dept] || {}).filter(k => k !== 'initialized');

        // Also update current state if in sec view to prevent flicker
        const updatedSecData = { ...sectionData };
        if (!updatedSecData.counseling.coordinators) updatedSecData.counseling.coordinators = {};
        updatedSecData.counseling.coordinators['Year Coordinator'] = name;

        sections.forEach(secKey => {
            const secId = hierarchy[path.batch][path.dept][secKey];
            updates[`schedules/${path.batch}/${path.dept}/${secId}/counseling/coordinators/Year Coordinator`] = name;
        });

        try {
            await update(ref(db), updates);
            alert("Year Coordinator updated across all sections!");
            setIsRolesEditMode(false);
        } catch (e) { alert(e.message); }
    };

    // --- SECTION ACTIONS (Mapped Level) ---
    const handleMapCourse = () => {
        const validFaculties = newMappedCourse.faculties.filter(f => f.trim() !== '');
        if (!newMappedCourse.code || validFaculties.length === 0) return alert("Select Course & at least one Faculty");

        // Auto-fill name
        const mCourse = masterData.courses.find(c => c.code === newMappedCourse.code);
        const completeCourse = {
            code: newMappedCourse.code,
            name: mCourse ? mCourse.name : '',
            faculty: formatFaculties(validFaculties),
            periods: newMappedCourse.periods || 0
        };

        saveSection({ ...sectionData, courses: [...sectionData.courses, completeCourse] });
        setNewMappedCourse({ code: '', name: '', faculties: [''], periods: '' });
    };

    const removeMappedCourse = (idx) => {
        saveSection({ ...sectionData, courses: sectionData.courses.filter((_, i) => i !== idx) });
    };

    const handleUpdateMappedCourse = () => {
        const validFaculties = tempMappedCourse.faculties.filter(f => f.trim() !== '');
        if (validFaculties.length === 0) return alert("Select at least one Faculty");

        const mCourse = masterData.courses.find(c => c.code === tempMappedCourse.code);
        const completeCourse = {
            code: tempMappedCourse.code,
            name: mCourse ? mCourse.name : tempMappedCourse.name,
            faculty: formatFaculties(validFaculties),
            periods: tempMappedCourse.periods || 0
        };

        const updatedCourses = [...sectionData.courses];
        updatedCourses[editingMappedCourseIdx] = completeCourse;
        saveSection({ ...sectionData, courses: updatedCourses });
        setEditingMappedCourseIdx(null);
    };

    const handleToggleMappedCourseSelect = (index) => {
        setSelectedMappedCourses(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleSelectAllMappedCourses = () => {
        const total = sectionData.courses?.length || 0;
        if (selectedMappedCourses.length === total) {
            setSelectedMappedCourses([]);
        } else {
            setSelectedMappedCourses(Array.from({ length: total }, (_, i) => i));
        }
    };

    const handleBulkDeleteMappedCourses = () => {
        if (selectedMappedCourses.length === 0) return;
        if (window.confirm(`Delete ${selectedMappedCourses.length} mapped courses?`)) {
            const currentCourses = sectionData.courses || [];
            const remaining = currentCourses.filter((_, i) => !selectedMappedCourses.includes(i));
            saveSection({ ...sectionData, courses: remaining });
            setSelectedMappedCourses([]);
            setIsMappedDeleteMode(false);
        }
    };

    // Timetable
    const startEditingTimetable = () => {
        setTimetableBuffer(JSON.parse(JSON.stringify(sectionData.timetable)));
        setIsEditingTimetable(true);
    };
    const saveTimetableEdit = () => {
        saveSection({ ...sectionData, timetable: timetableBuffer });
        setIsEditingTimetable(false);
    };
    const updateBufferCell = (day, idx, val) => {
        setTimetableBuffer(prev => ({
            ...prev,
            [day]: prev[day].map((cell, i) => i === idx ? val : cell)
        }));
    };

    // Class Roles & Counselors
    const handleSetRole = (role, name) => {
        saveSection({
            ...sectionData,
            counseling: {
                ...sectionData.counseling,
                coordinators: { ...sectionData.counseling.coordinators, [role]: name }
            }
        });
    };

    const handleSaveSectionRoles = () => {
        saveSection({
            ...sectionData,
            counseling: {
                ...sectionData.counseling,
                coordinators: { ...sectionData.counseling.coordinators, ...tempSectionRoles }
            }
        });
        setIsSectionRolesEditMode(false);
    };

    const addCounselor = () => {
        if (!newCounselor) return;
        saveSection({
            ...sectionData,
            counseling: {
                ...sectionData.counseling,
                counselors: [...(sectionData.counseling.counselors || []), newCounselor]
            }
        });
        setNewCounselor('');
    };

    const removeCounselor = (idx) => {
        saveSection({
            ...sectionData,
            counseling: {
                ...sectionData.counseling,
                counselors: sectionData.counseling.counselors.filter((_, i) => i !== idx)
            }
        });
    };

    const handleUpdateCounselor = () => {
        if (!tempCounselor.trim()) return alert("Counselor name cannot be empty");
        const updatedCounselors = [...sectionData.counseling.counselors];
        updatedCounselors[editingCounselorIdx] = tempCounselor;
        saveSection({
            ...sectionData,
            counseling: {
                ...sectionData.counseling,
                counselors: updatedCounselors
            }
        });
        setEditingCounselorIdx(null);
    };

    const handleToggleCounselorSelect = (index) => {
        setSelectedCounselors(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleSelectAllCounselors = () => {
        const total = sectionData.counseling.counselors?.length || 0;
        if (selectedCounselors.length === total) {
            setSelectedCounselors([]);
        } else {
            setSelectedCounselors(Array.from({ length: total }, (_, i) => i));
        }
    };

    const handleBulkDeleteCounselors = () => {
        if (selectedCounselors.length === 0) return;
        if (window.confirm(`Delete ${selectedCounselors.length} counselors?`)) {
            const currentCounselors = sectionData.counseling.counselors || [];
            const remaining = currentCounselors.filter((_, i) => !selectedCounselors.includes(i));
            saveSection({
                ...sectionData,
                counseling: {
                    ...sectionData.counseling,
                    counselors: remaining
                }
            });
            setSelectedCounselors([]);
            setIsCounselorDeleteMode(false);
        }
    };

    return (
        <div className="admin-subpage animate-fade-in central-schedule-manager">
            <header className="explorer-header focus-mode">
                <div className="breadcrumb-nav">
                    {!isRep && viewLevel !== 'batches' && (
                        <button className="explorer-back-btn" onClick={handleBack}>
                            <RiArrowLeftLine /> Back
                        </button>
                    )}

                    <div className="breadcrumb-list">
                        <span className="crumb-btn" onClick={() => updateLevel('batches', { batch: '', dept: '', sec: '' })}>Schedule</span>
                        {path.batch && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-btn" onClick={() => updateLevel('depts', { dept: '', sec: '' })}>{path.batch}</span></>}
                        {path.dept && <><RiArrowRightSLine className="crumb-sep" /> <span className={viewLevel === 'secs' ? "crumb-static" : "crumb-btn"} onClick={() => updateLevel('secs', { sec: '' })}>{path.dept} Sections</span></>}
                        {path.sec && <><RiArrowRightSLine className="crumb-sep" /> <span className="crumb-static">{path.sec === '_master' ? 'Master Config' : `Sec ${path.sec}`}</span></>}
                    </div>
                </div>
            </header>

            {/* EXPLORER VIEWS */}
            {viewLevel === 'batches' && (
                <div className="explorer-content explorer-grid">
                    {Object.keys(hierarchy).sort().reverse().map(b => (
                        <div key={b} className="explorer-card" onClick={() => updateLevel('depts', { batch: b })}>
                            <RiTeamLine className="card-icon" /> <div className="card-info"><h3>Batch {b}</h3><p>Manage Schedule</p></div>
                        </div>
                    ))}
                </div>
            )}

            {/* DEPARTMENT SELECTOR */}
            {viewLevel === 'depts' && (
                <div className="explorer-content explorer-grid">
                    {Object.keys(hierarchy[path.batch] || {}).map(d => (
                        <div key={d} className="explorer-card" onClick={() => updateLevel('secs', { dept: d })}>
                            <RiLayoutGridLine className="card-icon" /> <div className="card-info"><h3>{d} Master</h3><p>Select Department</p></div>
                        </div>
                    ))}
                </div>
            )}

            {/* SECTIONS & MASTER REPLACED WITH GRID */}
            {viewLevel === 'secs' && (
                <div className="explorer-content explorer-grid">
                    <div className="explorer-card minified" onClick={() => updateLevel('master', { sec: '_master' })}>
                        <div className="card-initial" style={{ background: 'var(--mac-blue)', color: '#fff' }}><RiGlobalLine style={{ width: '60%', height: '60%', margin: '20%' }} /></div>
                        <div className="card-info"><h3>Master View</h3></div>
                    </div>
                    {Object.values(hierarchy[path.batch]?.[path.dept] || {}).map(s => (
                        <div key={s} className="explorer-card minified" onClick={() => updateLevel('editor', { sec: s })}>
                            <div className="card-initial">{s}</div>
                            <div className="card-info"><h3>Section {s}</h3></div>
                        </div>
                    ))}
                </div>
            )}

            {/* MASTER EDITOR WORKSPACE */}
            {viewLevel === 'master' && (
                <div className="explorer-content">
                    {/* MASTER CONFIGURATION */}
                    <div className="master-config-panel settings-card" style={{ border: '2px solid var(--mac-blue-15)', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                        <h2 className="editor-title" style={{ color: 'var(--mac-blue)' }}><RiGlobalLine /> {path.dept} Master Settings</h2>
                        <p style={{ opacity: 0.7, marginBottom: '20px', fontSize: '13px' }}>Define Department-wide courses, faculties, and roles here. They will be available in all sections.</p>

                        <div className="master-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0 }}><RiBookOpenLine /> Master Course List</h3>
                                {masterData.courses.length > 0 && (
                                    isMasterEditMode ? (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn-add-mini"
                                                onClick={() => { setSelectedMasterCourses([]); setIsMasterDeleteMode(false); setIsMasterEditMode(false); }}
                                                style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)', border: '1px solid var(--border-color)' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="btn-add-mini"
                                                onClick={() => { setSelectedMasterCourses([]); setIsMasterDeleteMode(false); setIsMasterEditMode(false); }}
                                                style={{ background: 'var(--mac-blue)', color: '#fff' }}
                                            >
                                                Done
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn-add-mini"
                                            onClick={() => setIsMasterEditMode(true)}
                                            style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)' }}
                                        >
                                            Edit List
                                        </button>
                                    )
                                )}
                            </div>

                            {(isMasterEditMode || masterData.courses.length === 0) && (
                                <div className="add-item-bar inline">
                                    <input placeholder="Ex: CS101" value={newMasterCourse.code} onChange={e => setNewMasterCourse({ ...newMasterCourse, code: e.target.value })} style={{ flex: 1 }} />
                                    <input placeholder="Course Name" value={newMasterCourse.name} onChange={e => setNewMasterCourse({ ...newMasterCourse, name: e.target.value })} style={{ flex: 2 }} />
                                    <button className="btn-add-mini" onClick={handleAddMasterCourse}><RiAddLine /></button>
                                </div>
                            )}

                            <div className="counselor-items-v2" style={{ marginTop: '16px' }}>
                                {masterData.courses.map((c, i) => (
                                    <div key={i} className={`counselor-item-row ${editingMasterCourseIdx === i ? 'editing' : ''}`}>
                                        {editingMasterCourseIdx === i ? (
                                            <div className="inline-edit-pill-wrap" style={{ display: 'flex', gap: '8px', width: '100%', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', gap: '8px', alignSelf: 'stretch' }}>
                                                    <input
                                                        autoFocus
                                                        placeholder="Code"
                                                        value={tempMasterCourse.code}
                                                        onChange={(e) => setTempMasterCourse({ ...tempMasterCourse, code: e.target.value })}
                                                        style={{ flex: 1, minWidth: 0 }}
                                                    />
                                                </div>
                                                <input
                                                    placeholder="Name"
                                                    value={tempMasterCourse.name}
                                                    onChange={(e) => setTempMasterCourse({ ...tempMasterCourse, name: e.target.value })}
                                                    style={{ flex: 2 }}
                                                />
                                                <div className="edit-pill-actions">
                                                    <button className="action-btn action-edit" onClick={handleUpdateMasterCourse}><RiCheckLine /> <span className="action-label">Save</span></button>
                                                    <button className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--mac-text)' }} onClick={() => setEditingMasterCourseIdx(null)}><RiCloseLine /> <span className="action-label">Cancel</span></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="counselor-name-chip" style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                                                    {isMasterDeleteMode && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedMasterCourses.includes(i)}
                                                            onChange={() => handleToggleMasterCourseSelect(i)}
                                                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                        />
                                                    )}
                                                    <strong style={{ color: 'var(--mac-blue)' }}>{c.code}</strong>
                                                    <span>{c.name}</span>
                                                </div>
                                                {isMasterEditMode && (
                                                    <div className="counselor-row-actions">
                                                        <button className="action-btn action-edit" onClick={() => { setEditingMasterCourseIdx(i); setTempMasterCourse(c); }}>
                                                            <RiEditLine /> <span className="action-label">Edit</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                                {masterData.courses.length === 0 && <p className="empty-state">No master courses defined.</p>}
                            </div>

                            {isMasterEditMode && (
                                <div className="bulk-actions-bar" style={{ display: 'flex', justifyContent: isMasterDeleteMode ? 'space-between' : 'flex-end', alignItems: 'center', padding: '12px', background: isMasterDeleteMode ? 'rgba(255, 59, 48, 0.05)' : 'transparent', borderRadius: '8px', marginTop: '16px', border: isMasterDeleteMode ? '1px solid rgba(255, 59, 48, 0.2)' : 'none' }}>
                                    {isMasterDeleteMode ? (
                                        <>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--mac-text)' }}>
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAllMasterCourses}
                                                    checked={selectedMasterCourses.length === masterData.courses.length && masterData.courses.length > 0}
                                                    style={{ transform: 'scale(1.2)' }}
                                                />
                                                <span>Select All</span>
                                            </label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => { setSelectedMasterCourses([]); setIsMasterDeleteMode(false); }}
                                                    style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleBulkDeleteMasterCourses}
                                                    style={{ background: '#FF3B30', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: selectedMasterCourses.length === 0 ? 0.5 : 1 }}
                                                    disabled={selectedMasterCourses.length === 0}
                                                >
                                                    <RiDeleteBin6Line /> Delete ({selectedMasterCourses.length})
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setIsMasterDeleteMode(true)}
                                            style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                        >
                                            <RiDeleteBin6Line /> Delete Courses
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="master-section" style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3><RiUserLine /> Faculty Directory ({globalFaculties.length})</h3>
                                <a href="?mod=structure" className="btn-add-mini" style={{ textDecoration: 'none', background: 'var(--mac-card-bg)', border: '1px solid var(--border-color)', color: 'var(--mac-text)', fontSize: '12px' }}>
                                    <RiLinksLine /> Manage in Structure
                                </a>
                            </div>

                            <div className="counselor-items-v2">
                                <div style={{
                                    padding: '16px',
                                    background: 'var(--mac-blue-15)',
                                    border: '1px solid var(--mac-blue-30)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    color: 'var(--mac-text)'
                                }}>
                                    <RiUserVoiceLine style={{ fontSize: '24px', color: 'var(--mac-blue)' }} />
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>Faculty Management Hub</h4>
                                        <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
                                            Faculties are now managed centrally in the Structure Settings. You can map them to courses in the Sections view.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="master-section" style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ margin: 0 }}><RiTeamLine /> Central Roles</h3>
                                {!isRolesEditMode && (
                                    <button
                                        className="btn-add-mini"
                                        onClick={() => { setIsRolesEditMode(true); setTempCoordinator(masterData.coordinator || ''); }}
                                        style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)' }}
                                    >
                                        Edit Roles
                                    </button>
                                )}
                            </div>

                            <div className="field">
                                <label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--mac-text)', opacity: 0.7, marginBottom: '8px', display: 'block' }}>Year Coordinator</label>

                                {isRolesEditMode ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <select
                                            value={tempCoordinator}
                                            onChange={e => setTempCoordinator(e.target.value)}
                                            style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}
                                        >
                                            <option value="">-- Unassigned --</option>
                                            {globalFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="action-btn action-edit"
                                                onClick={() => handleSetCoordinator(tempCoordinator)}
                                                style={{ padding: '6px 12px', height: '100%' }}
                                                disabled={tempCoordinator === masterData.coordinator}
                                            >
                                                <RiCheckLine /> <span className="action-label">Save</span>
                                            </button>
                                            <button
                                                className="action-btn"
                                                onClick={() => setIsRolesEditMode(false)}
                                                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--mac-text)', padding: '6px 12px', height: '100%' }}
                                            >
                                                <RiCloseLine /> <span className="action-label">Cancel</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="counselor-name-chip" style={{ display: 'inline-flex', padding: '10px 16px', borderRadius: '8px', background: 'var(--mac-card-bg)', border: '1px solid var(--border-color)', minWidth: '250px' }}>
                                        {masterData.coordinator ? (
                                            <span style={{ color: 'var(--mac-blue)', fontWeight: 600 }}>{masterData.coordinator}</span>
                                        ) : (
                                            <span style={{ color: 'var(--mac-text)', opacity: 0.5, fontStyle: 'italic' }}>Not Assigned</span>
                                        )}
                                    </div>
                                )}
                                <p className="hint" style={{ marginTop: '8px' }}>Changes sync to ALL sections instantly.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SECTION EDITOR WORKSPACE */}
            {viewLevel === 'editor' && (
                <div className="schedule-editor-workspace">
                    <nav className="editor-tabs box-flat">
                        <button className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}><RiLinksLine /> Local Mapping</button>
                        <button className={activeTab === 'timetable' ? 'active' : ''} onClick={() => setActiveTab('timetable')}><RiCalendarScheduleLine /> Timetable</button>
                        <button className={activeTab === 'counseling' ? 'active' : ''} onClick={() => setActiveTab('counseling')}><RiUserVoiceLine /> Section Roles</button>
                    </nav>

                    <div className="tab-content-area">

                        {/* --- COURSE MAPPING TAB --- */}
                        {activeTab === 'courses' && (
                            <div className="course-manager">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div className="mapping-instructions" style={{ margin: 0 }}>
                                        <p style={{ margin: 0 }}>Map Master Courses to specific Faculties for Section {path.sec}.</p>
                                    </div>
                                    {(sectionData.courses || []).length > 0 && (
                                        isMappedEditMode ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    className="btn-add-mini"
                                                    onClick={() => { setSelectedMappedCourses([]); setIsMappedDeleteMode(false); setIsMappedEditMode(false); }}
                                                    style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)', border: '1px solid var(--border-color)' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="btn-add-mini"
                                                    onClick={() => { setSelectedMappedCourses([]); setIsMappedDeleteMode(false); setIsMappedEditMode(false); }}
                                                    style={{ background: 'var(--mac-blue)', color: '#fff' }}
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn-add-mini"
                                                onClick={() => setIsMappedEditMode(true)}
                                                style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)' }}
                                            >
                                                Edit List
                                            </button>
                                        )
                                    )}
                                </div>

                                {(isMappedEditMode || (sectionData.courses || []).length === 0) && (
                                    <div className="add-item-bar settings-card" style={{ background: 'var(--mac-blue-15)', border: 'none', flexDirection: 'column', alignItems: 'stretch' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <select value={newMappedCourse.code} onChange={e => setNewMappedCourse({ ...newMappedCourse, code: e.target.value })} style={{ flex: 2 }}>
                                                <option value="">-- Select Master Course --</option>
                                                {masterData.courses.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                            </select>
                                            <input type="number" placeholder="Periods" value={newMappedCourse.periods} onChange={e => setNewMappedCourse({ ...newMappedCourse, periods: e.target.value })} style={{ flex: 1 }} />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                            {newMappedCourse.faculties.map((fac, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                                                    <select
                                                        value={fac}
                                                        onChange={e => {
                                                            const newFacs = [...newMappedCourse.faculties];
                                                            newFacs[idx] = e.target.value;
                                                            setNewMappedCourse({ ...newMappedCourse, faculties: newFacs });
                                                            handleCrossDeptFacultySelect(e.target.value);
                                                        }}
                                                        style={{ flex: 1 }}
                                                    >
                                                        {renderFacultyOptions()}
                                                    </select>
                                                    {idx > 0 && (
                                                        <button className="action-btn action-delete" onClick={() => {
                                                            const newFacs = newMappedCourse.faculties.filter((_, i) => i !== idx);
                                                            setNewMappedCourse({ ...newMappedCourse, faculties: newFacs });
                                                        }} style={{ padding: '0 8px' }}>
                                                            <RiDeleteBin6Line />
                                                        </button>
                                                    )}
                                                    {idx === newMappedCourse.faculties.length - 1 && (
                                                        <button className="btn-save-master" onClick={() => setNewMappedCourse({ ...newMappedCourse, faculties: [...newMappedCourse.faculties, ''] })} style={{ padding: '0 8px', minWidth: 'auto' }}>
                                                            <RiAddLine /> Add Faculty
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button className="btn-add" onClick={handleMapCourse} style={{ marginTop: '12px' }}><RiAddLine /> Map Course</button>
                                    </div>
                                )}

                                <div className="counselor-items-v2">
                                    {(sectionData.courses || []).map((c, i) => (
                                        <div key={i} className={`counselor-item-row ${editingMappedCourseIdx === i ? 'editing' : ''}`}>
                                            {editingMappedCourseIdx === i ? (
                                                <div className="inline-edit-pill-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <select
                                                            value={tempMappedCourse.code}
                                                            onChange={(e) => setTempMappedCourse({ ...tempMappedCourse, code: e.target.value })}
                                                            style={{ flex: 2 }}
                                                        >
                                                            <option value="">-- Code --</option>
                                                            {masterData.courses.map(mc => <option key={mc.code} value={mc.code}>{mc.code}</option>)}
                                                        </select>
                                                        <input
                                                            type="number"
                                                            placeholder="Prds"
                                                            value={tempMappedCourse.periods}
                                                            onChange={(e) => setTempMappedCourse({ ...tempMappedCourse, periods: e.target.value })}
                                                            style={{ flex: 1, minWidth: '60px' }}
                                                        />
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {tempMappedCourse.faculties.map((fac, facIdx) => (
                                                            <div key={facIdx} style={{ display: 'flex', gap: '8px' }}>
                                                                <select
                                                                    value={fac}
                                                                    onChange={(e) => {
                                                                        const newFacs = [...tempMappedCourse.faculties];
                                                                        newFacs[facIdx] = e.target.value;
                                                                        setTempMappedCourse({ ...tempMappedCourse, faculties: newFacs });
                                                                        handleCrossDeptFacultySelect(e.target.value);
                                                                    }}
                                                                    style={{ flex: 1 }}
                                                                >
                                                                    {renderFacultyOptions()}
                                                                </select>

                                                                {facIdx > 0 && (
                                                                    <button className="action-btn action-delete" onClick={() => {
                                                                        const newFacs = tempMappedCourse.faculties.filter((_, idx) => idx !== facIdx);
                                                                        setTempMappedCourse({ ...tempMappedCourse, faculties: newFacs });
                                                                    }} style={{ padding: '0 8px' }}>
                                                                        <RiDeleteBin6Line />
                                                                    </button>
                                                                )}

                                                                {facIdx === tempMappedCourse.faculties.length - 1 && (
                                                                    <button className="btn-save-master" onClick={() => setTempMappedCourse({ ...tempMappedCourse, faculties: [...tempMappedCourse.faculties, ''] })} style={{ padding: '0 8px', minWidth: 'auto' }}>
                                                                        <RiAddLine /> Add Faculty
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="edit-pill-actions" style={{ justifyContent: 'flex-end', marginTop: '4px' }}>
                                                        <button className="action-btn action-edit" onClick={handleUpdateMappedCourse}><RiCheckLine /> <span className="action-label">Save</span></button>
                                                        <button className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--mac-text)' }} onClick={() => setEditingMappedCourseIdx(null)}><RiCloseLine /> <span className="action-label">Cancel</span></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="counselor-name-chip" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        {isMappedDeleteMode && (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedMappedCourses.includes(i)}
                                                                onChange={() => handleToggleMappedCourseSelect(i)}
                                                                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                            />
                                                        )}
                                                        <strong style={{ color: 'var(--mac-text)' }}>{c.code}</strong>
                                                        <span>{c.name}</span>
                                                    </div>
                                                    <div className="mapped-meta" style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingRight: '16px' }}>
                                                        <span className="pill faculty-pill"><RiUserLine /> {c.faculty}</span>
                                                        <span className="pill periods-pill">{c.periods} Prds</span>
                                                    </div>
                                                    {isMappedEditMode && (
                                                        <div className="counselor-row-actions">
                                                            <button className="action-btn action-edit" onClick={() => {
                                                                const facParts = parseFaculties(c.faculty);
                                                                setEditingMappedCourseIdx(i);
                                                                setTempMappedCourse({
                                                                    ...c,
                                                                    faculties: facParts
                                                                });
                                                            }}>
                                                                <RiEditLine /> <span className="action-label">Edit</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {sectionData.courses?.length === 0 && <p className="empty-state">No courses mapped to this section yet.</p>}
                                </div>

                                {isMappedEditMode && (
                                    <div className="bulk-actions-bar" style={{ display: 'flex', justifyContent: isMappedDeleteMode ? 'space-between' : 'flex-end', alignItems: 'center', padding: '12px', background: isMappedDeleteMode ? 'rgba(255, 59, 48, 0.05)' : 'transparent', borderRadius: '8px', marginTop: '16px', border: isMappedDeleteMode ? '1px solid rgba(255, 59, 48, 0.2)' : 'none' }}>
                                        {isMappedDeleteMode ? (
                                            <>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--mac-text)' }}>
                                                    <input
                                                        type="checkbox"
                                                        onChange={handleSelectAllMappedCourses}
                                                        checked={selectedMappedCourses.length === (sectionData.courses?.length || 0) && (sectionData.courses?.length || 0) > 0}
                                                        style={{ transform: 'scale(1.2)' }}
                                                    />
                                                    <span>Select All</span>
                                                </label>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => { setSelectedMappedCourses([]); setIsMappedDeleteMode(false); }}
                                                        style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleBulkDeleteMappedCourses}
                                                        style={{ background: '#FF3B30', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: selectedMappedCourses.length === 0 ? 0.5 : 1 }}
                                                        disabled={selectedMappedCourses.length === 0}
                                                    >
                                                        <RiDeleteBin6Line /> Delete ({selectedMappedCourses.length})
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => setIsMappedDeleteMode(true)}
                                                style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                            >
                                                <RiDeleteBin6Line /> Delete Courses
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- TIMETABLE EDITOR TAB --- */}
                        {activeTab === 'timetable' && (
                            <div className="timetable-builder-v2">
                                {(() => {
                                    const days = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                    const shortLabels = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                    const selectedIndex = days.indexOf(editingDay);
                                    const tabWidth = 100 / days.length;
                                    return (
                                        <div className="s2-day-tabs">
                                            <div
                                                className="s2-day-indicator"
                                                style={{ left: `calc(${selectedIndex * tabWidth}% + 5px)`, width: `calc(${tabWidth}% - 10px)` }}
                                            />
                                            {days.map((day, i) => (
                                                <button key={day} className={editingDay === day ? 'active' : ''} onClick={() => setEditingDay(day)}>{shortLabels[i]}</button>
                                            ))}
                                        </div>
                                    );
                                })()}

                                <div className="tt-controls">
                                    <h3 className="tt-day-title">{editingDay}</h3>
                                    {!isEditingTimetable ? (
                                        <button className="action-btn action-edit" onClick={startEditingTimetable}>
                                            <RiEditLine /> <span className="action-label">Edit</span>
                                        </button>
                                    ) : (
                                        <div className="tt-edit-actions">
                                            <button className="action-btn action-edit" onClick={saveTimetableEdit}>
                                                <RiSave3Line /> <span className="action-label">Save</span>
                                            </button>
                                            <button className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--mac-text)' }} onClick={() => setIsEditingTimetable(false)}>
                                                <RiCloseLine /> <span className="action-label">Cancel</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Auto complete strictly from section's mapped courses */}
                                <datalist id="course-list">
                                    {sectionData.courses?.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                                    <option value="Library">Library</option>
                                    <option value="Placement">Placement</option>
                                    <option value="Sports">Sports</option>
                                </datalist>

                                <div className="tt-period-grid">
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map(idx => (
                                        <div key={idx} className={`tt-period-card ${isEditingTimetable ? 'editing' : ''}`}>
                                            <div className="tt-period-label">
                                                Period {idx + 1}
                                                <span style={{ fontSize: '10px', opacity: 0.6, display: 'block', fontWeight: 400 }}>{periodTimes[idx]}</span>
                                            </div>
                                            {isEditingTimetable ? (
                                                <input
                                                    list="course-list"
                                                    className="tt-period-input"
                                                    placeholder="Code..."
                                                    value={timetableBuffer?.[editingDay]?.[idx] || ""}
                                                    onChange={(e) => updateBufferCell(editingDay, idx, e.target.value)}
                                                />
                                            ) : (
                                                <div className="tt-period-value">
                                                    {sectionData.timetable?.[editingDay]?.[idx] || <span className="tt-empty">—</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* --- COUNSELING / ROLES TAB --- */}
                        {activeTab === 'counseling' && (
                            <div className="counseling-manager settings-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 className="section-title" style={{ margin: 0 }}><RiTeamLine /> Section Roles</h3>
                                    {!isSectionRolesEditMode ? (
                                        <button
                                            className="btn-add-mini"
                                            onClick={() => {
                                                setIsSectionRolesEditMode(true);
                                                setTempSectionRoles({
                                                    "Class Advisor": sectionData.counseling.coordinators?.["Class Advisor"] || '',
                                                    "Chairperson": sectionData.counseling.coordinators?.["Chairperson"] || ''
                                                });
                                            }}
                                            style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)' }}
                                        >
                                            Edit Roles
                                        </button>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn-add-mini"
                                                onClick={() => setIsSectionRolesEditMode(false)}
                                                style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)', border: '1px solid var(--border-color)' }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="btn-add-mini"
                                                onClick={handleSaveSectionRoles}
                                                style={{ background: 'var(--mac-blue)', color: '#fff' }}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="role-editor-row locked">
                                    <div className="role-label">
                                        <strong>Year Coordinator</strong>
                                        <span>(Set centrally in Dept Master)</span>
                                    </div>
                                    <div className="role-value">
                                        {sectionData.counseling.coordinators?.["Year Coordinator"] || "Not Assigned"}
                                    </div>
                                </div>

                                <div className="role-editor-row">
                                    <div className="role-label">
                                        <strong>Class Advisor</strong>
                                    </div>
                                    <div className="role-input">
                                        {isSectionRolesEditMode ? (
                                            <select
                                                value={tempSectionRoles["Class Advisor"] || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    handleCrossDeptFacultySelect(val);
                                                    setTempSectionRoles(prev => ({ ...prev, "Class Advisor": val }));
                                                }}
                                                style={{ minWidth: '250px' }}
                                            >
                                                <option value="">-- Unassigned --</option>
                                                {renderFacultyOptions()}
                                            </select>
                                        ) : (
                                            <div className="counselor-name-chip" style={{ display: 'inline-flex', padding: '10px 16px', borderRadius: '8px', background: 'var(--mac-card-bg)', border: '1px solid var(--border-color)', minWidth: '250px' }}>
                                                {sectionData.counseling.coordinators?.["Class Advisor"] ? (
                                                    <span style={{ color: 'var(--mac-text)', fontWeight: 500 }}>{sectionData.counseling.coordinators?.["Class Advisor"]}</span>
                                                ) : (
                                                    <span style={{ color: 'var(--mac-text)', opacity: 0.5, fontStyle: 'italic' }}>Not Assigned</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="role-editor-row">
                                    <div className="role-label">
                                        <strong>Chairperson</strong>
                                    </div>
                                    <div className="role-input">
                                        {isSectionRolesEditMode ? (
                                            <select
                                                value={tempSectionRoles["Chairperson"] || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    handleCrossDeptFacultySelect(val);
                                                    setTempSectionRoles(prev => ({ ...prev, "Chairperson": val }));
                                                }}
                                                style={{ minWidth: '250px' }}
                                            >
                                                <option value="">-- Unassigned --</option>
                                                {renderFacultyOptions()}
                                            </select>
                                        ) : (
                                            <div className="counselor-name-chip" style={{ display: 'inline-flex', padding: '10px 16px', borderRadius: '8px', background: 'var(--mac-card-bg)', border: '1px solid var(--border-color)', minWidth: '250px' }}>
                                                {sectionData.counseling.coordinators?.["Chairperson"] ? (
                                                    <span style={{ color: 'var(--mac-text)', fontWeight: 500 }}>{sectionData.counseling.coordinators?.["Chairperson"]}</span>
                                                ) : (
                                                    <span style={{ color: 'var(--mac-text)', opacity: 0.5, fontStyle: 'italic' }}>Not Assigned</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="counselors-list-manager" style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <h4 style={{ margin: 0, color: 'var(--mac-text)', fontSize: '15px' }}>Counselors</h4>
                                        {(sectionData.counseling.counselors || []).length > 0 && (
                                            isCounselorEditMode ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn-add-mini"
                                                        onClick={() => { setSelectedCounselors([]); setIsCounselorDeleteMode(false); setIsCounselorEditMode(false); }}
                                                        style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)', border: '1px solid var(--border-color)' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="btn-add-mini"
                                                        onClick={() => { setSelectedCounselors([]); setIsCounselorDeleteMode(false); setIsCounselorEditMode(false); }}
                                                        style={{ background: 'var(--mac-blue)', color: '#fff' }}
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn-add-mini"
                                                    onClick={() => setIsCounselorEditMode(true)}
                                                    style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)' }}
                                                >
                                                    Edit List
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {(isCounselorEditMode || (sectionData.counseling.counselors || []).length === 0) && (
                                        <div className="add-item-bar inline">
                                            <select value={newCounselor} onChange={e => { handleCrossDeptFacultySelect(e.target.value); setNewCounselor(e.target.value); }} style={{ flex: 1 }}>
                                                {renderFacultyOptions()}
                                            </select>
                                            <button className="btn-add-mini" onClick={addCounselor}><RiAddLine /></button>
                                        </div>
                                    )}

                                    <div className="counselor-items-v2" style={{ marginTop: '16px' }}>
                                        {(sectionData.counseling.counselors || []).map((c, i) => (
                                            <div key={i} className={`counselor-item-row ${editingCounselorIdx === i ? 'editing' : ''}`}>
                                                {editingCounselorIdx === i ? (
                                                    <div className="inline-edit-pill-wrap">
                                                        <select
                                                            autoFocus
                                                            value={tempCounselor}
                                                            onChange={(e) => { handleCrossDeptFacultySelect(e.target.value); setTempCounselor(e.target.value); }}
                                                            style={{ flex: 1 }}
                                                        >
                                                            {renderFacultyOptions()}
                                                        </select>
                                                        <div className="edit-pill-actions">
                                                            <button className="action-btn action-edit" onClick={handleUpdateCounselor}><RiCheckLine /> <span className="action-label">Save</span></button>
                                                            <button className="action-btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--mac-text)' }} onClick={() => setEditingCounselorIdx(null)}><RiCloseLine /> <span className="action-label">Cancel</span></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="counselor-name-chip" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                            {isCounselorDeleteMode && (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedCounselors.includes(i)}
                                                                    onChange={() => handleToggleCounselorSelect(i)}
                                                                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                                                />
                                                            )}
                                                            <RiUserVoiceLine style={{ opacity: 0.7 }} />
                                                            <span style={{ color: 'var(--mac-text)' }}>{c}</span>
                                                        </div>
                                                        {isCounselorEditMode && (
                                                            <div className="counselor-row-actions">
                                                                <button className="action-btn action-edit" onClick={() => { setEditingCounselorIdx(i); setTempCounselor(c); }}>
                                                                    <RiEditLine /> <span className="action-label">Edit</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {(sectionData.counseling.counselors?.length === 0 || !sectionData.counseling.counselors) &&
                                            <p className="empty-state">No counselors assigned.</p>
                                        }
                                    </div>

                                    {isCounselorEditMode && (
                                        <div className="bulk-actions-bar" style={{ display: 'flex', justifyContent: isCounselorDeleteMode ? 'space-between' : 'flex-end', alignItems: 'center', padding: '12px', background: isCounselorDeleteMode ? 'rgba(255, 59, 48, 0.05)' : 'transparent', borderRadius: '8px', marginTop: '16px', border: isCounselorDeleteMode ? '1px solid rgba(255, 59, 48, 0.2)' : 'none' }}>
                                            {isCounselorDeleteMode ? (
                                                <>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--mac-text)' }}>
                                                        <input
                                                            type="checkbox"
                                                            onChange={handleSelectAllCounselors}
                                                            checked={selectedCounselors.length === (sectionData.counseling.counselors?.length || 0) && (sectionData.counseling.counselors?.length || 0) > 0}
                                                            style={{ transform: 'scale(1.2)' }}
                                                        />
                                                        <span>Select All</span>
                                                    </label>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={() => { setSelectedCounselors([]); setIsCounselorDeleteMode(false); }}
                                                            style={{ background: 'var(--mac-card-bg)', color: 'var(--mac-text)', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={handleBulkDeleteCounselors}
                                                            style={{ background: '#FF3B30', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', opacity: selectedCounselors.length === 0 ? 0.5 : 1 }}
                                                            disabled={selectedCounselors.length === 0}
                                                        >
                                                            <RiDeleteBin6Line /> Delete ({selectedCounselors.length})
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setIsCounselorDeleteMode(true)}
                                                    style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                                >
                                                    <RiDeleteBin6Line /> Delete Counselors
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* --- ADDITION SPECIFIC CSS FOR MANAGERS --- */}
            <style>{`
         .split-master-view { display: grid; grid-template-columns: 1fr 350px; gap: 24px; }
         .master-config-panel { padding: 24px; }
         .pill-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
         .pill { display: inline-flex; alignItems: center; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; background: var(--mac-bg-secondary); }
         .pill button { background: none; border: none; font-size: 16px; margin-left: 8px; color: var(--mac-text-secondary); cursor: pointer; display: flex; align-items: center; }
         .pill button:hover { color: var(--mac-danger); }
         .course-pill { background: rgba(0, 122, 255, 0.1); color: var(--mac-blue); border: 1px solid rgba(0, 122, 255, 0.2); }
         .faculty-pill { background: rgba(88, 86, 214, 0.1); color: var(--mac-purple); border: 1px solid rgba(88, 86, 214, 0.2); }
         .periods-pill { background: rgba(255, 149, 0, 0.1); color: var(--mac-warning-text); border: 1px solid rgba(255, 149, 0, 0.2); }
         
         .list-item-card.view-only { display: flex; justify-content: space-between; align-items: center; padding: 16px; }
         .mapped-info { display: flex; flex-direction: column; gap: 4px; }
         .mapped-info strong { font-size: 15px; color: var(--mac-text); }
         .mapped-info span { font-size: 13px; color: var(--mac-text-secondary); }
         .mapped-meta { display: flex; gap: 8px; flex: 1; justify-content: flex-end; padding-right: 16px; }
         
         .role-editor-row { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-color); }
         .role-editor-row:last-child { border-bottom: none; }
         .role-editor-row.locked { opacity: 0.7; background: var(--mac-bg-secondary); border-radius: 8px; margin-bottom: 16px; border: none; }
         .role-label { display: flex; flex-direction: column; gap: 4px; }
         .role-label span { font-size: 12px; color: var(--mac-text-secondary); }
         .role-input select { min-width: 250px; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--mac-bg-secondary); color: var(--mac-text); }
         .role-input select:focus { border-color: var(--mac-blue); outline: none; }
         
         @media (max-width: 900px) {
            .split-master-view { grid-template-columns: 1fr; }
         }
         
         @media (max-width: 768px) {
            .add-item-bar.inline { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
            .add-item-bar.inline input, .add-item-bar.inline select { width: 100% !important; flex: none !important; }
            .add-item-bar.inline button { width: 100% !important; justify-content: center !important; margin-top: 5px !important; }
            
            .inline-edit-pill-wrap { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
            .inline-edit-pill-wrap input, .inline-edit-pill-wrap select { width: 100% !important; flex: none !important; }
            .edit-pill-actions { width: 100% !important; flex-direction: row !important; gap: 8px !important; display: flex !important; }
            .edit-pill-actions button { flex: 1 !important; justify-content: center !important; margin: 0 !important; }
            
            .counselor-name-chip { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
            .counselor-item-row { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
            .counselor-row-actions { width: 100% !important; flex-direction: row !important; gap: 8px !important; display: flex !important; margin-left: 0 !important; }
            .counselor-row-actions button { flex: 1 !important; justify-content: center !important; margin: 0 !important; }
            
            .role-editor-row { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
            .role-input { width: 100% !important; }
            .role-input select { width: 100% !important; min-width: 0 !important; }
            
            .field { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
            .field select { width: 100% !important; max-width: none !important; }
         }
      `}</style>
        </div >
    );
};

export default ScheduleManager;

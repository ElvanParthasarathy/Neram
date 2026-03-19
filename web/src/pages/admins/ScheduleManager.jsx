import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set, update, get } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import {
    RiCalendarScheduleLine, RiArrowRightSLine, RiTeamLine,
    RiLayoutGridLine, RiSave3Line, RiBookOpenLine,
    RiUserVoiceLine, RiAddLine, RiDeleteBin6Fill, RiEditLine,
    RiCloseLine, RiCheckLine, RiArrowLeftLine, RiUserLine,
    RiDeleteBin6Line,
    RiGlobalLine, RiLinksLine, RiRefreshLine, RiShieldUserLine
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
        if ((viewLevel === 'secs' || viewLevel === 'editor' || viewLevel === 'master') && path.dept) {
            // We only need ONE listener for the entire department level to avoid race conditions.
            const deptSchedulesRef = ref(db, `schedules/${path.batch}/${path.dept}`);
            
            const unsubData = onValue(deptSchedulesRef, (snap) => {
                const deptData = snap.exists() ? snap.val() : {};
                const actualMaster = deptData._master || { courses: [], coordinator: '' };

                // 1. Set Master Data strictly based on what is in DB right now
                setMasterData({
                    courses: actualMaster.courses || [],
                    coordinator: actualMaster.coordinator || ''
                });

                // 2. Fetch all sections to aggregate existing data (so old data is not lost)
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
                // We merge them WITH the explicit master data using a one-time save structure if missing.
                const currentMasterCourses = actualMaster.courses || [];
                const currentCourseCodes = new Set(currentMasterCourses.map(c => c.code));
                const newCourses = aggregatedCourses.filter(c => c.code && !currentCourseCodes.has(c.code));

                // If there are new courses, auto-save to master and prevent race loop
                if (newCourses.length > 0) {
                    const updatedMaster = {
                        ...actualMaster,
                        courses: [...currentMasterCourses, ...newCourses]
                    };
                    set(ref(db, `schedules/${path.batch}/${path.dept}/_master`), updatedMaster)
                        .catch(err => console.error("Auto-sync master data failed:", err));
                }

                // One-Time Global Migration for Faculties
                if (actualMaster.faculties && Array.isArray(actualMaster.faculties)) {
                    actualMaster.faculties.forEach(f => addFacultyNames(f));
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
                            set(ref(db, `faculties_directory/${path.dept}`), newGlobalList)
                                .catch(err => console.error("Auto-sync faculty failed:", err));
                        }
                    });
                }
            });

            return () => { unsubData(); };
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
                        <span className="crumb-btn level-root" onClick={() => updateLevel('batches', { batch: '', dept: '', sec: '' })}>Schedule</span>
                        
                        {/* Mobile Truncation Ellipsis (Hidden on Desktop) */}
                        <span className="crumb-ellipsis-container">
                            <RiArrowRightSLine className="crumb-sep" />
                            <span className="crumb-static">...</span>
                        </span>

                        {path.batch && <><RiArrowRightSLine className="crumb-sep level-batch-sep" /> <span className="crumb-btn level-batch" onClick={() => updateLevel('depts', { dept: '', sec: '' })}>{path.batch}</span></>}
                        {path.dept && <><RiArrowRightSLine className="crumb-sep level-dept-sep" /> <span className={`level-dept ${viewLevel === 'secs' ? "crumb-static" : "crumb-btn"}`} onClick={() => updateLevel('secs', { sec: '' })}>{path.dept}</span></>}
                        {path.sec && <><RiArrowRightSLine className="crumb-sep level-sec-sep" /> <span className="crumb-static level-sec">{path.sec === '_master' ? 'Master' : `Sec ${path.sec}`}</span></>}
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
                <div className="explorer-content animate-fade-in">
                    <div className="master-workspace-grid">
                        {/* LEFT COLUMN: COURSE MANAGEMENT */}
                        <div className="master-main-col">
                            <div className="master-header-row animate-fade-in">
                                <div className="master-header-title-wrap">
                                    <RiBookOpenLine className="header-title-icon" />
                                    <h2 className="master-header-title">Master Course List</h2>
                                </div>
                                <div className="header-actions">
                                        {masterData.courses.length > 0 && (
                                            isMasterEditMode ? (
                                                <div className="pill-group-row">
                                                    <button
                                                        className="role-header-pill secondary"
                                                        onClick={() => { setSelectedMasterCourses([]); setIsMasterDeleteMode(false); setIsMasterEditMode(false); setEditingMasterCourseIdx(null); }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="role-header-pill active"
                                                        onClick={() => { setSelectedMasterCourses([]); setIsMasterDeleteMode(false); setIsMasterEditMode(false); setEditingMasterCourseIdx(null); }}
                                                    >
                                                        Done
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                     className="edit-list-btn"
                                                     onClick={() => setIsMasterEditMode(true)}
                                                 >
                                                     <RiEditLine style={{ marginRight: '6px' }} /> Edit List
                                                 </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                {(isMasterEditMode || masterData.courses.length === 0) && (
                                    <div className="master-add-card-premium animate-slide-down">
                                        <div className="add-card-title-row">
                                            <span>Enter New Course Details</span>
                                        </div>
                                        <div className="add-card-grid">
                                            <div className="add-input-section">
                                                <label className="add-input-label">SUBJECT CODE</label>
                                                <input
                                                    className="premium-add-input"
                                                    placeholder="EX: 22CS601"
                                                    value={newMasterCourse.code}
                                                    onChange={e => setNewMasterCourse({ ...newMasterCourse, code: e.target.value })}
                                                />
                                            </div>
                                            <div className="add-input-section grow">
                                                <label className="add-input-label">SUBJECT NAME</label>
                                                <input
                                                    className="premium-add-input"
                                                    placeholder="Enter full subject title..."
                                                    value={newMasterCourse.name}
                                                    onChange={e => setNewMasterCourse({ ...newMasterCourse, name: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <button className="premium-add-submit-btn" onClick={handleAddMasterCourse}>
                                            <RiAddLine /> Add Subject to List
                                        </button>
                                    </div>
                                )}

                            <div className="master-items-container individual-cards">
                                {masterData.courses.map((c, i) => (
                                    <div key={i} className={`settings-card master-item-card ${editingMasterCourseIdx === i ? 'editing' : ''}`}>
                                        {editingMasterCourseIdx === i ? (
                                            <div className="pill-edit-row">
                                                <div className="edit-item-fields">
                                                    <div className="edit-field">
                                                        <label className="edit-label">SUBJECT CODE</label>
                                                        <input
                                                            autoFocus
                                                            className="edit-input-field"
                                                            placeholder="Code"
                                                            value={tempMasterCourse.code}
                                                            onChange={(e) => setTempMasterCourse({ ...tempMasterCourse, code: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="edit-field">
                                                        <label className="edit-label">SUBJECT NAME</label>
                                                        <input
                                                            className="edit-input-field"
                                                            placeholder="Name"
                                                            value={tempMasterCourse.name}
                                                            onChange={(e) => setTempMasterCourse({ ...tempMasterCourse, name: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="pill-actions">
                                                    <button className="pill-action-btn cancel" onClick={() => setEditingMasterCourseIdx(null)}>Cancel</button>
                                                    <button className="pill-action-btn save" onClick={handleUpdateMasterCourse}>Save Changes</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="item-content">
                                                    {isMasterDeleteMode && (
                                                        <input
                                                            type="checkbox"
                                                            className="mac-checkbox"
                                                            checked={selectedMasterCourses.includes(i)}
                                                            onChange={() => handleToggleMasterCourseSelect(i)}
                                                        />
                                                    )}
                                                <div className="item-text-stack">
                                                    <div className="course-code-badge">{c.code}</div>
                                                    <span className="course-name-text">{c.name}</span>
                                                </div>
                                                </div>
                                                {isMasterEditMode && (
                                                    <button className="pill-inline-edit" onClick={() => { setEditingMasterCourseIdx(i); setTempMasterCourse(c); }}>
                                                        <RiEditLine />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                                {masterData.courses.length === 0 && (
                                    <div className="settings-card empty-card-wrap">
                                        <div className="empty-placeholder">
                                            <RiBookOpenLine />
                                            <p>No master courses defined yet.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isMasterEditMode && (
                                    <div className={`bulk-action-footer-premium animate-slide-up ${isMasterDeleteMode ? 'danger-mode' : ''}`}>
                                        {isMasterDeleteMode ? (
                                            <div className="bulk-delete-action-row">
                                                <div className="bulk-delete-info">
                                                    <div className="info-icon">
                                                        <RiDeleteBin6Fill />
                                                    </div>
                                                    <div className="bulk-delete-text">
                                                        <span className="bulk-delete-title">
                                                            {selectedMasterCourses.length === 0 ? "Select Items" : `${selectedMasterCourses.length} Selected`}
                                                        </span>
                                                        <span className="bulk-delete-desc">Choose courses to delete</span>
                                                    </div>
                                                </div>
                                                <div className="pill-group">
                                                    <button
                                                        className="premium-pill-btn primary"
                                                        onClick={handleSelectAllMasterCourses}
                                                    >
                                                        {selectedMasterCourses.length === masterData.courses.length && masterData.courses.length > 0 ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                    <button className="premium-pill-btn secondary" onClick={() => { setSelectedMasterCourses([]); setIsMasterDeleteMode(false); }}>Cancel</button>
                                                    <button className="premium-pill-btn danger" onClick={handleBulkDeleteMasterCourses} disabled={selectedMasterCourses.length === 0}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bulk-delete-start-row">
                                                <div className="bulk-delete-info">
                                                    <div className="info-icon">
                                                        <RiBookOpenLine />
                                                    </div>
                                                    <div className="bulk-delete-text">
                                                        <span className="bulk-delete-title">Manage Master List</span>
                                                        <span className="bulk-delete-desc">Select and remove multiple courses at once</span>
                                                    </div>
                                                </div>
                                                <button className="premium-pill-btn danger" onClick={() => setIsMasterDeleteMode(true)}>
                                                    <RiDeleteBin6Fill /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: SIDEBAR CONFIG */}
                        <div className="master-side-col">
                            <div className="settings-card sidebar-card">
                                <h3 className="sidebar-section-title"><RiUserVoiceLine className="hub-title-icon" /> Faculty Hub</h3>
                                <div className="hub-info-box">
                                    <p>Faculties are managed centrally in the <span className="inline-badge">Structure Manager</span>. Map them to courses in specific sections.</p>
                                </div>
                            </div>

                            <div className="settings-card sidebar-card mt-24">
                                <h3 className="sidebar-section-title"><RiShieldUserLine className="admin-title-icon" /> Administration</h3>
                                <div className="role-config-block">
                                    <label className="mac-label">Year Coordinator</label>
                                    {isRolesEditMode ? (
                                        <div className="edit-role-stack">
                                            <select
                                                className="mac-select-pill"
                                                value={tempCoordinator}
                                                onChange={e => setTempCoordinator(e.target.value)}
                                            >
                                                <option value="">-- Unassigned --</option>
                                                {globalFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                                            </select>
                                            <div className="pill-group full-width mt-12">
                                                <button className="premium-pill-btn secondary flex-1" onClick={() => setIsRolesEditMode(false)}>Cancel</button>
                                                <button className="premium-pill-btn primary flex-1" onClick={() => handleSetCoordinator(tempCoordinator)} disabled={(tempCoordinator || '') === (masterData.coordinator || '')}>Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="role-display-pill" onClick={() => { setIsRolesEditMode(true); setTempCoordinator(masterData.coordinator || ''); }}>
                                            <div className="user-info">
                                                <span className="value">{masterData.coordinator || 'Not Assigned'}</span>
                                            </div>
                                            <RiEditLine className="edit-hint" />
                                        </div>
                                    )}
                                    <p className="role-hint">This role has department-wide oversight permissions.</p>
                                </div>
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
                                                    className="edit-list-btn"
                                                    onClick={() => { setSelectedMappedCourses([]); setIsMappedDeleteMode(false); setIsMappedEditMode(false); }}
                                                    style={{ background: 'var(--mac-bg-secondary)', color: 'var(--mac-text-secondary)', padding: '6px 14px' }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="edit-list-btn"
                                                    onClick={() => { setSelectedMappedCourses([]); setIsMappedDeleteMode(false); setIsMappedEditMode(false); }}
                                                    style={{ background: 'var(--mac-blue)', color: '#fff', padding: '6px 14px' }}
                                                >
                                                    Done
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="edit-list-btn"
                                                onClick={() => setIsMappedEditMode(true)}
                                            >
                                                Edit List
                                            </button>
                                        )
                                    )}
                                </div>

                                {(isMappedEditMode || (sectionData.courses || []).length === 0) && (
                                    <div className="s2-mapping-card" style={{ background: 'var(--mac-blue-5)', border: '1px dashed var(--mac-blue-20)', marginBottom: '24px', flexDirection: 'column', alignItems: 'stretch', padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <div className="code-badge" style={{ background: 'var(--mac-blue)', color: 'white' }}><RiAddLine /></div>
                                            <span style={{ fontWeight: 700, color: 'var(--mac-text)' }}>Add New Course Mapping</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <select
                                                    value={newMappedCourse.code}
                                                    onChange={(e) => setNewMappedCourse({ ...newMappedCourse, code: e.target.value })}
                                                    style={{ flex: 2 }}
                                                >
                                                    <option value="">-- Select Course --</option>
                                                    {masterData.courses.map(mc => <option key={mc.code} value={mc.code}>{mc.code} - {mc.name}</option>)}
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Prds"
                                                    value={newMappedCourse.periods}
                                                    onChange={(e) => setNewMappedCourse({ ...newMappedCourse, periods: e.target.value })}
                                                    style={{ flex: 1, minWidth: '80px' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {newMappedCourse.faculties.map((fac, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                                                        <select
                                                            value={fac}
                                                            onChange={(e) => {
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

                                            <button className="btn-add" onClick={handleMapCourse} style={{ marginTop: '12px', background: 'var(--mac-blue)', color: 'white', borderRadius: '12px' }}>
                                                <RiAddLine /> Map Course
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="counselor-items-v2">
                                    {(sectionData.courses || []).map((c, i) => (
                                        <div key={i} className={`s2-mapping-card ${editingMappedCourseIdx === i ? 'editing' : ''}`}>
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
                                                    {isMappedDeleteMode && (
                                                        <input
                                                            type="checkbox"
                                                            className="mac-checkbox"
                                                            checked={selectedMappedCourses.includes(i)}
                                                            onChange={() => handleToggleMappedCourseSelect(i)}
                                                        />
                                                    )}
                                                    <div className="card-main-content">
                                                        <div className="card-header-row">
                                                            <div className="code-badge">{c.code}</div>
                                                            <span className="course-name">{c.name}</span>
                                                        </div>
                                                        <div className="pill-row">
                                                            <span className="s2-mapping-pill faculty"><RiUserLine /> {c.faculty}</span>
                                                            <span className="s2-mapping-pill periods"><RiCalendarScheduleLine /> {c.periods} Prds</span>
                                                        </div>
                                                    </div>

                                                    {isMappedEditMode && (
                                                        <div className="card-actions-area">
                                                            <button className="pill-inline-edit" onClick={() => {
                                                                const facParts = parseFaculties(c.faculty);
                                                                setEditingMappedCourseIdx(i);
                                                                setTempMappedCourse({
                                                                    ...c,
                                                                    faculties: facParts
                                                                });
                                                            }}>
                                                                <RiEditLine />
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h3 className="section-title" style={{ margin: 0 }}><RiTeamLine /> Section Roles</h3>
                                    <span style={{ fontSize: '13px', opacity: 0.6, background: 'var(--mac-blue-15)', color: 'var(--mac-blue)', padding: '4px 10px', borderRadius: '100px', fontWeight: 600 }}>Sec {path.sec}</span>
                                </div>
                                {!isSectionRolesEditMode ? (
                                    <button
                                        className="premium-pill-btn secondary"
                                        onClick={() => {
                                            setIsSectionRolesEditMode(true);
                                            setTempSectionRoles({
                                                "Class Advisor": sectionData.counseling.coordinators?.["Class Advisor"] || '',
                                                "Chairperson": sectionData.counseling.coordinators?.["Chairperson"] || ''
                                            });
                                        }}
                                    >
                                        <RiEditLine /> Edit Roles
                                    </button>
                                ) : (
                                    <div className="pill-group" style={{ display: 'flex', gap: '8px' }}>
                                        <button className="premium-pill-btn secondary" onClick={() => setIsSectionRolesEditMode(false)}>Cancel</button>
                                        <button className="premium-pill-btn primary" onClick={handleSaveSectionRoles}>Save</button>
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
                                            <div className="s2-mapping-pill faculty" style={{ fontSize: '14px', padding: '10px 20px' }}>
                                                <RiUserLine />
                                                <span>{sectionData.counseling.coordinators?.["Class Advisor"] || 'Not Assigned'}</span>
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
                                            <div className="s2-mapping-pill faculty" style={{ fontSize: '14px', padding: '10px 20px' }}>
                                                <RiUserLine />
                                                <span>{sectionData.counseling.coordinators?.["Chairperson"] || 'Not Assigned'}</span>
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
                                            <div key={i} className={`s2-mapping-card ${editingCounselorIdx === i ? 'editing' : ''}`}>
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
                                                        {isCounselorDeleteMode && (
                                                            <input
                                                                type="checkbox"
                                                                className="mac-checkbox"
                                                                checked={selectedCounselors.includes(i)}
                                                                onChange={() => handleToggleCounselorSelect(i)}
                                                            />
                                                        )}
                                                        <div className="card-main-content">
                                                            <div className="card-header-row">
                                                                <RiUserVoiceLine style={{ color: 'var(--mac-blue)' }} />
                                                                <span className="course-name">{c}</span>
                                                            </div>
                                                        </div>
                                                        {isCounselorEditMode && (
                                                            <div className="card-actions-area">
                                                                <button className="pill-inline-edit" onClick={() => { setEditingCounselorIdx(i); setTempCounselor(c); }}>
                                                                    <RiEditLine />
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
         
         .list-item-card.view-only { display: flex; justify-content: space-between; align-items: center; padding: 16px; }
         .mapped-info { display: flex; flex-direction: column; gap: 4px; }
         .mapped-info strong { font-size: 15px; color: var(--mac-text); }
         .mapped-info span { font-size: 13px; color: var(--mac-text-secondary); }
         
         .role-editor-row { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-color); }
         .role-editor-row:last-child { border-bottom: none; }
         .role-editor-row.locked { opacity: 0.7; background: var(--mac-bg-secondary); border-radius: 8px; margin-bottom: 16px; border: none; }
         .role-label { display: flex; flex-direction: column; gap: 4px; }
         .role-label span { font-size: 12px; color: var(--mac-text-secondary); }
         .role-input select { min-width: 250px; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--mac-bg-secondary); color: var(--mac-text); }
         .role-input select:focus { border-color: var(--mac-blue); outline: none; }
      `}</style>
        </div >
    );
};

export default ScheduleManager;

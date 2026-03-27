import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from "../../firebase";
import { ref, onValue, set, update, get } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import {
    RiCalendarScheduleLine, RiArrowRightSLine, RiTeamLine,
    RiLayoutGridLine, RiSave3Line, RiBookOpenLine,
    RiUserVoiceLine, RiAddLine, RiDeleteBin6Fill, RiEditLine,
    RiCloseLine, RiCheckLine, RiArrowLeftLine, RiUserLine,
    RiDeleteBin6Line,
    RiGlobalLine, RiLinksLine, RiRefreshLine, RiShieldUserLine, RiTableLine
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
    // Extract level and path from URL
    const isRep = finalRole === 'rep';
    
    // Rep Strict Lock Params
    const repBatch = userProfile?.batch;
    const repDept = userProfile?.department;
    const repSec = userProfile?.section;

    let viewLevel = searchParams.get('slvl') || 'batches'; // slvl = schedule level
    let path = {
        batch: searchParams.get('sb') || '',
        dept: searchParams.get('sd') || '',
        sec: searchParams.get('ss') || ''
    };

    // Pre-render override for Reps to prevent UI flicker
    if (isRep && repBatch && repDept && repSec) {
        if (path.batch !== repBatch || path.dept !== repDept || viewLevel === 'batches' || viewLevel === 'depts') {
            viewLevel = 'secs';
            path.batch = repBatch;
            path.dept = repDept;
            path.sec = ''; // Rep targets the sections level to pick their section card
        }
    }

    const updateLevel = (level, newPath = {}) => {
        const params = {
            mod: 'schedules',
            slvl: level,
            sb: newPath.batch !== undefined ? newPath.batch : path.batch,
            sd: newPath.dept !== undefined ? newPath.dept : path.dept,
            ss: newPath.sec !== undefined ? newPath.sec : path.sec
        };
        Object.keys(params).forEach(key => !params[key] && delete params[key]);
        setSearchParams(params, { replace: false });
    };

    const navigate = useNavigate();

    const handleBack = () => {
        if (viewLevel === 'sections') {
            updateLevel('depts', { sec: '' });
        } else if (viewLevel === 'depts') {
            updateLevel('batches', { batch: '', dept: '' });
        } else {
            setSearchParams({ mod: 'home' }, { replace: true });
        }
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

    // Sync URL with pre-render override for Reps to ensure history matches UI
    useEffect(() => {
        if (isRep && repBatch && repDept && repSec) {
            const currentSlvl = searchParams.get('slvl');
            const currentSb = searchParams.get('sb');
            const currentSd = searchParams.get('sd');
            const currentSs = searchParams.get('ss');
            
            // Guard 1: If URL aims at wrong batch/dept or lower level
            if (currentSb !== repBatch || currentSd !== repDept || currentSlvl === 'batches' || currentSlvl === 'depts' || !currentSlvl) {
                const params = new URLSearchParams(searchParams);
                params.set('slvl', 'secs');
                params.set('sb', repBatch);
                params.set('sd', repDept);
                params.delete('ss'); // Clean logic
                setSearchParams(params, { replace: true });
            }
            // Guard 2: If URL aims at wrong section in editor
            else if (currentSlvl === 'editor' && currentSs !== repSec) {
                const params = new URLSearchParams(searchParams);
                params.set('slvl', 'secs');
                params.set('sb', repBatch);
                params.set('sd', repDept);
                params.delete('ss'); // Clean logic
                setSearchParams(params, { replace: true });
            }
        }
    }, [isRep, repBatch, repDept, repSec, searchParams, setSearchParams]);

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
        const uniqueOwnFaculties = [...new Set(globalFaculties)];

        return (
            <>
                <option value="">-- Select Faculty --</option>
                <optgroup label={`${path.dept} (Your Dept)`}>
                    {uniqueOwnFaculties.map(f => <option key={f} value={f}>{f}</option>)}
                    {uniqueOwnFaculties.length === 0 && <option disabled>No faculty added</option>}
                </optgroup>
                {otherDepts.map(dept => {
                    const deptFac = [...new Set((allDeptFaculties[dept] || []).filter(f => !uniqueOwnFaculties.includes(f)))];
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
                    <div className="breadcrumb-list">
                        <span className={`crumb-btn level-root ${isRep ? 'disabled-crumb' : ''}`} onClick={() => !isRep && updateLevel('batches', { batch: '', dept: '', sec: '' })}>Schedule</span>
                        
                        {/* Mobile Truncation Ellipsis (Hidden on Desktop) */}
                        <span className="crumb-ellipsis-container">
                            <RiArrowRightSLine className="crumb-sep" />
                            <span className="crumb-static">...</span>
                        </span>

                        {path.batch && <><RiArrowRightSLine className="crumb-sep level-batch-sep" /> <span className={`crumb-btn level-batch ${isRep ? 'disabled-crumb' : ''}`} onClick={() => !isRep && updateLevel('depts', { dept: '', sec: '' })}>{path.batch}</span></>}
                        {isRep && path.dept && <><RiArrowRightSLine className="crumb-sep level-dept-sep" /> <span className="crumb-static level-dept">{path.dept}</span></>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {viewLevel !== 'batches' && viewLevel !== 'secs' && (
                        <button className="explorer-back-btn" onClick={handleBack}>
                            <RiArrowLeftLine /> Back
                        </button>
                    )}
                    {!isRep && viewLevel === 'secs' && (
                        <button className="explorer-back-btn" onClick={handleBack}>
                            <RiArrowLeftLine /> Back
                        </button>
                    )}
                </div>
            </header>

            {/* EXPLORER VIEWS */}
            {!isRep && viewLevel === 'batches' && (
                <div className="explorer-content explorer-grid">
                    {Object.keys(hierarchy).sort().reverse().map(b => (
                        <div key={b} className="explorer-card" onClick={() => updateLevel('depts', { batch: b })}>
                            <RiTeamLine className="card-icon" /> <div className="card-info"><h3>Batch {b}</h3><p>Manage Schedule</p></div>
                        </div>
                    ))}
                </div>
            )}

            {/* DEPARTMENT SELECTOR */}
            {!isRep && viewLevel === 'depts' && (
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
                    {Object.values(hierarchy[path.batch]?.[path.dept] || {})
                        .filter(s => !isRep || s === repSec) // REPS ONLY SEE THEIR SECTION
                        .map(s => (
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
                                                <div className="master-header-row" style={{ display: 'flex', gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
                                                    <button
                                                        className="role-header-pill secondary"
                                                        onClick={() => { setSelectedMasterCourses([]); setIsMasterDeleteMode(false); setIsMasterEditMode(false); setEditingMasterCourseIdx(null); }}
                                                        style={{ minWidth: '90px' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="role-header-pill active"
                                                        onClick={() => { setSelectedMasterCourses([]); setIsMasterDeleteMode(false); setIsMasterEditMode(false); setEditingMasterCourseIdx(null); }}
                                                        style={{ minWidth: '90px' }}
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
                                                <div className="pill-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                                                    <button className="premium-pill-btn secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setEditingMasterCourseIdx(null)}>Cancel</button>
                                                    <button className="premium-pill-btn primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUpdateMasterCourse}>Save</button>
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
                        <button className={activeTab === 'courses' ? 'active' : ''} onClick={() => setActiveTab('courses')}>Mapping</button>
                        <button className={activeTab === 'timetable' ? 'active' : ''} onClick={() => setActiveTab('timetable')}>Timetable</button>
                        <button className={activeTab === 'counseling' ? 'active' : ''} onClick={() => setActiveTab('counseling')}>Roles</button>
                    </nav>

                    <div className="tab-content-area">

                        {/* --- COURSE MAPPING TAB --- */}
                        {activeTab === 'courses' && (
                            <div className="course-manager">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <div className="mapping-instructions" style={{ margin: 0 }}>
                                        <h2 className="section-title-premium" style={{ margin: 0 }}>Course Faculty Mapper</h2>
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
                                    <div className="s2-mapping-card add-mapping-container" style={{ marginBottom: '24px', flexDirection: 'column', alignItems: 'stretch', padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <div className="code-badge" style={{ background: 'var(--mac-blue)', color: 'white' }}><RiAddLine /></div>
                                            <span style={{ fontWeight: 700, color: 'var(--mac-text)' }}>Add New Course Mapping</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <select
                                                    className="mac-select-pill"
                                                    value={newMappedCourse.code}
                                                    onChange={(e) => setNewMappedCourse({ ...newMappedCourse, code: e.target.value })}
                                                    style={{ width: '100%' }}
                                                >
                                                    <option value="">-- Select Course --</option>
                                                    {masterData.courses.map(mc => <option key={mc.code} value={mc.code}>{mc.code} - {mc.name}</option>)}
                                                </select>
                                                <input
                                                    className="premium-add-input"
                                                    type="number"
                                                    placeholder="Prds"
                                                    value={newMappedCourse.periods}
                                                    onChange={(e) => setNewMappedCourse({ ...newMappedCourse, periods: e.target.value })}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {newMappedCourse.faculties.map((fac, idx) => (
                                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                                                            <select
                                                                className="mac-select-pill"
                                                                value={fac}
                                                                onChange={(e) => {
                                                                    const newFacs = [...newMappedCourse.faculties];
                                                                    newFacs[idx] = e.target.value;
                                                                    setNewMappedCourse({ ...newMappedCourse, faculties: newFacs });
                                                                    handleCrossDeptFacultySelect(e.target.value);
                                                                }}
                                                                style={{ width: '100%' }}
                                                            >
                                                                {renderFacultyOptions()}
                                                            </select>
                                                        </div>

                                                        {idx === newMappedCourse.faculties.length - 1 && (
                                                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
                                                                <button className="premium-pill-btn secondary" onClick={() => setNewMappedCourse({ ...newMappedCourse, faculties: [...newMappedCourse.faculties, ''] })} style={{ flex: 1, background: 'var(--mac-bg-secondary)', color: 'var(--mac-text)', border: '1px dashed var(--mac-border)', boxShadow: 'none', justifyContent: 'center' }}>
                                                                    <RiAddLine /> Faculty
                                                                </button>
                                                                {newMappedCourse.faculties.length > 1 && (
                                                                    <button className="premium-pill-btn danger" onClick={() => {
                                                                        const newFacs = newMappedCourse.faculties.slice(0, -1);
                                                                        setNewMappedCourse({ ...newMappedCourse, faculties: newFacs });
                                                                    }} style={{ flex: 1, justifyContent: 'center' }}>
                                                                        <RiDeleteBin6Line /> Option
                                                                   </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <button className="premium-pill-btn primary full-width" onClick={handleMapCourse} style={{ marginTop: '8px', justifyContent: 'center' }}>
                                                <RiAddLine /> Map Course
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="counselor-items-v2">
                                    {(sectionData.courses || []).map((c, i) => (
                                        <div key={i} className={`s2-mapping-card ${editingMappedCourseIdx === i ? 'editing' : ''}`}>
                                            {editingMappedCourseIdx === i ? (
                                                <div className="inline-edit-pill-wrap" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', padding: '4px 0', alignItems: 'stretch' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                                                            <select
                                                                className="mac-select-pill"
                                                                value={tempMappedCourse.code}
                                                                onChange={(e) => setTempMappedCourse({ ...tempMappedCourse, code: e.target.value })}
                                                                style={{ width: '100%' }}
                                                            >
                                                                <option value="">-- Select Course --</option>
                                                                {masterData.courses.map(mc => <option key={mc.code} value={mc.code}>{mc.code} - {mc.name}</option>)}
                                                            </select>
                                                            <input
                                                                className="premium-add-input"
                                                                type="number"
                                                                placeholder="Prds"
                                                                value={tempMappedCourse.periods}
                                                                onChange={(e) => setTempMappedCourse({ ...tempMappedCourse, periods: e.target.value })}
                                                                style={{ width: '100%' }}
                                                            />
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                                                            {tempMappedCourse.faculties.map((fac, facIdx) => (
                                                                <div key={facIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
                                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                                                                        <select
                                                                            className="mac-select-pill"
                                                                            value={fac}
                                                                            onChange={(e) => {
                                                                                const newFacs = [...tempMappedCourse.faculties];
                                                                                newFacs[facIdx] = e.target.value;
                                                                                setTempMappedCourse({ ...tempMappedCourse, faculties: newFacs });
                                                                                handleCrossDeptFacultySelect(e.target.value);
                                                                            }}
                                                                            style={{ width: '100%' }}
                                                                        >
                                                                            {renderFacultyOptions()}
                                                                        </select>
                                                                    </div>

                                                                    {facIdx === tempMappedCourse.faculties.length - 1 && (
                                                                        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                                                            <button className="premium-pill-btn secondary" onClick={() => setTempMappedCourse({ ...tempMappedCourse, faculties: [...tempMappedCourse.faculties, ''] })} style={{ flex: 1, background: 'var(--mac-bg-secondary)', color: 'var(--mac-text)', border: '1px dashed var(--mac-border)', boxShadow: 'none', justifyContent: 'center' }}>
                                                                                <RiAddLine /> Faculty
                                                                            </button>
                                                                            {tempMappedCourse.faculties.length > 1 && (
                                                                                <button className="premium-pill-btn danger" onClick={() => {
                                                                                    const newFacs = tempMappedCourse.faculties.slice(0, -1);
                                                                                    setTempMappedCourse({ ...tempMappedCourse, faculties: newFacs });
                                                                                }} style={{ flex: 1, justifyContent: 'center' }}>
                                                                                    <RiDeleteBin6Line /> Option
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>

                                                    <div className="edit-pill-actions" style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'center' }}>
                                                        <button className="premium-pill-btn primary" onClick={handleUpdateMappedCourse} style={{ flex: 1, justifyContent: 'center' }}>
                                                            <RiCheckLine /> Save
                                                        </button>
                                                        <button className="premium-pill-btn secondary" onClick={() => setEditingMappedCourseIdx(null)} style={{ flex: 1, justifyContent: 'center' }}>
                                                            <RiCloseLine /> Cancel
                                                        </button>
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
                                    <div className={`bulk-action-footer-premium animate-slide-up ${isMappedDeleteMode ? 'danger-mode' : ''}`} style={{ marginTop: '24px' }}>
                                        {isMappedDeleteMode ? (
                                            <div className="bulk-delete-action-row">
                                                <div className="bulk-delete-info">
                                                    <div className="info-icon">
                                                        <RiDeleteBin6Fill />
                                                    </div>
                                                    <div className="bulk-delete-text">
                                                        <span className="bulk-delete-title">
                                                            {selectedMappedCourses.length === 0 ? "Select Items" : `${selectedMappedCourses.length} Selected`}
                                                        </span>
                                                        <span className="bulk-delete-desc">Choose mapped courses to delete</span>
                                                    </div>
                                                </div>
                                                <div className="pill-group">
                                                    <button
                                                        className="premium-pill-btn primary"
                                                        onClick={handleSelectAllMappedCourses}
                                                    >
                                                        {selectedMappedCourses.length === (sectionData.courses?.length || 0) && (sectionData.courses?.length || 0) > 0 ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                    <button className="premium-pill-btn secondary" onClick={() => { setSelectedMappedCourses([]); setIsMappedDeleteMode(false); }}>Cancel</button>
                                                    <button className="premium-pill-btn danger" onClick={handleBulkDeleteMappedCourses} disabled={selectedMappedCourses.length === 0}>
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bulk-delete-start-row">
                                                <div className="bulk-delete-info">
                                                    <div className="info-icon">
                                                        <RiLinksLine />
                                                    </div>
                                                    <div className="bulk-delete-text">
                                                        <span className="bulk-delete-title">Manage Local Mapping</span>
                                                        <span className="bulk-delete-desc">Select and remove multiple mappings at once</span>
                                                    </div>
                                                </div>
                                                <button className="premium-pill-btn danger" onClick={() => setIsMappedDeleteMode(true)}>
                                                    <RiDeleteBin6Fill /> Delete Courses
                                                </button>
                                            </div>
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
                                    return (
                                        <nav className="editor-tabs box-flat" style={{ display: 'flex', width: '100%', marginBottom: '24px' }}>
                                            {days.map((day, i) => (
                                                <button key={day} style={{ flex: 1, justifyContent: 'center', padding: '8px 0' }} className={editingDay === day ? 'active' : ''} onClick={() => setEditingDay(day)}>{shortLabels[i]}</button>
                                            ))}
                                        </nav>
                                    );
                                })()}

                                <div className="tt-controls">
                                    <h3 className="tt-day-title">{editingDay}</h3>
                                    {!isEditingTimetable ? (
                                        <button className="edit-list-btn" onClick={startEditingTimetable}>
                                            <RiEditLine /> Edit
                                        </button>
                                    ) : (
                                        <div className="tt-edit-actions">
                                            <button className="premium-pill-btn primary" onClick={saveTimetableEdit}>
                                                <RiSave3Line /> Save
                                            </button>
                                            <button className="premium-pill-btn secondary" onClick={() => setIsEditingTimetable(false)}>
                                                <RiCloseLine /> Cancel
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
                                    {[0, 1, 2, 3, 4, 5, 6].map(idx => (
                                        <div key={idx} className={`tt-period-card ${isEditingTimetable ? 'editing' : ''}`}>
                                            <div className="tt-period-label">
                                                Period {idx + 1}
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
                            <div className="sr-tab-wrapper">
                                <div className="sr-split-view">
                                    {/* ----- LEFT COLUMN: SECTION ROLES ----- */}
                                    <div className="sr-column">
                                        {/* ===== SECTION ROLES — HEADER ROW ===== */}
                                        <div className="sr-section-header">
                                            <div className="sr-header-left">
                                                <RiTeamLine className="sr-header-icon" />
                                                <h3 className="sr-title">Section Roles</h3>
                                            </div>
                                            <div className="sr-header-right">
                                                {!isSectionRolesEditMode ? (
                                                    <button className="sr-action-btn" onClick={() => { setIsSectionRolesEditMode(true); setTempSectionRoles({ "Class Advisor": sectionData.counseling.coordinators?.["Class Advisor"] || '', "Chairperson": sectionData.counseling.coordinators?.["Chairperson"] || '' }); }}>
                                                        <RiEditLine /> Edit Roles
                                                    </button>
                                                ) : (
                                                    <div className="sr-action-group">
                                                        <button className="sr-action-btn sr-cancel" onClick={() => setIsSectionRolesEditMode(false)}>Cancel</button>
                                                        <button className="sr-action-btn sr-save" onClick={handleSaveSectionRoles}>Save</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Year Coordinator — individual card (locked) */}
                                        <div className="sr-role-card sr-locked">
                                            <div className="sr-role-info">
                                                <span className="sr-role-name">Year Coordinator</span>
                                                <span className="sr-role-hint">Set centrally in Dept Master</span>
                                            </div>
                                            <div className="sr-role-badge">
                                                <RiUserLine className="sr-badge-icon" />
                                                <span>{sectionData.counseling.coordinators?.["Year Coordinator"] || "Not Assigned"}</span>
                                            </div>
                                        </div>

                                        {/* Class Advisor — individual card */}
                                        <div className="sr-role-card">
                                            <div className="sr-role-info">
                                                <span className="sr-role-name">Class Advisor</span>
                                            </div>
                                            {isSectionRolesEditMode ? (
                                                <select className="sr-select" value={tempSectionRoles["Class Advisor"] || ''} onChange={e => { handleCrossDeptFacultySelect(e.target.value); setTempSectionRoles(prev => ({ ...prev, "Class Advisor": e.target.value })); }}>
                                                    <option value="">-- Unassigned --</option>
                                                    {renderFacultyOptions()}
                                                </select>
                                            ) : (
                                                <div className="sr-role-badge">
                                                    <RiUserLine className="sr-badge-icon" />
                                                    <span>{sectionData.counseling.coordinators?.["Class Advisor"] || 'Not Assigned'}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chairperson — individual card */}
                                        <div className="sr-role-card">
                                            <div className="sr-role-info">
                                                <span className="sr-role-name">Chairperson</span>
                                            </div>
                                            {isSectionRolesEditMode ? (
                                                <select className="sr-select" value={tempSectionRoles["Chairperson"] || ''} onChange={e => { handleCrossDeptFacultySelect(e.target.value); setTempSectionRoles(prev => ({ ...prev, "Chairperson": e.target.value })); }}>
                                                    <option value="">-- Unassigned --</option>
                                                    {renderFacultyOptions()}
                                                </select>
                                            ) : (
                                                <div className="sr-role-badge">
                                                    <RiUserLine className="sr-badge-icon" />
                                                    <span>{sectionData.counseling.coordinators?.["Chairperson"] || 'Not Assigned'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* ----- RIGHT COLUMN: COUNSELORS ----- */}
                                    <div className="sr-column">
                                        {/* ===== COUNSELORS — HEADER ROW ===== */}
                                        <div className="sr-section-header">
                                            <div className="sr-header-left">
                                                <RiUserVoiceLine className="cr-header-icon" />
                                                <h3 className="sr-title">Counselors</h3>
                                                <span className="cr-count-badge">{(sectionData.counseling.counselors || []).length}</span>
                                            </div>
                                            <div className="sr-header-right">
                                                {(sectionData.counseling.counselors || []).length > 0 && (
                                                    isCounselorEditMode ? (
                                                        <div className="sr-action-group">
                                                            <button className="sr-action-btn sr-cancel" onClick={() => { setSelectedCounselors([]); setIsCounselorDeleteMode(false); setIsCounselorEditMode(false); }}>Cancel</button>
                                                            <button className="sr-action-btn sr-save" onClick={() => { setSelectedCounselors([]); setIsCounselorDeleteMode(false); setIsCounselorEditMode(false); }}>Done</button>
                                                        </div>
                                                    ) : (
                                                        <button className="sr-action-btn" onClick={() => setIsCounselorEditMode(true)}>
                                                            <RiEditLine /> Edit List
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Add Counselor Card */}
                                        {(isCounselorEditMode || (sectionData.counseling.counselors || []).length === 0) && (
                                            <div className="cr-add-card animate-slide-down">
                                                <div className="cr-add-header">
                                                    <div className="code-badge"><RiAddLine /></div>
                                                    <span>Add New Counselor</span>
                                                </div>
                                                <div className="cr-add-bar">
                                                    <select className="sr-select" value={newCounselor} onChange={e => { handleCrossDeptFacultySelect(e.target.value); setNewCounselor(e.target.value); }} style={{ flex: 1 }}>
                                                        {renderFacultyOptions()}
                                                    </select>
                                                    <button className="cr-add-btn" onClick={addCounselor}><RiAddLine /></button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Individual Counselor Cards */}
                                        {(sectionData.counseling.counselors || []).map((c, i) => (
                                            <div key={i} className={`cr-person-card ${editingCounselorIdx === i ? 'cr-editing' : ''} ${selectedCounselors.includes(i) ? 'cr-selected' : ''}`}>
                                                {editingCounselorIdx === i ? (
                                                    <div className="cr-edit-wrap">
                                                        <select className="sr-select" autoFocus value={tempCounselor} onChange={(e) => { handleCrossDeptFacultySelect(e.target.value); setTempCounselor(e.target.value); }} style={{ flex: 1 }}>
                                                            {renderFacultyOptions()}
                                                        </select>
                                                        <div className="cr-edit-actions" style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'center' }}>
                                                            <button className="premium-pill-btn primary" onClick={handleUpdateCounselor} style={{ flex: 1, justifyContent: 'center' }}>
                                                                <RiCheckLine /> Save
                                                            </button>
                                                            <button className="premium-pill-btn secondary" onClick={() => setEditingCounselorIdx(null)} style={{ flex: 1, justifyContent: 'center' }}>
                                                                <RiCloseLine /> Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {isCounselorDeleteMode && (
                                                            <input type="checkbox" className="mac-checkbox" checked={selectedCounselors.includes(i)} onChange={() => handleToggleCounselorSelect(i)} />
                                                        )}
                                                        <div className="cr-person-info">
                                                            <div className="cr-avatar"><RiUserVoiceLine /></div>
                                                            <span className="cr-person-name">{c}</span>
                                                        </div>
                                                        {isCounselorEditMode && !isCounselorDeleteMode && (
                                                            <button className="cr-edit-btn" title="Edit Counselor" onClick={() => { setEditingCounselorIdx(i); setTempCounselor(c); }}>
                                                                <RiEditLine />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ))}

                                        {(sectionData.counseling.counselors?.length === 0 || !sectionData.counseling.counselors) &&
                                            <p className="cr-empty">No counselors assigned yet.</p>
                                        }

                                        {/* Bulk Delete Bar */}
                                        {isCounselorEditMode && (
                                            <div className={`bulk-action-footer-premium animate-slide-up ${isCounselorDeleteMode ? 'danger-mode' : ''}`} style={{ marginTop: '24px' }}>
                                                {isCounselorDeleteMode ? (
                                                    <div className="bulk-delete-action-row">
                                                        <div className="bulk-delete-info">
                                                            <div className="info-icon">
                                                                <RiDeleteBin6Fill />
                                                            </div>
                                                            <div className="bulk-delete-text">
                                                                <span className="bulk-delete-title">
                                                                    {selectedCounselors.length === 0 ? "Select Items" : `${selectedCounselors.length} Selected`}
                                                                </span>
                                                                <span className="bulk-delete-desc">Choose counselors to delete</span>
                                                            </div>
                                                        </div>
                                                        <div className="pill-group">
                                                            <button
                                                                className="premium-pill-btn primary"
                                                                onClick={handleSelectAllCounselors}
                                                            >
                                                                {selectedCounselors.length === (sectionData.counseling.counselors?.length || 0) && (sectionData.counseling.counselors?.length || 0) > 0 ? 'Deselect All' : 'Select All'}
                                                            </button>
                                                            <button className="premium-pill-btn secondary" onClick={() => { setSelectedCounselors([]); setIsCounselorDeleteMode(false); }}>Cancel</button>
                                                            <button className="premium-pill-btn danger" onClick={handleBulkDeleteCounselors} disabled={selectedCounselors.length === 0}>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="bulk-delete-start-row">
                                                        <div className="bulk-delete-info">
                                                            <div className="info-icon">
                                                                <RiUserVoiceLine />
                                                            </div>
                                                            <div className="bulk-delete-text">
                                                                <span className="bulk-delete-title">Manage Counselors</span>
                                                                <span className="bulk-delete-desc">Select and remove multiple counselors at once</span>
                                                            </div>
                                                        </div>
                                                        <button className="premium-pill-btn danger" onClick={() => setIsCounselorDeleteMode(true)}>
                                                            <RiDeleteBin6Line /> Delete Counselors
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- ADDITION SPECIFIC CSS FOR MANAGERS --- */}
            <style>{`
         .split-master-view { display: grid; grid-template-columns: 1fr 350px; gap: 24px; }
         .master-config-panel { padding: 24px; }
         .pill-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
         
         .list-item-card.view-only { display: flex; justify-content: space-between; align-items: center; padding: 16px; }
         .mapped-info { display: flex; flex-direction: column; gap: 4px; }
         .mapped-info strong { font-size: 15px; color: var(--mac-text); }
         .mapped-info span { font-size: 13px; color: var(--mac-text-secondary); }
         
       `}</style>
        </div >
    );
};

export default ScheduleManager;

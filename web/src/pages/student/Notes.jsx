import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import {
    RiFolderFill,
    RiArrowRightSLine,
    RiArrowLeftSLine,
    RiFileTextFill,
    RiExternalLinkLine,
    RiLockLine,
    RiLoader4Line,
    RiErrorWarningLine,
    RiArrowDownSLine,
    RiArrowUpSLine,
    RiFilePdfLine,
    RiCloudOffLine,
    RiInformationLine
} from 'react-icons/ri';
import "../../App.css";
import "../../styles/student/home.css";

import "../../styles/student/notes-desktop.css";

/**
 * Notes Component - Android Parity Version
 * 
 * Features:
 * - Stack-based navigation (Breadcrumbs/Path)
 * - Depth-aware data processing (Root -> Dept -> Semester -> Subjects)
 * - SNH Special Logic (Inferred Grouping)
 * - Sequoia Pro UI (Folders, Accordions, Unit Chips)
 */

const Notes = () => {
    // --- STATE ---
    const [path, setPath] = useState([]); // Stack: ["CSE", "Semester 3"]
    const [rootDepts, setRootDepts] = useState(["ECE", "AIML", "CSBS", "CSE", "IT", "SNH"]);
    const [cachedSemesters, setCachedSemesters] = useState([]); // Raw data from RMD
    const [uiStatus, setUiStatus] = useState('empty'); // 'empty', 'loading', 'browser', 'error'
    const [error, setError] = useState(null);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showNotUploaded, setShowNotUploaded] = useState(false);

    // --- NEW: FOLDER MODE STATE ---
    const [notesMode, setNotesMode] = useState('loading');
    const [driveFolders, setDriveFolders] = useState({});
    const [files, setFiles] = useState({});
    const [subjects, setSubjects] = useState({});
    const [drivePath, setDrivePath] = useState([{ id: 'root', name: 'Notes Drive' }]);

    // --- PARITY: SCROLL MEMORY ---
    const scrollCache = useRef({}); // pathKey -> scrollTop
    const viewportRef = useRef(null);

    const getPathKey = useCallback(() => {
        if (notesMode === 'folder') return drivePath.map(p => p.id).join('-');
        return path.join('-');
    }, [notesMode, drivePath, path]);

    const saveScroll = useCallback(() => {
        if (viewportRef.current) {
            scrollCache.current[getPathKey()] = viewportRef.current.scrollTop;
        }
    }, [getPathKey]);

    const [titleFontSize, setTitleFontSize] = useState('16px');

    useEffect(() => {
        if (!isMobile) {
            setTitleFontSize('28px');
            return;
        }
        const currentTitle = notesMode === 'folder' 
            ? drivePath[drivePath.length - 1]?.name || "" 
            : (path.length === 0 ? "Lecture Notes" : path[path.length - 1]);
        
        const len = currentTitle.length;
        if (len > 25) setTitleFontSize('13px');
        else if (len > 18) setTitleFontSize('14px');
        else setTitleFontSize('16px');
    }, [path, drivePath, isMobile, notesMode]);

    useEffect(() => {
        // Restore scroll after content renders
        const key = getPathKey();
        if (viewportRef.current && scrollCache.current[key] !== undefined) {
            viewportRef.current.scrollTop = scrollCache.current[key];
        }
    }, [getPathKey, uiStatus]);

    // --- ANIMATION STATE ---
    const prevFolderDepth = useRef(1);
    const driveAnimDirection = drivePath.length >= prevFolderDepth.current ? 'forward' : 'backward';
    prevFolderDepth.current = drivePath.length;

    const prevFetchDepth = useRef(0);
    const fetchAnimDirection = path.length >= prevFetchDepth.current ? 'forward' : 'backward';
    prevFetchDepth.current = path.length;

    // --- NEW: FIREBASE LISTENERS ---
    useEffect(() => {
        const modeRef = ref(db, 'settings/notesMode');
        const unsubMode = onValue(modeRef, snap => setNotesMode(snap.val() || 'fetch'));

        const unsubFolders = onValue(ref(db, 'notes_drive/folders'), (snapshot) => setDriveFolders(snapshot.val() || {}));
        const unsubSubjects = onValue(ref(db, 'notes_drive/subjects'), (snapshot) => setSubjects(snapshot.val() || {}));
        const unsubFiles = onValue(ref(db, 'notes_drive/files'), (snapshot) => setFiles(snapshot.val() || {}));
        
        const unsubDepts = onValue(ref(db, 'departments'), (snap) => {
            if (snap.exists()) {
                let depts = snap.val();
                if (!depts.includes("SNH")) depts.push("SNH");
                setRootDepts(depts.sort());
            }
        });

        return () => { 
            unsubMode(); 
            unsubFolders(); 
            unsubSubjects(); 
            unsubFiles();
            unsubDepts();
        };
    }, []);

    const driveCurrentFolderId = drivePath[drivePath.length - 1].id;
    const currentDriveFolders = Object.values(driveFolders).filter(f => f.parentId === driveCurrentFolderId);
    const currentSubjects = Object.entries(subjects)
        .filter(([, subject]) => subject.parentId === driveCurrentFolderId)
        .map(([key, subject]) => ({ ...subject, _key: key }));

    const currentFiles = Object.entries(files)
        .filter(([, file]) => file.parentId === driveCurrentFolderId)
        .map(([key, file]) => ({ ...file, _key: key }));

    // --- RESPONSIVE ---
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- GLOBAL MOBILE NAV SYNC ---
    useEffect(() => {
        if (!isMobile) return;
        
        // PARITY: In Fetch Mode, Android uses its own internal header.
        // We only sync with the global navbar for Folder Mode.
        if (notesMode === 'fetch') {
            window.dispatchEvent(new CustomEvent('neram-update-nav', { detail: null }));
            return;
        }

        let overrideTitle = "Notes";
        let hasBack = false;

        if (notesMode === 'folder') {
            if (drivePath.length > 1) {
                overrideTitle = drivePath[drivePath.length - 1].name;
                hasBack = true;
            }
        }

        if (hasBack) {
            window.dispatchEvent(new CustomEvent('neram-update-nav', { 
                detail: { title: overrideTitle, customBackEvent: 'neram-notes-back' } 
            }));
        } else {
            window.dispatchEvent(new CustomEvent('neram-update-nav', { 
                detail: null 
            }));
        }
        
        return () => window.dispatchEvent(new CustomEvent('neram-update-nav', { detail: null }));
    }, [isMobile, notesMode, drivePath, path]);

    useEffect(() => {
        const handleNotesBack = () => {
            if (notesMode === 'folder') {
                setDrivePath(p => p.length > 1 ? p.slice(0, -1) : p);
            } else {
                setPath(p => {
                    if (p.length > 0) {
                        const newPath = p.slice(0, -1);
                        if (newPath.length === 0) {
                            setUiStatus('empty');
                            setCachedSemesters([]);
                            setExpandedSubjects({});
                        }
                        return newPath;
                    }
                    return p;
                });
            }
        };
        window.addEventListener('neram-notes-back', handleNotesBack);
        return () => window.removeEventListener('neram-notes-back', handleNotesBack);
    }, [notesMode]);

    // --- HELPERS (Android Parity) ---
    const toTitleCase = useCallback((str) => {
        if (!str) return "";
        const s = String(str).trim();
        if (!s) return "";

        return s.split(" ").map(word => {
            // Preserve Regulation codes like R-2024
            if (word.includes("-") && /\d/.test(word)) return word;
            // Preserve words with digits
            if (/\d/.test(word)) return word;
            // Preserve abbreviations
            if (word.length <= 4 && word === word.toUpperCase() && word.length > 0) return word;
            // Normal word -> Title Case
            return word.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
        }).join(" ");
    }, []);

    const mapDeptToAbbreviation = useCallback((raw) => {
        const upper = raw.toUpperCase();
        const found = [];
        if (upper.includes("COMPUTER SCIENCE AND ENGINEERING") || upper.includes("CSE")) found.push("CSE");
        if (upper.includes("INFORMATION TECHNOLOGY") || upper.includes("IT")) found.push("IT");
        if (upper.includes("ELECTRONICS AND COMMUNICATION") || upper.includes("ECE")) found.push("ECE");
        if (upper.includes("ELECTRICAL AND ELECTRONICS") || upper.includes("EEE")) found.push("EEE");
        if (upper.includes("ARTIFICIAL INTELLIGENCE") || upper.includes("AIML")) found.push("AIML");
        if (upper.includes("BUSINESS SYSTEM")) found.push("CSBS");
        if (upper.includes("SCIENCE AND HUMANITIES") || upper.includes("SNH")) found.push("SNH");

        return found.length > 0 ? found.join(" / ") : toTitleCase(raw);
    }, [toTitleCase]);

    // --- PARSING (Web Specific Implementation of Repository Logic) ---
    const parseTable = useCallback((table) => {
        const subjects = [];
        const rows = Array.from(table.querySelectorAll("tbody tr"));

        rows.forEach(row => {
            const tds = Array.from(row.querySelectorAll("td"));
            if (tds.length < 2) return;

            let subjectName = tds[1]?.innerText?.trim() || "";
            if (!subjectName || /^\d+\.?$/.test(subjectName)) {
                subjectName = tds[0]?.innerText?.trim() || "";
            }
            if (!subjectName || /^\d+\.?$/.test(subjectName)) {
                subjectName = tds[2]?.innerText?.trim() || "";
            }

            if (subjectName && !/^\d+\.?$/.test(subjectName)) {
                const units = {};

                // Scan all cells for units
                tds.forEach(td => {
                    const links = Array.from(td.querySelectorAll("a"));
                    links.forEach(link => {
                        const href = link.getAttribute("href");
                        const text = link.innerText.trim();
                        if (!href || href === "#" || href.endsWith("notes.html")) return;

                        const unitMatch = /Unit\s*(\d+)/i.exec(text);
                        if (unitMatch) {
                            const unitNum = unitMatch[1];
                            const unitKey = `Unit ${unitNum}`;
                            if (!units[unitKey]) units[unitKey] = href;
                        }
                    });
                });

                // Fallback column-based
                if (Object.keys(units).length === 0) {
                    for (let i = 2; i < Math.min(tds.length, 8); i++) {
                        const link = tds[i].querySelector("a")?.getAttribute("href");
                        if (link && link !== "#" && !link.endsWith("notes.html")) {
                            units[`Unit ${i - 1}`] = link;
                        }
                    }
                }

                if (Object.keys(units).length > 0) {
                    subjects.push({ name: subjectName, units });
                }
            }
        });
        return subjects;
    }, []);

    // --- DATA FETCHING ---
    const fetchNotes = useCallback(async (deptCode) => {
        setUiStatus('loading');
        setError(null);

        const urlSegment = deptCode.toLowerCase() === "snh" ? "snh" : deptCode.toLowerCase();
        const targetUrl = `https://rmd.ac.in/dept/${urlSegment}/notes.html?t=${Date.now()}`;

        // Proxy logic for CORS & Expired SSL Bypassing
        const proxies = [
            async (u) => {
                const res = await fetch(`/api/proxy?url=${encodeURIComponent(u)}`);
                if (!res.ok) throw new Error("local proxy failed");
                return await res.text();
            },
            async (u) => {
                const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(u)}`);
                if (!res.ok) throw new Error("allorigins proxy failed");
                const data = await res.json();
                return data.contents;
            },
            async (u) => {
                const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`);
                if (!res.ok) throw new Error("codetabs proxy failed");
                return await res.text();
            }
        ];

        let html = null;
        for (const proxyFetch of proxies) {
            try {
                const result = await proxyFetch(targetUrl);
                if (result && result.length > 500) {
                    html = result;
                    break;
                }
            } catch (e) { console.warn("Proxy failed", e); }
        }

        if (!html) {
            setUiStatus('error');
            setError("Unable to connect to college server.");
            return;
        }

        try {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const semesters = [];

            if (urlSegment === "snh") {
                const tables = Array.from(doc.querySelectorAll("table"));
                let currentDept = "General";
                let currentSem = "";

                tables.forEach(table => {
                    const headers = Array.from(table.querySelectorAll("thead th"));
                    headers.forEach(h => {
                        const text = h.innerText.toUpperCase();
                        if (text.includes("DEPARTMENT")) currentDept = text.replace("DEPARTMENT OF", "").trim();
                        if (text.includes("SEMESTER")) currentSem = text.trim();
                    });

                    if (currentSem) {
                        const subs = parseTable(table);
                        if (subs.length > 0) {
                            const title = currentDept !== "General" ? `${currentDept} | ${currentSem}` : currentSem;
                            semesters.push({ title, subjects: subs });
                        }
                    }
                });
            } else {
                const tables = Array.from(doc.querySelectorAll("table"));
                tables.forEach(table => {
                    const title = table.querySelector("thead tr:first-child")?.innerText?.trim() || "Course Material";
                    if (title.toLowerCase().includes("semester") || urlSegment === "aiml") {
                        const subs = parseTable(table);
                        if (subs.length > 0) semesters.push({ title, subjects: subs });
                    }
                });
            }

            if (semesters.length === 0) throw new Error("No notes found for this section.");
            setCachedSemesters(semesters);
            setUiStatus('browser');
        } catch (e) {
            setUiStatus('error');
            setError(e.message);
        }
    }, [parseTable]);

    // --- NAVIGATION LOGIC ---
    const enterFolder = (name) => {
        saveScroll();
        const newPath = [...path, name];
        setPath(newPath);
        if (newPath.length === 1) {
            fetchNotes(name);
        }
    };

    const navigateUp = () => {
        saveScroll();
        if (path.length > 0) {
            const newPath = path.slice(0, -1);
            setPath(newPath);
            if (newPath.length === 0) {
                setUiStatus('empty');
                setCachedSemesters([]);
                setExpandedSubjects({});
            }
        }
    };

    // --- CONTENT RESOLUTION (The ViewModel Logic) ---
    const browserContent = useMemo(() => {
        if (path.length === 0) return { type: 'folders', items: rootDepts };
        if (uiStatus !== 'browser') return null;

        const rootDept = path[0];
        const isSNH = rootDept === "SNH";
        const depth = path.length;

        if (isSNH) {
            switch (depth) {
                case 1: { // SNH Root -> Show Group Depts
                    const groups = Array.from(new Set(cachedSemesters.map(s => {
                        const raw = s.title.split("|")[0].trim();
                        return mapDeptToAbbreviation(raw);
                    }))).sort();
                    return { type: 'folders', items: groups };
                }
                case 2: { // Inside SNH Dept -> Show Semesters
                    const targetDept = path[1];
                    const sems = Array.from(new Set(cachedSemesters.filter(s => {
                        const raw = s.title.split("|")[0].trim();
                        return mapDeptToAbbreviation(raw) === targetDept;
                    }).map(s => toTitleCase(s.title.split("|")[1]?.trim() || s.title)))).sort();
                    return { type: 'folders', items: sems };
                }
                case 3: { // Inside Semester -> Show Subjects
                    const targetDept = path[1];
                    const targetSem = path[2];
                    const match = cachedSemesters.find(s => {
                        const rawDept = s.title.split("|")[0].trim();
                        const rawSem = s.title.split("|")[1]?.trim() || "";
                        return mapDeptToAbbreviation(rawDept) === targetDept && toTitleCase(rawSem) === targetSem;
                    });
                    return match ? { type: 'files', items: match.subjects } : { type: 'empty' };
                }
                default: return { type: 'empty' };
            }
        } else {
            switch (depth) {
                case 1: { // Standard Dept -> Show Semesters
                    const sems = Array.from(new Set(cachedSemesters.map(s => toTitleCase(s.title))));
                    return { type: 'folders', items: sems };
                }
                case 2: { // Inside Semester -> Show Subjects
                    const targetSem = path[1];
                    const match = cachedSemesters.find(s => toTitleCase(s.title) === targetSem);
                    return match ? { type: 'files', items: match.subjects } : { type: 'empty' };
                }
                default: return { type: 'empty' };
            }
        }
    }, [path, uiStatus, cachedSemesters, mapDeptToAbbreviation, toTitleCase]);

    // --- UI RENDERERS ---
    if (notesMode === 'loading') {
        return (
            <div className="h2-view notes-container">
                 <div className="notes-viewport" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '60vh' }}>
                     <div className="spinner-mac big"></div>
                 </div>
            </div>
        );
    }

    if (notesMode === 'folder') {
        return (
            <div className="h2-view notes-container mode-folder">
                {(!isMobile || drivePath.length > 1) && (
                    <div className={`notes-header-stack ${drivePath.length > 1 ? 'has-path' : ''}`}>
                        {drivePath.length > 1 && (
                            <button className="back-circle-btn" onClick={() => { saveScroll(); setDrivePath(p => p.slice(0, -1)); }}>
                                <RiArrowLeftSLine />
                            </button>
                        )}
                        <div>
                            <h1 className="notes-title" style={{ fontSize: titleFontSize }}>{drivePath[drivePath.length - 1].name}</h1>
                        </div>
                    </div>
                )}

                <div 
                    ref={viewportRef}
                    key={drivePath.map(p=>p.id).join('-')} 
                    className={`notes-viewport ${driveAnimDirection === 'forward' ? 'notes-animate-forward' : 'notes-animate-backward'}`}
                >
                    <div className="folder-grid" style={{ marginBottom: '20px' }}>
                        {currentDriveFolders.map((folder, i) => (
                            <div key={i} className="folder-item-mac" onClick={() => { saveScroll(); setDrivePath(p => [...p, folder]); }}>
                                <div className="folder-icon-glow"><RiFolderFill /></div>
                                <div className="folder-info">
                                    <span className="folder-name">{folder.name}</span>
                                    <span className="folder-sub">Folder</span>
                                </div>
                                <RiArrowRightSLine className="folder-chevron" />
                            </div>
                        ))}
                    </div>
                    {currentFiles.length > 0 && (
                        <div className="files-stack" style={{ gap: '12px', display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                            {currentFiles.map((file, i) => (
                                <div key={i} className="folder-item-mac" onClick={() => window.open(file.link, '_blank')} style={{ cursor: 'pointer' }}>
                                    <div className="folder-icon-glow" style={{ background: 'var(--mac-bg-secondary)', color: 'var(--mac-text-secondary)' }}>
                                        <RiFileTextFill />
                                    </div>
                                    <div className="folder-info">
                                        <span className="folder-name">{file.name}</span>
                                        <span className="folder-sub">Document Link</span>
                                    </div>
                                    <RiExternalLinkLine className="folder-chevron" style={{ opacity: 0.5 }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {currentSubjects.length > 0 && (
                        <div className="files-stack">
                            {currentSubjects.map((sub, i) => {
                                const isExpanded = expandedSubjects[sub.id];
                                const units = sub.units || {};
                                // Parse keys to sort nicely: Unit 1, Unit 2
                                const sortedUnits = Object.entries(units).sort((a, b) => {
                                    const numA = parseInt(a[0].replace(/\D/g, '')) || 999;
                                    const numB = parseInt(b[0].replace(/\D/g, '')) || 999;
                                    return numA - numB;
                                });

                                return (
                                    <div key={i} className={`subject-accordion-card ${isExpanded ? 'active' : ''}`}>
                                        <div className="accordion-header-row" onClick={() => setExpandedSubjects(p => ({ ...p, [sub.id]: !p[sub.id] }))}>
                                            <div className="indicator-bar"></div>
                                            <span className="subject-title">{sub.name}</span>
                                            {isExpanded ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                                        </div>

                                        <div className={`accordion-collapse ${isExpanded ? 'open' : ''}`}>
                                            <div className="accordion-inner">
                                                <div className="accordion-content-area">
                                                    {sortedUnits.length > 0 ? (
                                                        <div className="units-grid">
                                                            {sortedUnits.map(([unitName, url], j) => {
                                                                const isAvailable = !!url;
                                                                return (
                                                                    <div
                                                                        key={j}
                                                                        className={`unit-status-chip ${isAvailable ? 'available' : 'locked'}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            if (isAvailable) window.open(url, "_blank");
                                                                            else setShowNotUploaded(true);
                                                                        }}
                                                                    >
                                                                        {isAvailable ? <RiFilePdfLine /> : <RiCloudOffLine />}
                                                                        <span className="unit-label">{unitName}</span>
                                                                        {isAvailable ? <RiExternalLinkLine className="open-icon" /> : <RiLockLine className="lock-icon" />}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '13px', color: 'var(--mac-text-secondary)' }}>No units added yet</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {currentDriveFolders.length === 0 && currentFiles.length === 0 && currentSubjects.length === 0 && (
                        <div className="centered-state">
                            <RiInformationLine className="centered-state-icon" />
                            <p className="centered-state-text">No items found in this directory.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h2-view notes-container mode-fetch">
            {/* Breadcrumb Header */}
            {(!isMobile || path.length > 0) && (
                <div className={`notes-header-stack ${path.length > 0 ? 'has-path' : ''}`}>
                    {path.length > 0 && (
                        <button className="back-circle-btn" onClick={navigateUp}>
                            <RiArrowLeftSLine />
                        </button>
                    )}
                    <div>
                        <h1 className="notes-title" style={{ fontSize: titleFontSize }}>
                            {path.length === 0 ? "Lecture Notes" : path[path.length - 1]}
                        </h1>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div 
                ref={viewportRef}
                key={path.join('-')} 
                className={`notes-viewport ${fetchAnimDirection === 'forward' ? 'notes-animate-forward-subtle' : 'notes-animate-backward-subtle'}`}
            >
                {uiStatus === 'loading' && (
                    <div className="centered-state">
                        <div className="spinner-mac big"></div>
                        <p>Syncing with RMD server...</p>
                    </div>
                )}

                {uiStatus === 'error' && (
                    <div className="error-card-glass">
                        <RiErrorWarningLine className="error-icon" />
                        <h3>Connection Failed</h3>
                        <p>{error}</p>
                        <button className="btn-primary" onClick={() => fetchNotes(path[0])}>Retry Connection</button>
                    </div>
                )}

                {(uiStatus === 'browser' || uiStatus === 'empty') && browserContent && (
                    <>
                        {browserContent.type === 'folders' && (
                            <div className="folder-grid">
                                {browserContent.items.map((name, i) => (
                                    <div key={i} className="folder-item-mac" onClick={() => enterFolder(name)}>
                                        <div className="folder-icon-glow">
                                            <RiFolderFill />
                                        </div>
                                        <div className="folder-info">
                                            <span className="folder-name">{name}</span>
                                            <span className="folder-sub">Folder</span>
                                        </div>
                                        <RiArrowRightSLine className="folder-chevron" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {browserContent.type === 'files' && (
                            <div className="files-stack">
                                {browserContent.items.map((sub, i) => {
                                    const isExpanded = expandedSubjects[sub.name];
                                    return (
                                        <div key={i} className={`subject-accordion-card ${isExpanded ? 'active' : ''}`}>
                                            <div className="accordion-header-row" onClick={() => setExpandedSubjects(p => ({ ...p, [sub.name]: !p[sub.name] }))}>
                                                <div className="indicator-bar"></div>
                                                <span className="subject-title">{sub.name}</span>
                                                {isExpanded ? <RiArrowUpSLine /> : <RiArrowDownSLine />}
                                            </div>

                                            <div className={`accordion-collapse ${isExpanded ? 'open' : ''}`}>
                                                <div className="accordion-inner">
                                                    <div className="accordion-content-area">
                                                        <div className="units-grid">
                                                            {[1, 2, 3, 4, 5].map(n => {
                                                                const key = `Unit ${n}`;
                                                                const url = sub.units[key] || sub.units[`unit ${n}`];
                                                                const isAvailable = !!url;
                                                                return (
                                                                    <div
                                                                        key={n}
                                                                        className={`unit-status-chip ${isAvailable ? 'available' : 'locked'}`}
                                                                        onClick={() => isAvailable ? window.open(url, "_blank") : setShowNotUploaded(true)}
                                                                    >
                                                                        {isAvailable ? <RiFilePdfLine /> : <RiCloudOffLine />}
                                                                        <span className="unit-label">{key}</span>
                                                                        {isAvailable ? <RiExternalLinkLine className="open-icon" /> : <RiLockLine className="lock-icon" />}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {browserContent.type === 'empty' && (
                            <div className="centered-state">
                                <RiInformationLine className="centered-state-icon" />
                                <p className="centered-state-text">No course material available in this directory.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* PARITY: NOT UPLOADED MODAL */}
            {showNotUploaded && (
                <div className="nm-modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="nm-modal-content" style={{ maxWidth: '320px', textAlign: 'center' }}>
                        <div className="nm-modal-header" style={{ justifyContent: 'center', border: 'none' }}>
                            <RiErrorWarningLine style={{ fontSize: '32px', color: 'var(--mac-blue)', marginBottom: '10px' }} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>Not Available</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '14px', opacity: 0.7 }}>
                            This material hasn't been uploaded to the college server yet.
                        </p>
                        <button 
                            className="btn-primary" 
                            style={{ width: '100%' }}
                            onClick={() => setShowNotUploaded(false)}
                        >
                            Understood
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notes;

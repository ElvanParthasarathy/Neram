import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import "../App.css";
import "../styles/home.css";

import "../styles/notes-desktop.css";

/**
 * Notes Component - Android Parity Version
 * 
 * Features:
 * - Stack-based navigation (Breadcrumbs/Path)
 * - Depth-aware data processing (Root -> Dept -> Semester -> Subjects)
 * - SNH Special Logic (Inferred Grouping)
 * - Sequoia Pro UI (Folders, Accordions, Unit Chips)
 */

const ROOT_DEPTS = ["ECE", "AIML", "CSBS", "CSE", "IT", "SNH"];

const Notes = () => {
    // --- STATE ---
    const [path, setPath] = useState([]); // Stack: ["CSE", "Semester 3"]
    const [cachedSemesters, setCachedSemesters] = useState([]); // Raw data from RMD
    const [uiStatus, setUiStatus] = useState('empty'); // 'empty', 'loading', 'browser', 'error'
    const [error, setError] = useState(null);
    const [expandedSubjects, setExpandedSubjects] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // --- RESPONSIVE ---
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

        // Proxy logic for CORS
        const proxies = [
            (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
            (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`
        ];

        let html = null;
        for (const proxy of proxies) {
            try {
                const res = await fetch(proxy(targetUrl));
                if (res.ok) {
                    html = await res.text();
                    if (html && html.length > 500) break;
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
        const newPath = [...path, name];
        setPath(newPath);
        if (newPath.length === 1) {
            fetchNotes(name);
        }
    };

    const selectDeptFromSidebar = (dept) => {
        if (path[0] === dept) return; // Already here
        setPath([dept]);
        fetchNotes(dept);
        setExpandedSubjects({});
    };

    const navigateUp = () => {
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
        if (path.length === 0) return { type: 'folders', items: ROOT_DEPTS };
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
    return (
        <div className="h2-view notes-container">
            <div className="notes-split-container">

                {/* Master: Sidebar Departments */}
                <div className="notes-sidebar-pane">
                    <h3 style={{ fontSize: '12px', fontWeight: 700, opacity: 0.5, textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '16px' }}>Departments</h3>
                    {ROOT_DEPTS.map(dept => {
                        const isActive = path[0] === dept;
                        return (
                            <div
                                key={dept}
                                className={`notes-sidebar-item ${isActive ? 'active' : ''}`}
                                onClick={() => selectDeptFromSidebar(dept)}
                            >
                                <div className="sidebar-icon-glow">
                                    <RiFolderFill />
                                </div>
                                <span>{dept}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Detail: Dynamic Content area */}
                <div className="notes-content-pane">

                    {/* Breadcrumb / Title area within Content Pane */}
                    <div className={`notes-header-stack ${path.length > 1 ? 'has-path' : ''}`}>
                        {path.length > 1 && (
                            <button className="back-circle-btn" onClick={navigateUp}>
                                <RiArrowLeftSLine />
                            </button>
                        )}
                        <div>
                            <h1 className="notes-title">
                                {path.length === 0 ? "Select Department" : path[path.length - 1]}
                            </h1>
                            {path.length > 1 && (
                                <div className="notes-breadcrumb-sub">
                                    {path.slice(0, -1).join(" / ")}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Viewport content */}
                    <div className="notes-viewport">
                        {uiStatus === 'empty' && (
                            <div className="centered-state">
                                <RiFolderOpenLine className="centered-state-icon" style={{ fontSize: '64px' }} />
                                <p style={{ fontSize: '18px', opacity: 0.5 }}>Choose a department on the left to start browsing.</p>
                            </div>
                        )}

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

                        {uiStatus === 'browser' && browserContent && (
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

                                                    {isExpanded && (
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
                                                                            onClick={() => isAvailable ? window.open(url, "_blank") : null}
                                                                        >
                                                                            {isAvailable ? <RiFilePdfLine /> : <RiCloudOffLine />}
                                                                            <span className="unit-label">{key}</span>
                                                                            {isAvailable ? <RiExternalLinkLine className="open-icon" /> : <RiLockLine className="lock-icon" />}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
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
                </div>
            </div>
        </div>
    );
};

export default Notes;

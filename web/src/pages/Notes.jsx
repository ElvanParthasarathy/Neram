import React, { useState, useEffect, useCallback } from "react";
import "../App.css";

const departments = [
    { id: "cse", name: "CSE" },
    { id: "it", name: "IT" },
    { id: "ece", name: "ECE" },

    { id: "aiml", name: "AIML" },
    { id: "csbs", name: "CSBS" },
    { id: "snh", name: "First Year / SNH" },
];


// --- MOBILE ICONS ---
const IconFolder = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.31 2.31a.75.75 0 0 0 .53.22h6.44a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
    </svg>
);

const IconChevronRight = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clipRule="evenodd" />
    </svg>
);

const IconArrowLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
);

const IconChevronDown = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clipRule="evenodd" />
    </svg>
);

const IconFileText = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
    </svg>
);

const IconOpen = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M15.75 2.25H21a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V4.81L8.03 17.03a.75.75 0 0 1-1.06-1.06L19.19 3.75h-3.44a.75.75 0 0 1 0-1.5Zm-10.5 4.5a1.5 1.5 0 0 0-1.5 1.5v10.5a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V10.5a.75.75 0 0 1 1.5 0v8.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V8.25a3 3 0 0 1 3-3h8.25a.75.75 0 0 1 0 1.5H5.25Z" clipRule="evenodd" />
    </svg>
);


const Notes = () => {
    const [selectedDept, setSelectedDept] = useState("cse");
    const [notesData, setNotesData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- MOBILE STATE ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileStep, setMobileStep] = useState('departments'); // 'departments' | 'notes'
    const [expandedSubjects, setExpandedSubjects] = useState({}); // { "Sem 1-Subject A": true }

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- PARSING LOGIC (Ported from Kotlin) ---
    // --- PARSING LOGIC (Ported from Kotlin - Robust Regex Version) ---
    // --- PARSING LOGIC (Ported from Kotlin - Robust Hybrid Version) ---
    const parseTable = (table, isSNH = false, deptFilter = "") => {
        const subjects = [];
        const rows = Array.from(table.querySelectorAll("tbody tr"));
        const headers = Array.from(table.querySelectorAll("thead th"));

        // 1. Column Mapping Strategy (Header-Based)
        // map: { "Unit 1": 2, "Unit 2": 3, ... }
        const colMap = {};

        if (headers.length > 0) {
            headers.forEach((th, index) => {
                const text = th.innerText.toLowerCase().trim();
                const match = /unit\s*(\d+)|([ivx]+)/i.exec(text);
                if (match) {
                    // Try to convert Roman numerals if present (simple case)
                    let num = match[1];
                    if (!num && match[2]) {
                        const roman = match[2].toLowerCase();
                        if (roman === 'i') num = 1;
                        if (roman === 'ii') num = 2;
                        if (roman === 'iii') num = 3;
                        if (roman === 'iv') num = 4;
                        if (roman === 'v') num = 5;
                    }
                    if (num) colMap[`Unit ${num}`] = index;
                }
            });
        }

        // Fallback: If no headers found or map is empty, assume standard layout
        // Standard: Col 0=S.No, Col 1=Code, Col 2=Title, Col 3=Unit 1... OR
        // Standard: Col 0=Code, Col 1=Title, Col 2=Unit 1...
        // We will detect "Unit 1" column dynamically in rows if headers failed
        let fallbackUnit1Index = -1;

        rows.forEach((row) => {
            const tds = Array.from(row.querySelectorAll("td"));
            if (tds.length < 2) return;

            // Subject Name Detection (Longest text that isn't a link/unit)
            // Or typically 2nd or 3rd column
            let subjectName = "";
            let subjectIdx = -1;

            // Strategy: Find class with text, not centered/digit
            const candidates = [tds[1], tds[2], tds[0]].filter(Boolean);
            for (const td of candidates) {
                const text = td.innerText.trim();
                // Exclude mostly digits (Subject Code) or short S.No
                if (text.length > 3 && !/^\d+$/.test(text) && !/^\w+\d+$/.test(text)) {
                    subjectName = text;
                    subjectIdx = tds.indexOf(td);
                    break;
                }
            }
            // Fallback to Col 1 if detection failed
            if (!subjectName) subjectName = tds[1]?.innerText?.trim() || tds[0]?.innerText?.trim();


            if (subjectName) {
                const units = {};

                // 2. Extract Links
                // Use Map if available
                if (Object.keys(colMap).length > 0) {
                    Object.entries(colMap).forEach(([unitKey, colIdx]) => {
                        const td = tds[colIdx];
                        if (td) {
                            const links = Array.from(td.querySelectorAll("a"));
                            // Prioritize Drive/Docs links
                            const driveLink = links.find(l => /drive|docs\.google/i.test(l.href));
                            const validLink = driveLink || links.find(l => l.href && l.href !== "#" && !l.href.endsWith("notes.html"));

                            if (validLink) {
                                units[unitKey] = validLink.getAttribute("href");
                            }
                        }
                    });
                } else {
                    // Adaptive Scan without headers
                    if (fallbackUnit1Index === -1) {
                        // Try to find first "Unit" link in this row
                        for (let i = 0; i < tds.length; i++) {
                            if (i === subjectIdx) continue; // Skip subject col
                            const txt = tds[i].innerText.toLowerCase();
                            if (txt.includes("unit 1") || txt.includes("i")) {
                                // Check if it HAS a link
                                if (tds[i].querySelector("a")) {
                                    fallbackUnit1Index = i;
                                    break;
                                }
                            }
                        }
                        // If still -1, default to subjectIdx + 1 or +2
                        if (fallbackUnit1Index === -1 && subjectIdx !== -1) fallbackUnit1Index = subjectIdx + 1;
                        if (fallbackUnit1Index === -1) fallbackUnit1Index = 2; // Hard default
                    }

                    // Scan from calculated start
                    for (let i = 0; i < 5; i++) {
                        const colIdx = fallbackUnit1Index + i;
                        if (colIdx < tds.length) {
                            const td = tds[colIdx];
                            const links = Array.from(td.querySelectorAll("a"));
                            const unitKey = `Unit ${i + 1}`;

                            const driveLink = links.find(l => /drive|docs\.google/i.test(l.href));
                            const validLink = driveLink || links.find(l => l.href && l.href !== "#" && !l.href.endsWith("notes.html"));

                            if (validLink) {
                                units[unitKey] = validLink.getAttribute("href");
                            }
                        }
                    }
                }

                if (Object.keys(units).length > 0) {
                    subjects.push({ name: subjectName, units });
                }
            }
        });
        return subjects;
    };

    const fetchNotes = useCallback(async (deptCode) => {
        setLoading(true);
        setError(null);
        setNotesData([]);

        const cacheKey = `notes_cache_${deptCode}`; // We still use session cache for the session, but can force refresh
        // Note: You might want to allow a "Force Refresh" button to clear this and re-fetch.
        // For now, we'll respect the session cache to save bandwidth, but the INITIAL fetch 
        // in a new session will always be fresh due to the timestamp below.

        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            setNotesData(JSON.parse(cached));
            setLoading(false);
            return;
        }

        const targetUrl = `https://rmd.ac.in/dept/${deptCode}/notes.html?t=${Date.now()}`;

        // List of proxies to try in order
        const proxyGenerators = [
            (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
            (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
        ];

        let html = null;
        let lastError = null;

        // Try proxies sequentially
        for (const generateProxyUrl of proxyGenerators) {
            try {
                const proxyUrl = generateProxyUrl(targetUrl);
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
                html = await response.text();
                if (html && html.length > 100) break; // Success!
            } catch (err) {
                console.warn(`Proxy failed: ${err.message}`);
                lastError = err;
            }
        }

        try {
            if (!html) throw new Error("Unable to fetch notes. Please check your connection.");

            const doc = new DOMParser().parseFromString(html, "text/html");
            const tables = doc.querySelectorAll("table");
            const results = [];

            if (deptCode === "snh") {
                const tempSemesters = {};
                tables.forEach(table => {
                    let currentDept = "General";
                    let currentSem = "";
                    const headers = table.querySelectorAll("thead th");
                    headers.forEach(th => {
                        const text = th.innerText.toUpperCase();
                        if (text.includes("DEPARTMENT")) currentDept = text.replace("DEPARTMENT OF", "").trim();
                        if (text.includes("SEMESTER")) currentSem = text.trim();
                    });

                    if (currentSem) {
                        const subjects = parseTable(table, true);
                        if (subjects.length > 0) {
                            const key = currentDept !== "General" ? `${currentDept} | ${currentSem}` : currentSem;
                            if (!tempSemesters[key]) tempSemesters[key] = [];
                            tempSemesters[key].push(...subjects);
                        }
                    }
                });
                Object.keys(tempSemesters).sort().forEach(key => results.push({ title: key, subjects: tempSemesters[key] }));
            } else {
                tables.forEach(table => {
                    const thead = table.querySelector("thead tr:first-child");
                    let title = thead?.innerText?.trim() || "Course Material";
                    title = title.replace(/\s+/g, ' ');
                    if (title.toUpperCase().includes("SEMESTER") || deptCode === "aiml") {
                        const subjects = parseTable(table);
                        if (subjects.length > 0) results.push({ title, subjects });
                    }
                });
            }

            if (results.length === 0) throw new Error("No notes found");

            setNotesData(results);
            sessionStorage.setItem(cacheKey, JSON.stringify(results));

        } catch (err) {
            console.error(err);
            setError(err.message || lastError?.message || "Failed to load notes");
        } finally {
            setLoading(false);
        }
    }, []);

    // Desktop: Fetch on Dept Switch
    useEffect(() => {
        if (!isMobile) {
            fetchNotes(selectedDept);
        }
    }, [selectedDept, fetchNotes, isMobile]);


    // Mobile: Handle Dept Click
    const handleMobileDeptClick = (deptId) => {
        setSelectedDept(deptId);
        setMobileStep('notes');
        fetchNotes(deptId);
    };

    // Mobile: Handle Back Click
    const handleMobileBack = () => {
        setMobileStep('departments');
        setNotesData([]); // Clear to avoid showing stale data briefly
    };

    // Mobile: Toggle Accordion
    const toggleAccordion = (key) => {
        setExpandedSubjects(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };


    return (
        <div className="home-view" style={{ paddingBottom: '40px', ...(isMobile ? { padding: '0 var(--screen-edge-spacing)', marginTop: 0 } : {}) }}>

            <header className="page-header" style={{ display: isMobile ? 'none' : 'block' }}>
                <div className="header-main">
                    <h1 className="page-title">Lecture Notes</h1>
                    <span className="admin-status-badge">Student Access</span>
                </div>
            </header>

            {/* --- DESKTOP VIEW --- */}
            {!isMobile && (
                <>
                    {/* Dept Selector - Glass Card */}
                    <section className="notes-dept-section" style={{ marginBottom: '24px' }}>
                        <h3 className="section-title">Select Department</h3>
                        <div className="dept-selector-scroll">
                            {departments.map((dept) => (
                                <button
                                    key={dept.id}
                                    className={`dept-pill-modern ${selectedDept === dept.id ? "active" : ""}`}
                                    onClick={() => setSelectedDept(dept.id)}
                                >
                                    {dept.name}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Content Area */}
                    <div className="notes-content-area">
                        {loading && (
                            <div className="loading-state-glass">
                                <div className="spinner-mac"></div>
                                <p>Fetching notes from RMD...</p>
                            </div>
                        )}

                        {error && (
                            <div className="error-state-glass">
                                <i className="ri-error-warning-line"></i>
                                <p>{error}</p>
                                <button className="retry-btn-mac" onClick={() => fetchNotes(selectedDept)}>Retry</button>
                            </div>
                        )}

                        {!loading && !error && notesData.map((sem, index) => (
                            <section key={index} className="semester-block-glass">
                                <div className="semester-header">
                                    <h2 className="semester-title-mac">{sem.title}</h2>
                                </div>

                                <div className="subjects-grid-mac">
                                    {sem.subjects.map((sub, sIndex) => (
                                        <div key={sIndex} className="subject-card-mac">
                                            <h3 className="subject-name-mac">{sub.name}</h3>
                                            <div className="units-list-mac">
                                                {[1, 2, 3, 4, 5].map((unitNum) => {
                                                    const unitKey = `Unit ${unitNum}`;
                                                    const link = sub.units[unitKey] || sub.units[`unit ${unitNum}`] || sub.units[`Unit ${unitNum} `];
                                                    const isAvailable = !!link;

                                                    if (isAvailable) {
                                                        return (
                                                            <a
                                                                key={unitKey}
                                                                href={link}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="unit-chip"
                                                            >
                                                                <i className="ri-file-pdf-line"></i>
                                                                {unitKey}
                                                            </a>
                                                        );
                                                    } else {
                                                        return (
                                                            <div
                                                                key={unitKey}
                                                                className="unit-chip disabled"
                                                                style={{
                                                                    opacity: 0.5,
                                                                    cursor: 'not-allowed',
                                                                    background: 'rgba(0,0,0,0.05)',
                                                                    border: '1px solid transparent'
                                                                }}
                                                                onClick={() => alert(`${unitKey} is not uploaded yet.`)}
                                                            >
                                                                <i className="ri-lock-line"></i>
                                                                {unitKey}
                                                            </div>
                                                        );
                                                    }
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}

                        {!loading && !error && notesData.length === 0 && (
                            <div className="empty-state-glass">No notes found for this department.</div>
                        )}
                    </div>
                </>
            )}

            {/* --- MOBILE VIEW --- */}
            {isMobile && (
                <>
                    {/* STEP 1: Department List (Folders) */}
                    {mobileStep === 'departments' && (
                        <div className="folder-list-container">
                            <div className="mobile-notes-header" style={{ marginBottom: '16px' }}>
                                <h1 className="page-title" style={{ fontSize: '28px' }}>Notes</h1>
                            </div>

                            {departments.map((dept) => (
                                <div
                                    key={dept.id}
                                    className="folder-item"
                                    onClick={() => handleMobileDeptClick(dept.id)}
                                >
                                    <div className="folder-item-icon">
                                        <IconFolder />
                                    </div>
                                    <span className="folder-item-text">{dept.name}</span>
                                    <div className="folder-item-arrow">
                                        <IconChevronRight />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* STEP 2: Subject List (Accordions) */}
                    {mobileStep === 'notes' && (
                        <div className="mobile-details-container">

                            <div className="mobile-notes-header">
                                <button className="mobile-back-btn" onClick={handleMobileBack}>
                                    <IconArrowLeft /> Back
                                </button>
                                <h2 style={{ fontSize: '18px', fontWeight: 600, marginLeft: 'auto', marginRight: 'auto', color: 'var(--mac-text)' }}>
                                    {departments.find(d => d.id === selectedDept)?.name}
                                </h2>
                                <div style={{ width: '40px' }}></div> {/* Spacer for center alignment */}
                            </div>

                            {loading && (
                                <div className="loading-state-glass" style={{ background: 'transparent', border: 'none', padding: '40px 0' }}>
                                    <div className="spinner-mac"></div>
                                </div>
                            )}

                            {error && (
                                <div className="error-state-glass" style={{ padding: '40px 16px', textAlign: 'center' }}>
                                    <p>{error}</p>
                                    <button className="retry-btn-mac" onClick={() => fetchNotes(selectedDept)}>Retry</button>
                                </div>
                            )}

                            {!loading && !error && notesData.map((sem, sIndex) => (
                                <div key={sIndex} style={{ marginBottom: '24px' }}>
                                    <h3
                                        style={{
                                            fontSize: '13px',
                                            textTransform: 'uppercase',
                                            color: 'var(--mac-text-secondary)',
                                            fontWeight: 600,
                                            marginBottom: '10px',
                                            paddingLeft: '4px',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        {sem.title}
                                    </h3>

                                    {sem.subjects.map((sub, subIndex) => {
                                        const uniqueKey = `${sIndex}-${subIndex}`;
                                        const isExpanded = expandedSubjects[uniqueKey];

                                        return (
                                            <div key={uniqueKey} className={`subject-accordion ${isExpanded ? 'expanded' : ''}`}>
                                                <div
                                                    className="subject-accordion-header"
                                                    onClick={() => toggleAccordion(uniqueKey)}
                                                >
                                                    <div className="accordion-indicator-bar"></div>
                                                    <span className="accordion-title">{sub.name}</span>
                                                    <div className="accordion-toggle-icon">
                                                        <IconChevronDown />
                                                    </div>
                                                </div>

                                                <div className="subject-accordion-content">
                                                    {[1, 2, 3, 4, 5].map((unitNum) => {
                                                        const unitKey = `Unit ${unitNum}`;
                                                        // Case-insensitive check or direct access
                                                        const link = sub.units[unitKey] || sub.units[`unit ${unitNum}`] || sub.units[`Unit ${unitNum} `];
                                                        const isAvailable = !!link;

                                                        return (
                                                            <div
                                                                key={unitKey}
                                                                onClick={() => {
                                                                    if (isAvailable) window.open(link, "_blank");
                                                                    else alert(`${unitKey} is not uploaded yet.`);
                                                                }}
                                                                className={`unit-item-mobile ${!isAvailable ? 'disabled-unit' : ''}`}
                                                                style={{
                                                                    opacity: isAvailable ? 1 : 0.6,
                                                                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                                                                    backgroundColor: isAvailable ? 'var(--bg-secondary)' : 'transparent'
                                                                }}
                                                            >
                                                                <div className="unit-icon" style={{ color: isAvailable ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                                                                    {isAvailable ? <IconFileText /> : (
                                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <span className="unit-name" style={{ color: isAvailable ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                                    {unitKey}
                                                                </span>
                                                                <div className="unit-open-icon" style={{ color: isAvailable ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                                                                    {isAvailable ? <IconOpen /> : null}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {!loading && !error && notesData.length === 0 && (
                                <div className="empty-state-glass" style={{ background: 'transparent', border: 'none' }}>
                                    No notes found.
                                </div>
                            )}

                        </div>
                    )}
                </>
            )}

        </div>
    );
};

export default Notes;


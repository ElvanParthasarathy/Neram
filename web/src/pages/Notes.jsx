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
    const parseTable = (table, isSNH = false, deptFilter = "") => {
        const subjects = [];
        const rows = table.querySelectorAll("tbody tr");

        rows.forEach((row) => {
            const tds = row.querySelectorAll("td");
            if (tds.length < 4) return;

            let subjectName = tds[1]?.innerText?.trim();
            if (!subjectName && tds.length > 0) subjectName = tds[0]?.innerText?.trim();

            if (subjectName) {
                const units = {};
                for (let i = 3; i <= 7; i++) {
                    if (tds[i]) {
                        const link = tds[i].querySelector("a");
                        const href = link?.getAttribute("href");
                        if (href && href !== "" && href !== "#") {
                            units[`Unit ${i - 2}`] = href;
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

        const cacheKey = `notes_cache_${deptCode}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            setNotesData(JSON.parse(cached));
            setLoading(false);
            return;
        }

        try {
            const PROXY = "https://api.allorigins.win/raw?url=";
            const URL = `https://rmd.ac.in/dept/${deptCode}/notes.html`;

            const response = await fetch(PROXY + encodeURIComponent(URL));
            if (!response.ok) throw new Error("Failed to fetch notes");

            const html = await response.text();
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
            setError(err.message);
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
        <div className="home-view" style={{ paddingBottom: '40px', ...(isMobile ? { padding: '0 16px', marginTop: 0 } : {}) }}>

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
                                                {Object.entries(sub.units).map(([unitName, link]) => (
                                                    <a
                                                        key={unitName}
                                                        href={link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="unit-chip"
                                                    >
                                                        <i className="ri-file-pdf-line"></i>
                                                        {unitName}
                                                    </a>
                                                ))}
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
                                                    {Object.entries(sub.units).map(([unitName, link]) => (
                                                        <a
                                                            key={unitName}
                                                            href={link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="unit-item-mobile"
                                                        >
                                                            <div className="unit-icon">
                                                                <IconFileText />
                                                            </div>
                                                            <span className="unit-name">{unitName}</span>
                                                            <div className="unit-open-icon">
                                                                <IconOpen />
                                                            </div>
                                                        </a>
                                                    ))}
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


import React, { useState, useEffect } from 'react';
import { db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { getHardcodedRole } from '../../data/admins';
import {
    RiUser3Fill, RiLayoutGridLine, RiArrowDownSLine
} from 'react-icons/ri';

// IMPORT HOME & DATA HOOK
import Home from '../Home';
import { useSectionData } from '../../hooks/useSectionData';

const AdminDashboard = ({ user, userProfile }) => {
    // --- 1. ROLE & PROFILE LOGIC ---
    const emailRole = user?.email ? getHardcodedRole(user.email) : null;
    const finalRole = emailRole || userProfile?.role || 'student';
    const isSuper = finalRole === 'super_admin';
    const isFaculty = finalRole === 'faculty';
    const isRep = finalRole === 'rep';

    // --- 2. STATE ---
    const [hierarchy, setHierarchy] = useState({});
    const [loading, setLoading] = useState(true);

    const [selectedBatch, setSelectedBatch] = useState("");
    const [selectedDept, setSelectedDept] = useState("");
    const [selectedSec, setSelectedSec] = useState("");

    // --- 3. LOAD DATA & INITIALIZE ---
    useEffect(() => {
        const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => {
            const data = snap.val() || {};
            setHierarchy(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // --- 4. CONTEXT RESTORATION & DEFAULTING ---
    useEffect(() => {
        if (loading) return;

        // Try to load saved context
        const savedContext = JSON.parse(localStorage.getItem('admin_dashboard_context') || '{}');

        if (isRep) {
            setSelectedBatch(userProfile?.batch || "");
            setSelectedDept(userProfile?.department || "");
            setSelectedSec(userProfile?.section || "");
        }
        else if (isFaculty) {
            // Fixed Batch/Dept
            const fixedBatch = userProfile?.batch || savedContext.batch || "";
            const fixedDept = userProfile?.department || savedContext.dept || "";
            setSelectedBatch(fixedBatch);
            setSelectedDept(fixedDept);

            // Section is selectable, try saved, else default
            if (savedContext.sec) setSelectedSec(savedContext.sec);
        }
        else {
            // Super Admin - Full restoration
            if (savedContext.batch) setSelectedBatch(savedContext.batch);
            if (savedContext.dept) setSelectedDept(savedContext.dept);
            if (savedContext.sec) setSelectedSec(savedContext.sec);
        }

    }, [loading, isRep, isFaculty, userProfile]);

    // --- 5. PERSISTENCE ---
    useEffect(() => {
        if (selectedBatch || selectedDept || selectedSec) {
            localStorage.setItem('admin_dashboard_context', JSON.stringify({
                batch: selectedBatch,
                dept: selectedDept,
                sec: selectedSec
            }));
        }
    }, [selectedBatch, selectedDept, selectedSec]);

    // --- 6. DATA FETCHING FOR HOME COMPONENT ---
    // Construct the active profile object based on selection
    const activeProfile = React.useMemo(() => ({
        batch: selectedBatch,
        department: selectedDept,
        section: selectedSec
    }), [selectedBatch, selectedDept, selectedSec]);

    // Fetch data using the hook (same as AdminHomeWrapper)
    const globalData = useSectionData(activeProfile);


    // --- HELPER: Get Dropdown Options ---
    const getBatches = () => Object.keys(hierarchy).sort().reverse();
    const getDepts = () => selectedBatch ? Object.keys(hierarchy[selectedBatch] || {}).filter(k => k !== 'initialized') : [];
    const getSections = () => (selectedBatch && selectedDept) ? (hierarchy[selectedBatch]?.[selectedDept] || []) : [];

    // --- PRESENTATION ---
    const firstName = userProfile?.firstName || (user?.displayName || "").split(' ')[0] || "User";
    const photoURL = user?.photoURL || userProfile?.photoURL;

    return (
        <div className="admin-dashboard-container animate-fade-in" style={{ padding: '20px', maxWidth: '100%' }}>
            {/* WELCOME SECTION - COMPACT */}
            <div className="welcome-card glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
                <div className="profile-section-large" style={{ gap: '15px' }}>
                    <div className="user-avatar-large" style={{ width: '50px', height: '50px', fontSize: '24px' }}>
                        {photoURL ? <img src={photoURL} alt="Profile" /> : <RiUser3Fill />}
                    </div>
                    <div className="welcome-text">
                        <h1 style={{ fontSize: '20px' }}>Vanakkam, <span className="highlight-name">{firstName}</span></h1>
                        <p style={{ fontSize: '13px' }}>Admin Dashboard</p>
                    </div>
                </div>
            </div>

            {/* CONTEXT SWITCHER BAR */}
            {!isRep && (
                <div className="dashboard-context-bar glass-panel" style={{ padding: '15px', marginBottom: '20px' }}>
                    <h3 className="context-label" style={{ marginBottom: '10px' }}><RiLayoutGridLine /> View Context</h3>

                    <div className="context-selectors">
                        {/* BATCH SELECTOR */}
                        <div className="context-input-group">
                            <label>Batch</label>
                            {isSuper ? (
                                <div className="custom-select-wrapper">
                                    <select value={selectedBatch} onChange={e => { setSelectedBatch(e.target.value); setSelectedDept(""); setSelectedSec(""); }}>
                                        <option value="">Select Batch</option>
                                        {getBatches().map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <RiArrowDownSLine className="select-icon" />
                                </div>
                            ) : (
                                <div className="fixed-value">{selectedBatch || "N/A"}</div>
                            )}
                        </div>

                        {/* DEPT SELECTOR */}
                        <div className="context-input-group">
                            <label>Department</label>
                            {isSuper ? (
                                <div className="custom-select-wrapper">
                                    <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setSelectedSec(""); }} disabled={!selectedBatch}>
                                        <option value="">Select Dept</option>
                                        {getDepts().map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    <RiArrowDownSLine className="select-icon" />
                                </div>
                            ) : (
                                <div className="fixed-value">{selectedDept || "N/A"}</div>
                            )}
                        </div>

                        {/* SECTION SELECTOR (Available to Super & Faculty) */}
                        <div className="context-input-group">
                            <label>Section</label>
                            <div className="custom-select-wrapper">
                                <select value={selectedSec} onChange={e => setSelectedSec(e.target.value)} disabled={!selectedDept}>
                                    <option value="">Select Section</option>
                                    {getSections().map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <RiArrowDownSLine className="select-icon" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RENDER STUDENT HOME COMPONENT */}
            <div className="admin-home-preview" style={{ position: 'relative', zIndex: 1 }}>
                {selectedBatch && selectedDept && selectedSec ? (
                    <Home
                        isAdmin={true}
                        globalData={globalData}
                        userProfile={userProfile} /* The ADMIN'S real profile */
                        activeProfile={activeProfile} /* The STUDENT view profile (selected context) */
                    />
                ) : (
                    <div className="empty-state-message" style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.5)', borderRadius: '16px' }}>
                        <h3>Please select a Batch, Department, and Section to view the dashboard.</h3>
                    </div>
                )}
            </div>

            <style>{`
                .admin-dashboard-container { max-width: 1400px; margin: 0 auto; }
                .welcome-card { display: flex; align-items: center; border-radius: 20px; background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%); border: 1px solid rgba(255,255,255,0.3); }
                .profile-section-large { display: flex; align-items: center; }
                .user-avatar-large { background: rgba(0,0,0,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #666; overflow: hidden; }
                .user-avatar-large img { width: 100%; height: 100%; object-fit: cover; }
                .welcome-text h1 { margin: 0; font-weight: 700; color: #1d1d1f; }
                .welcome-text p { margin: 2px 0 0; color: #666; }
                .highlight-name { background: linear-gradient(90deg, #007AFF, #5856D6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                
                .dashboard-context-bar { border-radius: 16px; background: rgba(255,255,255,0.5); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); }
                .context-label { font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #86868b; display: flex; align-items: center; gap: 8px; }
                .context-selectors { display: flex; gap: 20px; flex-wrap: wrap; }
                .context-input-group { flex: 1; min-width: 200px; }
                .context-input-group label { display: block; font-size: 12px; font-weight: 600; color: #1d1d1f; margin-bottom: 6px; }
                
                .custom-select-wrapper { position: relative; }
                .custom-select-wrapper select { width: 100%; padding: 10px 14px; font-size: 14px; border-radius: 10px; border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.8); appearance: none; cursor: pointer; color: #1d1d1f; font-weight: 500; transition: all 0.2s; }
                .custom-select-wrapper select:hover { background: #fff; border-color: rgba(0,0,0,0.2); }
                .custom-select-wrapper select:focus { outline: none; border-color: #007AFF; box-shadow: 0 0 0 3px rgba(0,122,255,0.1); }
                .select-icon { position: absolute; right: 12px; top: 12px; pointer-events: none; color: #666; }
                .fixed-value { padding: 10px 14px; background: rgba(0,0,0,0.03); border-radius: 10px; color: #666; font-weight: 500; border: 1px solid transparent; }
            `}</style>
        </div>
    );
};

export default AdminDashboard;

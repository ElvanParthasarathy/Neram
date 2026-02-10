import React, { useState, useEffect } from 'react';
import { auth, db } from "../../firebase";
import { ref, update, onValue } from "firebase/database";
import { updateProfile } from "firebase/auth";
import {
    RiUserLine, RiPhoneLine, RiCake2Line, RiGenderlessLine,
    RiEditLine, RiShieldKeyholeLine, RiBuilding4Line, RiRefreshLine,
    RiLock2Line
} from 'react-icons/ri';

const AdminProfile = () => {
    const user = auth.currentUser;
    const [editing, setEditing] = useState({});
    const [hierarchy, setHierarchy] = useState({});

    // State for Name Separation
    const [nameData, setNameData] = useState({ first: '', last: '' });

    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        firstName: '',
        lastName: '',
        gender: '',
        mobile: '',
        birthday: '',
        photoURL: user?.photoURL || '',
        role: '',
        department: '',
        adminLevel: ''
    });

    const [originalData, setOriginalData] = useState({});

    // Load User Profile Data
    useEffect(() => {
        if (!user) return;

        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setFormData(prev => ({ ...prev, ...data }));
                setOriginalData(data);
            }
        });

        // Load Hierarchy for Dropdowns
        const hierarchyRef = ref(db, 'academic_hierarchy');
        onValue(hierarchyRef, (snap) => {
            if (snap.exists()) setHierarchy(snap.val());
        });
    }, [user]);

    // --- AUTO-EDIT IF MISSING DATA ---
    useEffect(() => {
        if (!formData.role) return;

        if (formData.role === 'faculty' && !formData.department && !editing.department) {
            setEditing(prev => ({ ...prev, department: true }));
        }

        if (formData.role === 'rep' && (!formData.batch || !formData.section) && !editing.class) {
            setEditing(prev => ({ ...prev, class: true }));
        }
    }, [formData, editing]);

    // --- SMART TOGGLE EDIT ---
    const toggleEdit = (field) => {
        if (field === 'name') {
            if (formData.firstName || formData.lastName) {
                setNameData({
                    first: formData.firstName || "",
                    last: formData.lastName || ""
                });
            } else {
                const full = formData.displayName || "";
                const lastSpaceIndex = full.lastIndexOf(" ");
                if (lastSpaceIndex === -1) {
                    setNameData({ first: full, last: "" });
                } else {
                    setNameData({
                        first: full.substring(0, lastSpaceIndex),
                        last: full.substring(lastSpaceIndex + 1)
                    });
                }
            }
        }
        setEditing(prev => ({ ...prev, [field]: true }));
    };

    const cancelEdit = (field) => {
        setFormData(prev => ({ ...prev, [field]: originalData[field] || '' }));
        setEditing(prev => ({ ...prev, [field]: false }));
    };

    // --- SMART SAVE HANDLER ---
    const handleSave = async (field) => {
        try {
            let updateObj = {};

            if (field === 'name') {
                const full = `${nameData.first} ${nameData.last}`.trim();
                await updateProfile(user, { displayName: full });
                updateObj = {
                    displayName: full,
                    firstName: nameData.first,
                    lastName: nameData.last
                };
            }
            else if (field === 'department') {
                if (!formData.department) return alert("Select a department");
                updateObj = { department: formData.department };
            }
            else if (field === 'class') {
                // For Reps, 'class' means batch + section update
                if (!formData.batch || !formData.section) return alert("Select Batch and Section");
                updateObj = {
                    batch: formData.batch,
                    department: formData.department, // Ensure dept matches batch if needed, or keep existing
                    section: formData.section
                };
            }
            else {
                updateObj = { [field]: formData[field] };
            }

            await update(ref(db, `users/${user.uid}`), updateObj);
            setEditing(prev => ({ ...prev, [field]: false }));
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="settings-section-content" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>

            {/* HEADER */}
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Admin Profile</h2>
                <p style={{ color: '#888' }}>Manage your administrative identity</p>
            </div>

            {/* PHOTO SYNC SECTION */}
            <div className="profile-photo-row">
                <img src={formData.photoURL || "/default-avatar.png"} alt="Profile" className="settings-avatar" />
                <button className="sync-btn" onClick={async () => {
                    const googleData = user.providerData.find(p => p.providerId === 'google.com');
                    if (googleData?.photoURL) {
                        await update(ref(db, `users/${user.uid}`), { photoURL: googleData.photoURL });
                        alert("Photo Synced!");
                    }
                }}>
                    <RiRefreshLine /> Sync Photo
                </button>
            </div>

            {/* NAME EDIT SECTION */}
            <div className="settings-row">
                <label><RiUserLine /> NAME</label>
                {!editing.name ? (
                    <div className="input-group">
                        <span className="display-text">{formData.displayName || "Not Set"}</span>
                        <button className="edit-icon-btn" onClick={() => toggleEdit('name')}><RiEditLine /></button>
                    </div>
                ) : (
                    <div className="edit-mode-group">
                        <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '10px' }}>
                            <input type="text" value={nameData.first} onChange={e => setNameData({ ...nameData, first: e.target.value })} placeholder="First Name" className="settings-input" style={{ flex: 1 }} />
                            <input type="text" value={nameData.last} onChange={e => setNameData({ ...nameData, last: e.target.value })} placeholder="Last Name" className="settings-input" style={{ flex: 1 }} />
                        </div>
                        <div className="action-btns">
                            <button className="save-btn" onClick={() => handleSave('name')}>Save</button>
                            <button className="cancel-btn" onClick={() => cancelEdit('name')}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ROLE DISPLAY (READ ONLY) */}
            <div className="settings-row">
                <label><RiShieldKeyholeLine /> PRIVILEGE LEVEL</label>
                <div className="input-group">
                    <span className="display-text" style={{ color: '#34c759', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {formData.role || "Unassigned"}
                    </span>
                </div>
            </div>

            {/* ASSIGNED DEPARTMENT (SHOW IF FACULTY OR REP) */}
            {['faculty'].includes(formData.role) && (
                <div className="settings-row animate-fade-in">
                    <label><RiBuilding4Line /> ASSIGNED DEPARTMENT</label>
                    {!editing.department ? (
                        <div className="input-group">
                            <span className="display-text">
                                {formData.department || "Pending Assignment"}
                            </span>
                            <button className="edit-icon-btn" onClick={() => toggleEdit('department')}><RiEditLine /></button>
                        </div>
                    ) : (
                        <div className="edit-mode-group">
                            <select
                                value={formData.department}
                                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                class="settings-input"
                            >
                                <option value="">Select Department</option>
                                {Array.from(new Set(
                                    Object.values(hierarchy).flatMap(b => Object.keys(b || {}))
                                )).filter(d => d !== 'initialized').sort().map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                            <div className="action-btns">
                                <button className="save-btn" onClick={() => handleSave('department')}>Save</button>
                                <button className="cancel-btn" onClick={() => cancelEdit('department')}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ASSIGNED CLASS (SHOW IF REP) */}
            {formData.role === 'rep' && (
                <div className="settings-row animate-fade-in">
                    <label><RiBuilding4Line /> ASSIGNED CLASS</label>
                    {!editing.class ? (
                        <div className="input-group">
                            <span className="display-text">
                                {formData.batch} - {formData.section}
                            </span>
                            <button className="edit-icon-btn" onClick={() => toggleEdit('class')}><RiEditLine /></button>
                        </div>
                    ) : (
                        <div className="edit-mode-group">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                {/* BATCH */}
                                <select
                                    value={formData.batch}
                                    onChange={(e) => setFormData({ ...formData, batch: e.target.value, section: "" })}
                                    className="settings-input"
                                >
                                    <option value="">Select Batch</option>
                                    {Object.keys(hierarchy).sort().reverse().map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>

                                {/* DEPT (If Batch Selected) */}
                                {formData.batch && (
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value, section: "" })}
                                        className="settings-input"
                                    >
                                        <option value="">Select Dept</option>
                                        {Object.keys(hierarchy[formData.batch] || {})
                                            .filter(k => k !== 'initialized')
                                            .map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                )}

                                {/* SECTION (If Dept Selected) */}
                                {formData.department && (
                                    <select
                                        value={formData.section}
                                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                        className="settings-input"
                                    >
                                        <option value="">Select Section</option>
                                        {hierarchy[formData.batch]?.[formData.department]?.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="action-btns" style={{ marginTop: '10px' }}>
                                <button className="save-btn" onClick={() => handleSave('class')}>Save</button>
                                <button className="cancel-btn" onClick={() => cancelEdit('class')}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SUPER ADMIN NOTICE */}
            {formData.role === 'super_admin' && (
                <div className="settings-row animate-fade-in">
                    <label><RiBuilding4Line /> ACCESS SCOPE</label>
                    <div className="input-group locked-input">
                        <span className="display-text" style={{ color: '#555' }}>
                            Full System Access (All Departments)
                        </span>
                        <RiLock2Line style={{ color: '#999' }} />
                    </div>
                </div>
            )}

            {/* MOBILE NUMBER SECTION */}
            <div className="settings-row">
                <label><RiPhoneLine /> MOBILE</label>
                {!editing.mobile ? (
                    <div className="input-group">
                        <span className="display-text">
                            {formData.mobile ? `+91 ${formData.mobile.replace(/^91/, '').replace(/\s/g, '')}` : "Add Mobile"}
                        </span>
                        <button className="edit-icon-btn" onClick={() => toggleEdit('mobile')}><RiEditLine /></button>
                    </div>
                ) : (
                    <div className="edit-mode-group">
                        <input type="tel" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} placeholder="10-digit mobile" className="settings-input" />
                        <div className="action-btns">
                            <button className="save-btn" onClick={() => handleSave('mobile')}>Save</button>
                            <button className="cancel-btn" onClick={() => cancelEdit('mobile')}>Cancel</button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminProfile;

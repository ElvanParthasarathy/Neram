import React, { useState, useEffect } from 'react';
import { auth, db } from "../../firebase";
import { ref, update, onValue } from "firebase/database";
import { updateProfile } from "firebase/auth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatDateDDMMYYYY, handleAutoSlash, parseDMYToISO } from "../../utils/timeUtils";
import HybridDateInput from '../../components/HybridDateInput';
import {
    RiUser3Line, RiBuilding4Line, RiShieldKeyholeLine, RiRefreshLine,
    RiArrowDownSLine, RiCalendarLine
} from 'react-icons/ri';

import { SubHeader, ProfileSection, ProfileField } from '../settings/SettingsShared';

const AdminProfile = ({ onBack }) => {
    const user = auth.currentUser;
    const [editing, setEditing] = useState({});
    const [hierarchy, setHierarchy] = useState({});
    const [isMobile, setIsMobile] = useState(false);

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
    const [snackbar, setSnackbar] = useState(null);

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

    // Detect mobile for hybrid date picker
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia("(max-width: 768px)").matches);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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

    const showSnack = (msg) => {
        setSnackbar(msg);
        setTimeout(() => setSnackbar(null), 3000);
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
            showSnack("Saved successfully");
        } catch (err) {
            alert(err.message);
        }
    };

    const syncGooglePhoto = async () => {
        const googleData = user.providerData.find(p => p.providerId === 'google.com');
        if (googleData?.photoURL) {
            await update(ref(db, `users/${user.uid}`), { photoURL: googleData.photoURL });
            showSnack("Photo Synced!");
        } else {
            showSnack("No Google photo found");
        }
    };

    return (
        <div className="s2-page-view-inner"> {/* Wrapper to match student view context if needed, or just fragment */}
            <SubHeader title="Admin Profile" onBack={onBack} />

            {/* Profile Header Card */}
            <div className="s2-prof-header">
                <div className="s2-prof-avatar">
                    {formData.photoURL ? (
                        <img src={formData.photoURL} alt="Profile" />
                    ) : (
                        <span className="s2-prof-avatar-letter">
                            {(formData.displayName || "A").charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="s2-prof-name">{formData.displayName || "Administrator"}</div>
                <div className="s2-prof-email">{user?.email}</div>
                <button className="s2-prof-sync-btn" onClick={syncGooglePhoto}>
                    <RiRefreshLine size={16} />
                    Sync Google Photo
                </button>
            </div>

            {/* Personal Information */}
            <ProfileSection title="Personal Information" icon={<RiUser3Line size={20} />}>
                {/* NAME */}
                <ProfileField
                    label="Full Name" value={formData.displayName}
                    isEditing={editing.name}
                    onEdit={() => toggleEdit('name')}
                    onCancel={() => cancelEdit('name')}
                    onSave={() => handleSave('name')}
                >
                    <div className="s2-prof-edit-fields">
                        <div className="s2-complaint-field">
                            <div className="s2-complaint-label">First Name</div>
                            <input className="s2-complaint-input" value={nameData.first} onChange={e => setNameData({ ...nameData, first: e.target.value })} placeholder="First Name" />
                        </div>
                        <div className="s2-complaint-field">
                            <div className="s2-complaint-label">Last Name</div>
                            <input className="s2-complaint-input" value={nameData.last} onChange={e => setNameData({ ...nameData, last: e.target.value })} placeholder="Last Name" />
                        </div>
                    </div>
                </ProfileField>

                <div className="s2-prof-divider" />

                {/* MOBILE */}
                <ProfileField
                    label="Mobile" value={formData.mobile ? `+91 ${formData.mobile.replace(/^91/, '').replace(/\s/g, '')}` : null}
                    isEditing={editing.mobile}
                    onEdit={() => toggleEdit('mobile')}
                    onCancel={() => cancelEdit('mobile')}
                    onSave={() => handleSave('mobile')}
                >
                    <div className="s2-complaint-field">
                        <div className="s2-complaint-label">Mobile Number</div>
                        <div style={{ position: "relative" }}>
                            <span className="s2-prof-prefix">+91</span>
                            <input className="s2-complaint-input s2-prof-phone-input" value={formData.mobile}
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                placeholder="10-digit number" type="tel" />
                        </div>
                    </div>
                </ProfileField>

                <div className="s2-prof-divider" />

                {/* DOB */}
                <ProfileField
                    label="Date of Birth" value={formData.birthday || null}
                    isEditing={editing.birthday}
                    onEdit={() => toggleEdit('birthday')}
                    onCancel={() => cancelEdit('birthday')}
                    onSave={() => handleSave('birthday')}
                >
                    <div className="s2-complaint-field">
                        <div className="s2-complaint-label">Date of Birth</div>
                        <div className="s2-date-input-wrap">
                            <HybridDateInput
                                value={formData.birthday}
                                onChange={(val) => setFormData({ ...formData, birthday: val })}
                                inputClass="s2-complaint-input"
                            />
                        </div>
                    </div>
                </ProfileField>

                <div className="s2-prof-divider" />

                {/* GENDER */}
                <ProfileField
                    label="Gender" value={formData.gender || null}
                    isEditing={editing.gender}
                    onEdit={() => toggleEdit('gender')}
                    onCancel={() => cancelEdit('gender')}
                    onSave={() => handleSave('gender')}
                >
                    <div className="s2-complaint-field">
                        <div className="s2-complaint-label">Gender</div>
                        <div className="s2-date-input-wrap">
                            <select className="s2-complaint-input s2-select-input"
                                value={formData.gender || ""}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <RiArrowDownSLine className="s2-date-icon" />
                        </div>
                    </div>
                </ProfileField>
            </ProfileSection>

            {/* Admin Details */}
            {(formData.department || formData.batch || formData.role === 'super_admin' || formData.role === 'faculty') && (
                <ProfileSection title="Administrative Details" icon={<RiShieldKeyholeLine size={20} />}>

                    {/* ROLE */}
                    <div className="s2-prof-field">
                        <div className="s2-prof-field-display">
                            <div>
                                <div className="s2-prof-field-label">Privilege Level</div>
                                <div className="s2-prof-field-value" style={{ textTransform: 'uppercase', color: 'var(--mac-traffic-green)', fontWeight: '600' }}>
                                    {formData.role || "Unassigned"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="s2-prof-divider" />

                    {/* ASSIGNED DEPARTMENT (FACULTY) */}
                    {['faculty'].includes(formData.role) && (
                        <ProfileField
                            label="Assigned Department" value={formData.department}
                            isEditing={editing.department}
                            onEdit={() => toggleEdit('department')}
                            onCancel={() => cancelEdit('department')}
                            onSave={() => handleSave('department')}
                        >
                            <div className="s2-complaint-field">
                                <div className="s2-complaint-label">Department</div>
                                <div className="s2-date-input-wrap">
                                    <select className="s2-complaint-input s2-select-input"
                                        value={formData.department || ""}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    >
                                        <option value="">Select Department</option>
                                        {Array.from(new Set(
                                            Object.values(hierarchy).flatMap(b => Object.keys(b || {}))
                                        )).filter(d => d !== 'initialized').sort().map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <RiArrowDownSLine className="s2-date-icon" />
                                </div>
                            </div>
                        </ProfileField>
                    )}

                    {/* ASSIGNED CLASS (REP) */}
                    {formData.role === 'rep' && (
                        <ProfileField
                            label="Assigned Class" value={formData.batch ? `${formData.batch} - ${formData.section}` : null}
                            isEditing={editing.class}
                            onEdit={() => toggleEdit('class')}
                            onCancel={() => cancelEdit('class')}
                            onSave={() => handleSave('class')}
                        >
                            <div className="s2-prof-edit-fields">
                                <div className="s2-complaint-field">
                                    <div className="s2-complaint-label">Batch</div>
                                    <div className="s2-date-input-wrap">
                                        <select className="s2-complaint-input s2-select-input"
                                            value={formData.batch || ""}
                                            onChange={(e) => setFormData({ ...formData, batch: e.target.value, section: "" })}
                                        >
                                            <option value="">Select Batch</option>
                                            {Object.keys(hierarchy).sort().reverse().map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                        <RiArrowDownSLine className="s2-date-icon" />
                                    </div>
                                </div>

                                {formData.batch && (
                                    <div className="s2-complaint-field">
                                        <div className="s2-complaint-label">Department</div>
                                        <div className="s2-date-input-wrap">
                                            <select className="s2-complaint-input s2-select-input"
                                                value={formData.department || ""}
                                                onChange={(e) => setFormData({ ...formData, department: e.target.value, section: "" })}
                                            >
                                                <option value="">Select Dept</option>
                                                {Object.keys(hierarchy[formData.batch] || {})
                                                    .filter(k => k !== 'initialized')
                                                    .map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <RiArrowDownSLine className="s2-date-icon" />
                                        </div>
                                    </div>
                                )}

                                {formData.department && (
                                    <div className="s2-complaint-field">
                                        <div className="s2-complaint-label">Section</div>
                                        <div className="s2-date-input-wrap">
                                            <select className="s2-complaint-input s2-select-input"
                                                value={formData.section || ""}
                                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                            >
                                                <option value="">Select Section</option>
                                                {hierarchy[formData.batch]?.[formData.department]?.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <RiArrowDownSLine className="s2-date-icon" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ProfileField>
                    )}

                    {/* SUPER ADMIN SCOPE */}
                    {formData.role === 'super_admin' && (
                        <div className="s2-prof-field">
                            <div className="s2-prof-field-display">
                                <div>
                                    <div className="s2-prof-field-label">Access Scope</div>
                                    <div className="s2-prof-field-value">Full System Access (All Departments)</div>
                                </div>
                                <RiShieldKeyholeLine style={{ color: 'var(--mac-text-secondary)', opacity: 0.5 }} size={18} />
                            </div>
                        </div>
                    )}

                </ProfileSection>
            )}

            {/* Snackbar */}
            {snackbar && (
                <div className="s2-prof-snackbar">{snackbar}</div>
            )}
        </div>
    );
};
export default AdminProfile;

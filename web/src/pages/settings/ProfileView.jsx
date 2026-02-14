import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { ref, onValue, update } from "firebase/database";
import {
    RiUser3Line,
    RiRefreshLine,
    RiEditLine,
    RiArrowRightSLine,
    RiArrowDownSLine,
    RiGraduationCapLine,
    RiCalendarLine,
} from "react-icons/ri";
import { SubHeader } from "./SettingsShared";

// Profile sub-components
const ProfileSection = ({ title, icon, children }) => (
    <div className="s2-prof-section">
        <div className="s2-prof-section-header">
            <div className="s2-prof-section-icon">{icon}</div>
            <span className="s2-prof-section-title">{title}</span>
        </div>
        {children}
    </div>
);

const ProfileField = ({ label, value, isEditing, onEdit, onCancel, onSave, children }) => (
    <div className="s2-prof-field">
        {!isEditing ? (
            <div className="s2-prof-field-display">
                <div>
                    <div className="s2-prof-field-label">{label}</div>
                    <div className={`s2-prof-field-value ${!value ? 'empty' : ''}`}>{value || "Not set"}</div>
                </div>
                <button className="s2-prof-edit-btn" onClick={onEdit}>
                    <RiEditLine size={18} />
                </button>
            </div>
        ) : (
            <div className="s2-prof-field-editing">
                {children}
                <div className="s2-prof-field-actions">
                    <button className="s2-prof-cancel-btn" onClick={onCancel}>Cancel</button>
                    <button className="s2-prof-save-btn" onClick={onSave}>Save</button>
                </div>
            </div>
        )}
    </div>
);

const ProfileView = ({ userProfile, onBack }) => {
    const user = auth.currentUser;
    const [formData, setFormData] = useState({});
    const [editingField, setEditingField] = useState(null);
    const [hierarchy, setHierarchy] = useState({});
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");
    const [snackbar, setSnackbar] = useState(null);


    // Load user data + hierarchy
    useEffect(() => {
        if (!user?.uid) return;
        const userRef = ref(db, `users/${user.uid}`);
        const unsub = onValue(userRef, (snap) => {
            if (snap.exists()) setFormData(snap.val());
        });
        const hRef = ref(db, "academic_hierarchy");
        const unsub2 = onValue(hRef, (snap) => {
            if (snap.exists()) setHierarchy(snap.val());
        });
        return () => { unsub(); unsub2(); };
    }, [user?.uid]);

    const getBatches = () => hierarchy ? Object.keys(hierarchy).sort() : [];
    const getDepartments = (batch) => (hierarchy && hierarchy[batch]) ? Object.keys(hierarchy[batch]).filter(d => d !== 'initialized').sort() : [];
    const getSections = (batch, dept) => (hierarchy && hierarchy[batch] && hierarchy[batch][dept]) ? Object.values(hierarchy[batch][dept]).sort() : [];

    const handleSave = (field, overrideValue) => {
        if (!user?.uid) return;
        let updates = {};
        if (field === "name") {
            updates = { displayName: `${firstName} ${lastName}`.trim(), firstName, lastName };
        } else if (field === "academic") {
            updates = { batch: formData.batch || "", department: formData.department || "", section: formData.section || "" };
        } else {
            updates = { [field]: overrideValue !== undefined ? overrideValue : (formData[field] || "") };
        }
        update(ref(db, `users/${user.uid}`), updates);
        setEditingField(null);
        showSnack("Saved successfully");
    };

    const showSnack = (msg) => {
        setSnackbar(msg);
        setTimeout(() => setSnackbar(null), 3000);
    };

    const syncGooglePhoto = () => {
        const googleProvider = user?.providerData?.find(p => p.providerId === "google.com");
        if (googleProvider?.photoURL) {
            update(ref(db, `users/${user.uid}`), { photoURL: googleProvider.photoURL });
            showSnack("Photo synced successfully");
        } else {
            showSnack(googleProvider ? "No photo found in Google account" : "No Google account linked");
        }
    };



    const photoUrl = formData.photoURL;
    const displayName = formData.displayName || user?.displayName || "Your Name";
    const emailAddr = user?.email || "";

    return (
        <>
            <SubHeader title="Profile" onBack={onBack} />

            {/* Profile Header Card */}
            <div className="s2-prof-header">
                <div className="s2-prof-avatar">
                    {photoUrl ? (
                        <img src={photoUrl} alt="Profile" />
                    ) : (
                        <span className="s2-prof-avatar-letter">
                            {(displayName || "U").charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="s2-prof-name">{displayName}</div>
                <div className="s2-prof-email">{emailAddr}</div>
                <button className="s2-prof-sync-btn" onClick={syncGooglePhoto}>
                    <RiRefreshLine size={16} />
                    Sync Google Photo
                </button>
            </div>

            {/* Personal Information */}
            <ProfileSection title="Personal Information" icon={<RiUser3Line size={20} />}>
                <ProfileField
                    label="Full Name" value={formData.displayName}
                    isEditing={editingField === "name"}
                    onEdit={() => {
                        if (formData.firstName !== undefined || formData.lastName !== undefined) {
                            setFirstName(formData.firstName || "");
                            setLastName(formData.lastName || "");
                        } else {
                            const full = formData.displayName || "";
                            const idx = full.lastIndexOf(" ");
                            setFirstName(idx === -1 ? full : full.substring(0, idx));
                            setLastName(idx === -1 ? "" : full.substring(idx + 1));
                        }
                        setEditingField("name");
                    }}
                    onCancel={() => setEditingField(null)}
                    onSave={() => handleSave("name")}
                >
                    <div className="s2-prof-edit-fields">
                        <div className="s2-complaint-field">
                            <div className="s2-complaint-label">First Name</div>
                            <input className="s2-complaint-input" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Enter first name" />
                        </div>
                        <div className="s2-complaint-field">
                            <div className="s2-complaint-label">Last Name</div>
                            <input className="s2-complaint-input" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Enter last name" />
                        </div>
                    </div>
                </ProfileField>

                <div className="s2-prof-divider" />

                <ProfileField
                    label="Mobile" value={formData.mobile ? `+91 ${formData.mobile}` : null}
                    isEditing={editingField === "mobile"}
                    onEdit={() => { setMobileNumber(formData.mobile || ""); setEditingField("mobile"); }}
                    onCancel={() => setEditingField(null)}
                    onSave={() => handleSave("mobile", mobileNumber)}
                >
                    <div className="s2-complaint-field">
                        <div className="s2-complaint-label">Mobile Number</div>
                        <div style={{ position: "relative" }}>
                            <span className="s2-prof-prefix">+91</span>
                            <input className="s2-complaint-input s2-prof-phone-input" value={mobileNumber}
                                onChange={e => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="10-digit number" type="tel" />
                        </div>
                    </div>
                </ProfileField>

                <div className="s2-prof-divider" />

                <ProfileField
                    label="Date of Birth" value={formData.birthday || null}
                    isEditing={editingField === "birthday"}
                    onEdit={() => setEditingField("birthday")}
                    onCancel={() => setEditingField(null)}
                    onSave={() => handleSave("birthday")}
                >
                    <div className="s2-complaint-field">
                        <div className="s2-complaint-label">Date of Birth</div>
                        <div className="s2-date-input-wrap">
                            <input className="s2-complaint-input s2-date-input" type="date"
                                value={formData.birthday || ""}
                                onChange={e => setFormData(d => ({ ...d, birthday: e.target.value }))} />
                            <RiCalendarLine className="s2-date-icon" />
                        </div>
                    </div>
                </ProfileField>

                <div className="s2-prof-divider" />

                <ProfileField
                    label="Gender" value={formData.gender || null}
                    isEditing={editingField === "gender"}
                    onEdit={() => setEditingField("gender")}
                    onCancel={() => setEditingField(null)}
                    onSave={() => handleSave("gender")}
                >
                    <div className="s2-complaint-field">
                        <div className="s2-complaint-label">Gender</div>
                        <div className="s2-date-input-wrap">
                            <select className="s2-complaint-input s2-select-input"
                                value={formData.gender || ""}
                                onChange={(e) => setFormData(d => ({ ...d, gender: e.target.value }))}
                            >
                                <option value="" disabled>Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                            <RiArrowDownSLine className="s2-date-icon" />
                        </div>
                    </div>
                </ProfileField>
            </ProfileSection>

            {/* Academic Details */}
            <ProfileSection title="Academic Details" icon={<RiGraduationCapLine size={20} />}>
                <ProfileField
                    label="Batch, Department & Section"
                    value={[formData.batch, formData.department, formData.section].filter(Boolean).join(" • ") || null}
                    isEditing={editingField === "academic"}
                    onEdit={() => setEditingField("academic")}
                    onCancel={() => setEditingField(null)}
                    onSave={() => handleSave("academic")}
                >
                    <div className="s2-prof-edit-fields">
                        <div className="s2-complaint-field">
                            <div className="s2-complaint-label">Batch</div>
                            <div className="s2-date-input-wrap">
                                <select className="s2-complaint-input s2-select-input"
                                    value={formData.batch || ""}
                                    onChange={(e) => setFormData(d => ({ ...d, batch: e.target.value, department: "", section: "" }))}
                                >
                                    <option value="" disabled>Select Batch</option>
                                    {getBatches().map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <RiArrowDownSLine className="s2-date-icon" />
                            </div>
                        </div>
                        <div className="s2-complaint-field">
                            <div className="s2-complaint-label">Department</div>
                            <div className="s2-date-input-wrap">
                                <select className="s2-complaint-input s2-select-input"
                                    disabled={!formData.batch}
                                    value={formData.department || ""}
                                    onChange={(e) => setFormData(d => ({ ...d, department: e.target.value, section: "" }))}
                                >
                                    <option value="" disabled>Select Department</option>
                                    {getDepartments(formData.batch).map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                </select>
                                <RiArrowDownSLine className="s2-date-icon" />
                            </div>
                        </div>
                        <div className="s2-complaint-field">
                            <div className="s2-complaint-label">Section</div>
                            <div className="s2-date-input-wrap">
                                <select className="s2-complaint-input s2-select-input"
                                    disabled={!formData.department}
                                    value={formData.section || ""}
                                    onChange={(e) => setFormData(d => ({ ...d, section: e.target.value }))}
                                >
                                    <option value="" disabled>Select Section</option>
                                    {getSections(formData.batch, formData.department).map(sec => <option key={sec} value={sec}>{sec}</option>)}
                                </select>
                                <RiArrowDownSLine className="s2-date-icon" />
                            </div>
                        </div>
                    </div>
                </ProfileField>

                <div className="s2-prof-divider" />

                <ProfileField
                    label="Register Number" value={formData.registerNo || null}
                    isEditing={editingField === "registerNo"}
                    onEdit={() => setEditingField("registerNo")}
                    onCancel={() => setEditingField(null)}
                    onSave={() => handleSave("registerNo")}
                >
                    <div className="s2-complaint-field">
                        <div className="s2-complaint-label">Register Number</div>
                        <input className="s2-complaint-input" value={formData.registerNo || ""}
                            onChange={e => setFormData(d => ({ ...d, registerNo: e.target.value }))}
                            placeholder="Enter register number" />
                    </div>
                </ProfileField>
            </ProfileSection>





            {/* Snackbar */}
            {snackbar && (
                <div className="s2-prof-snackbar">{snackbar}</div>
            )}
        </>
    );
};

export default ProfileView;

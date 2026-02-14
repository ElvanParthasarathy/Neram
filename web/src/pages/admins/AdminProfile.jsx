import React, { useState, useEffect } from 'react';
import { auth, db } from "../../firebase";
import { ref, update, onValue } from "firebase/database";
import { updateProfile } from "firebase/auth";
import {
    RiUserLine, RiPhoneLine, RiCake2Line, RiGenderlessLine,
    RiEditLine, RiShieldKeyholeLine, RiBuilding4Line, RiRefreshLine,
    RiLock2Line
} from 'react-icons/ri';

import { SubHeader } from '../settings/SettingsShared';

const AdminProfile = ({ onBack }) => {
    // ... (existing hooks)

    return (
        <div className="settings-section-content">
            <SubHeader title="Admin Profile" onBack={onBack} />

            {/* PROFILE HEADER CARD */}

            {/* PROFILE HEADER CARD */}
            <div className="settings-group-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '40px' }}>
                <div style={{ position: 'relative' }}>
                    <img src={formData.photoURL || "/default-avatar.png"} alt="Profile" className="settings-avatar" style={{ width: '100px', height: '100px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                </div>
                <div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800' }}>{formData.displayName || "Administrator"}</h3>
                    <p style={{ margin: '0 0 16px 0', color: 'var(--mac-text-secondary)', fontSize: '14px' }}>{user?.email}</p>
                    <button className="sync-btn" onClick={async () => {
                        const googleData = user.providerData.find(p => p.providerId === 'google.com');
                        if (googleData?.photoURL) {
                            await update(ref(db, `users/${user.uid}`), { photoURL: googleData.photoURL });
                            alert("Photo Synced!");
                        }
                    }}>
                        <RiRefreshLine /> Sync Google Photo
                    </button>
                </div>
            </div>

            {/* IDENTITY CARD */}
            <div className="settings-group-card">
                <div className="settings-row">
                    <label><RiUserLine /> NAME</label>
                    {!editing.name ? (
                        <div className="input-group">
                            <span className="display-text">{formData.displayName || "Not Set"}</span>
                            <button className="edit-icon-btn" onClick={() => toggleEdit('name')}><RiEditLine /> Edit</button>
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

                <div className="settings-row">
                    <label><RiShieldKeyholeLine /> PRIVILEGE LEVEL</label>
                    <div className="input-group">
                        <span className="display-text" style={{ color: 'var(--mac-traffic-green)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {formData.role || "Unassigned"}
                        </span>
                    </div>
                </div>
            </div>

            {/* SYSTEM ACCESS & SCOPE CARD */}
            {(formData.department || formData.batch || formData.role === 'super_admin') && (
                <div className="settings-group-card">
                    {/* ASSIGNED DEPARTMENT (SHOW IF FACULTY OR REP) */}
                    {['faculty'].includes(formData.role) && (
                        <div className="settings-row animate-fade-in">
                            <label><RiBuilding4Line /> ASSIGNED DEPARTMENT</label>
                            {!editing.department ? (
                                <div className="input-group">
                                    <span className="display-text">
                                        {formData.department || "Pending Assignment"}
                                    </span>
                                    <button className="edit-icon-btn" onClick={() => toggleEdit('department')}><RiEditLine /> Edit</button>
                                </div>
                            ) : (
                                <div className="edit-mode-group">
                                    <select
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="settings-input"
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
                                    <button className="edit-icon-btn" onClick={() => toggleEdit('class')}><RiEditLine /> Edit</button>
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
                            <div className="input-group">
                                <span className="display-text" style={{ color: 'var(--mac-text-secondary)' }}>
                                    Full System Access (All Departments)
                                </span>
                                <RiLock2Line style={{ color: 'var(--mac-text-secondary)', opacity: 0.5 }} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PERSONAL DETAILS CARD */}
            <div className="settings-group-card">
                {/* GENDER */}
                <div className="settings-row">
                    <label><RiGenderlessLine /> GENDER</label>
                    {!editing.gender ? (
                        <div className="input-group">
                            <span className="display-text">{formData.gender || "Set Gender"}</span>
                            <button className="edit-icon-btn" onClick={() => toggleEdit('gender')}><RiEditLine /> Edit</button>
                        </div>
                    ) : (
                        <div className="edit-mode-group">
                            <div className="role-pill-switcher" style={{ width: 'fit-content' }}>
                                {['Male', 'Female', 'Other'].map(g => (
                                    <button
                                        key={g}
                                        className={`role-pill ${formData.gender === g ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, gender: g })}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                            <div className="action-btns" style={{ marginTop: '10px' }}>
                                <button className="save-btn" onClick={() => handleSave('gender')}>Save</button>
                                <button className="cancel-btn" onClick={() => cancelEdit('gender')}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* BIRTHDAY */}
                <div className="settings-row">
                    <label><RiCake2Line /> DATE OF BIRTH</label>
                    {!editing.birthday ? (
                        <div className="input-group">
                            <span className="display-text">{formData.birthday || "Set Birthday"}</span>
                            <button className="edit-icon-btn" onClick={() => toggleEdit('birthday')}><RiEditLine /> Edit</button>
                        </div>
                    ) : (
                        <div className="edit-mode-group">
                            <input
                                type="date"
                                value={formData.birthday}
                                onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                                className="settings-input"
                            />
                            <div className="action-btns">
                                <button className="save-btn" onClick={() => handleSave('birthday')}>Save</button>
                                <button className="cancel-btn" onClick={() => cancelEdit('birthday')}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* MOBILE */}
                <div className="settings-row">
                    <label><RiPhoneLine /> CONTACT NUMBER</label>
                    {!editing.mobile ? (
                        <div className="input-group">
                            <span className="display-text">
                                {formData.mobile ? `+91 ${formData.mobile.replace(/^91/, '').replace(/\s/g, '')}` : "Add Mobile"}
                            </span>
                            <button className="edit-icon-btn" onClick={() => toggleEdit('mobile')}><RiEditLine /> Edit</button>
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

        </div>
    );
};

export default AdminProfile;

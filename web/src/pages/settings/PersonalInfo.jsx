import React, { useState, useEffect } from 'react';
import { auth, db } from "../../firebase";
import { ref, update, onValue } from "firebase/database";
import { updateProfile } from "firebase/auth";
import {
  RiUserLine, RiPhoneLine, RiCake2Line, RiGenderlessLine,
  RiEditLine, RiLinkedinBoxFill, RiGithubFill, RiHashtag,
  RiBuilding4Line, RiRefreshLine
} from 'react-icons/ri';

const PersonalInfo = () => {
  const user = auth.currentUser;
  const [editing, setEditing] = useState({});
  const [hierarchy, setHierarchy] = useState({});

  // State for Name Separation
  const [nameData, setNameData] = useState({ first: '', last: '' });

  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    firstName: '', // Explicit field
    lastName: '',  // Explicit field
    gender: '',
    mobile: '',
    birthday: '',
    photoURL: user?.photoURL || '',
    registerNo: '',
    department: '',
    batch: '',
    section: '',
    linkedin: '',
    github: ''
  });

  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (!user) return;

    // Load Academic Hierarchy
    onValue(ref(db, 'academic_hierarchy'), (snap) => {
      if (snap.exists()) setHierarchy(snap.val());
    });

    // Load User Profile Data
    const userRef = ref(db, `users/${user.uid}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setFormData(prev => ({ ...prev, ...data }));
        setOriginalData(data);
      }
    });
  }, [user]);

  // --- SMART TOGGLE EDIT ---
  const toggleEdit = (field) => {
    if (field === 'name') {
      // 1. Check if we already have separated fields in DB
      if (formData.firstName || formData.lastName) {
        setNameData({
          first: formData.firstName || "",
          last: formData.lastName || ""
        });
      } else {
        // 2. Fallback: Use "Last Space" logic if fields are missing
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
    if (field === 'academic') {
      setFormData(prev => ({
        ...prev,
        batch: originalData.batch || '',
        department: originalData.department || '',
        section: originalData.section || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: originalData[field] || '' }));
    }
    setEditing(prev => ({ ...prev, [field]: false }));
  };

  // --- SMART SAVE HANDLER ---
  const handleSave = async (field) => {
    try {
      let updateObj = {};

      if (field === 'name') {
        // Combine for Display Name
        const full = `${nameData.first} ${nameData.last}`.trim();

        // Update Auth Profile
        await updateProfile(user, { displayName: full });

        // Save Separately to DB
        updateObj = {
          displayName: full,
          firstName: nameData.first,
          lastName: nameData.last
        };
      }
      else if (field === 'academic') {
        updateObj = {
          batch: formData.batch,
          department: formData.department,
          section: formData.section
        };
      }
      else {
        updateObj = { [field]: formData[field] };
      }

      await update(ref(db, `users/${user.uid}`), updateObj);
      setEditing(prev => ({ ...prev, [field]: false }));
      // alert("Updated successfully!"); // Optional: Removed alert for smoother UX
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="settings-section-content">

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
          <RiRefreshLine /> Sync Google Photo
        </button>
      </div>

      {/* NAME EDIT SECTION (Updated for Split Inputs) */}
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
              <input
                type="text"
                value={nameData.first}
                onChange={e => setNameData({ ...nameData, first: e.target.value })}
                placeholder="First Name (e.g. John David)"
                className="settings-input"
                style={{ flex: 1 }}
              />
              <input
                type="text"
                value={nameData.last}
                onChange={e => setNameData({ ...nameData, last: e.target.value })}
                placeholder="Last Name"
                className="settings-input"
                style={{ flex: 1 }}
              />
            </div>
            <div className="action-btns">
              <button className="save-btn" onClick={() => handleSave('name')}>Save</button>
              <button className="cancel-btn" onClick={() => cancelEdit('name')}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE NUMBER SECTION (India Only) */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>+91</span>
              <input
                type="tel"
                value={formData.mobile?.replace(/^91/, '').replace(/\s/g, '') || ''}
                onChange={e => {
                  // Allow only digits, max 10
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, mobile: digits });
                }}
                placeholder="10-digit mobile number"
                className="settings-input"
                style={{ flex: 1 }}
                maxLength={10}
              />
            </div>
            <div className="action-btns">
              <button className="save-btn" onClick={() => handleSave('mobile')}>Save</button>
              <button className="cancel-btn" onClick={() => cancelEdit('mobile')}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ACADEMIC HIERARCHY SECTION */}
      <div className="settings-row">
        <label><RiBuilding4Line /> ACADEMIC DETAILS</label>
        {!editing.academic ? (
          <div className="input-group">
            <span className="display-text">
              {formData.batch ? `${formData.batch} | ${formData.department} | Sec ${formData.section}` : "Not Assigned"}
            </span>
            <button className="edit-icon-btn" onClick={() => toggleEdit('academic')}><RiEditLine /></button>
          </div>
        ) : (
          <div className="edit-mode-group hierarchy-stack">
            <select value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value, department: '', section: '' })}>
              <option value="">Select Batch</option>
              {Object.keys(hierarchy).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select disabled={!formData.batch} value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value, section: '' })}>
              <option value="">Select Dept</option>
              {formData.batch && hierarchy[formData.batch] &&
                Object.keys(hierarchy[formData.batch]).filter(d => d !== 'initialized').map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select disabled={!formData.department} value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })}>
              <option value="">Select Section</option>
              {formData.batch && formData.department && hierarchy[formData.batch][formData.department]?.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="action-btns">
              <button className="save-btn" onClick={() => handleSave('academic')}>Save</button>
              <button className="cancel-btn" onClick={() => cancelEdit('academic')}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* REGISTER NO SECTION */}
      <div className="settings-row">
        <label><RiHashtag /> REGISTER NO</label>
        {!editing.registerNo ? (
          <div className="input-group">
            <span className="display-text">{formData.registerNo || "Add Register No"}</span>
            <button className="edit-icon-btn" onClick={() => toggleEdit('registerNo')}><RiEditLine /></button>
          </div>
        ) : (
          <div className="edit-mode-group">
            <input type="text" value={formData.registerNo} onChange={e => setFormData({ ...formData, registerNo: e.target.value })} />
            <div className="action-btns">
              <button className="save-btn" onClick={() => handleSave('registerNo')}>Save</button>
              <button className="cancel-btn" onClick={() => cancelEdit('registerNo')}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* DATE OF BIRTH SECTION */}
      <div className="settings-row">
        <label><RiCake2Line /> DATE OF BIRTH</label>
        {!editing.birthday ? (
          <div className="input-group">
            <span className="display-text">{formData.birthday || "Add Date of Birth"}</span>
            <button className="edit-icon-btn" onClick={() => toggleEdit('birthday')}><RiEditLine /></button>
          </div>
        ) : (
          <div className="edit-mode-group">
            <input type="date" value={formData.birthday} onChange={e => setFormData({ ...formData, birthday: e.target.value })} />
            <div className="action-btns">
              <button className="save-btn" onClick={() => handleSave('birthday')}>Save</button>
              <button className="cancel-btn" onClick={() => cancelEdit('birthday')}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* GENDER SECTION */}
      <div className="settings-row">
        <label><RiGenderlessLine /> GENDER</label>
        {!editing.gender ? (
          <div className="input-group">
            <span className="display-text">{formData.gender || "Add Gender"}</span>
            <button className="edit-icon-btn" onClick={() => toggleEdit('gender')}><RiEditLine /></button>
          </div>
        ) : (
          <div className="edit-mode-group">
            <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <div className="action-btns">
              <button className="save-btn" onClick={() => handleSave('gender')}>Save</button>
              <button className="cancel-btn" onClick={() => cancelEdit('gender')}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* LINKEDIN SECTION */}
      <div className="settings-row">
        <label><RiLinkedinBoxFill /> LINKEDIN</label>
        {!editing.linkedin ? (
          <div className="input-group">
            <span className="display-text">{formData.linkedin || "Add LinkedIn Profile"}</span>
            <button className="edit-icon-btn" onClick={() => toggleEdit('linkedin')}><RiEditLine /></button>
          </div>
        ) : (
          <div className="edit-mode-group">
            <input type="url" value={formData.linkedin} onChange={e => setFormData({ ...formData, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
            <div className="action-btns">
              <button className="save-btn" onClick={() => handleSave('linkedin')}>Save</button>
              <button className="cancel-btn" onClick={() => cancelEdit('linkedin')}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* GITHUB SECTION */}
      <div className="settings-row">
        <label><RiGithubFill /> GITHUB</label>
        {!editing.github ? (
          <div className="input-group">
            <span className="display-text">{formData.github || "Add Github Profile"}</span>
            <button className="edit-icon-btn" onClick={() => toggleEdit('github')}><RiEditLine /></button>
          </div>
        ) : (
          <div className="edit-mode-group">
            <input type="url" value={formData.github} onChange={e => setFormData({ ...formData, github: e.target.value })} placeholder="https://github.com/..." />
            <div className="action-btns">
              <button className="save-btn" onClick={() => handleSave('github')}>Save</button>
              <button className="cancel-btn" onClick={() => cancelEdit('github')}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalInfo;
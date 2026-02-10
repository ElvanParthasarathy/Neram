import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, update, onValue } from "firebase/database";
import { RiShieldUserLine, RiArrowRightLine } from "react-icons/ri";

const SetupModal = ({ uid }) => {
  const [hierarchy, setHierarchy] = useState({});
  const [selection, setSelection] = useState({ batch: "", dept: "", sec: "" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch your existing hierarchy from Admin Structure Manager
    const unsub = onValue(ref(db, 'academic_hierarchy'), (snap) => {
      if (snap.exists()) setHierarchy(snap.val());
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!selection.batch || !selection.dept || !selection.sec) return;
    setIsSaving(true);
    try {
      await update(ref(db, `users/${uid}`), {
        batch: selection.batch,
        department: selection.dept,
        section: selection.sec
      });
    } catch (e) {
      alert("Error saving: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="forced-setup-overlay">
      <div className="forced-setup-card animate-pop-in">
        <RiShieldUserLine className="setup-icon" />
        <h2>Profile Required</h2>
        <p>Please select your academic details to access your dashboard and schedule.</p>

        <div className="setup-grid">
          {/* 1. Batch Selection */}
          <div className="field">
            <label>Academic Batch</label>
            <select 
              value={selection.batch} 
              onChange={(e) => setSelection({...selection, batch: e.target.value, dept: "", sec: ""})}
            >
              <option value="">Select Year</option>
              {Object.keys(hierarchy).sort().reverse().map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* 2. Department Selection (Appears after Batch) */}
          {selection.batch && (
            <div className="field animate-fade-in">
              <label>Department</label>
              <select 
                value={selection.dept} 
                onChange={(e) => setSelection({...selection, dept: e.target.value, sec: ""})}
              >
                <option value="">Select Dept</option>
                {Object.keys(hierarchy[selection.batch] || {})
                  .filter(k => k !== 'initialized')
                  .map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {/* 3. Section Selection (Appears after Dept) */}
          {selection.dept && (
            <div className="field animate-fade-in">
              <label>Section</label>
              <select 
                value={selection.sec} 
                onChange={(e) => setSelection({...selection, sec: e.target.value})}
              >
                <option value="">Select Section</option>
                {hierarchy[selection.batch][selection.dept]?.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Button with Loading State */}
        <button 
          className="setup-submit-btn" 
          disabled={!selection.sec || isSaving} 
          onClick={handleSave}
        >
          {isSaving ? (
            <>
              <span className="btn-spinner"></span>
              <span>Saving...</span>
            </>
          ) : (
            <>
              Complete Setup <RiArrowRightLine />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SetupModal;
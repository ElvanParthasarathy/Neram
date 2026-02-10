import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

const CustomPicker = ({ label, value, options, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  // Close when clicking outside the picker
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="switch-group-mac" ref={pickerRef}>
      <label>{label}</label>
      <div
        className={`mac-custom-picker ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value || placeholder}</span>
      </div>

      {isOpen && (
        <div className="mac-picker-dropdown animate-fade-in">
          {options.length > 0 ? (
            options.map((opt) => (
              <div
                key={opt}
                className={`mac-picker-option ${value === opt ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
              >
                {opt}
              </div>
            ))
          ) : (
            <div className="mac-picker-option" style={{ opacity: 0.5 }}>No Options</div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminViewSwitcher = ({ realProfile, onClose }) => {
  const [hierarchy, setHierarchy] = useState({});
  const [currentView, setCurrentView] = useState(realProfile || { batch: "", department: "", section: "" });

  useEffect(() => {
    onValue(ref(db, "academic_hierarchy"), (snap) => {
      if (snap.exists()) setHierarchy(snap.val());
    });
    const saved = sessionStorage.getItem("admin_preview_session");

    // LOGIC: If saved session exists, use it.
    // If not, use realProfile.
    // IF realProfile has Dept but NO Section (Faculty), ensure Dept is pre-filled but Section is empty.
    if (saved) {
      setCurrentView(JSON.parse(saved));
    } else {
      // Ensure we don't accidentally set a "null" section as a string "null"
      setCurrentView({
        batch: realProfile?.batch || "",
        department: realProfile?.department || "",
        section: realProfile?.section || ""
      });
    }
  }, [realProfile]);

  const updateGlobalView = (newView) => {
    setCurrentView(newView);
    sessionStorage.setItem("admin_preview_session", JSON.stringify(newView));
    window.dispatchEvent(new Event("adminViewChanged"));
  };

  const handleReset = () => {
    sessionStorage.removeItem("admin_preview_session");
    updateGlobalView(realProfile);
    if (onClose) onClose();
  };

  const isPreviewing = realProfile && currentView &&
    (currentView.section !== realProfile.section || currentView.batch !== realProfile.batch);

  return (
    <div className="admin-view-switcher">
      <div className="switcher-popup-panel">
        <div className="switcher-popup-header">
          <h4>System Preview</h4>
          <p className="p-email-small">Admin Mode Active</p>
        </div>

        <div className="dropdown-divider"></div>

        <div className="switcher-body">
          <CustomPicker
            label="Academic Batch"
            value={currentView.batch}
            placeholder="Select Batch"
            options={Object.keys(hierarchy || {}).sort().reverse()}
            onChange={(val) => updateGlobalView({ ...currentView, batch: val, department: "", section: "" })}
          />

          {currentView.batch && hierarchy[currentView.batch] && (
            <CustomPicker
              label="Department"
              value={currentView.department}
              placeholder="Select Dept"
              options={Object.keys(hierarchy[currentView.batch]).filter(k => k !== 'initialized')}
              onChange={(val) => updateGlobalView({ ...currentView, department: val, section: "" })}
            />
          )}

          {currentView.department && hierarchy[currentView.batch]?.[currentView.department] && (
            <CustomPicker
              label="Section"
              value={currentView.section}
              placeholder="Select Sec"
              options={hierarchy[currentView.batch][currentView.department]}
              onChange={(val) => updateGlobalView({ ...currentView, section: val })}
            />
          )}
        </div>

        <div className="switcher-footer-btns">
          <button className="btn-mac-apply" onClick={onClose}>Done</button>
          {isPreviewing && <button className="btn-mac-reset" onClick={handleReset}>Reset Preview</button>}
        </div>
      </div>
    </div>
  );
};

export default AdminViewSwitcher;
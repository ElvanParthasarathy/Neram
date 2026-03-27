import React from "react";
import {
    RiArrowLeftSLine,
    RiEditLine
} from "react-icons/ri";

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const SubHeader = ({ title, onBack }) => (
    <div className="s2-sub-header">
        <button className="s2-back-btn" onClick={onBack}>
            <RiArrowLeftSLine />
        </button>
        <span className="s2-sub-title">{title}</span>
    </div>
);

export const SettingsGroup = ({ children }) => (
    <div className="s2-group">{children}</div>
);

export const SettingsDivider = () => <div className="s2-divider" />;

export const SettingsItem = ({ icon, iconColor, title, desc, onClick, danger }) => (
    <button className="s2-item" onClick={onClick}>
        <span className={`s2-icon-circle ${iconColor}`}>{icon}</span>
        <div className="s2-item-text">
            <div className={`s2-item-title ${danger ? "danger" : ""}`}>
                {title}
            </div>
            {desc && <div className="s2-item-desc">{desc}</div>}
        </div>
    </button>
);

export const NotifItem = ({ icon, iconColor, title, desc, checked, onChange }) => (
    <div className="s2-notif-item">
        <span className={`s2-icon-circle ${iconColor}`}>{icon}</span>
        <div className="s2-item-text">
            <div className="s2-item-title">{title}</div>
            {desc && <div className="s2-item-desc">{desc}</div>}
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
);

export const ToggleSwitch = ({ checked, onChange }) => (
    <button
        className={`s2-toggle ${checked ? "on" : ""}`}
        onClick={() => (typeof onChange === "function" ? onChange(!checked) : null)}
    >
        <span className="s2-toggle-knob" />
    </button>
);

export const InputWithIcon = ({ icon: Icon, value, onChange, placeholder, label, type = "text", multiline = false, rows = 4, className = "" }) => {
    return (
        <div className="s2-complaint-field">
            {label && <div className="s2-complaint-label">{label}</div>}
            <div style={{ position: "relative" }}>
                {!multiline && (
                    <div className="s2-complaint-icon">
                        <Icon size={18} />
                    </div>
                )}
                {multiline ? (
                    <textarea
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        rows={rows}
                        className={`s2-complaint-input s2-complaint-textarea ${className}`}
                    />
                ) : (
                    <input
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`s2-complaint-input ${className}`}
                    />
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE COMPONENTS (Shared between Student & Admin)
// ═══════════════════════════════════════════════════════════════════════════════

export const ProfileSection = ({ title, icon, children }) => (
    <div className="s2-prof-section">
        <div className="s2-prof-section-header">
            <div className="s2-prof-section-icon">{icon}</div>
            <span className="s2-prof-section-title">{title}</span>
        </div>
        {children}
    </div>
);

export const ProfileField = ({ label, value, isEditing, onEdit, onCancel, onSave, children }) => (
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

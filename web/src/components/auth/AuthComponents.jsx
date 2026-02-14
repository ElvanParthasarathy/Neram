import React, { useState } from 'react';
import { RiEyeLine, RiEyeOffLine, RiArrowDownSLine } from 'react-icons/ri';
import './Auth.css';

export const AuthLayout = ({ children }) => (
    <div className="auth-container">
        <div className="auth-shape shape-1" />
        <div className="auth-shape shape-2" />
        <div className="auth-shape shape-3" />
        <div className="auth-shape shape-4" />
        <div className="auth-content">
            {children}
        </div>
    </div>
);

export const AuthHeader = ({ title, subtitle }) => (
    <div className="auth-header animate-enter delay-1">
        <div className="auth-title">{title}</div>
        <div className="auth-subtitle">{subtitle}</div>
    </div>
);

export const AuthInput = ({ label, value, onChange, type = "text", placeholder, icon, error, ...props }) => {
    const [showPass, setShowPass] = useState(false);
    const isPass = type === 'password';

    return (
        <div className="auth-field animate-enter delay-2">
            <label className="auth-label">{label}</label>
            <div className={`auth-input-wrapper ${error ? 'has-error' : ''}`}>
                {icon && <div className="auth-icon-start">{icon}</div>}
                <input
                    className={`auth-input ${icon ? 'has-start-icon' : ''} ${isPass ? 'has-end-icon' : ''}`}
                    type={isPass && showPass ? 'text' : type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    {...props}
                />
                {isPass && (
                    <div className="auth-icon-end" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <RiEyeOffLine /> : <RiEyeLine />}
                    </div>
                )}
            </div>
            {error && <div className="auth-error">{error}</div>}
        </div>
    );
};

export const AuthSelect = ({ label, value, onChange, options = [], placeholder, error, disabled, loading }) => {
    return (
        <div className="auth-field animate-enter delay-2">
            <label className="auth-label">{label}</label>
            <div className="auth-input-wrapper auth-select-wrapper">
                <select
                    className="auth-input has-end-icon"
                    value={value || ""}
                    onChange={onChange}
                    disabled={disabled}
                    style={{ appearance: 'none', cursor: disabled ? 'not-allowed' : 'pointer' }}
                >
                    <option value="" disabled>{loading ? "Loading..." : placeholder}</option>
                    {options.map(opt => {
                        const val = typeof opt === 'object' ? opt.value : opt;
                        const lab = typeof opt === 'object' ? opt.label : opt;
                        return <option key={val} value={val}>{lab}</option>
                    })}
                </select>
                <div className="auth-icon-end" style={{ pointerEvents: 'none' }}>
                    <RiArrowDownSLine />
                </div>
            </div>
            {error && <div className="auth-error">{error}</div>}
        </div>
    );
};

export const AuthButton = ({ children, onClick, disabled, loading, secondary, className = "", type = "button" }) => (
    <button
        type={type}
        className={`auth-btn ${secondary ? 'auth-btn-google' : ''} ${className} animate-enter delay-3`}
        onClick={onClick}
        disabled={disabled || loading}
    >
        {loading ? <div className="btn-loader" /> : children}
    </button>
);

export const AuthDivider = () => (
    <div className="auth-divider animate-enter delay-3">
        <div className="divider-line" />
        <div className="divider-text">OR</div>
        <div className="divider-line" />
    </div>
);

export const AuthLink = ({ prefix, linkText, onClick }) => (
    <div className="auth-link animate-enter delay-3">
        {prefix}
        <span onClick={onClick}>{linkText}</span>
    </div>
);

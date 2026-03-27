import React from 'react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { RiTimeLine, RiLogoutBoxRLine, RiShieldCheckLine } from 'react-icons/ri';
import '../../styles/admin/pending-requests.css';

const PendingApproval = ({ user }) => {
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <div className="login-body-wrapper">
            <div className="glass-login-card">
                {/* Icon */}
                <div className="security-module-icon" style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--mac-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 28px auto',
                    border: '1px solid var(--mac-divider)'
                }}>
                    <RiTimeLine style={{ fontSize: '36px', color: '#FF9F0A' }} />
                </div>

                {/* Title */}
                <h1 className="brand-title">
                    Awaiting Approval
                </h1>

                {/* Subtitle */}
                <p className="brand-subtitle" style={{ marginBottom: '12px', opacity: 1 }}>
                    Your account has been registered but is not yet approved.
                </p>

                <p className="brand-subtitle" style={{ fontSize: '14px', marginBottom: '32px' }}>
                    The <strong>Super Admin</strong> will review your request and assign you a role. You will gain access once approved.
                </p>

                {/* User Info Card */}
                <div className="request-card" style={{ marginBottom: '32px', textAlign: 'left', background: 'var(--mac-bg-secondary)' }}>
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="" className="request-avatar" style={{ width: 44, height: 44 }} />
                    ) : (
                        <div className="request-avatar-placeholder" style={{ width: 44, height: 44 }}>
                            <RiShieldCheckLine size={20} />
                        </div>
                    )}
                    <div className="request-details">
                        <div className="request-name" style={{ fontSize: '14px' }}>{user?.displayName || 'User'}</div>
                        <div className="request-email" style={{ fontSize: '12px' }}>{user?.email}</div>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="google-btn"
                    style={{ marginBottom: 0 }}
                >
                    <RiLogoutBoxRLine /> Sign Out
                </button>
            </div>
        </div>
    );
};

export default PendingApproval;

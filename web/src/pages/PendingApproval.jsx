import React from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { RiTimeLine, RiLogoutBoxRLine, RiShieldCheckLine } from 'react-icons/ri';

const PendingApproval = ({ user }) => {
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            <div style={{
                textAlign: 'center',
                maxWidth: '420px',
                padding: '48px 32px',
                color: '#fff'
            }}>
                {/* Icon */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 28px auto',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <RiTimeLine style={{ fontSize: '36px', color: '#FF9F0A' }} />
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.5px'
                }}>
                    Awaiting Approval
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontSize: '15px',
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.6,
                    margin: '0 0 8px 0'
                }}>
                    Your account has been registered but is not yet approved.
                </p>

                <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.35)',
                    lineHeight: 1.5,
                    margin: '0 0 36px 0'
                }}>
                    The <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Super Admin</strong> will review your request and assign you a role. You will gain access once approved.
                </p>

                {/* User Info Card */}
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    textAlign: 'left'
                }}>
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="" style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
                    ) : (
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <RiShieldCheckLine style={{ fontSize: 20, color: '#888' }} />
                        </div>
                    )}
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{user?.displayName || 'User'}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{user?.email}</div>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff',
                        padding: '14px 32px',
                        borderRadius: '50px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <RiLogoutBoxRLine /> Sign Out
                </button>
            </div>
        </div>
    );
};

export default PendingApproval;

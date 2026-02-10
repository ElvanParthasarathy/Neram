import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { ref, onValue, update } from 'firebase/database';
import { RiCheckLine, RiCloseLine, RiUserLine, RiTimeLine } from 'react-icons/ri';

const PendingRequests = () => {
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersRef = ref(db, 'users');
        const unsub = onValue(usersRef, (snap) => {
            setUsers(snap.exists() ? snap.val() : {});
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // Filter for users with role = 'pending' or no role at all but who signed up via admin portal
    const pendingUsers = Object.entries(users).filter(([_, u]) => {
        return u.role === 'pending';
    });

    const approveUser = async (uid, role) => {
        const roleLabel = role === 'rep' ? 'Student Admin' : role === 'faculty' ? 'Faculty Admin' : 'Super Admin';
        if (!window.confirm(`Approve this user as ${roleLabel}?`)) return;
        try {
            await update(ref(db, `users/${uid}`), { role });
            alert(`User approved as ${roleLabel}.`);
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const rejectUser = async (uid) => {
        if (!window.confirm("Reject this user? They will be set back to 'student' role.")) return;
        try {
            await update(ref(db, `users/${uid}`), { role: 'student' });
            alert("User rejected and set to Student role.");
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    if (loading) return <div className="admin-loader">Loading Pending Requests...</div>;

    return (
        <div className="admin-container">
            <div className="header-section">
                {/* Header handled by AdminPanel */}
            </div>

            {pendingUsers.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--mac-text-secondary)',
                }}>
                    <RiTimeLine style={{ fontSize: '48px', opacity: 0.3, marginBottom: '16px' }} />
                    <h3 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--mac-text)' }}>No Pending Requests</h3>
                    <p style={{ fontSize: '14px' }}>All users have been approved or there are no new sign-ups waiting.</p>
                </div>
            ) : (
                <div className="admin-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pendingUsers.map(([uid, u]) => (
                        <div key={uid} style={{
                            background: '#fff',
                            border: '1px solid var(--mac-divider)',
                            borderRadius: '14px',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px'
                        }}>
                            {/* User Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                {u.photoURL ? (
                                    <img src={u.photoURL} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.05)' }} />
                                ) : (
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0f0f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <RiUserLine style={{ fontSize: 20, color: '#999' }} />
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '15px' }}>{u.displayName || 'Unknown'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--mac-text-secondary)', marginTop: '2px' }}>{u.email}</div>
                                    <div style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        color: '#FF9F0A',
                                        background: 'rgba(255,159,10,0.08)',
                                        padding: '2px 10px',
                                        borderRadius: '50px',
                                        display: 'inline-block',
                                        marginTop: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>Pending</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                <button
                                    onClick={() => approveUser(uid, 'rep')}
                                    title="Approve as Student Admin"
                                    style={{
                                        background: '#007AFF',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '50px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Student Admin
                                </button>
                                <button
                                    onClick={() => approveUser(uid, 'faculty')}
                                    title="Approve as Faculty"
                                    style={{
                                        background: '#34C759',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '50px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Faculty
                                </button>
                                <button
                                    onClick={() => approveUser(uid, 'super_admin')}
                                    title="Approve as Super Admin"
                                    style={{
                                        background: '#AF52DE',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '50px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Super
                                </button>
                                <button
                                    onClick={() => rejectUser(uid)}
                                    title="Reject"
                                    style={{
                                        background: 'rgba(255,59,48,0.08)',
                                        color: '#FF3B30',
                                        border: '1px solid rgba(255,59,48,0.15)',
                                        padding: '8px 16px',
                                        borderRadius: '50px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <RiCloseLine /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingRequests;

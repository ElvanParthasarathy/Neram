import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { ref, onValue, update } from 'firebase/database';
import { RiCheckLine, RiCloseLine, RiUserLine, RiTimeLine } from 'react-icons/ri';
import { convertTo12Hour, formatDateDDMMYYYY } from '../../../utils/timeUtils';
import '../../../styles/admin/pending-requests.css';
import { ListItemSkeleton } from '../../../components/ui/AdminSkeletons';

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

    if (loading) return <div style={{ padding: '20px' }}><ListItemSkeleton count={3} /></div>;

    return (
        <div className="pending-requests-container">
            {pendingUsers.length === 0 ? (
                <div className="empty-requests">
                    <RiTimeLine className="empty-icon" />
                    <h3 className="empty-title">No Pending Requests</h3>
                    <p className="empty-text">All users have been approved or there are no new sign-ups waiting.</p>
                </div>
            ) : (
                <div className="pending-requests-list">
                    {pendingUsers.map(([uid, u]) => (
                        <div key={uid} className="request-card">
                            {/* User Info */}
                            <div className="request-user-info">
                                {u.photoURL ? (
                                    <img src={u.photoURL} alt="" className="request-avatar" />
                                ) : (
                                    <div className="request-avatar-placeholder">
                                        <RiUserLine size={24} />
                                    </div>
                                )}
                                <div className="request-details">
                                    <div className="request-name">{u.displayName || 'Unknown'}</div>
                                    <div className="request-email">{u.email}</div>
                                    {u.lastLogin && (
                                        <div className="request-time" style={{ fontSize: '11px', opacity: 0.6, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <RiTimeLine /> Requested: {formatDateDDMMYYYY(u.lastLogin)} at {convertTo12Hour(u.lastLogin.split('T')[1].split('.')[0])}
                                        </div>
                                    )}
                                    <div className="request-badge">Pending Approval</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="request-actions">
                                <button
                                    onClick={() => approveUser(uid, 'rep')}
                                    title="Approve as Student Admin"
                                    className="btn-approve student"
                                >
                                    Student Admin
                                </button>
                                <button
                                    onClick={() => approveUser(uid, 'faculty')}
                                    title="Approve as Faculty"
                                    className="btn-approve faculty"
                                >
                                    Faculty Admin
                                </button>
                                <button
                                    onClick={() => approveUser(uid, 'super_admin')}
                                    title="Approve as Super Admin"
                                    className="btn-approve super"
                                >
                                    Super Admin
                                </button>
                                <button
                                    onClick={() => rejectUser(uid)}
                                    title="Reject Request"
                                    className="btn-reject"
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

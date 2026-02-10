import React from 'react';
import { RiUser3Fill } from 'react-icons/ri';

const AdminDashboard = ({ user, userProfile }) => {
    // Logic to determine display name similar to Navbar
    const firstName = userProfile?.firstName || (user?.displayName || "").split(' ')[0] || "User";
    const photoURL = user?.photoURL || userProfile?.photoURL;

    return (
        <div className="admin-dashboard-welcome animate-fade-in">
            <div className="welcome-card glass-panel">
                <div className="profile-section-large">
                    <div className="user-avatar-large">
                        {photoURL ? (
                            <img src={photoURL} alt="Profile" />
                        ) : (
                            <RiUser3Fill />
                        )}
                    </div>
                    <div className="welcome-text">
                        <h1>Vanakkam, <span className="highlight-name">{firstName}</span></h1>
                        <p>Welcome to Neram. Glad you are here.</p>
                    </div>
                </div>
            </div>

            {/* Placeholder for future dashboard widgets */}
            <div className="dashboard-widgets">
                {/* We can add quick stats here later if needed */}
            </div>
        </div>
    );
};

export default AdminDashboard;

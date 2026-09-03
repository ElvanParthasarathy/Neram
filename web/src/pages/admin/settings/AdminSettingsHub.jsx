import React, { useState } from "react";
import { auth } from "../../../firebase";
import {
    RiSunLine,
    RiShieldKeyholeLine,
    RiUser3Line,
    RiBuilding4Line,
    RiUserStarLine,
    RiInformationLine,
    RiUser3Fill,
    RiLogoutBoxRLine,
} from "react-icons/ri";
import { SettingsGroup, SettingsDivider, SettingsItem } from "../../student/settings/SettingsShared";

const AdminSettingsHub = ({ userProfile, onNavigate }) => {
    const [showSignOut, setShowSignOut] = useState(false);

    return (
        <>
            {/* Profile Card */}
            <div
                className="s2-profile-card"
                onClick={() => onNavigate("profile")}
            >
                <div className="s2-avatar">
                    {userProfile?.photoURL ? (
                        <img
                            src={userProfile.photoURL}
                            alt="Profile"
                        />
                    ) : (
                        <RiUser3Fill className="s2-avatar-icon" />
                    )}
                </div>
                <div className="s2-profile-text">
                    <div className="s2-profile-title">Admin Account</div>
                    <div className="s2-profile-sub">
                        {userProfile?.displayName || userProfile?.name || "Administrator"}
                    </div>
                </div>
            </div>

            <div className="s2-spacer-md" />

            {/* Group 1: Display */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiSunLine />}
                    iconColor="green"
                    title="Display"
                    desc="Theme, appearance"
                    onClick={() => onNavigate("display")}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />

            {/* Group 2: Security / User Directory */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiShieldKeyholeLine />}
                    iconColor="purple"
                    title="Security"
                    desc="Password & account"
                    onClick={() => onNavigate("security")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiUser3Line />}
                    iconColor="blue"
                    title="User Directory"
                    desc="View registered users"
                    onClick={() => onNavigate("directory")}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />

            {/* Group 3: About */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiUserStarLine />}
                    iconColor="purple"
                    title="Management Team"
                    desc="Founders & Board of Directors"
                    onClick={() => onNavigate("founders")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiBuilding4Line />}
                    iconColor="green"
                    title="About RMK Group"
                    desc="Vision, Mission & Identity"
                    onClick={() => onNavigate("rmk")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiInformationLine />}
                    iconColor="blue"
                    title="About App"
                    desc="Version, licenses"
                    onClick={() => onNavigate("about")}
                />
            </SettingsGroup>

            <div className="s2-spacer-md" />

            {/* Group 4: Sign Out */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiLogoutBoxRLine />}
                    iconColor="red"
                    title="Sign Out"
                    desc="Log out of your admin account"
                    onClick={() => setShowSignOut(true)}
                    danger
                />
            </SettingsGroup>

            {/* Sign Out Modal */}
            {showSignOut && (
                <div className="s2-dialog-overlay" onClick={() => setShowSignOut(false)}>
                    <div className="s2-dialog" onClick={e => e.stopPropagation()}>
                        <div className="s2-dialog-title">Sign Out?</div>
                        <div className="s2-dialog-text">Are you sure you want to sign out of your admin account?</div>
                        <div className="s2-dialog-actions">
                            <button
                                className="s2-dialog-btn cancel"
                                onClick={() => setShowSignOut(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="s2-dialog-btn confirm"
                                onClick={() => auth.signOut()}
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminSettingsHub;

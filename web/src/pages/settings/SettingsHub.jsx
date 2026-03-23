import React, { useState } from "react";
import { auth } from "../../firebase";
import {
    RiSunLine,
    RiDatabase2Line,
    RiNotification3Line,
    RiShieldKeyholeLine,
    RiUser3Line,
    RiFeedbackLine,
    RiCodeSSlashLine,
    RiInformationLine,
    RiBuilding4Line,
    RiUser3Fill,
    RiLogoutBoxRLine,
} from "react-icons/ri";
import { SettingsGroup, SettingsDivider, SettingsItem } from "./SettingsShared";

const SettingsHub = ({ userProfile, onNavigate }) => {
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
                    <div className="s2-profile-title">Neram Account</div>
                    <div className="s2-profile-sub">
                        {userProfile?.displayName || "User"}
                    </div>
                </div>
            </div>

            <div className="s2-spacer-md" />

            {/* Group 1: Display / Storage / Notifications */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiSunLine />}
                    iconColor="green"
                    title="Display"
                    desc="Theme, appearance"
                    onClick={() => onNavigate("display")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiDatabase2Line />}
                    iconColor="orange"
                    title="Storage & Data"
                    desc="Manage cached content"
                    onClick={() => onNavigate("storage")}
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
                    desc="View students"
                    onClick={() => onNavigate("directory")}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />



            <div className="s2-spacer-sm" />

            {/* Group 4: About */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiBuilding4Line />}
                    iconColor="green"
                    title="About RMK Group"
                    desc="Management, Vision & Mission"
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

            {/* Group 5: Sign Out */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiLogoutBoxRLine />}
                    iconColor="red"
                    title="Sign Out"
                    desc="Log out of your account"
                    onClick={() => setShowSignOut(true)}
                    danger
                />
            </SettingsGroup>

            {/* Sign Out Modal */}
            {showSignOut && (
                <div className="s2-dialog-overlay" onClick={() => setShowSignOut(false)}>
                    <div className="s2-dialog" onClick={e => e.stopPropagation()}>
                        <div className="s2-dialog-title">Sign Out?</div>
                        <div className="s2-dialog-text">Are you sure you want to sign out of your account?</div>
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

export default SettingsHub;

import React from "react";
import {
    RiSunLine,
    RiDatabase2Line,
    RiNotification3Line,
    RiShieldKeyholeLine,
    RiUser3Line,
    RiFeedbackLine,
    RiCodeSSlashLine,
    RiInformationLine,
    RiUser3Fill,
} from "react-icons/ri";
import { SettingsGroup, SettingsDivider, SettingsItem } from "./SettingsShared";

const SettingsHub = ({ userProfile, onNavigate }) => {

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
                <SettingsDivider />
                <SettingsItem
                    icon={<RiNotification3Line />}
                    iconColor="purple"
                    title="Notifications"
                    desc="Manage alerts and reminders"
                    onClick={() => onNavigate("notifications")}
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

            {/* Group 3: Support */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiFeedbackLine />}
                    iconColor="orange"
                    title="Complaints"
                    desc="Send feedback & reports"
                    onClick={() => onNavigate("complaints")}
                />
                <SettingsDivider />
                <SettingsItem
                    icon={<RiCodeSSlashLine />}
                    iconColor="green"
                    title="About Developer"
                    desc="Elvan Parthasarathy"
                    onClick={() => onNavigate("developer")}
                />
            </SettingsGroup>

            <div className="s2-spacer-sm" />

            {/* Group 4: About */}
            <SettingsGroup>
                <SettingsItem
                    icon={<RiInformationLine />}
                    iconColor="blue"
                    title="About App"
                    desc="Version, licenses"
                    onClick={() => onNavigate("about")}
                />
            </SettingsGroup>

        </>
    );
};

export default SettingsHub;

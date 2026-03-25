import React from "react";
import { 
    RiStarSmileLine,
    RiUserFollowLine,
    RiUserStarLine,
    RiUserHeartLine,
    RiBriefcase4Line,
} from "react-icons/ri";
import { SubHeader, SettingsGroup, SettingsDivider } from "./SettingsShared";

const ManagementItem = ({ name, role, bio, icon, colorClass }) => (
    <div className="s2-feature-item" style={{ padding: '16px 0' }}>
        <span className={`s2-icon-circle ${colorClass}`}>{icon}</span>
        <div className="s2-feature-text">
            <div className="s2-feature-title">{name}</div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--mac-accent)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>{role}</div>
            <div className="s2-feature-desc">{bio}</div>
        </div>
    </div>
);

const FoundersPage = ({ onBack }) => (
    <>
        <SubHeader title="Management Team" onBack={onBack} />

        <SettingsGroup>
            <div className="s2-about-header">
                <div className="s2-about-english">
                    Management Team
                </div>
                <div className="s2-about-desc">
                    The visionaries driving excellence and innovation across the RMK Group.
                </div>
            </div>
        </SettingsGroup>
        <div className="s2-spacer-md" />

        <div className="s2-section-label">Founders</div>
        <SettingsGroup>
            <div style={{ padding: '4px 20px' }}>
                <ManagementItem 
                    name="Thiru. R.S. Munirathinam"
                    role="Founder-Chairman"
                    bio="A dedicated visionary and philanthropist who served as a Former Member of the Tamil Nadu State Assembly and founded the R.M.K. Group of Institutions."
                    icon={<RiStarSmileLine />}
                    colorClass="red"
                />
                <SettingsDivider />
                <ManagementItem 
                    name="Thiru. R.M. Kishore"
                    role="Vice-Chairman"
                    bio="Mechanical Engineer with an MBA from UK, focused on transforming learners into achievers with global standards."
                    icon={<RiUserFollowLine />}
                    colorClass="blue"
                />
            </div>
        </SettingsGroup>

        <div className="s2-spacer-md" />

        <div className="s2-section-label">Board of Directors</div>
        <SettingsGroup>
            <div style={{ padding: '4px 20px' }}>
                <ManagementItem 
                    name="Tmt. Manjula Munirathinam"
                    role="Chairperson"
                    bio="Keen social worker and educationalist with over a decade of dedication to the group."
                    icon={<RiUserHeartLine />}
                    colorClass="red"
                />
                <SettingsDivider />
                <ManagementItem 
                    name="Thiru. R. Jothi Naidu"
                    role="Director"
                    bio="Vast experience in industrial management, associated with the group for nearly 30 years."
                    icon={<RiBriefcase4Line />}
                    colorClass="orange"
                />
                <SettingsDivider />
                <ManagementItem 
                    name="Thiru. Yalamanchi Pradeep"
                    role="Secretary"
                    bio="ECE Engineer (Guindy) with a Master's from Carnegie Mellon University, USA."
                    icon={<RiUserFollowLine />}
                    colorClass="green"
                />
                <SettingsDivider />
                <ManagementItem 
                    name="Dr. Durga Devi Pradeep"
                    role="Vice Chairperson"
                    bio="ECE Engineer with an MBA and Ph.D. in Management from Anna University."
                    icon={<RiUserStarLine />}
                    colorClass="purple"
                />
                <SettingsDivider />
                <ManagementItem 
                    name="Tmt. Sowmya Kishore"
                    role="Trustee"
                    bio="ECE Engineer and Psychologist, currently pursuing doctoral research."
                    icon={<RiUserHeartLine />}
                    colorClass="red"
                />
            </div>
        </SettingsGroup>

        <div className="s2-spacer-lg" />
    </>
);

export default FoundersPage;

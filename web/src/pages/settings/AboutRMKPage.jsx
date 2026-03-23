import React from "react";
import { 
    RiBuilding4Line, 
    RiCompassDiscoverLine, 
    RiFocus2Line, 
    RiTeamLine,
    RiUserFollowLine
} from "react-icons/ri";
import { SubHeader, SettingsGroup, SettingsDivider } from "./SettingsShared";

const ManagementItem = ({ name, role, bio }) => (
    <div className="s2-management-item" style={{ padding: '20px' }}>
        <div style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--mac-text)', marginBottom: '4px' }}>{name}</div>
        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--mac-accent)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{role}</div>
        <div className="s2-about-desc" style={{ padding: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>
            {bio}
        </div>
    </div>
);

const AboutRMKPage = ({ onBack }) => (
    <>
        <SubHeader title="About RMK Group" onBack={onBack} />

        <div className="s2-about-header" style={{ padding: '32px 24px' }}>
            <div className="s2-about-english" style={{ fontSize: '1.8rem', fontWeight: '800' }}>RMK Group of Institutions</div>
            <div className="s2-about-desc" style={{ marginTop: '12px', textAlign: 'center' }}>
                A legacy of excellence in education, discipline, and innovation.
            </div>
        </div>

        <div className="s2-section-label">Leadership & Management</div>
        <SettingsGroup>
            <ManagementItem 
                name="Thiru. R.S. Munirathinam"
                role="Founder-Chairman"
                bio="Chairman Thiru. R.S. Munirathinam is a compassionate visionary and philanthropist who served as a Former Member of the Tamil Nadu State Assembly. He received the 'Lifetime Achievement Award' from the Honourable Chief Minister of Tamil Nadu and an 'Honorary Doctorate by Vels University' for his three decades of contribution to education."
            />
            <SettingsDivider />
            <ManagementItem 
                name="Thiru. R.M. Kishore"
                role="Vice-Chairman"
                bio="Thiru. R.M. Kishore is a Mechanical Engineer with an MBA from University of Huddersfield, UK. He has served as a Syndicate Member in Anna University and leads the group with a vision to transform learners into achievers at the global level."
            />
            <SettingsDivider />
            <div style={{ padding: '12px 0' }}>
                <ManagementItem 
                    name="Tmt. Manjula Munirathinam"
                    role="Chairperson"
                    bio="A keen social worker involved with various women forums with over a decade of experience in the educational field."
                />
                <SettingsDivider />
                <ManagementItem 
                    name="Thiru. R. Jothi Naidu"
                    role="Director"
                    bio="An industrialist with vast experience, associated with the Management of R.M.K. Group for over 29 years."
                />
                <SettingsDivider />
                <ManagementItem 
                    name="Thiru. Yalamanchi Pradeep"
                    role="Secretary"
                    bio="An ECE Engineer from Guindy and MS from Carnegie Mellon, USA. Founder & MD of Kranium Healthcare Systems."
                />
                <SettingsDivider />
                <ManagementItem 
                    name="Dr. Durga Devi Pradeep"
                    role="Vice Chairperson"
                    bio="An ECE Engineer with an MBA and Ph.D. in Management from Anna University."
                />
                <SettingsDivider />
                <ManagementItem 
                    name="Tmt. Sowmya Kishore"
                    role="Trustee"
                    bio="An ECE Engineer with an M.Sc. in Psychology and currently pursuing Ph.D. in Psychology."
                />
            </div>
        </SettingsGroup>

        <div className="s2-spacer-md" />

        <div className="s2-section-label">Our Vision</div>
        <SettingsGroup>
            <div style={{ padding: 24 }}>
                <div className="s2-feature-item">
                    <span className="s2-icon-circle blue"><RiCompassDiscoverLine /></span>
                    <div className="s2-feature-text">
                        <div className="s2-about-desc" style={{ padding: 0 }}>
                            To be the most preferred destination in the country for pursuing education in Engineering and its allied fields, and to transform learners into achievers at the global level with the right attitude towards changing societal needs.
                        </div>
                    </div>
                </div>
            </div>
        </SettingsGroup>

        <div className="s2-spacer-md" />

        <div className="s2-section-label">Our Mission</div>
        <SettingsGroup>
            <div style={{ padding: '12px 24px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {[
                        "To develop needed resources and infrastructure for the teaching-learning process.",
                        "To nurture professional and ethical values, and instill innovation and entrepreneurship.",
                        "To encourage higher learning and research to face global challenges.",
                        "To provide additional skills making students industry-ready.",
                        "To interact with industries to facilitate transfer of knowledge."
                    ].map((item, i) => (
                        <li key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' }}>
                            <span style={{ color: 'var(--mac-accent)', fontWeight: 'bold' }}>•</span>
                            <div className="s2-about-desc" style={{ padding: 0 }}>{item}</div>
                        </li>
                    ))}
                </ul>
            </div>
        </SettingsGroup>

        <div className="s2-spacer-lg" />
    </>
);

export default AboutRMKPage;

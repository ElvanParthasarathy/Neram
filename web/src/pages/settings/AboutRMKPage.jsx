import React from "react";
import {
    RiCompassDiscoverLine,
    RiFocus2Line,
    RiMapPin2Line,
    RiShieldCheckLine,
    RiBuilding2Line,
    RiHeartLine,
    RiLightbulbLine,
    RiToolsLine,
    RiEarthLine
} from "react-icons/ri";
import { SubHeader, SettingsGroup, SettingsDivider } from "./SettingsShared";

const AboutRMKPage = ({ onBack }) => (
    <>
        <SubHeader title="About RMK Group" onBack={onBack} />

        <div className="s2-about-header" style={{ paddingTop: '32px' }}>
            <div className="s2-about-english" style={{ fontSize: '1.2rem', fontWeight: '800', background: 'rgba(var(--mac-accent-rgb), 0.1)', color: 'var(--mac-accent)' }}>
                R.M.K. Group of Institutions
            </div>
            <div className="s2-about-desc" style={{ marginTop: '16px', maxWidth: '450px', marginLeft: 'auto', marginRight: 'auto' }}>
                A legacy of excellence in education, unparalleled discipline, and constant innovation.
            </div>
        </div>

        <div className="s2-section-label">Our Institutions</div>
        <SettingsGroup>
            <div style={{ padding: '4px 20px' }}>
                {[
                    { name: "R.M.D. Engineering College", address: "Kavaraipettai, Thiruvallur District" },
                    { name: "R.M.K. Engineering College", address: "Kavaraipettai, Thiruvallur District" },
                    { name: "R.M.K. College of Engineering and Technology", address: "Puduvoyal, Thiruvallur District" },
                    { name: "Sri Durgadevi Polytechnic College", address: "Kavaraipettai, Thiruvallur District" },
                    { name: "R.M.K. Residential School", address: "Kavaraipettai, Thiruvallur District" },
                    { name: "R.M.K. Matriculation School", address: "Kavaraipettai, Thiruvallur District" },
                    { name: "R.M.K. School", address: "Thiruverkadu, Chennai" }
                ].map((inst, index, arr) => (
                    <React.Fragment key={index}>
                        <div className="s2-feature-item">
                            <span className="s2-icon-circle blue" style={{ width: '32px', height: '32px', fontSize: '16px' }}>
                                <RiMapPin2Line />
                            </span>
                            <div className="s2-feature-text">
                                <div className="s2-feature-title">{inst.name}</div>
                                <div className="s2-feature-desc">{inst.address}</div>
                            </div>
                        </div>
                        {index < arr.length - 1 && <SettingsDivider />}
                    </React.Fragment>
                ))}
            </div>
        </SettingsGroup>

        <div className="s2-spacer-md" />

        <div className="s2-section-label">Our Identity</div>
        <SettingsGroup>
            <div style={{ padding: '4px 20px' }}>
                <div className="s2-feature-item">
                    <span className="s2-icon-circle green"><RiShieldCheckLine /></span>
                    <div className="s2-feature-text">
                        <div className="s2-feature-title">Quality Education</div>
                        <div className="s2-feature-desc">A commitment to excellence</div>
                    </div>
                </div>
                <SettingsDivider />
                <div className="s2-feature-item">
                    <span className="s2-icon-circle red"><RiMapPin2Line /></span>
                    <div className="s2-feature-text">
                        <div className="s2-feature-title">Eco-friendly Campuses</div>
                        <div className="s2-feature-desc">Sprawling lush green campuses across multiple locations.</div>
                    </div>
                </div>
            </div>
        </SettingsGroup>

        <div className="s2-spacer-md" />

        <div className="s2-section-label">Our Vision</div>
        <SettingsGroup>
            <div style={{ padding: '4px 20px' }}>
                <div className="s2-feature-item">
                    <span className="s2-icon-circle blue"><RiCompassDiscoverLine /></span>
                    <div className="s2-feature-text">
                        <div className="s2-feature-title">Global Excellence</div>
                        <div className="s2-feature-desc">To be the most preferred destination in the country for pursuing education in Engineering and its allied fields.</div>
                    </div>
                </div>
                <SettingsDivider />
                <div className="s2-feature-item">
                    <span className="s2-icon-circle purple"><RiFocus2Line /></span>
                    <div className="s2-feature-text">
                        <div className="s2-feature-title">Transforming Learners</div>
                        <div className="s2-feature-desc">To transform learners into achievers at the global level with the right attitude towards changing societal needs.</div>
                    </div>
                </div>
            </div>
        </SettingsGroup>

        <div className="s2-spacer-md" />

        <div className="s2-section-label">Our Mission</div>
        <SettingsGroup>
            <div style={{ padding: '4px 20px' }}>
                {[
                    { text: "To develop the needed resources and infrastructure, and to establish a conducive ambience for the teaching- learning process", icon: <RiBuilding2Line />, color: "blue" },
                    { text: "To nurture in the students, professional and ethical values, and to instill in them a spirit of innovation and entrepreneurship", icon: <RiHeartLine />, color: "red" },
                    { text: "To encourage in the students a desire for higher learning and research, to equip them to face the global challenges", icon: <RiLightbulbLine />, color: "orange" },
                    { text: "To provide opportunities for students to get the needed additional skills to make them industry ready", icon: <RiToolsLine />, color: "green" },
                    { text: "To interact with industries and other organizations to facilitate transfer of knowledge and know-how.", icon: <RiEarthLine />, color: "purple" }
                ].map((item, i, arr) => (
                    <React.Fragment key={i}>
                        <div className="s2-feature-item">
                            <span className={`s2-icon-circle ${item.color}`} style={{ width: '32px', height: '32px', fontSize: '18px' }}>
                                {item.icon}
                            </span>
                            <div className="s2-feature-text">
                                <div className="s2-feature-desc" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{item.text}</div>
                            </div>
                        </div>
                        {i < arr.length - 1 && <SettingsDivider />}
                    </React.Fragment>
                ))}
            </div>
        </SettingsGroup>

        <div className="s2-spacer-lg" />

    </>
);

export default AboutRMKPage;

import React from "react";
import {
    RiPhoneLine,
    RiMailLine,
    RiLinkedinFill,
    RiGithubFill,
    RiMapPin2Line,
    RiArrowRightSLine,
} from "react-icons/ri";
import { SubHeader } from "./SettingsShared";

const ContactItem = ({ icon, color, label, subLabel, onClick }) => {
    // Map colors to CSS values
    const colorMap = {
        black: "var(--mac-text)",
        pink: "#E1306C",
        blue: "#0077B5",
        red: "#FF0000",
    };

    // For icon circle background
    const bgMap = {
        black: "rgba(128,128,128,0.2)",
        pink: "rgba(225, 48, 108, 0.15)",
        blue: "rgba(0, 119, 181, 0.15)",
        red: "rgba(255, 0, 0, 0.15)",
    };

    return (
        <a className="s2-contact-item" onClick={onClick}>
            <span
                className="s2-icon-circle"
                style={{
                    background: bgMap[color] || bgMap.black,
                    color: colorMap[color] || colorMap.black,
                }}
            >
                {icon}
            </span>
            <div className="s2-contact-text">
                <div className="s2-contact-label">{label}</div>
                {subLabel && <div className="s2-contact-sub">{subLabel}</div>}
            </div>
            {onClick && <RiArrowRightSLine className="s2-chevron-right" />}
        </a>
    );
};

const DeveloperPage = ({ onBack }) => (
    <>
        <SubHeader title="About Developer" onBack={onBack} />

        <div className="s2-dev-hero">
            <div className="s2-dev-hello">Hello, I'm</div>
            <div className="s2-dev-name">Elvan Parthasarathy</div>
            <div className="s2-dev-role">Vibe Coder | Prompt Engineer</div>
            <a
                href="https://jaiprakashpartha.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="s2-dev-portfolio-btn"
            >
                Visit Portfolio
            </a>
        </div>

        <div className="s2-section-label">Contact Info</div>
        <div style={{ padding: "0 2px" }}>
            <ContactItem
                icon={<RiPhoneLine />}
                color="black"
                label="+91 93451 28797"
                onClick={() => window.open("tel:+919345128797")}
            />
            <ContactItem
                icon={<RiMailLine />}
                color="pink"
                label="jaiprakashpartha@gmail.com"
                onClick={() => window.open("mailto:jaiprakashpartha@gmail.com")}
            />
            <ContactItem
                icon={<RiLinkedinFill />}
                color="blue"
                label="linkedin.com/in/jaiprakashpartha"
                onClick={() => window.open("https://www.linkedin.com/in/jaiprakashpartha", "_blank")}
            />
            <ContactItem
                icon={<RiGithubFill />}
                color="black"
                label="github.com/elvanparthasarathy"
                onClick={() => window.open("https://github.com/elvanparthasarathy", "_blank")}
            />
            <ContactItem
                icon={<RiMapPin2Line />}
                color="red"
                label="Arani, Tamil Nadu - 632317"
                subLabel="(Currently in Chennai)"
            />
        </div>

        <div className="s2-spacer-md" />
    </>
);

export default DeveloperPage;

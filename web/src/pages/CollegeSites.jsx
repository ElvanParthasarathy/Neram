import React from "react";
import "../styles/sites-desktop.css";
import "../styles/home.css"; // Ensure h2-view is available
import {
  RiBuilding4Fill,
  RiUserFollowFill,
  RiTeamFill,
  RiCodeBoxFill,
  RiTerminalBoxFill,
  RiCodeSSlashFill,
  RiArrowRightUpLine
} from "react-icons/ri";

const CollegeSites = () => {
  const links = [
    {
      name: "RMD College Website",
      url: "https://rmd.ac.in/",
      description: "Official RMD college website.",
      icon: <RiBuilding4Fill />
    },
    {
      name: "RMK Nextgen Student",
      url: "https://nextgen.rmd.ac.in/",
      description: "Nextgen platform for student login and academic tracking.",
      icon: <RiUserFollowFill />
    },
    {
      name: "RMK Nextgen Faculty",
      url: "https://nextgenfaculty.rmd.ac.in/login.html",
      description: "Faculty login for RMK Nextgen academic management.",
      icon: <RiTeamFill />
    },
    {
      name: "IamNeo",
      url: "https://rmk685.examly.io/login",
      description: "Learning, assessment, and recruitment solutions.",
      icon: <RiCodeBoxFill />
    },
    {
      name: "Skill Rack",
      url: "https://www.skillrack.com/faces/ui/profile.xhtml",
      description: "Daily coding challenges and problem-solving tasks.",
      icon: <RiTerminalBoxFill />
    },
    {
      name: "Code Tantra",
      url: "https://rmd.codetantra.com/",
      description: "Platform for classes, assignments, and assessments.",
      icon: <RiCodeSSlashFill />
    }
  ];

  return (
    <div className="h2-view sites-container">
      <header className="sites-page-header">
        <h1 className="sites-title">College Sites & Platforms</h1>
        <p className="sites-subtitle">Quick access to essential academic resources</p>
      </header>

      <section className="sites-grid">
        {links.map((site, index) => (
          <a
            key={index}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="site-link-card"
          >
            <div className="site-icon">
              {site.icon}
            </div>

            <h2 className="site-name">{site.name}</h2>
            <p className="site-description">{site.description}</p>

            <div className="arrow-indicator">
              <RiArrowRightUpLine />
            </div>
          </a>
        ))}
      </section>
    </div>
  );
};

export default CollegeSites;
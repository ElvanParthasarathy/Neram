import React from "react";

import "../styles/sites-desktop.css";

const CollegeSites = () => {
  const links = [
    {
      name: "RMD College Website",
      url: "https://rmd.ac.in/",
      description: "Official RMD college website.",
      icon: "ri-building-4-fill"
    },
    {
      name: "RMK Nextgen Student",
      url: "https://nextgen.rmd.ac.in/",
      description: "Nextgen platform for student login and academic tracking.",
      icon: "ri-user-follow-fill"
    },
    {
      name: "RMK Nextgen Faculty",
      url: "https://nextgenfaculty.rmd.ac.in/login.html",
      description: "Faculty login for RMK Nextgen academic management.",
      icon: "ri-team-fill"
    },
    {
      name: "IamNeo",
      url: "https://rmk685.examly.io/login",
      description: "Learning, assessment, and recruitment solutions.",
      icon: "ri-code-box-fill"
    },
    {
      name: "Skill Rack",
      url: "https://www.skillrack.com/faces/ui/profile.xhtml",
      description: "Daily coding challenges and problem-solving tasks.",
      icon: "ri-terminal-box-fill"
    },
    {
      name: "Code Tantra",
      url: "https://rmd.codetantra.com/",
      description: "Platform for classes, assignments, and assessments.",
      icon: "ri-code-s-slash-fill"
    }
  ];

  return (
    <div className="h2-view sites-view">
      <div className="sites-container">

        <header className="page-header">
          <h1 className="page-title">College Sites & Platforms</h1>
          <p className="page-subtitle">Quick access to essential academic resources</p>
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
                <i className={site.icon}></i>
              </div>

              <h2 className="site-name">{site.name}</h2>
              <p className="site-description">{site.description}</p>

              <div className="arrow-indicator">
                <i className="ri-arrow-right-up-line"></i>
              </div>
            </a>
          ))}
        </section>

      </div>
    </div>
  );
};

export default CollegeSites;
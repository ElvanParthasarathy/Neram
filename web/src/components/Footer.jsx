// src/components/Footer.jsx
import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      marginTop: "auto", // Pushes footer to bottom if flex container allows
      padding: "1.5rem 0",
      borderTop: "1px solid rgba(0,0,0,0.1)",
      textAlign: "center",
      fontSize: "0.85rem",
      color: "#64748b",
      width: "100%"
    }}>
      <p style={{ margin: 0 }}>
        RMK Group Of Institutions © {currentYear}
      </p>
      <p style={{ margin: "4px 0 0 0", fontWeight: "600", color: "#0056b3" }}>
        Built with ❤️ by Elvan Parthasarathy
      </p>
    </footer>
  );
};

export default Footer;
import { useEffect, useState } from "react";

const ThemeToggle = ({ asMenuItem = false }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("neram-theme") || "auto";
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem("neram-theme") || "auto");
    };

    window.addEventListener("theme-change", handleStorageChange);
    return () => window.removeEventListener("theme-change", handleStorageChange);
  }, []);

  // Theme application is handled by the centralized useSystemTheme hook.
  // This component only needs to sync its local state when external changes happen.

  const handleSelect = (e, mode) => {
    e.stopPropagation();
    setTheme(mode);
    localStorage.setItem("neram-theme", mode);
    window.dispatchEvent(new Event("theme-change"));
  };

  const sliderStyles = `
    .theme-slider-container {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(120, 120, 128, 0.12);
      border-radius: 100px;
      padding: 2px;
      height: 36px;
      width: 100%;
      box-sizing: border-box;
      margin-top: 10px;
      border: 1px solid rgba(0, 0, 0, 0.05);
    }

    html.dark .theme-slider-container {
      background: rgba(0, 0, 0, 0.45) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
    }

    .slider-thumb {
      position: absolute;
      left: 2px;
      top: 2px;
      bottom: 2px;
      width: calc((100% - 4px) / 3);
      background: #FFFFFF;
      border-radius: 100px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
      z-index: 1;
    }

    html.dark .slider-thumb {
      background: rgba(255, 255, 255, 0.06) !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
    }

    .slider-option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      cursor: pointer;
      height: 100%;
      transition: all 0.2s;
      gap: 6px;
    }

    .slider-option svg {
      width: 18px;
      height: 18px;
      color: var(--mac-text-secondary);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .slider-option.active svg { 
      color: var(--mac-text); 
    }
    
    html.dark .slider-option.active svg { 
      color: #FFFFFF; 
    }

    .menu-header-label {
      font-size: 11px;
      font-weight: 800;
      color: var(--mac-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.6;
    }
  `;

  const IconAuto = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20" />
      <path d="M12 2a10 10 0 0 0 0 20" fill="currentColor" fillOpacity="0.1" stroke="none" />
    </svg>
  );

  const IconLight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );

  const IconDark = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  );

  if (asMenuItem) {
    return (
      <>
        <style>{sliderStyles}</style>
        <div
          style={{
            padding: '12px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            cursor: 'default',
            width: '100%',
            boxSizing: 'border-box'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="menu-header-label" style={{ marginBottom: '4px', display: 'block' }}>Appearance</span>

          <div className="theme-slider-container">
            <div
              className="slider-thumb"
              style={{ transform: `translateX(${theme === 'light' ? '0%' : theme === 'auto' ? '100%' : '200%'})` }}
            />

            <div
              className={`slider-option ${theme === 'light' ? 'active' : ''}`}
              onClick={(e) => handleSelect(e, 'light')}
              title="Light Mode"
            >
              <IconLight />
            </div>

            <div
              className={`slider-option ${theme === 'auto' ? 'active' : ''}`}
              onClick={(e) => handleSelect(e, 'auto')}
              title="Auto (System)"
            >
              <IconAuto />
            </div>

            <div
              className={`slider-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={(e) => handleSelect(e, 'dark')}
              title="Dark Mode"
            >
              <IconDark />
            </div>
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default ThemeToggle;
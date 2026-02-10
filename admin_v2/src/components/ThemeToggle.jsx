import { useEffect, useState } from "react";

const ThemeToggle = ({ asMenuItem = false }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (mode) => {
      root.classList.remove("light", "dark");

      if (mode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }
    };

    applyTheme(theme);
  }, [theme]);

  // ==========================================================
  // HIDE COMPONENT: Return null to keep logic running invisible
  // ==========================================================
  /* --- UI RESTORED --- */

  const handleSelect = (e, mode) => {
    // Force 'auto' to be treated as 'light' effectively if selected,
    // or arguably we should just allow the user to pick 'light' or 'dark'.
    // Given the request, we will stick to the existing structure but 'auto' will
    // just act as a placeholder for 'light' basically if it were selected.

    // However, to strictly follow "no auto darkmode", let's update handleSelect
    // If user clicks auto, we can set it to light, OR we keep the UI but make it non-functional for system sync.
    // Simplifying: The user just wants to stop the AUTO switching.

    e.stopPropagation();
    setTheme(mode);
    localStorage.setItem("theme", mode);
  };

  const sliderStyles = `
    .theme-slider-container {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(120, 120, 128, 0.2);
      border-radius: 8px;
      padding: 2px;
      height: 32px;
      width: 100%;
      box-sizing: border-box;
      margin-top: 8px;
    }

    .slider-thumb {
      position: absolute;
      left: 2px;
      top: 2px;
      bottom: 2px;
      width: calc((100% - 4px) / 3);
      background: #FFFFFF;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      z-index: 1;
    }

    html.dark .slider-thumb {
      background: #636366;
    }

    .slider-option {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      cursor: pointer;
      height: 100%;
      transition: opacity 0.2s;
    }

    .slider-option svg {
      width: 16px;
      height: 16px;
      color: var(--mac-text-secondary);
      transition: color 0.2s;
    }

    .slider-option.active svg { color: var(--mac-text); }
    html.dark .slider-option.active svg { color: #FFFFFF; }

    .menu-header-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--mac-text);
      opacity: 0.7;
      margin-left: 4px;
    }
  `;

  const IconAuto = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 2v20" />
      <path d="M12 2a10 10 0 0 0 0 20" fill="currentColor" fillOpacity="0.2" stroke="none" />
    </svg>
  );

  const IconLight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );

  const IconDark = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  );

  const getThumbPosition = () => {
    if (theme === 'light') return '0%';
    if (theme === 'auto') return '33.333%'; // Assuming 3 items
    return '200%'; // But the CSS says 'width: 100% / 3'. 
    // Wait, the original code had 3 items: Light, Auto, Dark.
    // Thumb width is 1/3.
    // Position 0 = Left (Light)
    // Position 1 (100% of thumb width) = Center (Auto)
    // Position 2 (200% of thumb width) = Right (Dark)
    // The previous code had "return '100%'" for auto. CSS transform translateX(100%) moves it one full width of itself.
  };

  // Correction: The getThumbPosition logic in the original commented code was:
  // light -> 0%, auto -> 100%, dark -> 200%.
  // This is correct relative to the thumb size (which is 33.33% of container).

  if (asMenuItem) {
    return (
      <>
        <style>{sliderStyles}</style>
        <div
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            cursor: 'default'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="menu-header-label">Theme</span>

          <div className="theme-slider-container">
            <div
              className="slider-thumb"
              style={{ transform: `translateX(${theme === 'light' ? '0%' : theme === 'auto' ? '100%' : '200%'})` }}
            />

            <div
              className={`slider-option ${theme === 'light' ? 'active' : ''}`}
              onClick={(e) => handleSelect(e, 'light')}
              title="Light"
            >
              <IconLight />
            </div>

            <div
              className={`slider-option ${theme === 'auto' ? 'active' : ''}`}
              onClick={(e) => handleSelect(e, 'auto')}
              title="Auto"
            >
              <IconAuto />
            </div>

            <div
              className={`slider-option ${theme === 'dark' ? 'active' : ''}`}
              onClick={(e) => handleSelect(e, 'dark')}
              title="Dark"
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
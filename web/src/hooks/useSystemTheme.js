import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'neram-theme';

/**
 * Centralized Theme Controller — the SINGLE source of truth for theme state.
 * 
 * All theme changes across the app (sidebar ThemeToggle, DisplaySettings,
 * MobileNavbar) MUST go through this hook by:
 *   1. Writing to localStorage key "neram-theme"
 *   2. Dispatching window event "theme-change"
 * 
 * This hook will then read the new value and apply the correct class to <html>.
 */
export function useSystemTheme() {
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem(STORAGE_KEY) || 'auto';
    });

    // Core: Apply theme classes to <html>
    const applyTheme = useCallback((mode) => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');

        if (mode === 'dark') {
            root.classList.add('dark');
        } else if (mode === 'light') {
            root.classList.add('light');
        } else {
            // Auto — follow system preference
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.add(systemDark ? 'dark' : 'light');
        }
    }, []);

    // Public setter: updates state, localStorage, DOM, and notifies others
    const setTheme = useCallback((newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        // Dispatch so other components (ThemeToggle, DisplaySettings, MobileNavbar) can sync
        window.dispatchEvent(new Event('theme-change'));
    }, []);

    // Effect: Apply theme whenever state changes
    useEffect(() => {
        applyTheme(theme);
    }, [theme, applyTheme]);

    // Effect: Listen for external "theme-change" events (from other components)
    useEffect(() => {
        const handleExternalChange = () => {
            const current = localStorage.getItem(STORAGE_KEY) || 'auto';
            setThemeState(current);
            // applyTheme will fire via the state change above
        };

        window.addEventListener('theme-change', handleExternalChange);
        return () => window.removeEventListener('theme-change', handleExternalChange);
    }, []);

    // Effect: Listen for OS-level theme changes when in "auto" mode
    useEffect(() => {
        if (theme !== 'auto') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = (e) => {
            const root = document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleSystemChange);
        return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }, [theme]);

    return { theme, setTheme };
}

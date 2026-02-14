import { useEffect, useState } from 'react';

export function useSystemTheme() {
    const [theme, setTheme] = useState(
        localStorage.getItem('theme') || 'system'
    );

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (selectedTheme) => {
            if (selectedTheme === 'dark') {
                root.classList.add('dark');
            } else if (selectedTheme === 'light') {
                root.classList.remove('dark');
            } else {
                // System
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (systemDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        applyTheme(theme);

        // Save to storage
        if (theme !== 'system') {
            localStorage.setItem('theme', theme);
        } else {
            localStorage.removeItem('theme'); // Clean up if system
        }

        // Listener for system changes if 'system' is selected
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                if (e.matches) root.classList.add('dark');
                else root.classList.remove('dark');
            };
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

    }, [theme]);

    return { theme, setTheme };
}

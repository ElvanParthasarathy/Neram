import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@neram_theme_preference';

// Light Mode Colors
const lightColors = {
    primary: '#1D1D1F',
    secondary: '#6B7280',
    accent: '#6366F1',
    background: '#F5F5F7',
    surface: '#FFFFFF',
    textPrimary: '#1D1D1F',
    textSecondary: '#6B7280',
    border: 'rgba(0, 0, 0, 0.08)',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    glassBorder: 'rgba(0, 0, 0, 0.08)',
    glassCard: 'rgba(255, 255, 255, 0.9)',

    // Semantic Tokens
    inputBackground: '#F9FAFB',
    inputBorder: '#E5E7EB',
    placeholder: '#9CA3AF',
    shadow: '#000000',
    cardBorder: 'rgba(0, 0, 0, 0.05)',
    danger: '#EF4444',
    subtleBackground: '#F3F4F6',
    folderColor: '#FFCC00',
    separator: '#F3F4F6',
    buttonText: '#FFFFFF',
    calendarSelection: '#6366F1',
    calendarSelectionText: '#FFFFFF',
    calendarDot: '#1D1D1F',
    calendarSelectedDot: '#FFFFFF',
};

// Dark Mode Colors
const darkColors = {
    primary: '#FFFFFF',
    secondary: '#94A3B8',
    accent: '#6366F1',
    background: '#0F172A',
    surface: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.1)',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassCard: 'rgba(30, 41, 59, 0.9)',

    // Semantic Tokens
    inputBackground: '#1E293B',
    inputBorder: '#334155',
    placeholder: '#64748B',
    shadow: '#000000',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    danger: '#EF4444',
    subtleBackground: '#334155', // Lighter than surface (#1E293B) for visibility
    folderColor: '#FFCC00',
    separator: '#334155',
    buttonText: '#FFFFFF',
    calendarSelection: '#6366F1',
    calendarSelectionText: '#FFFFFF',
    calendarDot: '#FFFFFF',
    calendarSelectedDot: '#FFFFFF',
};

// Create context with default values (dark theme) to prevent undefined errors
// during initial render before provider is mounted
const ThemeContext = createContext({
    colors: darkColors,
    isDark: true,
    themePreference: 'auto',
    changeTheme: () => { },
});

export const useTheme = () => {
    const context = useContext(ThemeContext);
    // Extra safety: if context is somehow undefined, return defaults
    if (!context) {
        console.warn('useTheme called outside of ThemeProvider, using default colors');
        return {
            colors: darkColors,
            isDark: true,
            themePreference: 'auto',
            changeTheme: () => { },
        };
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme(); // 'light' | 'dark' | null
    const [themePreference, setThemePreference] = useState('auto'); // 'light' | 'dark' | 'auto'

    // Load saved preference on mount
    useEffect(() => {
        const loadPreference = async () => {
            try {
                const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (saved) setThemePreference(saved);
            } catch (e) {
                console.warn('Failed to load theme preference:', e);
            }
        };
        loadPreference();
    }, []);

    // Save preference when changed
    const changeTheme = async (newTheme) => {
        setThemePreference(newTheme);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (e) {
            console.warn('Failed to save theme preference:', e);
        }
    };

    // Determine active theme
    const isDark =
        themePreference === 'dark' ||
        (themePreference === 'auto' && systemColorScheme === 'dark');

    const colors = isDark ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{
            colors,
            isDark,
            themePreference,
            changeTheme,
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Export color schemes for reference
export { lightColors, darkColors };

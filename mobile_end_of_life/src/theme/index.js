// Static theme colors - used by StyleSheet files
// For dynamic theme, use useTheme() from context/ThemeContext.js

export const colors = {
    // Dark Mode Theme (default)
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
};

export const spacing = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
};

export const typography = {
    h1: { fontSize: 24, fontWeight: 'bold' },
    h2: { fontSize: 20, fontWeight: 'bold' },
    body1: { fontSize: 16 },
    body2: { fontSize: 14 },
    button: { fontSize: 16, fontWeight: '600' },
};

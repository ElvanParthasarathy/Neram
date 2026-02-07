import { StyleSheet, Dimensions } from 'react-native';
import { spacing, typography } from '../theme';

const { width } = Dimensions.get('window');

export const createAuthStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background, // Dynamic background
        padding: spacing.l,
    },
    card: {
        width: '100%',
        padding: spacing.l,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        alignItems: 'center',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    logo: {
        fontSize: 40,
        marginBottom: spacing.m,
        color: colors.accent,
        fontWeight: 'bold',
    },
    title: {
        ...typography.h2,
        color: colors.textPrimary,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: spacing.m,
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        paddingHorizontal: spacing.m,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.inputBorder,
    },
    loginButton: {
        width: '100%',
        height: 50,
        backgroundColor: colors.accent,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.m,
    },
    loginButtonText: {
        ...typography.button,
        color: '#FFFFFF',
    },
    googleButton: {
        width: '100%',
        height: 50,
        backgroundColor: colors.surface,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.m,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.border,
    },
    googleButtonText: {
        ...typography.button,
        color: colors.textPrimary,
    },
    footerLinks: {
        marginTop: spacing.l,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    linkText: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    linkTextHighlight: {
        color: colors.accent,
        fontWeight: 'bold',
    }
});

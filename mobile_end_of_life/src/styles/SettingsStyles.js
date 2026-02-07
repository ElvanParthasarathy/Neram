import { StyleSheet } from 'react-native';

export const createSettingsStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    content: {
        padding: 20,
        gap: 20,
    },
    section: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBackground,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 12,
    },
    input: {
        flex: 1,
        padding: 14,
        fontSize: 16,
        color: colors.textPrimary,
    },
    eyeIcon: {
        padding: 14,
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    updateBtn: {
        backgroundColor: colors.accent, // Standard action color
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        minWidth: 140,
        alignItems: 'center',
    },
    updateBtnText: {
        color: colors.buttonText,
        fontWeight: '700',
        fontSize: 15,
    },
    forgotBtn: {
        padding: 8,
    },
    forgotBtnText: {
        color: colors.accent,
        fontWeight: '600',
        fontSize: 14,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
        opacity: 0.7,
    },
    infoText: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statusLabel: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    badge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    badgeSuccess: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)', // Transparent Green
        borderColor: colors.success
    },
    badgeNeutral: {
        backgroundColor: colors.subtleBackground,
        borderColor: colors.border
    },
    textSuccess: { color: colors.success, fontWeight: '700', fontSize: 13 },
    textNeutral: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
    socialBtn: {
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    socialBtnPrimary: {
        backgroundColor: colors.surface,
        borderColor: colors.primary,
    },
    socialBtnDestructive: {
        borderColor: colors.danger,
        backgroundColor: colors.surface,
    },
    socialBtnText: {
        fontWeight: '700',
        fontSize: 15,
    },
    textPrimary: { color: colors.textPrimary },
    textDestructive: { color: colors.danger },
    dangerSection: {
        borderWidth: 1,
        borderColor: colors.danger,
        backgroundColor: 'rgba(239, 68, 68, 0.05)', // Subtle danger tint
    },
    dangerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dangerText: {
        fontSize: 15,
        color: colors.danger,
        fontWeight: '500',
    },
    deleteBtn: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.danger,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12, // Standardized
    },
    deleteBtnText: {
        color: colors.danger,
        fontWeight: '700',
        fontSize: 14,
    },
    confirmBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 12,
        borderRadius: 12,
    },
    warningText: {
        fontSize: 14,
        color: colors.danger,
        marginBottom: 10,
        fontWeight: '600',
    },
    confirmBtns: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    finalDeleteBtn: {
        flex: 1,
        backgroundColor: colors.danger,
        padding: 12,
        borderRadius: 12, // Standardized
        alignItems: 'center',
    },
    finalDeleteText: {
        color: colors.buttonText,
        fontWeight: '700',
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 12, // Standardized
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.danger,
    },
    cancelText: {
        color: colors.danger,
        fontWeight: '600',
    },
    themeSelector: {
        flexDirection: 'row',
        gap: 10,
    },
    themeBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    themeBtnText: {
        fontWeight: '600',
        fontSize: 14,
    },
    // REF
    textDanger: { color: colors.danger },
    dangerInput: {
        backgroundColor: colors.inputBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.inputBorder,
    },
});

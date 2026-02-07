import { StyleSheet, Dimensions } from 'react-native';
import { spacing, typography } from '../theme';

const { height } = Dimensions.get('window');

export const createProfileStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // Was #F5F5F7
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 100,
    },

    // PHOTO ROW
    photoSection: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.subtleBackground, // Changed from primary for softer look
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 36,
        color: colors.accent, // Changed from surface for pop
        fontWeight: 'bold',
    },
    syncBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface, // Was #fff
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadow, // Was #000
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    syncBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: 8,
    },

    // TABS
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface, // Was #fff
        padding: 4,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: colors.accent, // Matching theme accent (Purple)
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, // Fixed opacity
        shadowRadius: 8,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.buttonText, // White text for contrast
        fontWeight: '700',
    },

    // SETTINGS ROW
    rowCard: {
        backgroundColor: colors.surface, // Was #fff
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadow, // Was #000
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        marginLeft: 8,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // READ VIEW
    readRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    valueText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textPrimary,
        flex: 1,
        marginRight: 12,
    },
    editBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.subtleBackground, // Was #F3F4F6
        justifyContent: 'center',
        alignItems: 'center',
    },

    // EDIT VIEW & INPUTS
    editContainer: {
        backgroundColor: colors.surface, // Was #fff
        margin: 20,
        borderRadius: 20,
        padding: 20,
        elevation: 4,
        shadowColor: colors.shadow, // Was #000
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
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
    input: {
        backgroundColor: colors.inputBackground, // Was #F9FAFB
        borderWidth: 1,
        borderColor: colors.inputBorder, // Was #E5E7EB
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: colors.textPrimary,
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        gap: 16,
    },
    halfInput: {
        flex: 1,
    },
    textArea: {
        backgroundColor: colors.inputBackground, // Was #F9FAFB
        borderWidth: 1,
        borderColor: colors.inputBorder, // Was #E5E7EB
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: colors.textPrimary,
        height: 100,
        textAlignVertical: 'top',
    },

    // SELECTOR STYLES (New)
    selectorBtn: {
        backgroundColor: colors.inputBackground, // Was #F9FAFB
        borderWidth: 1,
        borderColor: colors.inputBorder, // Was #E5E7EB
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectorHeight: {
        height: 48, // Fixed height for consistency
    },
    selectorPlaceholder: {
        color: colors.placeholder, // Was #9CA3AF
        fontSize: 15,
    },
    selectorValue: {
        color: colors.textPrimary,
        fontSize: 15,
        fontWeight: '500',
    },

    // MOBILE INPUT GROUP
    mobileInputGroup: {
        flexDirection: 'row',
        gap: 10,
    },
    countryCodeBtn: {
        width: 80,
        backgroundColor: colors.inputBackground, // Was #F9FAFB
        borderWidth: 1,
        borderColor: colors.inputBorder, // Was #E5E7EB
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 4,
    },

    // ACTION BUTTONS
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 8,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    saveText: {
        color: colors.surface, // Was #fff
        fontWeight: '600',
        fontSize: 13,
    },
    cancelBtn: {
        backgroundColor: colors.subtleBackground, // Was #F3F4F6
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    cancelText: {
        color: colors.textSecondary,
        fontWeight: '600',
        fontSize: 13,
    },
    saveButton: {
        backgroundColor: colors.accent,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: colors.surface, // Was #FFFFFF
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: colors.subtleBackground, // Was #F3F4F6
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    cancelButtonText: {
        color: colors.textPrimary,
        fontWeight: '600',
        fontSize: 16,
    },

    // LOGOUT
    logoutBtn: {
        marginTop: 20,
        backgroundColor: colors.danger + '1A', // 10% opacity, Was #FEF2F2
        borderWidth: 1,
        borderColor: colors.danger + '33', // 20% opacity, Was #FECACA
        borderRadius: 20,
        paddingVertical: 16,
        alignItems: 'center',
    },
    logoutText: { fontSize: 16, fontWeight: '700', color: colors.danger }, // Was #EF4444
    version: { textAlign: 'center', marginTop: 32, marginBottom: 40, color: colors.textSecondary, fontSize: 12 },

    // DIRECTORY CARD
    directoryCard: {
        backgroundColor: colors.surface, // Was #fff
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadow, // Was #000
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    directoryIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: colors.folderColor, // Was #FFCC00 (Token exists)
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    directoryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    directorySubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
    },

    // ADMIN CARD
    adminCard: {
        backgroundColor: colors.surface, // Was #fff
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.accent, // Was colors.indigoShadow then #6366F1
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    adminIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: colors.accent, // Was colors.indigo
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    // MERGED MODAL STYLES
    backdrop: {
        flex: 1,
        backgroundColor: colors.shadow + '80', // 50% opacity, Was/is rgba(0,0,0,0.5)
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.surface, // Was #fff
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: height * 0.7,
        minHeight: 300,
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator, // Was #F3F4F6
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    closeText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    list: {
        padding: 20,
    },
    optionItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator, // Was #F9FAFB
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        color: colors.textPrimary,
    },
    selectedOption: {
        color: colors.accent,
        fontWeight: '700',
    },
    yearList: {
        maxHeight: 200,
        backgroundColor: colors.subtleBackground, // Was #F9FAFB
    },
    yearItem: {
        padding: 12,
        alignItems: 'center',
    },
    activeYear: {
        backgroundColor: colors.accent,
        borderRadius: 8,
    },
    activeYearText: {
        color: colors.surface, // Was #fff
        fontWeight: 'bold',
    },
    folderIcon: {
        color: colors.folderColor, // #FFCC00
    },

    // REFACTORED INLINE STYLES
    countryCodeText: { fontWeight: '600', color: colors.textPrimary },
    inputFlex: { flex: 1 },
    genderContainer: { flexDirection: 'row', gap: 10 },
    genderOption: { flex: 1, alignItems: 'center' },
    genderText: { fontWeight: '600', color: colors.textPrimary },
    genderTextActive: { color: colors.surface },
    directoryContainer: { flex: 1, minHeight: 400 },
    headerActions: { flexDirection: 'row', gap: 16 },
    actionText: { color: colors.accent, fontWeight: '600' },
    gap8: { gap: 8 },
    opacityHalf: { opacity: 0.5 },
});

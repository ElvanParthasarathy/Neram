import { StyleSheet, Platform } from 'react-native';
import { spacing, typography } from '../theme';

// Web Parity Constants
const DOCK_RADIUS = 28;
const ITEM_RADIUS = 24;
const SHADOW_COLOR = '#000'; // Shadow usually stays black even in dark mode
const SHADOW_OPACITY = 0.08;
const SHADOW_RADIUS = 12;

export const createHomeStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // Was #F5F5F7
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 120,
    },

    // HEADER (Hero Style)
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        marginTop: 20,
    },
    headerTextBox: {
        flex: 1,
        marginRight: 16,
    },
    greetingText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.accent,
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    userNameText: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
        lineHeight: 34,
    },
    adminBadge: {
        alignSelf: 'flex-start',
        backgroundColor: colors.danger + '1A', // 10% opacity
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
        borderWidth: 1,
        borderColor: colors.danger + '33', // 20% opacity
    },
    adminText: {
        color: colors.danger,
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },

    // AVATAR
    avatarContainer: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarImage: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: colors.surface,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    avatarPlaceholderText: {
        color: colors.surface,
        fontSize: 24,
        fontWeight: '700',
    },

    // DATE PICKER PILL (The "Input Group")
    dateSection: {
        marginBottom: 24,
        zIndex: 50,
    },
    dateInputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginLeft: 12,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.8,
    },
    datePill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        height: 56,
        borderRadius: 50,
        paddingLeft: 24, // Kept for text breathing room
        paddingRight: 6, // Reduced to 6px (56h - 44h / 2) for perfect concentric alignment
        borderWidth: 1,
        borderColor: colors.glassBorder,

        // Soft Shadow
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
        elevation: 4,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    calendarIconContainer: {
        backgroundColor: colors.accent,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },

    // SECTIONS
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 12,
        marginTop: 12,
        letterSpacing: -0.5,
    },

    // CALENDAR PILLS
    calendarPill: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: ITEM_RADIUS,
        marginBottom: 12,
        alignItems: 'center',
        // Soft Card Style
        borderWidth: 1,
        borderColor: colors.border, // Was 'rgba(0,0,0,0.05)'
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    pillIndicator: {
        width: 4,
        height: 32,
        borderRadius: 2,
        backgroundColor: colors.accent,
        marginRight: 16,
    },
    pillContent: {
        flex: 1,
    },
    pillTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    pillTime: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    emptyStateText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
    },

    // MAIN SCHEDULE CARD
    card: {
        backgroundColor: colors.surface,
        borderRadius: 28,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
        elevation: 5,
    },
    cardMajor: {
        borderLeftWidth: 0,
    },
    cardTag: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: colors.subtleBackground, // Was rgba(0,0,0,0.05)
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 50,
    },
    cardTagText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 8,
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: 16,
        fontWeight: '500',
    },
    cardMetaConfig: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metaItem: {
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    metaText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },

    // TABLE STYLES
    tableContainer: {
        overflow: 'hidden',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: colors.subtleBackground, // Was #F9FAFB
    },
    col1: { width: 40, alignItems: 'center' },
    col2: { flex: 1, paddingHorizontal: 16 },

    headerText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase' },
    cellText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

    courseCode: { fontSize: 12, fontWeight: '700', color: colors.accent, marginBottom: 2 },
    courseName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    facultyName: { fontSize: 12, color: colors.textSecondary, textAlign: 'left', fontStyle: 'italic' },

    // NOTICES / UPDATES
    updateCard: {
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: ITEM_RADIUS,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: colors.accent,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    updateText: {
        fontSize: 15,
        lineHeight: 24,
        color: colors.textPrimary,
    },
    authorText: {
        marginTop: 10,
        fontSize: 12,
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'right',
    },

    // MENU MODAL
    menuBackdrop: {
        flex: 1,
        backgroundColor: colors.shadow + '33', // 20% opacity
    },
    menuContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 50,
        right: 20,
        width: 260,
        backgroundColor: colors.surface,
        borderRadius: 20,
        paddingVertical: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 10,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuItemActive: {
        backgroundColor: colors.subtleBackground, // Was #F3F4F6
    },
    menuIcon: {
        marginRight: 12,
        color: colors.textPrimary,
    },
    menuText: {
        fontSize: 15,
        fontWeight: '500',
        color: colors.textPrimary,
        flex: 1,
    },
    menuDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 4,
    },
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: 4,
    },
    menuBackText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
        marginLeft: 8,
    },

    // LOCAL STYLES MERGED FROM COMPONENT
    offlineBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.warning + '26',
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginBottom: 12,
        borderRadius: 8,
        gap: 6,
    },
    editForm: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    textInput: {
        backgroundColor: colors.inputBackground,
        borderRadius: 8,
        padding: 12,
        minHeight: 80,
        textAlignVertical: 'top',
        color: colors.textPrimary,
        fontSize: 15,
        marginBottom: 12,
    },
    btnRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    actionBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    // card defined above
    modalContainer: { // For bottom sheet modal if used? Or regular modal
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        minHeight: 300,
    },
    btnText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.buttonText, // Actually buttonText token isn't in ThemeContext, checking...
    },

    // --- FORCE PLACEMENT MODAL ---
    label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 16 },
    pickerRow: { flexDirection: 'row', marginBottom: 8 },
    pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.subtleBackground, marginRight: 8, borderWidth: 1, borderColor: colors.border },
    gridChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.subtleBackground, borderWidth: 1, borderColor: colors.border },
    activeChip: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.accent, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
    saveBtnText: { color: colors.surface, fontSize: 16, fontWeight: 'bold' },

    // Modal Styles
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        padding: 10,
        marginBottom: 20,
    },
    fullScreenModal: {
        flex: 1,
        backgroundColor: colors.surface
    },
    modalHeader: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: colors.border
    },

    // REFACTORED INLINE STYLES
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    offlineText: { fontSize: 9, color: colors.warning, fontWeight: '600' },
    scheduleStatusText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    cardLeftAccent: { borderLeftColor: colors.accent, borderLeftWidth: 4 },
    emptyCard: { alignItems: 'center', paddingVertical: 40 },
    emptyTextMain: { color: colors.placeholder, fontSize: 16 },
    emptyTextSub: { color: colors.placeholder, fontSize: 12, marginTop: 4 },
    textSecondaryMargin8: { color: colors.textSecondary, marginTop: 8 },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    linkAccent: { color: colors.accent, fontWeight: '600' },
    cardLeftSuccess: { borderLeftColor: colors.success },
    footerCard: { marginBottom: 120, padding: 16 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-around' },
    footerCol: { alignItems: 'center' },
    footerLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    footerValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
    footerDivider: { width: 1, height: '100%', backgroundColor: colors.border },
    modalTitleText: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
    modalSubtitleText: { textAlign: 'center', color: colors.textSecondary, marginTop: 8 },
    modalContentPadding: { padding: 20 },
    textSurface: { color: colors.surface },
    opacityHalf: { opacity: 0.5 },
    textSecondary: { color: colors.textSecondary },
    marginBottom20: { marginBottom: 20 },
    marginBottom40: { marginBottom: 40 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },

    // COLOR HELPERS
    bgAccent: { backgroundColor: colors.accent },
    bgBorder: { backgroundColor: colors.border },
    textPrimary: { color: colors.textPrimary },
});

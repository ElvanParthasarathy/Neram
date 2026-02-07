import { StyleSheet, Dimensions } from 'react-native';
import { typography, spacing } from '../theme';

const { width } = Dimensions.get('window');
const DOCK_SPACING = 120; // Match Home

export const createScheduleStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // Was #F5F5F7
    },
    contentContainer: {
        padding: 24,
        paddingBottom: DOCK_SPACING,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -1,
    },

    // PREMIUM PILL BAR (Controls)
    // PREMIUM PILL BAR (Controls) - FUSED CONTROL CENTER
    controlsSection: {
        flexDirection: 'column', // Stacked Layout
        gap: 8,
        backgroundColor: colors.surface,
        borderRadius: 32,
        padding: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statusPillGroup: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.subtleBackground, // Inner Slot
        borderRadius: 24,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusBanner: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateControlsGroup: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.subtleBackground, // Inner Slot
        borderRadius: 50,
        height: 56,
        paddingLeft: 20,
        paddingRight: 6,
    },
    dateDisplayPill: {
        // Now just a text wrapper
    },
    dateText: {
        fontSize: 15, // Larger sizing from CSS
        fontWeight: '700',
        color: colors.textPrimary,
    },
    calendarIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.accent, // Glow effect
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },

    // tabs
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        backgroundColor: colors.surface, // Changed from subtleBackground for contrast
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.glassBorder, // Distinct boundary
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: colors.accent, // Matching theme accent
        shadowColor: colors.accent, // Colored glow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, // Enhanced glow
        shadowRadius: 6,
        elevation: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.buttonText,
        fontWeight: '700',
    },

    // TODAY SCHEDULE SECTION
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 16,
        marginTop: 12,
    },

    // CARD STYLES (Reused mostly, but defined here for independence)
    card: {
        backgroundColor: colors.surface, // Was #fff
        borderRadius: 28,
        padding: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadow, // Was #000
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 4,
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
        borderRadius: 20,
    },
    cardTagText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 8,
        marginTop: 8,
    },
    cardSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        fontWeight: '500',
        marginBottom: 16,
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
    },

    // WEEKLY OVERVIEW
    weeklyCard: {
        backgroundColor: colors.surface, // Was #fff
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder, // Was rgba(0,0,0,0.05)
        shadowColor: colors.shadow, // Was #000
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    dayTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.accent,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // TABLE (shared-ish structure)
    tableContainer: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border, // Was rgba(0,0,0,0.05)
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border, // Was rgba(0,0,0,0.05)
        alignItems: 'center',
    },
    col1: { width: 30, alignItems: 'center' },
    col2: { flex: 1, paddingHorizontal: 16 },

    courseCode: { fontSize: 12, fontWeight: '700', color: colors.accent, marginBottom: 2 },
    courseName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
    facultyName: { fontSize: 11, color: colors.textSecondary, textAlign: 'left', fontStyle: 'italic' },

    // EXAMS DIRECTORY
    examFullCard: {
        backgroundColor: colors.surface, // Was #fff
        borderRadius: 24,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        shadowColor: colors.shadow, // Was #000
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    examFullHeader: {
        padding: 20,
        backgroundColor: colors.subtleBackground, // Was #F9FAFB
        borderBottomWidth: 1,
        borderBottomColor: colors.border, // Was rgba(0,0,0,0.05)
        flexDirection: 'row',
        alignItems: 'center',
    },
    examTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    examSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },

    // STAFF / COURSES INFO
    infoCard: {
        backgroundColor: colors.surface, // Was #fff
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    infoList: {
        marginTop: 10,
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    coordinatorRole: {
        fontSize: 11,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 2,
    },

    // MODAL STYLES (Moved from Screen)
    modalBackdrop: {
        flex: 1,
        backgroundColor: colors.shadow + '80', // 50% opacity
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        padding: 10,
    },

    // REFACTORED INLINE STYLES
    textSecondary: { color: colors.textSecondary },
    cardLeftAccent: { borderLeftWidth: 4, borderLeftColor: colors.accent },
    noPadding: { paddingHorizontal: 0 },
    indexText: { fontWeight: '700', color: colors.textSecondary },
    weeklyRow: { flexDirection: 'row', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
    weeklyIndex: { width: 30, color: colors.textSecondary, fontWeight: 'bold' },
    flex1: { flex: 1 },
    italicSecondary: { fontStyle: 'italic', color: colors.textSecondary },
    courseRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
    courseTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
    courseCodeSmall: { fontSize: 11, fontWeight: '700', color: colors.accent },
    alignEnd: { alignItems: 'flex-end' },
    facultyText: { fontSize: 12, color: colors.textPrimary },
    periodText: { fontSize: 11, color: colors.textSecondary },
    mb8: { marginBottom: 8 },
    mb80: { marginBottom: 80 },
    pb100: { paddingBottom: 100 },
    mr12: { marginRight: 12 },
    bgSubtle: { backgroundColor: colors.subtleBackground },
    width80: { width: 80 },
    ph12: { paddingHorizontal: 12 },
    portionTag: { backgroundColor: colors.background, alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
    portionText: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },
    alignCenter: { alignItems: 'center' },
    examEmpty: { alignItems: 'center', padding: 20 },
});

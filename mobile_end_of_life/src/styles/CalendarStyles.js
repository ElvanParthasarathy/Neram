import { StyleSheet } from 'react-native';
import { spacing, typography } from '../theme';

export const createCalendarStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    contentContainer: {
        paddingBottom: 100,
    },
    header: {
        padding: spacing.m,
    },
    // Calendar Wrapper
    calendarWrapper: {
        marginBottom: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },

    // Selected Day Section
    selectedDaySection: {
        padding: spacing.m,
        backgroundColor: colors.surface,
        margin: spacing.m,
        marginTop: 0,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionLabel: {
        ...typography.overline,
        marginBottom: spacing.s,
        color: colors.textSecondary,
    },
    eventCard: {
        flexDirection: 'row',
        marginBottom: spacing.s,
        alignItems: 'center',
    },
    eventLine: {
        width: 4,
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2,
        marginRight: 12,
        minHeight: 40,
    },
    eventContent: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    eventTime: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    noEventText: {
        fontStyle: 'italic',
        color: colors.textSecondary,
    },

    // Monthly Agenda
    agendaSection: {
        padding: spacing.m,
    },
    agendaHeader: {
        ...typography.h2,
        marginBottom: spacing.m,
        color: colors.textPrimary,
    },
    agendaItem: {
        flexDirection: 'row',
        marginBottom: spacing.m,
        backgroundColor: colors.surface,
        padding: spacing.s,
        borderRadius: 8,
    },
    agendaItemSelected: {
        backgroundColor: colors.subtleBackground,
        borderRadius: 12,
        // No border, no shadow -> "Fully filled but very subtle"
    },
    dateBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: spacing.m,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        minWidth: 60,
    },
    dayText: {
        fontSize: 12,
        color: colors.calendarSelection,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    agendaContent: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: spacing.m,
    },

    // Navigation Arrows
    arrowBtn: {
        width: 60,
        height: 32,
        backgroundColor: colors.subtleBackground,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    arrowBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary,
    },

    // CALENDAR MARKING STYLES (Custom Styles)
    holidayText: {
        color: colors.success,
        fontWeight: 'bold',
    },
    examText: {
        color: colors.warning,
        fontWeight: 'bold',
    },
    selectedDateContainer: {
        backgroundColor: colors.calendarSelection,
        borderRadius: 8,
        elevation: 2,
    },
    selectedDateText: {
        color: colors.calendarSelectionText,
        fontWeight: 'bold',
    },

    todayContainer: {
        backgroundColor: colors.subtleBackground,
        borderRadius: 8,
    },

    // DYNAMIC STATUS STYLES (Used by helpers)
    statusLineHoliday: { backgroundColor: colors.success },
    statusLineExam: { backgroundColor: colors.warning },
    statusLineDefault: { backgroundColor: colors.primary },

    statusBorderHoliday: { borderRightColor: colors.success },
    statusBorderExam: { borderRightColor: colors.warning },
    statusBorderDefault: { borderRightColor: colors.primary },

    statusTextHoliday: { color: colors.success },
    statusTextExam: { color: colors.warning },
    statusTextDefault: { color: colors.primary },
});

import { StyleSheet } from 'react-native';

export const createAdminDashboardStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // Changed from #F5F5F7
    },
    header: {
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface, // Changed from #fff
        borderBottomWidth: 1,
        borderBottomColor: colors.border, // Changed from rgba
    },
    backBtn: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    grid: {
        padding: 20,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    card: {
        width: '47%', // roughly half minus gap
        backgroundColor: colors.surface, // Changed from #fff
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: colors.shadow, // Changed from #000
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 8,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: colors.shadow, // Changed from #000
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 2,
    }
});

import { StyleSheet } from 'react-native';

export const createAppMenuStyles = (colors) => StyleSheet.create({
    menuBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    menuContainer: {
        position: 'absolute',
        top: 60,
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
    previewBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        gap: 4,
    },
    previewText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

export const createAppNavigatorStyles = (colors, insets) => StyleSheet.create({
    headerStyle: {
        backgroundColor: colors.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
    },
    headerTitleStyle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    headerRightContainer: {
        marginRight: 16
    },
    tabBarLabelStyle: {
        fontSize: 10,
        marginBottom: 4,
        fontWeight: '600'
    },
    tabBarStyle: {
        position: 'absolute',
        bottom: 20 + (insets?.bottom || 0),
        left: 20,
        right: 20,
        marginHorizontal: 0,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.surface,
        borderTopWidth: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        paddingBottom: 4,
        paddingTop: 4,
        justifyContent: 'center',
    }
});

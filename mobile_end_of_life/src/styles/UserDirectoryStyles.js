import { StyleSheet } from 'react-native';

export const createUserDirectoryStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: colors.background,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    gridContent: {
        padding: 20,
    },
    listContent: {
        padding: 20,
    },
    folderCard: {
        flex: 1 / 3,
        alignItems: 'center',
        backgroundColor: colors.surface,
        margin: 6,
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        aspectRatio: 1, // Square
        justifyContent: 'center',
    },
    folderName: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginBottom: 12,
        padding: 12,
        borderRadius: 16,
    },
    avatarContainer: {
        marginRight: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.subtleBackground,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.subtleBackground,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    userReg: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        color: colors.textSecondary,
        marginTop: 40,
        fontSize: 16,
    },
    headerEmbedded: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: colors.background,
        minHeight: 50,
    },
    hidden: { opacity: 0 },
    marginTop40: { marginTop: 40 },
});

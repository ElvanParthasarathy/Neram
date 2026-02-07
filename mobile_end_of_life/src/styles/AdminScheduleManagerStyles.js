import { StyleSheet } from 'react-native';

export const createAdminScheduleManagerStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
    subtitle: { fontSize: 12, color: colors.textSecondary },

    // NAV GRID
    folderGridItem: { flex: 1, aspectRatio: 1, margin: 8, backgroundColor: colors.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.05, elevation: 1 },
    folderIconLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.subtleBackground, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    folderLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    folderSubLabel: { fontSize: 10, color: colors.textSecondary },
    emptyText: { textAlign: 'center', marginTop: 40, color: colors.textSecondary },

    // Tabs
    tabBar: { flexDirection: 'row', backgroundColor: colors.surface, padding: 8 },
    tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: colors.accent },
    tabText: { fontWeight: '600', color: colors.textSecondary },
    activeTabText: { color: colors.accent },

    // Timetable
    toolbar: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
    dayCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 12, elevation: 1 },
    dayHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: colors.textPrimary },
    periodCell: { width: 70, height: 60, backgroundColor: colors.subtleBackground, borderRadius: 8, marginRight: 8, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border },
    periodEmpty: { backgroundColor: colors.surface },
    pLabel: { fontSize: 10, color: colors.textSecondary },
    pCode: { fontSize: 14, fontWeight: 'bold', color: colors.accent },

    // Common
    listItem: { padding: 16, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    itemTitle: { fontWeight: 'bold', fontSize: 16, color: colors.textPrimary },
    itemSub: { fontSize: 12, color: colors.textSecondary },
    iconBtn: { padding: 8 },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', elevation: 6 },

    // Forms
    sectionCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: colors.textPrimary },
    label: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    input: { backgroundColor: colors.inputBackground, borderRadius: 8, borderWidth: 1, borderColor: colors.inputBorder, padding: 12, marginBottom: 12, color: colors.textPrimary },
    btnSmall: { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    btnAction: { backgroundColor: colors.accent, padding: 14, borderRadius: 12, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' },
    btnActionText: { color: colors.buttonText, fontWeight: 'bold' },

    // Chips
    chip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.subtleBackground, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'transparent' },
    chipEditing: { borderColor: colors.accent, backgroundColor: colors.surface },
    chipText: { color: colors.accent, fontWeight: '600' },
    chipInput: { padding: 0, fontSize: 14, fontWeight: '600', color: colors.textPrimary, minWidth: 60 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: colors.textPrimary },
    modalFooter: { flexDirection: 'row', gap: 10, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 },

    // Helpers
    flex1: { flex: 1 },
    rowGap8: { flexDirection: 'row', gap: 8 },
    paddedContainer: { flex: 1, padding: 16 },
    scrollContent: { paddingBottom: 100 },
    gridContent: { padding: 8 },
    iconRow: { flexDirection: 'row', gap: 4 },
    marginBottom12: { marginBottom: 12 },
    headerBack: { marginRight: 16 },

    // Specifics
    buttonText: { color: colors.buttonText },
    inputFlex: { flex: 1, marginBottom: 0 },
    textBtn: { padding: 8 },
    textBtnDanger: { color: colors.danger, fontWeight: '600' },
    textBtnAccent: { color: colors.accent, fontWeight: '600' },
    suggestionCode: { fontWeight: 'bold', fontSize: 16, color: colors.textPrimary },
    suggestionName: { fontSize: 12, color: colors.textSecondary },
    emptyFilteredText: { textAlign: 'center', marginTop: 20, color: colors.textSecondary },
    btnCancel: { flex: 1, backgroundColor: colors.subtleBackground },
    textPrimary: { color: colors.textPrimary },
    btnDanger: { marginTop: 8, backgroundColor: colors.danger },
    flexBtn: { flex: 1 },
    loader: { marginTop: 40 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

    // HELPERS
    bgDanger: { backgroundColor: colors.danger },
    bgAccent: { backgroundColor: colors.accent },
    justifyEnd: { justifyContent: 'flex-end' },
    inputLargeAccent: { fontSize: 18, fontWeight: 'bold', color: colors.accent },
    marginBottom8: { marginBottom: 8 },
});

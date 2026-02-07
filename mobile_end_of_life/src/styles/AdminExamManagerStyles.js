import { StyleSheet } from 'react-native';

export const createAdminExamManagerStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    title: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
    folderGridItem: { flex: 1, aspectRatio: 1, margin: 8, backgroundColor: colors.surface, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowOpacity: 0.05, elevation: 1 },
    folderIconLarge: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.subtleBackground, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    folderLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
    folderSubLabel: { fontSize: 10, color: colors.textSecondary },

    // Editor Header
    editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    editorTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
    saveLink: { fontSize: 16, fontWeight: '600', color: colors.accent },
    formSection: { backgroundColor: colors.surface, padding: 20, borderRadius: 16, marginBottom: 16 },
    label: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    input: { backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder, padding: 12, marginBottom: 12, fontSize: 14, color: colors.textPrimary },

    // Chips
    typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.subtleBackground, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
    activeTypeChip: { backgroundColor: colors.accent },
    typeChipText: { fontSize: 14, color: colors.textSecondary, fontWeight: '600' },

    // Exam Cards (List)
    examCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1 },
    examCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    examTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
    examSub: { fontSize: 12, color: colors.textSecondary },
    iconBtn: { padding: 4 },

    // Date Field
    dateField: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder },

    // Section Header (Editor Subjects)
    sectionHeader: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },

    // Date/Time
    row: { flexDirection: 'row', gap: 12 },
    dateTimeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.inputBackground, borderRadius: 8, borderWidth: 1, borderColor: colors.inputBorder, marginBottom: 12 },
    dateTimeText: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },

    // FAB & Empty
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', elevation: 6 },
    emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.subtleBackground, alignItems: 'center', justifyContent: 'center' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },

    // Display Row
    displayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
    displayDateBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.subtleBackground, alignItems: 'center', justifyContent: 'center' },
    ddDay: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
    ddMon: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' },
    ddCode: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
    ddPortion: { fontSize: 12, color: colors.textSecondary },
    ddTime: { fontSize: 11, color: colors.textSecondary, fontWeight: '500' },

    // Subject Edit Card
    subjectEditCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, marginBottom: 16, elevation: 1 },
    subjectHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    dateBadgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.subtleBackground, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    dateBadgeDay: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary },
    dateBadgeAuth: { fontSize: 11, fontWeight: 'bold', color: colors.accent },
    courseSelect: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder },
    timeInputBtn: { backgroundColor: colors.inputBackground, borderRadius: 10, borderWidth: 1, borderColor: colors.inputBorder, padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    timeInputText: { fontSize: 14, fontWeight: 'bold', color: colors.textPrimary },
    labelTiny: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
    addSubjectBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: colors.accent, borderRadius: 12, marginTop: 8, elevation: 2 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    pickerContent: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
    closeBtn: { backgroundColor: colors.accent, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
    courseItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.separator },

    // Time Picker
    timeDisplayBox: { padding: 16, backgroundColor: colors.subtleBackground, borderRadius: 12, minWidth: 60, alignItems: 'center' },
    timeDisplayText: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
    timeOption: { paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginVertical: 2 },
    activeTimeOption: { backgroundColor: colors.accent },
    activeTimeOptionText: { color: colors.buttonText, fontWeight: 'bold' },
    timeOptionText: { fontSize: 16, color: colors.textPrimary },
    colHeader: { textAlign: 'center', marginBottom: 8, color: colors.textSecondary, fontWeight: '600' },
    saveMainBtn: { backgroundColor: colors.accent, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
    saveMainBtnText: { color: colors.buttonText, fontWeight: 'bold', fontSize: 16 },

    // Helpers & Refactors
    flex1: { flex: 1 },
    editorContainer: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 16, paddingBottom: 100 },
    typeScrollContent: { paddingBottom: 4 },
    rowGap8: { flexDirection: 'row', gap: 8 },
    textButtonColor: { color: colors.buttonText },
    dateRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
    textStrongPrimary: { fontWeight: '600', color: colors.textPrimary },
    marginTop24: { marginTop: 24 },
    gap12: { gap: 12 },
    rowGap10: { flexDirection: 'row', gap: 10 },
    textBoldButton: { fontWeight: 'bold', color: colors.buttonText },
    modalMaxHeight: { maxHeight: '60%' },
    modalTitleLeft: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: colors.textPrimary },
    modalTitleCenter: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: colors.textPrimary },
    timeDisplayContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    timeColon: { fontSize: 24, fontWeight: 'bold', marginHorizontal: 8, color: colors.textPrimary },
    timePmBox: { marginLeft: 8, minWidth: 50 },
    fontSize18: { fontSize: 18 },
    timePickerColumns: { flexDirection: 'row', height: 200, marginBottom: 16 },
    flex08: { flex: 0.8 },
    ampmContainer: { justifyContent: 'center', gap: 8, flex: 1 },
    loader: { marginTop: 40 },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: colors.textSecondary, marginTop: 16, fontSize: 16 },
    iconRow: { flexDirection: 'row', gap: 4 },
    flexCenter: { flex: 1, justifyContent: 'center' },
    alignEnd: { alignItems: 'flex-end' },
    gridContent: { padding: 8 },
    emptyFolderText: { textAlign: 'center', marginTop: 20, color: colors.textSecondary },
    headerBack: { marginRight: 16 },
    subtitleSecondary: { fontSize: 12, color: colors.textSecondary },
    itemCode: { fontWeight: 'bold', color: colors.textPrimary },
    itemName: { fontSize: 12, color: colors.textSecondary },
    textSelectCourse: { fontSize: 16, fontWeight: '600' },
    textBasePlaceholder: { color: colors.placeholder },
    textBasePrimary: { color: colors.textPrimary },
});

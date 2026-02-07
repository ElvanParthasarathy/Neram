import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useGlobal } from '../context/GlobalContext';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function PreviewSystemModal({ visible, onClose }) {
    const { realProfile, setPreviewProfile, isPreviewing } = useGlobal();
    const { colors } = useTheme();
    const [hierarchy, setHierarchy] = useState({});
    const [selection, setSelection] = useState({ batch: "", department: "", section: "" });
    const [loading, setLoading] = useState(true);

    const styles = useMemo(() => createStyles(colors), [colors]);

    // Load Hierarchy
    useEffect(() => {
        if (!visible) return;
        setLoading(true);
        const hierarchyRef = ref(db, 'academic_hierarchy');
        const unsub = onValue(hierarchyRef, (snap) => {
            if (snap.exists()) {
                setHierarchy(snap.val());
            }
            setLoading(false);
        });
        return unsub;
    }, [visible]);

    // Initialize selection from real profile or existing preview
    useEffect(() => {
        if (visible && realProfile) {
            setSelection({
                batch: realProfile.batch || "",
                department: realProfile.department || "",
                section: realProfile.section || ""
            });
        }
    }, [visible, realProfile]);

    const handleApply = () => {
        if (selection.batch && selection.department && selection.section) {
            setPreviewProfile(selection);
            onClose();
        }
    };

    const handleReset = () => {
        setPreviewProfile(null);
        onClose();
    };

    // Custom Picker Item Component
    const PickerItem = ({ label, selected, onPress }) => (
        <TouchableOpacity
            style={[styles.pickerItem, selected && styles.pickerItemSelected]}
            onPress={onPress}
        >
            <Text style={[styles.pickerItemText, selected && styles.pickerItemTextSelected]}>
                {label}
            </Text>
            {selected && <Ionicons name="checkmark" size={16} color={colors.buttonText} />}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
                <View style={styles.container} onStartShouldSetResponder={() => true}>
                    <View style={styles.header}>
                        <Text style={styles.title}>System Preview</Text>
                        <Text style={styles.subtitle}>View app as Student/Faculty</Text>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
                    ) : (
                        <ScrollView contentContainerStyle={styles.content}>

                            {/* BATCH SELECTOR */}
                            <Text style={styles.label}>Academic Batch</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
                                {Object.keys(hierarchy).sort().reverse().map(batch => (
                                    <PickerItem
                                        key={batch}
                                        label={batch}
                                        selected={selection.batch === batch}
                                        onPress={() => setSelection({ batch, department: "", section: "" })}
                                    />
                                ))}
                            </ScrollView>

                            {/* DEPT SELECTOR */}
                            {selection.batch && hierarchy[selection.batch] && (
                                <>
                                    <Text style={styles.label}>Department</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
                                        {Object.keys(hierarchy[selection.batch]).filter(k => k !== 'initialized').map(dept => (
                                            <PickerItem
                                                key={dept}
                                                label={dept}
                                                selected={selection.department === dept}
                                                onPress={() => setSelection({ ...selection, department: dept, section: "" })}
                                            />
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                            {/* SECTION SELECTOR */}
                            {selection.department && hierarchy[selection.batch]?.[selection.department] && (
                                <>
                                    <Text style={styles.label}>Section</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
                                        {hierarchy[selection.batch][selection.department].map(sec => (
                                            <PickerItem
                                                key={sec}
                                                label={sec}
                                                selected={selection.section === sec}
                                                onPress={() => setSelection({ ...selection, section: sec })}
                                            />
                                        ))}
                                    </ScrollView>
                                </>
                            )}

                        </ScrollView>
                    )}

                    <View style={styles.footer}>
                        {isPreviewing && (
                            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                                <Text style={styles.resetBtnText}>Reset View</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.applyBtn, (!selection.section) && styles.applyBtnDisabled]}
                            onPress={handleApply}
                            disabled={!selection.section}
                        >
                            <Text style={styles.applyBtnText}>Apply Preview</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const createStyles = (colors) => StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    header: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
        flex: 1,
    },
    subtitle: {
        position: 'absolute',
        top: 50,
        left: 24,
        fontSize: 13,
        color: colors.textSecondary,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 12,
        marginTop: 4,
    },
    scrollRow: {
        marginBottom: 24,
        flexDirection: 'row',
    },
    pickerItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.subtleBackground, // Changed from background for better contrast
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pickerItemSelected: {
        backgroundColor: colors.accent, // Changed from primary
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    pickerItemText: {
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    pickerItemTextSelected: {
        color: colors.buttonText, // Changed from #fff
        fontWeight: '700',
    },
    footer: {
        padding: 24,
        paddingTop: 0,
        flexDirection: 'row',
        gap: 12,
    },
    applyBtn: {
        flex: 1,
        backgroundColor: colors.accent, // Changed from primary
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    applyBtnDisabled: {
        opacity: 0.5,
    },
    applyBtnText: {
        color: colors.buttonText, // Changed from #fff
        fontSize: 16,
        fontWeight: '700',
    },
    resetBtn: {
        backgroundColor: colors.surface, // Changed from #FEE2E2
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.danger,
    },
    resetBtnText: {
        color: colors.danger, // Changed from #EF4444
        fontWeight: '600',
    },
    loader: { marginVertical: 40 },
});

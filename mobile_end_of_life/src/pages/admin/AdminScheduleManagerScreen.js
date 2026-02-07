import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../../services/firebase';
import { ref, onValue, set } from 'firebase/database';
import { useTheme } from '../../context/ThemeContext';

import { createAdminScheduleManagerStyles } from '../../styles/AdminScheduleManagerStyles';

export default function AdminScheduleManagerScreen({ navigation }) {
    // --- 1. NAVIGATION STATE ---
    const { colors } = useTheme();
    const styles = useMemo(() => createAdminScheduleManagerStyles(colors), [colors]);
    const [path, setPath] = useState({}); // { batch, dept, sec }

    // --- 2. DATA STATE ---
    const [hierarchy, setHierarchy] = useState({});
    const [loadingHierarchy, setLoadingHierarchy] = useState(true);

    // Editor State
    const [masterData, setMasterData] = useState({
        courses: [],
        counseling: { counselors: [], coordinators: {} },
        timetable: {
            Tuesday: Array(7).fill(""), Wednesday: Array(7).fill(""),
            Thursday: Array(7).fill(""), Friday: Array(7).fill(""), Saturday: Array(7).fill("")
        }
    });
    const [loadingData, setLoadingData] = useState(false);
    const [activeTab, setActiveTab] = useState('courses'); // courses, timetable, counseling

    // Edit States
    const [isEditingTimetable, setIsEditingTimetable] = useState(false);
    const [timetableBuffer, setTimetableBuffer] = useState(null);
    const [smartEditorVisible, setSmartEditorVisible] = useState(false);
    const [tempCellValue, setTempCellValue] = useState("");
    const [currentCell, setCurrentCell] = useState(null); // { day, index }

    // Course Edit State
    const [newCourse, setNewCourse] = useState({ code: '', name: '', faculty: '', periods: '' });
    const [editingCourseIdx, setEditingCourseIdx] = useState(null);
    const [courseFormVisible, setCourseFormVisible] = useState(false);

    // Counseling State
    const [newCounselor, setNewCounselor] = useState("");
    const [editingCounselorIdx, setEditingCounselorIdx] = useState(null);
    const [tempCounselorName, setTempCounselorName] = useState("");

    // --- 3. FETCH HIERARCHY ---
    useEffect(() => {
        const hierarchyRef = ref(db, 'academic_hierarchy');
        const unsub = onValue(hierarchyRef, (snap) => {
            setHierarchy(snap.val() || {});
            setLoadingHierarchy(false);
        });
        return unsub;
    }, []);

    // --- 4. FETCH DATA ---
    useEffect(() => {
        if (path.batch && path.dept && path.sec) {
            setLoadingData(true);
            const scheduleRef = ref(db, `schedules/${path.batch}/${path.dept}/${path.sec}`);
            const unsub = onValue(scheduleRef, (snap) => {
                const data = snap.val() || {};
                setMasterData({
                    courses: data.courses || [],
                    counseling: {
                        counselors: data.counseling?.counselors || [],
                        coordinators: data.counseling?.coordinators || {}
                    },
                    timetable: data.timetable || {
                        Tuesday: Array(7).fill(""), Wednesday: Array(7).fill(""),
                        Thursday: Array(7).fill(""), Friday: Array(7).fill(""), Saturday: Array(7).fill("")
                    }
                });
                setLoadingData(false);
            });
            return unsub;
        }
    }, [path]);

    // --- SYNC DB ---
    const syncToDB = async (updatedData) => {
        try {
            await set(ref(db, `schedules/${path.batch}/${path.dept}/${path.sec}`), updatedData);
        } catch (err) { Alert.alert("Error", err.message); }
    };

    // --- LOGIC: TIMETABLE ---
    const startEditingTimetable = () => {
        setTimetableBuffer(JSON.parse(JSON.stringify(masterData.timetable)));
        setIsEditingTimetable(true);
    };

    const saveTimetableEdit = () => {
        syncToDB({ ...masterData, timetable: timetableBuffer });
        setIsEditingTimetable(false);
    };

    const openSmartCellEditor = (day, index, currentValue) => {
        setCurrentCell({ day, index });
        setTempCellValue(currentValue || "");
        setSmartEditorVisible(true);
    };

    const saveSmartCell = () => {
        if (currentCell) {
            const { day, index } = currentCell;
            const updatedDay = [...timetableBuffer[day]];
            updatedDay[index] = tempCellValue;
            setTimetableBuffer({ ...timetableBuffer, [day]: updatedDay });
            setSmartEditorVisible(false);
        }
    };

    const handleSmartSelect = (code) => {
        // Replace the last "word" (token) with the selected code
        // Regex finds the last sequence of non-separator chars
        const newVal = tempCellValue.replace(/[^/\s]*$/, code);
        setTempCellValue(newVal + " "); // Add space for convenience
    };

    // --- LOGIC: COURSES ---
    const handleAddCourse = () => {
        if (!newCourse.code || !newCourse.name) { Alert.alert("Error", "Code and Name required"); return; }
        const updatedList = editingCourseIdx !== null
            ? masterData.courses.map((c, i) => i === editingCourseIdx ? newCourse : c)
            : [...(masterData.courses || []), newCourse];

        syncToDB({ ...masterData, courses: updatedList });
        setNewCourse({ code: '', name: '', faculty: '', periods: '' });
        setEditingCourseIdx(null);
        setCourseFormVisible(false);
    };

    const deleteCourse = (index) => {
        const updated = masterData.courses.filter((_, i) => i !== index);
        syncToDB({ ...masterData, courses: updated });
    };

    const openCourseEditor = (course = null, index = null) => {
        if (course) {
            setNewCourse(course);
            setEditingCourseIdx(index);
        } else {
            setNewCourse({ code: '', name: '', faculty: '', periods: '' });
            setEditingCourseIdx(null);
        }
        setCourseFormVisible(true);
    };

    // --- LOGIC: COUNSELING ---
    const updateCoordinator = (role, val) => {
        const updated = { ...masterData.counseling, coordinators: { ...masterData.counseling.coordinators, [role]: val } };
        syncToDB({ ...masterData, counseling: updated });
    };

    const addCounselor = () => {
        if (!newCounselor) return;
        const updated = { ...masterData.counseling, counselors: [...(masterData.counseling.counselors || []), newCounselor] };
        syncToDB({ ...masterData, counseling: updated });
        setNewCounselor("");
    };

    const removeCounselor = (index) => {
        Alert.alert("Remove Counselor", "Are you sure you want to remove this counselor?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Remove",
                style: "destructive",
                onPress: () => {
                    const updated = { ...masterData.counseling, counselors: masterData.counseling.counselors.filter((_, i) => i !== index) };
                    syncToDB({ ...masterData, counseling: updated });
                }
            }
        ]);
    };

    const startEditingCounselor = (index, name) => {
        setEditingCounselorIdx(index);
        setTempCounselorName(name);
    };

    const saveCounselorEdit = () => {
        if (!tempCounselorName.trim()) {
            setEditingCounselorIdx(null);
            return;
        }
        const updatedList = [...masterData.counseling.counselors];
        updatedList[editingCounselorIdx] = tempCounselorName;
        const updated = { ...masterData.counseling, counselors: updatedList };
        syncToDB({ ...masterData, counseling: updated });
        setEditingCounselorIdx(null);
    };

    // --- RENDERERS ---
    const renderFolder = ({ item }) => (
        <TouchableOpacity style={styles.folderGridItem} onPress={item.onPress}>
            <View style={styles.folderIconLarge}><Ionicons name={item.icon || "folder"} size={32} color={colors.folderColor} /></View>
            <Text style={styles.folderLabel} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.folderSubLabel}>{item.sub}</Text>
        </TouchableOpacity>
    );

    const renderTimetable = () => {
        const data = isEditingTimetable ? timetableBuffer : masterData.timetable;
        // Web uses specific days: Tuesday to Saturday
        const days = ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        return (
            <View style={styles.flex1}>
                <View style={styles.toolbar}>
                    {isEditingTimetable ? (
                        <View style={styles.rowGap8}>
                            <TouchableOpacity style={[styles.btnSmall, styles.bgDanger]} onPress={() => setIsEditingTimetable(false)}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btnSmall, styles.bgAccent]} onPress={saveTimetableEdit}>
                                <Text style={styles.buttonText}>Save Updates</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.btnAction} onPress={startEditingTimetable}>
                            <Ionicons name="create-outline" size={18} color={colors.buttonText} />
                            <Text style={styles.btnActionText}>Edit Timetable</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {days.map(day => (
                        <View key={day} style={styles.dayCard}>
                            <Text style={styles.dayHeader}>{day}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={styles.rowGap8}>
                                    {(data[day] || Array(7).fill("")).map((cell, idx) => (
                                        <TouchableOpacity
                                            key={`${day}-${idx}`}
                                            style={[styles.periodCell, !cell && styles.periodEmpty]}
                                            disabled={!isEditingTimetable}
                                            onPress={() => openSmartCellEditor(day, idx, cell)}
                                        >
                                            <Text style={styles.pLabel}>P{idx + 1}</Text>
                                            <Text style={styles.pCode}>{cell || "-"}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderCourses = () => (
        <View style={styles.flex1}>
            <FlatList
                data={masterData.courses || []}
                keyExtractor={(item) => item.code || `course-${Math.random()}`}
                contentContainerStyle={styles.scrollContent}
                renderItem={({ item, index }) => (
                    <View style={styles.listItem}>
                        <View style={styles.flex1}>
                            <Text style={styles.itemTitle}>{item.code} - {item.name}</Text>
                            <Text style={styles.itemSub}>{item.faculty ? `${item.faculty} • ` : ''}{item.periods} Periods</Text>
                        </View>
                        <View style={styles.iconRow}>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => openCourseEditor(item, index)}>
                                <Ionicons name="pencil" size={18} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={() => deleteCourse(index)}>
                                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No courses added.</Text>}
            />
            <TouchableOpacity style={styles.fab} onPress={() => openCourseEditor()}>
                <Ionicons name="add" size={30} color={colors.buttonText} />
            </TouchableOpacity>
        </View>
    );

    const renderCounseling = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Coordinators */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Coordinators</Text>
                {['Class Advisor', 'Year Coordinator', 'Chairperson'].map(role => (
                    <View key={role} style={styles.marginBottom12}>
                        <Text style={styles.label}>{role}</Text>
                        <TextInput
                            style={styles.input}
                            value={masterData.counseling?.coordinators?.[role] || ""}
                            onChangeText={t => updateCoordinator(role, t)}
                            placeholder={`Enter ${role} Name`}
                        />
                    </View>
                ))}
            </View>

            {/* Counselors */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Counselors</Text>
                <View style={[styles.rowGap8, styles.marginBottom12]}>
                    <TextInput
                        style={[styles.input, styles.inputFlex]}
                        value={newCounselor}
                        onChangeText={setNewCounselor}
                        placeholder="Add Counselor Name"
                    />
                    <TouchableOpacity style={styles.btnSmall} onPress={addCounselor}>
                        <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.chipContainer}>
                    {(masterData.counseling?.counselors || []).map((c, i) => (
                        <View key={`${c}-${i}`} style={[styles.chip, editingCounselorIdx === i && styles.chipEditing]}>
                            {editingCounselorIdx === i ? (
                                <>
                                    <TextInput
                                        style={styles.chipInput}
                                        value={tempCounselorName}
                                        onChangeText={setTempCounselorName}
                                        autoFocus
                                        onBlur={saveCounselorEdit}
                                    />
                                    <TouchableOpacity onPress={saveCounselorEdit}>
                                        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity onPress={() => startEditingCounselor(i, c)}>
                                        <Text style={styles.chipText}>{c}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removeCounselor(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );

    // --- NAVIGATION HELPERS ---
    const updateLevel = (newPath) => setPath(newPath);
    const handleBack = () => {
        if (path.sec) updateLevel({ batch: path.batch, dept: path.dept });
        else if (path.dept) updateLevel({ batch: path.batch });
        else if (path.batch) updateLevel({});
        else navigation.goBack();
    };

    // --- MAIN RENDER ---
    let content;
    if (loadingHierarchy && !path.batch) {
        content = <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />;
    } else if (path.sec) {
        // EDITOR MODE
        content = (
            <View style={styles.flex1}>
                {/* Tabs */}
                <View style={styles.tabBar}>
                    {['courses', 'timetable', 'counseling'].map(t => (
                        <TouchableOpacity key={t} style={[styles.tabItem, activeTab === t && styles.activeTab]} onPress={() => setActiveTab(t)}>
                            <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.paddedContainer}>
                    {loadingData ? <ActivityIndicator size="large" color={colors.accent} /> : (
                        <>
                            {activeTab === 'timetable' && renderTimetable()}
                            {activeTab === 'courses' && renderCourses()}
                            {activeTab === 'counseling' && renderCounseling()}
                        </>
                    )}
                </View>
            </View>
        );
    } else {
        // NAVIGATION MODE
        let data = [];
        if (!path.batch) data = Object.keys(hierarchy).sort().reverse().map(b => ({ name: b, sub: 'Batch', icon: 'people', onPress: () => updateLevel({ batch: b }) }));
        else if (!path.dept) data = Object.keys(hierarchy[path.batch] || {}).filter(k => k !== 'initialized').map(d => ({ name: d, sub: 'Department', icon: 'grid', onPress: () => updateLevel({ batch: path.batch, dept: d }) }));
        else data = (hierarchy[path.batch]?.[path.dept] || []).map(s => ({ name: `Section ${s}`, sub: 'Manage Schedule', icon: 'list', onPress: () => updateLevel({ batch: path.batch, dept: path.dept, sec: s }) }));

        content = (
            <FlatList
                data={data}
                keyExtractor={item => item.name}
                renderItem={renderFolder}
                numColumns={3}
                contentContainerStyle={styles.gridContent}
                ListEmptyComponent={<Text style={styles.emptyText}>No data found.</Text>}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.headerBack}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.title}>{path.sec ? `Section ${path.sec}` : path.dept || "Schedule Manager"}</Text>
                    <Text style={styles.subtitle}>{path.sec ? `${path.batch} > ${path.dept}` : "Manage Class Schedules"}</Text>
                </View>
            </View>
            {content}

            {/* MODALS */}
            {/* Course Edit/Create */}
            <Modal visible={courseFormVisible} transparent animationType="slide" onRequestClose={() => setCourseFormVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{editingCourseIdx !== null ? 'Edit Course' : 'New Course'}</Text>
                        <TextInput style={styles.input} placeholder="Course Code" value={newCourse.code} onChangeText={t => setNewCourse({ ...newCourse, code: t })} />
                        <TextInput style={styles.input} placeholder="Course Name" value={newCourse.name} onChangeText={t => setNewCourse({ ...newCourse, name: t })} />
                        <TextInput style={styles.input} placeholder="Faculty Name" value={newCourse.faculty} onChangeText={t => setNewCourse({ ...newCourse, faculty: t })} />
                        <TextInput style={styles.input} placeholder="Periods per week" keyboardType="numeric" value={String(newCourse.periods)} onChangeText={t => setNewCourse({ ...newCourse, periods: t })} />

                        <TouchableOpacity style={styles.btnAction} onPress={handleAddCourse}>
                            <Text style={styles.btnActionText}>Save Course</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.btnAction, styles.btnDanger]} onPress={() => setCourseFormVisible(false)}>
                            <Text style={styles.btnActionText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Smart Timetable Cell Editor */}
            <Modal visible={smartEditorVisible} transparent animationType="slide" onRequestClose={() => setSmartEditorVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { maxHeight: '80%' }]}>
                        <Text style={styles.modalTitle}>Edit Slot: {currentCell?.day} - P{currentCell ? currentCell.index + 1 : ''}</Text>

                        <View style={styles.marginBottom12}>
                            <Text style={styles.label}>Entry (Type or Select)</Text>
                            <TextInput
                                style={[styles.input, styles.inputLargeAccent]}
                                value={tempCellValue}
                                onChangeText={setTempCellValue}
                                placeholder="e.g. 22EC101 / 22CS102"
                                autoFocus
                            />
                            <View style={[styles.rowGap8, styles.justifyEnd]}>
                                <TouchableOpacity onPress={() => setTempCellValue("")} style={styles.textBtn}>
                                    <Text style={styles.textBtnDanger}>Clear</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setTempCellValue(tempCellValue + " / ")} style={styles.textBtn}>
                                    <Text style={styles.textBtnAccent}>+ Add Split (/)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={[styles.label, styles.marginBottom8]}>Suggestions (Based on last word)</Text>
                        <FlatList
                            data={masterData.courses.filter(c => {
                                // Filter based on the last token being typed
                                const lastToken = tempCellValue.match(/[^/\s]*$/)?.[0] || "";
                                if (!lastToken) return true; // Show all if nothing typed for new token
                                return c.code.toLowerCase().includes(lastToken.toLowerCase()) || c.name.toLowerCase().includes(lastToken.toLowerCase());
                            })}
                            keyExtractor={(item, i) => i.toString()}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.listItem} onPress={() => handleSmartSelect(item.code)}>
                                    <View>
                                        <Text style={styles.suggestionCode}>{item.code}</Text>
                                        <Text style={styles.suggestionName}>{item.name}</Text>
                                    </View>
                                    <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyFilteredText}>No matching courses.</Text>}
                        />

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.btnAction, styles.btnCancel]} onPress={() => setSmartEditorVisible(false)}>
                                <Text style={[styles.btnActionText, styles.textPrimary]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btnAction, styles.flexBtn]} onPress={saveSmartCell}>
                                <Text style={styles.btnActionText}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}



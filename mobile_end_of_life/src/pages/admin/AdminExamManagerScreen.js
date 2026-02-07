import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../../services/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../../context/ThemeContext';

import { createAdminExamManagerStyles } from '../../styles/AdminExamManagerStyles';

// --- CONSTANTS ---
const PORTION_DEFAULTS = {
    'CT1': 'Unit 1',
    'IA1': 'Unit 1 & 2',
    'CT2': 'Unit 3',
    'IA2': 'Unit 3 & 4',
    'Model': 'Full Syllabus',
    'Practical': 'All Experiments',
    'Semester': 'Full Syllabus'
};

const EXAM_TYPES = Object.keys(PORTION_DEFAULTS);

// --- HELPERS ---
const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const formatDate = (dateObj) => {
    if (!dateObj) return "";
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    // If already in 12h format with AM/PM, just return it (maybe normalize spacing)
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;

    // Assume 24h "HH:mm" or "HH:mm:ss"
    const [h, m] = timeStr.split(':');
    if (!h || !m) return timeStr;

    let hour = parseInt(h);
    const minute = m;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
};

const formatDisplayDate = (isoDate) => {
    if (!isoDate) return "";
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const [y, m, d] = parts;
    return `${d}-${m}-${y}`;
};

export default function AdminExamManagerScreen({ navigation }) {
    // --- 1. NAVIGATION STATE ---
    const { colors } = useTheme();
    const styles = useMemo(() => createAdminExamManagerStyles(colors), [colors]);
    const [path, setPath] = useState({}); // { batch, dept, sec }

    // --- 2. DATA STATE ---
    const [hierarchy, setHierarchy] = useState({});
    const [loadingHierarchy, setLoadingHierarchy] = useState(true);

    // Editor State
    const [masterData, setMasterData] = useState({ courses: [], exams: [] });
    const [loadingData, setLoadingData] = useState(false);

    // View Management
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingExamId, setEditingExamId] = useState(null); // null = create new

    // Form State
    const [newExam, setNewExam] = useState({
        title: '',
        type: 'CT1',
        startDate: formatDate(new Date()),
        endDate: formatDate(new Date()),
        subjects: [] // { date, code, startTime, endTime, portion }
    });

    // Helpers State (Calendars/Pickers)
    const [calendarVisible, setCalendarVisible] = useState(false);
    const [calendarTarget, setCalendarTarget] = useState(null); // { field: 'start'|'end'|'row', index: null }
    const [courseModalVisible, setCourseModalVisible] = useState(false);
    const [courseTarget, setCourseTarget] = useState(null); // { index: 0 }

    // Time Picker State
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [timePickerTarget, setTimePickerTarget] = useState(null);
    const [tempTime, setTempTime] = useState({ h: '09', m: '00', p: 'AM' });


    // --- 3. FETCH HIERARCHY ---
    useEffect(() => {
        const hierarchyRef = ref(db, 'academic_hierarchy');
        const unsub = onValue(hierarchyRef, (snap) => {
            setHierarchy(snap.val() || {});
            setLoadingHierarchy(false);
        });
        return unsub;
    }, []);

    // --- 4. FETCH EXPLORER DATA ---
    useEffect(() => {
        if (path.batch && path.dept && path.sec) {
            setLoadingData(true);
            const scheduleRef = ref(db, `schedules/${path.batch}/${path.dept}/${path.sec}`);
            const unsub = onValue(scheduleRef, (snap) => {
                const data = snap.val() || {};
                setMasterData({
                    courses: data.courses || [],
                    exams: data.exams || []
                });
                setLoadingData(false);
            });
            return unsub;
        }
    }, [path]);

    // --- DB SYNC ---
    const syncExamsToDB = async (updatedExams) => {
        if (!path.sec) return;
        const savePath = `schedules/${path.batch}/${path.dept}/${path.sec}/exams`;
        try {
            await set(ref(db, savePath), updatedExams);
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    };

    // --- LOGIC: CREATE / EDIT ---
    const openEditor = (exam = null) => {
        if (exam) {
            setEditingExamId(exam.id);
            // Deep copy and ensure each subject has a unique key for Fabric stability
            const examCopy = JSON.parse(JSON.stringify(exam));
            if (examCopy.subjects) {
                examCopy.subjects = examCopy.subjects.map(s => ({
                    ...s,
                    key: s.key || `sub-${Date.now()}-${Math.random()}`
                }));
            }
            setNewExam(examCopy);
        } else {
            setEditingExamId(null);
            setNewExam({
                title: '', type: 'CT1',
                startDate: formatDate(new Date()), endDate: formatDate(new Date()),
                subjects: []
            });
        }
        setIsEditorOpen(true);
    };

    const handleSave = () => {
        if (!newExam.title || newExam.subjects.length === 0) {
            Alert.alert("Missing Details", "Title and at least one subject are required.");
            return;
        }

        let updatedList;
        if (editingExamId) {
            updatedList = (masterData.exams || []).map(e => e.id === editingExamId ? { ...newExam, id: editingExamId } : e);
        } else {
            updatedList = [...(masterData.exams || []), { ...newExam, id: Date.now() }];
        }

        syncExamsToDB(updatedList);
        setIsEditorOpen(false);
    };

    const handleDeleteExam = (id) => {
        Alert.alert("Delete", "Remove this entire timetable?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: () => {
                    const updated = (masterData.exams || []).filter(e => e.id !== id);
                    syncExamsToDB(updated);
                }
            }
        ]);
    };

    const addNewSubjectRow = () => {
        setNewExam({
            ...newExam,
            subjects: [...newExam.subjects, {
                key: `sub-${Date.now()}-${Math.random()}`,
                date: formatDate(new Date()),
                code: '', startTime: '09:30 AM', endTime: '12:30 PM', portion: PORTION_DEFAULTS[newExam.type]
            }]
        });
    };

    const handleTypeChange = (newType) => {
        const defaultPortion = PORTION_DEFAULTS[newType] || 'Full Syllabus';
        const updatedSubjects = newExam.subjects.map(s => ({ ...s, portion: defaultPortion }));
        setNewExam({ ...newExam, type: newType, subjects: updatedSubjects });
    };

    const openTimePicker = (index, field, currentValue) => {
        let h = '09', m = '00', p = 'AM';
        const formatted = formatTo12Hour(currentValue);

        if (formatted) {
            const parts = formatted.split(' ');
            if (parts.length === 2) {
                p = parts[1];
                const [oh, om] = parts[0].split(':');
                h = oh || '09'; m = om || '00';
            }
        }
        setTempTime({ h, m, p });
        setTimePickerTarget({ index, field });
        setTimePickerVisible(true);
    };

    const saveTimeSelection = () => {
        if (timePickerTarget) {
            const { index, field } = timePickerTarget;
            const s = [...newExam.subjects];
            s[index][field] = `${tempTime.h}:${tempTime.m} ${tempTime.p}`;
            setNewExam({ ...newExam, subjects: s });
        }
        setTimePickerVisible(false);
    };

    // --- NAVIGATION ---
    const updateLevel = (newPath) => setPath(newPath);
    const handleBack = () => {
        if (isEditorOpen) {
            setIsEditorOpen(false);
            return;
        }
        if (path.sec) updateLevel({ batch: path.batch, dept: path.dept });
        else if (path.dept) updateLevel({ batch: path.batch });
        else if (path.batch) updateLevel({});
        else navigation.goBack();
    };

    // --- RENDERERS ---
    const renderFolder = ({ item }) => (
        <TouchableOpacity style={styles.folderGridItem} onPress={item.onPress}>
            <View style={styles.folderIconLarge}>
                <Ionicons name={item.icon || "folder"} size={32} color={colors.folderColor} />
            </View>
            <Text style={styles.folderLabel} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.folderSubLabel}>{item.sub}</Text>
        </TouchableOpacity>
    );

    // --- FULL SCREEN EDITOR VIEW ---
    const renderEditorScreen = () => (
        <View style={styles.editorContainer}>
            <View style={styles.editorHeader}>
                <TouchableOpacity onPress={() => setIsEditorOpen(false)}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.editorTitle}>{editingExamId ? 'Edit Timetable' : 'New Timetable'}</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveLink}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Details Card */}
                <View style={styles.formSection}>
                    <Text style={styles.label}>Exam Title</Text>
                    <TextInput
                        style={styles.input}
                        value={newExam.title}
                        onChangeText={t => setNewExam({ ...newExam, title: t })}
                        placeholder="e.g. Model Exam 2"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.label}>Exam Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeScrollContent}>
                        <View style={styles.rowGap8}>
                            {EXAM_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.typeChip, newExam.type === t && styles.activeTypeChip]}
                                    onPress={() => handleTypeChange(t)}
                                >
                                    <Text style={[styles.typeChipText, newExam.type === t && styles.textButtonColor]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.dateRow}>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Starts</Text>
                            <TouchableOpacity style={styles.dateField} onPress={() => { setCalendarTarget({ field: 'start' }); setCalendarVisible(true); }}>
                                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                                <Text style={styles.textStrongPrimary}>{formatDisplayDate(newExam.startDate)}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.flex1}>
                            <Text style={styles.label}>Ends</Text>
                            <TouchableOpacity style={styles.dateField} onPress={() => { setCalendarTarget({ field: 'end' }); setCalendarVisible(true); }}>
                                <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                                <Text style={styles.textStrongPrimary}>{formatDisplayDate(newExam.endDate)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.marginTop24}>
                    <Text style={styles.sectionHeader}>Subjects</Text>
                    {newExam.subjects.map((sub, i) => (
                        <View key={sub.key || i} style={styles.subjectEditCard}>
                            <View style={styles.subjectHeaderRow}>
                                <TouchableOpacity style={styles.dateBadgeBtn} onPress={() => { setCalendarTarget({ field: 'row', index: i }); setCalendarVisible(true); }}>
                                    <Text style={styles.dateBadgeDay}>{parseDate(sub.date)?.getDate()}</Text>
                                    <Text style={styles.dateBadgeAuth}>{parseDate(sub.date)?.toLocaleString('default', { month: 'short' })}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { const s = [...newExam.subjects]; s.splice(i, 1); setNewExam({ ...newExam, subjects: s }); }}>
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.gap12}>
                                <TouchableOpacity style={styles.courseSelect} onPress={() => { setCourseTarget({ index: i }); setCourseModalVisible(true); }}>
                                    <Text style={[styles.textSelectCourse, sub.code ? styles.textBasePrimary : styles.textBasePlaceholder]}>{sub.code || "Select Course"}</Text>
                                    <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>

                                <TextInput
                                    style={styles.input}
                                    value={sub.portion}
                                    onChangeText={t => { const s = [...newExam.subjects]; s[i].portion = t; setNewExam({ ...newExam, subjects: s }); }}
                                    placeholder="Portion / Syllabus"
                                    placeholderTextColor={colors.textSecondary}
                                />

                                <View style={styles.rowGap10}>
                                    <View style={styles.flex1}>
                                        <Text style={styles.labelTiny}>Start Time</Text>
                                        <TouchableOpacity style={styles.timeInputBtn} onPress={() => openTimePicker(i, 'startTime', sub.startTime)}>
                                            <Text style={styles.timeInputText}>{formatTo12Hour(sub.startTime)}</Text>
                                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.flex1}>
                                        <Text style={styles.labelTiny}>End Time</Text>
                                        <TouchableOpacity style={styles.timeInputBtn} onPress={() => openTimePicker(i, 'endTime', sub.endTime)}>
                                            <Text style={styles.timeInputText}>{formatTo12Hour(sub.endTime)}</Text>
                                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.addSubjectBtn} onPress={addNewSubjectRow}>
                        <Ionicons name="add-circle" size={20} color={colors.buttonText} />
                        <Text style={styles.textBoldButton}>Add Subject</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* NESTED PICKER MODALS */}
            <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContent}>
                        <Calendar
                            onDayPress={day => {
                                const { dateString } = day;
                                if (calendarTarget.field === 'start') setNewExam({ ...newExam, startDate: dateString });
                                else if (calendarTarget.field === 'end') setNewExam({ ...newExam, endDate: dateString });
                                else { const s = [...newExam.subjects]; s[calendarTarget.index].date = dateString; setNewExam({ ...newExam, subjects: s }); }
                                setCalendarVisible(false);
                            }}
                            theme={{
                                backgroundColor: colors.surface,
                                calendarBackground: colors.surface,
                                textSectionTitleColor: colors.textSecondary,
                                selectedDayBackgroundColor: colors.accent,
                                selectedDayTextColor: colors.buttonText,
                                todayTextColor: colors.accent,
                                dayTextColor: colors.textPrimary,
                                textDisabledColor: colors.textSecondary + '40',
                                arrowColor: colors.accent,
                                monthTextColor: colors.textPrimary,
                            }}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setCalendarVisible(false)}><Text style={styles.textButtonColor}>Close</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={courseModalVisible} transparent animationType="slide" onRequestClose={() => setCourseModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.pickerContent, styles.modalMaxHeight]}>
                        <Text style={styles.modalTitleLeft}>Select Course</Text>
                        <FlatList
                            data={masterData.courses || []}
                            keyExtractor={item => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.courseItem}
                                    onPress={() => {
                                        const s = [...newExam.subjects];
                                        s[courseTarget.index].code = item.code;
                                        setNewExam({ ...newExam, subjects: s });
                                        setCourseModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.itemCode}>{item.code}</Text>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.closeBtn} onPress={() => setCourseModalVisible(false)}><Text style={styles.textButtonColor}>Cancel</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* TIME PICKER MODAL (12H) */}
            <Modal visible={timePickerVisible} transparent animationType="slide" onRequestClose={() => setTimePickerVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.modalTitleCenter}>Select Time</Text>

                        <View style={styles.timeDisplayContainer}>
                            <View style={styles.timeDisplayBox}><Text style={styles.timeDisplayText}>{tempTime.h}</Text></View>
                            <Text style={styles.timeColon}>:</Text>
                            <View style={styles.timeDisplayBox}><Text style={styles.timeDisplayText}>{tempTime.m}</Text></View>
                            <View style={[styles.timeDisplayBox, styles.timePmBox]}><Text style={[styles.timeDisplayText, styles.fontSize18]}>{tempTime.p}</Text></View>
                        </View>

                        <View style={styles.timePickerColumns}>
                            {/* Hour (01-12) */}
                            <View style={styles.flex1}>
                                <Text style={styles.colHeader}>Hour</Text>
                                <FlatList
                                    data={Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))}
                                    keyExtractor={i => i}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={[styles.timeOption, tempTime.h === item && styles.activeTimeOption]} onPress={() => setTempTime({ ...tempTime, h: item })}>
                                            <Text style={[styles.timeOptionText, tempTime.h === item && styles.activeTimeOptionText]}>{item}</Text>
                                        </TouchableOpacity>
                                    )}
                                    showsVerticalScrollIndicator={false}
                                />
                            </View>
                            {/* Minute */}
                            <View style={styles.flex1}>
                                <Text style={styles.colHeader}>Minute</Text>
                                <FlatList
                                    data={Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))}
                                    keyExtractor={i => i}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={[styles.timeOption, tempTime.m === item && styles.activeTimeOption]} onPress={() => setTempTime({ ...tempTime, m: item })}>
                                            <Text style={[styles.timeOptionText, tempTime.m === item && styles.activeTimeOptionText]}>{item}</Text>
                                        </TouchableOpacity>
                                    )}
                                    showsVerticalScrollIndicator={false}
                                />
                            </View>
                            {/* Period */}
                            <View style={styles.flex08}>
                                <Text style={styles.colHeader}>AM/PM</Text>
                                <View style={styles.ampmContainer}>
                                    {['AM', 'PM'].map(p => (
                                        <TouchableOpacity key={p} style={[styles.timeOption, tempTime.p === p && styles.activeTimeOption]} onPress={() => setTempTime({ ...tempTime, p })}>
                                            <Text style={[styles.timeOptionText, tempTime.p === p && styles.activeTimeOptionText]}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.saveMainBtn} onPress={saveTimeSelection}>
                            <Text style={styles.saveMainBtnText}>Confirm Time</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );

    // --- MAIN RENDER ---
    // Note: We avoid top-level conditional returns of the root SafeAreaView 
    // to prevent Fabric view tag conflicts during transitions.

    // LIST VIEW CONTENT (MATCHING EVENT MANAGER)
    let content;
    if (loadingHierarchy && !path.batch) {
        content = <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />;
    } else if (path.sec) {
        // --- LIST VIEW ---
        content = (
            <View style={styles.flex1}>
                {loadingData ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                ) : (
                    <FlatList
                        data={masterData.exams || []}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={styles.scrollContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIcon}><Ionicons name="calendar-outline" size={40} color={colors.textSecondary} /></View>
                                <Text style={styles.emptyText}>No timetables yet.</Text>
                            </View>
                        }
                        renderItem={({ item }) => (
                            <View style={styles.examCard}>
                                <View style={styles.examCardHeader}>
                                    <View>
                                        <Text style={styles.examTitle}>{item.title}</Text>
                                        <Text style={styles.examSub}>{formatDisplayDate(item.startDate)} - {formatDisplayDate(item.endDate)} • {item.type}</Text>
                                    </View>
                                    <View style={styles.iconRow}>
                                        <TouchableOpacity onPress={() => openEditor(item)} style={styles.iconBtn}>
                                            <Ionicons name="pencil" size={20} color={colors.textPrimary} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteExam(item.id)} style={styles.iconBtn}>
                                            <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {(item.subjects || []).map((sub, idx) => (
                                    <View key={idx} style={styles.displayRow}>
                                        <View style={styles.displayDateBox}>
                                            <Text style={styles.ddDay}>{parseDate(sub.date)?.getDate()}</Text>
                                            <Text style={styles.ddMon}>{parseDate(sub.date)?.toLocaleString('default', { month: 'short' })}</Text>
                                        </View>
                                        <View style={styles.flexCenter}>
                                            <Text style={styles.ddCode}>{sub.code}</Text>
                                            <Text style={styles.ddPortion} numberOfLines={1}>{sub.portion}</Text>
                                        </View>
                                        <View style={styles.alignEnd}>
                                            <Text style={styles.ddTime}>{formatTo12Hour(sub.startTime)}</Text>
                                            <Text style={styles.ddTime}>{formatTo12Hour(sub.endTime)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    />
                )}
                <TouchableOpacity style={styles.fab} onPress={() => openEditor(null)}>
                    <Ionicons name="add" size={30} color={colors.buttonText} />
                </TouchableOpacity>
            </View>
        );
    } else {
        // FOLDER NAVIGATION
        let data = [];
        if (!path.batch) {
            data = Object.keys(hierarchy).sort().reverse().map(b => ({ name: b, sub: 'Batch', icon: 'people', onPress: () => updateLevel({ batch: b }) }));
        } else if (!path.dept) {
            const depts = hierarchy[path.batch] || {};
            data = Object.keys(depts).filter(k => k !== 'initialized').map(d => ({ name: d, sub: 'Department', icon: 'grid', onPress: () => updateLevel({ batch: path.batch, dept: d }) }));
        } else {
            const secs = hierarchy[path.batch]?.[path.dept] || [];
            data = secs.map(s => ({ name: `Section ${s}`, sub: 'Manage Exams', icon: 'list', onPress: () => updateLevel({ batch: path.batch, dept: path.dept, sec: s }) }));
        }

        content = (
            <FlatList
                data={data}
                keyExtractor={item => item.name}
                renderItem={renderFolder}
                numColumns={3}
                contentContainerStyle={styles.gridContent}
                ListEmptyComponent={<Text style={styles.emptyFolderText}>No data found.</Text>}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'top']}>
            {isEditorOpen ? (
                renderEditorScreen()
            ) : (
                <>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleBack} style={styles.headerBack}>
                            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.title}>{path.sec ? `Sec ${path.sec}` : path.dept || path.batch || "Exams"}</Text>
                            <Text style={styles.subtitleSecondary}>
                                {path.sec ? `${path.batch} > ${path.dept}` : "Navigation"}
                            </Text>
                        </View>
                    </View>
                    {content}
                </>
            )}
        </SafeAreaView>
    );
}



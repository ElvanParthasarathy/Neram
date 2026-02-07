import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Alert, Modal, Switch, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { db } from '../../services/firebase';
import { ref, onValue, set } from 'firebase/database';
import { Calendar } from 'react-native-calendars';
import { useTheme } from '../../context/ThemeContext';

import { createAdminEventManagerStyles } from '../../styles/AdminEventManagerStyles';

// Helper for date conversion
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
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
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

export default function AdminEventManagerScreen({ navigation }) {
    // --- 1. NAVIGATION STATE ---
    const { colors } = useTheme();
    const styles = useMemo(() => createAdminEventManagerStyles(colors), [colors]);
    // Path: null (root) -> { batch } -> { batch, dept } -> { batch, dept, sec }
    const [path, setPath] = useState({});
    // viewLevel derived from path keys: 'batches' -> 'depts' -> 'secs' -> 'editor'

    // --- 2. DATA STATE ---
    const [hierarchy, setHierarchy] = useState({});
    const [loadingHierarchy, setLoadingHierarchy] = useState(true);

    // Editor State
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingEventId, setEditingEventId] = useState(null); // null = create

    // Form State
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: formatDate(new Date()),
        type: 'Event', // Event, FullDay, HalfDay
        description: '',
        startTime: '09:00',
        endTime: '12:00'
    });
    const [showCalendar, setShowCalendar] = useState(false);

    // Time Picker State
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [timePickerTarget, setTimePickerTarget] = useState(null); // 'startTime' | 'endTime'
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

    // --- 4. FETCH EVENTS (When in Editor Mode) ---
    useEffect(() => {
        if (path.batch && path.dept && path.sec) {
            setLoadingEvents(true);
            const eventsRef = ref(db, `events/${path.batch}/${path.dept}/${path.sec}`);
            const unsub = onValue(eventsRef, (snap) => {
                const data = snap.val() || [];
                // Firebase array vs object handling
                const loadedEvents = Array.isArray(data) ? data : Object.values(data);
                setEvents(loadedEvents.sort((a, b) => new Date(a.date) - new Date(b.date)));
                setLoadingEvents(false);
            });
            return unsub;
        }
    }, [path]);

    // --- DB SYNC HELPER ---
    const syncToDB = async (updatedList) => {
        if (!path.sec) return;
        const savePath = `events/${path.batch}/${path.dept}/${path.sec}`;
        try {
            await set(ref(db, savePath), updatedList);
        } catch (err) {
            Alert.alert("Error", err.message);
        }
    };

    // --- ACTIONS ---
    const openEditor = (event = null) => {
        if (event) {
            setEditingEventId(event.id);
            setNewEvent({
                title: event.title || '',
                date: event.date || formatDate(new Date()),
                type: event.type || 'Event',
                description: event.description || '',
                startTime: event.startTime || '09:00 AM',
                endTime: event.endTime || '12:00 PM'
            });
        } else {
            setEditingEventId(null);
            resetForm();
        }
        setModalVisible(true);
    };

    const handleSaveEvent = () => {
        if (!newEvent.title || !newEvent.date) {
            Alert.alert("Required", "Title and Date are required!");
            return;
        }

        const payload = {
            id: editingEventId || Date.now().toString(),
            title: newEvent.title,
            date: newEvent.date,
            type: newEvent.type,
            description: newEvent.description
        };

        if (newEvent.type === 'HalfDay') {
            payload.startTime = newEvent.startTime;
            payload.endTime = newEvent.endTime;
        }

        let updatedList;
        if (editingEventId) {
            // Update existing
            updatedList = events.map(e => e.id === editingEventId ? { ...payload, id: editingEventId } : e);
        } else {
            // Create new
            updatedList = [...events, payload];
        }

        syncToDB(updatedList);
        setModalVisible(false);
        resetForm();
    };

    const handleDelete = (id) => {
        Alert.alert("Delete Event", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive", onPress: () => {
                    const updated = events.filter(e => e.id !== id);
                    syncToDB(updated);
                }
            }
        ]);
    };

    const resetForm = () => {
        setNewEvent({
            title: '',
            date: formatDate(new Date()),
            type: 'Event',
            description: '',
            startTime: '09:00 AM',
            endTime: '12:00 PM'
        });
    };

    const openTimePicker = (field, currentValue) => {
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
        setTimePickerTarget(field);
        setTimePickerVisible(true);
    };

    const saveTimeSelection = () => {
        if (timePickerTarget) {
            const timeStr = `${tempTime.h}:${tempTime.m} ${tempTime.p}`;
            setNewEvent({ ...newEvent, [timePickerTarget]: timeStr });
        }
        setTimePickerVisible(false);
    };

    // --- NAVIGATION HELPERS ---
    const updateLevel = (newPath) => {
        setPath(newPath);
    };

    const handleBack = () => {
        if (path.sec) updateLevel({ batch: path.batch, dept: path.dept }); // Go to Secs
        else if (path.dept) updateLevel({ batch: path.batch }); // Go to Depts
        else if (path.batch) updateLevel({}); // Go to Batches
        else navigation.goBack(); // Exit
    };

    const getTitle = () => {
        if (path.sec) return `Sec ${path.sec}`;
        if (path.dept) return path.dept;
        if (path.batch) return `Batch ${path.batch}`;
        return "Events";
    };

    const getSubtitle = () => {
        if (path.sec) return `${path.batch} > ${path.dept}`;
        if (path.dept) return `${path.batch} > Select Section`;
        if (path.batch) return "Select Department";
        return "Select Batch";
    };

    const getEventColors = (type) => {
        switch (type) {
            case 'FullDay': return { bg: colors.accent + '15', text: colors.accent };
            case 'HalfDay': return { bg: colors.warning + '15', text: colors.warning };
            default: return { bg: colors.success + '15', text: colors.success };
        }
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

    const renderEventItem = ({ item }) => {
        const { bg, text } = getEventColors(item.type);
        return (
            <View style={styles.card}>
                <View style={[styles.cardLeft, { backgroundColor: bg }]}>
                    <Text style={[styles.dateDay, { color: text }]}>
                        {item.date.split('-')[2]}
                    </Text>
                    <Text style={[styles.dateMonth, { color: text }]}>
                        {new Date(item.date).toLocaleString('default', { month: 'short' })}
                    </Text>
                </View>
                <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={styles.rowGap6}>
                        <View style={[styles.typeBadge, { backgroundColor: bg }]}>
                            <Text style={[styles.textSmallBold, { color: text }]}>{item.type}</Text>
                        </View>
                        {item.type === 'HalfDay' && (
                            <Text style={styles.cardSubtitle}>{formatTo12Hour(item.startTime)} - {formatTo12Hour(item.endTime)}</Text>
                        )}
                    </View>
                    {item.description ? <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text> : null}
                </View>
                <View style={styles.paddingRight8}>
                    <TouchableOpacity onPress={() => openEditor(item)} style={styles.iconBtn}>
                        <Ionicons name="pencil" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // --- MAIN VIEW LOGIC ---
    let content;
    if (loadingHierarchy && !path.batch) {
        content = <ActivityIndicator size="large" color={colors.primary} style={styles.marginTop40} />;
    } else if (path.sec) {
        // EDITOR MODE
        content = (
            <View style={styles.flex1}>
                {loadingEvents ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.marginTop40} />
                ) : (
                    <FlatList
                        data={events}
                        keyExtractor={(item) => item.id}
                        renderItem={renderEventItem}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={<Text style={styles.emptyText}>No events scheduled.</Text>}
                    />
                )}
                <TouchableOpacity style={styles.fab} onPress={() => openEditor(null)}>
                    <Ionicons name="add" size={30} color={colors.buttonText} />
                </TouchableOpacity>
            </View>
        );
    } else {
        // NAVIGATOR MODE
        let data = [];
        if (!path.batch) {
            // Batches
            data = Object.keys(hierarchy).sort().reverse().map(b => ({
                name: b, sub: 'Batch', icon: 'people', onPress: () => updateLevel({ batch: b })
            }));
        } else if (!path.dept) {
            // Depts
            const depts = hierarchy[path.batch] || {};
            data = Object.keys(depts).filter(k => k !== 'initialized').map(d => ({
                name: d, sub: 'Department', icon: 'grid', onPress: () => updateLevel({ batch: path.batch, dept: d })
            }));
        } else {
            // Sections
            const secs = hierarchy[path.batch]?.[path.dept] || [];
            data = secs.map(s => ({
                name: `Section ${s}`, sub: 'Manage Events', icon: 'list', onPress: () => updateLevel({ batch: path.batch, dept: path.dept, sec: s })
            }));
        }

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
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.flex1}>
                    <Text style={styles.title}>{getTitle()}</Text>
                    <Text style={styles.subtitle}>{getSubtitle()}</Text>
                </View>
            </View>

            {content}

            {/* CREATE MODAL */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editingEventId ? 'Edit Event' : 'New Event'}</Text>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={[styles.textCancel, { color: colors.accent }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.form}>
                        {/* Title */}
                        <Text style={styles.label}>Event Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Class Party"
                            value={newEvent.title}
                            onChangeText={t => setNewEvent({ ...newEvent, title: t })}
                        />

                        {/* Date */}
                        <Text style={styles.label}>Date: {formatDisplayDate(newEvent.date)}</Text>
                        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowCalendar(!showCalendar)}>
                            <Ionicons name="calendar" size={20} color={colors.accent} />
                            <Text style={styles.dateBtnText}>{formatDisplayDate(newEvent.date)}</Text>
                        </TouchableOpacity>
                        {showCalendar && (
                            <Calendar
                                current={newEvent.date}
                                onDayPress={day => {
                                    setNewEvent({ ...newEvent, date: day.dateString });
                                    setShowCalendar(false);
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
                        )}

                        {/* Type */}
                        <Text style={styles.label}>Event Type</Text>
                        <View style={styles.typeRow}>
                            {[
                                { id: 'Event', label: 'Regular' },
                                { id: 'FullDay', label: 'Full Day' },
                                { id: 'HalfDay', label: 'Half Day' }
                            ].map(t => {
                                const { bg, text } = getEventColors(t.id);
                                const isActive = newEvent.type === t.id;
                                return (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[styles.typeChip, isActive && { borderColor: text, backgroundColor: bg }]}
                                        onPress={() => setNewEvent({ ...newEvent, type: t.id })}
                                    >
                                        <Text style={[styles.typeChipText, isActive && { color: text }]}>{t.label}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>

                        {/* Half Day Times */}
                        {newEvent.type === 'HalfDay' && (
                            <View style={styles.halfDayBox}>
                                <View style={styles.rowGap12}>
                                    <View style={styles.flex1}>
                                        <Text style={styles.labelSmall}>Start Time</Text>
                                        <TouchableOpacity style={styles.timeInputBtn} onPress={() => openTimePicker('startTime', newEvent.startTime)}>
                                            <Text style={styles.timeInputText}>{formatTo12Hour(newEvent.startTime)}</Text>
                                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.flex1}>
                                        <Text style={styles.labelSmall}>End Time</Text>
                                        <TouchableOpacity style={styles.timeInputBtn} onPress={() => openTimePicker('endTime', newEvent.endTime)}>
                                            <Text style={styles.timeInputText}>{formatTo12Hour(newEvent.endTime)}</Text>
                                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <Text style={styles.infoText}>
                                    <Ionicons name="information-circle" size={14} /> Schedule visible + Event Badge.
                                </Text>
                            </View>
                        )}

                        {/* Description */}
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.inputTextArea]}
                            placeholder="Optional details..."
                            multiline
                            value={newEvent.description}
                            onChangeText={t => setNewEvent({ ...newEvent, description: t })}
                        />

                        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEvent}>
                            <Ionicons name={editingEventId ? "save" : "add"} size={20} color={colors.buttonText} style={styles.marginRight8} />
                            <Text style={styles.saveBtnText}>{editingEventId ? 'Save Changes' : 'Add to Section Calendar'}</Text>
                        </TouchableOpacity>
                        <View style={styles.height40} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            {/* TIME PICKER MODAL (12H) */}
            <Modal visible={timePickerVisible} transparent animationType="slide" onRequestClose={() => setTimePickerVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Select Time</Text>

                        <View style={styles.pickerRow}>
                            <View style={styles.timeDisplayBox}><Text style={styles.timeDisplayText}>{tempTime.h}</Text></View>
                            <Text style={styles.pickerColon}>:</Text>
                            <View style={styles.timeDisplayBox}><Text style={styles.timeDisplayText}>{tempTime.m}</Text></View>
                            <View style={[styles.timeDisplayBox, styles.marginLeft8MinWidth50]}><Text style={[styles.timeDisplayText, styles.fontSize18]}>{tempTime.p}</Text></View>
                        </View>

                        <View style={styles.pickerColumns}>
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
                                <View style={styles.columnContent}>
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
        </SafeAreaView>
    );
}



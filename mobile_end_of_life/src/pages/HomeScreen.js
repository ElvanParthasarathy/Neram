import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, Modal, TextInput, Alert, ActivityIndicator, Image, Pressable, ScrollView } from 'react-native';
import AnimatedPressable from '../components/AnimatedPressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { createHomeStyles } from '../styles/HomeStyles';
import { Calendar } from 'react-native-calendars';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../services/firebase';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatDateFull, formatTime, formatTimeRange } from '../utils/formatters';
import { FlashList } from '@shopify/flash-list';
import { ScheduleItem, UpdatesItem, GeneralNoticeItem, FooterItem } from '../components/HomeListItems';

// Helper to format date for DB keys (YYYY-MM-DD)
const formatDateKey = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function HomeScreen({ navigation }) {
    const { masterData, allCalendar, sectionUpdates, userProfile, isSyncing, isOffline } = useGlobal();
    const { colors } = useTheme();
    const styles = useMemo(() => createHomeStyles(colors), [colors]);

    // --- STATE ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    // Schedule Logic State
    const [dayOrder, setDayOrder] = useState("");
    const [scheduleStatus, setScheduleStatus] = useState("");

    // Events State
    const [globalEvents, setGlobalEvents] = useState([]);
    const [sectionEvents, setSectionEvents] = useState([]);
    const [areEventsLoading, setAreEventsLoading] = useState(true);

    const [activeExamPeriod, setActiveExamPeriod] = useState(null);
    const [activeExamToday, setActiveExamToday] = useState(null);

    // --- PLACEMENT SELECTOR STATE ---
    const [placementModalVisible, setPlacementModalVisible] = useState(false);
    const [hierarchy, setHierarchy] = useState({});
    const [tempPlacement, setTempPlacement] = useState({ batch: '', dept: '', sec: '' });
    const [isSavingPlacement, setIsSavingPlacement] = useState(false);

    // --- ADMIN EDITING STATE ---
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [tempNote, setTempNote] = useState("");

    const [isEditingGeneral, setIsEditingGeneral] = useState(false);
    const [tempGeneral, setTempGeneral] = useState("");

    const [isSaving, setIsSaving] = useState(false);

    const todayStr = useMemo(() => formatDateKey(currentDate), [currentDate]);

    // --- MERGE LOGIC (Web Parity) ---
    const todayEvents = useMemo(() => {
        const combined = [...globalEvents, ...sectionEvents];
        return Array.from(new Map(combined.map(item => [item.id || item.title, item])).values());
    }, [globalEvents, sectionEvents]);

    // --- 1. RESOLVE CALENDAR & DAY ORDER ---
    useEffect(() => {
        if (!allCalendar || !masterData) return;

        const events = allCalendar.filter((e) => e.date === todayStr);
        setGlobalEvents(events);

        const currentPeriod = masterData.exams?.find(ex => todayStr >= ex.startDate && todayStr <= ex.endDate);
        setActiveExamPeriod(currentPeriod || null);

        if (currentPeriod) {
            const subToday = currentPeriod.subjects?.find(s => s.date === todayStr);
            setActiveExamToday(subToday ? { ...currentPeriod, todaySub: subToday } : null);
        } else {
            setActiveExamToday(null);
        }

        const weekdayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        const holidayEvent = events.find(e => e.title.toLowerCase().includes("holiday"));
        const manualOrderEvent = events.find(e => e.title.toLowerCase().includes("order"));

        let resolvedOrder = "";
        let resolvedStatus = "";

        if (holidayEvent) {
            resolvedOrder = "";
            resolvedStatus = `Holiday: ${holidayEvent.title}`;
        } else if (manualOrderEvent) {
            const foundDay = ["Monday", ...daysOrder].find(day => manualOrderEvent.title.includes(day));
            if (foundDay) {
                resolvedOrder = foundDay;
                resolvedStatus = `Following ${foundDay} Order`;
            } else {
                resolvedOrder = weekdayName === "Sunday" ? "" : weekdayName;
                resolvedStatus = `Regular ${resolvedOrder}`;
            }
        } else {
            if (weekdayName === "Sunday") {
                resolvedOrder = "";
                resolvedStatus = "Sunday (Holiday)";
            } else {
                resolvedOrder = weekdayName;
                resolvedStatus = `Regular ${weekdayName}`;
            }
        }
        setDayOrder(resolvedOrder);
        setScheduleStatus(resolvedStatus);

    }, [currentDate, allCalendar, masterData, todayStr]);

    // --- 2. FETCH SECTION SPECIFIC EVENTS ---
    useEffect(() => {
        if (userProfile?.section && todayStr) {
            setAreEventsLoading(true);
            const { batch, department, section } = userProfile;
            const sectionEventsRef = ref(db, `events/${batch}/${department}/${section}`);

            const unsub = onValue(sectionEventsRef, (snap) => {
                const data = snap.val() || [];
                const eventsList = Array.isArray(data) ? data : Object.values(data);
                const todaysSpecialEvents = eventsList.filter(e => e.date === todayStr);
                setSectionEvents(todaysSpecialEvents);
                setAreEventsLoading(false);
            });

            return () => unsub();
        } else {
            setSectionEvents([]);
            setAreEventsLoading(false);
        }
    }, [userProfile, todayStr]);

    // --- 2.5 FORCE PLACEMENT SELECTION ---
    useEffect(() => {
        const hierarchyRef = ref(db, 'academic_hierarchy');
        const unsub = onValue(hierarchyRef, (snap) => setHierarchy(snap.val() || {}));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (userProfile && (!userProfile.batch || !userProfile.department || !userProfile.section)) {
            setPlacementModalVisible(true);
        } else {
            setPlacementModalVisible(false);
        }
    }, [userProfile]);

    const handleSavePlacement = async () => {
        if (!tempPlacement.batch || !tempPlacement.dept || !tempPlacement.sec) return;
        setIsSavingPlacement(true);
        try {
            await update(ref(db, `users/${userProfile.uid}`), {
                batch: tempPlacement.batch,
                department: tempPlacement.dept,
                section: tempPlacement.sec
            });
            Alert.alert("Success", "Profile updated!");
            setPlacementModalVisible(false);
        } catch (err) {
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setIsSavingPlacement(false);
        }
    };


    // --- 3. COURSE RESOLVER ---
    const getSubjectName = useCallback((code) => {
        return masterData.courses?.find(c => c.code === code)?.name || "General Subject";
    }, [masterData]);

    const getPeriodDetails = useCallback((cellContent) => {
        if (!cellContent || !masterData.courses) return { name: cellContent, faculty: "", code: cellContent };

        if (cellContent.includes("/")) {
            const parts = cellContent.split("/");
            const results = parts.map(part => {
                const trimmedPart = part.trim();
                const pureCode = trimmedPart.split(" ")[0];
                const course = masterData.courses.find(c => c.code === pureCode);
                return course
                    ? { name: course.name, faculty: course.faculty }
                    : { name: trimmedPart, faculty: "" };
            });

            return {
                name: results.map(r => r.name).join(" / "),
                faculty: results.map(r => r.faculty).join(" / "),
                code: cellContent
            };
        }

        const pureCode = cellContent.split(" ")[0].trim();
        const course = masterData.courses.find((c) => c.code === pureCode);
        return course
            ? { ...course, code: cellContent }
            : { name: cellContent, faculty: "", code: cellContent };
    }, [masterData]);

    // --- 4. ADMIN ACTIONS ---
    const handleSaveNote = async () => {
        if (!userProfile) return;
        const { batch, department, section } = userProfile;
        setIsSaving(true);
        try {
            await update(ref(db, `updates/${batch}/${department}/${section}/live_daily/${todayStr}`), {
                note: tempNote,
                author: userProfile.displayName || "Admin"
            });
            setIsEditingNote(false);
        } catch (error) {
            Alert.alert("Error", "Failed to updates.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveGeneral = async () => {
        if (!userProfile) return;
        const { batch, department, section } = userProfile;
        setIsSaving(true);
        try {
            await update(ref(db, `updates/${batch}/${department}/${section}`), {
                general_text: tempGeneral,
                general_author: userProfile.displayName || "Admin"
            });
            setIsEditingGeneral(false);
        } catch (error) {
            Alert.alert("Error", "Failed to save notice.");
        } finally {
            setIsSaving(false);
        }
    };

    // --- DETECT SPECIAL EVENTS ---
    const fullDayEvent = todayEvents.find(e => e.type === "FullDay");
    const halfDayEvent = todayEvents.find(e => e.type === "HalfDay");

    const onDayPress = (day) => {
        const fixedDate = new Date(day.year, day.month - 1, day.day);
        setCurrentDate(fixedDate);
        setDatePickerVisible(false);
    };

    // --- RENDER HELPERS ---
    const renderEditForm = (value, setValue, onSave, onCancel) => (
        <View style={styles.editForm}>
            <TextInput
                style={styles.textInput}
                multiline
                value={value}
                onChangeText={setValue}
                placeholder="Type your update here..."
                placeholderTextColor={colors.placeholder}
            />
            <View style={styles.btnRow}>
                <TouchableOpacity onPress={onSave} disabled={isSaving} style={[styles.actionBtn, styles.bgAccent]}>
                    {isSaving ? <ActivityIndicator size="small" color={colors.surface} /> : <Text style={[styles.btnText, styles.textSurface]}>Save</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={onCancel} disabled={isSaving} style={[styles.actionBtn, styles.bgBorder]}>
                    <Text style={[styles.btnText, styles.textPrimary]}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ================== FLASHLIST OPTIMIZATION ==================
    const listData = useMemo(() => [
        { type: 'schedule' },
        { type: 'updates' },
        { type: 'general_notice' },
        { type: 'footer' }
    ], []);

    const renderItem = useCallback(({ item }) => {
        if (item.type === 'schedule') {
            return (
                <ScheduleItem
                    scheduleStatus={scheduleStatus}
                    fullDayEvent={fullDayEvent}
                    activeExamToday={activeExamToday}
                    halfDayEvent={halfDayEvent}
                    activeExamPeriod={activeExamPeriod}
                    dayOrder={dayOrder}
                    timetable={masterData.timetable?.[dayOrder]}
                    styles={styles}
                    colors={colors}
                    getSubjectName={getSubjectName}
                    getPeriodDetails={getPeriodDetails}
                />
            );
        }

        if (item.type === 'updates') {
            return (
                <UpdatesItem
                    todayStr={todayStr}
                    userProfile={userProfile}
                    sectionUpdates={sectionUpdates}
                    isEditingNote={isEditingNote}
                    setTempNote={setTempNote}
                    setIsEditingNote={setIsEditingNote}
                    tempNote={tempNote}
                    renderEditForm={renderEditForm}
                    handleSaveNote={handleSaveNote}
                    styles={styles}
                    colors={colors}
                />
            );
        }

        if (item.type === 'general_notice') {
            return (
                <GeneralNoticeItem
                    userProfile={userProfile}
                    sectionUpdates={sectionUpdates}
                    isEditingGeneral={isEditingGeneral}
                    setTempGeneral={setTempGeneral}
                    setIsEditingGeneral={setIsEditingGeneral}
                    tempGeneral={tempGeneral}
                    renderEditForm={renderEditForm}
                    handleSaveGeneral={handleSaveGeneral}
                    styles={styles}
                    colors={colors}
                />
            );
        }

        if (item.type === 'footer') {
            return <FooterItem userProfile={userProfile} styles={styles} />;
        }

        return null;
    }, [fullDayEvent, activeExamToday, activeExamPeriod, halfDayEvent, dayOrder, masterData, scheduleStatus, isEditingNote, isEditingGeneral, tempNote, tempGeneral, sectionUpdates, todayStr, styles, colors, userProfile, getSubjectName, getPeriodDetails, renderEditForm, handleSaveNote, handleSaveGeneral]);

    const renderHeader = useCallback(() => (
        <View>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTextBox}>
                    <View style={styles.headerRow}>
                        <Text style={styles.greetingText}>Vanakkam!</Text>
                        {isOffline && (
                            <View style={styles.offlineBanner}>
                                <Text style={styles.offlineText}>Offline</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.userNameText}>{userProfile?.displayName || "Student"}</Text>
                    {['admin', 'cr'].includes(userProfile?.role) && (
                        <View style={styles.adminBadge}><Text style={styles.adminText}>{userProfile?.role === 'cr' ? 'CR' : 'ADMIN'}</Text></View>
                    )}
                </View>

                {/* Right Side: Avatar */}
                <View style={styles.headerRow}>
                    <AnimatedPressable style={styles.avatarContainer} activeScale={0.95}>
                        {userProfile?.photoURL ? (
                            <Image source={{ uri: userProfile.photoURL }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarPlaceholderText}>
                                    {(userProfile?.displayName || "S")[0].toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </AnimatedPressable>
                </View>
            </View>

            {/* Date Section */}
            <View style={styles.dateSection}>
                <Text style={styles.dateInputLabel}>VIEW BY DATE</Text>
                <AnimatedPressable
                    style={styles.datePill}
                    activeScale={0.97}
                    onPress={() => setDatePickerVisible(true)}
                >
                    <Text style={styles.dateText}>
                        {formatDateFull(currentDate)}
                    </Text>
                    <View style={styles.calendarIconContainer}>
                        <Ionicons name="calendar-outline" size={20} color={colors.buttonText} />
                    </View>
                </AnimatedPressable>
            </View>

            {/* Academic Calendar Pills */}
            <View style={styles.marginBottom20}>
                <Text style={styles.sectionTitle}>Academic Calendar</Text>
                {todayEvents.length > 0 ? todayEvents.map((ev, i) => (
                    <View key={ev.id || `${ev.title}-${i}`} style={styles.calendarPill}>
                        <View style={styles.pillIndicator} />
                        <View style={styles.pillContent}>
                            <Text style={styles.pillTitle}>{ev.title}</Text>
                            <Text style={styles.pillTime}>{formatTimeRange(ev.fullTime) || "All Day"}</Text>
                        </View>
                    </View>
                )) : (
                    <Text style={styles.emptyStateText}>Regular Working Day</Text>
                )}
            </View>
        </View>
    ), [userProfile, isOffline, currentDate, colors, styles, todayEvents]);

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <FlashList
                data={listData}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                estimatedItemSize={200}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={isSyncing || areEventsLoading} />}
                getItemType={item => item.type}
            />

            {/* Date Picker Modal */}
            <Modal
                transparent={true}
                visible={isDatePickerVisible}
                animationType="fade"
                onRequestClose={() => setDatePickerVisible(false)}
            >
                <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setDatePickerVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <Calendar
                            current={todayStr}
                            onDayPress={onDayPress}
                            markedDates={{
                                [todayStr]: { selected: true, selectedColor: colors.accent }
                            }}
                            theme={{
                                calendarBackground: colors.surface,
                                todayTextColor: colors.accent,
                                arrowColor: colors.accent,
                                textDayFontWeight: '600',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                                dayTextColor: colors.textPrimary,
                                monthTextColor: colors.textPrimary,
                                textDisabledColor: colors.placeholder
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>


            {/* FORCE PLACEMENT MODAL */}
            <Modal visible={placementModalVisible} animationType="slide" presentationStyle="fullScreen">
                <SafeAreaView style={styles.fullScreenModal}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitleText}>Complete Your Profile</Text>
                        <Text style={styles.modalSubtitleText}>
                            Please select your academic details to continue.
                        </Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContentPadding}>
                        {/* 1. BATCH */}
                        <Text style={styles.label}>Select Batch</Text>
                        <View style={styles.pickerRow}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {Object.keys(hierarchy).sort().reverse().map(b => (
                                    <AnimatedPressable
                                        key={b}
                                        style={[styles.chip, tempPlacement.batch === b && styles.activeChip]}
                                        onPress={() => setTempPlacement({ batch: b, dept: '', sec: '' })}
                                        activeScale={0.95}
                                    >
                                        <Text style={[styles.chipText, tempPlacement.batch === b && styles.textSurface]}>{b}</Text>
                                    </AnimatedPressable>
                                ))}
                            </ScrollView>
                        </View>

                        {/* 2. DEPT */}
                        {tempPlacement.batch && (
                            <>
                                <Text style={styles.label}>Select Department</Text>
                                <View style={styles.pickerGrid}>
                                    {Object.keys(hierarchy[tempPlacement.batch] || {}).filter(k => k !== 'initialized').map(d => (
                                        <AnimatedPressable
                                            key={d}
                                            style={[styles.gridChip, tempPlacement.dept === d && styles.activeChip]}
                                            onPress={() => setTempPlacement({ ...tempPlacement, dept: d, sec: '' })}
                                            activeScale={0.95}
                                        >
                                            <Text style={[styles.chipText, tempPlacement.dept === d && styles.textSurface]}>{d}</Text>
                                        </AnimatedPressable>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* 3. SECTION */}
                        {tempPlacement.dept && (
                            <>
                                <Text style={styles.label}>Select Section</Text>
                                <View style={styles.pickerGrid}>
                                    {(hierarchy[tempPlacement.batch]?.[tempPlacement.dept] || []).map(s => (
                                        <AnimatedPressable
                                            key={s}
                                            style={[styles.gridChip, tempPlacement.sec === s && styles.activeChip]}
                                            onPress={() => setTempPlacement({ ...tempPlacement, sec: s })}
                                            activeScale={0.95}
                                        >
                                            <Text style={[styles.chipText, tempPlacement.sec === s && styles.textSurface]}>{s}</Text>
                                        </AnimatedPressable>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* SAVE BUTTON */}
                        <AnimatedPressable
                            style={[styles.saveBtn, (!tempPlacement.sec || isSavingPlacement) && styles.opacityHalf]}
                            disabled={!tempPlacement.sec || isSavingPlacement}
                            onPress={handleSavePlacement}
                            activeScale={0.97}
                        >
                            {isSavingPlacement ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.saveBtnText}>Get Started</Text>}
                        </AnimatedPressable>

                    </ScrollView>
                </SafeAreaView>
            </Modal>


        </SafeAreaView >
    );
}

export default memo(HomeScreen);

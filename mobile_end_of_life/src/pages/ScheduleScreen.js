import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { View, Text, RefreshControl, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { ref, onValue } from 'firebase/database';
import { db } from '../services/firebase';

import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { createScheduleStyles } from '../styles/ScheduleStyles';
import AnimatedPressable from '../components/AnimatedPressable';
import { formatDate as formatDisplayDate, formatTime, formatDateFull } from '../utils/formatters';

// Helper for DB keys (keep existing)
const formatDateKey = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

import { TodayHighlightItem, HeaderItem, WeeklyDayItem, CourseItem, StaffSectionItem, ExamCardItem, EmptyExamsItem } from '../components/ScheduleListItems';

const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function ScheduleScreen() {
    const { masterData, allCalendar, userProfile, isSyncing } = useGlobal();
    const { colors } = useTheme();
    const styles = useMemo(() => createScheduleStyles(colors), [colors]);

    // --- STATE ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);

    const [dayOrder, setDayOrder] = useState("");
    const [todayNote, setTodayNote] = useState("");
    const [activeTab, setActiveTab] = useState("class");

    // Events State
    const [globalEvents, setGlobalEvents] = useState([]);
    const [sectionEvents, setSectionEvents] = useState([]);
    const [areEventsLoading, setAreEventsLoading] = useState(true);

    const [activeExamPeriod, setActiveExamPeriod] = useState(null);
    const [activeExamToday, setActiveExamToday] = useState(null);
    const [activeExamTomorrow, setActiveExamTomorrow] = useState(null);
    const [isReady, setIsReady] = useState(false);

    const todayStr = useMemo(() => formatDateKey(currentDate), [currentDate]);

    // --- MERGE LOGIC ---
    const todayEvents = useMemo(() => {
        const combined = [...globalEvents, ...sectionEvents];
        return Array.from(new Map(combined.map(item => [item.id || item.title, item])).values());
    }, [globalEvents, sectionEvents]);

    const fullDayEvent = todayEvents.find(e => e.type === "FullDay");
    const halfDayEvent = todayEvents.find(e => e.type === "HalfDay");

    // --- 1. FETCH SECTION EVENTS ---
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

    // --- 0. Mark screen ready when focused ---
    useFocusEffect(
        useCallback(() => {
            const timeoutId = setTimeout(() => setIsReady(true), 50);
            return () => {
                clearTimeout(timeoutId);
                setIsReady(false);
            };
        }, [])
    );

    // --- 2. LOGIC RESOLUTION (Deferred) ---
    useEffect(() => {
        if (!isReady || !masterData || !allCalendar) return;

        // Global Events
        const gEvents = allCalendar.filter(e => e.date === todayStr);
        setGlobalEvents(gEvents);

        // Exam Logic
        const currentPeriod = masterData.exams?.find(ex => todayStr >= ex.startDate && todayStr <= ex.endDate);
        setActiveExamPeriod(currentPeriod || null);

        if (currentPeriod) {
            const subToday = currentPeriod.subjects?.find(s => s.date === todayStr);
            setActiveExamToday(subToday ? { ...currentPeriod, todaySub: subToday } : null);

            // Calculate Tomorrow
            const tomorrowDate = new Date(currentDate);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const tmStr = formatDateKey(tomorrowDate);

            const subTom = currentPeriod.subjects?.find(s => s.date === tmStr);
            setActiveExamTomorrow(subTom ? { ...currentPeriod, tomSub: subTom } : null);
        } else {
            setActiveExamToday(null);
            setActiveExamTomorrow(null);
        }

        // Day Order Logic
        const holidayEvent = gEvents.find(e => e.title.toLowerCase().includes("holiday"));
        const orderEvent = gEvents.find(e => e.title.toLowerCase().includes("order"));
        const weekday = currentDate.getDay(); // 0 = Sun

        if (holidayEvent) {
            setTodayNote(`Holiday: ${holidayEvent.title}`);
            setDayOrder("");
        } else if (orderEvent) {
            const order = ["Monday", ...daysOrder].find(day => orderEvent.title.includes(day));
            if (order) {
                setDayOrder(order);
                setTodayNote(`Following ${order} Order`);
            }
        } else {
            if (weekday === 0) { setTodayNote("Sunday (No Classes)"); setDayOrder(""); }
            else {
                const order = ["Monday", ...daysOrder][weekday - 1]; // 1 = Mon
                if (order === "Monday") { setTodayNote("Monday (No Classes)"); setDayOrder(""); }
                else { setDayOrder(order); setTodayNote(`Regular ${order}`); }
            }
        }

    }, [currentDate, allCalendar, masterData, todayStr]);

    // --- HELPER PREVIEW ---
    const getSubjectName = useCallback((code) => {
        return masterData.courses?.find(c => c.code === code)?.name || "General Subject";
    }, [masterData]);

    const getPeriodDetails = useCallback((cellContent) => {
        if (!cellContent || !masterData.courses) return { name: "", faculty: "", code: "" };

        if (cellContent.includes("/")) {
            const parts = cellContent.split("/");
            const results = parts.map(part => {
                const trimmedPart = part.trim();
                const pureCode = trimmedPart.split(" ")[0];
                const course = masterData.courses.find(c => c.code === pureCode);
                return course ? { name: course.name, faculty: course.faculty } : { name: trimmedPart, faculty: "" };
            });
            return {
                name: results.map(r => r.name).join(" / "),
                faculty: results.map(r => r.faculty).join(" / "),
                code: cellContent
            };
        }

        const pureCode = cellContent.split(" ")[0].trim();
        const course = masterData.courses.find((c) => c.code === pureCode);
        return course ? { ...course, code: cellContent } : { name: cellContent, faculty: "", code: cellContent };
    }, [masterData]);

    const onDayPress = (day) => {
        const fixedDate = new Date(day.year, day.month - 1, day.day);
        setCurrentDate(fixedDate);
        setDatePickerVisible(false);
    };

    // ================== FLASHLIST OPTIMIZATION ==================
    // Flatten the data for efficient rendering
    const listViewData = useMemo(() => {
        if (activeTab === 'exams') {
            if (!masterData.exams || masterData.exams.length === 0) return [{ type: 'empty_exams' }];
            return masterData.exams.map(ex => ({ type: 'exam_card', data: ex }));
        }

        const data = [];

        // 1. Today's Highlight
        data.push({ type: 'today_highlight' });

        // 2. Weekly Overview
        data.push({ type: 'header', title: 'Weekly Overview' });
        daysOrder.forEach(day => {
            data.push({ type: 'weekly_day', day: day, timetable: masterData.timetable?.[day] });
        });

        // 3. Courses
        data.push({ type: 'header', title: 'Courses' });
        if (masterData.courses) {
            masterData.courses.forEach(c => data.push({ type: 'course_item', data: c }));
        }

        // 4. Staff
        data.push({ type: 'header', title: 'Staff' });
        data.push({ type: 'staff_section' });

        return data;
    }, [activeTab, masterData, fullDayEvent, halfDayEvent, activeExamToday, dayOrder, activeExamPeriod]);

    const renderItem = useCallback(({ item }) => {
        if (item.type === 'today_highlight') {
            return (
                <TodayHighlightItem
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

        if (item.type === 'header') {
            return <HeaderItem title={item.title} styles={styles} />;
        }

        if (item.type === 'weekly_day') {
            return (
                <WeeklyDayItem
                    day={item.day}
                    timetable={item.timetable}
                    styles={styles}
                    getPeriodDetails={getPeriodDetails}
                />
            );
        }

        if (item.type === 'course_item') {
            return <CourseItem course={item.data} styles={styles} />;
        }

        if (item.type === 'staff_section') {
            return (
                <StaffSectionItem
                    counselors={masterData.counseling?.counselors}
                    coordinators={masterData.counseling?.coordinators}
                    styles={styles}
                    colors={colors}
                />
            );
        }

        if (item.type === 'exam_card') {
            return (
                <ExamCardItem
                    exam={item.data}
                    todayStr={todayStr}
                    styles={styles}
                    colors={colors}
                    getSubjectName={getSubjectName}
                />
            );
        }

        if (item.type === 'empty_exams') {
            return <EmptyExamsItem styles={styles} />;
        }

        return null;
    }, [masterData, colors, styles, activeExamToday, dayOrder, halfDayEvent, fullDayEvent, activeExamPeriod, todayStr, getSubjectName, getPeriodDetails]);


    const renderHeader = useCallback(() => (
        <>
            <View style={styles.tabContainer}>
                <AnimatedPressable style={[styles.tabButton, activeTab === 'class' && styles.activeTab]} onPress={() => setActiveTab('class')} activeScale={0.96}>
                    <Text style={[styles.tabText, activeTab === 'class' && styles.activeTabText]}>Class</Text>
                </AnimatedPressable>
                <AnimatedPressable style={[styles.tabButton, activeTab === 'exams' && styles.activeTab]} onPress={() => setActiveTab('exams')} activeScale={0.96}>
                    <Text style={[styles.tabText, activeTab === 'exams' && styles.activeTabText]}>Exams</Text>
                </AnimatedPressable>
            </View>

            <View style={styles.controlsSection}>
                <View style={styles.statusPillGroup}>
                    <View style={[styles.statusDot, { backgroundColor: dayOrder ? colors.success : colors.error }]} />
                    <Text style={styles.statusBanner} numberOfLines={1}>{todayNote}</Text>
                </View>

                <AnimatedPressable
                    style={styles.dateControlsGroup}
                    activeScale={0.98}
                    onPress={() => setDatePickerVisible(true)}
                >
                    <Text style={styles.dateText}>{formatDateFull(currentDate)}</Text>
                    <View style={styles.calendarIconContainer}>
                        <Ionicons name="calendar-outline" size={20} color={colors.buttonText} />
                    </View>
                </AnimatedPressable>
            </View>
        </>
    ), [activeTab, styles, colors, dayOrder, todayNote, currentDate]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <FlashList
                data={listViewData}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                estimatedItemSize={70}
                keyExtractor={(item, index) => {
                    if (item.type === 'today_highlight') return 'today';
                    if (item.type === 'header') return `header-${item.title}`;
                    if (item.type === 'weekly_day') return `day-${item.day}`;
                    if (item.type === 'course_item') return `course-${item.data.code}`;
                    if (item.type === 'staff_section') return 'staff';
                    if (item.type === 'exam_card') return `exam-${item.data.id || index}`;
                    return `item-${index}`;
                }}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={isSyncing || areEventsLoading} />}
                getItemType={item => item.type}
                overrideItemLayout={(layout, item) => {
                    if (item.type === 'today_highlight') {
                        layout.size = 200;
                    } else if (item.type === 'header') {
                        layout.size = 40;
                    } else if (item.type === 'weekly_day') {
                        layout.size = 60;
                    } else if (item.type === 'course_item') {
                        layout.size = 60;
                    }
                }}
            />

            <Modal
                transparent={true}
                visible={isDatePickerVisible}
                animationType="fade"
                onRequestClose={() => setDatePickerVisible(false)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setDatePickerVisible(false)}>
                    <View style={styles.modalContent}>
                        <Calendar
                            current={todayStr}
                            onDayPress={onDayPress}
                            markedDates={{ [todayStr]: { selected: true, selectedColor: colors.accent } }}
                            theme={{
                                calendarBackground: colors.surface,
                                textSectionTitleColor: colors.textSecondary,
                                selectedDayBackgroundColor: colors.accent,
                                selectedDayTextColor: colors.surface,
                                todayTextColor: colors.accent,
                                dayTextColor: colors.textPrimary,
                                textDisabledColor: colors.placeholder,
                                arrowColor: colors.accent,
                                monthTextColor: colors.textPrimary,
                                textDayFontWeight: '600',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '600',
                            }}
                        />
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

export default memo(ScheduleScreen);

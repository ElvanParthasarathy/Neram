import React, { useState, useMemo, memo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useGlobal } from '../context/GlobalContext';
import { useTheme } from '../context/ThemeContext';
import { createCalendarStyles } from '../styles/CalendarStyles';
import { formatDate as formatDisplayDate, formatTimeRange } from '../utils/formatters';

function CalendarScreen() {
    const { allCalendar, isSyncing } = useGlobal();
    const { colors, isDark } = useTheme();
    const styles = useMemo(() => createCalendarStyles(colors), [colors]);

    // Helper: Get local YYYY-MM-DD
    const getLocalToday = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const [selectedDate, setSelectedDate] = useState(getLocalToday());
    const [currentMonth, setCurrentMonth] = useState(getLocalToday());

    // HelperFunctions
    const localToday = getLocalToday();

    // --- PREPARE DATA ---
    const markedDates = useMemo(() => {
        const marks = {};
        if (allCalendar) {
            allCalendar.forEach(ev => {
                if (ev.date) {
                    // Filter: Skip routine day orders and generic events
                    const title = ev.title?.toLowerCase() || "";
                    if (title.includes('order') || title.includes('working day')) return;

                    if (title.includes('holiday')) {
                        marks[ev.date] = { customStyles: { text: styles.holidayText } };
                    } else if (title.includes('exam') || title.includes('test') || title.includes('sia') || title.includes('fia')) {
                        marks[ev.date] = { customStyles: { text: styles.examText } };
                    } else {
                        marks[ev.date] = { marked: true, dotColor: colors.calendarDot };
                    }
                }
            });
        }

        // Ensure "Today" has a visual marker (Border) if it's NOT selected
        if (selectedDate !== localToday) {
            marks[localToday] = {
                ...(marks[localToday] || {}),
                customStyles: {
                    ...(marks[localToday]?.customStyles || {}),
                    container: {
                        ...(marks[localToday]?.customStyles?.container || {}),
                        ...styles.todayContainer
                    },
                    // If no text style exists (regular day), use accent color for text
                    text: marks[localToday]?.customStyles?.text || { color: colors.accent, fontWeight: 'bold' }
                }
            };
        }

        // Highlight selected date (Overwrites "Today" border with Filled Selection)
        marks[selectedDate] = {
            ...(marks[selectedDate] || {}),
            customStyles: {
                container: styles.selectedDateContainer,
                text: styles.selectedDateText
            }
        };
        return marks;
    }, [allCalendar, selectedDate, colors, styles, localToday]);

    // Selected Day Events
    const selectedEvents = useMemo(() => {
        return allCalendar ? allCalendar.filter(e => e.date === selectedDate) : [];
    }, [allCalendar, selectedDate]);

    // Monthly Events (List below)
    const monthEvents = useMemo(() => {
        if (!allCalendar) return [];
        const [y, m] = currentMonth.split('-'); // e.g., "2024-10-01" -> "2024", "10"
        return allCalendar.filter(e => e.date && e.date.startsWith(`${y}-${m}`)).sort((a, b) => a.date.localeCompare(b.date));
    }, [allCalendar, currentMonth]);

    // Helper: Determine event style objects based on title
    const getEventStyles = (title) => {
        const t = title?.toLowerCase() || "";
        if (t.includes('holiday')) return {
            line: styles.statusLineHoliday,
            border: styles.statusBorderHoliday,
            text: styles.statusTextHoliday
        };
        if (t.includes('exam') || t.includes('test') || t.includes('sia') || t.includes('fia')) return {
            line: styles.statusLineExam,
            border: styles.statusBorderExam,
            text: styles.statusTextExam
        };
        return {
            line: styles.statusLineDefault,
            border: styles.statusBorderDefault,
            text: styles.statusTextDefault
        };
    };

    const renderHeader = useMemo(() => (
        <View>
            {/* Calendar Widget */}
            <View style={styles.calendarWrapper}>
                <Calendar
                    key={isDark ? 'dark' : 'light'}
                    current={currentMonth}
                    markingType="custom"
                    onDayPress={day => setSelectedDate(day.dateString)}
                    onMonthChange={month => setCurrentMonth(month.dateString)}
                    markedDates={markedDates}
                    renderArrow={(direction) => (
                        <View style={styles.arrowBtn}>
                            <Text style={styles.arrowBtnText}>
                                {direction === 'left' ? 'Prev' : 'Next'}
                            </Text>
                        </View>
                    )}
                    theme={{
                        calendarBackground: colors.background,
                        textSectionTitleColor: colors.textSecondary,
                        selectedDayBackgroundColor: colors.calendarSelection,
                        selectedDayTextColor: colors.calendarSelectionText,
                        todayTextColor: colors.accent,
                        dayTextColor: colors.textPrimary,
                        textDisabledColor: colors.placeholder,
                        dotColor: colors.calendarDot,
                        selectedDotColor: colors.calendarSelectedDot,
                        arrowColor: colors.calendarSelection,
                        monthTextColor: colors.textPrimary,
                        textDayFontWeight: '300',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '300',
                        textDayFontSize: 16,
                        textMonthFontSize: 16,
                        textDayHeaderFontSize: 13
                    }}
                />
            </View>

            {/* Selected Day Detail */}
            <View style={styles.selectedDaySection}>
                <Text style={styles.sectionLabel}>
                    {selectedDate === getLocalToday() ? "TODAY'S EVENTS" : `EVENTS ON ${formatDisplayDate(selectedDate)}`}
                </Text>
                {selectedEvents.length > 0 ? selectedEvents.map((ev, i) => {
                    const evtStyle = getEventStyles(ev.title);
                    return (
                        <View key={ev.id || `${ev.title}-${ev.date}-${i}`} style={styles.eventCard}>
                            <View style={[styles.eventLine, evtStyle.line]} />
                            <View style={styles.eventContent}>
                                <Text style={styles.eventTitle}>{ev.title}</Text>
                                <Text style={styles.eventTime}>{formatTimeRange(ev.fullTime) || "All Day"}</Text>
                            </View>
                        </View>
                    );
                }) : (
                    <Text style={styles.noEventText}>No academic events scheduled.</Text>
                )}
            </View>

            {/* Agenda Header */}
            <View style={styles.agendaSection}>
                <Text style={styles.agendaHeader}>Month's Agenda</Text>
                {monthEvents.length === 0 && (
                    <Text style={styles.noEventText}>No other events this month.</Text>
                )}
            </View>
        </View>
    ), [currentMonth, markedDates, selectedEvents, selectedDate, monthEvents.length, styles, colors, isDark]);

    const renderItem = ({ item }) => {
        const isSelected = item.date === selectedDate;
        const evtStyle = getEventStyles(item.title);
        return (
            <View style={[
                styles.agendaItem,
                isSelected && styles.agendaItemSelected
            ]}>
                <View style={[styles.dateBox, evtStyle.border]}>
                    <Text style={[styles.dayText, evtStyle.text]}>
                        {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={styles.dateText}>{item.date.split('-')[2]}</Text>
                </View>
                <View style={styles.agendaContent}>
                    <Text style={styles.eventTitle}>{item.title}</Text>
                    <Text style={styles.eventTime}>{formatTimeRange(item.fullTime)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={isSyncing} />}
            >
                {/* Calendar Widget */}
                <View style={styles.calendarWrapper}>
                    <Calendar
                        key={isDark ? 'dark' : 'light'}
                        current={currentMonth}
                        markingType="custom"
                        onDayPress={day => setSelectedDate(day.dateString)}
                        onMonthChange={month => setCurrentMonth(month.dateString)}
                        markedDates={markedDates}
                        renderArrow={(direction) => (
                            <View style={styles.arrowBtn}>
                                <Text style={styles.arrowBtnText}>
                                    {direction === 'left' ? 'Prev' : 'Next'}
                                </Text>
                            </View>
                        )}
                        theme={{
                            calendarBackground: colors.background,
                            textSectionTitleColor: colors.textSecondary,
                            selectedDayBackgroundColor: colors.calendarSelection,
                            selectedDayTextColor: colors.calendarSelectionText,
                            todayTextColor: colors.accent,
                            dayTextColor: colors.textPrimary,
                            textDisabledColor: colors.placeholder,
                            dotColor: colors.calendarDot,
                            selectedDotColor: colors.calendarSelectedDot,
                            arrowColor: colors.calendarSelection,
                            monthTextColor: colors.textPrimary,
                            textDayFontWeight: '300',
                            textMonthFontWeight: 'bold',
                            textDayHeaderFontWeight: '300',
                            textDayFontSize: 16,
                            textMonthFontSize: 16,
                            textDayHeaderFontSize: 13
                        }}
                    />
                </View>

                {/* Selected Day Detail */}
                <View style={styles.selectedDaySection}>
                    <Text style={styles.sectionLabel}>
                        {selectedDate === getLocalToday() ? "TODAY'S EVENTS" : `EVENTS ON ${formatDisplayDate(selectedDate)}`}
                    </Text>
                    {selectedEvents.length > 0 ? selectedEvents.map((ev, i) => {
                        const evtStyle = getEventStyles(ev.title);
                        return (
                            <View key={ev.id || `${ev.title}-${ev.date}-${i}`} style={styles.eventCard}>
                                <View style={[styles.eventLine, evtStyle.line]} />
                                <View style={styles.eventContent}>
                                    <Text style={styles.eventTitle}>{ev.title}</Text>
                                    <Text style={styles.eventTime}>{formatTimeRange(ev.fullTime) || "All Day"}</Text>
                                </View>
                            </View>
                        );
                    }) : (
                        <Text style={styles.noEventText}>No academic events scheduled.</Text>
                    )}
                </View>

                {/* Monthly Agenda List */}
                <View style={styles.agendaSection}>
                    <Text style={styles.agendaHeader}>Month's Agenda</Text>
                    {monthEvents.length > 0 ? monthEvents.map((ev, i) => {
                        const isSelected = ev.date === selectedDate;
                        const evtStyle = getEventStyles(ev.title);
                        return (
                            <View key={ev.id || `${ev.title}-${ev.date}-${i}`} style={[
                                styles.agendaItem,
                                isSelected && styles.agendaItemSelected
                            ]}>
                                <View style={[styles.dateBox, evtStyle.border]}>
                                    <Text style={[styles.dayText, evtStyle.text]}>
                                        {new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                    </Text>
                                    <Text style={styles.dateText}>{ev.date.split('-')[2]}</Text>
                                </View>
                                <View style={styles.agendaContent}>
                                    <Text style={styles.eventTitle}>{ev.title}</Text>
                                    <Text style={styles.eventTime}>{formatTimeRange(ev.fullTime)}</Text>
                                </View>
                            </View>
                        );
                    }) : (
                        <Text style={styles.noEventText}>No other events this month.</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default memo(CalendarScreen);

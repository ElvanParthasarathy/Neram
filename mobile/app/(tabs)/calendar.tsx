import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Platform, Modal, Linking, RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSyncData } from '../../hooks/useSyncData';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// --- HELPER FUNCTIONS ---
const toLocalISO = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseAsLocal = (dateStr: string) => {
  if (!dateStr) return new Date();
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  const [y, m, d] = cleanDate.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function CalendarScreen() {
  const { user, loading: authLoading } = useAuth();

  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [eventResults, setEventResults] = useState<any[]>([]);

  // --- DATA FETCHING (OFFLINE FIRST) ---
  const batch = user?.batch || "2026";

  // Use a unique STORAGE key to persist data to disk
  const { data: allCalendar, loading: isSyncing } = useSyncData(
    `calendars/${batch}/events`,
    `STORAGE_CALENDAR_${batch}`
  );

  // --- LOGIC: SELECTED DATE EVENTS ---
  useEffect(() => {
    if (!allCalendar) return;
    const dateStr = toLocalISO(selectedDate);
    const events = Array.isArray(allCalendar) ? allCalendar : [];
    setEventResults(events.filter((e: any) => e.date === dateStr));
  }, [selectedDate, allCalendar]);

  // --- LOGIC: MONTHLY EVENTS GROUPING ---
  const groupedEvents = useMemo(() => {
    if (!allCalendar || !Array.isArray(allCalendar)) return {};

    const currentMonthEvents = allCalendar.filter((item: any) => {
      const d = parseAsLocal(item.date);
      return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    });

    return currentMonthEvents.reduce((acc: any, event: any) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, [allCalendar, viewDate]);

  const sortedDates = Object.keys(groupedEvents).sort();

  // --- HANDLERS ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay (Data sync happens automatically via hook)
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) setSelectedDate(selectedDate);
  };

  const changeMonth = (direction: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + direction, 1);
    setViewDate(newDate);
  };

  const handleDownload = () => {
    Linking.openURL('https://example.com/academic-calendar.pdf').catch(err => console.error("Couldn't load page", err));
  };

  // --- RENDER (WHATSAPP LOGIC) ---
  // Only show loader if we have NO data on disk AND we are fetching.
  // If 'allCalendar' exists (from storage), we skip the loader and show the UI instantly.
  if (authLoading || (isSyncing && !allCalendar)) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <View style={styles.screen}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Academic Calendar</Text>
        <Text style={styles.pageSubtitle}>Academic Events for {batch}</Text>
      </View>

      {/* DATE PICKER MODAL */}
      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent={true} animationType="fade">
            <View style={styles.modalParams}>
              <View style={styles.modalContent}>
                <DateTimePicker value={selectedDate} mode="date" display="inline" onChange={onDateChange} />
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPicker(false)}><Text style={{ color: '#fff' }}>Done</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
        )
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
      >

        {/* CALENDAR CHECKER GRID (Top Cards) */}
        <View style={styles.checkerGrid}>

          {/* Left Card: Select Date */}
          <View style={[styles.checkerCard, styles.selectDateCard]}>
            <Text style={styles.inputLabel}>VIEW BY DATE</Text>
            <View style={styles.checkerControlsPill}>
              <Text style={styles.dateDisplayPill}>
                {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' })}
              </Text>
              <TouchableOpacity style={styles.calendarTriggerBtn} onPress={() => setShowPicker(true)}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Card: Event Results */}
          <View style={[styles.checkerCard, styles.eventResultsCard]}>
            <Text style={styles.inputLabel}>TODAYS EVENT</Text>
            <View style={styles.resultTextStack}>
              {eventResults.length > 0 ? eventResults.map((ev: any, i: number) => (
                <View key={i} style={styles.checkerEventItem}>
                  <View style={styles.eventIndicatorLine} />
                  <View style={styles.eventDetails}>
                    <Text style={styles.eventTitleText}>{ev.title}</Text>
                    <Text style={styles.eventTimeText}>{ev.fullTime}</Text>
                  </View>
                </View>
              )) : <Text style={styles.noEventText}>No academic event scheduled.</Text>}
            </View>
          </View>

        </View>

        {/* MONTHLY GRID VIEW */}
        <View style={styles.gridViewSection}>
          <Text style={styles.sectionHeading}>Monthly Grid View</Text>

          <View style={styles.tableNavigation}>
            <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(-1)}>
              <Text style={styles.navBtnText}>Prev</Text>
            </TouchableOpacity>
            <Text style={styles.currentMonthDisplay}>
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
              <Text style={styles.navBtnText}>Next</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tableWrapper}>
            {/* Logic: Only show 'loading text' inside table if NO data exists */}
            {(!allCalendar || allCalendar.length === 0) ? (
              <Text style={styles.loadingShimmer}>
                {isSyncing ? "Synchronizing live calendar..." : "No events found."}
              </Text>
            ) : (
              <View style={styles.calendarTable}>
                {/* Table Header */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, { width: 80 }]}>Date</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Events & Timing</Text>
                </View>

                {/* Table Body */}
                {sortedDates.length > 0 ? sortedDates.map((dateStr) => {
                  const [y, m, d] = dateStr.split('-');
                  const displayDate = `${d}/${m}/${y}`;
                  const dayName = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', { weekday: 'short' });
                  const isToday = dateStr === toLocalISO(new Date());

                  return (
                    <View key={dateStr} style={[styles.tableRow, isToday && styles.rowToday]}>

                      {/* Date Column */}
                      <View style={[styles.td, styles.cellDateStack, { width: 80 }]}>
                        <Text style={styles.dayLabel}>{dayName}</Text>
                        <Text style={styles.dateLabel}>{displayDate}</Text>
                      </View>

                      {/* Events Column */}
                      <View style={[styles.td, { flex: 1 }]}>
                        {groupedEvents[dateStr].map((item: any, idx: number) => (
                          <View key={idx} style={styles.eventInfoGroup}>
                            <Text style={styles.eventTitle}>{item.title}</Text>
                            <Text style={styles.eventTime}>{item.fullTime}</Text>
                          </View>
                        ))}
                      </View>

                    </View>
                  );
                }) : (
                  <View style={styles.emptyRow}>
                    <Text style={styles.emptyRowText}>No academic events for {batch} this month.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* LIVE FEED SECTION */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeading}>Live Calendar Feed</Text>
          <View style={styles.liveEmbedPlaceholder}>
            <Text style={{ color: '#666' }}>Live Calendar Component Placeholder</Text>
          </View>
        </View>

        {/* DOWNLOAD SECTION */}
        <View style={styles.downloadSection}>
          <Text style={styles.sectionHeading}>Official Documents</Text>
          <Text style={styles.downloadText}>Download the official academic calendar PDF for offline use.</Text>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload}>
            <Text style={styles.downloadBtnText}>Download PDF</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },

  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  pageSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  // Checker Grid
  checkerGrid: { flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
  checkerCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E5EA', shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  selectDateCard: { marginRight: 10 },
  eventResultsCard: { marginLeft: 0 },

  inputLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 8, letterSpacing: 0.5 },

  checkerControlsPill: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  dateDisplayPill: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 5 },
  calendarTriggerBtn: { alignSelf: 'flex-end' },

  resultTextStack: { minHeight: 60, justifyContent: 'center' },
  checkerEventItem: { flexDirection: 'row', marginBottom: 8 },
  eventIndicatorLine: { width: 3, backgroundColor: '#3B82F6', borderRadius: 2, marginRight: 8 },
  eventDetails: { flex: 1 },
  eventTitleText: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  eventTimeText: { fontSize: 10, color: '#6B7280' },
  noEventText: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },

  // Grid View
  gridViewSection: { paddingHorizontal: 15, marginBottom: 25 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },

  tableNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, backgroundColor: '#fff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  navBtn: { paddingHorizontal: 12, paddingVertical: 4 },
  navBtnText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  currentMonthDisplay: { fontSize: 14, fontWeight: '700', color: '#111' },

  tableWrapper: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5EA' },
  loadingShimmer: { padding: 20, textAlign: 'center', color: '#6B7280', fontStyle: 'italic' },

  calendarTable: { width: '100%' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  th: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },

  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowToday: { backgroundColor: '#EFF6FF' },
  td: { justifyContent: 'center' },

  cellDateStack: { paddingRight: 10 },
  dayLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
  dateLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },

  eventInfoGroup: { marginBottom: 6 },
  eventTitle: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  eventTime: { fontSize: 11, color: '#6B7280' },

  emptyRow: { padding: 20, alignItems: 'center' },
  emptyRowText: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },

  // Other Sections
  sectionContainer: { paddingHorizontal: 15, marginBottom: 25 },
  liveEmbedPlaceholder: { height: 100, backgroundColor: '#E5E7EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  downloadSection: { paddingHorizontal: 15, marginBottom: 40 },
  downloadText: { fontSize: 12, color: '#4B5563', marginBottom: 10 },
  downloadBtn: { backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  downloadBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  modalParams: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 12 },
  closeBtn: { marginTop: 10, backgroundColor: '#007AFF', padding: 10, borderRadius: 8, alignItems: 'center' }
});
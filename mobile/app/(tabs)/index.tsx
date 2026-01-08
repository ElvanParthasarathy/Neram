import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Platform, Modal, RefreshControl, Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSyncData } from '../../hooks/useSyncData';
import { ref, update, onValue } from 'firebase/database';
import { db } from '../../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

// --- HELPER FUNCTIONS ---
const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getSubjectName = (code: string, courses: any[]) => {
  if (!courses) return "Loading...";
  return courses.find(c => c.code === code)?.name || "General Subject";
};

const getPeriodDetails = (cellContent: string, courses: any[]) => {
  if (!cellContent) return { name: "", faculty: "", code: "" };
  if (!courses) return { name: "Loading...", faculty: "", code: cellContent };

  if (cellContent.includes("/")) {
    const parts = cellContent.split("/");
    const results = parts.map(part => {
      const trimmedPart = part.trim();
      const pureCode = trimmedPart.split(" ")[0];
      const course = courses.find(c => c.code === pureCode);
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
  const course = courses.find((c: any) => c.code === pureCode);
  return course
    ? { ...course, code: cellContent }
    : { name: cellContent, faculty: "", code: cellContent };
};

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();

  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [dayOrder, setDayOrder] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState("");

  const [globalEvents, setGlobalEvents] = useState<any[]>([]);
  const [sectionEvents, setSectionEvents] = useState<any[]>([]);
  const [areEventsLoading, setAreEventsLoading] = useState(true);

  const [activeExamPeriod, setActiveExamPeriod] = useState<any>(null);
  const [activeExamToday, setActiveExamToday] = useState<any>(null);

  // Editing State
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [tempGeneral, setTempGeneral] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // --- DATA FETCHING ---
  const batch = user?.batch || "2026";
  const dept = user?.department || "ECE";
  const sec = user?.section || "A";

  const { data: masterData, loading: masterLoading } = useSyncData(
    `schedules/${batch}/${dept}/${sec}`,
    `CACHE_MASTER_${batch}_${dept}_${sec}`
  );

  // Note: sectionUpdates is usually a larger object containing live_daily and general
  const { data: sectionUpdates } = useSyncData(
    `updates/${batch}/${dept}/${sec}`,
    `CACHE_UPDATES_${batch}_${dept}_${sec}`
  );

  const { data: allCalendar } = useSyncData(`calendars/${batch}/events`, `CACHE_CALENDAR_${batch}`);

  // Helpers for date string logic
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatDate(currentDate);

  // --- FETCH SECTION EVENTS LOGIC ---
  useEffect(() => {
    if (batch && dept && sec) {
      setAreEventsLoading(true);
      const sectionEventsRef = ref(db, `events/${batch}/${dept}/${sec}`);
      const unsub = onValue(sectionEventsRef, (snap) => {
        const data = snap.val() || [];
        const rawEvents = Array.isArray(data) ? data : Object.values(data);
        const todaysSpecialEvents = rawEvents.filter((e: any) => e.date === todayStr);
        setSectionEvents(todaysSpecialEvents);
        setAreEventsLoading(false);
      });
      return () => unsub();
    } else {
      setSectionEvents([]);
      setAreEventsLoading(false);
    }
  }, [batch, dept, sec, todayStr]);

  // --- MAIN LOGIC ---
  useEffect(() => {
    if (!masterData || !allCalendar) return;

    // 1. Global Events
    const gEvents = Array.isArray(allCalendar) ? allCalendar.filter((event: any) => event.date === todayStr) : [];
    setGlobalEvents(gEvents);

    // 2. Exam Logic
    const currentPeriod = masterData.exams?.find((ex: any) => todayStr >= ex.startDate && todayStr <= ex.endDate);
    setActiveExamPeriod(currentPeriod || null);

    if (currentPeriod) {
      const subToday = currentPeriod.subjects?.find((s: any) => s.date === todayStr);
      setActiveExamToday(subToday ? { ...currentPeriod, todaySub: subToday } : null);
    } else {
      setActiveExamToday(null);
    }

    // 3. Day Order Logic
    const weekdayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const holidayEvent = gEvents.find((e: any) => e.title.toLowerCase().includes("holiday"));
    const manualOrderEvent = gEvents.find((e: any) => e.title.toLowerCase().includes("order"));

    if (holidayEvent) {
      setDayOrder("");
      setScheduleStatus(`Holiday: ${holidayEvent.title}`);
    } else if (manualOrderEvent) {
      const foundDay = ["Monday", ...daysOrder].find(day => manualOrderEvent.title.includes(day));
      if (foundDay) {
        setDayOrder(foundDay);
        setScheduleStatus(`Following ${foundDay} Order`);
      } else {
        setDayOrder(weekdayName === "Sunday" ? "" : weekdayName);
        setScheduleStatus(`Regular ${weekdayName === "Sunday" ? "" : weekdayName}`);
      }
    } else {
      if (weekdayName === "Sunday") {
        setDayOrder("");
        setScheduleStatus("Sunday (Holiday)");
      } else {
        setDayOrder(weekdayName);
        setScheduleStatus(`Regular ${weekdayName}`);
      }
    }
  }, [currentDate, masterData, allCalendar]);

  // Merge Events
  const todayEvents = useMemo(() => {
    const combined = [...globalEvents, ...sectionEvents];
    return Array.from(new Map(combined.map(item => [item.id || item.title, item])).values());
  }, [globalEvents, sectionEvents]);

  const fullDayEvent = todayEvents.find((e: any) => e.type === "FullDay");
  const halfDayEvent = todayEvents.find((e: any) => e.type === "HalfDay");

  // Retrieve Update Texts
  const liveNote = sectionUpdates?.live_daily?.[todayStr]?.note || "No special updates for today.";
  const liveAuthor = sectionUpdates?.live_daily?.[todayStr]?.author || "";
  const generalText = sectionUpdates?.general_text || "No general notices.";
  const generalAuthor = sectionUpdates?.general_author || "";

  // Admin Check
  const isAdmin = user?.email?.includes('admin') || user?.role === 'admin';

  // --- HANDLERS ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) setCurrentDate(selectedDate);
  };

  const handleSaveNote = async () => {
    setIsSaving(true);
    try {
      await update(ref(db, `updates/${batch}/${dept}/${sec}/live_daily/${todayStr}`), {
        note: tempNote, author: user?.displayName || "Admin"
      });
      setIsEditingNote(false);
    } catch (error) { Alert.alert("Error", "Failed to save"); }
    finally { setIsSaving(false); }
  };

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      await update(ref(db, `updates/${batch}/${dept}/${sec}`), {
        general_text: tempGeneral, general_author: user?.displayName || "Admin"
      });
      setIsEditingGeneral(false);
    } catch (error) { Alert.alert("Error", "Failed to save"); }
    finally { setIsSaving(false); }
  };

  // --- RENDER ---
  // Note: Only show loader if CRITICAL data is missing.
  if ((authLoading || masterLoading) && !masterData) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <View style={styles.screen}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.pageTitle}>Home Dashboard</Text>
          {isAdmin && <View style={styles.adminBadge}><Text style={styles.adminBadgeText}>Admin Mode</Text></View>}
        </View>
      </View>

      {/* DATE PICKER */}
      <View style={styles.dateSection}>
        <Text style={styles.inputLabel}>Select date</Text>
        <View style={styles.dateInputGroup}>
          <TextInput
            style={styles.dateDisplay}
            editable={false}
            value={currentDate.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
          />
          <TouchableOpacity style={styles.datePickerTrigger} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* DATE PICKER MODAL (IOS) */}
      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent={true} animationType="fade">
            <View style={styles.modalParams}>
              <View style={styles.modalContent}>
                <DateTimePicker value={currentDate} mode="date" display="inline" onChange={onDateChange} />
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowPicker(false)}><Text style={{ color: '#fff' }}>Done</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker value={currentDate} mode="date" display="default" onChange={onDateChange} />
        )
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}>

        {/* ACADEMIC CALENDAR */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Academic Calendar</Text>
          <View style={styles.calendarContent}>
            {todayEvents.length > 0 ? todayEvents.map((ev, i) => (
              <View key={i} style={styles.homeEventPill}>
                <View style={styles.eventIndicator} />
                <View>
                  <Text style={styles.calendarText}>{ev.title}</Text>
                  <Text style={styles.calendarSubtext}>{ev.fullTime}</Text>
                </View>
              </View>
            )) : <Text style={styles.calendarTextEmpty}>Regular Working Day</Text>}
          </View>
        </View>

        {/* SCHEDULE SECTION */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.statusBadgeSmall}><Text style={styles.statusBadgeText}>{scheduleStatus}</Text></View>
          </View>

          {areEventsLoading ? <Text style={styles.loadingText}>Checking Schedule...</Text> : (
            <>
              {/* 1. FULL DAY EVENT */}
              {fullDayEvent ? (
                <>
                  <View style={[styles.card, styles.majorEventCard]}>
                    <View style={styles.examTag}><Text style={styles.examTagText}>TODAY'S EVENT</Text></View>
                    <View style={styles.cardContentFlex}>
                      <Ionicons name="calendar" size={32} color="#007AFF" />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.cardTitle}>{fullDayEvent.title}</Text>
                        <Text style={styles.cardDesc}>{fullDayEvent.description || "Full Day Event"}</Text>
                        <View style={styles.metaRow}>
                          <Text style={styles.metaText}><Ionicons name="time-outline" /> Full Day</Text>
                          <View style={styles.portionTag}><Text style={styles.portionText}>No Classes</Text></View>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.noticeBox}>
                    <Ionicons name="information-circle" size={20} color="#007AFF" />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.noticeTitle}>Classes Suspended</Text>
                      <Text style={styles.noticeSub}>Day reserved for {fullDayEvent.title}.</Text>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* 2. TODAY'S EXAM */}
                  {activeExamToday && (
                    <View style={[styles.card, styles.examCard]}>
                      <View style={styles.examTag}><Text style={[styles.examTagText, { color: '#FF9500' }]}>TODAY'S EXAM</Text></View>
                      <View style={styles.cardContentFlex}>
                        <Ionicons name="trophy-outline" size={32} color="#FF9500" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.cardTitle}>{activeExamToday.title}</Text>
                          <Text style={styles.cardDesc}>
                            <Text style={{ fontWeight: 'bold' }}>{activeExamToday.todaySub.code}</Text>: {getSubjectName(activeExamToday.todaySub.code, masterData?.courses)}
                          </Text>
                          <View style={styles.metaRow}>
                            <Text style={styles.metaText}><Ionicons name="time-outline" /> {activeExamToday.todaySub.startTime} - {activeExamToday.todaySub.endTime}</Text>
                            <View style={styles.portionTag}><Text style={styles.portionText}>{activeExamToday.todaySub.portion}</Text></View>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* 3. HALF DAY EVENT */}
                  {halfDayEvent && !activeExamToday && (
                    <View style={[styles.card, styles.specialEventCard]}>
                      <View style={styles.examTag}><Text style={[styles.examTagText, { color: '#007AFF' }]}>SPECIAL EVENT</Text></View>
                      <View style={styles.cardContentFlex}>
                        <Ionicons name="calendar-outline" size={32} color="#007AFF" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.cardTitle}>{halfDayEvent.title}</Text>
                          <Text style={styles.cardDesc}>{halfDayEvent.description || "Special Session"}</Text>
                          <View style={styles.metaRow}>
                            <Text style={styles.metaText}><Ionicons name="time-outline" /> {halfDayEvent.startTime} - {halfDayEvent.endTime}</Text>
                            <View style={styles.portionTag}><Text style={styles.portionText}>Event</Text></View>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* 4. TIMETABLE */}
                  {(!activeExamPeriod || activeExamPeriod.type.includes('CT')) ? (
                    dayOrder && masterData?.timetable?.[dayOrder] ? (
                      <View style={styles.tableCard}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.th, { flex: 0.5 }]}>#</Text>
                          <Text style={[styles.th, { flex: 2 }]}>Course Details</Text>
                          <Text style={[styles.th, { flex: 1 }]}>Faculty</Text>
                        </View>
                        {masterData.timetable[dayOrder].map((code: string, index: number) => {
                          const { name, faculty } = getPeriodDetails(code, masterData?.courses);
                          return (
                            <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.rowAlt]}>
                              <Text style={[styles.td, { flex: 0.5, fontWeight: 'bold', color: '#007AFF' }]}>{index + 1}</Text>
                              <View style={{ flex: 2, paddingRight: 5 }}>
                                <Text style={{ fontWeight: '700', fontSize: 13 }}>{code.split('/')[0]}</Text>
                                <Text style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{name}</Text>
                              </View>
                              <Text style={[styles.td, { flex: 1, fontSize: 11, fontStyle: 'italic', color: '#666' }]}>{faculty}</Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No classes scheduled.</Text>
                        <Text style={{ fontSize: 12, color: '#999' }}>({scheduleStatus})</Text>
                      </View>
                    )
                  ) : (
                    <View style={styles.noticeBox}>
                      <Ionicons name="information-circle" size={24} color="#FF3B30" />
                      <View style={{ marginLeft: 10 }}>
                        <Text style={[styles.noticeTitle, { color: '#FF3B30' }]}>Classes Suspended</Text>
                        <Text style={[styles.noticeSub, { color: '#FF3B30' }]}>Suspended for {activeExamPeriod.title}.</Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </View>

        {/* LIVE UPDATES */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Live Updates ({sec})</Text>
            {isAdmin && !isEditingNote && (
              <TouchableOpacity onPress={() => { setTempNote(liveNote); setIsEditingNote(true); }} style={styles.editBtn}>
                <Ionicons name="create-outline" size={14} color="#007AFF" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {isEditingNote ? (
            <View style={styles.editForm}>
              <TextInput style={styles.editTextarea} multiline value={tempNote} onChangeText={setTempNote} />
              <View style={styles.formButtons}>
                <TouchableOpacity onPress={handleSaveNote} style={styles.saveBtn}><Text style={{ color: '#fff' }}>Save</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditingNote(false)} style={styles.cancelBtn}><Text style={{ color: '#666' }}>Cancel</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.messageContainer}><Text style={styles.messageBody}>{liveNote}</Text></View>
              {liveAuthor ? <Text style={styles.authorTag}>Posted by {liveAuthor}</Text> : null}
            </>
          )}
        </View>

        {/* GENERAL NOTICE */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>General Notice</Text>
            {isAdmin && !isEditingGeneral && (
              <TouchableOpacity onPress={() => { setTempGeneral(generalText); setIsEditingGeneral(true); }} style={styles.editBtn}>
                <Ionicons name="create-outline" size={14} color="#007AFF" />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {isEditingGeneral ? (
            <View style={styles.editForm}>
              <TextInput style={styles.editTextarea} multiline value={tempGeneral} onChangeText={setTempGeneral} />
              <View style={styles.formButtons}>
                <TouchableOpacity onPress={handleSaveGeneral} style={styles.saveBtn}><Text style={{ color: '#fff' }}>Save</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setIsEditingGeneral(false)} style={styles.cancelBtn}><Text style={{ color: '#666' }}>Cancel</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.messageContainer}><Text style={styles.messageBody}>{generalText}</Text></View>
              {generalAuthor ? <Text style={styles.authorTag}>Posted by {generalAuthor}</Text> : null}
            </>
          )}
        </View>

        {/* DETAILS GRID */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Batch</Text>
            <Text style={styles.detailValue}>{batch}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Dept</Text>
            <Text style={styles.detailValue}>{dept}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Sec</Text>
            <Text style={styles.detailValue}>{sec}</Text>
          </View>
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
  headerMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  adminBadge: { backgroundColor: '#FF3B30', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  adminBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  dateSection: { padding: 20, paddingBottom: 10 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  dateInputGroup: { flexDirection: 'row', alignItems: 'center' },
  dateDisplay: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, color: '#111', fontSize: 14, fontWeight: '500' },
  datePickerTrigger: { marginLeft: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },

  sectionContainer: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 15 },
  calendarContent: { flexDirection: 'row', flexWrap: 'wrap' },
  homeEventPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  eventIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginRight: 8 },
  calendarText: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  calendarSubtext: { fontSize: 11, color: '#60A5FA', marginLeft: 4 },
  calendarTextEmpty: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadgeSmall: { backgroundColor: '#E5E7EB', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  loadingText: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },

  // Cards
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 15, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  majorEventCard: { borderLeftWidth: 4, borderLeftColor: '#EF4444' }, // Red
  examCard: { borderLeftWidth: 4, borderLeftColor: '#F59E0B' }, // Orange
  specialEventCard: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' }, // Blue

  examTag: { marginBottom: 10 },
  examTagText: { fontSize: 10, fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 },
  cardContentFlex: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: '#6B7280', marginRight: 10 },
  portionTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  portionText: { fontSize: 10, fontWeight: '600', color: '#374151' },

  noticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', marginBottom: 15 },
  noticeTitle: { fontWeight: '700', fontSize: 14, color: '#B91C1C' },
  noticeSub: { fontSize: 12, color: '#B91C1C' },

  // Table
  tableCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  th: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'flex-start' },
  rowAlt: { backgroundColor: '#F9FAFB' },
  td: { fontSize: 12, color: '#374151' },

  emptyState: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#6B7280', fontStyle: 'italic' },

  // Updates & Edit
  editBtn: { flexDirection: 'row', alignItems: 'center' },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#007AFF', marginLeft: 4 },
  editForm: { backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  editTextarea: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, height: 80, textAlignVertical: 'top' },
  formButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  saveBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginLeft: 10 },
  cancelBtn: { backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginLeft: 10 },

  messageContainer: { backgroundColor: '#fff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  messageBody: { fontSize: 14, color: '#374151', lineHeight: 20 },
  authorTag: { fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'right', fontStyle: 'italic' },

  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 30, marginTop: 10, marginBottom: 30 },
  detailItem: { alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '700', color: '#111827' },

  modalParams: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 12 },
  closeBtn: { marginTop: 10, backgroundColor: '#007AFF', padding: 10, borderRadius: 8, alignItems: 'center' }
});
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, 
  ActivityIndicator, RefreshControl, Platform, Modal, Button 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSyncData } from '../../hooks/useSyncData';
import { ref, onValue } from 'firebase/database';
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

export default function ScheduleScreen() {
  const { user, loading: authLoading } = useAuth();
  
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'class' | 'exams'>('class');

  const [dayOrder, setDayOrder] = useState("");
  const [todayNote, setTodayNote] = useState(""); 
  
  const [globalEvents, setGlobalEvents] = useState<any[]>([]);
  const [sectionEvents, setSectionEvents] = useState<any[]>([]);
  const [areEventsLoading, setAreEventsLoading] = useState(true);
  
  const [activeExamPeriod, setActiveExamPeriod] = useState<any>(null);
  const [activeExamToday, setActiveExamToday] = useState<any>(null);
  const [activeExamTomorrow, setActiveExamTomorrow] = useState<any>(null);

  // --- DATA FETCHING ---
  const batch = user?.batch || "2026";
  const dept = user?.department || "ECE";
  const sec = user?.section || "A";

  const { data: masterData, loading: masterLoading } = useSyncData(
    `schedules/${batch}/${dept}/${sec}`, 
    `CACHE_MASTER_${batch}_${dept}_${sec}`
  );
  const { data: allCalendar } = useSyncData(`calendars/${batch}/events`, `CACHE_CALENDAR_${batch}`);

  // --- LOGIC ---
  useEffect(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

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
  }, [batch, dept, sec, currentDate]);

  useEffect(() => {
    if (!masterData || !allCalendar) return;

    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const gEvents = Array.isArray(allCalendar) ? allCalendar.filter((event: any) => event.date === todayStr) : [];
    setGlobalEvents(gEvents);

    const currentPeriod = masterData.exams?.find((ex: any) => todayStr >= ex.startDate && todayStr <= ex.endDate);
    setActiveExamPeriod(currentPeriod || null);

    if (currentPeriod) {
      const subToday = currentPeriod.subjects?.find((s: any) => s.date === todayStr);
      setActiveExamToday(subToday ? { ...currentPeriod, todaySub: subToday } : null);

      const tomorrowDate = new Date(currentDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const ty = tomorrowDate.getFullYear();
      const tm = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
      const td = String(tomorrowDate.getDate()).padStart(2, '0');
      const tomorrowStr = `${ty}-${tm}-${td}`;

      const subTom = currentPeriod.subjects?.find((s: any) => s.date === tomorrowStr);
      setActiveExamTomorrow(subTom ? { ...currentPeriod, tomSub: subTom } : null);
    } else {
      setActiveExamToday(null);
      setActiveExamTomorrow(null);
    }

    const holidayEvent = gEvents.find((e: any) => e.title.toLowerCase().includes("holiday"));
    const orderEvent = gEvents.find((e: any) => e.title.toLowerCase().includes("order"));

    if (holidayEvent) {
      setTodayNote(`Holiday: ${holidayEvent.title}`);
      setDayOrder("");
    } else if (orderEvent) {
      const order = ["Monday", ...daysOrder].find(day => orderEvent.title.includes(day));
      if (order) { setDayOrder(order); setTodayNote(`Following ${order} Order.`); }
    } else {
      const weekday = currentDate.getDay();
      if (weekday === 0) { 
        setTodayNote("Today is Sunday. No classes."); 
        setDayOrder(""); 
      } else {
        const order = ["Monday", ...daysOrder][weekday - 1];
        if (order === "Monday") { 
          setTodayNote("Today is Monday."); 
          setDayOrder(""); 
        } else { 
          setDayOrder(order); 
          setTodayNote(`Today is ${order}.`); 
        }
      }
    }
  }, [currentDate, masterData, allCalendar]);

  const todayEvents = useMemo(() => {
    const combined = [...globalEvents, ...sectionEvents];
    return Array.from(new Map(combined.map(item => [item.id || item.title, item])).values());
  }, [globalEvents, sectionEvents]);

  const fullDayEvent = todayEvents.find((e: any) => e.type === "FullDay");
  const halfDayEvent = todayEvents.find((e: any) => e.type === "HalfDay");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (selectedDate) setCurrentDate(selectedDate);
  };

  if (authLoading || masterLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <View style={styles.screen}>
      
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Academic Portal</Text>
          {/* Global Preview Tag Logic */}
          <Text style={styles.subHeader}>
             {batch} • {dept} - {sec}
          </Text>
        </View>
        
        {/* VIEW SWITCHER */}
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('class')} style={[styles.tabBtn, activeTab === 'class' && styles.activeTabBtn]}>
            <Ionicons name="calendar-outline" size={14} color={activeTab === 'class' ? '#fff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'class' && styles.activeTabText]}>Class</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('exams')} style={[styles.tabBtn, activeTab === 'exams' && styles.activeTabBtn]}>
            <Ionicons name="trophy-outline" size={14} color={activeTab === 'exams' ? '#fff' : '#666'} />
            <Text style={[styles.tabText, activeTab === 'exams' && styles.activeTabText]}>Exams</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PREMIUM PILL BAR */}
      <View style={styles.controlsBar}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: dayOrder ? '#34C759' : '#FF3B30' }]} />
          <Text style={styles.statusText}>{todayNote || "Check Schedule"}</Text>
        </View>
        
        <TouchableOpacity style={styles.datePill} onPress={() => setShowPicker(true)}>
          <Text style={styles.datePillText}>
            {currentDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </Text>
          <Ionicons name="calendar" size={16} color="#007AFF" style={{marginLeft: 5}} />
        </TouchableOpacity>
      </View>

      {/* DATE PICKER */}
      {showPicker && (
        Platform.OS === 'ios' ? (
          <Modal transparent={true} animationType="fade">
            <View style={styles.modalParams}>
              <View style={styles.modalContent}>
                <DateTimePicker value={currentDate} mode="date" display="inline" onChange={onDateChange} />
                <Button title="Close" onPress={() => setShowPicker(false)} />
              </View>
            </View>
          </Modal>
        ) : (
          <DateTimePicker value={currentDate} mode="date" display="default" onChange={onDateChange} />
        )
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}>
        
        {activeTab === 'class' ? (
          <>
            {/* 1. FULL DAY EVENT */}
            {fullDayEvent ? (
              <View style={styles.sectionContainer}>
                <View style={[styles.card, styles.majorEventCard]}>
                  <View style={styles.tagContainer}><Text style={styles.tagText}>TODAY'S EVENT</Text></View>
                  <View style={styles.cardContentFlex}>
                    <Ionicons name="calendar" size={32} color="#007AFF" />
                    <View style={{flex: 1, marginLeft: 12}}>
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
                  <View style={{marginLeft: 10}}>
                    <Text style={styles.noticeTitle}>Classes Suspended</Text>
                    <Text style={styles.noticeSub}>Day reserved for {fullDayEvent.title}.</Text>
                  </View>
                </View>
              </View>
            ) : (
              <>
                {/* 2. TODAY'S EXAM */}
                {activeExamToday && (
                  <View style={[styles.card, styles.examCard]}>
                    <View style={styles.tagContainer}><Text style={[styles.tagText, {color: '#FF9500'}]}>TODAY'S EXAM</Text></View>
                    <View style={styles.cardContentFlex}>
                      <Ionicons name="trophy-outline" size={32} color="#FF9500" />
                      <View style={{flex: 1, marginLeft: 12}}>
                        <Text style={styles.cardTitle}>{activeExamToday.title}</Text>
                        <Text style={styles.cardDesc}>
                          <Text style={{fontWeight: 'bold'}}>{activeExamToday.todaySub.code}</Text>: {getSubjectName(activeExamToday.todaySub.code, masterData?.courses)}
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
                    <View style={styles.tagContainer}><Text style={[styles.tagText, {color: '#007AFF'}]}>SPECIAL EVENT</Text></View>
                    <View style={styles.cardContentFlex}>
                      <Ionicons name="calendar-outline" size={32} color="#007AFF" />
                      <View style={{flex: 1, marginLeft: 12}}>
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

                {/* 4. TIMETABLE LOGIC */}
                {(!activeExamPeriod || activeExamPeriod.type.includes('CT')) ? (
                  dayOrder && masterData?.timetable?.[dayOrder] ? (
                    <View style={styles.sectionContainer}>
                      <Text style={styles.sectionHeaderTitle}>Timetable for {sec} ({dayOrder})</Text>
                      <View style={styles.tableCard}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.th, {flex: 0.5}]}>#</Text>
                          <Text style={[styles.th, {flex: 2}]}>Course Details</Text>
                          <Text style={[styles.th, {flex: 1}]}>Faculty</Text>
                        </View>
                        {masterData.timetable[dayOrder].map((code: string, index: number) => {
                          const { name, faculty } = getPeriodDetails(code, masterData?.courses);
                          return (
                            <View key={index} style={[styles.tableRow, index % 2 === 0 && styles.rowAlt]}>
                              <Text style={[styles.td, {flex: 0.5, fontWeight: 'bold', color: '#007AFF'}]}>{index + 1}</Text>
                              <View style={{flex: 2, paddingRight: 5}}>
                                <Text style={{fontWeight: '700', fontSize: 13}}>{code.split('/')[0]}</Text>
                                <Text style={{fontSize: 12, color: '#555', marginTop: 2}}>{name}</Text>
                              </View>
                              <Text style={[styles.td, {flex: 1, fontSize: 11, fontStyle: 'italic', color: '#666'}]}>{faculty}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No classes scheduled.</Text>
                      <Text style={{fontSize: 12, color: '#999'}}>({todayNote})</Text>
                    </View>
                  )
                ) : (
                  <View style={styles.noticeBox}>
                    <Ionicons name="information-circle" size={24} color="#FF3B30" />
                    <View style={{marginLeft: 10}}>
                      <Text style={[styles.noticeTitle, {color: '#FF3B30'}]}>Classes Suspended</Text>
                      <Text style={[styles.noticeSub, {color: '#FF3B30'}]}>Suspended for {activeExamPeriod.title}.</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* 5. WEEKLY OVERVIEW */}
            <View style={styles.sectionContainer}>
              {daysOrder.map(day => (
                <View key={day} style={styles.dayCard}>
                  <Text style={styles.dayCardTitle}>{day}</Text>
                  {masterData?.timetable?.[day] ? (
                    <View style={styles.miniTable}>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.th, {flex: 0.5}]}>#</Text>
                        <Text style={[styles.th, {flex: 1}]}>Course</Text>
                        <Text style={[styles.th, {flex: 1}]}>Faculty</Text>
                      </View>
                      {masterData.timetable[day].map((code: string, idx: number) => {
                         const { name, faculty } = getPeriodDetails(code, masterData?.courses);
                         return (
                           <View key={idx} style={styles.tableRow}>
                             <Text style={[styles.td, {flex: 0.5, color: '#007AFF'}]}>{idx+1}</Text>
                             <View style={{flex: 1}}>
                               <Text style={{fontWeight: '700', fontSize: 12}}>{code.split('/')[0]}</Text>
                               <Text style={{fontSize: 10, color: '#666'}} numberOfLines={1}>{name}</Text>
                             </View>
                             <Text style={[styles.td, {flex: 1, fontSize: 10, color: '#888'}]} numberOfLines={1}>{faculty}</Text>
                           </View>
                         );
                      })}
                    </View>
                  ) : <Text style={styles.emptyTextSmall}>No classes scheduled.</Text>}
                </View>
              ))}
            </View>

            {/* 6. COURSES DIRECTORY */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeaderTitle}>Academic Courses ({dept})</Text>
              <View style={styles.tableCard}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, {flex: 1.5}]}>Course Details</Text>
                  <Text style={[styles.th, {flex: 1}]}>Faculty & Load</Text>
                </View>
                {masterData?.courses?.length > 0 ? masterData.courses.map((course: any, idx: number) => (
                  <View key={idx} style={[styles.tableRow, idx % 2 === 0 && styles.rowAlt]}>
                    <View style={{flex: 1.5, paddingRight: 10}}>
                      <Text style={{fontWeight: '600', fontSize: 13, color: '#000'}}>{course.name}</Text>
                      <Text style={{fontSize: 11, color: '#666', marginTop: 2}}># {course.code}</Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={{fontSize: 12, fontWeight: '500', color: '#000'}}>{course.faculty}</Text>
                      <Text style={{fontSize: 11, color: '#888', marginTop: 2}}>{course.periods} Periods Total</Text>
                    </View>
                  </View>
                )) : <Text style={styles.emptyTextSmall}>No course data.</Text>}
              </View>
            </View>

            {/* 7. STAFF INFO */}
            <View style={styles.sectionContainer}>
              <View style={styles.staffCard}>
                <Text style={styles.staffHeader}>Class Counselors</Text>
                {masterData?.counseling?.counselors?.length > 0 ? masterData.counseling.counselors.map((c: string, idx: number) => (
                  <View key={idx} style={styles.staffRow}>
                    <Ionicons name="person-circle-outline" size={18} color="#007AFF" />
                    <Text style={styles.staffName}>{c}</Text>
                  </View>
                )) : <Text style={styles.emptyTextSmall}>No counselors assigned.</Text>}
              </View>

              <View style={[styles.staffCard, {marginTop: 15}]}>
                <Text style={styles.staffHeader}>Key Coordinators</Text>
                {masterData?.counseling?.coordinators && Object.entries(masterData.counseling.coordinators).length > 0 ? 
                  Object.entries(masterData.counseling.coordinators).map(([role, name]: any) => (
                    <View key={role} style={styles.staffRow}>
                      <Ionicons name="person-circle-outline" size={18} color="#007AFF" />
                      <View style={{marginLeft: 8}}>
                        <Text style={styles.staffRole}>{role}</Text>
                        <Text style={styles.staffName}>{name}</Text>
                      </View>
                    </View>
                  )) : <Text style={styles.emptyTextSmall}>No coordinators assigned.</Text>
                }
              </View>
            </View>

          </>
        ) : (
          <View style={styles.sectionContainer}>
            {/* --- EXAMS VIEW --- */}
            {masterData?.exams?.length > 0 ? masterData.exams.map((ex: any, idx: number) => (
              <View key={idx} style={styles.fullExamCard}>
                <View style={styles.examHeaderRow}>
                  <Ionicons name="trophy" size={24} color="#FF9500" />
                  <View style={{marginLeft: 10}}>
                    <Text style={styles.examTitle}>{ex.title}</Text>
                    <Text style={styles.examSub}>{ex.type} Assessment</Text>
                  </View>
                </View>
                <View style={styles.tableCard}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, {flex: 1}]}>Date</Text>
                    <Text style={[styles.th, {flex: 1.5}]}>Subject</Text>
                    <Text style={[styles.th, {flex: 1}]}>Portion</Text>
                  </View>
                  {ex.subjects.map((s: any, i: number) => (
                    <View key={i} style={[
                      styles.tableRow, 
                      s.date === currentDate.toISOString().split('T')[0] ? {backgroundColor: '#FFF3E0'} : {}
                    ]}>
                      <View style={{flex: 1}}>
                        <Text style={{fontWeight: '700', fontSize: 12}}>{new Date(s.date).getDate()}/{new Date(s.date).getMonth()+1}</Text>
                        <Text style={{fontSize: 10, color: '#666'}}>{s.startTime}</Text>
                      </View>
                      <View style={{flex: 1.5, paddingRight: 5}}>
                        <Text style={{fontWeight: '600', fontSize: 12}}>{s.code}</Text>
                        <Text style={{fontSize: 11, color: '#444'}} numberOfLines={2}>{getSubjectName(s.code, masterData?.courses)}</Text>
                      </View>
                      <View style={{flex: 1}}>
                        <View style={styles.portionBadge}><Text style={styles.portionBadgeText}>{s.portion}</Text></View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No exams scheduled yet.</Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  
  header: { 
    padding: 20, paddingTop: 60, backgroundColor: '#fff', 
    borderBottomWidth: 1, borderBottomColor: '#E5E5EA',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  subHeader: { fontSize: 13, color: '#8E8E93', marginTop: 2, fontWeight: '600' },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 8, padding: 2 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  activeTabBtn: { backgroundColor: '#007AFF', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  tabText: { fontSize: 12, fontWeight: '600', marginLeft: 4, color: '#666' },
  activeTabText: { color: '#fff' },

  controlsBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E5E5EA' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#333' },
  
  datePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#007AFF' },
  datePillText: { fontSize: 12, fontWeight: '700', color: '#007AFF' },

  // Cards & Boxes
  sectionContainer: { paddingHorizontal: 15, marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  majorEventCard: { borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  examCard: { borderLeftWidth: 4, borderLeftColor: '#FF9500' },
  specialEventCard: { borderLeftWidth: 4, borderLeftColor: '#007AFF' },
  
  tagContainer: { marginBottom: 10 },
  tagText: { fontSize: 10, fontWeight: '800', color: '#007AFF', letterSpacing: 0.5 },
  cardContentFlex: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#444', lineHeight: 18, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: 12, color: '#666', marginRight: 10 },
  portionTag: { backgroundColor: '#F0F0F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  portionText: { fontSize: 10, fontWeight: '600', color: '#555' },

  noticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9FF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#BAE6FD' },
  noticeTitle: { fontWeight: '700', fontSize: 14, color: '#007AFF' },
  noticeSub: { fontSize: 12, color: '#007AFF' },

  // Tables
  sectionHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  tableCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E5EA', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  th: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'flex-start' },
  rowAlt: { backgroundColor: '#F9FAFB' },
  td: { fontSize: 12, color: '#374151' },

  // Weekly Overview
  dayCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E5EA' },
  dayCardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: '#111' },
  miniTable: { borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 8, overflow: 'hidden' },

  // Staff
  staffCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  staffHeader: { fontSize: 14, fontWeight: '700', marginBottom: 10, color: '#111' },
  staffRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  staffName: { fontSize: 13, fontWeight: '500', color: '#333', marginLeft: 8 },
  staffRole: { fontSize: 10, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' },

  // Exams View
  fullExamCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5EA' },
  examHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  examTitle: { fontSize: 18, fontWeight: '800', color: '#111' },
  examSub: { fontSize: 13, color: '#666' },
  portionBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  portionBadgeText: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },

  emptyState: { alignItems: 'center', padding: 30 },
  emptyText: { color: '#8E8E93', fontStyle: 'italic' },
  emptyTextSmall: { color: '#8E8E93', fontStyle: 'italic', fontSize: 12 },

  modalParams: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 12 }
});
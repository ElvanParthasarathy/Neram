import React, { memo } from 'react';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatDate as formatDisplayDate, formatTime } from '../utils/formatters';

// --- HELPERS (Passed down or duplicated if simple) ---
// Note: Intentionally keeping simple helpers inline or assuming they are passed as needed, 
// but for complex logic like `getPeriodDetails`, we'll expect the *resolved* data or the helper function to be passed.

export const TodayHighlightItem = memo(({
    fullDayEvent,
    activeExamToday,
    halfDayEvent,
    activeExamPeriod,
    dayOrder,
    timetable,
    styles,
    colors,
    getSubjectName,
    getPeriodDetails
}) => {
    return (
        <View>
            {fullDayEvent ? (
                <View style={[styles.card, styles.cardMajor]}>
                    <View style={styles.cardTag}><Text style={styles.cardTagText}>TODAY'S EVENT</Text></View>
                    <Text style={styles.cardTitle}>{fullDayEvent.title}</Text>
                    <Text style={styles.cardSubtitle}>Classes Suspended</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
                        <Text style={styles.textSecondary}>Day reserved for {fullDayEvent.title}.</Text>
                    </View>
                </View>
            ) : (
                <>
                    {/* A. TODAY'S EXAM */}
                    {activeExamToday && activeExamToday.todaySub && (
                        <View style={[styles.card, styles.cardMajor]}>
                            <View style={styles.cardTag}><Text style={styles.cardTagText}>TODAY'S EXAM</Text></View>
                            <Text style={styles.cardTitle}>{activeExamToday.title}</Text>
                            <Text style={styles.cardSubtitle}>{activeExamToday.todaySub.code}: {getSubjectName(activeExamToday.todaySub.code)}</Text>
                            <View style={styles.cardMetaConfig}>
                                <View style={styles.metaItem}><Text style={styles.metaText}>{formatTime(activeExamToday.todaySub.startTime)} - {formatTime(activeExamToday.todaySub.endTime)}</Text></View>
                                <View style={styles.metaItem}><Text style={styles.metaText}>{activeExamToday.todaySub.portion}</Text></View>
                            </View>
                        </View>
                    )}
                    {/* B. HALF DAY EVENT */}
                    {halfDayEvent && (
                        <View style={[styles.card, styles.cardLeftAccent]}>
                            <View style={styles.cardTag}><Text style={styles.cardTagText}>SPECIAL EVENT</Text></View>
                            <Text style={styles.cardTitle}>{halfDayEvent.title}</Text>
                            <Text style={styles.cardSubtitle}>{halfDayEvent.description || "Special Session"}</Text>
                            <View style={styles.cardMetaConfig}>
                                <View style={styles.metaItem}><Text style={styles.metaText}>{formatTime(halfDayEvent.startTime || "09:00")} - {formatTime(halfDayEvent.endTime || "12:00")}</Text></View>
                            </View>
                        </View>
                    )}
                    {/* C. REGULAR CLASS TIMETABLE */}
                    {(!activeExamPeriod || (activeExamPeriod.type && activeExamPeriod.type.includes('CT'))) && dayOrder && timetable && (
                        <View style={styles.weeklyCard}>
                            <Text style={styles.dayTitle}>Today's Classes ({dayOrder})</Text>
                            {timetable.map((code, index) => {
                                const { name, faculty } = getPeriodDetails(code);
                                return (
                                    <View key={`${dayOrder}-${index}-${code}`} style={[styles.tableRow, styles.noPadding]}>
                                        <View style={styles.col1}><Text style={styles.indexText}>{index + 1}</Text></View>
                                        <View style={styles.col2}>
                                            <Text style={styles.courseCode}>{code}</Text>
                                            <Text style={styles.courseName}>{name}</Text>
                                            <Text style={styles.facultyName}>{faculty}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </>
            )}
        </View>
    );
});

export const HeaderItem = memo(({ title, styles }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
));

export const WeeklyDayItem = memo(({ day, timetable, styles, getPeriodDetails }) => (
    <View style={styles.weeklyCard}>
        <Text style={styles.dayTitle}>{day}</Text>
        {timetable ? (
            timetable.map((code, idx) => {
                const { name, faculty } = getPeriodDetails(code);
                return (
                    <View key={`${day}-${idx}-${code}`} style={styles.weeklyRow}>
                        <Text style={styles.weeklyIndex}>{idx + 1}</Text>
                        <View style={styles.flex1}>
                            {code.includes('/') ? (
                                <View>
                                    <Text style={styles.courseCode}>{code}</Text>
                                    <Text style={styles.courseName}>{name}</Text>
                                    <Text style={styles.facultyName}>{faculty}</Text>
                                </View>
                            ) : (
                                <View>
                                    <Text style={styles.courseCode}>{code}</Text>
                                    <Text style={styles.courseName}>{name}</Text>
                                    <Text style={styles.facultyName}>{faculty}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );
            })
        ) : <Text style={styles.italicSecondary}>No classes.</Text>}
    </View>
));

export const CourseItem = memo(({ course, styles }) => (
    <View style={[styles.weeklyCard, { marginTop: 4, marginBottom: 4 }]}>
        <View style={styles.courseRow}>
            <View style={styles.flex1}>
                <Text style={styles.courseTitle}>{course.name}</Text>
                <Text style={styles.courseCodeSmall}># {course.code}</Text>
            </View>
            <View style={styles.alignEnd}>
                <Text style={styles.facultyText}>{course.faculty}</Text>
                <Text style={styles.periodText}>{course.periods} hrs</Text>
            </View>
        </View>
    </View>
));

export const StaffSectionItem = memo(({ counselors, coordinators, styles, colors }) => (
    <View>
        <View style={styles.infoCard}>
            <Text style={[styles.dayTitle, styles.mb8]}>Counselors</Text>
            <View style={styles.infoList}>
                {counselors?.map((name, i) => (
                    <View key={`${name}-${i}`} style={styles.infoRow}>
                        <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.infoText}>{name}</Text>
                    </View>
                ))}
            </View>
        </View>
        <View style={[styles.infoCard, styles.mb80]}>
            <Text style={[styles.dayTitle, styles.mb8]}>Coordinators</Text>
            <View style={styles.infoList}>
                {coordinators && Object.entries(coordinators).map(([role, name]) => (
                    <View key={role} style={styles.infoRow}>
                        <Ionicons name="star-outline" size={16} color={colors.textSecondary} />
                        <View>
                            <Text style={styles.coordinatorRole}>{role}</Text>
                            <Text style={styles.infoText}>{name}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
        <View style={{ height: 100 }} />
    </View>
));

export const ExamCardItem = memo(({ exam, todayStr, styles, colors, getSubjectName }) => (
    <View style={styles.examFullCard}>
        <View style={styles.examFullHeader}>
            <Ionicons name="trophy-outline" size={24} color={colors.accent} style={styles.mr12} />
            <View>
                <Text style={styles.examTitle}>{exam.title}</Text>
                <Text style={styles.examSubtitle}>{exam.type} - Assessment Plan</Text>
            </View>
        </View>
        <View>
            {exam.subjects.map((s, i) => (
                <View key={`${exam.id}-${s.code}-${i}`} style={[styles.tableRow, s.date === todayStr && styles.bgSubtle]}>
                    <View style={styles.width80}>
                        <Text style={styles.courseTitle}>{formatDisplayDate(s.date)}</Text>
                        <Text style={styles.periodText}>{formatTime(s.startTime)}</Text>
                    </View>
                    <View style={[styles.flex1, styles.ph12]}>
                        <Text style={styles.courseCode}>{s.code}</Text>
                        <Text style={styles.courseName}>{getSubjectName(s.code)}</Text>
                        <View style={styles.portionTag}>
                            <Text style={styles.portionText}>{s.portion}</Text>
                        </View>
                    </View>
                </View>
            ))}
        </View>
    </View>
));

export const EmptyExamsItem = memo(({ styles }) => (
    <View style={[styles.card, styles.examEmpty]}>
        <Text style={styles.textSecondary}>No exams published yet.</Text>
    </View>
));

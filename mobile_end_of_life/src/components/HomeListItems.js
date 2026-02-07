import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatTime } from '../utils/formatters';

// --- HELPERS (Passed down or duplicated if simple) ---

export const ScheduleItem = memo(({
    scheduleStatus,
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
        <View style={styles.marginBottom20}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Today's Schedule</Text>
                <Text style={styles.scheduleStatusText}>{scheduleStatus}</Text>
            </View>

            {fullDayEvent ? (
                <View style={[styles.card, styles.cardMajor]}>
                    <View style={styles.cardTag}><Text style={styles.cardTagText}>TODAY'S EVENT</Text></View>
                    <Text style={styles.cardTitle}>{fullDayEvent.title}</Text>
                    <Text style={styles.cardSubtitle}>Classes Suspended</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
                        <Text style={styles.textSecondary}>Day reserved for this event.</Text>
                    </View>
                </View>
            ) : (
                <>
                    {/* A. EXAM CARD */}
                    {activeExamToday && activeExamToday.todaySub && (
                        <View style={[styles.card, styles.cardMajor]}>
                            <View style={styles.cardTag}>
                                <Text style={styles.cardTagText}>
                                    {activeExamToday.type?.includes('CT') ? 'CYCLE TEST' : 'SEMESTER / MODEL'}
                                </Text>
                            </View>
                            <Text style={styles.cardTitle}>{activeExamToday.title}</Text>
                            <Text style={styles.cardSubtitle}>
                                {activeExamToday.todaySub.code}: {getSubjectName(activeExamToday.todaySub.code)}
                            </Text>
                            <View style={styles.cardMetaConfig}>
                                <View style={styles.metaItem}><Text style={styles.metaText}>{formatTime(activeExamToday.todaySub.startTime)} - {formatTime(activeExamToday.todaySub.endTime)}</Text></View>
                                <View style={styles.metaItem}><Text style={styles.metaText}>{activeExamToday.todaySub.portion}</Text></View>
                            </View>
                        </View>
                    )}

                    {/* B. HALF DAY EVENT */}
                    {halfDayEvent && !activeExamToday && (
                        <View style={[styles.card, styles.cardLeftAccent]}>
                            <View style={styles.cardTag}><Text style={styles.cardTagText}>SPECIAL EVENT</Text></View>
                            <Text style={styles.cardTitle}>{halfDayEvent.title}</Text>
                            <Text style={styles.cardSubtitle}>{halfDayEvent.description || "Special Session"}</Text>
                            <View style={styles.cardMetaConfig}>
                                <View style={styles.metaItem}><Text style={styles.metaText}>{formatTime(halfDayEvent.startTime || "09:00")} - {formatTime(halfDayEvent.endTime || "12:00")}</Text></View>
                            </View>
                        </View>
                    )}

                    {/* C. TIMETABLE */}
                    {(!activeExamPeriod || (activeExamPeriod.type && activeExamPeriod.type.includes('CT'))) ? (
                        dayOrder && timetable ? (
                            <View style={styles.tableContainer}>
                                <View style={[styles.tableRow, styles.tableHeader]}>
                                    <View style={styles.col1}><Text style={styles.headerText}>#</Text></View>
                                    <View style={styles.col2}><Text style={styles.headerText}>Course Details</Text></View>
                                </View>
                                {timetable.map((code, index) => {
                                    const { name, faculty } = getPeriodDetails(code);
                                    return (
                                        <View key={`${dayOrder}-${index}-${code}`} style={styles.tableRow}>
                                            <View style={styles.col1}><Text style={styles.cellText}>{index + 1}</Text></View>
                                            <View style={styles.col2}>
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
                                })}
                            </View>
                        ) : (
                            <View style={[styles.card, styles.emptyCard]}>
                                <Text style={styles.emptyTextMain}>No classes scheduled.</Text>
                                <Text style={styles.emptyTextSub}>({scheduleStatus})</Text>
                            </View>
                        )
                    ) : (
                        <View style={[styles.card, styles.emptyCard]}>
                            <Text style={styles.cardTitle}>Classes Suspended</Text>
                            <Text style={styles.cardSubtitle}>During {activeExamPeriod?.title || "Exam"}</Text>
                            <Text style={styles.textSecondaryMargin8}>Prepare well for your exam!</Text>
                        </View>
                    )}
                </>
            )}
        </View>
    );
});

export const UpdatesItem = memo(({
    todayStr,
    userProfile,
    sectionUpdates,
    isEditingNote,
    setTempNote,
    setIsEditingNote,
    tempNote,
    renderEditForm, // Passing the function as prop
    handleSaveNote,
    styles,
    colors
}) => {
    return (
        <View style={styles.marginBottom20}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Daily Updates</Text>
                {['admin', 'cr'].includes(userProfile?.role) && !isEditingNote && (
                    <TouchableOpacity onPress={() => { setTempNote(sectionUpdates.live?.[todayStr]?.note || ""); setIsEditingNote(true); }}>
                        <Text style={styles.linkAccent}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            {isEditingNote ? (
                renderEditForm(tempNote, setTempNote, handleSaveNote, () => setIsEditingNote(false))
            ) : (
                sectionUpdates.live?.[todayStr]?.note ? (
                    <View style={styles.updateCard}>
                        <Text style={styles.updateText}>{sectionUpdates.live[todayStr].note}</Text>
                        {sectionUpdates.live[todayStr].author && (
                            <Text style={styles.authorText}>- {sectionUpdates.live[todayStr].author}</Text>
                        )}
                    </View>
                ) : (
                    <Text style={styles.emptyStateText}>No updates posted for today.</Text>
                )
            )}
        </View>
    );
});

export const GeneralNoticeItem = memo(({
    userProfile,
    sectionUpdates,
    isEditingGeneral,
    setTempGeneral,
    setIsEditingGeneral,
    tempGeneral,
    renderEditForm,
    handleSaveGeneral,
    styles,
    colors
}) => {
    return (
        <View style={styles.marginBottom40}>
            <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>General Notice</Text>
                {['admin', 'cr'].includes(userProfile?.role) && !isEditingGeneral && (
                    <TouchableOpacity onPress={() => { setTempGeneral(sectionUpdates.general?.text || ""); setIsEditingGeneral(true); }}>
                        <Text style={styles.linkAccent}>Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            {isEditingGeneral ? (
                renderEditForm(tempGeneral, setTempGeneral, handleSaveGeneral, () => setIsEditingGeneral(false))
            ) : (
                sectionUpdates.general?.text ? (
                    <View style={[styles.updateCard, styles.cardLeftSuccess]}>
                        <Text style={styles.updateText}>{sectionUpdates.general.text}</Text>
                        {sectionUpdates.general.author && (
                            <Text style={styles.authorText}>- {sectionUpdates.general.author}</Text>
                        )}
                    </View>
                ) : (
                    <Text style={styles.emptyStateText}>No general notices.</Text>
                )
            )}
        </View>
    );
});

export const FooterItem = memo(({ userProfile, styles }) => (
    <View style={[styles.card, styles.footerCard]}>
        <View style={styles.footerRow}>
            <View style={styles.footerCol}>
                <Text style={styles.footerLabel}>Batch</Text>
                <Text style={styles.footerValue}>{userProfile?.batch}</Text>
            </View>
            <View style={styles.footerCol}>
                <Text style={styles.footerLabel}>Section</Text>
                <Text style={styles.footerValue}>{userProfile?.section}</Text>
            </View>
        </View>
        <Text style={styles.footerNote}>Neram App • Standard User</Text>
    </View>
));

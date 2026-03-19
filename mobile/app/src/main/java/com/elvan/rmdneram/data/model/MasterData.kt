package com.elvan.rmdneram.data.model

/**
 * Master schedule data from Firebase at /schedules/{batch}/{dept}/{section}
 */
import androidx.compose.runtime.Immutable

@Immutable
data class MasterData(
    val courses: List<Course> = emptyList(),
    val timetable: Map<String, List<String>> = emptyMap(), // "Monday" -> ["CS101", "MA102", ...]
    val exams: List<ExamSchedule> = emptyList(),
    val specialClasses: List<SpecialClass> = emptyList(),
    val counseling: CounselingData = CounselingData()
)

/**
 * Special Class configuration (overrides holidays/suspensions)
 */
@Immutable
data class SpecialClass(
    val id: String = "",
    val date: String = "",
    val typeTitle: String = "",
    val title: String = "",
    val desc: String = "",
    val batches: List<SpecialClassBatch> = emptyList()
)

/**
 * Individual batch/period within a special class
 */
@Immutable
data class SpecialClassBatch(
    val circleLabel: String = "",
    val startTime: String = "",
    val endTime: String = "",
    val subjectCode: String = "",
    val subjectName: String = "",
    val faculty: String = ""
)

/**
 * Course information
 */
@Immutable
data class Course(
    val code: String = "",
    val name: String = "",
    val faculty: String = "",
    val credit: Int = 0,
    val type: String = "", // Theory, Practical
    val periods: Int = 0
)

/**
 * Exam schedule configuration
 */
@Immutable
data class ExamSchedule(
    val id: Long = 0,
    val title: String = "",
    val type: String = "", // "CT1", "Semester", "Model", etc.
    val startDate: String = "",
    val endDate: String = "",
    val subjects: List<ExamSubject> = emptyList()
)

/**
 * Individual exam subject within an exam schedule
 */
@Immutable
data class ExamSubject(
    val date: String = "",
    val code: String = "",
    val startTime: String = "",
    val endTime: String = "",
    val portion: String = "",
    val batches: List<PracticalBatch> = emptyList()
)

/**
 * Practical exam batch entry (label, section, date, time, register range)
 */
@Immutable
data class PracticalBatch(
    val label: String = "",
    val section: String = "",
    val date: String = "",
    val startTime: String = "",
    val endTime: String = "",
    val registerRange: String = "",
    val totalCount: String = ""
)

/**
 * Grouped practical batches for a specific subject today
 */
@Immutable
data class TodayBatchGroup(
    val code: String = "",
    val subjectName: String = "",
    val batches: List<PracticalBatch> = emptyList()
)

/**
 * Counseling data (optional feature)
 */
@Immutable
data class CounselingData(
    val counselors: List<String> = emptyList(),
    val coordinators: Map<String, String> = emptyMap()
)

/**
 * Resolved period data for display in timetable
 */
@Immutable
data class PeriodSubEntry(
    val code: String,
    val name: String,
    val faculty: String
)

data class PeriodDisplayData(
    val number: Int,
    val time: String,
    val entries: List<PeriodSubEntry>,
    val isLab: Boolean = false
)

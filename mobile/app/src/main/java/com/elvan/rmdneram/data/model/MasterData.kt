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
    val counseling: CounselingData = CounselingData()
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
    val portion: String = ""
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

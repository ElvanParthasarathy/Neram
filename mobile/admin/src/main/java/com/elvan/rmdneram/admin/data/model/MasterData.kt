package com.elvan.rmdneram.admin.data.model

import androidx.compose.runtime.Immutable
import kotlinx.collections.immutable.ImmutableList
import kotlinx.collections.immutable.ImmutableMap
import kotlinx.collections.immutable.persistentListOf
import kotlinx.collections.immutable.persistentMapOf

@Immutable
data class MasterData(
    val courses: ImmutableList<Course> = persistentListOf(),
    val timetable: ImmutableMap<String, List<String>> = persistentMapOf(), // "Monday" -> ["CS101", "MA102", ...]
    val exams: ImmutableList<ExamSchedule> = persistentListOf(),
    val counseling: CounselingData = CounselingData()
)

@Immutable
data class Course(
    val code: String = "",
    val name: String = "",
    val faculty: String = "",
    val credit: Int = 0,
    val type: String = "", // Theory, Practical
    val periods: Int = 0
)

@Immutable
data class ExamSchedule(
    val id: Long = 0,
    val title: String = "",
    val type: String = "", // "CT1", "Semester", "Model", etc.
    val startDate: String = "",
    val endDate: String = "",
    val subjects: List<ExamSubject> = emptyList()
)

@Immutable
data class ExamSubject(
    val date: String = "",
    val code: String = "",
    val startTime: String = "",
    val endTime: String = "",
    val portion: String = ""
)

@Immutable
data class CounselingData(
    val counselors: List<String> = emptyList(),
    val coordinators: Map<String, String> = emptyMap()
)

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

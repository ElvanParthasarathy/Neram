package com.elvan.rmdneram.ui.common

import com.elvan.rmdneram.ui.home.ScheduleState

/**
 * Configuration for displaying schedule sections.
 * Determines which components (Exam, Timetable, Notices) should be visible
 * based on the current schedule state logic.
 */
data class ScheduleDisplayConfig(
    val showFullDayEvent: Boolean = false,
    val showExamCard: Boolean = false,
    val showHalfDayEvent: Boolean = false,
    val showTimetable: Boolean = false,
    val showSuspensionNotice: Boolean = false,
    val suspensionReason: String = ""
)

object ScheduleLogic {
    /**
     * Calculates the display configuration based on ScheduleState.
     * This unifies the logic between HomeScreen and ScheduleScreen.
     */
    fun calculateDisplayConfig(state: ScheduleState): ScheduleDisplayConfig {
        var showFullDay = false
        var showExam = false
        var showHalfDay = false
        var showTimetable = false
        var showSuspended = false
        var suspensionReason = ""

        // 1. Full Day Event
        if (state.fullDayEvent != null) {
            showFullDay = true
        }

        // 2. Today's Exam
        if (state.todayExam != null) {
            showExam = true
        }

        // 3. Half Day Event
        if (state.halfDayEvent != null) {
            showHalfDay = true
        }

        // 4. Timetable vs Suspension
        val isExamPeriod = state.activeExamPeriod != null
        val isCycleTestPeriod = state.activeExamPeriod?.type?.contains("CT") == true
        val hasPeriods = state.periods.isNotEmpty()

        if (showFullDay && (!isExamPeriod || isCycleTestPeriod)) {
            showSuspended = true
            suspensionReason = "Day reserved for ${state.fullDayEvent?.title}."
        } else if (isExamPeriod && !isCycleTestPeriod) {
            showSuspended = true
            suspensionReason = "Regular classes are suspended during the ${state.activeExamPeriod?.title} period."
        } else if (hasPeriods) {
            showTimetable = true
        }

        return ScheduleDisplayConfig(
            showFullDayEvent = showFullDay,
            showExamCard = showExam,
            showHalfDayEvent = showHalfDay,
            showTimetable = showTimetable,
            showSuspensionNotice = showSuspended,
            suspensionReason = suspensionReason
        )
    }
}

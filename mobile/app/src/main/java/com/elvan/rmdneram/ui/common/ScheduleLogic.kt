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
        // 1. Full Day Event (Highest Priority)
        // If a full day event exists (e.g., Holiday, Symposium), it takes over.
        if (state.fullDayEvent != null) {
            return ScheduleDisplayConfig(
                showFullDayEvent = true,
                suspensionReason = "Day reserved for ${state.fullDayEvent.title}."
            )
        }

        // 2. Analyze Components for Regular Day
        var showExam = false
        var showHalfDay = false
        var showTimetable = false
        var showSuspended = false
        var suspensionReason = ""

        // A. Today's Exam
        // Show if we have an exam subject for today
        if (state.todayExam != null) {
            showExam = true
        }

        // B. Half Day Event
        // Only show if there is specific Half Day Event data AND it's not overriding an Exam view (?)
        // ScheduleScreen logic: Show if todayExam is null.
        if (state.halfDayEvent != null && state.todayExam == null) {
            showHalfDay = true
        }

        // C. Timetable vs Suspension (Batching & Exam Type Logic)
        val isExamPeriod = state.activeExamPeriod != null
        val isCycleTestPeriod = state.activeExamPeriod?.type?.contains("CT") == true
        val hasPeriods = state.periods.isNotEmpty()

        // Logic:
        // Show Timetable if:
        // 1. It is NOT an exam period (Regular Class)
        // 2. OR It IS an exam period BUT it is a Cycle Test (Classes continue)
        // AND we have actual periods to show.
        if ((!isExamPeriod || isCycleTestPeriod) && hasPeriods) {
            showTimetable = true
        } 
        // Show Suspension Notice if:
        // It IS an exam period (e.g. Model Exam) AND NOT a Cycle Test
        else if (isExamPeriod && !isCycleTestPeriod) {
            showSuspended = true
            suspensionReason = "Regular classes are suspended during the ${state.activeExamPeriod?.title} period."
        }

        return ScheduleDisplayConfig(
            showExamCard = showExam,
            showHalfDayEvent = showHalfDay,
            showTimetable = showTimetable,
            showSuspensionNotice = showSuspended,
            suspensionReason = suspensionReason
        )
    }
}

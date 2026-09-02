package com.elvan.neram.ui.common

import com.elvan.neram.ui.home.ScheduleState
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.trWithLang

/**
 * Configuration for displaying schedule sections.
 * Determines which components (Exam, Timetable, Notices) should be visible
 * based on the current schedule state logic.
 */
data class ScheduleDisplayConfig(
    val showFullDayEvent: Boolean = false,
    val showExamCard: Boolean = false,
    val showSpecialClass: Boolean = false,
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
    fun calculateDisplayConfig(state: ScheduleState, lang: String = "en"): ScheduleDisplayConfig {
        var showFullDay = false
        var showExam = false
        var showSpecialClass = false
        var showHalfDay = false
        var showTimetable = false
        var showSuspended = false
        var suspensionReason = ""

        // 1. Special Class (Dominant Override)
        if (state.todaySpecialClasses.isNotEmpty()) {
            val specialTitle = state.todaySpecialClasses.first().title.ifBlank { state.todaySpecialClasses.first().typeTitle }
            return ScheduleDisplayConfig(
                showFullDayEvent = false,
                showExamCard = false,
                showSpecialClass = true,
                showHalfDayEvent = false,
                showTimetable = false,
                showSuspensionNotice = true,
                suspensionReason = K.classesSuspendedDueTo.trWithLang(lang, specialTitle)
            )
        }

        // 2. Full Day Event
        if (state.fullDayEvents.isNotEmpty()) {
            showFullDay = true
        }

        // 3. Today's Exam
        if (state.todayExams.isNotEmpty() || state.todayBatches.isNotEmpty()) {
            showExam = true
        }

        // 4. Half Day Event
        if (state.halfDayEvents.isNotEmpty()) {
            showHalfDay = true
        }

        // 5. Timetable vs Suspension
        val isExamPeriod = state.activeExamPeriod != null
        val isCycleTestPeriod = state.activeExamPeriod?.type?.contains("CT") == true
        val hasPeriods = state.periods.isNotEmpty()

        if (showFullDay && (!isExamPeriod || isCycleTestPeriod)) {
            showSuspended = true
            val eventTitle = state.fullDayEvents.firstOrNull()?.title ?: ""
            suspensionReason = K.dayReservedFor.trWithLang(lang, eventTitle)
        } else if (isExamPeriod && !isCycleTestPeriod) {
            showSuspended = true
            val examTitle = state.activeExamPeriod?.title ?: ""
            suspensionReason = K.regularClassesSuspendedDuring.trWithLang(lang, examTitle)
        } else if (hasPeriods) {
            showTimetable = true
        }

        return ScheduleDisplayConfig(
            showFullDayEvent = showFullDay,
            showExamCard = showExam,
            showSpecialClass = showSpecialClass,
            showHalfDayEvent = showHalfDay,
            showTimetable = showTimetable,
            showSuspensionNotice = showSuspended,
            suspensionReason = suspensionReason
        )
    }
}

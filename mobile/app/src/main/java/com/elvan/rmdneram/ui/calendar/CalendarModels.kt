package com.elvan.rmdneram.ui.calendar

import androidx.compose.ui.graphics.Color
import kotlinx.datetime.LocalDate

/**
 * Calendar Models - Types used by CalendarScreen
 */

data class NeramCalendarEvent(
    val id: String,
    val title: String,
    val description: String? = null,
    val startTime: Long,
    val endTime: Long,
    val isAllDay: Boolean = false,
    val location: String? = null,
    val color: Color = Color(0xFF4285F4),
    val rrule: String? = null,
    val reminders: List<EventReminder> = emptyList(),
    val attendees: List<EventAttendee> = emptyList(),
    val calendarId: Long = 0L,
    val timezone: String = "UTC"
) {
    val recurrenceRule: RecurrenceRule?
        get() = rrule?.let { RecurrenceRule.fromRRuleString(it) }
}

data class NeramCalendarHoliday(
    val id: String,
    val name: String,
    val date: LocalDate,
    val type: HolidayType = HolidayType.NATIONAL
)

enum class HolidayType {
    NATIONAL, REGIONAL, OPTIONAL, CUSTOM, OBSERVANCE
}

enum class CalendarViewType {
    MONTH, WEEK, DAY, SCHEDULE, YEAR
}

data class NeramCalendarInfo(
    val id: Long,
    val displayName: String,
    val accountName: String,
    val ownerName: String,
    val color: Int,
    val isVisible: Boolean = true
)

data class EventReminder(
    val minutesBefore: Int,
    val method: ReminderMethod = ReminderMethod.NOTIFICATION
) {
    fun formatDescription(): String = when {
        minutesBefore == 0 -> "At time of event"
        minutesBefore < 60 -> "$minutesBefore min before"
        minutesBefore < 1440 -> "${minutesBefore / 60} hour(s) before"
        else -> "${minutesBefore / 1440} day(s) before"
    }
}

enum class ReminderMethod {
    NOTIFICATION, EMAIL
}

data class EventAttendee(
    val email: String,
    val name: String? = null,
    val status: AttendeeStatus = AttendeeStatus.PENDING
)

enum class AttendeeStatus {
    ACCEPTED, DECLINED, PENDING, TENTATIVE
}

data class RecurrenceRule(
    val frequency: RecurrenceFrequency,
    val interval: Int = 1,
    val count: Int? = null,
    val until: LocalDate? = null,
    val byDay: List<DayOfWeek>? = null,
    val byMonthDay: List<Int>? = null,
    val byMonth: List<Int>? = null
) {
    fun toRRuleString(): String {
        val parts = mutableListOf("FREQ=${frequency.name}")
        if (interval > 1) parts.add("INTERVAL=$interval")
        count?.let { parts.add("COUNT=$it") }
        until?.let { parts.add("UNTIL=${it.toString().replace("-", "")}") }
        byDay?.let { parts.add("BYDAY=${it.joinToString(",") { d -> d.shortName }}") }
        byMonthDay?.let { parts.add("BYMONTHDAY=${it.joinToString(",")}") }
        byMonth?.let { parts.add("BYMONTH=${it.joinToString(",")}") }
        return parts.joinToString(";")
    }

    fun formatDescription(): String = when (frequency) {
        RecurrenceFrequency.DAILY -> if (interval == 1) "Daily" else "Every $interval days"
        RecurrenceFrequency.WEEKLY -> if (interval == 1) "Weekly" else "Every $interval weeks"
        RecurrenceFrequency.MONTHLY -> if (interval == 1) "Monthly" else "Every $interval months"
        RecurrenceFrequency.YEARLY -> if (interval == 1) "Yearly" else "Every $interval years"
    }

    companion object {
        fun fromRRuleString(rrule: String): RecurrenceRule? {
            val parts = rrule.split(";").associate {
                val (key, value) = it.split("=", limit = 2)
                key to value
            }
            val freq = parts["FREQ"]?.let { RecurrenceFrequency.valueOf(it) } ?: return null
            return RecurrenceRule(
                frequency = freq,
                interval = parts["INTERVAL"]?.toIntOrNull() ?: 1,
                count = parts["COUNT"]?.toIntOrNull()
            )
        }
    }
}

enum class RecurrenceFrequency {
    DAILY, WEEKLY, MONTHLY, YEARLY
}

enum class DayOfWeek(val shortName: String) {
    SUNDAY("SU"), MONDAY("MO"), TUESDAY("TU"), WEDNESDAY("WE"),
    THURSDAY("TH"), FRIDAY("FR"), SATURDAY("SA")
}

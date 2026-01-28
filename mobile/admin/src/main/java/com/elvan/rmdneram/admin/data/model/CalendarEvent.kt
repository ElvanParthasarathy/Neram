package com.elvan.rmdneram.admin.data.model

import androidx.compose.runtime.Immutable

@Immutable
data class CalendarEvent(
    val id: String = "",
    val title: String = "",
    val date: String = "", // YYYY-MM-DD format
    val type: String = "", // "FullDay", "HalfDay", "Regular"
    val startTime: String? = null,
    val endTime: String? = null,
    val description: String? = null,
    val fullTime: String? = null // Combined time range string
) {
    fun isHoliday(): Boolean = title.lowercase().contains("holiday")
    
    fun isOrderOverride(): Boolean = title.lowercase().contains("order")
    
    fun extractOrderDay(): String? {
        if (!isOrderOverride()) return null
        return listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
            .find { title.contains(it, ignoreCase = true) }
    }
    
    fun getTimeRangeDisplay(): String {
        return fullTime ?: when {
            startTime != null && endTime != null -> "$startTime - $endTime"
            startTime != null -> startTime
            else -> "All Day"
        }
    }
}

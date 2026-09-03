package com.elvan.neram.data.model

import androidx.compose.runtime.Immutable
import com.elvan.neram.utils.DateTimeUtils
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

@Immutable
data class CalendarEvent(
    val id: String = "",
    val title: String = "",
    val date: String = "", // YYYY-MM-DD format
    val endDate: String? = null, // YYYY-MM-DD format (Optional, for range)
    val groupId: String? = null, // Optional: Group ID for linking separate daily entries
    val type: String = "", // "FullDay", "HalfDay", "Regular"
    val startTime: String? = null,
    val endTime: String? = null,
    val description: String? = null,
    val fullTime: String? = null, // Combined time range string
    val isSection: Boolean = false // True if from Event Manager (Section Events)
) {
    /**
     * Check if this is a holiday event
     */
    fun isHoliday(): Boolean = type == "Holiday" || title.lowercase().contains("holiday")
    
    /**
     * Check if this is an occasion (Academic Day)
     */
    fun isOccasion(): Boolean = type == "Academic"
    /**
     * Check if this specifies a day order override
     */
    fun isOrderOverride(): Boolean = title.lowercase().contains("order")
    
    /**
     * Extract day name from order override event
     */
    fun extractOrderDay(): String? {
        if (!isOrderOverride()) return null
        return listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
            .find { title.contains(it, ignoreCase = true) }
    }
    
    /**
     * Get formatted time range for display
     */
    fun getTimeRangeDisplay(lang: String = "en"): String {
        // Preference: Calculated from start/end (so we can enforce AM/PM format)
        if (startTime != null || endTime != null) {
            return when {
                startTime != null && endTime != null -> "${DateTimeUtils.formatTimeForDisplay(startTime)} - ${DateTimeUtils.formatTimeForDisplay(endTime)}"
                startTime != null -> DateTimeUtils.formatTimeForDisplay(startTime)
                else -> "" // Should not happen given outer if
            }
        }
        
        // Fallback to fullTime (formatted)
        return if (fullTime != null) DateTimeUtils.formatTimeRange(fullTime, lang) else K.allDay.tr(lang)
    }
}

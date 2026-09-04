package com.elvan.neram.data.model

import androidx.compose.runtime.Immutable
import com.elvan.neram.utils.DateTimeUtils
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.toMozhiName
import com.elvan.neram.ui.mozhiyaakkam.tr
import java.time.DayOfWeek

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
    fun isHoliday(): Boolean {
        if (type.equals("Holiday", ignoreCase = true)) return true
        val titleLower = title.lowercase()
        val langs = listOf(K.ENGLISH, K.TAMIL, K.TAMIL_LATIN, K.TAMIL_MALAYALAM, K.MALAYALAM, K.MALAYALAM_LATIN, K.MALAYALAM_TAMIL, K.TELUGU, K.TELUGU_LATIN)
        return langs.any { titleLower.contains(K.holiday.tr(it).lowercase()) }
    }
    
    /**
     * Check if this is an occasion (Academic Day)
     */
    fun isOccasion(): Boolean = type.equals("Academic", ignoreCase = true) || type.equals("Occasion", ignoreCase = true)

    /**
     * Check if this specifies a day order override
     */
    fun isOrderOverride(): Boolean {
        if (type.equals("Order", ignoreCase = true)) return true
        val titleLower = title.lowercase()
        val langs = listOf(K.ENGLISH, K.TAMIL, K.TAMIL_LATIN, K.TAMIL_MALAYALAM, K.MALAYALAM, K.MALAYALAM_LATIN, K.MALAYALAM_TAMIL, K.TELUGU, K.TELUGU_LATIN)
        val orderKeywords = langs.map { K.followingOrder.tr(it).lowercase() } + listOf("order", "day order", "வரிசை")
        return orderKeywords.any { titleLower.contains(it) }
    }
    
    /**
     * Extract day name from order override event
     */
    fun extractOrderDay(): String? {
        if (!isOrderOverride()) return null
        val titleLower = title.lowercase()
        val days = listOf(
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY,
            DayOfWeek.SATURDAY
        )
        val langs = listOf(K.ENGLISH, K.TAMIL, K.TAMIL_LATIN, K.TAMIL_MALAYALAM, K.MALAYALAM, K.MALAYALAM_LATIN, K.MALAYALAM_TAMIL, K.TELUGU, K.TELUGU_LATIN)
        for (day in days) {
            val variants = langs.flatMap { lang ->
                listOf(
                    day.toMozhiName(lang, isShort = false).lowercase(),
                    day.toMozhiName(lang, isShort = true).lowercase(),
                    day.toMozhiName(lang, withKizhamai = true).lowercase()
                )
            }.distinct()
            if (variants.any { titleLower.contains(it) }) {
                return day.getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
            }
        }
        return null
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

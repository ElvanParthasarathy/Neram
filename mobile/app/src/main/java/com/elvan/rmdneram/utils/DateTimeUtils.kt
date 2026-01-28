package com.elvan.rmdneram.utils

import java.util.Locale

/**
 * Global utilities for Date and Time formatting
 * Rules:
 * - Date: DD-MM-YYYY (except alphanumeric)
 * - Time: 12-hour AM/PM (no 24h)
 */
object DateTimeUtils {
    
    /**
     * Format time string to 12-hour AM/PM format
     * Input: "13:30", "9:00", "09:00"
     * Output: "01:30 PM", "9:00 AM", "09:00 AM"
     */
    fun formatTimeForDisplay(timeStr: String?): String {
        if (timeStr.isNullOrEmpty()) return ""
        try {
            // Check if already contains AM/PM
            if (timeStr.contains("AM", ignoreCase = true) || timeStr.contains("PM", ignoreCase = true)) {
                return timeStr
            }
            
            // Handle "HH:mm" -> "hh:mm a"
            val parts = timeStr.trim().split(":")
            if (parts.size >= 2) {
                var hour = parts[0].toIntOrNull() ?: return timeStr
                val minute = parts[1]
                
                val ampm = if (hour >= 12) "PM" else "AM"
                if (hour > 12) hour -= 12
                if (hour == 0) hour = 12
                
                // Keep hour formatting
                return String.format(Locale.US, "%02d:%s %s", hour, minute, ampm)
            }
        } catch (e: Exception) {
            return timeStr
        }
        return timeStr
    }

    /**
     * Format date string to DD-MM-YYYY
     * Input: "2026-01-14" -> Output: "14-01-2026"
     * Exception: "12 Jan 2026" -> Remains as is
     */
    fun formatDateForDisplay(dateStr: String?): String {
        if (dateStr.isNullOrEmpty()) return ""
        
        // Exception: Alphanumeric dates (e.g., "12 Jan 2026")
        if (dateStr.matches(Regex(".*[a-zA-Z].*"))) return dateStr
        
        // Input: YYYY-MM-DD -> Output: DD-MM-YYYY
        if (dateStr.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) {
             val parts = dateStr.split("-")
             return "${parts[2]}-${parts[1]}-${parts[0]}"
        }
        
        // Input: DD-MM-YYYY -> Return as is
        if (dateStr.matches(Regex("\\d{2}-\\d{2}-\\d{4}"))) {
             return dateStr
        }
        
        return dateStr
    }

    /**
     * Format time range string
     * Input: "13:00 - 14:00" -> Output: "01:00 PM - 02:00 PM"
     */
    fun formatTimeRange(rangeStr: String?): String {
        if (rangeStr.isNullOrEmpty()) return ""
        if (rangeStr.equals("Full Day", ignoreCase = true)) return "All Day"
        
        if (rangeStr.contains("-")) {
            val parts = rangeStr.split("-")
            if (parts.size == 2) {
                return "${formatTimeForDisplay(parts[0])} - ${formatTimeForDisplay(parts[1])}"
            }
        }
        return formatTimeForDisplay(rangeStr)
    }
}

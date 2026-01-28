package com.elvan.rmdneram.ui.schedule

import com.elvan.rmdneram.data.model.Course
import com.elvan.rmdneram.data.model.PeriodSubEntry

/**
 * ScheduleHelpers - Utility functions for Schedule screen
 * 
 * Contains all helper functions for parsing course codes,
 * resolving period details, and formatting display data.
 */

// Data structure for resolved results
data class ScheduleResolvedPeriod(val entries: List<PeriodSubEntry>, val isLab: Boolean)

/**
 * Get clean subject name from course code
 */
fun getSubjectName(code: String, courses: List<Course>): String {
    val name = courses.find { it.code == code }?.name ?: "Subject"
    
    // 1. Remove anything in parentheses (e.g., "(Lab Integrated)", "(Integrated)")
    var cleanName = name.replace(Regex("\\s*\\(.*?\\)"), "").trim()
    
    // 2. Remove other common redundant terms without parentheses
    val patterns = listOf(
        "\\s*Lab Integrated",
        "\\s*Integrated Lab",
        "\\s*Integrated",
        "\\s*Lab"
    )
    
    patterns.forEach { pattern ->
        cleanName = cleanName.replace(Regex(pattern, RegexOption.IGNORE_CASE), "").trim()
    }
    
    return cleanName.trimEnd('-', ' ', '/')
}

/**
 * Get period details from course code
 */
fun getDetails(code: String, courses: List<Course>): ScheduleResolvedPeriod {
    // Handle split courses (e.g., "CS101 A1 / MA102 B1") - Parity with HomeViewModel
    if (code.contains("/")) {
        val parts = code.split("/").map { it.trim() }
        val results = parts.map { formatSingleEntryLocal(it, courses) }
        
        return ScheduleResolvedPeriod(
            entries = results.flatMap { it.entries },
            isLab = results.any { it.isLab }
        )
    }
    
    return formatSingleEntryLocal(code, courses)
}

/**
 * Format a single timetable entry
 */
private fun formatSingleEntryLocal(entry: String, courses: List<Course>): ScheduleResolvedPeriod {
    val trimmed = entry.trim()
    
    // 1. Try exact match first
    val directMatch = courses.find { it.code == trimmed }
    if (directMatch != null) {
        return processCourseDisplayLocal(directMatch, null, trimmed)
    }
    
    // 2. React Native Pattern: Extract FIRST WORD as course code
    // This handles: "22CS602 LAB BAY 3" -> "22CS602"
    // Also handles: "22IT602 A1" -> "22IT602"
    val parts = trimmed.split(" ")
    val pureCode = parts.first()
    val courseByFirstWord = courses.find { it.code == pureCode }
    if (courseByFirstWord != null) {
        // LAB badge ONLY for actual batch patterns (A1, A2, B3, etc.)
        // NOT for codes like "PP BK" or "PP - RJ"
        val suffix = parts.getOrNull(1) ?: ""
        val batchPattern = Regex("^[A-Za-z]\\d+$")  // A1, B2, C3, etc.
        val isLabBatch = batchPattern.matches(suffix)
        return processCourseDisplayLocal(courseByFirstWord, if (isLabBatch) suffix else null, trimmed)
    }
    
    // 3. Still no match - return raw entry
    return ScheduleResolvedPeriod(listOf(PeriodSubEntry(trimmed, "", "")), false)
}

/**
 * Process course display with lab badge logic
 */
private fun processCourseDisplayLocal(course: Course, batch: String?, originalCode: String): ScheduleResolvedPeriod {
    var cleanName = course.name
    var faculty = course.faculty
    val isLab = batch != null // Lab ONLY if batch number exists

    if (isLab) {
        // Remove suffixes like "Lab Integrated", "(Lab Integrated)", "Integrated Lab", etc.
        val patterns = listOf(
            "\\s*\\(Lab Integrated\\)",
            "\\s*\\(Integrated Lab\\)",
            "\\s*Lab Integrated",
            "\\s*Integrated Lab",
            "\\s*\\(Integrated\\)",
            "\\s*\\(Lab\\)",
            "\\s*Integrated",
            "\\s*Lab"
        )
        
        patterns.forEach { pattern ->
            cleanName = cleanName.replace(Regex(pattern, RegexOption.IGNORE_CASE), "").trim()
        }

        // Also clean up any accidental trailing dashes or spaces
        cleanName = cleanName.trimEnd('-', ' ', '/')

        // User: "no need to show a1 a2 again in subject name"
        // Batch suffix removal if it was part of the original course name string
        if (batch != null) {
            cleanName = cleanName.replace(Regex("\\s+$batch$", RegexOption.IGNORE_CASE), "").trim()
        }
        
        // Faculty matching: "Dr. A (A1) / Dr. B (B1)"
        if (batch != null && course.faculty.contains("($batch)")) {
            val splitFaculties = course.faculty.split("/").map { it.trim() }
            val matching = splitFaculties.find { it.contains("($batch)") }
            if (matching != null) {
                faculty = matching.replace("($batch)", "").trim()
            }
        }
    }
    
    return ScheduleResolvedPeriod(
        entries = listOf(PeriodSubEntry(originalCode, cleanName, faculty)),
        isLab = isLab
    )
}

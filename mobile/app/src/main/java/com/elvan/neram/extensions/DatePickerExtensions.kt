package com.elvan.neram.extensions

import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.time.ZoneOffset
import java.util.Calendar

/**
 * Extension methods for date conversions and picker operations in Neram.
 */

/**
 * Convert [LocalDate] to [Calendar] instance.
 */
fun LocalDate.toCalendar(): Calendar {
    val calendar = Calendar.getInstance()
    calendar.clear()
    calendar.set(year, monthValue - 1, dayOfMonth)
    return calendar
}

/**
 * Convert [Calendar] to [LocalDate].
 */
fun Calendar.toLocalDate(): LocalDate {
    return LocalDate.of(
        get(Calendar.YEAR),
        get(Calendar.MONTH) + 1,
        get(Calendar.DAY_OF_MONTH)
    )
}

/**
 * Convert [LocalDate] to UTC epoch millis.
 */
fun LocalDate.toUtcEpochMilli(): Long {
    return atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli()
}

/**
 * Convert epoch millis to [LocalDate] at UTC.
 */
fun Long.toUtcLocalDate(): LocalDate {
    return Instant.ofEpochMilli(this).atZone(ZoneOffset.UTC).toLocalDate()
}

/**
 * Convert epoch millis to [LocalDate] at system default timezone.
 */
fun Long.toSystemLocalDate(): LocalDate {
    return Instant.ofEpochMilli(this).atZone(ZoneId.systemDefault()).toLocalDate()
}

/**
 * Get all dates in a [YearMonth] as a list of [LocalDate].
 */
fun YearMonth.getAllDates(): List<LocalDate> {
    return (1..lengthOfMonth()).map { atDay(it) }
}

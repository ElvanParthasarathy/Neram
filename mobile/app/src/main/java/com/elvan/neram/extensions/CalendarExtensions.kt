package com.elvan.neram.extensions

import com.elvan.neram.ui.mozhiyaakkam.toMozhiDayMonth
import com.elvan.neram.ui.mozhiyaakkam.toMozhiMonthName
import com.elvan.neram.ui.mozhiyaakkam.toMozhiMonthYear
import com.elvan.neram.ui.mozhiyaakkam.toMozhiName
import com.elvan.neram.ui.mozhiyaakkam.toMozhiString
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.Month
import java.time.YearMonth

/**
 * Extension methods for calendar, day-of-week, and month localization in Neram.
 */

/**
 * Format a [LocalDate] as localized short string (e.g. "12 Sanavari").
 */
fun LocalDate.toShortDisplayString(lang: String): String {
    return toMozhiDayMonth(lang, isShort = true)
}

/**
 * Format a [LocalDate] as localized full string (e.g. "12 Sanavari 2026").
 */
fun LocalDate.toFullDisplayString(lang: String): String {
    return "  "
}

/**
 * Get the localized single-letter or short weekday representation.
 */
fun DayOfWeek.toSingleLetter(lang: String): String {
    return toMozhiName(lang, isSingleLetter = true)
}

/**
 * Get the localized full weekday name.
 */
fun DayOfWeek.toFullName(lang: String): String {
    return toMozhiName(lang, isShort = false)
}

/**
 * Check if the [LocalDate] is today.
 */
fun LocalDate.isToday(): Boolean {
    return this == LocalDate.now()
}

/**
 * Check if the [LocalDate] falls on a weekend (Sunday).
 */
fun LocalDate.isSunday(): Boolean {
    return this.dayOfWeek == DayOfWeek.SUNDAY
}

package com.elvan.neram.ui.mozhiyaakkam

import androidx.compose.runtime.Composable
import androidx.compose.runtime.ReadOnlyComposable
import com.elvan.neram.ui.theme.LocalAppLanguage
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.Month
import java.time.YearMonth

/**
 * Resolves a translation key according to the active language code:
 * - K.TAMIL -> ta[key].ta
 * - K.TAMIL_LATIN -> ta[key].latn
 * - Otherwise -> en[key]
 */
fun resolveString(key: String, lang: String): String {
    return when (lang) {
        K.TAMIL -> ta[key]?.ta ?: en[key] ?: key
        K.TAMIL_LATIN -> ta[key]?.latn ?: en[key] ?: key
        K.ENGLISH -> en[key] ?: key
        else -> en[key] ?: key
    }
}

/**
 * Translates a key string based on the current Compose LocalAppLanguage.
 */
@Composable
@ReadOnlyComposable
fun String.tr(): String {
    val lang = LocalAppLanguage.current
    return tr(lang)
}

/**
 * Translates a key string with an explicit language code.
 */
fun String.tr(lang: String): String {
    return resolveString(this, lang)
}

/**
 * Translates a formatted key string with arguments based on the current Compose LocalAppLanguage.
 */
@Composable
@ReadOnlyComposable
fun String.tr(vararg args: Any): String {
    val raw = this.tr()
    return try {
        String.format(raw, *args)
    } catch (_: Exception) {
        raw
    }
}

/**
 * Translates a formatted key string with an explicit language code.
 */
fun String.trWithLang(lang: String, vararg args: Any): String {
    val raw = this.tr(lang)
    return try {
        String.format(raw, *args)
    } catch (_: Exception) {
        raw
    }
}

// ── Date & Month Localization Helpers ──

fun getMonthKey(monthValue: Int, isShort: Boolean = false): String {
    return if (isShort) {
        when (monthValue) {
            1 -> K.monthJanShort
            2 -> K.monthFebShort
            3 -> K.monthMarShort
            4 -> K.monthAprShort
            5 -> K.monthMayShort
            6 -> K.monthJunShort
            7 -> K.monthJulShort
            8 -> K.monthAugShort
            9 -> K.monthSepShort
            10 -> K.monthOctShort
            11 -> K.monthNovShort
            12 -> K.monthDecShort
            else -> ""
        }
    } else {
        when (monthValue) {
            1 -> K.monthJan
            2 -> K.monthFeb
            3 -> K.monthMar
            4 -> K.monthApr
            5 -> K.monthMay
            6 -> K.monthJun
            7 -> K.monthJul
            8 -> K.monthAug
            9 -> K.monthSep
            10 -> K.monthOct
            11 -> K.monthNov
            12 -> K.monthDec
            else -> ""
        }
    }
}

fun getDayKey(
    dayOfWeek: DayOfWeek,
    isShort: Boolean = false,
    withKizhamai: Boolean = false
): String {
    return when {
        withKizhamai -> when (dayOfWeek) {
            DayOfWeek.MONDAY -> K.dayMondayLong
            DayOfWeek.TUESDAY -> K.dayTuesdayLong
            DayOfWeek.WEDNESDAY -> K.dayWednesdayLong
            DayOfWeek.THURSDAY -> K.dayThursdayLong
            DayOfWeek.FRIDAY -> K.dayFridayLong
            DayOfWeek.SATURDAY -> K.daySaturdayLong
            DayOfWeek.SUNDAY -> K.daySundayLong
        }
        isShort -> when (dayOfWeek) {
            DayOfWeek.MONDAY -> K.dayMonday
            DayOfWeek.TUESDAY -> K.dayTuesday
            DayOfWeek.WEDNESDAY -> K.dayWednesday
            DayOfWeek.THURSDAY -> K.dayThursday
            DayOfWeek.FRIDAY -> K.dayFriday
            DayOfWeek.SATURDAY -> K.daySaturday
            DayOfWeek.SUNDAY -> K.daySunday
        }
        else -> when (dayOfWeek) {
            DayOfWeek.MONDAY -> K.dayMondayFull
            DayOfWeek.TUESDAY -> K.dayTuesdayFull
            DayOfWeek.WEDNESDAY -> K.dayWednesdayFull
            DayOfWeek.THURSDAY -> K.dayThursdayFull
            DayOfWeek.FRIDAY -> K.dayFridayFull
            DayOfWeek.SATURDAY -> K.daySaturdayFull
            DayOfWeek.SUNDAY -> K.daySundayFull
        }
    }
}

fun Month.toMozhiName(lang: String, isShort: Boolean = false): String {
    return getMonthKey(this.value, isShort).tr(lang)
}

fun Month.toMozhiMonthName(lang: String, isShort: Boolean = false): String {
    return toMozhiName(lang, isShort)
}

fun DayOfWeek.toMozhiName(
    lang: String,
    isShort: Boolean = false,
    isSingleLetter: Boolean = false,
    withKizhamai: Boolean = false
): String {
    if (isSingleLetter) {
        return when (lang) {
            K.TAMIL -> when (this) {
                DayOfWeek.SUNDAY -> "ஞா"
                DayOfWeek.MONDAY -> "தி"
                DayOfWeek.TUESDAY -> "செ"
                DayOfWeek.WEDNESDAY -> "அறி"
                DayOfWeek.THURSDAY -> "வி"
                DayOfWeek.FRIDAY -> "வெ"
                DayOfWeek.SATURDAY -> "காரி"
            }
            K.TAMIL_LATIN -> when (this) {
                DayOfWeek.SUNDAY -> "Ny"
                DayOfWeek.MONDAY -> "Th"
                DayOfWeek.TUESDAY -> "Ch"
                DayOfWeek.WEDNESDAY -> "Ar"
                DayOfWeek.THURSDAY -> "Vi"
                DayOfWeek.FRIDAY -> "Ve"
                DayOfWeek.SATURDAY -> "Ka"
            }
            else -> when (this) {
                DayOfWeek.SUNDAY -> "S"
                DayOfWeek.MONDAY -> "M"
                DayOfWeek.TUESDAY -> "T"
                DayOfWeek.WEDNESDAY -> "W"
                DayOfWeek.THURSDAY -> "T"
                DayOfWeek.FRIDAY -> "F"
                DayOfWeek.SATURDAY -> "S"
            }
        }
    }
    val key = getDayKey(this, isShort = isShort, withKizhamai = withKizhamai)
    return key.tr(lang)
}

fun kotlinx.datetime.Month.toKtxMozhiName(lang: String, isShort: Boolean = false): String {
    return getMonthKey(this.value, isShort).tr(lang)
}

fun kotlinx.datetime.DayOfWeek.toKtxMozhiName(
    lang: String,
    isShort: Boolean = false,
    isSingleLetter: Boolean = false,
    withKizhamai: Boolean = false
): String {
    val javaDay = DayOfWeek.of(this.value)
    return javaDay.toMozhiName(lang, isShort, isSingleLetter, withKizhamai)
}

fun YearMonth.toMozhiString(lang: String, isShort: Boolean = false): String {
    val mName = getMonthKey(this.monthValue, isShort).tr(lang)
    return "$mName ${this.year}"
}

fun LocalDate.toMozhiMonthYear(lang: String, isShort: Boolean = false): String {
    val mName = getMonthKey(this.monthValue, isShort).tr(lang)
    return "$mName ${this.year}"
}

fun LocalDate.toMozhiDayMonth(lang: String, isShort: Boolean = false): String {
    val mName = getMonthKey(this.monthValue, isShort).tr(lang)
    return "${this.dayOfMonth} $mName"
}

fun LocalDate.toMozhiFullDate(lang: String): String {
    val dayName = this.dayOfWeek.toMozhiName(lang, isShort = false)
    val monthName = getMonthKey(this.monthValue, isShort = false).tr(lang)
    return "$dayName, ${this.dayOfMonth} $monthName ${this.year}"
}

fun kotlinx.datetime.LocalDate.toKtxMozhiMonthYear(lang: String, isShort: Boolean = false): String {
    val mName = getMonthKey(this.monthNumber, isShort).tr(lang)
    return "$mName ${this.year}"
}

fun kotlinx.datetime.LocalDate.toKtxMozhiDayMonth(lang: String, isShort: Boolean = false): String {
    val mName = getMonthKey(this.monthNumber, isShort).tr(lang)
    return "${this.dayOfMonth} $mName"
}

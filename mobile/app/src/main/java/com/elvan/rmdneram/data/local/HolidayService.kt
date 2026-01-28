package com.elvan.rmdneram.data.local

import com.elvan.rmdneram.ui.calendar.NeramCalendarHoliday
import com.elvan.rmdneram.ui.calendar.HolidayType
import kotlinx.datetime.LocalDate
import kotlinx.datetime.Month

/**
 * Service providing holiday data for calendar views.
 * Currently supports Indian national holidays with extensibility for other regions.
 */
class HolidayService {
    
    /**
     * Get holidays for a specific year.
     */
    fun getHolidays(year: Int, region: String = "IN"): List<NeramCalendarHoliday> {
        return when (region) {
            "IN" -> getIndianHolidays(year)
            else -> getIndianHolidays(year) // Default to India for now
        }
    }
    
    /**
     * Get holidays for a specific month.
     */
    fun getHolidaysForMonth(year: Int, month: Month, region: String = "IN"): List<NeramCalendarHoliday> {
        return getHolidays(year, region).filter { it.date.month == month }
    }
    
    /**
     * Check if a specific date is a holiday.
     */
    fun isHoliday(date: LocalDate, region: String = "IN"): Boolean {
        return getHolidays(date.year, region).any { it.date == date }
    }
    
    /**
     * Get holiday name for a specific date, or null if not a holiday.
     */
    fun getHolidayName(date: LocalDate, region: String = "IN"): String? {
        return getHolidays(date.year, region).find { it.date == date }?.name
    }
    
    /**
     * Indian National Holidays (Gazetted)
     * These are fixed-date holidays that remain the same each year.
     * Note: Some Hindu/Muslim holidays are lunar-based and dates vary.
     */
    private fun getIndianHolidays(year: Int): List<NeramCalendarHoliday> {
        val holidays = mutableListOf<NeramCalendarHoliday>()
        
        // January
        holidays.add(NeramCalendarHoliday(
            id = "in_new_year",
            name = "New Year's Day",
            date = LocalDate(year, Month.JANUARY, 1),
            type = HolidayType.OBSERVANCE
        ))
        holidays.add(NeramCalendarHoliday(
            id = "in_republic_day",
            name = "Republic Day",
            date = LocalDate(year, Month.JANUARY, 26),
            type = HolidayType.NATIONAL
        ))
        
        // March (Holi - approximate, varies by lunar calendar)
        holidays.add(NeramCalendarHoliday(
            id = "in_holi",
            name = "Holi",
            date = getHoliDate(year),
            type = HolidayType.NATIONAL
        ))
        
        // April
        holidays.add(NeramCalendarHoliday(
            id = "in_good_friday",
            name = "Good Friday",
            date = getGoodFridayDate(year),
            type = HolidayType.NATIONAL
        ))
        
        // May
        holidays.add(NeramCalendarHoliday(
            id = "in_buddha_purnima",
            name = "Buddha Purnima",
            date = getBuddhaPurnimaDate(year),
            type = HolidayType.NATIONAL
        ))
        
        // August
        holidays.add(NeramCalendarHoliday(
            id = "in_independence_day",
            name = "Independence Day",
            date = LocalDate(year, Month.AUGUST, 15),
            type = HolidayType.NATIONAL
        ))
        holidays.add(NeramCalendarHoliday(
            id = "in_janmashtami",
            name = "Janmashtami",
            date = getJanmashtamiDate(year),
            type = HolidayType.NATIONAL
        ))
        
        // October
        holidays.add(NeramCalendarHoliday(
            id = "in_gandhi_jayanti",
            name = "Gandhi Jayanti",
            date = LocalDate(year, Month.OCTOBER, 2),
            type = HolidayType.NATIONAL
        ))
        holidays.add(NeramCalendarHoliday(
            id = "in_dussehra",
            name = "Dussehra",
            date = getDussehraDate(year),
            type = HolidayType.NATIONAL
        ))
        
        // November (Diwali - varies by lunar calendar)
        holidays.add(NeramCalendarHoliday(
            id = "in_diwali",
            name = "Diwali",
            date = getDiwaliDate(year),
            type = HolidayType.NATIONAL
        ))
        holidays.add(NeramCalendarHoliday(
            id = "in_guru_nanak_jayanti",
            name = "Guru Nanak Jayanti",
            date = getGuruNanakDate(year),
            type = HolidayType.NATIONAL
        ))
        
        // December
        holidays.add(NeramCalendarHoliday(
            id = "in_christmas",
            name = "Christmas",
            date = LocalDate(year, Month.DECEMBER, 25),
            type = HolidayType.NATIONAL
        ))
        
        // Islamic Holidays (approximate - lunar calendar)
        holidays.add(NeramCalendarHoliday(
            id = "in_eid_ul_fitr",
            name = "Eid ul-Fitr",
            date = getEidUlFitrDate(year),
            type = HolidayType.NATIONAL
        ))
        holidays.add(NeramCalendarHoliday(
            id = "in_eid_ul_adha",
            name = "Eid ul-Adha (Bakrid)",
            date = getEidUlAdhaDate(year),
            type = HolidayType.NATIONAL
        ))
        holidays.add(NeramCalendarHoliday(
            id = "in_muharram",
            name = "Muharram",
            date = getMuharramDate(year),
            type = HolidayType.NATIONAL
        ))
        holidays.add(NeramCalendarHoliday(
            id = "in_milad_un_nabi",
            name = "Milad-un-Nabi",
            date = getMiladUnNabiDate(year),
            type = HolidayType.NATIONAL
        ))
        
        // Tamil Nadu Specific
        holidays.add(NeramCalendarHoliday(
            id = "in_pongal",
            name = "Pongal",
            date = LocalDate(year, Month.JANUARY, 14),
            type = HolidayType.REGIONAL
        ))
        holidays.add(NeramCalendarHoliday(
            id = "in_tamil_new_year",
            name = "Tamil New Year",
            date = LocalDate(year, Month.APRIL, 14),
            type = HolidayType.REGIONAL
        ))
        
        return holidays.sortedBy { it.date }
    }
    
    // Lunar calendar date calculations (approximate for each year)
    // These would ideally come from an API or comprehensive table
    private fun getHoliDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.MARCH, 25)
        2025 -> LocalDate(2025, Month.MARCH, 14)
        2026 -> LocalDate(2026, Month.MARCH, 3)
        else -> LocalDate(year, Month.MARCH, 15) // Approximate
    }
    
    private fun getGoodFridayDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.MARCH, 29)
        2025 -> LocalDate(2025, Month.APRIL, 18)
        2026 -> LocalDate(2026, Month.APRIL, 3)
        else -> LocalDate(year, Month.APRIL, 10) // Approximate
    }
    
    private fun getBuddhaPurnimaDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.MAY, 23)
        2025 -> LocalDate(2025, Month.MAY, 12)
        2026 -> LocalDate(2026, Month.MAY, 31)
        else -> LocalDate(year, Month.MAY, 15) // Approximate
    }
    
    private fun getJanmashtamiDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.AUGUST, 26)
        2025 -> LocalDate(2025, Month.AUGUST, 16)
        2026 -> LocalDate(2026, Month.SEPTEMBER, 4)
        else -> LocalDate(year, Month.AUGUST, 25) // Approximate
    }
    
    private fun getDussehraDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.OCTOBER, 12)
        2025 -> LocalDate(2025, Month.OCTOBER, 2)
        2026 -> LocalDate(2026, Month.OCTOBER, 20)
        else -> LocalDate(year, Month.OCTOBER, 10) // Approximate
    }
    
    private fun getDiwaliDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.NOVEMBER, 1)
        2025 -> LocalDate(2025, Month.OCTOBER, 20)
        2026 -> LocalDate(2026, Month.NOVEMBER, 8)
        else -> LocalDate(year, Month.NOVEMBER, 1) // Approximate
    }
    
    private fun getGuruNanakDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.NOVEMBER, 15)
        2025 -> LocalDate(2025, Month.NOVEMBER, 5)
        2026 -> LocalDate(2026, Month.NOVEMBER, 24)
        else -> LocalDate(year, Month.NOVEMBER, 15) // Approximate
    }
    
    private fun getEidUlFitrDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.APRIL, 10)
        2025 -> LocalDate(2025, Month.MARCH, 30)
        2026 -> LocalDate(2026, Month.MARCH, 20)
        else -> LocalDate(year, Month.APRIL, 1) // Approximate
    }
    
    private fun getEidUlAdhaDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.JUNE, 17)
        2025 -> LocalDate(2025, Month.JUNE, 7)
        2026 -> LocalDate(2026, Month.MAY, 27)
        else -> LocalDate(year, Month.JUNE, 10) // Approximate
    }
    
    private fun getMuharramDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.JULY, 17)
        2025 -> LocalDate(2025, Month.JULY, 6)
        2026 -> LocalDate(2026, Month.JUNE, 26)
        else -> LocalDate(year, Month.JULY, 10) // Approximate
    }
    
    private fun getMiladUnNabiDate(year: Int): LocalDate = when (year) {
        2024 -> LocalDate(2024, Month.SEPTEMBER, 16)
        2025 -> LocalDate(2025, Month.SEPTEMBER, 5)
        2026 -> LocalDate(2026, Month.AUGUST, 25)
        else -> LocalDate(year, Month.SEPTEMBER, 10) // Approximate
    }
    
    companion object {
        // Supported regions
        val SUPPORTED_REGIONS = mapOf(
            "IN" to "India",
            "US" to "United States",
            "UK" to "United Kingdom"
            // Add more as needed
        )
    }
}

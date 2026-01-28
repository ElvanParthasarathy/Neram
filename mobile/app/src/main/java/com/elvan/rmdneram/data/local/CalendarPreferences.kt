package com.elvan.rmdneram.data.local

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Preferences for NeramCalendar settings.
 * Stores user preferences for calendar behavior and display.
 */
class CalendarPreferences(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("calendar_prefs", Context.MODE_PRIVATE)

    // Enabled calendars
    private val _enabledCalendars = MutableStateFlow<Set<String>>(getEnabledCalendars())
    val enabledCalendars: StateFlow<Set<String>> = _enabledCalendars.asStateFlow()

    fun isCalendarEnabled(id: String): Boolean {
        if (!_advancedCalendarsEnabled.value) return true
        return _enabledCalendars.value.contains(id)
    }

    fun setCalendarEnabled(id: String, enabled: Boolean) {
        val current = _enabledCalendars.value.toMutableSet()
        if (enabled) {
            current.add(id)
        } else {
            current.remove(id)
        }
        _enabledCalendars.value = current
        saveEnabledCalendars(current)
    }
    
    // Show Week Numbers
    private val _showWeekNumbers = MutableStateFlow(prefs.getBoolean("show_week_numbers", false))
    val showWeekNumbers: StateFlow<Boolean> = _showWeekNumbers.asStateFlow()
    
    fun setShowWeekNumbers(show: Boolean) {
        _showWeekNumbers.value = show
        prefs.edit().putBoolean("show_week_numbers", show).apply()
    }
    
    // Show Declined Events
    private val _showDeclinedEvents = MutableStateFlow(prefs.getBoolean("show_declined_events", false))
    val showDeclinedEvents: StateFlow<Boolean> = _showDeclinedEvents.asStateFlow()
    
    fun setShowDeclinedEvents(show: Boolean) {
        _showDeclinedEvents.value = show
        prefs.edit().putBoolean("show_declined_events", show).apply()
    }
    
    // Week Start Day (1 = Monday, 7 = Sunday)
    private val _weekStartDay = MutableStateFlow(prefs.getInt("week_start_day", 1)) // Default: Monday
    val weekStartDay: StateFlow<Int> = _weekStartDay.asStateFlow()
    
    fun setWeekStartDay(day: Int) {
        _weekStartDay.value = day
        prefs.edit().putInt("week_start_day", day).apply()
    }
    
    fun getWeekStartDayName(): String = when (_weekStartDay.value) {
        1 -> "Monday"
        2 -> "Tuesday"
        3 -> "Wednesday"
        4 -> "Thursday"
        5 -> "Friday"
        6 -> "Saturday"
        7 -> "Sunday"
        else -> "Monday"
    }
    
    // Default Calendar ID for new events
    private val _defaultCalendarId = MutableStateFlow<String?>(prefs.getString("default_calendar_id", null))
    val defaultCalendarId: StateFlow<String?> = _defaultCalendarId.asStateFlow()
    
    fun setDefaultCalendarId(id: String?) {
        _defaultCalendarId.value = id
        if (id != null) {
            prefs.edit().putString("default_calendar_id", id).apply()
        } else {
            prefs.edit().remove("default_calendar_id").apply()
        }
    }
    
    // Default Reminder Minutes (before event)
    private val _defaultReminderMinutes = MutableStateFlow(prefs.getInt("default_reminder_minutes", 10))
    val defaultReminderMinutes: StateFlow<Int> = _defaultReminderMinutes.asStateFlow()
    
    fun setDefaultReminderMinutes(minutes: Int) {
        _defaultReminderMinutes.value = minutes
        prefs.edit().putInt("default_reminder_minutes", minutes).apply()
    }
    
    fun getDefaultReminderDescription(): String = when (_defaultReminderMinutes.value) {
        0 -> "At time of event"
        5 -> "5 minutes before"
        10 -> "10 minutes before"
        15 -> "15 minutes before"
        30 -> "30 minutes before"
        60 -> "1 hour before"
        120 -> "2 hours before"
        1440 -> "1 day before"
        else -> "${_defaultReminderMinutes.value} minutes before"
    }
    
    // Default Event Duration (in minutes)
    private val _defaultEventDuration = MutableStateFlow(prefs.getInt("default_event_duration", 60))
    val defaultEventDuration: StateFlow<Int> = _defaultEventDuration.asStateFlow()
    
    fun setDefaultEventDuration(minutes: Int) {
        _defaultEventDuration.value = minutes
        prefs.edit().putInt("default_event_duration", minutes).apply()
    }
    
    fun getDefaultEventDurationDescription(): String = when (_defaultEventDuration.value) {
        15 -> "15 minutes"
        30 -> "30 minutes"
        45 -> "45 minutes"
        60 -> "1 hour"
        90 -> "1.5 hours"
        120 -> "2 hours"
        180 -> "3 hours"
        else -> "${_defaultEventDuration.value} minutes"
    }
    
    // Time Zone (use system default or custom)
    private val _useSystemTimezone = MutableStateFlow(prefs.getBoolean("use_system_timezone", true))
    val useSystemTimezone: StateFlow<Boolean> = _useSystemTimezone.asStateFlow()
    
    fun setUseSystemTimezone(use: Boolean) {
        _useSystemTimezone.value = use
        prefs.edit().putBoolean("use_system_timezone", use).apply()
    }
    
    // Show Holidays
    private val _showHolidays = MutableStateFlow(prefs.getBoolean("show_holidays", true))
    val showHolidays: StateFlow<Boolean> = _showHolidays.asStateFlow()
    
    fun setShowHolidays(show: Boolean) {
        _showHolidays.value = show
        prefs.edit().putBoolean("show_holidays", show).apply()
    }
    
    // Holiday Region
    private val _holidayRegion = MutableStateFlow(prefs.getString("holiday_region", "IN") ?: "IN")
    val holidayRegion: StateFlow<String> = _holidayRegion.asStateFlow()
    
    fun setHolidayRegion(region: String) {
        _holidayRegion.value = region
        prefs.edit().putString("holiday_region", region).apply()
    }

    private fun getEnabledCalendars(): Set<String> {
        return prefs.getStringSet("enabled_calendars", emptySet()) ?: emptySet()
    }

    private fun saveEnabledCalendars(enabledIds: Set<String>) {
        prefs.edit().putStringSet("enabled_calendars", enabledIds).apply()
    }
    
    // ======= ADVANCED CALENDAR SETTINGS =======
    
    // Advanced Calendars Enabled (toggle to show advanced section)
    private val _advancedCalendarsEnabled = MutableStateFlow(prefs.getBoolean("advanced_calendars_enabled", false))
    val advancedCalendarsEnabled: StateFlow<Boolean> = _advancedCalendarsEnabled.asStateFlow()
    
    fun setAdvancedCalendarsEnabled(enabled: Boolean) {
        _advancedCalendarsEnabled.value = enabled
        prefs.edit().putBoolean("advanced_calendars_enabled", enabled).apply()
    }
    
    // Enabled Accounts (set of account IDs/names that are enabled)
    private val _enabledAccounts = MutableStateFlow<Set<String>>(getEnabledAccounts())
    val enabledAccounts: StateFlow<Set<String>> = _enabledAccounts.asStateFlow()
    
    fun isAccountEnabled(accountName: String): Boolean {
        // If advanced mode disabled, treat all accounts as enabled
        if (!_advancedCalendarsEnabled.value) return true
        // In Advanced Mode, only explicitly enabled accounts are shown
        return _enabledAccounts.value.contains(accountName)
    }
    
    fun setAccountEnabled(accountName: String, enabled: Boolean) {
        val current = _enabledAccounts.value.toMutableSet()
        if (enabled) {
            current.add(accountName)
        } else {
            current.remove(accountName)
        }
        _enabledAccounts.value = current
        saveEnabledAccounts(current)
    }
    
    private fun getEnabledAccounts(): Set<String> {
        return prefs.getStringSet("enabled_accounts", emptySet()) ?: emptySet()
    }
    
    private fun saveEnabledAccounts(accountIds: Set<String>) {
        prefs.edit().putStringSet("enabled_accounts", accountIds).apply()
    }
    
    // Track if Advanced Settings was ever revealed (for persistence)
    private val _advancedSettingsRevealed = MutableStateFlow(prefs.getBoolean("advanced_settings_revealed", false))
    val advancedSettingsRevealed: StateFlow<Boolean> = _advancedSettingsRevealed.asStateFlow()
    
    fun setAdvancedSettingsRevealed(revealed: Boolean) {
        _advancedSettingsRevealed.value = revealed
        prefs.edit().putBoolean("advanced_settings_revealed", revealed).apply()
    }
}

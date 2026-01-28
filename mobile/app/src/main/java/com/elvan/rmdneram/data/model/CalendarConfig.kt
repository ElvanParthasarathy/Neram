package com.elvan.rmdneram.data.model

/**
 * Configuration for Google Calendar API access
 * Fetched from Firebase: calendars/{batch}/config
 */
data class CalendarConfig(
    val apiKey: String = "",
    val calendarId: String = "",
    val semStart: String = "",
    val semEnd: String = ""
)

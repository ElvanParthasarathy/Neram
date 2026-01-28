package com.elvan.rmdneram.data.model

import com.google.gson.annotations.SerializedName

/**
 * Response from Google Calendar API
 * https://developers.google.com/calendar/v3/reference/events/list
 */
data class GoogleCalendarResponse(
    val items: List<GoogleCalendarEvent> = emptyList()
)

data class GoogleCalendarEvent(
    val id: String = "",
    val summary: String? = null,
    val start: EventDateTime = EventDateTime(),
    val end: EventDateTime = EventDateTime()
)

data class EventDateTime(
    val dateTime: String? = null, // For timed events: "2024-01-15T09:00:00+05:30"
    val date: String? = null       // For all-day events: "2024-01-15"
)

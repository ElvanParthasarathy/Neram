package com.elvan.rmdneram.data.remote

import android.util.Log
import com.elvan.rmdneram.data.model.CalendarEvent
import com.elvan.rmdneram.data.model.GoogleCalendarEvent
import com.elvan.rmdneram.data.model.GoogleCalendarResponse
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL
import java.net.URLEncoder
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Service for fetching events from Google Calendar API
 * Matches the logic in React web app's App.jsx runGlobalCalendarSync function
 */
class GoogleCalendarService {
    
    companion object {
        private const val TAG = "GoogleCalendarService"
        private const val BASE_URL = "https://www.googleapis.com/calendar/v3/calendars"
    }
    
    private val gson = Gson()
    
    /**
     * Fetch events from Google Calendar API
     * @param apiKey Google API key
     * @param calendarId Calendar ID (email format)
     * @param startDate ISO date string (e.g., "2024-01-01")
     * @param endDate ISO date string (e.g., "2024-05-31")
     * @return List of expanded CalendarEvent objects
     */
    suspend fun fetchEvents(
        apiKey: String,
        calendarId: String,
        startDate: String,
        endDate: String
    ): List<CalendarEvent> = withContext(Dispatchers.IO) {
        try {
            // Build URL matching web app's format
            val encodedCalendarId = URLEncoder.encode(calendarId, "UTF-8")
            val timeMin = "${startDate}T00:00:00Z"
            val timeMax = "${endDate}T23:59:59Z"
            
            val url = "$BASE_URL/$encodedCalendarId/events?" +
                    "key=$apiKey" +
                    "&timeMin=$timeMin" +
                    "&timeMax=$timeMax" +
                    "&singleEvents=true" +
                    "&orderBy=startTime" +
                    "&maxResults=250"
            
            Log.d(TAG, "Fetching from: $url")
            
            val response = URL(url).readText()
            val calendarResponse = gson.fromJson(response, GoogleCalendarResponse::class.java)
            
            Log.d(TAG, "Fetched ${calendarResponse.items.size} events from Google Calendar")
            
            // Expand multi-day events (matching web app's expandGoogleEvent function)
            val expandedEvents = mutableListOf<CalendarEvent>()
            calendarResponse.items.forEach { event ->
                expandedEvents.addAll(expandGoogleEvent(event))
            }
            
            // Sort by date
            expandedEvents.sortBy { it.date }
            
            Log.d(TAG, "Expanded to ${expandedEvents.size} calendar entries")
            expandedEvents
            
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch Google Calendar: ${e.message}", e)
            emptyList()
        }
    }
    
    /**
     * Expand a Google Calendar event into individual day entries
     * Multi-day events become separate entries for each day
     * Matches web app's expandGoogleEvent function in App.jsx
     */
    private fun expandGoogleEvent(event: GoogleCalendarEvent): List<CalendarEvent> {
        val events = mutableListOf<CalendarEvent>()
        
        try {
            val startVal = event.start.dateTime ?: event.start.date ?: return events
            val endVal = event.end.dateTime ?: event.end.date ?: return events
            
            val isAllDay = event.start.dateTime == null
            
            val startDate = parseToLocalDate(startVal)
            val endDate = parseToLocalDate(endVal)
            
            var current = startDate
            val stopDate = if (isAllDay) endDate else endDate.plusDays(1) // All-day events: end is exclusive
            
            val timeFormatter = DateTimeFormatter.ofPattern("hh:mm a")
            
            while (current.isBefore(stopDate) || (!isAllDay && current == startDate)) {
                val dateStr = current.toString() // YYYY-MM-DD format
                
                val timeRange = if (isAllDay) {
                    "All Day"
                } else {
                    try {
                        val startTime = LocalDateTime.parse(startVal.substringBefore("+").substringBefore("Z"))
                        val endTime = LocalDateTime.parse(endVal.substringBefore("+").substringBefore("Z"))
                        "${startTime.format(timeFormatter)} - ${endTime.format(timeFormatter)}"
                    } catch (e: Exception) {
                        "All Day"
                    }
                }
                
                events.add(
                    CalendarEvent(
                        id = "${event.id}_$dateStr",
                        title = event.summary ?: "Untitled",
                        date = dateStr,
                        groupId = event.id,
                        type = "",
                        startTime = null,
                        endTime = null,
                        description = null,
                        fullTime = timeRange
                    )
                )
                
                current = current.plusDays(1)
                
                // Safety: prevent infinite loops for malformed data
                if (events.size > 365) break
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to expand event ${event.id}: ${e.message}")
        }
        
        return events
    }
    
    /**
     * Parse date/datetime string to LocalDate
     */
    private fun parseToLocalDate(dateStr: String): LocalDate {
        return try {
            if (dateStr.contains("T")) {
                // DateTime format: "2024-01-15T09:00:00+05:30"
                val cleaned = dateStr.substringBefore("+").substringBefore("Z")
                LocalDateTime.parse(cleaned).toLocalDate()
            } else {
                // Date format: "2024-01-15"
                LocalDate.parse(dateStr)
            }
        } catch (e: Exception) {
            LocalDate.now()
        }
    }
    
    /**
     * Generate a quick hash of events for comparison
     * Matches web app's getQuickHash function
     */
    fun getEventsHash(events: List<CalendarEvent>): String {
        return events.joinToString("|") { "${it.id}|${it.title}|${it.fullTime}|${it.groupId}" }
    }
}

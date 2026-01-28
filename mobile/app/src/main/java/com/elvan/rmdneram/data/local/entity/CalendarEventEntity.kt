package com.elvan.rmdneram.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.elvan.rmdneram.data.model.CalendarEvent

@Entity(tableName = "calendar_events")
data class CalendarEventEntity(
    @PrimaryKey
    val id: String,
    val title: String,
    val description: String?,
    val date: String,
    val type: String, // Holiday, Exam, Event
    val startTime: String?,
    val endTime: String?,
    val fullTime: String?,
    val isSection: Boolean = false // true = section-specific event, false = batch calendar event
) {
    fun toCalendarEvent(): CalendarEvent {
        return CalendarEvent(
            id = id,
            title = title,
            description = description,
            date = date,
            type = type,
            startTime = startTime,
            endTime = endTime,
            fullTime = fullTime,
            isSection = isSection
        )
    }

    companion object {
        fun fromCalendarEvent(event: CalendarEvent, isSection: Boolean = false): CalendarEventEntity {
            // Ensure ID is not empty and unique per source
            val prefix = if (isSection) "section_" else "calendar_"
            val safeId = if (event.id.isEmpty()) "$prefix${event.date}_${event.title.hashCode()}" else "$prefix${event.id}"
            return CalendarEventEntity(
                id = safeId,
                title = event.title,
                description = event.description,
                date = event.date,
                type = event.type,
                startTime = event.startTime,
                endTime = event.endTime,
                fullTime = event.fullTime,
                isSection = isSection
            )
        }
    }
}

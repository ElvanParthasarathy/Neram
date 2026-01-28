package com.elvan.rmdneram.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.rememberHomeColors
import kotlinx.collections.immutable.ImmutableList
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.datetime.Instant

/**
 * Calendar Schedule View - Shows events in a list format
 */
@Composable
fun NeramCalendarScheduleView(
    modifier: Modifier = Modifier,
    events: ImmutableList<NeramCalendarEvent>,
    currentDate: LocalDate,
    onEventClick: (NeramCalendarEvent) -> Unit = {}
) {
    val colors = rememberHomeColors()
    
    // Group events by date
    val groupedEvents = remember(events) {
        events.groupBy { event ->
            Instant.fromEpochMilliseconds(event.startTime)
                .toLocalDateTime(TimeZone.currentSystemDefault())
                .date
        }.toSortedMap()
    }
    
    if (events.isEmpty()) {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "📅",
                    fontSize = 48.sp
                )
                Text(
                    text = "No upcoming events",
                    style = MaterialTheme.typography.bodyLarge,
                    color = colors.textSecondary
                )
            }
        }
    } else {
        LazyColumn(
            modifier = modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            groupedEvents.forEach { (date, dayEvents) ->
                item(key = "header_$date") {
                    DateHeader(date = date, isToday = date == currentDate, colors = colors)
                }
                
                items(dayEvents, key = { it.id }) { event ->
                    EventCard(
                        event = event,
                        colors = colors,
                        onClick = { onEventClick(event) }
                    )
                }
            }
        }
    }
}

@Composable
private fun DateHeader(
    date: LocalDate,
    isToday: Boolean,
    colors: com.elvan.rmdneram.ui.home.HomeColors
) {
    Row(
        modifier = Modifier.padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(if (isToday) colors.accent else colors.surface),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = date.dayOfMonth.toString(),
                fontWeight = FontWeight.Bold,
                color = if (isToday) androidx.compose.ui.graphics.Color.White else colors.textPrimary
            )
        }
        
        Column {
            Text(
                text = date.dayOfWeek.name.lowercase().replaceFirstChar { it.uppercase() },
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary
            )
            Text(
                text = "${date.month.name.lowercase().replaceFirstChar { it.uppercase() }} ${date.year}",
                fontSize = 12.sp,
                color = colors.textSecondary
            )
        }
    }
}

@Composable
private fun EventCard(
    event: NeramCalendarEvent,
    colors: com.elvan.rmdneram.ui.home.HomeColors,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        color = colors.surface
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Color indicator
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(40.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(event.color)
            )
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = event.title,
                    fontWeight = FontWeight.Medium,
                    color = colors.textPrimary
                )
                if (!event.isAllDay) {
                    val startTime = Instant.fromEpochMilliseconds(event.startTime)
                        .toLocalDateTime(TimeZone.currentSystemDefault())
                    Text(
                        text = "${startTime.hour.toString().padStart(2, '0')}:${startTime.minute.toString().padStart(2, '0')}",
                        fontSize = 12.sp,
                        color = colors.textSecondary
                    )
                } else {
                    Text(
                        text = "All day",
                        fontSize = 12.sp,
                        color = colors.textSecondary
                    )
                }
            }
        }
    }
}

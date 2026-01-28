package com.elvan.rmdneram.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.zIndex
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.HomeColors
import java.time.LocalDate

/**
 * Data class representing an event positioned within a week row.
 */
data class WeekEvent(
    val title: String?,
    val color: Color,
    val startColumn: Int,    // 0..6 (Sunday=0)
    val spanColumns: Int,    // 1..7
    val lane: Int,           // Vertical position (0 = topmost)
    val isStart: Boolean,    // True if event starts in this week
    val isEnd: Boolean,      // True if event ends in this week
    val isContinuous: Boolean // True if duration > 1
)

/**
 * Container for all events in a single week row.
 */
data class WeekEventData(
    val weekStartDate: LocalDate,
    val events: List<WeekEvent>
)

/**
 * Renders all events for a single week row as an overlay.
 * This is positioned ABOVE the DayCell row using Box stacking.
 *
 * @param weekEvents All events for this week
 * @param cellWidth Width of a single day cell
 * @param laneHeight Height of each event lane
 * @param colors Theme colors
 * @param modifier Modifier for the overlay
 */
@Composable
fun WeekEventOverlay(
    weekEvents: WeekEventData,
    cellWidth: Dp,
    laneHeight: Dp = 16.dp,  // Increased for descender preservation
    colors: HomeColors,
    modifier: Modifier = Modifier
) {
    // Group events by lane for proper vertical stacking
    val eventsByLane = weekEvents.events.groupBy { it.lane }.toSortedMap()
    
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(top = 22.dp), // Space for date numbers
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        eventsByLane.forEach { (_, laneEvents) ->
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(laneHeight)
            ) {
                laneEvents.forEach { event ->
                    if (event.isContinuous) {
                        MultiDayEventBar(
                            event = event,
                            cellWidth = cellWidth,
                            height = laneHeight,
                            colors = colors
                        )
                    } else {
                        SingleDayEventChip(
                            event = event,
                            cellWidth = cellWidth,
                            height = laneHeight,
                            colors = colors
                        )
                    }
                }
            }
        }
    }
}

/**
 * Renders a multi-day event as a single continuous horizontal bar.
 * The bar spans multiple columns and has rounded corners only at true start/end.
 * Uses Box with center alignment for Samsung Calendar parity.
 */
@Composable
fun MultiDayEventBar(
    event: WeekEvent,
    cellWidth: Dp,
    height: Dp,
    colors: HomeColors
) {
    val xOffset = cellWidth * event.startColumn
    val width = cellWidth * event.spanColumns
    
    // Only round corners at the true start/end of the event
    val shape = RoundedCornerShape(
        topStart = if (event.isStart) 3.dp else 0.dp,
        bottomStart = if (event.isStart) 3.dp else 0.dp,
        topEnd = if (event.isEnd) 3.dp else 0.dp,
        bottomEnd = if (event.isEnd) 3.dp else 0.dp
    )
    
    // Determine text color based on background
    val textColor = if (event.color == SpecialYellow) Color.Black else Color.White

    // TWO SEPARATE LAYERS: Background bar + Text overlay (text NOT inside clipped area)
    Box(
        modifier = Modifier
            .offset(x = xOffset)
            .width(width)
            .height(height)
    ) {
        // Layer 1: Background bar (clipped to shape, no text)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .clip(shape)
                .background(event.color)
        )
        
        // Layer 2: Text overlay (NOT clipped, sits on top of background)
        // Only show text at the start of the event
        if (event.title != null && event.isStart) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .zIndex(100f) // Ensure text renders ON TOP of all layers
                    .padding(horizontal = 4.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = event.title,
                    fontSize = 9.5.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Normal,
                    letterSpacing = 0.sp,
                    color = textColor,
                    maxLines = 1,
                    softWrap = false,
                    textAlign = TextAlign.Center,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.offset(y = (-3).dp) // Move text UP for optical centering
                )
            }
        }
    }
}

/**
 * Renders a single-day event as an individual chip.
 * Typography matches Samsung Calendar exactly.
 * Single-day events can wrap to 2 lines if needed.
 */
@Composable
fun SingleDayEventChip(
    event: WeekEvent,
    cellWidth: Dp,
    height: Dp,
    colors: HomeColors
) {
    val xOffset = cellWidth * event.startColumn
    val chipPadding = 2.dp
    val chipWidth = cellWidth - (chipPadding * 2)
    
    val textColor = if (event.color == SpecialYellow) Color.Black else Color.White

    Box(
        modifier = Modifier
            .offset(x = xOffset + chipPadding)
            .width(chipWidth)
            .height(height)
            .clip(RoundedCornerShape(3.dp))
            .background(event.color)
            .padding(horizontal = 4.dp, vertical = 1.dp), // Samsung-style tight padding
        contentAlignment = Alignment.Center
    ) {
        if (event.title != null) {
            Text(
                text = event.title,
                fontSize = 9.5.sp,  // Samsung uses slightly smaller than 10sp
                fontWeight = androidx.compose.ui.text.font.FontWeight.Medium, // Medium for single-day
                letterSpacing = 0.sp, // Zero letter spacing
                lineHeight = 11.sp, // Tight line height for 2-line wrap
                color = textColor,
                maxLines = 2,  // Samsung allows 2 lines for single-day
                softWrap = true,
                textAlign = TextAlign.Center,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.offset(y = 0.5.dp) // Optical centering offset
            )
        }
    }
}

package com.elvan.rmdneram.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Face
import androidx.compose.material3.*
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.zIndex
import androidx.compose.ui.layout.layout
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.data.model.CalendarEvent
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeTypography
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import androidx.compose.ui.window.Dialog
import java.util.Locale

/**
 * CalendarComponents - Reusable UI widgets for the Calendar Screen.
 * 
 * Includes the Calendar Widget, Month Grid, Day Cells, and Event Cards.
 */

// Styles used internally
internal val HolidayColor = Color(0xFFAB47BC) // Darker Purple
internal val SpecialYellow = Color(0xFFFFCA28) // Darker Yellow

enum class EventPosition { Single, Start, Middle, End }

sealed class EventIndicatorStyle {
    abstract val position: EventPosition
    abstract val title: String?
    abstract val spanCount: Int
    
    data class Bar(val color: Color, override val position: EventPosition = EventPosition.Single, override val title: String? = null, override val spanCount: Int = 1) : EventIndicatorStyle()
    data class Exam(override val position: EventPosition = EventPosition.Single, override val title: String? = "Exam", override val spanCount: Int = 1) : EventIndicatorStyle()
    data class Holiday(override val position: EventPosition = EventPosition.Single, override val title: String? = "Holiday", override val spanCount: Int = 1) : EventIndicatorStyle()
    data class Special(override val position: EventPosition = EventPosition.Single, override val title: String? = "Special", override val spanCount: Int = 1) : EventIndicatorStyle()
    object Spacer : EventIndicatorStyle() { 
        override val position: EventPosition = EventPosition.Single 
        override val title: String? = null
        override val spanCount: Int = 1
    }
}

// Custom Colors for Samsung Look - Little Bit Darker
internal val SamsungRed = Color(0xFFEF5350) // Darker Red
internal val SamsungGreen = Color(0xFF66BB6A) // Darker Green
internal val SamsungBlue = Color(0xFF42A5F5) // Darker Blue
internal val SamsungPurple = Color(0xFF9C27B0) // Deep Purple
private val TextWhite = Color(0xFFFFFFFF)
private val TextBlack = Color(0xFF000000)
private val SelectionBorder = Color(0xFFFFFFFF)



@Composable
fun CalendarWidget(
    currentMonth: YearMonth,
    selectedDate: LocalDate,
    eventIndicators: Map<LocalDate, List<EventIndicatorStyle>>,
    colors: HomeColors,
    calendarProgress: Float,
    onDateSelected: (LocalDate) -> Unit,
    onMonthChanged: (YearMonth) -> Unit
) {
    // Infinite Pager Logic
    val initialPage = Int.MAX_VALUE / 2
    val pagerState = rememberPagerState(initialPage = initialPage) { Int.MAX_VALUE }
    val scope = rememberCoroutineScope()
    
    // Sync Pager with currentMonth (User Swipes Calendar)
    // When user swipes calendar to a new month, update BOTH the month AND selected date (to day 1)
    LaunchedEffect(pagerState.currentPage) {
        val diff = pagerState.currentPage - initialPage
        val newMonth = YearMonth.now().plusMonths(diff.toLong())
        if (newMonth != currentMonth) {
            onMonthChanged(newMonth)
            // When user swipes calendar month, select day 1 of the new month
            onDateSelected(newMonth.atDay(1))
        }
    }

    // Sync currentMonth with Pager (User Swipes Agenda or Selects Date)
    LaunchedEffect(currentMonth) {
        val diff = java.time.temporal.ChronoUnit.MONTHS.between(YearMonth.now(), currentMonth).toInt()
        val targetPage = initialPage + diff
        if (pagerState.currentPage != targetPage) {
            pagerState.animateScrollToPage(
                page = targetPage,
                animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing)
            )
        }
    }

    // State for Month Picker
    var showMonthPicker by remember { mutableStateOf(false) }

    if (showMonthPicker) {
        YearMonthPickerDialog(
            currentMonth = currentMonth,
            onMonthSelected = { 
                onMonthChanged(it)
                showMonthPicker = false 
            },
            onDismiss = { showMonthPicker = false },
            colors = colors
        )
    }

    Column(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
    ) {
        // Month Title (Centered)
        // Current year: Just month name (e.g., "JAN")
        // Other years: Month + Year (e.g., "Dec 2025", "Dec 2027")
        val currentYear = java.time.Year.now().value
        val monthTitle = if (currentMonth.year == currentYear) {
            currentMonth.month.getDisplayName(TextStyle.SHORT, Locale.getDefault()).uppercase()
        } else {
            "${currentMonth.month.getDisplayName(TextStyle.SHORT, Locale.getDefault()).replaceFirstChar { it.uppercase() }} ${currentMonth.year}"
        }
        
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 0.dp, bottom = 0.dp), 
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = monthTitle,
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = colors.textPrimary
            )
        }
        
        Spacer(modifier = Modifier.height(4.dp)) // Tighter spacing
        
        // Days Grid Headers (Sunday Start)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            val daysOfWeek = listOf(DayOfWeek.SUNDAY) + DayOfWeek.values().filter { it != DayOfWeek.SUNDAY }
            daysOfWeek.forEach { day ->
                val isSunday = day == DayOfWeek.SUNDAY
                Text(
                    text = day.getDisplayName(TextStyle.SHORT, Locale.getDefault()).take(1).uppercase(), // "S", "M"...
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (isSunday) SamsungRed else colors.textSecondary.copy(alpha = 0.6f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.weight(1f)
                )
            }
        }
        
        Spacer(modifier = Modifier.height(2.dp)) // Date grid right below headers
        
        // Horizontal Pager for Swipeable Months
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxWidth().wrapContentHeight(),
            verticalAlignment = Alignment.Top
        ) { page ->
            val pageMonth = YearMonth.now().plusMonths((page - initialPage).toLong())
            
            MonthGrid(
                month = pageMonth,
                selectedDate = selectedDate,
                eventIndicators = eventIndicators,
                colors = colors,
                calendarProgress = calendarProgress,
                onDateSelected = onDateSelected
            )
        }
    }
}



// ... (existing imports)

@Composable
fun YearMonthPickerDialog(
    currentMonth: YearMonth,
    onMonthSelected: (YearMonth) -> Unit,
    onDismiss: () -> Unit,
    colors: HomeColors
) {
    var selectedYear by remember { mutableStateOf(currentMonth.year) }
    
    Dialog(
        onDismissRequest = onDismiss
    ) {
        Surface( // Wrap in Surface for Dialog styling
            modifier = Modifier
                .clip(HomeShapes.Card)
                .background(colors.surface),
            shape = HomeShapes.Card,
            color = colors.surface
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Year Selector
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = { selectedYear-- }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, "Prev Year", tint = colors.textPrimary)
                }
                Text(
                    text = selectedYear.toString(),
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary
                )
                IconButton(onClick = { selectedYear++ }) {
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, "Next Year", tint = colors.textPrimary)
                }
            }
            
            // Months Grid
            Column {
                val months = java.time.Month.values().toList()
                val chunkedMonths = months.chunked(3)
                
                chunkedMonths.forEach { row ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        row.forEach { month ->
                            val isSelected = month == currentMonth.month && selectedYear == currentMonth.year
                            
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(4.dp)
                                    .clip(HomeShapes.Pill)
                                    .background(if (isSelected) colors.accent else Color.Transparent)
                                    .clickable { onMonthSelected(YearMonth.of(selectedYear, month)) }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = month.getDisplayName(TextStyle.SHORT, Locale.getDefault()).uppercase(),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = if (isSelected) Color.White else colors.textPrimary
                                )
                            }
                        }
                        // Fill empty space if row is incomplete (unlikely for 12 months / 3 = 4 rows)
                    }
                }
            }
            }
        }
    }
}

/**
 * Transforms eventIndicators (per-day map) into WeekEventData for a week row.
 * Groups events by slot and calculates their column positions and spans within the week.
 * CRITICAL: This must be a PURE PROJECTION - no reordering of lanes.
 */
private fun buildWeekEventData(
    weekDates: List<LocalDate>,
    eventIndicators: Map<LocalDate, List<EventIndicatorStyle>>,
    weekStartDate: LocalDate
): WeekEventData {
    val weekEvents = mutableListOf<WeekEvent>()
    val processedSlots = mutableSetOf<Pair<Int, Int>>() // (column, slot) pairs already processed
    
    weekDates.forEachIndexed { columnIndex, date ->
        val indicators = eventIndicators[date] ?: return@forEachIndexed
        
        indicators.forEachIndexed { slot, indicator ->
            if (indicator is EventIndicatorStyle.Spacer) return@forEachIndexed
            
            // Skip if we've already processed this event at this slot (for multi-day)
            val slotKey = Pair(columnIndex, slot)
            if (slotKey in processedSlots) return@forEachIndexed
            
            val isContinuous = indicator.spanCount > 1 || indicator.position != EventPosition.Single
            
            // For continuous events, calculate the span within this week
            // FIX: Only extend span if next indicator is the SAME logical event
            val spanColumns = if (isContinuous) {
                var span = 1
                for (nextCol in (columnIndex + 1)..6) {
                    if (nextCol >= weekDates.size) break
                    val nextDate = weekDates[nextCol]
                    val nextIndicators = eventIndicators[nextDate] ?: break
                    val nextIndicator = nextIndicators.getOrNull(slot)
                    
                    // FIX: Check that next indicator is the SAME event, not just non-null
                    // Match by: 1) Same class type, 2) Same title
                    if (nextIndicator != null && 
                        nextIndicator !is EventIndicatorStyle.Spacer &&
                        isSameEvent(indicator, nextIndicator)) {
                        span++
                        processedSlots.add(Pair(nextCol, slot))
                    } else {
                        break
                    }
                }
                span
            } else {
                1
            }
            
            val color = when (indicator) {
                is EventIndicatorStyle.Holiday -> SamsungPurple
                is EventIndicatorStyle.Exam -> SamsungGreen
                is EventIndicatorStyle.Special -> SpecialYellow
                is EventIndicatorStyle.Bar -> indicator.color
                else -> androidx.compose.ui.graphics.Color.Gray
            }
            
            weekEvents.add(
                WeekEvent(
                    title = indicator.title,
                    color = color,
                    startColumn = columnIndex,
                    spanColumns = spanColumns,
                    lane = slot,  // Lane == Slot, no remapping
                    isStart = indicator.position == EventPosition.Start || indicator.position == EventPosition.Single,
                    isEnd = indicator.position == EventPosition.End || indicator.position == EventPosition.Single,
                    isContinuous = isContinuous
                )
            )
            
            processedSlots.add(slotKey)
        }
    }
    
    // FIX: NO REORDERING - preserve exact lane ordering from collapsed view
    // Only sort by lane (which is slot index) and startColumn for grouping, NOT by isContinuous
    val sorted = weekEvents.sortedWith(
        compareBy<WeekEvent> { it.lane }
            .thenBy { it.startColumn }
    )
    
    return WeekEventData(weekStartDate, sorted)
}

/**
 * Checks if two EventIndicatorStyle instances represent the SAME logical event.
 * Used to determine if a span should continue across days.
 */
private fun isSameEvent(a: EventIndicatorStyle, b: EventIndicatorStyle): Boolean {
    // Must be same class type
    if (a::class != b::class) return false
    
    // Must have same title
    if (a.title != b.title) return false
    
    // For Bar type, also check color
    if (a is EventIndicatorStyle.Bar && b is EventIndicatorStyle.Bar) {
        if (a.color != b.color) return false
    }
    
    return true
}

@Composable
fun MonthGrid(
    month: YearMonth,
    selectedDate: LocalDate,
    eventIndicators: Map<LocalDate, List<EventIndicatorStyle>>,
    colors: HomeColors,
    calendarProgress: Float,
    onDateSelected: (LocalDate) -> Unit
) {
    val days = remember(month) {
        val firstDayOfMonth = month.atDay(1)
        val lastDayOfMonth = month.atEndOfMonth()
        
        // Start from Sunday
        val daysToSubtract = firstDayOfMonth.dayOfWeek.value % 7
        val startDay = firstDayOfMonth.minusDays(daysToSubtract.toLong())
        
        val list = mutableListOf<LocalDate>()
        var current = startDay
        
        // Add days until we have covered the month AND finished the last week
        // AND ensured we have at least 5 rows (35 days) for consistency
        while (current.isBefore(lastDayOfMonth.plusDays(1)) || list.size % 7 != 0 || list.size < 35) {
            list.add(current)
            current = current.plusDays(1)
        }
        
        list
    }
    
    val rows = remember(days) { days.chunked(7) }
    
    // Find which row contains the selected date
    // Use Math-based calculation for O(1) reliability instead of list search
    val selectedRowIndex = remember(selectedDate, month, rows) {
        val firstDayOfMonth = month.atDay(1)
        val daysToSubtract = firstDayOfMonth.dayOfWeek.value % 7
        val startDay = firstDayOfMonth.minusDays(daysToSubtract.toLong())
        
        val daysDiff = java.time.temporal.ChronoUnit.DAYS.between(startDay, selectedDate)
        
        if (daysDiff >= 0) {
            val rowIndex = (daysDiff / 7).toInt()
            if (rowIndex < rows.size) rowIndex else 0
        } else {
            0
        }
    }
    
    // Row height constants
    val normalRowHeight = 52.dp
    val detailedRowHeight = 100.dp
    
    // Animate each row's height individually:
    // - Collapsed (-1): Selected row full height, others 0
    // - Normal (0): All rows normal height (52dp)
    // - Detailed (1): All rows expands to detailed height (100dp)
    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        rows.forEachIndexed { rowIndex, row ->
            val isSelectedRow = rowIndex == selectedRowIndex
            
            // Calculate height based on calendarProgress (-1f to 1f)
            val animatedRowHeight = when {
                // Collapsing (-1f to 0f)
                calendarProgress < 0 -> {
                    if (isSelectedRow) {
                        normalRowHeight // Selected row stays fully visible
                    } else {
                        // Other rows shrink from normalRowHeight to 0 as progress goes from 0 to -1
                        // progress -1 -> 0 height
                        // progress 0 -> normal height
                        androidx.compose.ui.unit.lerp(normalRowHeight, 0.dp, -calendarProgress)
                    }
                }
                // Expanding to Detailed (0f to 1f)
                else -> {
                    // All rows grow from normalRowHeight to detailedRowHeight
                    androidx.compose.ui.unit.lerp(normalRowHeight, detailedRowHeight, calendarProgress)
                }
            }
            
            // NEW: WeekRowContainer - Box with DayCells + WeekEventOverlay
            val isDetailedView = calendarProgress > 0.5f
            
            // Calculate cell width for event positioning
            val configuration = androidx.compose.ui.platform.LocalConfiguration.current
            val screenWidth = configuration.screenWidthDp.dp
            val horizontalPadding = 32.dp // 16dp * 2
            val cellWidth = (screenWidth - horizontalPadding) / 7
            
            // Transform eventIndicators into WeekEventData for this row
            val weekStartDate = row.first()
            val weekEvents = if (isDetailedView) {
                buildWeekEventData(row, eventIndicators, weekStartDate)
            } else {
                WeekEventData(weekStartDate, emptyList())
            }
            
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(animatedRowHeight)
            ) {
                // Layer 1: DayCells (dates only, no event bars in detailed view)
                Row(
                    modifier = Modifier.fillMaxSize(),
                    horizontalArrangement = Arrangement.Start
                ) {
                    row.forEachIndexed { columnIndex, date ->
                        Box(modifier = Modifier.weight(1f)) {
                            DayCell(
                                date = date,
                                isSelected = date == selectedDate,
                                isToday = date == LocalDate.now(),
                                isCurrentMonth = date.month == month.month,
                                indicators = if (isDetailedView) emptyList() else (eventIndicators[date] ?: emptyList()),
                                colors = colors,
                                isDetailedView = false, // Never show inline bars, overlay handles it
                                onClick = { onDateSelected(date) }
                            )
                        }
                    }
                }
                
                // Layer 2: WeekEventOverlay (events rendered as spans)
                if (isDetailedView && weekEvents.events.isNotEmpty()) {
                    WeekEventOverlay(
                        weekEvents = weekEvents,
                        cellWidth = cellWidth,
                        laneHeight = 14.dp,
                        colors = colors
                    )
                }
            }
        }
    }
}

@Composable
fun NavPill(
    text: String,
    icon: ImageVector,
    isLeftIcon: Boolean,
    colors: HomeColors,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(colors.surface)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        if (isLeftIcon) {
            Icon(icon, contentDescription = null, tint = colors.textSecondary, modifier = Modifier.size(16.dp))
            Text(text, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
        } else {
            Text(text, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
            Icon(icon, contentDescription = null, tint = colors.textSecondary, modifier = Modifier.size(16.dp))
        }
    }
}

@Composable
fun DayCell(
    date: LocalDate,
    isSelected: Boolean,
    isToday: Boolean,
    isCurrentMonth: Boolean,
    indicators: List<EventIndicatorStyle>,
    colors: HomeColors,
    isDetailedView: Boolean = false,
    onClick: () -> Unit
) {
    val isSunday = date.dayOfWeek == DayOfWeek.SUNDAY
    // User Request: Only Today gets the filled squircle background
    val showNumberHighlight = isToday
    
    // Text Color Logic
    // If highlighted (Selected or Today), text should contrast with the highlight background
    // Dark Mode: Highlight is White -> Text Black
    // Light Mode: Highlight is Black -> Text White
    val highlighTextColor = if (colors.isDark) TextBlack else TextWhite
    
    val baseTxtColor = when {
        showNumberHighlight -> highlighTextColor
        isSunday -> SamsungRed
        else -> colors.textPrimary
    }
    
    // Fade out logic for non-current month dates
    val txtColor = if (isCurrentMonth) baseTxtColor else baseTxtColor.copy(alpha = 0.3f)

    // Selection Styling
    // Selected = Border only (Transparent background)
    val borderColor = colors.textSecondary // Changed to secondary color as requested

    // Interaction Source for disabling ripple
    val interactionSource = remember { MutableInteractionSource() }

    // Removed horizontal spacing to allow continuous bars
    val cellModifier = if (isSelected) {
        Modifier
            .padding(horizontal = 0.dp, vertical = 2.dp) 
            // Removed .clip() to allow bars to extend to edges
            .border(1.dp, borderColor, RoundedCornerShape(8.dp))
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
    } else {
        Modifier
            .padding(horizontal = 0.dp, vertical = 2.dp) 
            // Removed .clip() to allow bars to extend to edges
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
    }

    Column(
        modifier = Modifier
            .fillMaxSize() // Allow filling the parent Box (weighted)
            .then(cellModifier),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Top // Changed from Center to Top
    ) {
        // Top Spacer to position number consistently from the top edge
        Spacer(modifier = Modifier.height(2.dp))
        
        // Date Number
        // Highlight logic: Show background if Today or Selected
        // Make sure previous month dates don't get 'Today' highlight if they happen to be 'today' but viewed from another month? No, today is global.
        // But if 'isSelected' happens to be a previous month date, we still highlight it.
        // Fading affects opacity of content.
        
        val highlightColor = if (colors.isDark) Color.White else Color.Black
        
        // If not current month, we might want to fade the entire content or just text. 
        // User request: "others are visible but faded".
        val contentAlpha = if (isCurrentMonth) 1f else 0.5f 
        
        Box(
            modifier = Modifier
                .offset(y = 1.dp) // Shift squircle down for alignment
                .size(18.dp) // Reduced to 18.dp
                .clip(RoundedCornerShape(6.dp)) // Adjusted for tiny size
                .background(if (showNumberHighlight) highlightColor.copy(alpha = if (isCurrentMonth) 1f else 0.3f) else Color.Transparent),
            contentAlignment = Alignment.Center
        ) {
            Text(
                modifier = Modifier.offset(y = (-1).dp), // Counter-shift text to keep it stationary
                text = date.dayOfMonth.toString(),
                fontSize = 12.sp, 
                fontWeight = if (showNumberHighlight) FontWeight.Bold else FontWeight.SemiBold,
                color = txtColor
            )
        }

        // Event Bars (Tighter) - Always render 4 slots for consistent vertical alignment
        // This ensures bars at the same slot index are always at the same vertical position
        Spacer(modifier = Modifier.height(3.dp)) // Reduced spacing
        
        Column(
            modifier = Modifier
                .fillMaxWidth()
                // Remove internal padding to allow edge-to-edge bars
                .padding(horizontal = 0.dp) 
                .alpha(if (isCurrentMonth) 1f else 0.3f), // Fade bars too
            verticalArrangement = Arrangement.spacedBy(2.dp) // Space between bars
        ) {
            // Always render exactly 4 slots for consistent height
            val slots = (0 until 4).map { index -> indicators.getOrNull(index) }
            slots.forEach { indicator -> 
                if (indicator == null || indicator is EventIndicatorStyle.Spacer) {
                    // Render transparent spacer to maintain vertical alignment
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(if (isDetailedView) 14.dp else 3.5.dp) // Taller spacer in detailed view
                    )
                } else {
                    val barColor = when (indicator) {
                        is EventIndicatorStyle.Holiday -> SamsungPurple
                        is EventIndicatorStyle.Exam -> SamsungGreen
                        is EventIndicatorStyle.Special -> SpecialYellow
                        is EventIndicatorStyle.Bar -> indicator.color
                        else -> Color.Transparent
                    }
                    
                    val position = indicator.position
                    
                    val shape = when(position) {
                        EventPosition.Start -> RoundedCornerShape(topStart = 2.dp, bottomStart = 2.dp)
                        EventPosition.End -> RoundedCornerShape(topEnd = 2.dp, bottomEnd = 2.dp)
                        EventPosition.Middle -> RectangleShape
                        EventPosition.Single -> RoundedCornerShape(2.dp)
                    }
                    
                    // Padding for bar edges:
                    val startPadding = if (position == EventPosition.Start || position == EventPosition.Single) 2.dp else 0.dp
                    val endPadding = if (position == EventPosition.End || position == EventPosition.Single) 2.dp else 0.dp
                    
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = startPadding, end = endPadding)
                            .height(if (isDetailedView) 14.dp else 3.5.dp), // Taller bar in detailed view
                        contentAlignment = Alignment.CenterStart
                    ) {
                        // Background Bar (Clipped)
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clip(shape) // Respect position shape (Start/Middle/End)
                                .background(barColor)
                        )
                        
                        // Text Overlay (Unclipped)
                        if (isDetailedView && indicator.title != null) {
                            val showTitle = position == EventPosition.Start || position == EventPosition.Single || isSunday
                            if (showTitle) {
                                val configuration = androidx.compose.ui.platform.LocalConfiguration.current
                                val screenWidth = configuration.screenWidthDp.dp
                                val horizontalPadding = 32.dp // 16dp * 2
                                val approxCellWidth = (screenWidth - horizontalPadding) / 7
                                val textWidth = approxCellWidth * indicator.spanCount

                                Box(
                                    modifier = Modifier
                                        .requiredWidth(textWidth)
                                        .zIndex(100f),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = indicator.title ?: "",
                                        fontSize = 10.sp,
                                        color = if (barColor == SpecialYellow) Color.Black else Color.White,
                                        maxLines = 1,
                                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis,
                                        modifier = Modifier.fillMaxWidth()
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SelectedDaySection(
    date: LocalDate,
    events: List<CalendarEvent>,
    colors: HomeColors
) {
    Column(
        modifier = Modifier.padding(horizontal = 24.dp, vertical = 16.dp)
    ) {
        // Redesigned Header: "17 SAT       :-)"
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = date.dayOfMonth.toString(),
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault()).uppercase(),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textSecondary
                )
            }
            
            // Smiley Icon (Placeholder for Sticker/Emoji)
            Icon(
                imageVector = Icons.Default.Face, 
                contentDescription = "Sticker",
                tint = colors.textSecondary,
                modifier = Modifier.size(24.dp)
            )
        }
        
        if (events.isEmpty()) {
            Text(
                text = "No academic events scheduled.",
                fontSize = 14.sp,
                color = colors.textSecondary.copy(alpha = 0.7f)
            )
        } else {
            events.forEach { event ->
                EventCard(event = event, colors = colors)
            }
        }
    }
}

@Composable
fun EventCard(event: CalendarEvent, colors: HomeColors) {
    val titleLower = event.title.lowercase()
    val isExam = titleLower.contains("exam") || titleLower.contains("test") || 
                 titleLower.contains("sia") || titleLower.contains("fia")
    val isHoliday = titleLower.contains("holiday")
    val isWorkingDayOrder = titleLower.contains("working day") && titleLower.contains("order")
    val isSpecial = event.type == "FullDay" || event.type == "HalfDay" || event.isSection
    
    val baseColor = when {
        isHoliday -> SamsungPurple
        isExam -> SamsungGreen
        isWorkingDayOrder -> Color(0xFF00BCD4) // Cyan for working day order
        isSpecial -> SpecialYellow
        else -> SamsungBlue
    }

    val containerColor = if (colors.isDark) baseColor.copy(alpha = 0.25f) else baseColor.copy(alpha = 0.15f)
    val contentColor = if (colors.isDark) TextWhite else TextBlack
    val subTextColor = if (colors.isDark) TextWhite.copy(alpha = 0.7f) else TextBlack.copy(alpha = 0.6f)
    val iconColor = baseColor // Always use the solid base color for the icon for pop
    
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp),
        shape = RoundedCornerShape(16.dp),
        color = containerColor,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Icon(
                imageVector = Icons.Default.DateRange, // Using generic calendar icon
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(24.dp)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column {
                Text(
                    text = event.title,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = contentColor
                )
                Text(
                    text = event.getTimeRangeDisplay(),
                    fontSize = 12.sp,
                    color = subTextColor
                )
            }
        }
    }
}

@Composable
fun AgendaItem(event: CalendarEvent, isSelected: Boolean, colors: HomeColors) {
    val date = try { LocalDate.parse(event.date) } catch(e:Exception) { LocalDate.now() }
    val isToday = date == LocalDate.now()
    
    val titleLower = event.title.lowercase()
    val isExam = titleLower.contains("exam") || titleLower.contains("test") || 
                 titleLower.contains("sia") || titleLower.contains("fia")
    val isHoliday = titleLower.contains("holiday")
    val isWorkingDayOrder = titleLower.contains("working day") && titleLower.contains("order")
    val isSpecial = event.type == "FullDay" || event.type == "HalfDay" || event.isSection
    
    val barColor = when {
        isHoliday -> SamsungPurple
        isExam -> SamsungGreen
        isWorkingDayOrder -> Color(0xFF00BCD4) // Cyan for working day order
        isSpecial -> SpecialYellow
        else -> SamsungBlue
    }
    
    val dateTextColor = if (isToday) colors.accent else colors.textPrimary

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 6.dp),
        shape = HomeShapes.Card,
        color = colors.surface,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(IntrinsicSize.Min)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Date Text
            Column(
                modifier = Modifier.width(50.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault()).uppercase(),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = colors.textSecondary
                )
                Text(
                    text = date.dayOfMonth.toString(),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = dateTextColor
                )
            }
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Vertical Colored Pill Line
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(50))
                    .background(barColor)
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            // Content
            Column {
                Text(
                    text = event.title,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary
                )
                Text(
                    text = event.getTimeRangeDisplay(),
                    fontSize = 13.sp,
                    color = colors.textSecondary
                )
            }
        }
    }
}

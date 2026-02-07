package com.elvan.rmdneram.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.outlined.CalendarMonth
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
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import com.elvan.rmdneram.data.model.CalendarEvent
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeDimens
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeTypography
import com.elvan.rmdneram.ui.navigation.CustomIcons
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.platform.LocalContext
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
import java.util.Locale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.forEachGesture
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.ui.graphics.lerp
import kotlin.math.abs
import kotlinx.coroutines.delay
import androidx.compose.ui.draw.scale



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
    onMonthChanged: (YearMonth) -> Unit,
    showHeader: Boolean = true
) {
    // Infinite Pager Logic
    val initialPage = Int.MAX_VALUE / 2
    val pagerState = rememberPagerState(initialPage = initialPage) { Int.MAX_VALUE }
    val scope = rememberCoroutineScope()
    
    // Sync Pager with currentMonth (User Swipes Calendar)
    // When user swipes calendar to a new month, update BOTH the month AND selected date (to day 1)
    // Using settledPage ensures this only fires AFTER the pager has fully settled,
    // preventing race conditions with user date clicks during animations.
    LaunchedEffect(pagerState.settledPage) {
        val diff = pagerState.settledPage - initialPage
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

    // Resolve App Locale
    val context = LocalContext.current
    val langPref = LocalAppLanguage.current
    val appLocale = remember(langPref) {
        if (AppStrings.getEffectiveLanguage(langPref, context) == AppStrings.TAMIL) Locale("ta", "IN") else Locale.ENGLISH
    }

    Column(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
    ) {
        // Month Title (Centered)
        if (showHeader) {
            val currentYear = java.time.Year.now().value
            val monthTitle = if (currentMonth.year == currentYear) {
                currentMonth.month.getDisplayName(TextStyle.SHORT, appLocale).uppercase()
            } else {
                "${currentMonth.month.getDisplayName(TextStyle.SHORT, appLocale).replaceFirstChar { it.uppercase() }} ${currentMonth.year}"
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
        }
        
        // Days Grid Headers (Sunday Start)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            val daysOfWeek = listOf(DayOfWeek.SUNDAY) + DayOfWeek.values().filter { it != DayOfWeek.SUNDAY }
            daysOfWeek.forEach { day ->
                val isSunday = day == DayOfWeek.SUNDAY
                Text(
                    text = day.getDisplayName(TextStyle.SHORT, appLocale).take(1).uppercase(), // "S", "M"...
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
                val context = LocalContext.current
                val langPref = LocalAppLanguage.current
                val appLocale = remember(langPref) {
                    if (AppStrings.getEffectiveLanguage(langPref, context) == AppStrings.TAMIL) Locale("ta", "IN") else Locale.ENGLISH
                }

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
                                    text = month.getDisplayName(TextStyle.SHORT, appLocale).uppercase(),
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
    val baseRowHeight = 52.dp // Standard height for 5-row month and collapsed view
    val totalCalendarHeight = baseRowHeight * 5 // Fixed container height (260dp)
    
    // Dynamic row height: If 6 rows, compress to fit in 5-row space
    val normalRowHeight = (totalCalendarHeight / rows.size)
    val detailedRowHeight = 100.dp
    
    // Animate each row's height individually:
    // - Collapsed (-1): Selected row full base height (52dp), others 0
    // - Normal (0): All rows normal height (52dp or ~43dp for 6 rows)
    // - Detailed (1): All rows expands to detailed height (100dp)
    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        rows.forEachIndexed { rowIndex, row ->
            val isSelectedRow = rowIndex == selectedRowIndex
            
            // Calculate height based on calendarProgress - Force Static for Card View
            // Detailed view is disabled, so we just stick to normalRowHeight logic
            // We ignore calendarProgress < 0 since we want the calendar to stay visible behind the card
            
             val animatedRowHeight = when {
                // Expanding to Detailed (0f to 1f) [Detailed view logic kept for future if needed, but no shrinking]
                calendarProgress > 0 -> {
                    androidx.compose.ui.unit.lerp(normalRowHeight, detailedRowHeight, calendarProgress)
                }
                else -> normalRowHeight
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
                
                // Layer 2: WeekEventOverlay (Removed as detailed view is disabled)
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

@OptIn(androidx.compose.material3.ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun SelectedDaySection(
    date: LocalDate,
    events: List<CalendarEvent>,
    colors: HomeColors,
    isRefreshing: Boolean = false,
    onRefresh: () -> Unit = {}
) {
    val context = LocalContext.current
    val langPref = LocalAppLanguage.current
    val appLocale = remember(langPref) {
        if (AppStrings.getEffectiveLanguage(langPref, context) == AppStrings.TAMIL) Locale("ta", "IN") else Locale.ENGLISH
    }

    Column(
        modifier = Modifier.padding(horizontal = 24.dp, vertical = 4.dp) // Reduced vertical padding (16->4)
    ) {
        // Redesigned Header: "17 SAT       :-)"
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp), // Reduced bottom padding (16->8)
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
                    text = date.dayOfWeek.getDisplayName(TextStyle.SHORT, appLocale).uppercase(),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = colors.textSecondary
                )
            }
            
            // Smiley Icon (Refresh Button)
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(48.dp) // Increased from 32dp
            ) {
                if (isRefreshing) {
                    androidx.compose.material3.ContainedLoadingIndicator(
                        modifier = Modifier.size(44.dp), // Increased from 28dp
                        containerColor = colors.surface,
                        indicatorColor = colors.accent
                    )
                } else {
                    androidx.compose.material3.IconButton(
                        onClick = onRefresh,
                        modifier = Modifier.size(48.dp) // Increased from 32dp
                    ) {
                        Icon(
                            imageVector = Icons.Default.Face, 
                            contentDescription = "Refresh",
                            tint = colors.textSecondary,
                            modifier = Modifier.size(32.dp) // Increased from 24dp
                        )
                    }
                }
            }
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
        shape = HomeShapes.Card, // Updated to 24dp (Standard)
        color = containerColor,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = HomeDimens.CardPaddingHorizontal, vertical = HomeDimens.CardPaddingVertical), // Matches Home Screen
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Icon(
                imageVector = Icons.Outlined.CalendarMonth, // Updated to use Month View Icon
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
    
    val context = LocalContext.current
    val langPref = LocalAppLanguage.current
    val appLocale = remember(langPref) {
        if (AppStrings.getEffectiveLanguage(langPref, context) == AppStrings.TAMIL) Locale("ta", "IN") else Locale.ENGLISH
    }
    
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
                    text = date.dayOfWeek.getDisplayName(TextStyle.SHORT, appLocale).uppercase(),
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

/**
 * View Toggle Slider (Month vs Schedule)
 * Replicates functionality from ScheduleScreen
 */
@Composable
fun CalendarViewToggle(
    viewType: String, // "month" or "schedule"
    onViewSelected: (String) -> Unit,
    colors: HomeColors,
    modifier: Modifier = Modifier
) {
    val tabs = listOf(
        "Month" to "month",
        "List" to "schedule"
    )
    
    val selectedIndex = tabs.indexOfFirst { it.second == viewType }.coerceAtLeast(0)

    // "One Pill" Container
    Surface(
        modifier = modifier,
        shape = HomeShapes.Pill,
        color = colors.surface, 
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .padding(6.dp)
        ) {
            val width = maxWidth
            val itemWidth = width / tabs.size
            
            // Dynamic Scale
            val maxScale = (1f + (12.dp / itemWidth)).coerceAtMost(1.15f)

            // Interaction State
            var isInteracting by remember { mutableStateOf(false) }
            val pillScale by animateFloatAsState(
                targetValue = if (isInteracting) maxScale else 1.0f,
                label = "pill_zoom"
            )
            
            var currentDragOffset by remember { mutableStateOf<Float?>(null) }
            val scope = rememberCoroutineScope()
            
            // Interaction Handler
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(36.dp)
                    .zIndex(2f)
                    .pointerInput(itemWidth) {
                        awaitPointerEventScope {
                            while (true) {
                                val down = awaitFirstDown()
                                currentDragOffset = null 
                                
                                val initialIndex = (down.position.x / itemWidth.toPx()).toInt().coerceIn(0, tabs.size - 1)
                                var currentIndex = initialIndex
                                var isDrag = false
                                val dragThreshold = 10f

                                val longPressJob = scope.launch {
                                    delay(300)
                                    if (!isDrag) {
                                        isDrag = true
                                        isInteracting = true
                                    }
                                }

                                var pointerId = down.id
                                while (true) {
                                    val event = awaitPointerEvent()
                                    val pointerChange = event.changes.firstOrNull { it.id == pointerId }
                                    
                                    if (pointerChange == null || !pointerChange.pressed || pointerChange.isConsumed) {
                                        break
                                    }

                                    val dragDistance = (pointerChange.position - down.position).getDistance()
                                    if (dragDistance > dragThreshold) {
                                        longPressJob.cancel()
                                        if (!isDrag) {
                                            isDrag = true
                                            isInteracting = true
                                        }
                                        
                                        currentDragOffset = pointerChange.position.x
                                        val exactIndex = pointerChange.position.x / itemWidth.toPx()
                                        currentIndex = exactIndex.toInt().coerceIn(0, tabs.size - 1)
                                        
                                        pointerChange.consume()
                                    }
                                }

                                longPressJob.cancel()
                                onViewSelected(tabs[currentIndex].second)
                                isInteracting = false
                                currentDragOffset = null
                            }
                        }
                    }
            )

            // Animated Selection Pill
            val targetOffset = if (isInteracting && currentDragOffset != null) {
                with(androidx.compose.ui.platform.LocalDensity.current) { (currentDragOffset!! - itemWidth.toPx() / 2).toDp() }
            } else {
                itemWidth * selectedIndex
            }
            
            val constrainedTarget = targetOffset.coerceIn(0.dp, width - itemWidth)

            val indicatorOffset by animateDpAsState(
                targetValue = constrainedTarget,
                animationSpec = if (isInteracting && currentDragOffset != null) snap() else spring(stiffness = Spring.StiffnessMediumLow),
                label = "indicator"
            )
            
            Box(
                modifier = Modifier
                    .offset(x = indicatorOffset)
                    .width(itemWidth)
                    .height(36.dp)
                    .scale(pillScale)
                    .clip(HomeShapes.Pill)
                    .background(colors.textSecondary.copy(alpha = 0.15f))
            )

            // Content Items
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                tabs.forEachIndexed { index, (label, _) ->
                    val distance = abs(indicatorOffset.value - (itemWidth.value * index))
                    val fraction = 1f - (distance / itemWidth.value).coerceIn(0f, 1f)
                    val contentColor = lerp(colors.textSecondary, colors.textPrimary, fraction)
                    
                    Box(
                        modifier = Modifier
                            .width(itemWidth)
                            .height(36.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            style = HomeTypography.PillTitle,
                            fontSize = 14.sp,
                            color = contentColor,
                            fontWeight = if (fraction > 0.5f) FontWeight.Bold else FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}

/**
 * Monthly Full Schedule List
 * Paged inside the Calendar Pager when in "Schedule" mode.
 * Lists ALL events for the Month, grouped by Date.
 */
@Composable
fun MonthScheduleList(
    month: YearMonth,
    events: List<CalendarEvent>,
    colors: HomeColors,
    headerContent: @Composable () -> Unit = {},
    footerContent: @Composable () -> Unit = {}
) {
    // 1. Group events by Date
    val context = LocalContext.current
    val langPref = LocalAppLanguage.current
    val appLocale = remember(langPref) {
        if (AppStrings.getEffectiveLanguage(langPref, context) == AppStrings.TAMIL) Locale("ta", "IN") else Locale.US
    }

    val groupedEvents = remember(events) {
        events.groupBy { event ->
            try {
                LocalDate.parse(event.date)
            } catch (e: Exception) {
                LocalDate.now() // Fallback
            }
        }.toSortedMap()
    }

    if (groupedEvents.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                // Header (e.g. Official Docs) should still be visible even if empty
                headerContent()
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Text(
                    text = "No academic events",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary
                )
                Text(
                    text = "for ${month.month.getDisplayName(TextStyle.FULL, appLocale)}",
                    fontSize = 14.sp,
                    color = colors.textSecondary
                )
            }
        }
    } else {
        // --- PROPER GESTURE CONFLICT FIX (Direction Lock) ---
        // Prevents LazyColumn from consuming horizontal swipes meant for Pager
        var isHorizontalScrolling by remember { mutableStateOf(false) }
        val verticalState = androidx.compose.foundation.lazy.rememberLazyListState()

        LazyColumn(
            state = verticalState,
            userScrollEnabled = !isHorizontalScrolling, // Disable vertical scroll when horizontal is active
            modifier = Modifier
                .fillMaxSize()
                // Intercept touches to determine scroll direction
                .pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { 
                            isHorizontalScrolling = false 
                        },
                        onDragEnd = { 
                            isHorizontalScrolling = false 
                        },
                        onDragCancel = { 
                            isHorizontalScrolling = false 
                        }
                    ) { change, dragAmount ->
                        // If horizontal movement is dominant, lock to horizontal (disable vertical)
                        if (kotlin.math.abs(dragAmount.x) > kotlin.math.abs(dragAmount.y)) {
                             isHorizontalScrolling = true
                             // We do NOT consume the change here, letting it propagate to Pager
                        } else {
                             // Vertical is dominant, let LazyColumn handle it (if enabled)
                             // If isHorizontalScrolling is ALREADY true, we keep it true 
                             // to avoid switching mid-gesture? Usually better to lock once per gesture.
                             // But for simplicity of this pattern:
                             if (!isHorizontalScrolling) {
                                  // Let vertical scroll happen naturally
                             }
                        }
                    }
                },
            contentPadding = PaddingValues(bottom = 80.dp, top = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Content (Official Documents)
            item {
                headerContent()
            }
            
            // Spacer item removed to reduce gap (Arrangement.spacedBy handles the 16dp gap)

            groupedEvents.forEach { (date, dailyEvents) ->
                items(
                    count = dailyEvents.size,
                    key = { index -> "${date}-${dailyEvents[index].hashCode()}" }
                ) { index ->
                    AgendaItem(
                        event = dailyEvents[index],
                        isSelected = false,
                        colors = colors
                    )
                }
            }
            
            item {
                 footerContent()
            }
        }
    }
}


package com.elvan.rmdneram.ui.calendar

import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.runtime.collectAsState
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.components.ExpressivePullToRefreshBox
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import com.elvan.rmdneram.data.model.CalendarEvent
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.FastOutSlowInEasing

/**
 * CalendarScreen - Logic Coordinator
 * 
 * Responsibilities:
 * - Collects State from ViewModel
 * - Manages local state (selected date, current month)
 * - Calculates event indicators
 * - Delegates rendering to CalendarMainLayout
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun CalendarScreen(

    viewModel: HomeViewModel = viewModel(),
    onNavigateToPdf: (String) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    val baseColors = rememberHomeColors()
    val isAppDark = baseColors.isDark

    // Isolate Calendar Colors as requested
    // Use isAppDark (from Theme/HomeColors) to respect App Settings, not System Settings directly
    val calendarTopColor = if (isAppDark) Color.Black else Color.White
    val calendarBottomColor = if (isAppDark) Color(0xFF1C1C1E) else Color(0xFFF5F5F7)

    val colors = remember(baseColors, isAppDark) {
        baseColors.copy(
            calendarBackground = calendarTopColor,
            calendarBottomBackground = calendarBottomColor
        )
    }
    
    // Merge global and section events
    val allEvents = remember(uiState.calendarEvents, uiState.sectionEvents) {
        (uiState.calendarEvents + uiState.sectionEvents).distinctBy { it.id }
    }
    
    // LOCAL selected date - Calendar has its own isolated state
    // This prevents affecting Home/Schedule screens when browsing dates
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }
    
    // Sync local currentMonth with selectedDate when it changes significantly
    
    var currentMonth by remember { mutableStateOf(YearMonth.now()) }
    val dateFormatter = remember { DateTimeFormatter.ofPattern("yyyy-MM-dd") }
    
    // Calculate events for indicators
    // Calculate events for indicators with Continuous Logic
    // Calculate events for indicators with Continuous Logic and Stable Slots
    val eventIndicators = remember(allEvents, currentMonth) {
        val map = mutableMapOf<LocalDate, MutableList<EventIndicatorStyle>>()
        
        // 1. Flatten events: Expand ranges (startDate -> endDate) into individual daily entries
        data class DailyEvent(val date: LocalDate, val event: com.elvan.rmdneram.data.model.CalendarEvent)
        
        val expandedEvents = allEvents.flatMap { event ->
            try {
                val start = LocalDate.parse(event.date)
                val end = event.endDate?.let { LocalDate.parse(it) } ?: start
                
                if (!end.isBefore(start)) {
                    val days = java.time.temporal.ChronoUnit.DAYS.between(start, end).toInt() + 1
                    (0 until days).map { offset ->
                        DailyEvent(start.plusDays(offset.toLong()), event)
                    }
                } else {
                    listOf(DailyEvent(start, event))
                }
            } catch (e: Exception) {
                emptyList()
            }
        }.filter { dailyEvent ->
            // FILTER EARLY: Remove events that won't be displayed
            // Keep working day order events, filter out other order events
            val title = dailyEvent.event.title.lowercase()
            val isWorkingDayOrder = title.contains("working day") && title.contains("order")
            !title.contains("order") || isWorkingDayOrder
        }

        // 2. Group by GroupID (prioritized) OR by Title for consecutive days
        // "EventGroup" represents a single logical event spanning multiple days
        data class EventGroup(
            val key: String,
            val firstDate: LocalDate,
            val lastDate: LocalDate,
            val duration: Long,
            val events: List<DailyEvent>
        )

        // First, separate events with groupId from those without
        val eventsWithGroupId = expandedEvents.filter { it.event.groupId != null }
        val eventsWithoutGroupId = expandedEvents.filter { it.event.groupId == null }
        
        // Group events with groupId normally
        val groupedByGroupId = eventsWithGroupId.groupBy { it.event.groupId!! }
        
        // For events without groupId, group by title and detect consecutive days
        val groupedByTitle = eventsWithoutGroupId.groupBy { it.event.title }
        val consecutiveGroups = mutableListOf<List<DailyEvent>>()
        
        groupedByTitle.forEach { (_, eventsForTitle) ->
            val sorted = eventsForTitle.sortedBy { it.date }
            var currentBlock = mutableListOf<DailyEvent>()
            
            sorted.forEach { dailyEvent ->
                if (currentBlock.isEmpty()) {
                    currentBlock.add(dailyEvent)
                } else {
                    val lastDate = currentBlock.last().date
                    if (dailyEvent.date == lastDate.plusDays(1)) {
                        // Consecutive day - add to current block
                        currentBlock.add(dailyEvent)
                    } else {
                        // Gap detected - save current block and start new one
                        consecutiveGroups.add(currentBlock.toList())
                        currentBlock = mutableListOf(dailyEvent)
                    }
                }
            }
            if (currentBlock.isNotEmpty()) {
                consecutiveGroups.add(currentBlock.toList())
            }
        }
        
        // Combine both groupings into EventGroups
        val allGroups = mutableListOf<EventGroup>()
        
        // Add groups from groupId
        groupedByGroupId.forEach { (groupId, entries) ->
            val sortedEntries = entries.sortedBy { it.date }
            val first = sortedEntries.first().date
            val last = sortedEntries.last().date
            val duration = java.time.temporal.ChronoUnit.DAYS.between(first, last) + 1
            allGroups.add(EventGroup(groupId, first, last, duration, sortedEntries))
        }
        
        // Add consecutive groups (generate key from first event's title + first date)
        consecutiveGroups.forEach { entries ->
            val sortedEntries = entries.sortedBy { it.date }
            val first = sortedEntries.first().date
            val last = sortedEntries.last().date
            val duration = java.time.temporal.ChronoUnit.DAYS.between(first, last) + 1
            val key = "${sortedEntries.first().event.title}|$first"
            allGroups.add(EventGroup(key, first, last, duration, sortedEntries))
        }
        
        val uniqueGroups = allGroups

        // 3. Sort Groups for Greedy Allocation
        // Priority: Continuous (Duration > 1) -> Start Date (Earlier first) -> Duration (Longer first) -> Title (Stable tie-break)
        // This ensures continuous events are allocated to lower slots (top) first
        val sortedGroups = uniqueGroups.sortedWith(
            compareByDescending<EventGroup> { it.duration > 1 }
                .thenBy { it.firstDate }
                .thenByDescending { it.duration }
                .thenBy { it.key }
        )

        // 4. Greedy Slot Allocation (Row-Aware)
        // For each group, find lowest slot that's free on ALL its dates
        // Map: Date -> Set of occupied slots
        val occupiedSlots = mutableMapOf<LocalDate, MutableSet<Int>>()
        // Map: GroupKey -> Assigned Slot
        val groupAssignments = mutableMapOf<String, Int>()

        sortedGroups.forEach { group ->
            val dates = group.events.map { it.date }
            
            // Find lowest slot 'k' that's free on ALL dates this group occupies
            var slot = 0
            while (slot < 10) { // Safety limit
                var isAvailable = true
                for (date in dates) {
                    if (occupiedSlots[date]?.contains(slot) == true) {
                        isAvailable = false
                        break
                    }
                }
                
                if (isAvailable) {
                    // Assign this slot to the group
                    groupAssignments[group.key] = slot
                    // Mark these dates as occupied at this slot
                    for (date in dates) {
                        occupiedSlots.getOrPut(date) { mutableSetOf() }.add(slot)
                    }
                    break
                }
                slot++
            }
        }

        // 5. Generate Indicators per Day
        // Calculate GLOBAL max slot to ensure consistent vertical alignment across all days
        val globalMaxSlot = groupAssignments.values.maxOrNull() ?: 0
        
        // Iterate through all dates that have events
        val allDates = expandedEvents.map { it.date }.distinct().sorted()
        
        allDates.forEach { date ->
            val groupsOnDate = uniqueGroups.filter { group -> 
                group.events.any { it.date == date } 
            }
            
            if (groupsOnDate.isEmpty()) return@forEach
            
            // Use GLOBAL max slot for consistent height across all days
            // Prepare list with nulls (Spacers)
            val dailyIndicators = MutableList<EventIndicatorStyle?>(globalMaxSlot + 1) { null }
            
            groupsOnDate.forEach { group ->
                val slot = groupAssignments[group.key] ?: return@forEach
                if (slot < dailyIndicators.size) {
                    // Logic to determine style (Start/Mid/End)
                    val sortedEntries = group.events.sortedBy { it.date }
                    val index = sortedEntries.indexOfFirst { it.date == date }
                    
                    val position = when {
                        group.duration <= 1 -> EventPosition.Single
                        index == 0 -> EventPosition.Start
                        index == group.events.size - 1 -> EventPosition.End
                        else -> EventPosition.Middle
                    }
                                        
                    val entry = sortedEntries[index]
                    val event = entry.event
                    val title = event.title.lowercase()
                    
                    // Calculate span count for visual text constraint
                    // Span = min(days remaining in event, days remaining in row)
                    val columnIndex = date.dayOfWeek.value % 7 // Sun=0, Mon=1... Sat=6
                    val daysInRow = 7 - columnIndex
                    val eventEndDate = group.events.last().date
                    val remainingDays = java.time.temporal.ChronoUnit.DAYS.between(date, eventEndDate) + 1
                    val spanCount = kotlin.math.min(remainingDays.toInt(), daysInRow)

                    // Events are already filtered early, so all events here are visible
                    val style = when {
                        title.contains("holiday") -> EventIndicatorStyle.Holiday(position, title = event.title, spanCount = spanCount)
                        title.contains("exam") || title.contains("test") || title.contains("sia") || title.contains("fia") -> EventIndicatorStyle.Exam(position, title = event.title, spanCount = spanCount)
                        title.contains("working day") && title.contains("order") -> EventIndicatorStyle.Bar(androidx.compose.ui.graphics.Color(0xFF00BCD4), position, title = event.title, spanCount = spanCount) // Cyan for Monday working day order
                        title.contains("working day") -> EventIndicatorStyle.Bar(colors.accent, position, title = event.title, spanCount = spanCount) // Regular working day
                        event.type == "FullDay" || event.type == "HalfDay" || event.isSection -> EventIndicatorStyle.Special(position, title = event.title, spanCount = spanCount)
                        else -> EventIndicatorStyle.Bar(colors.accent, position, title = event.title, spanCount = spanCount)
                    }
                    dailyIndicators[slot] = style
                }
            }
            
            // Fill nulls with Spacers and add to map
            val finalIndicators = dailyIndicators.map { it ?: EventIndicatorStyle.Spacer }.toMutableList()
            map[date] = finalIndicators
        }

        map
    }

    val selectedDayEvents = remember(allEvents, selectedDate) {
        allEvents.filter { it.date == selectedDate.toString() }
    }
    
    val monthEvents = remember(allEvents, currentMonth) {
        val monthStr = currentMonth.toString()
        allEvents.filter { it.date.startsWith(monthStr) }.sortedBy { it.date }
    }

    // Pull to Refresh
    val pullRefreshState = rememberPullToRefreshState()
    val scope = rememberCoroutineScope()
    var isSimulatingOfflineRefresh by remember { mutableStateOf(false) }
    var showOfflineDialog by remember { mutableStateOf(false) }
    val isOffline = uiState.isOffline

    // Offline Dialog
    if (showOfflineDialog) {
        AlertDialog(
            onDismissRequest = { showOfflineDialog = false },
            title = { Text("Offline", style = HomeTypography.PillTitle) },
            text = { Text("Internet is not connected. Connect to internet to refresh.", style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    Button(
                        onClick = { showOfflineDialog = false },
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.accent, contentColor = androidx.compose.ui.graphics.Color.White),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("OK", style = HomeTypography.PillButton)
                    }
                }
            },
            containerColor = colors.surface,
            shape = HomeShapes.Item
        )
    }

    // Swipe Direction for Animation: -1 = Right to Left (Next), 1 = Left to Right (Prev), 0 = None

    // --- Agenda Pager Logic (Attached Swipe) ---
    val anchorDate = remember { LocalDate.now() }
    val initialDayPage = Int.MAX_VALUE / 2
    
    // Pager State for "Infinite" Scrolling
    val dayPagerState = rememberPagerState(initialPage = initialDayPage) { Int.MAX_VALUE }
    
    // Lock to prevent feedback loop during programmatic scroll
    var isProgrammaticScroll by remember { mutableStateOf(false) }
    
    // Efficiently provide events for ANY date (for Pager to render neighbors)
    val eventsProvider = remember(allEvents) {
        { date: LocalDate ->
            val dateStr = date.format(dateFormatter)
            // Reuse existing filter logic
            // Note: This matches 'selectedDayEvents' logic but functional
            allEvents.filter { it.date == dateStr }
                .sortedWith(compareBy<CalendarEvent> { 
                    val time = (it.startTime ?: "00:00").split(" ")[0] 
                    if (time.contains(":")) time else "00:00"
                }.thenBy { it.title })
        }
    }

    // 1. Sync Pager -> SelectedDate (User Swipes Agenda)
    LaunchedEffect(dayPagerState.currentPage) {
        // Calculate date from page index relative to anchor
        // Page X = Anchor + (X - Initial) days
        if (!isProgrammaticScroll) {
             val offset = dayPagerState.currentPage - initialDayPage
             val newDate = anchorDate.plusDays(offset.toLong())
             
             if (newDate != selectedDate) {
                 selectedDate = newDate
             }
        }
    }
    
    // 2. Sync SelectedDate -> Pager (User Clicks Calendar Grid)
    LaunchedEffect(selectedDate) {
        // Calculate page index from date relative to anchor
        // Page X = Initial + (Date - Anchor) days
        val daysDiff = ChronoUnit.DAYS.between(anchorDate, selectedDate).toInt()
        val targetPage = initialDayPage + daysDiff
        
        if (dayPagerState.currentPage != targetPage) {
            val distance = kotlin.math.abs(dayPagerState.currentPage - targetPage)
            
            isProgrammaticScroll = true
            
            // User requested "fastly move" (animation) even for distant dates.
            // We allow animation for up to ~1 month (31 days).
            // For massive jumps (e.g. year change), we snap to avoid 300+ page blurry scroll.
            if (distance <= 31) {
                 dayPagerState.animateScrollToPage(
                     page = targetPage,
                     animationSpec = tween(durationMillis = 400, easing = FastOutSlowInEasing)
                 )
            } else {
                dayPagerState.scrollToPage(targetPage)
            }
            
            // Release lock after animation/scroll frame
            // We use a small delay or check to ensure settled? 
            // Actually, after animateScrollToPage returns, it is done.
            isProgrammaticScroll = false
        }
        
        // Month sync is handled by existing LaunchedEffect below
    }

    // Auto-update current month when selected date changes (e.g. swiping pager across month boundary)
    LaunchedEffect(selectedDate) {
        val selectedMonth = YearMonth.from(selectedDate)
        if (selectedMonth != currentMonth) {
            currentMonth = selectedMonth
        }
    }

    val onRefresh = {
        if (isOffline) {
            scope.launch {
                isSimulatingOfflineRefresh = true
                delay(1500)
                isSimulatingOfflineRefresh = false
                showOfflineDialog = true
            }
        } else {
            viewModel.onRefresh()
        }
        Unit
    }

    CalendarMainLayout(
        currentMonth = currentMonth,
        selectedDate = selectedDate,
        eventIndicators = eventIndicators,
        // Removed redundant event lists in favor of provider
        // selectedDayEvents = selectedDayEvents, 
        // monthEvents = monthEvents,
        eventsProvider = eventsProvider,
        dayPagerState = dayPagerState,
        colors = colors,
        pullRefreshState = pullRefreshState,
        isRefreshing = uiState.isSyncing || isSimulatingOfflineRefresh,
        onRefresh = onRefresh,
        onDateSelected = { date ->
            // Update local selected date directly
            // Pager sync logic will handle the animation via LaunchedEffect
            selectedDate = date
        },
        onMonthChanged = { currentMonth = it },
        onNavigateToPdf = onNavigateToPdf
    )
}

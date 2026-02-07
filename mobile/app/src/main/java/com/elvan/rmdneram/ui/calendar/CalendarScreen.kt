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
import androidx.compose.ui.unit.dp
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
// Calendar components are now in this package (CalendarModels.kt, CalendarTopAppBar.kt, CalendarScheduleView.kt)
import kotlinx.collections.immutable.toImmutableList
import kotlinx.datetime.toKotlinLocalDate
import kotlinx.datetime.toLocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.atStartOfDayIn
import androidx.compose.ui.Alignment
import com.elvan.rmdneram.ui.calendar.EventPosition
import com.elvan.rmdneram.ui.calendar.EventIndicatorStyle

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
    val calendarTopColor = if (isAppDark) Color.Black else baseColors.background
    // Unified background color as requested
    val calendarBottomColor = calendarTopColor

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
    
    // Hoist State from ViewModel (Source of Truth)
    // Hoist State from ViewModel (Source of Truth)
    // DISCONNECTED from HomeViewModel as per user request
    // "The change date there canned be affected in home page"
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }
    // Decoupled Current Month as well to ensure full independence
    // val currentMonth by viewModel.currentMonth.collectAsState()
    var currentMonth by remember { mutableStateOf(YearMonth.now()) }
    val calendarView by viewModel.calendarView.collectAsState()
    
    // Trigger for jumping schedule view to today (incremented on Today button press)
    var scheduleTodayTrigger by remember { mutableIntStateOf(0) }
    
    // Listen for external jump requests (e.g. "Today" button from MainScreen header)
    LaunchedEffect(viewModel) {
        viewModel.calendarJumpRequest.collect { jumpDate ->
            // If in schedule view, increment trigger to scroll schedule pager
            if (calendarView == CalendarViewType.SCHEDULE) {
                scheduleTodayTrigger++
            }
            // Always update selectedDate and month for calendar view
            selectedDate = jumpDate
            val newMonth = YearMonth.from(jumpDate)
            if (newMonth != currentMonth) {
                currentMonth = newMonth
            }
        }
    }
    
    val dateFormatter = remember { DateTimeFormatter.ofPattern("yyyy-MM-dd") }
    
    // Calculate events for indicators (Restored from Backup - Greedy Allocation)
    val eventIndicators = remember(allEvents, currentMonth) {
        val map = mutableMapOf<LocalDate, MutableList<EventIndicatorStyle>>()
        
        // 1. Flatten events: Expand ranges into individual daily entries
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
            // FILTER EARLY
            val title = dailyEvent.event.title.lowercase()
            val isWorkingDayOrder = title.contains("working day") && title.contains("order")
            !title.contains("order") || isWorkingDayOrder
        }

        // 2. Group by GroupID or Title for consecutive days
        data class EventGroup(
            val key: String,
            val firstDate: LocalDate,
            val lastDate: LocalDate,
            val duration: Long,
            val events: List<DailyEvent>
        )

        val eventsWithGroupId = expandedEvents.filter { it.event.groupId != null }
        val eventsWithoutGroupId = expandedEvents.filter { it.event.groupId == null }
        
        val groupedByGroupId = eventsWithGroupId.groupBy { it.event.groupId!! }
        
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
                        currentBlock.add(dailyEvent)
                    } else {
                        consecutiveGroups.add(currentBlock.toList())
                        currentBlock = mutableListOf(dailyEvent)
                    }
                }
            }
            if (currentBlock.isNotEmpty()) {
                consecutiveGroups.add(currentBlock.toList())
            }
        }
        
        val allGroups = mutableListOf<EventGroup>()
        
        groupedByGroupId.forEach { (groupId, entries) ->
            val sortedEntries = entries.sortedBy { it.date }
            val first = sortedEntries.first().date
            val last = sortedEntries.last().date
            val duration = java.time.temporal.ChronoUnit.DAYS.between(first, last) + 1
            allGroups.add(EventGroup(groupId, first, last, duration, sortedEntries))
        }
        
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
        val sortedGroups = uniqueGroups.sortedWith(
            compareByDescending<EventGroup> { it.duration > 1 }
                .thenBy { it.firstDate }
                .thenByDescending { it.duration }
                .thenBy { it.key }
        )

        // 4. Greedy Slot Allocation
        val occupiedSlots = mutableMapOf<LocalDate, MutableSet<Int>>()
        val groupAssignments = mutableMapOf<String, Int>()

        sortedGroups.forEach { group ->
            val dates = group.events.map { it.date }
            var slot = 0
            while (slot < 10) {
                var isAvailable = true
                for (date in dates) {
                    if (occupiedSlots[date]?.contains(slot) == true) {
                        isAvailable = false
                        break
                    }
                }
                if (isAvailable) {
                    groupAssignments[group.key] = slot
                    for (date in dates) {
                        occupiedSlots.getOrPut(date) { mutableSetOf() }.add(slot)
                    }
                    break
                }
                slot++
            }
        }

        // 5. Generate Indicators per Day
        val globalMaxSlot = groupAssignments.values.maxOrNull() ?: 0
        val allDates = expandedEvents.map { it.date }.distinct().sorted()
        
        allDates.forEach { date ->
            val groupsOnDate = uniqueGroups.filter { group -> 
                group.events.any { it.date == date } 
            }
            
            if (groupsOnDate.isNotEmpty()) {
                val dailyIndicators = MutableList<EventIndicatorStyle?>(globalMaxSlot + 1) { null }
                
                groupsOnDate.forEach { group ->
                    val slot = groupAssignments[group.key] ?: return@forEach
                    if (slot < dailyIndicators.size) {
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
                        
                        val columnIndex = date.dayOfWeek.value % 7
                        val daysInRow = 7 - columnIndex
                        val eventEndDate = group.events.last().date
                        val remainingDays = java.time.temporal.ChronoUnit.DAYS.between(date, eventEndDate) + 1
                        val spanCount = kotlin.math.min(remainingDays.toInt(), daysInRow)

                        val style = when {
                            title.contains("holiday") -> EventIndicatorStyle.Holiday(position, title = event.title, spanCount = spanCount)
                            title.contains("exam") || title.contains("test") || title.contains("sia") || title.contains("fia") -> EventIndicatorStyle.Exam(position, title = event.title, spanCount = spanCount)
                            title.contains("working day") && title.contains("order") -> EventIndicatorStyle.Bar(androidx.compose.ui.graphics.Color(0xFF00BCD4), position, title = event.title, spanCount = spanCount)
                            title.contains("working day") -> EventIndicatorStyle.Bar(colors.accent, position, title = event.title, spanCount = spanCount)
                            event.type == "FullDay" || event.type == "HalfDay" || event.isSection -> EventIndicatorStyle.Special(position, title = event.title, spanCount = spanCount)
                            else -> EventIndicatorStyle.Bar(colors.accent, position, title = event.title, spanCount = spanCount)
                        }
                        dailyIndicators[slot] = style
                    }
                }
                val finalIndicators = dailyIndicators.map { it ?: EventIndicatorStyle.Spacer }.toMutableList()
                map[date] = finalIndicators
            }
        }
        map
    }

    // Pull to Refresh
    val pullRefreshState = rememberPullToRefreshState()
    val scope = rememberCoroutineScope()
    val isOffline = uiState.isOffline
    var isSimulatingOfflineRefresh by remember { mutableStateOf(false) }

    // Backup Pager Logic (Agenda Pager)
    val anchorDate = remember { LocalDate.now() } // Pivot for infinite scrolling
    val initialDayPage = Int.MAX_VALUE / 2
    val dayPagerState = rememberPagerState(initialPage = initialDayPage) { Int.MAX_VALUE }
    
    var isProgrammaticScroll by remember { mutableStateOf(false) }
    
    // Efficiently provide events
    val eventsProvider = remember(allEvents) {
        { date: LocalDate ->
            val dateStr = date.format(dateFormatter)
            allEvents.filter { it.date == dateStr }
                .sortedWith(compareBy<CalendarEvent> { 
                    val time = (it.startTime ?: "00:00").split(" ")[0] 
                    if (time.contains(":")) time else "00:00"
                }.thenBy { it.title })
        }
    }
    
    // Monthly Events Provider (for Schedule View)
    val monthlyEventsProvider = remember(allEvents) {
        { month: YearMonth ->
             allEvents.filter { event ->
                 try {
                     val date = LocalDate.parse(event.date)
                     YearMonth.from(date) == month
                 } catch (e: Exception) {
                     false
                 }
             }.sortedBy { it.date }
        }
    }
    
    // Sync Pager -> SelectedDate (User Swipes Agenda)
    LaunchedEffect(dayPagerState.currentPage) {
        if (!isProgrammaticScroll) {
             val offset = dayPagerState.currentPage - initialDayPage
             val newDate = anchorDate.plusDays(offset.toLong())
             if (newDate != selectedDate) {
                 // Update LOCAL state
                 selectedDate = newDate
                 
                 // Also ensure currentMonth follows if agenda crosses month boundary
                 val newMonth = YearMonth.from(newDate)
                 if (newMonth != currentMonth) {
                     currentMonth = newMonth
                 }
             }
        }
    }
    
    // Sync SelectedDate -> Pager (ViewModel Updates, e.g. "Today" click)
    LaunchedEffect(selectedDate) {
        val daysDiff = java.time.temporal.ChronoUnit.DAYS.between(anchorDate, selectedDate).toInt()
        val targetPage = initialDayPage + daysDiff
        
        if (dayPagerState.currentPage != targetPage) {
            try {
                isProgrammaticScroll = true
                val distance = kotlin.math.abs(dayPagerState.currentPage - targetPage)
                
                // Restore "Wipe" Animation for user (Backup Logic)
                if (distance <= 31) {
                     dayPagerState.animateScrollToPage(
                         page = targetPage,
                         animationSpec = androidx.compose.animation.core.tween(durationMillis = 400, easing = androidx.compose.animation.core.FastOutSlowInEasing)
                     )
                } else {
                    dayPagerState.scrollToPage(targetPage)
                }
                 
                 // Small delay to unlock updates
                 delay(100)
            } finally {
                 isProgrammaticScroll = false
            }
        }
    }

    // Define onRefresh properly
    val onRefresh = {
        if (isOffline) {
            scope.launch {
                isSimulatingOfflineRefresh = true
                delay(1500)
                isSimulatingOfflineRefresh = false
            }
        } else {
            viewModel.onRefresh()
        }
        Unit
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
    ) {
         CalendarMainLayout(
            currentMonth = currentMonth,
            selectedDate = selectedDate,
            eventIndicators = eventIndicators,
            eventsProvider = eventsProvider,
            monthlyEventsProvider = monthlyEventsProvider,
            dayPagerState = dayPagerState,
            colors = colors,
            pullRefreshState = pullRefreshState,
            isRefreshing = uiState.isSyncing || isSimulatingOfflineRefresh,
            onRefresh = onRefresh,
            onDateSelected = { date ->
                // Update LOCAL state only - keeping Home Screen independent
                selectedDate = date
                
                // Logic to switch month
                val newMonth = YearMonth.from(date)
                if (newMonth != currentMonth) {
                    currentMonth = newMonth
                }

                // scope.launch {
                //    // Force Pager Update (Bidirectional Sync) - Handled by LaunchedEffect(selectedDate)
                // }
            },
            onMonthChanged = { month ->
                 // viewModel.updateCurrentMonth(month)
                 currentMonth = month
            },
            onNavigateToPdf = onNavigateToPdf,
            showHeader = false,
            // Adjust padding to align with MainScreen structure
            viewType = if (calendarView == com.elvan.rmdneram.ui.calendar.CalendarViewType.SCHEDULE) "schedule" else "month",
            onViewTypeChanged = { typeStr ->
                val newType = if (typeStr == "schedule") com.elvan.rmdneram.ui.calendar.CalendarViewType.SCHEDULE else com.elvan.rmdneram.ui.calendar.CalendarViewType.MONTH
                viewModel.setCalendarView(newType)
            },
            scheduleTodayTrigger = scheduleTodayTrigger
        )
    }
}

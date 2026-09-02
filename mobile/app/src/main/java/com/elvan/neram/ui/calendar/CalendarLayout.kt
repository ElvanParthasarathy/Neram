package com.elvan.neram.ui.calendar

import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import kotlinx.coroutines.launch
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.BorderStroke
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.KeyboardArrowLeft

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ripple
import androidx.compose.material.icons.filled.Download
import androidx.compose.material3.IconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.data.model.CalendarEvent
import com.elvan.neram.ui.components.ExpressivePullToRefreshBox
import com.elvan.neram.ui.home.HomeColors
import com.elvan.neram.ui.home.HomeShapes
import com.elvan.neram.ui.home.HomeTypography
import com.elvan.neram.ui.home.HomeDimens
import com.elvan.neram.ui.home.rememberStatusBarHeight
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.*
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.combinedClickable
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.util.VelocityTracker
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.unit.Velocity
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class, ExperimentalAnimationApi::class)
@Composable
fun CalendarMainLayout(
    currentMonth: YearMonth,
    selectedDate: LocalDate,
    eventIndicators: Map<LocalDate, List<EventIndicatorStyle>>,
    colors: HomeColors,
    pullRefreshState: PullToRefreshState,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onDateSelected: (LocalDate) -> Unit,
    onMonthChanged: (YearMonth) -> Unit,
    onNavigateToPdf: (String) -> Unit,
    dayPagerState: androidx.compose.foundation.pager.PagerState,
    eventsProvider: (LocalDate) -> List<CalendarEvent>,
    monthlyEventsProvider: (YearMonth) -> List<CalendarEvent>,
    showHeader: Boolean = true,
    topPadding: androidx.compose.ui.unit.Dp? = null,
    viewType: String = "month",
    onViewTypeChanged: (String) -> Unit = {},
    scheduleTodayTrigger: Int = 0  // Increment to scroll schedule view to today
) {
    // Calendar progress: Fixed at 0f (Standard View) - Collapsing Removed
    val calendarProgress = 0f // Static Month View
    
    val layoutConfiguration = androidx.compose.ui.platform.LocalConfiguration.current
    val isLayoutLandscape = layoutConfiguration.orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE
    
    // Top padding to clear static collapsed TopMenuBar (statusBarHeight + 20.dp + 50.dp + 10.dp)
    val actualTopPadding = topPadding ?: (rememberStatusBarHeight() + 80.dp)
    
    // No drag sensitivity needed as collapsing is disabled
    val scope = rememberCoroutineScope()
    
    var showMonthPicker by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.calendarBackground)
    ) {
        MonthYearPickerDialog(
            visible = showMonthPicker,
            currentMonth = currentMonth,
            onDismissRequest = { showMonthPicker = false },
            onMonthYearSelected = { newMonth ->
                onMonthChanged(newMonth)
            },
            colors = colors
        )

        // Fixed layout
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.calendarBackground)
                .padding(top = actualTopPadding)
        ) {
            
            // --- Month Title (Centered) with Navigation --- (Hidden in Landscape to save space)
            if (viewType == "month" && !isLayoutLandscape) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .padding(bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center // Align title to Center
                ) {
                     val lang = LocalAppLanguage.current
                     val currentYear = java.time.LocalDate.now().year
                     val titleText = if (currentMonth.year == currentYear) {
                         currentMonth.month.toMozhiName(lang, isShort = false)
                     } else {
                         currentMonth.toMozhiString(lang, isShort = false)
                     }

                     // Month Title (Clickable but Plain Text Visual)
                     Box(
                         modifier = Modifier
                             .clip(HomeShapes.Pill)
                             .clickable { 
                                 showMonthPicker = true
                             }
                             .padding(vertical = 8.dp, horizontal = 12.dp),
                         contentAlignment = Alignment.Center
                     ) {
                         Text(
                             text = titleText,
                             fontSize = 22.sp,
                             fontWeight = FontWeight.SemiBold,
                             color = colors.textPrimary
                         )
                     }
                }
            }

                if (viewType == "month") {
                    // --- MONTH VIEW ---
                    val configuration = androidx.compose.ui.platform.LocalConfiguration.current
                    val isLandscape = configuration.orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE
                    
                    if (isLandscape) {
                        // --- LANDSCAPE: Two-Pane Side-by-Side Layout ---
                        Row(modifier = Modifier.fillMaxSize()) {
                            // LEFT PANE: Calendar Grid (Scaled to fit)
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .padding(end = 4.dp)
                            ) {
                                // --- Month Title for Landscape ---
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 4.dp)
                                        .padding(bottom = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                     val lang = LocalAppLanguage.current
                                     val currentYear = java.time.LocalDate.now().year
                                     val titleText = if (currentMonth.year == currentYear) {
                                         currentMonth.month.toMozhiName(lang, isShort = false)
                                     } else {
                                         currentMonth.toMozhiString(lang, isShort = false)
                                     }
                                    
                                    Box(
                                        modifier = Modifier
                                            .clip(HomeShapes.Pill)
                                            .clickable { showMonthPicker = true }
                                            .padding(vertical = 4.dp, horizontal = 12.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = titleText,
                                            fontSize = 20.sp, // Slightly smaller than portrait
                                            fontWeight = FontWeight.SemiBold,
                                            color = colors.textPrimary
                                        )
                                    }
                                }
                                
                                CalendarWidget(
                                    currentMonth = currentMonth,
                                    selectedDate = selectedDate,
                                    eventIndicators = eventIndicators,
                                    colors = colors,
                                    calendarProgress = 0f,
                                    onDateSelected = onDateSelected,
                                    onMonthChanged = onMonthChanged,
                                    showHeader = showHeader
                                )
                            }
                            
                            // RIGHT PANE: Event Details
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                                    .padding(start = 4.dp)
                                    .verticalScroll(rememberScrollState())
                            ) {
                                // Selected Day Section with HorizontalPager
                                androidx.compose.foundation.pager.HorizontalPager(
                                    state = dayPagerState,
                                    modifier = Modifier.fillMaxWidth().wrapContentHeight(),
                                    verticalAlignment = Alignment.Top,
                                    pageSpacing = 16.dp
                                ) { page ->
                                    val anchorDate = java.time.LocalDate.now()
                                    val daysOffset = page - (Int.MAX_VALUE / 2)
                                    val pageDate = anchorDate.plusDays(daysOffset.toLong())
                                    
                                    val events = eventsProvider(pageDate)
                                    
                                    SelectedDaySection(
                                        date = pageDate,
                                        events = events,
                                        colors = colors,
                                        isRefreshing = isRefreshing,
                                        onRefresh = onRefresh
                                    )
                                }
                                
                                Spacer(modifier = Modifier.height(16.dp))
                            }
                        }
                    } else {
                        // --- PORTRAIT: Card-Style Slide Over (Original) ---
                    
                        // 1. Measure the Calendar Height to know start offset
                        val density = LocalDensity.current
                        val calendarHeightDp = 286.dp
                        val calendarHeightPx = with(density) { calendarHeightDp.toPx() }
                    
                        val agendaOffsetAnim = remember { Animatable(calendarHeightPx) }
                        val bottomScrollState = rememberScrollState()
                        val smoothAttachSpec = remember {
                            tween<Float>(
                                durationMillis = 280,
                                easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)
                            )
                        }

                        // Settle function: clean, directional, zero rebound or hit-back
                        fun settleCard(velocity: Float = 0f) {
                            scope.launch {
                                val current = agendaOffsetAnim.value
                                val target = when {
                                    velocity < -80f -> 0f // Swiping UP -> Open and stay open
                                    velocity > 80f -> calendarHeightPx // Swiping DOWN -> Close and stay closed
                                    current < calendarHeightPx * 0.5f -> 0f
                                    else -> calendarHeightPx
                                }
                                agendaOffsetAnim.animateTo(
                                    targetValue = target,
                                    animationSpec = smoothAttachSpec
                                )
                            }
                        }

                        // Shared 1:1 Direct Draggable State
                        val draggableState = rememberDraggableState { delta ->
                            val current = agendaOffsetAnim.value
                            val newOffset = (current + delta).coerceIn(0f, calendarHeightPx)
                            scope.launch { agendaOffsetAnim.snapTo(newOffset) }
                        }

                        // Nested Scroll connection for inner scrollable content
                        val nestedScrollConnection = remember(calendarHeightPx) {
                            object : NestedScrollConnection {
                                override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                                    val delta = available.y
                                    val currentOffset = agendaOffsetAnim.value

                                    // 1. Dragging UP (delta < 0) when bottom card is not fully expanded
                                    if (delta < 0f && currentOffset > 0f) {
                                        val newOffset = (currentOffset + delta).coerceIn(0f, calendarHeightPx)
                                        val consumed = newOffset - currentOffset
                                        scope.launch { agendaOffsetAnim.snapTo(newOffset) }
                                        return Offset(0f, consumed)
                                    }

                                    // 2. Dragging DOWN (delta > 0) when inner scroll is at top and card is open
                                    if (delta > 0f && bottomScrollState.value == 0 && currentOffset < calendarHeightPx) {
                                        val newOffset = (currentOffset + delta).coerceIn(0f, calendarHeightPx)
                                        val consumed = newOffset - currentOffset
                                        scope.launch { agendaOffsetAnim.snapTo(newOffset) }
                                        return Offset(0f, consumed)
                                    }

                                    return Offset.Zero
                                }

                                override fun onPostScroll(consumed: Offset, available: Offset, source: NestedScrollSource): Offset {
                                    val delta = available.y
                                    val currentOffset = agendaOffsetAnim.value

                                    // If inner scroll reaches top and there's remaining downward scroll, pull card down
                                    if (delta > 0f && currentOffset < calendarHeightPx) {
                                        val newOffset = (currentOffset + delta).coerceIn(0f, calendarHeightPx)
                                        val consumedY = newOffset - currentOffset
                                        scope.launch { agendaOffsetAnim.snapTo(newOffset) }
                                        return Offset(0f, consumedY)
                                    }

                                    return Offset.Zero
                                }

                                override suspend fun onPreFling(available: Velocity): Velocity {
                                    val vy = available.y
                                    val current = agendaOffsetAnim.value

                                    if (current > 0f && current < calendarHeightPx) {
                                        settleCard(vy)
                                        return available
                                    }
                                    if (vy > 0f && bottomScrollState.value == 0 && current < calendarHeightPx) {
                                        settleCard(vy)
                                        return available
                                    }
                                    if (vy < 0f && current > 0f) {
                                        settleCard(vy)
                                        return available
                                    }

                                    return Velocity.Zero
                                }
                            }
                        }

                        Box(modifier = Modifier.fillMaxSize()) {
                        
                            // LAYER 1: Calendar Widget (Immediate zero-slop finger tracking)
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(calendarHeightDp)
                                    .pointerInput(calendarHeightPx) {
                                        awaitEachGesture {
                                            val down = awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial)
                                            var lastY = down.position.y
                                            var totalX = 0f
                                            var totalY = 0f
                                            var isVerticalDrag: Boolean? = null
                                            val velocityTracker = VelocityTracker()
                                            velocityTracker.addPosition(down.uptimeMillis, down.position)

                                            while (true) {
                                                val event = awaitPointerEvent(PointerEventPass.Initial)
                                                val change = event.changes.firstOrNull { it.id == down.id } ?: break
                                                if (!change.pressed) break

                                                val currentY = change.position.y
                                                val currentX = change.position.x
                                                val deltaY = currentY - lastY
                                                val deltaX = currentX - (down.position.x + totalX)

                                                totalX += deltaX
                                                totalY += deltaY
                                                lastY = currentY
                                                velocityTracker.addPosition(change.uptimeMillis, change.position)

                                                if (isVerticalDrag == null) {
                                                    if (kotlin.math.abs(totalY) > 6f && kotlin.math.abs(totalY) > kotlin.math.abs(totalX)) {
                                                        isVerticalDrag = true
                                                    } else if (kotlin.math.abs(totalX) > 8f && kotlin.math.abs(totalX) > kotlin.math.abs(totalY)) {
                                                        isVerticalDrag = false
                                                    }
                                                }

                                                if (isVerticalDrag == true) {
                                                    val current = agendaOffsetAnim.value
                                                    val newOffset = (current + deltaY).coerceIn(0f, calendarHeightPx)
                                                    scope.launch { agendaOffsetAnim.snapTo(newOffset) }
                                                    change.consume()
                                                }
                                            }
                                            if (isVerticalDrag == true) {
                                                val vy = velocityTracker.calculateVelocity().y
                                                settleCard(vy)
                                            }
                                        }
                                    }
                            ) {
                                CalendarWidget(
                                    currentMonth = currentMonth,
                                    selectedDate = selectedDate,
                                    eventIndicators = eventIndicators,
                                    colors = colors,
                                    calendarProgress = 0f, 
                                    onDateSelected = onDateSelected,
                                    onMonthChanged = onMonthChanged,
                                    showHeader = showHeader
                                )
                            }
                        
                            // LAYER 2: Agenda Card (Sliding Foreground)
                            BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
                                val screenHeight = maxHeight

                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(screenHeight) 
                                        .offset { IntOffset(0, agendaOffsetAnim.value.toInt()) }
                                        .nestedScroll(nestedScrollConnection)
                                        .background(Color.Transparent)
                                ) {
                                    Column(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)) 
                                            .background(colors.calendarBottomBackground)
                                            .padding(top = 0.dp) 
                                    ) {
                                        // --- THE HANDLE (SHUTTER) with instant zero-slop finger tracking ---
                                        Box(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .height(36.dp)
                                                .background(colors.calendarBottomBackground)
                                                .clickable {
                                                    scope.launch {
                                                        val target = if (agendaOffsetAnim.value < calendarHeightPx / 2f) calendarHeightPx else 0f
                                                        agendaOffsetAnim.animateTo(target, smoothAttachSpec)
                                                    }
                                                }
                                                .draggable(
                                                    orientation = Orientation.Vertical,
                                                    state = draggableState,
                                                    onDragStopped = { velocity ->
                                                        settleCard(velocity)
                                                    }
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            // Visual Pill
                                            Box(
                                                modifier = Modifier
                                                    .width(36.dp)
                                                    .height(4.5.dp)
                                                    .clip(CircleShape)
                                                    .background(colors.textSecondary.copy(alpha = 0.25f))
                                            )
                                        }
                                    
                                        // Scrollable inner content
                                        Column(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .verticalScroll(bottomScrollState)
                                        ) {
                                            // Wrapper for Grid/List
                                            Box(modifier = Modifier.heightIn(min = 200.dp)) {
                                                Column {
                                                    // Selected Day Section with HorizontalPager
                                                    androidx.compose.foundation.pager.HorizontalPager(
                                                        state = dayPagerState,
                                                        modifier = Modifier.fillMaxWidth().wrapContentHeight(),
                                                        verticalAlignment = Alignment.Top,
                                                        pageSpacing = 16.dp
                                                    ) { page ->
                                                        val anchorDate = java.time.LocalDate.now()
                                                        val daysOffset = page - (Int.MAX_VALUE / 2)
                                                        val pageDate = anchorDate.plusDays(daysOffset.toLong())
                                                    
                                                        val events = eventsProvider(pageDate)
                                                    
                                                        SelectedDaySection(
                                                            date = pageDate,
                                                            events = events,
                                                            colors = colors,
                                                            isRefreshing = isRefreshing,
                                                            onRefresh = onRefresh
                                                        )
                                                    }
                                                
                                                    Spacer(modifier = Modifier.height(16.dp))
                                                }
                                            }
                                            
                                            // Add extra spacer at bottom
                                            Spacer(modifier = Modifier.height(24.dp)) 
                                        }
                                    }
                                }
                            }
                        }
                    } // End portrait/landscape branch
                } else {
                 // --- SCHEDULE VIEW ---
                 // Independent Pager
                val initialPage = Int.MAX_VALUE / 2
                val schedulePagerState = androidx.compose.foundation.pager.rememberPagerState(initialPage = initialPage) { Int.MAX_VALUE }
                
                // State for Month/Year Picker in Schedule View
                var showScheduleMonthPicker by remember { mutableStateOf(false) }
                
                // Jump to Today when trigger changes (from parent Today button)
                LaunchedEffect(scheduleTodayTrigger) {
                    if (scheduleTodayTrigger > 0) { // Skip initial composition
                        schedulePagerState.animateScrollToPage(initialPage)
                    }
                }
                
                // Sync: Pager -> State REMOVED to decouple
                // Sync: State -> Pager REMOVED to decouple

                // Derived State for Header Title
                val currentSchedulePage = schedulePagerState.currentPage
                val currentScheduleMonth = remember(currentSchedulePage) {
                    val diff = currentSchedulePage - initialPage
                    YearMonth.now().plusMonths(diff.toLong())
                }
                
                // Month/Year Picker Dialog for Schedule View
                MonthYearPickerDialog(
                    visible = showScheduleMonthPicker,
                    currentMonth = currentScheduleMonth,
                    onDismissRequest = { showScheduleMonthPicker = false },
                    onMonthYearSelected = { selectedMonth ->
                        // Calculate page offset from now and scroll
                        val now = YearMonth.now()
                        val monthsDiff = java.time.temporal.ChronoUnit.MONTHS.between(now, selectedMonth).toInt()
                        val targetPage = initialPage + monthsDiff
                        scope.launch {
                            schedulePagerState.animateScrollToPage(targetPage)
                        }
                    },
                    colors = colors
                )
                
                Column(modifier = Modifier.fillMaxSize()) {
                    // Custom Header for Schedule View
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        val lang = LocalAppLanguage.current
                        Text(
                            text = currentScheduleMonth.toMozhiString(lang, isShort = false),
                            style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                            color = colors.textPrimary,
                            modifier = Modifier
                                .clip(RoundedCornerShape(50)) // Pill shape ripple
                                .clickable { showScheduleMonthPicker = true }
                                .padding(horizontal = 8.dp, vertical = 4.dp) // Touch target padding
                        )

                        // Right: Navigation Buttons
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            // Previous Month
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(colors.surface)
                                    .clickable {
                                        scope.launch {
                                            schedulePagerState.animateScrollToPage(schedulePagerState.currentPage - 1)
                                        }
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                                    contentDescription = K.previousMonth.tr(lang),
                                    tint = colors.textPrimary
                                )
                            }


                            // Next Month
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(colors.surface)
                                    .clickable {
                                        scope.launch {
                                            schedulePagerState.animateScrollToPage(schedulePagerState.currentPage + 1)
                                        }
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                    contentDescription = K.nextMonth.tr(lang),
                                    tint = colors.textPrimary
                                )
                            }
                        }
                    }
                
                // The Pager
                androidx.compose.foundation.pager.HorizontalPager(
                    state = schedulePagerState,
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    verticalAlignment = Alignment.Top
                ) { page ->
                    val pageMonth = YearMonth.now().plusMonths((page - initialPage).toLong())
                    val events = monthlyEventsProvider(pageMonth)
                    
                    MonthScheduleList(
                        month = pageMonth,
                        events = events,
                        colors = colors,
                        headerContent = {
                            OfficialDocumentsSection(colors, onNavigateToPdf)
                        }
                    )
                }
            }
        }

    }
    }
}

@Composable
fun OfficialDocumentsSection(colors: HomeColors, onNavigateToPdf: (String) -> Unit) {
    // Official Documents - Collapsible Section
    var isDocsExpanded by remember { mutableStateOf(false) }
    val context = androidx.compose.ui.platform.LocalContext.current
    val haptics = LocalHapticFeedback.current
    val lang = LocalAppLanguage.current
    var pdfUrl by remember { mutableStateOf("https://raw.githubusercontent.com/ElvanParthasarathy/RmdNeramPublic/main/Pdfs/academic-calendar.pdf") }

    LaunchedEffect(Unit) {
        try {
            com.google.firebase.database.FirebaseDatabase.getInstance().getReference("official_docs/academic_calendar/url").get().addOnSuccessListener { snapshot ->
                val url = snapshot.getValue(String::class.java)
                if (!url.isNullOrEmpty()) {
                    pdfUrl = url
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    Column(modifier = Modifier.padding(bottom=0.dp)) {
        // Header Pill (Clickable) - FLAT DESIGN
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = HomeShapes.Card,
            color = colors.surface,
            shadowElevation = 0.dp,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(HomeShapes.Card)
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = ripple(color = if (colors.isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f), bounded = true)
                    ) { isDocsExpanded = !isDocsExpanded }
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Title
                Text(
                    text = K.officialDocuments.tr(lang),
                    style = HomeTypography.SectionTitle.copy(color = colors.textSecondary)
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Expand Icon
                    Icon(
                        imageVector = if (isDocsExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = if (isDocsExpanded) K.collapse.tr(lang) else K.expand.tr(lang),
                        tint = colors.textSecondary
                    )
                }
            }
        }
        
        // Collapsible Content
        AnimatedVisibility(
            visible = isDocsExpanded,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            Column(
                modifier = Modifier.padding(top = 8.dp, start = 16.dp, end = 16.dp)
            ) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(HomeShapes.Item)
                        .combinedClickable(
                            onClick = {
                                onNavigateToPdf(pdfUrl)
                            },
                            onLongClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                val clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                                val clip = android.content.ClipData.newPlainText("PDF Link", pdfUrl)
                                clipboard.setPrimaryClip(clip)
                                android.widget.Toast.makeText(context, K.linkCopiedToClipboard.tr(lang), android.widget.Toast.LENGTH_SHORT).show()
                            }
                        ),
                    shape = HomeShapes.Item,
                    color = colors.surface,
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = K.academicCalendar.tr(lang),
                                style = HomeTypography.PillTitle,
                                color = colors.textPrimary
                            )
                            Text(
                                text = K.downloadPdfForOffline.tr(lang),
                                fontSize = 12.sp,
                                color = colors.textSecondary
                            )
                        }
                    }
                }
            }
        }
    }
}

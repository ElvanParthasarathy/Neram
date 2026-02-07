package com.elvan.rmdneram.ui.calendar

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
import com.elvan.rmdneram.data.model.CalendarEvent
import com.elvan.rmdneram.ui.components.ExpressivePullToRefreshBox
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeTypography
import com.elvan.rmdneram.ui.home.HomeDimens
import com.elvan.rmdneram.ui.home.rememberStatusBarHeight
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
    
    // Reduced top padding as per user request
    val actualTopPadding = topPadding ?: (rememberStatusBarHeight() + HomeDimens.ContentPaddingTop - 20.dp)
    
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
            
            // --- Month Title (Centered) with Navigation ---
            if (viewType == "month") {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .padding(bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center // Align title to Center
                ) {
                     val currentYear = java.time.LocalDate.now().year
                     val monthName = currentMonth.month.getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH).uppercase()
                     
                     val titleText = if (currentMonth.year == currentYear) {
                         monthName
                     } else {
                         "$monthName ${currentMonth.year}"
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
                    // --- MONTH VIEW: Card-Style Slide Over ---
                    
                    // 1. Measure the Calendar Height to know start offset
                    // Tightened estimate to reduce gap (Header ~60 + 5.5 rows * 52 = ~346?)
                    // User reported "VERY LITTLE BIT DOWN" -> Micro-adjusting to 286.dp
                    val density = LocalDensity.current
                    val calendarHeightDp = 286.dp
                    val calendarHeightPx = with(density) { calendarHeightDp.toPx() }
                    
                    // ... (Animatable remains same) ...
                    val agendaOffsetAnim = remember { Animatable(calendarHeightPx) }
                    // scope moved to top level
                    
                    // 3. Draggable Handle Logic (Shutter Mode)
                    // We removed NestedScrollConnection. Dragging is now exclusive to the handle.
                    // No nestedScrollConnection needed.

                    // ... (Root Box) ...
                    Box(modifier = Modifier.fillMaxSize()) {
                        
                        // LAYER 1: Calendar Widget (Static Background)
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(calendarHeightDp) 
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

                             // Removed ExpressivePullToRefreshBox - Replaced with Direct Content
                             Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(screenHeight) 
                                    .offset { IntOffset(0, agendaOffsetAnim.value.toInt()) } 
                                    .background(Color.Transparent)
                            ) {
                                 Column(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .clip(RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)) 
                                        .background(colors.calendarBottomBackground)
                                        // .shadow(elevation = 8.dp) // Removed to eliminate side artifacts 
                                        .verticalScroll(rememberScrollState())
                                        .padding(top = 0.dp) 
                                ) {
                                    // --- THE HANDLE (SHUTTER) ---
                                    var accDrag by remember { mutableFloatStateOf(0f) }
                                    
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(32.dp) // Reduced height (48->32) to close gap
                                            .background(colors.calendarBottomBackground) 
                                            .pointerInput(Unit) {
                                                detectVerticalDragGestures(
                                                    onDragStart = { accDrag = 0f },
                                                    onDragEnd = {
                                                        scope.launch {
                                                            // Snap Logic with Directional Intent
                                                            val current = agendaOffsetAnim.value
                                                            val threshold = 100f // ~30-40dp swipe threshold
                                                            
                                                            val target = when {
                                                                // Swipe UP (Negative) -> Go Top
                                                                accDrag < -threshold -> 0f 
                                                                // Swipe DOWN (Positive) -> Go Bottom
                                                                accDrag > threshold -> calendarHeightPx
                                                                // Short drag? Snap to nearest
                                                                else -> if (current < calendarHeightPx / 2) 0f else calendarHeightPx
                                                            }
                                                            
                                                            agendaOffsetAnim.animateTo(
                                                                targetValue = target,
                                                                animationSpec = spring(stiffness = Spring.StiffnessLow)
                                                            )
                                                        }
                                                    }
                                                ) { change, dragAmount ->
                                                    change.consume()
                                                    accDrag += dragAmount
                                                    scope.launch {
                                                        val newOffset = (agendaOffsetAnim.value + dragAmount).coerceIn(0f, calendarHeightPx)
                                                        agendaOffsetAnim.snapTo(newOffset)
                                                    }
                                                }
                                            },
                                        contentAlignment = Alignment.Center
                                    ) {
                                        // Visual Pill
                                        Box(
                                            modifier = Modifier
                                                .width(32.dp)
                                                .height(4.dp)
                                                .clip(CircleShape)
                                                .background(colors.textSecondary.copy(alpha = 0.2f))
                                        )
                                    }
                                    
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
                                                    isRefreshing = isRefreshing, // Passed from Parent
                                                    onRefresh = onRefresh        // Passed from Parent
                                                )
                                            }
                                            
                                            Spacer(modifier = Modifier.height(16.dp))
                                            
                                            // Add extra spacer at bottom
                                            Spacer(modifier = Modifier.height(24.dp)) 
                                        }
                                     }
                                }
                            }
                        }
                    }

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
                            .padding(horizontal = 24.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Left: Month Title (Clickable to open Month Picker)
                        Text(
                            text = "${currentScheduleMonth.month.getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.getDefault())} ${currentScheduleMonth.year}",
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
                                    imageVector = Icons.Filled.KeyboardArrowLeft,
                                    contentDescription = "Previous Month",
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
                                    imageVector = Icons.Filled.KeyboardArrowRight,
                                    contentDescription = "Next Month",
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
                .padding(horizontal = 24.dp),
            shape = HomeShapes.Card,
            color = colors.surface,
            shadowElevation = 0.dp, // Flat
            // border = BorderStroke(1.dp, colors.border.copy(alpha = 0.1f)) // REMOVED BORDER
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { isDocsExpanded = !isDocsExpanded }
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Title
                Text(
                    text = "Official Documents",
                    style = HomeTypography.SectionTitle.copy(color = colors.textSecondary)
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Expand Icon
                    Icon(
                        imageVector = if (isDocsExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        contentDescription = if (isDocsExpanded) "Collapse" else "Expand",
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
                modifier = Modifier.padding(top = 12.dp, start = 24.dp, end = 24.dp)
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
                                android.widget.Toast.makeText(context, "Link copied to clipboard", android.widget.Toast.LENGTH_SHORT).show()
                            }
                        ),
                    shape = HomeShapes.Item,
                    color = colors.surface,
                    // border = BorderStroke(1.dp, colors.border.copy(alpha = 0.1f)) // REMOVED BORDER
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Academic Calendar",
                                style = HomeTypography.PillTitle,
                                color = colors.textPrimary
                            )
                            Text(
                                text = "Download PDF for offline use",
                                fontSize = 12.sp,
                                color = colors.textSecondary
                            )
                        }
                        // Download Button (Replaces Description Icon)

                    }
                }
            }
        }
    }
}

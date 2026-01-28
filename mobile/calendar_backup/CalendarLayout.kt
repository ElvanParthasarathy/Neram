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
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
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
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.combinedClickable
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.ui.input.pointer.pointerInput

/**
 * Calendar Layout - Structural component for the Calendar Screen.
 */
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
    eventsProvider: (LocalDate) -> List<CalendarEvent>
) {
    // Calendar progress: -1f = collapsed (selected row only), 0f = normal, 1f = detailed view
    // Uses Animatable for smooth finger-following animation
    val calendarProgress = remember { Animatable(0f) }
    val scope = rememberCoroutineScope()
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.calendarBackground)
            // Detect vertical drag for smooth collapse/expand with fling support
            .pointerInput(Unit) {
                var cumulativeDrag = 0f
                var dragCount = 0
                detectVerticalDragGestures(
                    onDragStart = {
                        cumulativeDrag = 0f
                        dragCount = 0
                    },
                    onDragEnd = {
                        // Calculate average velocity from cumulative drag
                        val avgDrag = if (dragCount > 0) cumulativeDrag / dragCount else 0f
                        // Lower threshold for more responsive flings
                        val flingThreshold = 3f // Average drag amount threshold
                        
                        // Three-state snapping: -1 (collapsed), 0 (normal), 1 (detailed)
                        val currentProgress = calendarProgress.value
                        val target = when {
                            // Fling up -> move towards collapsed (-1)
                            avgDrag < -flingThreshold -> {
                                if (currentProgress > 0f) 0f else -1f
                            }
                            // Fling down -> move towards detailed (1)
                            avgDrag > flingThreshold -> {
                                if (currentProgress < 0f) 0f else 1f
                            }
                            // Snap to nearest state
                            else -> {
                                when {
                                    currentProgress < -0.5f -> -1f
                                    currentProgress > 0.5f -> 1f
                                    else -> 0f
                                }
                            }
                        }
                        cumulativeDrag = 0f
                        dragCount = 0
                        scope.launch {
                            calendarProgress.animateTo(
                                targetValue = target,
                                animationSpec = spring(
                                    dampingRatio = Spring.DampingRatioNoBouncy,
                                    stiffness = Spring.StiffnessMedium
                                )
                            )
                        }
                    },
                    onDragCancel = {
                        cumulativeDrag = 0f
                        dragCount = 0
                        scope.launch {
                            // Snap to nearest state on cancel
                            val currentProgress = calendarProgress.value
                            val target = when {
                                currentProgress < -0.5f -> -1f
                                currentProgress > 0.5f -> 1f
                                else -> 0f
                            }
                            calendarProgress.animateTo(target)
                        }
                    }
                ) { change, dragAmount ->
                    // Accumulate drag for velocity estimation
                    cumulativeDrag += dragAmount
                    dragCount++
                    
                    // Follow finger precisely
                    // totalHeight covers the full range from collapsed to detailed
                    val totalHeight = 312f // ~6 rows * 52dp for full range
                    val dragSensitivity = 2f / (totalHeight * density)
                    val newProgress = (calendarProgress.value + dragAmount * dragSensitivity).coerceIn(-1f, 1f)
                    scope.launch {
                        calendarProgress.snapTo(newProgress)
                    }
                }
            }
    ) {
        // Fixed layout - no scrolling
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.calendarBackground)
                .padding(top = rememberStatusBarHeight() + 70.dp)
        ) {
            // --- TOP SECTION: Calendar Widget ---
            CalendarWidget(
                currentMonth = currentMonth,
                selectedDate = selectedDate,
                eventIndicators = eventIndicators,
                colors = colors,
                calendarProgress = calendarProgress.value,
                onDateSelected = onDateSelected,
                onMonthChanged = onMonthChanged
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            // --- BOTTOM SECTION: Agenda (with PTR) ---
            ExpressivePullToRefreshBox(
                pullRefreshState = pullRefreshState,
                isRefreshing = isRefreshing,
                onRefresh = onRefresh,
                colors = colors,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize() // Fill the PTR box
                        .background(colors.calendarBottomBackground)
                        .padding(top = 24.dp, bottom = 24.dp)
                ) {
                    // Selected Day Section with HorizontalPager
                    androidx.compose.foundation.pager.HorizontalPager(
                        state = dayPagerState,
                        modifier = Modifier.fillMaxWidth().weight(1f),
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
                            colors = colors
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))

                    // Official Documents - Collapsible Section
                    var isDocsExpanded by remember { mutableStateOf(false) }
                    val context = androidx.compose.ui.platform.LocalContext.current
                    val haptics = LocalHapticFeedback.current
                    val pdfUrl = "https://raw.githubusercontent.com/ElvanParthasarathy/RmdNeramPublic/main/Pdfs/academic-calendar.pdf"
                    
                    Column {
                        // Header Pill (Clickable)
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 24.dp),
                            shape = HomeShapes.Card,
                            color = colors.surface,
                            shadowElevation = 0.dp
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
                                Text(
                                    text = "Official Documents",
                                    style = HomeTypography.SectionTitle.copy(color = colors.textSecondary)
                                )
                                Icon(
                                    imageVector = if (isDocsExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                    contentDescription = if (isDocsExpanded) "Collapse" else "Expand",
                                    tint = colors.textSecondary
                                )
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
                                    border = BorderStroke(1.dp, colors.border.copy(alpha = 0.1f))
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
                                        Icon(
                                            imageVector = Icons.Default.Description,
                                            contentDescription = "PDF",
                                            tint = colors.accent
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
}

package com.elvan.rmdneram.ui.schedule

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp // Added for font size
import androidx.compose.material3.MaterialTheme // Added for potential theme access
import androidx.compose.ui.graphics.luminance // Added for detecting dark mode (DayTabsRow logic)
import com.elvan.rmdneram.data.model.*
import com.elvan.rmdneram.ui.components.ExpressivePullToRefreshBox
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.common.ScheduleLogic
import com.elvan.rmdneram.utils.DateTimeUtils
import java.time.format.DateTimeFormatter

import androidx.compose.ui.platform.LocalDensity
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.statusBars
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.ui.graphics.TransformOrigin

/**
 * ScheduleLayout - The structural skeleton of the Schedule Screen.
 * 
 * Defines the placement and arrangement of all UI sections.
 * Delegates rendering to components in ScheduleComponents.kt.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleMainLayout(
    uiState: HomeUiState,
    scheduleState: ScheduleState,
    activeTab: String,
    onTabSelected: (String) -> Unit,
    showDatePicker: Boolean,
    onShowDatePickerChange: (Boolean) -> Unit,
    colors: HomeColors,
    pullRefreshState: PullToRefreshState,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    selectedDateFormatted: String,

    onDatePillClick: () -> Unit,
    onDateSwipePrev: () -> Unit,
    onDateSwipeNext: () -> Unit
) {
    // Interaction Overlay State for View Type Switcher
    var isViewTypeSwitching by remember { mutableStateOf(false) }
    var viewTypeDragProgress by remember { mutableFloatStateOf(0f) }
    
    // Swipe Direction for Animation (0=None, -1=Next, 1=Prev)
    var swipeDirection by remember { mutableIntStateOf(0) }
    
    // Sync progress with selection when not interacting
    val viewTypeIndex = if (activeTab == "class") 0f else 1f
    LaunchedEffect(activeTab) {
        if (!isViewTypeSwitching) viewTypeDragProgress = viewTypeIndex
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        // 1. Content Area (Behind Header)
        ExpressivePullToRefreshBox(
            pullRefreshState = pullRefreshState,
            isRefreshing = isRefreshing,
            onRefresh = onRefresh,
            colors = colors,
            showIndicator = false,
            modifier = Modifier.fillMaxSize()
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    top = rememberStatusBarHeight() + HomeDimens.ContentPaddingTop,
                    bottom = HomeDimens.ContentPaddingBottom
                )
            ) {
                // --- Switcher (Movable) ---
                item {
                    Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)) {
                        ViewTypeTabsRow(
                            activeTab = activeTab,
                            onTabSelected = onTabSelected,
                            colors = colors,
                            onInteraction = { isViewTypeSwitching = it },
                            onDragProgress = { viewTypeDragProgress = it },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
                
                item {
                     Spacer(modifier = Modifier.height(24.dp))
                }
                // --- Controls (Status Pill & Date) - Only for Class Tab ---
                if (activeTab == "class") {
                    // --- Date Switcher (Home Style) ---
                    item {
                        Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)) {
                            DateSection(
                                formattedDate = selectedDateFormatted,
                                colors = colors,
                                onClick = {
                                    swipeDirection = 0
                                    onDatePillClick()
                                },
                                onSwipeLeft = { // Swipe Left -> Next Day (minusDays)
                                    swipeDirection = -1 
                                    onDateSwipePrev()
                                },
                                onSwipeRight = { // Swipe Right -> Prev Day (plusDays)
                                    swipeDirection = 1
                                    onDateSwipeNext()
                                }
                            )
                        }
                    }
                    
                    item {
                         Spacer(modifier = Modifier.height(24.dp))
                    }
                }

                // --- Today's Schedule (Animated on Date Swipe) - Only for Class Tab ---
                if (activeTab == "class") {
                    item {
                        androidx.compose.animation.AnimatedContent(
                            targetState = selectedDateFormatted,
                            transitionSpec = {
                                val directionFactor = swipeDirection
                            if (directionFactor != 0) {
                                    (slideInHorizontally { width -> directionFactor * width } + fadeIn()) togetherWith
                                    (slideOutHorizontally { width -> -directionFactor * width } + fadeOut())
                                } else {
                                    // Date Picker Selection: Subtle Scale + Fade (Solid, no flicker)
                                    (fadeIn(animationSpec = tween(220, delayMillis = 90)) + 
                                     scaleIn(initialScale = 0.95f, animationSpec = tween(220, delayMillis = 90))) togetherWith
                                    (fadeOut(animationSpec = tween(90)))
                                }
                            },
                            label = "scheduleContentSlide"
                        ) { _ ->
                            Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)) {
                                ScheduleSection(
                                    scheduleState = scheduleState,
                                    masterData = uiState.masterData,
                                    isLoading = isRefreshing,
                                    colors = colors
                                )
                            }
                        }
                    }
                    
                    item {
                        Spacer(modifier = Modifier.height(32.dp))
                    }
                    
                    // --- Weekly Overview (Collapsible) - STATIC, doesn't slide ---
                    item {
                        var isExpanded by remember { mutableStateOf(false) } // Default closed
                        
                        // Smart Default Selection: Current Day if valid, else Tuesday
                        var selectedDay by remember { 
                            mutableStateOf(
                                run {
                                    val today = java.time.LocalDate.now().dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
                                    val validDays = listOf("Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
                                    if (validDays.contains(today)) today else "Tuesday"
                                }
                            )
                        }
                        
                        Column {
                            // Header Row - Button Style (Integrated Container)
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = HomeDimens.ContentPadding) // Outer padding
                                    .padding(bottom = 12.dp),
                                shape = HomeShapes.Card, // Match other cards (28dp)
                                color = colors.surface,
                                shadowElevation = 0.dp // Flat design
                                // Removed onClick here to allow inner clicks (Tabs)
                            ) {
                                Column {
                                    // Header Title Row - Toggles Expansion
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable(
                                                interactionSource = remember { MutableInteractionSource() },
                                                indication = null
                                            ) { isExpanded = !isExpanded }
                                            .padding(horizontal = 16.dp, vertical = 14.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "Weekly Schedule",
                                            style = HomeTypography.SectionTitle.copy(color = colors.textSecondary)
                                        )
                                        Icon(
                                            imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                            contentDescription = if (isExpanded) "Collapse" else "Expand",
                                            tint = colors.textSecondary
                                        )
                                    }
                                    
                                    // Collapsible Content Inside Card (Day Tabs)
                                    androidx.compose.animation.AnimatedVisibility(
                                        visible = isExpanded,
                                        enter = expandVertically() + fadeIn(),
                                        exit = shrinkVertically() + fadeOut()
                                    ) {
                                        // Day Tabs Integrated
                                        DayTabsRow(
                                            selectedDay = selectedDay,
                                            onDaySelected = { selectedDay = it },
                                            colors = colors,
                                            modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp, top = 8.dp) // Reduced top padding
                                        )
                                    }
                                }
                            }

                            // Schedule Table Content (Remains Outside)
                            androidx.compose.animation.AnimatedVisibility(
                                visible = isExpanded,
                                enter = expandVertically() + fadeIn(),
                                exit = shrinkVertically() + fadeOut()
                            ) {
                                Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)) {
                                    val periods = uiState.masterData.timetable[selectedDay]
                                    if (!periods.isNullOrEmpty()) {
                                        val periodTimes = listOf(
                                            "9:00 - 9:50", "9:50 - 10:40", "10:50 - 11:40", "11:40 - 12:30",
                                            "1:30 - 2:20", "2:20 - 3:10", "3:20 - 4:10", "4:10 - 5:00"
                                        )
                                        val displayPeriods = periods.mapIndexed { index, code ->
                                            val details = getDetails(code, uiState.masterData.courses)
                                            PeriodDisplayData(
                                                number = index + 1,
                                                time = periodTimes.getOrElse(index) { "" },
                                                entries = details.entries,
                                                isLab = details.isLab
                                            )
                                        }
                                        ScheduleTable(periods = displayPeriods, colors = colors, isMini = false)
                                    } else {
                                        EmptyScheduleCard(
                                            message = "No classes on $selectedDay",
                                            colors = colors
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(32.dp))
                                }
                            }
                        }
                    }
                }
                
                // --- EXAMS TAB ---
                if (activeTab == "exams") {
                    item {
                        Column {
                            uiState.masterData.exams.forEach { exam ->
                                Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding, vertical = 12.dp)) {
                                    ExamScheduleCard(exam = exam, courses = uiState.masterData.courses, colors = colors)
                                }
                            }
                            if (uiState.masterData.exams.isEmpty()) {
                                EmptyScheduleCard(
                                    message = "No Exam Timetables published.",
                                    colors = colors
                                )
                            }
                        }
                    }
                }
                
                // Small spacer before Course Directory
                if (activeTab == "class") {
                    item {
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
                
                // --- Course Directory & Staff Info - Only for Class Tab ---
                if (activeTab == "class") {
                    // --- Course Directory (Collapsible) ---
                    item {
                        var isCoursesExpanded by remember { mutableStateOf(false) }
                        
                        Column {
                            // Header Row - Button Style (Pill Container)
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = HomeDimens.ContentPadding)
                                    .padding(bottom = 12.dp),
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
                                        ) { isCoursesExpanded = !isCoursesExpanded }
                                        .padding(horizontal = 16.dp, vertical = 14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Academic Courses",
                                        style = HomeTypography.SectionTitle.copy(color = colors.textSecondary)
                                    )
                                    Icon(
                                        imageVector = if (isCoursesExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                        contentDescription = if (isCoursesExpanded) "Collapse" else "Expand",
                                        tint = colors.textSecondary
                                    )
                                }
                            }
                            
                            // Collapsible Content (Course Cards)
                            androidx.compose.animation.AnimatedVisibility(
                                visible = isCoursesExpanded,
                                enter = expandVertically() + fadeIn(),
                                exit = shrinkVertically() + fadeOut()
                            ) {
                                Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)) {
                                    CourseDirectoryTable(courses = uiState.masterData.courses, colors = colors)
                                    Spacer(modifier = Modifier.height(32.dp))
                                }
                            }
                        }
                    }
                    
                    // Spacer between sections
                    item {
                        Spacer(modifier = Modifier.height(12.dp))
                    }
                    
                    // --- Staff Info ---
                    item {
                         Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)) {
                             InfoCard(
                                 title = "Class Counselors",
                                 items = uiState.masterData.counseling.counselors,
                                 colors = colors
                             )
                             Spacer(modifier = Modifier.height(16.dp))
                             InfoCard(
                                 title = "Key Coordinators",
                                 items = uiState.masterData.counseling.coordinators.map { "${it.key}: ${it.value}" },
                                 colors = colors
                             )
                         }
                    }
                }
            }
        }



        // 3. Interaction Cover - Slider Overlay (layered ON TOP of content)

    } // closes Column
}

@Composable
private fun rememberStatusBarHeight(): androidx.compose.ui.unit.Dp {
    val density = LocalDensity.current
    val statusBars = WindowInsets.statusBars
    return remember(density, statusBars) {
        with(density) { statusBars.getTop(this).toDp() }
    }
}

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
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage

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
    selectedDate: java.time.LocalDate, // Added selectedDate
    selectedDateFormatted: String,

    onDatePillClick: () -> Unit,
    onDateSwipePrev: () -> Unit,
    onDateSwipeNext: () -> Unit
) {
    // ... existing state ...
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
                // --- Controls (Status Pill & Date) - Show for BOTH Tabs ---
                if (activeTab == "class" || activeTab == "exams") {
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

                // ... (rest of "class" tab content remains unchanged) ...

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
                        val lang = LocalAppLanguage.current
                        Text(
                            text = AppStrings.Schedule.weeklySchedule(lang),
                            style = HomeTypography.SectionTitle.copy(color = colors.textSecondary)
                        )
                        Icon(
                            imageVector = if (isExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                            contentDescription = if (isExpanded) AppStrings.Schedule.collapse(lang) else AppStrings.Schedule.expand(lang),
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
                                        val lang = LocalAppLanguage.current
                                        EmptyScheduleCard(
                                            message = AppStrings.Schedule.noClassesOn(selectedDay, lang),
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
                // --- EXAMS TAB ---
                if (activeTab == "exams") {
                    item {
                        androidx.compose.animation.AnimatedContent(
                            targetState = selectedDate, // Animate on date change
                            transitionSpec = {
                                val directionFactor = swipeDirection
                                if (directionFactor != 0) {
                                    (slideInHorizontally { width -> directionFactor * width } + fadeIn()) togetherWith
                                    (slideOutHorizontally { width -> -directionFactor * width } + fadeOut())
                                } else {
                                    // Date Picker Selection: Subtle Scale + Fade
                                    (fadeIn(animationSpec = tween(220, delayMillis = 90)) + 
                                     scaleIn(initialScale = 0.95f, animationSpec = tween(220, delayMillis = 90))) togetherWith
                                    (fadeOut(animationSpec = tween(90)))
                                }
                            },
                            label = "examContentSlide"
                        ) { targetDate ->
                            // Partition exams into Ongoing, Upcoming, and Finished
                            val (ongoingExams, otherExams) = remember(uiState.masterData.exams, targetDate) {
                                uiState.masterData.exams.partition { exam ->
                                    try {
                                        if (exam.startDate.isNotEmpty() && exam.endDate.isNotEmpty()) {
                                            val start = java.time.LocalDate.parse(exam.startDate)
                                            val end = java.time.LocalDate.parse(exam.endDate)
                                            // Ongoing: Start <= Selected <= End
                                            !targetDate.isBefore(start) && !targetDate.isAfter(end)
                                        } else {
                                            false // Invalid dates -> Treat as others (likely finished or error)
                                        }
                                    } catch (e: Exception) {
                                        false
                                    }
                                }
                            }

                            val (upcomingExams, finishedExams) = remember(otherExams, targetDate) {
                                val (upcoming, finished) = otherExams.partition { exam ->
                                    try {
                                        if (exam.startDate.isNotEmpty()) {
                                            val start = java.time.LocalDate.parse(exam.startDate)
                                            // Upcoming: Selected < Start
                                            targetDate.isBefore(start)
                                        } else {
                                            false
                                        }
                                    } catch (e: Exception) {
                                        false
                                    }
                                }
                                Pair(
                                    upcoming.sortedBy { it.startDate },
                                    finished.sortedByDescending { it.endDate.ifEmpty { it.startDate } }
                                )
                            }

                            Column {
                                val lang = LocalAppLanguage.current
                                // 1. Ongoing Exams Section
                                if (ongoingExams.isNotEmpty()) {
                                    Text(
                                        text = AppStrings.Schedule.ongoingExams(lang),
                                        style = HomeTypography.SectionTitle,
                                        color = colors.textPrimary,
                                        modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding, vertical = 8.dp)
                                    )
                                    ongoingExams.forEach { exam ->
                                        Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding, vertical = 12.dp)) {
                                            ExamScheduleCard(exam = exam, courses = uiState.masterData.courses, colors = colors, defaultExpanded = true, viewDate = targetDate)
                                        }
                                    }
                                } else {
                                    // No Ongoing Exams (but might have others)
                                    if (upcomingExams.isNotEmpty() || finishedExams.isNotEmpty()) {
                                        Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)) {
                                            EmptyScheduleCard(
                                                message = AppStrings.Schedule.noOngoingExams(lang),
                                                colors = colors
                                            )
                                            Spacer(modifier = Modifier.height(32.dp))
                                        }
                                    } else {
                                        // No exams at all (Empty DB or fetch)
                                        Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)) {
                                            EmptyScheduleCard(
                                                message = AppStrings.Schedule.noExamTimetables(lang),
                                                colors = colors
                                            )
                                             Spacer(modifier = Modifier.height(32.dp))
                                        }
                                    }
                                }

                                // 2. Upcoming Exams Section
                                if (upcomingExams.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(16.dp))
                                    Text(
                                        text = AppStrings.Schedule.upcomingExams(lang),
                                        style = HomeTypography.SectionTitle,
                                        color = colors.textPrimary,
                                        modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding, vertical = 8.dp)
                                    )
                                    upcomingExams.forEach { exam ->
                                        Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding, vertical = 12.dp)) {
                                            ExamScheduleCard(exam = exam, courses = uiState.masterData.courses, colors = colors, defaultExpanded = false, viewDate = targetDate)
                                        }
                                    }
                                }

                                // 3. Finished Exams Section (Collapsible)
                                if (finishedExams.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    var isFinishedExpanded by remember { mutableStateOf(false) }

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
                                                    ) { isFinishedExpanded = !isFinishedExpanded }
                                                    .padding(horizontal = 16.dp, vertical = 14.dp),
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text(
                                                    text = AppStrings.Schedule.finishedExams(lang),
                                                    style = HomeTypography.SectionTitle.copy(color = colors.textSecondary)
                                                )
                                                Icon(
                                                    imageVector = if (isFinishedExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                                    contentDescription = if (isFinishedExpanded) AppStrings.Schedule.collapse(lang) else AppStrings.Schedule.expand(lang),
                                                    tint = colors.textSecondary
                                                )
                                            }
                                        }
                                        
                                        // Collapsible Content
                                        androidx.compose.animation.AnimatedVisibility(
                                            visible = isFinishedExpanded,
                                            enter = expandVertically() + fadeIn(),
                                            exit = shrinkVertically() + fadeOut()
                                        ) {
                                            Column {
                                                finishedExams.forEach { exam ->
                                                    Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding, vertical = 12.dp)) {
                                                        ExamScheduleCard(exam = exam, courses = uiState.masterData.courses, colors = colors, defaultExpanded = false, viewDate = targetDate)
                                                    }
                                                }
                                                Spacer(modifier = Modifier.height(16.dp))
                                            }
                                        }
                                    }
                                }
                            }
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
                                val lang = LocalAppLanguage.current
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
                                        text = AppStrings.Schedule.academicCourses(lang),
                                        style = HomeTypography.SectionTitle.copy(color = colors.textSecondary)
                                    )
                                    Icon(
                                        imageVector = if (isCoursesExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                        contentDescription = if (isCoursesExpanded) AppStrings.Schedule.collapse(lang) else AppStrings.Schedule.expand(lang),
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
                         val lang = LocalAppLanguage.current
                         Column(modifier = Modifier.padding(horizontal = HomeDimens.ContentPadding)) {
                             InfoCard(
                                 title = AppStrings.Schedule.classCounselors(lang),
                                 items = uiState.masterData.counseling.counselors,
                                 colors = colors
                             )
                             Spacer(modifier = Modifier.height(16.dp))
                             InfoCard(
                                 title = AppStrings.Schedule.keyCoordinators(lang),
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

package com.elvan.rmdneram.ui.home

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.EventBusy
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.draw.scale
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImagePainter
import coil.compose.SubcomposeAsyncImage
import coil.compose.SubcomposeAsyncImageContent
import com.elvan.rmdneram.data.model.*
import com.elvan.rmdneram.ui.common.ScheduleLogic
import com.elvan.rmdneram.ui.home.components.EditableSection
import com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator
import com.elvan.rmdneram.ui.components.ExpressiveDotsLoader
import com.elvan.rmdneram.ui.navigation.CustomIcons
import com.elvan.rmdneram.utils.DateTimeUtils
import kotlinx.coroutines.delay

private val SpecialYellow = Color(0xFFFBC02D) // Yellow for Special Events (Matches Calendar)

// ============================================================================
// HOME SCREEN UI COMPONENTS
// All reusable UI composables extracted from HomeScreen.kt
// ============================================================================

/**
 * Page Header - Matches .page-header from mobileapp.css
 */
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
internal fun PageHeader(
    colors: HomeColors,
    userProfile: UserProfile?,
    showWelcomeMessage: Boolean = false,
    profileLoaderCompleted: Boolean = false,
    onProfileLoaderCompleted: () -> Unit = {},
    onProfileClick: () -> Unit = {}
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.HeaderGap)
    ) {
        
        // Static Container (Pill Shaped) - Content Animates Inside
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(HomeDimens.BigPillRadius),
            color = colors.surface,
            shadowElevation = HomeDimens.NoElevation
        ) {
            Box(contentAlignment = Alignment.CenterStart) {
                // Welcome Content (Visible when True)
                androidx.compose.animation.AnimatedVisibility(
                    visible = showWelcomeMessage,
                    enter = slideInVertically { height -> height } + fadeIn(),
                    exit = slideOutVertically { height -> -height } + fadeOut()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(HomeDimens.HeaderPillPadding),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = colors.subtleBackground,
                            modifier = Modifier.size(HomeDimens.AvatarSize)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    text = "👋",
                                    style = androidx.compose.ui.text.TextStyle(fontSize = 24.sp)
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.width(HomeDimens.SpacingXl))
                        
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Welcome to Neram!",
                                style = HomeTypography.PillTitle.copy(fontSize = 20.sp, fontWeight = FontWeight.Bold),
                                color = colors.textPrimary
                            )
                            Text(
                                text = "Glad you're here 😊",
                                style = HomeTypography.StatusBadge.copy(fontSize = 14.sp),
                                color = colors.textSecondary,
                                maxLines = 1
                            )
                        }
                    }
                }

                // Profile Content (Visible when False)
                androidx.compose.animation.AnimatedVisibility(
                    visible = !showWelcomeMessage,
                    enter = slideInVertically { height -> height } + fadeIn(),
                    exit = slideOutVertically { height -> -height } + fadeOut()
                ) {
                    // Profile or Skeleton
                    if (userProfile != null) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(HomeDimens.BigPillRadius)) // Clip for ripple
                                .clip(RoundedCornerShape(HomeDimens.BigPillRadius)) // Clip for ripple
                                .padding(HomeDimens.HeaderPillPadding),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = colors.subtleBackground,
                                modifier = Modifier.size(HomeDimens.AvatarSize)
                            ) {
                                val photoUrl = userProfile.photoURL
                                
                                // Local state for tracking first load progress
                                // (ViewModel state persists across navigation)
                                var isImageLoaded by remember { mutableStateOf(profileLoaderCompleted) }
                                
                                // Notify ViewModel when image load is complete
                                LaunchedEffect(isImageLoaded) {
                                    if (isImageLoaded && !profileLoaderCompleted) {
                                        onProfileLoaderCompleted()
                                    }
                                }

                                SubcomposeAsyncImage(
                                    model = photoUrl,
                                    contentDescription = "Profile",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                ) {
                                    val state = painter.state
                                    
                                    // Track when image loads
                                    LaunchedEffect(state) {
                                        if (state is AsyncImagePainter.State.Success) {
                                            isImageLoaded = true
                                        }
                                    }
                                    
                                    // Show loader ONLY on first load (before ViewModel state is set)
                                    // Once profileLoaderCompleted is true, never show loader again
                                    val showLoader = !profileLoaderCompleted && !isImageLoaded
                                    
                                    if (showLoader) {
                                        Box(contentAlignment = Alignment.Center) {
                                            // Loading Indicator
                                            ExpressiveDotsLoader(
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .padding(HomeDimens.LoaderPadding),
                                                color = colors.accent
                                            )
                                        }
                                    } else {
                                        SubcomposeAsyncImageContent()
                                    }
                                }
                            }
                            
                            Spacer(modifier = Modifier.width(HomeDimens.SpacingXl))
                            
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "Vanakkam!",
                                        style = HomeTypography.PillTitle.copy(fontSize = 20.sp, fontWeight = FontWeight.Bold),
                                        color = colors.textPrimary
                                    )
                                    Spacer(modifier = Modifier.width(HomeDimens.SpacingMd))
                                    Icon(
                                        imageVector = Icons.Filled.AutoAwesome,
                                        contentDescription = "Sparkle",
                                        tint = colors.accent,
                                        modifier = Modifier.size(HomeDimens.IconSizeMd)
                                    )
                                }
                                Text(
                                    text = userProfile.displayName,
                                    style = HomeTypography.StatusBadge.copy(fontSize = 14.sp),
                                    color = colors.textSecondary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    } else {
                        SkeletonProfileContent(colors)
                    }
                }
            }
        }
    }
}

@Composable
internal fun SkeletonProfileContent(colors: HomeColors) {
    val infiniteTransition = rememberInfiniteTransition(label = "skeleton")
    val alpha by infiniteTransition.animateFloat(
        initialValue = HomeAnimations.SkeletonPulse.InitialAlpha,
        targetValue = HomeAnimations.SkeletonPulse.TargetAlpha,
        animationSpec = HomeAnimations.SkeletonPulse.Spec,
        label = "alpha"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(HomeDimens.HeaderPillPadding),
        verticalAlignment = Alignment.CenterVertically
    ) {
            Box(
                modifier = Modifier
                    .size(HomeDimens.AvatarSize)
                    .clip(CircleShape)
                    .background(colors.textSecondary.copy(alpha = 0.2f * alpha))
            )
            
            Spacer(modifier = Modifier.width(HomeDimens.SpacingXl))
            
            Column(modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier
                        .size(width = HomeDimens.SkeletonTitleWidth, height = HomeDimens.SkeletonTitleHeight)
                        .clip(RoundedCornerShape(HomeDimens.SmallRadius))
                        .background(colors.textSecondary.copy(alpha = 0.2f * alpha))
                )
                
                Spacer(modifier = Modifier.height(HomeDimens.SpacingMd))
                
                Box(
                    modifier = Modifier
                        .size(width = HomeDimens.SkeletonSubtitleWidth, height = HomeDimens.SkeletonSubtitleHeight)
                        .clip(RoundedCornerShape(HomeDimens.SmallRadius))
                        .background(colors.textSecondary.copy(alpha = 0.15f * alpha))
                )
            }
        }
    }


/**
 * Date Section - Matches .date-section from mobileapp.css
 * Supports tap to open date picker and swipe left/right to change date
 */
@Composable
internal fun DateSection(
    formattedDate: String,
    colors: HomeColors,
    onClick: () -> Unit,
    onSwipeLeft: () -> Unit = {},
    onSwipeRight: () -> Unit = {}
) {
    val density = LocalDensity.current
    val swipeThreshold = with(density) { 50.dp.toPx() }
    
    // Use rememberUpdatedState to avoid stale closures in pointerInput(Unit)
    val currentSwipeLeft by rememberUpdatedState(onSwipeLeft)
    val currentSwipeRight by rememberUpdatedState(onSwipeRight)
    
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.DateSectionSpacing)
    ) {
        // Label
        Text(
            text = "Select date",
            style = HomeTypography.DateLabel,
            color = colors.textSecondary.copy(alpha = 0.8f),
            modifier = Modifier.padding(start = HomeDimens.SpacingLg)
        )
        
        // Date Input Group - matches .date-input-group
        // Button is a SEPARATE overlay on top of the pill for proper press behavior
        // Track swipe offset for visual feedback
        var offsetX by remember { mutableStateOf(0f) }
        val animatedOffset by animateFloatAsState(
            targetValue = offsetX,
            animationSpec = spring(dampingRatio = 0.6f, stiffness = 400f),
            label = "swipeOffset"
        )
        
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(HomeDimens.DatePillHeight)
        ) {
            // Layer 1: The pill background with date text
            Surface(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(HomeShapes.Pill)
                    .pointerInput(formattedDate) {
                        var totalDrag = 0f
                        detectHorizontalDragGestures(
                            onDragStart = { totalDrag = 0f },
                            onDragEnd = {
                                if (totalDrag < -swipeThreshold) {
                                    currentSwipeRight() // Swipe left = next day
                                } else if (totalDrag > swipeThreshold) {
                                    currentSwipeLeft() // Swipe right = previous day
                                }
                                offsetX = 0f
                            },
                            onDragCancel = {
                                offsetX = 0f
                            },
                            onHorizontalDrag = { _, dragAmount ->
                                totalDrag += dragAmount
                                // Limit visual feedback offset
                                offsetX = (totalDrag * 0.3f).coerceIn(-30f, 30f)
                            }
                        )
                    },
                shape = HomeShapes.Pill,
                color = colors.surface
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(start = HomeDimens.SpacingXxxl, end = HomeDimens.SpacingSm),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Text(
                        text = formattedDate,
                        style = HomeTypography.DateText,
                        color = colors.textPrimary,
                        modifier = Modifier.offset { androidx.compose.ui.unit.IntOffset(animatedOffset.toInt(), 0) }
                    )
                }
            }
            
            // Layer 2: Calendar button as SEPARATE overlay on top
            // "Physical" Button Feel: Scale + Elevation Drop (No Vibration)
            var isPressed by remember { mutableStateOf(false) }
            
            val scale by animateFloatAsState(
                targetValue = if (isPressed) 0.9f else 1f,
                animationSpec = if (isPressed) {
                   spring(dampingRatio = 0.55f, stiffness = 800f) // Fast, Snappy Press
                } else {
                   spring(dampingRatio = 0.6f, stiffness = 150f) // Slow, Smooth Release (Heavy feel)
                },
                label = "scale"
            )
            
            val elevation by animateDpAsState(
                targetValue = if (isPressed) 2.dp else 6.dp, 
                animationSpec = if (isPressed) {
                    tween(50) // Instant actuation
                } else {
                    tween(300, easing = FastOutSlowInEasing) // Smooth shadow return
                },
                label = "elevation"
            )

            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = HomeDimens.SpacingSm)
                    .size(HomeDimens.CalendarIconSize)
                    .scale(scale)
                    .shadow(elevation, CircleShape)
                    .background(colors.accent, CircleShape)
                    .clip(CircleShape)
                    .pointerInput(Unit) {
                        detectTapGestures(
                            onPress = {
                                isPressed = true
                                tryAwaitRelease()
                                isPressed = false
                            },
                            onTap = { onClick() }
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = CustomIcons.Calendar,
                    contentDescription = "Select date",
                    tint = Color.White,
                    modifier = Modifier.size(HomeDimens.IconSizeSm)
                )
            }
        }
    }
}

/**
 * Grouped Events Card - Single card container for all academic events
 */
@Composable
internal fun GroupedEventsCard(
    events: List<CalendarEvent>,
    colors: HomeColors
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = HomeShapes.Item,
        color = colors.surface
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            events.forEachIndexed { index, event ->
                // Color logic matching Web getEventClass (Home.jsx)
                // Priority: Exam → Order → Holiday → Occasion → Special → Default
                val titleLower = event.title.lowercase()
                val isExam = titleLower.contains("exam") || titleLower.contains("test") || 
                             titleLower.contains("sia") || titleLower.contains("fia")
                val isOrder = titleLower.contains("order")
                val isHoliday = event.isHoliday() // checks type == "Holiday" OR title contains "holiday"
                val isOccasion = event.isOccasion() // checks type == "Academic"
                val isSpecial = event.type == "FullDay" || event.type == "HalfDay" || event.isSection
                
                val barColor = when {
                    isExam -> colors.success             // Green
                    isOrder -> Color(0xFF00BCD4)         // Cyan for day order
                    isHoliday -> colors.holiday          // Purple
                    isOccasion -> SpecialYellow           // Yellow for Academic/Occasion
                    isSpecial -> SpecialYellow            // Yellow for FullDay/HalfDay
                    else -> colors.accent                 // Blue (default)
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = HomeDimens.CardPaddingHorizontal, vertical = HomeDimens.CardPaddingVertical),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Colored indicator bar
                    Box(
                        modifier = Modifier
                            .width(HomeDimens.PillIndicatorWidth)
                            .height(HomeDimens.PillIndicatorHeight)
                            .clip(RoundedCornerShape(HomeDimens.SmallRadius))
                            .background(barColor)
                    )
                    
                    Spacer(modifier = Modifier.width(HomeDimens.SpacingXl))
                    
                    Column {
                        Text(
                            text = event.title,
                            style = HomeTypography.PillTitle,
                            color = colors.textPrimary
                        )
                        Spacer(modifier = Modifier.height(HomeDimens.SpacingXs))
                        Text(
                            text = event.getTimeRangeDisplay(),
                            style = HomeTypography.PillTime,
                            color = colors.textSecondary
                        )
                    }
                }
                
                // Divider between items (not after last item)
                if (index < events.lastIndex) {
                    HorizontalDivider(
                        modifier = Modifier.padding(horizontal = HomeDimens.CardPaddingHorizontal),
                        color = colors.textSecondary.copy(alpha = 0.1f)
                    )
                }
            }
        }
    }
}

/**
 * Schedule Section - Matches .timetable-section from mobileapp.css
 */
@Composable
internal fun ScheduleSection(
    scheduleState: ScheduleState,
    masterData: MasterData,
    isLoading: Boolean,
    colors: HomeColors
) {
    Column {
        // Header Row with Title and Status Badge
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = HomeDimens.SpacingSm),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Schedule",
                style = HomeTypography.SectionTitle,
                color = colors.textPrimary
            )
            
            // Status Badge - matches .status-badge-small
            val isHoliday = scheduleState.scheduleStatus.contains("Holiday", ignoreCase = true)
            val badgeText = if (isHoliday) "HOLIDAY" else scheduleState.scheduleStatus.uppercase()
            
            Surface(
                shape = HomeShapes.StatusBadge,
                color = colors.surface
            ) {
                Box(
                    modifier = Modifier.padding(
                        horizontal = HomeDimens.StatusBadgePaddingH,
                        vertical = HomeDimens.StatusBadgePaddingV
                    )
                ) {
                    Text(
                        text = badgeText,
                        style = HomeTypography.StatusBadge,
                        color = colors.textSecondary
                    )
                }
            }
        }
        
        // Use Shared Logic for robust display (matches ScheduleScreen)
        val config = ScheduleLogic.calculateDisplayConfig(scheduleState)

        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(HomeDimens.SkeletonHeight)
                    .clip(HomeShapes.Item)
                    .background(colors.surface),
                contentAlignment = Alignment.Center
            ) {
                com.elvan.rmdneram.ui.components.ExpressiveDotsLoader(
                    modifier = Modifier.width(48.dp),
                    color = colors.textSecondary
                )
            }
        } else {
            var hasContent = false
            
            // 0. Special Class
            if (config.showSpecialClass && scheduleState.todaySpecialClasses.isNotEmpty()) {
                scheduleState.todaySpecialClasses.forEach { sc ->
                    hasContent = true
                    SpecialClassMiniCard(
                        specialClass = sc,
                        colors = colors
                    )
                }
            }
            
            // A. Show Exam
            if (config.showExamCard) {
                val activeExam = scheduleState.activeExamPeriod
                val todayExams = scheduleState.todayExams
                val todayBatches = scheduleState.todayBatches
                
                if (activeExam != null) {
                    if (todayExams.isNotEmpty()) {
                        todayExams.forEach { sub ->
                            hasContent = true
                            ExamCard(
                                exam = activeExam,
                                subject = sub,
                                courses = masterData.courses,
                                colors = colors
                            )
                        }
                    } else if (todayBatches.isNotEmpty()) {
                        hasContent = true
                        PracticalExamMiniCard(
                            exam = activeExam,
                            batchGroups = todayBatches,
                            colors = colors
                        )
                    }
                }
            }

            // B. Full Day Event
            if (config.showFullDayEvent) {
                scheduleState.fullDayEvents.forEach { event ->
                    hasContent = true
                    FullDayEventCard(event = event, colors = colors)
                }
            }
            
            // C. Show Half Day (if applicable)
            if (config.showHalfDayEvent) {
                scheduleState.halfDayEvents.forEach { event ->
                    hasContent = true
                    HalfDayEventCard(event = event, colors = colors)
                }
            }
            
            // D. Show Timetable
            if (config.showTimetable) {
                hasContent = true
                TimetableCard(periods = scheduleState.periods, colors = colors)
            }
            
            // E. Show Suspension Notice
            if (config.showSuspensionNotice) {
                hasContent = true
                ClassesSuspendedNotice(
                    title = "Classes Suspended",
                    subtitle = config.suspensionReason,
                    colors = colors
                )
            }
            
            // F. Empty State (If nothing shown above)
            if (!hasContent) {
                val displayStatus = if (scheduleState.scheduleStatus.contains("Holiday", ignoreCase = true)) {
                    "Holiday"
                } else {
                    scheduleState.scheduleStatus
                }
                
                NoClassesCard(
                    status = displayStatus,
                    colors = colors
                )
            }
        }
    }
}

/**
 * Full Day Event Card - Matches .exam-mini-card.major
 */
@Composable
internal fun FullDayEventCard(
    event: CalendarEvent,
    colors: HomeColors
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = HomeDimens.SpacingXl),
        shape = HomeShapes.Card,
        colors = CardDefaults.cardColors(containerColor = colors.accent)
    ) {
        Column(modifier = Modifier.padding(HomeDimens.SpacingXxxl)) {
            Text(
                text = "TODAY'S EVENT",
                style = HomeTypography.ExamTag,
                color = Color.White.copy(alpha = 0.8f)
            )
            
            Spacer(modifier = Modifier.height(HomeDimens.SpacingLg))
            
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingXl)
            ) {
                Icon(
                    imageVector = Icons.Default.DateRange,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.9f),
                    modifier = Modifier.size(HomeDimens.IconSizeXl)
                )
                
                Column {
                    Text(
                        text = event.title,
                        style = HomeTypography.ExamTitle,
                        color = Color.White
                    )
                    Text(
                        text = event.description ?: "Full Day Event",
                        style = HomeTypography.ExamSubtitle,
                        color = Color.White.copy(alpha = 0.9f)
                    )
                    
                    Spacer(modifier = Modifier.height(HomeDimens.SpacingLg))
                    
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingSm),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        MetaChip(
                            icon = Icons.Outlined.Schedule,
                            text = "Full Day",
                            colors = colors
                        )
                        MetaChip(
                            icon = Icons.Outlined.Info,
                            text = "No Classes",
                            colors = colors
                        )
                    }
                }
            }
        }
    }
}

/**
 * Half Day Event Card
 */
@Composable
internal fun HalfDayEventCard(
    event: CalendarEvent,
    colors: HomeColors
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = HomeDimens.SpacingXl),
        shape = HomeShapes.Card,
        colors = CardDefaults.cardColors(containerColor = colors.accent)
    ) {
        Column(modifier = Modifier.padding(HomeDimens.SpacingXxxl)) {
            Text(
                text = "SPECIAL EVENT",
                style = HomeTypography.ExamTag,
                color = Color.White.copy(alpha = 0.8f)
            )
            
            Spacer(modifier = Modifier.height(HomeDimens.SpacingLg))
            
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingXl)
            ) {
                Icon(
                    imageVector = Icons.Default.DateRange,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.9f),
                    modifier = Modifier.size(HomeDimens.IconSizeXl)
                )
                
                Column {
                    Text(
                        text = event.title,
                        style = HomeTypography.ExamTitle,
                        color = Color.White
                    )
                    Text(
                        text = event.description ?: "Special Session",
                        style = HomeTypography.ExamSubtitle,
                        color = Color.White.copy(alpha = 0.9f)
                    )
                    
                    if (event.type != "Event") {
                        Spacer(modifier = Modifier.height(HomeDimens.SpacingLg))
                        
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingSm),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val time = "${DateTimeUtils.formatTimeForDisplay(event.startTime ?: "09:00")} - ${DateTimeUtils.formatTimeForDisplay(event.endTime ?: "12:00")}"
                            MetaChip(
                                icon = Icons.Outlined.Schedule,
                                text = time,
                                colors = colors
                            )
                            MetaChip(
                                icon = Icons.Outlined.Info,
                                text = "Event",
                                colors = colors
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Exam Card - Matches .exam-mini-card
 */
@Composable
internal fun ExamCard(
    exam: ExamSchedule,
    subject: ExamSubject,
    courses: List<Course>,
    colors: HomeColors
) {
    val rawName = courses.find { it.code == subject.code }?.name ?: subject.code
    
    // 1. Remove anything in parentheses
    var cleanName = rawName.replace(Regex("\\s*\\(.*?\\)"), "").trim()
    
    // 2. Remove other common redundant terms
    val patterns = listOf(
        "\\s*Lab Integrated",
        "\\s*Integrated Lab",
        "\\s*Integrated",
        "\\s*Lab"
    )
    
    patterns.forEach { pattern ->
        cleanName = cleanName.replace(Regex(pattern, RegexOption.IGNORE_CASE), "").trim()
    }
    val courseName = cleanName.trimEnd('-', ' ', '/')
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = HomeDimens.SpacingXl),
        shape = HomeShapes.Card,
        colors = CardDefaults.cardColors(containerColor = colors.accent)
    ) {
        Column(modifier = Modifier.padding(HomeDimens.SpacingXxxl)) {
            Text(
                text = "TODAY'S EXAM",
                style = HomeTypography.ExamTag,
                color = Color.White.copy(alpha = 0.8f)
            )
            
            Spacer(modifier = Modifier.height(HomeDimens.SpacingLg))
            
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingXl)
            ) {
                Icon(
                    imageVector = Icons.Default.EmojiEvents,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.9f),
                    modifier = Modifier
                        .size(HomeDimens.IconSizeXxl)
                        .padding(top = HomeDimens.SpacingXxxs)
                )
                
                Column {
                    Text(
                        text = exam.title,
                        style = HomeTypography.ExamTitle,
                        color = Color.White
                    )
                    Text(
                        text = "${subject.code}: $courseName",
                        style = HomeTypography.ExamSubtitle,
                        color = Color.White.copy(alpha = 0.9f)
                    )
                    
                    Spacer(modifier = Modifier.height(HomeDimens.SpacingLg))
                    
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingSm),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        MetaChip(
                            icon = Icons.Outlined.Schedule,
                            text = "${DateTimeUtils.formatTimeForDisplay(subject.startTime)} - ${DateTimeUtils.formatTimeForDisplay(subject.endTime)}",
                            colors = colors
                        )
                        if (subject.portion.isNotEmpty()) {
                            MetaChip(
                                icon = Icons.Outlined.Info,
                                text = subject.portion,
                                colors = colors
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Practical Exam Mini Card - Matches web Dashboard practical exam layout
 */
@Composable
internal fun PracticalExamMiniCard(
    exam: ExamSchedule,
    batchGroups: List<TodayBatchGroup>,
    colors: HomeColors
) {
    Column(
        modifier = Modifier.padding(bottom = HomeDimens.SpacingXl),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SpacingXl)
    ) {
        batchGroups.forEach { group ->
            // Blue header card - matching standard ExamCard style
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = HomeDimens.SpacingSm),
                shape = HomeShapes.Card,
                colors = CardDefaults.cardColors(containerColor = colors.accent)
            ) {
                Column(modifier = Modifier.padding(HomeDimens.SpacingXxxl)) {
                    Text(
                        text = "TODAY'S PRACTICAL EXAM",
                        style = HomeTypography.ExamTag,
                        color = Color.White.copy(alpha = 0.8f)
                    )
                    
                    Spacer(modifier = Modifier.height(HomeDimens.SpacingLg))
                    
                    Row(
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingXl)
                    ) {
                        Icon(
                            imageVector = Icons.Default.EmojiEvents,
                            contentDescription = null,
                            tint = Color.White.copy(alpha = 0.9f),
                            modifier = Modifier
                                .size(HomeDimens.IconSizeXxl)
                                .padding(top = HomeDimens.SpacingXxxs)
                        )
                        
                        Column {
                            Text(
                                text = exam.title,
                                style = HomeTypography.ExamTitle,
                                color = Color.White
                            )
                            Text(
                                text = "${group.code}: ${group.subjectName}",
                                style = HomeTypography.ExamSubtitle,
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                    }
                }
            }

            // Timetable Card for the individual batches
            val batchPeriods = group.batches.mapIndexed { index, batch ->
                val timeStr = "${DateTimeUtils.formatTimeForDisplay(batch.startTime)} - ${DateTimeUtils.formatTimeForDisplay(batch.endTime)}"
                val facultyInfo = buildString {
                    if (batch.totalCount.isNotEmpty()) append("${batch.totalCount} Students")
                    if (batch.totalCount.isNotEmpty() && group.code.isNotEmpty()) append(" • ")
                    if (group.code.isNotEmpty()) append(group.code)
                }
                PeriodDisplayData(
                    number = index + 1,
                    time = "",
                    entries = listOf(
                        PeriodSubEntry(
                            code = timeStr,
                            name = batch.registerRange,
                            faculty = facultyInfo
                        )
                    ),
                    isLab = false // We don't need the generic LAB badge here since we use the circle letter
                )
            }

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(HomeDimens.SpacingLg)
            ) {
                batchPeriods.forEachIndexed { index, period ->
                    val batchInitial = group.batches.getOrNull(index)?.label?.takeIf { it.isNotEmpty() } 
                        ?: (65 + index).toChar().toString() // A, B, C... fallback
                        
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(HomeDimens.TimetableRowRadius),
                        color = colors.surface
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = HomeDimens.TimetableRowPaddingH, vertical = HomeDimens.TimetableRowPaddingV),
                            verticalAlignment = Alignment.Top
                        ) {
                            // Circle Label
                            Surface(
                                modifier = Modifier.size(HomeDimens.IconSizeLg),
                                shape = CircleShape,
                                color = colors.accent
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = batchInitial,
                                        style = HomeTypography.CellHour,
                                        color = Color.White,
                                        fontWeight = FontWeight.ExtraBold,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.width(HomeDimens.Spacing10))
                        
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(HomeDimens.Spacing10)) {
                                period.entries.forEach { entry ->
                                    Column {
                                        Text(
                                            text = entry.code,
                                            style = HomeTypography.CourseCode,
                                            color = colors.accent
                                        )
                                        
                                        if (entry.name.isNotEmpty()) {
                                            Spacer(modifier = Modifier.height(HomeDimens.SpacingXxxs))
                                            Text(
                                                text = entry.name,
                                                style = HomeTypography.CourseName,
                                                color = colors.textPrimary
                                            )
                                        }
                                        
                                        if (entry.faculty.isNotEmpty()) {
                                            Spacer(modifier = Modifier.height(HomeDimens.SpacingXxxs))
                                            Text(
                                                text = entry.faculty,
                                                style = HomeTypography.FacultyName,
                                                color = colors.textSecondary
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
}

/**
 * Meta Chip for exam cards
 */
@Composable
internal fun MetaChip(
    icon: ImageVector,
    text: String,
    colors: HomeColors
) {
    Row(
        modifier = Modifier
            .clip(HomeShapes.MetaItem)
            .background(Color.White.copy(alpha = 0.2f))
            .padding(horizontal = HomeDimens.MetaChipPaddingH, vertical = HomeDimens.MetaChipPaddingV),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingXs)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = Color.White,
            modifier = Modifier.size(HomeDimens.IconSizeXs)
        )
        Text(
            text = text,
            style = HomeTypography.ExamMeta.copy(fontSize = 10.sp),
            color = Color.White,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

/**
 * Timetable Card - Apple-style 2-column layout
 */
@Composable
internal fun TimetableCard(
    periods: List<PeriodDisplayData>,
    colors: HomeColors
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = HomeDimens.SpacingLg),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SpacingLg)
    ) {
        periods.forEachIndexed { index, period ->
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(HomeDimens.TimetableRowRadius),
                color = colors.surface
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = HomeDimens.TimetableRowPaddingH, vertical = HomeDimens.TimetableRowPaddingV),
                    verticalAlignment = Alignment.Top
                ) {
                    // Period Number - Filled Circle
                    Surface(
                        modifier = Modifier.size(HomeDimens.IconSizeLg),
                        shape = CircleShape,
                        color = colors.accent
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = "${period.number}",
                                style = HomeTypography.CellHour,
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.width(HomeDimens.Spacing10))
                
                // Course Details - Grouped by Entry
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(HomeDimens.Spacing10)) {
                    period.entries.forEachIndexed { entryIndex, entry ->
                        Column {
                            // Course Code + Lab Marking
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = entry.code,
                                    style = HomeTypography.CourseCode,
                                    color = colors.accent
                                )
                                
                                if (period.isLab) {
                                    Spacer(modifier = Modifier.width(HomeDimens.SpacingSm))
                                    Surface(
                                        color = colors.accent.copy(alpha = 0.15f),
                                        shape = HomeShapes.Pill
                                    ) {
                                        Text(
                                            text = "LAB",
                                            style = HomeTypography.FacultyName.copy(
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                letterSpacing = 0.5.sp
                                            ),
                                            color = colors.accent,
                                            modifier = Modifier.padding(horizontal = HomeDimens.SpacingXs, vertical = HomeDimens.SpacingXxxs)
                                        )
                                    }
                                }
                            }
                            
                            if (entry.name.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(HomeDimens.SpacingXxxs))
                                Text(
                                    text = entry.name,
                                    style = HomeTypography.CourseName,
                                    color = colors.textPrimary
                                )
                            }

                            if (entry.faculty.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(HomeDimens.SpacingXs))
                                Text(
                                    text = entry.faculty,
                                    style = HomeTypography.StatusBadge,
                                    color = colors.textSecondary.copy(alpha = 0.8f)
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

/**
 * Empty Event Card - Used when no academic events are present today
 */
@Composable
internal fun EmptyEventCard(
    message: String,
    colors: HomeColors
) {
    Surface(
        modifier = Modifier.fillMaxWidth().padding(bottom = HomeDimens.SpacingSm),
        shape = HomeShapes.Item,
        color = colors.surface
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = HomeDimens.CardPaddingHorizontal, vertical = HomeDimens.CardPaddingVertical),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Adaptive "White-like" indicator bar for empty state
            Box(
                modifier = Modifier
                    .width(HomeDimens.PillIndicatorWidth)
                    .height(HomeDimens.PillIndicatorHeight)
                    .clip(RoundedCornerShape(HomeDimens.SmallRadius))
                    .background(colors.textSecondary.copy(alpha = 0.2f))
            )
            
            Spacer(modifier = Modifier.width(HomeDimens.SpacingXl))
            
            Text(
                text = message,
                style = HomeTypography.PillTitle,
                color = colors.textSecondary
            )
        }
    }
}

/**
 * No Classes Card - Matches .no-classes-msg
 */
@Composable
internal fun NoClassesCard(
    status: String,
    colors: HomeColors
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = HomeShapes.Item,
        color = colors.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = HomeDimens.NoClassesPaddingV, horizontal = HomeDimens.NoClassesPaddingH),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "No classes scheduled.",
                style = HomeTypography.NoClassesTitle,
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .clip(HomeShapes.MetaItem)
                    .background(colors.subtleBackground)
                    .padding(horizontal = 12.dp, vertical = 4.dp)
            ) {
                Text(
                    text = status,
                    style = HomeTypography.PillTime,
                    color = colors.textSecondary
                )
            }
        }
    }
}

/**
 * Classes Suspended Notice - Matches .major-exam-notice
 */
@Composable
internal fun ClassesSuspendedNotice(
    title: String,
    subtitle: String,
    colors: HomeColors
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = HomeShapes.Item,
        color = colors.surface
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(colors.accent.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Outlined.Info,
                    contentDescription = null,
                    tint = colors.accent,
                    modifier = Modifier.size(24.dp)
                )
            }
            
            Column {
                Text(
                    text = title,
                    style = HomeTypography.NoClassesTitle,
                    color = colors.textPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = subtitle,
                    style = HomeTypography.PillTime,
                    color = colors.textSecondary,
                    lineHeight = 20.sp
                )
            }
        }
    }
}

/**
 * Updates Section - Matches .updates-live-section
 */
@Composable
internal fun UpdatesSection(
    sectionName: String,
    content: String,
    rawContent: String,
    author: String,
    canEdit: Boolean,
    isSaving: Boolean,
    isLoading: Boolean,
    isOffline: Boolean,
    colors: HomeColors,
    onSave: (String) -> Unit
) {
    com.elvan.rmdneram.ui.home.components.EditableSection(
        title = "Live Updates ($sectionName)",
        content = content,
        rawContent = rawContent,
        author = author,
        emptyText = "No updates for this date.",
        canEdit = canEdit,
        accentColor = colors.accent,
        isSaving = isSaving,
        isLoading = isLoading,
        isOffline = isOffline,
        colors = colors,
        onSave = onSave
    )
}

/**
 * General Notice Section - Matches .updates-general-section
 */
@Composable
internal fun GeneralNoticeSection(
    content: String,
    author: String,
    canEdit: Boolean,
    isSaving: Boolean,
    isLoading: Boolean,
    isOffline: Boolean,
    colors: HomeColors,
    onSave: (String) -> Unit
) {
    EditableSection(
        title = "General Notice",
        content = content.ifEmpty { "No general notices." },
        author = author,
        emptyText = "No general notices.",
        canEdit = canEdit,
        accentColor = colors.success,
        isSaving = isSaving,
        isLoading = isLoading,
        isOffline = isOffline,
        colors = colors,
        onSave = onSave
    )
}

/**
 * Academic Details Grid - Matches .info-grid-small
 */
@Composable
internal fun AcademicDetailsGrid(
    userProfile: UserProfile?,
    colors: HomeColors
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        InfoItem(
            label = "Batch",
            value = userProfile?.batch ?: "-",
            colors = colors,
            modifier = Modifier.weight(1f)
        )
        InfoItem(
            label = "Dept",
            value = userProfile?.department ?: "-",
            colors = colors,
            modifier = Modifier.weight(1f)
        )
        InfoItem(
            label = "Sec",
            value = userProfile?.section ?: "-",
            colors = colors,
            modifier = Modifier.weight(1f)
        )
    }
}

/**
 * Info Item - Matches .info-item
 */
@Composable
internal fun InfoItem(
    label: String,
    value: String,
    colors: HomeColors,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = HomeShapes.SmallChip,
        color = colors.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label.uppercase(),
                style = HomeTypography.InfoLabel,
                color = colors.textSecondary.copy(alpha = 0.7f)
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                style = HomeTypography.InfoValue,
                color = colors.textPrimary
            )
        }
    }
}

/**
 * Remember status bar height for layout calculations
 */
@Composable
fun rememberStatusBarHeight(): Dp {
    val context = LocalContext.current
    val density = LocalDensity.current
    return remember(context) {
        val resourceId = context.resources.getIdentifier("status_bar_height", "dimen", "android")
        if (resourceId > 0) {
            with(density) { context.resources.getDimensionPixelSize(resourceId).toDp() }
        } else {
            24.dp // Fallback
        }
    }
}



@Composable
internal fun SpecialClassMiniCard(
    specialClass: SpecialClass,
    colors: HomeColors
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = HomeDimens.SpacingXl),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SpacingXl)
    ) {
        // 1. Blue header card - matching standard ExamCard style
        Card(
            modifier = Modifier.fillMaxWidth().padding(bottom = HomeDimens.SpacingSm),
            shape = HomeShapes.Card,
            colors = CardDefaults.cardColors(containerColor = colors.accent)
        ) {
            Column(modifier = Modifier.padding(HomeDimens.SpacingXxxl)) {
                Text(
                    text = specialClass.typeTitle.uppercase(),
                    style = HomeTypography.ExamTag,
                    color = Color.White.copy(alpha = 0.8f)
                )
                
                Spacer(modifier = Modifier.height(HomeDimens.SpacingLg))
                
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingXl)
                ) {
                    Icon(
                        imageVector = Icons.Default.Computer,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.9f),
                        modifier = Modifier
                            .size(HomeDimens.IconSizeXxl)
                            .padding(top = HomeDimens.SpacingXxxs)
                    )
                    
                    Column {
                        Text(
                            text = if (specialClass.title.isNotEmpty()) specialClass.title else "Scheduled for Today",
                            style = HomeTypography.ExamTitle,
                            color = Color.White
                        )
                        Text(
                            text = if (specialClass.desc.isNotEmpty()) specialClass.desc else "Special classroom session or online meeting",
                            style = HomeTypography.ExamSubtitle,
                            color = Color.White.copy(alpha = 0.9f)
                        )
                    }
                }
            }
        }

        // 2. Timetable Cards for individual batches using exact Practical row styling
        if (specialClass.batches.isNotEmpty()) {
            val batchPeriods = specialClass.batches.mapIndexed { index, batch ->
                val timeStr = "${DateTimeUtils.formatTimeForDisplay(batch.startTime)} - ${DateTimeUtils.formatTimeForDisplay(batch.endTime)}"
                val facultyInfo = buildString {
                    if (batch.faculty.isNotEmpty()) append(batch.faculty)
                    if (batch.faculty.isNotEmpty() && batch.subjectCode.isNotEmpty()) append(" • ")
                    if (batch.subjectCode.isNotEmpty()) append(batch.subjectCode)
                }
                PeriodDisplayData(
                    number = index + 1,
                    time = "",
                    entries = listOf(
                        PeriodSubEntry(
                            code = timeStr,
                            name = batch.subjectName,
                            faculty = facultyInfo
                        )
                    ),
                    isLab = false
                )
            }

            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(HomeDimens.SpacingLg)
            ) {
                batchPeriods.forEachIndexed { index, period ->
                    val batchInitial = specialClass.batches.getOrNull(index)?.circleLabel?.takeIf { it.isNotEmpty() } 
                        ?: (index + 1).toString()
                        
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(HomeDimens.TimetableRowRadius),
                        color = colors.surface
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = HomeDimens.TimetableRowPaddingH, vertical = HomeDimens.TimetableRowPaddingV),
                            verticalAlignment = Alignment.Top
                        ) {
                            // Circle Label
                            Surface(
                                modifier = Modifier.size(HomeDimens.IconSizeLg),
                                shape = CircleShape,
                                color = colors.accent
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = batchInitial,
                                        style = HomeTypography.CellHour,
                                        color = Color.White,
                                        fontWeight = FontWeight.ExtraBold,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.width(HomeDimens.Spacing10))
                        
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(HomeDimens.Spacing10)) {
                                period.entries.forEach { entry ->
                                    Column {
                                        Text(
                                            text = entry.code,
                                            style = HomeTypography.CourseCode,
                                            color = colors.accent
                                        )
                                        
                                        if (entry.name.isNotEmpty()) {
                                            Spacer(modifier = Modifier.height(HomeDimens.SpacingXxxs))
                                            Text(
                                                text = entry.name,
                                                style = HomeTypography.CourseName,
                                                color = colors.textPrimary
                                            )
                                        }
                                        
                                        if (entry.faculty.isNotEmpty()) {
                                            Spacer(modifier = Modifier.height(HomeDimens.SpacingXxxs))
                                            Text(
                                                text = entry.faculty,
                                                style = HomeTypography.FacultyName,
                                                color = colors.textSecondary
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
}

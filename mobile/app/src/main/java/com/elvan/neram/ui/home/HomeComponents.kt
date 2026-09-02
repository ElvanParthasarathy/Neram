package com.elvan.neram.ui.home

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
import androidx.compose.material.icons.automirrored.outlined.MenuBook
import androidx.compose.material.icons.filled.EventBusy
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.runtime.*
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
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
import com.elvan.neram.data.model.*
import com.elvan.neram.ui.common.ScheduleLogic
import com.elvan.neram.ui.home.components.EditableSection
import com.elvan.neram.ui.components.ExpressiveLoadingIndicator
import com.elvan.neram.ui.components.ExpressiveDotsLoader
import com.elvan.neram.ui.navigation.CustomIcons
import com.elvan.neram.ui.theme.AppStrings
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.trWithLang
import com.elvan.neram.utils.DateTimeUtils
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
                            val lang = LocalAppLanguage.current
                            val tamilFont = LocalAppFontFamily.current
                            Text(
                                text = AppStrings.Home.welcomeToNeram(lang),
                                style = HomeTypography.PillTitle.copy(fontSize = 20.sp, fontWeight = FontWeight.Bold, fontFamily = tamilFont),
                                color = colors.textPrimary
                            )
                            Text(
                                text = AppStrings.Home.gladYouAreHere(lang),
                                style = HomeTypography.StatusBadge.copy(fontSize = 14.sp, fontFamily = tamilFont),
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
                        val profileRippleColor = if (colors.isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f)

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(HomeDimens.BigPillRadius))
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = ripple(color = profileRippleColor, bounded = true),
                                    onClick = onProfileClick
                                )
                                .padding(HomeDimens.HeaderPillPadding),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = colors.subtleBackground,
                                modifier = Modifier.size(HomeDimens.AvatarSize)
                            ) {
                                val photoUrl = userProfile.photoURL
                                val isPhotoBlank = photoUrl.isNullOrBlank()
                                
                                // If no photo, complete loader immediately
                                var isImageLoaded by remember(photoUrl) { 
                                    mutableStateOf(profileLoaderCompleted || isPhotoBlank) 
                                }
                                
                                LaunchedEffect(photoUrl) {
                                    if (isPhotoBlank && !profileLoaderCompleted) {
                                        onProfileLoaderCompleted()
                                    }
                                }
                                
                                // Notify ViewModel when image load is complete
                                LaunchedEffect(isImageLoaded) {
                                    if (isImageLoaded && !profileLoaderCompleted) {
                                        onProfileLoaderCompleted()
                                    }
                                }

                                if (isPhotoBlank) {
                                    Box(
                                        contentAlignment = Alignment.Center,
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(colors.accent.copy(alpha = 0.15f))
                                    ) {
                                        Text(
                                            text = userProfile.displayName.trim().takeIf { it.isNotEmpty() }?.take(1)?.uppercase() ?: "U",
                                            style = HomeTypography.PillTitle.copy(
                                                fontSize = 20.sp,
                                                fontWeight = FontWeight.Bold
                                            ),
                                            color = colors.accent
                                        )
                                    }
                                } else {
                                    SubcomposeAsyncImage(
                                        model = photoUrl,
                                        contentDescription = K.profile.tr(LocalAppLanguage.current),
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    ) {
                                        val state = painter.state
                                        
                                        // Track when image loads or fails
                                        LaunchedEffect(state) {
                                            if (state is AsyncImagePainter.State.Success || state is AsyncImagePainter.State.Error) {
                                                isImageLoaded = true
                                            }
                                        }
                                        
                                        // Show loader ONLY on first load (before ViewModel state is set)
                                        val showLoader = !profileLoaderCompleted && !isImageLoaded
                                        
                                        when {
                                            showLoader -> {
                                                Box(contentAlignment = Alignment.Center) {
                                                    ExpressiveDotsLoader(
                                                        modifier = Modifier
                                                            .fillMaxSize()
                                                            .padding(HomeDimens.LoaderPadding),
                                                        color = colors.accent
                                                    )
                                                }
                                            }
                                            state is AsyncImagePainter.State.Error -> {
                                                Box(
                                                    contentAlignment = Alignment.Center,
                                                    modifier = Modifier
                                                        .fillMaxSize()
                                                        .background(colors.accent.copy(alpha = 0.15f))
                                                ) {
                                                    Text(
                                                        text = userProfile.displayName.trim().takeIf { it.isNotEmpty() }?.take(1)?.uppercase() ?: "U",
                                                        style = HomeTypography.PillTitle.copy(
                                                            fontSize = 20.sp,
                                                            fontWeight = FontWeight.Bold
                                                        ),
                                                        color = colors.accent
                                                    )
                                                }
                                            }
                                            else -> {
                                                SubcomposeAsyncImageContent()
                                            }
                                        }
                                    }
                                }
                            }
                            
                            Spacer(modifier = Modifier.width(HomeDimens.SpacingXl))
                            
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    val lang = LocalAppLanguage.current
                                    Text(
                                        text = AppStrings.Home.vanakkam(lang),
                                        style = HomeTypography.PillTitle.copy(fontSize = 20.sp, fontWeight = FontWeight.Bold),
                                        color = colors.textPrimary
                                    )
                                    Spacer(modifier = Modifier.width(HomeDimens.SpacingMd))
                                    Icon(
                                        imageVector = Icons.Filled.AutoAwesome,
                                        contentDescription = null,
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
        val lang = LocalAppLanguage.current
        Text(
            text = AppStrings.Home.selectDate(lang),
            style = HomeTypography.DateLabel.copy(fontFamily = LocalAppFontFamily.current),
            color = colors.textSecondary.copy(alpha = 0.8f),
            modifier = Modifier.padding(start = HomeDimens.SpacingXxxl)
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
                .offset { androidx.compose.ui.unit.IntOffset(animatedOffset.toInt(), 0) }
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
                                offsetX = (totalDrag * 0.35f).coerceIn(-40f, 40f)
                            }
                        )
                    },
                shape = HomeShapes.Pill,
                color = colors.surface
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(start = HomeDimens.SpacingXxxl, end = 56.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    val ff = LocalAppFontFamily.current
                    
                    val targetFontSize = when {
                        formattedDate.length >= 24 -> 13.8f
                        formattedDate.length >= 20 -> 14.8f
                        formattedDate.length >= 17 -> 15.6f
                        formattedDate.length >= 14 -> 16.3f
                        else -> 17f
                    }
                    
                    val animatedFontSize by animateFloatAsState(
                        targetValue = targetFontSize,
                        animationSpec = tween(durationMillis = 260, easing = FastOutSlowInEasing),
                        label = "dateFontSize"
                    )

                    AnimatedContent(
                        targetState = formattedDate,
                        transitionSpec = {
                            fadeIn(animationSpec = tween(200, easing = FastOutSlowInEasing)) togetherWith
                                fadeOut(animationSpec = tween(120, easing = LinearOutSlowInEasing))
                        },
                        label = "dateTextTransition"
                    ) { targetDate ->
                        Text(
                            text = targetDate,
                            style = HomeTypography.DateText.copy(
                                fontFamily = ff,
                                fontSize = animatedFontSize.sp
                            ),
                            maxLines = 1,
                            softWrap = false,
                            overflow = TextOverflow.Ellipsis,
                            color = colors.textPrimary
                        )
                    }
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
                targetValue = if (isPressed) 0.5.dp else 2.5.dp, 
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
                    .shadow(
                        elevation = if (colors.isDark) 0.dp else elevation,
                        shape = CircleShape,
                        spotColor = colors.accent.copy(alpha = 0.25f),
                        ambientColor = Color.Black.copy(alpha = 0.05f)
                    )
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
                    contentDescription = K.selectDate.tr(LocalAppLanguage.current),
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
    val lang = LocalAppLanguage.current
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
                            text = event.getTimeRangeDisplay(lang),
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
        val lang = LocalAppLanguage.current
        // Header Row with Title and Status Badge
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = HomeDimens.SectionTitleBottomPadding),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = AppStrings.Home.schedule(lang),
                style = HomeTypography.DateLabel.copy(fontFamily = LocalAppFontFamily.current),
                color = colors.textSecondary.copy(alpha = 0.8f),
                modifier = Modifier.padding(start = HomeDimens.SpacingXxxl)
            )
            
            // Status Badge - matches .status-badge-small
            val isHoliday = scheduleState.scheduleStatus.contains("Holiday", ignoreCase = true) ||
                            scheduleState.scheduleStatus.contains("விடுமுறை", ignoreCase = true) ||
                            scheduleState.scheduleStatus.contains("Vidumurai", ignoreCase = true)
            val badgeText = if (isHoliday) K.holiday.tr(lang) else scheduleState.scheduleStatus
            
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
        val config = ScheduleLogic.calculateDisplayConfig(scheduleState, lang)

        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(HomeDimens.SkeletonHeight)
                    .clip(HomeShapes.Item)
                    .background(colors.surface),
                contentAlignment = Alignment.Center
            ) {
                com.elvan.neram.ui.components.ExpressiveDotsLoader(
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
                    title = AppStrings.Home.classesSuspended(lang),
                    subtitle = config.suspensionReason,
                    colors = colors
                )
            }
            
            // F. Empty State (If nothing shown above)
            if (!hasContent) {
                val isHoliday = scheduleState.scheduleStatus.contains("Holiday", ignoreCase = true) ||
                                scheduleState.scheduleStatus.contains("விடுமுறை", ignoreCase = true) ||
                                scheduleState.scheduleStatus.contains("Vidumurai", ignoreCase = true)
                val displayStatus = if (isHoliday) {
                    K.holiday.tr(lang)
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
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val cardBg = colors.accent
    val pillBg = Color.White.copy(alpha = 0.2f)

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = HomeDimens.SpacingLg),
        shape = RoundedCornerShape(24.dp),
        color = cardBg,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Icon(
                imageVector = Icons.Default.DateRange,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(30.dp)
            )

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = event.title,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        lineHeight = 22.sp
                    ),
                    color = Color.White,
                    softWrap = true
                )

                val desc = event.description ?: AppStrings.Home.noClasses(lang)
                if (desc.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = desc,
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Normal,
                            lineHeight = 16.sp
                        ),
                        color = Color.White.copy(alpha = 0.85f),
                        softWrap = true
                    )
                }

                Spacer(modifier = Modifier.height(9.dp))

                // Bottom Meta Pills Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(100),
                        color = pillBg
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 7.5.dp, vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.5.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Schedule,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(10.5.dp)
                            )
                            Text(
                                text = AppStrings.Home.fullDay(lang),
                                style = TextStyle(
                                    fontFamily = ff,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Medium
                                ),
                                color = Color.White
                            )
                        }
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
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val cardBg = colors.accent
    val pillBg = Color.White.copy(alpha = 0.2f)
    val timeFormatted = "${DateTimeUtils.formatTimeForDisplay(event.startTime ?: "09:00")} - ${DateTimeUtils.formatTimeForDisplay(event.endTime ?: "12:00")}"

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = HomeDimens.SpacingLg),
        shape = RoundedCornerShape(24.dp),
        color = cardBg,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Icon(
                imageVector = Icons.Default.DateRange,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(30.dp)
            )

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = event.title,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        lineHeight = 22.sp
                    ),
                    color = Color.White,
                    softWrap = true
                )

                if (!event.description.isNullOrEmpty()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = event.description,
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Normal,
                            lineHeight = 16.sp
                        ),
                        color = Color.White.copy(alpha = 0.85f),
                        softWrap = true
                    )
                }

                if (event.type != "Event") {
                    Spacer(modifier = Modifier.height(9.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = RoundedCornerShape(100),
                            color = pillBg
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 7.5.dp, vertical = 3.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.5.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Schedule,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(10.5.dp)
                                )
                                Text(
                                    text = timeFormatted,
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Medium
                                    ),
                                    color = Color.White
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Exam Card - Matches new minimal Elvan design language with accent background
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
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val cardBg = colors.accent
    val pillBg = Color.White.copy(alpha = 0.2f)
    val timeFormatted = "${DateTimeUtils.formatTimeForDisplay(subject.startTime)} - ${DateTimeUtils.formatTimeForDisplay(subject.endTime)}"

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = HomeDimens.SpacingLg),
        shape = RoundedCornerShape(24.dp),
        color = cardBg,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Icon(
                imageVector = Icons.Default.EmojiEvents,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(30.dp)
            )

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = courseName,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        lineHeight = 22.sp
                    ),
                    color = Color.White,
                    softWrap = true
                )

                Spacer(modifier = Modifier.height(2.dp))

                // Subtitle: Code • Exam Title
                Text(
                    text = "${subject.code} • ${exam.title}",
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.Normal,
                        lineHeight = 16.sp
                    ),
                    color = Color.White.copy(alpha = 0.85f),
                    softWrap = true,
                    maxLines = 3
                )

                Spacer(modifier = Modifier.height(9.dp))

                // Bottom Meta Pills Row: Time Pill + Portion Pill side-by-side
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Time Pill
                    Surface(
                        shape = RoundedCornerShape(100),
                        color = pillBg
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 7.5.dp, vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.5.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Schedule,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(10.5.dp)
                            )
                            Text(
                                text = timeFormatted,
                                style = TextStyle(
                                    fontFamily = ff,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Medium
                                ),
                                color = Color.White
                            )
                        }
                    }

                    // Portion Pill (Compact side-by-side pill with flexible fit)
                    if (subject.portion.isNotEmpty()) {
                        Surface(
                            modifier = Modifier.weight(1f, fill = false),
                            shape = RoundedCornerShape(100),
                            color = pillBg
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 7.5.dp, vertical = 3.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.5.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Outlined.MenuBook,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(10.5.dp)
                                )
                                Text(
                                    text = subject.portion,
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Medium
                                    ),
                                    color = Color.White,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Practical Exam Mini Card - Matches new minimal Elvan design layout
 */
@Composable
internal fun PracticalExamMiniCard(
    exam: ExamSchedule,
    batchGroups: List<TodayBatchGroup>,
    colors: HomeColors
) {
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val cardBg = colors.accent
    val pillBg = Color.White.copy(alpha = 0.2f)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = HomeDimens.SpacingLg),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SpacingLg)
    ) {
        batchGroups.forEach { group ->
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = cardBg,
                shadowElevation = 0.dp
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 18.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Icon(
                        imageVector = Icons.Outlined.Science,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(30.dp)
                    )

                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = group.subjectName,
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 17.sp,
                                fontWeight = FontWeight.SemiBold,
                                lineHeight = 22.sp
                            ),
                            color = Color.White,
                            softWrap = true
                        )

                        Spacer(modifier = Modifier.height(2.dp))

                        Text(
                            text = "${group.code} • ${exam.title}",
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Normal,
                                lineHeight = 16.sp
                            ),
                            color = Color.White.copy(alpha = 0.85f),
                            softWrap = true
                        )
                    }
                }
            }

            // Timetable Card for the individual batches
            val batchPeriods = group.batches.mapIndexed { index, batch ->
                val timeStr = "${DateTimeUtils.formatTimeForDisplay(batch.startTime)} - ${DateTimeUtils.formatTimeForDisplay(batch.endTime)}"
                val facultyInfo = buildString {
                    if (batch.totalCount.isNotEmpty()) append(K.studentsCount.trWithLang(lang, batch.totalCount))
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
                    isLab = false
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
                                            text = AppStrings.Home.lab(LocalAppLanguage.current),
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
                text = AppStrings.Home.noClassesScheduled(LocalAppLanguage.current),
                style = HomeTypography.NoClassesTitle.copy(fontFamily = LocalAppFontFamily.current),
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
    val lang = LocalAppLanguage.current
    com.elvan.neram.ui.home.components.EditableSection(
        title = AppStrings.Home.liveUpdates(sectionName, lang),
        content = content,
        rawContent = rawContent,
        author = author,
        emptyText = AppStrings.Home.noUpdatesForDate(lang),
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
    val lang = LocalAppLanguage.current
    EditableSection(
        title = AppStrings.Home.generalNotice(lang),
        content = content.ifEmpty { AppStrings.Home.noGeneralNotices(lang) },
        author = author,
        emptyText = AppStrings.Home.noGeneralNotices(lang),
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
    val lang = LocalAppLanguage.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        InfoItem(
            label = K.batch.tr(lang),
            value = userProfile?.batch ?: "-",
            colors = colors,
            modifier = Modifier.weight(1f)
        )
        InfoItem(
            label = K.dept.tr(lang),
            value = userProfile?.department ?: "-",
            colors = colors,
            modifier = Modifier.weight(1f)
        )
        InfoItem(
            label = K.sec.tr(lang),
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
    val ff = LocalAppFontFamily.current
    val lang = LocalAppLanguage.current
    val cardBg = colors.accent
    val pillBg = Color.White.copy(alpha = 0.2f)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = HomeDimens.SpacingLg),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SpacingLg)
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = cardBg,
            shadowElevation = 0.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 18.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Computer,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(30.dp)
                )

                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = if (specialClass.title.isNotEmpty()) specialClass.title else K.scheduledForToday.tr(lang),
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 17.sp,
                            fontWeight = FontWeight.SemiBold,
                            lineHeight = 22.sp
                        ),
                        color = Color.White,
                        softWrap = true
                    )

                    if (specialClass.desc.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = specialClass.desc,
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Normal,
                                lineHeight = 16.sp
                            ),
                            color = Color.White.copy(alpha = 0.85f),
                            softWrap = true
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

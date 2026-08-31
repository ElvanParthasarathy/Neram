package com.elvan.neram.ui.schedule

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.data.model.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.navigation.CustomIcons
import com.elvan.neram.ui.theme.AppStrings
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.utils.DateTimeUtils
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.forEachGesture
import androidx.compose.ui.input.pointer.changedToUp
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.graphics.lerp
import kotlin.math.abs
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.zIndex
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.ui.draw.rotate
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.ui.graphics.graphicsLayer
import com.elvan.neram.ui.components.shell.cssShadow
import com.elvan.neram.ui.navigation.MaterialSymbols
import kotlin.math.floor
import kotlin.math.roundToInt
import androidx.compose.ui.unit.IntOffset
import java.time.LocalDate

/**
 * ScheduleComponents - All reusable UI components for Schedule screen
 * 
 * Extracted from ScheduleScreen.kt for better maintainability.
 * Components can be easily modified without touching screen logic.
 */

// ============================================================================
// TAB COMPONENTS
// ============================================================================

@Composable
fun TabButton(
    text: String,
    icon: ImageVector,
    isActive: Boolean,
    colors: HomeColors,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(36.dp) // Match DayTabsRow height
            .clip(HomeShapes.Pill)
            .background(if (isActive) colors.accent else Color.Transparent)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isActive) Color.White else colors.textSecondary,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = text,
                style = HomeTypography.PillTime.copy(fontWeight = FontWeight.SemiBold),
                color = if (isActive) Color.White else colors.textSecondary
            )
        }
    }
}

@Composable
fun DayTabsRow(
    selectedDay: String,
    onDaySelected: (String) -> Unit,
    colors: HomeColors,
    modifier: Modifier = Modifier
) {
    // Hardcoded days for now as per original code (Tue-Sat)
    val lang = LocalAppLanguage.current
    val days = listOf(
        AppStrings.Schedule.dayTuesday(lang),
        AppStrings.Schedule.dayWednesday(lang),
        AppStrings.Schedule.dayThursday(lang),
        AppStrings.Schedule.dayFriday(lang),
        AppStrings.Schedule.daySaturday(lang)
    )
    val fullDays = listOf("Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    
    val selectedIndex = fullDays.indexOf(selectedDay).coerceAtLeast(0)

    val isDark = colors.surface.luminance() < 0.5f
    // Use a cooler gray for dark mode (textSecondary is #9CA3AF)
    val containerColor = if (isDark) colors.textSecondary.copy(alpha = 0.12f) else colors.background

    // "One Pill" Container
    Surface(
        modifier = modifier
            .fillMaxWidth(), // Caller handles padding
        shape = HomeShapes.Pill,
        color = containerColor,
        // Border removed
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .padding(6.dp) // Padding between outer pill and inner items
        ) {
            val width = maxWidth
            val itemWidth = width / days.size
            
            // Dynamic Scale: Grow by ~12dp max or 15%, whichever is smaller to fit padding/avoid clip
            val maxScale = (1f + (12.dp / itemWidth)).coerceAtMost(1.15f)
            
            // Interaction State for Zoom Effect
            var isInteracting by remember { mutableStateOf(false) }
            val scale by animateFloatAsState(
                targetValue = if (isInteracting) maxScale else 1.0f,
                label = "pill_zoom"
            )
            
            // Interaction State
            var currentDragOffset by remember { mutableStateOf<Float?>(null) }
            
            // Unified Interaction Handler (Tap + Slide)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(36.dp)
                    .zIndex(2f)
                    .pointerInput(itemWidth) {
                        awaitPointerEventScope {
                            while (true) {
                                val down = awaitFirstDown()
                                isInteracting = true
                                currentDragOffset = null // Start snapped to Day Center (User Request)
                                
                                // Initial tap logic
                                val initialIndex = (down.position.x / itemWidth.toPx()).toInt().coerceIn(0, days.size - 1)
                                onDaySelected(fullDays[initialIndex])

                                var pointerId = down.id
                                while (true) {
                                    val event = awaitPointerEvent()
                                    val pointerChange = event.changes.firstOrNull { it.id == pointerId }
                                    
                                    if (pointerChange == null || pointerChange.changedToUp() || pointerChange.isConsumed) {
                                        break
                                    }

                                    // Continuous drag update
                                    currentDragOffset = pointerChange.position.x
                                    val dragIndex = (pointerChange.position.x / itemWidth.toPx()).toInt().coerceIn(0, days.size - 1)
                                    onDaySelected(fullDays[dragIndex])
                                    
                                    pointerChange.consume()
                                }

                                isInteracting = false
                                currentDragOffset = null
                            }
                        }
                    }
            )

            // Animated Selection Pill (Background)
            val targetOffset = if (isInteracting && currentDragOffset != null) {
                with(LocalDensity.current) { (currentDragOffset!! - itemWidth.toPx() / 2).toDp() }
            } else {
                itemWidth * selectedIndex
            }
            
            // Ensure width constraint
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
                    .scale(scale) // Apply Interactive Zoom Effect
                    .clip(HomeShapes.Pill)
                    .background(colors.accent)
            )

            // Text Items (Foreground)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                days.forEachIndexed { index, day ->
                    // Calculate distance from the pill's current VISUAL center
                    // indicatorOffset is the left edge. Center = indicatorOffset + itemWidth/2
                    // Item Center = (itemWidth * index) + itemWidth/2
                    // Distance = abs(indicatorOffset - (itemWidth * index))
                    
                    val distance = abs(indicatorOffset.value - (itemWidth.value * index))
                    val fraction = 1f - (distance / itemWidth.value).coerceIn(0f, 1f)
                    
                    val textColor = lerp(colors.textSecondary, Color.White, fraction)
                    
                    Box(
                        modifier = Modifier
                            .width(itemWidth) // Enforce equal width
                            .height(36.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = day,
                            style = HomeTypography.PillTitle,
                            fontSize = 13.sp,
                            color = textColor,
                            // Snap font weight when mostly covered (> 50%)
                            fontWeight = if (fraction > 0.5f) FontWeight.Bold else FontWeight.Medium,
                            fontFamily = com.elvan.neram.ui.theme.LocalAppFontFamily.current
                        )
                    }
                }
            }
        }
    }
}

// ============================================================================
// CARD COMPONENTS
// ============================================================================

@Composable
fun MajorEventCard(
    tag: String,
    title: String,
    subtitle: String,
    meta1: String,
    meta2: String,
    icon: ImageVector,
    colors: HomeColors,
    isCycleTest: Boolean = false
) {
    // Styling similar to Home Screen's ExamCard/EventCard
    // Home Screen always uses Accent (Blue) for the main featured card, regardless of exam type.
    val cardColor = colors.accent
    val contentColor = Color.White
    
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        shape = HomeShapes.Card,
        colors = CardDefaults.cardColors(containerColor = cardColor)
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            // 1. Top Event Tag
            Text(
                text = tag,
                style = HomeTypography.ExamTag,
                color = contentColor.copy(alpha = 0.8f)
            )
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // 2. Icon + Main Content Row
            Row(
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = contentColor.copy(alpha = 0.9f),
                    modifier = Modifier.size(HomeDimens.IconSizeXxl).padding(top = HomeDimens.SpacingXxxs)
                )
                
                Column {
                    Text(
                        text = title,
                        style = HomeTypography.ExamTitle,
                        color = contentColor
                    )
                    Text(
                        text = subtitle,
                        style = HomeTypography.ExamSubtitle,
                        color = contentColor.copy(alpha = 0.9f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
            // 3. Meta Data Pills
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingSm), // 6dp
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        MetaChip(text = meta1, icon = Icons.Default.Schedule, contentColor = contentColor)
                        MetaChip(text = meta2, icon = Icons.Outlined.Info, contentColor = contentColor)
                    }
                }
            }
        }
    }
}

@Composable
private fun MetaChip(
    icon: ImageVector,
    text: String,
    contentColor: Color // Kept for flexibility, though Home defaults to White
) {
    Row(
        modifier = Modifier
            .clip(HomeShapes.MetaItem)
            .background(contentColor.copy(alpha = 0.2f))
            .padding(horizontal = HomeDimens.MetaChipPaddingH, vertical = HomeDimens.MetaChipPaddingV),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingXs)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = contentColor,
            modifier = Modifier.size(HomeDimens.IconSizeXs)
        )
        Text(
            text = text,
            style = HomeTypography.ExamMeta.copy(fontSize = 10.sp),
            color = contentColor,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun NoticeCard(title: String, message: String, colors: HomeColors) {
    // Matches ClassesSuspendedNotice from Home Screen
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
                    text = message,
                    style = HomeTypography.PillTime,
                    color = colors.textSecondary,
                    lineHeight = 20.sp
                )
            }
        }
    }
}

@Composable
fun InfoCard(title: String, items: List<String>, colors: HomeColors) {
    // "Fat Card" / Filled Style - COMPACT VERSION
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = HomeShapes.Card,
        color = colors.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp) // Reduced from 24dp for compactness
        ) {
            Text(
                text = title,
                style = HomeTypography.SectionTitle.copy(fontSize = 14.sp), // Slightly smaller title
                color = colors.textSecondary,
                modifier = Modifier.padding(bottom = 12.dp) // Reduced from 16dp
            )
            
            items.forEachIndexed { index, item ->
                Row(
                    modifier = Modifier.padding(vertical = 6.dp), // Reduced from 8dp
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Profile Icon with background
                    Box(
                        modifier = Modifier
                            .size(28.dp) // Slightly smaller icon box (32 -> 28)
                            .clip(CircleShape)
                            .background(colors.accent.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = colors.accent,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(12.dp))
                    
                    Text(
                        text = item,
                        style = HomeTypography.InfoValue.copy(fontWeight = FontWeight.Medium), // "Middle" weight
                        color = colors.textPrimary
                    )
                }
            }
            
            if (items.isEmpty()) {
                 Text(AppStrings.Schedule.noInfoAvailable(LocalAppLanguage.current), fontSize = 13.sp, color = colors.textSecondary.copy(alpha=0.5f))
            }
        }
    }
}

// ============================================================================
// TABLE COMPONENTS
// ============================================================================

@Composable
fun ScheduleTable(periods: List<PeriodDisplayData>, colors: HomeColors, isMini: Boolean = false) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = if (isMini) 8.dp else 12.dp),
        verticalArrangement = Arrangement.spacedBy(if (isMini) 8.dp else 12.dp)
    ) {
        periods.forEachIndexed { index, period ->
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = if (isMini) RoundedCornerShape(16.dp) else HomeShapes.Item,
                color = colors.surface
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = if (isMini) 14.dp else 16.dp, vertical = if (isMini) 12.dp else 14.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    // Period Number - Filled Circle
                    Surface(
                        modifier = Modifier.size(if (isMini) 22.dp else 26.dp),
                        shape = CircleShape,
                        color = colors.accent
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = period.number.toString(),
                                style = HomeTypography.CellHour.copy(
                                    fontSize = if (isMini) 10.sp else 12.sp
                                ),
                                color = Color.White,
                                fontWeight = FontWeight.ExtraBold,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.width(if (isMini) 8.dp else 10.dp))
                
                // Course Details - Grouped by Entry
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
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
                                    Spacer(modifier = Modifier.width(6.dp))
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
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                            
                            if (!isMini) {
                                if (entry.name.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = entry.name,
                                        style = HomeTypography.CourseName,
                                        color = colors.textPrimary
                                    )
                                }

                                if (entry.faculty.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = entry.faculty,
                                        style = HomeTypography.StatusBadge.copy(
                                            fontSize = if (isMini) 9.sp else 10.sp
                                        ),
                                        color = colors.textSecondary.copy(alpha = 0.8f)
                                    )
                                }
                            } else {
                                // Mini mode - just show name
                                if (entry.name.isNotEmpty()) {
                                    Text(
                                        text = entry.name,
                                        style = HomeTypography.CourseName,
                                        color = colors.textPrimary,
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
}
}

@Composable
fun ExamScheduleCard(
    exam: ExamSchedule,
    courses: List<Course>,
    colors: HomeColors,
    defaultExpanded: Boolean = false,
    viewDate: LocalDate? = null
) {
    var isExpanded by remember { mutableStateOf(defaultExpanded) }
    val isPractical = exam.type == "Practical"

    // Date range subtitle
    val dateRange = if (exam.startDate.isNotEmpty() && exam.endDate.isNotEmpty()) {
        "${DateTimeUtils.formatDateForDisplay(exam.startDate)} — ${DateTimeUtils.formatDateForDisplay(exam.endDate)}"
    } else ""

    // Chevron rotation animation
    val chevronRotation by animateFloatAsState(
        targetValue = if (isExpanded) 180f else 0f,
        label = "chevron"
    )

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = HomeShapes.Card,
        color = colors.surface,
        shadowElevation = 0.dp
    ) {
        Column {
            // ── Clickable Header ──
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(
                        interactionSource = remember { MutableInteractionSource() },
                        indication = null
                    ) { isExpanded = !isExpanded }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.Default.EmojiEvents,
                    contentDescription = null,
                    tint = colors.accent,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = exam.title,
                        style = HomeTypography.SectionTitle,
                        color = colors.textPrimary
                    )
                    if (dateRange.isNotEmpty()) {
                        Text(
                            text = dateRange,
                            style = HomeTypography.FacultyName,
                            color = colors.textSecondary
                        )
                    }
                }
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = if (isExpanded) "Collapse" else "Expand",
                    tint = colors.textSecondary,
                    modifier = Modifier.rotate(chevronRotation)
                )
            }

            // ── Collapsible Body ──
            AnimatedVisibility(
                visible = isExpanded,
                enter = expandVertically() + fadeIn(),
                exit = shrinkVertically() + fadeOut()
            ) {
                Column(modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp)) {
                    if (isPractical) {
                        // Practical exam: date-grouped batches
                        PracticalExamContent(
                            exam = exam,
                            courses = courses,
                            colors = colors,
                            viewDate = viewDate
                        )
                    } else {
                        // Standard exam: numbered subject list
                        StandardExamContent(
                            exam = exam,
                            courses = courses,
                            colors = colors
                        )
                    }
                }
            }
        }
    }
}

// ── Standard Exam Body (numbered subject rows) ──
@Composable
private fun StandardExamContent(
    exam: ExamSchedule,
    courses: List<Course>,
    colors: HomeColors
) {
    exam.subjects.forEachIndexed { index, sub ->
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            verticalAlignment = Alignment.Top
        ) {
            Surface(
                modifier = Modifier.size(26.dp),
                shape = CircleShape,
                color = colors.accent
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = (index + 1).toString(),
                        style = HomeTypography.CellHour.copy(fontSize = 12.sp),
                        color = Color.White,
                        fontWeight = FontWeight.ExtraBold,
                        textAlign = TextAlign.Center
                    )
                }
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = DateTimeUtils.formatDateForDisplay(sub.date),
                    style = HomeTypography.CourseCode,
                    color = colors.textPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${sub.code}: ${getSubjectName(sub.code, courses)}",
                    style = HomeTypography.CourseName.copy(fontWeight = FontWeight.SemiBold),
                    color = colors.accent
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${DateTimeUtils.formatTimeForDisplay(sub.startTime)} - ${DateTimeUtils.formatTimeForDisplay(sub.endTime)}",
                        style = HomeTypography.FacultyName,
                        color = colors.textSecondary
                    )
                    if (sub.portion.isNotEmpty()) {
                        Text(
                            text = "  •  ${sub.portion}",
                            style = HomeTypography.FacultyName,
                            color = colors.textSecondary
                        )
                    }
                }
            }
        }
    }
    if (exam.subjects.isEmpty()) {
        Text(
            text = AppStrings.Schedule.noSubjectsScheduled(LocalAppLanguage.current),
            style = HomeTypography.FacultyName,
            color = colors.textSecondary,
            modifier = Modifier.padding(vertical = 8.dp)
        )
    }
}

// ── Practical Exam Body (date-grouped batches) ──
private data class PracFlatBatch(
    val subCode: String,
    val subName: String,
    val idx: Int,
    val batch: PracticalBatch
)

@Composable
private fun PracticalExamContent(
    exam: ExamSchedule,
    courses: List<Course>,
    colors: HomeColors,
    viewDate: LocalDate? = null
) {
    // Flatten all batches and group by date → subject
    val dateGroups = remember(exam) {
        val allEntries = mutableListOf<PracFlatBatch>()
        exam.subjects.forEach { sub ->
            sub.batches.forEachIndexed { j, b ->
                allEntries.add(
                    PracFlatBatch(
                        subCode = sub.code,
                        subName = getSubjectName(sub.code, courses),
                        idx = j,
                        batch = b
                    )
                )
            }
        }
        // Group by date
        allEntries.groupBy { it.batch.date.ifEmpty { "Unknown" } }
    }

    val sortedDateGroups = remember(dateGroups, viewDate) {
        val todayStr = viewDate?.toString() ?: ""
        dateGroups.entries.sortedWith { a, b ->
            val dateA = a.key
            val dateB = b.key
            val scoreA = when {
                dateA == todayStr -> 0
                dateA > todayStr -> 1
                else -> 2 // Past dates
            }
            val scoreB = when {
                dateB == todayStr -> 0
                dateB > todayStr -> 1
                else -> 2
            }
            if (scoreA != scoreB) scoreA.compareTo(scoreB) else dateA.compareTo(dateB)
        }
    }

    sortedDateGroups.forEach { entry ->
        val date = entry.key
        val entries = entry.value
        // Sub-group by subject code
        val subGroups = entries.groupBy { it.subCode }

        val isToday = try {
            viewDate != null && date == viewDate.toString()
        } catch (_: Exception) { false }

        PracDateGroup(
            date = date,
            subGroups = subGroups,
            colors = colors,
            defaultOpen = isToday
        )
    }

    if (dateGroups.isEmpty()) {
        Text(
            text = AppStrings.Schedule.noBatchesScheduled(LocalAppLanguage.current),
            style = HomeTypography.FacultyName,
            color = colors.textSecondary,
            modifier = Modifier.padding(vertical = 8.dp)
        )
    }
}

// ── Collapsible Date Group for Practicals ──
@Composable
private fun PracDateGroup(
    date: String,
    subGroups: Map<String, List<PracFlatBatch>>,
    colors: HomeColors,
    defaultOpen: Boolean = false
) {
    var isOpen by remember(defaultOpen) { mutableStateOf(defaultOpen) }
    val chevronRotation by animateFloatAsState(
        targetValue = if (isOpen) 180f else 0f,
        label = "dateChevron"
    )
    val isDark = colors.surface.luminance() < 0.5f
    val pillBg = if (isDark) colors.textSecondary.copy(alpha = 0.12f) else colors.background

    Column(modifier = Modifier.padding(bottom = 8.dp)) {
        // Pill-styled date header
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) { isOpen = !isOpen },
            shape = RoundedCornerShape(100),
            color = pillBg
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = DateTimeUtils.formatDateForDisplay(date),
                    style = HomeTypography.SectionTitle.copy(fontSize = 13.sp),
                    color = colors.textPrimary
                )
                Icon(
                    imageVector = Icons.Default.KeyboardArrowDown,
                    contentDescription = null,
                    tint = colors.textSecondary,
                    modifier = Modifier.size(20.dp).rotate(chevronRotation)
                )
            }
        }

        // Collapsible content
        AnimatedVisibility(
            visible = isOpen,
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            Column(modifier = Modifier.padding(top = 16.dp)) {
                var isFirst = true
                subGroups.forEach { (code, flatBatches) ->
                    if (!isFirst) {
                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = 8.dp),
                            color = colors.textSecondary.copy(alpha = 0.15f)
                        )
                    }
                    isFirst = false

                    // Subject header
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = code,
                            style = HomeTypography.CourseCode.copy(fontWeight = FontWeight.ExtraBold),
                            color = colors.accent
                        )
                        Text(
                            text = flatBatches.firstOrNull()?.subName ?: "",
                            style = HomeTypography.CourseName.copy(fontWeight = FontWeight.SemiBold),
                            color = colors.textPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // Batch rows
                    flatBatches.forEach { fb ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            // Circle label (A, B, C...)
                            Surface(
                                modifier = Modifier.size(26.dp),
                                shape = CircleShape,
                                color = colors.accent
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = fb.batch.label.ifEmpty {
                                            ('A' + fb.idx).toString()
                                        },
                                        style = HomeTypography.CellHour.copy(fontSize = 11.sp),
                                        color = Color.White,
                                        fontWeight = FontWeight.ExtraBold,
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${DateTimeUtils.formatTimeForDisplay(fb.batch.startTime)} - ${DateTimeUtils.formatTimeForDisplay(fb.batch.endTime)}",
                                    style = HomeTypography.CourseCode,
                                    color = colors.accent
                                )
                                if (fb.batch.registerRange.isNotEmpty()) {
                                    Text(
                                        text = fb.batch.registerRange,
                                        style = HomeTypography.CourseName.copy(fontSize = 11.sp),
                                        color = colors.textPrimary,
                                        modifier = Modifier.padding(top = 2.dp)
                                    )
                                }
                                if (fb.batch.totalCount.isNotEmpty()) {
                                    Text(
                                        text = AppStrings.Schedule.students(fb.batch.totalCount.toIntOrNull() ?: 0, LocalAppLanguage.current),
                                        style = HomeTypography.FacultyName,
                                        color = colors.textSecondary,
                                        modifier = Modifier.padding(top = 2.dp)
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



@Composable
fun CourseDirectoryTable(courses: List<Course>, colors: HomeColors) {
    if (courses.isEmpty()) {
         Text("No courses found", modifier = Modifier.padding(16.dp), color = colors.textSecondary)
    } else {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            courses.forEach { course ->
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = HomeShapes.Card,
                    color = colors.surface,
                    shadowElevation = 0.dp
                ) {
                     Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 16.dp), // Increased vertical padding
                        verticalAlignment = Alignment.Top
                    ) {
                        // Direct Content
                        Column(modifier = Modifier.weight(1f)) {
                            // Course Code + Periods (same row)
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = course.code,
                                    style = HomeTypography.CourseCode,
                                    color = colors.accent
                                )
                                if (course.periods > 0) {
                                    Text(
                                        text = "• ${course.periods} ${AppStrings.Schedule.periods(LocalAppLanguage.current)}",
                                        style = HomeTypography.FacultyName,
                                        color = colors.textSecondary
                                    )
                                }
                            }
                            
                            Spacer(modifier = Modifier.height(6.dp))
                            
                            // Course Name
                            Text(
                                text = course.name,
                                style = HomeTypography.CourseName,
                                color = colors.textPrimary
                            )
                            
                            Spacer(modifier = Modifier.height(6.dp))
                            
                            // Faculty
                            Text(
                                text = course.faculty,
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

// ============================================================================
// EMPTY STATE COMPONENTS
// ============================================================================

@Composable
fun EmptyScheduleCard(message: String, colors: HomeColors) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = HomeShapes.Card, // Changed from Item to Card to match other flat cards
        color = colors.surface,
        shadowElevation = 0.dp
    ) {
        Box(
            modifier = Modifier.padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = message,
                style = HomeTypography.AuthorBadge,
                color = colors.textSecondary
            )
        }
    }
}

@Composable
fun ViewTypeTabsRow(
    activeTab: String,
    onTabSelected: (String) -> Unit,
    colors: HomeColors,
    modifier: Modifier = Modifier,
    onInteraction: (Boolean) -> Unit = {},
    onDragProgress: (Float) -> Unit = {}
) {
    val lang = LocalAppLanguage.current
    data class TabItem(
        val label: String,
        val id: String,
        val icon: ImageVector,
        val activeIcon: ImageVector
    )
    val tabs = remember(lang) {
        listOf(
            TabItem(
                label = AppStrings.Schedule.classesTab(lang),
                id = "class",
                icon = MaterialSymbols.Rounded.Schedule,
                activeIcon = MaterialSymbols.Rounded.ScheduleFill
            ),
            TabItem(
                label = AppStrings.Schedule.examsTab(lang),
                id = "exams",
                icon = MaterialSymbols.Rounded.Description,
                activeIcon = MaterialSymbols.Rounded.DescriptionFill
            )
        )
    }
    val itemCount = tabs.size
    val actualIndex = tabs.indexOfFirst { it.id == activeTab }.coerceAtLeast(0)

    val coroutineScope = rememberCoroutineScope()
    val density = LocalDensity.current

    // Exact BottomNavBar matching layout dimensions
    val layoutWidth = 136.dp
    val bgWidth = 144.dp
    val horizontalPadding = 8.dp
    val verticalPadding = 4.dp
    val totalWidth = (layoutWidth * itemCount) + (horizontalPadding * 2)

    var isInteracting by remember { mutableStateOf(false) }
    var dragOffsetPx by remember { mutableStateOf<Float?>(null) }
    var touchOffsetFromCenterPx by remember { mutableStateOf(0f) }
    var hoverIndex by remember { mutableStateOf<Int?>(null) }
    var localLockedIndex by remember { mutableStateOf<Int?>(null) }
    var snapNextFrame by remember { mutableStateOf(false) }

    val layoutWidthPx = with(density) { layoutWidth.toPx() }
    val bgWidthPx = with(density) { bgWidth.toPx() }

    LaunchedEffect(actualIndex) {
        localLockedIndex = null
        snapNextFrame = true
    }
    LaunchedEffect(snapNextFrame) {
        if (snapNextFrame) {
            kotlinx.coroutines.yield()
            snapNextFrame = false
        }
    }

    val activeVisualIndex = if (isInteracting && hoverIndex != null) {
        hoverIndex!!
    } else {
        localLockedIndex ?: actualIndex
    }

    // Outer AnimatedScale: 1.02x on interaction (BottomNavBar match)
    val containerScale by animateFloatAsState(
        targetValue = if (isInteracting) 1.02f else 1.0f,
        animationSpec = tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)),
        label = "containerScale"
    )

    // Pill scale on interaction: Symmetrical 4dp expansion in all directions (fills top & bottom completely)
    val pillScaleX by animateFloatAsState(
        targetValue = if (isInteracting) 1.055f else 1.0f,
        animationSpec = tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)),
        label = "pillScaleX"
    )
    val pillScaleY by animateFloatAsState(
        targetValue = if (isInteracting) 1.20f else 1.0f,
        animationSpec = tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)),
        label = "pillScaleY"
    )

    // Exact BottomNavBar pixel offset clamping
    val overlapPx = (bgWidthPx - layoutWidthPx) / 2f
    val maxLeftPx = ((itemCount - 1) * layoutWidthPx) - overlapPx
    val minLeftPx = -overlapPx

    val targetLeftPx = if (isInteracting && dragOffsetPx != null) {
        (dragOffsetPx!! - (bgWidthPx / 2f)).coerceIn(minLeftPx, maxLeftPx)
    } else {
        ((activeVisualIndex * layoutWidthPx) - overlapPx).coerceIn(minLeftPx, maxLeftPx)
    }

    val animatedLeftPx by animateFloatAsState(
        targetValue = targetLeftPx,
        animationSpec = if (snapNextFrame || (isInteracting && dragOffsetPx != null)) {
            snap()
        } else {
            tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f))
        },
        label = "pillX"
    )

    val isDark = colors.isDark

    Box(
        modifier = modifier
            .graphicsLayer {
                scaleX = containerScale
                scaleY = containerScale
                clip = false
            }
            .height(48.dp)
            .width(totalWidth),
        contentAlignment = Alignment.Center
    ) {
        // Layer 1: Outer Container (Matches card background, no outline, no shadow)
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    color = colors.surface,
                    shape = CircleShape
                )
        )

        // Layer 2: Foreground & Draggable Content (Exact BottomNavBar structure)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = horizontalPadding, vertical = verticalPadding)
                .pointerInput(Unit) {
                    awaitEachGesture {
                        val down = awaitFirstDown(requireUnconsumed = false)
                        isInteracting = true
                        onInteraction(true)

                        val initialX = down.position.x
                        hoverIndex = floor(initialX / layoutWidthPx).toInt().coerceIn(0, itemCount - 1)
                        val slotCenter = (hoverIndex!! * layoutWidthPx) + (layoutWidthPx / 2f)
                        touchOffsetFromCenterPx = initialX - slotCenter
                        dragOffsetPx = null

                        var isDrag = false
                        val pointerId = down.id

                        while (true) {
                            val event = awaitPointerEvent()
                            val change = event.changes.firstOrNull { it.id == pointerId } ?: break
                            if (!change.pressed) {
                                break
                            }
                            val currentPos = change.position
                            if (kotlin.math.abs(currentPos.x - down.position.x) > 4f) {
                                isDrag = true
                                val targetCenter = currentPos.x - touchOffsetFromCenterPx
                                dragOffsetPx = targetCenter
                                hoverIndex = floor(targetCenter / layoutWidthPx).toInt().coerceIn(0, itemCount - 1)
                                onDragProgress(targetCenter / layoutWidthPx)
                                change.consume()
                            }
                        }

                        val finalIndex = hoverIndex
                        if (finalIndex != null) {
                            localLockedIndex = finalIndex
                        }
                        isInteracting = false
                        onInteraction(false)
                        dragOffsetPx = null
                        hoverIndex = null

                        if (finalIndex != null) {
                            coroutineScope.launch {
                                delay(150)
                                onTabSelected(tabs[finalIndex].id)
                            }
                        }
                    }
                },
            contentAlignment = Alignment.CenterStart
        ) {
            Box(
                modifier = Modifier
                    .width(layoutWidth * itemCount)
                    .fillMaxHeight()
            ) {
                // Master Background Pill (Detached & Draggable)
                Box(
                    modifier = Modifier
                        .offset { IntOffset(animatedLeftPx.roundToInt(), 0) }
                        .fillMaxHeight()
                        .width(bgWidth)
                        .graphicsLayer {
                            scaleX = pillScaleX
                            scaleY = pillScaleY
                            transformOrigin = androidx.compose.ui.graphics.TransformOrigin.Center
                            clip = false
                        }
                        .background(
                            color = if (isDark) Color(0xFF333333)
                            else Color(0xFFE5E5E5),
                            shape = CircleShape
                        )
                )

                // Foreground Tabs Content
                Row(
                    modifier = Modifier.fillMaxSize(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    tabs.forEachIndexed { index, item ->
                        val isActive = index == activeVisualIndex
                        val itemColor = if (isActive) {
                            if (isDark) Color.White else Color(0xFF1A1A1A)
                        } else {
                            if (isDark) Color(0xFF9E9E9E) else Color(0xFF7C7C80)
                        }

                        Box(
                            modifier = Modifier
                                .width(layoutWidth)
                                .fillMaxHeight(),
                            contentAlignment = Alignment.Center
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = if (isActive) item.activeIcon else item.icon,
                                    contentDescription = item.label,
                                    tint = itemColor,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = item.label,
                                    style = HomeTypography.PillTitle,
                                    fontSize = 14.sp,
                                    fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Medium,
                                    color = itemColor,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    fontFamily = com.elvan.neram.ui.theme.LocalAppFontFamily.current
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

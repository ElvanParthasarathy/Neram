package com.elvan.neram.ui.notes

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.data.model.NotesSubject
import com.elvan.neram.ui.home.HomeColors
import com.elvan.neram.ui.home.HomeDimens
import com.elvan.neram.ui.home.HomeShapes
import com.elvan.neram.ui.home.HomeTypography
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import androidx.compose.animation.core.*
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.Language
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import kotlin.math.floor
import kotlin.math.roundToInt
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import com.elvan.neram.ui.theme.LocalAppLanguage

/**
 * NotesComponents - Reusable UI widgets for the Notes Screen.
 * Fully integrated with ElvanShell master architecture and Home Card Design System.
 */

@Composable
fun NotesBreadcrumbHeader(
    path: List<String>,
    colors: HomeColors,
    onBackClick: () -> Unit
) {
    val lang = LocalAppLanguage.current
    ElvanSectionContainer {
        Surface(
            onClick = onBackClick,
            shape = HomeShapes.Item,
            color = colors.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(colors.subtleBackground),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Filled.KeyboardArrowLeft,
                        contentDescription = K.back.tr(lang),
                        tint = colors.textPrimary,
                        modifier = Modifier.size(24.dp)
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = path.lastOrNull() ?: "",
                    style = HomeTypography.PillTitle,
                    color = colors.textPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
fun FolderList(
    items: List<String>,
    colors: HomeColors,
    listState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState(),
    path: List<String> = emptyList(),
    onBackClick: () -> Unit = {},
    headerContent: @Composable (() -> Unit)? = null,
    onClick: (String) -> Unit
) {
    val isSubpage = path.isNotEmpty()
    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            bottom = if (isSubpage) HomeDimens.SubpageContentPaddingBottom else HomeDimens.ContentPaddingBottom
        ),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(com.elvan.neram.ui.components.shell.LocalElvanTopSpacerHeight.current))
        }

        if (headerContent != null) {
            item(key = "notes_header_shifter") {
                headerContent()
            }
        }

        items(items, key = { it }) { item ->
            ElvanSectionContainer {
                FolderItem(item, colors) { onClick(item) }
            }
        }
    }
}

@Composable
fun FolderItem(
    name: String,
    colors: HomeColors,
    onClick: () -> Unit
) {
    Surface(
        shape = HomeShapes.Card,
        color = colors.surface,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onClick() }
                .padding(horizontal = 20.dp, vertical = 18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Folder,
                contentDescription = null,
                tint = colors.accent,
                modifier = Modifier.size(26.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Text(name, style = HomeTypography.PillTitle, color = colors.textPrimary, modifier = Modifier.weight(1f))
            Icon(Icons.Default.ChevronRight, null, tint = colors.textSecondary.copy(alpha = 0.5f))
        }
    }
}

@Composable
fun FilesList(
    subjects: List<NotesSubject>,
    colors: HomeColors,
    listState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState(),
    path: List<String> = emptyList(),
    onBackClick: () -> Unit = {},
    onLinkClick: (String) -> Unit,
    onNotUploaded: () -> Unit = {}
) {
    val isSubpage = path.isNotEmpty()
    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            bottom = if (isSubpage) HomeDimens.SubpageContentPaddingBottom else HomeDimens.ContentPaddingBottom
        ),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(com.elvan.neram.ui.components.shell.LocalElvanTopSpacerHeight.current))
        }

        items(subjects, key = { it.name }) { subject ->
            ElvanSectionContainer {
                SubjectItem(subject, colors, onLinkClick, onNotUploaded)
            }
        }
    }
}

@Composable
fun SubjectItem(
    subject: NotesSubject,
    colors: HomeColors,
    onLinkClick: (String) -> Unit,
    onNotUploaded: () -> Unit = {}
) {
    var expanded by remember { mutableStateOf(false) }
    val lang = LocalAppLanguage.current

    Column(modifier = Modifier.fillMaxWidth()) {
        // Header: Separate Card for the Dropdown Trigger
        Surface(
            shape = HomeShapes.Card,
            color = colors.surface,
            modifier = Modifier.fillMaxWidth(),
            shadowElevation = 0.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(horizontal = 20.dp, vertical = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Accent indicator
                Box(
                    modifier = Modifier
                        .width(4.dp)
                        .height(24.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(colors.accent)
                )
                
                Spacer(modifier = Modifier.width(12.dp))

                Text(
                    text = subject.name,
                    style = HomeTypography.PillTitle,
                    color = colors.textPrimary,
                    modifier = Modifier.weight(1f)
                )

                Icon(
                    if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = if (expanded) K.collapse.tr(lang) else K.expand.tr(lang),
                    tint = colors.textSecondary,
                    modifier = Modifier.size(24.dp)
                )
            }
        }

        // Expanded Content: Visible OUTSIDE the header card
        androidx.compose.animation.AnimatedVisibility(
            visible = expanded,
            enter = androidx.compose.animation.expandVertically() + androidx.compose.animation.fadeIn(),
            exit = androidx.compose.animation.shrinkVertically() + androidx.compose.animation.fadeOut()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                for (unitNumber in 1..5) {
                    val unitKey = "Unit $unitNumber"
                    val url = subject.units[unitKey] ?: subject.units["unit $unitNumber"] ?: ""
                    val isAvailable = url.isNotBlank()
                    
                    Surface(
                        shape = HomeShapes.Item,
                        color = if (isAvailable) colors.surface else colors.surface.copy(alpha = 0.6f),
                        modifier = Modifier.fillMaxWidth(),
                        onClick = {
                            if (isAvailable) {
                                onLinkClick(url)
                            } else {
                                onNotUploaded()
                            }
                        }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                if (isAvailable) Icons.Default.Description else Icons.Default.CloudOff,
                                contentDescription = null,
                                tint = if (isAvailable) colors.accent else colors.textSecondary.copy(alpha = 0.5f),
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = "${K.unit.tr(lang)} $unitNumber",
                                style = HomeTypography.StatusBadge.copy(fontSize = 14.sp),
                                color = if (isAvailable) colors.textPrimary else colors.textSecondary
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(
                                if (isAvailable) Icons.AutoMirrored.Filled.OpenInNew else Icons.Default.Lock,
                                contentDescription = if (isAvailable) K.open.tr(lang) else K.notAvailable.tr(lang),
                                tint = colors.textSecondary.copy(alpha = if (isAvailable) 0.6f else 0.4f),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3ExpressiveApi::class, ExperimentalMaterial3Api::class)
@Composable
fun NotesLoadingView(colors: HomeColors) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        ContainedLoadingIndicator(
            modifier = Modifier.size(HomeDimens.RefreshIndicatorSize),
            containerColor = colors.surface,
            indicatorColor = colors.textSecondary
        )
    }
}

@Composable
fun NotesErrorView(message: String, colors: HomeColors, onRetry: () -> Unit) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(Icons.Default.Warning, null, tint = colors.danger, modifier = Modifier.size(48.dp))
        Spacer(modifier = Modifier.height(8.dp))
        val lang = LocalAppLanguage.current
        Text(message, color = colors.textSecondary)
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(containerColor = colors.accent)
        ) {
            Text(K.goBack.tr(lang))
        }
    }
}

@Composable
fun NotesEmptyView(colors: HomeColors) {
    val lang = LocalAppLanguage.current
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(K.noItemsHere.tr(lang), color = colors.textSecondary)
    }
}

@Composable
fun DriveList(
    folders: List<com.elvan.neram.data.model.DriveFolder>,
    files: List<com.elvan.neram.data.model.DriveFile>,
    subjects: List<com.elvan.neram.data.model.DriveSubject> = emptyList(),
    colors: HomeColors,
    isRoot: Boolean,
    listState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState(),
    path: List<String> = emptyList(),
    onBackClick: () -> Unit = {},
    headerContent: @Composable (() -> Unit)? = null,
    onFolderClick: (com.elvan.neram.data.model.DriveFolder) -> Unit,
    onFileClick: (com.elvan.neram.data.model.DriveFile) -> Unit
) {
    val isSubpage = path.isNotEmpty()
    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(
            bottom = if (isSubpage) HomeDimens.SubpageContentPaddingBottom else HomeDimens.ContentPaddingBottom
        ),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(com.elvan.neram.ui.components.shell.LocalElvanTopSpacerHeight.current))
        }

        if (headerContent != null) {
            item(key = "notes_header_shifter") {
                headerContent()
            }
        }

        items(folders, key = { it.id }) { folder ->
            ElvanSectionContainer {
                FolderItem(folder.name, colors) { onFolderClick(folder) }
            }
        }

        items(files, key = { it.id }) { file ->
            ElvanSectionContainer {
                DriveFileItem(file.name, colors) { onFileClick(file) }
            }
        }

        items(subjects, key = { it.name }) { subject ->
            ElvanSectionContainer {
                DriveSubjectItem(subject, colors, onFileClick = { url ->
                    onFileClick(com.elvan.neram.data.model.DriveFile(link = url))
                })
            }
        }

        if (folders.isEmpty() && files.isEmpty() && subjects.isEmpty()) {
            item(key = "empty") {
                ElvanSectionContainer {
                    NotesEmptyView(colors)
                }
            }
        }
    }
}

/** Subject dropdown — matches fetch mode's SubjectItem style */
@Composable
fun DriveSubjectItem(
    subject: com.elvan.neram.data.model.DriveSubject,
    colors: HomeColors,
    onFileClick: (String) -> Unit
) {
    val lang = LocalAppLanguage.current
    var expanded by remember { mutableStateOf(false) }

    Column(modifier = Modifier.fillMaxWidth()) {
        // Header
        Surface(
            shape = HomeShapes.Card,
            color = colors.surface,
            modifier = Modifier.fillMaxWidth(),
            shadowElevation = 0.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(horizontal = 20.dp, vertical = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Accent bar
                Box(
                    modifier = Modifier
                        .width(4.dp)
                        .height(24.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(colors.accent)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = subject.name,
                    style = HomeTypography.PillTitle,
                    color = colors.textPrimary,
                    modifier = Modifier.weight(1f)
                )
                Icon(
                    if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                    contentDescription = if (expanded) K.collapse.tr(lang) else K.expand.tr(lang),
                    tint = colors.textSecondary,
                    modifier = Modifier.size(24.dp)
                )
            }
        }

        // Expanded units
        androidx.compose.animation.AnimatedVisibility(
            visible = expanded,
            enter = androidx.compose.animation.expandVertically() + androidx.compose.animation.fadeIn(),
            exit = androidx.compose.animation.shrinkVertically() + androidx.compose.animation.fadeOut()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val sortedUnits = subject.units.entries.sortedBy { entry ->
                    val num = entry.key.filter { it.isDigit() }.toIntOrNull() ?: 999
                    num
                }
                for ((unitName, link) in sortedUnits) {
                    val isAvailable = link.isNotBlank()

                    Surface(
                        shape = HomeShapes.Item,
                        color = if (isAvailable) colors.surface else colors.surface.copy(alpha = 0.6f),
                        modifier = Modifier.fillMaxWidth(),
                        onClick = { if (isAvailable) onFileClick(link) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                if (isAvailable) Icons.Default.Description else Icons.Default.CloudOff,
                                contentDescription = null,
                                tint = if (isAvailable) colors.accent else colors.textSecondary.copy(alpha = 0.5f),
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                text = if (unitName.startsWith("Unit ", ignoreCase = true)) {
                                    unitName.replaceFirst("(?i)Unit".toRegex(), K.unit.tr(lang))
                                } else unitName,
                                style = HomeTypography.StatusBadge.copy(fontSize = 14.sp),
                                color = if (isAvailable) colors.textPrimary else colors.textSecondary
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(
                                if (isAvailable) Icons.AutoMirrored.Filled.OpenInNew else Icons.Default.Lock,
                                contentDescription = if (isAvailable) K.open.tr(lang) else null,
                                tint = colors.textSecondary.copy(alpha = if (isAvailable) 0.6f else 0.4f),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
                if (subject.units.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(K.noUnitsAddedYet.tr(lang), color = colors.textSecondary, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun DriveFileItem(
    name: String,
    colors: HomeColors,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = HomeShapes.Card,
        color = colors.surface,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Description,
                contentDescription = null,
                tint = colors.textSecondary,
                modifier = Modifier.size(28.dp)
            )
            Spacer(modifier = Modifier.width(16.dp))
            Text(
                text = name,
                style = HomeTypography.PillTitle,
                color = colors.textPrimary,
                modifier = Modifier.weight(1f)
            )
            Icon(
                Icons.AutoMirrored.Filled.OpenInNew,
                contentDescription = null,
                tint = colors.textSecondary.copy(alpha = 0.5f),
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

/**
 * NotesTypeTabsRow - Segmented Pill Shifter for Notes Screen.
 * Uses the exact same design architecture and spring physics as ViewTypeTabsRow in Schedule.
 */
@Composable
fun NotesTypeTabsRow(
    activeTab: String,
    onTabSelected: (String) -> Unit,
    serverNotesMode: String,
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
    val folderTab = remember(lang) {
        TabItem(
            label = K.notesDriveTab.tr(lang),
            id = "folder",
            icon = Icons.Outlined.Folder,
            activeIcon = Icons.Filled.Folder
        )
    }
    val siteTab = remember(lang) {
        TabItem(
            label = K.collegeSiteTab.tr(lang),
            id = "fetch",
            icon = Icons.Outlined.Language,
            activeIcon = Icons.Filled.Language
        )
    }
    val tabs = remember(serverNotesMode, folderTab, siteTab) {
        if (serverNotesMode == "folder") {
            listOf(folderTab, siteTab)
        } else {
            listOf(siteTab, folderTab)
        }
    }
    val itemCount = tabs.size
    val actualIndex = tabs.indexOfFirst { it.id == activeTab }.coerceAtLeast(0)

    val coroutineScope = rememberCoroutineScope()
    val density = LocalDensity.current

    // Exact BottomNavBar / ViewTypeTabsRow matching layout dimensions
    val layoutWidth = 140.dp
    val bgWidth = 148.dp
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

    // Outer AnimatedScale: 1.02x on interaction
    val containerScale by animateFloatAsState(
        targetValue = if (isInteracting) 1.02f else 1.0f,
        animationSpec = tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)),
        label = "notesContainerScale"
    )

    // Pill scale on interaction: Symmetrical expansion
    val pillScaleX by animateFloatAsState(
        targetValue = if (isInteracting) 1.055f else 1.0f,
        animationSpec = tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)),
        label = "notesPillScaleX"
    )
    val pillScaleY by animateFloatAsState(
        targetValue = if (isInteracting) 1.20f else 1.0f,
        animationSpec = tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)),
        label = "notesPillScaleY"
    )

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
        label = "notesPillX"
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
        // Layer 1: Outer Container
        Box(
            modifier = Modifier
                .matchParentSize()
                .background(
                    color = colors.surface,
                    shape = CircleShape
                )
        )

        // Layer 2: Foreground & Draggable Content
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = horizontalPadding, vertical = verticalPadding)
                .pointerInput(tabs) {
                    awaitEachGesture {
                        val down = awaitFirstDown(requireUnconsumed = false)
                        isInteracting = true
                        onInteraction(true)

                        val initialX = down.position.x
                        hoverIndex = floor(initialX / layoutWidthPx).toInt().coerceIn(0, itemCount - 1)
                        val slotCenter = (hoverIndex!! * layoutWidthPx) + (layoutWidthPx / 2f)
                        touchOffsetFromCenterPx = initialX - slotCenter
                        dragOffsetPx = null

                        val pointerId = down.id

                        while (true) {
                            val event = awaitPointerEvent()
                            val change = event.changes.firstOrNull { it.id == pointerId } ?: break
                            if (!change.pressed) {
                                break
                            }
                            val currentPos = change.position
                            if (kotlin.math.abs(currentPos.x - down.position.x) > 4f) {
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
                // Master Background Pill
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
                                    fontSize = 13.5.sp,
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

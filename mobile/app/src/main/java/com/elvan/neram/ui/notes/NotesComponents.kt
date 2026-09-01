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
    ElvanSectionContainer {
        Surface(
            shape = HomeShapes.Card,
            color = colors.surface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onBackClick() }
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
                        contentDescription = "Back",
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
                    contentDescription = if (expanded) "Collapse" else "Expand",
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
                                text = unitKey,
                                style = HomeTypography.StatusBadge.copy(fontSize = 14.sp),
                                color = if (isAvailable) colors.textPrimary else colors.textSecondary
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(
                                if (isAvailable) Icons.AutoMirrored.Filled.OpenInNew else Icons.Default.Lock,
                                contentDescription = if (isAvailable) "Open" else "Not Available",
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
        Text(message, color = colors.textSecondary)
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = onRetry,
            colors = ButtonDefaults.buttonColors(containerColor = colors.accent)
        ) {
            Text("Go Back")
        }
    }
}

@Composable
fun NotesEmptyView(colors: HomeColors) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("No items here", color = colors.textSecondary)
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
                    contentDescription = if (expanded) "Collapse" else "Expand",
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
                                text = unitName,
                                style = HomeTypography.StatusBadge.copy(fontSize = 14.sp),
                                color = if (isAvailable) colors.textPrimary else colors.textSecondary
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(
                                if (isAvailable) Icons.AutoMirrored.Filled.OpenInNew else Icons.Default.Lock,
                                contentDescription = if (isAvailable) "Open" else "Not Available",
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
                        Text("No units added yet", color = colors.textSecondary, fontSize = 13.sp)
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

package com.elvan.rmdneram.ui.notes

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.data.model.NotesSubject
import com.elvan.rmdneram.ui.home.HomeColors

/**
 * NotesComponents - Reusable UI widgets for the Notes Screen.
 */

@Composable
fun FolderList(
    items: List<String>,
    colors: HomeColors,
    onClick: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(items) { item ->
            FolderItem(item, colors) { onClick(item) }
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
        onClick = onClick,
        shape = com.elvan.rmdneram.ui.home.HomeShapes.Item,
        color = colors.surface,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Folder,
                contentDescription = null,
                tint = colors.accent,
                modifier = Modifier.size(28.dp)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Text(
                text = name,
                style = com.elvan.rmdneram.ui.home.HomeTypography.PillTitle,
                color = colors.textPrimary,
                modifier = Modifier.weight(1f)
            )
            
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = null,
                tint = colors.textSecondary.copy(alpha = 0.5f),
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

@Composable
fun FilesList(
    subjects: List<NotesSubject>,
    colors: HomeColors,
    onLinkClick: (String) -> Unit,
    onNotUploaded: () -> Unit = {}
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(subjects) { subject ->
            SubjectItem(subject, colors, onLinkClick, onNotUploaded)
        }
        item { Spacer(modifier = Modifier.height(80.dp)) }
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
            shape = com.elvan.rmdneram.ui.home.HomeShapes.Card,
            color = colors.surface,
            modifier = Modifier.fillMaxWidth(),
            shadowElevation = 0.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expanded = !expanded }
                    .padding(horizontal = 16.dp, vertical = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Colored Indicator
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
                    style = com.elvan.rmdneram.ui.home.HomeTypography.PillTitle,
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
                    .padding(top = 8.dp), // Spacing between header and list
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Always show Unit 1 to Unit 5
                for (unitNumber in 1..5) {
                    val unitKey = "Unit $unitNumber"
                    val url = subject.units[unitKey] ?: subject.units["unit $unitNumber"] ?: ""
                    val isGoogleDrive = url.contains("drive.google.com", ignoreCase = true)
                    val isAvailable = isGoogleDrive && url.isNotBlank()
                    
                    Surface(
                        shape = RoundedCornerShape(12.dp),
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
                                style = com.elvan.rmdneram.ui.home.HomeTypography.StatusBadge.copy(fontSize = 14.sp),
                                color = if (isAvailable) colors.textPrimary else colors.textSecondary
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(
                                if (isAvailable) Icons.Default.OpenInNew else Icons.Default.Lock,
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
            modifier = Modifier.size(com.elvan.rmdneram.ui.home.HomeDimens.RefreshIndicatorSize),
            containerColor = colors.surface,
            indicatorColor = colors.textSecondary // Secondary Black
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

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
        contentPadding = PaddingValues(16.dp)
    ) {
        items(items) { item ->
            FolderItem(item, colors) { onClick(item) }
            HorizontalDivider(color = colors.glassBorder, thickness = 0.5.dp)
        }
    }
}

@Composable
fun FolderItem(
    name: String,
    colors: HomeColors,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 16.dp, horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            Icons.Default.Folder,
            contentDescription = null,
            tint = colors.accent,
            modifier = Modifier.size(28.dp)
        )
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Text(
            name,
            color = colors.textPrimary,
            fontSize = 17.sp,
            fontWeight = FontWeight.Normal,
            modifier = Modifier.weight(1f)
        )
        
        Icon(
            Icons.Default.ChevronRight,
            contentDescription = null, // decorative
            tint = colors.textSecondary.copy(alpha = 0.5f), // subtle arrow
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
fun FilesList(
    subjects: List<NotesSubject>,
    colors: HomeColors,
    onLinkClick: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(subjects) { subject ->
            SubjectItem(subject, colors, onLinkClick)
        }
        item { Spacer(modifier = Modifier.height(80.dp)) }
    }
}

@Composable
fun SubjectItem(
    subject: NotesSubject,
    colors: HomeColors,
    onLinkClick: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(colors.surface)
            .border(1.dp, colors.glassBorder, RoundedCornerShape(12.dp))
            .clickable { expanded = !expanded }
            .padding(16.dp)
    ) {
        // Header: Subject Name + Expand Icon
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                subject.name,
                color = colors.textPrimary,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.weight(1f)
            )

            Icon(
                if (expanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                contentDescription = if (expanded) "Collapse" else "Expand",
                tint = colors.textSecondary,
                modifier = Modifier.size(24.dp)
            )
        }

        // Expanded Content: Vertical List of Units
        if (expanded) {
            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = colors.glassBorder, thickness = 0.5.dp)
            Spacer(modifier = Modifier.height(12.dp))

            if (subject.units.isNotEmpty()) {
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    subject.units.forEach { (unitName, url) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(colors.inputBackground)
                                .clickable { onLinkClick(url) }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Description,
                                contentDescription = null, // decorative
                                tint = colors.accent,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                unitName,
                                color = colors.textPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            Icon(
                                Icons.Default.OpenInNew,
                                contentDescription = "Open",
                                tint = colors.textSecondary.copy(alpha = 0.6f),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            } else {
                Text(
                    "No materials available",
                    color = colors.textSecondary,
                    fontSize = 14.sp,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }
        }
    }
}

@Composable
fun NotesLoadingView(colors: HomeColors) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(color = colors.accent)
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

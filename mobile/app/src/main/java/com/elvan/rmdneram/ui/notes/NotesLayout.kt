package com.elvan.rmdneram.ui.notes

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeDimens
import com.elvan.rmdneram.ui.home.rememberStatusBarHeight

/**
 * Notes Layout - Structural component for the Notes Screen.
 */
@Composable
fun NotesMainLayout(
    uiState: NotesUiState,
    path: List<String>,
    rootFolders: List<String>,
    colors: HomeColors,
    onBackClick: () -> Unit,
    onFolderClick: (String) -> Unit,
    onFileClick: (String) -> Unit,
    onNotUploaded: () -> Unit,
    onRetry: () -> Unit
) {
    val statusBarHeight = rememberStatusBarHeight()
    val topPadding = statusBarHeight + HomeDimens.ContentPaddingTop

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        // Back button row - only visible when inside folders (path not empty)
        if (path.isNotEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    // Use exact top padding as base and add just a bit for spacing
                    .padding(start = 24.dp, end = 12.dp, top = topPadding, bottom = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Circle Back Button (matching Calendar style)
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(colors.surface)
                        .clickable { onBackClick() },
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
                
                // Current folder name
                Text(
                    text = path.last(),
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 18.sp
                    ),
                    color = colors.textPrimary
                )
            }
        }

        // Content
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(top = if (path.isEmpty()) topPadding else 0.dp)
        ) {
            if (path.isEmpty()) {
                // ROOT: Main Dept List
                FolderList(rootFolders, colors, onFolderClick)
            } else {
                // CONTENT: Based on UiState
                when (val state = uiState) {
                    is NotesUiState.Loading -> NotesLoadingView(colors)
                    is NotesUiState.Error -> NotesErrorView(state.message, colors, onRetry)
                    is NotesUiState.Browser -> {
                        when (val content = state.content) {
                            is NotesViewContent.Folders -> {
                                FolderList(content.names, colors, onFolderClick)
                            }
                            is NotesViewContent.Files -> {
                                FilesList(content.subjects, colors, onFileClick, onNotUploaded)
                            }
                            is NotesViewContent.Empty -> NotesEmptyView(colors)
                        }
                    }
                    is NotesUiState.Empty -> {
                        NotesEmptyView(colors)
                    }
                }
            }
        }
    }
}

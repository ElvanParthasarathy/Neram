package com.elvan.rmdneram.ui.notes

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.HomeColors

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
    onRetry: () -> Unit
) {
    Scaffold(
        containerColor = colors.background,
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(colors.background)
                    .statusBarsPadding()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Back Button if path is not empty
                    if (path.isNotEmpty()) {
                        IconButton(
                            onClick = onBackClick,
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = colors.accent
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                    }

                    // Title: Current Folder Name or "Browse"
                    val title = if (path.isEmpty()) "Browse" else path.last()
                    
                    Text(
                        text = title,
                        color = colors.textPrimary,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
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
                                FilesList(content.subjects, colors, onFileClick)
                            }
                            is NotesViewContent.Empty -> NotesEmptyView(colors)
                        }
                    }
                    is NotesUiState.Empty -> {
                        // Should handle or default to empty view
                        NotesEmptyView(colors)
                    }
                }
            }
        }
    }
}

package com.elvan.neram.ui.notes

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.home.HomeColors
import com.elvan.neram.ui.home.HomeDimens
import com.elvan.neram.ui.components.shell.*

/**
 * Notes Layout - Structural component for the Notes Screen.
 */
@Composable
fun NotesMainLayout(
    uiState: NotesUiState,
    path: List<String>,
    rootFolders: List<String>,
    colors: HomeColors,
    notesMode: String,
    onBackClick: () -> Unit,
    onFolderClick: (String) -> Unit,
    onFileClick: (String) -> Unit,
    onNotUploaded: () -> Unit,
    onRetry: () -> Unit,
    onDriveFolderClick: (com.elvan.neram.data.model.DriveFolder) -> Unit = {},
    onDriveFileClick: (com.elvan.neram.data.model.DriveFile) -> Unit = {},
    scrollState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val saveableStateHolder = androidx.compose.runtime.saveable.rememberSaveableStateHolder()

    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        // Unified animated content slide on folder enter/exit (both Fetch and Folder modes)
        AnimatedContent(
            targetState = Pair(path, uiState),
            transitionSpec = {
                val isDeeper = targetState.first.size > initialState.first.size
                val isShallower = targetState.first.size < initialState.first.size
                if (isDeeper) {
                    // Entering folder: slide in from right (+width), exit to left (-width)
                    (slideInHorizontally(
                        initialOffsetX = { width -> (width * 0.85f).toInt() },
                        animationSpec = spring(stiffness = Spring.StiffnessMediumLow, dampingRatio = Spring.DampingRatioNoBouncy)
                    ) + fadeIn(animationSpec = tween(220))) togetherWith
                    (slideOutHorizontally(
                        targetOffsetX = { width -> -(width * 0.35f).toInt() },
                        animationSpec = spring(stiffness = Spring.StiffnessMediumLow, dampingRatio = Spring.DampingRatioNoBouncy)
                    ) + fadeOut(animationSpec = tween(180)))
                } else if (isShallower) {
                    // Going back: slide in from left (-width), exit to right (+width)
                    (slideInHorizontally(
                        initialOffsetX = { width -> -(width * 0.35f).toInt() },
                        animationSpec = spring(stiffness = Spring.StiffnessMediumLow, dampingRatio = Spring.DampingRatioNoBouncy)
                    ) + fadeIn(animationSpec = tween(220))) togetherWith
                    (slideOutHorizontally(
                        targetOffsetX = { width -> (width * 0.85f).toInt() },
                        animationSpec = spring(stiffness = Spring.StiffnessMediumLow, dampingRatio = Spring.DampingRatioNoBouncy)
                    ) + fadeOut(animationSpec = tween(180)))
                } else {
                    fadeIn(animationSpec = tween(200)) togetherWith fadeOut(animationSpec = tween(200))
                }
            },
            contentKey = { it.first.joinToString("/") },
            label = "NotesContentSlide"
        ) { (animPath, animState) ->
            val pathKey = animPath.joinToString("/")
            saveableStateHolder.SaveableStateProvider(pathKey) {
                NotesContentView(
                    uiState = animState,
                    path = animPath,
                    rootFolders = rootFolders,
                    colors = colors,
                    onBackClick = onBackClick,
                    onFolderClick = onFolderClick,
                    onFileClick = onFileClick,
                    onNotUploaded = onNotUploaded,
                    onRetry = onRetry,
                    onDriveFolderClick = onDriveFolderClick,
                    onDriveFileClick = onDriveFileClick,
                    scrollState = scrollState
                )
            }
        }
    }
}

/** Shared content renderer used by both folder and fetch modes */
@Composable
private fun NotesContentView(
    uiState: NotesUiState,
    path: List<String>,
    rootFolders: List<String>,
    colors: HomeColors,
    onBackClick: () -> Unit,
    onFolderClick: (String) -> Unit,
    onFileClick: (String) -> Unit,
    onNotUploaded: () -> Unit,
    onRetry: () -> Unit,
    onDriveFolderClick: (com.elvan.neram.data.model.DriveFolder) -> Unit,
    onDriveFileClick: (com.elvan.neram.data.model.DriveFile) -> Unit,
    scrollState: androidx.compose.foundation.lazy.LazyListState
) {
    val listState = scrollState

    if (uiState is NotesUiState.Empty) {
        FolderList(
            items = rootFolders,
            colors = colors,
            listState = listState,
            path = path,
            onBackClick = onBackClick,
            onClick = onFolderClick
        )
    } else {
        when (val state = uiState) {
            is NotesUiState.Loading -> NotesLoadingView(colors)
            is NotesUiState.Error -> NotesErrorView(state.message, colors, onRetry)
            is NotesUiState.Browser -> {
                when (val content = state.content) {
                    is NotesViewContent.Folders -> {
                        FolderList(
                            items = content.names,
                            colors = colors,
                            listState = listState,
                            path = path,
                            onBackClick = onBackClick,
                            onClick = onFolderClick
                        )
                    }
                    is NotesViewContent.Files -> {
                        FilesList(
                            subjects = content.subjects,
                            colors = colors,
                            listState = listState,
                            path = path,
                            onBackClick = onBackClick,
                            onLinkClick = onFileClick,
                            onNotUploaded = onNotUploaded
                        )
                    }
                    is NotesViewContent.DriveView -> {
                        DriveList(
                            folders = content.folders,
                            files = content.files,
                            subjects = content.subjects,
                            colors = colors,
                            isRoot = path.isEmpty(),
                            listState = listState,
                            path = path,
                            onBackClick = onBackClick,
                            onFolderClick = onDriveFolderClick,
                            onFileClick = onDriveFileClick
                        )
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

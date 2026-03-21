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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
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
    notesMode: String,
    onBackClick: () -> Unit,
    onFolderClick: (String) -> Unit,
    onFileClick: (String) -> Unit,
    onNotUploaded: () -> Unit,
    onRetry: () -> Unit,
    onDriveFolderClick: (com.elvan.rmdneram.data.model.DriveFolder) -> Unit = {},
    onDriveFileClick: (com.elvan.rmdneram.data.model.DriveFile) -> Unit = {}
) {
    val statusBarHeight = rememberStatusBarHeight()
    val topPadding = statusBarHeight + HomeDimens.ContentPaddingTop

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        if (notesMode == "folder") {
            // FOLDER MODE: Header handled by TopMenuBar, content has slide animations
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = topPadding)
            ) {
                AnimatedContent(
                    targetState = Pair(path.size, uiState),
                    transitionSpec = {
                        if (targetState.first > initialState.first) {
                            slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
                        } else if (targetState.first < initialState.first) {
                            slideInHorizontally { -it } togetherWith slideOutHorizontally { it }
                        } else {
                            fadeIn() togetherWith fadeOut()
                        }
                    },
                    contentKey = { it.first },
                    label = "ContentSlide"
                ) { (_, animState) ->
                    NotesContentView(
                        uiState = animState,
                        path = path,
                        rootFolders = rootFolders,
                        colors = colors,
                        onFolderClick = onFolderClick,
                        onFileClick = onFileClick,
                        onNotUploaded = onNotUploaded,
                        onRetry = onRetry,
                        onDriveFolderClick = onDriveFolderClick,
                        onDriveFileClick = onDriveFileClick
                    )
                }
            }
        } else {
            // FETCH MODE: Own chevron header, no animations
            if (path.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 24.dp, end = 12.dp, top = topPadding, bottom = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
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
                    Text(
                        text = path.last(),
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Medium,
                            fontSize = if (path.last().length > 20) 14.sp else 16.sp,
                            letterSpacing = 0.sp
                        ),
                        color = colors.textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = if (path.isEmpty()) topPadding else 0.dp)
            ) {
                NotesContentView(
                    uiState = uiState,
                    path = path,
                    rootFolders = rootFolders,
                    colors = colors,
                    onFolderClick = onFolderClick,
                    onFileClick = onFileClick,
                    onNotUploaded = onNotUploaded,
                    onRetry = onRetry,
                    onDriveFolderClick = onDriveFolderClick,
                    onDriveFileClick = onDriveFileClick
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
    onFolderClick: (String) -> Unit,
    onFileClick: (String) -> Unit,
    onNotUploaded: () -> Unit,
    onRetry: () -> Unit,
    onDriveFolderClick: (com.elvan.rmdneram.data.model.DriveFolder) -> Unit,
    onDriveFileClick: (com.elvan.rmdneram.data.model.DriveFile) -> Unit
) {
    if (uiState is NotesUiState.Empty) {
        FolderList(rootFolders, colors, onClick = onFolderClick)
    } else {
        when (val state = uiState) {
            is NotesUiState.Loading -> NotesLoadingView(colors)
            is NotesUiState.Error -> NotesErrorView(state.message, colors, onRetry)
            is NotesUiState.Browser -> {
                when (val content = state.content) {
                    is NotesViewContent.Folders -> {
                        FolderList(content.names, colors, onClick = onFolderClick)
                    }
                    is NotesViewContent.Files -> {
                        FilesList(content.subjects, colors, onLinkClick = onFileClick, onNotUploaded = onNotUploaded)
                    }
                    is NotesViewContent.DriveView -> {
                        DriveList(
                            folders = content.folders,
                            files = content.files,
                            subjects = content.subjects,
                            colors = colors,
                            isRoot = path.isEmpty(),
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

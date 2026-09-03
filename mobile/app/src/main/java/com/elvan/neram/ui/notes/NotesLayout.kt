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
    serverNotesMode: String,
    onNotesModeChange: (String) -> Unit,
    onBackClick: () -> Unit,
    onFolderClick: (String) -> Unit,
    onFileClick: (String) -> Unit,
    onNotUploaded: () -> Unit,
    onRetry: () -> Unit,
    onDriveFolderClick: (com.elvan.neram.data.model.DriveFolder) -> Unit = {},
    onDriveFileClick: (com.elvan.neram.data.model.DriveFile) -> Unit = {},
    scrollState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState(),
    drivePath: List<com.elvan.neram.data.model.DriveFolder> = emptyList()
) {
    val isRoot = if (notesMode == "folder") drivePath.size <= 1 else path.isEmpty()

    val headerContent: (@Composable () -> Unit)? = if (isRoot) {
        {
            ElvanSectionContainer(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                NotesTypeTabsRow(
                    activeTab = notesMode,
                    onTabSelected = onNotesModeChange,
                    serverNotesMode = serverNotesMode,
                    colors = colors,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
        }
    } else null

    NotesContentView(
        uiState = uiState,
        path = path,
        rootFolders = rootFolders,
        colors = colors,
        headerContent = headerContent,
        isRoot = isRoot,
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

/** Shared content renderer used by both folder and fetch modes */
@Composable
private fun NotesContentView(
    uiState: NotesUiState,
    path: List<String>,
    rootFolders: List<String>,
    colors: HomeColors,
    headerContent: (@Composable () -> Unit)? = null,
    isRoot: Boolean = true,
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
            headerContent = headerContent,
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
                            headerContent = headerContent,
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
                            isRoot = isRoot,
                            listState = listState,
                            path = path,
                            onBackClick = onBackClick,
                            headerContent = headerContent,
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

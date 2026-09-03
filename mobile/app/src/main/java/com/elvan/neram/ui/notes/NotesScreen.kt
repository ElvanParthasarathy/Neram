package com.elvan.neram.ui.notes

import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.neram.ui.home.HomeTypography
import com.elvan.neram.ui.home.rememberHomeColors
import com.elvan.neram.ui.theme.LocalAppLanguage

/**
 * NotesScreen - Logic Coordinator
 * 
 * Responsibilities:
 * - Collects State from ViewModel
 * - Manages BackHandler interactions
 * - Handles Intent dispatching (URL opening)
 * - Delegates rendering to NotesMainLayout
 */
@Composable
fun NotesScreen(
    onBack: () -> Unit,
    viewModel: NotesViewModel = viewModel(),
    scrollState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState(),
    screenDepth: Int = 0,
    onNavigateToFolder: ((depth: Int) -> Unit)? = null
) {
    val isRoot = screenDepth == 0
    val uiState by viewModel.uiState.collectAsState()
    val path by viewModel.path.collectAsState()
    val notesMode by viewModel.notesMode.collectAsState()
    val serverNotesMode by viewModel.serverNotesMode.collectAsState()
    val drivePath by viewModel.drivePath.collectAsState()
    val driveFolders by viewModel.driveFolders.collectAsState()
    val driveFiles by viewModel.driveFiles.collectAsState()
    val driveSubjects by viewModel.driveSubjects.collectAsState()
    val colors = rememberHomeColors()
    val context = LocalContext.current
    val lang = LocalAppLanguage.current
    
    var showNotUploadedDialog by remember { mutableStateOf(false) }

    val depts = listOf("ECE", "AIML", "CSBS", "CSE", "IT", "SNH")

    // Back navigation behavior (only active when inside a subpage)
    BackHandler(enabled = !isRoot) {
        onBack()
    }

    fun openUrl(url: String) {
        com.elvan.neram.utils.IntentUtils.openUrl(context, url)
    }
    
    // Not Uploaded Dialog
    if (showNotUploadedDialog) {
        AlertDialog(
            onDismissRequest = { showNotUploadedDialog = false },
            title = { Text(K.notUploadedTitle.tr(lang), style = HomeTypography.PillTitle) },
            text = { Text(K.notUploadedMessage.tr(lang), style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Button(onClick = { showNotUploadedDialog = false }) {
                    Text(K.ok.tr(lang), style = HomeTypography.StatusBadge)
                }
            },
            containerColor = colors.surface,
            titleContentColor = colors.textPrimary,
            textContentColor = colors.textSecondary
        )
    }

    // Exact state for this screen's depth (locks content so exiting screens NEVER mutate or double-slide)
    val effectiveUiState = if (notesMode == "folder") {
        viewModel.getDriveViewForDepth(screenDepth)
    } else {
        if (screenDepth == 0) {
            NotesUiState.Empty
        } else {
            when (uiState) {
                is NotesUiState.Loading -> NotesUiState.Loading
                is NotesUiState.Error -> uiState
                else -> viewModel.getFetchContentForDepth(screenDepth)
            }
        }
    }

    val currentPathDisplay = if (screenDepth == 0) {
        emptyList()
    } else if (notesMode == "folder") {
        drivePath.take(screenDepth + 1).map { it.name }.drop(1)
    } else {
        path.take(screenDepth)
    }

    val effectiveDrivePath = if (screenDepth == 0) {
        listOf(com.elvan.neram.data.model.DriveFolder("root", "Notes Drive", "root"))
    } else {
        drivePath.take(screenDepth + 1)
    }

    LaunchedEffect(currentPathDisplay) {
        scrollState.scrollToItem(0, 0)
    }

    NotesMainLayout(
        uiState = effectiveUiState,
        path = currentPathDisplay,
        rootFolders = depts,
        colors = colors,
        notesMode = notesMode,
        serverNotesMode = serverNotesMode,
        onNotesModeChange = { viewModel.setNotesMode(it) },
        onBackClick = onBack,
        onFolderClick = { folderName ->
            val nextDepth = screenDepth + 1
            viewModel.enterFolder(folderName)
            onNavigateToFolder?.invoke(nextDepth)
        },
        onFileClick = { openUrl(it) },
        onNotUploaded = { showNotUploadedDialog = true },
        onRetry = { viewModel.navigateUp() },
        onDriveFolderClick = { folder ->
            val nextDepth = screenDepth + 1
            viewModel.enterDriveFolder(folder)
            onNavigateToFolder?.invoke(nextDepth)
        },
        onDriveFileClick = { openUrl(it.link) },
        scrollState = scrollState,
        drivePath = effectiveDrivePath
    )
}

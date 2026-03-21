package com.elvan.rmdneram.ui.notes

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
import com.elvan.rmdneram.ui.home.HomeTypography
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage

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
    viewModel: NotesViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val path by viewModel.path.collectAsState()
    val notesMode by viewModel.notesMode.collectAsState()
    val drivePath by viewModel.drivePath.collectAsState()
    val colors = rememberHomeColors()
    val context = LocalContext.current
    val lang = LocalAppLanguage.current
    
    var showNotUploadedDialog by remember { mutableStateOf(false) }

    val depts = listOf("ECE", "AIML", "CSBS", "CSE", "IT", "SNH")

    // Back navigation behavior
    BackHandler(enabled = if (notesMode == "folder") drivePath.size > 1 else path.isNotEmpty()) {
        viewModel.navigateUp()
    }

    fun openUrl(url: String) {
        com.elvan.rmdneram.utils.IntentUtils.openUrl(context, url)
    }
    
    // Not Uploaded Dialog
    if (showNotUploadedDialog) {
        AlertDialog(
            onDismissRequest = { showNotUploadedDialog = false },
            title = { Text(AppStrings.Notes.notUploadedTitle(lang), style = HomeTypography.PillTitle) },
            text = { Text(AppStrings.Notes.notUploadedMessage(lang), style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Button(onClick = { showNotUploadedDialog = false }) {
                    Text(AppStrings.Home.ok(lang), style = HomeTypography.StatusBadge)
                }
            },
            containerColor = colors.surface,
            titleContentColor = colors.textPrimary,
            textContentColor = colors.textSecondary
        )
    }

    // Derived path display
    val currentPathDisplay = if (notesMode == "folder") {
        drivePath.map { it.name }.drop(1)
    } else {
        path
    }

    NotesMainLayout(
        uiState = uiState,
        path = currentPathDisplay,
        rootFolders = depts,
        colors = colors,
        notesMode = notesMode,
        onBackClick = {
            if (notesMode == "folder") {
                if (drivePath.size == 1) onBack() else viewModel.navigateUp()
            } else {
                if (path.isEmpty()) onBack() else viewModel.navigateUp()
            }
        },
        onFolderClick = { viewModel.enterFolder(it) },
        onFileClick = { openUrl(it) },
        onNotUploaded = { showNotUploadedDialog = true },
        onRetry = { viewModel.navigateUp() },
        onDriveFolderClick = { viewModel.enterDriveFolder(it) },
        onDriveFileClick = { openUrl(it.link) }
    )
}

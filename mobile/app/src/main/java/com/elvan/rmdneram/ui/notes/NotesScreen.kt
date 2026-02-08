package com.elvan.rmdneram.ui.notes

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
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
    val colors = rememberHomeColors()
    val context = LocalContext.current
    val lang = LocalAppLanguage.current
    
    var showNotUploadedDialog by remember { mutableStateOf(false) }

    val depts = listOf("ECE", "AIML", "CSBS", "CSE", "IT", "SNH")

    // Back logic
    BackHandler(enabled = path.isNotEmpty()) {
        viewModel.navigateUp()
    }

    fun openUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // Handle error silently or show toast if needed
            android.util.Log.e("NotesScreen", "Failed to open URL: $url", e)
        }
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

    NotesMainLayout(
        uiState = uiState,
        path = path,
        rootFolders = depts,
        colors = colors,
        onBackClick = { 
            if (path.isEmpty()) onBack() else viewModel.navigateUp() 
        },
        onFolderClick = { viewModel.enterFolder(it) },
        onFileClick = { openUrl(it) },
        onNotUploaded = { showNotUploadedDialog = true },
        onRetry = { viewModel.navigateUp() }
    )
}

package com.elvan.rmdneram.ui.notes

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.rmdneram.ui.home.rememberHomeColors

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
        onRetry = { viewModel.navigateUp() }
    )
}

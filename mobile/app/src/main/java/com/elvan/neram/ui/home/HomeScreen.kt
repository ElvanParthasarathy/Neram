package com.elvan.neram.ui.home

import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.neram.data.model.*

import com.elvan.neram.ui.common.ScheduleLogic
import com.elvan.neram.ui.theme.NeramTheme
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.toMozhiFullDate
import com.elvan.neram.extensions.showSeslDatePickerDialog
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneOffset

/**
 * HomeScreen - Logic-Only Coordinator
 * 
 * This file contains ONLY:
 * - State management and ViewModel interactions
 * - Dialog/overlay logic (DatePicker, PlacementModal)
 * - Event deduplication logic
 * 
 * All UI structure is delegated to HomeLayout.kt
 * All UI components are in HomeComponents.kt
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalAnimationApi::class)
@Composable

fun HomeScreen(
    onLogout: () -> Unit = {},
    isOffline: Boolean = false,
    userProfile: com.elvan.neram.data.model.UserProfile? = null,
    onProfileClick: () -> Unit = {},
    onNavigateToTab: (com.elvan.neram.ui.navigation.NavTab) -> Unit = {},
    onNavigateToScreen: (String) -> Unit = {},
    viewModel: HomeViewModel = viewModel(),
    scrollState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState(),
    pullRefreshState: androidx.compose.material3.pulltorefresh.PullToRefreshState? = null
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    val uiState by viewModel.uiState.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    
    // Optimized: Observe derived state flows directly
    val scheduleState by viewModel.scheduleState.collectAsState()
    val todayEvents by viewModel.todayEvents.collectAsState()
    val academicCalendarEvents by viewModel.academicCalendarEvents.collectAsState()
    val todayUpdate by viewModel.todayUpdate.collectAsState()
    val activeFeatureCards by viewModel.activeFeatureCards.collectAsState()
    
    var showDatePicker by remember { mutableStateOf(false) }
    var showOfflineDialog by remember { mutableStateOf(false) }
    
    // Pull to refresh - Use hoisted state if provided, else remember local
    val effectivePullRefreshState = pullRefreshState ?: rememberPullToRefreshState()
    val scope = rememberCoroutineScope()
    var isSimulatingOfflineRefresh by remember { mutableStateOf(false) }

    // =========================================================================
    // DISPLAY CONFIG (for Schedule section)
    // =========================================================================
    val displayConfig = remember(scheduleState, lang) { ScheduleLogic.calculateDisplayConfig(scheduleState, lang) }

    // Academic Calendar: Show ALL global calendar events without deduplication.
    // This matches the web app behavior (Home.jsx uses globalEvents directly).
    // The exam/event cards in the Schedule section are a separate concern.
    val showAcademicCalendarSection = true
    
    // =========================================================================
    // DIALOGS
    // =========================================================================
    
    // Offline Dialog
    if (showOfflineDialog) {
        val lang = LocalAppLanguage.current
        AlertDialog(
            onDismissRequest = { showOfflineDialog = false },
            title = { Text(K.offline.tr(lang), style = HomeTypography.PillTitle) },
            text = { Text(K.offlineMessage.tr(lang), style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Button(
                    onClick = { showOfflineDialog = false },
                    shape = HomeShapes.Pill,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.accent,
                        contentColor = Color.White
                    )
                ) {
                    Text(K.ok.tr(lang), style = HomeTypography.StatusBadge)
                }
            },
            containerColor = colors.surface,
            shape = HomeShapes.Item
        )
    }
    
    // =========================================================================
    // LOADING GATE REMOVED - Let Skeleton UI handle loading state
    // =========================================================================

    
    // =========================================================================
    // MAIN LAYOUT (Delegated)
    // =========================================================================
    val effectiveLang = com.elvan.neram.ui.mozhiyaakkam.K.getEffectiveLanguage(com.elvan.neram.ui.theme.LocalAppLanguage.current, androidx.compose.ui.platform.LocalContext.current)
    val appLocale = if (effectiveLang == com.elvan.neram.ui.mozhiyaakkam.K.TAMIL) java.util.Locale("ta", "IN") else java.util.Locale.US
    val profileLoaderCompleted by viewModel.profileLoaderCompleted.collectAsState()
    
    HomeMainLayout(
        uiState = uiState,
        scheduleState = scheduleState,
        filteredEvents = academicCalendarEvents,
        todayUpdate = todayUpdate,
        formattedDate = viewModel.getFormattedDate(effectiveLang),
        showAcademicCalendarSection = showAcademicCalendarSection,
        isOffline = isOffline,
        colors = colors,
        pullRefreshState = effectivePullRefreshState,
        isRefreshing = uiState.isSyncing || isSimulatingOfflineRefresh,
        onRefresh = {
            if (isOffline) {
                scope.launch {
                    isSimulatingOfflineRefresh = true
                    delay(1500)
                    isSimulatingOfflineRefresh = false
                    showOfflineDialog = true
                }
            } else {
                viewModel.onRefresh()
            }
        },
        onDateClick = { showDatePicker = true },
        selectedDate = selectedDate,
        onDateSelected = { viewModel.onDateSelected(it) },
        onSaveUpdate = { viewModel.saveDailyUpdate(it) },
        onSaveNotice = { viewModel.saveGeneralNotice(it) },
        profileLoaderCompleted = profileLoaderCompleted,
        scrollState = scrollState,
        featureCards = activeFeatureCards,
        onDismissFeatureCard = { viewModel.dismissFeatureCard(it) },
        onFeatureCardAction = { route ->
            when (route.lowercase().trim()) {
                "notes" -> onNavigateToTab(com.elvan.neram.ui.navigation.NavTab.Notes)
                "schedule" -> onNavigateToTab(com.elvan.neram.ui.navigation.NavTab.Schedule)
                "calendar" -> onNavigateToTab(com.elvan.neram.ui.navigation.NavTab.Calendar)
                "settings", "settings/language", "language" -> onNavigateToScreen("language")
                "profile" -> onNavigateToScreen("profile")
                "display" -> onNavigateToScreen("display")
                "about", "about_app" -> onNavigateToScreen("about_app")
                else -> {
                    if (route.startsWith("http://") || route.startsWith("https://")) {
                        try {
                            val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(route))
                            context.startActivity(intent)
                        } catch (e: Exception) {}
                    } else if (route.isNotBlank()) {
                        onNavigateToScreen(route)
                    }
                }
            }
        },
        onProfileLoaderCompleted = { viewModel.markProfileLoaderCompleted() },
        onProfileClick = onProfileClick
    )
    
    // =========================================================================
    // DATE PICKER DIALOG (Samsung One UI Style)
    // =========================================================================
    if (showDatePicker) {
        com.elvan.neram.ui.common.NeramDatePickerDialog(
            initialDate = selectedDate,
            onDateSelected = { date ->
                viewModel.onDateSelected(date)
            },
            onDismissRequest = { showDatePicker = false }
        )
    }
    
    // =========================================================================
    // PLACEMENT MODAL
    // =========================================================================

}


@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    NeramTheme {
        // Preview would need mock ViewModel
    }
}

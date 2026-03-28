package com.elvan.rmdneram.ui.home

import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.rmdneram.data.model.*

import com.elvan.rmdneram.ui.common.ScheduleLogic
import com.elvan.rmdneram.ui.theme.NeramTheme
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
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
    userProfile: com.elvan.rmdneram.data.model.UserProfile? = null,
    onProfileClick: () -> Unit = {},
    viewModel: HomeViewModel = viewModel(),
    pullRefreshState: androidx.compose.material3.pulltorefresh.PullToRefreshState? = null
) {
    val colors = rememberHomeColors()
    val uiState by viewModel.uiState.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    
    // Optimized: Observe derived state flows directly
    val scheduleState by viewModel.scheduleState.collectAsState()
    val todayEvents by viewModel.todayEvents.collectAsState()
    val academicCalendarEvents by viewModel.academicCalendarEvents.collectAsState()
    val todayUpdate by viewModel.todayUpdate.collectAsState()
    
    var showDatePicker by remember { mutableStateOf(false) }
    var showOfflineDialog by remember { mutableStateOf(false) }
    
    // Pull to refresh - Use hoisted state if provided, else remember local
    val effectivePullRefreshState = pullRefreshState ?: rememberPullToRefreshState()
    val scope = rememberCoroutineScope()
    var isSimulatingOfflineRefresh by remember { mutableStateOf(false) }

    // =========================================================================
    // EVENT DEDUPLICATION LOGIC
    // =========================================================================
    // Academic Calendar section shows ONLY global calendar events (not Event Manager events).
    // Event Manager events (FullDay/HalfDay) are shown as big cards in the Schedule section.
    // We still deduplicate exam events that are already shown as big cards.
    val displayConfig = remember(scheduleState) { ScheduleLogic.calculateDisplayConfig(scheduleState) }
    
    val filteredEvents = remember(academicCalendarEvents, displayConfig, scheduleState) {
        if (academicCalendarEvents.isEmpty()) return@remember academicCalendarEvents

        academicCalendarEvents.filter { event ->
            val isFullDayRedundant = displayConfig.showFullDayEvent && scheduleState.fullDayEvent?.let { 
                event.id == it.id || event.title == it.title 
            } == true
            
            val isHalfDayRedundant = displayConfig.showHalfDayEvent && scheduleState.halfDayEvent?.let { 
                event.id == it.id || event.title == it.title 
            } == true
            
            val isExamRedundant = displayConfig.showExamCard && scheduleState.activeExamPeriod?.let { exam -> 
                event.title.contains(exam.title, ignoreCase = true) 
            } == true
            
            !isFullDayRedundant && !isHalfDayRedundant && !isExamRedundant
        }
    }

    // Visibility Logic:
    // 1. If academicCalendarEvents is empty -> Show "No events declared"
    // 2. If academicCalendarEvents is NOT empty but filteredEvents IS empty -> HIDE section
    // 3. If filteredEvents is NOT empty -> Show Calendar + List
    val showAcademicCalendarSection = academicCalendarEvents.isEmpty() || filteredEvents.isNotEmpty()
    
    // =========================================================================
    // DIALOGS
    // =========================================================================
    
    // Offline Dialog
    if (showOfflineDialog) {
        val lang = LocalAppLanguage.current
        AlertDialog(
            onDismissRequest = { showOfflineDialog = false },
            title = { Text(AppStrings.Home.offline(lang), style = HomeTypography.PillTitle) },
            text = { Text(AppStrings.Home.offlineMessage(lang), style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Button(
                    onClick = { showOfflineDialog = false },
                    shape = HomeShapes.Pill,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.accent,
                        contentColor = Color.White
                    )
                ) {
                    Text(AppStrings.Home.ok(lang), style = HomeTypography.StatusBadge)
                }
            },
            containerColor = colors.surface,
            titleContentColor = colors.textPrimary,
            textContentColor = colors.textSecondary,
            shape = HomeShapes.Item
        )
    }
    
    // =========================================================================
    // LOADING GATE REMOVED - Let Skeleton UI handle loading state
    // =========================================================================

    
    // =========================================================================
    // MAIN LAYOUT (Delegated)
    // =========================================================================
    val profileLoaderCompleted by viewModel.profileLoaderCompleted.collectAsState()
    
    val context = androidx.compose.ui.platform.LocalContext.current
    val langPref = com.elvan.rmdneram.ui.theme.LocalAppLanguage.current
    val appLocale = remember(langPref) {
        if (com.elvan.rmdneram.ui.theme.AppStrings.getEffectiveLanguage(langPref, context) == com.elvan.rmdneram.ui.theme.AppStrings.TAMIL) java.util.Locale("ta", "IN") else java.util.Locale.ENGLISH
    }
    
    HomeMainLayout(
        uiState = uiState,
        scheduleState = scheduleState,
        filteredEvents = filteredEvents,
        todayUpdate = todayUpdate,
        formattedDate = viewModel.getFormattedDate(appLocale),
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
        onProfileLoaderCompleted = { viewModel.markProfileLoaderCompleted() },
        onProfileClick = onProfileClick
    )
    
    // =========================================================================
    // DATE PICKER DIALOG
    // =========================================================================
    if (showDatePicker) {
        key(selectedDate) {
            val config = androidx.compose.ui.platform.LocalConfiguration.current
            val isLandscape = config.orientation == android.content.res.Configuration.ORIENTATION_LANDSCAPE
            val datePickerState = rememberDatePickerState(
                initialSelectedDateMillis = selectedDate.atStartOfDay(ZoneOffset.UTC)
                    .toInstant().toEpochMilli(),
                initialDisplayMode = if (isLandscape) DisplayMode.Input else DisplayMode.Picker
            )
            
            // Force correct mode when orientation changes while picker is open
            LaunchedEffect(isLandscape) {
                datePickerState.displayMode = if (isLandscape) DisplayMode.Input else DisplayMode.Picker
            }
            
            DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                    confirmButton = {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(start = HomeDimens.SpacingMd, end = HomeDimens.SpacingMd, bottom = HomeDimens.SpacingMd),
                            horizontalArrangement = Arrangement.spacedBy(HomeDimens.SpacingMd)
                        ) {
                            Button(
                                onClick = { showDatePicker = false },
                                shape = HomeShapes.Pill,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.subtleBackground,
                                    contentColor = colors.textSecondary
                                ),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Cancel", style = HomeTypography.PillButton)
                            }
                            Button(
                                onClick = {
                                    datePickerState.selectedDateMillis?.let { millis ->
                                        val date = Instant.ofEpochMilli(millis)
                                            .atZone(ZoneOffset.UTC)
                                            .toLocalDate()
                                        viewModel.onDateSelected(date)
                                    }
                                    showDatePicker = false
                                },
                                shape = HomeShapes.Pill,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.accent,
                                    contentColor = Color.White
                                ),
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("OK", style = HomeTypography.PillButton)
                            }
                        }
                    },
                    dismissButton = null,
                    colors = DatePickerDefaults.colors(
                        containerColor = colors.surface,
                    )
                ) {
                    DatePicker(
                        state = datePickerState,
                        showModeToggle = false,
                        title = {
                            Text(
                                text = com.elvan.rmdneram.ui.theme.AppStrings.Home.selectDate(com.elvan.rmdneram.ui.theme.AppStrings.getEffectiveLanguage(com.elvan.rmdneram.ui.theme.LocalAppLanguage.current, androidx.compose.ui.platform.LocalContext.current)),
                                modifier = Modifier.padding(start = 24.dp, end = 12.dp, top = 16.dp),
                                style = MaterialTheme.typography.labelLarge, // Standard DatePicker Title Style
                                color = colors.accent
                            )
                        },
                        colors = DatePickerDefaults.colors(
                            containerColor = colors.surface,
                            titleContentColor = colors.accent,
                            headlineContentColor = colors.textPrimary,
                            weekdayContentColor = colors.textSecondary,
                            subheadContentColor = colors.textSecondary,
                            yearContentColor = colors.textSecondary,
                            currentYearContentColor = colors.accent,
                            selectedYearContentColor = Color.White,
                            selectedYearContainerColor = colors.accent,
                            dayContentColor = colors.textPrimary,
                            selectedDayContainerColor = colors.accent,
                            selectedDayContentColor = Color.White,
                            todayContentColor = colors.accent,
                            todayDateBorderColor = colors.accent
                        )
                    )
                }
        }
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

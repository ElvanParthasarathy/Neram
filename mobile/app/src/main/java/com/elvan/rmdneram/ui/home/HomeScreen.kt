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
import com.elvan.rmdneram.ui.home.components.PlacementModal
import com.elvan.rmdneram.ui.common.ScheduleLogic
import com.elvan.rmdneram.ui.theme.NeramTheme
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
    // Determine which events are being shown as "Big Cards" in the Schedule Section
    // and hide them from the Academic Calendar list to avoid redundancy.
    val displayConfig = remember(scheduleState) { ScheduleLogic.calculateDisplayConfig(scheduleState) }
    
    val filteredEvents = remember(todayEvents, displayConfig, scheduleState) {
        if (todayEvents.isEmpty()) return@remember todayEvents

        todayEvents.filter { event ->
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
    // 1. If todayEvents is empty -> Show "Regular Working Day"
    // 2. If todayEvents is NOT empty but filteredEvents IS empty -> HIDE section
    // 3. If filteredEvents is NOT empty -> Show Calendar + List
    val showAcademicCalendarSection = todayEvents.isEmpty() || filteredEvents.isNotEmpty()
    
    // =========================================================================
    // DIALOGS
    // =========================================================================
    
    // Offline Dialog
    if (showOfflineDialog) {
        AlertDialog(
            onDismissRequest = { showOfflineDialog = false },
            title = { Text("Offline", style = HomeTypography.PillTitle) },
            text = { Text("Internet is not connected. Connect to internet to sync data.", style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Button(
                    onClick = { showOfflineDialog = false },
                    shape = HomeShapes.Pill,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.accent,
                        contentColor = Color.White
                    )
                ) {
                    Text("OK", style = HomeTypography.StatusBadge)
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
        onDateSwipePrev = { viewModel.onDateSelected(selectedDate.minusDays(1)) },
        onDateSwipeNext = { viewModel.onDateSelected(selectedDate.plusDays(1)) },
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
            val datePickerState = rememberDatePickerState(
                initialSelectedDateMillis = selectedDate.atStartOfDay(ZoneOffset.UTC)
                    .toInstant().toEpochMilli()
            )
            
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
    if (uiState.showPlacementModal) {
        PlacementModal(
            hierarchy = uiState.academicHierarchy,
            isLoading = uiState.isSyncing,
            isOffline = isOffline,
            colors = colors,
            onSave = { batch, dept, section ->
                viewModel.updatePlacement(batch, dept, section)
            }
        )
    }
}


@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
    NeramTheme {
        // Preview would need mock ViewModel
    }
}

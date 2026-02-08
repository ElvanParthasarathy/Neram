package com.elvan.rmdneram.ui.schedule

import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.runtime.collectAsState
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.components.ExpressivePullToRefreshBox
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.padding
import java.time.format.DateTimeFormatter
import java.time.ZoneOffset
import java.time.Instant

/**
 * ScheduleScreen - Logic Coordinator
 * 
 * Responsibilities:
 * - Collects State from ViewModel
 * - Manages local UI state (tabs, dialogs, loading simulation)
 * - Orchestrates callbacks
 * - Delegates pure UI rendering to ScheduleMainLayout
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleScreen(
    viewModel: HomeViewModel = viewModel(),
    pullRefreshState: androidx.compose.material3.pulltorefresh.PullToRefreshState? = null
) {
    // 1. Collect ViewModel State
    val scheduleState by viewModel.scheduleState.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    
    // 2. Setup Local State & Resources
    val colors = rememberHomeColors()
    var activeTab by remember { mutableStateOf("class") } // "class" or "exams"
    var showDatePicker by remember { mutableStateOf(false) }
    
    // 3. Setup Refresh Logic
    val effectivePullRefreshState = pullRefreshState ?: rememberPullToRefreshState()
    val scope = rememberCoroutineScope()
    var isSimulatingOfflineRefresh by remember { mutableStateOf(false) }
    var showOfflineDialog by remember { mutableStateOf(false) }
    val isOffline = uiState.isOffline

    // 4. Handle Offline Dialog
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
                        contentColor = androidx.compose.ui.graphics.Color.White
                    )
                ) {
                    Text(AppStrings.Home.ok(lang), style = HomeTypography.PillButton)
                }
            },
            containerColor = colors.surface,
            titleContentColor = colors.textPrimary,
            textContentColor = colors.textSecondary,
            shape = HomeShapes.Item
        )
    }

    // 5. Handle Date Picker Dialog
    if (showDatePicker) {
        key(selectedDate) {
            val datePickerState = rememberDatePickerState(
                initialSelectedDateMillis = selectedDate.atStartOfDay(ZoneOffset.UTC)
                    .toInstant().toEpochMilli()
            )
            
            DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                    confirmButton = {
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
                                contentColor = androidx.compose.ui.graphics.Color.White
                            )
                        ) {
                            Text("OK", style = HomeTypography.PillButton)
                        }
                    },
                    dismissButton = {
                        val lang = LocalAppLanguage.current
                        Button(
                            onClick = { showDatePicker = false },
                            shape = HomeShapes.Pill,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = colors.subtleBackground,
                                contentColor = colors.textSecondary
                            )
                        ) {
                            Text(AppStrings.Home.cancel(lang), style = HomeTypography.PillButton)
                        }
                    },
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
                                style = MaterialTheme.typography.labelLarge,
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
                            selectedYearContentColor = androidx.compose.ui.graphics.Color.White,
                            selectedYearContainerColor = colors.accent,
                            dayContentColor = colors.textPrimary,
                            selectedDayContainerColor = colors.accent,
                            selectedDayContentColor = androidx.compose.ui.graphics.Color.White,
                            todayContentColor = colors.accent,
                            todayDateBorderColor = colors.accent
                        )
                    )
                }
            }
        }
    


    // 6. Refresh Handler
    val onRefresh = {
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
        Unit
    }

    // 7. Render Layout
    ScheduleMainLayout(
        uiState = uiState,
        scheduleState = scheduleState,
        activeTab = activeTab,
        onTabSelected = { activeTab = it },
        showDatePicker = showDatePicker,
        onShowDatePickerChange = { showDatePicker = it },
        colors = colors,
        pullRefreshState = effectivePullRefreshState,
        isRefreshing = uiState.isSyncing || isSimulatingOfflineRefresh,
        onRefresh = onRefresh,
        selectedDate = selectedDate, // Added this line
        selectedDateFormatted = selectedDate.format(DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy")),

        onDatePillClick = { showDatePicker = true },
        onDateSwipePrev = { viewModel.onDateSelected(selectedDate.minusDays(1)) },
        onDateSwipeNext = { viewModel.onDateSelected(selectedDate.plusDays(1)) }
    )
}

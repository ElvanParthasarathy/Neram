package com.elvan.neram.ui.schedule

import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.runtime.collectAsState
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.components.ExpressivePullToRefreshBox
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.toMozhiFullDate
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.layout.*
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
    scrollState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState(),
    pullRefreshState: androidx.compose.material3.pulltorefresh.PullToRefreshState? = null
) {
    val lang = LocalAppLanguage.current
    val effectiveLang = lang

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
                        contentColor = androidx.compose.ui.graphics.Color.White
                    )
                ) {
                    Text(K.ok.tr(lang), style = HomeTypography.PillButton)
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
        com.elvan.neram.ui.common.NeramDatePickerDialog(
            initialDate = selectedDate,
            onDateSelected = { date ->
                viewModel.onDateSelected(date)
            },
            onDismissRequest = { showDatePicker = false }
        )
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
        selectedDate = selectedDate,
        selectedDateFormatted = selectedDate.toMozhiFullDate(effectiveLang),

        onDatePillClick = { showDatePicker = true },
        onDateSwipePrev = { viewModel.onDateSelected(selectedDate.minusDays(1)) },
        onDateSwipeNext = { viewModel.onDateSelected(selectedDate.plusDays(1)) },
        scrollState = scrollState
    )
}

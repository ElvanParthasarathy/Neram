package com.elvan.rmdneram.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.home.HomeDimens
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.theme.AppColors
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StorageSettingsScreen(
    onCleanupClick: () -> Unit,
    onCleanupRangeClick: (java.time.LocalDate, java.time.LocalDate) -> Unit,
    isOffline: Boolean = false,
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    var showConfirmDialog by remember { mutableStateOf(false) }
    var showRangePickerDialog by remember { mutableStateOf(false) }
    var showRangeConfirmDialog by remember { mutableStateOf(false) }
    var showOfflineDialog by remember { mutableStateOf(false) }
    
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    
    val dateRangePickerState = rememberDateRangePickerState()
    
    val cardColor = colors.surface

    val lang = LocalAppLanguage.current

    if (showOfflineDialog) {
        AlertDialog(
            onDismissRequest = { showOfflineDialog = false },
            title = { Text(AppStrings.Home.offline(lang), style = HomeTypography.PillTitle) },
            text = { Text(AppStrings.Home.offlineMessage(lang), style = HomeTypography.AuthorBadge) },
            confirmButton = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Button(
                        onClick = { showOfflineDialog = false },
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.accent,
                            contentColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(AppStrings.Home.ok(lang), style = HomeTypography.PillButton)
                    }
                }
            },
            containerColor = colors.surface,
            titleContentColor = colors.textPrimary,
            textContentColor = colors.textSecondary,
            shape = HomeShapes.Item
        )
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        AppStrings.Settings.storageData(lang),
                        style = HomeTypography.PageTitle.copy(fontSize = 28.sp, fontFamily = com.elvan.rmdneram.ui.theme.LocalAppFontFamily.current),
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.padding(top = 8.dp)
                    ) {
                        Icon(
                            Icons.Default.ChevronLeft,
                            "Back",
                            tint = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.size(32.dp)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colors.background,
                    scrolledContainerColor = colors.background,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                ),
                scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
            )
        },
        snackbarHost = {
            SnackbarHost(
                hostState = snackbarHostState,
                modifier = Modifier
                    .padding(bottom = 16.dp)
            ) { data ->
                Snackbar(
                    snackbarData = data,
                    containerColor = colors.surface,
                    contentColor = colors.textPrimary,
                    shape = HomeShapes.Pill
                )
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = HomeDimens.ContentPadding)
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // Cleanup Label
            Text(
                AppStrings.Storage.cleanupOptions(lang),
                style = HomeTypography.ExamTag,
                color = colors.textSecondary,
                modifier = Modifier.padding(bottom = 8.dp, start = 24.dp)
            )

            // Cleanup Card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(HomeShapes.Item)
                    .background(cardColor)
            ) {
                // Option 1: 30 Days
                Row(
                   modifier = Modifier
                       .fillMaxWidth()
                       .clickable { 
                           if (isOffline) showOfflineDialog = true 
                           else showConfirmDialog = true 
                       }
                       .padding(horizontal = 20.dp, vertical = 16.dp),
                   verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(colors.accent),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Outlined.Delete,
                            null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            AppStrings.Storage.clearOldUpdates(lang),
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium),
                            color = colors.textPrimary
                        )
                        Text(
                            AppStrings.Storage.clearOldUpdatesDesc(lang),
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                    }
                }

                HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))

                // Option 2: Range Deletion
                Row(
                   modifier = Modifier
                       .fillMaxWidth()
                       .clickable { 
                           if (isOffline) showOfflineDialog = true 
                           else showRangePickerDialog = true 
                       }
                       .padding(horizontal = 20.dp, vertical = 16.dp),
                   verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(AppColors.Orange),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.DateRange,
                            null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            AppStrings.Storage.customRangeDeletion(lang),
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium),
                            color = colors.textPrimary
                        )
                        Text(
                            AppStrings.Storage.customRangeDesc(lang),
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Usage Info (Placeholder for future)
            Text(
                AppStrings.Storage.optimizationInfo(lang),
                style = HomeTypography.AuthorBadge,
                color = colors.textSecondary,
                modifier = Modifier.padding(horizontal = 24.dp)
            )
        }
    }

    // 1. Standard 30 Days Confirm Dialog
    if (showConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmDialog = false },
            title = { Text(AppStrings.Storage.clearOldUpdates(lang), color = colors.textPrimary) },
            text = { 
                Text(
                    AppStrings.Storage.clearConfirmMessage(lang),
                    color = colors.textSecondary
                ) 
            },
            containerColor = colors.surface,
            confirmButton = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { showConfirmDialog = false },
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
                            onCleanupClick()
                            showConfirmDialog = false
                            scope.launch {
                                snackbarHostState.showSnackbar(
                                    message = AppStrings.Storage.clearedMessage(lang),
                                    duration = SnackbarDuration.Short
                                )
                            }
                        },
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.accent,
                            contentColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(AppStrings.Storage.clearNow(lang), style = HomeTypography.PillButton)
                    }
                }
            },
            dismissButton = null
        )
    }

    // 2. Date Range Picker Dialog
    if (showRangePickerDialog) {
        DatePickerDialog(
            onDismissRequest = { showRangePickerDialog = false },
            confirmButton = {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 8.dp, end = 8.dp, bottom = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { showRangePickerDialog = false },
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
                            if (dateRangePickerState.selectedStartDateMillis != null && 
                                dateRangePickerState.selectedEndDateMillis != null) {
                                showRangePickerDialog = false
                                showRangeConfirmDialog = true
                            }
                        },
                        enabled = dateRangePickerState.selectedStartDateMillis != null && 
                                 dateRangePickerState.selectedEndDateMillis != null,
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.accent,
                            contentColor = Color.White,
                            disabledContainerColor = colors.accent.copy(alpha = 0.5f),
                            disabledContentColor = Color.White.copy(alpha = 0.5f)
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(AppStrings.Storage.selectRange(lang), style = HomeTypography.PillButton)
                    }
                }
            },
            dismissButton = null,
            colors = DatePickerDefaults.colors(
                containerColor = colors.surface,
            )
        ) {
            DateRangePicker(
                state = dateRangePickerState,
                modifier = Modifier.height(450.dp),
                title = { Text(AppStrings.Storage.selectDateRange(lang), modifier = Modifier.padding(start = 24.dp, top = 16.dp), color = colors.textPrimary) },
                headline = { 
                    Row(modifier = Modifier.padding(start = 24.dp, bottom = 8.dp)) {
                        Text(AppStrings.Storage.chooseUpdatesToWipe(lang), color = colors.textSecondary)
                    }
                },
                colors = DatePickerDefaults.colors(
                    containerColor = colors.surface,
                    titleContentColor = colors.textPrimary,
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
                    todayDateBorderColor = colors.accent,
                    dayInSelectionRangeContainerColor = colors.accent.copy(alpha = 0.2f),
                    dayInSelectionRangeContentColor = colors.textPrimary
                )
            )
        }
    }

    // 3. Range Confirm Dialog
    if (showRangeConfirmDialog) {
        val startMillis = dateRangePickerState.selectedStartDateMillis!!
        val endMillis = dateRangePickerState.selectedEndDateMillis!!
        
        val startDate = java.time.Instant.ofEpochMilli(startMillis)
            .atZone(java.time.ZoneOffset.UTC).toLocalDate()
        val endDate = java.time.Instant.ofEpochMilli(endMillis)
            .atZone(java.time.ZoneOffset.UTC).toLocalDate()

        AlertDialog(
            onDismissRequest = { showRangeConfirmDialog = false },
            title = { Text(AppStrings.Storage.confirmDeletion(lang), color = colors.textPrimary) },
            text = { 
                Text(
                    AppStrings.Storage.rangeConfirmMessage(startDate, endDate, lang),
                    color = colors.textSecondary
                ) 
            },
            containerColor = colors.surface,
            confirmButton = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { showRangeConfirmDialog = false },
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
                            onCleanupRangeClick(startDate, endDate)
                            showRangeConfirmDialog = false
                            scope.launch {
                                snackbarHostState.showSnackbar(
                                    message = AppStrings.Storage.deletedRangeMessage(startDate, endDate, lang),
                                    duration = SnackbarDuration.Short
                                )
                            }
                        },
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AppColors.Red,
                            contentColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(AppStrings.Storage.deleteData(lang), style = HomeTypography.PillButton)
                    }
                }
            },
            dismissButton = null
        )
    }
}

package com.elvan.rmdneram.ui.screens

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
import com.elvan.rmdneram.ui.theme.AppColors

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
    
    val dateRangePickerState = rememberDateRangePickerState()
    
    val cardColor = colors.surface

    if (showOfflineDialog) {
        AlertDialog(
            onDismissRequest = { showOfflineDialog = false },
            title = { Text("Offline", style = HomeTypography.PillTitle) },
            text = { Text("Internet is not connected. Connect to internet to perform this action.", style = HomeTypography.AuthorBadge) },
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
                        Text("OK", style = HomeTypography.PillButton)
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
                        "Storage & Data",
                        style = HomeTypography.PageTitle.copy(fontSize = 28.sp),
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
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Cleanup Card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(HomeShapes.Item)
                    .background(cardColor)
                    .border(1.dp, colors.glassBorder, HomeShapes.Item)
                    .padding(24.dp)
            ) {
                Text(
                    "Cleanup Options",
                    style = HomeTypography.SectionTitle.copy(fontSize = 14.sp),
                    color = colors.accent,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                // Option 1: 30 Days
                Row(
                   modifier = Modifier
                       .fillMaxWidth()
                       .clickable { 
                           if (isOffline) showOfflineDialog = true 
                           else showConfirmDialog = true 
                       }
                       .padding(vertical = 12.dp),
                   verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(colors.accent.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Outlined.Delete,
                            null,
                            tint = colors.accent,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Clear Old Updates",
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium),
                            color = colors.textPrimary
                        )
                        Text(
                            "Remove news & notices older than 30 days",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                    }
                }

                HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(vertical = 8.dp))

                // Option 2: Range Deletion
                Row(
                   modifier = Modifier
                       .fillMaxWidth()
                       .clickable { 
                           if (isOffline) showOfflineDialog = true 
                           else showRangePickerDialog = true 
                       }
                       .padding(vertical = 12.dp),
                   verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(AppColors.Orange.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.DateRange,
                            null,
                            tint = AppColors.Orange,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            "Custom Range Deletion",
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium),
                            color = colors.textPrimary
                        )
                        Text(
                            "Select a date range to wipe updates",
                            style = MaterialTheme.typography.bodySmall,
                            color = colors.textSecondary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Usage Info (Placeholder for future)
            Text(
                "Optimization helps keep the app responsive and saves local storage by removing old media and text records.",
                style = MaterialTheme.typography.bodySmall,
                color = colors.textSecondary,
                modifier = Modifier.padding(horizontal = 12.dp)
            )
        }
    }

    // 1. Standard 30 Days Confirm Dialog
    if (showConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showConfirmDialog = false },
            title = { Text("Clear Old Updates", color = colors.textPrimary) },
            text = { 
                Text(
                    "This will delete all live updates and notices older than 30 days. This action cannot be undone.",
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
                        },
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.accent,
                            contentColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Clear Now", style = HomeTypography.PillButton)
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
                        Text("Select Range", style = HomeTypography.PillButton)
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
                title = { Text("Select Date Range", modifier = Modifier.padding(start = 24.dp, top = 16.dp), color = colors.textPrimary) },
                headline = { 
                    Row(modifier = Modifier.padding(start = 24.dp, bottom = 8.dp)) {
                        Text("Choose updates to wipe", color = colors.textSecondary)
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
            title = { Text("Confirm Deletion", color = colors.textPrimary) },
            text = { 
                Text(
                    "Are you sure you want to delete all daily updates from $startDate to $endDate? This action is permanent.",
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
                        },
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = AppColors.Red,
                            contentColor = Color.White
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Delete Data", style = HomeTypography.PillButton)
                    }
                }
            },
            dismissButton = null
        )
    }
}

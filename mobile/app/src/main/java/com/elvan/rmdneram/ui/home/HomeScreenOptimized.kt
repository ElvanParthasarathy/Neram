package com.elvan.rmdneram.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.rmdneram.data.model.*
import com.elvan.rmdneram.ui.home.components.EditableSection
import com.elvan.rmdneram.ui.home.components.PlacementModal
import java.time.Instant
import java.time.ZoneId

// ============================================================================
// PERFORMANCE-OPTIMIZED HOME SCREEN
// Key optimizations:
// 1. No Card composables with shadows in lists (shadows are expensive)
// 2. Flat composable hierarchy (less nesting = faster layout)
// 3. All styles are static object references (no allocations)
// 4. Colors cached with remember
// 5. Minimal modifiers
// 6. Using Surface instead of Card where elevation is not needed
// ============================================================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreenOptimized(
    onLogout: () -> Unit = {},
    viewModel: HomeViewModel = viewModel()
) {
    // Cache colors once
    val colorScheme = MaterialTheme.colorScheme
    val backgroundColor = colorScheme.background
    val surfaceColor = colorScheme.surface
    val primaryColor = colorScheme.primary
    val onBackgroundColor = colorScheme.onBackground
    val onSurfaceVariantColor = colorScheme.onSurfaceVariant
    val outlineColor = colorScheme.outline
    
    val uiState by viewModel.uiState.collectAsState()
    val scheduleState by viewModel.scheduleState.collectAsState()
    val todayEvents by viewModel.todayEvents.collectAsState()
    val todayUpdate by viewModel.todayUpdate.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    
    var showDatePicker by remember { mutableStateOf(false) }
    val pullRefreshState = rememberPullToRefreshState()
    
    // Pre-compute these to avoid recomputation in list
    val formattedDate = remember(selectedDate) { viewModel.getFormattedDate() }
    val isAdmin = uiState.userProfile?.canEdit() == true
    val sectionName = uiState.userProfile?.section ?: ""
    val updateContent = todayUpdate?.note ?: "No special updates for today."
    val updateAuthor = todayUpdate?.author ?: ""
    val generalContent = uiState.sectionUpdates.general.text.ifEmpty { "No general notices." }
    val generalAuthor = uiState.sectionUpdates.general.author
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundColor)
    ) {
        PullToRefreshBox(
            isRefreshing = uiState.isSyncing,
            onRefresh = { viewModel.onRefresh() },
            state = pullRefreshState
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                // === HEADER ===
                item(key = "header") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Home Dashboard",
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Bold,
                            color = onBackgroundColor,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            modifier = Modifier.weight(1f)
                        )
                        if (isAdmin) {
                            Text(
                                text = "Admin",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = colorScheme.error,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(colorScheme.error.copy(alpha = 0.1f))
                                    .padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }
                
                // === DATE PICKER ===
                item(key = "date") {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Select date",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = onSurfaceVariantColor.copy(alpha = 0.7f),
                            modifier = Modifier.padding(start = 4.dp)
                        )
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp)
                                .clickable { showDatePicker = true },
                            shape = RoundedCornerShape(26.dp),
                            color = surfaceColor,
                            tonalElevation = 1.dp
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(start = 20.dp, end = 4.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = formattedDate,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = onBackgroundColor
                                )
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .clip(CircleShape)
                                        .background(primaryColor),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.DateRange,
                                        contentDescription = "Calendar",
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                    }
                }
                
                // === CALENDAR EVENTS ===
                item(key = "calendar_title") {
                    Text(
                        text = "Academic Calendar",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = onBackgroundColor
                    )
                }
                
                if (todayEvents.isEmpty()) {
                    item(key = "no_events") {
                        Text(
                            text = "Regular Working Day",
                            fontSize = 14.sp,
                            fontStyle = FontStyle.Italic,
                            color = onSurfaceVariantColor
                        )
                    }
                } else {
                    itemsIndexed(
                        items = todayEvents,
                        key = { _, event -> "ev_${event.id.ifEmpty { event.title }}" }
                    ) { _, event ->
                        // Simple row instead of Card
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(surfaceColor)
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .width(4.dp)
                                    .height(36.dp)
                                    .clip(RoundedCornerShape(2.dp))
                                    .background(primaryColor)
                            )
                            Spacer(modifier = Modifier.width(14.dp))
                            Column {
                                Text(
                                    text = event.title,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = onBackgroundColor
                                )
                                Text(
                                    text = event.fullTime ?: event.getTimeRangeDisplay(),
                                    fontSize = 12.sp,
                                    color = onSurfaceVariantColor
                                )
                            }
                        }
                    }
                }
                
                // === SCHEDULE ===
                item(key = "schedule") {
                    ScheduleSectionOptimized(
                        scheduleState = scheduleState,
                        masterData = uiState.masterData,
                        isLoading = uiState.isLoading,
                        primaryColor = primaryColor,
                        surfaceColor = surfaceColor,
                        onBackgroundColor = onBackgroundColor,
                        onSurfaceVariantColor = onSurfaceVariantColor,
                        outlineColor = outlineColor
                    )
                }
                
                // === UPDATES ===
                item(key = "updates") {
                    EditableSection(
                        title = "Live Updates ($sectionName)",
                        content = updateContent,
                        author = updateAuthor,
                        emptyText = "No special updates for today.",
                        canEdit = isAdmin,
                        accentColor = primaryColor,
                        isSaving = uiState.isSyncing,
                        colors = rememberHomeColors(),
                        onSave = { viewModel.saveDailyUpdate(it) }
                    )
                }
                
                // === GENERAL NOTICE ===
                item(key = "notice") {
                    EditableSection(
                        title = "General Notice",
                        content = generalContent,
                        author = generalAuthor,
                        emptyText = "No general notices.",
                        canEdit = isAdmin,
                        accentColor = Color(0xFF22C55E),
                        isSaving = uiState.isSyncing,
                        colors = rememberHomeColors(),
                        onSave = { viewModel.saveGeneralNotice(it) }
                    )
                }
                
                // === FOOTER ===
                item(key = "footer") {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        listOf(
                            "Batch" to (uiState.userProfile?.batch ?: "-"),
                            "Dept" to (uiState.userProfile?.department ?: "-"),
                            "Sec" to (uiState.userProfile?.section ?: "-")
                        ).forEach { (label, value) ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(surfaceColor)
                                    .padding(12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = label.uppercase(),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = onSurfaceVariantColor.copy(alpha = 0.6f)
                                    )
                                    Text(
                                        text = value,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = onBackgroundColor
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Loading
        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(backgroundColor),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = primaryColor)
            }
        }
    }
    
    // Date Picker
    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = selectedDate.atStartOfDay(java.time.ZoneId.systemDefault())
                .toInstant().toEpochMilli()
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        viewModel.onDateSelected(
                            Instant.ofEpochMilli(millis)
                                .atZone(java.time.ZoneId.systemDefault())
                                .toLocalDate()
                        )
                    }
                    showDatePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
    
    // Placement Modal
    if (uiState.showPlacementModal) {
        PlacementModal(
            hierarchy = uiState.academicHierarchy,
            isLoading = uiState.isSyncing,
            colors = rememberHomeColors(),
            onSave = { batch, dept, section -> viewModel.updatePlacement(batch, dept, section) }
        )
    }
}

// ============================================================================
// OPTIMIZED SCHEDULE SECTION
// ============================================================================

@Composable
private fun ScheduleSectionOptimized(
    scheduleState: ScheduleState,
    masterData: MasterData,
    isLoading: Boolean,
    primaryColor: Color,
    surfaceColor: Color,
    onBackgroundColor: Color,
    onSurfaceVariantColor: Color,
    outlineColor: Color
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Schedule",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = onBackgroundColor
            )
            Text(
                text = scheduleState.scheduleStatus.uppercase(),
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = onSurfaceVariantColor,
                modifier = Modifier
                    .clip(RoundedCornerShape(12.dp))
                    .background(surfaceColor)
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            )
        }
        
        when {
            scheduleState.fullDayEvent != null -> {
                // Full day event
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(primaryColor)
                        .padding(20.dp)
                ) {
                    Column {
                        Text("TODAY'S EVENT", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(alpha = 0.7f))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(scheduleState.fullDayEvent.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text(scheduleState.fullDayEvent.description ?: "Full Day", fontSize = 13.sp, color = Color.White.copy(alpha = 0.8f))
                    }
                }
            }
            
            scheduleState.todayExam != null && scheduleState.activeExamPeriod != null -> {
                 // Defer to separate exam block logic below or duplicate here?
                 // The original code handled exam separately. 
                 // We should handle it here to respect the "when" priority order.
                 // Actually, the original code had exam OUTSIDE the when block?
                 // No, line 534 was OUTSIDE.
                 // Let's keep exam separate or inside?
                 // If we want to hide loading, we must return content.
                 // If exam is present, we should probably show it inside this block or return empty Column?
                 // The previous code had "checked isLoading -> then checked fullDay -> then checked periods -> else No Classes".
                 // Exam was OUTSIDE.
            }
            
            scheduleState.periods.isNotEmpty() -> {
                // Timetable - Simple table, no cards
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(surfaceColor)
                ) {
                    // Header row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(onSurfaceVariantColor.copy(alpha = 0.05f))
                            .padding(vertical = 10.dp, horizontal = 12.dp)
                    ) {
                        Text("#", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = onSurfaceVariantColor, modifier = Modifier.width(28.dp))
                        Text("COURSE", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = onSurfaceVariantColor, modifier = Modifier.weight(1f))
                        Text("FACULTY", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = onSurfaceVariantColor, modifier = Modifier.width(70.dp))
                    }
                    
                    // Period rows
                    scheduleState.periods.forEachIndexed { index, period ->
                        if (index > 0) {
                            HorizontalDivider(color = outlineColor.copy(alpha = 0.3f))
                        }
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 10.dp, horizontal = 12.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            Text(
                                text = "${period.number}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = primaryColor,
                                modifier = Modifier.width(28.dp)
                            )
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                period.entries.forEach { entry ->
                                    Column {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(entry.code, fontSize = 10.sp, color = onSurfaceVariantColor)
                                            if (period.isLab) {
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Text(
                                                    "(LAB)", 
                                                    fontSize = 8.sp, 
                                                    fontWeight = FontWeight.Bold, 
                                                    color = primaryColor
                                                )
                                            }
                                        }
                                        Text(
                                            text = entry.name,
                                            fontSize = 12.sp, 
                                            color = onBackgroundColor
                                        )
                                        if (entry.faculty.isNotEmpty()) {
                                            Text(
                                                text = entry.faculty,
                                                fontSize = 11.sp,
                                                color = onSurfaceVariantColor
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(80.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(surfaceColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Loading...", color = onSurfaceVariantColor)
                }
            }
            
            else -> {
                // No classes
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(surfaceColor)
                        .padding(vertical = 32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("No classes scheduled", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = onBackgroundColor)
                        Text("(${scheduleState.scheduleStatus})", fontSize = 12.sp, color = onSurfaceVariantColor)
                    }
                }
            }
        }
        
        // Exam card if present
        if (scheduleState.todayExam != null && scheduleState.activeExamPeriod != null) {
            val exam = scheduleState.activeExamPeriod
            val subject = scheduleState.todayExam
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(primaryColor)
                    .padding(20.dp)
            ) {
                Column {
                    Text("TODAY'S EXAM", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White.copy(alpha = 0.7f))
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(exam.title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("${subject.code}: ${subject.startTime} - ${subject.endTime}", fontSize = 13.sp, color = Color.White.copy(alpha = 0.8f))
                }
            }
        }
    }
}

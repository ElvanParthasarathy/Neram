package com.elvan.rmdneram.ui.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeTypography

/**
 * Full-screen modal for academic placement selection
 * Matches React Native Force Placement Modal
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun PlacementModal(
    hierarchy: Map<String, Map<String, List<String>>>,
    isLoading: Boolean,
    isOffline: Boolean = false,
    colors: HomeColors,
    onSave: (batch: String, dept: String, section: String) -> Unit
) {
    var selectedBatch by remember { mutableStateOf("") }
    var selectedDept by remember { mutableStateOf("") }
    var selectedSection by remember { mutableStateOf("") }
    var showOfflineDialog by remember { mutableStateOf(false) }
    
    if (showOfflineDialog) {
        AlertDialog(
            onDismissRequest = { showOfflineDialog = false },
            title = { Text("Offline", style = HomeTypography.PillTitle) },
            text = { Text("Internet is not connected. Connect to internet to complete your profile.", style = HomeTypography.AuthorBadge) },
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
    
    Dialog(
        onDismissRequest = { /* Cannot dismiss - must complete */ },
        properties = DialogProperties(
            dismissOnBackPress = false,
            dismissOnClickOutside = false,
            usePlatformDefaultWidth = false
        )
    ) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = colors.surface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                        .padding(top = 40.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Complete Your Profile",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = colors.accent
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Text(
                        text = "Please select your academic details to continue.",
                        fontSize = 14.sp,
                        color = colors.textSecondary,
                        textAlign = TextAlign.Center
                    )
                }
                
                Divider(color = colors.border)
                
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    // 1. Select Batch
                    Text(
                        text = "Select Batch",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.textSecondary,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (hierarchy.isEmpty()) {
                            Text(
                                text = "Loading batches...",
                                fontSize = 14.sp,
                                color = colors.textSecondary,
                                modifier = Modifier.padding(8.dp)
                            )
                        } else {
                            hierarchy.keys.sortedDescending().forEach { batch ->
                                SelectionChip(
                                    text = batch,
                                    isSelected = selectedBatch == batch,
                                    colors = colors,
                                    onClick = {
                                        selectedBatch = batch
                                        selectedDept = ""
                                        selectedSection = ""
                                    }
                                )
                            }
                        }
                    }
                    
                    // 2. Select Department (visible after batch)
                    if (selectedBatch.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Text(
                            text = "Select Department",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalSpacing = 8.dp,
                            verticalSpacing = 8.dp
                        ) {
                            hierarchy[selectedBatch]?.keys
                                ?.filter { it != "initialized" }
                                ?.forEach { dept ->
                                    SelectionChip(
                                        text = dept,
                                        isSelected = selectedDept == dept,
                                        colors = colors,
                                        onClick = {
                                            selectedDept = dept
                                            selectedSection = ""
                                        }
                                    )
                                }
                        }
                    }
                    
                    // 3. Select Section (visible after department)
                    if (selectedDept.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Text(
                            text = "Select Section",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalSpacing = 8.dp,
                            verticalSpacing = 8.dp
                        ) {
                            hierarchy[selectedBatch]?.get(selectedDept)?.forEach { section ->
                                SelectionChip(
                                    text = section,
                                    isSelected = selectedSection == section,
                                    colors = colors,
                                    onClick = { selectedSection = section }
                                )
                            }
                        }
                    }
                    
                    // Save Button
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    Button(
                        onClick = { 
                            if (isOffline) {
                                showOfflineDialog = true
                            } else {
                                onSave(selectedBatch, selectedDept, selectedSection) 
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = selectedSection.isNotEmpty() && !isLoading,
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.accent,
                            disabledContainerColor = colors.accent.copy(alpha = 0.5f)
                        )
                    ) {
                        if (isLoading) {
                            com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(
                                modifier = Modifier.size(24.dp),
                                color = colors.surface,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Text(
                                text = "Get Started",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

/**
 * Chip component for selection
 */
@Composable
private fun SelectionChip(
    text: String,
    isSelected: Boolean,
    colors: HomeColors,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(
                if (isSelected) colors.accent else colors.subtleBackground
            )
            .border(
                width = 1.dp,
                color = if (isSelected) colors.accent else colors.border,
                shape = RoundedCornerShape(20.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Text(
            text = text,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isSelected) colors.surface else colors.textSecondary
        )
    }
}

/**
 * Simple Custom FlowRow implementation to avoid ExperimentalLayoutApi issues
 */
@Composable
private fun FlowRow(
    modifier: Modifier = Modifier,
    horizontalSpacing: androidx.compose.ui.unit.Dp = 8.dp,
    verticalSpacing: androidx.compose.ui.unit.Dp = 8.dp,
    content: @Composable () -> Unit
) {
    androidx.compose.ui.layout.Layout(
        content = content,
        modifier = modifier
    ) { measurables, constraints ->
        val rows = mutableListOf<List<androidx.compose.ui.layout.Placeable>>()
        val rowWidths = mutableListOf<Int>()
        val rowHeights = mutableListOf<Int>()

        var currentRow = mutableListOf<androidx.compose.ui.layout.Placeable>()
        var currentWidth = 0
        var currentHeight = 0

        val spacingPx = horizontalSpacing.roundToPx()
        val verticalSpacingPx = verticalSpacing.roundToPx()
        val maxWidth = constraints.maxWidth

        measurables.forEach { measurable ->
            val placeable = measurable.measure(constraints)
            
            if (currentWidth + placeable.width > maxWidth && currentRow.isNotEmpty()) {
                // New row
                rows.add(currentRow)
                rowWidths.add(currentWidth - spacingPx) // Remove trailing spacing
                rowHeights.add(currentHeight)
                
                currentRow = mutableListOf()
                currentWidth = 0
                currentHeight = 0
            }
            
            currentRow.add(placeable)
            currentWidth += placeable.width + spacingPx
            currentHeight = maxOf(currentHeight, placeable.height)
        }
        
        if (currentRow.isNotEmpty()) {
            rows.add(currentRow)
            rowWidths.add(currentWidth - spacingPx)
            rowHeights.add(currentHeight)
        }
        
        val totalHeight = rowHeights.sum() + ((rows.size - 1).coerceAtLeast(0) * verticalSpacingPx)
        
        layout(width = maxWidth, height = totalHeight) {
            var yOffset = 0
            
            rows.forEachIndexed { i, row ->
                var xOffset = 0
                val rowHeight = rowHeights[i]
                
                row.forEach { placeable ->
                    placeable.place(x = xOffset, y = yOffset)
                    xOffset += placeable.width + spacingPx
                }
                
                yOffset += rowHeight + verticalSpacingPx
            }
        }
    }
}


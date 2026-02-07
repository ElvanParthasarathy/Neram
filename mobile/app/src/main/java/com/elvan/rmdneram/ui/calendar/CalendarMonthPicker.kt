package com.elvan.rmdneram.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeShapes
import java.time.Month
import java.time.YearMonth
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun MonthYearPickerDialog(
    visible: Boolean,
    currentMonth: YearMonth,
    onDismissRequest: () -> Unit,
    onMonthYearSelected: (YearMonth) -> Unit,
    colors: HomeColors
) {
    if (visible) {
        var selectedYear by remember(currentMonth) { mutableIntStateOf(currentMonth.year) }
        var selectedMonth by remember(currentMonth) { mutableStateOf(currentMonth.month) }

        Dialog(onDismissRequest = onDismissRequest) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(28.dp), // Extra radius as requested
                color = colors.surface
            ) {
                Column(
                    modifier = Modifier.padding(24.dp), // Increased padding for better look
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Header: Year Selection
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 24.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Previous Year Button
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(colors.subtleBackground)
                                .clickable { selectedYear-- },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                                contentDescription = "Previous Year",
                                tint = colors.textPrimary
                            )
                        }

                        Text(
                            text = selectedYear.toString(),
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
                        )

                        // Next Year Button
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(colors.subtleBackground)
                                .clickable { selectedYear++ },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                contentDescription = "Next Year",
                                tint = colors.textPrimary
                            )
                        }
                    }

                    // Content: Month Grid
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        modifier = Modifier.height(240.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(Month.values()) { month ->
                            val isSelected = month == selectedMonth
                            
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape) // Pill shape
                                    .background(
                                        if (isSelected) colors.accent else androidx.compose.ui.graphics.Color.Transparent
                                    )
                                    .clickable { selectedMonth = month }
                                    .padding(vertical = 12.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = month.getDisplayName(TextStyle.SHORT, Locale.ENGLISH).uppercase(),
                                    color = if (isSelected) androidx.compose.ui.graphics.Color.White else colors.textPrimary,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Footer: Actions
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.End,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Cancel Button (Pill)
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .clickable(onClick = onDismissRequest)
                                .padding(vertical = 8.dp, horizontal = 16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "Cancel",
                                color = colors.textSecondary,
                                fontWeight = FontWeight.Medium,
                                fontSize = 14.sp // Smaller font size
                            )
                        }
                        
                        Spacer(modifier = Modifier.width(8.dp))
                        
                        // OK Button (Filled Pill)
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(colors.accent)
                                .clickable {
                                    onMonthYearSelected(YearMonth.of(selectedYear, selectedMonth))
                                    onDismissRequest()
                                }
                                .padding(vertical = 8.dp, horizontal = 20.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "OK",
                                color = androidx.compose.ui.graphics.Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp // Smaller font size
                            )
                        }
                    }
                }
            }
        }
    }
}

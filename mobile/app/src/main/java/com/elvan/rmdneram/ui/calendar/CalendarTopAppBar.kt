package com.elvan.rmdneram.ui.calendar

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ViewAgenda
import androidx.compose.material.icons.outlined.CalendarViewMonth
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.rememberHomeColors
import kotlinx.collections.immutable.ImmutableList
import kotlinx.datetime.LocalDate
import kotlinx.datetime.Month

/**
 * Calendar Top App Bar - View switcher and controls
 */
@Composable
fun NeramCalendarTopAppBar(
    modifier: Modifier = Modifier,
    currentDate: LocalDate,
    selectedDate: LocalDate,
    selectedMonth: Month,
    selectedYear: Int,
    events: ImmutableList<NeramCalendarEvent>,
    holidays: ImmutableList<NeramCalendarHoliday>,
    currentView: CalendarViewType,
    onViewChange: (CalendarViewType) -> Unit,
    onSearchClick: () -> Unit = {},
    onSettingsClick: () -> Unit = {},
    onTodayClick: () -> Unit = {},
    onDayClick: (LocalDate) -> Unit = {}
) {
    val colors = rememberHomeColors()
    
    Column(modifier = modifier.fillMaxWidth()) {
        // Month/Year Title Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "${selectedMonth.name.lowercase().replaceFirstChar { it.uppercase() }} $selectedYear",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = colors.textPrimary
                )
                Text(
                    text = "${events.size} events",
                    style = MaterialTheme.typography.bodySmall,
                    color = colors.textSecondary
                )
            }
            
            // Today Button
            IconButton(onClick = onTodayClick) {
                Icon(
                    Icons.Default.Today,
                    contentDescription = "Go to Today",
                    tint = colors.accent
                )
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        // View Switcher
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(colors.surface),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            ViewTab(
                label = "Month",
                icon = Icons.Outlined.CalendarMonth,
                isSelected = currentView == CalendarViewType.MONTH,
                onClick = { onViewChange(CalendarViewType.MONTH) },
                colors = colors
            )
            ViewTab(
                label = "Schedule",
                icon = Icons.Outlined.ViewAgenda,
                isSelected = currentView == CalendarViewType.SCHEDULE,
                onClick = { onViewChange(CalendarViewType.SCHEDULE) },
                colors = colors
            )
            ViewTab(
                label = "Year",
                icon = Icons.Outlined.CalendarViewMonth,
                isSelected = currentView == CalendarViewType.YEAR,
                onClick = { onViewChange(CalendarViewType.YEAR) },
                colors = colors
            )
        }
    }
}

@Composable
private fun ViewTab(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit,
    colors: com.elvan.rmdneram.ui.home.HomeColors
) {
    val bgColor = if (isSelected) colors.accent.copy(alpha = 0.15f) else colors.surface
    val textColor = if (isSelected) colors.accent else colors.textSecondary
    
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(bgColor)
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Icon(
            icon,
            contentDescription = label,
            tint = textColor,
            modifier = Modifier.size(18.dp)
        )
        Text(
            text = label,
            fontSize = 13.sp,
            fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
            color = textColor
        )
    }
}

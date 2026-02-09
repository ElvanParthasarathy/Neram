package com.elvan.rmdneram.ui.screens

import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.theme.AppColors

/**
 * Notification Settings Screen for controlling notification channels and preferences.
 */
@Composable
fun NotificationSettingsScreen(
    onBack: () -> Unit = {}
) {
    val context = LocalContext.current
    val colors = rememberHomeColors()
    val statusBarHeight = rememberStatusBarHeight()
    val topPadding = statusBarHeight + HomeDimens.ContentPaddingTop
    val scrollState = rememberScrollState()
    
    // Read preferences
    val prefs = remember { context.getSharedPreferences("notification_settings", Context.MODE_PRIVATE) }
    
    var dailyBriefingEnabled by remember { mutableStateOf(prefs.getBoolean("daily_briefing", true)) }
    var examAlertsEnabled by remember { mutableStateOf(prefs.getBoolean("exam_alerts", true)) }
    var eventRemindersEnabled by remember { mutableStateOf(prefs.getBoolean("event_reminders", true)) }
    var instantAlertsEnabled by remember { mutableStateOf(prefs.getBoolean("instant_alerts", true)) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .verticalScroll(scrollState)
            .padding(horizontal = HomeDimens.ContentPadding)
            .padding(top = topPadding, bottom = 100.dp)
    ) {
        // Section: Push Notifications
        Text(
            text = "Push Notifications",
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = colors.textSecondary,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        
        SettingsListGroup(cardColor = colors.surface) {
            NotificationToggleItem(
                icon = Icons.Outlined.WbSunny,
                iconBgColor = AppColors.Orange,
                title = "Daily Briefing",
                description = "Morning summary with schedule and updates",
                checked = dailyBriefingEnabled,
                onCheckedChange = {
                    dailyBriefingEnabled = it
                    prefs.edit().putBoolean("daily_briefing", it).apply()
                },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary,
                accentColor = colors.accent
            )
            Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
            
            NotificationToggleItem(
                icon = Icons.Outlined.School,
                iconBgColor = AppColors.Red,
                title = "Exam Alerts",
                description = "Reminders for upcoming exams",
                checked = examAlertsEnabled,
                onCheckedChange = {
                    examAlertsEnabled = it
                    prefs.edit().putBoolean("exam_alerts", it).apply()
                },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary,
                accentColor = colors.accent
            )
            Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
            
            NotificationToggleItem(
                icon = Icons.Outlined.CalendarMonth,
                iconBgColor = AppColors.Blue,
                title = "Event Reminders",
                description = "Holidays and special events",
                checked = eventRemindersEnabled,
                onCheckedChange = {
                    eventRemindersEnabled = it
                    prefs.edit().putBoolean("event_reminders", it).apply()
                },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary,
                accentColor = colors.accent
            )
            Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
            
            NotificationToggleItem(
                icon = Icons.Outlined.NotificationsActive,
                iconBgColor = AppColors.Purple,
                title = "Instant Alerts",
                description = "Critical announcements from college",
                checked = instantAlertsEnabled,
                onCheckedChange = {
                    instantAlertsEnabled = it
                    prefs.edit().putBoolean("instant_alerts", it).apply()
                },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary,
                accentColor = colors.accent
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Info Section
        Text(
            text = "Note: You can also manage notification permissions in your device's system settings.",
            style = MaterialTheme.typography.bodySmall,
            color = colors.textSecondary,
            modifier = Modifier.padding(horizontal = 4.dp)
        )
    }
}

@Composable
fun NotificationToggleItem(
    icon: ImageVector,
    iconBgColor: Color,
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    textColor: Color,
    subTextColor: Color,
    accentColor: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Icon Circle
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(iconBgColor, shape = RoundedCornerShape(50)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = Color.White, modifier = Modifier.size(20.dp))
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                title, 
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), 
                color = textColor
            )
            Text(
                description, 
                style = MaterialTheme.typography.bodySmall, 
                color = subTextColor
            )
        }
        
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = accentColor,
                uncheckedThumbColor = Color.White,
                uncheckedTrackColor = subTextColor.copy(alpha = 0.3f)
            )
        )
    }
}

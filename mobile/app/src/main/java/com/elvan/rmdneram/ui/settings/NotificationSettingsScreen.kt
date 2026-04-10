package com.elvan.rmdneram.ui.settings

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
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
import androidx.compose.foundation.clickable
import com.elvan.rmdneram.utils.AlarmScheduler
import java.util.Calendar
import java.util.Locale
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.material3.TimePickerState

/**
 * Notification Settings Screen for controlling notification channels and preferences.
 */
@OptIn(ExperimentalMaterial3Api::class)
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
    
    var dailyUpdateEnabled by remember { mutableStateOf(prefs.getBoolean("daily_update", true)) }
    var generalNoticeEnabled by remember { mutableStateOf(prefs.getBoolean("general_notice", true)) }
    var classScheduleEnabled by remember { mutableStateOf(prefs.getBoolean("class_schedule", true)) }
    var labRemindersEnabled by remember { mutableStateOf(prefs.getBoolean("lab_reminders", true)) }
    var studyRemindersEnabled by remember { mutableStateOf(prefs.getBoolean("study_reminders", true)) }
    var examAlertsEnabled by remember { mutableStateOf(prefs.getBoolean("exam_alerts", true)) }
    var eventRemindersEnabled by remember { mutableStateOf(prefs.getBoolean("event_reminders", true)) }
    var instantAlertsEnabled by remember { mutableStateOf(prefs.getBoolean("instant_alerts", true)) }

    // Timing preferences
    var useCustomTimes by remember { mutableStateOf(prefs.getBoolean("use_custom_times", false)) }
    var customTime1Hour by remember { mutableStateOf(prefs.getInt("custom_time_1_hour", 5)) }
    var customTime1Minute by remember { mutableStateOf(prefs.getInt("custom_time_1_minute", 30)) }
    var customTime2Hour by remember { mutableStateOf(prefs.getInt("custom_time_2_hour", 6)) }
    var customTime2Minute by remember { mutableStateOf(prefs.getInt("custom_time_2_minute", 30)) }
    var customTime3Hour by remember { mutableStateOf(prefs.getInt("custom_time_3_hour", 7)) }
    var customTime3Minute by remember { mutableStateOf(prefs.getInt("custom_time_3_minute", 30)) }

    // Helper to run alarm scheduler
    val refreshAlarms = { AlarmScheduler.scheduleDailyAlarm(context) }

    // State for Material 3 Time Picker
    var showTimePickerForSlot by remember { mutableStateOf<Int?>(null) }
    
    // Remember the time picker state when opening
    val timePickerState = if (showTimePickerForSlot != null) {
        val initialHour = when (showTimePickerForSlot) {
            1 -> customTime1Hour
            2 -> customTime2Hour
            3 -> customTime3Hour
            else -> 0
        }
        val initialMinute = when (showTimePickerForSlot) {
            1 -> customTime1Minute
            2 -> customTime2Minute
            3 -> customTime3Minute
            else -> 0
        }
        rememberTimePickerState(initialHour = initialHour, initialMinute = initialMinute, is24Hour = false)
    } else {
        rememberTimePickerState()
    }

    if (showTimePickerForSlot != null) {
        M3TimePickerDialog(
            onCancel = { showTimePickerForSlot = null },
            onConfirm = {
                val h = timePickerState.hour
                val m = timePickerState.minute
                when (showTimePickerForSlot) {
                    1 -> {
                        customTime1Hour = h; customTime1Minute = m
                        prefs.edit().putInt("custom_time_1_hour", h).putInt("custom_time_1_minute", m).apply()
                    }
                    2 -> {
                        customTime2Hour = h; customTime2Minute = m
                        prefs.edit().putInt("custom_time_2_hour", h).putInt("custom_time_2_minute", m).apply()
                    }
                    3 -> {
                        customTime3Hour = h; customTime3Minute = m
                        prefs.edit().putInt("custom_time_3_hour", h).putInt("custom_time_3_minute", m).apply()
                    }
                }
                refreshAlarms()
                showTimePickerForSlot = null
            }
        ) {
            TimePicker(state = timePickerState)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .verticalScroll(scrollState)
            .padding(horizontal = HomeDimens.ContentPadding)
            .padding(top = topPadding, bottom = 100.dp)
    ) {
        val lang = LocalAppLanguage.current
        // Section: Push Notifications
        Text(
            text = AppStrings.Settings.pushNotifications(lang),
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = colors.textSecondary,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        
        SettingsListGroup(cardColor = colors.surface) {
            NotificationToggleItem(
                icon = Icons.Outlined.Article,
                iconBgColor = AppColors.Orange,
                title = if (lang == AppStrings.TAMIL) "தினசரி புதுப்பிப்புகள்" else "Daily Updates",
                description = if (lang == AppStrings.TAMIL) "தினசரி வகுப்பு குறிப்புகள் & கல்வி புதுப்பிப்புகள்" else "Daily class notes & academic updates",
                checked = dailyUpdateEnabled,
                onCheckedChange = {
                    dailyUpdateEnabled = it
                    prefs.edit().putBoolean("daily_update", it).apply()
                },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary,
                accentColor = colors.accent
            )
            Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))

            NotificationToggleItem(
                icon = Icons.Outlined.Campaign,
                iconBgColor = AppColors.Blue,
                title = if (lang == AppStrings.TAMIL) "பொது அறிவிப்புகள்" else "General Notices",
                description = if (lang == AppStrings.TAMIL) "கல்லூரியின் பொது அறிவிப்புகள்" else "General announcements from college",
                checked = generalNoticeEnabled,
                onCheckedChange = {
                    generalNoticeEnabled = it
                    prefs.edit().putBoolean("general_notice", it).apply()
                },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary,
                accentColor = colors.accent
            )
            Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))

            NotificationToggleItem(
                icon = Icons.Outlined.ViewTimeline,
                iconBgColor = AppColors.Green,
                title = if (lang == AppStrings.TAMIL) "வகுப்பு அட்டவணை" else "Class Schedule",
                description = if (lang == AppStrings.TAMIL) "இன்றைய நேர அட்டவணை மற்றும் பாடங்கள்" else "Today's timetable and subjects",
                checked = classScheduleEnabled,
                onCheckedChange = {
                    classScheduleEnabled = it
                    prefs.edit().putBoolean("class_schedule", it).apply()
                },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary,
                accentColor = colors.accent
            )
            Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))

            NotificationToggleItem(
                icon = Icons.Outlined.Science,
                iconBgColor = AppColors.Teal,
                title = "Lab Reminders",
                description = "Batch-specific labs and labcoat alerts",
                checked = labRemindersEnabled,
                onCheckedChange = {
                    labRemindersEnabled = it
                    prefs.edit().putBoolean("lab_reminders", it).apply()
                },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary,
                accentColor = colors.accent
            )
            Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))

            NotificationToggleItem(
                icon = Icons.Outlined.AutoStories,
                iconBgColor = AppColors.Yellow,
                title = "Study Reminders",
                description = "Motivation for upcoming exams",
                checked = studyRemindersEnabled,
                onCheckedChange = {
                    studyRemindersEnabled = it
                    prefs.edit().putBoolean("study_reminders", it).apply()
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
                description = "Reminders for Today / Tomorrow exams",
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
                iconBgColor = AppColors.Pink,
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
                description = "Critical instant announcements",
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
        
        // Section: Notification Timings
        Text(
            text = AppStrings.Settings.notificationTimings(lang),
            style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
            color = colors.textSecondary,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        
        SettingsListGroup(cardColor = colors.surface) {
            NotificationToggleItem(
                icon = Icons.Outlined.Schedule,
                iconBgColor = AppColors.Teal,
                title = "Use Custom Times",
                description = if (useCustomTimes) "Using 3 custom alarm times" else "Using default college timings",
                checked = useCustomTimes,
                onCheckedChange = {
                    useCustomTimes = it
                    prefs.edit().putBoolean("use_custom_times", it).apply()
                    refreshAlarms()
                },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary,
                accentColor = colors.accent
            )
            
            Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
            
            // Render 3 Timing Rows
            val slots = listOf(
                Triple("Morning Wake", if (useCustomTimes) customTime1Hour else 5, if (useCustomTimes) customTime1Minute else 30),
                Triple("Pre-College", if (useCustomTimes) customTime2Hour else 6, if (useCustomTimes) customTime2Minute else 30),
                Triple("College Entry", if (useCustomTimes) customTime3Hour else 7, if (useCustomTimes) customTime3Minute else 30)
            )
            
            slots.forEachIndexed { index, slotData ->
                val (label, hour, minute) = slotData
                val displayHour = if (hour == 0) 12 else if (hour > 12) hour - 12 else hour
                val amPm = if (hour >= 12) "PM" else "AM"
                val displayTime = String.format(Locale.getDefault(), "%02d:%02d %s", displayHour, minute, amPm)
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(enabled = useCustomTimes) {
                            showTimePickerForSlot = index + 1
                        }
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Clock Icon
                    Icon(
                        Icons.Outlined.Alarm, 
                        contentDescription = null, 
                        tint = if (useCustomTimes) colors.accent else colors.textSecondary.copy(alpha = 0.5f), 
                        modifier = Modifier.padding(start = 8.dp).size(24.dp)
                    )
                    
                    Spacer(modifier = Modifier.width(24.dp))
                    
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            label, 
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), 
                            color = if (useCustomTimes) colors.textPrimary else colors.textSecondary.copy(alpha = 0.5f)
                        )
                    }
                    
                    Text(
                        displayTime, 
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), 
                        color = if (useCustomTimes) colors.accent else colors.textSecondary.copy(alpha = 0.5f)
                    )
                }
                
                if (index < slots.lastIndex) {
                    Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Info Section
        Text(
            text = AppStrings.Settings.notificationNote(lang),
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

@Composable
fun M3TimePickerDialog(
    title: String = "Select Time",
    onCancel: () -> Unit,
    onConfirm: () -> Unit,
    toggle: @Composable () -> Unit = {},
    content: @Composable () -> Unit,
) {
    androidx.compose.ui.window.Dialog(
        onDismissRequest = onCancel,
        properties = androidx.compose.ui.window.DialogProperties(
            usePlatformDefaultWidth = false
        ),
    ) {
        Surface(
            shape = MaterialTheme.shapes.extraLarge,
            tonalElevation = 6.dp,
            modifier = Modifier
                .width(IntrinsicSize.Min)
                .height(IntrinsicSize.Min)
                .background(
                    shape = MaterialTheme.shapes.extraLarge,
                    color = MaterialTheme.colorScheme.surface
                ),
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 20.dp),
                    text = title,
                    style = MaterialTheme.typography.labelMedium
                )
                content()
                Row(
                    modifier = Modifier
                        .height(40.dp)
                        .fillMaxWidth()
                ) {
                    toggle()
                    Spacer(modifier = Modifier.weight(1f))
                    TextButton(
                        onClick = onCancel
                    ) { Text("Cancel") }
                    TextButton(
                        onClick = onConfirm
                    ) { Text("OK") }
                }
            }
        }
    }
}

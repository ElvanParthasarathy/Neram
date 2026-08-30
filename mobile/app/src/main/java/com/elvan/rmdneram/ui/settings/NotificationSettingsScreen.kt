package com.elvan.rmdneram.ui.settings

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.ripple
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.components.shell.*
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
import com.elvan.rmdneram.utils.AlarmScheduler
import java.util.Locale

/**
 * Notification Settings Screen for controlling notification channels and preferences.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationSettingsScreen(
    onBack: () -> Unit = {},
    scrollState: androidx.compose.foundation.lazy.LazyListState = rememberLazyListState()
) {
    val context = LocalContext.current
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    
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

    ElvanSubShell(
        title = AppStrings.Settings.notificationSettings(lang),
        onBack = onBack,
        scrollState = scrollState,
        colors = colors
    ) {
        LazyColumn(
            state = scrollState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
            verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
        ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(280.dp - HomeDimens.SectionSpacing))
            }

            item(key = "push_notifications") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = AppStrings.Settings.pushNotifications(lang),
                        colors = colors
                    ) {
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Article,
                            title = if (lang == AppStrings.TAMIL) "தினசரி புதுப்பிப்புகள்" else "Daily Updates",
                            description = if (lang == AppStrings.TAMIL) "தினசரி வகுப்பு குறிப்புகள் & கல்வி புதுப்பிப்புகள்" else "Daily class notes & academic updates",
                            onClick = {
                                val next = !dailyUpdateEnabled
                                dailyUpdateEnabled = next
                                prefs.edit().putBoolean("daily_update", next).apply()
                            },
                            customTrailing = {
                                ElvanSettingsSwitch(
                                    checked = dailyUpdateEnabled,
                                    onCheckedChange = {
                                        dailyUpdateEnabled = it
                                        prefs.edit().putBoolean("daily_update", it).apply()
                                    },
                                    colors = colors
                                )
                            },
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)

                        ElvanSettingsRow(
                            icon = Icons.Outlined.Campaign,
                            title = if (lang == AppStrings.TAMIL) "பொது அறிவிப்புகள்" else "General Notices",
                            description = if (lang == AppStrings.TAMIL) "கல்லூரியின் பொது அறிவிப்புகள்" else "General announcements from college",
                            onClick = {
                                val next = !generalNoticeEnabled
                                generalNoticeEnabled = next
                                prefs.edit().putBoolean("general_notice", next).apply()
                            },
                            customTrailing = {
                                ElvanSettingsSwitch(
                                    checked = generalNoticeEnabled,
                                    onCheckedChange = {
                                        generalNoticeEnabled = it
                                        prefs.edit().putBoolean("general_notice", it).apply()
                                    },
                                    colors = colors
                                )
                            },
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)

                        ElvanSettingsRow(
                            icon = Icons.Outlined.ViewTimeline,
                            title = if (lang == AppStrings.TAMIL) "வகுப்பு அட்டவணை" else "Class Schedule",
                            description = if (lang == AppStrings.TAMIL) "இன்றைய நேர அட்டவணை மற்றும் பாடங்கள்" else "Today's timetable and subjects",
                            onClick = {
                                val next = !classScheduleEnabled
                                classScheduleEnabled = next
                                prefs.edit().putBoolean("class_schedule", next).apply()
                            },
                            customTrailing = {
                                ElvanSettingsSwitch(
                                    checked = classScheduleEnabled,
                                    onCheckedChange = {
                                        classScheduleEnabled = it
                                        prefs.edit().putBoolean("class_schedule", it).apply()
                                    },
                                    colors = colors
                                )
                            },
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)

                        ElvanSettingsRow(
                            icon = Icons.Outlined.Science,
                            title = "Lab Reminders",
                            description = "Batch-specific labs and labcoat alerts",
                            onClick = {
                                val next = !labRemindersEnabled
                                labRemindersEnabled = next
                                prefs.edit().putBoolean("lab_reminders", next).apply()
                            },
                            customTrailing = {
                                ElvanSettingsSwitch(
                                    checked = labRemindersEnabled,
                                    onCheckedChange = {
                                        labRemindersEnabled = it
                                        prefs.edit().putBoolean("lab_reminders", it).apply()
                                    },
                                    colors = colors
                                )
                            },
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)

                        ElvanSettingsRow(
                            icon = Icons.Outlined.AutoStories,
                            title = "Study Reminders",
                            description = "Motivation for upcoming exams",
                            onClick = {
                                val next = !studyRemindersEnabled
                                studyRemindersEnabled = next
                                prefs.edit().putBoolean("study_reminders", next).apply()
                            },
                            customTrailing = {
                                ElvanSettingsSwitch(
                                    checked = studyRemindersEnabled,
                                    onCheckedChange = {
                                        studyRemindersEnabled = it
                                        prefs.edit().putBoolean("study_reminders", it).apply()
                                    },
                                    colors = colors
                                )
                            },
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)

                        ElvanSettingsRow(
                            icon = Icons.Outlined.School,
                            title = "Exam Alerts",
                            description = "Reminders for Today / Tomorrow exams",
                            onClick = {
                                val next = !examAlertsEnabled
                                examAlertsEnabled = next
                                prefs.edit().putBoolean("exam_alerts", next).apply()
                            },
                            customTrailing = {
                                ElvanSettingsSwitch(
                                    checked = examAlertsEnabled,
                                    onCheckedChange = {
                                        examAlertsEnabled = it
                                        prefs.edit().putBoolean("exam_alerts", it).apply()
                                    },
                                    colors = colors
                                )
                            },
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)

                        ElvanSettingsRow(
                            icon = Icons.Outlined.CalendarMonth,
                            title = "Event Reminders",
                            description = "Holidays and special events",
                            onClick = {
                                val next = !eventRemindersEnabled
                                eventRemindersEnabled = next
                                prefs.edit().putBoolean("event_reminders", next).apply()
                            },
                            customTrailing = {
                                ElvanSettingsSwitch(
                                    checked = eventRemindersEnabled,
                                    onCheckedChange = {
                                        eventRemindersEnabled = it
                                        prefs.edit().putBoolean("event_reminders", it).apply()
                                    },
                                    colors = colors
                                )
                            },
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)

                        ElvanSettingsRow(
                            icon = Icons.Outlined.NotificationsActive,
                            title = "Instant Alerts",
                            description = "Critical instant announcements",
                            onClick = {
                                val next = !instantAlertsEnabled
                                instantAlertsEnabled = next
                                prefs.edit().putBoolean("instant_alerts", next).apply()
                            },
                            customTrailing = {
                                ElvanSettingsSwitch(
                                    checked = instantAlertsEnabled,
                                    onCheckedChange = {
                                        instantAlertsEnabled = it
                                        prefs.edit().putBoolean("instant_alerts", it).apply()
                                    },
                                    colors = colors
                                )
                            },
                            colors = colors
                        )
                    }
                }
            }

            item(key = "notification_timings") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = AppStrings.Settings.notificationTimings(lang),
                        colors = colors
                    ) {
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Schedule,
                            title = "Use Custom Times",
                            description = if (useCustomTimes) "Using 3 custom alarm times" else "Using default college timings",
                            onClick = {
                                val next = !useCustomTimes
                                useCustomTimes = next
                                prefs.edit().putBoolean("use_custom_times", next).apply()
                                refreshAlarms()
                            },
                            customTrailing = {
                                ElvanSettingsSwitch(
                                    checked = useCustomTimes,
                                    onCheckedChange = {
                                        useCustomTimes = it
                                        prefs.edit().putBoolean("use_custom_times", it).apply()
                                        refreshAlarms()
                                    },
                                    colors = colors
                                )
                            },
                            colors = colors
                        )

                        ElvanSettingsDivider(colors = colors)

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

                            val timeRowRipple = if (colors.isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f)
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable(
                                        enabled = useCustomTimes,
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = ripple(color = timeRowRipple, bounded = true)
                                    ) {
                                        showTimePickerForSlot = index + 1
                                    },
                                color = Color.Transparent
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp, vertical = 16.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val isDark = colors.isDark
                                    val iconBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
                                    Box(
                                        modifier = Modifier
                                            .size(36.dp)
                                            .clip(CircleShape)
                                            .background(iconBg),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Outlined.Alarm,
                                            contentDescription = null,
                                            tint = if (useCustomTimes) colors.textPrimary else colors.textPrimary.copy(alpha = 0.3f),
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }

                                    Spacer(modifier = Modifier.width(16.dp))

                                    Text(
                                        text = label,
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Medium
                                        ),
                                        color = if (useCustomTimes) colors.textPrimary else colors.textPrimary.copy(alpha = 0.3f),
                                        modifier = Modifier.weight(1f)
                                    )

                                    Text(
                                        text = displayTime,
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.SemiBold
                                        ),
                                        color = if (useCustomTimes) colors.textPrimary else colors.textPrimary.copy(alpha = 0.3f)
                                    )
                                }
                            }

                            if (index < slots.lastIndex) {
                                ElvanSettingsDivider(colors = colors)
                            }
                        }
                    }
                }
            }

            item(key = "notification_note") {
                ElvanSectionContainer {
                    Text(
                        text = AppStrings.Settings.notificationNote(lang),
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textPrimary.copy(alpha = 0.5f),
                        modifier = Modifier.padding(horizontal = 8.dp)
                    )
                }
            }

            item(key = "spacer_bottom") {
                ElvanCollapseSpacer(itemCount = 6, itemHeight = 90.dp)
            }
        }
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

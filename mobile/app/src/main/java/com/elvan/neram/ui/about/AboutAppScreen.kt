package com.elvan.neram.ui.about

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.theme.ElvanSansFontFamily
import com.elvan.neram.ui.theme.LocalAppFontFamily

@Composable
fun AboutAppScreen(
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val ff = LocalAppFontFamily.current

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(280.dp - HomeDimens.SectionSpacing))
            }

            item(key = "app_header") {
                ElvanSectionContainer {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "நேரம்",
                            style = TextStyle(
                                fontSize = 48.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = ElvanSansFontFamily
                            ),
                            color = colors.textPrimary
                        )
                        Text(
                            "Neram",
                            style = TextStyle(
                                fontSize = 20.sp,
                                fontWeight = FontWeight.SemiBold,
                                fontFamily = ff
                            ),
                            color = colors.textPrimary.copy(alpha = 0.5f)
                        )
                    }
                }
            }

            item(key = "description_card") {
                ElvanSectionContainer {
                    ElvanSettingsSection(colors = colors) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(20.dp)
                        ) {
                            Text(
                                "What is Neram?",
                                style = TextStyle(
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    fontFamily = ff
                                ),
                                color = colors.textPrimary,
                                modifier = Modifier.padding(bottom = 12.dp)
                            )
                            Text(
                                "Neram (நேரம், meaning 'Time') is a sleek, all-in-one campus companion app designed specifically for RMK Group of Institutions students. It brings together everything you need to stay organized and informed throughout your academic day.\n\nThis application was developed by Jaiprakash Parthasarathy, a student from the ECE Department of RMD Engineering College.",
                                style = TextStyle(
                                    fontSize = 14.sp,
                                    lineHeight = 22.sp,
                                    fontFamily = ff
                                ),
                                color = colors.textPrimary.copy(alpha = 0.6f),
                                textAlign = TextAlign.Start
                            )
                        }
                    }
                }
            }

            item(key = "features_section") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = "FEATURES",
                        colors = colors
                    ) {
                        ElvanSettingsRow(
                            icon = Icons.Outlined.CalendarMonth,
                            title = "Smart Timetable",
                            description = "View your daily class schedule with faculty info, room numbers, and real-time updates.",
                            onClick = {},
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.DateRange,
                            title = "Exam Calendar",
                            description = "Track upcoming exams, internals, and important academic events with countdown timers.",
                            onClick = {},
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Campaign,
                            title = "Campus Announcements",
                            description = "Get instant notifications for news, circulars, and announcements from the college.",
                            onClick = {},
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.OfflineBolt,
                            title = "Offline Support",
                            description = "Access your timetable and cached data even without an internet connection.",
                            onClick = {},
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Sync,
                            title = "Cloud Sync",
                            description = "Your schedule and preferences sync seamlessly across devices with Firebase.",
                            onClick = {},
                            colors = colors
                        )
                    }
                }
            }

            item(key = "footer") {
                ElvanSectionContainer {
                    Text(
                        "Built with ❤️ by Elvan Parthasarathy",
                        style = TextStyle(
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium,
                            fontFamily = ff
                        ),
                        color = colors.textPrimary.copy(alpha = 0.4f),
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
}


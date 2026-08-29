package com.elvan.rmdneram.ui.about

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.theme.AppColors

@Composable
fun AboutAppScreen(
    onBack: () -> Unit,
    scrollState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val colors = rememberHomeColors()

    BackHandler { onBack() }

    com.elvan.rmdneram.ui.components.shell.ElvanSubShell(
        title = "About App",
        onBack = onBack,
        scrollState = scrollState,
        colors = colors
    ) {
        androidx.compose.foundation.lazy.LazyColumn(
            state = scrollState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = HomeDimens.ContentPaddingBottom),
            verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
        ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(280.dp - HomeDimens.SectionSpacing))
            }

            item(key = "app_header") {
                com.elvan.rmdneram.ui.components.shell.ElvanSectionContainer {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "நேரம்",
                            style = HomeTypography.PageTitle.copy(
                                fontSize = 48.sp,
                                fontFamily = com.elvan.rmdneram.ui.theme.ElvanSansFontFamily
                            ),
                            color = colors.textPrimary
                        )
                        Text(
                            "Neram",
                            style = HomeTypography.PillTitle.copy(fontSize = 20.sp),
                            color = colors.textSecondary
                        )
                    }
                }
            }

            item(key = "description_card") {
                com.elvan.rmdneram.ui.components.shell.ElvanSectionContainer {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Item)
                            .background(colors.surface)
                            .padding(24.dp)
                    ) {
                        Text(
                            "What is Neram?",
                            style = HomeTypography.ExamTitle,
                            color = colors.textPrimary,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                        Text(
                            "Neram (நேரம், meaning 'Time') is a sleek, all-in-one campus companion app designed specifically for RMK Group of Institutions students. It brings together everything you need to stay organized and informed throughout your academic day.\n\nThis application was developed by Jaiprakash Parthasarathy, a student from the ECE Department of RMD Engineering College.",
                            style = HomeTypography.MessageBody.copy(
                                lineHeight = 26.sp,
                                fontFamily = com.elvan.rmdneram.ui.theme.ElvanSansFontFamily
                            ),
                            color = colors.textSecondary,
                            textAlign = TextAlign.Start
                        )
                    }
                }
            }

            item(key = "features_section") {
                com.elvan.rmdneram.ui.components.shell.ElvanSectionContainer {
                    Column {
                        Text(
                            "FEATURES",
                            style = HomeTypography.ExamTag,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(bottom = 12.dp, start = 8.dp)
                        )

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(HomeShapes.Item)
                                .background(colors.surface)
                                .padding(20.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            FeatureItem(
                                icon = Icons.Outlined.CalendarMonth,
                                iconColor = AppColors.Blue,
                                title = "Smart Timetable",
                                description = "View your daily class schedule with faculty info, room numbers, and real-time updates."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            FeatureItem(
                                icon = Icons.Outlined.DateRange,
                                iconColor = AppColors.Purple,
                                title = "Exam Calendar",
                                description = "Track upcoming exams, internals, and important academic events with countdown timers."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            FeatureItem(
                                icon = Icons.Outlined.Campaign,
                                iconColor = AppColors.Orange,
                                title = "Campus Announcements",
                                description = "Get instant notifications for news, circulars, and announcements from the college."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            FeatureItem(
                                icon = Icons.Outlined.OfflineBolt,
                                iconColor = AppColors.Green,
                                title = "Offline Support",
                                description = "Access your timetable and cached data even without an internet connection."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            FeatureItem(
                                icon = Icons.Outlined.Sync,
                                iconColor = AppColors.Red,
                                title = "Cloud Sync",
                                description = "Your schedule and preferences sync seamlessly across devices with Firebase."
                            )
                        }
                    }
                }
            }

            item(key = "footer") {
                com.elvan.rmdneram.ui.components.shell.ElvanSectionContainer {
                    Text(
                        "Built with ❤️ by Elvan Parthasarathy",
                        style = HomeTypography.PillTime,
                        color = colors.textSecondary.copy(alpha = 0.6f),
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

@Composable
private fun FeatureItem(
    icon: ImageVector,
    iconColor: androidx.compose.ui.graphics.Color,
    title: String,
    description: String
) {
    val colors = rememberHomeColors()

    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(iconColor.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = iconColor, modifier = Modifier.size(18.dp))
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                title,
                style = HomeTypography.PillTitle.copy(fontSize = 15.sp),
                color = colors.textPrimary,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                description,
                style = HomeTypography.PillTime.copy(lineHeight = 20.sp),
                color = colors.textSecondary
            )
        }
    }
}

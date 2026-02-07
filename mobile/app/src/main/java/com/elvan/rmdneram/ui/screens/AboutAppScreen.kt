package com.elvan.rmdneram.ui.screens

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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutAppScreen(
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val scrollState = rememberScrollState()

    BackHandler { onBack() }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "About App",
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
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .padding(horizontal = HomeDimens.ContentPadding)
                .padding(top = 24.dp, bottom = 100.dp)
        ) {
            // App Name (Header)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
               // Photo Removed per request

                Text(
                    "நேரம்",
                    style = HomeTypography.PageTitle.copy(
                        fontSize = 48.sp,
                        fontFamily = com.elvan.rmdneram.ui.theme.MuktaMalarFontFamily
                    ),
                    color = colors.textPrimary
                )
                Text(
                    "Neram",
                    style = HomeTypography.PillTitle.copy(fontSize = 20.sp),
                    color = colors.textSecondary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Description Card
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
                    "Neram (நேரம், meaning 'Time') is a sleek, all-in-one campus companion app designed specifically for RMD Engineering College students. It brings together everything you need to stay organized and informed throughout your academic day.",
                    style = HomeTypography.MessageBody.copy(
                        lineHeight = 26.sp,
                        fontFamily = com.elvan.rmdneram.ui.theme.MuktaMalarFontFamily
                    ),
                    color = colors.textSecondary,
                    textAlign = TextAlign.Start
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Features Section
            Text(
                "FEATURES",
                style = HomeTypography.ExamTag,
                color = colors.textSecondary,
                modifier = Modifier.padding(bottom = 12.dp, start = 4.dp)
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
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                FeatureItem(
                    icon = Icons.Outlined.DateRange,
                    iconColor = AppColors.Purple,
                    title = "Exam Calendar",
                    description = "Track upcoming exams, internals, and important academic events with countdown timers."
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                FeatureItem(
                    icon = Icons.Outlined.Campaign,
                    iconColor = AppColors.Orange,
                    title = "Campus Announcements",
                    description = "Get instant notifications for news, circulars, and announcements from the college."
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                FeatureItem(
                    icon = Icons.Outlined.OfflineBolt,
                    iconColor = AppColors.Green,
                    title = "Offline Support",
                    description = "Access your timetable and cached data even without an internet connection."
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                FeatureItem(
                    icon = Icons.Outlined.Sync,
                    iconColor = AppColors.Red,
                    title = "Cloud Sync",
                    description = "Your schedule and preferences sync seamlessly across devices with Firebase."
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Footer
            Text(
                "Built with ❤️ by Elvan Parthasarathy",
                style = HomeTypography.PillTime,
                color = colors.textSecondary.copy(alpha = 0.6f),
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "v1.0.0 (BETA)",
                style = HomeTypography.PillTime.copy(fontSize = 12.sp),
                color = colors.textSecondary.copy(alpha = 0.5f),
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center
            )
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

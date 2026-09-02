package com.elvan.neram.ui.about

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.R
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.ElvanSansFontFamily
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage

@Composable
fun AboutAppScreen(
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val ff = LocalAppFontFamily.current
    val lang = LocalAppLanguage.current

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        // App Header with Official Vector App Icon
        item(key = "app_header") {
            ElvanSectionContainer {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    val isDark = colors.isDark
                    val logoBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
                    
                    // Increased logo icon size inside
                    Box(
                        modifier = Modifier
                            .size(88.dp)
                            .clip(RoundedCornerShape(24.dp))
                            .background(logoBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            painter = painterResource(id = R.drawable.ic_splash_logo),
                            contentDescription = K.navNeram.tr(lang),
                            tint = colors.textPrimary,
                            modifier = Modifier.size(68.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Language-aware single name alone
                    val appName = K.navNeram.tr(lang)
                    Text(
                        text = appName,
                        style = TextStyle(
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = ElvanSansFontFamily
                        ),
                        color = colors.textPrimary
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    // Subtle "From Elvan Navil" below name
                    Text(
                        text = K.fromElvanNavil.tr(lang),
                        style = TextStyle(
                            fontSize = 13.5.sp,
                            fontWeight = FontWeight.Normal,
                            fontFamily = ff
                        ),
                        color = colors.textSecondary.copy(alpha = 0.85f)
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
                            text = K.whatIsNeram.tr(lang),
                            style = TextStyle(
                                fontSize = 17.sp,
                                fontWeight = FontWeight.SemiBold,
                                fontFamily = ff
                            ),
                            color = colors.textPrimary,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )
                        Text(
                            text = K.aboutNeramDesc.tr(lang),
                            style = TextStyle(
                                fontSize = 14.sp,
                                lineHeight = 22.sp,
                                fontFamily = ff
                            ),
                            color = colors.textPrimary.copy(alpha = 0.7f),
                            textAlign = TextAlign.Start
                        )
                    }
                }
            }
        }

        item(key = "features_section") {
            ElvanSectionContainer {
                ElvanSettingsSection(
                    title = K.features.tr(lang),
                    colors = colors
                ) {
                    ElvanSettingsRow(
                        icon = Icons.Outlined.CalendarMonth,
                        title = K.smartTimetable.tr(lang),
                        description = K.smartTimetableDesc.tr(lang),
                        onClick = {},
                        colors = colors
                    )
                    ElvanSettingsDivider(colors = colors)
                    ElvanSettingsRow(
                        icon = Icons.Outlined.DateRange,
                        title = K.examCalendar.tr(lang),
                        description = K.examCalendarDesc.tr(lang),
                        onClick = {},
                        colors = colors
                    )
                    ElvanSettingsDivider(colors = colors)
                    ElvanSettingsRow(
                        icon = Icons.Outlined.Campaign,
                        title = K.campusAnnouncements.tr(lang),
                        description = K.campusAnnouncementsDesc.tr(lang),
                        onClick = {},
                        colors = colors
                    )
                    ElvanSettingsDivider(colors = colors)
                    ElvanSettingsRow(
                        icon = Icons.Outlined.OfflineBolt,
                        title = K.offlineSupport.tr(lang),
                        description = K.offlineSupportDesc.tr(lang),
                        onClick = {},
                        colors = colors
                    )
                    ElvanSettingsDivider(colors = colors)
                    ElvanSettingsRow(
                        icon = Icons.Outlined.Sync,
                        title = K.cloudSync.tr(lang),
                        description = K.cloudSyncDesc.tr(lang),
                        onClick = {},
                        colors = colors
                    )
                }
            }
        }
    }
}

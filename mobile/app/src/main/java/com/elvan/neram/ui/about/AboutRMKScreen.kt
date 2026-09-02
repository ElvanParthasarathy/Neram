package com.elvan.neram.ui.about

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.AppColors
import com.elvan.neram.ui.theme.LocalAppLanguage

@Composable
fun AboutRMKScreen(
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
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

        item(key = "header_card") {
            ElvanSectionContainer {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(HomeShapes.Item)
                        .background(colors.surface)
                        .padding(24.dp)
                ) {
                    Text(
                        text = K.rmkGroupLegacy.tr(lang),
                        style = HomeTypography.ExamTitle,
                        color = colors.textPrimary,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                    Text(
                        text = K.rmkDescription.tr(lang),
                        style = HomeTypography.MessageBody.copy(lineHeight = 26.sp),
                        color = colors.textSecondary,
                        textAlign = TextAlign.Start
                    )
                }
            }
        }

        item(key = "institutions_section") {
            ElvanSectionContainer {
                Column {
                    Text(
                        text = K.institutions.tr(lang).uppercase(),
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
                        val institutions = listOf(
                            K.rmdEnggCollege.tr(lang) to K.kavaraipettaiAddress.tr(lang),
                            K.rmkEnggCollege.tr(lang) to K.kavaraipettaiAddress.tr(lang),
                            K.rmkCet.tr(lang) to K.puduvoyalAddress.tr(lang),
                            K.sriDurgadeviPolytechnic.tr(lang) to K.kavaraipettaiAddress.tr(lang),
                            K.rmkSchool.tr(lang) to K.kavaraipettaiAddress.tr(lang),
                            K.rmkMatricSchool.tr(lang) to K.kavaraipettaiAddress.tr(lang),
                            K.rmkSchool.tr(lang) to K.thiruverkaduAddress.tr(lang)
                        )
                        institutions.forEachIndexed { index, (name, address) ->
                            RMKFeatureItem(
                                icon = Icons.Outlined.LocationOn,
                                iconColor = AppColors.Blue,
                                title = name,
                                description = address
                            )
                            if (index < institutions.lastIndex) {
                                HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            }
                        }
                    }
                }
            }
        }

        item(key = "vision_section") {
            ElvanSectionContainer {
                Column {
                    Text(
                        text = K.visionMission.tr(lang).uppercase(),
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
                        RMKFeatureItem(
                            icon = Icons.Outlined.Explore,
                            iconColor = AppColors.Blue,
                            title = K.globalExcellence.tr(lang),
                            description = K.globalExcellenceDesc.tr(lang)
                        )
                        HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                        RMKFeatureItem(
                            icon = Icons.Outlined.FilterCenterFocus,
                            iconColor = AppColors.Purple,
                            title = K.transformingLearners.tr(lang),
                            description = K.transformingLearnersDesc.tr(lang)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RMKFeatureItem(
    icon: ImageVector,
    iconColor: Color,
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

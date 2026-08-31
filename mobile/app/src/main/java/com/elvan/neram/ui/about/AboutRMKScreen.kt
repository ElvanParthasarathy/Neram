package com.elvan.neram.ui.about

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
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
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.theme.AppColors

import com.elvan.neram.ui.components.shell.LocalElvanScrollState

@Composable
fun AboutRMKScreen(
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val colors = rememberHomeColors()

    androidx.compose.foundation.lazy.LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(280.dp - HomeDimens.SectionSpacing))
            }

            item(key = "header_card") {
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Item)
                            .background(colors.surface)
                            .padding(24.dp)
                    ) {
                        Text(
                            "R.M.K. Group of Institutions",
                            style = HomeTypography.ExamTitle,
                            color = colors.textPrimary,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                        Text(
                            "A legacy of excellence in education, unparalleled discipline, and constant innovation.",
                            style = HomeTypography.MessageBody.copy(lineHeight = 26.sp),
                            color = colors.textSecondary,
                            textAlign = TextAlign.Start
                        )
                    }
                }
            }

            item(key = "institutions_section") {
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Column {
                        Text(
                            "OUR INSTITUTIONS",
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
                                "R.M.D. Engineering College" to "Kavaraipettai, Thiruvallur District",
                                "R.M.K. Engineering College" to "Kavaraipettai, Thiruvallur District",
                                "R.M.K. College of Engineering and Technology" to "Puduvoyal, Thiruvallur District",
                                "Sri Durgadevi Polytechnic College" to "Kavaraipettai, Thiruvallur District",
                                "R.M.K. Residential School" to "Kavaraipettai, Thiruvallur District",
                                "R.M.K. Matriculation School" to "Kavaraipettai, Thiruvallur District",
                                "R.M.K. School" to "Thiruverkadu, Chennai"
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

            item(key = "identity_section") {
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Column {
                        Text(
                            "OUR IDENTITY",
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
                                icon = Icons.Outlined.VerifiedUser,
                                iconColor = AppColors.Green,
                                title = "Quality Education",
                                description = "A commitment to excellence"
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            RMKFeatureItem(
                                icon = Icons.Outlined.LocationOn,
                                iconColor = AppColors.Red,
                                title = "Eco-friendly Campuses",
                                description = "Sprawling lush green campuses across multiple locations."
                            )
                        }
                    }
                }
            }

            item(key = "vision_section") {
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Column {
                        Text(
                            "OUR VISION",
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
                                title = "Global Excellence",
                                description = "To be the most preferred destination in the country for pursuing education in Engineering and its allied fields."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            RMKFeatureItem(
                                icon = Icons.Outlined.FilterCenterFocus,
                                iconColor = AppColors.Purple,
                                title = "Transforming Learners",
                                description = "To transform learners into achievers at the global level with the right attitude towards changing societal needs."
                            )
                        }
                    }
                }
            }

            item(key = "mission_section") {
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Column {
                        Text(
                            "OUR MISSION",
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
                            val missions = listOf(
                                Triple(Icons.Outlined.Apartment, AppColors.Blue, "To develop the needed resources and infrastructure, and to establish a conducive ambience for the teaching- learning process"),
                                Triple(Icons.Outlined.Favorite, AppColors.Red, "To nurture in the students, professional and ethical values, and to instill in them a spirit of innovation and entrepreneurship"),
                                Triple(Icons.Outlined.Lightbulb, AppColors.Orange, "To encourage in the students a desire for higher learning and research, to equip them to face the global challenges"),
                                Triple(Icons.Outlined.Build, AppColors.Green, "To provide opportunities for students to get the needed additional skills to make them industry ready"),
                                Triple(Icons.Outlined.Public, AppColors.Purple, "To interact with industries and other organizations to facilitate transfer of knowledge and know-how.")
                            )
                            missions.forEachIndexed { index, (icon, color, text) ->
                                RMKMissionItem(
                                    icon = icon,
                                    iconColor = color,
                                    description = text
                                )
                                if (index < missions.lastIndex) {
                                    HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                                }
                            }
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

@Composable
private fun RMKMissionItem(
    icon: ImageVector,
    iconColor: Color,
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
                description,
                style = HomeTypography.PillTime.copy(lineHeight = 20.sp),
                color = colors.textSecondary
            )
        }
    }
}

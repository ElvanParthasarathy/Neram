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
fun ManagementTeamScreen(
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
                Spacer(Modifier.height(com.elvan.neram.ui.components.shell.LocalElvanTopSpacerHeight.current))
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
                            "Management Team",
                            style = HomeTypography.ExamTitle,
                            color = colors.textPrimary,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                        Text(
                            "The visionaries driving excellence and innovation across the RMK Group.",
                            style = HomeTypography.MessageBody.copy(lineHeight = 26.sp),
                            color = colors.textSecondary,
                            textAlign = TextAlign.Start
                        )
                    }
                }
            }

            item(key = "founders_section") {
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Column {
                        Text(
                            "FOUNDERS",
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
                            ManagementMemberItem(
                                icon = Icons.Outlined.StarOutline,
                                iconColor = AppColors.Red,
                                name = "Thiru. R.S. Munirathinam",
                                role = "FOUNDER-CHAIRMAN",
                                bio = "A dedicated visionary and philanthropist who served as a Former Member of the Tamil Nadu State Assembly and founded the R.M.K. Group of Institutions."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            ManagementMemberItem(
                                icon = Icons.Outlined.PersonOutline,
                                iconColor = AppColors.Blue,
                                name = "Thiru. R.M. Kishore",
                                role = "VICE-CHAIRMAN",
                                bio = "Mechanical Engineer with an MBA from UK, focused on transforming learners into achievers with global standards."
                            )
                        }
                    }
                }
            }

            item(key = "board_section") {
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Column {
                        Text(
                            "BOARD OF DIRECTORS",
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
                            ManagementMemberItem(
                                icon = Icons.Outlined.FavoriteBorder,
                                iconColor = AppColors.Red,
                                name = "Tmt. Manjula Munirathinam",
                                role = "CHAIRPERSON",
                                bio = "Keen social worker and educationalist with over a decade of dedication to the group."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            ManagementMemberItem(
                                icon = Icons.Outlined.Work,
                                iconColor = AppColors.Orange,
                                name = "Thiru. R. Jothi Naidu",
                                role = "DIRECTOR",
                                bio = "Vast experience in industrial management, associated with the group for nearly 30 years."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            ManagementMemberItem(
                                icon = Icons.Outlined.PersonOutline,
                                iconColor = AppColors.Green,
                                name = "Thiru. Yalamanchi Pradeep",
                                role = "SECRETARY",
                                bio = "ECE Engineer (Guindy) with a Master's from Carnegie Mellon University, USA."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            ManagementMemberItem(
                                icon = Icons.Outlined.Star,
                                iconColor = AppColors.Purple,
                                name = "Dr. Durga Devi Pradeep",
                                role = "VICE CHAIRPERSON",
                                bio = "ECE Engineer with an MBA and Ph.D. in Management from Anna University."
                            )
                            HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                            ManagementMemberItem(
                                icon = Icons.Outlined.FavoriteBorder,
                                iconColor = AppColors.Red,
                                name = "Tmt. Sowmya Kishore",
                                role = "TRUSTEE",
                                bio = "ECE Engineer and Psychologist, currently pursuing doctoral research."
                            )
                        }
                    }
                }
            }
        }
}

@Composable
private fun ManagementMemberItem(
    icon: ImageVector,
    iconColor: Color,
    name: String,
    role: String,
    bio: String
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
                name,
                style = HomeTypography.PillTitle.copy(fontSize = 15.sp),
                color = colors.textPrimary,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                role,
                style = HomeTypography.PillTime.copy(
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.5.sp
                ),
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                bio,
                style = HomeTypography.PillTime.copy(lineHeight = 20.sp),
                color = colors.textSecondary
            )
        }
    }
}

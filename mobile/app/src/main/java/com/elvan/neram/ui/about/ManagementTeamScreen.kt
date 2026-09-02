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
fun ManagementTeamScreen(
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
                        text = K.managementTeam.tr(lang),
                        style = HomeTypography.ExamTitle,
                        color = colors.textPrimary,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )
                    Text(
                        text = K.managementTeamDesc.tr(lang),
                        style = HomeTypography.MessageBody.copy(lineHeight = 26.sp),
                        color = colors.textSecondary,
                        textAlign = TextAlign.Start
                    )
                }
            }
        }

        item(key = "founders_section") {
            ElvanSectionContainer {
                Column {
                    Text(
                        text = K.founders.tr(lang).uppercase(),
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
                            role = K.founderChairman.tr(lang).uppercase(),
                            bio = K.rsMunirathinamBio.tr(lang)
                        )
                        HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                        ManagementMemberItem(
                            icon = Icons.Outlined.PersonOutline,
                            iconColor = AppColors.Blue,
                            name = "Thiru. R.M. Kishore",
                            role = K.viceChairman.tr(lang).uppercase(),
                            bio = K.rmKishoreBio.tr(lang)
                        )
                    }
                }
            }
        }

        item(key = "board_section") {
            ElvanSectionContainer {
                Column {
                    Text(
                        text = K.boardOfDirectors.tr(lang).uppercase(),
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
                            role = K.chairperson.tr(lang).uppercase(),
                            bio = K.manjulaMunirathinamBio.tr(lang)
                        )
                        HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                        ManagementMemberItem(
                            icon = Icons.Outlined.Work,
                            iconColor = AppColors.Orange,
                            name = "Thiru. R. Jothi Naidu",
                            role = K.director.tr(lang).uppercase(),
                            bio = K.jothiNaiduBio.tr(lang)
                        )
                        HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 52.dp))
                        ManagementMemberItem(
                            icon = Icons.Outlined.PersonOutline,
                            iconColor = AppColors.Green,
                            name = "Thiru. Yalamanchi Pradeep",
                            role = K.secretary.tr(lang).uppercase(),
                            bio = K.yalamanchiPradeepBio.tr(lang)
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

package com.elvan.neram.ui.about

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.vectorResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.R
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage

@Composable
fun DeveloperInfoScreen(
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
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

        // Developer Profile Card
        item(key = "developer_hero") {
            ElvanSectionContainer {
                ElvanSettingsSection(colors = colors) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.img_developer_profile),
                            contentDescription = K.elvanParthasarathy.tr(lang),
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(80.dp)
                                .clip(CircleShape)
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Text(
                            text = K.elvanParthasarathy.tr(lang),
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                            ),
                            color = colors.textPrimary
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Monochrome Pill Button for Portfolio
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .background(colors.textPrimary.copy(alpha = 0.1f))
                                .clickable { com.elvan.neram.utils.IntentUtils.openUrl(context, "https://jaiprakashpartha.vercel.app/") }
                                .padding(horizontal = 20.dp, vertical = 10.dp)
                        ) {
                            Text(
                                text = K.visitPortfolio.tr(lang),
                                style = TextStyle(
                                    fontFamily = ff,
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.SemiBold
                                ),
                                color = colors.textPrimary
                            )
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                                contentDescription = null,
                                tint = colors.textPrimary,
                                modifier = Modifier.size(15.dp)
                            )
                        }
                    }
                }
            }
        }

        // Contact Links & Social Section
        item(key = "contact_section") {
            ElvanSectionContainer {
                ElvanSettingsSection(
                    title = K.connectWithMe.tr(lang).uppercase(),
                    colors = colors
                ) {
                    ElvanSettingsRow(
                        icon = Icons.Outlined.Email,
                        title = K.email.tr(lang),
                        description = "jaiprakashpartha@gmail.com",
                        onClick = {
                            try {
                                val intent = Intent(Intent.ACTION_SENDTO).apply {
                                    data = Uri.parse("mailto:jaiprakashpartha@gmail.com")
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    ElvanSettingsRow(
                        icon = ImageVector.vectorResource(id = R.drawable.ic_linkedin),
                        title = K.linkedin.tr(lang),
                        description = "linkedin.com/in/jaiprakashpartha",
                        onClick = { com.elvan.neram.utils.IntentUtils.openUrl(context, "https://www.linkedin.com/in/jaiprakashpartha") },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    ElvanSettingsRow(
                        icon = ImageVector.vectorResource(id = R.drawable.ic_github),
                        title = K.github.tr(lang),
                        description = "github.com/elvanparthasarathy",
                        onClick = { com.elvan.neram.utils.IntentUtils.openUrl(context, "https://github.com/elvanparthasarathy") },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    ElvanSettingsRow(
                        icon = Icons.Outlined.LocationOn,
                        title = K.location.tr(lang),
                        description = K.locationChennai.tr(lang),
                        onClick = {},
                        colors = colors
                    )
                }
            }
        }
    }
}

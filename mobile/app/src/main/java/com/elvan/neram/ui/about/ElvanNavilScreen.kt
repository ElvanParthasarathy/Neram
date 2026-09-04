package com.elvan.neram.ui.about

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage

@Composable
fun ElvanNavilScreen(
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

        // Clean Brand Layout: Text alone at top and website pill button
        item(key = "brand_content") {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Text alone at top
                Text(
                    text = K.elvanNavilBranding.tr(lang),
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 26.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    color = colors.textPrimary
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Monochrome Pill Button for Website
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(colors.textPrimary.copy(alpha = 0.1f))
                        .clickable { com.elvan.neram.utils.IntentUtils.openUrl(context, "https://elvannavil.vercel.app") }
                        .padding(horizontal = 22.dp, vertical = 11.dp)
                ) {
                    Text(
                        text = "elvannavil.vercel.app",
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        ),
                        color = colors.textPrimary
                    )
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                        contentDescription = null,
                        tint = colors.textPrimary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }

        // Footer: © All rights reserved and App Version
        item(key = "footer") {
            val versionName = remember(context) {
                try {
                    context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "2.5.11"
                } catch (_: Exception) {
                    "2.5.11"
                }
            }
            ElvanSectionContainer {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp, bottom = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "${K.navNeram.tr(lang)} v$versionName",
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Medium
                        ),
                        color = colors.textPrimary.copy(alpha = 0.45f)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = K.allRightsReserved.tr(lang),
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Normal
                        ),
                        color = colors.textPrimary.copy(alpha = 0.35f),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

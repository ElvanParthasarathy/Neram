package com.elvan.neram.ui.settings

import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.material3.ripple
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage

@Composable
fun DisplaySettingsScreen(
    currentTheme: String,
    onThemeChange: (String) -> Unit,
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
            }

            item(key = "theme_section") {
                ElvanSectionContainer {
                    ElvanSettingsSection(colors = colors) {
                        // Light & Dark theme options row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 24.dp, horizontal = 16.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            // Light Mode Option
                            ThemeOptionBox(
                                title = K.lightMode.tr(lang),
                                isSelected = currentTheme == "light",
                                isDarkModeDesign = false,
                                onClick = { onThemeChange("light") },
                                colors = colors
                            )

                            // Dark Mode Option
                            ThemeOptionBox(
                                title = K.darkMode.tr(lang),
                                isSelected = currentTheme == "dark",
                                isDarkModeDesign = true,
                                onClick = { onThemeChange("dark") },
                                colors = colors
                            )
                        }

                        ElvanSettingsDivider(colors = colors)

                        // Auto Mode Switch Row
                        val autoRippleColor = if (colors.isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f)
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable(
                                    interactionSource = remember { MutableInteractionSource() },
                                    indication = ripple(color = autoRippleColor, bounded = true)
                                ) {
                                    if (currentTheme == "auto") {
                                        onThemeChange(if (colors.isDark) "dark" else "light")
                                    } else {
                                        onThemeChange("auto")
                                    }
                                },
                            color = Color.Transparent
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 20.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = K.systemAuto.tr(lang),
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        lineHeight = 20.sp
                                    ),
                                    color = colors.textPrimary
                                )
                                ElvanSettingsSwitch(
                                    checked = currentTheme == "auto",
                                    onCheckedChange = { isChecked ->
                                        if (isChecked) {
                                            onThemeChange("auto")
                                        } else {
                                            onThemeChange(if (colors.isDark) "dark" else "light")
                                        }
                                    },
                                    colors = colors
                                )
                            }
                        }
                    }
                }
            }
        }
}

@Composable
private fun ThemeOptionBox(
    title: String,
    isSelected: Boolean,
    isDarkModeDesign: Boolean,
    onClick: () -> Unit,
    colors: HomeColors
) {
    val isDark = colors.isDark
    val ff = LocalAppFontFamily.current

    val boxBgColor = if (isDarkModeDesign) Color(0xFF1E1E1E) else Color(0xFFF5F5F5)
    val borderColor = if (isSelected) {
        if (isDarkModeDesign) Color(0xFF888888) else Color(0xFF555555)
    } else {
        if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.08f)
    }

    val bar1Color = if (isDarkModeDesign) Color.White.copy(alpha = 0.8f) else Color.Black.copy(alpha = 0.7f)
    val bar2Color = if (isDarkModeDesign) Color(0xFF444444) else Color(0xCFCFCFCF)

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.padding(horizontal = 4.dp)
    ) {
        // Preview Box (110dp x 85dp, 24dp rounded corners) with Material 3 Expressive Ripple
        Surface(
            onClick = onClick,
            shape = RoundedCornerShape(24.dp),
            color = boxBgColor,
            border = BorderStroke(1.dp, borderColor),
            modifier = Modifier
                .width(110.dp)
                .height(85.dp)
                .clip(RoundedCornerShape(24.dp))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.Start,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Bar 1 (32dp x 8dp)
                    Box(
                        modifier = Modifier
                            .width(32.dp)
                            .height(8.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(bar1Color)
                    )
                    // Bar 2 (Full width x 6dp)
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(bar2Color)
                    )
                    // Bar 3 (48dp x 6dp)
                    Box(
                        modifier = Modifier
                            .width(48.dp)
                            .height(6.dp)
                            .clip(RoundedCornerShape(4.dp))
                            .background(bar2Color)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        // Bottom label & radio button with ripple
        val optionRippleColor = if (isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier
                .clip(RoundedCornerShape(999.dp))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = ripple(color = optionRippleColor, bounded = true),
                    onClick = onClick
                )
                .padding(horizontal = 10.dp, vertical = 4.dp)
        ) {
            Icon(
                imageVector = if (isSelected) Icons.Filled.CheckCircle else Icons.Outlined.RadioButtonUnchecked,
                contentDescription = null,
                tint = if (isSelected) {
                    if (isDark) Color.White else Color.Black
                } else {
                    Color(0xFF888888)
                },
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = title,
                style = TextStyle(
                    fontFamily = ff,
                    fontSize = 14.sp,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium
                ),
                color = if (isSelected) colors.textPrimary else colors.textPrimary.copy(alpha = 0.5f)
            )
        }
    }
}


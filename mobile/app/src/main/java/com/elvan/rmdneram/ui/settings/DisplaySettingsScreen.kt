package com.elvan.rmdneram.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.theme.AppColors
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage

@Composable
fun DisplaySettingsScreen(
    currentTheme: String,
    onThemeChange: (String) -> Unit,
    onBack: () -> Unit,
    scrollState: androidx.compose.foundation.lazy.LazyListState = rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    val cardColor = colors.surface

    com.elvan.rmdneram.ui.components.shell.ElvanSubShell(
        title = AppStrings.Settings.display(lang),
        onBack = onBack,
        scrollState = scrollState,
        colors = colors
    ) {
        LazyColumn(
            state = scrollState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = HomeDimens.ContentPaddingBottom),
            verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
        ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(280.dp - HomeDimens.SectionSpacing))
            }

            item(key = "theme_card") {
                com.elvan.rmdneram.ui.components.shell.ElvanSectionContainer {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Item)
                            .background(cardColor)
                            .padding(24.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            // Light Mode Option
                            ThemeSelectionItem(
                                label = AppStrings.Display.lightTheme(lang),
                                isSelected = currentTheme == "light",
                                backgroundBrush = Brush.linearGradient(listOf(Color(0xFFF2F2F2), Color(0xFFE0E0E0))),
                                accent = AppColors.Blue,
                                textColor = colors.textPrimary,
                                onClick = { onThemeChange("light") }
                            )

                            // Dark Mode Option
                            ThemeSelectionItem(
                                label = AppStrings.Display.darkTheme(lang),
                                isSelected = currentTheme == "dark",
                                backgroundBrush = Brush.linearGradient(listOf(Color(0xFF1C1C1C), Color.Black)),
                                accent = AppColors.Blue,
                                textColor = colors.textPrimary,
                                onClick = { onThemeChange("dark") }
                            )
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        HorizontalDivider(color = colors.glassBorder, thickness = 1.dp)
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // System Auto Toggle
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { 
                                    if (currentTheme != "auto") onThemeChange("auto") else onThemeChange("light")
                                },
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(AppStrings.Display.systemAuto(lang), style = MaterialTheme.typography.bodyLarge, color = colors.textPrimary)
                                Text(AppStrings.Display.themeDescription(lang), style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                            }
                            Switch(
                                checked = currentTheme == "auto",
                                onCheckedChange = { isChecked ->
                                    if (isChecked) onThemeChange("auto") else onThemeChange("light")
                                },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White, 
                                    checkedTrackColor = AppColors.Blue
                                )
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ThemeSelectionItem(
    label: String,
    isSelected: Boolean,
    backgroundBrush: Brush,
    accent: Color,
    textColor: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable { onClick() }
    ) {
        // Preview Box (Phone screen lookalike)
        Box(
            modifier = Modifier
                .width(85.dp) // Slightly narrower to fit 3 items
                .height(80.dp) 
                .clip(RoundedCornerShape(12.dp))
                .background(backgroundBrush)
                .border(
                    width = if (isSelected) 2.dp else 0.dp, 
                    color = if (isSelected) accent else Color.Transparent,
                    shape = RoundedCornerShape(12.dp)
                )
        ) {
            // Mock UI elements inside
            Column(modifier = Modifier.padding(12.dp)) {
                Box(modifier = Modifier.width(30.dp).height(8.dp).clip(RoundedCornerShape(4.dp)).background(accent))
                Spacer(modifier = Modifier.height(8.dp))
                Box(modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color.Gray.copy(alpha=0.5f)))
                Spacer(modifier = Modifier.height(4.dp))
                Box(modifier = Modifier.fillMaxWidth(0.7f).height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color.Gray.copy(alpha=0.5f)))
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        Text(
            text = label, 
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = if(isSelected) FontWeight.Bold else FontWeight.Normal),
            color = if (isSelected) accent else textColor
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Radio Circle
        Icon(
             if (isSelected) Icons.Filled.CheckCircle else Icons.Outlined.Circle,
             contentDescription = null,
             tint = if (isSelected) accent else Color.Gray,
             modifier = Modifier.size(20.dp)
        )
    }
}

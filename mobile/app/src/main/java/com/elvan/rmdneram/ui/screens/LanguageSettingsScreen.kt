package com.elvan.rmdneram.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.Smartphone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.theme.AppColors
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.MuktaMalarFontFamily
import com.elvan.rmdneram.ui.theme.LocalAppLanguage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LanguageSettingsScreen(
    currentLanguage: String,
    onLanguageChange: (String) -> Unit,
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    val cardColor = colors.surface
    
    // Use current language for displaying strings
    val lang = currentLanguage

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        AppStrings.Settings.languageOther(lang),
                        style = HomeTypography.PageTitle.copy(
                            fontSize = 28.sp,
                            fontFamily = if (lang == AppStrings.TAMIL) MuktaMalarFontFamily else null
                        ), 
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
                ),
                scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Language Section Title
            Text(
                text = AppStrings.Settings.language(lang).uppercase(),
                style = HomeTypography.ExamTag,
                color = colors.textSecondary,
                modifier = Modifier.padding(bottom = 8.dp, start = 24.dp)
            )

            // Language Options Card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(HomeShapes.Item)
                    .background(cardColor)
                    .border(1.dp, colors.glassBorder, HomeShapes.Item)
            ) {
                // Device Language Option
                LanguageOptionItem(
                    icon = Icons.Outlined.Smartphone,
                    iconBgColor = AppColors.Blue,
                    title = AppStrings.Settings.deviceLanguage(lang),
                    subtitle = "Auto",
                    isSelected = currentLanguage == AppStrings.SYSTEM,
                    onClick = { onLanguageChange(AppStrings.SYSTEM) },
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary,
                    accentColor = colors.accent
                )
                
                HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 56.dp))
                
                // English Option
                LanguageOptionItem(
                    icon = Icons.Outlined.Language,
                    iconBgColor = AppColors.Green,
                    title = AppStrings.Settings.english(lang),
                    subtitle = "English",
                    isSelected = currentLanguage == AppStrings.ENGLISH,
                    onClick = { onLanguageChange(AppStrings.ENGLISH) },
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary,
                    accentColor = colors.accent
                )
                
                HorizontalDivider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 56.dp))
                
                // Tamil Option
                LanguageOptionItem(
                    icon = Icons.Outlined.Language,
                    iconBgColor = AppColors.Orange,
                    title = AppStrings.Settings.tamil(lang),
                    subtitle = "Tamil",
                    isSelected = currentLanguage == AppStrings.TAMIL,
                    onClick = { onLanguageChange(AppStrings.TAMIL) },
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary,
                    accentColor = colors.accent
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Info Text
            Text(
                if (lang == AppStrings.TAMIL) 
                    "மொழி மாற்றம் வழிசெலுத்தல், முகப்பு மெனு மற்றும் அமைப்புகளுக்கு மட்டுமே பொருந்தும். பாடநேர அட்டவணை தரவு மாறாது."
                else 
                    "Language change applies only to navigation, home menu, and settings. Timetable data will not change.",
                style = MaterialTheme.typography.bodySmall.copy(
                    fontFamily = if (lang == AppStrings.TAMIL) MuktaMalarFontFamily else null
                ),
                color = colors.textSecondary,
                modifier = Modifier.padding(horizontal = 12.dp)
            )
        }
    }
}

@Composable
private fun LanguageOptionItem(
    icon: ImageVector,
    iconBgColor: Color,
    title: String,
    subtitle: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    textColor: Color,
    subTextColor: Color,
    accentColor: Color
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 20.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Colored Icon Circle
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(iconBgColor),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                icon, 
                null, 
                tint = Color.White, 
                modifier = Modifier.size(20.dp)
            )
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                title, 
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), 
                color = textColor
            )
            Text(
                subtitle, 
                style = MaterialTheme.typography.bodySmall, 
                color = subTextColor
            )
        }
        
        // Check mark for selected
        if (isSelected) {
            Icon(
                Icons.Default.Check,
                contentDescription = "Selected",
                tint = accentColor,
                modifier = Modifier.size(24.dp)
            )
        }
    }
}

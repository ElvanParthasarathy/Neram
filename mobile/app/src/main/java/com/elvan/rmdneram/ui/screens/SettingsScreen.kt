package com.elvan.rmdneram.ui.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search

import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.navigation.CustomIcons
import com.elvan.rmdneram.ui.theme.AppColors
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.MuktaMalarFontFamily
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase
import com.elvan.rmdneram.data.model.UserProfile
import coil.compose.AsyncImage
import coil.request.ImageRequest
import androidx.compose.ui.layout.ContentScale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    userRole: String? = null,
    userProfile: UserProfile? = null,
    onBack: () -> Unit = {},
    onNavigateToProfile: () -> Unit,
    onNavigateToSecurity: () -> Unit,
    onNavigateToDisplay: () -> Unit,
    onNavigateToComplaint: () -> Unit,
    onNavigateToDeveloper: () -> Unit,
    onNavigateToStorage: () -> Unit,
    onNavigateToLanguage: () -> Unit,
    onNavigateToCalendarSettings: () -> Unit,
    onNavigateToUserDirectory: () -> Unit,
    onNavigateToAboutApp: () -> Unit,
    scrollState: androidx.compose.foundation.ScrollState = rememberScrollState()
) {
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    
    // Standard Material 3 Scaffold - REMOVED to use MainScreen's global frame/header
    // Scaffold(
    //    topBar = { ... },
    //    containerColor = colors.background,
    //    contentWindowInsets = WindowInsets.statusBars
    // ) { innerPadding ->
    
    // Content Wrapper
    Column(
        modifier = Modifier
            .fillMaxSize()
            // .padding(innerPadding) // Removed Scaffold padding
            .background(colors.background) // Ensure background is set
            .verticalScroll(scrollState)
            .padding(horizontal = HomeDimens.ContentPadding) // Horizontal padding only
            .padding(top = 100.dp, bottom = 100.dp) // Top padding matches MainScreen Frame hole (92dp+)
    ) {
            // 1. Profile Card
            OneUIProfileCard(
                name = userProfile?.displayName ?: "User",
                email = "Neram Account",
                photoUrl = userProfile?.photoURL,
                onClick = onNavigateToProfile,
                cardColor = colors.surface,
                borderColor = colors.glassBorder,
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary
            )

            Spacer(modifier = Modifier.height(24.dp))
            
            // 2. Settings Group: Display
            Text(
                text = "DISPLAY",
                style = HomeTypography.ExamTag,
                color = colors.textSecondary,
                modifier = Modifier.padding(bottom = 8.dp, start = 24.dp)
            )
            SettingsListGroup(cardColor = colors.surface, borderColor = colors.glassBorder) {
                SettingsListItem(
                    icon = Icons.Outlined.Brightness6,
                    iconBgColor = AppColors.Green,
                    title = AppStrings.Settings.display(lang),
                    description = AppStrings.Settings.displayDesc(lang),
                    onClick = onNavigateToDisplay,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 56.dp))
                SettingsListItem(
                    icon = Icons.Outlined.Storage,
                    iconBgColor = AppColors.Orange,
                    title = AppStrings.Settings.storageData(lang),
                    description = AppStrings.Settings.storageDesc(lang),
                    onClick = onNavigateToStorage,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )

            }

            Spacer(modifier = Modifier.height(16.dp))
            
            // 3. Settings Group: Account
            SettingsListGroup(cardColor = colors.surface, borderColor = colors.glassBorder) {
                SettingsListItem(
                    icon = Icons.Outlined.Security,
                    iconBgColor = AppColors.Purple,
                    title = AppStrings.Settings.security(lang),
                    description = AppStrings.Settings.securityDesc(lang),
                    onClick = onNavigateToSecurity,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 56.dp))
                SettingsListItem(
                    icon = Icons.Default.Person,
                    iconBgColor = AppColors.Blue,
                    title = "User Directory",
                    description = "View students",
                    onClick = onNavigateToUserDirectory,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Language & Other
            SettingsListGroup(cardColor = colors.surface, borderColor = colors.glassBorder) {
                SettingsListItem(
                    icon = Icons.Outlined.Language,
                    iconBgColor = AppColors.Blue,
                    title = AppStrings.Settings.languageOther(lang),
                    description = AppStrings.Settings.languageDesc(lang),
                    onClick = onNavigateToLanguage,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 3. Settings Group: Support
            SettingsListGroup(cardColor = colors.surface, borderColor = colors.glassBorder) {
                SettingsListItem(
                    icon = Icons.Outlined.Feedback,
                    iconBgColor = AppColors.Orange,
                    title = AppStrings.Settings.complaints(lang),
                    description = AppStrings.Settings.complaintsDesc(lang),
                    onClick = onNavigateToComplaint,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 56.dp))

                SettingsListItem(
                    icon = Icons.Outlined.Code,
                    iconBgColor = AppColors.Green,
                    title = AppStrings.Settings.aboutDeveloper(lang),
                    description = "Jaiprakash Parthasarathy",
                    onClick = onNavigateToDeveloper,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            // 4. Settings Group: About
            SettingsListGroup(cardColor = colors.surface, borderColor = colors.glassBorder) {
                 SettingsListItem(
                    icon = Icons.Outlined.Info,
                    iconBgColor = AppColors.Blue,
                    title = "About App",
                    description = "Neram v1.0.0 (BETA)",
                    onClick = onNavigateToAboutApp,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
        }
    // } // Scaffold removed
}

@Composable
fun OneUIProfileCard(
    name: String,
    email: String,
    photoUrl: String? = null,
    onClick: () -> Unit,
    cardColor: Color,
    borderColor: Color,
    textColor: Color,
    subTextColor: Color
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(100.dp)) // Big Pill Shape for outer ripples
            .clickable { onClick() },
        shape = RoundedCornerShape(100.dp), // Explicit Big Pill
        color = cardColor,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp), // HeaderPillPadding
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Profile Picture (Left Side) - Matches PageHeader
            Surface(
                shape = CircleShape,
                color = subTextColor.copy(alpha=0.1f), 
                modifier = Modifier.size(56.dp) // HomeDimens.AvatarSize
            ) {
                 if (photoUrl != null) {
                     AsyncImage(
                         model = ImageRequest.Builder(LocalContext.current)
                             .data(photoUrl)
                             .crossfade(true)
                             .build(),
                         contentDescription = "Profile",
                         modifier = Modifier.fillMaxSize(),
                         contentScale = ContentScale.Crop
                     )
                 } else {
                     Box(contentAlignment = Alignment.Center) {
                         Icon(
                             Icons.Filled.Person, 
                             contentDescription = null, 
                             tint = textColor,
                             modifier = Modifier.size(28.dp)
                         )
                     }
                 }
            }
            
            Spacer(modifier = Modifier.width(16.dp)) // HomeDimens.SpacingXl

            Column(modifier = Modifier.weight(1f)) {
                // Top Text: "Neram Account" (Bold, Large)
                Text(
                    text = "Neram Account",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold, 
                        fontSize = 20.sp // Match PageHeader "Welcome" size
                    ),
                    color = textColor
                )
                // Bottom Text: User Name (Grey, Smaller)
                Text(
                    text = name,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontSize = 14.sp
                    ),
                    color = subTextColor,
                    maxLines = 1
                )
            }
        }
    }
}

@Composable
fun SettingsListGroup(
    cardColor: Color,
    borderColor: Color,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(HomeShapes.Item) // Match Home Screen Radius
            .background(cardColor)
            .border(1.dp, borderColor, HomeShapes.Item)
    ) {
        content()
    }
}

@Composable
fun SettingsListItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconBgColor: Color,
    title: String,
    description: String,
    onClick: () -> Unit,
    textColor: Color,
    subTextColor: Color
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
            if (description.isNotEmpty()) {
                Text(
                    description, 
                    style = MaterialTheme.typography.bodySmall, 
                    color = subTextColor
                )
            }
        }
    }
}

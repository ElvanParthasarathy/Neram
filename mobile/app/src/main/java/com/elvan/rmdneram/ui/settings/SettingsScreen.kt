package com.elvan.rmdneram.ui.settings

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
import com.elvan.rmdneram.ui.theme.LocalAppFontFamily
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
    onNavigateToManagementTeam: () -> Unit,
    onNavigateToAboutRMK: () -> Unit,
    onNavigateToNotifications: () -> Unit = {},
    onLogout: () -> Unit = {},
    scrollState: androidx.compose.foundation.ScrollState = rememberScrollState()
) {
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    
    var showLogoutDialog by remember { mutableStateOf(false) }
    
    val statusBarHeight = rememberStatusBarHeight()
    val topPadding = statusBarHeight + HomeDimens.ContentPaddingTop
    
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
            .padding(top = topPadding, bottom = 100.dp) // Top padding matches Home Screen
    ) {
            // 1. Profile Card
            OneUIProfileCard(
                name = userProfile?.displayName ?: "User",
                email = AppStrings.Settings.neramAccount(lang),
                photoUrl = userProfile?.photoURL,
                onClick = onNavigateToProfile,
                cardColor = colors.surface,
                borderColor = colors.glassBorder,
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary
            )

            Spacer(modifier = Modifier.height(24.dp))
            
            // Settings Group: Display
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
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
                SettingsListItem(
                    icon = Icons.Outlined.Language,
                    iconBgColor = AppColors.Blue,
                    title = AppStrings.Settings.language(lang),
                    description = AppStrings.Settings.languageDesc(lang),
                    onClick = onNavigateToLanguage,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
                SettingsListItem(
                    icon = Icons.Outlined.Storage,
                    iconBgColor = AppColors.Orange,
                    title = AppStrings.Settings.storageData(lang),
                    description = AppStrings.Settings.storageDesc(lang),
                    onClick = onNavigateToStorage,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
                SettingsListItem(
                    icon = Icons.Outlined.Notifications,
                    iconBgColor = AppColors.Purple,
                    title = AppStrings.Settings.pushNotifications(lang),
                    description = AppStrings.Settings.notificationTimings(lang),
                    onClick = onNavigateToNotifications,
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
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
                SettingsListItem(
                    icon = Icons.Default.Person,
                    iconBgColor = AppColors.Blue,
                    title = AppStrings.Settings.userDirectory(lang),
                    description = "",
                    onClick = onNavigateToUserDirectory,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            // 4. Settings Group: About
            SettingsListGroup(cardColor = colors.surface, borderColor = colors.glassBorder) {
                SettingsListItem(
                    icon = Icons.Outlined.Group,
                    iconBgColor = AppColors.Purple,
                    title = if (lang == AppStrings.TAMIL) "நிர்வாகக் குழு" else "Management Team",
                    description = if (lang == AppStrings.TAMIL) "நிறுவனர்கள் & இயக்குநர் குழு" else "Founders & Board of Directors",
                    onClick = onNavigateToManagementTeam,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
                SettingsListItem(
                    icon = Icons.Outlined.AccountBalance,
                    iconBgColor = AppColors.Green,
                    title = if (lang == AppStrings.TAMIL) "RMK குழு பற்றி" else "About RMK Group",
                    description = if (lang == AppStrings.TAMIL) "பார்வை, பணி & அடையாளம்" else "Vision, Mission & Identity",
                    onClick = onNavigateToAboutRMK,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
                Divider(color = colors.glassBorder, thickness = 1.dp, modifier = Modifier.padding(start = 72.dp, end = 20.dp))
                SettingsListItem(
                    icon = Icons.Outlined.Info,
                    iconBgColor = AppColors.Blue,
                    title = AppStrings.Settings.aboutApp(lang),
                    description = AppStrings.Settings.aboutAppDesc(lang),
                    onClick = onNavigateToAboutApp,
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))

            // 5. Settings Group: Account Session
            SettingsListGroup(cardColor = colors.surface, borderColor = colors.glassBorder) {
                SettingsListItem(
                    icon = Icons.Outlined.Logout,
                    iconBgColor = AppColors.Red,
                    title = AppStrings.Settings.signOut(lang),
                    description = if (lang == AppStrings.TAMIL) "நேரம் கணக்கிலிருந்து வெளியேறு" else "Log out of your Neram account",
                    onClick = { showLogoutDialog = true },
                    textColor = AppColors.Red, // Explicitly red for destruction
                    subTextColor = colors.textSecondary
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
        }
    
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = colors.surface,
            title = {
                Text(
                    AppStrings.Settings.signOutConfirm(lang),
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = colors.textPrimary
                )
            },
            text = {
                Text(
                    AppStrings.Settings.signOutMessage(lang),
                    style = MaterialTheme.typography.bodyMedium,
                    color = colors.textSecondary
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AppColors.Red,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(50), // Pill shape
                    elevation = ButtonDefaults.buttonElevation(0.dp)
                ) {
                    Text(AppStrings.Settings.signOut(lang), fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                 FilledTonalButton(
                    onClick = { showLogoutDialog = false },
                    colors = ButtonDefaults.filledTonalButtonColors(
                        containerColor = colors.subtleBackground,
                        contentColor = colors.textPrimary
                    ),
                    shape = RoundedCornerShape(50), // Pill shape
                    elevation = ButtonDefaults.buttonElevation(0.dp)
                ) {
                    Text(AppStrings.Home.cancel(lang), fontWeight = FontWeight.SemiBold)
                }
            }
        )
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
                    text = AppStrings.Settings.neramAccount(LocalAppLanguage.current),
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
    borderColor: Color = Color.Transparent, // Kept for compatibility, but not used
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(HomeShapes.Item) // Match Home Screen Radius
            .background(cardColor)
            // No border - flat design matching Home screen
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
            val ff = LocalAppFontFamily.current
            Text(
                title, 
                style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium, fontFamily = ff), 
                color = textColor
            )
            if (description.isNotEmpty()) {
                Text(
                    description, 
                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = ff), 
                    color = subTextColor
                )
            }
        }
    }
}

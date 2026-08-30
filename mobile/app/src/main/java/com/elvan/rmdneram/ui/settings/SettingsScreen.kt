package com.elvan.rmdneram.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.data.model.UserProfile
import com.elvan.rmdneram.ui.components.shell.*
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.theme.AppColors
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage

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
    onNavigateToLanguage: () -> Unit,
    onNavigateToCalendarSettings: () -> Unit,
    onNavigateToUserDirectory: () -> Unit,
    onNavigateToAboutApp: () -> Unit,
    onNavigateToManagementTeam: () -> Unit,
    onNavigateToAboutRMK: () -> Unit,
    onNavigateToNotifications: () -> Unit = {},
    onLogout: () -> Unit = {},
    scrollState: androidx.compose.foundation.lazy.LazyListState = rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    
    var showLogoutDialog by remember { mutableStateOf(false) }

    ElvanSubShell(
        title = AppStrings.Settings.title(lang),
        onBack = onBack,
        scrollState = scrollState,
        colors = colors
    ) {
        LazyColumn(
            state = scrollState,
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
            verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
        ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(280.dp - HomeDimens.SectionSpacing))
            }

            // 1. Mode Switcher & Profile (Big Pill)
            item(key = "profile_card") {
                ElvanSectionContainer {
                    ElvanProfilePillCard(
                        title = AppStrings.Settings.neramAccount(lang),
                        subtitle = userProfile?.displayName ?: "User",
                        photoUrl = userProfile?.photoURL,
                        onClick = onNavigateToProfile,
                        colors = colors
                    )
                }
            }

            // 2. Settings Group: User & Display & System Preferences
            item(key = "display_group") {
                ElvanSectionContainer {
                    ElvanSettingsSection(colors = colors) {
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Brightness6,
                            title = AppStrings.Settings.display(lang),
                            description = AppStrings.Settings.displayDesc(lang),
                            onClick = onNavigateToDisplay,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Language,
                            title = AppStrings.Settings.language(lang),
                            description = AppStrings.Settings.languageDesc(lang),
                            onClick = onNavigateToLanguage,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Notifications,
                            title = AppStrings.Settings.pushNotifications(lang),
                            description = AppStrings.Settings.notificationTimings(lang),
                            onClick = onNavigateToNotifications,
                            colors = colors
                        )
                    }
                }
            }

            // 3. Settings Group: Account & Directory
            item(key = "account_group") {
                ElvanSectionContainer {
                    ElvanSettingsSection(colors = colors) {
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Lock,
                            title = AppStrings.Settings.security(lang),
                            description = AppStrings.Settings.securityDesc(lang),
                            onClick = onNavigateToSecurity,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Person,
                            title = AppStrings.Settings.userDirectory(lang),
                            description = if (lang == AppStrings.TAMIL) "மாணவர்கள் & ஆசிரியர்கள் அடைவு" else "Students & faculty directory",
                            onClick = onNavigateToUserDirectory,
                            colors = colors
                        )
                    }
                }
            }

            // 4. Settings Group: About & Institution
            item(key = "about_group") {
                ElvanSectionContainer {
                    ElvanSettingsSection(colors = colors) {
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Groups,
                            title = AppStrings.Settings.managementTeam(lang),
                            description = if (lang == AppStrings.TAMIL) "நிறுவனர்கள் & இயக்குநர் குழு" else "Founders & Board of Directors",
                            onClick = onNavigateToManagementTeam,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.AccountBalance,
                            title = AppStrings.Settings.aboutRmk(lang),
                            description = if (lang == AppStrings.TAMIL) "பார்வை, பணி & அடையாளம்" else "Vision, Mission & Identity",
                            onClick = onNavigateToAboutRMK,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Info,
                            title = AppStrings.Settings.aboutApp(lang),
                            description = AppStrings.Settings.aboutAppDesc(lang),
                            onClick = onNavigateToAboutApp,
                            colors = colors
                        )
                    }
                }
            }

            // 5. Settings Group: Account Session
            item(key = "session_group") {
                ElvanSectionContainer {
                    ElvanSettingsSection(colors = colors) {
                        ElvanSettingsRow(
                            icon = Icons.AutoMirrored.Outlined.Logout,
                            title = AppStrings.Settings.signOut(lang),
                            description = if (lang == AppStrings.TAMIL) "நேரம் கணக்கிலிருந்து வெளியேறு" else "Log out of your Neram account",
                            onClick = { showLogoutDialog = true },
                            titleColor = AppColors.Red,
                            iconTint = AppColors.Red,
                            colors = colors
                        )
                    }
                }
            }

            item(key = "dynamic_collapse_spacer") {
                ElvanCollapseSpacer(itemCount = 5, itemHeight = 160.dp)
            }
        }
    }
    
    if (showLogoutDialog) {
        val isDark = colors.isDark
        val dialogCardColor = if (isDark) Color(0xFF111111) else Color.White
        val cancelBtnBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)

        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = dialogCardColor,
            shape = RoundedCornerShape(24.dp),
            title = {
                Text(
                    AppStrings.Settings.signOutConfirm(lang),
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, fontSize = 20.sp),
                    color = colors.textPrimary
                )
            },
            text = {
                Text(
                    AppStrings.Settings.signOutMessage(lang),
                    style = MaterialTheme.typography.bodyMedium.copy(lineHeight = 22.sp),
                    color = colors.textPrimary.copy(alpha = 0.6f)
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
                    shape = RoundedCornerShape(50),
                    elevation = ButtonDefaults.buttonElevation(0.dp)
                ) {
                    Text(AppStrings.Settings.signOut(lang), fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                FilledTonalButton(
                    onClick = { showLogoutDialog = false },
                    colors = ButtonDefaults.filledTonalButtonColors(
                        containerColor = cancelBtnBg,
                        contentColor = colors.textPrimary
                    ),
                    shape = RoundedCornerShape(50),
                    elevation = ButtonDefaults.buttonElevation(0.dp)
                ) {
                    Text(AppStrings.Home.cancel(lang), fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }
}
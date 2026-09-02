package com.elvan.neram.ui.settings

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
import com.elvan.neram.data.model.UserProfile
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.theme.AppColors
import com.elvan.neram.ui.theme.AppStrings
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

@Composable
fun SettingsScreen(
    userRole: String? = null,
    userProfile: UserProfile? = null,
    onNavigateToProfile: () -> Unit,
    onNavigateToAccount: () -> Unit = {},
    onNavigateToSecurity: () -> Unit,
    onNavigateToDisplay: () -> Unit,
    onNavigateToComplaint: () -> Unit,
    onNavigateToDeveloper: () -> Unit,
    onNavigateToLanguage: () -> Unit,
    onNavigateToUserDirectory: () -> Unit,
    onNavigateToAboutApp: () -> Unit,
    onNavigateToElvanNavil: () -> Unit = {},
    onNavigateToManagementTeam: () -> Unit = {},
    onNavigateToAboutRMK: () -> Unit = {},
    onNavigateToNotifications: () -> Unit = {},
    onLogout: () -> Unit = {},
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    
    var showLogoutDialog by remember { mutableStateOf(false) }

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
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
                            icon = Icons.Outlined.ManageAccounts,
                            title = K.accounts.tr(lang),
                            description = K.accountsDesc.tr(lang),
                            onClick = onNavigateToAccount,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Lock,
                            title = K.security.tr(lang),
                            description = K.securityDesc.tr(lang),
                            onClick = onNavigateToSecurity,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Person,
                            title = K.userDirectory.tr(lang),
                            description = K.userDirectoryDesc.tr(lang),
                            onClick = onNavigateToUserDirectory,
                            colors = colors
                        )
                    }
                }
            }

            // 4. Settings Group: About & Brand
            item(key = "about_group") {
                ElvanSectionContainer {
                    ElvanSettingsSection(colors = colors) {
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Code,
                            title = K.aboutDeveloper.tr(lang),
                            description = K.aboutDeveloperDesc.tr(lang),
                            onClick = onNavigateToDeveloper,
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
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.AutoAwesome,
                            title = AppStrings.Settings.elvanNavil(lang),
                            description = AppStrings.Settings.elvanNavilDesc(lang),
                            onClick = onNavigateToElvanNavil,
                            colors = colors
                        )
                    }
                }
            }
        }
}
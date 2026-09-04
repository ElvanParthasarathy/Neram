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
                        title = K.neramAccount.tr(lang),
                        subtitle = userProfile?.displayName ?: K.user.tr(lang),
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
                            title = K.display.tr(lang),
                            description = K.displayDesc.tr(lang),
                            onClick = onNavigateToDisplay,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        val currentLanguageDesc = when (lang) {
                            K.TAMIL -> K.tamil.tr(lang)
                            K.TAMIL_LATIN -> K.tamilLatin.tr(lang)
                            K.TAMIL_MALAYALAM -> K.tamilMalayalam.tr(lang)
                            K.MALAYALAM -> K.malayalam.tr(lang)
                            K.MALAYALAM_LATIN -> K.malayalamLatin.tr(lang)
                            K.MALAYALAM_TAMIL -> K.malayalamTamil.tr(lang)
                            K.ENGLISH -> K.english.tr(lang)
                            K.SYSTEM -> K.deviceLanguage.tr(lang)
                            else -> K.english.tr(lang)
                        }
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Language,
                            title = K.language.tr(lang),
                            description = currentLanguageDesc,
                            onClick = onNavigateToLanguage,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Notifications,
                            title = K.pushNotifications.tr(lang),
                            description = K.notificationTimings.tr(lang),
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
                            title = K.aboutApp.tr(lang),
                            description = K.aboutAppDesc.tr(lang),
                            onClick = onNavigateToAboutApp,
                            colors = colors
                        )
                        ElvanSettingsDivider(colors = colors)
                        ElvanSettingsRow(
                            icon = Icons.Outlined.AutoAwesome,
                            title = K.elvanNavil.tr(lang),
                            description = K.elvanNavilDesc.tr(lang),
                            onClick = onNavigateToElvanNavil,
                            colors = colors
                        )
                    }
                }
            }
        }
}
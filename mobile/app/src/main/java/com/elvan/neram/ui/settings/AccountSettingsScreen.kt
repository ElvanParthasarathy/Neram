package com.elvan.neram.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.AppColors
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase

@Composable
fun AccountSettingsScreen(
    onBack: () -> Unit,
    onNavigateToLinkedAccounts: () -> Unit = {},
    onLogout: () -> Unit = {},
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val user = Firebase.auth.currentUser

    var showLogoutDialog by remember { mutableStateOf(false) }

    ElvanSubShell(
        title = K.accounts.tr(lang),
        onBack = onBack,
        colors = colors,
        scrollState = scrollState
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            LazyColumn(
                state = scrollState,
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
                verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
            ) {
                item(key = "spacer_top") {
                    Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
                }

                // Profile Summary Pill Card
                item(key = "profile_summary") {
                    ElvanSectionContainer {
                        ElvanProfilePillCard(
                            title = user?.displayName ?: K.user.tr(lang),
                            subtitle = user?.email ?: K.noEmailLinked.tr(lang),
                            photoUrl = user?.photoUrl?.toString(),
                            onClick = {},
                            colors = colors
                        )
                    }
                }

                // Accounts Actions Section
                item(key = "account_actions") {
                    ElvanSectionContainer {
                        ElvanSettingsSection(
                            title = K.accounts.tr(lang).uppercase(),
                            colors = colors
                        ) {
                            ElvanSettingsRow(
                                icon = Icons.Outlined.Link,
                                title = K.linkedAccounts.tr(lang),
                                description = K.linkedAccountsDesc.tr(lang),
                                onClick = { onNavigateToLinkedAccounts() },
                                colors = colors
                            )

                            ElvanSettingsDivider(colors = colors)

                            ElvanSettingsRow(
                                icon = Icons.AutoMirrored.Outlined.Logout,
                                title = K.signOut.tr(lang),
                                description = K.signOutDesc.tr(lang),
                                onClick = { showLogoutDialog = true },
                                titleColor = AppColors.Red,
                                iconTint = AppColors.Red,
                                colors = colors
                            )
                        }
                    }
                }
            }

            // Logout Confirmation Dialog
            if (showLogoutDialog) {
                val isDark = colors.isDark
                val dialogCardColor = if (isDark) Color(0xFF111111) else Color.White
                val cancelBtnBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)

                AlertDialog(
                    onDismissRequest = { showLogoutDialog = false },
                    containerColor = dialogCardColor,
                    shape = RoundedCornerShape(24.dp),
                    icon = { Icon(Icons.AutoMirrored.Outlined.Logout, null, tint = AppColors.Red) },
                    title = {
                        Text(
                            text = K.signOutConfirm.tr(lang),
                            style = TextStyle(fontFamily = ff, fontSize = 20.sp, fontWeight = FontWeight.Bold),
                            color = colors.textPrimary
                        )
                    },
                    text = {
                        Text(
                            text = K.signOutMessage.tr(lang),
                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, lineHeight = 20.sp),
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
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = K.signOut.tr(lang),
                                style = TextStyle(fontFamily = ff, fontWeight = FontWeight.SemiBold)
                            )
                        }
                    },
                    dismissButton = {
                        TextButton(
                            onClick = { showLogoutDialog = false },
                            colors = ButtonDefaults.textButtonColors(
                                containerColor = cancelBtnBg,
                                contentColor = colors.textPrimary
                            ),
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = K.cancel.tr(lang),
                                style = TextStyle(fontFamily = ff, fontWeight = FontWeight.Medium)
                            )
                        }
                    }
                )
            }
        }
    }
}

package com.elvan.neram.ui.settings

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
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.theme.AppColors
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase

/**
 * Dedicated Linked Accounts Screen
 * 
 * This screen manages Google account linking/unlinking and displays
 * email/password status. The Google Sign-In launcher is hoisted to MainScreen
 * to ensure Activity context is available (fixes crash in AnimatedContent).
 */
@Composable
fun LinkedAccountsScreen(
    onBack: () -> Unit,
    onGoogleLink: () -> Unit = {},
    isLinking: Boolean = false,
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    val user = Firebase.auth.currentUser
    
    // Get provider info
    val googleProvider = user?.providerData?.find { it.providerId == "google.com" }
    val passwordProvider = user?.providerData?.find { it.providerId == "password" }
    val isGoogleLinked = googleProvider != null
    val hasPassword = passwordProvider != null
    val googleEmail = googleProvider?.email ?: ""
    val googlePhotoUrl = googleProvider?.photoUrl?.toString()
    val primaryEmail = user?.email ?: ""
    
    var showUnlinkDialog by remember { mutableStateOf(false) }
    var isUnlinking by remember { mutableStateOf(false) }

    val lang = com.elvan.neram.ui.theme.LocalAppLanguage.current

    // Unlink Confirmation Dialog
    if (showUnlinkDialog) {
        AlertDialog(
            onDismissRequest = { showUnlinkDialog = false },
            title = { Text(K.unlinkConfirm.tr(lang), fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        if (hasPassword) 
                            K.unlinkMessage.tr(lang)
                        else 
                            K.createPasswordMsg.tr(lang),
                        color = colors.textPrimary
                    )
                    if (!hasPassword) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(HomeShapes.Item)
                                .background(colors.warning.copy(alpha = 0.1f))
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Outlined.Warning, null, tint = colors.warning, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(K.createPasswordFirst.tr(lang), color = colors.warning, style = HomeTypography.FacultyName)
                        }
                    }
                }
            },
            confirmButton = {
                if (hasPassword) {
                    Button(
                        onClick = {
                            isUnlinking = true
                            user?.unlink("google.com")
                                ?.addOnSuccessListener {
                                    Toast.makeText(context, K.googleAccountUnlinked.tr(lang), Toast.LENGTH_SHORT).show()
                                    showUnlinkDialog = false
                                    isUnlinking = false
                                }
                                ?.addOnFailureListener { e ->
                                    Toast.makeText(context, e.message ?: K.failedToUnlink.tr(lang), Toast.LENGTH_SHORT).show()
                                    isUnlinking = false
                                }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = colors.danger),
                        enabled = !isUnlinking
                    ) {
                        if (isUnlinking) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        } else {
                            Text(K.unlink.tr(lang))
                        }
                    }
                } else {
                    Button(
                        onClick = { 
                            showUnlinkDialog = false
                            onBack() // Go back to create password
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = colors.accent)
                    ) {
                        Text(K.createPassword.tr(lang))
                    }
                }
            },
            dismissButton = {
                Button(
                    onClick = { showUnlinkDialog = false },
                    shape = HomeShapes.Pill,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.subtleBackground,
                        contentColor = colors.textSecondary
                    )
                ) {
                    Text(K.cancel.tr(lang))
                }
            },
            containerColor = colors.surface,
            shape = HomeShapes.Item
        )
    }

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
            }

            item(key = "google_section") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = K.signInMethods.tr(lang),
                        colors = colors
                    ) {
                        // Google Account Row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            val isDark = colors.isDark
                            val iconBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)

                            // Google Photo or Fallback Icon
                            if (isGoogleLinked && googlePhotoUrl != null) {
                                AsyncImage(
                                    model = ImageRequest.Builder(LocalContext.current)
                                        .data(googlePhotoUrl)
                                        .crossfade(true)
                                        .build(),
                                    contentDescription = K.googleProfile.tr(lang),
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(iconBg),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "G",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp,
                                        color = colors.textPrimary
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(16.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    K.google.tr(lang),
                                    style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp, fontWeight = FontWeight.Medium),
                                    color = colors.textPrimary
                                )
                                Text(
                                    if (isGoogleLinked) googleEmail else K.notConnected.tr(lang),
                                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
                                    color = colors.textPrimary.copy(alpha = 0.5f),
                                    maxLines = 1
                                )
                            }

                            // Status Badge
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = if (isGoogleLinked) colors.success.copy(alpha = 0.15f) else (if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f))
                            ) {
                                Text(
                                    text = if (isGoogleLinked) K.connected.tr(lang) else K.notConnected.tr(lang),
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                    color = if (isGoogleLinked) colors.success else colors.textPrimary.copy(alpha = 0.6f),
                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                )
                            }
                        }

                        // Action Button
                        if (isGoogleLinked) {
                            ElvanSettingsDivider(colors = colors)
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { showUnlinkDialog = true },
                                color = Color.Transparent
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    Text(
                                        K.unlinkGoogle.tr(lang),
                                        color = AppColors.Red,
                                        fontWeight = FontWeight.Medium,
                                        fontSize = 14.sp
                                    )
                                }
                            }
                        } else {
                            ElvanSettingsDivider(colors = colors)
                            Surface(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { onGoogleLink() },
                                color = Color.Transparent
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                    horizontalArrangement = Arrangement.Center
                                ) {
                                    if (isLinking) {
                                        CircularProgressIndicator(color = colors.textPrimary, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                                    } else {
                                        Text(
                                            K.linkGoogle.tr(lang),
                                            color = colors.textPrimary,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 14.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item(key = "email_section") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = K.emailPassword.tr(lang),
                        colors = colors
                    ) {
                        // Email Row
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Email,
                            title = K.emailAddress.tr(lang),
                            description = primaryEmail,
                            onClick = {},
                            customTrailing = {
                                Icon(Icons.Outlined.CheckCircle, null, tint = colors.success, modifier = Modifier.size(20.dp))
                            },
                            colors = colors
                        )

                        ElvanSettingsDivider(colors = colors)

                        // Password Row
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Key,
                            title = K.password.tr(lang),
                            description = if (hasPassword) K.passwordSet.tr(lang) else K.noPasswordSet.tr(lang),
                            onClick = {
                                if (!hasPassword) onBack()
                            },
                            customTrailing = {
                                if (hasPassword) {
                                    Icon(Icons.Outlined.CheckCircle, null, tint = colors.success, modifier = Modifier.size(20.dp))
                                } else {
                                    Surface(
                                        shape = RoundedCornerShape(20.dp),
                                        color = if (colors.isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f),
                                        modifier = Modifier.clickable { onBack() }
                                    ) {
                                        Text(
                                            K.create.tr(lang),
                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
                                            color = colors.textPrimary,
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                        )
                                    }
                                }
                            },
                            colors = colors
                        )
                    }
                }
            }

            item(key = "info_box") {
                ElvanSectionContainer {
                    Text(
                        text = K.linkedAccountsInfoText.tr(lang),
                        style = MaterialTheme.typography.bodySmall,
                        color = colors.textPrimary.copy(alpha = 0.5f),
                        modifier = Modifier.padding(horizontal = 8.dp)
                    )
                }
            }
        }
}

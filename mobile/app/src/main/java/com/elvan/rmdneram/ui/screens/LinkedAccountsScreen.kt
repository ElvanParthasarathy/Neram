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
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.theme.AppColors
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
    isLinking: Boolean = false
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

    // Unlink Confirmation Dialog
    if (showUnlinkDialog) {
        AlertDialog(
            onDismissRequest = { showUnlinkDialog = false },
            title = { Text("Unlink Google Account?", fontWeight = FontWeight.Bold) },
            text = {
                Column {
                    Text(
                        if (hasPassword) 
                            "You will need to sign in with your email and password after unlinking."
                        else 
                            "You must create a password first before unlinking Google, otherwise you won't be able to sign in.",
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
                            Text("Create a password first", color = colors.warning, style = HomeTypography.FacultyName)
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
                                    Toast.makeText(context, "Google account unlinked", Toast.LENGTH_SHORT).show()
                                    showUnlinkDialog = false
                                    isUnlinking = false
                                }
                                ?.addOnFailureListener { e ->
                                    Toast.makeText(context, e.message ?: "Failed to unlink", Toast.LENGTH_SHORT).show()
                                    isUnlinking = false
                                }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = colors.danger),
                        enabled = !isUnlinking
                    ) {
                        if (isUnlinking) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Unlink")
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
                        Text("Create Password")
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
                    Text("Cancel")
                }
            },
            containerColor = colors.surface,
            shape = HomeShapes.Item
        )
    }

    // Main Content
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .verticalScroll(rememberScrollState())
            .padding(
                start = HomeDimens.ContentPadding,
                end = HomeDimens.ContentPadding,
                top = rememberStatusBarHeight() + HomeDimens.ContentPaddingTop,
                bottom = HomeDimens.ContentPaddingBottom
            )
    ) {
        // Section: Sign-in Methods
        Text("SIGN-IN METHODS", style = HomeTypography.ExamTag, color = colors.textSecondary)
        Spacer(modifier = Modifier.height(12.dp))
        
        // Google Account Card
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(HomeShapes.Item)
                .background(colors.surface)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Google Photo or Fallback Icon
                if (isGoogleLinked && googlePhotoUrl != null) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(googlePhotoUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Google Profile",
                        modifier = Modifier
                            .size(44.dp)
                            .clip(CircleShape)
                            .border(2.dp, AppColors.GoogleBlue, CircleShape)
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(44.dp)
                            .clip(HomeShapes.Item)
                            .background(
                                if (isGoogleLinked) AppColors.GoogleBlue.copy(alpha = 0.1f) 
                                else colors.subtleBackground
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "G", 
                            fontWeight = FontWeight.Bold, 
                            color = if (isGoogleLinked) AppColors.GoogleBlue else colors.textSecondary,
                            style = HomeTypography.SectionTitle
                        )
                    }
                }
                Spacer(modifier = Modifier.width(16.dp))
                
                Column(modifier = Modifier.weight(1f)) {
                    Text("Google", style = HomeTypography.PillTitle, color = colors.textPrimary)
                    if (isGoogleLinked) {
                        Text(
                            googleEmail,
                            style = HomeTypography.FacultyName,
                            color = colors.textSecondary,
                            maxLines = 1
                        )
                    } else {
                        Text(
                            "Not connected",
                            style = HomeTypography.FacultyName,
                            color = colors.textSecondary
                        )
                    }
                }
                
                // Status Badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(
                            if (isGoogleLinked) colors.success.copy(alpha = 0.15f) 
                            else colors.subtleBackground
                        )
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        if (isGoogleLinked) "Connected" else "Not linked",
                        style = HomeTypography.StatusBadge,
                        color = if (isGoogleLinked) colors.success else colors.textSecondary
                    )
                }
            }
            
            // Action Button
            if (isGoogleLinked) {
                HorizontalDivider(color = colors.glassBorder, modifier = Modifier.padding(start = 76.dp, end = 20.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showUnlinkDialog = true }
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Text("Unlink Google Account", color = colors.danger, fontWeight = FontWeight.Medium)
                }
            } else {
                HorizontalDivider(color = colors.glassBorder, modifier = Modifier.padding(start = 76.dp, end = 20.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onGoogleLink() }
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    if (isLinking) {
                        CircularProgressIndicator(color = colors.accent, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Text("Link Google Account", color = colors.accent, fontWeight = FontWeight.Medium)
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Email & Password Section
        Text("EMAIL & PASSWORD", style = HomeTypography.ExamTag, color = colors.textSecondary)
        Spacer(modifier = Modifier.height(12.dp))
        
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(colors.surface)
        ) {
            // Email Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(colors.accent.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Outlined.Email, null, tint = colors.accent, modifier = Modifier.size(22.dp))
                }
                Spacer(modifier = Modifier.width(16.dp))
                
                Column(modifier = Modifier.weight(1f)) {
                    Text("Email", style = HomeTypography.PillTitle, color = colors.textPrimary)
                    Text(
                        primaryEmail,
                        style = HomeTypography.FacultyName,
                        color = colors.textSecondary,
                        maxLines = 1
                    )
                }
                
                Icon(Icons.Outlined.CheckCircle, null, tint = colors.success, modifier = Modifier.size(20.dp))
            }
            
            HorizontalDivider(color = colors.glassBorder, modifier = Modifier.padding(start = 76.dp, end = 20.dp))
            
            // Password Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            if (hasPassword) colors.success.copy(alpha = 0.1f) 
                            else colors.warning.copy(alpha = 0.1f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Outlined.Key, 
                        null, 
                        tint = if (hasPassword) colors.success else colors.warning, 
                        modifier = Modifier.size(22.dp)
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                
                Column(modifier = Modifier.weight(1f)) {
                    Text("Password", style = HomeTypography.PillTitle, color = colors.textPrimary)
                    Text(
                        if (hasPassword) "Password set" else "No password set",
                        style = HomeTypography.FacultyName,
                        color = colors.textSecondary
                    )
                }
                
                if (hasPassword) {
                    Icon(Icons.Outlined.CheckCircle, null, tint = colors.success, modifier = Modifier.size(20.dp))
                } else {
                    Box(
                        modifier = Modifier
                            .clip(HomeShapes.Item)
                            .background(colors.accent.copy(alpha = 0.1f))
                            .clickable { onBack() }
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Create", style = HomeTypography.StatusBadge, color = colors.accent)
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Info Box
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(HomeShapes.Item)
                .background(colors.subtleBackground)
                .padding(16.dp),
            verticalAlignment = Alignment.Top
        ) {
            Icon(Icons.Outlined.Info, null, tint = colors.textSecondary, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                "Linking multiple sign-in methods gives you more ways to access your account securely.",
                style = HomeTypography.FacultyName,
                color = colors.textSecondary
            )
        }
    }
}

package com.elvan.neram.ui.settings

import android.app.Activity
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.material3.ripple
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.elvan.neram.ui.components.ExpressiveLoadingIndicator
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.theme.AppColors
import com.elvan.neram.ui.theme.AppStrings
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.EmailAuthProvider
import com.google.firebase.auth.FirebaseAuthRecentLoginRequiredException
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"

@Composable
fun SecuritySettingsScreen(
    onBack: () -> Unit,
    onNavigateToLinkedAccounts: () -> Unit = {},
    onLogout: () -> Unit = {},
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val colors = rememberHomeColors()
    var currentView by remember { mutableStateOf("hub") } // hub, password, create_password, delete
    
    BackHandler {
        if (currentView != "hub") {
            currentView = "hub"
        } else {
            onBack()
        }
    }

    val lang = LocalAppLanguage.current

    AnimatedContent(
        targetState = currentView,
        transitionSpec = {
            if (targetState == "hub") {
                fadeIn(initialAlpha = 0.9f) togetherWith 
                slideOutOfContainer(
                    towards = AnimatedContentTransitionScope.SlideDirection.Right,
                    animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioNoBouncy)
                )
            } else {
                slideIntoContainer(
                    towards = AnimatedContentTransitionScope.SlideDirection.Left,
                    animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioNoBouncy)
                ) togetherWith 
                fadeOut(targetAlpha = 0.9f, animationSpec = tween(durationMillis = 50))
            }
        },
        label = "SecurityViewTransition"
    ) { view ->
        when (view) {
            "hub" -> ElvanSubShell(
                title = AppStrings.Settings.security(lang),
                onBack = onBack,
                colors = colors,
                scrollState = scrollState
            ) {
                SecurityHub(
                    colors = colors,
                    onNavigate = { currentView = it },
                    onNavigateToLinkedAccounts = onNavigateToLinkedAccounts,
                    onLogout = onLogout,
                    scrollState = scrollState
                )
            }
            "password" -> ElvanSubShell(
                title = AppStrings.Settings.changePassword(lang),
                onBack = { currentView = "hub" },
                colors = colors
            ) {
                ChangePasswordFlow(
                    colors = colors,
                    onBack = { currentView = "hub" }
                )
            }
            "create_password" -> ElvanSubShell(
                title = if (lang == AppStrings.TAMIL) "கடவுச்சொல் உருவாக்கு" else "Create Password",
                onBack = { currentView = "hub" },
                colors = colors
            ) {
                CreatePasswordFlow(
                    colors = colors,
                    onBack = { currentView = "hub" }
                )
            }
            "delete" -> ElvanSubShell(
                title = AppStrings.Settings.deleteAccount(lang),
                onBack = { currentView = "hub" },
                colors = colors
            ) {
                DeleteAccountFlow(
                    colors = colors,
                    onBack = { currentView = "hub" }
                )
            }
        }
    }
}

@Composable
private fun SecurityHub(
    colors: HomeColors,
    onNavigate: (String) -> Unit,
    onNavigateToLinkedAccounts: () -> Unit,
    onLogout: () -> Unit,
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val user = Firebase.auth.currentUser
    val hasPasswordProvider = user?.providerData?.any { it.providerId == "password" } ?: false
    val lang = LocalAppLanguage.current
    var showLogoutDialog by remember { mutableStateOf(false) }
    
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

            item(key = "account_section") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = AppStrings.Settings.account(lang),
                        colors = colors
                    ) {
                        if (hasPasswordProvider) {
                            ElvanSettingsRow(
                                icon = Icons.Outlined.Key,
                                title = AppStrings.Settings.changePassword(lang),
                                description = if (lang == AppStrings.TAMIL) "உங்கள் கடவுச்சொல்லை புதுப்பிக்கவும்" else "Update your login password",
                                onClick = { onNavigate("password") },
                                colors = colors
                            )
                        } else {
                            ElvanSettingsRow(
                                icon = Icons.Outlined.Key,
                                title = if (lang == AppStrings.TAMIL) "கடவுச்சொல் உருவாக்கு" else "Create Password",
                                description = if (lang == AppStrings.TAMIL) "மின்னஞ்சல் உள்நுழைவுக்கு கடவுச்சொல் அமைக்கவும்" else "Set a password for email login",
                                onClick = { onNavigate("create_password") },
                                colors = colors
                            )
                        }
                        
                        ElvanSettingsDivider(colors = colors)
                        
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Link,
                            title = if (lang == AppStrings.TAMIL) "இணைக்கப்பட்ட கணக்குகள்" else "Linked Accounts",
                            description = if (lang == AppStrings.TAMIL) "Google உள்நுழைவை நிர்வகி" else "Manage Google sign-in",
                            onClick = { onNavigateToLinkedAccounts() },
                            colors = colors
                        )

                        ElvanSettingsDivider(colors = colors)

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

            item(key = "danger_zone") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = AppStrings.Settings.dangerZone(lang),
                        colors = colors
                    ) {
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Warning,
                            title = AppStrings.Settings.deleteAccount(lang),
                            description = if (lang == AppStrings.TAMIL) "உங்கள் கணக்கை நிரந்தரமாக நீக்கு" else "Permanently remove your account",
                            onClick = { onNavigate("delete") },
                            titleColor = AppColors.Red,
                            iconTint = AppColors.Red,
                            colors = colors
                        )
                    }
                }
            }
        }

        if (showLogoutDialog) {
            val isDark = colors.isDark
            val dialogCardColor = if (isDark) Color(0xFF111111) else Color.White
            val cancelBtnBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
            val ff = LocalAppFontFamily.current

            AlertDialog(
                onDismissRequest = { showLogoutDialog = false },
                containerColor = dialogCardColor,
                shape = RoundedCornerShape(24.dp),
                icon = { Icon(Icons.AutoMirrored.Outlined.Logout, null, tint = AppColors.Red) },
                title = {
                    Text(
                        AppStrings.Settings.signOutConfirm(lang),
                        style = TextStyle(fontFamily = ff, fontSize = 20.sp, fontWeight = FontWeight.Bold),
                        color = colors.textPrimary
                    )
                },
                text = {
                    Text(
                        AppStrings.Settings.signOutMessage(lang),
                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Normal),
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
                        Text(AppStrings.Settings.signOut(lang), style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold))
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
                        Text(AppStrings.Home.cancel(lang), style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Medium))
                    }
                }
            )
        }
    }
}

@Composable
private fun ChangePasswordFlow(
    colors: HomeColors,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val user = Firebase.auth.currentUser
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val isDark = colors.isDark
    
    var step by remember { mutableIntStateOf(1) } // 1: Verify, 2: New Password, 3: Success
    var currentPassword by remember { mutableStateOf("") }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    val passwordsMatch = newPassword == confirmPassword && newPassword.isNotEmpty()
    val passwordValid = newPassword.length >= 6

    LaunchedEffect(step) {
        if (step == 3) {
            delay(1800)
            onBack()
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        item(key = "content_card") {
            ElvanSectionContainer {
                ElvanSettingsSection(
                    title = if (lang == AppStrings.TAMIL) "கடவுச்சொல் மாற்றம்" else "Change Password",
                    colors = colors
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 20.dp)
                    ) {
                        // 3-Step Progress Indicator
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            repeat(3) { index ->
                                val isActive = step == index + 1
                                val isPassed = step > index + 1
                                val width by animateDpAsState(
                                    targetValue = if (isActive) 22.dp else 7.dp,
                                    label = "DotWidth"
                                )
                                Box(
                                    modifier = Modifier
                                        .height(7.dp)
                                        .width(width)
                                        .clip(RoundedCornerShape(100))
                                        .background(
                                            when {
                                                isActive || isPassed -> colors.accent
                                                else -> if (isDark) Color.White.copy(alpha = 0.15f) else Color.Black.copy(alpha = 0.1f)
                                            }
                                        )
                                )
                                if (index < 2) Spacer(modifier = Modifier.width(6.dp))
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))

                        when (step) {
                            1 -> {
                                Text(
                                    text = if (lang == AppStrings.TAMIL) "உங்கள் தற்போதைய கடவுச்சொல்லை உள்ளிடவும்" else "Enter your current password",
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.SemiBold
                                    ),
                                    color = colors.textPrimary
                                )
                                
                                Spacer(modifier = Modifier.height(6.dp))
                                
                                Text(
                                    text = if (lang == AppStrings.TAMIL) "தொடர்வதற்கு முன் உங்கள் அடையாளத்தை உறுதிப்படுத்தவும்." else "Confirm your identity before setting a new password.",
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Normal
                                    ),
                                    color = colors.textPrimary.copy(alpha = 0.5f)
                                )
                                
                                Spacer(modifier = Modifier.height(20.dp))
                                
                                ElvanPasswordTextField(
                                    label = if (lang == AppStrings.TAMIL) "தற்போதைய கடவுச்சொல்" else "Current Password",
                                    value = currentPassword,
                                    onValueChange = { currentPassword = it; errorMessage = null },
                                    placeholder = if (lang == AppStrings.TAMIL) "கடவுச்சொல்லை உள்ளிடவும்" else "Enter current password",
                                    showPassword = showPassword,
                                    onToggleVisibility = { showPassword = !showPassword },
                                    colors = colors
                                )
                                
                                errorMessage?.let {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = it,
                                        color = AppColors.Red,
                                        style = TextStyle(fontFamily = ff, fontSize = 13.sp, fontWeight = FontWeight.Medium),
                                        modifier = Modifier.padding(start = 16.dp)
                                    )
                                }
                                
                                Spacer(modifier = Modifier.height(24.dp))
                                
                                Button(
                                    onClick = {
                                        if (currentPassword.isEmpty()) {
                                            errorMessage = if (lang == AppStrings.TAMIL) "கடவுச்சொல்லை உள்ளிடவும்" else "Please enter your password"
                                            return@Button
                                        }
                                        isProcessing = true
                                        user?.email?.let { email ->
                                            val credential = EmailAuthProvider.getCredential(email, currentPassword)
                                            user.reauthenticate(credential)
                                                .addOnSuccessListener {
                                                    isProcessing = false
                                                    step = 2
                                                }
                                                .addOnFailureListener {
                                                    isProcessing = false
                                                    errorMessage = if (lang == AppStrings.TAMIL) "தவறான கடவுச்சொல்" else "Incorrect password"
                                                }
                                        }
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    shape = RoundedCornerShape(50),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = colors.accent,
                                        contentColor = Color.White
                                    ),
                                    elevation = ButtonDefaults.buttonElevation(0.dp),
                                    enabled = !isProcessing
                                ) {
                                    if (isProcessing) {
                                        ExpressiveLoadingIndicator(
                                            color = if (isDark) Color(0xFF111111) else Color.White,
                                            modifier = Modifier.size(20.dp),
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Text(
                                            text = if (lang == AppStrings.TAMIL) "சரிபார்த்து தொடரவும்" else "Verify & Continue",
                                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                        )
                                    }
                                }
                                
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                TextButton(
                                    onClick = {
                                        user?.email?.let { email ->
                                            Firebase.auth.sendPasswordResetEmail(email)
                                                .addOnSuccessListener {
                                                    Toast.makeText(
                                                        context,
                                                        if (lang == AppStrings.TAMIL) "மீட்டமைப்பு மின்னஞ்சல் $email முகவரிக்கு அனுப்பப்பட்டது" else "Reset email sent to $email",
                                                        Toast.LENGTH_LONG
                                                    ).show()
                                                }
                                                .addOnFailureListener { e ->
                                                    Toast.makeText(context, e.message, Toast.LENGTH_SHORT).show()
                                                }
                                        }
                                    },
                                    modifier = Modifier.align(Alignment.CenterHorizontally)
                                ) {
                                    Text(
                                        text = if (lang == AppStrings.TAMIL) "கடவுச்சொல் மறந்துவிட்டதா?" else "Forgot Password?",
                                        style = TextStyle(
                                            fontFamily = ff,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Medium
                                        ),
                                        color = colors.textPrimary.copy(alpha = 0.7f)
                                    )
                                }
                            }
                            
                            2 -> {
                                Text(
                                    text = if (lang == AppStrings.TAMIL) "புதிய கடவுச்சொல்லை உருவாக்கவும்" else "Create your new password",
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.SemiBold
                                    ),
                                    color = colors.textPrimary
                                )
                                
                                Spacer(modifier = Modifier.height(20.dp))
                                
                                ElvanPasswordTextField(
                                    label = if (lang == AppStrings.TAMIL) "புதிய கடவுச்சொல்" else "New Password",
                                    value = newPassword,
                                    onValueChange = { newPassword = it },
                                    placeholder = if (lang == AppStrings.TAMIL) "புதிய கடவுச்சொல்லை உள்ளிடவும்" else "Enter new password",
                                    showPassword = showPassword,
                                    onToggleVisibility = { showPassword = !showPassword },
                                    colors = colors
                                )
                                
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                ElvanPasswordTextField(
                                    label = if (lang == AppStrings.TAMIL) "கடவுச்சொல்லை உறுதிப்படுத்தவும்" else "Confirm New Password",
                                    value = confirmPassword,
                                    onValueChange = { confirmPassword = it },
                                    placeholder = if (lang == AppStrings.TAMIL) "மீண்டும் உள்ளிடவும்" else "Confirm password",
                                    showPassword = showPassword,
                                    onToggleVisibility = { showPassword = !showPassword },
                                    colors = colors
                                )
                                
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    color = if (isDark) Color.White.copy(alpha = 0.04f) else Color.Black.copy(alpha = 0.03f)
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        ValidationRow(
                                            text = if (lang == AppStrings.TAMIL) "குறைந்தது 6 எழுத்துக்கள்" else "At least 6 characters",
                                            isValid = passwordValid,
                                            colors = colors
                                        )
                                        Spacer(modifier = Modifier.height(10.dp))
                                        ValidationRow(
                                            text = if (lang == AppStrings.TAMIL) "கடவுச்சொற்கள் பொருந்துகின்றன" else "Passwords match",
                                            isValid = passwordsMatch,
                                            colors = colors
                                        )
                                    }
                                }
                                
                                Spacer(modifier = Modifier.height(24.dp))
                                
                                Button(
                                    onClick = {
                                        isProcessing = true
                                        user?.updatePassword(newPassword)
                                            ?.addOnSuccessListener {
                                                isProcessing = false
                                                step = 3
                                            }
                                            ?.addOnFailureListener { e ->
                                                isProcessing = false
                                                Toast.makeText(context, e.message, Toast.LENGTH_SHORT).show()
                                            }
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    shape = RoundedCornerShape(50),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = colors.accent,
                                        contentColor = Color.White
                                    ),
                                    elevation = ButtonDefaults.buttonElevation(0.dp),
                                    enabled = passwordsMatch && passwordValid && !isProcessing
                                ) {
                                    if (isProcessing) {
                                        ExpressiveLoadingIndicator(
                                            color = Color.White,
                                            modifier = Modifier.size(20.dp),
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Text(
                                            text = if (lang == AppStrings.TAMIL) "கடவுச்சொல்லைப் புதுப்பிக்கவும்" else "Update Password",
                                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                        )
                                    }
                                }
                            }
                            
                            3 -> {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 32.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Surface(
                                        modifier = Modifier.size(64.dp),
                                        shape = CircleShape,
                                        color = colors.accent.copy(alpha = 0.12f)
                                    ) {
                                        Box(
                                            contentAlignment = Alignment.Center,
                                            modifier = Modifier.fillMaxSize()
                                        ) {
                                            Icon(
                                                imageVector = Icons.Rounded.CheckCircle,
                                                contentDescription = null,
                                                tint = colors.accent,
                                                modifier = Modifier.size(36.dp)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(20.dp))
                                    Text(
                                        text = if (lang == AppStrings.TAMIL) "கடவுச்சொல் புதுப்பிக்கப்பட்டது!" else "Password Updated!",
                                        style = TextStyle(
                                            fontFamily = ff,
                                            fontSize = 20.sp,
                                            fontWeight = FontWeight.Bold
                                        ),
                                        color = colors.textPrimary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = if (lang == AppStrings.TAMIL) "பாதுகாப்பு அமைப்புகளுக்குத் திரும்புகிறது..." else "Returning to security settings...",
                                        style = TextStyle(
                                            fontFamily = ff,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Normal
                                        ),
                                        color = colors.textPrimary.copy(alpha = 0.5f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CreatePasswordFlow(
    colors: HomeColors,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val user = Firebase.auth.currentUser
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val isDark = colors.isDark
    
    var step by remember { mutableIntStateOf(1) } // 1: Set Password, 2: Success
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isProcessing by remember { mutableStateOf(false) }
    var showReauthDialog by remember { mutableStateOf(false) }
    
    val reauthLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                account?.idToken?.let { idToken ->
                    val credential = GoogleAuthProvider.getCredential(idToken, null)
                    user?.reauthenticate(credential)
                        ?.addOnSuccessListener {
                            Toast.makeText(context, "Identity verified! Trying again...", Toast.LENGTH_SHORT).show()
                            isProcessing = true
                            user.updatePassword(newPassword)
                                .addOnSuccessListener {
                                    isProcessing = false
                                    step = 2
                                }
                                .addOnFailureListener { e ->
                                    isProcessing = false
                                    Toast.makeText(context, e.message, Toast.LENGTH_SHORT).show()
                                }
                        }
                        ?.addOnFailureListener { e ->
                            Toast.makeText(context, "Verification failed: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                }
            } catch (e: ApiException) {
                Toast.makeText(context, "Verification failed: ${e.statusCode}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    if (showReauthDialog) {
        AlertDialog(
            onDismissRequest = { showReauthDialog = false },
            title = { Text("Verify Custom Identity", style = TextStyle(fontFamily = ff, fontSize = 18.sp, fontWeight = FontWeight.Bold), color = colors.textPrimary) },
            text = { Text("For security, please sign in with Google again to create a password.", style = TextStyle(fontFamily = ff, fontSize = 14.sp), color = colors.textPrimary.copy(alpha = 0.7f)) },
            confirmButton = {
                Button(
                    onClick = {
                        showReauthDialog = false
                        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                            .requestIdToken(WEB_CLIENT_ID)
                            .requestEmail()
                            .build()
                        val googleSignInClient = GoogleSignIn.getClient(context, gso)
                        reauthLauncher.launch(googleSignInClient.signInIntent)
                    },
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.textPrimary, contentColor = if (isDark) Color(0xFF111111) else Color.White)
                ) {
                    Text("Verify", style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold))
                }
            },
            dismissButton = {
                TextButton(onClick = { showReauthDialog = false }) {
                    Text("Cancel", style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Medium), color = colors.textPrimary)
                }
            },
            containerColor = if (isDark) Color(0xFF111111) else Color.White,
            shape = RoundedCornerShape(24.dp)
        )
    }
    
    val passwordsMatch = newPassword == confirmPassword && newPassword.isNotEmpty()
    val passwordValid = newPassword.length >= 6

    LaunchedEffect(step) {
        if (step == 2) {
            delay(1800)
            onBack()
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        item(key = "content_card") {
            ElvanSectionContainer {
                ElvanSettingsSection(
                    title = if (lang == AppStrings.TAMIL) "கடவுச்சொல் உருவாக்கு" else "Create Password",
                    colors = colors
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 20.dp)
                    ) {
                        when (step) {
                            1 -> {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    color = if (isDark) Color.White.copy(alpha = 0.04f) else Color.Black.copy(alpha = 0.03f)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Outlined.Info,
                                            contentDescription = null,
                                            tint = colors.textPrimary,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(modifier = Modifier.width(12.dp))
                                        Text(
                                            text = if (lang == AppStrings.TAMIL) "Google மூலம் உள்நுழைந்துள்ளீர்கள். மின்னஞ்சல் மூலமும் உள்நுழைய கடவுச்சொல் ஒன்றை உருவாக்கவும்." else "You signed in with Google. Create a password to also sign in with email.",
                                            style = TextStyle(
                                                fontFamily = ff,
                                                fontSize = 13.sp,
                                                fontWeight = FontWeight.Normal
                                            ),
                                            color = colors.textPrimary.copy(alpha = 0.8f)
                                        )
                                    }
                                }
                                
                                Spacer(modifier = Modifier.height(20.dp))
                                
                                ElvanPasswordTextField(
                                    label = if (lang == AppStrings.TAMIL) "புதிய கடவுச்சொல்" else "New Password",
                                    value = newPassword,
                                    onValueChange = { newPassword = it },
                                    placeholder = if (lang == AppStrings.TAMIL) "கடவுச்சொல்லை உள்ளிடவும்" else "Enter password",
                                    showPassword = showPassword,
                                    onToggleVisibility = { showPassword = !showPassword },
                                    colors = colors
                                )
                                
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                ElvanPasswordTextField(
                                    label = if (lang == AppStrings.TAMIL) "கடவுச்சொல்லை உறுதிப்படுத்தவும்" else "Confirm Password",
                                    value = confirmPassword,
                                    onValueChange = { confirmPassword = it },
                                    placeholder = if (lang == AppStrings.TAMIL) "மீண்டும் உள்ளிடவும்" else "Confirm password",
                                    showPassword = showPassword,
                                    onToggleVisibility = { showPassword = !showPassword },
                                    colors = colors
                                )
                                
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    color = if (isDark) Color.White.copy(alpha = 0.04f) else Color.Black.copy(alpha = 0.03f)
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        ValidationRow(
                                            text = if (lang == AppStrings.TAMIL) "குறைந்தது 6 எழுத்துக்கள்" else "At least 6 characters",
                                            isValid = passwordValid,
                                            colors = colors
                                        )
                                        Spacer(modifier = Modifier.height(10.dp))
                                        ValidationRow(
                                            text = if (lang == AppStrings.TAMIL) "கடவுச்சொற்கள் பொருந்துகின்றன" else "Passwords match",
                                            isValid = passwordsMatch,
                                            colors = colors
                                        )
                                    }
                                }
                                
                                Spacer(modifier = Modifier.height(24.dp))
                                
                                Button(
                                    onClick = {
                                        isProcessing = true
                                        user?.updatePassword(newPassword)
                                            ?.addOnSuccessListener {
                                                isProcessing = false
                                                step = 2
                                            }
                                            ?.addOnFailureListener { e ->
                                                isProcessing = false
                                                if (e is FirebaseAuthRecentLoginRequiredException) {
                                                    showReauthDialog = true
                                                } else {
                                                    Toast.makeText(context, e.message, Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    shape = RoundedCornerShape(50),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = colors.accent,
                                        contentColor = Color.White
                                    ),
                                    elevation = ButtonDefaults.buttonElevation(0.dp),
                                    enabled = passwordsMatch && passwordValid && !isProcessing
                                ) {
                                    if (isProcessing) {
                                        ExpressiveLoadingIndicator(
                                            color = Color.White,
                                            modifier = Modifier.size(20.dp),
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Text(
                                            text = if (lang == AppStrings.TAMIL) "கடவுச்சொல் உருவாக்கு" else "Create Password",
                                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                        )
                                    }
                                }
                            }
                            
                            2 -> {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 32.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Surface(
                                        modifier = Modifier.size(64.dp),
                                        shape = CircleShape,
                                        color = colors.accent.copy(alpha = 0.12f)
                                    ) {
                                        Box(
                                            contentAlignment = Alignment.Center,
                                            modifier = Modifier.fillMaxSize()
                                        ) {
                                            Icon(
                                                imageVector = Icons.Rounded.CheckCircle,
                                                contentDescription = null,
                                                tint = colors.accent,
                                                modifier = Modifier.size(36.dp)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(20.dp))
                                    Text(
                                        text = if (lang == AppStrings.TAMIL) "கடவுச்சொல் உருவாக்கப்பட்டது!" else "Password Created!",
                                        style = TextStyle(
                                            fontFamily = ff,
                                            fontSize = 20.sp,
                                            fontWeight = FontWeight.Bold
                                        ),
                                        color = colors.textPrimary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = if (lang == AppStrings.TAMIL) "நீங்கள் இப்போது மின்னஞ்சல் மூலமும் உள்நுழையலாம்." else "You can now sign in with email too.",
                                        style = TextStyle(
                                            fontFamily = ff,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Normal
                                        ),
                                        color = colors.textPrimary.copy(alpha = 0.5f)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun LinkedAccountsScreen(
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    
    ElvanSubShell(
        title = if (lang == AppStrings.TAMIL) "இணைக்கப்பட்ட கணக்குகள்" else "Linked Accounts",
        onBack = onBack,
        colors = colors
    ) {
        LinkedAccountsView(colors = colors, onBack = onBack)
    }
}

@Composable
private fun LinkedAccountsView(
    colors: HomeColors,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val user = Firebase.auth.currentUser
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val isDark = colors.isDark
    val scope = rememberCoroutineScope()
    
    val googleProvider = user?.providerData?.find { it.providerId == "google.com" }
    val passwordProvider = user?.providerData?.find { it.providerId == "password" }
    val isGoogleLinked = googleProvider != null
    val hasPassword = passwordProvider != null
    val googleEmail = googleProvider?.email ?: ""
    val googlePhotoUrl = googleProvider?.photoUrl?.toString()
    val primaryEmail = user?.email ?: ""
    
    var showUnlinkDialog by remember { mutableStateOf(false) }
    var isUnlinking by remember { mutableStateOf(false) }
    var isLinking by remember { mutableStateOf(false) }

    val googleLinkLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                account?.idToken?.let { idToken ->
                    scope.launch {
                        try {
                            val credential = GoogleAuthProvider.getCredential(idToken, null)
                            user?.linkWithCredential(credential)
                                ?.addOnSuccessListener {
                                    Toast.makeText(context, "Google account linked!", Toast.LENGTH_SHORT).show()
                                    isLinking = false
                                    onBack()
                                }
                                ?.addOnFailureListener { e ->
                                    Toast.makeText(context, e.message ?: "Link failed", Toast.LENGTH_LONG).show()
                                    isLinking = false
                                }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Link failed: ${e.message}", Toast.LENGTH_LONG).show()
                            isLinking = false
                        }
                    }
                } ?: run {
                    isLinking = false
                    Toast.makeText(context, "No ID Token received", Toast.LENGTH_SHORT).show()
                }
            } catch (e: ApiException) {
                isLinking = false
                Toast.makeText(context, "Google Sign-In Failed: ${e.statusCode}", Toast.LENGTH_LONG).show()
            }
        } else {
            isLinking = false
        }
    }

    val handleGoogleLink: () -> Unit = {
        try {
            isLinking = true
            val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(WEB_CLIENT_ID)
                .requestEmail()
                .build()
            val googleSignInClient = GoogleSignIn.getClient(context, gso)
            googleSignInClient.signOut()
            googleLinkLauncher.launch(googleSignInClient.signInIntent)
        } catch (e: Exception) {
            isLinking = false
            e.printStackTrace()
            Toast.makeText(context, "Could not launch Google Sign-In: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    if (showUnlinkDialog) {
        AlertDialog(
            onDismissRequest = { showUnlinkDialog = false },
            title = {
                Text(
                    text = if (lang == AppStrings.TAMIL) "Google கணக்கை துண்டிக்கவா?" else "Unlink Google Account?",
                    style = TextStyle(fontFamily = ff, fontSize = 18.sp, fontWeight = FontWeight.Bold),
                    color = colors.textPrimary
                )
            },
            text = {
                Column {
                    Text(
                        text = if (hasPassword) 
                            (if (lang == AppStrings.TAMIL) "துண்டித்த பிறகு உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல்லைப் பயன்படுத்தி உள்நுழைய வேண்டும்." else "You will need to sign in with your email and password after unlinking.")
                        else 
                            (if (lang == AppStrings.TAMIL) "Google கணக்கை துண்டிக்கும் முன் கடவுச்சொல் ஒன்றை உருவாக்க வேண்டும்." else "You must create a password first before unlinking Google, otherwise you won't be able to sign in."),
                        style = TextStyle(fontFamily = ff, fontSize = 14.sp),
                        color = colors.textPrimary.copy(alpha = 0.7f)
                    )
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
                                    onBack()
                                }
                                ?.addOnFailureListener { e ->
                                    Toast.makeText(context, e.message ?: "Failed to unlink", Toast.LENGTH_SHORT).show()
                                    isUnlinking = false
                                }
                        },
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = AppColors.Red, contentColor = Color.White),
                        enabled = !isUnlinking
                    ) {
                        Text(
                            text = if (lang == AppStrings.TAMIL) "துண்டி" else "Unlink",
                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        )
                    }
                } else {
                    Button(
                        onClick = { 
                            showUnlinkDialog = false
                            onBack()
                        },
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = colors.textPrimary, contentColor = if (isDark) Color(0xFF111111) else Color.White)
                    ) {
                        Text(
                            text = if (lang == AppStrings.TAMIL) "கடவுச்சொல் உருவாக்கு" else "Create Password",
                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        )
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showUnlinkDialog = false }) {
                    Text(
                        text = if (lang == AppStrings.TAMIL) "கைவிடு" else "Cancel",
                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Medium),
                        color = colors.textPrimary
                    )
                }
            },
            containerColor = if (isDark) Color(0xFF111111) else Color.White,
            shape = RoundedCornerShape(24.dp)
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        item(key = "accounts_card") {
            ElvanSectionContainer {
                ElvanSettingsSection(
                    title = if (lang == AppStrings.TAMIL) "உள்நுழைவு முறைகள்" else "Sign-in Methods",
                    colors = colors
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (isGoogleLinked && googlePhotoUrl != null) {
                            AsyncImage(
                                model = ImageRequest.Builder(LocalContext.current)
                                    .data(googlePhotoUrl)
                                    .crossfade(true)
                                    .build(),
                                contentDescription = "Google Profile",
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                            )
                        } else {
                            Surface(
                                modifier = Modifier.size(40.dp),
                                shape = CircleShape,
                                color = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
                            ) {
                                Box(
                                    contentAlignment = Alignment.Center,
                                    modifier = Modifier.fillMaxSize()
                                ) {
                                    Text(
                                        text = "G",
                                        style = TextStyle(fontFamily = ff, fontSize = 18.sp, fontWeight = FontWeight.Bold),
                                        color = colors.textPrimary
                                    )
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.width(16.dp))
                        
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Google",
                                style = TextStyle(fontFamily = ff, fontSize = 15.sp, fontWeight = FontWeight.SemiBold),
                                color = colors.textPrimary
                            )
                            Text(
                                text = if (isGoogleLinked) googleEmail else (if (lang == AppStrings.TAMIL) "இணைக்கப்படவில்லை" else "Not connected"),
                                style = TextStyle(fontFamily = ff, fontSize = 13.sp, fontWeight = FontWeight.Normal),
                                color = colors.textPrimary.copy(alpha = 0.5f),
                                maxLines = 1
                            )
                        }
                        
                        if (isGoogleLinked) {
                            Button(
                                onClick = { showUnlinkDialog = true },
                                shape = RoundedCornerShape(50),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f),
                                    contentColor = AppColors.Red
                                ),
                                elevation = ButtonDefaults.buttonElevation(0.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = if (lang == AppStrings.TAMIL) "துண்டி" else "Unlink",
                                    style = TextStyle(fontFamily = ff, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                )
                            }
                        } else {
                            Button(
                                onClick = handleGoogleLink,
                                shape = RoundedCornerShape(50),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.accent,
                                    contentColor = Color.White
                                ),
                                elevation = ButtonDefaults.buttonElevation(0.dp),
                                enabled = !isLinking,
                                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp)
                            ) {
                                if (isLinking) {
                                    ExpressiveLoadingIndicator(
                                        color = Color.White,
                                        modifier = Modifier.size(16.dp),
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Text(
                                        text = if (lang == AppStrings.TAMIL) "இணை" else "Link",
                                        style = TextStyle(fontFamily = ff, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                    )
                                }
                            }
                        }
                    }
                    
                    ElvanSettingsDivider(colors = colors)
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            modifier = Modifier.size(40.dp),
                            shape = CircleShape,
                            color = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.fillMaxSize()
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Email,
                                    contentDescription = null,
                                    tint = colors.textPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.width(16.dp))
                        
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (lang == AppStrings.TAMIL) "மின்னஞ்சல்" else "Email",
                                style = TextStyle(fontFamily = ff, fontSize = 15.sp, fontWeight = FontWeight.SemiBold),
                                color = colors.textPrimary
                            )
                            Text(
                                text = primaryEmail,
                                style = TextStyle(fontFamily = ff, fontSize = 13.sp, fontWeight = FontWeight.Normal),
                                color = colors.textPrimary.copy(alpha = 0.5f),
                                maxLines = 1
                            )
                        }
                        
                        Icon(
                            imageVector = Icons.Rounded.CheckCircle,
                            contentDescription = null,
                            tint = colors.accent,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    
                    ElvanSettingsDivider(colors = colors)
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            modifier = Modifier.size(40.dp),
                            shape = CircleShape,
                            color = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.fillMaxSize()
                            ) {
                                Icon(
                                    imageVector = Icons.Outlined.Key,
                                    contentDescription = null,
                                    tint = colors.textPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.width(16.dp))
                        
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (lang == AppStrings.TAMIL) "கடவுச்சொல்" else "Password",
                                style = TextStyle(fontFamily = ff, fontSize = 15.sp, fontWeight = FontWeight.SemiBold),
                                color = colors.textPrimary
                            )
                            Text(
                                text = if (hasPassword) 
                                    (if (lang == AppStrings.TAMIL) "கடவுச்சொல் அமைக்கப்பட்டுள்ளது" else "Password set")
                                else 
                                    (if (lang == AppStrings.TAMIL) "கடவுச்சொல் அமைக்கப்படவில்லை" else "No password set"),
                                style = TextStyle(fontFamily = ff, fontSize = 13.sp, fontWeight = FontWeight.Normal),
                                color = colors.textPrimary.copy(alpha = 0.5f)
                            )
                        }
                        
                        if (hasPassword) {
                            Icon(
                                imageVector = Icons.Rounded.CheckCircle,
                                contentDescription = null,
                                tint = colors.accent,
                                modifier = Modifier.size(22.dp)
                            )
                        } else {
                            Button(
                                onClick = onBack,
                                shape = RoundedCornerShape(50),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.accent,
                                    contentColor = Color.White
                                ),
                                elevation = ButtonDefaults.buttonElevation(0.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = if (lang == AppStrings.TAMIL) "அமை" else "Create",
                                    style = TextStyle(fontFamily = ff, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DeleteAccountFlow(
    colors: HomeColors,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val user = Firebase.auth.currentUser
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val isDark = colors.isDark
    
    var step by remember { mutableIntStateOf(1) } // 1: Warning, 2: Confirm, 3: Password
    var understood by remember { mutableStateOf(false) }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var showReauthDialog by remember { mutableStateOf(false) }

    val reauthLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                account?.idToken?.let { idToken ->
                    val credential = GoogleAuthProvider.getCredential(idToken, null)
                    user?.reauthenticate(credential)
                        ?.addOnSuccessListener {
                            Toast.makeText(context, "Identity verified! Deleting account...", Toast.LENGTH_SHORT).show()
                            user.let { u ->
                                Firebase.database.getReference("users/${u.uid}").removeValue()
                                u.delete()
                                    .addOnSuccessListener {
                                        Toast.makeText(context, "Account deleted", Toast.LENGTH_SHORT).show()
                                    }
                                    .addOnFailureListener { e ->
                                        isProcessing = false
                                        errorMessage = e.message ?: "Failed to delete account"
                                    }
                            }
                        }
                        ?.addOnFailureListener { e ->
                            Toast.makeText(context, "Verification failed: ${e.message}", Toast.LENGTH_SHORT).show()
                        }
                }
            } catch (e: ApiException) {
                Toast.makeText(context, "Verification failed: ${e.statusCode}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    if (showReauthDialog) {
        AlertDialog(
            onDismissRequest = { showReauthDialog = false },
            title = { Text("Verify Identity for Deletion", style = TextStyle(fontFamily = ff, fontSize = 18.sp, fontWeight = FontWeight.Bold), color = colors.textPrimary) },
            text = { Text("Deleting your account is a sensitive action. Please sign in with Google again to confirm.", style = TextStyle(fontFamily = ff, fontSize = 14.sp), color = colors.textPrimary.copy(alpha = 0.7f)) },
            confirmButton = {
                Button(
                    onClick = {
                        showReauthDialog = false
                        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                            .requestIdToken(WEB_CLIENT_ID)
                            .requestEmail()
                            .build()
                        val googleSignInClient = GoogleSignIn.getClient(context, gso)
                        reauthLauncher.launch(googleSignInClient.signInIntent)
                    },
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColors.Red, contentColor = Color.White)
                ) {
                    Text("Verify", style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold))
                }
            },
            dismissButton = {
                TextButton(onClick = { showReauthDialog = false }) {
                    Text("Cancel", style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Medium), color = colors.textPrimary)
                }
            },
            containerColor = if (isDark) Color(0xFF111111) else Color.White,
            shape = RoundedCornerShape(24.dp)
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        item(key = "content_card") {
            ElvanSectionContainer {
                ElvanSettingsSection(
                    title = AppStrings.Settings.deleteAccount(lang),
                    colors = colors
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 20.dp)
                    ) {
                        when (step) {
                            1 -> {
                                Surface(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    color = AppColors.Red.copy(alpha = 0.08f)
                                ) {
                                    Column(modifier = Modifier.padding(18.dp)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                imageVector = Icons.Outlined.Warning,
                                                contentDescription = null,
                                                tint = AppColors.Red,
                                                modifier = Modifier.size(22.dp)
                                            )
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Text(
                                                text = if (lang == AppStrings.TAMIL) "இந்த நடவடிக்கை நிரந்தரமானது" else "This action is permanent",
                                                style = TextStyle(fontFamily = ff, fontSize = 15.sp, fontWeight = FontWeight.Bold),
                                                color = AppColors.Red
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Text(
                                            text = if (lang == AppStrings.TAMIL) 
                                                "• உங்கள் தரவு அனைத்தும் நிரந்தரமாக நீக்கப்படும்\n• அட்டவணை மற்றும் அமைப்புகள் அழிக்கப்படும்\n• கணக்கை மீட்டெடுக்க முடியாது\n• எப்போது வேண்டுமானாலும் புதிய கணக்கு உருவாக்கலாம்"
                                            else 
                                                "• All your data will be permanently deleted\n• Your schedule and preferences will be lost\n• You will not be able to recover your account\n• You can create a new account anytime",
                                            style = TextStyle(fontFamily = ff, fontSize = 13.sp, lineHeight = 20.sp),
                                            color = colors.textPrimary.copy(alpha = 0.8f)
                                        )
                                    }
                                }
                                
                                Spacer(modifier = Modifier.height(24.dp))
                                
                                Button(
                                    onClick = { step = 2 },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    shape = RoundedCornerShape(50),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = AppColors.Red,
                                        contentColor = Color.White
                                    ),
                                    elevation = ButtonDefaults.buttonElevation(0.dp)
                                ) {
                                    Text(
                                        text = if (lang == AppStrings.TAMIL) "புரிந்து கொண்டேன், தொடரவும்" else "I understand, continue",
                                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                    )
                                }
                                
                                Spacer(modifier = Modifier.height(10.dp))
                                
                                FilledTonalButton(
                                    onClick = onBack,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    shape = RoundedCornerShape(50),
                                    colors = ButtonDefaults.filledTonalButtonColors(
                                        containerColor = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f),
                                        contentColor = colors.textPrimary
                                    ),
                                    elevation = ButtonDefaults.buttonElevation(0.dp)
                                ) {
                                    Text(
                                        text = if (lang == AppStrings.TAMIL) "கைவிடு" else "Cancel",
                                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                    )
                                }
                            }
                            
                            2 -> {
                                Text(
                                    text = if (lang == AppStrings.TAMIL) "நிச்சயமாக நீக்க விரும்புகிறீர்களா?" else "Are you absolutely sure?",
                                    style = TextStyle(fontFamily = ff, fontSize = 17.sp, fontWeight = FontWeight.SemiBold),
                                    color = colors.textPrimary
                                )
                                
                                Spacer(modifier = Modifier.height(16.dp))
                                
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(16.dp))
                                        .clickable(
                                            interactionSource = remember { MutableInteractionSource() },
                                            indication = ripple(color = if (isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f), bounded = true),
                                            onClick = { understood = !understood }
                                        ),
                                    shape = RoundedCornerShape(16.dp),
                                    color = if (isDark) Color.White.copy(alpha = 0.04f) else Color.Black.copy(alpha = 0.03f)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Checkbox(
                                            checked = understood,
                                            onCheckedChange = { understood = it },
                                            colors = CheckboxDefaults.colors(
                                                checkedColor = AppColors.Red,
                                                uncheckedColor = colors.textPrimary.copy(alpha = 0.4f)
                                            )
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = if (lang == AppStrings.TAMIL) "இந்த நடவடிக்கை மாற்ற முடியாதது மற்றும் அனைத்து தரவும் நிரந்தரமாக நீக்கப்படும் என்பதை நான் புரிந்துகொள்கிறேன்." else "I understand that this action cannot be undone and all my data will be permanently deleted.",
                                            style = TextStyle(fontFamily = ff, fontSize = 13.sp),
                                            color = colors.textPrimary
                                        )
                                    }
                                }
                                
                                Spacer(modifier = Modifier.height(24.dp))
                                
                                Button(
                                    onClick = { step = 3 },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    shape = RoundedCornerShape(50),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = AppColors.Red,
                                        contentColor = Color.White
                                    ),
                                    elevation = ButtonDefaults.buttonElevation(0.dp),
                                    enabled = understood
                                ) {
                                    Text(
                                        text = if (lang == AppStrings.TAMIL) "நீக்கத் தொடரவும்" else "Proceed to Delete",
                                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                    )
                                }
                            }
                            
                            3 -> {
                                Text(
                                    text = if (lang == AppStrings.TAMIL) "உங்கள் அடையாளத்தை உறுதிப்படுத்தவும்" else "Verify your identity",
                                    style = TextStyle(fontFamily = ff, fontSize = 17.sp, fontWeight = FontWeight.SemiBold),
                                    color = colors.textPrimary
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = if (lang == AppStrings.TAMIL) "கணக்கு நீக்கத்தை உறுதிப்படுத்த உங்கள் கடவுச்சொல்லை உள்ளிடவும்." else "Enter your password to confirm permanent deletion.",
                                    style = TextStyle(fontFamily = ff, fontSize = 13.sp),
                                    color = colors.textPrimary.copy(alpha = 0.5f)
                                )
                                
                                Spacer(modifier = Modifier.height(20.dp))
                                
                                ElvanPasswordTextField(
                                    label = if (lang == AppStrings.TAMIL) "கடவுச்சொல்" else "Password",
                                    value = password,
                                    onValueChange = { password = it; errorMessage = null },
                                    placeholder = if (lang == AppStrings.TAMIL) "கடவுச்சொல்லை உள்ளிடவும்" else "Enter password",
                                    showPassword = showPassword,
                                    onToggleVisibility = { showPassword = !showPassword },
                                    colors = colors
                                )
                                
                                errorMessage?.let {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = it,
                                        color = AppColors.Red,
                                        style = TextStyle(fontFamily = ff, fontSize = 13.sp, fontWeight = FontWeight.Medium),
                                        modifier = Modifier.padding(start = 16.dp)
                                    )
                                }
                                
                                Spacer(modifier = Modifier.height(24.dp))
                                
                                Button(
                                    onClick = {
                                        if (password.isEmpty()) {
                                            errorMessage = if (lang == AppStrings.TAMIL) "கடவுச்சொல்லை உள்ளிடவும்" else "Please enter your password"
                                            return@Button
                                        }
                                        isProcessing = true
                                        user?.email?.let { email ->
                                            val credential = EmailAuthProvider.getCredential(email, password)
                                            user.reauthenticate(credential)
                                                .addOnSuccessListener {
                                                    user.let { u ->
                                                        Firebase.database.getReference("users/${u.uid}").removeValue()
                                                        u.delete()
                                                            .addOnSuccessListener {
                                                                Toast.makeText(context, "Account deleted", Toast.LENGTH_SHORT).show()
                                                            }
                                                            .addOnFailureListener { e ->
                                                                isProcessing = false
                                                                errorMessage = e.message ?: "Failed to delete account"
                                                            }
                                                    }
                                                }
                                                .addOnFailureListener { e ->
                                                    isProcessing = false
                                                    if (e is FirebaseAuthRecentLoginRequiredException) {
                                                        showReauthDialog = true
                                                    } else {
                                                        errorMessage = if (lang == AppStrings.TAMIL) "தவறான கடவுச்சொல்" else "Incorrect password"
                                                    }
                                                }
                                        }
                                    },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(48.dp),
                                    shape = RoundedCornerShape(50),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = AppColors.Red,
                                        contentColor = Color.White
                                    ),
                                    elevation = ButtonDefaults.buttonElevation(0.dp),
                                    enabled = !isProcessing
                                ) {
                                    if (isProcessing) {
                                        ExpressiveLoadingIndicator(
                                            color = Color.White,
                                            modifier = Modifier.size(20.dp),
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Text(
                                            text = if (lang == AppStrings.TAMIL) "என் கணக்கை நிரந்தரமாக நீக்கு" else "Delete My Account Forever",
                                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * ElvanPasswordTextField — Pill-shaped input container (height 48dp, corner radius 100)
 * with top label, password visibility toggle, and subtle background tint matching the Elvan theme.
 */
@Composable
private fun ElvanPasswordTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    showPassword: Boolean,
    onToggleVisibility: () -> Unit,
    colors: HomeColors,
    modifier: Modifier = Modifier
) {
    val isDark = colors.isDark
    val ff = LocalAppFontFamily.current
    val inputBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = label,
            style = TextStyle(
                fontFamily = ff,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            ),
            color = colors.textPrimary.copy(alpha = 0.5f),
            modifier = Modifier.padding(start = 16.dp, bottom = 6.dp)
        )
        
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(100),
            color = inputBg
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.weight(1f)) {
                    if (value.isEmpty()) {
                        Text(
                            text = placeholder,
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Normal
                            ),
                            color = colors.textPrimary.copy(alpha = 0.35f)
                        )
                    }
                    BasicTextField(
                        value = value,
                        onValueChange = onValueChange,
                        textStyle = TextStyle(
                            fontFamily = ff,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Normal,
                            color = colors.textPrimary
                        ),
                        singleLine = true,
                        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        cursorBrush = SolidColor(colors.textPrimary),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                IconButton(
                    onClick = onToggleVisibility,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = if (showPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                        contentDescription = null,
                        tint = colors.textPrimary.copy(alpha = 0.5f),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun ValidationRow(text: String, isValid: Boolean, colors: HomeColors) {
    val ff = LocalAppFontFamily.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            imageVector = if (isValid) Icons.Rounded.CheckCircle else Icons.Rounded.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (isValid) colors.accent else colors.textPrimary.copy(alpha = 0.3f),
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = text,
            style = TextStyle(
                fontFamily = ff,
                fontSize = 13.sp,
                fontWeight = if (isValid) FontWeight.Medium else FontWeight.Normal
            ),
            color = if (isValid) colors.textPrimary else colors.textPrimary.copy(alpha = 0.5f)
        )
    }
}

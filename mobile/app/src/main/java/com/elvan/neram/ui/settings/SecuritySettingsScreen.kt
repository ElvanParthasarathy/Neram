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
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.trWithLang
import com.elvan.neram.ui.auth.GoogleAuthHelper
import com.google.firebase.auth.EmailAuthProvider
import com.google.firebase.auth.FirebaseAuthRecentLoginRequiredException
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

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
                title = K.security.tr(lang),
                onBack = onBack,
                colors = colors,
                scrollState = scrollState
            ) {
                SecurityHub(
                    colors = colors,
                    onNavigate = { currentView = it },
                    scrollState = scrollState
                )
            }
            "password" -> ElvanSubShell(
                title = K.changePassword.tr(lang),
                onBack = { currentView = "hub" },
                colors = colors
            ) {
                ChangePasswordFlow(
                    colors = colors,
                    onBack = { currentView = "hub" }
                )
            }
            "create_password" -> ElvanSubShell(
                title = com.elvan.neram.ui.mozhiyaakkam.K.createPassword.tr(lang),
                onBack = { currentView = "hub" },
                colors = colors
            ) {
                CreatePasswordFlow(
                    colors = colors,
                    onBack = { currentView = "hub" }
                )
            }
            "delete" -> ElvanSubShell(
                title = K.deleteAccount.tr(lang),
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
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val user = Firebase.auth.currentUser
    val hasPasswordProvider = user?.providerData?.any { it.providerId == "password" } ?: false
    val lang = LocalAppLanguage.current
    
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

            item(key = "password_section") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = K.changePassword.tr(lang),
                        colors = colors
                    ) {
                        if (hasPasswordProvider) {
                            ElvanSettingsRow(
                                icon = Icons.Outlined.Key,
                                title = K.changePassword.tr(lang),
                                description = K.updateLoginPassword.tr(lang),
                                onClick = { onNavigate("password") },
                                colors = colors
                            )
                        } else {
                            ElvanSettingsRow(
                                icon = Icons.Outlined.Key,
                                title = K.createPasswordTitle.tr(lang),
                                description = K.setPasswordEmailLogin.tr(lang),
                                onClick = { onNavigate("create_password") },
                                colors = colors
                            )
                        }
                    }
                }
            }

            item(key = "danger_zone") {
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = K.dangerZone.tr(lang),
                        colors = colors
                    ) {
                        ElvanSettingsRow(
                            icon = Icons.Outlined.Warning,
                            title = K.deleteAccount.tr(lang),
                            description = K.permanentlyRemoveAccount.tr(lang),
                            onClick = { onNavigate("delete") },
                            titleColor = AppColors.Red,
                            iconTint = AppColors.Red,
                            colors = colors
                        )
                    }
                }
            }
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
                    title = K.changePassword.tr(lang),
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
                                    text = K.enterCurrentPassword.tr(lang),
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.SemiBold
                                    ),
                                    color = colors.textPrimary
                                )
                                
                                Spacer(modifier = Modifier.height(6.dp))
                                
                                Text(
                                    text = K.confirmIdentityBeforeNewPassword.tr(lang),
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Normal
                                    ),
                                    color = colors.textPrimary.copy(alpha = 0.5f)
                                )
                                
                                Spacer(modifier = Modifier.height(20.dp))
                                
                                ElvanPasswordTextField(
                                    label = K.currentPassword.tr(lang),
                                    value = currentPassword,
                                    onValueChange = { currentPassword = it; errorMessage = null },
                                    placeholder = K.enterCurrentPassword.tr(lang),
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
                                            errorMessage = K.enterCurrentPassword.tr(lang)
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
                                                    errorMessage = K.incorrectPassword.tr(lang)
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
                                            text = K.verifyAndContinue.tr(lang),
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
                                                        K.resetEmailSent.trWithLang(lang, email),
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
                                        text = K.forgotPassword.tr(lang),
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
                                    text = K.createNewPassword.tr(lang),
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 17.sp,
                                        fontWeight = FontWeight.SemiBold
                                    ),
                                    color = colors.textPrimary
                                )
                                
                                Spacer(modifier = Modifier.height(20.dp))
                                
                                ElvanPasswordTextField(
                                    label = K.newPassword.tr(lang),
                                    value = newPassword,
                                    onValueChange = { newPassword = it },
                                    placeholder = K.enterNewPassword.tr(lang),
                                    showPassword = showPassword,
                                    onToggleVisibility = { showPassword = !showPassword },
                                    colors = colors
                                )
                                
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                ElvanPasswordTextField(
                                    label = K.confirmNewPassword.tr(lang),
                                    value = confirmPassword,
                                    onValueChange = { confirmPassword = it },
                                    placeholder = K.confirmPassword.tr(lang),
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
                                            text = K.atLeast6Chars.tr(lang),
                                            isValid = passwordValid,
                                            colors = colors
                                        )
                                        Spacer(modifier = Modifier.height(10.dp))
                                        ValidationRow(
                                            text = K.passwordsMatch.tr(lang),
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
                                            text = K.updatePassword.tr(lang),
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
                                        text = K.passwordUpdated.tr(lang),
                                        style = TextStyle(
                                            fontFamily = ff,
                                            fontSize = 20.sp,
                                            fontWeight = FontWeight.Bold
                                        ),
                                        color = colors.textPrimary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = K.returningToSecuritySettings.tr(lang),
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
    val scope = rememberCoroutineScope()

    if (showReauthDialog) {
        AlertDialog(
            onDismissRequest = { showReauthDialog = false },
            title = { Text(K.verifyCustomIdentity.tr(lang), style = TextStyle(fontFamily = ff, fontSize = 18.sp, fontWeight = FontWeight.Bold), color = colors.textPrimary) },
            text = { Text(K.verifyGoogleForPasswordDesc.tr(lang), style = TextStyle(fontFamily = ff, fontSize = 14.sp), color = colors.textPrimary.copy(alpha = 0.7f)) },
            confirmButton = {
                Button(
                    onClick = {
                        showReauthDialog = false
                        scope.launch {
                            when (val result = GoogleAuthHelper.getGoogleIdToken(context)) {
                                is GoogleAuthHelper.Result.Success -> {
                                    val credential = GoogleAuthProvider.getCredential(result.idToken, null)
                                    user?.reauthenticate(credential)
                                        ?.addOnSuccessListener {
                                            Toast.makeText(context, K.identityVerifiedTryingAgain.tr(lang), Toast.LENGTH_SHORT).show()
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
                                            Toast.makeText(context, "${K.verificationFailed.tr(lang)}: ${e.message}", Toast.LENGTH_SHORT).show()
                                        }
                                }
                                is GoogleAuthHelper.Result.Cancelled -> {}
                                is GoogleAuthHelper.Result.Error -> {
                                    Toast.makeText(context, "${K.verificationFailed.tr(lang)}: ${result.message}", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    },
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.textPrimary, contentColor = if (isDark) Color(0xFF111111) else Color.White)
                ) {
                    Text(K.verify.tr(lang), style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold))
                }
            },
            dismissButton = {
                TextButton(onClick = { showReauthDialog = false }) {
                    Text(K.cancel.tr(lang), style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Medium), color = colors.textPrimary)
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
                    title = K.createPasswordTitle.tr(lang),
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
                                            text = K.signedInWithGoogleCreatePassword.tr(lang),
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
                                    label = K.newPassword.tr(lang),
                                    value = newPassword,
                                    onValueChange = { newPassword = it },
                                    placeholder = K.enterNewPassword.tr(lang),
                                    showPassword = showPassword,
                                    onToggleVisibility = { showPassword = !showPassword },
                                    colors = colors
                                )
                                
                                Spacer(modifier = Modifier.height(12.dp))
                                
                                ElvanPasswordTextField(
                                    label = K.confirmNewPassword.tr(lang),
                                    value = confirmPassword,
                                    onValueChange = { confirmPassword = it },
                                    placeholder = K.confirmPassword.tr(lang),
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
                                            text = K.atLeast6Chars.tr(lang),
                                            isValid = passwordValid,
                                            colors = colors
                                        )
                                        Spacer(modifier = Modifier.height(10.dp))
                                        ValidationRow(
                                            text = K.passwordsMatch.tr(lang),
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
                                            text = K.createPassword.tr(lang),
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
                                        text = K.passwordCreated.tr(lang),
                                        style = TextStyle(
                                            fontFamily = ff,
                                            fontSize = 20.sp,
                                            fontWeight = FontWeight.Bold
                                        ),
                                        color = colors.textPrimary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = K.canNowSignInWithEmail.tr(lang),
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
        title = K.linkedAccounts.tr(lang),
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

    val handleGoogleLink: () -> Unit = {
        isLinking = true
        scope.launch {
            when (val result = GoogleAuthHelper.getGoogleIdToken(context)) {
                is GoogleAuthHelper.Result.Success -> {
                    try {
                        val credential = GoogleAuthProvider.getCredential(result.idToken, null)
                        user?.linkWithCredential(credential)
                            ?.addOnSuccessListener {
                                Toast.makeText(context, K.googleAccountLinked.tr(lang), Toast.LENGTH_SHORT).show()
                                isLinking = false
                                onBack()
                            }
                            ?.addOnFailureListener { e ->
                                Toast.makeText(context, "${K.linkFailed.tr(lang)}: ${e.message ?: ""}", Toast.LENGTH_LONG).show()
                                isLinking = false
                            }
                    } catch (e: Exception) {
                        Toast.makeText(context, "${K.linkFailed.tr(lang)}: ${e.message}", Toast.LENGTH_LONG).show()
                        isLinking = false
                    }
                }
                is GoogleAuthHelper.Result.Cancelled -> {
                    isLinking = false
                }
                is GoogleAuthHelper.Result.Error -> {
                    isLinking = false
                    Toast.makeText(context, "${K.couldNotLaunchGoogleSignIn.tr(lang)}: ${result.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    if (showUnlinkDialog) {
        AlertDialog(
            onDismissRequest = { showUnlinkDialog = false },
            title = {
                Text(
                    text = K.unlinkGoogleAccount.tr(lang),
                    style = TextStyle(fontFamily = ff, fontSize = 18.sp, fontWeight = FontWeight.Bold),
                    color = colors.textPrimary
                )
            },
            text = {
                Text(
                    text = if (hasPassword) {
                        K.unlinkGoogleDescHasPassword.tr(lang)
                    } else {
                        K.unlinkGoogleDescNoPassword.tr(lang)
                    },
                    style = TextStyle(fontFamily = ff, fontSize = 14.sp),
                    color = colors.textPrimary.copy(alpha = 0.7f)
                )
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
                                    onBack()
                                }
                                ?.addOnFailureListener { e ->
                                    Toast.makeText(context, e.message ?: K.failedToUnlink.tr(lang), Toast.LENGTH_SHORT).show()
                                    isUnlinking = false
                                }
                        },
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = AppColors.Red, contentColor = Color.White),
                        enabled = !isUnlinking
                    ) {
                        Text(
                            text = K.unlink.tr(lang),
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
                            text = K.createPasswordTitle.tr(lang),
                            style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                        )
                    }
                }
            },
            dismissButton = {
                TextButton(onClick = { showUnlinkDialog = false }) {
                    Text(
                        text = K.cancel.tr(lang),
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
                    title = K.signInMethods.tr(lang),
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
                                contentDescription = K.googleProfile.tr(lang),
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
                                text = K.google.tr(lang),
                                style = TextStyle(fontFamily = ff, fontSize = 15.sp, fontWeight = FontWeight.SemiBold),
                                color = colors.textPrimary
                            )
                            Text(
                                text = if (isGoogleLinked) googleEmail else K.notConnected.tr(lang),
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
                                    text = K.unlink.tr(lang),
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
                                        text = K.verify.tr(lang),
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
                                text = K.emailAddress.tr(lang),
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
                                text = K.currentPassword.tr(lang),
                                style = TextStyle(fontFamily = ff, fontSize = 15.sp, fontWeight = FontWeight.SemiBold),
                                color = colors.textPrimary
                            )
                            Text(
                                text = if (hasPassword) 
                                    K.passwordSet.tr(lang)
                                else 
                                    K.noPasswordSet.tr(lang),
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
                                    text = K.createPasswordTitle.tr(lang),
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
    val scope = rememberCoroutineScope()

    if (showReauthDialog) {
        AlertDialog(
            onDismissRequest = { showReauthDialog = false },
            title = { Text(K.verifyIdentityForDeletion.tr(lang), style = TextStyle(fontFamily = ff, fontSize = 18.sp, fontWeight = FontWeight.Bold), color = colors.textPrimary) },
            text = { Text(K.verifyGoogleForDeletionDesc.tr(lang), style = TextStyle(fontFamily = ff, fontSize = 14.sp), color = colors.textPrimary.copy(alpha = 0.7f)) },
            confirmButton = {
                Button(
                    onClick = {
                        showReauthDialog = false
                        scope.launch {
                            when (val result = GoogleAuthHelper.getGoogleIdToken(context)) {
                                is GoogleAuthHelper.Result.Success -> {
                                    val credential = GoogleAuthProvider.getCredential(result.idToken, null)
                                    user?.reauthenticate(credential)
                                        ?.addOnSuccessListener {
                                            Toast.makeText(context, K.identityVerifiedDeletingAccount.tr(lang), Toast.LENGTH_SHORT).show()
                                            user.let { u ->
                                                Firebase.database.getReference("users/${u.uid}").removeValue()
                                                u.delete()
                                                    .addOnSuccessListener {
                                                        Toast.makeText(context, K.accountDeleted.tr(lang), Toast.LENGTH_SHORT).show()
                                                    }
                                                    .addOnFailureListener { e ->
                                                        isProcessing = false
                                                        errorMessage = e.message ?: "Failed to delete account"
                                                    }
                                            }
                                        }
                                        ?.addOnFailureListener { e ->
                                            Toast.makeText(context, "${K.verificationFailed.tr(lang)}: ${e.message}", Toast.LENGTH_SHORT).show()
                                        }
                                }
                                is GoogleAuthHelper.Result.Cancelled -> {}
                                is GoogleAuthHelper.Result.Error -> {
                                    Toast.makeText(context, "${K.verificationFailed.tr(lang)}: ${result.message}", Toast.LENGTH_SHORT).show()
                                }
                            }
                        }
                    },
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = AppColors.Red, contentColor = Color.White)
                ) {
                    Text(K.verify.tr(lang), style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold))
                }
            },
            dismissButton = {
                TextButton(onClick = { showReauthDialog = false }) {
                    Text(K.cancel.tr(lang), style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Medium), color = colors.textPrimary)
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
                    title = K.deleteAccount.tr(lang),
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
                                                text = K.thisActionIsPermanent.tr(lang),
                                                style = TextStyle(fontFamily = ff, fontSize = 15.sp, fontWeight = FontWeight.Bold),
                                                color = AppColors.Red
                                            )
                                        }
                                        Spacer(modifier = Modifier.height(12.dp))
                                        Text(
                                            text = K.deleteAccountWarning.tr(lang),
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
                                        text = K.iUnderstandContinue.tr(lang),
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
                                        text = K.cancel.tr(lang),
                                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                    )
                                }
                            }
                            
                            2 -> {
                                Text(
                                    text = K.confirmDeletion.tr(lang),
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
                                            text = K.confirmDeletionDesc.tr(lang),
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
                                        text = K.iUnderstandContinue.tr(lang),
                                        style = TextStyle(fontFamily = ff, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                    )
                                }
                            }
                            
                            3 -> {
                                Text(
                                    text = K.verifyIdentity.tr(lang),
                                    style = TextStyle(fontFamily = ff, fontSize = 17.sp, fontWeight = FontWeight.SemiBold),
                                    color = colors.textPrimary
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = K.confirmDeletionDesc.tr(lang),
                                    style = TextStyle(fontFamily = ff, fontSize = 13.sp),
                                    color = colors.textPrimary.copy(alpha = 0.5f)
                                )
                                
                                Spacer(modifier = Modifier.height(20.dp))
                                
                                ElvanPasswordTextField(
                                    label = K.password.tr(lang),
                                    value = password,
                                    onValueChange = { password = it; errorMessage = null },
                                    placeholder = K.enterCurrentPassword.tr(lang),
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
                                            errorMessage = K.enterCurrentPassword.tr(lang)
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
                                                                Toast.makeText(context, K.accountDeleted.tr(lang), Toast.LENGTH_SHORT).show()
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
                                                        errorMessage = K.incorrectPassword.tr(lang)
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
                                            text = K.deleteAccountPermanently.tr(lang),
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

package com.elvan.rmdneram.ui.screens

import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.theme.AppColors
import coil.compose.AsyncImage
import coil.request.ImageRequest
import android.app.Activity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.EmailAuthProvider
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"

@Composable
fun SecuritySettingsScreen(
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    var currentView by remember { mutableStateOf("hub") } // hub, password, linked, delete
    
    BackHandler {
        if (currentView != "hub") {
            currentView = "hub"
        } else {
            onBack()
        }
    }

    AnimatedContent(
        targetState = currentView,
        transitionSpec = {
            if (targetState == "hub") {
                slideInHorizontally { -it } togetherWith slideOutHorizontally { it }
            } else {
                slideInHorizontally { it } togetherWith slideOutHorizontally { -it }
            }
        }
    ) { view ->
        when (view) {
            "hub" -> SecurityHub(
                colors = colors,
                onBack = onBack,
                onNavigate = { currentView = it }
            )
            "password" -> ChangePasswordFlow(
                colors = colors,
                onBack = { currentView = "hub" }
            )
            "create_password" -> CreatePasswordFlow(
                colors = colors,
                onBack = { currentView = "hub" }
            )
            "linked" -> LinkedAccountsView(
                colors = colors,
                onBack = { currentView = "hub" }
            )
            "delete" -> DeleteAccountFlow(
                colors = colors,
                onBack = { currentView = "hub" }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun StandardSettingsHeader(
    title: String,
    subtitle: String? = null,
    onBack: () -> Unit,
    colors: HomeColors
) {
    TopAppBar(
        title = {
            Column(modifier = Modifier.padding(top = 8.dp)) {
                Text(
                    text = title,
                    style = HomeTypography.PageTitle.copy(fontSize = 28.sp),
                    color = MaterialTheme.colorScheme.onSurface
                )
                if (subtitle != null) {
                    Text(
                        text = subtitle,
                        style = HomeTypography.FacultyName.copy(fontSize = 14.sp),
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }
            }
        },
        navigationIcon = {
            IconButton(
                onClick = onBack,
                modifier = Modifier.padding(top = 8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.ChevronLeft, 
                    contentDescription = "Back",
                    tint = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.size(32.dp)
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = colors.background,
            scrolledContainerColor = colors.background,
            titleContentColor = MaterialTheme.colorScheme.onSurface,
            navigationIconContentColor = MaterialTheme.colorScheme.onSurface
        )
    )
}

@Composable
private fun SecurityHub(
    colors: HomeColors,
    onBack: () -> Unit,
    onNavigate: (String) -> Unit
) {
    val user = Firebase.auth.currentUser
    val hasPasswordProvider = user?.providerData?.any { it.providerId == "password" } ?: false
    
    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            StandardSettingsHeader(
                title = "Security",
                subtitle = "Manage password & account",
                colors = colors,
                onBack = onBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = HomeDimens.ContentPadding)
                .padding(top = 16.dp, bottom = 100.dp)
        ) {
            Spacer(modifier = Modifier.height(8.dp))

        // Settings List
        // Settings List
        Text(
            text = "ACCOUNT",
            style = HomeTypography.ExamTag,
            color = colors.textSecondary,
            modifier = Modifier.padding(bottom = 8.dp, start = 24.dp)
        )
        SettingsListGroup(cardColor = colors.surface, borderColor = colors.glassBorder) {
            if (hasPasswordProvider) {
                SettingsListItem(
                    icon = Icons.Outlined.Key,
                    iconBgColor = AppColors.Purple,
                    title = "Change Password",
                    description = "Update your login password",
                    onClick = { onNavigate("password") },
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
            } else {
                SettingsListItem(
                    icon = Icons.Outlined.Key,
                    iconBgColor = AppColors.Purple,
                    title = "Create Password",
                    description = "Set a password for email login",
                    onClick = { onNavigate("create_password") },
                    textColor = colors.textPrimary,
                    subTextColor = colors.textSecondary
                )
            }
            SettingsListItem(
                icon = Icons.Outlined.Link,
                iconBgColor = AppColors.Blue,
                title = "Linked Accounts",
                description = "Manage Google sign-in",
                onClick = { onNavigate("linked") },
                textColor = colors.textPrimary,
                subTextColor = colors.textSecondary
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "DANGER ZONE",
            style = HomeTypography.ExamTag,
            color = colors.textSecondary,
            modifier = Modifier.padding(bottom = 8.dp, start = 24.dp)
        )
        SettingsListGroup(cardColor = colors.surface, borderColor = colors.glassBorder) {
            SettingsListItem(
                icon = Icons.Outlined.Warning,
                iconBgColor = AppColors.Red,
                title = "Delete Account",
                description = "Permanently remove your account",
                onClick = { onNavigate("delete") },
                textColor = colors.danger,
                subTextColor = colors.textSecondary
            )
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
            delay(2000)
            onBack()
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            StandardSettingsHeader(
                title = "Change Password",
                subtitle = when (step) {
                    1 -> "Step 1: Verify your identity"
                    2 -> "Step 2: Set new password"
                    else -> "Password updated!"
                },
                colors = colors,
                onBack = if (step == 1) onBack else {{ step = 1 }}
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
        ) {

        Column(modifier = Modifier.padding(24.dp)) {
            
            // Progress Indicator
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center
            ) {
                repeat(3) { index ->
                    Box(
                        modifier = Modifier
                            .size(if (step == index + 1) 12.dp else 8.dp)
                            .clip(CircleShape)
                            .background(
                                if (step >= index + 1) colors.accent 
                                else colors.glassBorder
                            )
                    )
                    if (index < 2) Spacer(modifier = Modifier.width(8.dp))
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))

            when (step) {
                1 -> {
                    // Step 1: Verify Current Password
                    Text("Enter your current password", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    PasswordInputField(
                        value = currentPassword,
                        onValueChange = { currentPassword = it; errorMessage = null },
                        placeholder = "Current Password",
                        showPassword = showPassword,
                        onToggleVisibility = { showPassword = !showPassword },
                        colors = colors,
                        isError = errorMessage != null
                    )
                    
                    errorMessage?.let {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(it, color = colors.danger, style = HomeTypography.FacultyName)
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Next Button
                    Button(
                        onClick = {
                            if (currentPassword.isEmpty()) {
                                errorMessage = "Please enter your password"
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
                                    .addOnFailureListener { e ->
                                        isProcessing = false
                                        errorMessage = "Incorrect password"
                                    }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.accent),
                        enabled = !isProcessing
                    ) {
                        if (isProcessing) {
                            com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Verify & Continue", fontWeight = FontWeight.SemiBold)
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Forgot Password Link
                    TextButton(
                        onClick = {
                            user?.email?.let { email ->
                                Firebase.auth.sendPasswordResetEmail(email)
                                    .addOnSuccessListener {
                                        Toast.makeText(context, "Reset email sent to $email", Toast.LENGTH_LONG).show()
                                    }
                                    .addOnFailureListener { e ->
                                        Toast.makeText(context, e.message, Toast.LENGTH_SHORT).show()
                                    }
                            }
                        },
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    ) {
                        Text("Forgot Password?", color = colors.accent)
                    }
                }
                
                2 -> {
                    // Step 2: Set New Password
                    Text("Create your new password", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    PasswordInputField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        placeholder = "New Password",
                        showPassword = showPassword,
                        onToggleVisibility = { showPassword = !showPassword },
                        colors = colors
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    PasswordInputField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        placeholder = "Confirm New Password",
                        showPassword = showPassword,
                        onToggleVisibility = { showPassword = !showPassword },
                        colors = colors,
                        isError = confirmPassword.isNotEmpty() && !passwordsMatch
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Validation Info
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Item)
                            .background(colors.subtleBackground)
                            .padding(16.dp)
                    ) {
                        ValidationRow("At least 6 characters", passwordValid, colors)
                        Spacer(modifier = Modifier.height(8.dp))
                        ValidationRow("Passwords match", passwordsMatch, colors)
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
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.accent),
                        enabled = passwordsMatch && passwordValid && !isProcessing
                    ) {
                        if (isProcessing) {
                            com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Update Password", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                
                3 -> {
                    // Step 3: Success
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.CheckCircle,
                            null,
                            tint = colors.success,
                            modifier = Modifier.size(72.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Text("Password Updated!", style = HomeTypography.PageTitle, color = colors.textPrimary)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Returning to security settings...", style = HomeTypography.FacultyName, color = colors.textSecondary)
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
    
    var step by remember { mutableIntStateOf(1) } // 1: Set Password, 2: Success
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var isProcessing by remember { mutableStateOf(false) }
    
    val passwordsMatch = newPassword == confirmPassword && newPassword.isNotEmpty()
    val passwordValid = newPassword.length >= 6

    LaunchedEffect(step) {
        if (step == 2) {
            delay(2000)
            onBack()
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            StandardSettingsHeader(
                title = "Create Password",
                subtitle = if (step == 1) "Set a password for your account" else "Password created!",
                colors = colors,
                onBack = onBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
            when (step) {
                1 -> {
                    // Info Box
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Item)
                            .background(colors.accent.copy(alpha = 0.1f))
                            .padding(16.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(Icons.Outlined.Info, null, tint = colors.accent, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            "You signed in with Google. Create a password to also sign in with email.",
                            style = HomeTypography.FacultyName,
                            color = colors.textPrimary
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Text("Create your password", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    PasswordInputField(
                        value = newPassword,
                        onValueChange = { newPassword = it },
                        placeholder = "New Password",
                        showPassword = showPassword,
                        onToggleVisibility = { showPassword = !showPassword },
                        colors = colors
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    PasswordInputField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        placeholder = "Confirm Password",
                        showPassword = showPassword,
                        onToggleVisibility = { showPassword = !showPassword },
                        colors = colors,
                        isError = confirmPassword.isNotEmpty() && !passwordsMatch
                    )
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Validation Info
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Item)
                            .background(colors.subtleBackground)
                            .padding(16.dp)
                    ) {
                        ValidationRow("At least 6 characters", passwordValid, colors)
                        Spacer(modifier = Modifier.height(8.dp))
                        ValidationRow("Passwords match", passwordsMatch, colors)
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
                                    Toast.makeText(context, e.message, Toast.LENGTH_SHORT).show()
                                }
                        },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.accent),
                        enabled = passwordsMatch && passwordValid && !isProcessing
                    ) {
                        if (isProcessing) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Create Password", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                
                2 -> {
                    // Success
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 48.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.CheckCircle,
                            null,
                            tint = colors.success,
                            modifier = Modifier.size(72.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Text("Password Created!", style = HomeTypography.PageTitle, color = colors.textPrimary)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("You can now sign in with email too.", style = HomeTypography.FacultyName, color = colors.textSecondary)
                    }
                }
            }
        }
    }
}
}

@Composable
private fun LinkedAccountsView(
    colors: HomeColors,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val user = Firebase.auth.currentUser
    val scope = rememberCoroutineScope()
    
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
    var isLinking by remember { mutableStateOf(false) }

    // Google Sign-In launcher for linking
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
                                    onBack() // Go back to refresh
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
            googleSignInClient.signOut() // Force account picker
            googleLinkLauncher.launch(googleSignInClient.signInIntent)
        } catch (e: Exception) {
            isLinking = false
            e.printStackTrace()
            Toast.makeText(context, "Could not launch Google Sign-In: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

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
                                    onBack() // Go back to refresh the view
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
                            com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
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

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            StandardSettingsHeader(
                title = "Linked Accounts",
                subtitle = "Manage sign-in methods",
                colors = colors,
                onBack = onBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
            // Section: Sign-in Methods
            Text("SIGN-IN METHODS", style = HomeTypography.ExamTag, color = colors.textSecondary)
            Spacer(modifier = Modifier.height(12.dp))
            
            // Google Account Card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(HomeShapes.Item)
                    .background(colors.surface)
                    // .border(1.dp, colors.glassBorder, RoundedCornerShape(16.dp)) // Flat Design
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
                            .clickable { handleGoogleLink() }
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
                    // .border(1.dp, colors.glassBorder, RoundedCornerShape(16.dp)) // Flat Design
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
}
}

@Composable
private fun DeleteAccountFlow(
    colors: HomeColors,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val user = Firebase.auth.currentUser
    
    var step by remember { mutableIntStateOf(1) } // 1: Warning, 2: Confirm, 3: Password
    var understood by remember { mutableStateOf(false) }
    var password by remember { mutableStateOf("") }
    var isProcessing by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            StandardSettingsHeader(
                title = "Delete Account",
                subtitle = when (step) {
                    1 -> "Step 1: Understand the consequences"
                    2 -> "Step 2: Confirm your decision"
                    else -> "Step 3: Verify your identity"
                },
                colors = colors,
                onBack = when (step) {
                    1 -> onBack
                    else -> {{ step = step - 1 }}
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
            when (step) {
                1 -> {
                    // Warning Box
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Item)
                            .background(colors.danger.copy(alpha = 0.1f))
                            // .border(1.dp, colors.danger.copy(alpha = 0.3f), RoundedCornerShape(16.dp)) // Flat Design
                            .padding(24.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Warning, null, tint = colors.danger, modifier = Modifier.size(24.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("This action is permanent", style = HomeTypography.SectionTitle, color = colors.danger)
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            "• All your data will be permanently deleted\n• Your schedule and preferences will be lost\n• You will not be able to recover your account\n• You can create a new account anytime",
                            style = HomeTypography.MessageBody,
                            color = colors.textPrimary,
                            lineHeight = HomeTypography.MessageBody.lineHeight
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Button(
                        onClick = { step = 2 },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.danger)
                    ) {
                        Text("I understand, continue", fontWeight = FontWeight.SemiBold)
                    }
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Button(
                        onClick = onBack,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.subtleBackground,
                            contentColor = colors.textPrimary
                        )
                    ) {
                        Text("Cancel", color = colors.textPrimary)
                    }
                }
                
                2 -> {
                    Text("Are you absolutely sure?", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Item)
                            .background(colors.surface)
                            .clickable { understood = !understood }
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = understood,
                            onCheckedChange = { understood = it },
                            colors = CheckboxDefaults.colors(checkedColor = colors.danger)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            "I understand that this action cannot be undone and all my data will be permanently deleted.",
                            style = HomeTypography.PillTime,
                            color = colors.textPrimary
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Button(
                        onClick = { step = 3 },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.danger),
                        enabled = understood
                    ) {
                        Text("Continue to verification", fontWeight = FontWeight.SemiBold)
                    }
                }
                
                3 -> {
                    Text("Enter your password to confirm", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    PasswordInputField(
                        value = password,
                        onValueChange = { password = it; errorMessage = null },
                        placeholder = "Current Password",
                        showPassword = false,
                        onToggleVisibility = {},
                        colors = colors,
                        isError = errorMessage != null
                    )
                    
                    errorMessage?.let {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(it, color = colors.danger, style = HomeTypography.FacultyName)
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Button(
                        onClick = {
                            if (password.isEmpty()) {
                                errorMessage = "Please enter your password"
                                return@Button
                            }
                            isProcessing = true
                            user?.email?.let { email ->
                                val credential = EmailAuthProvider.getCredential(email, password)
                                user.reauthenticate(credential)
                                    .addOnSuccessListener {
                                        Firebase.database.getReference("users/${user.uid}").removeValue()
                                        user.delete()
                                            .addOnSuccessListener {
                                                Toast.makeText(context, "Account deleted", Toast.LENGTH_SHORT).show()
                                            }
                                            .addOnFailureListener { e ->
                                                isProcessing = false
                                                errorMessage = e.message ?: "Failed to delete account"
                                            }
                                    }
                                    .addOnFailureListener { e ->
                                        isProcessing = false
                                        errorMessage = "Incorrect password"
                                    }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = HomeShapes.Pill,
                        colors = ButtonDefaults.buttonColors(containerColor = colors.danger),
                        enabled = !isProcessing
                    ) {
                        if (isProcessing) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        } else {
                            Text("Delete My Account Forever", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }
}

}

@Composable
private fun SecurityListItem(
    icon: ImageVector,
    title: String,
    description: String,
    colors: HomeColors,
    isDanger: Boolean = false,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(HomeShapes.Item)
                .background(if (isDanger) colors.danger.copy(alpha = 0.1f) else colors.accent.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = if (isDanger) colors.danger else colors.accent, modifier = Modifier.size(22.dp))
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = HomeTypography.PillTitle, color = if (isDanger) colors.danger else colors.textPrimary)
            Text(description, style = HomeTypography.FacultyName, color = colors.textSecondary)
        }
        Icon(Icons.Default.ChevronRight, null, tint = colors.textSecondary, modifier = Modifier.size(20.dp))
    }
}

@Composable
private fun PasswordInputField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    showPassword: Boolean,
    onToggleVisibility: () -> Unit,
    colors: HomeColors,
    isError: Boolean = false
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        placeholder = { Text(placeholder, color = colors.placeholder) },
        modifier = Modifier.fillMaxWidth(),
        shape = HomeShapes.Item,
        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
        trailingIcon = {
            IconButton(onClick = onToggleVisibility) {
                Icon(
                    if (showPassword) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                    null,
                    tint = colors.textSecondary
                )
            }
        },
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = if (isError) colors.danger else colors.accent,
            unfocusedBorderColor = if (isError) colors.danger.copy(alpha = 0.5f) else colors.glassBorder,
            focusedContainerColor = colors.inputBackground,
            unfocusedContainerColor = colors.inputBackground
        ),
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        textStyle = HomeTypography.PillTime.copy(color = colors.textPrimary),
        isError = isError
    )
}

@Composable
private fun ValidationRow(text: String, isValid: Boolean, colors: HomeColors) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Icon(
            if (isValid) Icons.Outlined.CheckCircle else Icons.Outlined.Circle,
            null,
            tint = if (isValid) colors.success else colors.textSecondary,
            modifier = Modifier.size(16.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(text, style = HomeTypography.FacultyName, color = if (isValid) colors.success else colors.textSecondary)
    }
}

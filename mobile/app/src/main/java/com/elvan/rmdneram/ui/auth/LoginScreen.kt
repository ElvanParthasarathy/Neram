package com.elvan.rmdneram.ui.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.delay

// Web Client ID from google-services.json (client_type: 3)
private const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToSignup: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    // Staggered reveal states
    var showHeader by remember { mutableStateOf(false) }
    var showForm by remember { mutableStateOf(false) }
    var showButtons by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        delay(200)
        showHeader = true
        delay(300)
        showForm = true
        delay(300)
        showButtons = true
    }

    val auth = FirebaseAuth.getInstance()
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    val handleLogin = {
        isLoading = true
        error = null
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            isLoading = false
            error = "Invalid email address"
        } else if (password.isEmpty()) {
            isLoading = false
            error = "Please enter your password"
        } else {
            auth.signInWithEmailAndPassword(email, password)
                .addOnCompleteListener { task ->
                    isLoading = false
                    if (task.isSuccessful) {
                        onLoginSuccess()
                    } else {
                        error = task.exception?.message ?: "Login Failed"
                    }
                }
        }
    }

    // Google Sign In Launcher
    val launcher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            if (account?.idToken != null) {
                val credential = GoogleAuthProvider.getCredential(account.idToken, null)
                auth.signInWithCredential(credential)
                    .addOnCompleteListener { authTask ->
                        isLoading = false
                        if (authTask.isSuccessful) {
                            onLoginSuccess()
                        } else {
                            error = authTask.exception?.message ?: "Google Sign-In Failed"
                        }
                    }
            } else {
                isLoading = false
                error = "Google Sign-In Failed: No ID Token"
            }
        } catch (e: ApiException) {
            error = "Google Sign-In Failed: ${e.statusCode}"
            isLoading = false
        }
    }

    val handleGoogleLogin = {
        isLoading = true
        error = null
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(WEB_CLIENT_ID)
            .requestEmail()
            .build()
        val googleSignInClient = GoogleSignIn.getClient(context, gso)
        googleSignInClient.signOut().addOnCompleteListener {
            launcher.launch(googleSignInClient.signInIntent)
        }
    }

    AuthGradientBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .statusBarsPadding()
                .navigationBarsPadding()
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(60.dp))

            // ===== HEADER =====
            AnimatedVisibility(
                visible = showHeader,
                enter = fadeIn(tween(500)) + slideInVertically(initialOffsetY = { -30 })
            ) {
                StepHeader(
                    title = "Welcome Back",
                    subtitle = "Sign in to continue"
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // ===== FORM FIELDS =====
            AnimatedVisibility(
                visible = showForm,
                enter = fadeIn(tween(500)) + slideInVertically(initialOffsetY = { 30 })
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    // Email field
                    AuthTextField(
                        value = email,
                        onValueChange = { email = it; error = null },
                        label = "Email Address",
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Email,
                            imeAction = ImeAction.Next
                        ),
                        isError = error?.contains("email") == true,
                        errorMessage = if (error?.contains("email") == true) error else null
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Password field
                    AuthTextField(
                        value = password,
                        onValueChange = { password = it; error = null },
                        label = "Password",
                        isPassword = true,
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(onDone = { handleLogin() }),
                        isError = error?.contains("password") == true || error?.contains("Password") == true,
                        errorMessage = if (error?.contains("password") == true || error?.contains("Password") == true) error else null
                    )

                    // General error
                    if (error != null && !error!!.contains("email") && !error!!.contains("password") && !error!!.contains("Password")) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            error!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ===== BUTTONS SECTION =====
            AnimatedVisibility(
                visible = showButtons,
                enter = fadeIn(tween(500)) + slideInVertically(initialOffsetY = { 30 })
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    AnimatedAuthButton(
                        text = "Sign In",
                        onClick = { handleLogin() },
                        isLoading = isLoading
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    OrDivider()

                    Spacer(modifier = Modifier.height(20.dp))

                    GoogleAuthButton(
                        onClick = { handleGoogleLogin() },
                        isLoading = isLoading
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    AuthLinkText(
                        prefix = "Don't have an account? ",
                        linkText = "Sign Up",
                        onClick = onNavigateToSignup
                    )

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}


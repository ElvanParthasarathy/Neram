package com.elvan.neram.ui.auth

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
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppLanguage
import kotlinx.coroutines.delay

// Web Client ID from google-services.json (client_type: 3)
private const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToSignup: () -> Unit
) {
    val lang = LocalAppLanguage.current
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val context = LocalContext.current
    val auth = FirebaseAuth.getInstance()

    // Animations for staggered entrance
    var showHeader by remember { mutableStateOf(false) }
    var showForm by remember { mutableStateOf(false) }
    var showButtons by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        showHeader = true
        delay(100)
        showForm = true
        delay(100)
        showButtons = true
    }

    fun handleLogin() {
        if (email.isBlank()) {
            error = "${K.emailAddress.tr(lang)} ${K.isRequired.tr(lang)}"
            return
        }
        if (password.isBlank()) {
            error = "${K.password.tr(lang)} ${K.isRequired.tr(lang)}"
            return
        }

        isLoading = true
        error = null

        auth.signInWithEmailAndPassword(email.trim(), password)
            .addOnSuccessListener {
                isLoading = false
                onLoginSuccess()
            }
            .addOnFailureListener { e ->
                isLoading = false
                error = when {
                    e.message?.contains("user-not-found") == true -> K.noAccountFound.tr(lang)
                    e.message?.contains("wrong-password") == true -> K.incorrectPassword.tr(lang)
                    e.message?.contains("invalid-email") == true -> K.invalidEmailFormat.tr(lang)
                    else -> e.message ?: K.authFailed.tr(lang)
                }
            }
    }

    // Google Sign-In setup
    val googleSignInLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            account?.idToken?.let { idToken ->
                val credential = GoogleAuthProvider.getCredential(idToken, null)
                auth.signInWithCredential(credential)
                    .addOnSuccessListener {
                        isLoading = false
                        onLoginSuccess()
                    }
                    .addOnFailureListener { e ->
                        isLoading = false
                        android.util.Log.e("GoogleSignIn", "Firebase auth failed", e)
                        error = e.message ?: K.googleSignInFailed.tr(lang)
                    }
            } ?: run {
                isLoading = false
                android.util.Log.e("GoogleSignIn", "No idToken in account")
                error = "${K.googleSignInFailed.tr(lang)}: ${K.noIdTokenReceived.tr(lang)}"
            }
        } catch (e: ApiException) {
            isLoading = false
            android.util.Log.e("GoogleSignIn", "ApiException status: ${e.statusCode}", e)
            if (e.statusCode != 12501) {
                error = "${K.googleSignInFailed.tr(lang)} (${e.statusCode})"
            }
        } catch (e: Exception) {
            isLoading = false
            android.util.Log.e("GoogleSignIn", "General exception", e)
            error = "${K.googleSignInFailed.tr(lang)}: ${e.message}"
        }
    }

    fun handleGoogleLogin() {
        isLoading = true
        error = null
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(WEB_CLIENT_ID)
            .requestEmail()
            .build()
        val googleSignInClient = GoogleSignIn.getClient(context, gso)
        googleSignInClient.signOut().addOnCompleteListener {
            googleSignInLauncher.launch(googleSignInClient.signInIntent)
        }
    }

    AuthBackground {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .imePadding()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(48.dp))

                // ===== HEADER =====
                AnimatedVisibility(
                    visible = showHeader,
                    enter = fadeIn(tween(500)) + slideInVertically(initialOffsetY = { -30 })
                ) {
                    StepHeader(
                        title = K.welcomeBack.tr(lang),
                        subtitle = K.signInToContinue.tr(lang)
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
                            label = K.emailAddress.tr(lang),
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
                            label = K.password.tr(lang),
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
                            text = K.logIn.tr(lang),
                            onClick = { handleLogin() },
                            isLoading = isLoading
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        OrDivider()

                        Spacer(modifier = Modifier.height(20.dp))

                        GoogleAuthButton(
                            text = K.continueWithGoogle.tr(lang),
                            onClick = { handleGoogleLogin() },
                            isLoading = isLoading
                        )

                        Spacer(modifier = Modifier.height(32.dp))

                        AuthLinkText(
                            prefix = K.dontHaveAccount.tr(lang),
                            linkText = K.signUp.tr(lang),
                            onClick = onNavigateToSignup
                        )

                        Spacer(modifier = Modifier.height(24.dp))
                    }
                }
            }
        }
    }
}

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
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppLanguage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch


@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    onNavigateToSignup: () -> Unit,
    showBackground: Boolean = true
) {
    val lang = LocalAppLanguage.current
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var errorField by remember { mutableStateOf<AuthField?>(null) }

    val context = LocalContext.current
    val auth = FirebaseAuth.getInstance()

    fun handleLogin() {
        if (email.isBlank()) {
            errorField = AuthField.EMAIL
            error = "${K.emailAddress.tr(lang)} ${K.isRequired.tr(lang)}"
            return
        }
        if (password.isBlank()) {
            errorField = AuthField.PASSWORD
            error = "${K.password.tr(lang)} ${K.isRequired.tr(lang)}"
            return
        }

        isLoading = true
        error = null
        errorField = null

        auth.signInWithEmailAndPassword(email.trim(), password)
            .addOnSuccessListener {
                isLoading = false
                onLoginSuccess()
            }
            .addOnFailureListener { e ->
                isLoading = false
                val msg = e.message.orEmpty()
                when {
                    msg.contains("user-not-found") -> {
                        errorField = AuthField.EMAIL
                        error = K.noAccountFound.tr(lang)
                    }
                    msg.contains("wrong-password") -> {
                        errorField = AuthField.PASSWORD
                        error = K.incorrectPassword.tr(lang)
                    }
                    msg.contains("invalid-email") -> {
                        errorField = AuthField.EMAIL
                        error = K.invalidEmailFormat.tr(lang)
                    }
                    else -> {
                        errorField = AuthField.GENERAL
                        error = if (msg.isNotEmpty()) msg else K.authFailed.tr(lang)
                    }
                }
            }
    }

    val scope = rememberCoroutineScope()

    fun handleGoogleLogin() {
        isLoading = true
        error = null
        scope.launch {
            when (val result = GoogleAuthHelper.getGoogleIdToken(context)) {
                is GoogleAuthHelper.Result.Success -> {
                    val credential = GoogleAuthProvider.getCredential(result.idToken, null)
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
                }
                is GoogleAuthHelper.Result.Cancelled -> {
                    isLoading = false
                }
                is GoogleAuthHelper.Result.Error -> {
                    isLoading = false
                    android.util.Log.e("GoogleSignIn", "Credential Manager error: ${result.message}", result.cause)
                    error = "${K.googleSignInFailed.tr(lang)}: ${result.message}"
                }
            }
        }
    }

    val content = @Composable {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .imePadding()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = maxHeight)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 24.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // ===== HEADER =====
                AuthAnimatedElement(delayIndex = 0) {
                    StepHeader(
                        title = K.welcomeBack.tr(lang),
                        subtitle = K.signInToContinue.tr(lang)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ===== FORM FIELDS =====
                AuthAnimatedElement(delayIndex = 1, modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        // Email field
                        AuthTextField(
                            value = email,
                            onValueChange = { email = it; error = null; errorField = null },
                            label = K.emailAddress.tr(lang),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Email,
                                imeAction = ImeAction.Next
                            ),
                            isError = errorField == AuthField.EMAIL,
                            errorMessage = if (errorField == AuthField.EMAIL) error else null
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        // Password field
                        AuthTextField(
                            value = password,
                            onValueChange = { password = it; error = null; errorField = null },
                            label = K.password.tr(lang),
                            isPassword = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(onDone = { handleLogin() }),
                            isError = errorField == AuthField.PASSWORD,
                            errorMessage = if (errorField == AuthField.PASSWORD) error else null
                        )

                        // General error
                        if (error != null && errorField == AuthField.GENERAL) {
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                error!!,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ===== BUTTONS SECTION =====
                AuthAnimatedElement(delayIndex = 2, modifier = Modifier.fillMaxWidth()) {
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        AnimatedAuthButton(
                            text = K.logIn.tr(lang),
                            onClick = { handleLogin() },
                            isLoading = isLoading
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OrDivider()

                        Spacer(modifier = Modifier.height(16.dp))

                        GoogleAuthButton(
                            text = K.continueWithGoogle.tr(lang),
                            onClick = { handleGoogleLogin() },
                            isLoading = isLoading
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        AuthLinkText(
                            prefix = K.dontHaveAccount.tr(lang),
                            linkText = K.signUp.tr(lang),
                            onClick = onNavigateToSignup
                        )
                    }
                }
            }
        }
    }

    if (showBackground) {
        AuthBackground {
            content()
        }
    } else {
        Box(modifier = Modifier.fillMaxSize()) {
            content()
        }
    }
}

package com.elvan.neram.ui.auth

import android.util.Log
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
import com.google.firebase.auth.UserProfileChangeRequest
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ServerValue
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppLanguage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Web Client ID from google-services.json (client_type: 3)
private const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"
private const val TAG = "SignupScreen"

@Composable
fun SignupScreen(
    onSignupSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit,
    showBackground: Boolean = true
) {
    val lang = LocalAppLanguage.current
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var regNo by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var errorField by remember { mutableStateOf<AuthField?>(null) }

    val scope = rememberCoroutineScope()

    val auth = FirebaseAuth.getInstance()
    val database = FirebaseDatabase.getInstance()
    val context = LocalContext.current

    // Helper to split name into first/last (matching web)
    // Helper to write user profile to database (MATCHING WEB IMPLEMENTATION)
    fun writeUserToDatabase(
        uid: String,
        email: String,
        firstName: String,
        lastName: String,
        regNo: String,
        photoURL: String = "",
        onComplete: () -> Unit
    ) {
        val userRef = database.getReference("users/$uid")
        val displayName = "$firstName $lastName".trim()
        
        val userData = mapOf(
            "uid" to uid,
            "displayName" to displayName,
            "firstName" to firstName,
            "lastName" to lastName,
            "email" to email,
            "regNo" to regNo,
            "photoURL" to photoURL,
            "role" to "student",
            "joinedAt" to ServerValue.TIMESTAMP,
            "lastLogin" to java.time.Instant.now().toString(),
            "batch" to "",
            "department" to "",
            "section" to ""
        )
        
        userRef.setValue(userData)
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    Log.d(TAG, "User profile written to database")
                    onComplete()
                } else {
                    Log.e(TAG, "Failed to write user: ${task.exception?.message}")
                    onComplete()
                }
            }
    }

    fun handleGoogleSignup() {
        isLoading = true
        error = null
        scope.launch {
            when (val result = GoogleAuthHelper.getGoogleIdToken(context)) {
                is GoogleAuthHelper.Result.Success -> {
                    val credential = GoogleAuthProvider.getCredential(result.idToken, null)
                    auth.signInWithCredential(credential)
                        .addOnCompleteListener { authTask ->
                            if (authTask.isSuccessful) {
                                val user = auth.currentUser
                                if (user != null) {
                                    val displayName = user.displayName ?: ""
                                    val lastSpaceIndex = displayName.lastIndexOf(" ")
                                    val fName = if (lastSpaceIndex == -1) displayName else displayName.substring(0, lastSpaceIndex)
                                    val lName = if (lastSpaceIndex == -1) "" else displayName.substring(lastSpaceIndex + 1)
                                    
                                    writeUserToDatabase(
                                        uid = user.uid,
                                        email = user.email ?: "",
                                        firstName = fName,
                                        lastName = lName,
                                        regNo = "",
                                        photoURL = user.photoUrl?.toString() ?: "",
                                        onComplete = {
                                            isLoading = false
                                            onSignupSuccess()
                                        }
                                    )
                                } else {
                                    isLoading = false
                                    onSignupSuccess()
                                }
                            } else {
                                isLoading = false
                                android.util.Log.e("GoogleSignIn", "Firebase auth error in signup", authTask.exception)
                                error = authTask.exception?.message ?: K.googleSignInFailed.tr(lang)
                            }
                        }
                }
                is GoogleAuthHelper.Result.Cancelled -> {
                    isLoading = false
                }
                is GoogleAuthHelper.Result.Error -> {
                    isLoading = false
                    android.util.Log.e("GoogleSignIn", "Credential Manager error in signup: ${result.message}", result.cause)
                    error = "${K.googleSignInFailed.tr(lang)}: ${result.message}"
                }
            }
        }
    }

    val handleSignup = {
        isLoading = true
        error = null
        errorField = null
        if (firstName.length < 2) {
            isLoading = false
            errorField = AuthField.FIRST_NAME
            error = K.firstNameTooShort.tr(lang)
        } else if (lastName.isEmpty()) {
            isLoading = false
            errorField = AuthField.LAST_NAME
            error = "${K.lastName.tr(lang)} ${K.isRequired.tr(lang)}"
        } else if (regNo.length < 5) {
            isLoading = false
            errorField = AuthField.REGISTER_NUMBER
            error = K.invalidRegisterNumber.tr(lang)
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            isLoading = false
            errorField = AuthField.EMAIL
            error = K.invalidEmailFormat.tr(lang)
        } else if (password.length < 6) {
            isLoading = false
            errorField = AuthField.PASSWORD
            error = K.passwordTooShort.tr(lang)
        } else {
            auth.createUserWithEmailAndPassword(email, password)
                .addOnCompleteListener { task ->
                    if (task.isSuccessful) {
                        val user = auth.currentUser
                        if (user != null) {
                            val displayName = "$firstName $lastName".trim()
                            val profileUpdates = UserProfileChangeRequest.Builder()
                                .setDisplayName(displayName)
                                .build()
                            user.updateProfile(profileUpdates).addOnCompleteListener {
                                writeUserToDatabase(
                                    uid = user.uid,
                                    email = email,
                                    firstName = firstName,
                                    lastName = lastName,
                                    regNo = regNo,
                                    onComplete = {
                                        isLoading = false
                                        onSignupSuccess()
                                    }
                                )
                            }
                        } else {
                            isLoading = false
                            errorField = AuthField.GENERAL
                            error = K.signupFailedNoUser.tr(lang)
                        }
                    } else {
                        isLoading = false
                        errorField = AuthField.GENERAL
                        error = task.exception?.message ?: K.signupFailed.tr(lang)
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
                        title = K.createAccount.tr(lang),
                        subtitle = K.fillDetailsToGetStarted.tr(lang)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // ===== FORM FIELDS =====
                AuthAnimatedElement(delayIndex = 1, modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.fillMaxWidth()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            AuthTextField(
                                value = firstName,
                                onValueChange = { firstName = it; error = null; errorField = null },
                                label = K.firstName.tr(lang),
                                modifier = Modifier.weight(1f),
                                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                                isError = errorField == AuthField.FIRST_NAME || errorField == AuthField.NAME,
                                errorMessage = null
                            )
                            
                            AuthTextField(
                                value = lastName,
                                onValueChange = { lastName = it; error = null; errorField = null },
                                label = K.lastName.tr(lang),
                                modifier = Modifier.weight(1f),
                                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                                isError = errorField == AuthField.LAST_NAME || errorField == AuthField.NAME,
                                errorMessage = null
                            )
                        }
                        
                        if (error != null && (errorField == AuthField.FIRST_NAME || errorField == AuthField.LAST_NAME || errorField == AuthField.NAME)) {
                            Text(
                                text = error!!,
                                color = MaterialTheme.colorScheme.error,
                                style = MaterialTheme.typography.bodySmall,
                                modifier = Modifier.padding(start = 16.dp, top = 4.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        AuthTextField(
                            value = regNo,
                            onValueChange = { regNo = it; error = null; errorField = null },
                            label = K.registerNumber.tr(lang),
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Text,
                                imeAction = ImeAction.Next
                            ),
                            isError = errorField == AuthField.REGISTER_NUMBER,
                            errorMessage = if (errorField == AuthField.REGISTER_NUMBER) error else null
                        )

                        Spacer(modifier = Modifier.height(14.dp))

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

                        Spacer(modifier = Modifier.height(14.dp))

                        AuthTextField(
                            value = password,
                            onValueChange = { password = it; error = null; errorField = null },
                            label = K.password.tr(lang),
                            isPassword = true,
                            keyboardOptions = KeyboardOptions(
                                keyboardType = KeyboardType.Password,
                                imeAction = ImeAction.Done
                            ),
                            keyboardActions = KeyboardActions(onDone = { handleSignup() }),
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
                            text = K.createAccount.tr(lang),
                            onClick = { handleSignup() },
                            isLoading = isLoading
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OrDivider()

                        Spacer(modifier = Modifier.height(16.dp))

                        GoogleAuthButton(
                            text = K.signUpWithGoogle.tr(lang),
                            onClick = { handleGoogleSignup() },
                            isLoading = isLoading
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        AuthLinkText(
                            prefix = K.alreadyHaveAccount.tr(lang),
                            linkText = K.logIn.tr(lang),
                            onClick = onNavigateToLogin
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


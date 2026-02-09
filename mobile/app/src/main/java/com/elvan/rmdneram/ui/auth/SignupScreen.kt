package com.elvan.rmdneram.ui.auth

import android.util.Log
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import kotlinx.coroutines.delay

// Web Client ID from google-services.json (client_type: 3)
private const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"
private const val TAG = "SignupScreen"

@Composable
fun SignupScreen(
    onSignupSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit
) {
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var regNo by remember { mutableStateOf("") }
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
    val database = FirebaseDatabase.getInstance()
    val context = LocalContext.current
    val scrollState = rememberScrollState()

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
                        if (authTask.isSuccessful) {
                            val user = auth.currentUser
                            if (user != null) {
                                val displayName = user.displayName ?: ""
                                val lastSpaceIndex = displayName.lastIndexOf(" ")
                                val firstName = if (lastSpaceIndex == -1) displayName else displayName.substring(0, lastSpaceIndex)
                                val lastName = if (lastSpaceIndex == -1) "" else displayName.substring(lastSpaceIndex + 1)
                                
                                writeUserToDatabase(
                                    uid = user.uid,
                                    email = user.email ?: "",
                                    firstName = firstName,
                                    lastName = lastName,
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

    val handleGoogleSignup = {
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

    val handleSignup = {
        isLoading = true
        error = null
        if (firstName.length < 2) {
            isLoading = false
            error = "First Name must be at least 2 characters"
        } else if (lastName.isEmpty()) {
            isLoading = false
            error = "Last Name is required"
        } else if (regNo.length < 5) {
            isLoading = false
            error = "Invalid Register Number"
        } else if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            isLoading = false
            error = "Invalid email address"
        } else if (password.length < 6) {
            isLoading = false
            error = "Password must be at least 6 characters"
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
                            error = "Signup failed - no user created"
                        }
                    } else {
                        isLoading = false
                        error = task.exception?.message ?: "Signup Failed"
                    }
                }
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
            Spacer(modifier = Modifier.height(40.dp))

            // ===== HEADER =====
            AnimatedVisibility(
                visible = showHeader,
                enter = fadeIn(tween(500)) + slideInVertically(initialOffsetY = { -30 })
            ) {
                StepHeader(
                    title = "Create Account",
                    subtitle = "Fill in your details to get started"
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ===== FORM FIELDS =====
            AnimatedVisibility(
                visible = showForm,
                enter = fadeIn(tween(500)) + slideInVertically(initialOffsetY = { 30 })
            ) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        AuthTextField(
                            value = firstName,
                            onValueChange = { firstName = it; error = null },
                            label = "First Name",
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                            isError = error?.contains("First Name") == true,
                            errorMessage = null // Show error at bottom or handle distinct errors better if needed
                        )
                        
                        AuthTextField(
                            value = lastName,
                            onValueChange = { lastName = it; error = null },
                            label = "Last Name",
                            modifier = Modifier.weight(1f),
                            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                            isError = error?.contains("Last Name") == true,
                            errorMessage = null
                        )
                    }
                    
                    if (error?.contains("Name") == true) {
                        Text(
                            text = error!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(start = 16.dp, top = 4.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    AuthTextField(
                        value = regNo,
                        onValueChange = { regNo = it; error = null },
                        label = "Register Number",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text, imeAction = ImeAction.Next),
                        isError = error?.contains("Register") == true,
                        errorMessage = if (error?.contains("Register") == true) error else null
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    AuthTextField(
                        value = email,
                        onValueChange = { email = it; error = null },
                        label = "Email Address",
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                        isError = error?.contains("email") == true,
                        errorMessage = if (error?.contains("email") == true) error else null
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    AuthTextField(
                        value = password,
                        onValueChange = { password = it; error = null },
                        label = "Password",
                        isPassword = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                        isError = error?.contains("Password") == true || error?.contains("password") == true,
                        errorMessage = if (error?.contains("Password") == true || error?.contains("password") == true) error else null
                    )

                    // General error
                    if (error != null && !error!!.contains("Name") && !error!!.contains("Register") && !error!!.contains("email") && !error!!.contains("Password") && !error!!.contains("password")) {
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
                        text = "Create Account",
                        onClick = { handleSignup() },
                        isLoading = isLoading
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    OrDivider()

                    Spacer(modifier = Modifier.height(20.dp))

                    GoogleAuthButton(
                        text = "Sign up with Google",
                        onClick = { handleGoogleSignup() },
                        isLoading = isLoading
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    AuthLinkText(
                        prefix = "Already have an account? ",
                        linkText = "Log In",
                        onClick = onNavigateToLogin
                    )

                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}


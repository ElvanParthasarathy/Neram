package com.elvan.rmdneram.admin.ui.auth

import android.app.Activity
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.admin.ui.components.CustomTextField
import com.elvan.rmdneram.admin.ui.theme.NeramTheme
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

// Web Client ID from google-services.json
private const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"

@Composable
fun LoginScreen() {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var isGoogleLoading by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val auth = FirebaseAuth.getInstance()

    // Google Sign-In launcher
    val googleSignInLauncher = rememberLauncherForActivityResult(
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
                            auth.signInWithCredential(credential).await()
                            Toast.makeText(context, "Google Sign-In Successful!", Toast.LENGTH_SHORT).show()
                        } catch (e: Exception) {
                            Toast.makeText(context, "Firebase Auth Failed: ${e.message}", Toast.LENGTH_LONG).show()
                        } finally {
                            isGoogleLoading = false
                        }
                    }
                } ?: run {
                    isGoogleLoading = false
                    Toast.makeText(context, "No ID Token received", Toast.LENGTH_SHORT).show()
                }
            } catch (e: ApiException) {
                isGoogleLoading = false
                Toast.makeText(context, "Google Sign-In Failed: ${e.statusCode}", Toast.LENGTH_LONG).show()
            }
        } else {
            isGoogleLoading = false
        }
    }

    val handleGoogleSignIn: () -> Unit = {
        isGoogleLoading = true
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(WEB_CLIENT_ID)
            .requestEmail()
            .build()
        val googleSignInClient = GoogleSignIn.getClient(context, gso)
        // Sign out first to force account picker
        googleSignInClient.signOut()
        googleSignInLauncher.launch(googleSignInClient.signInIntent)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Neram Admin",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                Text(
                    text = "Administrative Access",
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(bottom = 32.dp),
                    textAlign = TextAlign.Center
                )

                CustomTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = "Email Address",
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.padding(bottom = 16.dp)
                )

                CustomTextField(
                    value = password,
                    onValueChange = { password = it },
                    placeholder = "Password",
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.padding(bottom = 24.dp)
                )

                Button(
                    onClick = {
                        isLoading = true
                        if (email.isNotEmpty() && password.isNotEmpty()) {
                            auth.signInWithEmailAndPassword(email, password)
                                .addOnCompleteListener { task ->
                                    isLoading = false
                                    if (task.isSuccessful) {
                                        Toast.makeText(context, "Login Successful!", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Login Failed: ${task.exception?.message}", Toast.LENGTH_LONG).show()
                                    }
                                }
                        } else {
                            isLoading = false
                            Toast.makeText(context, "Please fill all fields", Toast.LENGTH_SHORT).show()
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !isLoading && !isGoogleLoading
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text("Sign In", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedButton(
                    onClick = handleGoogleSignIn,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                    enabled = !isLoading && !isGoogleLoading
                ) {
                    if (isGoogleLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.height(24.dp),
                            color = MaterialTheme.colorScheme.primary
                        )
                    } else {
                        Text("Sign in with Google")
                    }
                }
            }
        }
    }
}

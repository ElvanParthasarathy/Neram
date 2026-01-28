package com.elvan.rmdneram.admin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.rmdneram.admin.ui.AdminMainScreen
import com.elvan.rmdneram.admin.ui.AdminViewModel
import com.elvan.rmdneram.admin.ui.auth.LoginScreen
import com.elvan.rmdneram.admin.ui.theme.NeramTheme
import com.google.firebase.auth.FirebaseAuth

class AdminMainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val adminViewModel: AdminViewModel = viewModel()
            val uiState by adminViewModel.uiState.collectAsState()

            NeramTheme(themeMode = uiState.themeMode) {
                val auth = FirebaseAuth.getInstance()
                var isLoggedIn by remember { mutableStateOf(auth.currentUser != null) }
                
                // Listen for auth state changes
                DisposableEffect(Unit) {
                    val listener = FirebaseAuth.AuthStateListener { firebaseAuth ->
                        isLoggedIn = firebaseAuth.currentUser != null
                    }
                    auth.addAuthStateListener(listener)
                    onDispose { auth.removeAuthStateListener(listener) }
                }
                
                if (isLoggedIn) {
                    AdminMainScreen(
                        onLogout = { 
                            auth.signOut()
                            isLoggedIn = false 
                        },
                        adminViewModel = adminViewModel
                    )
                } else {
                    LoginScreen()
                }
            }
        }
    }
}

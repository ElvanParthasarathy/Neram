package com.elvan.rmdneram

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.LocalActivityResultRegistryOwner
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.rmdneram.ui.home.HomeViewModel
import com.elvan.rmdneram.ui.MainViewModel
import com.elvan.rmdneram.ui.theme.NeramTheme
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
import androidx.compose.runtime.CompositionLocalProvider
import com.elvan.rmdneram.ui.home.rememberHomeColors
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.auth.AuthGradientBackground
import com.elvan.rmdneram.ui.auth.AuthColors
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.material3.Text
import androidx.compose.foundation.Image
import androidx.compose.ui.Alignment

@OptIn(ExperimentalAnimationApi::class)
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Dismiss Android 12+ system splash IMMEDIATELY (like Instagram/ChatGPT)
        val splashScreen = installSplashScreen()
        splashScreen.setKeepOnScreenCondition { false }
        
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val mainViewModel: MainViewModel = viewModel()
            // Collect theme mode and language from MainViewModel
            val uiState by mainViewModel.uiState.collectAsState()
            val useDarkTheme = when (uiState.themeMode) {
                "light" -> false
                "dark" -> true
                else -> isSystemInDarkTheme() // "auto" or default
            }
            
            // Get effective language
            val context = androidx.compose.ui.platform.LocalContext.current
            val effectiveLanguage = remember(uiState.languageCode) {
                AppStrings.getEffectiveLanguage(uiState.languageCode, context)
            }
            
            // GLOBAL LOCALE FIX:
            // Standard Android DatePicker and Java Time APIs often use Locale.getDefault()
            // We must force this to the App Language to ensure DatePickers show correctly.
            // GLOBAL LOCALE FIX:
            // Standard Android DatePicker and Java Time APIs often use Locale.getDefault()
            // We must force this to the App Language to ensure DatePickers show correctly.
            // GLOBAL LOCALE FIX:
            // Standard Android DatePicker and Java Time APIs often use Locale.getDefault()
            // We must force this to the App Language to ensure DatePickers show correctly.
            val appLocale = remember(effectiveLanguage) {
                val locale = if (effectiveLanguage == AppStrings.TAMIL) java.util.Locale("ta", "IN") else java.util.Locale.US
                java.util.Locale.setDefault(locale) // Force process-wide default immediately
                locale
            }
            
            // Configuration overrides
            val configuration = remember(appLocale) {
                val config = android.content.res.Configuration(context.resources.configuration)
                config.setLocale(appLocale)
                config
            }
            
            val localeContext = remember(configuration) {
                context.createConfigurationContext(configuration)
            }
            
            NeramTheme(darkTheme = useDarkTheme) {
                // Set system bar colors and icon appearance to match theme
                val colors = rememberHomeColors()
                val view = LocalView.current
                if (!view.isInEditMode) {
                    SideEffect {
                        val window = (view.context as Activity).window
                        window.statusBarColor = colors.background.toArgb()
                        window.navigationBarColor = colors.background.toArgb()
                        
                        // Set system bar icon colors: light icons in dark mode, dark icons in light mode
                        val insetsController = WindowCompat.getInsetsController(window, view)
                        insetsController.isAppearanceLightStatusBars = !useDarkTheme
                        insetsController.isAppearanceLightNavigationBars = !useDarkTheme
                    }
                }
                
                CompositionLocalProvider(
                    LocalAppLanguage provides effectiveLanguage,
                    androidx.compose.ui.platform.LocalContext provides localeContext,
                    LocalActivityResultRegistryOwner provides this@MainActivity,
                    androidx.compose.ui.platform.LocalConfiguration provides configuration
                ) {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        // Root Navigation State
                        var currentAuthScreen by remember { mutableStateOf("welcome") } // welcome, login, signup
                        
                        // Effect to auto-navigate based on auth state
                        LaunchedEffect(uiState.isAuthenticated) {
                            if (uiState.isAuthenticated) {
                                // If authenticated, we don't show auth screens
                                // The main content decision happens below (Home vs Onboarding)
                            } else {
                                // If logged out, reset to welcome
                                currentAuthScreen = "welcome"
                            }
                        }

                        if (!uiState.isAuthInitialized) {
                            SplashScreen()
                        } else if (uiState.isAuthenticated) {
                            if (uiState.isOnboardingComplete) {
                                // CASE 1: Authenticated & Onboarding Complete -> HOME
                                val homeViewModel: HomeViewModel = viewModel()
                                com.elvan.rmdneram.ui.MainScreen(
                                    activity = this@MainActivity,
                                    homeViewModel = homeViewModel,
                                    mainViewModel = mainViewModel,
                                    onLogout = { 
                                        mainViewModel.signOut()
                                    }
                                )
                            } else {
                                // CASE 2: Authenticated but missing Dept/Batch -> ONBOARDING
                                // Check if loading profile first to avoid flickering
                                if (uiState.userProfile == null) {
                                    // Profile loading... show splash or loading
                                    Box(
                                        modifier = Modifier.fillMaxSize(),
                                        contentAlignment = androidx.compose.ui.Alignment.Center
                                    ) {
                                        com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(
                                            modifier = Modifier.width(48.dp).height(48.dp),
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                } else {
                                    com.elvan.rmdneram.ui.onboarding.OnboardingScreen(
                                        academicHierarchy = uiState.academicHierarchy,
                                        onComplete = { dept, batch, section ->
                                            mainViewModel.saveOnboardingData(dept, batch, section)
                                        }
                                    )
                                }
                            }
                        } else {
                            // CASE 3: Not Authenticated -> AUTH FLOW
                            AnimatedContent(
                                targetState = currentAuthScreen,
                                transitionSpec = {
                                    fadeIn(animationSpec = tween(300)) togetherWith fadeOut(animationSpec = tween(300))
                                }
                            ) { screen ->
                                when (screen) {
                                    "welcome" -> com.elvan.rmdneram.ui.auth.WelcomeScreen(
                                        onContinue = { currentAuthScreen = "login" }
                                    )
                                    "login" -> com.elvan.rmdneram.ui.auth.LoginScreen(
                                        onLoginSuccess = { /* MainViewModel handles this via AuthStateListener */ },
                                        onNavigateToSignup = { currentAuthScreen = "signup" }
                                    )
                                    "signup" -> com.elvan.rmdneram.ui.auth.SignupScreen(
                                        onSignupSuccess = { /* MainViewModel handles this via AuthStateListener */ },
                                        onNavigateToLogin = { currentAuthScreen = "login" }
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
fun SplashScreen() {
    AuthGradientBackground {
        Box(modifier = Modifier.fillMaxSize()) {
            // Centered Content: Text & Logo
            Column(
                modifier = Modifier.align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // 1. "Neram" Text
                Text(
                    text = "Neram",
                    style = MaterialTheme.typography.displayMedium.copy(
                        fontWeight = FontWeight.ExtraBold,
                        color = AuthColors.textPrimary()
                    )
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // 2. Logo (below text)
                androidx.compose.foundation.Image(
                    painter = painterResource(id = R.drawable.ic_launcher_foreground),
                    contentDescription = "Neram Logo",
                    modifier = Modifier.size(120.dp)
                )
            }
            
            // Footer: "FROM Elvan Parthasarathy"
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 48.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "FROM",
                    style = MaterialTheme.typography.labelSmall.copy(
                        letterSpacing = 2.sp,
                        color = AuthColors.textSecondary()
                    )
                )
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    text = "Elvan Parthasarathy",
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = AuthColors.NeramBlue
                    )
                )
            }
        }
    }
}

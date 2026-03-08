package com.elvan.rmdneram

import android.app.Activity
import android.content.Context
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
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.offset


import com.elvan.rmdneram.ui.common.NotificationHelper
import java.time.Duration
import java.time.LocalTime
import java.util.concurrent.TimeUnit
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.Constraints
import com.elvan.rmdneram.workers.DailyUpdateWorker
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.Manifest
import android.os.Build
import android.util.Log

@OptIn(ExperimentalAnimationApi::class)
class MainActivity : ComponentActivity() {
    private lateinit var appUpdateManager: com.google.android.play.core.appupdate.AppUpdateManager
    private val UPDATE_REQUEST_CODE = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        // Dismiss Android 12+ system splash IMMEDIATELY (like Instagram/ChatGPT)
        val splashScreen = installSplashScreen()
        splashScreen.setKeepOnScreenCondition { false }

        // Initialize AppUpdateManager
        appUpdateManager = com.google.android.play.core.appupdate.AppUpdateManagerFactory.create(this)
        checkForAppUpdate()

        // Create Notification Channels
        NotificationHelper.createNotificationChannels(this)

        // Schedule Live Update Checker (15 min)
        scheduleLiveUpdateChecker()
        
        // Schedule Daily Alarm (5:30 AM)
        scheduleDailyAlarm()

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

            // Notification Permission (Android 13+)
            val permissionLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestPermission(),
                onResult = { isGranted ->
                    // Handle permission result if needed
                }
            )
            
            LaunchedEffect(Unit) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                     permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }

            // Listen for Login Errors (e.g. Blocked Roles)
            LaunchedEffect(mainViewModel) {
                mainViewModel.loginErrorFlow.collect { errorMessage ->
                    android.widget.Toast.makeText(this@MainActivity, errorMessage, android.widget.Toast.LENGTH_LONG).show()
                }
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
                            SplashScreen(isDarkTheme = useDarkTheme)
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
                                    // Profile loading... show splash instead of loader
                                    SplashScreen(isDarkTheme = useDarkTheme)
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

    private fun scheduleLiveUpdateChecker() {
        try {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            // Run every 15 minutes to detect live updates
            val updateWorkRequest = PeriodicWorkRequestBuilder<DailyUpdateWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()
                
            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "LiveUpdateChecker",
                ExistingPeriodicWorkPolicy.UPDATE,
                updateWorkRequest
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun scheduleDailyAlarm() {
        com.elvan.rmdneram.utils.AlarmScheduler.scheduleDailyAlarm(this)
    }
    override fun onResume() {
        super.onResume()
        appUpdateManager.appUpdateInfo.addOnSuccessListener { appUpdateInfo ->
            if (appUpdateInfo.updateAvailability() == com.google.android.play.core.install.model.UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                // If an in-app update is already in progress, resume it.
                try {
                    appUpdateManager.startUpdateFlowForResult(
                        appUpdateInfo,
                        this,
                        com.google.android.play.core.appupdate.AppUpdateOptions.defaultOptions(com.google.android.play.core.install.model.AppUpdateType.IMMEDIATE),
                        UPDATE_REQUEST_CODE
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: android.content.Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == UPDATE_REQUEST_CODE) {
            if (resultCode != Activity.RESULT_OK) {
                // If the update is cancelled or fails,
                // you can request to start the update again.
                checkForAppUpdate()
            }
        }
    }

    private fun checkForAppUpdate() {
        val appUpdateInfoTask = appUpdateManager.appUpdateInfo
        appUpdateInfoTask.addOnSuccessListener { appUpdateInfo ->
            if (appUpdateInfo.updateAvailability() == com.google.android.play.core.install.model.UpdateAvailability.UPDATE_AVAILABLE &&
                appUpdateInfo.isUpdateTypeAllowed(com.google.android.play.core.install.model.AppUpdateType.IMMEDIATE)
            ) {
                try {
                    appUpdateManager.startUpdateFlowForResult(
                        appUpdateInfo,
                        this,
                        com.google.android.play.core.appupdate.AppUpdateOptions.defaultOptions(com.google.android.play.core.install.model.AppUpdateType.IMMEDIATE),
                        UPDATE_REQUEST_CODE
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }


}

@Composable
fun SplashScreen(isDarkTheme: Boolean = false) {
    // Use explicit colors based on app theme preference
    val backgroundColor = if (isDarkTheme) Color(0xFF0A0A0A) else Color(0xFFFAFAFA)
    val shapeColor = if (isDarkTheme) Color.White.copy(alpha = 0.03f) else Color(0xFFE8F0FE)
    val textPrimary = if (isDarkTheme) Color.White else Color(0xFF1A1A1A)
    val textSecondary = if (isDarkTheme) Color.White.copy(alpha = 0.6f) else Color(0xFF666666)
    val accentBlue = Color(0xFF007AFF)
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundColor)
    ) {
        // Floating background shapes (simplified)
        Box(
            modifier = Modifier
                .size(200.dp)
                .offset(x = (-50).dp, y = 100.dp)
                .background(shapeColor, shape = androidx.compose.foundation.shape.CircleShape)
        )
        Box(
            modifier = Modifier
                .size(150.dp)
                .align(Alignment.TopEnd)
                .offset(x = 30.dp, y = (-30).dp)
                .background(shapeColor, shape = androidx.compose.foundation.shape.CircleShape)
        )
        Box(
            modifier = Modifier
                .size(100.dp)
                .align(Alignment.BottomEnd)
                .offset(x = 20.dp, y = 50.dp)
                .background(shapeColor, shape = androidx.compose.foundation.shape.CircleShape)
        )
        
        // Centered Content: Text & Logo
        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // 1. Logo
            Image(
                painter = painterResource(id = R.drawable.ic_splash_logo),
                contentDescription = "Neram Logo",
                modifier = Modifier.size(180.dp),
                colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(textPrimary)
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
                    color = textSecondary
                )
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = "Elvan Parthasarathy",
                style = MaterialTheme.typography.bodyLarge.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = accentBlue
                )
            )
        }
    }
}

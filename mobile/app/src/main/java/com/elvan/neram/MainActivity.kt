package com.elvan.neram

import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.compose.LocalActivityResultRegistryOwner
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.fillMaxSize
import androidx.activity.compose.BackHandler
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.neram.ui.home.HomeViewModel
import com.elvan.neram.ui.MainViewModel
import com.elvan.neram.ui.theme.NeramTheme
import com.elvan.neram.ui.theme.LocalAppLanguage
import androidx.compose.runtime.CompositionLocalProvider
import com.elvan.neram.ui.home.rememberHomeColors
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.layout.*
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.auth.AuthBackground
import com.elvan.neram.ui.auth.AuthGradientBackground
import com.elvan.neram.ui.auth.AuthColors
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.material3.Text
import androidx.compose.foundation.Image
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.offset
import androidx.compose.ui.graphics.graphicsLayer


import com.elvan.neram.ui.common.NotificationHelper
import java.time.Duration
import java.time.LocalTime
import java.util.concurrent.TimeUnit
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.Constraints
import com.elvan.neram.workers.DailyUpdateWorker
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import android.Manifest
import android.os.Build
import android.util.Log
import androidx.appcompat.app.AppCompatActivity

val LocalMainActivity = compositionLocalOf<ComponentActivity?> { null }

fun updateSystemBarsAppearance(window: android.view.Window, isDark: Boolean) {
    val decorView = window.decorView
    val insetsController = WindowCompat.getInsetsController(window, decorView)
    insetsController.isAppearanceLightStatusBars = !isDark
    insetsController.isAppearanceLightNavigationBars = !isDark

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        window.insetsController?.let { controller ->
            val appearance = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS or
                             WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            if (!isDark) {
                controller.setSystemBarsAppearance(appearance, appearance)
            } else {
                controller.setSystemBarsAppearance(0, appearance)
            }
        }
    }

    @Suppress("DEPRECATION")
    var flags = decorView.systemUiVisibility
    flags = if (!isDark) {
        flags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
    } else {
        flags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv() and View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR.inv()
    }
    @Suppress("DEPRECATION")
    decorView.systemUiVisibility = flags
}

@OptIn(ExperimentalAnimationApi::class)
class MainActivity : AppCompatActivity() {
    companion object {
        var currentActivity: MainActivity? = null
    }

    private lateinit var appUpdateManager: com.google.android.play.core.appupdate.AppUpdateManager
    private val UPDATE_REQUEST_CODE = 1001
    private var currentLanguageCode: String = "system"

    override fun onDestroy() {
        super.onDestroy()
        if (currentActivity === this) {
            currentActivity = null
        }
    }

    override fun onStop() {
        super.onStop()
        com.elvan.neram.utils.LauncherManager.updateLauncherName(this, currentLanguageCode)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        currentActivity = this
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

        // Strictly lock orientation to portrait
        requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT

        super.onCreate(savedInstanceState)
        window.setBackgroundDrawable(android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT))
        val isSystemDark = (resources.configuration.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) == android.content.res.Configuration.UI_MODE_NIGHT_YES
        enableEdgeToEdge(
            statusBarStyle = if (isSystemDark) {
                androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
            } else {
                androidx.activity.SystemBarStyle.light(
                    android.graphics.Color.TRANSPARENT,
                    android.graphics.Color.TRANSPARENT
                )
            },
            navigationBarStyle = if (isSystemDark) {
                androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
            } else {
                androidx.activity.SystemBarStyle.light(
                    android.graphics.Color.TRANSPARENT,
                    android.graphics.Color.TRANSPARENT
                )
            }
        )
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
                K.getEffectiveLanguage(uiState.languageCode, context)
            }

            currentLanguageCode = uiState.languageCode
            
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
                val locale = when (effectiveLanguage) {
                    K.TAMIL, K.TAMIL_LATIN -> java.util.Locale("ta", "IN")
                    K.MALAYALAM, K.MALAYALAM_LATIN, K.TAMIL_MALAYALAM -> java.util.Locale("ml", "IN")
                    K.MALAYALAM_TAMIL -> java.util.Locale("ta", "IN")
                    K.TELUGU, K.TELUGU_LATIN -> java.util.Locale("te", "IN")
                    else -> java.util.Locale.US
                }
                java.util.Locale.setDefault(locale)
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
                    DisposableEffect(useDarkTheme) {
                        enableEdgeToEdge(
                            statusBarStyle = if (useDarkTheme) {
                                androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
                            } else {
                                androidx.activity.SystemBarStyle.light(
                                    android.graphics.Color.TRANSPARENT,
                                    android.graphics.Color.TRANSPARENT
                                )
                            },
                            navigationBarStyle = if (useDarkTheme) {
                                androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
                            } else {
                                androidx.activity.SystemBarStyle.light(
                                    android.graphics.Color.TRANSPARENT,
                                    android.graphics.Color.TRANSPARENT
                                )
                            }
                        )
                        val window = this@MainActivity.window
                        window.statusBarColor = android.graphics.Color.TRANSPARENT
                        window.navigationBarColor = android.graphics.Color.TRANSPARENT
                        window.decorView.setBackgroundColor(colors.background.toArgb())
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            window.isNavigationBarContrastEnforced = false
                            window.isStatusBarContrastEnforced = false
                        }
                        
                        // Set system bar icon colors dynamically across all Android versions and Samsung OneUI
                        updateSystemBarsAppearance(window, useDarkTheme)
                        
                        onDispose { }
                    }
                }
                
                val appFontFamily = if (effectiveLanguage == K.TAMIL) 
                    com.elvan.neram.ui.theme.ElvanSansFontFamily 
                    else com.elvan.neram.ui.theme.ElvanSansFontFamily
                
                CompositionLocalProvider(
                    LocalAppLanguage provides effectiveLanguage,
                    com.elvan.neram.ui.theme.LocalAppFontFamily provides appFontFamily,
                    androidx.compose.ui.platform.LocalContext provides localeContext,
                    LocalActivityResultRegistryOwner provides this@MainActivity,
                    LocalMainActivity provides this@MainActivity,
                    androidx.compose.ui.platform.LocalConfiguration provides configuration
                ) {
                    Surface(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(
                                WindowInsets.displayCutout
                                    .only(WindowInsetsSides.Horizontal)
                                    .asPaddingValues()
                            ),
                        color = Color.Transparent
                    ) {
                        // Root Navigation State: Language -> Welcome -> Login / Signup
                        var currentAuthScreen by rememberSaveable { mutableStateOf("language") }
                        
                        // Effect to auto-navigate based on auth state
                        LaunchedEffect(uiState.isAuthenticated) {
                            if (uiState.isAuthenticated) {
                                // Handled below (Home vs Onboarding)
                            } else {
                                // If logged out, reset to language selection
                                currentAuthScreen = "language"
                            }
                        }

                        if (!uiState.isAuthInitialized) {
                            SplashScreen(isDarkTheme = useDarkTheme, language = effectiveLanguage)
                        } else if (uiState.isAuthenticated) {
                            if (!uiState.hasCompletedLanguageSelection) {
                                // ONE-TIME LANGUAGE SELECTION FOR PLAY STORE UPDATE
                                com.elvan.neram.ui.onboarding.LanguageSelectionScreen(
                                    currentLanguage = uiState.languageCode,
                                    onLanguageConfirmed = { selectedLang ->
                                        mainViewModel.setLanguage(selectedLang)
                                        mainViewModel.markLanguageSelectionCompleted()
                                    }
                                )
                            } else if (uiState.isOnboardingComplete) {
                                // CASE 1: Authenticated & Onboarding Complete -> HOME
                                val homeViewModel: HomeViewModel = viewModel()
                                com.elvan.neram.ui.MainScreen(
                                    activity = this@MainActivity,
                                    homeViewModel = homeViewModel,
                                    mainViewModel = mainViewModel,
                                    onLogout = { 
                                        mainViewModel.signOut()
                                        currentAuthScreen = "language"
                                    }
                                )
                            } else {
                                // CASE 2: Authenticated but missing Dept/Batch -> ONBOARDING
                                // Check if loading profile first to avoid flickering
                                if (uiState.userProfile == null) {
                                    // Profile loading... show splash instead of loader
                                    SplashScreen(isDarkTheme = useDarkTheme, language = effectiveLanguage)
                                } else {
                                    com.elvan.neram.ui.onboarding.OnboardingScreen(
                                        academicHierarchy = uiState.academicHierarchy,
                                        onComplete = { dept, batch, section ->
                                            mainViewModel.saveOnboardingData(dept, batch, section)
                                        }
                                    )
                                }
                            }
                        } else {
                            // CASE 3: Not Authenticated -> AUTH FLOW (Language -> Welcome -> Login / Signup)
                            BackHandler(enabled = currentAuthScreen != "language") {
                                when (currentAuthScreen) {
                                    "welcome" -> currentAuthScreen = "language"
                                    "login" -> currentAuthScreen = "welcome"
                                    "signup" -> currentAuthScreen = "login"
                                }
                            }

                            val isLanguage = currentAuthScreen == "language"
                            val languageAlpha by animateFloatAsState(
                                targetValue = if (isLanguage) 1f else 0f,
                                animationSpec = tween(350, easing = EaseInOutCubic),
                                label = "language_alpha"
                            )

                            // 1. SINGLE PERSISTENT BACKGROUND: Ambient floating shapes stay continuous across all screens
                            com.elvan.neram.ui.auth.AuthBackground {
                                Box(modifier = Modifier.fillMaxSize()) {
                                    // 2. BASE LAYER: LanguageSelectionScreen is permanently composed so scroll position is preserved
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .graphicsLayer { alpha = languageAlpha }
                                    ) {
                                        com.elvan.neram.ui.onboarding.LanguageSelectionScreen(
                                            currentLanguage = uiState.languageCode,
                                            onLanguageConfirmed = { selectedLang ->
                                                mainViewModel.setLanguage(selectedLang)
                                                mainViewModel.markLanguageSelectionCompleted()
                                                currentAuthScreen = "welcome"
                                            },
                                            showBackground = false
                                        )
                                    }

                                    // 3. SCREENS ON TOP: Welcome, Login, Signup layered over the language screen
                                    androidx.compose.animation.AnimatedVisibility(
                                        visible = !isLanguage,
                                        enter = fadeIn(animationSpec = tween(350, easing = EaseOutCubic)),
                                        exit = fadeOut(animationSpec = tween(250, easing = EaseInCubic))
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .clickable(
                                                    interactionSource = remember { MutableInteractionSource() },
                                                    indication = null,
                                                    onClick = {}
                                                )
                                        ) {
                                            AnimatedContent(
                                                targetState = currentAuthScreen,
                                                transitionSpec = {
                                                    fadeIn(animationSpec = tween(300, easing = EaseOutCubic))
                                                        .togetherWith(
                                                            fadeOut(animationSpec = tween(200, easing = EaseInCubic))
                                                        )
                                                },
                                                label = "top_auth_screens"
                                            ) { screen ->
                                                when (screen) {
                                                    "welcome" -> com.elvan.neram.ui.auth.WelcomeScreen(
                                                        onContinue = { currentAuthScreen = "login" },
                                                        showBackground = false
                                                    )
                                                    "login" -> com.elvan.neram.ui.auth.LoginScreen(
                                                        onLoginSuccess = { /* Handled by authStateListener */ },
                                                        onNavigateToSignup = { currentAuthScreen = "signup" },
                                                        showBackground = false
                                                    )
                                                    "signup" -> com.elvan.neram.ui.auth.SignupScreen(
                                                        onSignupSuccess = { /* Handled by authStateListener */ },
                                                        onNavigateToLogin = { currentAuthScreen = "login" },
                                                        showBackground = false
                                                    )
                                                    else -> Spacer(Modifier.fillMaxSize())
                                                }
                                            }
                                        }
                                    }
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
        com.elvan.neram.utils.AlarmScheduler.scheduleDailyAlarm(this)
    }
    override fun onResume() {
        super.onResume()
        currentActivity = this
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
fun SplashScreen(
    isDarkTheme: Boolean = false,
    language: String = K.ENGLISH
) {
    val textPrimary = if (isDarkTheme) Color.White else Color(0xFF1A1A1A)
    
    AuthBackground {
        // Centered Content: Logo
        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_splash_logo),
                contentDescription = null,
                modifier = Modifier.size(180.dp),
                colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(textPrimary)
            )
        }
        
        // Footer: Language-aware Branding ("Elvan Navil" / "எல்வன் நவில்")
        val isTamil = language == K.TAMIL
        val brandingText = K.elvanNavil.tr(language)
        val tightSpacing = if (isTamil) 0.sp else (-0.2).sp

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 52.dp)
        ) {
            Text(
                text = brandingText,
                style = MaterialTheme.typography.titleMedium.copy(
                    letterSpacing = tightSpacing,
                    color = textPrimary.copy(alpha = 0.38f),
                    fontWeight = FontWeight.Medium,
                    fontSize = if (isTamil) 17.5.sp else 18.5.sp
                )
            )
        }
    }
}

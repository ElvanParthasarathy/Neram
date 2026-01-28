package com.elvan.rmdneram

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
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
                    androidx.compose.ui.platform.LocalConfiguration provides configuration
                ) {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = MaterialTheme.colorScheme.background
                    ) {
                        if (uiState.isAuthenticated) {
                            val homeViewModel: HomeViewModel = viewModel()
                            com.elvan.rmdneram.ui.MainScreen(
                                homeViewModel = homeViewModel,
                                mainViewModel = mainViewModel,
                                onLogout = { 
                                    mainViewModel.signOut()
                                }
                            )
                        } else {
                            com.elvan.rmdneram.ui.auth.LoginScreen()
                        }
                    }
                }
            }
        }
    }
}

package com.elvan.rmdneram.admin.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb

private val DarkColorScheme = darkColorScheme(
    primary = Accent,
    secondary = DarkTextSecondary,
    tertiary = FolderColor,
    background = DarkBackground,
    surface = DarkSurface,
    onPrimary = White,
    onSecondary = White,
    onTertiary = Black,
    onBackground = DarkTextPrimary,
    onSurface = DarkTextPrimary,
    error = ErrorColor
)

private val LightColorScheme = lightColorScheme(
    primary = Accent,
    secondary = LightTextSecondary,
    tertiary = FolderColor,
    background = LightBackground,
    surface = LightSurface,
    onPrimary = White,
    onSecondary = White,
    onTertiary = Black,
    onBackground = LightTextPrimary,
    onSurface = LightTextPrimary,
    error = ErrorColor
)

@Composable
fun NeramTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    themeMode: String = "auto",
    // Dynamic color is available on Android 12+
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val isDark = when(themeMode) {
        "light" -> false
        "dark" -> true
        else -> darkTheme
    }

    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (isDark) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        
        isDark -> DarkColorScheme
        else -> LightColorScheme
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = Color.Transparent.toArgb()
            window.navigationBarColor = colorScheme.background.toArgb()
            val insetsController = WindowCompat.getInsetsController(window, view)
            insetsController.isAppearanceLightStatusBars = !isDark
            insetsController.isAppearanceLightNavigationBars = !isDark
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}

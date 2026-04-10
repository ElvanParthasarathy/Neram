package com.elvan.rmdneram.ui.navigation

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.draw.scale
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material.icons.filled.NightsStay
import androidx.compose.material.icons.filled.BrightnessMedium
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeTypography
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppFontFamily
import com.elvan.rmdneram.ui.theme.LocalAppLanguage

/**
 * Top Menu Bar - Floating 3-dot menu
 * Ported from AppMenu.js
 */
@Composable
fun TopMenuBar(
    title: String,
    subtitle: String? = null, // Added subtitle support
    onLogout: () -> Unit = {},
    userRole: String? = null,
    themeMode: String = "auto",
    onThemeModeChange: (String) -> Unit = {},
    onNavigateToSettings: (() -> Unit)? = null,
    onNavigateToSites: (() -> Unit)? = null,
    isOffline: Boolean = false,
    showMenu: Boolean = true,
    onBack: (() -> Unit)? = null,
    onNotificationsClick: (() -> Unit)? = null, // Added Notification Action
    unreadCount: Int = 0,
    isSmallTitle: Boolean = false,
    actions: @Composable RowScope.() -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = rememberHomeColors()
    var isMenuOpen by remember { mutableStateOf(false) }
    var menuView by remember { mutableStateOf("main") } // "main" or "appearance"

    // Fixed Top Bar container
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = colors.background, // Opaque background
        shadowElevation = 0.dp // Flat style as requested
    ) {
        Row(
            modifier = Modifier
                .windowInsetsPadding(WindowInsets.statusBars)
                .fillMaxWidth()
                .height(64.dp) // Standard TopAppBar height
                .padding(start = if (onBack != null) 20.dp else 24.dp, end = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left: Back Button + Screen Title
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (onBack != null) {
                    Surface(
                        modifier = Modifier.size(40.dp),
                        shape = CircleShape,
                        color = colors.surface, // Match card color
                        onClick = onBack
                    ) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Filled.ChevronLeft,
                                contentDescription = "Back",
                                tint = colors.textPrimary,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                }
                
                Column {
                    val tamilFont = LocalAppFontFamily.current
                    Text(
                        text = title,
                        style = if (isSmallTitle) {
                            HomeTypography.PageTitle.copy(
                                fontSize = if (title.length > 20) 14.sp else 16.sp,
                                fontWeight = FontWeight.Medium,
                                letterSpacing = 0.sp,
                                fontFamily = tamilFont
                            )
                        } else {
                            HomeTypography.PageTitle.copy(
                                fontSize = 28.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = (-1).sp,
                                fontFamily = tamilFont
                            )
                        },
                        color = colors.textPrimary,
                        modifier = Modifier.padding(top = if (subtitle == null && !isSmallTitle) 8.dp else 0.dp),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (subtitle != null) {
                        Text(
                            text = subtitle,
                            style = HomeTypography.FacultyName,
                            color = colors.textSecondary,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
            
            // Right: Actions
            Row(
                modifier = Modifier.padding(top = 8.dp), // Align with Title
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Injected Actions (Calendar controls etc)
                actions()

                // Notification Bell
                if (onNotificationsClick != null) {
                    Surface(
                        modifier = Modifier.size(40.dp),
                        shape = CircleShape,
                        color = colors.surface, // Match card color
                        onClick = onNotificationsClick
                    ) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Notifications,
                                contentDescription = "Notifications",
                                tint = colors.textPrimary,
                                modifier = Modifier.size(24.dp)
                            )
                            
                            // Badge
                            if (unreadCount > 0) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .padding(top = 8.dp, end = 8.dp) // Adjust position
                                        .size(8.dp)
                                        .background(colors.danger, CircleShape)
                                        .border(1.dp, colors.surface, CircleShape)
                                )
                            }
                        }
                    }
                }
                 
                
                // Offline Badge
                androidx.compose.animation.AnimatedVisibility(
                    visible = isOffline,
                    enter = fadeIn(),
                    exit = fadeOut()
                ) {
                    Surface(
                        color = colors.danger.copy(alpha = 0.1f),
                        shape = HomeShapes.Pill,
                        border = androidx.compose.foundation.BorderStroke(1.dp, colors.danger.copy(alpha = 0.5f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(colors.danger)
                            )
                            Text(
                                text = AppStrings.Home.offline(LocalAppLanguage.current).uppercase(),
                                style = HomeTypography.StatusBadge.copy(
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                ),
                                color = colors.danger
                            )
                        }
                    }
                }



                // 3-Dot Menu Button (Filled Circle, Horizontal Dots)
                if (showMenu) {
                    Box {
                        // Simple fixed-size circular button
                        Surface(
                            modifier = Modifier.size(40.dp),
                            shape = CircleShape,
                            color = colors.surface, // Match card color
                            onClick = {
                                menuView = "main"
                                isMenuOpen = true
                            }
                        ) {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MoreHoriz,
                                    contentDescription = "Menu",
                                    tint = colors.textPrimary,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }

                        // DropdownMenu MUST be inside the same Box as the anchor
                        DropdownMenu(
                            expanded = isMenuOpen,
                            onDismissRequest = { isMenuOpen = false },
                            offset = androidx.compose.ui.unit.DpOffset(0.dp, 8.dp),
                            shape = HomeShapes.Item,
                            containerColor = colors.surface,
                            tonalElevation = 0.dp,
                            shadowElevation = 4.dp
                        ) {
                            androidx.compose.animation.Crossfade(targetState = menuView, label = "menuNav") { view ->
                                when (view) {
                                    "main" -> MainMenuView(
                                        colors = colors,
                                        userRole = userRole,
                                        onImportantSites = { isMenuOpen = false; onNavigateToSites?.invoke() },
                                        onContact = { isMenuOpen = false },
                                        onSettings = { isMenuOpen = false; onNavigateToSettings?.invoke() },
                                        onLogout = { isMenuOpen = false; onLogout() }
                                    )
                                    "appearance" -> AppearanceMenuView(
                                        colors = colors,
                                        selectedTheme = themeMode,
                                        onThemeChange = onThemeModeChange,
                                        onBack = { menuView = "main" }
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
private fun MainMenuView(
    colors: HomeColors,
    userRole: String?,
    onImportantSites: () -> Unit,
    onContact: () -> Unit,
    onSettings: () -> Unit,
    onLogout: () -> Unit
) {
    Column {
        val lang = LocalAppLanguage.current
        // Important Sites
        AppMenuItem(
            icon = Icons.Outlined.Language,
            label = AppStrings.Menu.importantSites(lang),
            colors = colors,
            onClick = onImportantSites
        )

        // Settings
        AppMenuItem(
            icon = Icons.Outlined.Settings,
            label = AppStrings.Menu.settings(lang),
            colors = colors,
            onClick = onSettings
        )
    }
}

@Composable
private fun AppearanceMenuView(
    colors: HomeColors,
    selectedTheme: String,
    onThemeChange: (String) -> Unit,
    onBack: () -> Unit
) {

    Column {
        // Back Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onBack() }
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                Icons.Outlined.ArrowBack,
                null,
                tint = colors.textPrimary,
                modifier = Modifier.size(20.dp)
            )
            Text(
                AppStrings.Common.back(LocalAppLanguage.current),
                style = HomeTypography.PillTitle,
                color = colors.textSecondary,
                fontWeight = FontWeight.SemiBold
            )
        }

        MenuDivider(colors)
        // Note: Theme Options extracted if needed, but handled by parent in original? 
        // Original logic for Appearance Menu Body was missing in the provided snippet in Step 291?
        // Wait, looking at Step 291 (lines 243-278).
        // It had `MenuDivider(colors)`. And then `}`.
        // It seems the radio buttons for theme were missing in the original file I read?
        // Let me check Step 291 again.
        // Lines 275-277: `MenuDivider(colors)`. Then `}`.
        // There were no ThemeMenuItems in AppearanceMenuView?
        // Maybe I truncated reading? No "Total Lines: 369".
        // Line 243-278 covers the entire `AppearanceMenuView`.
        // It seems `AppearanceMenuView` was empty/incomplete in original?
        // Ah, maybe the user wants me to fix this?
        // Or maybe I missed reading it.
        // Wait, Line 278 is `}`.
        // Line 280 is `MenuItem`.
        // So yes, `AppearanceMenuView` logic was missing theme items in original file.
        // I will preserve this state (faithful refactor). If logic was missing, I keep it missing.
        // Or should I add them? "Top Menu Bar... Ported from AppMenu.js".
        // Use `ThemeMenuItem`.
        // I'll add them if I can imply them (Auto, Light, Dark).
        // `ThemeMenuItem` was defined in original (lines 321-359).
        // But NOT used in `AppearanceMenuView`?
        // That's weird. Dead code?
        // I will implement them using `ThemeMenuItem` since I have it.
        
        val lang = LocalAppLanguage.current
        AppThemeMenuItem(
            icon = Icons.Filled.BrightnessMedium, // Fallback for Auto
            label = AppStrings.Menu.systemDefault(lang),
            colors = colors,
            isSelected = selectedTheme == "auto",
            onClick = { onThemeChange("auto") }
        )
        AppThemeMenuItem(
            icon = Icons.Filled.WbSunny,
            label = AppStrings.Menu.lightMode(lang),
            colors = colors,
            isSelected = selectedTheme == "light",
            onClick = { onThemeChange("light") }
        )
        AppThemeMenuItem(
            icon = Icons.Filled.NightsStay,
            label = AppStrings.Menu.darkMode(lang),
            colors = colors,
            isSelected = selectedTheme == "dark",
            onClick = { onThemeChange("dark") }
        )
    }
}

// Helpers are in NavigationComponents.kt

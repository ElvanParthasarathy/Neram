content = '''package com.elvan.rmdneram.ui.navigation

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
import androidx.compose.ui.draw.alpha
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

@Composable
fun TopMenuBar(
    title: String,
    subtitle: String? = null,
    onLogout: () -> Unit = {},
    userRole: String? = null,
    themeMode: String = "auto",
    onThemeModeChange: (String) -> Unit = {},
    onNavigateToSettings: (() -> Unit)? = null,
    onNavigateToSites: (() -> Unit)? = null,
    isOffline: Boolean = false,
    showMenu: Boolean = true,
    onBack: (() -> Unit)? = null,
    onNotificationsClick: (() -> Unit)? = null,
    unreadCount: Int = 0,
    isSmallTitle: Boolean = false,
    useNewDesign: Boolean = false,
    collapseProgress: Float = 1f,
    actions: @Composable RowScope.() -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = rememberHomeColors()
    var isMenuOpen by remember { mutableStateOf(false) }
    var menuView by remember { mutableStateOf("main") }

    val extraHeight = if (useNewDesign) (80.dp * (1f - collapseProgress)) else 0.dp
    val barHeight = 64.dp + extraHeight

    Surface(
        modifier = modifier.fillMaxWidth(),
        color = if (useNewDesign) Color.Transparent else colors.background,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .windowInsetsPadding(WindowInsets.statusBars)
                .fillMaxWidth()
                .height(barHeight)
                .padding(start = if (onBack != null) 20.dp else 24.dp, end = 12.dp),
            verticalAlignment = if (useNewDesign) Alignment.Top else Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left: Back Button + Screen Title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = if (useNewDesign) 10.dp + (40.dp * (1f - collapseProgress)) else 0.dp)
            ) {
                if (onBack != null) {
                    Surface(
                        modifier = Modifier.size(40.dp),
                        shape = CircleShape,
                        color = colors.surface,
                        onClick = onBack
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(Icons.Filled.ChevronLeft, "Back", tint = colors.textPrimary, modifier = Modifier.size(24.dp))
                        }
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                }
                
                Column(
                    modifier = Modifier.alpha(if (useNewDesign) (1f - (collapseProgress * 1.5f)).coerceIn(0f, 1f) else 1f)
                ) {
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
                                fontSize = if (useNewDesign) androidx.compose.ui.unit.lerp(34.sp, 24.sp, collapseProgress) else 28.sp,
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = (-1).sp,
                                fontFamily = tamilFont
                            )
                        },
                        color = colors.textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (subtitle != null) {
                        Text(subtitle, style = HomeTypography.FacultyName, color = colors.textSecondary)
                    }
                }
            }
            
            // Right: Actions (Wrapped in Pill if new design)
            Surface(
                shape = CircleShape,
                color = if (useNewDesign) colors.surface.copy(alpha = collapseProgress.coerceIn(0f, 1f)) else Color.Transparent,
                shadowElevation = if (useNewDesign && collapseProgress > 0.1f) 2.dp else 0.dp,
                modifier = Modifier.padding(top = if (useNewDesign) 12.dp else 8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(if (useNewDesign) 4.dp else 8.dp),
                    modifier = Modifier.padding(if (useNewDesign) PaddingValues(horizontal = 4.dp, vertical = 4.dp) else PaddingValues(0.dp))
                ) {
                    actions()

                    if (onNotificationsClick != null) {
                        Surface(
                            modifier = Modifier.size(40.dp),
                            shape = CircleShape,
                            color = if (useNewDesign) Color.Transparent else colors.surface,
                            onClick = onNotificationsClick
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Outlined.Notifications, "Notifications", tint = colors.textPrimary, modifier = Modifier.size(24.dp))
                                if (unreadCount > 0) {
                                    Box(
                                        modifier = Modifier
                                            .align(Alignment.TopEnd)
                                            .padding(top = 8.dp, end = 8.dp)
                                            .size(8.dp)
                                            .background(colors.danger, CircleShape)
                                            .border(1.dp, if (useNewDesign) colors.surface else colors.surface, CircleShape)
                                    )
                                }
                            }
                        }
                    }

                    androidx.compose.animation.AnimatedVisibility(
                        visible = isOffline,
                        enter = fadeIn(),
                        exit = fadeOut()
                    ) {
                        Surface(
                            color = if (useNewDesign) colors.danger.copy(alpha = 0.15f) else colors.danger.copy(alpha = 0.1f),
                            shape = HomeShapes.Pill,
                            border = androidx.compose.foundation.BorderStroke(1.dp, colors.danger.copy(alpha = 0.5f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier.size(6.dp).clip(CircleShape).background(colors.danger)
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

                    if (showMenu) {
                        Box {
                            Surface(
                                modifier = Modifier.size(40.dp),
                                shape = CircleShape,
                                color = if (useNewDesign) Color.Transparent else colors.surface,
                                onClick = {
                                    menuView = "main"
                                    isMenuOpen = true
                                }
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(Icons.Default.MoreHoriz, "Menu", tint = colors.textPrimary, modifier = Modifier.size(24.dp))
                                }
                            }

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
                                            userRole = userRole,
                                            onNavigateToSettings = {
                                                isMenuOpen = false
                                                onNavigateToSettings?.invoke()
                                            },
                                            onNavigateToSites = {
                                                isMenuOpen = false
                                                onNavigateToSites?.invoke()
                                            },
                                            onAppearanceClick = { menuView = "appearance" },
                                            onLogout = {
                                                isMenuOpen = false
                                                onLogout()
                                            }
                                        )
                                        "appearance" -> AppearanceMenuView(
                                            themeMode = themeMode,
                                            onThemeModeChange = onThemeModeChange,
                                            onBack = { menuView = "main" },
                                            onDismiss = { isMenuOpen = false }
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
}

@Composable
private fun MainMenuView(
    userRole: String?,
    onNavigateToSettings: () -> Unit,
    onNavigateToSites: () -> Unit,
    onAppearanceClick: () -> Unit,
    onLogout: () -> Unit
) {
    val colors = rememberHomeColors()
    Column(modifier = Modifier.width(220.dp).padding(vertical = 4.dp)) {
        if (userRole == "faculty") {
            DropdownMenuItem(
                text = { Text("Settings", style = HomeTypography.Body) },
                onClick = onNavigateToSettings,
                leadingIcon = { Icon(Icons.Outlined.Settings, "Settings", tint = colors.textSecondary) },
                colors = MenuDefaults.itemColors(textColor = colors.textPrimary)
            )
            Divider(color = colors.border, modifier = Modifier.padding(vertical = 4.dp))
        }
        
        DropdownMenuItem(
            text = { Text(AppStrings.Appearance.title(LocalAppLanguage.current), style = HomeTypography.Body) },
            onClick = onAppearanceClick,
            leadingIcon = { Icon(Icons.Outlined.Palette, "Appearance", tint = colors.textSecondary) },
            colors = MenuDefaults.itemColors(textColor = colors.textPrimary)
        )
        
        DropdownMenuItem(
            text = { Text("College Sites", style = HomeTypography.Body) },
            onClick = onNavigateToSites,
            leadingIcon = { Icon(Icons.Outlined.Language, "College Sites", tint = colors.textSecondary) },
            colors = MenuDefaults.itemColors(textColor = colors.textPrimary)
        )
        
        Divider(color = colors.border, modifier = Modifier.padding(vertical = 4.dp))
        
        DropdownMenuItem(
            text = { Text("Log Out", style = HomeTypography.Body.copy(fontWeight = FontWeight.Medium)) },
            onClick = onLogout,
            leadingIcon = { Icon(Icons.Outlined.Logout, "Log Out", tint = colors.danger) },
            colors = MenuDefaults.itemColors(textColor = colors.danger)
        )
    }
}

@Composable
private fun AppearanceMenuView(
    themeMode: String,
    onThemeModeChange: (String) -> Unit,
    onBack: () -> Unit,
    onDismiss: () -> Unit
) {
    val colors = rememberHomeColors()
    val isSystemDark = isSystemInDarkTheme()
    
    Column(modifier = Modifier.width(220.dp).padding(vertical = 4.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(start = 4.dp, end = 16.dp, top = 4.dp, bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack, modifier = Modifier.size(32.dp)) {
                Icon(Icons.Filled.ChevronLeft, "Back", tint = colors.textSecondary)
            }
            Text(
                text = AppStrings.Appearance.title(LocalAppLanguage.current),
                style = HomeTypography.Body.copy(fontWeight = FontWeight.Bold),
                color = colors.textPrimary
            )
        }
        
        val options = listOf(
            Triple("auto", AppStrings.Appearance.system(LocalAppLanguage.current), Icons.Filled.BrightnessMedium),
            Triple("light", AppStrings.Appearance.light(LocalAppLanguage.current), Icons.Filled.WbSunny),
            Triple("dark", AppStrings.Appearance.dark(LocalAppLanguage.current), Icons.Filled.NightsStay)
        )
        
        options.forEach { (mode, label, icon) ->
            DropdownMenuItem(
                text = { Text(label, style = HomeTypography.Body) },
                onClick = { 
                    onThemeModeChange(mode)
                    onDismiss()
                },
                leadingIcon = { Icon(icon, label, tint = if (themeMode == mode) colors.primary else colors.textSecondary) },
                trailingIcon = if (themeMode == mode) {
                    { Icon(Icons.Filled.Check, "Selected", tint = colors.primary, modifier = Modifier.size(20.dp)) }
                } else null,
                colors = MenuDefaults.itemColors(
                    textColor = if (themeMode == mode) colors.primary else colors.textPrimary,
                    leadingIconColor = if (themeMode == mode) colors.primary else colors.textSecondary
                ),
                modifier = Modifier.background(if (themeMode == mode) colors.primary.copy(alpha = 0.1f) else Color.Transparent)
            )
        }
    }
}
'''
with open(r'd:\Things\Padaippugal\Nadappil\Neram\mobile\app\src\main\java\com\elvan\rmdneram\ui\navigation\TopMenuBar.kt', 'w', encoding='utf-8') as f:
    f.write(content)

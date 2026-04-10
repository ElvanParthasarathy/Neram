package com.elvan.rmdneram.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppFontFamily
import androidx.compose.foundation.gestures.*
import androidx.compose.ui.input.pointer.*
import androidx.compose.foundation.interaction.MutableInteractionSource

/**
 * Standard Material 3 Bottom Navigation Bar with Slide-to-Switch Gesture
 * 
 * Uses the default Android NavigationBar component but wraps it in a 
 * gesture detector to allow swiping across tabs.
 */
@Composable
fun BottomNavBar(
    selectedTab: NavTab?,
    onTabSelected: (NavTab, Boolean) -> Unit,
    onInteraction: (Boolean) -> Unit = {},
    onDragProgress: (Float) -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = rememberHomeColors()
    val tabs = NavTab.entries
    val lang = LocalAppLanguage.current
    val selectedIndex = tabs.indexOf(selectedTab).coerceAtLeast(0)
    
    // Wrapper Box for Gesture Detection (Gesture logic removed for simple tap)
    Box(
        modifier = modifier
            .fillMaxWidth()
    ) {
        // Standard Material 3 NavigationBar
        NavigationBar(
            modifier = Modifier.fillMaxWidth(),
            containerColor = colors.background,
            contentColor = colors.textPrimary,
            tonalElevation = 0.dp
        ) {
            tabs.forEachIndexed { index, tab ->
                val isSelected = index == selectedIndex
                
                NavigationBarItem(
                    selected = isSelected,
                    onClick = { onTabSelected(tab, false) },
                    icon = {
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.label
                        )
                    },
                    label = {
                        Text(
                            text = when(tab) {
                                NavTab.Home -> AppStrings.Nav.home(lang)
                                NavTab.Schedule -> AppStrings.Nav.schedule(lang)
                                NavTab.Calendar -> AppStrings.Nav.calendar(lang)
                                NavTab.Notes -> AppStrings.Nav.notes(lang)
                            },
                            fontSize = 12.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontFamily = LocalAppFontFamily.current
                        )
                    },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = colors.accent,
                        selectedTextColor = colors.accent,
                        unselectedIconColor = colors.textSecondary,
                        unselectedTextColor = colors.textSecondary,
                        indicatorColor = colors.accent.copy(alpha = 0.15f)
                    )
                )
            }
        }
    }
}

package com.elvan.neram.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.NavigationRailItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.home.rememberHomeColors
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.theme.LocalAppFontFamily

/**
 * Standard Material 3 Navigation Rail for Landscape orientation
 */
@Composable
fun SideNavRail(
    selectedTab: NavTab?,
    onTabSelected: (NavTab, Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = rememberHomeColors()
    val tabs = NavTab.entries
    val lang = LocalAppLanguage.current
    val selectedIndex = tabs.indexOf(selectedTab).coerceAtLeast(0)
    
    NavigationRail(
        modifier = modifier.fillMaxHeight(),
        containerColor = colors.background,
        contentColor = colors.textPrimary,
        windowInsets = WindowInsets(0, 0, 0, 0) // Explicitly zero out default insets as MainScreen handles them
    ) {
        Spacer(Modifier.weight(1f)) // Center items vertically
        tabs.forEachIndexed { index, tab ->
            val isSelected = index == selectedIndex
            
            NavigationRailItem(
                selected = isSelected,
                onClick = { onTabSelected(tab, false) },
                icon = {
                    Icon(
                        imageVector = tab.icon,
                        contentDescription = tab.getLocalizedLabel(lang)
                    )
                },
                label = {
                    Text(
                        text = tab.getLocalizedLabel(lang),
                        fontSize = 11.sp,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                        fontFamily = LocalAppFontFamily.current
                    )
                },
                colors = NavigationRailItemDefaults.colors(
                    selectedIconColor = colors.accent,
                    selectedTextColor = colors.accent,
                    unselectedIconColor = colors.textSecondary,
                    unselectedTextColor = colors.textSecondary,
                    indicatorColor = colors.accent.copy(alpha = 0.15f)
                )
            )
        }
        Spacer(Modifier.weight(1f))
    }
}

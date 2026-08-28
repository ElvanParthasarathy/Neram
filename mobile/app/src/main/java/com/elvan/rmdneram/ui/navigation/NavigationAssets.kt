package com.elvan.rmdneram.ui.navigation

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.adamglin.PhosphorIcons
import com.adamglin.phosphoricons.Regular
import com.adamglin.phosphoricons.Fill
import com.adamglin.phosphoricons.regular.*
import com.adamglin.phosphoricons.fill.*

// CSS Color Constants matched to mobile.css
object NavColors {
    // Light Mode
    val LightAccent = Color(0xFF007AFF)
    val LightTextSecondary = Color(0xFF6B7280)
    val LightNavSelection = Color(0x0D000000) // rgba(0,0,0,0.05) -> 5%
    
    // Dark Mode
    val DarkAccent = Color(0xFF0A84FF)
    val DarkTextSecondary = Color(0xFF9CA3AF)
    val DarkNavSelection = Color(0xE62C2C2E) // rgba(44,44,46,0.9)
}

enum class NavTab(
    val icon: ImageVector,
    val activeIcon: ImageVector,
    val label: String
) {
    Home(
        icon = PhosphorIcons.Regular.House,
        activeIcon = PhosphorIcons.Fill.House,
        label = "Home"
    ),
    Schedule(
        icon = PhosphorIcons.Regular.Clock,
        activeIcon = PhosphorIcons.Fill.Clock,
        label = "Schedule"
    ),
    Calendar(
        icon = PhosphorIcons.Regular.CalendarBlank,
        activeIcon = PhosphorIcons.Fill.CalendarBlank,
        label = "Calendar"
    ),
    Notes(
        icon = PhosphorIcons.Regular.Notebook,
        activeIcon = PhosphorIcons.Fill.Notebook,
        label = "Notes"
    )
}

object CustomIcons {
    val Home: ImageVector get() = PhosphorIcons.Regular.House
    val Clock: ImageVector get() = PhosphorIcons.Regular.Clock
    val Calendar: ImageVector get() = PhosphorIcons.Regular.CalendarBlank
    val Book: ImageVector get() = PhosphorIcons.Regular.Notebook
}

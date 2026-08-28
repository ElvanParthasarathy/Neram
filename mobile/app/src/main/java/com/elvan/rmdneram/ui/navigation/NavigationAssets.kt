package com.elvan.rmdneram.ui.navigation

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

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
        icon = MaterialSymbols.Rounded.Home,
        activeIcon = MaterialSymbols.Rounded.HomeFill,
        label = "Home"
    ),
    Schedule(
        icon = MaterialSymbols.Rounded.Schedule,
        activeIcon = MaterialSymbols.Rounded.ScheduleFill,
        label = "Schedule"
    ),
    Calendar(
        icon = MaterialSymbols.Rounded.Calendar,
        activeIcon = MaterialSymbols.Rounded.CalendarFill,
        label = "Calendar"
    ),
    Notes(
        icon = MaterialSymbols.Rounded.Notes,
        activeIcon = MaterialSymbols.Rounded.NotesFill,
        label = "Notes"
    )
}

object CustomIcons {
    val Home: ImageVector get() = MaterialSymbols.Rounded.Home
    val Clock: ImageVector get() = MaterialSymbols.Rounded.Schedule
    val Calendar: ImageVector get() = MaterialSymbols.Rounded.Calendar
    val Book: ImageVector get() = MaterialSymbols.Rounded.Notes
}

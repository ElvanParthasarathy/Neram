package com.elvan.neram.ui.navigation

import androidx.compose.ui.graphics.vector.ImageVector

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

package com.elvan.neram.ui.navigation

import androidx.compose.ui.graphics.vector.ImageVector
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

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
    );

    fun getLocalizedLabel(lang: String): String = when (this) {
        Home -> K.home.tr(lang)
        Schedule -> K.schedule.tr(lang)
        Calendar -> K.calendar.tr(lang)
        Notes -> K.notes.tr(lang)
    }
}

object CustomIcons {
    val Home: ImageVector get() = MaterialSymbols.Rounded.Home
    val Clock: ImageVector get() = MaterialSymbols.Rounded.Schedule
    val Calendar: ImageVector get() = MaterialSymbols.Rounded.Calendar
    val Book: ImageVector get() = MaterialSymbols.Rounded.Notes
}

package com.elvan.rmdneram.ui.navigation

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

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

enum class NavTab(val icon: ImageVector, val label: String) {
    Home(CustomIcons.Home, "Home"),
    Schedule(CustomIcons.Clock, "Schedule"),
    Calendar(CustomIcons.Calendar, "Calendar"),
    Notes(CustomIcons.Book, "Notes")
}

object CustomIcons {
    // 2. HOME
    val Home: ImageVector
        get() = ImageVector.Builder(
            name = "Home",
            defaultWidth = 24.dp, defaultHeight = 24.dp,
            viewportWidth = 24f, viewportHeight = 24f
        ).addPath(
            fill = SolidColor(Color.Black),
            pathData = androidx.compose.ui.graphics.vector.PathParser().parsePathString(
                "M21.71,11.29l-9-9a1,1,0,0,0-1.42,0l-9,9a1,1,0,0,0-.21,1.09A1,1,0,0,0,3,13H4v7.3A1.77,1.77,0,0,0,5.83,22H8.5a1,1,0,0,0,1-1V16.1a1,1,0,0,1,1-1h3a1,1,0,0,1,1,1V21a1,1,0,0,0,1,1h2.67A1.77,1.77,0,0,0,20,20.3V13h1a1,1,0,0,0,.92-.62A1,1,0,0,0,21.71,11.29Z"
            ).toNodes()
        ).build()

    // 3. CLOCK (Schedule)
    val Clock: ImageVector
        get() = ImageVector.Builder(
            name = "Clock",
            defaultWidth = 24.dp, defaultHeight = 24.dp,
            viewportWidth = 24f, viewportHeight = 24f
        ).addPath(
            fill = SolidColor(Color.Black),
            pathFillType = androidx.compose.ui.graphics.PathFillType.EvenOdd,
            pathData = androidx.compose.ui.graphics.vector.PathParser().parsePathString(
                "M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm11-5a1 1 0 1 0-2 0v3.764a3 3 0 0 0 1.658 2.683l2.895 1.447a1 1 0 1 0 .894-1.788l-2.894-1.448a1 1 0 0 1-.553-.894V7z"
            ).toNodes()
        ).build()

    // 4. CALENDAR
    val Calendar: ImageVector
        get() = ImageVector.Builder(
            name = "Calendar",
            defaultWidth = 24.dp, defaultHeight = 24.dp,
            viewportWidth = 24f, viewportHeight = 24f
        ).addPath(
            fill = SolidColor(Color.Black),
            pathData = androidx.compose.ui.graphics.vector.PathParser().parsePathString(
                "M22 14V12C22 11.161 22 10.4153 21.9871 9.75H2.0129C2 10.4153 2 11.161 2 12V14C2 17.7712 2 19.6569 3.17157 20.8284C4.34315 22 6.22876 22 10 22H14C17.7712 22 19.6569 22 20.8284 20.8284C22 19.6569 22 17.7712 22 14Z"
            ).toNodes()
        ).addPath(
            fill = SolidColor(Color.Black),
            pathData = androidx.compose.ui.graphics.vector.PathParser().parsePathString(
                "M7.75 2.5C7.75 2.08579 7.41421 1.75 7 1.75C6.58579 1.75 6.25 2.08579 6.25 2.5V4.07926C4.81067 4.19451 3.86577 4.47737 3.17157 5.17157C2.47737 5.86577 2.19451 6.81067 2.07926 8.25H21.9207C21.8055 6.81067 21.5226 5.86577 20.8284 5.17157C20.1342 4.47737 19.1893 4.19451 17.75 4.0129V2.5C17.75 2.08579 17.4142 1.75 17 1.75C16.5858 1.75 16.25 2.08579 16.25 2.5V4.0129C15.5847 4 14.839 4 14 4H10C9.16097 4 8.41527 4 7.75 4.0129V2.5Z"
            ).toNodes()
        ).build()

    // 5. USER (Profile)
    val User: ImageVector
        get() = ImageVector.Builder(
            name = "User",
            defaultWidth = 24.dp, defaultHeight = 24.dp,
            viewportWidth = 24f, viewportHeight = 24f
        ).addPath(
            fill = SolidColor(Color.Black),
            pathFillType = androidx.compose.ui.graphics.PathFillType.EvenOdd,
            pathData = androidx.compose.ui.graphics.vector.PathParser().parsePathString(
                "M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
            ).toNodes()
        ).build()

    // 6. BOOK (Resources)
    val Book: ImageVector
        get() = ImageVector.Builder(
            name = "Book",
            defaultWidth = 24.dp, defaultHeight = 24.dp,
            viewportWidth = 24f, viewportHeight = 24f
        ).addPath(
            fill = SolidColor(Color.Black),
            pathData = androidx.compose.ui.graphics.vector.PathParser().parsePathString(
                "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"
            ).toNodes()
        ).build()
}

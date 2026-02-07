package com.elvan.rmdneram.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import kotlinx.coroutines.launch
import androidx.compose.foundation.rememberScrollState
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*

import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.automirrored.outlined.List
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.clickable
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.RectangleShape
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.rmdneram.ui.home.HomeScreen
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
import com.elvan.rmdneram.ui.theme.AppStrings
import androidx.compose.runtime.CompositionLocalProvider
import com.elvan.rmdneram.ui.navigation.TopMenuBar
import com.elvan.rmdneram.ui.navigation.BottomNavBar
import com.elvan.rmdneram.ui.navigation.SecondaryTopBar
import com.elvan.rmdneram.ui.navigation.NavTab
import com.elvan.rmdneram.ui.schedule.ScheduleScreen
import com.elvan.rmdneram.ui.profile.ProfileScreen
import com.elvan.rmdneram.ui.profile.HomeProfileScreen
import com.elvan.rmdneram.ui.screens.CollegeSitesScreen
import com.elvan.rmdneram.ui.screens.ContactScreen
import com.elvan.rmdneram.ui.screens.SettingsScreen
import com.elvan.rmdneram.ui.screens.DisplaySettingsScreen
import com.elvan.rmdneram.ui.screens.SecuritySettingsScreen
import com.elvan.rmdneram.ui.screens.ComplaintScreen
import com.elvan.rmdneram.ui.screens.DeveloperInfoScreen
import com.elvan.rmdneram.ui.screens.AboutAppScreen
import com.elvan.rmdneram.ui.screens.StorageSettingsScreen
import com.elvan.rmdneram.ui.screens.StorageSettingsScreen
import com.elvan.rmdneram.ui.screens.LanguageSettingsScreen
import com.elvan.rmdneram.ui.screens.UserDirectoryScreen
import com.elvan.rmdneram.ui.home.HomeViewModel
import com.elvan.rmdneram.ui.calendar.CalendarViewType
import java.time.format.TextStyle
import java.util.Locale
import androidx.compose.ui.res.painterResource
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ViewAgenda



/**
 * Main Screen with Bottom Navigation
 * Contains all tabs: Home, Schedule, Calendar + Profile
 */
@Composable
fun MainScreen(
    onLogout: () -> Unit = {},
    mainViewModel: MainViewModel = viewModel(),
    homeViewModel: HomeViewModel = viewModel()
) {
    var selectedTab by remember { mutableStateOf(NavTab.Home) }
    var currentScreen by remember { mutableStateOf("tabs") } // "tabs", "profile", "sites", "contact", "settings", "security", "admin", "pdf_viewer"
    var selectedPdfUrl by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    
    // Hoist Settings Scroll State to preserve position
    val settingsScrollState = rememberScrollState()
    
    // Track where we came from for Profile screen (Tabs/Home or Settings)
    var profileReferrer by remember { mutableStateOf("tabs") }
    // Track where we came from for Settings screen (Tabs/Home or Profile)
    var settingsReferrer by remember { mutableStateOf("tabs") }

    // Reset settings scroll when entering from tabs (not from sub-settings)
    // Removed LaunchedEffect here - handled imperatively in TopMenuBar callback

    
    val uiState by mainViewModel.uiState.collectAsState()
    val homeUiState by homeViewModel.uiState.collectAsState()
    val calendarCurrentMonth by homeViewModel.currentMonth.collectAsState()
    val calendarView by homeViewModel.calendarView.collectAsState()
    val colors = rememberHomeColors()
    
    // Get effective language code
    val context = androidx.compose.ui.platform.LocalContext.current
    val effectiveLanguage = remember(uiState.languageCode) {
        AppStrings.getEffectiveLanguage(uiState.languageCode, context)
    }
    
    // Global Back Handler
    BackHandler(enabled = currentScreen != "tabs" || selectedTab != NavTab.Home) {
        if (currentScreen != "tabs") {
            when (currentScreen) {
                "security" -> currentScreen = "settings"
                "display" -> currentScreen = "settings"

                "settings" -> currentScreen = settingsReferrer
                "storage" -> currentScreen = "settings"
                "contact" -> currentScreen = "settings"
                "complaint" -> currentScreen = "settings"
                "developer" -> currentScreen = "settings"
                "developer" -> currentScreen = "settings"
                "language" -> currentScreen = "settings"
                "about_app" -> currentScreen = "settings"
                "calendar_settings" -> currentScreen = "settings"
                "user_directory" -> currentScreen = "settings"
                "view_profile" -> currentScreen = "tabs"
                "profile" -> currentScreen = "settings"
                "neram_calendar" -> currentScreen = "settings"
                else -> currentScreen = "tabs" // sites -> tabs
            }
        } else {
            // In tabs, but not Home -> Go to Home
            selectedTab = NavTab.Home
        }
    }
    
    // Navigation Hierarchy Helper
    fun getScreenLevel(screen: String): Int {
        return when (screen) {
            "tabs" -> 0
            "view_profile", "sites", "contact", "settings" -> 1
            "profile" -> 2 // Deep nested from Settings
            else -> 2 // security, display, storage, complaint, developer, calendar_settings, user_directory, neram_calendar
        }
    }
    
    // Screen Title Helper
    fun getScreenTitle(screen: String): String {
        return when (screen) {
            "settings" -> "Settings"
            "view_profile" -> "Profile"
            "profile" -> "Edit Profile"
            "sites" -> "Important Sites"
            "contact" -> "Contact"
            "security" -> "Security"
            "display" -> "Display"
            "storage" -> "Storage & Data"
            "complaint" -> "Feedback"
            "developer" -> "About Developer"
            "language" -> "Language"
            "calendar_settings" -> "Calendar Settings"
            "user_directory" -> "User Directory"
            "pdf_viewer" -> "Document"
            else -> ""
        }
    }

    var isNavInteracting by remember { mutableStateOf(false) }
    var isDragTransition by remember { mutableStateOf(false) }
    var navDragProgress by remember { mutableFloatStateOf(0f) }

    // Sync progress with selection when not interacting
    LaunchedEffect(selectedTab) {
        if (!isNavInteracting) navDragProgress = selectedTab.ordinal.toFloat()
    }


    // Sync progress with selection when not interacting
    LaunchedEffect(selectedTab) {
        if (!isNavInteracting) navDragProgress = selectedTab.ordinal.toFloat()
    }



    // Provide language to all children
    CompositionLocalProvider(LocalAppLanguage provides effectiveLanguage) {
        // Wrapper Box - contains main content + navigation bar scrim
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.background)
        ) {
        // Main Content Box - padding only when BottomNavBar is visible
        Box(
            modifier = Modifier
                .fillMaxSize()
        ) {
        
        // Content is full screen (same size), no padding constraints
        // Screen Content with Expressive Shared Axis X Animation
        
        // Hoisted State for Pull to Refresh (Home Tab)
        val homePullRefreshState = androidx.compose.material3.pulltorefresh.rememberPullToRefreshState()
        val schedulePullRefreshState = androidx.compose.material3.pulltorefresh.rememberPullToRefreshState() // Hoisted Schedule State
        
        AnimatedContent(
            targetState = currentScreen,
            transitionSpec = {
                val initialLevel = getScreenLevel(initialState)
                val targetLevel = getScreenLevel(targetState)
                 
                // Hierarchical Navigation (Forward/Backward)
                if (initialLevel != targetLevel) {
                    val isForward = targetLevel > initialLevel
                    if (isForward) {
                        // Enter: Slide In from Right (Android 12 Style: Smooth)
                        // Exit: Freeze Background (Hold)
                         slideIntoContainer(
                             towards = AnimatedContentTransitionScope.SlideDirection.Left,
                             animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioNoBouncy)
                         ) togetherWith 
                         fadeOut(targetAlpha = 0.9f, animationSpec = tween(durationMillis = 50)) // Keep mostly opaque
                    } else {
                        // Back: Slide Out to Right
                        // Enter: Freeze Background (Hold)
                        fadeIn(initialAlpha = 0.9f) togetherWith 
                        slideOutOfContainer(
                            towards = AnimatedContentTransitionScope.SlideDirection.Right,
                            animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioNoBouncy)
                        )
                    }
                } else {
                    // Peer Navigation (if any) or Default: Fade Through
                    com.elvan.rmdneram.ui.theme.Transitions.fadeThrough()
                }
            },
            modifier = Modifier
                .fillMaxSize()
        ) { screen ->
            when (screen) {
                "tabs" -> {
                    // Apply Navigation Bar Padding ONLY to Tabs Screen
                    Box(modifier = Modifier.fillMaxSize().windowInsetsPadding(WindowInsets.navigationBars)) {
                        // Standard Tab Navigation (No Slider/Swipe)
                        when (selectedTab) {
                            NavTab.Home -> HomeScreen(
                                onLogout = onLogout, 
                                isOffline = uiState.isOffline, 
                                userProfile = uiState.userProfile,
                                onProfileClick = {
                                    currentScreen = "view_profile" // Use Read-Only Screen
                                },
                                pullRefreshState = homePullRefreshState
                            )
                            NavTab.Schedule -> ScheduleScreen(
                                pullRefreshState = schedulePullRefreshState
                            )
                            NavTab.Calendar -> com.elvan.rmdneram.ui.calendar.CalendarScreen(
                                viewModel = homeViewModel,
                                onNavigateToPdf = { url ->
                                    selectedPdfUrl = url
                                    currentScreen = "pdf_viewer"
                                }
                            )
                            NavTab.Notes -> com.elvan.rmdneram.ui.notes.NotesScreen(onBack = { selectedTab = NavTab.Home }) 
                        }
                    }
                }
                "view_profile" -> HomeProfileScreen(
                    homeViewModel = homeViewModel,
                    onBack = { currentScreen = "tabs" }
                )
                "profile" -> ProfileScreen( // Editable Profile from Settings
                    onBack = { currentScreen = "settings" },
                    homeViewModel = homeViewModel
                )
                "sites" -> CollegeSitesScreen(onBack = { currentScreen = "tabs" })
                "contact" -> ContactScreen(
                    onBack = { currentScreen = "tabs" },
                    onSendMessage = { mainViewModel.sendMessage(it) }
                )
                "settings" -> SettingsScreen(
                    userRole = uiState.userProfile?.role,
                    userProfile = uiState.userProfile,
                    onBack = { currentScreen = settingsReferrer },
                    onNavigateToProfile = { 
                        currentScreen = "profile" 
                    },
                    onNavigateToSecurity = { currentScreen = "security" },
                    onNavigateToDisplay = { currentScreen = "display" },
                    onNavigateToComplaint = { currentScreen = "complaint" },
                    onNavigateToDeveloper = { currentScreen = "developer" },
                    onNavigateToStorage = { currentScreen = "storage" },
                    onNavigateToLanguage = { currentScreen = "language" },
                    onNavigateToCalendarSettings = { currentScreen = "calendar_settings" },
                    onNavigateToUserDirectory = { currentScreen = "user_directory" },
                    onNavigateToAboutApp = { currentScreen = "about_app" },
                    scrollState = settingsScrollState
                )
                "security" -> SecuritySettingsScreen(onBack = { currentScreen = "settings" })
                "display" -> DisplaySettingsScreen(
                    currentTheme = uiState.themeMode,
                    onThemeChange = { mainViewModel.setThemeMode(it) },
                    onBack = { currentScreen = "settings" }
                )
                "complaint" -> ComplaintScreen(
                    isOffline = uiState.isOffline, 
                    onBack = { currentScreen = "settings" },
                    onSendMessage = { mainViewModel.sendMessage(it) }
                )
                "developer" -> DeveloperInfoScreen(onBack = { currentScreen = "settings" })
                "about_app" -> AboutAppScreen(onBack = { currentScreen = "settings" })
                "storage" -> StorageSettingsScreen(
                    onCleanupClick = { homeViewModel.cleanupStorage() },
                    onCleanupRangeClick = { start, end -> homeViewModel.cleanupStorageRange(start, end) },
                    isOffline = uiState.isOffline,
                    onBack = { currentScreen = "settings" }
                )
                "language" -> LanguageSettingsScreen(
                    currentLanguage = uiState.languageCode,
                    onLanguageChange = { mainViewModel.setLanguage(it) },
                    onBack = { currentScreen = "settings" }
                )
                "calendar_settings" -> com.elvan.rmdneram.ui.screens.CalendarSettingsScreen(
                    onBack = { currentScreen = "settings" }
                )
                "user_directory" -> UserDirectoryScreen(
                    onBack = { currentScreen = "settings" }
                )
                "pdf_viewer" -> com.elvan.rmdneram.ui.screens.PdfViewerScreen(
                    url = selectedPdfUrl,
                    onBack = { currentScreen = "tabs" },
                    colors = colors
                )
            }
        }
        
        // Grey Frame Overlay - Sits ON TOP of content
        // Creates the visual "margin" without changing the content layout size
        val density = androidx.compose.ui.platform.LocalDensity.current
        val bottomMargin = with(density) {
            val navBarHeight = WindowInsets.navigationBars.getBottom(this).toFloat()
            if (currentScreen == "tabs") (80.dp.toPx() + navBarHeight) else (12.dp.toPx() + navBarHeight)
        }
        
        // Canvas now applies to ALL screens including settings
        val statusBarHeight = WindowInsets.statusBars.getTop(density).toFloat()
        androidx.compose.foundation.Canvas(
            modifier = Modifier.fillMaxSize()
        ) {
            val cornerRadius = 24.dp.toPx() // Matches HomeDimens.ItemRadius
            val topMargin = statusBarHeight + 64.dp.toPx() // Match dynamic TopMenuBar position
            val sideMargin = 12.dp.toPx()
            
            // Outer rectangle (Whole Screen)
            val outerPath = androidx.compose.ui.graphics.Path().apply {
                addRect(androidx.compose.ui.geometry.Rect(0f, 0f, size.width, size.height))
            }
            
            // Inner rectangle (The "Hole" / Content Area)
            val innerPath = androidx.compose.ui.graphics.Path().apply {
                addRoundRect(
                    androidx.compose.ui.geometry.RoundRect(
                        rect = androidx.compose.ui.geometry.Rect(
                            left = sideMargin,
                            top = topMargin,
                            right = size.width - sideMargin,
                            bottom = size.height - bottomMargin
                        ),
                        cornerRadius = androidx.compose.ui.geometry.CornerRadius(cornerRadius)
                    )
                )
            }
            
            // Subtract Inner from Outer to create the Frame
            val framePath = androidx.compose.ui.graphics.Path.combine(
                androidx.compose.ui.graphics.PathOperation.Difference,
                outerPath,
                innerPath
            )
            
            // Draw the Grey Frame
            drawPath(
                path = framePath,
                color = colors.background
            )
        }
        
        // Status Bar Scrim (Opaque) - Always needed now
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .windowInsetsTopHeight(WindowInsets.statusBars)
                .background(colors.background)
        )
        
        if (currentScreen == "tabs") {
            val title = when(selectedTab) {
                NavTab.Home -> "Neram"
                NavTab.Schedule -> "Schedule"
                NavTab.Calendar -> "Calendar"
                NavTab.Notes -> "Notes"
            }
            
            TopMenuBar(
                title = title,
                onLogout = onLogout,
                userRole = uiState.userProfile?.role,
                themeMode = uiState.themeMode,
                onThemeModeChange = { mainViewModel.setThemeMode(it) },
                onNavigateToSettings = { 
                    settingsReferrer = "tabs"
                    currentScreen = "settings" 
                    scope.launch { settingsScrollState.scrollTo(0) }
                },
                onNavigateToSites = { currentScreen = "sites" },
                isOffline = uiState.isOffline,
                showMenu = selectedTab != NavTab.Calendar, // Hide Menu on Calendar Screen
                actions = {
                    if (selectedTab == NavTab.Calendar) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(16.dp), // Increased spacing
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(end = 12.dp) // Align with standard 3-dot menu margin
                        ) {
                            // Month View Icon
                            IconButton(
                                onClick = { homeViewModel.setCalendarView(com.elvan.rmdneram.ui.calendar.CalendarViewType.MONTH) },
                                modifier = Modifier.size(32.dp) // Standard touch target
                            ) {
                                Icon(
                                    painter = painterResource(id = com.elvan.rmdneram.R.drawable.ic_month_view_custom),
                                    contentDescription = "Month View",
                                    tint = colors.textPrimary, // Monochrome
                                    modifier = Modifier.size(22.dp)
                                )
                            }

                            // List/Schedule View Icon
                            IconButton(
                                onClick = { homeViewModel.setCalendarView(com.elvan.rmdneram.ui.calendar.CalendarViewType.SCHEDULE) },
                                modifier = Modifier.size(32.dp)
                            ) {
                                Icon(
                                    painter = painterResource(id = com.elvan.rmdneram.R.drawable.ic_list_view_custom),
                                    contentDescription = "List View",
                                    tint = colors.textPrimary, // Monochrome
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            
                            // Today Icon (Monochrome Outline Squircle)
                            val today = java.time.LocalDate.now()
                            Box(
                                modifier = Modifier
                                    .size(24.dp) // Slightly smaller than 28dp to look balanced
                                    .clip(RoundedCornerShape(6.dp))
                                    .border(1.5.dp, colors.textPrimary, RoundedCornerShape(6.dp)) // Monochrome Border
                                    .clickable { 
                                         homeViewModel.triggerCalendarJump(today)
                                         homeViewModel.updateSelectedDate(today)
                                         homeViewModel.updateCurrentMonth(java.time.YearMonth.now())
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = today.dayOfMonth.toString(),
                                    color = colors.textPrimary, // Monochrome Text
                                    fontSize = 11.sp,
                                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                                    modifier = Modifier.offset(y = (-0.5).dp)
                                )
                            }
                        }
                    }
                },
                modifier = Modifier.align(Alignment.TopCenter)
            )
            
            // GLOBAL PULL TO REFRESH INDICATOR (Hoisted above Top Bar)
            // Rendered only when Home OR Schedule tab is active and visible
            if (currentScreen == "tabs") {
                if (selectedTab == NavTab.Home) {
                    val fraction = homePullRefreshState.distanceFraction
                    val isRefreshing = homeUiState.isSyncing
                    
                    val targetOffset = if (isRefreshing) com.elvan.rmdneram.ui.home.HomeAnimations.PullRefresh.RefreshingOffset else (fraction * com.elvan.rmdneram.ui.home.HomeAnimations.PullRefresh.MaxOffset).coerceIn(0f, com.elvan.rmdneram.ui.home.HomeAnimations.PullRefresh.MaxOffset)
                    
                    val animatedOffset by animateFloatAsState(
                        targetValue = targetOffset,
                        label = "offset"
                    )

                    if (isRefreshing || fraction > 0f) {
                         com.elvan.rmdneram.ui.components.ExpressiveRefreshIndicator(
                             isRefreshing = isRefreshing,
                             fraction = fraction,
                             colors = colors,
                             animatedOffset = animatedOffset,
                             modifier = Modifier.align(Alignment.TopCenter)
                         )
                    }
                } else if (selectedTab == NavTab.Schedule) {
                    val fraction = schedulePullRefreshState.distanceFraction
                    val isRefreshing = homeUiState.isSyncing // Share sync state for now

                    val targetOffset = if (isRefreshing) com.elvan.rmdneram.ui.home.HomeAnimations.PullRefresh.RefreshingOffset else (fraction * com.elvan.rmdneram.ui.home.HomeAnimations.PullRefresh.MaxOffset).coerceIn(0f, com.elvan.rmdneram.ui.home.HomeAnimations.PullRefresh.MaxOffset)
                    
                    val animatedOffset by animateFloatAsState(
                        targetValue = targetOffset,
                        label = "offset"
                    )

                    if (isRefreshing || fraction > 0f) {
                         com.elvan.rmdneram.ui.components.ExpressiveRefreshIndicator(
                             isRefreshing = isRefreshing,
                             fraction = fraction,
                             colors = colors,
                             animatedOffset = animatedOffset,
                             modifier = Modifier.align(Alignment.TopCenter)
                         )
                    }
                }
            }
        } // End if (currentScreen == "tabs") for TopMenuBar section
        
        // Secondary Top Bar (for Settings and other secondary screens)
        if (currentScreen != "tabs") {
            SecondaryTopBar(
                title = getScreenTitle(currentScreen),
                onBack = {
                    // Navigate back based on current screen
                    when (currentScreen) {
                        "security", "display", "storage", "complaint", "developer", 
                        "language", "calendar_settings", "user_directory", "profile" -> currentScreen = "settings"
                        "settings" -> currentScreen = settingsReferrer
                        "view_profile", "sites", "contact", "pdf_viewer" -> currentScreen = "tabs"
                        else -> currentScreen = "tabs"
                    }
                },
                modifier = Modifier.align(Alignment.TopCenter)
            )
        }
        
        // Bottom Navigation (visible only on tabs, hidden on other screens)
        if (currentScreen == "tabs") {
            BottomNavBar(
                selectedTab = selectedTab,
                onTabSelected = { tab, isDrag ->
                    isDragTransition = isDrag
                    selectedTab = tab
                },
                onInteraction = { isNavInteracting = it },
                onDragProgress = { navDragProgress = it },
                modifier = Modifier.align(Alignment.BottomCenter)
            )
        }
        } // End Main Content Box
        
        // Navigation Bar Scrim (at wrapper level) - Prevents content visibility during pull-to-refresh
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .height(WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding())
                .background(colors.background)
        )
        } // End Wrapper Box
    }
}

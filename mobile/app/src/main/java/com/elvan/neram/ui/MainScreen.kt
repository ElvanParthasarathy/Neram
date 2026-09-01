package com.elvan.neram.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.animateScrollBy
import kotlinx.coroutines.launch
import androidx.compose.foundation.rememberScrollState
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.foundation.layout.*
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.material3.*

import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.outlined.DateRange
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.rounded.Settings
import androidx.compose.material.icons.rounded.Language
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.ScrollState
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
import com.elvan.neram.ui.home.HomeScreen
import com.elvan.neram.ui.home.rememberHomeColors
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.theme.AppStrings
import androidx.compose.runtime.CompositionLocalProvider
import com.elvan.neram.ui.navigation.BottomNavBar
import com.elvan.neram.ui.navigation.NavTab
import com.elvan.neram.ui.navigation.SideNavRail
import com.elvan.neram.ui.schedule.ScheduleScreen
import com.elvan.neram.ui.profile.ProfileScreen
import android.content.res.Configuration

import com.elvan.neram.ui.about.CollegeSitesScreen
import com.elvan.neram.ui.about.ContactScreen
import com.elvan.neram.ui.settings.SettingsScreen
import com.elvan.neram.ui.settings.DisplaySettingsScreen
import com.elvan.neram.ui.settings.SecuritySettingsScreen
import com.elvan.neram.ui.settings.LinkedAccountsScreen
import com.elvan.neram.ui.about.ComplaintScreen
import com.elvan.neram.ui.about.DeveloperInfoScreen
import com.elvan.neram.ui.about.AboutAppScreen
import com.elvan.neram.ui.about.AboutRMKScreen
import com.elvan.neram.ui.about.ManagementTeamScreen
import com.elvan.neram.ui.settings.NotificationSettingsScreen
import com.elvan.neram.ui.components.shell.ElvanSubShell
import com.elvan.neram.ui.directory.UserDirectoryScreen
import com.elvan.neram.ui.home.HomeViewModel
import com.elvan.neram.ui.calendar.CalendarViewType
import java.time.format.TextStyle
import java.util.Locale
import androidx.compose.ui.res.painterResource
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ViewAgenda
import android.app.Activity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase
import android.widget.Toast

private const val WEB_CLIENT_ID = "85578742222-47qt87m4utrbatq1b8d3vju4mn2brbh2.apps.googleusercontent.com"


/**
 * Main Screen with Bottom Navigation
 * Contains all tabs: Home, Schedule, Calendar + Profile
 */
@Composable
fun MainScreen(
    activity: Activity,
    onLogout: () -> Unit = {},
    mainViewModel: MainViewModel = viewModel(),
    homeViewModel: HomeViewModel = viewModel()
) {
    var selectedTab by remember { mutableStateOf(NavTab.Home) }
    val notesViewModel: com.elvan.neram.ui.notes.NotesViewModel = viewModel()
    var currentScreen by remember { mutableStateOf("tabs") } // "tabs", "profile", "sites", "contact", "settings", "security", "admin", "pdf_viewer"
    var selectedPdfUrl by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    
    // Hoist Tab Scroll States to preserve position across tab switching, subpage navigation, and orientation
    val homeScrollState = rememberSaveable(saver = LazyListState.Saver) { LazyListState() }
    val scheduleScrollState = rememberSaveable(saver = LazyListState.Saver) { LazyListState() }
    val notesScrollState = rememberSaveable(saver = LazyListState.Saver) { LazyListState() }
    val calendarScrollState = rememberSaveable(saver = LazyListState.Saver) { LazyListState() }
    
    val activeScrollState = when(selectedTab) {
        NavTab.Home -> homeScrollState
        NavTab.Schedule -> scheduleScrollState
        NavTab.Calendar -> calendarScrollState
        NavTab.Notes -> notesScrollState
    }

    val notesMode by notesViewModel.notesMode.collectAsState()
    val notesDrivePath by notesViewModel.drivePath.collectAsState()
    val notesPath by notesViewModel.path.collectAsState()
    val notesFolderDisplay = if (notesMode == "folder") notesDrivePath.map { it.name }.drop(1) else notesPath
    val isInsideNotesFolder = notesFolderDisplay.isNotEmpty()

    var isNavInteracting by remember { mutableStateOf(false) }
    var isDragTransition by remember { mutableStateOf(false) }
    var navDragProgress by remember { mutableFloatStateOf(0f) }
    // Sync progress with selection when not interacting
    LaunchedEffect(selectedTab) {
        if (!isNavInteracting) navDragProgress = selectedTab.ordinal.toFloat()
    }

    val handleTabSelected: (NavTab, Boolean) -> Unit = { tab, isDrag ->
        if (selectedTab == tab) {
            val targetScrollState = when (tab) {
                NavTab.Home -> homeScrollState
                NavTab.Schedule -> scheduleScrollState
                NavTab.Calendar -> calendarScrollState
                NavTab.Notes -> notesScrollState
            }
            scope.launch { targetScrollState.animateScrollToItem(0, 0) }
        } else {
            val toState = when (tab) {
                NavTab.Home -> homeScrollState
                NavTab.Schedule -> scheduleScrollState
                NavTab.Calendar -> calendarScrollState
                NavTab.Notes -> notesScrollState
            }
            scope.launch { toState.scrollToItem(0, 0) }
            isDragTransition = isDrag
            selectedTab = tab
        }
    }
    
    // User Directory State (Hoisted to fix Header Z-Index/Overlay issues)
    var userDirectoryPath by remember { mutableStateOf(listOf<String>()) }
    
    // Hoist Settings Scroll State to preserve position
    val settingsScrollState = rememberSaveable(saver = androidx.compose.foundation.lazy.LazyListState.Saver) { androidx.compose.foundation.lazy.LazyListState(0, 0) }
    
    // Track where we came from for Profile screen (Tabs/Home or Settings)
    var profileReferrer by remember { mutableStateOf("tabs") }
    // Track where we came from for Settings screen (Tabs/Home or Profile)
    var settingsReferrer by remember { mutableStateOf("tabs") }
    // Track where we came from for Sub-settings screens (Settings or Home Banner)
    var subpageReferrer by remember { mutableStateOf("settings") }

    // Reset settings scroll when entering from tabs (not from sub-settings)
    // Removed LaunchedEffect here - handled imperatively in TopMenuBar callback
    
    // Google Link state and launcher - hoisted here where Activity context is GUARANTEED
    var isGoogleLinking by remember { mutableStateOf(false) }
    val context = androidx.compose.ui.platform.LocalContext.current
    
    val googleLinkLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
            try {
                val account = task.getResult(ApiException::class.java)
                account?.idToken?.let { idToken ->
                    scope.launch {
                        try {
                            val credential = GoogleAuthProvider.getCredential(idToken, null)
                            Firebase.auth.currentUser?.linkWithCredential(credential)
                                ?.addOnSuccessListener {
                                    Toast.makeText(context, "Google account linked!", Toast.LENGTH_SHORT).show()
                                    isGoogleLinking = false
                                }
                                ?.addOnFailureListener { e ->
                                    Toast.makeText(context, e.message ?: "Link failed", Toast.LENGTH_LONG).show()
                                    isGoogleLinking = false
                                }
                        } catch (e: Exception) {
                            Toast.makeText(context, "Link failed: ${e.message}", Toast.LENGTH_LONG).show()
                            isGoogleLinking = false
                        }
                    }
                } ?: run {
                    isGoogleLinking = false
                    Toast.makeText(context, "No ID Token received", Toast.LENGTH_SHORT).show()
                }
            } catch (e: ApiException) {
                isGoogleLinking = false
                Toast.makeText(context, "Google Sign-In Failed: ${e.statusCode}", Toast.LENGTH_LONG).show()
            }
        } else {
            isGoogleLinking = false
        }
    }
    
    val handleGoogleLink: () -> Unit = {
        try {
            isGoogleLinking = true
            val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(WEB_CLIENT_ID)
                .requestEmail()
                .build()
            val googleSignInClient = GoogleSignIn.getClient(activity, gso)
            googleSignInClient.signOut()
            googleLinkLauncher.launch(googleSignInClient.signInIntent)
        } catch (e: Exception) {
            isGoogleLinking = false
            e.printStackTrace()
            Toast.makeText(context, "Could not launch Google Sign-In: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    
    val uiState by mainViewModel.uiState.collectAsState()
    val homeUiState by homeViewModel.uiState.collectAsState()
    val calendarCurrentMonth by homeViewModel.currentMonth.collectAsState()
    val calendarView by homeViewModel.calendarView.collectAsState()
    val activeFeatureCards by homeViewModel.activeFeatureCards.collectAsState()
    val unreadCount by homeViewModel.unreadNotifs.collectAsState()
    val colors = rememberHomeColors()
    
    // Get effective language code
    // val context = androidx.compose.ui.platform.LocalContext.current // Already defined above
    val effectiveLanguage = remember(uiState.languageCode) {
        AppStrings.getEffectiveLanguage(uiState.languageCode, context)
    }
    
    // Global Back Handler
    BackHandler(enabled = currentScreen != "tabs" || selectedTab != NavTab.Home) {
        if (currentScreen != "tabs") {
            when (currentScreen) {
                "security" -> currentScreen = subpageReferrer
                "display" -> currentScreen = subpageReferrer

                "settings" -> {
                    currentScreen = settingsReferrer
                }
                "contact" -> currentScreen = "settings"
                "complaint" -> currentScreen = "settings"
                "developer" -> currentScreen = "settings"
                "language" -> currentScreen = subpageReferrer
                "about_app" -> currentScreen = subpageReferrer
                "about_rmk" -> currentScreen = "settings"
                "management_team" -> currentScreen = "settings"
                "linked_accounts" -> currentScreen = "security"
                "user_directory" -> {
                     if (userDirectoryPath.isNotEmpty()) {
                         userDirectoryPath = userDirectoryPath.dropLast(1)
                     } else {
                         currentScreen = "settings"
                     }
                }
                "profile" -> currentScreen = profileReferrer
                "notifications" -> currentScreen = "tabs"
                "notification_settings" -> currentScreen = "settings"
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
            "sites", "contact", "settings" -> 1
            "profile" -> 2 // Deep nested from Settings
            "linked_accounts" -> 3 // Deep nested from Security
            "notification_settings" -> 2 // Deep nested from Settings
            else -> 2 // security, display, complaint, developer, user_directory
        }
    }
    
    // Screen Title Helper
    @Composable
    fun getScreenTitle(screen: String): String {
        val lang = LocalAppLanguage.current
        return when (screen) {
            "settings" -> AppStrings.Settings.title(lang)
            "profile" -> AppStrings.Settings.editProfile(lang)
            "sites" -> AppStrings.Settings.importantSites(lang)
            "contact" -> AppStrings.Settings.contact(lang)
            "security" -> AppStrings.Settings.security(lang)
            "display" -> AppStrings.Settings.display(lang)
            "complaint" -> AppStrings.Settings.feedback(lang)
            "developer" -> AppStrings.Settings.aboutDeveloper(lang)
            "language" -> AppStrings.Settings.language(lang)
            "calendar_settings" -> AppStrings.Settings.calendarSettings(lang)
            "user_directory" -> if (userDirectoryPath.isEmpty()) AppStrings.Settings.userDirectory(lang) else userDirectoryPath.last()
            "linked_accounts" -> AppStrings.Settings.linkedAccounts(lang)
            "notifications" -> AppStrings.Settings.notifications(lang)
            "notification_settings" -> AppStrings.Settings.notificationSettings(lang)
            "pdf_viewer" -> AppStrings.Settings.documents(lang)
            "about_rmk" -> AppStrings.Settings.aboutRmk(lang)
            "management_team" -> AppStrings.Settings.managementTeam(lang)
            "about_app" -> AppStrings.Settings.aboutApp(lang)
            else -> ""
        }
    }

    var isNavbarVisible by remember { mutableStateOf(true) }
    val nestedScrollConnection = remember {
        object : androidx.compose.ui.input.nestedscroll.NestedScrollConnection {
            override fun onPreScroll(available: androidx.compose.ui.geometry.Offset, source: androidx.compose.ui.input.nestedscroll.NestedScrollSource): androidx.compose.ui.geometry.Offset {
                val delta = available.y
                if (delta > 0f && !isNavbarVisible) {
                    // Scrolling UP (content moving down) -> Show immediately
                    isNavbarVisible = true
                } else if (delta < -2f && source == androidx.compose.ui.input.nestedscroll.NestedScrollSource.SideEffect && isNavbarVisible) {
                    // Scrolling DOWN (content moving up) during a Fling (SideEffect) -> Hide
                    isNavbarVisible = false
                }
                return androidx.compose.ui.geometry.Offset.Zero
            }
            
            override suspend fun onPostFling(consumed: androidx.compose.ui.unit.Velocity, available: androidx.compose.ui.unit.Velocity): androidx.compose.ui.unit.Velocity {
                // Scroll completely stopped after fling -> Show
                if (!isNavbarVisible) {
                    isNavbarVisible = true
                }
                return androidx.compose.ui.unit.Velocity.Zero
            }
        }
    }

    val configuration = androidx.compose.ui.platform.LocalConfiguration.current
    val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

    val globalHeaderExpanded = rememberSaveable { mutableStateOf(true) }

    // Provide language and global header expanded state to all children
    CompositionLocalProvider(
        LocalAppLanguage provides effectiveLanguage,
        com.elvan.neram.ui.components.shell.LocalGlobalHeaderExpanded provides globalHeaderExpanded
    ) {
        // Wrapper Box - contains main content + navigation bar scrim
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.background)
        ) {
        
        // Navigation Rail (Landscape Only)
        if (currentScreen == "tabs" && isLandscape) {
            SideNavRail(
                selectedTab = selectedTab,
                onTabSelected = handleTabSelected,
                modifier = Modifier.align(Alignment.CenterStart)
            )
        }

        // Main Content Box - padding overrides when SideNavRail is visible
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(start = if (currentScreen == "tabs" && isLandscape) 80.dp else 0.dp)
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
                    com.elvan.neram.ui.theme.Transitions.fadeThrough()
                }
            },
            modifier = Modifier
                .fillMaxSize()
        ) { screen ->
            when (screen) {
           "tabs" -> {
                val lang = LocalAppLanguage.current
                val title = when(selectedTab) {
                    NavTab.Home -> AppStrings.Nav.neram(lang)
                    NavTab.Schedule -> AppStrings.Nav.schedule(lang)
                    NavTab.Calendar -> AppStrings.Nav.calendar(lang)
                    NavTab.Notes -> if (isInsideNotesFolder) notesFolderDisplay.last() else AppStrings.Nav.notes(lang)
                }
                
                val useNewDesign = selectedTab != NavTab.Calendar

                com.elvan.neram.ui.components.shell.ElvanShell(
                    scrollState = activeScrollState,
                    colors = colors,
                    showNavbar = !isLandscape && !(selectedTab == NavTab.Notes && isInsideNotesFolder),
                    useNewDesign = useNewDesign,
                    title = title,
                    banners = if (selectedTab == NavTab.Home) activeFeatureCards else emptyList(),
                    onBannerClick = { route ->
                        subpageReferrer = "tabs"
                        when (route) {
                            "language" -> currentScreen = "language"
                            "display" -> currentScreen = "display"
                            "security" -> currentScreen = "security"
                            "profile" -> { profileReferrer = "tabs"; currentScreen = "profile" }
                            "about_app" -> currentScreen = "about_app"
                            "notes" -> { selectedTab = NavTab.Notes; currentScreen = "tabs" }
                            "schedule" -> { selectedTab = NavTab.Schedule; currentScreen = "tabs" }
                            "calendar" -> { selectedTab = NavTab.Calendar; currentScreen = "tabs" }
                        }
                    },
                    onDismissBanner = { cardId ->
                        homeViewModel.dismissFeatureCard(cardId)
                    },
                    onBack = if (selectedTab == NavTab.Notes && isInsideNotesFolder) {
                        { notesViewModel.navigateUp() }
                    } else null,
                    hasActions = selectedTab == NavTab.Calendar || !isInsideNotesFolder,
                    actions = {
                        if (selectedTab == NavTab.Calendar) {
                            com.elvan.neram.ui.components.shell.ElvanTopBarIconButton(
                                onClick = { homeViewModel.setCalendarView(com.elvan.neram.ui.calendar.CalendarViewType.MONTH) }
                            ) {
                                Icon(
                                    imageVector = com.elvan.neram.ui.navigation.MaterialSymbols.Rounded.CalendarViewMonth,
                                    contentDescription = "Month View",
                                    tint = colors.textPrimary,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            com.elvan.neram.ui.components.shell.ElvanTopBarIconButton(
                                onClick = { homeViewModel.setCalendarView(com.elvan.neram.ui.calendar.CalendarViewType.SCHEDULE) }
                            ) {
                                Icon(
                                    imageVector = com.elvan.neram.ui.navigation.MaterialSymbols.Rounded.EventList,
                                    contentDescription = "List View",
                                    tint = colors.textPrimary,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            val today = java.time.LocalDate.now()
                            com.elvan.neram.ui.components.shell.ElvanTopBarIconButton(
                                onClick = { 
                                     homeViewModel.triggerCalendarJump(today)
                                     homeViewModel.updateSelectedDate(today)
                                     homeViewModel.updateCurrentMonth(java.time.YearMonth.now())
                                }
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .clip(RoundedCornerShape(6.dp))
                                        .border(1.5.dp, colors.textPrimary, RoundedCornerShape(6.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = today.dayOfMonth.toString(),
                                        color = colors.textPrimary,
                                        fontSize = 11.sp,
                                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                                        modifier = Modifier.offset(y = (-0.5).dp)
                                    )
                                }
                            }
                        } else if (!isInsideNotesFolder) {
                            var menuExpanded by remember { mutableStateOf(false) }
                            Box {
                                com.elvan.neram.ui.components.shell.ElvanTopBarIconButton(
                                    onClick = { menuExpanded = true }
                                ) {
                                    Icon(
                                        imageVector = com.elvan.neram.ui.navigation.MaterialSymbols.Rounded.MoreVert,
                                        contentDescription = "Menu",
                                        tint = colors.textPrimary,
                                        modifier = Modifier.size(22.dp)
                                    )
                                }
                                com.elvan.neram.ui.components.shell.ElvanPopupMenu(
                                    expanded = menuExpanded,
                                    onDismissRequest = { menuExpanded = false },
                                    colors = colors,
                                    items = listOf(
                                        com.elvan.neram.ui.components.shell.ElvanPopupMenuItem(
                                            title = AppStrings.Settings.title(lang),
                                            icon = androidx.compose.material.icons.Icons.Rounded.Settings,
                                            onClick = {
                                                scope.launch { settingsScrollState.scrollToItem(0, 0) }
                                                settingsReferrer = "tabs"
                                                currentScreen = "settings"
                                            }
                                        ),
                                        com.elvan.neram.ui.components.shell.ElvanPopupMenuItem(
                                            title = AppStrings.Settings.importantSites(lang),
                                            icon = androidx.compose.material.icons.Icons.Rounded.Language,
                                            onClick = {
                                                currentScreen = "sites"
                                            }
                                        )
                                    )
                                )
                            }
                        }
                    },
                    refreshIndicator = {
                        if (selectedTab == NavTab.Home || selectedTab == NavTab.Schedule) {
                            val refreshState = if (selectedTab == NavTab.Home) homePullRefreshState else schedulePullRefreshState
                            val fraction = refreshState.distanceFraction
                            val isRefreshing = homeUiState.isSyncing
                            val targetOffset = if (isRefreshing) com.elvan.neram.ui.home.HomeAnimations.PullRefresh.RefreshingOffset else (fraction * com.elvan.neram.ui.home.HomeAnimations.PullRefresh.MaxOffset).coerceIn(0f, com.elvan.neram.ui.home.HomeAnimations.PullRefresh.MaxOffset)
                            val animatedOffset by animateFloatAsState(targetValue = targetOffset, label = "offset")
                            if (isRefreshing || fraction > 0f) {
                                com.elvan.neram.ui.components.ExpressiveRefreshIndicator(
                                    isRefreshing = isRefreshing, fraction = fraction, colors = colors, animatedOffset = animatedOffset
                                )
                            }
                        }
                    },
                    navbar = {
                        if (!isLandscape) {
                            val shellController = com.elvan.neram.ui.components.shell.LocalElvanShellController.current
                            BottomNavBar(
                                selectedTab = selectedTab,
                                onTabSelected = { tab, isDrag ->
                                    if (selectedTab == tab) {
                                        if (tab == NavTab.Calendar || (tab == NavTab.Notes && isInsideNotesFolder)) {
                                            val targetScrollState = when (tab) {
                                                NavTab.Calendar -> calendarScrollState
                                                NavTab.Notes -> notesScrollState
                                                else -> homeScrollState
                                            }
                                            scope.launch { targetScrollState.animateScrollToItem(0, 0) }
                                        } else {
                                            shellController.toggleHeader()
                                        }
                                    } else {
                                        handleTabSelected(tab, isDrag)
                                    }
                                },
                                onInteraction = { isNavInteracting = it },
                                onDragProgress = { navDragProgress = it }
                            )
                        }
                    }
                ) {
                        when (selectedTab) {
                            NavTab.Home -> HomeScreen(
                                onLogout = onLogout, 
                                isOffline = uiState.isOffline, 
                                userProfile = uiState.userProfile,
                                onProfileClick = {
                                    profileReferrer = "tabs"
                                    currentScreen = "profile"
                                },
                                onNavigateToTab = { selectedTab = it },
                                onNavigateToScreen = { currentScreen = it },
                                viewModel = homeViewModel,
                                pullRefreshState = homePullRefreshState,
                                scrollState = homeScrollState
                            )
                            NavTab.Schedule -> ScheduleScreen(
                                viewModel = homeViewModel,
                                scrollState = scheduleScrollState,
                                pullRefreshState = schedulePullRefreshState
                            )
                            NavTab.Calendar -> com.elvan.neram.ui.calendar.CalendarScreen(
                                viewModel = homeViewModel,
                                onNavigateToPdf = { url ->
                                    selectedPdfUrl = url
                                    currentScreen = "pdf_viewer"
                                }
                            )
                            NavTab.Notes -> com.elvan.neram.ui.notes.NotesScreen(
                                onBack = { selectedTab = NavTab.Home }, 
                                viewModel = notesViewModel,
                                scrollState = notesScrollState
                            ) 
                        }
                }
            }
            "profile" -> ElvanSubShell(
                title = getScreenTitle("profile"),
                onBack = { currentScreen = profileReferrer },
                colors = colors
            ) {
                    ProfileScreen(
                        onBack = { currentScreen = profileReferrer },
                        homeViewModel = homeViewModel
                    )
                }
                "sites" -> ElvanSubShell(
                    title = getScreenTitle("sites"),
                    onBack = { currentScreen = "tabs" },
                    colors = colors
                ) {
                    CollegeSitesScreen()
                }
                "contact" -> ElvanSubShell(
                    title = getScreenTitle("contact"),
                    onBack = { currentScreen = "tabs" },
                    colors = colors
                ) {
                    ContactScreen(
                        isOffline = uiState.isOffline,
                        onSendMessage = { mainViewModel.sendMessage(it) }
                    )
                }
                "settings" -> ElvanSubShell(
                    title = getScreenTitle("settings"),
                    onBack = {
                        currentScreen = settingsReferrer
                    },
                    scrollState = settingsScrollState,
                    colors = colors
                ) {
                    SettingsScreen(
                        userRole = uiState.userProfile?.role,
                        userProfile = uiState.userProfile,
                        onNavigateToProfile = { 
                            profileReferrer = "settings"
                            currentScreen = "profile" 
                        },
                        onNavigateToSecurity = { subpageReferrer = "settings"; currentScreen = "security" },
                        onNavigateToDisplay = { subpageReferrer = "settings"; currentScreen = "display" },
                        onNavigateToComplaint = { currentScreen = "complaint" },
                        onNavigateToDeveloper = { currentScreen = "developer" },
                        onNavigateToLanguage = { subpageReferrer = "settings"; currentScreen = "language" },
                        onNavigateToUserDirectory = { currentScreen = "user_directory" },
                        onNavigateToAboutApp = { subpageReferrer = "settings"; currentScreen = "about_app" },
                        onNavigateToManagementTeam = { currentScreen = "management_team" },
                        onNavigateToAboutRMK = { currentScreen = "about_rmk" },
                        onNavigateToNotifications = { currentScreen = "notification_settings" },
                        onLogout = onLogout,
                        scrollState = settingsScrollState
                    )
                }
                "security" -> SecuritySettingsScreen(
                    onBack = { currentScreen = subpageReferrer },
                    onNavigateToLinkedAccounts = { currentScreen = "linked_accounts" },
                    onLogout = onLogout
                )
                "display" -> ElvanSubShell(
                    title = getScreenTitle("display"),
                    onBack = { currentScreen = subpageReferrer },
                    colors = colors
                ) {
                    DisplaySettingsScreen(
                        currentTheme = uiState.themeMode,
                        onThemeChange = { mainViewModel.setThemeMode(it) }
                    )
                }
                "complaint" -> ElvanSubShell(
                    title = getScreenTitle("complaint"),
                    onBack = { currentScreen = "settings" },
                    colors = colors
                ) {
                    ComplaintScreen(
                        isOffline = uiState.isOffline, 
                        onSendMessage = { mainViewModel.sendMessage(it) }
                    )
                }
                "developer" -> ElvanSubShell(
                    title = getScreenTitle("developer"),
                    onBack = { currentScreen = "settings" },
                    colors = colors
                ) {
                    DeveloperInfoScreen()
                }
                "about_app" -> ElvanSubShell(
                    title = getScreenTitle("about_app"),
                    onBack = { currentScreen = subpageReferrer },
                    colors = colors
                ) {
                    AboutAppScreen()
                }
                "about_rmk" -> ElvanSubShell(
                    title = getScreenTitle("about_rmk"),
                    onBack = { currentScreen = "settings" },
                    colors = colors
                ) {
                    AboutRMKScreen()
                }
                "management_team" -> ElvanSubShell(
                    title = getScreenTitle("management_team"),
                    onBack = { currentScreen = "settings" },
                    colors = colors
                ) {
                    ManagementTeamScreen()
                }
                "notification_settings" -> ElvanSubShell(
                    title = getScreenTitle("notification_settings"),
                    onBack = { currentScreen = "settings" },
                    colors = colors
                ) {
                    NotificationSettingsScreen()
                }
                "language" -> ElvanSubShell(
                    title = getScreenTitle("language"),
                    onBack = { currentScreen = subpageReferrer },
                    colors = colors
                ) {
                    com.elvan.neram.ui.settings.LanguageSettingsScreen(
                        currentLanguage = uiState.languageCode,
                        onLanguageChange = { mainViewModel.setLanguage(it) }
                    )
                }
                "user_directory" -> ElvanSubShell(
                    title = if (userDirectoryPath.isEmpty()) getScreenTitle("user_directory") else userDirectoryPath.last(),
                    onBack = {
                        if (userDirectoryPath.isNotEmpty()) {
                            userDirectoryPath = userDirectoryPath.dropLast(1)
                        } else {
                            currentScreen = "settings"
                        }
                    },
                    colors = colors
                ) {
                    UserDirectoryScreen(
                        directoryPath = userDirectoryPath,
                        onDirectoryPathChange = { userDirectoryPath = it },
                        onBack = { currentScreen = "settings" }
                    )
                }
                "linked_accounts" -> ElvanSubShell(
                    title = getScreenTitle("linked_accounts"),
                    onBack = { currentScreen = "security" },
                    colors = colors
                ) {
                    LinkedAccountsScreen(
                        onBack = { currentScreen = "security" },
                        onGoogleLink = handleGoogleLink,
                        isLinking = isGoogleLinking
                    )
                }
                "notifications" -> ElvanSubShell(
                    title = getScreenTitle("notifications"),
                    onBack = { currentScreen = "tabs" },
                    colors = colors
                ) {
                    com.elvan.neram.ui.notifications.NotificationScreen()
                }
                "pdf_viewer" -> com.elvan.neram.ui.common.PdfViewerScreen(
                    url = selectedPdfUrl,
                    title = getScreenTitle("pdf_viewer"),
                    onBack = { currentScreen = "tabs" },
                    colors = colors
                )
            }
        }
        } // End Main Content Box
        } // End Wrapper Box
    }
}

package com.elvan.rmdneram.admin.ui

import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.elvan.rmdneram.admin.ui.home.rememberHomeColors
import com.elvan.rmdneram.admin.ui.navigation.AdminBottomNavBar
import com.elvan.rmdneram.admin.ui.navigation.AdminNavTab
import com.elvan.rmdneram.admin.ui.profile.ProfileScreen
import com.elvan.rmdneram.admin.ui.screens.admin.AdminDashboardScreen
import com.elvan.rmdneram.admin.ui.screens.admin.AdminScheduleManagerScreen

@Composable
fun AdminMainScreen(
    onLogout: () -> Unit,
    adminViewModel: AdminViewModel = viewModel()
) {
    var selectedTab by remember { mutableStateOf(AdminNavTab.Home) }
    val colors = rememberHomeColors()
    
    // Back handler
    BackHandler(enabled = selectedTab != AdminNavTab.Home) {
        selectedTab = AdminNavTab.Home
    }

    Scaffold(
        containerColor = colors.background,
        bottomBar = {
            AdminBottomNavBar(
                selectedTab = selectedTab,
                onTabSelected = { selectedTab = it }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            AnimatedContent(
                targetState = selectedTab,
                label = "AdminTabTransition",
                transitionSpec = {
                    fadeIn() togetherWith fadeOut()
                }
            ) { tab ->
                when (tab) {
                    AdminNavTab.Home -> AdminDashboardScreen(
                        onBack = { /* Exit or minimal handler */ }
                    )
                    AdminNavTab.Schedule -> AdminScheduleManagerScreen(
                        onBack = { selectedTab = AdminNavTab.Home }
                    )
                    AdminNavTab.Profile -> ProfileScreen(
                        onBack = { selectedTab = AdminNavTab.Home },
                        adminViewModel = adminViewModel
                    )
                }
            }
        }
    }
}

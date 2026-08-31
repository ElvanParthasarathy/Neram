package com.elvan.neram.ui.home

import androidx.compose.animation.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.ContainedLoadingIndicator
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import com.elvan.neram.data.model.*
import com.elvan.neram.ui.components.ExpressivePullToRefreshBox
import com.elvan.neram.ui.theme.AppStrings
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.theme.LocalAppFontFamily

import com.elvan.neram.ui.components.shell.*

/**
 * HomeMainLayout - The structural skeleton of the Home Screen.
 * 
 * This file defines the placement and arrangement of all UI sections within
 * a PullToRefreshBox and LazyColumn. It receives all data and callbacks from HomeScreen
 * and delegates rendering to components in HomeComponents.kt.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun HomeMainLayout(
    uiState: HomeUiState,
    scheduleState: ScheduleState,
    filteredEvents: List<CalendarEvent>,
    todayUpdate: HomeViewModel.DailyUpdateDisplay?,
    formattedDate: String,
    showAcademicCalendarSection: Boolean,
    isOffline: Boolean,
    colors: HomeColors,
    pullRefreshState: PullToRefreshState,
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    onDateClick: () -> Unit,
    selectedDate: java.time.LocalDate,
    onDateSelected: (java.time.LocalDate) -> Unit,
    onSaveUpdate: (String) -> Unit,
    onSaveNotice: (String) -> Unit,
    profileLoaderCompleted: Boolean = false,
    scrollState: androidx.compose.foundation.lazy.LazyListState = androidx.compose.foundation.lazy.rememberLazyListState(),
    onProfileLoaderCompleted: () -> Unit = {},
    onProfileClick: () -> Unit = {}
) {
    var swipeDirection by remember { mutableIntStateOf(0) }

    Box(modifier = Modifier.fillMaxSize()) {
        ExpressivePullToRefreshBox(
            pullRefreshState = pullRefreshState,
            isRefreshing = isRefreshing,
            onRefresh = onRefresh,
            colors = colors,
            showIndicator = false,
            modifier = Modifier.fillMaxSize()
        ) {
            LazyColumn(
                state = scrollState,
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(
                    bottom = HomeDimens.ContentPaddingBottom
                ),
                verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
            ) {
                item { Spacer(Modifier.height(280.dp - HomeDimens.SectionSpacing)) }
                
                // 1. Header Section
                item(key = "header", contentType = "header") {
                    ElvanSectionContainer {
                        PageHeader(
                            colors = colors,
                            userProfile = uiState.userProfile,
                            showWelcomeMessage = uiState.showWelcomeMessage,
                            profileLoaderCompleted = profileLoaderCompleted,
                            onProfileLoaderCompleted = onProfileLoaderCompleted,
                            onProfileClick = onProfileClick
                        )
                        
                        if (uiState.error != null) {
                            com.elvan.neram.ui.home.components.ErrorBanner(error = uiState.error!!)
                        }
                    }
                }
                
                // 2. Date Picker Section
                item(key = "date_picker", contentType = "input") {
                    ElvanSectionContainer {
                        DateSection(
                            formattedDate = formattedDate,
                            colors = colors,
                            onClick = {
                                swipeDirection = 0 // Reset animation for tap
                                onDateClick()
                            },
                            onSwipeLeft = { 
                                swipeDirection = -1 // Next Day
                                onDateSelected(selectedDate.minusDays(1))
                            },
                            onSwipeRight = { 
                                swipeDirection = 1 // Prev Day
                                onDateSelected(selectedDate.plusDays(1))
                            }
                        )
                    }
                }
                
                // 3. Academic Calendar Section with edge-to-edge slide animation
                if (showAcademicCalendarSection) {
                    item(key = "calendar_section", contentType = "calendar_section") {
                        val lang = LocalAppLanguage.current
                        Column(modifier = Modifier.fillMaxWidth()) {
                            ElvanSectionTitle(
                                title = AppStrings.Home.academicCalendar(lang),
                                colors = colors
                            )

                            ElvanSlideSection(
                                targetState = formattedDate to filteredEvents,
                                swipeDirection = swipeDirection,
                                label = "calendarSlide"
                            ) { (_, events) ->
                                if (events.isNotEmpty()) {
                                    GroupedEventsCard(events = events, colors = colors)
                                } else {
                                    EmptyEventCard(
                                        message = "No events declared",
                                        colors = colors
                                    )
                                }
                            }
                        }
                    }
                }
                
                // 4. Schedule Section with edge-to-edge slide animation
                item(key = "schedule_section", contentType = "schedule") {
                    ElvanSlideSection(
                        targetState = formattedDate to scheduleState,
                        swipeDirection = swipeDirection,
                        label = "scheduleSlide"
                    ) { (_, state) ->
                        ScheduleSection(
                            scheduleState = state,
                            masterData = uiState.masterData,
                            isLoading = uiState.isLoading || !uiState.isCalendarLoaded,
                            colors = colors
                        )
                    }
                }
                
                // 5. Live Updates Section
                item(key = "updates_section", contentType = "editable") {
                    ElvanSectionContainer {
                        UpdatesSection(
                            sectionName = uiState.userProfile?.section ?: "",
                            content = todayUpdate?.displayNote ?: "No special updates for today.",
                            rawContent = todayUpdate?.rawNote ?: "",
                            author = todayUpdate?.author ?: "System",
                            canEdit = true,
                            isSaving = uiState.isSyncing,
                            isLoading = uiState.isLoading || !uiState.isCalendarLoaded,
                            isOffline = isOffline,
                            colors = colors,
                            onSave = onSaveUpdate
                        )
                    }
                }
                
                // 6. General Notice Section
                item(key = "notice_section", contentType = "editable") {
                    ElvanSectionContainer {
                        GeneralNoticeSection(
                            content = uiState.sectionUpdates.general.text,
                            author = uiState.sectionUpdates.general.author.ifEmpty { "System" },
                            canEdit = true,
                            isSaving = uiState.isSyncing,
                            isLoading = uiState.isLoading || !uiState.isCalendarLoaded,
                            isOffline = isOffline,
                            colors = colors,
                            onSave = onSaveNotice
                        )
                    }
                }
                
                // 7. User Academic Details Footer
                item(key = "footer", contentType = "footer") {
                    ElvanSectionContainer {
                        AcademicDetailsGrid(
                            userProfile = uiState.userProfile,
                            colors = colors
                        )
                    }
                }
            }
        }
    }
}

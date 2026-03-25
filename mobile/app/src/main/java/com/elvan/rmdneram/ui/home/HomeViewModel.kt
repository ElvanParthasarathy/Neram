package com.elvan.rmdneram.ui.home

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.elvan.rmdneram.data.model.*
import com.elvan.rmdneram.data.repository.FirebaseRepository
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

import kotlinx.coroutines.runBlocking
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

import kotlinx.collections.immutable.ImmutableList
import kotlinx.collections.immutable.persistentListOf
import kotlinx.collections.immutable.toImmutableList

/**
 * UI State for HomeScreen
 */
data class HomeUiState(
    val userProfile: UserProfile? = null,
    val masterData: MasterData = MasterData(),
    val calendarEvents: ImmutableList<CalendarEvent> = persistentListOf(),
    val sectionUpdates: SectionUpdates = SectionUpdates(),
    val sectionEvents: ImmutableList<CalendarEvent> = persistentListOf(),
    val isLoading: Boolean = true,
    val isCalendarLoaded: Boolean = false,
    val isSyncing: Boolean = false,
    val isOffline: Boolean = false,

    val academicHierarchy: Map<String, Map<String, List<String>>> = emptyMap(),
    val error: String? = null,
    // Prevent layout shift: don't render until first real data arrives
    val isInitialDataReady: Boolean = false,
    val showWelcomeMessage: Boolean = false
)

/**
 * Computed schedule state
 */
data class ScheduleState(
    val dayOrder: String = "",
    val scheduleStatus: String = "",
    val periods: ImmutableList<PeriodDisplayData> = persistentListOf(),
    val activeExamPeriod: ExamSchedule? = null,
    val todayExam: ExamSubject? = null,
    val todayBatches: ImmutableList<TodayBatchGroup> = persistentListOf(),
    val todaySpecialClass: SpecialClass? = null,
    val fullDayEvent: CalendarEvent? = null,
    val halfDayEvent: CalendarEvent? = null,
    val occasionEvent: CalendarEvent? = null
)

/**
 * Internal bundle for combining multiple flows (max 5 in Kotlin combine)
 */
private data class DataBundle(
    val masterData: MasterData,
    val calendar: List<CalendarEvent>,
    val updates: SectionUpdates,
    val events: List<CalendarEvent>,
    val hierarchy: Map<String, Map<String, List<String>>>
)

/**
 * ViewModel for HomeScreen managing all data and state
 * 
 * ARCHITECTURE (Matching React Native GlobalContext.js):
 * - Uses flatMapLatest for profile -> data cascade (no nested collect)
 * - All data comes from local DB Flows (cache-first)
 * - Syncing happens in background via FirebaseRepository
 * - Never blocks on network - shows cached data immediately
 */
@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository = FirebaseRepository(application.applicationContext)
    private val auth = FirebaseAuth.getInstance()
    
    // Selected date for viewing
    private val _selectedDate = MutableStateFlow(LocalDate.now())
    val selectedDate: StateFlow<LocalDate> = _selectedDate.asStateFlow()
    
    fun updateSelectedDate(date: LocalDate) {
        _selectedDate.value = date
    }
    
    // Calendar View State
    private val _calendarView = MutableStateFlow(com.elvan.rmdneram.ui.calendar.CalendarViewType.MONTH)
    val calendarView: StateFlow<com.elvan.rmdneram.ui.calendar.CalendarViewType> = _calendarView.asStateFlow()
    
    fun setCalendarView(view: com.elvan.rmdneram.ui.calendar.CalendarViewType) {
        _calendarView.value = view
    }
    
    // Current Month View State (for swiping)
    private val _currentMonth = MutableStateFlow(java.time.YearMonth.now())
    val currentMonth: StateFlow<java.time.YearMonth> = _currentMonth.asStateFlow()
    
    fun updateCurrentMonth(month: java.time.YearMonth) {
        _currentMonth.value = month
    }
    
    // Explicit Calendar Jump Request (Events)
    // Allows MainScreen (Today Button) to control CalendarScreen even if they are state-decoupled
    private val _calendarJumpRequest = MutableSharedFlow<LocalDate>(replay = 0)
    val calendarJumpRequest = _calendarJumpRequest.asSharedFlow()
    
    fun triggerCalendarJump(date: LocalDate) {
        viewModelScope.launch {
            _calendarJumpRequest.emit(date)
        }
    }
    
    // Profile loader state - persists across navigation
    // Once set to true, profile photo shows instantly without loader
    private val _profileLoaderCompleted = MutableStateFlow(false)
    val profileLoaderCompleted: StateFlow<Boolean> = _profileLoaderCompleted.asStateFlow()
    
    fun markProfileLoaderCompleted() {
        _profileLoaderCompleted.value = true
    }
    
    // Local UI flags (syncing, modals, errors)
    private val _uiFlags = MutableStateFlow(UiFlags())
    
    data class UiFlags(
        val isSyncing: Boolean = false,

        val error: String? = null,
        val showWelcomeMessage: Boolean = true // Start true
    )
    
    // Notification Count
    val unreadNotifs: StateFlow<Int> = com.elvan.rmdneram.data.repository.NotificationRepository(application.applicationContext).unreadCount
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
    
    // Date formatter for Firebase keys
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
    
    // Period times (matching React Native app)
    // Period times (matching React Native app - 12h AM/PM)
    private val periodTimes = listOf(
        "09:00 AM - 09:50 AM",
        "09:50 AM - 10:40 AM",
        "10:50 AM - 11:40 AM",
        "11:40 AM - 12:30 PM",
        "01:30 PM - 02:20 PM",
        "02:20 PM - 03:10 PM",
        "03:20 PM - 04:10 PM",
        "04:10 PM - 05:00 PM"
    )
    
    // SharedPreferences for instant cache - WhatsApp level startup
    private val prefs = application.getSharedPreferences("instant_cache", android.content.Context.MODE_PRIVATE)
    private val gson = com.google.gson.Gson()
    
    // Instant cache read from SharedPreferences - reads in MICROSECONDS, not milliseconds
    private val _cachedInitialState: HomeUiState = try {
        val cachedJson = prefs.getString("home_state", null)
        val currentUid = auth.currentUser?.uid

        if (cachedJson != null && currentUid != null) {
            val cached = gson.fromJson(cachedJson, CachedHomeState::class.java)
            val cachedUid = cached.userProfile?.uid
            
            // SECURITY/PRIVACY: Verify cache belongs to current user
            // If mismatch (logout -> login as other), CLEAR and discard cache
            // Also check for empty uid (old caches may not have uid saved)
            if (cachedUid.isNullOrEmpty() || cachedUid != currentUid) {
                // Clear stale cache immediately
                prefs.edit()
                    .remove("home_state")
                    .remove("schedule_state")
                    .apply()
                HomeUiState(isLoading = true, isInitialDataReady = false, showWelcomeMessage = true)
            } else {
                HomeUiState(
                    userProfile = cached.userProfile,
                    masterData = cached.masterData ?: MasterData(),
                    calendarEvents = (cached.calendarEvents ?: emptyList()).toImmutableList(),
                    sectionUpdates = cached.sectionUpdates ?: SectionUpdates(),
                    sectionEvents = (cached.sectionEvents ?: emptyList()).toImmutableList(),
                    isLoading = false,
                    isCalendarLoaded = true,

                    isInitialDataReady = true,
                    showWelcomeMessage = true // Always show welcome on startup
                )
            }
        } else {
            // No cache or no current user - start fresh
            HomeUiState(
                isLoading = currentUid != null, 
                isInitialDataReady = currentUid == null,
                showWelcomeMessage = true
            )
        }
    } catch (e: Exception) {
        // Error parsing cache - clear it and start fresh
        prefs.edit()
            .remove("home_state")
            .remove("schedule_state")
            .apply()
        HomeUiState(isLoading = true, isInitialDataReady = false, showWelcomeMessage = true)
    }
    
    // Simple data class for JSON serialization
    data class CachedHomeState(
        val userProfile: UserProfile?,
        val masterData: MasterData?,
        val calendarEvents: List<CalendarEvent>?,
        val sectionUpdates: SectionUpdates?,
        val sectionEvents: List<CalendarEvent>?
    )
    
    data class CachedScheduleState(
        val dayOrder: String = "",
        val scheduleStatus: String = "",
        val periods: List<PeriodDisplayData> = emptyList(),
        val activeExamPeriod: ExamSchedule? = null,
        val todayExam: ExamSubject? = null,
        val todayBatches: List<TodayBatchGroup> = emptyList(),
        val todaySpecialClass: SpecialClass? = null,
        val fullDayEvent: CalendarEvent? = null,
        val halfDayEvent: CalendarEvent? = null,
        val occasionEvent: CalendarEvent? = null
    )
    
    // Cache ScheduleState for instant startup (avoids "black to filled" transition)
    private val _cachedScheduleState: ScheduleState = try {
        val cachedJson = prefs.getString("schedule_state", null)
        if (cachedJson != null) {
            val cached = gson.fromJson(cachedJson, CachedScheduleState::class.java)
            ScheduleState(
                dayOrder = cached.dayOrder,
                scheduleStatus = cached.scheduleStatus,
                periods = (cached.periods).toImmutableList(),
                activeExamPeriod = cached.activeExamPeriod,
                todayExam = cached.todayExam,
                todayBatches = (cached.todayBatches).toImmutableList(),
                todaySpecialClass = cached.todaySpecialClass,
                fullDayEvent = cached.fullDayEvent,
                halfDayEvent = cached.halfDayEvent,
                occasionEvent = cached.occasionEvent
            )
        } else {
            ScheduleState()
        }
    } catch (e: Exception) {
        ScheduleState()
    }

    // Computed cached today events for instant startup
    private val _cachedTodayEvents: ImmutableList<CalendarEvent> = run {
        try {
            val todayStr = LocalDate.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE)
            buildList {
                addAll(_cachedInitialState.calendarEvents)
                addAll(_cachedInitialState.sectionEvents)
            }
            .filter { it.date == todayStr }
            .distinctBy { it.id.ifEmpty { it.title } }
            .toImmutableList()
        } catch (e: Exception) {
            persistentListOf()
        }
    }
    
    // Computed cached academic events for instant startup
    private val _cachedAcademicEvents: ImmutableList<CalendarEvent> = run {
        try {
            val todayStr = LocalDate.now().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE)
            _cachedInitialState.calendarEvents
                .filter { it.date == todayStr }
                .distinctBy { it.id.ifEmpty { it.title } }
                .toImmutableList()
        } catch (e: Exception) {
            persistentListOf()
        }
    }
    
    init {
        loadAcademicHierarchy()
        
        // Welcome Message Timer (3 seconds)
        viewModelScope.launch {
            // Start with welcome message shown (default in UiFlags)
            kotlinx.coroutines.delay(3000)
            _uiFlags.update { it.copy(showWelcomeMessage = false) }
        }
    }
    
    /**
     * Main UI State - React Native Pattern
     * Uses flatMapLatest for clean profile -> data cascade
     * No nested collect, no race conditions
     */
    /**
     * Auth State Flow - emits UID or null whenever auth state changes
     */
    private val authStateFlow = callbackFlow {
        val listener = FirebaseAuth.AuthStateListener { auth ->
            trySend(auth.currentUser?.uid)
        }
        auth.addAuthStateListener(listener)
        trySend(auth.currentUser?.uid) // Initial value
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    /**
     * Main UI State - React Native Pattern
     * Uses flatMapLatest for clean profile -> data cascade
     * No nested collect, no race conditions
     */
    val uiState: StateFlow<HomeUiState> = authStateFlow.flatMapLatest { uid ->
        if (uid == null) {
            flowOf(HomeUiState(isLoading = false, error = "User not logged in."))
        } else {
            // 1. Get profile flow from local DB (cached first)
            repository.getUserProfile(uid)
                .flatMapLatest { profile ->
                    if (profile == null) {
                        // Hybrid Strategy: Race local DB against Online Fetch
                        flow {
                            // 1. Show loading initially
                            emit(HomeUiState(isLoading = true, isInitialDataReady = true))
                            
                            // 2. Fetch Online Profile (Fast)
                            val onlineProfile = repository.getOnlineUserProfile(uid)
                            
                            if (onlineProfile != null) {
                                // 3. Got it! Show UI immediately
                                emit(HomeUiState(
                                    userProfile = onlineProfile,
                                    isLoading = true,
                                    isInitialDataReady = true
                                ))
                            } else {
                                // Online fetch failed too
                                emit(HomeUiState(isLoading = true, isInitialDataReady = true))
                            }
                            
                            // 4. IMPORTANT: Keep flow alive until cancelled by upstream
                            // This prevents the UI from going blank until local DB syncs
                            kotlinx.coroutines.awaitCancellation()
                        }
                    } else {
                        // Profile found
                        repository.cleanupAllSectionListeners()
                        
                        val masterDataFlow = if (profile.hasPlacement()) 
                            repository.getMasterData(profile.batch, profile.department, profile.section) 
                        else flowOf(MasterData())
                            
                        val calendarFlow = if (profile.hasPlacement())
                            repository.getCalendarEvents(profile.batch)
                        else flowOf(emptyList<CalendarEvent>())

                        val updatesFlow = if (profile.hasPlacement())
                            repository.getSectionUpdates(profile.batch, profile.department, profile.section)
                        else flowOf(SectionUpdates())
                            
                        val eventsFlow = if (profile.hasPlacement())
                            repository.getSectionEvents(profile.batch, profile.department, profile.section)
                        else flowOf(emptyList<CalendarEvent>())
                        
                        val hierarchyFlow = repository.getAcademicHierarchy()

                        val dataFlow = combine(
                            masterDataFlow,
                            calendarFlow,
                            updatesFlow,
                            eventsFlow,
                            hierarchyFlow
                        ) { masterData, calendar, updates, events, hierarchy ->
                            DataBundle(masterData, calendar, updates, events, hierarchy)
                        }
                        
                        combine(dataFlow, _uiFlags) { data, flags ->
                            HomeUiState(
                                userProfile = profile,
                                masterData = data.masterData,
                                calendarEvents = data.calendar.toImmutableList(),
                                sectionUpdates = data.updates,
                                sectionEvents = data.events.toImmutableList(),
                                isLoading = false,
                                isCalendarLoaded = true,
                                isSyncing = flags.isSyncing,

                                academicHierarchy = data.hierarchy,
                                error = flags.error,
                                isInitialDataReady = true,
                                showWelcomeMessage = flags.showWelcomeMessage
                            )
                        }.onEach { state ->
                            try {
                                val cached = CachedHomeState(
                                    userProfile = state.userProfile,
                                    masterData = state.masterData,
                                    calendarEvents = state.calendarEvents.toList(),
                                    sectionUpdates = state.sectionUpdates,
                                    sectionEvents = state.sectionEvents.toList()
                                )
                                prefs.edit().putString("home_state", gson.toJson(cached)).apply()
                            } catch (e: Exception) {
                                // Ignore save errors
                            }
                        }
                    }
                }
        }
    }
    .stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        // Use synchronously loaded cache as initial value - NO layout shift!
        initialValue = _cachedInitialState
    )
    
    /**
     * Load academic hierarchy for placement modal
     */
    private fun loadAcademicHierarchy() {
        // This is handled as part of the uiState flow now
        // The repository.getAcademicHierarchy() is combined into the main flow
    }
    
    // StateFlow for specific data slices to minimize recomposition
    
    // 1a. Academic Calendar Events Flow — ONLY global calendar events (matches web's globalEvents)
    //     These are shown in the "Academic Calendar" section on the Home screen.
    val academicCalendarEvents: StateFlow<ImmutableList<CalendarEvent>> = combine(uiState, _selectedDate) { state, date ->
        val dateStr = date.format(dateFormatter)
        state.calendarEvents
            .filter { it.date == dateStr }
            .distinctBy { it.id.ifEmpty { it.title } }
            .toImmutableList()
    }
    .flowOn(Dispatchers.Default)
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), _cachedAcademicEvents)

    // 1b. Today's All Events Flow — Merged calendar + section events (for Schedule logic)
    val todayEvents: StateFlow<ImmutableList<CalendarEvent>> = combine(uiState, _selectedDate) { state, date ->
        val dateStr = date.format(dateFormatter)
        
        buildList {
            addAll(state.calendarEvents)
            addAll(state.sectionEvents)
        }
            .filter { it.date == dateStr }
            .distinctBy { it.id.ifEmpty { it.title } }
            .toImmutableList()
    }
    .flowOn(Dispatchers.Default)
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), _cachedTodayEvents)

    // 2. Schedule State Flow - Only updates when relevant data changes
    val scheduleState: StateFlow<ScheduleState> = combine(
        uiState.map { it.masterData }.distinctUntilChanged(),
        todayEvents,
        _selectedDate
    ) { masterData, currentEvents, date ->
        val dateStr = date.format(dateFormatter)
        
        // Detect active exam period
        val activeExamPeriod = masterData.exams.find { exam ->
            dateStr >= exam.startDate && dateStr <= exam.endDate
        }
        
        var todayExam: ExamSubject? = null
        var todayBatches: ImmutableList<TodayBatchGroup> = persistentListOf()
        
        if (activeExamPeriod != null) {
            if (activeExamPeriod.type.equals("Practical", ignoreCase = true)) {
                // Collect today's practical batches across all subjects
                val batchesForToday = activeExamPeriod.subjects.mapNotNull { sub ->
                    val matchingBatches = sub.batches.filter { it.date == dateStr }
                    if (matchingBatches.isNotEmpty()) {
                        val courseName = masterData.courses.find { it.code == sub.code }?.name ?: sub.code
                        val cleanName = courseName.replace(Regex("\\s*\\(.*?\\)"), "").replace(Regex("\\s*Lab.*|\\s*Integrated.*", RegexOption.IGNORE_CASE), "").trimEnd('-', ' ', '/')
                        TodayBatchGroup(sub.code, cleanName, matchingBatches)
                    } else null
                }
                if (batchesForToday.isNotEmpty()) {
                    todayBatches = batchesForToday.toImmutableList()
                }
            } else {
                todayExam = activeExamPeriod.subjects.find { it.date == dateStr }
            }
        }
        
        // Check for full-day, half-day or occasion events
        // Web parity (Home.jsx): type "Event" (Regular Notice) maps to fullDay if fullTime == "All Day", otherwise halfDay
        // IMPORTANT: Only match type "Event" for section events (isSection=true), NOT academic calendar events
        // On the web, fullDayEvent/halfDayEvent are searched only in sectionEvts, not globalEvents
        val fullDayEvent = currentEvents.find { it.type == "FullDay" || (it.type == "Event" && it.isSection && it.fullTime == "All Day") }
        val halfDayEvent = currentEvents.find { it.type == "HalfDay" || (it.type == "Event" && it.isSection && it.fullTime != "All Day") }
        val occasionEvent = currentEvents.find { it.isOccasion() }
        
        // Detect special class for today
        val todaySpecialClass = masterData.specialClasses.find { it.date == dateStr }
        
        // Resolve day order
        val (dayOrder, scheduleStatus) = resolveDayOrder(date, currentEvents, todaySpecialClass)
        
        // Build period list
        val periods = if (dayOrder.isNotEmpty()) {
            val timetable = masterData.timetable[dayOrder] ?: emptyList()
            timetable.mapIndexed { index, code ->
                val details = getPeriodDetails(code, masterData.courses)
                PeriodDisplayData(
                    number = index + 1,
                    time = periodTimes.getOrElse(index) { "" },
                    entries = details.entries,
                    isLab = details.isLab
                )
            }.toImmutableList()
        } else {
            persistentListOf()
        }
        
        // Schedule state is ready
        ScheduleState(
            dayOrder = dayOrder,
            scheduleStatus = scheduleStatus,
            periods = periods,
            activeExamPeriod = activeExamPeriod,
            todayExam = todayExam,
            todayBatches = todayBatches,
            todaySpecialClass = todaySpecialClass,
            fullDayEvent = fullDayEvent,
            halfDayEvent = halfDayEvent,
            occasionEvent = occasionEvent
        )
    }
    .onEach { state ->
        // Save ScheduleState to SharedPreferences for instant startup
        try {
            prefs.edit().putString("schedule_state", gson.toJson(state)).apply()
        } catch (e: Exception) {
            // Ignore
        }
    }
    .flowOn(Dispatchers.Default)
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), _cachedScheduleState)

    data class DailyUpdateDisplay(
        val rawNote: String,
        val displayNote: String,
        val author: String
    )
    
    val todayUpdate: StateFlow<DailyUpdateDisplay?> = combine(
        uiState.map { it.sectionUpdates.daily }.distinctUntilChanged(),
        _selectedDate,
        scheduleState
    ) { dailyMap, date, schedule ->
        val dateStr = date.format(dateFormatter)
        val visibleServerUpdate = dailyMap[dateStr]
        
        // Automated lab reminder logic
        val isHoliday = schedule.scheduleStatus.contains("Holiday", ignoreCase = true)
        val hasFullDayEvent = schedule.fullDayEvent != null
        val isMajorExam = schedule.activeExamPeriod != null && !schedule.activeExamPeriod.type.contains("CT")
        val classesSuspended = isHoliday || hasFullDayEvent || isMajorExam || schedule.todaySpecialClass != null || schedule.occasionEvent != null
        
        val hasLabToday = (!classesSuspended && schedule.periods.any { it.isLab }) || (schedule.activeExamPeriod != null && schedule.activeExamPeriod.type.equals("Practical", ignoreCase = true) && schedule.todayBatches.isNotEmpty())
        val hasExamToday = schedule.todayExam != null || schedule.todayBatches.isNotEmpty()
        
        val rawNote = visibleServerUpdate?.note ?: ""
        var finalNote = rawNote
        var finalAuthor = visibleServerUpdate?.author ?: "System Reminder"

        val automatedNotices = mutableListOf<String>()
        
        if (hasLabToday) {
            automatedNotices.add("📚 Bring Labcoats, Laptops & Lab Essentials")
        }
        
        if (hasExamToday) {
            automatedNotices.add("📖 Study well for the test! Score well and get full marks! All the best! 🎯")
        }

        if (automatedNotices.isNotEmpty()) {
            val comboNotice = automatedNotices.joinToString("\n\n")
            finalNote = if (finalNote.isEmpty()) comboNotice else "$finalNote\n\n$comboNotice"
        }
        
        if (finalNote.isEmpty()) {
            null
        } else {
            DailyUpdateDisplay(rawNote = rawNote, displayNote = finalNote, author = finalAuthor)
        }
    }
    .flowOn(Dispatchers.Default)
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    
    /**
     * Compute schedule state based on selected date and data
     * DEPRECATED: Use scheduleState Flow instead
     */
    fun computeScheduleState(): ScheduleState = scheduleState.value
    
    /**
     * Resolve day order based on calendar events
     */
    private fun resolveDayOrder(date: LocalDate, events: List<CalendarEvent>, specialClass: SpecialClass? = null): Pair<String, String> {
        if (specialClass != null) {
            return "SPECIAL" to "Classes suspended due to ${specialClass.title.ifBlank { specialClass.typeTitle }}."
        }

        val weekdayName = date.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.ENGLISH)
        
        val holidayEvent = events.find { it.isHoliday() }
        val occasionEvent = events.find { it.isOccasion() }
        val fullDayEvt = events.find { it.type == "FullDay" }
        val workingDayEvent = events.find { e -> 
            e.type == "Event" || 
            e.title.contains("working day", ignoreCase = true) || 
            e.title.contains("order", ignoreCase = true)
        }
        
        return when {
            holidayEvent != null -> "" to "Holiday: ${holidayEvent.title}"
            occasionEvent != null -> "" to "Occasion"
            fullDayEvt != null -> "" to "Event Day"
            workingDayEvent != null -> {
                val foundOrder = listOf("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
                    .find { workingDayEvent.title.contains(it, ignoreCase = true) }
                
                val ro = foundOrder ?: (if (date.dayOfWeek == DayOfWeek.SUNDAY) "" else weekdayName)
                val rs = if (foundOrder != null) "Following $foundOrder Order" else "Working Day ($ro)"
                ro to rs
            }
            date.dayOfWeek == DayOfWeek.SUNDAY -> "" to "Holiday"
            else -> "" to "No Academic Calendar Scheduled"
        }
    }
    
    /**
     * Get course name and faculty from course code
     */
    data class HomeResolvedPeriod(val entries: List<PeriodSubEntry>, val isLab: Boolean)

    private fun getPeriodDetails(code: String, courses: List<Course>): HomeResolvedPeriod {
        // Handle split courses (e.g., "CS101 A1 / MA102 B1")
        if (code.contains("/")) {
            val parts = code.split("/").map { it.trim() }
            val results = parts.map { formatSingleEntry(it, courses) }
            
            return HomeResolvedPeriod(
                entries = results.flatMap { it.entries },
                isLab = results.any { it.isLab }
            )
        }
        
        return formatSingleEntry(code, courses)
    }

    private fun formatSingleEntry(entry: String, courses: List<Course>): HomeResolvedPeriod {
        val trimmed = entry.trim()
        
        // 1. Try exact match first
        val directMatch = courses.find { it.code == trimmed }
        if (directMatch != null) {
            return processCourseDisplay(directMatch, null, trimmed)
        }
        
        // 2. React Native Pattern: Extract FIRST WORD as course code
        // This handles: "22CS602 LAB BAY 3" -> "22CS602"
        // Also handles: "22IT602 A1" -> "22IT602"
        val parts = trimmed.split(" ")
        val pureCode = parts.first()
        val courseByFirstWord = courses.find { it.code == pureCode }
        if (courseByFirstWord != null) {
            // LAB badge ONLY for actual batch patterns (A1, A2, B3, etc.)
            // NOT for codes like "PP BK" or "PP - RJ"
            val suffix = parts.getOrNull(1) ?: ""
            val batchPattern = Regex("^[A-Za-z]\\d+$")  // A1, B2, C3, etc.
            val isLabBatch = batchPattern.matches(suffix)
            return processCourseDisplay(courseByFirstWord, if (isLabBatch) suffix else null, trimmed)
        }
        
        // 3. Still no match - return raw entry
        return HomeResolvedPeriod(listOf(PeriodSubEntry(trimmed, "", "")), false)
    }

    private fun processCourseDisplay(course: Course, batch: String?, originalCode: String): HomeResolvedPeriod {
        var cleanName = course.name
        var faculty = course.faculty
        val isLab = batch != null

        if (isLab) {
            val patterns = listOf(
                "\\s*\\(Lab Integrated\\)",
                "\\s*\\(Integrated Lab\\)",
                "\\s*Lab Integrated",
                "\\s*Integrated Lab",
                "\\s*\\(Integrated\\)",
                "\\s*\\(Lab\\)",
                "\\s*Integrated",
                "\\s*Lab"
            )
            
            patterns.forEach { pattern ->
                cleanName = cleanName.replace(Regex(pattern, RegexOption.IGNORE_CASE), "").trim()
            }

            cleanName = cleanName.trimEnd('-', ' ', '/')

            if (batch != null) {
                cleanName = cleanName.replace(Regex("\\s+$batch$", RegexOption.IGNORE_CASE), "").trim()
            }
            
            if (batch != null && course.faculty.contains("($batch)")) {
                val splitFaculties = course.faculty.split("/").map { it.trim() }
                val matching = splitFaculties.find { it.contains("($batch)") }
                if (matching != null) {
                    faculty = matching.replace("($batch)", "").trim()
                }
            }
        }
        
        return HomeResolvedPeriod(
            entries = listOf(PeriodSubEntry(originalCode, cleanName, faculty)),
            isLab = isLab
        )
    }
    
    /**
     * Get today's events for display
     */
    fun getTodayEvents(): List<CalendarEvent> {
        val state = uiState.value
        val dateStr = _selectedDate.value.format(dateFormatter)
        
        return buildList {
            addAll(state.calendarEvents)
            addAll(state.sectionEvents)
        }
            .filter { it.date == dateStr }
            .distinctBy { it.id.ifEmpty { it.title } }
    }
    
    fun getTodayUpdate(): DailyUpdate? {
        val dateStr = getDateKey()
        return uiState.value.sectionUpdates.daily[dateStr]
    }
    
    /**
     * Get formatted date string for display
     */
    fun getFormattedDate(locale: Locale = Locale.getDefault()): String {
        val date = _selectedDate.value
        return date.format(DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy", locale))
    }
    
    /**
     * Get date key for Firebase
     */
    fun getDateKey(): String {
        return _selectedDate.value.format(dateFormatter)
    }
    
    // ==================== ACTIONS ====================
    
    /**
     * Update selected date
     */
    fun onDateSelected(date: LocalDate) {
        _selectedDate.value = date
    }
    
    /**
     * Refresh data (manual sync)
     */
    fun onRefresh() {
        val profile = uiState.value.userProfile ?: return
        if (!profile.hasPlacement()) return
        
        _uiFlags.update { it.copy(isSyncing = true) }
        
        viewModelScope.launch {
            // Force network refresh (re-attach Firebase listeners)
            repository.refreshHomeData(profile.uid, profile.batch, profile.department, profile.section)
            
            // Keep spinner for at least 1.5s visual feedback
            kotlinx.coroutines.delay(1500)
            _uiFlags.update { it.copy(isSyncing = false) }
        }
    }
    
    /**
     * Save daily update (admin/CR action)
     */
    fun saveDailyUpdate(note: String) {
        val profile = uiState.value.userProfile ?: return
        
        viewModelScope.launch {
            try {
                _uiFlags.update { it.copy(isSyncing = true) }
                val dateStr = getDateKey()
                // Ensure loader is visible for at least 1 second
                val saveJob = launch {
                    repository.saveDailyUpdate(
                        profile.batch,
                        profile.department,
                        profile.section,
                        dateStr,
                        DailyUpdate(note, profile.displayName.ifEmpty { "Admin" })
                    )
                }
                kotlinx.coroutines.delay(1000)
                saveJob.join()
            } catch (e: Exception) {
                _uiFlags.update { it.copy(error = "Failed to save update") }
            } finally {
                _uiFlags.update { it.copy(isSyncing = false) }
            }
        }
    }
    
    /**
     * Save general notice (admin/CR action)
     */
    fun saveGeneralNotice(text: String) {
        val profile = uiState.value.userProfile ?: return
        
        viewModelScope.launch {
            try {
                _uiFlags.update { it.copy(isSyncing = true) }
                // Ensure loader is visible for at least 1 second
                val saveJob = launch {
                    repository.saveGeneralNotice(
                        profile.batch,
                        profile.department,
                        profile.section,
                        GeneralNotice(text, profile.displayName.ifEmpty { "Admin" })
                    )
                }
                kotlinx.coroutines.delay(1000)
                saveJob.join()
            } catch (e: Exception) {
                _uiFlags.update { it.copy(error = "Failed to save notice") }
            } finally {
                _uiFlags.update { it.copy(isSyncing = false) }
            }
        }
    }
    
    /**
     * Update user placement
     */
    fun updatePlacement(batch: String, dept: String, section: String) {
        val uid = auth.currentUser?.uid ?: return
        
        viewModelScope.launch {
            try {
                _uiFlags.update { it.copy(isSyncing = true) }
                
                // Clear old section data first
                repository.clearSectionData()
                
                repository.updateUserProfile(uid, mapOf(
                    "batch" to batch,
                    "department" to dept,
                    "section" to section
                ))

            } catch (e: Exception) {
                _uiFlags.update { it.copy(error = "Failed to update placement") }
            } finally {
                _uiFlags.update { it.copy(isSyncing = false) }
            }
        }
    }
    

    
    /**
     * Clear error message
     */
    fun clearError() {
        _uiFlags.update { it.copy(error = null) }
    }

    /**
     * Delete updates older than 30 days
     */
    fun cleanupStorage() {
        val profile = uiState.value.userProfile ?: return
        
        viewModelScope.launch {
            try {
                _uiFlags.update { it.copy(isSyncing = true) }
                repository.cleanupOldUpdates(profile.batch, profile.department, profile.section)
                Log.d("HomeViewModel", "Storage cleanup complete")
            } catch (e: Exception) {
                _uiFlags.update { it.copy(error = "Cleanup failed") }
                Log.e("HomeViewModel", "Cleanup failed", e)
            } finally {
                _uiFlags.update { it.copy(isSyncing = false) }
            }
        }
    }

    /**
     * Delete updates in a specific date range
     */
    fun cleanupStorageRange(startDate: LocalDate, endDate: LocalDate) {
        val profile = uiState.value.userProfile ?: return
        
        viewModelScope.launch {
            try {
                _uiFlags.update { it.copy(isSyncing = true) }
                repository.cleanupRangeUpdates(
                    startDate.toString(), 
                    endDate.toString(),
                    profile.batch, 
                    profile.department, 
                    profile.section
                )
                Log.d("HomeViewModel", "Range cleanup complete: $startDate to $endDate")
            } catch (e: Exception) {
                _uiFlags.update { it.copy(error = "Cleanup failed") }
                Log.e("HomeViewModel", "Range cleanup failed", e)
            } finally {
                _uiFlags.update { it.copy(isSyncing = false) }
            }
        }
    }

    /**
     * Perform full logout with data cleanup
     */
    fun performLogout() {
        viewModelScope.launch {
            try {
                // 1. Clear SharedPreferences Instant Cache
                prefs.edit()
                    .remove("home_state")
                    .remove("schedule_state")
                    .apply()
                
                // 2. Clear Local Database (via Repository)
                repository.signOut()
                
                // 3. Sign out of Firebase Auth
                auth.signOut()
                
                Log.d("HomeViewModel", "Logout complete")
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Logout cleanup failed", e)
                // Force sign out anyway
                auth.signOut()
            }
        }
    }
}

package com.elvan.neram.data.repository

import android.content.Context
import android.util.Log
import com.elvan.neram.data.local.NeramDatabase
import com.elvan.neram.data.local.entity.*
import com.elvan.neram.data.model.*
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.DatabaseReference
import com.google.firebase.database.FirebaseDatabase
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.getValue
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.collections.immutable.toImmutableList
import kotlinx.collections.immutable.toImmutableMap
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.trWithLang
import com.elvan.neram.data.preferences.LanguageManager

/**
 * Repository for accessing Data - React Native Offline Pattern
 * 
 * ARCHITECTURE (Matching GlobalContext.js):
 * 1. Return Local DB Flow IMMEDIATELY (cache-first)
 * 2. Start Firebase sync in background (fire-and-forget)
 * 3. When Firebase receives data, write to Local DB
 * 4. Local DB Flow automatically emits new values
 * 5. NEVER crash on Firebase errors - just log and continue with cache
 * 6. CLEANUP old listeners when section changes (like React Native's return () => {})
 */
class FirebaseRepository(private val context: Context) {
    
    companion object {
        private const val TAG = "FirebaseRepository"
    }
    
    private val database = FirebaseDatabase.getInstance()
    private val localDb = NeramDatabase.getDatabase(context)
    private val scope = CoroutineScope(Dispatchers.IO)
    private val gson = com.google.gson.Gson()
    
    // Academic hierarchy state (network-only, but safe)
    private val _academicHierarchy = MutableStateFlow<Map<String, Map<String, List<String>>>>(emptyMap())
    
    // Helper to safely parse Int from Firebase (could be String or Number)
    private fun parseIntSafe(value: Any?): Int {
        return when (value) {
            is Number -> value.toInt()
            is String -> value.toIntOrNull() ?: 0
            else -> 0
        }
    }

    private suspend fun getLanguage(): String {
        val langPref = try { LanguageManager(context).languageCode.first() } catch (e: Exception) { "system" }
        return K.getEffectiveLanguage(langPref, context)
    }
    
    // Helper to check if date is Today or Tomorrow (YYYY-MM-DD or DD-MM-YYYY)
    private fun isDateTodayOrTomorrow(dateString: String): Boolean {
        try {
            val cleanDate = dateString.trim()
            if (cleanDate.isBlank()) return false
            
            // Handle DD-MM-YYYY format
            val normalizedDate = if (cleanDate.matches(Regex("\\d{2}-\\d{2}-\\d{4}"))) {
                val parts = cleanDate.split("-")
                "${parts[2]}-${parts[1]}-${parts[0]}"
            } else {
                cleanDate
            }
            
            val date = LocalDate.parse(normalizedDate)
            val today = LocalDate.now()
            val tomorrow = today.plusDays(1)
            
            return date.isEqual(today) || date.isEqual(tomorrow)
        } catch (e: Exception) {
            return false 
        }
    }

    // Helper to check if date is STRICTLY Today
    private fun isDateToday(dateString: String): Boolean {
        try {
            val cleanDate = dateString.trim()
            if (cleanDate.isBlank()) return false
            
            val normalizedDate = if (cleanDate.matches(Regex("\\d{2}-\\d{2}-\\d{4}"))) {
                val parts = cleanDate.split("-")
                "${parts[2]}-${parts[1]}-${parts[0]}"
            } else {
                cleanDate
            }
            
            val date = LocalDate.parse(normalizedDate)
            val today = LocalDate.now()
            
            return date.isEqual(today)
        } catch (e: Exception) {
            return false 
        }
    }

    // ==================== LISTENER TRACKING ====================
    // Like React Native's cleanup in useEffect return () => { unsub() }
    
    private data class ListenerInfo(
        val ref: DatabaseReference,
        val listener: ValueEventListener
    )
    
    private var userProfileListener: ListenerInfo? = null
    private var masterDataListener: ListenerInfo? = null
    private var calendarListener: ListenerInfo? = null
    private var sectionUpdatesListener: ListenerInfo? = null
    private var sectionEventsListener: ListenerInfo? = null
    private var academicHierarchyListener: ListenerInfo? = null
    private var featureCardsListener: ListenerInfo? = null
    
    private fun removeListener(listenerInfo: ListenerInfo?) {
        listenerInfo?.let {
            try {
                it.ref.removeEventListener(it.listener)
                Log.d(TAG, "Removed listener for: ${it.ref.path}")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to remove listener: ${e.message}")
            }
        }
    }
    
    // ==================== FEATURE CARDS / TIPS BANNERS ====================
    
    fun getFeatureCards(): Flow<FeatureCardsConfig> {
        startFeatureCardsSync()
        return localDb.masterDataDao().getMasterDataByIdFlow("feature_cards").map { entity ->
            if (entity != null) {
                try {
                    gson.fromJson(entity.json, FeatureCardsConfig::class.java) ?: FeatureCardsConfig()
                } catch (e: Exception) {
                    FeatureCardsConfig()
                }
            } else {
                FeatureCardsConfig()
            }
        }
    }

    private fun startFeatureCardsSync() {
        removeListener(featureCardsListener)
        val ref = database.getReference("settings/feature_cards")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try {
                    val enabled = snapshot.child("enabled").getValue(Boolean::class.java) ?: true
                    val cardsList = mutableListOf<FeatureCard>()
                    val cardsSnap = snapshot.child("cards")
                    if (cardsSnap.exists()) {
                        cardsSnap.children.forEach { child ->
                            val id = child.child("id").getValue(String::class.java) ?: child.key ?: ""
                            val type = child.child("type").getValue(String::class.java) 
                                ?: child.child("badge").getValue(String::class.java) ?: "UPDATE"
                            val message = child.child("message").getValue(String::class.java)
                                ?: child.child("description").getValue(String::class.java)
                                ?: child.child("title").getValue(String::class.java) ?: ""
                            val messageTa = child.child("messageTa").getValue(String::class.java)
                                ?: child.child("descriptionTa").getValue(String::class.java)
                                ?: child.child("titleTa").getValue(String::class.java) ?: ""
                            val actionRoute = child.child("actionRoute").getValue(String::class.java) ?: ""
                            val cardEnabled = child.child("enabled").getValue(Boolean::class.java) ?: true

                            if (message.isNotBlank()) {
                                cardsList.add(
                                    FeatureCard(
                                        id = id,
                                        type = type,
                                        message = message,
                                        messageTa = messageTa,
                                        title = message,
                                        titleTa = messageTa,
                                        description = message,
                                        descriptionTa = messageTa,
                                        badge = type,
                                        actionRoute = actionRoute,
                                        enabled = cardEnabled
                                    )
                                )
                            }
                        }
                    }

                    // No hardcoded fallbacks — only show what admin creates in the panel
                    val config = FeatureCardsConfig(enabled = enabled, cards = cardsList)
                    scope.launch {
                        try {
                            localDb.masterDataDao().insertMasterData(
                                MasterDataEntity(
                                    id = "feature_cards",
                                    json = gson.toJson(config)
                                )
                            )
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to cache feature cards: ${e.message}")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing feature cards", e)
                }
            }

            override fun onCancelled(error: DatabaseError) {
                Log.w(TAG, "Feature cards sync cancelled: ${error.message}")
            }
        }
        ref.addValueEventListener(listener)
        featureCardsListener = ListenerInfo(ref, listener)
    }
    
    // ==================== USER PROFILE ====================
    
    /**
     * Get user profile - React Native Pattern
     * Returns local DB Flow immediately, syncs in background
     */
    fun getUserProfile(uid: String): Flow<UserProfile?> {
        // 1. Start background sync (fire-and-forget)
        startUserProfileSync(uid)
        
        // 2. Return local DB Flow immediately
        return localDb.userDao().getUserProfile(uid).map { it?.toUserProfile() }
    }
    
    private fun startUserProfileSync(uid: String) {
        // Remove old listener first (like React Native cleanup)
        removeListener(userProfileListener)
        
        val ref = database.getReference("users/$uid")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                // Use safe parsing to handle type mismatches (e.g. batch as number)
                val profile = safeParseUserProfile(snapshot)
                if (profile != null) {
                    scope.launch {
                        try {
                            localDb.userDao().insertUserProfile(UserEntity.fromUserProfile(profile))
                            Log.d(TAG, "User profile synced to local DB")
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to save user profile: ${e.message}")
                        }
                    }
                }
            }
            
            override fun onCancelled(error: DatabaseError) {
                Log.w(TAG, "User profile sync cancelled: ${error.message}")
            }
        }
        
        ref.addValueEventListener(listener)
        userProfileListener = ListenerInfo(ref, listener)
    }
    
    suspend fun updateUserProfile(uid: String, updates: Map<String, Any>) {
        // 1. Optimistic Update: Update Local DB Immediately
        val currentUser = localDb.userDao().getUserProfile(uid).first()
        if (currentUser != null) {
            val newBatch = updates["batch"] as? String ?: currentUser.batch
            val newDept = updates["department"] as? String ?: currentUser.department
            val newSection = updates["section"] as? String ?: currentUser.section
            
            val updatedUser = currentUser.copy(
                batch = newBatch,
                department = newDept,
                section = newSection
            )
            localDb.userDao().insertUserProfile(updatedUser)
        }

        // 2. Fire and forget Firebase update
        database.getReference("users/$uid").updateChildren(updates)
    }

    /**
     * Sign out and clear ALL local data
     */
    suspend fun signOut() {
        Log.d(TAG, "Signing out - clearing all local data...")
        
        // 1. Remove all listeners
        cleanupAllSectionListeners()
        removeListener(userProfileListener)
        userProfileListener = null
        
        // 2. Clear USER data
        localDb.userDao().clearUserProfile()
        
        // 3. Clear ALL section data (Master Data, Events, Updates)
        clearSectionData()
        
        Log.d(TAG, "Sign out cleanup complete")
    }
    
    // ==================== MASTER DATA ====================
    
    /**
     * Get Master Data - React Native Pattern
     * Returns local DB Flow immediately, syncs in background
     */
    fun getMasterData(batch: String, dept: String, section: String): Flow<MasterData> {
        // 1. Start background sync (fire-and-forget)
        startMasterDataSync(batch, dept, section)
        
        // 2. Return local DB Flow immediately  
        return localDb.masterDataDao().getMasterData().map { entity ->
            entity?.toMasterData() ?: MasterData()
        }
    }
    
    private fun startMasterDataSync(batch: String, dept: String, section: String) {
        // Remove old listener first - CRITICAL for section change
        removeListener(masterDataListener)
        
        val ref = database.getReference("schedules/$batch/$dept/$section")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                // Wrap ALL parsing in try-catch - Firebase data types may not match model
                try {
                    val data = parseMasterData(snapshot)
                    scope.launch {
                        try {
                            val lang = getLanguage()
                            // 1. Check for New Exams
                            val prefs = context.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
                            val lastExamHashes = prefs.getStringSet("last_exam_hashes", emptySet()) ?: emptySet()
                            val newExamHashes = mutableSetOf<String>()
                            
                            data.exams.forEach { exam ->
                                val hash = "${exam.title}:${exam.startDate}".hashCode().toString()
                                newExamHashes.add(hash)
                                
                                if (!lastExamHashes.contains(hash)) {
                                    // Only notify if exam is Today/Tomorrow (Immediate relevance)
                                    val checkDate = if (exam.endDate.isNotBlank()) exam.endDate else exam.startDate
                                    if (isDateTodayOrTomorrow(checkDate)) {
                                        // New exam schedule found!
                                        val notifTitle = K.newExamSchedule.trWithLang(lang, exam.title)
                                        val notifMessage = K.examDatesRange.trWithLang(lang, exam.startDate, exam.endDate)
                                        com.elvan.neram.ui.common.NotificationHelper.showNotification(
                                            context,
                                            notifTitle,
                                            notifMessage,
                                            com.elvan.neram.ui.common.NotificationHelper.CHANNEL_ID_EXAMS,
                                            notificationId = hash.hashCode()
                                        )
                                        // Store in notification center
                                        localDb.notificationDao().insertNotification(
                                            NotificationEntity(
                                                title = K.newExam.trWithLang(lang, exam.title),
                                                message = notifMessage,
                                                timestamp = System.currentTimeMillis(),
                                                type = "exam"
                                            )
                                        )
                                        Log.d(TAG, "Notification triggered for new exam: ${exam.title}")
                                    }
                                }
                            }
                            // Save new hashes
                            prefs.edit().putStringSet("last_exam_hashes", newExamHashes).apply()
                            
                            // 2. Save to DB
                            localDb.masterDataDao().insertMasterData(MasterDataEntity.fromMasterData(data))
                            Log.d(TAG, "Master data synced to local DB")
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to save master data: ${e.message}")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to parse master data: ${e.message}")
                    // Don't crash - keep using cached data
                }
            }
            
            override fun onCancelled(error: DatabaseError) {
                Log.w(TAG, "Master data sync cancelled: ${error.message}")
            }
        }
        
        ref.addValueEventListener(listener)
        masterDataListener = ListenerInfo(ref, listener)
    }
    
    
    private fun parseMasterData(snapshot: DataSnapshot): MasterData {
        // Parse courses MANUALLY to handle String/Int type mismatches from Firebase
        val courses = snapshot.child("courses").children.mapNotNull { child ->
            try {
                val code = child.child("code").getValue<String>() ?: ""
                val name = child.child("name").getValue<String>() ?: ""
                val faculty = child.child("faculty").getValue<String>() ?: ""
                val credit = parseIntSafe(child.child("credit").value)
                val type = child.child("type").getValue<String>() ?: ""
                val periods = parseIntSafe(child.child("periods").value)
                Course(code, name, faculty, credit, type, periods)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to parse course: ${e.message}")
                null
            }
        }.toImmutableList()
        
        // Parse timetable - Map<String, List<String>>
        val timetable = mutableMapOf<String, List<String>>()
        snapshot.child("timetable").children.forEach { daySnapshot ->
            val dayName = daySnapshot.key ?: return@forEach
            val periods = daySnapshot.children.mapNotNull { it.getValue<String>() }
            timetable[dayName] = periods
        }
        
        // Parse exams with try-catch to handle type mismatches
        val exams = snapshot.child("exams").children.mapNotNull { examSnapshot ->
            try {
                val id = (examSnapshot.child("id").value as? Number)?.toLong() ?: 0L
                val title = examSnapshot.child("title").getValue<String>() ?: ""
                val type = examSnapshot.child("type").getValue<String>() ?: ""
                val startDate = examSnapshot.child("startDate").getValue<String>() ?: ""
                val endDate = examSnapshot.child("endDate").getValue<String>() ?: ""
                
                val subjects = examSnapshot.child("subjects").children.mapNotNull { subSnapshot ->
                    try {
                        // Parse batches for practical exams
                        val batches = subSnapshot.child("batches").children.mapNotNull { batchSnap ->
                            try {
                                PracticalBatch(
                                    label = batchSnap.child("label").getValue<String>() ?: "",
                                    section = batchSnap.child("section").getValue<String>() ?: "",
                                    date = batchSnap.child("date").getValue<String>() ?: "",
                                    startTime = batchSnap.child("startTime").getValue<String>() ?: "",
                                    endTime = batchSnap.child("endTime").getValue<String>() ?: "",
                                    registerRange = batchSnap.child("registerRange").getValue<String>() ?: "",
                                    totalCount = batchSnap.child("totalCount").getValue<String>() ?: ""
                                )
                            } catch (e: Exception) { null }
                        }
                        // Manual parsing to avoid type mismatch crashes
                        ExamSubject(
                            date = subSnapshot.child("date").getValue<String>() ?: "",
                            code = subSnapshot.child("code").getValue<String>() ?: "",
                            startTime = subSnapshot.child("startTime").getValue<String>() ?: "",
                            endTime = subSnapshot.child("endTime").getValue<String>() ?: "",
                            portion = subSnapshot.child("portion").getValue<String>() ?: "",
                            batches = batches
                        )
                    } catch (e: Exception) { null }
                }
                
                ExamSchedule(id, title, type, startDate, endDate, subjects)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to parse exam: ${e.message}")
                null
            }
        }.toImmutableList()
        
        // Parse counseling data
        val counselingSnapshot = snapshot.child("counseling")
        val counselors = counselingSnapshot.child("counselors").children.mapNotNull { 
            it.getValue<String>() 
        }
        val coordinators = mutableMapOf<String, String>()
        counselingSnapshot.child("coordinators").children.forEach { child ->
            val key = child.key ?: return@forEach
            val value = child.getValue<String>() ?: return@forEach
            coordinators[key] = value
        }
        val counseling = CounselingData(counselors, coordinators)
        
        // Parse special classes data
        val specialClassesSnapshot = snapshot.child("specialClasses")
        val specialClasses = specialClassesSnapshot.children.mapNotNull { scSnap ->
            try {
                val scDate = scSnap.child("date").getValue<String>() ?: ""
                val typeTitle = scSnap.child("typeTitle").getValue<String>() ?: ""
                val title = scSnap.child("title").getValue<String>() ?: ""
                val desc = scSnap.child("desc").getValue<String>() ?: ""
                
                val batches = scSnap.child("batches").children.mapNotNull { bSnap ->
                    try {
                        SpecialClassBatch(
                            circleLabel = bSnap.child("circleLabel").getValue<String>() ?: "",
                            startTime = bSnap.child("startTime").getValue<String>() ?: "",
                            endTime = bSnap.child("endTime").getValue<String>() ?: "",
                            subjectCode = bSnap.child("subjectCode").getValue<String>() ?: "",
                            subjectName = bSnap.child("subjectName").getValue<String>() ?: "",
                            faculty = bSnap.child("faculty").getValue<String>() ?: ""
                        )
                    } catch (e: Exception) { null }
                }
                
                SpecialClass(
                    id = scSnap.key ?: "",
                    date = scDate,
                    typeTitle = typeTitle,
                    title = title,
                    desc = desc,
                    batches = batches
                )
            } catch (e: Exception) { null }
        }.toImmutableList()
        
        return MasterData(courses, timetable.toImmutableMap(), exams, specialClasses, counseling)
    }
    
    // ==================== CALENDAR EVENTS ====================
    
    /**
     * Get Calendar Events - React Native Pattern
     * Returns local DB Flow immediately, syncs in background
     */
    fun getCalendarEvents(batch: String): Flow<List<CalendarEvent>> {
        // 1. Start background sync (fire-and-forget)
        startCalendarEventsSync(batch)
        
        // 2. Return local DB Flow immediately
        return localDb.calendarEventDao().getAllEvents().map { entities ->
            entities.map { it.toCalendarEvent() }
        }
    }
    
    private fun startCalendarEventsSync(batch: String) {
        // Remove old listener first
        removeListener(calendarListener)
        
        val ref = database.getReference("calendars/$batch/events")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val events = snapshot.children.mapNotNull { child ->
                    try {
                        val rawDate = child.child("date").getValue<String>() ?: ""
                        val normalizedDate = if (rawDate.matches(Regex("\\d{2}-\\d{2}-\\d{4}"))) {
                            val parts = rawDate.split("-")
                            "${parts[2]}-${parts[1]}-${parts[0]}"
                        } else {
                            rawDate
                        }
                        
                        CalendarEvent(
                            id = child.key ?: "",
                            title = child.child("title").getValue<String>() ?: "",
                            date = normalizedDate,
                            groupId = child.child("groupId").getValue<String>(),
                            type = child.child("type").getValue<String>() ?: "",
                            startTime = child.child("startTime").getValue<String>(),
                            endTime = child.child("endTime").getValue<String>(),
                            description = child.child("description").getValue<String>(),
                            fullTime = child.child("fullTime").getValue<String>(),
                            isSection = false // Google Calendar Events
                        )
                    } catch (e: Exception) { null }
                }
                
                scope.launch {
                    try {
                        val lang = getLanguage()
                        // 1. Check for New Events
                        val prefs = context.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
                        val lastEventHashes = prefs.getStringSet("last_event_hashes", emptySet()) ?: emptySet()
                        val newEventHashes = mutableSetOf<String>()
                        
                        events.forEach { event ->
                            val hash = "${event.title}:${event.date}".hashCode().toString()
                            newEventHashes.add(hash)
                            
                            if (!lastEventHashes.contains(hash)) {
                                // Only notify if event is Today/Tomorrow
                                if (isDateTodayOrTomorrow(event.date)) {
                                    // New event found!
                                    val title = if (event.type.equals("Holiday", ignoreCase = true)) K.newHolidayAdded.tr(lang) else K.newEvent.trWithLang(lang, event.title)
                                    val message = K.eventOnDate.trWithLang(lang, event.title, event.date)
                                    
                                    com.elvan.neram.ui.common.NotificationHelper.showNotification(
                                        context,
                                        title,
                                        message,
                                        com.elvan.neram.ui.common.NotificationHelper.CHANNEL_ID_EVENTS,
                                        notificationId = hash.hashCode()
                                    )
                                    // Store in notification center
                                    localDb.notificationDao().insertNotification(
                                        NotificationEntity(
                                            title = title,
                                            message = message,
                                            timestamp = System.currentTimeMillis(),
                                            type = "alert"
                                        )
                                    )
                                    Log.d(TAG, "Notification triggered for new event: ${event.title}")
                                }
                            }
                        }
                        // Save new hashes
                        prefs.edit().putStringSet("last_event_hashes", newEventHashes).apply()
                        
                        // 2. Save to DB
                        val entities = events.map { CalendarEventEntity.fromCalendarEvent(it) }
                        localDb.calendarEventDao().replaceEvents(entities)
                        Log.d(TAG, "Calendar events synced to local DB: ${events.size} events")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to save calendar events: ${e.message}")
                    }
                }
            }
            
            override fun onCancelled(error: DatabaseError) {
                Log.w(TAG, "Calendar sync cancelled: ${error.message}")
            }
        }
        
        ref.addValueEventListener(listener)
        calendarListener = ListenerInfo(ref, listener)
    }
    
    // ==================== SECTION UPDATES ====================
    
    /**
     * Get Updates - React Native Pattern
     * Returns local DB Flow immediately, syncs in background
     */
    fun getSectionUpdates(batch: String, dept: String, section: String): Flow<SectionUpdates> {
        // 1. Start background sync (fire-and-forget)
        startSectionUpdatesSync(batch, dept, section)
        
        // 2. Return combined local DB Flows immediately
        val dailyFlow = localDb.updatesDao().getAllDailyUpdates()
        val generalFlow = localDb.updatesDao().getGeneralNotice()
        
        return kotlinx.coroutines.flow.combine(dailyFlow, generalFlow) { dailyList, general ->
            SectionUpdates(
                daily = dailyList.associate { it.date to it.toDailyUpdate() },
                general = general?.toGeneralNotice() ?: GeneralNotice()
            )
        }
    }
    
    private fun startSectionUpdatesSync(batch: String, dept: String, section: String) {
        // Remove old listener first - CRITICAL for section change
        removeListener(sectionUpdatesListener)
        
        val ref = database.getReference("updates/$batch/$dept/$section")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                // Parse daily
                val dailyNode = snapshot.child("daily_update")
                val note = dailyNode.child("note").getValue<String>() ?: ""
                val author = dailyNode.child("author").getValue<String>() ?: ""
                
                val generalText = snapshot.child("general_text").getValue<String>() ?: ""
                val generalAuthor = snapshot.child("general_author").getValue<String>() ?: ""
                
                scope.launch {
                    try {
                        val lang = getLanguage()
                        // Check for new general notice and trigger notification
                        val prefs = context.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
                        val lastGeneralHash = prefs.getString("last_general_hash", "")
                        val currentGeneralHash = generalText.hashCode().toString()
                        
                        if (generalText.isNotEmpty() && lastGeneralHash != currentGeneralHash) {
                            // New notice detected - trigger notification
                            val noticeTitle = K.newNotice.tr(lang)
                            val noticeMessage = "$generalText" + if (generalAuthor.isNotEmpty()) K.authorAttribution.trWithLang(lang, generalAuthor) else ""
                            com.elvan.neram.ui.common.NotificationHelper.showNotification(
                                context,
                                noticeTitle,
                                noticeMessage,
                                com.elvan.neram.ui.common.NotificationHelper.CHANNEL_ID_INSTANT,
                                notificationId = generalText.hashCode()
                            )
                            // Store in notification center
                            localDb.notificationDao().insertNotification(
                                NotificationEntity(
                                    title = noticeTitle,
                                    message = noticeMessage,
                                    timestamp = System.currentTimeMillis(),
                                    type = "notice"
                                )
                            )
                            prefs.edit().putString("last_general_hash", currentGeneralHash).apply()
                            Log.d(TAG, "Notification triggered for new notice")
                        }
                        
                        // Update Daily Map
                        localDb.updatesDao().clearAllDailyUpdates()
                        
                        // Track daily updates for notifications
                        val lastDailyHashes = prefs.getStringSet("last_daily_hashes", emptySet()) ?: emptySet()
                        val newDailyHashes = mutableSetOf<String>()
                        val now = System.currentTimeMillis()
                        
                        dailyNode.children.forEach { dateSnap ->
                            val dateKey = dateSnap.key ?: return@forEach
                            val isDateKey = dateKey.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))
                            if (!isDateKey) {
                                // Stray non-date node under daily_update (e.g. legacy flat note/author)
                                dateSnap.ref.removeValue()
                                return@forEach
                            }

                            val note = dateSnap.child("note").getValue<String>() ?: ""
                            val author = dateSnap.child("author").getValue<String>() ?: ""
                            val createdAt = dateSnap.child("createdAt").getValue<Long>() ?: 0L
                            var expiresAt = dateSnap.child("expiresAt").getValue<Long>() ?: 0L

                            // If legacy update without explicit expiresAt: compute expiry from dateKey (end of target day)
                            if (expiresAt == 0L) {
                                expiresAt = try {
                                    val dateObj = java.time.LocalDate.parse(dateKey)
                                    dateObj.plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
                                } catch (_: Exception) {
                                    now - 1000L
                                }
                            }

                            // Hybrid auto-purge: If current time is past expiry, delete directly from Firebase
                            if (now > expiresAt) {
                                Log.d(TAG, "Auto-purging expired daily update from Firebase: $dateKey")
                                dateSnap.ref.removeValue()
                            } else if (dateKey != null && note.isNotEmpty()) {
                                localDb.updatesDao().insertDailyUpdate(
                                    DailyUpdateEntity(
                                        date = dateKey,
                                        note = note,
                                        author = author,
                                        createdAt = createdAt,
                                        expiresAt = expiresAt
                                    )
                                )
                                
                                // Check if this is a new update
                                val updateHash = "$dateKey:$note".hashCode().toString()
                                newDailyHashes.add(updateHash)
                                
                                if (!lastDailyHashes.contains(updateHash)) {
                                    // Only notify if Update is STRICTLY Today
                                    if (isDateToday(dateKey)) {
                                        // New daily update - trigger notification
                                        val dailyTitle = K.dailyUpdateFormat.trWithLang(lang, dateKey)
                                        val dailyMessage = "$note" + if (author.isNotEmpty()) K.authorAttribution.trWithLang(lang, author) else ""
                                        com.elvan.neram.ui.common.NotificationHelper.showNotification(
                                            context,
                                            dailyTitle,
                                            dailyMessage,
                                            com.elvan.neram.ui.common.NotificationHelper.CHANNEL_ID_DAILY,
                                            notificationId = updateHash.hashCode()
                                        )
                                        // Store in notification center
                                        localDb.notificationDao().insertNotification(
                                            NotificationEntity(
                                                title = dailyTitle,
                                                message = dailyMessage,
                                                timestamp = System.currentTimeMillis(),
                                                type = "update"
                                            )
                                        )
                                        Log.d(TAG, "Notification triggered for daily update: $dateKey")
                                    }
                                }
                            }
                        }
                        
                        // Save new hashes for next comparison
                        prefs.edit().putStringSet("last_daily_hashes", newDailyHashes).apply()
                        
                        // Update General
                        if (generalText.isNotEmpty()) {
                            localDb.updatesDao().insertGeneralNotice(GeneralNoticeEntity(text = generalText, author = generalAuthor))
                        } else {
                            localDb.updatesDao().clearGeneralNotice()
                        }
                        Log.d(TAG, "Section updates synced to local DB")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to save section updates: ${e.message}")
                    }
                }
            }
            
            override fun onCancelled(error: DatabaseError) {
                Log.w(TAG, "Section updates sync cancelled: ${error.message}")
            }
        }
        
        ref.addValueEventListener(listener)
        sectionUpdatesListener = ListenerInfo(ref, listener)
    }
    
    /**
     * Save daily update for a specific date with Academic Day / 24-Hour Hybrid Expiry
     */
    suspend fun saveDailyUpdate(batch: String, dept: String, section: String, date: String, update: DailyUpdate) {
        val now = System.currentTimeMillis()
        val dateEndOfDay = try {
            java.time.LocalDate.parse(date).plusDays(1).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
        } catch (_: Exception) {
            now + 24 * 3600 * 1000L
        }
        val expiresAt = maxOf(now + 24 * 3600 * 1000L, dateEndOfDay)
        val enrichedUpdate = update.copy(createdAt = now, expiresAt = expiresAt)

        // 1. Optimistic update - save to local DB first
        localDb.updatesDao().insertDailyUpdate(DailyUpdateEntity.fromDailyUpdate(date, enrichedUpdate))
        
        // 2. Fire and forget to Firebase with expiry timestamp
        val ref = database.getReference("updates/$batch/$dept/$section/daily_update/$date")
        ref.updateChildren(
            mapOf(
                "note" to enrichedUpdate.note,
                "author" to enrichedUpdate.author,
                "createdAt" to enrichedUpdate.createdAt,
                "expiresAt" to enrichedUpdate.expiresAt
            )
        )
    }
    
    /**
     * Save general notice
     */
    suspend fun saveGeneralNotice(batch: String, dept: String, section: String, notice: GeneralNotice) {
        // 1. Optimistic update - save to local DB first
        localDb.updatesDao().insertGeneralNotice(GeneralNoticeEntity.fromGeneralNotice(notice))
        
        // 2. Fire and forget to Firebase
        val ref = database.getReference("updates/$batch/$dept/$section")
        ref.updateChildren(
            mapOf(
                "general_text" to notice.text,
                "general_author" to notice.author
            )
        )
    }
    
    // ==================== SECTION EVENTS ====================
    
    /**
     * Get Section Events - React Native Pattern
     * Returns local DB Flow immediately, syncs in background
     */
    fun getSectionEvents(batch: String, dept: String, section: String): Flow<List<CalendarEvent>> {
        // 1. Start background sync (fire-and-forget)
        startSectionEventsSync(batch, dept, section)
        
        // 2. Return local DB Flow
        return localDb.calendarEventDao().getSectionEvents().map { entities ->
            entities.map { it.toCalendarEvent() }
        }
    }
    
    private fun startSectionEventsSync(batch: String, dept: String, section: String) {
        // Remove old listener first - CRITICAL for section change
        removeListener(sectionEventsListener)
        
        val ref = database.getReference("list_events/$batch/$dept/$section")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val events = mutableListOf<CalendarEvent>()
                
                for (child in snapshot.children) {
                    try {
                        val eventsArray = child.child("events")
                        
                        if (eventsArray.exists() && eventsArray.childrenCount > 0) {
                            // NEW FORMAT: Grouped multi-day event with sub-events array
                            val groupId = child.child("id").value?.toString() ?: child.key ?: ""
                            val groupTitle = child.child("title").getValue<String>() ?: ""
                            
                            for (subEvent in eventsArray.children) {
                                val rawDate = subEvent.child("date").getValue<String>() ?: ""
                                val normalizedDate = if (rawDate.matches(Regex("\\d{2}-\\d{2}-\\d{4}"))) {
                                    val parts = rawDate.split("-")
                                    "${parts[2]}-${parts[1]}-${parts[0]}"
                                } else { rawDate }
                                
                                if (normalizedDate.isNotBlank()) {
                                    val subTitle = subEvent.child("title").getValue<String>() ?: ""
                                    val finalTitle = if (subTitle.isNotBlank()) subTitle else groupTitle
                                    
                                    events.add(
                                        CalendarEvent(
                                            id = "${groupId}_${normalizedDate}_${subEvent.key}",
                                            title = finalTitle,
                                            date = normalizedDate,
                                            groupId = groupId,
                                            type = subEvent.child("type").getValue<String>() ?: "",
                                            startTime = subEvent.child("startTime").getValue<String>(),
                                            endTime = subEvent.child("endTime").getValue<String>(),
                                            description = subEvent.child("description").getValue<String>(),
                                            fullTime = subEvent.child("fullTime").getValue<String>(),
                                            isSection = true
                                        )
                                    )
                                }
                            }
                        } else {
                            // OLD FORMAT: Flat single event (backward compat)
                            val rawDate = child.child("date").getValue<String>()
                                ?: child.child("startDate").getValue<String>() ?: ""
                            val normalizedDate = if (rawDate.matches(Regex("\\d{2}-\\d{2}-\\d{4}"))) {
                                val parts = rawDate.split("-")
                                "${parts[2]}-${parts[1]}-${parts[0]}"
                            } else {
                                rawDate
                            }

                            if (normalizedDate.isNotBlank()) {
                                events.add(
                                    CalendarEvent(
                                        id = child.key ?: "",
                                        title = child.child("title").getValue<String>() ?: "",
                                        date = normalizedDate,
                                        type = child.child("type").getValue<String>() ?: "",
                                        startTime = child.child("startTime").getValue<String>(),
                                        endTime = child.child("endTime").getValue<String>(),
                                        description = child.child("description").getValue<String>(),
                                        fullTime = child.child("fullTime").getValue<String>(),
                                        isSection = true
                                    )
                                )
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Parsing Error: ${e.message}")
                    }
                }
                
                scope.launch {
                    try {
                        val lang = getLanguage()
                        // 1. Check for New Section Events
                        val prefs = context.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
                        val lastSectionEventHashes = prefs.getStringSet("last_section_event_hashes", emptySet()) ?: emptySet()
                        val newSectionEventHashes = mutableSetOf<String>()
                        
                        events.forEach { event ->
                            val hash = "${event.title}:${event.date}".hashCode().toString()
                            newSectionEventHashes.add(hash)
                            
                            if (!lastSectionEventHashes.contains(hash)) {
                                // Only notify if event is Today/Tomorrow
                                if (isDateTodayOrTomorrow(event.date)) {
                                    // New section event found!
                                    val title = K.newClassEvent.trWithLang(lang, event.title)
                                    val message = K.eventOnDate.trWithLang(lang, event.title, event.date)
                                    com.elvan.neram.ui.common.NotificationHelper.showNotification(
                                        context,
                                        title,
                                        message,
                                        com.elvan.neram.ui.common.NotificationHelper.CHANNEL_ID_EVENTS,
                                        notificationId = hash.hashCode()
                                    )
                                    // Store in notification center
                                    localDb.notificationDao().insertNotification(
                                        NotificationEntity(
                                            title = title,
                                            message = message,
                                            timestamp = System.currentTimeMillis(),
                                            type = "alert"
                                        )
                                    )
                                    Log.d(TAG, "Notification triggered for new section event: ${event.title}")
                                }
                            }
                        }
                        // Save new hashes
                        prefs.edit().putStringSet("last_section_event_hashes", newSectionEventHashes).apply()

                        // 2. Save to DB
                        val entities = events.map { 
                            CalendarEventEntity.fromCalendarEvent(it, isSection = true) 
                        }
                        localDb.calendarEventDao().replaceSectionEvents(entities)
                        Log.d(TAG, "Section events synced: ${events.size} events")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to save section events: ${e.message}")
                    }
                }
            }
            
            override fun onCancelled(error: DatabaseError) {
                Log.w(TAG, "Section events sync cancelled: ${error.message}")
            }
        }
        
        ref.addValueEventListener(listener)
        sectionEventsListener = ListenerInfo(ref, listener)
    }
    
    // ==================== ACADEMIC HIERARCHY ====================
    
    /**
     * Get academic hierarchy for placement selection
     * Returns StateFlow that updates when Firebase data arrives
     * NEVER crashes - safe for offline use
     */
    fun getAcademicHierarchy(): Flow<Map<String, Map<String, List<String>>>> {
        // Start sync if not started
        startAcademicHierarchySync()
        return _academicHierarchy.asStateFlow()
    }
    
    private var hierarchySyncStarted = false
    
    private fun startAcademicHierarchySync() {
        if (hierarchySyncStarted) return
        hierarchySyncStarted = true
        
        val ref = database.getReference("academic_hierarchy")
        val listener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val hierarchy = mutableMapOf<String, Map<String, List<String>>>()
                
                snapshot.children.forEach { batchSnapshot ->
                    val batchName = batchSnapshot.key ?: return@forEach
                    if (batchName == "initialized") return@forEach
                    
                    val departments = mutableMapOf<String, List<String>>()
                    batchSnapshot.children.forEach { deptSnapshot ->
                        val deptName = deptSnapshot.key ?: return@forEach
                        if (deptName == "initialized") return@forEach
                        
                        val sections = deptSnapshot.children.mapNotNull { it.getValue<String>() }
                        departments[deptName] = sections
                    }
                    hierarchy[batchName] = departments
                }
                
                _academicHierarchy.value = hierarchy
                Log.d(TAG, "Academic hierarchy synced: ${hierarchy.keys}")
            }
            
            override fun onCancelled(error: DatabaseError) {
                Log.w(TAG, "Academic hierarchy sync cancelled: ${error.message}")
            }
        }
        
        ref.addValueEventListener(listener)
        academicHierarchyListener = ListenerInfo(ref, listener)
    }
    
    /**
     * Clean up all section-specific Firebase listeners SYNCHRONOUSLY
     * Call this BEFORE starting new data flows when profile changes
     * This is the equivalent of React Native's cleanup in useEffect
     */
    fun cleanupAllSectionListeners() {
        Log.d(TAG, "Cleaning up all section listeners...")
        removeListener(masterDataListener)
        removeListener(calendarListener)
        removeListener(sectionUpdatesListener)
        removeListener(sectionEventsListener)
        
        masterDataListener = null
        calendarListener = null
        sectionUpdatesListener = null
        sectionEventsListener = null
        Log.d(TAG, "All section listeners cleaned up")
    }

    /**
     * Force refresh all home screen data (re-attach listeners)
     * This forces Firebase to checking for updates immediately
     */
    fun refreshHomeData(uid: String, batch: String, dept: String, section: String) {
        Log.d(TAG, "REFRESH: Re-attaching all listeners to force sync...")
        
        // 1. Profile
        startUserProfileSync(uid)
        
        // 2. Section Data
        startMasterDataSync(batch, dept, section)
        startCalendarEventsSync(batch)
        startSectionUpdatesSync(batch, dept, section)
        startSectionEventsSync(batch, dept, section)
        
        Log.d(TAG, "REFRESH: Listeners re-attached")
    }
    
    /**
     * Clear all section-specific data when user changes placement
     * Like React Native's cleanup when effectiveProfile changes
     */
    suspend fun clearSectionData() {
        // 1. Remove old listeners (like React Native's return () => {})
        cleanupAllSectionListeners()
        
        // 2. Clear local DB data
        localDb.masterDataDao().clearMasterData()
        localDb.calendarEventDao().clearEvents()
        localDb.updatesDao().clearAllDailyUpdates()
        localDb.updatesDao().clearGeneralNotice()
        
        Log.d(TAG, "Section data cleared for section change")
    }

    /**
     * Delete updates older than 30 days
     */
    suspend fun cleanupOldUpdates(batch: String, dept: String, section: String) {
        val cutoffDate = java.time.LocalDate.now().minusDays(30).toString()
        
        // 1. Local Cleanup
        localDb.updatesDao().deleteUpdatesOlderThan(cutoffDate)
        
        // 2. Remote Cleanup
        try {
            val ref = database.getReference("updates/$batch/$dept/$section/daily_update")
            ref.orderByKey().endAt(cutoffDate).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val updates = mutableMapOf<String, Any?>()
                    snapshot.children.forEach { child ->
                        if (child.key != null && child.key!! < cutoffDate) {
                            updates[child.key!!] = null // Delete
                        }
                    }
                    if (updates.isNotEmpty()) {
                        ref.updateChildren(updates)
                    }
                }
                override fun onCancelled(error: DatabaseError) {}
            })
        } catch (e: Exception) {
            Log.e(TAG, "Remote cleanup failed", e)
        }
    }

    /**
     * Delete updates in a specific date range
     */
    suspend fun cleanupRangeUpdates(startDate: String, endDate: String, batch: String, dept: String, section: String) {
        // 1. Local Cleanup
        localDb.updatesDao().deleteUpdatesInRange(startDate, endDate)
        
        // 2. Remote Cleanup
        try {
            val ref = database.getReference("updates/$batch/$dept/$section/daily_update")
            ref.orderByKey().startAt(startDate).endAt(endDate).addListenerForSingleValueEvent(object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    val updates = mutableMapOf<String, Any?>()
                    snapshot.children.forEach { child ->
                        val key = child.key
                        if (key != null && key >= startDate && key <= endDate) {
                            updates[key] = null // Delete
                        }
                    }
                    if (updates.isNotEmpty()) {
                        ref.updateChildren(updates)
                        Log.d("FirebaseRepo", "Deleted ${updates.size} updates in range $startDate to $endDate")
                    }
                }
                override fun onCancelled(error: DatabaseError) {
                    Log.e("FirebaseRepo", "Range cleanup failed: ${error.message}")
                }
            })
        } catch (e: Exception) {
            Log.e("FirebaseRepo", "Error during range cleanup", e)
        }
    }
    // ==================== ONLINE FALLBACK (Hybrid Strategy) ====================

    /**
     * Get User Profile DIRECTLY from Firebase (Online-First)
     * Used when local cache is empty to avoid waiting for sync
     */
    suspend fun getOnlineUserProfile(uid: String): UserProfile? {
        return try {
            val ref = database.getReference("users/$uid")
            val snapshot = awaitSingleValue(ref)
            // Use safe parsing to handle type mismatches
            safeParseUserProfile(snapshot)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch online profile: ${e.message}")
            null
        }
    }

    /**
     * Helper to await single Firebase value (Coroutines)
     */
    private suspend fun awaitSingleValue(ref: DatabaseReference): DataSnapshot {
        return kotlinx.coroutines.suspendCancellableCoroutine { cont ->
            val listener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    if (cont.isActive) cont.resumeWith(Result.success(snapshot))
                }

                override fun onCancelled(error: DatabaseError) {
                    if (cont.isActive) cont.resumeWith(Result.failure(error.toException()))
                }
            }
            ref.addListenerForSingleValueEvent(listener)
            cont.invokeOnCancellation { ref.removeEventListener(listener) }
        }
    }

    /**
     * Helper to safely parse UserProfile from DataSnapshot
     * Handles type mismatches (e.g. batch/section stored as Number/Boolean)
     */
    private fun safeParseUserProfile(snapshot: DataSnapshot): UserProfile? {
        try {
            if (!snapshot.exists()) return null
            
            // Helper to safely get string value from child
            fun getString(key: String): String {
                return snapshot.child(key).value?.toString() ?: ""
            }
            
            val profile = UserProfile(
                uid = snapshot.key ?: "", // Use snapshot key as UID if validation fails
                email = getString("email"),
                displayName = getString("displayName"),
                photoURL = snapshot.child("photoURL").value?.toString(), // Nullable
                role = getString("role").ifBlank { "student" },
                batch = getString("batch"),
                department = getString("department"),
                section = getString("section")
            )
            return profile
        } catch (e: Exception) {
            Log.e(TAG, "safeParseUserProfile: Error parsing UserProfile", e)
            return null
        }
    }

    // ==================== MESSAGING (Complaints & Contact) ====================
    
    /**
     * Send message to Firestore (Complaints / Contact)
     */
    suspend fun sendMessage(data: Map<String, Any?>) {
        try {
            com.google.firebase.firestore.FirebaseFirestore.getInstance()
                .collection("messages")
                .add(data)
                .addOnFailureListener { e ->
                    Log.e(TAG, "Failed to send message: ${e.message}")
                    throw e
                }
                .addOnSuccessListener {
                    Log.d(TAG, "Message sent successfully")
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error sending message", e)
            throw e
        }
    }

}



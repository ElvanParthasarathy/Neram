package com.elvan.neram.utils

import android.content.Context
import android.util.Log
import com.elvan.neram.data.local.NeramDatabase
import com.elvan.neram.data.local.entity.NotificationEntity
import com.elvan.neram.ui.common.NotificationHelper
import com.elvan.neram.data.preferences.LanguageManager
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.toMozhiName
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.trWithLang
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.tasks.await
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Helper to process and show all daily notifications.
 * Extracted from DailyUpdateWorker to be callable directly from BroadcastReceivers 
 * to survive Doze mode and App Standby buckets without WorkManager restrictions.
 */
object DailyUpdateHelper {
    private const val TAG = "DailyUpdateHelper"

    suspend fun processDailyUpdates(context: Context, dateOverride: String? = null, isAlarm: Boolean = true) {
        val today = if (dateOverride != null) {
            try {
                LocalDate.parse(dateOverride.trim())
            } catch (e: Exception) {
                LocalDate.now()
            }
        } else {
            LocalDate.now()
        }
        val todayDateStr = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
        
        Log.d(TAG, "Starting to process: $todayDateStr (Override: $dateOverride)")
        

        try {
            // 0. Master Kill Switch Check
            val database = FirebaseDatabase.getInstance()
            val masterSwitchSnapshot = database.getReference("settings/system_notifications_enabled").get().await()
            if (masterSwitchSnapshot.exists()) {
                val isSystemNotificationsEnabled = masterSwitchSnapshot.getValue(Boolean::class.java) ?: true
                if (!isSystemNotificationsEnabled) {
                    Log.d(TAG, "Skipping: System notifications are disabled globally via Master Kill Switch.")
                    return
                }
            }

            val settingsPrefs = context.getSharedPreferences("notification_settings", Context.MODE_PRIVATE)

            // Read Notification Settings
            val dailyUpdateEnabled = settingsPrefs.getBoolean("daily_update", true)
            val generalNoticeEnabled = settingsPrefs.getBoolean("general_notice", true)
            val classScheduleEnabled = settingsPrefs.getBoolean("class_schedule", true)
            val labRemindersEnabled = settingsPrefs.getBoolean("lab_reminders", true)
            val studyRemindersEnabled = settingsPrefs.getBoolean("study_reminders", true)
            val examAlertsEnabled = settingsPrefs.getBoolean("exam_alerts", true)
            val eventRemindersEnabled = settingsPrefs.getBoolean("event_reminders", true)

            val langPref = try { LanguageManager(context).languageCode.first() } catch (e: Exception) { "system" }
            val lang = K.getEffectiveLanguage(langPref, context)
            NotificationHelper.createNotificationChannels(context, lang)

            // 1. Get Current User
            val auth = FirebaseAuth.getInstance()
            val currentUser = auth.currentUser
            if (currentUser == null) {
                Log.d(TAG, "Skipping: User not logged in")
                return
            }

            // 2. Get User Profile from Local DB
            val db = NeramDatabase.getDatabase(context)
            val userProfile = db.userDao().getUserProfile(currentUser.uid).first()
            
            if (userProfile == null) {
                Log.d(TAG, "Skipping: User profile not found in DB")
                return
            }
            
            val batch = userProfile.batch
            val dept = userProfile.department
            val section = userProfile.section
            
            if (batch.isBlank() || dept.isBlank() || section.isBlank()) {
                Log.d(TAG, "Skipping: User profile incomplete")
                return
            }

            // 3. Fetch Local DB Data to determine Schedule/Labs
            val masterDataEntity = db.masterDataDao().getMasterData().first() ?: return
            val masterData = masterDataEntity.toMasterData()
            val courses = masterData.courses
            val timetable = masterData.timetable
            val exams = masterData.exams
            
            val globalEvents = db.calendarEventDao().getAllEvents().first().map { it.toCalendarEvent() }
            
            val eventsRef = database.getReference("list_events/$batch/$dept/$section")
            val eventsSnapshot = eventsRef.get().await()
            val liveSectionEvents = mutableListOf<com.elvan.neram.data.model.CalendarEvent>()
            for (child in eventsSnapshot.children) {
                try {
                    val eventsArray = child.child("events")
                    
                    if (eventsArray.exists() && eventsArray.childrenCount > 0) {
                        // NEW FORMAT: Grouped multi-day event with sub-events array
                        val groupId = child.child("id").value?.toString() ?: child.key ?: ""
                        val groupTitle = child.child("title").getValue(String::class.java) ?: ""
                        
                        for (subEvent in eventsArray.children) {
                            val rawDate = subEvent.child("date").getValue(String::class.java) ?: ""
                            val normalizedDate = if (rawDate.matches(Regex("\\d{2}-\\d{2}-\\d{4}"))) {
                                val parts = rawDate.split("-")
                                "${parts[2]}-${parts[1]}-${parts[0]}"
                            } else { rawDate }
                            
                            if (normalizedDate.isNotBlank()) {
                                val subTitle = subEvent.child("title").getValue(String::class.java) ?: ""
                                val finalTitle = if (subTitle.isNotBlank()) subTitle else groupTitle
                                
                                liveSectionEvents.add(
                                    com.elvan.neram.data.model.CalendarEvent(
                                        id = "${groupId}_${normalizedDate}",
                                        title = finalTitle,
                                        date = normalizedDate,
                                        groupId = groupId,
                                        type = subEvent.child("type").getValue(String::class.java) ?: "",
                                        startTime = subEvent.child("startTime").getValue(String::class.java),
                                        endTime = subEvent.child("endTime").getValue(String::class.java),
                                        description = subEvent.child("description").getValue(String::class.java),
                                        fullTime = subEvent.child("fullTime").getValue(String::class.java),
                                        isSection = true
                                    )
                                )
                            }
                        }
                    } else {
                        // OLD FORMAT: Flat single event (backward compat)
                        val rawDate = child.child("date").getValue(String::class.java)
                            ?: child.child("startDate").getValue(String::class.java) ?: ""
                        val normalizedDate = if (rawDate.matches(Regex("\\d{2}-\\d{2}-\\d{4}"))) {
                            val parts = rawDate.split("-")
                            "${parts[2]}-${parts[1]}-${parts[0]}"
                        } else { rawDate }
                        
                        if (normalizedDate.isNotBlank()) {
                            liveSectionEvents.add(
                                com.elvan.neram.data.model.CalendarEvent(
                                    id = child.key ?: "",
                                    title = child.child("title").getValue(String::class.java) ?: "",
                                    date = normalizedDate,
                                    type = child.child("type").getValue(String::class.java) ?: "",
                                    startTime = child.child("startTime").getValue(String::class.java),
                                    endTime = child.child("endTime").getValue(String::class.java),
                                    description = child.child("description").getValue(String::class.java),
                                    fullTime = child.child("fullTime").getValue(String::class.java),
                                    isSection = true
                                )
                            )
                        }
                    }
                } catch(e: Exception) { /* skip */ }
            }
            
            val calendarEvents = globalEvents + liveSectionEvents
            val todaysEvents = calendarEvents.filter { it.date == todayDateStr }
            
            // Calculate Day Order / Schedule Status
            val isSunday = today.dayOfWeek == java.time.DayOfWeek.SUNDAY
            val isHoliday = isSunday || todaysEvents.any {
                it.isHoliday() || it.type == "FullDay" || 
                (it.type == "Event" && it.isSection && (it.fullTime.equals("All Day", ignoreCase = true) || it.fullTime.equals("Full Day", ignoreCase = true)))
            }
            var dayKey = today.dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
            
            if (!isHoliday) {
                val orderEvent = calendarEvents.find { it.date == todayDateStr && (it.isOrderOverride() || it.type == "Order") }
                if (orderEvent != null) {
                    val extracted = orderEvent.extractOrderDay()
                    if (extracted != null) {
                        dayKey = extracted
                    } else {
                        for (i in 1..6) {
                            if (orderEvent.title.contains("Day $i", ignoreCase = true)) {
                                dayKey = "Day $i"
                                break
                            }
                        }
                    }
                }
            }

            val tomorrow = today.plusDays(1)
            val tomorrowStr = tomorrow.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
            
            // 1. Identify Exam Types for Today
            val examsToday = exams.filter { it.subjects.any { s -> s.date == todayDateStr } }
            
            fun isMajor(title: String) = title.lowercase().let { t -> 
                t.contains("sia") || t.contains("internal") || t.contains("model") || 
                t.contains("semester") || t.contains("fia") || 
                t.split(" ", "-", "/").any { it == "ia" }
            }
            fun isPractical(title: String) = title.lowercase().let { t -> t.contains("practical") || t.contains("lab") || t.contains("iesw") }
            fun isCycle(title: String) = title.lowercase().let { t -> t.contains("cycle") || t.contains("ct") }

            val isMajorExamToday = examsToday.any { isMajor(it.title) || isMajor(it.type) } || 
                                   todaysEvents.any { isMajor(it.title) }
            
            val isPracticalExamToday = exams.any { it.subjects.any { s -> s.batches.any { b -> b.date == todayDateStr } } } ||
                                    examsToday.any { isPractical(it.title) || isPractical(it.type) } ||
                                    todaysEvents.any { isPractical(it.title) }

            val isSpecialClassToday = masterData.specialClasses.any { it.date == todayDateStr }

            val isCycleTestToday = examsToday.any { isCycle(it.title) || isCycle(it.type) } ||
                                    todaysEvents.any { isCycle(it.title) }
                                   
            val hasAnyExamToday = isMajorExamToday || isPracticalExamToday || isCycleTestToday

            // Automated Messages Logic (Lab & Exam)
            val automatedNotices = mutableListOf<String>()
            
            if (!isHoliday && !isSpecialClassToday) {
                // Lab Logic
                if (labRemindersEnabled) {
                    if (isPracticalExamToday) {
                        automatedNotices.add(K.bringLabcoatsEssentials.tr(lang))
                    } else if (!isMajorExamToday) {
                        val periods = timetable[dayKey] ?: emptyList()
                        val labsToday = mutableListOf<Pair<String, String>>()
                        
                        periods.forEach { code ->
                            val codes = if (code.contains("/")) code.split("/") else listOf(code)
                            codes.forEach { part ->
                                val trimmed = part.trim()
                                val parts = trimmed.split(" ")
                                val pureCode = parts.first()
                                val suffix = parts.getOrNull(1) ?: ""
                                val isBatchSuffix = suffix.matches(Regex("^[A-Za-z]\\d+$"))
                                
                                if (isBatchSuffix) {
                                    val course = courses.find { it.code == trimmed } ?: courses.find { it.code == pureCode }
                                    if (course != null) {
                                        labsToday.add(suffix to course.name)
                                    }
                                }
                            }
                        }
                        
                        if (labsToday.isNotEmpty()) {
                            labsToday.distinctBy { it.first + it.second }.forEach { (batchSuffix, subjectName) ->
                                val cleanedName = getCleanSubjectName(subjectName)
                                automatedNotices.add(K.labForBatch.trWithLang(lang, batchSuffix, cleanedName))
                            }
                            automatedNotices.add(K.bringLabcoatsEssentials.tr(lang))
                        }
                    }
                }
                
                // Study Well Logic
                if (studyRemindersEnabled && hasAnyExamToday) {
                    automatedNotices.add(K.studyWellExamWish.tr(lang))
                }
            }

            // 4. Fetch Data from Firebase
            // For scheduled morning alarms (isAlarm == true), all 3 time slots ring with full daily briefings.
            // For background live update checks (isAlarm == false), only genuinely NEW updates (unseen hashes) are notified.
            val updatesRef = database.getReference("updates/$batch/$dept/$section")
            val sectionSnapshot = updatesRef.get().await()
            val notifPrefs = context.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
            
            // A. Daily Update & General Notice
            if (dailyUpdateEnabled) {
                val dailyUpdateSnapshot = sectionSnapshot.child("daily_update").child(todayDateStr)
                
                var note = if (dailyUpdateSnapshot.exists()) dailyUpdateSnapshot.child("note").value?.toString() ?: "" else ""
                val author = if (dailyUpdateSnapshot.exists()) dailyUpdateSnapshot.child("author").value?.toString() ?: "" else ""
                
                if (automatedNotices.isNotEmpty()) {
                    val comboNotice = automatedNotices.joinToString("\n\n")
                    note = if (note.isBlank()) comboNotice else "$note\n\n$comboNotice"
                }

                if (note.isNotBlank()) {
                    val updateHash = "$todayDateStr:$note".hashCode().toString()
                    val lastDailyHashes = notifPrefs.getStringSet("last_daily_hashes", emptySet()) ?: emptySet()
                    val isNewDaily = !lastDailyHashes.contains(updateHash)

                    if (isAlarm || isNewDaily) {
                        NotificationHelper.showNotification(
                            context,
                            K.dailyUpdateFormat.trWithLang(lang, todayDateStr),
                            "$note" + if (author.isNotBlank()) K.authorAttribution.trWithLang(lang, author) else "",
                            NotificationHelper.CHANNEL_ID_DAILY,
                            notificationId = 1001 
                        )
                        val updatedDailyHashes = lastDailyHashes.toMutableSet().apply { add(updateHash) }
                        notifPrefs.edit().putStringSet("last_daily_hashes", updatedDailyHashes).apply()
                    }
                }
            } else if (automatedNotices.isNotEmpty() && isAlarm) {
                // If daily update is off from firebase, but we still have automated notices (labs/study), show them as an automated update for morning alarm
                val comboNotice = automatedNotices.joinToString("\n\n")
                NotificationHelper.showNotification(
                    context,
                    K.automatedReminders.tr(lang),
                    comboNotice,
                    NotificationHelper.CHANNEL_ID_DAILY,
                    notificationId = 1001 
                )
            }

            if (generalNoticeEnabled) {
                val generalText = sectionSnapshot.child("general_text").value?.toString() ?: ""
                val generalAuthor = sectionSnapshot.child("general_author").value?.toString() ?: ""
                if (generalText.isNotBlank()) {
                    val currentGeneralHash = generalText.hashCode().toString()
                    val lastGeneralHash = notifPrefs.getString("last_general_hash", "")
                    val isNewGeneral = lastGeneralHash != currentGeneralHash

                    if (isAlarm || isNewGeneral) {
                         NotificationHelper.showNotification(
                            context,
                            K.generalNotice.tr(lang),
                            "$generalText" + if (generalAuthor.isNotBlank()) K.authorAttribution.trWithLang(lang, generalAuthor) else "",
                            NotificationHelper.CHANNEL_ID_DAILY,
                            notificationId = 2002
                        )
                        notifPrefs.edit().putString("last_general_hash", currentGeneralHash).apply()
                    }
                }
            }

            if (!isAlarm) {
                // LiveUpdateChecker only checks for newly posted daily updates and general notices.
                // Full daily briefings (exam alerts, today's events, timetable schedule)
                // are strictly handled by the 3 scheduled morning alarms.
                return
            }


            // B. Exam Alerts
            if (examAlertsEnabled) {
                val examsData = masterData.exams
                val tomorrow = today.plusDays(1)
                val tomorrowStr = tomorrow.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
                
                Log.d(TAG, "Processing ${examsData.size} exams for Today: $todayDateStr, Tomorrow: $tomorrowStr")

                examsData.forEach { exam ->
                    // 1. Regular Exams (date on subject level)
                    val subjectToday = exam.subjects.find { it.date == todayDateStr }
                    if (subjectToday != null) {
                        val courseName = courses.find { it.code == subjectToday.code }?.name ?: subjectToday.code
                        val title = "${K.examToday.tr(lang)}: $courseName"
                        val message = "${K.bestOfLuckFor.tr(lang)} $courseName! ${K.time.tr(lang)}: ${subjectToday.startTime} - ${subjectToday.endTime}"
                        val nId = (todayDateStr + title).hashCode()
                        
                        Log.d(TAG, "Showing Exam Today: $title with ID: $nId")
                        NotificationHelper.showNotification(
                            context,
                            title,
                            message,
                            NotificationHelper.CHANNEL_ID_EXAMS,
                            notificationId = nId
                        )
                    }

                    val subjectTomorrow = exam.subjects.find { it.date == tomorrowStr }
                    if (subjectTomorrow != null) {
                        val courseName = courses.find { it.code == subjectTomorrow.code }?.name ?: subjectTomorrow.code
                        val title = "${K.examTomorrow.tr(lang)}: $courseName"
                        val message = "${K.prepareFor.tr(lang)} $courseName. ${K.time.tr(lang)}: ${subjectTomorrow.startTime} - ${subjectTomorrow.endTime}"
                        val nId = (todayDateStr + title).hashCode()

                        Log.d(TAG, "Showing Exam Tomorrow: $title with ID: $nId")
                        NotificationHelper.showNotification(
                            context,
                            title,
                            message,
                            NotificationHelper.CHANNEL_ID_EXAMS,
                            notificationId = nId
                        )
                    }

                    // 2. Practical Exams (date on batch level)
                    exam.subjects.forEach { sub ->
                        if (sub.batches.isNotEmpty()) {
                            val courseName = courses.find { it.code == sub.code }?.name ?: sub.code
                            
                            // Today's practical batches
                            val todayBatches = sub.batches.filter { it.date == todayDateStr }
                            if (todayBatches.isNotEmpty()) {
                                val batchDetails = todayBatches.joinToString("\n") { b ->
                                    val batchLabel = if (b.label.isNotBlank()) K.batchLabelFormat.trWithLang(lang, b.label) else ""
                                    val timeStr = if (b.startTime.isNotBlank()) "${b.startTime} - ${b.endTime}" else ""
                                    val regStr = if (b.registerRange.isNotBlank()) K.registerRangeFormat.trWithLang(lang, b.registerRange) else ""
                                    val countStr = if (b.totalCount.isNotBlank()) K.studentsCountFormat.trWithLang(lang, b.totalCount) else ""
                                    listOf(batchLabel, timeStr, regStr, countStr)
                                        .filter { it.isNotBlank() }
                                        .joinToString(" • ")
                                }
                                val title = "${K.practicalExamToday.tr(lang)}: $courseName"
                                val message = "${exam.title}\n$batchDetails"
                                val nId = (todayDateStr + "prac" + sub.code).hashCode()
                                
                                Log.d(TAG, "Showing Practical Today: $title with ID: $nId")
                                NotificationHelper.showNotification(
                                    context,
                                    title,
                                    message,
                                    NotificationHelper.CHANNEL_ID_EXAMS,
                                    notificationId = nId
                                )
                                db.notificationDao().insertNotification(
                                    NotificationEntity(
                                        title = title,
                                        message = message,
                                        type = "exam",
                                        timestamp = System.currentTimeMillis()
                                    )
                                )
                            }
                            
                            // Tomorrow's practical batches
                            val tomorrowBatches = sub.batches.filter { it.date == tomorrowStr }
                            if (tomorrowBatches.isNotEmpty()) {
                                val batchDetails = tomorrowBatches.joinToString("\n") { b ->
                                    val batchLabel = if (b.label.isNotBlank()) K.batchLabelFormat.trWithLang(lang, b.label) else ""
                                    val timeStr = if (b.startTime.isNotBlank()) "${b.startTime} - ${b.endTime}" else ""
                                    val regStr = if (b.registerRange.isNotBlank()) K.registerRangeFormat.trWithLang(lang, b.registerRange) else ""
                                    val countStr = if (b.totalCount.isNotBlank()) K.studentsCountFormat.trWithLang(lang, b.totalCount) else ""
                                    listOf(batchLabel, timeStr, regStr, countStr)
                                        .filter { it.isNotBlank() }
                                        .joinToString(" • ")
                                }
                                val title = "${K.practicalExamTomorrow.tr(lang)}: $courseName"
                                val message = "${exam.title}\n$batchDetails"
                                val nId = (todayDateStr + "practmrw" + sub.code).hashCode()
                                
                                Log.d(TAG, "Showing Practical Tomorrow: $title with ID: $nId")
                                NotificationHelper.showNotification(
                                    context,
                                    title,
                                    message,
                                    NotificationHelper.CHANNEL_ID_EXAMS,
                                    notificationId = nId
                                )
                            }
                        }
                    }
                }
            }

            // B2. Special Class Alerts
            val specialClasses = masterData.specialClasses
            val todaySpecialClass = specialClasses.find { it.date == todayDateStr }
            if (todaySpecialClass != null) {
                val batchInfo = todaySpecialClass.batches.joinToString("\n\n") { b ->
                    val subStr = if (b.subjectName.isNotBlank()) b.subjectName else b.subjectCode
                    val timeStr = if (b.startTime.isNotBlank()) "${b.startTime} - ${b.endTime}" else ""
                    val facStr = if (b.faculty.isNotBlank()) b.faculty else ""
                    
                    val lines = mutableListOf<String>()
                    if (subStr.isNotBlank()) {
                        lines.add(if (facStr.isNotBlank()) "$subStr ($facStr)" else subStr)
                    }
                    if (timeStr.isNotBlank()) lines.add(timeStr)
                    lines.joinToString("\n")
                }
                val title = todaySpecialClass.typeTitle.ifBlank { K.specialClassToday.tr(lang) }
                val message = if (todaySpecialClass.title.isNotBlank()) {
                    "${todaySpecialClass.title}\n$batchInfo"
                } else batchInfo
                val nId = (todayDateStr + "special" + todaySpecialClass.id).hashCode()
                
                NotificationHelper.showNotification(
                    context,
                    title,
                    message,
                    NotificationHelper.CHANNEL_ID_EXAMS,
                    notificationId = nId
                )
                db.notificationDao().insertNotification(
                    NotificationEntity(
                        title = title,
                        message = message,
                        type = "special_class",
                        timestamp = System.currentTimeMillis()
                    )
                )
            }
            
            // C. Today's Events
            if (eventRemindersEnabled && todaysEvents.isNotEmpty()) {
                todaysEvents.forEach { event ->
                    val type = event.type
                    val isFullDay = type == "FullDay" || (type == "Event" && event.isSection && (event.fullTime.equals("All Day", ignoreCase = true) || event.fullTime.equals("Full Day", ignoreCase = true)))
                    val isHalfDay = type == "HalfDay" || (type == "Event" && event.isSection && !event.fullTime.isNullOrBlank() && !event.fullTime.equals("All Day", ignoreCase = true) && !event.fullTime.equals("Full Day", ignoreCase = true))
                    
                    val isExamEvent = event.title.lowercase().let { 
                        it.contains("sia") || it.contains("internal") || it.contains("model") || 
                        it.contains("cycle") || it.contains("semester") || it.contains("fia") ||
                        it.contains("practical") || it.contains("lab") || it.contains("தேர்வு") || it.contains("thervu")
                    }
                    val title = when {
                        isHoliday -> K.holidayToday.tr(lang)
                        isExamEvent -> K.examToday.tr(lang)
                        event.isSection -> if (isFullDay) K.fullDayNotice.tr(lang) else if (isHalfDay) K.halfDayNotice.tr(lang) else K.sectionNotice.tr(lang)
                        else -> K.academicCalendarUpdate.tr(lang)
                    }
                    
                    val message = if (isHalfDay && !event.startTime.isNullOrBlank()) {
                        "${event.title} (${event.startTime} - ${event.endTime})"
                    } else if (isHalfDay && !event.fullTime.isNullOrBlank()) {
                        "${event.title} (${event.fullTime})"
                    } else {
                        event.title
                    }
                    
                    NotificationHelper.showNotification(
                        context,
                        title,
                        message,
                        NotificationHelper.CHANNEL_ID_EVENTS,
                        notificationId = kotlin.math.abs(event.id.hashCode()) + 3003
                    )
                }
            }

            // D. Timetable Logic: Suppress if Major Exam, Practical Exam, or Special Class
            val suppressSchedule = isMajorExamToday || isPracticalExamToday || isSpecialClassToday
            if (classScheduleEnabled && !isHoliday && !suppressSchedule) {
                val periods = timetable[dayKey]
                if (!periods.isNullOrEmpty()) {
                    val subjects = periods.map { code ->
                        if (code.contains("/")) {
                            code 
                        } else {
                            courses.find { it.code == code || it.name == code }?.code ?: code
                        }
                    }
                    
                    val subjectAndPeriods = subjects.filter { it.isNotBlank() && it != "-" }
                    if (subjectAndPeriods.isNotEmpty()) {
                        val localizedDayKey = today.dayOfWeek.toMozhiName(lang)
                        val title = "${K.todaysSchedule.tr(lang)} ($localizedDayKey)"
                        val message = subjectAndPeriods.take(5).joinToString(", ") + if (subjectAndPeriods.size > 5) ", ..." else ""
                        
                        NotificationHelper.showNotification(
                            context,
                            title,
                            message,
                            NotificationHelper.CHANNEL_ID_DAILY,
                            notificationId = 4004
                        )
                    }
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error executing DailyUpdate logic", e)
        }
    }
    
    private fun getCleanSubjectName(name: String): String {
        var cleaned = name.replace(Regex("\\s*\\(.*?\\)"), "").trim()
        val terms = listOf("Lab Integrated", "Integrated Lab", "Integrated", "Lab")
        terms.forEach { term ->
            cleaned = cleaned.replace(Regex("\\s*$term", RegexOption.IGNORE_CASE), "").trim()
        }
        return cleaned.replace(Regex("[-\\s/]+$"), "")
    }

    private fun checkIsLab(code: String, courses: List<com.elvan.neram.data.model.Course>, batch: String): Boolean {
        val trimmedCode = code.trim()
        val parts = trimmedCode.split(" ")
        val pureCode = parts.first()

        val course = courses.find { it.code == trimmedCode }
            ?: courses.find { it.code == pureCode }

        if (course != null) {
            val suffix = parts.getOrNull(1) ?: ""
            val batchPattern = Regex("^[A-Za-z]\\d+$")
            return batchPattern.matches(suffix)
        }
        return false
    }
}

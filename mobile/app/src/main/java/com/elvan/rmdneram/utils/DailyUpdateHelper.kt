package com.elvan.rmdneram.utils

import android.content.Context
import android.util.Log
import com.elvan.rmdneram.data.local.NeramDatabase
import com.elvan.rmdneram.data.local.entity.NotificationEntity
import com.elvan.rmdneram.ui.common.NotificationHelper
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

    suspend fun processDailyUpdates(context: Context, dateOverride: String? = null) {
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
            val settingsPrefs = context.getSharedPreferences("notification_settings", Context.MODE_PRIVATE)

            // Read Notification Settings
            val dailyUpdateEnabled = settingsPrefs.getBoolean("daily_update", true)
            val generalNoticeEnabled = settingsPrefs.getBoolean("general_notice", true)
            val classScheduleEnabled = settingsPrefs.getBoolean("class_schedule", true)
            val labRemindersEnabled = settingsPrefs.getBoolean("lab_reminders", true)
            val studyRemindersEnabled = settingsPrefs.getBoolean("study_reminders", true)
            val examAlertsEnabled = settingsPrefs.getBoolean("exam_alerts", true)
            val eventRemindersEnabled = settingsPrefs.getBoolean("event_reminders", true)

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
            
            val database = FirebaseDatabase.getInstance()
            val eventsRef = database.getReference("events/$batch/$dept/$section")
            val eventsSnapshot = eventsRef.get().await()
            val liveSectionEvents = eventsSnapshot.children.mapNotNull { child ->
                try {
                    val rawDate = child.child("date").getValue(String::class.java) ?: ""
                    val normalizedDate = if (rawDate.matches(Regex("\\d{2}-\\d{2}-\\d{4}"))) {
                        val parts = rawDate.split("-")
                        "${parts[2]}-${parts[1]}-${parts[0]}"
                    } else { rawDate }
                    com.elvan.rmdneram.data.model.CalendarEvent(
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
                } catch(e: Exception) { null }
            }
            
            val calendarEvents = globalEvents + liveSectionEvents
            val todaysEvents = calendarEvents.filter { it.date == todayDateStr }
            
            // Calculate Day Order / Schedule Status
            val isSunday = today.dayOfWeek == java.time.DayOfWeek.SUNDAY
            val isHoliday = isSunday || todaysEvents.any {
                it.type == "Holiday" || it.type == "FullDay" ||
                it.title.lowercase().contains("holiday")
            }
            var dayKey = today.dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
            
            if (!isHoliday) {
                val orderEvent = calendarEvents.find { it.date == todayDateStr && (it.type == "Order" || it.title.contains("Order", ignoreCase = true)) }
                if (orderEvent != null) {
                   for (i in 1..6) {
                        if (orderEvent.title.contains("Day $i", ignoreCase = true)) {
                            dayKey = "Day $i"
                            break
                        }
                    }
                    java.time.DayOfWeek.values().forEach { day ->
                        val name = day.getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
                        if (orderEvent.title.contains(name, ignoreCase = true)) {
                            dayKey = name
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
                        automatedNotices.add("📚 Bring Labcoats, Laptops & Lab Essentials")
                    } else if (!isMajorExamToday && !isCycleTestToday) {
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
                                automatedNotices.add("Lab for Batch $batchSuffix: $cleanedName")
                            }
                            automatedNotices.add("📚 Bring Labcoats, Laptops & Lab Essentials")
                        }
                    }
                }
                
                // Study Well Logic
                if (studyRemindersEnabled && hasAnyExamToday) {
                    automatedNotices.add("📖 Study well for the test! Score well and get full marks! All the best! 🎯")
                }
            }

            // 4. Fetch Data from Firebase (Deduplication REMOVED - so it rings all 3 times)
            val updatesRef = database.getReference("updates/$batch/$dept/$section")
            val sectionSnapshot = updatesRef.get().await()
            
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
                    NotificationHelper.showNotification(
                        context,
                        "Daily Update ($todayDateStr)",
                        "$note" + if (author.isNotBlank()) " - $author" else "",
                        NotificationHelper.CHANNEL_ID_DAILY,
                        notificationId = 1001 
                    )
                }
            } else if (automatedNotices.isNotEmpty()) {
                // If daily update is off from firebase, but we still have automated notices (labs/study), show them as an automated update
                val comboNotice = automatedNotices.joinToString("\n\n")
                NotificationHelper.showNotification(
                    context,
                    "Automated Reminders",
                    comboNotice,
                    NotificationHelper.CHANNEL_ID_DAILY,
                    notificationId = 1001 
                )
            }

            if (generalNoticeEnabled) {
                val generalText = sectionSnapshot.child("general_text").value?.toString() ?: ""
                val generalAuthor = sectionSnapshot.child("general_author").value?.toString() ?: ""
                if (generalText.isNotBlank()) {
                     NotificationHelper.showNotification(
                        context,
                        "General Notice",
                        "$generalText" + if (generalAuthor.isNotBlank()) " - $generalAuthor" else "",
                        NotificationHelper.CHANNEL_ID_DAILY,
                        notificationId = 2002
                    )
                }
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
                        val title = "Exam Today: $courseName"
                        val message = "Best of luck for $courseName! Time: ${subjectToday.startTime} - ${subjectToday.endTime}"
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
                        val title = "Exam Tomorrow: $courseName"
                        val message = "Prepare for $courseName. Time: ${subjectTomorrow.startTime} - ${subjectTomorrow.endTime}"
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
                                    val batchLabel = if (b.label.isNotBlank()) "Batch ${b.label}" else ""
                                    val timeStr = if (b.startTime.isNotBlank()) "${b.startTime} - ${b.endTime}" else ""
                                    val regStr = if (b.registerRange.isNotBlank()) "Reg: ${b.registerRange}" else ""
                                    val countStr = if (b.totalCount.isNotBlank()) "${b.totalCount} Students" else ""
                                    listOf(batchLabel, timeStr, regStr, countStr)
                                        .filter { it.isNotBlank() }
                                        .joinToString(" • ")
                                }
                                val title = "Practical Exam Today: $courseName"
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
                                    val batchLabel = if (b.label.isNotBlank()) "Batch ${b.label}" else ""
                                    val timeStr = if (b.startTime.isNotBlank()) "${b.startTime} - ${b.endTime}" else ""
                                    val regStr = if (b.registerRange.isNotBlank()) "Reg: ${b.registerRange}" else ""
                                    val countStr = if (b.totalCount.isNotBlank()) "${b.totalCount} Students" else ""
                                    listOf(batchLabel, timeStr, regStr, countStr)
                                        .filter { it.isNotBlank() }
                                        .joinToString(" • ")
                                }
                                val title = "Practical Exam Tomorrow: $courseName"
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
                val title = todaySpecialClass.typeTitle.ifBlank { "Special Class" } + " Today"
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
                    val isHoliday = type == "Holiday" || event.title.lowercase().contains("holiday")
                    val isFullDay = type == "FullDay"
                    val isHalfDay = type == "HalfDay"
                    
                    val isExamEvent = event.title.lowercase().let { 
                        it.contains("sia") || it.contains("internal") || it.contains("model") || 
                        it.contains("cycle") || it.contains("semester") || it.contains("fia") ||
                        it.contains("practical") || it.contains("lab")
                    }
                    val title = when {
                        isHoliday -> "Holiday Today"
                        isExamEvent -> "Exam Today"
                        else -> "Today's Event"
                    }
                    
                    val message = if (isHalfDay && !event.startTime.isNullOrBlank()) {
                        "${event.title} (${event.startTime} - ${event.endTime})"
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
                        val title = "Today's Schedule ($dayKey)"
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

    private fun checkIsLab(code: String, courses: List<com.elvan.rmdneram.data.model.Course>, batch: String): Boolean {
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

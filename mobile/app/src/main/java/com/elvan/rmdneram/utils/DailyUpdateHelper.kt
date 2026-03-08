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
        Log.d(TAG, "Starting to process daily notifications")
        NotificationHelper.showNotification(
            context,
            "Debug",
            "processDailyUpdates started testing " + (dateOverride ?: "today"),
            NotificationHelper.CHANNEL_ID_DAILY,
            9999
        )
        
        try {
            val today = if (dateOverride != null) {
                try {
                    LocalDate.parse(dateOverride)
                } catch (e: Exception) {
                    LocalDate.now()
                }
            } else {
                LocalDate.now()
            }
            val settingsPrefs = context.getSharedPreferences("notification_settings", Context.MODE_PRIVATE)

            // Read Notification Settings
            val dailyBriefingEnabled = settingsPrefs.getBoolean("daily_briefing", true)
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
            val todayDateStr = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
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

            // Automated Messages Logic (Lab & Exam)
            val automatedNotices = mutableListOf<String>()
            
            if (!isHoliday) {
                val periods = timetable[dayKey] ?: emptyList()
                val hasLab = periods.any { code ->
                     if (code.contains("/")) {
                         code.split("/").any { part -> checkIsLab(part.trim(), courses, batch) }
                     } else {
                         checkIsLab(code.trim(), courses, batch)
                     }
                }
                
                if (hasLab) {
                    automatedNotices.add("📚 Bring Labcoats, Laptops & Lab Essentials")
                }
                
                val activeExamPeriod = exams.find { todayDateStr >= it.startDate && todayDateStr <= it.endDate }
                val hasExamToday = activeExamPeriod?.subjects?.any { it.date == todayDateStr } == true
                
                if (hasExamToday) {
                    automatedNotices.add("📖 Study well for the test! Score well and get full marks! All the best! 🎯")
                }
            }

            // 4. Fetch Data from Firebase (Deduplication REMOVED - so it rings all 3 times)
            val updatesRef = database.getReference("updates/$batch/$dept/$section")
            val sectionSnapshot = updatesRef.get().await()
            
            // A. Daily Update Logic
            if (dailyBriefingEnabled) {
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
                        notificationId = 1001 // Consistent ID will overwrite previous ones
                    )
                }

                // General Notice Logic
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

                examsData.forEach { exam ->
                    // 1. Notify for Today
                    val subjectToday = exam.subjects.find { it.date == todayDateStr }
                    if (subjectToday != null) {
                        val courseName = courses.find { it.code == subjectToday.code }?.name ?: subjectToday.code
                        val title = "Exam Today: $courseName"
                        val message = "Best of luck for $courseName! Time: ${subjectToday.startTime} - ${subjectToday.endTime}"
                        
                        NotificationHelper.showNotification(
                            context,
                            title,
                            message,
                            NotificationHelper.CHANNEL_ID_EXAMS,
                            notificationId = subjectToday.code.hashCode() + 1
                        )
                    }

                    // 2. Notify for Tomorrow
                    val subjectTomorrow = exam.subjects.find { it.date == tomorrowStr }
                    if (subjectTomorrow != null) {
                        val courseName = courses.find { it.code == subjectTomorrow.code }?.name ?: subjectTomorrow.code
                        val title = "Exam Tomorrow: $courseName"
                        val message = "Prepare for $courseName. Time: ${subjectTomorrow.startTime} - ${subjectTomorrow.endTime}"
                        
                        NotificationHelper.showNotification(
                            context,
                            title,
                            message,
                            NotificationHelper.CHANNEL_ID_EXAMS,
                            notificationId = subjectTomorrow.code.hashCode()
                        )
                    }
                }
            }
            
            // C. Today's Events
            if (eventRemindersEnabled && todaysEvents.isNotEmpty()) {
                todaysEvents.forEach { event ->
                    val type = event.type
                    val isHoliday = type == "Holiday" || event.title.lowercase().contains("holiday")
                    val isFullDay = type == "FullDay"
                    val isHalfDay = type == "HalfDay"
                    
                    val title = when {
                        isHoliday -> "Holiday Today"
                        isFullDay -> "Full Day Event Today"
                        isHalfDay -> "Half Day Event Today"
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

            // D. Timetable Logic (Only if NOT a holiday)
            if (dailyBriefingEnabled && !isHoliday) {
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

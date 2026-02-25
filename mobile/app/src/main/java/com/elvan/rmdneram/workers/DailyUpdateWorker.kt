package com.elvan.rmdneram.workers

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.elvan.rmdneram.data.local.NeramDatabase
import com.elvan.rmdneram.ui.common.NotificationHelper
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.database.FirebaseDatabase
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.tasks.await
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import com.elvan.rmdneram.data.local.entity.NotificationEntity

/**
 * Worker to check for daily updates and general notices in the background
 * Runs periodically (once a day)
 */
class DailyUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting DailyUpdateWorker execution")
        
        try {
            val today = LocalDate.now()
            val prefs = applicationContext.getSharedPreferences("notification_prefs", Context.MODE_PRIVATE)
            val settingsPrefs = applicationContext.getSharedPreferences("notification_settings", Context.MODE_PRIVATE)

            // Read Notification Settings
            val dailyBriefingEnabled = settingsPrefs.getBoolean("daily_briefing", true)
            val examAlertsEnabled = settingsPrefs.getBoolean("exam_alerts", true)
            val eventRemindersEnabled = settingsPrefs.getBoolean("event_reminders", true)

            // 2. Get Current User
            val auth = FirebaseAuth.getInstance()
            val currentUser = auth.currentUser
            if (currentUser == null) {
                Log.d(TAG, "Skipping worker: User not logged in")
                return Result.success()
            }

            // 3. Get User Profile from Local DB
            val db = NeramDatabase.getDatabase(applicationContext)
            val userProfile = db.userDao().getUserProfile(currentUser.uid).first()
            
            if (userProfile == null) {
                Log.d(TAG, "Skipping worker: User profile not found in DB")
                return Result.success()
            }
            
            val batch = userProfile.batch
            val dept = userProfile.department
            val section = userProfile.section
            
            if (batch.isBlank() || dept.isBlank() || section.isBlank()) {
                Log.d(TAG, "Skipping worker: User profile incomplete")
                return Result.success()
            }

            // 4. Fetch ALL Data Logic (Moved up for dependencies)
            // Fetch Local DB Data first to determine Schedule/Labs
            val masterDataEntity = db.masterDataDao().getMasterData().first() ?: return Result.success() // Fail safe
            val masterData = masterDataEntity.toMasterData()
            val courses = masterData.courses
            val timetable = masterData.timetable
            val exams = masterData.exams
            
            val calendarEvents = db.calendarEventDao().getAllEvents().first()
            val todayDateStr = today.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
            val todaysEvents = calendarEvents.filter { it.date == todayDateStr }
            
            // Calculate Day Order / Schedule Status
            // Match CalendarEvent.isHoliday() — check title, not just type
            val isSunday = today.dayOfWeek == java.time.DayOfWeek.SUNDAY
            val isHoliday = isSunday || todaysEvents.any {
                it.type == "Holiday" || it.type == "FullDay" ||
                it.title.lowercase().contains("holiday")
            }
            var dayKey = today.dayOfWeek.getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH)
            
            // Logic to find "Day X" or override
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
                // Check for Lab
                val periods = timetable[dayKey] ?: emptyList()
                val hasLab = periods.any { code ->
                     // Check course name/title for "Lab" or if batch matches
                     if (code.contains("/")) {
                         code.split("/").any { part -> checkIsLab(part.trim(), courses, batch) }
                     } else {
                         checkIsLab(code.trim(), courses, batch)
                     }
                }
                
                if (hasLab) {
                    automatedNotices.add("📚 Bring Labcoats, Laptops & Lab Essentials")
                }
                
                // Check for Today's Exam
                val activeExamPeriod = exams.find { todayDateStr >= it.startDate && todayDateStr <= it.endDate }
                val hasExamToday = activeExamPeriod?.subjects?.any { it.date == todayDateStr } == true
                
                if (hasExamToday) {
                    automatedNotices.add("📖 Study well for the test! Score well and get full marks! All the best! 🎯")
                }
            }





            // 5. Fetch Data from Firebase (Single Fetch Optimization)
            val database = FirebaseDatabase.getInstance()
            val updatesRef = database.getReference("updates/$batch/$dept/$section")
            
            // Fetch everything under the section node once
            val sectionSnapshot = updatesRef.get().await()
            
            // A. Daily Update Logic (With Deduplication)
            if (dailyBriefingEnabled) {
                val dailyUpdateSnapshot = sectionSnapshot.child("daily_update").child(todayDateStr)
                
                // Get Firebase Note
                var note = if (dailyUpdateSnapshot.exists()) dailyUpdateSnapshot.child("note").value?.toString() ?: "" else ""
                val author = if (dailyUpdateSnapshot.exists()) dailyUpdateSnapshot.child("author").value?.toString() ?: "" else ""
                
                // Append Automated Notices
                if (automatedNotices.isNotEmpty()) {
                    val comboNotice = automatedNotices.joinToString("\n\n")
                    note = if (note.isBlank()) comboNotice else "$note\n\n$comboNotice"
                }

                if (note.isNotBlank()) {
                    // Check if we already showed this specific update
                    val lastDailyContent = prefs.getString("last_daily_update_content", "")
                    
                    if (lastDailyContent != note) {
                        NotificationHelper.showNotification(
                            applicationContext,
                            "Daily Update ($todayDateStr)",
                            "$note" + if (author.isNotBlank()) " - $author" else "",
                            NotificationHelper.CHANNEL_ID_DAILY,
                            notificationId = 1001
                        )
                        // Save the content we just showed to prevent repeating it
                        prefs.edit().putString("last_daily_update_content", note).apply()
                    }
                }
            }

                if (examAlertsEnabled) {
                    val exams = masterData.exams
                    val tomorrow = today.plusDays(1)
                    val tomorrowStr = tomorrow.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
    
                    exams.forEach { exam ->
                        val subjectTomorrow = exam.subjects.find { it.date == tomorrowStr }
                        if (subjectTomorrow != null) {
                            val title = "Exam Tomorrow: ${subjectTomorrow.code}"
                            val message = "Prepare for ${subjectTomorrow.code}. Time: ${subjectTomorrow.startTime} - ${subjectTomorrow.endTime}"
                            
                            if (prefs.getString("last_exam_notif", "") != title) {
                                NotificationHelper.showNotification(
                                    applicationContext,
                                    title,
                                    message,
                                    NotificationHelper.CHANNEL_ID_EXAMS,
                                    notificationId = subjectTomorrow.code.hashCode()
                                )
                                val notifDao = db.notificationDao()
                                val notif = NotificationEntity(
                                    title = title,
                                    message = message,
                                    timestamp = System.currentTimeMillis(),
                                    type = "exam"
                                )
                                notifDao.insertNotification(notif)
                                prefs.edit().putString("last_exam_notif", title).apply()
                            }
                        }
                    }
                }
                
                // B. Today's Timetable & Events


                if (eventRemindersEnabled && todaysEvents.isNotEmpty()) {
                    val eventTitles = todaysEvents.joinToString(", ") { it.title }
                    val isEventHoliday = todaysEvents.any { 
                        it.type == "Holiday" || it.type == "FullDay" || 
                        it.title.lowercase().contains("holiday")
                    }
                    val title = if (isEventHoliday) "Holiday Today" else "Today's Event"
                    
                    if (prefs.getString("last_event_notif_date", "") != todayDateStr) {
                         NotificationHelper.showNotification(
                            applicationContext,
                            title,
                            eventTitles,
                            NotificationHelper.CHANNEL_ID_EVENTS,
                            notificationId = eventTitles.hashCode()
                        )
                        db.notificationDao().insertNotification(
                            NotificationEntity(
                                title = title,
                                message = eventTitles,
                                timestamp = System.currentTimeMillis(),
                                type = "alert"
                            )
                        )
                        prefs.edit().putString("last_event_notif_date", todayDateStr).apply()
                    }
                }

                // 2. Timetable (Only if NOT a holiday)
                
                if (dailyBriefingEnabled && !isHoliday) {
                    // Use calculated dayKey and timetable
                    val periods = timetable[dayKey]
                    if (!periods.isNullOrEmpty()) {
                        val subjects = periods.map { code ->
                            // Handle split courses simplified for notification
                            if (code.contains("/")) {
                                code 
                            } else {
                                courses.find { it.code == code || it.name == code }?.code ?: code
                            }
                        }
                        
                        // Join first 4 periods for brevity
                        val subjectAndPeriods = subjects.filter { it.isNotBlank() && it != "-" }
                        if (subjectAndPeriods.isNotEmpty()) {
                            val title = "Today's Schedule ($dayKey)"
                            val message = subjectAndPeriods.take(5).joinToString(", ") + if (subjectAndPeriods.size > 5) ", ..." else ""
                            
                            // Only show if haven't shown for this date
                            val lastScheduleDate = prefs.getString("last_schedule_date", "")
                            if (lastScheduleDate != todayDateStr) {
                                NotificationHelper.showNotification(
                                    applicationContext,
                                    title,
                                    message,
                                    NotificationHelper.CHANNEL_ID_DAILY,
                                    notificationId = dayKey.hashCode()
                                )
                                // Store in notification center
                                db.notificationDao().insertNotification(
                                    NotificationEntity(
                                        title = title,
                                        message = message,
                                        timestamp = System.currentTimeMillis(),
                                        type = "schedule"
                                    )
                                )
                                prefs.edit().putString("last_schedule_date", todayDateStr).apply()
                            }
                        }
                    }
                }


            // Mark as run for today
            prefs.edit().putString("last_run_date", today.toString()).apply()
            
            return Result.success()

        } catch (e: Exception) {
            Log.e(TAG, "Error executing DailyUpdateWorker", e)
            if (runAttemptCount < 3) {
                return Result.retry()
            }
            return Result.failure()
        }
    }
    
    // Helper to check for Lab — matches HomeViewModel batch suffix pattern
    // A period is a lab ONLY if the timetable entry has a batch suffix (A1, B2, C3, etc.)
    private fun checkIsLab(code: String, courses: List<com.elvan.rmdneram.data.model.Course>, batch: String): Boolean {
        val trimmedCode = code.trim()
        val parts = trimmedCode.split(" ")
        val pureCode = parts.first()

        // Find the course by exact match or by first word
        val course = courses.find { it.code == trimmedCode }
            ?: courses.find { it.code == pureCode }

        if (course != null) {
            // Lab detection: check if second word is a batch pattern (A1, B2, C3, etc.)
            // This matches HomeViewModel.formatSingleEntry logic exactly
            val suffix = parts.getOrNull(1) ?: ""
            val batchPattern = Regex("^[A-Za-z]\\d+$")
            return batchPattern.matches(suffix)
        }

        return false
    }

    companion object {
        const val TAG = "DailyUpdateWorker"
    }
}

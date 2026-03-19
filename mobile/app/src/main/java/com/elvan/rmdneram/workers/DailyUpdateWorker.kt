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
            val dailyUpdateEnabled = settingsPrefs.getBoolean("daily_update", true)
            val generalNoticeEnabled = settingsPrefs.getBoolean("general_notice", true)
            val classScheduleEnabled = settingsPrefs.getBoolean("class_schedule", true)
            val labRemindersEnabled = settingsPrefs.getBoolean("lab_reminders", true)
            val studyRemindersEnabled = settingsPrefs.getBoolean("study_reminders", true)
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

             // 1. Identify Exam Types for Today
            val examsToday = exams.filter { it.subjects.any { s -> s.date == todayDateStr } }
            val tomorrow = today.plusDays(1)
            val tomorrowStr = tomorrow.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))

            fun isMajor(title: String) = title.lowercase().let { t -> t.contains("sia") || t.contains("internal") || t.contains("model") || t.contains("semester") || t.contains("fia") }
            fun isPractical(title: String) = title.lowercase().let { t -> t.contains("practical") || t.contains("lab") || t.contains("iesw") }
            fun isCycle(title: String) = title.lowercase().let { t -> t.contains("cycle") || t.contains("ct") }

            val isMajorExamToday = examsToday.any { isMajor(it.title) || isMajor(it.type) } || 
                                   todaysEvents.any { isMajor(it.title) }
            
            val isPracticalExamToday = examsToday.any { isPractical(it.title) || isPractical(it.type) } ||
                                        todaysEvents.any { isPractical(it.title) }

            val isCycleTestToday = examsToday.any { isCycle(it.title) || isCycle(it.type) } ||
                                    todaysEvents.any { isCycle(it.title) }
                                   
            val hasAnyExamToday = isMajorExamToday || isPracticalExamToday || isCycleTestToday

             // Automated Messages Logic (Lab & Exam)
            val automatedNotices = mutableListOf<String>()
            
            if (!isHoliday) {
                // Lab Logic
                if (labRemindersEnabled) {
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
                    
                    if (labsToday.isNotEmpty() && !isMajorExamToday) {
                        labsToday.distinctBy { it.first + it.second }.forEach { (batchSuffix, subjectName) ->
                            val cleanedName = getCleanSubjectName(subjectName)
                            automatedNotices.add("Lab for Batch $batchSuffix: $cleanedName")
                        }
                        automatedNotices.add("📚 Bring Labcoats, Laptops & Lab Essentials")
                    } else if (isPracticalExamToday) {
                        automatedNotices.add("📚 Bring Labcoats, Laptops & Lab Essentials")
                    }
                }
                
                // Study Well Logic
                if (studyRemindersEnabled && hasAnyExamToday) {
                    automatedNotices.add("📖 Study well for the test! Score well and get full marks! All the best! 🎯")
                }
            }


            // 5. Fetch Data from Firebase (Single Fetch Optimization)
            val database = FirebaseDatabase.getInstance()
            val updatesRef = database.getReference("updates/$batch/$dept/$section")
            
            // Fetch everything under the section node once
            val sectionSnapshot = updatesRef.get().await()
            
            // A. Daily Update Logic (With Deduplication)
            if (dailyUpdateEnabled) {
                val dailyUpdateSnapshot = sectionSnapshot.child("daily_update").child(todayDateStr)
                
                // Get Firebase Note
                var note = if (dailyUpdateSnapshot.exists()) dailyUpdateSnapshot.child("note").value?.toString() ?: "" else ""
                val author = if (dailyUpdateSnapshot.exists()) dailyUpdateSnapshot.child("author").value?.toString() ?: "" else ""
                
                // Append Automated Notices if enabled
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
                            notificationId = 1001 // Consistent ID will overwrite previous ones
                        )
                        // Save the content we just showed to prevent repeating it
                        prefs.edit().putString("last_daily_update_content", note).apply()
                    }
                }
            } else if (automatedNotices.isNotEmpty()) { // If daily update is disabled, but automated notices are generated
                 val comboNotice = automatedNotices.joinToString("\n\n")
                 val lastDailyContent = prefs.getString("last_daily_update_content", "")
                 if (lastDailyContent != comboNotice) {
                     NotificationHelper.showNotification(
                         applicationContext,
                         "Automated Reminders",
                         comboNotice,
                         NotificationHelper.CHANNEL_ID_DAILY,
                         notificationId = 1001 
                     )
                     prefs.edit().putString("last_daily_update_content", comboNotice).apply()
                 }
            }

            if (generalNoticeEnabled) {
                val generalText = sectionSnapshot.child("general_text").value?.toString() ?: ""
                val generalAuthor = sectionSnapshot.child("general_author").value?.toString() ?: ""
                if (generalText.isNotBlank()) {
                    val lastGeneralContent = prefs.getString("last_general_notice_content", "")
                    
                    if (lastGeneralContent != generalText) {
                         NotificationHelper.showNotification(
                            applicationContext,
                            "General Notice",
                            "$generalText" + if (generalAuthor.isNotBlank()) " - $generalAuthor" else "",
                            NotificationHelper.CHANNEL_ID_DAILY,
                            notificationId = 2002
                        )
                        prefs.edit().putString("last_general_notice_content", generalText).apply()
                    }
                }
            }

                if (examAlertsEnabled) {
                    val exams = masterData.exams
                    val tomorrow = today.plusDays(1)
                    val tomorrowStr = tomorrow.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
    
                    exams.forEach { exam ->
                        // 1. Regular Exams (date on subject level)
                        val subjectToday = exam.subjects.find { it.date == todayDateStr }
                        if (subjectToday != null) {
                            val courseName = courses.find { it.code == subjectToday.code }?.name ?: subjectToday.code
                            val title = "Exam Today: $courseName"
                            val message = "Best of luck for $courseName! Time: ${subjectToday.startTime} - ${subjectToday.endTime}"
                            val nId = (todayDateStr + title).hashCode()
                            
                            if (prefs.getString("last_exam_today_notif", "") != title) {
                                NotificationHelper.showNotification(
                                    applicationContext,
                                    title,
                                    message,
                                    NotificationHelper.CHANNEL_ID_EXAMS,
                                    notificationId = nId
                                )
                                val notifDao = db.notificationDao()
                                val notif = NotificationEntity(
                                    title = title,
                                    message = message,
                                    timestamp = System.currentTimeMillis(),
                                    type = "exam"
                                )
                                notifDao.insertNotification(notif)
                                prefs.edit().putString("last_exam_today_notif", title).apply()
                            }
                        }

                        val subjectTomorrow = exam.subjects.find { it.date == tomorrowStr }
                        if (subjectTomorrow != null) {
                            val courseName = courses.find { it.code == subjectTomorrow.code }?.name ?: subjectTomorrow.code
                            val title = "Exam Tomorrow: $courseName"
                            val message = "Prepare for $courseName. Time: ${subjectTomorrow.startTime} - ${subjectTomorrow.endTime}"
                            val nId = (todayDateStr + title).hashCode()

                            if (prefs.getString("last_exam_tomorrow_notif", "") != title) {
                                NotificationHelper.showNotification(
                                    applicationContext,
                                    title,
                                    message,
                                    NotificationHelper.CHANNEL_ID_EXAMS,
                                    notificationId = nId
                                )
                                prefs.edit().putString("last_exam_tomorrow_notif", title).apply()
                            }
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
                                    
                                    val pracKey = "last_prac_today_${sub.code}"
                                    if (prefs.getString(pracKey, "") != title) {
                                        NotificationHelper.showNotification(
                                            applicationContext,
                                            title,
                                            message,
                                            NotificationHelper.CHANNEL_ID_EXAMS,
                                            notificationId = nId
                                        )
                                        db.notificationDao().insertNotification(
                                            NotificationEntity(
                                                title = title,
                                                message = message,
                                                timestamp = System.currentTimeMillis(),
                                                type = "exam"
                                            )
                                        )
                                        prefs.edit().putString(pracKey, title).apply()
                                    }
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
                                    
                                    val pracKey = "last_prac_tmrw_${sub.code}"
                                    if (prefs.getString(pracKey, "") != title) {
                                        NotificationHelper.showNotification(
                                            applicationContext,
                                            title,
                                            message,
                                            NotificationHelper.CHANNEL_ID_EXAMS,
                                            notificationId = nId
                                        )
                                        prefs.edit().putString(pracKey, title).apply()
                                    }
                                }
                            }
                        }
                    }
                }

                // B2. Special Class Alerts
                val specialClasses = masterData.specialClasses
                val todaySpecialClass = specialClasses.find { it.date == todayDateStr }
                if (todaySpecialClass != null) {
                    val specialKey = "last_special_${todaySpecialClass.id}"
                    if (prefs.getString(specialKey, "") != todayDateStr) {
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
                            applicationContext,
                            title,
                            message,
                            NotificationHelper.CHANNEL_ID_EXAMS,
                            notificationId = nId
                        )
                        db.notificationDao().insertNotification(
                            NotificationEntity(
                                title = title,
                                message = message,
                                timestamp = System.currentTimeMillis(),
                                type = "special_class"
                            )
                        )
                        prefs.edit().putString(specialKey, todayDateStr).apply()
                    }
                }
                
                // B. Today's Timetable & Events


                if (eventRemindersEnabled && todaysEvents.isNotEmpty()) {
                    val eventTitles = todaysEvents.joinToString(", ") { it.title }
                    val isExamEvent = todaysEvents.any { 
                        val t = it.title.lowercase()
                        t.contains("sia") || t.contains("internal") || t.contains("model") || 
                        t.contains("cycle") || t.contains("semester") || t.contains("fia") ||
                        t.contains("practical") || t.contains("lab")
                    }
                    val title = when {
                        isHoliday -> "Holiday Today"
                        isExamEvent -> "Exam Today"
                        else -> "Today's Event"
                    }
                    
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

                // D. Timetable Logic: Suppress only if Major Exam or Practical Exam
                val suppressSchedule = isMajorExamToday || isPracticalExamToday
                if (classScheduleEnabled && !isHoliday && !suppressSchedule) {
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
    
    // Helper to clean subject names for display
    private fun getCleanSubjectName(name: String): String {
        var cleaned = name.replace(Regex("\\s*\\(.*?\\)"), "").trim()
        val terms = listOf("Lab Integrated", "Integrated Lab", "Integrated", "Lab")
        terms.forEach { term ->
            cleaned = cleaned.replace(Regex("\\s*$term", RegexOption.IGNORE_CASE), "").trim()
        }
        return cleaned.replace(Regex("[-\\s/]+$"), "")
    }

    // Helper to check for Lab — matches HomeViewModel batch suffix pattern
    // A period is a lab ONLY if the timetable entry has a batch suffix (A1, B2, C3, etc.)
    private fun checkIsLab(code: String, courses: List<com.elvan.rmdneram.data.model.Course>, batchSuffix: String): Boolean {
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

package com.elvan.neram.ui.common

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.elvan.neram.MainActivity
import com.elvan.neram.R

import android.media.AudioAttributes
import android.media.RingtoneManager
import com.elvan.neram.ui.mozhiyaakkam.tr

/**
 * Helper class for managing notifications
 */
object NotificationHelper {
    // Versioned channel IDs to force update on devices where channels are already created with lower importance
    const val CHANNEL_ID_DAILY = "daily_updates_v7"
    const val CHANNEL_ID_INSTANT = "instant_alerts_v5"
    const val CHANNEL_ID_EXAMS = "exam_alerts_v5"
    const val CHANNEL_ID_EVENTS = "event_reminders_v5"
    
    /**
     * Create notification channels on app startup (Safe to call repeatedly)
     */
    fun createNotificationChannels(context: Context, lang: String = com.elvan.neram.ui.mozhiyaakkam.K.ENGLISH) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .build()
            
            val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val customPattern = longArrayOf(0, 500, 200, 500) // Start immediately, vibrate 500ms, pause 200ms, vibrate 500ms

            // Daily Updates - HIGH Importance for Popup
            val dailyChannel = NotificationChannel(
                CHANNEL_ID_DAILY,
                com.elvan.neram.ui.mozhiyaakkam.K.dailyBriefing.tr(lang),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = com.elvan.neram.ui.mozhiyaakkam.K.dailyUpdatesDesc.tr(lang)
                enableLights(true)
                enableVibration(true)
                setVibrationPattern(customPattern)
                setSound(defaultSoundUri, audioAttributes)
            }
            manager.createNotificationChannel(dailyChannel)
            
            // Instant Alerts - HIGH Importance
            val instantChannel = NotificationChannel(
                CHANNEL_ID_INSTANT,
                com.elvan.neram.ui.mozhiyaakkam.K.instantAlerts.tr(lang),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = com.elvan.neram.ui.mozhiyaakkam.K.instantAlertsDesc.tr(lang)
                enableLights(true)
                enableVibration(true)
                setVibrationPattern(customPattern)
                setSound(defaultSoundUri, audioAttributes)
            }
            manager.createNotificationChannel(instantChannel)

            // Exam Alerts - HIGH Importance
            val examChannel = NotificationChannel(
                CHANNEL_ID_EXAMS,
                com.elvan.neram.ui.mozhiyaakkam.K.examAlerts.tr(lang),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = com.elvan.neram.ui.mozhiyaakkam.K.examAlertsDesc.tr(lang)
                enableLights(true)
                enableVibration(true)
                setVibrationPattern(customPattern)
                setSound(defaultSoundUri, audioAttributes)
            }
            manager.createNotificationChannel(examChannel)

            // Event Reminders - HIGH Importance (upgraded from DEFAULT)
            val eventChannel = NotificationChannel(
                CHANNEL_ID_EVENTS,
                com.elvan.neram.ui.mozhiyaakkam.K.eventReminders.tr(lang),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = com.elvan.neram.ui.mozhiyaakkam.K.eventRemindersDesc.tr(lang)
                enableLights(true)
                enableVibration(true)
                setVibrationPattern(customPattern)
                setSound(defaultSoundUri, audioAttributes)
            }
            manager.createNotificationChannel(eventChannel)
        }
    }
    
    /**
     * Show a notification
     */
    fun showNotification(
        context: Context,
        title: String,
        message: String,
        channelId: String = CHANNEL_ID_DAILY,
        notificationId: Int = System.currentTimeMillis().toInt()
    ) {
        // Check permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                // Permission not granted, cannot show notification
                return
            }
        }

        // Create intent to open app
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        
        val pendingIntent: PendingIntent = PendingIntent.getActivity(
            context, 
            0, 
            intent, 
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.drawable.ic_notification) // Using transparent white icon for status bar
            .setColor(android.graphics.Color.parseColor("#002DFF")) // Brand Blue for the notification drawer background circle
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH) // Always High for Popup
            .setDefaults(NotificationCompat.DEFAULT_ALL) // Sound + Vibration
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))

        // Show notification
        try {
            with(NotificationManagerCompat.from(context)) {
                notify(notificationId, builder.build())
            }
        } catch (e: SecurityException) {
            // Should be caught by checkSelfPermission but good for safety
            e.printStackTrace()
        }
    }
}

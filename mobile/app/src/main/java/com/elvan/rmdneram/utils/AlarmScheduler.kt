package com.elvan.rmdneram.utils

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.elvan.rmdneram.receivers.DailyAlarmReceiver
import java.util.Calendar

object AlarmScheduler {
    private const val TAG = "AlarmScheduler"

    private fun getAlarmTimes(context: Context): List<Pair<Int, Int>> {
        val prefs = context.getSharedPreferences("notification_settings", Context.MODE_PRIVATE)
        val useCustom = prefs.getBoolean("use_custom_times", false)

        return if (useCustom) {
            listOf(
                Pair(prefs.getInt("custom_time_1_hour", 5), prefs.getInt("custom_time_1_minute", 30)),
                Pair(prefs.getInt("custom_time_2_hour", 6), prefs.getInt("custom_time_2_minute", 30)),
                Pair(prefs.getInt("custom_time_3_hour", 7), prefs.getInt("custom_time_3_minute", 30))
            )
        } else {
            listOf(
                Pair(5, 30),
                Pair(6, 30),
                Pair(7, 30)
            )
        }
    }

    fun scheduleDailyAlarm(context: Context) {
        val alarmTimes = getAlarmTimes(context)
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, DailyAlarmReceiver::class.java).apply {
                action = "com.elvan.neram.DAILY_ALARM"
            }
            
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Find the next closest alarm time
            val now = Calendar.getInstance()
            now.timeInMillis = System.currentTimeMillis()
            
            var nextAlarmTime: Calendar? = null
            
            for ((hour, minute) in alarmTimes) {
                val candidateTime = Calendar.getInstance().apply {
                    timeInMillis = System.currentTimeMillis()
                    set(Calendar.HOUR_OF_DAY, hour)
                    set(Calendar.MINUTE, minute)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }
                
                // If this specific time today is strictly in the future, it's our next slot
                if (candidateTime.timeInMillis > now.timeInMillis) {
                    nextAlarmTime = candidateTime
                    break
                }
            }
            
            // If all slots have passed today, schedule for the first slot tomorrow
            if (nextAlarmTime == null) {
                val (firstHour, firstMinute) = alarmTimes.first()
                nextAlarmTime = Calendar.getInstance().apply {
                    timeInMillis = System.currentTimeMillis()
                    add(Calendar.DAY_OF_YEAR, 1)
                    set(Calendar.HOUR_OF_DAY, firstHour)
                    set(Calendar.MINUTE, firstMinute)
                    set(Calendar.SECOND, 0)
                    set(Calendar.MILLISECOND, 0)
                }
            }

            Log.d(TAG, "Scheduling True Exact Alarm for: ${nextAlarmTime.time}")
            
            // Cancel any previously scheduled alarms for this intent first
            alarmManager.cancel(pendingIntent)

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarmManager.canScheduleExactAlarms()) {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        nextAlarmTime.timeInMillis,
                        pendingIntent
                    )
                } else {
                    Log.w(TAG, "Exact alarm permission missing! Falling back to setAndAllowWhileIdle.")
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        nextAlarmTime.timeInMillis,
                        pendingIntent
                    )
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    nextAlarmTime.timeInMillis,
                    pendingIntent
                )
            } else {
                alarmManager.setExact(
                    AlarmManager.RTC_WAKEUP,
                    nextAlarmTime.timeInMillis,
                    pendingIntent
                )
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Error scheduling true exact alarm", e)
        }
    }
}

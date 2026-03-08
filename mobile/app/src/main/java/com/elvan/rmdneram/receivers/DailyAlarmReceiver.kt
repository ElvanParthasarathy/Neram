package com.elvan.rmdneram.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.elvan.rmdneram.utils.AlarmScheduler
import com.elvan.rmdneram.utils.DailyUpdateHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class DailyAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Daily Alarm Received!")

        if (intent.action == "com.elvan.neram.DAILY_ALARM") {
            val dateOverride = intent.getStringExtra("date_override") // optional override
            
            // Keep device awake long enough to process Firebase data directly
            val pendingResult = goAsync()
            
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    // Fetch directly, bypassing WorkManager
                    DailyUpdateHelper.processDailyUpdates(context, dateOverride)
                } catch (e: Exception) {
                    Log.e(TAG, "Error processing daily updates in receiver", e)
                } finally {
                    // Always finish the receiver so the OS can sleep again
                    pendingResult.finish()
                    
                    // Schedule next alarm (5:30, 6:30, 7:30)
                    AlarmScheduler.scheduleDailyAlarm(context)
                }
            }
        } else if (intent.action == "android.intent.action.BOOT_COMPLETED") {
             AlarmScheduler.scheduleDailyAlarm(context)
        }
    }

    companion object {
        const val TAG = "DailyAlarmReceiver"
    }
}

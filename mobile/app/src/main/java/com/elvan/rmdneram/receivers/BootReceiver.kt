package com.elvan.rmdneram.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.elvan.rmdneram.utils.AlarmScheduler

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d(TAG, "Boot Completed: Rescheduling Alarm")
            AlarmScheduler.scheduleDailyAlarm(context)
        }
    }

    companion object {
        const val TAG = "BootReceiver"
    }
}

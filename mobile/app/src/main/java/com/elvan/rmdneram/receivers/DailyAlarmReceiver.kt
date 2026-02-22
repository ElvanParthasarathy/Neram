package com.elvan.rmdneram.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.WorkManager
import com.elvan.rmdneram.workers.DailyUpdateWorker
import com.elvan.rmdneram.utils.AlarmScheduler

class DailyAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Daily Alarm Received at 5:30 AM")
        
        // 1. Trigger the worker immediately as an expedited job
        val request = OneTimeWorkRequestBuilder<DailyUpdateWorker>()
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .build()

        WorkManager.getInstance(context).enqueue(request)

        // 2. Reschedule for the next day to ensure loop continues
        // (Though exact alarms usually need rescheduling, AlarmScheduler checks date and adds 1 day if needed)
        // Note: In strict Doze mode, this might fire slightly off, but exact alarm permission helps.
        AlarmScheduler.scheduleDailyAlarm(context)
    }

    companion object {
        const val TAG = "DailyAlarmReceiver"
    }
}

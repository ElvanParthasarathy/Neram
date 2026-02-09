package com.elvan.rmdneram.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.WorkManager
import com.elvan.rmdneram.workers.DailyUpdateWorker

class DailyAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Daily Alarm Received at 5:30 AM")
        
        // Trigger the worker immediately as an expedited job
        val request = OneTimeWorkRequestBuilder<DailyUpdateWorker>()
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .build()

        WorkManager.getInstance(context).enqueue(request)
    }

    companion object {
        const val TAG = "DailyAlarmReceiver"
    }
}

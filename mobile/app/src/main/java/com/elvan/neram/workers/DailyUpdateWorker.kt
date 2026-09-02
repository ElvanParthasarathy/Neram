package com.elvan.neram.workers

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.elvan.neram.utils.DailyUpdateHelper

/**
 * Worker to check for daily updates and general notices in the background.
 * Delegates directly to DailyUpdateHelper.
 */
class DailyUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        Log.d(TAG, "Starting DailyUpdateWorker execution")
        return try {
            DailyUpdateHelper.processDailyUpdates(applicationContext)
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error executing DailyUpdateWorker", e)
            Result.retry()
        }
    }

    companion object {
        private const val TAG = "DailyUpdateWorker"
    }
}

package com.elvan.rmdneram.data.local

import android.content.Context
import com.elvan.rmdneram.ui.calendar.NeramCalendarInfo

/**
 * Service for reading/writing calendar events.
 * Deprecated: Replaced by FirebaseRepository.
 */
class DeviceCalendarService(private val context: Context) {
    suspend fun getDeviceCalendars(): List<NeramCalendarInfo> = emptyList()
}

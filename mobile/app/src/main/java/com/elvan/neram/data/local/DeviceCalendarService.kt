package com.elvan.neram.data.local

import android.content.Context
import com.elvan.neram.ui.calendar.NeramCalendarInfo

/**
 * Service for reading/writing calendar events.
 * Deprecated: Replaced by FirebaseRepository.
 */
class DeviceCalendarService(private val context: Context) {
    suspend fun getDeviceCalendars(): List<NeramCalendarInfo> = emptyList()
}

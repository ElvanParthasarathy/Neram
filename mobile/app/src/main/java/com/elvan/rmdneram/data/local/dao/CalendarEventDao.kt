package com.elvan.rmdneram.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.elvan.rmdneram.data.local.entity.CalendarEventEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CalendarEventDao {
    // Get batch calendar events only (not section-specific)
    @Query("SELECT * FROM calendar_events WHERE isSection = 0")
    fun getAllEvents(): Flow<List<CalendarEventEntity>>
    
    // Get section-specific events only
    @Query("SELECT * FROM calendar_events WHERE isSection = 1")
    fun getSectionEvents(): Flow<List<CalendarEventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvents(events: List<CalendarEventEntity>)

    @Query("DELETE FROM calendar_events WHERE isSection = 0")
    suspend fun clearCalendarEvents()
    
    @Query("DELETE FROM calendar_events WHERE isSection = 1")
    suspend fun clearSectionEvents()
    
    @Query("DELETE FROM calendar_events")
    suspend fun clearEvents()

    @Transaction
    suspend fun replaceEvents(events: List<CalendarEventEntity>) {
        clearCalendarEvents()
        insertEvents(events)
    }
    
    @Transaction
    suspend fun replaceSectionEvents(events: List<CalendarEventEntity>) {
        clearSectionEvents()
        insertEvents(events)
    }
}

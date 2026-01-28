package com.elvan.rmdneram.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.elvan.rmdneram.data.local.entity.DailyUpdateEntity
import com.elvan.rmdneram.data.local.entity.GeneralNoticeEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UpdatesDao {
    @Query("SELECT * FROM daily_update")
    fun getAllDailyUpdates(): Flow<List<DailyUpdateEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDailyUpdate(update: DailyUpdateEntity)
    
    @Query("DELETE FROM daily_update")
    suspend fun clearAllDailyUpdates()
    
    @Query("DELETE FROM daily_update WHERE date < :cutoffDate")
    suspend fun deleteUpdatesOlderThan(cutoffDate: String)

    @Query("DELETE FROM daily_update WHERE date BETWEEN :startDate AND :endDate")
    suspend fun deleteUpdatesInRange(startDate: String, endDate: String)

    @Query("SELECT * FROM general_notice WHERE id = 'general_notice'")
    fun getGeneralNotice(): Flow<GeneralNoticeEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGeneralNotice(notice: GeneralNoticeEntity)
    
    @Query("DELETE FROM general_notice")
    suspend fun clearGeneralNotice()
}

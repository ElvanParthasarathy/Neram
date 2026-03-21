package com.elvan.rmdneram.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.elvan.rmdneram.data.local.entity.MasterDataEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface MasterDataDao {
    @Query("SELECT * FROM master_data WHERE id = 'master_schedule'")
    fun getMasterData(): Flow<MasterDataEntity?>

    @Query("SELECT * FROM master_data WHERE id = :id LIMIT 1")
    suspend fun getMasterDataById(id: String): MasterDataEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMasterData(data: MasterDataEntity)

    @Query("DELETE FROM master_data")
    suspend fun clearMasterData()
}

package com.elvan.rmdneram.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.elvan.rmdneram.data.model.MasterData
import com.google.gson.Gson

@Entity(tableName = "master_data")
data class MasterDataEntity(
    @PrimaryKey
    val id: String = "master_schedule", // Singleton row
    val json: String,
    val lastUpdated: Long = System.currentTimeMillis()
) {
    fun toMasterData(): MasterData {
        return try {
            Gson().fromJson(json, MasterData::class.java)
        } catch (e: Exception) {
            MasterData()
        }
    }

    companion object {
        fun fromMasterData(data: MasterData): MasterDataEntity {
            val json = Gson().toJson(data)
            return MasterDataEntity(json = json)
        }
    }
}

package com.elvan.neram.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.elvan.neram.data.model.DailyUpdate
import com.elvan.neram.data.model.GeneralNotice

@Entity(tableName = "daily_update")
data class DailyUpdateEntity(
    @PrimaryKey
    val date: String, // YYYY-MM-DD
    val note: String,
    val author: String,
    val createdAt: Long = 0L,
    val expiresAt: Long = 0L
) {
    fun toDailyUpdate(): DailyUpdate {
        return DailyUpdate(
            note = note,
            author = author,
            createdAt = createdAt,
            expiresAt = expiresAt
        )
    }

    companion object {
        fun fromDailyUpdate(date: String, update: DailyUpdate): DailyUpdateEntity {
            return DailyUpdateEntity(
                date = date,
                note = update.note,
                author = update.author,
                createdAt = update.createdAt,
                expiresAt = update.expiresAt
            )
        }
    }
}

@Entity(tableName = "general_notice")
data class GeneralNoticeEntity(
    @PrimaryKey
    val id: String = "general_notice", // Singleton
    val text: String,
    val author: String
) {
    fun toGeneralNotice(): GeneralNotice {
        return GeneralNotice(text, author)
    }

    companion object {
        fun fromGeneralNotice(notice: GeneralNotice): GeneralNoticeEntity {
            return GeneralNoticeEntity(text = notice.text, author = notice.author)
        }
    }
}

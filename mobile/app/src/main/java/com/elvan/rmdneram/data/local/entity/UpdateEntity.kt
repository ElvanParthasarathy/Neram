package com.elvan.rmdneram.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.elvan.rmdneram.data.model.DailyUpdate
import com.elvan.rmdneram.data.model.GeneralNotice

@Entity(tableName = "daily_update")
data class DailyUpdateEntity(
    @PrimaryKey
    val date: String, // YYYY-MM-DD
    val note: String,
    val author: String
) {
    fun toDailyUpdate(): DailyUpdate {
        return DailyUpdate(note, author)
    }

    companion object {
        fun fromDailyUpdate(date: String, update: DailyUpdate): DailyUpdateEntity {
            return DailyUpdateEntity(date = date, note = update.note, author = update.author)
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

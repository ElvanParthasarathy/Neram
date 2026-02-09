package com.elvan.rmdneram.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val message: String,
    val timestamp: Long,
    val type: String = "info", // info, warning, alert, exam, holiday
    val isRead: Boolean = false,
    val actionUrl: String? = null // Deep link or extra data
)

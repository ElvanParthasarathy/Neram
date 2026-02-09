package com.elvan.rmdneram.data.repository

import android.content.Context
import com.elvan.rmdneram.data.local.NeramDatabase
import com.elvan.rmdneram.data.local.entity.NotificationEntity
import kotlinx.coroutines.flow.Flow

class NotificationRepository(context: Context) {
    private val notificationDao = NeramDatabase.getDatabase(context).notificationDao()

    val allNotifications: Flow<List<NotificationEntity>> = notificationDao.getAllNotifications()
    val unreadCount: Flow<Int> = notificationDao.getUnreadCount()

    suspend fun addNotification(title: String, message: String, type: String = "info") {
        val notification = NotificationEntity(
            title = title,
            message = message,
            timestamp = System.currentTimeMillis(),
            type = type
        )
        notificationDao.insertNotification(notification)
    }

    suspend fun markAsRead(id: Long) {
        notificationDao.markAsRead(id)
    }

    suspend fun markAllAsRead() {
        notificationDao.markAllAsRead()
    }

    suspend fun clearAll() {
        notificationDao.clearAll()
    }

    suspend fun deleteNotification(id: Long) {
        notificationDao.deleteById(id)
    }
}

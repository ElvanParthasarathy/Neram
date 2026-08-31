package com.elvan.neram.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.elvan.neram.data.local.dao.CalendarEventDao
import com.elvan.neram.data.local.dao.MasterDataDao
import com.elvan.neram.data.local.dao.UpdatesDao
import com.elvan.neram.data.local.dao.UserDao
import com.elvan.neram.data.local.entity.CalendarEventEntity
import com.elvan.neram.data.local.entity.DailyUpdateEntity
import com.elvan.neram.data.local.entity.GeneralNoticeEntity
import com.elvan.neram.data.local.entity.MasterDataEntity
import com.elvan.neram.data.local.entity.UserEntity
import com.elvan.neram.data.local.entity.NotificationEntity
import com.elvan.neram.data.local.dao.NotificationDao

@Database(
    entities = [
        UserEntity::class,
        MasterDataEntity::class,
        CalendarEventEntity::class,
        DailyUpdateEntity::class,
        GeneralNoticeEntity::class,
        NotificationEntity::class
    ],
    version = 5,
    exportSchema = false
)
abstract class NeramDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun masterDataDao(): MasterDataDao
    abstract fun calendarEventDao(): CalendarEventDao
    abstract fun updatesDao(): UpdatesDao
    abstract fun notificationDao(): NotificationDao

    companion object {
        @Volatile
        private var INSTANCE: NeramDatabase? = null

        fun getDatabase(context: Context): NeramDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    NeramDatabase::class.java,
                    "neram_database"
                )
                .fallbackToDestructiveMigration() // Handle version bump
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

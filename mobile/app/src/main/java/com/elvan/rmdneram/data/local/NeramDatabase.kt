package com.elvan.rmdneram.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.elvan.rmdneram.data.local.dao.CalendarEventDao
import com.elvan.rmdneram.data.local.dao.MasterDataDao
import com.elvan.rmdneram.data.local.dao.UpdatesDao
import com.elvan.rmdneram.data.local.dao.UserDao
import com.elvan.rmdneram.data.local.entity.CalendarEventEntity
import com.elvan.rmdneram.data.local.entity.DailyUpdateEntity
import com.elvan.rmdneram.data.local.entity.GeneralNoticeEntity
import com.elvan.rmdneram.data.local.entity.MasterDataEntity
import com.elvan.rmdneram.data.local.entity.UserEntity

@Database(
    entities = [
        UserEntity::class,
        MasterDataEntity::class,
        CalendarEventEntity::class,
        DailyUpdateEntity::class,
        GeneralNoticeEntity::class
    ],
    version = 4,
    exportSchema = false
)
abstract class NeramDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun masterDataDao(): MasterDataDao
    abstract fun calendarEventDao(): CalendarEventDao
    abstract fun updatesDao(): UpdatesDao

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
                .fallbackToDestructiveMigration() // Reset DB if schema changes
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

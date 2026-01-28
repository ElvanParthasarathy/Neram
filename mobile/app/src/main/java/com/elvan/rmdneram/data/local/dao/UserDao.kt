package com.elvan.rmdneram.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.elvan.rmdneram.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM user_profile WHERE uid = :uid LIMIT 1")
    fun getUserProfile(uid: String): Flow<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUserProfile(user: UserEntity)

    @Query("DELETE FROM user_profile")
    suspend fun clearUserProfile()
}

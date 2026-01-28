package com.elvan.rmdneram.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.elvan.rmdneram.data.model.UserProfile

@Entity(tableName = "user_profile")
data class UserEntity(
    @PrimaryKey
    val uid: String,
    val email: String,
    val displayName: String,
    val photoURL: String?,
    val role: String,
    val batch: String,
    val department: String,
    val section: String
) {
    fun toUserProfile(): UserProfile {
        return UserProfile(
            uid = uid,
            email = email,
            displayName = displayName,
            photoURL = photoURL,
            role = role,
            batch = batch,
            department = department,
            section = section
        )
    }

    companion object {
        fun fromUserProfile(profile: UserProfile): UserEntity {
            return UserEntity(
                uid = profile.uid,
                email = profile.email,
                displayName = profile.displayName,
                photoURL = profile.photoURL,
                role = profile.role,
                batch = profile.batch,
                department = profile.department,
                section = profile.section
            )
        }
    }
}

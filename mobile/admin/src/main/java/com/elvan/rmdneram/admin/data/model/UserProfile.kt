package com.elvan.rmdneram.admin.data.model

import androidx.compose.runtime.Immutable

@Immutable
data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoURL: String? = null,
    val role: String = "student",
    val batch: String = "",
    val department: String = "",
    val section: String = "",
    val mobile: String = "",
    val dob: String = "",
    val registerNumber: String = "",
    val bloodGroup: String = "",
    val gender: String = "",
    val address: String = ""
) {
    val name: String get() = displayName
    val profileImage: String get() = photoURL ?: ""

    fun hasPlacement(): Boolean = batch.isNotEmpty() && department.isNotEmpty() && section.isNotEmpty()
    
    fun canEdit(): Boolean = role in listOf("admin", "cr")
    
    fun getInitial(): String = (displayName.firstOrNull() ?: email.firstOrNull() ?: 'S').uppercase()
}

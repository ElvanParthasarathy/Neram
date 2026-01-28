package com.elvan.rmdneram.data.model

/**
 * User profile data matching Firebase structure at /users/{uid}
 */
import androidx.compose.runtime.Immutable

@Immutable
data class UserProfile(
    val uid: String = "",
    val email: String = "",
    val displayName: String = "",
    val photoURL: String? = null,
    val role: String = "student", // "student", "cr", "admin"
    val batch: String = "",
    val department: String = "",
    val section: String = ""
) {
    /**
     * Check if user has complete academic placement
     */
    fun hasPlacement(): Boolean {
        return isValid(batch) && isValid(department) && isValid(section)
    }

    private fun isValid(value: String): Boolean {
        if (value.isBlank()) return false
        val invalidValues = listOf("unassigned", "select", "none", "null", "undefined")
        return !invalidValues.contains(value.lowercase().trim())
    }
    
    /**
     * Check if user can edit content (admin or CR)
     */
    fun canEdit(): Boolean = role in listOf("admin", "cr")
    
    /**
     * Get display initial for avatar placeholder
     */
    fun getInitial(): String = (displayName.firstOrNull() ?: email.firstOrNull() ?: 'S').uppercase()
}

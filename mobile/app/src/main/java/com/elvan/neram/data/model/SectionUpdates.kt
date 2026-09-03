package com.elvan.neram.data.model

/**
 * Section-specific updates from Firebase at /updates/{batch}/{dept}/{section}
 */
import androidx.compose.runtime.Immutable
import kotlinx.collections.immutable.ImmutableMap
import kotlinx.collections.immutable.persistentMapOf

@Immutable
data class SectionUpdates(
    val daily: Map<String, DailyUpdate> = emptyMap(),
    val general: GeneralNotice = GeneralNotice()
)

/**
 * Daily update/note posted by admin or CR
 */
@Immutable
data class DailyUpdate(
    val note: String = "",
    val author: String = "",
    val createdAt: Long = 0L,
    val expiresAt: Long = 0L
) {
    fun isEmpty(): Boolean = note.isBlank()
    fun isExpired(now: Long = System.currentTimeMillis()): Boolean = expiresAt > 0L && now > expiresAt
}

/**
 * General notice that persists across days
 */
@Immutable
data class GeneralNotice(
    val text: String = "",
    val author: String = ""
) {
    fun isEmpty(): Boolean = text.isBlank()
}

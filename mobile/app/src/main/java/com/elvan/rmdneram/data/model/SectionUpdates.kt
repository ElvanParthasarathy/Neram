package com.elvan.rmdneram.data.model

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
    val author: String = ""
) {
    fun isEmpty(): Boolean = note.isBlank()
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

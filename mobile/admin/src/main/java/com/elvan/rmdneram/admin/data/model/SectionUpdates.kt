package com.elvan.rmdneram.admin.data.model

import androidx.compose.runtime.Immutable
import kotlinx.collections.immutable.ImmutableMap
import kotlinx.collections.immutable.persistentMapOf

@Immutable
data class SectionUpdates(
    val live: ImmutableMap<String, DailyUpdate> = persistentMapOf(), // "2026-01-12" -> update
    val general: GeneralNotice = GeneralNotice()
)

@Immutable
data class DailyUpdate(
    val note: String = "",
    val author: String = ""
) {
    fun isEmpty(): Boolean = note.isBlank()
}

@Immutable
data class GeneralNotice(
    val text: String = "",
    val author: String = ""
) {
    fun isEmpty(): Boolean = text.isBlank()
}

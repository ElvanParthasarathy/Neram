package com.elvan.rmdneram.data.model

data class NotesSemester(
    val title: String,
    val subjects: List<NotesSubject>
)

data class NotesSubject(
    val name: String,
    val units: Map<String, String> // "Unit 1" -> "url"
)

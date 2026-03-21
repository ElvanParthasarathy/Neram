package com.elvan.rmdneram.data.model

data class NotesSemester(
    val title: String,
    val subjects: List<NotesSubject>
)

data class NotesSubject(
    val name: String,
    val units: Map<String, String> // "Unit 1" -> "url"
)

data class DriveFolder(
    val id: String = "",
    val name: String = "",
    val parentId: String = ""
)

data class DriveFile(
    val id: String = "",
    val name: String = "",
    val parentId: String = "",
    val link: String = ""
)

data class DriveSubject(
    val id: String = "",
    val name: String = "",
    val parentId: String = "",
    val units: Map<String, String> = emptyMap() // "Unit 1" -> "drive_link"
)

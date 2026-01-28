package com.elvan.rmdneram.ui.notes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.elvan.rmdneram.data.model.NotesSemester
import com.elvan.rmdneram.data.model.NotesSubject
import com.elvan.rmdneram.data.repository.NotesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch

class NotesViewModel : ViewModel() {

    private val repository = NotesRepository()
    
    // UI State: Loading, Error, etc.
    private val _uiState = MutableStateFlow<NotesUiState>(NotesUiState.Empty)
    val uiState: StateFlow<NotesUiState> = _uiState.asStateFlow()
    
    // Navigation Path Stack: ["SNH", "CSE", "Semester 1"]
    // Empty = Root
    private val _path = MutableStateFlow<List<String>>(emptyList())
    val path = _path.asStateFlow()
    
    // Cached data for the current root department (First item in path)
    private var _cachedSemesters: List<NotesSemester> = emptyList()

    fun enterFolder(name: String) {
        val currentPath = _path.value
        if (currentPath.isEmpty()) {
            // Entering Root Dept (e.g., "IT" or "SNH")
            _path.value = listOf(name)
            loadNotes(name)
        } else {
            // Entering Sub-folder (e.g., "Semester 1" or "CSE")
            _path.value = currentPath + name
            updateViewFromCache()
        }
    }
    
    fun navigateUp() {
        val currentPath = _path.value
        if (currentPath.isNotEmpty()) {
            _path.value = currentPath.dropLast(1)
            if (_path.value.isNotEmpty()) {
                updateViewFromCache()
            } else {
                _uiState.value = NotesUiState.Empty // Back to root list
                _cachedSemesters = emptyList()
            }
        }
    }

    private fun loadNotes(dept: String) {
        viewModelScope.launch {
            repository.fetchNotes(dept)
                .onStart { _uiState.value = NotesUiState.Loading }
                .catch { e -> _uiState.value = NotesUiState.Error(e.message ?: "Unknown error") }
                .collect { result ->
                    result.fold(
                        onSuccess = { notes ->
                            _cachedSemesters = notes
                            updateViewFromCache()
                        },
                        onFailure = { e ->
                            _uiState.value = NotesUiState.Error(e.message ?: "Failed to load notes")
                        }
                    )
                }
        }
    }
    
    private fun updateViewFromCache() {
        val currentPath = _path.value
        if (currentPath.isEmpty()) return // Should not happen here
        
        val rootDept = currentPath[0]
        val isSNH = rootDept == "SNH" || rootDept == "I YEAR" // Adjust based on Dept List
        
        // We need to determine what to show based on depth
        // Path[1] would be sub-folder (SNH Dept or ECE Semester)
        
        // Logic:
        // Level 0: Root (Empty Path) -> Handled by Screen (Dept List)
        // Level 1: Root Dept (e.g. SNH) -> Show list of SNH Depts (CSE, IT...) OR Standard Semesters
        // Level 2: SNH Dept (e.g. CSE) -> Show list of Semesters
        // Level 3: Semester -> Show Subjects (Files)
        
        val depth = currentPath.size
        
        // Items to display (Folders or Files)
        val items = if (isSNH) {
            when (depth) {
                1 -> {
                    // SNH Root: Show Groups (Depts) derived from "DEPT | SEM" titles
                    // Filter unique prefixes and format them
                    val groups = _cachedSemesters.map { 
                        val rawName = it.title.split("|").firstOrNull()?.trim() ?: "General"
                        mapDeptToAbbreviation(rawName)
                    }.distinct().sorted()
                    NotesViewContent.Folders(groups)
                }
                2 -> {
                    // Inside SNH Dept: Show Semesters
                    val snhDeptAbbr = currentPath[1] // This is now "CSE", "IT" etc.
                    
                    val sems = _cachedSemesters.filter { 
                        val rawDept = it.title.split("|").firstOrNull()?.trim() ?: "General"
                        mapDeptToAbbreviation(rawDept) == snhDeptAbbr
                    }.map { 
                         // Extract Semester part and Title Case it
                         val rawSem = it.title.split("|").getOrNull(1)?.trim() ?: it.title
                         toTitleCase(rawSem)
                    }.distinct().sorted()
                     NotesViewContent.Folders(sems)
                }
                3 -> {
                    // Inside Semester: Show Subjects
                    val snhDeptAbbr = currentPath[1]
                    val semName = currentPath[2] // This is "Semester I" (Title Cased)
                    
                    // Reconstruct match
                     val match = _cachedSemesters.find { 
                        val parts = it.title.split("|")
                        val rawDept = parts.getOrNull(0)?.trim() ?: "General"
                        val rawSem = parts.getOrNull(1)?.trim() ?: ""
                        
                        mapDeptToAbbreviation(rawDept) == snhDeptAbbr && toTitleCase(rawSem) == semName
                    }
                    if (match != null) NotesViewContent.Files(match.subjects) else NotesViewContent.Empty
                }
                else -> NotesViewContent.Empty
            }
        } else {
            // Standard Department
            when (depth) {
                1 -> {
                    // Standard Root: Show Semesters (Folders)
                    // Title Case the semester names if they are CAPS
                    val sems = _cachedSemesters
                        .map { toTitleCase(it.title) }
                        .distinct()
                    NotesViewContent.Folders(sems)
                }
                2 -> {
                    // Inside Semester: Show Subjects
                    val semName = currentPath[1]
                    // Match against Title Cased version
                    val match = _cachedSemesters.find { 
                        toTitleCase(it.title) == semName 
                    }
                    if (match != null) NotesViewContent.Files(match.subjects) else NotesViewContent.Empty
                }
                else -> NotesViewContent.Empty
            }
        }
        
        _uiState.value = NotesUiState.browse(items)
    }



    private fun mapDeptToAbbreviation(raw: String): String {
        val upper = raw.uppercase()
        val found = mutableListOf<String>()

        // Check for specific departments in order
        if (upper.contains("COMPUTER SCIENCE AND ENGINEERING") || upper.contains("CSE")) found.add("CSE")
        if (upper.contains("INFORMATION TECHNOLOGY") || upper.contains("IT")) found.add("IT")
        if (upper.contains("ELECTRONICS AND COMMUNICATION") || upper.contains("ECE")) found.add("ECE")
        if (upper.contains("ELECTRICAL AND ELECTRONICS") || upper.contains("EEE")) found.add("EEE")
        if (upper.contains("ARTIFICIAL INTELLIGENCE") || upper.contains("AIML")) found.add("AIML")
        if (upper.contains("BUSINESS SYSTEM")) found.add("CSBS") // Matches both SYSTEM and SYSTEMS
        if (upper.contains("SCIENCE AND HUMANITIES") || upper.contains("SNH")) found.add("SNH")

        return if (found.isNotEmpty()) {
            found.joinToString(" / ")
        } else {
            toTitleCase(raw)
        }
    }

    private fun toTitleCase(str: String): String {
        if (str.isBlank()) return ""

        return str.split(" ").joinToString(" ") { word ->
            when {
                // Preserve Regulation codes like R-2024
                word.contains("-") && word.any { it.isDigit() } -> word

                // Preserve words with digits (codes)
                word.any { it.isDigit() } -> word

                // Preserve abbreviations (CSE, IT, AI, ML)
                word.length <= 4 && word.all { it.isUpperCase() } -> word

                // Normal word -> Title Case
                else -> word.lowercase().replaceFirstChar { it.uppercase() }
            }
        }
    }
}

sealed interface NotesUiState {
    data object Loading : NotesUiState
    data object Empty : NotesUiState // Root state (Dept List)
    data class Browser(val content: NotesViewContent) : NotesUiState
    data class Error(val message: String) : NotesUiState
    
    companion object {
        fun browse(content: NotesViewContent) = Browser(content)
    }
}

sealed interface NotesViewContent {
    data object Empty : NotesViewContent
    data class Folders(val names: List<String>) : NotesViewContent
    data class Files(val subjects: List<NotesSubject>) : NotesViewContent
}

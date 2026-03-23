package com.elvan.rmdneram.ui.notes

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.elvan.rmdneram.data.model.NotesSemester
import com.elvan.rmdneram.data.model.NotesSubject
import com.elvan.rmdneram.data.repository.NotesRepository
import com.elvan.rmdneram.data.local.NeramDatabase
import com.elvan.rmdneram.data.local.entity.MasterDataEntity
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import com.elvan.rmdneram.data.model.DriveFolder
import com.elvan.rmdneram.data.model.DriveFile
import com.elvan.rmdneram.data.model.DriveSubject
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.onStart
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class NotesViewModel(application: Application) : AndroidViewModel(application) {
    
    // Room DB for offline caching
    private val db = NeramDatabase.getDatabase(application)
    private val masterDataDao = db.masterDataDao()

    private val repository = NotesRepository()
    
    // Read cached mode from Room DB synchronously on init (microseconds)
    private fun readCachedMode(): String {
        return try {
            runBlocking {
                val entity = masterDataDao.getMasterDataById("notes_mode")
                entity?.json ?: "fetch"
            }
        } catch (e: Exception) {
            "fetch"
        }
    }

    // Read cached drive folders from Room DB
    private fun readCachedFolders(): List<DriveFolder> {
        return try {
            runBlocking {
                val entity = masterDataDao.getMasterDataById("drive_folders")
                if (entity != null) {
                    val type = object : TypeToken<List<DriveFolder>>() {}.type
                    Gson().fromJson(entity.json, type)
                } else emptyList()
            }
        } catch (e: Exception) {
            emptyList()
        }
    }

    // Read cached drive files from Room DB
    private fun readCachedFiles(): List<DriveFile> {
        return try {
            runBlocking {
                val entity = masterDataDao.getMasterDataById("drive_files")
                if (entity != null) {
                    val type = object : TypeToken<List<DriveFile>>() {}.type
                    Gson().fromJson(entity.json, type)
                } else emptyList()
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    // Read cached drive subjects from Room DB
    private fun readCachedSubjects(): List<DriveSubject> {
        return try {
            runBlocking {
                val entity = masterDataDao.getMasterDataById("drive_subjects")
                if (entity != null) {
                    val type = object : TypeToken<List<DriveSubject>>() {}.type
                    Gson().fromJson(entity.json, type)
                } else emptyList()
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    // UI State: Loading, Error, etc.
    private val _uiState = MutableStateFlow<NotesUiState>(NotesUiState.Empty)
    val uiState: StateFlow<NotesUiState> = _uiState.asStateFlow()
    
    // Navigation Path Stack: ["SNH", "CSE", "Semester 1"]
    // Empty = Root
    private val _path = MutableStateFlow<List<String>>(emptyList())
    val path = _path.asStateFlow()

    // --- FOLDER MODE STATE ---
    // Initialize everything from Room DB cache instantly
    private val _notesMode = MutableStateFlow(readCachedMode())
    private val _driveFolders = MutableStateFlow(readCachedFolders())
    private val _driveFiles = MutableStateFlow(readCachedFiles())
    private val _driveSubjects = MutableStateFlow(readCachedSubjects())
    private val _drivePath = MutableStateFlow<List<DriveFolder>>(listOf(DriveFolder("root", "Notes Drive", "root")))
    
    val notesMode = _notesMode.asStateFlow()
    val drivePath = _drivePath.asStateFlow()

    init {
        val firebaseDb = Firebase.database.reference
        
        firebaseDb.child("settings/notesMode").addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val newMode = snapshot.getValue(String::class.java) ?: "fetch"
                _notesMode.value = newMode
                // Save to Room DB for instant offline startup
                viewModelScope.launch {
                    masterDataDao.insertMasterData(
                        MasterDataEntity(id = "notes_mode", json = newMode)
                    )
                }
                refreshDriveView()
            }
            override fun onCancelled(error: DatabaseError) {}
        })

        firebaseDb.child("notes_drive/folders").addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val list = mutableListOf<DriveFolder>()
                for (child in snapshot.children) {
                    val f = child.getValue(DriveFolder::class.java)
                    if (f != null) list.add(f)
                }
                _driveFolders.value = list
                // Cache to Room DB
                viewModelScope.launch {
                    masterDataDao.insertMasterData(
                        MasterDataEntity(id = "drive_folders", json = Gson().toJson(list))
                    )
                }
                if (_notesMode.value == "folder") refreshDriveView()
            }
            override fun onCancelled(error: DatabaseError) {}
        })

        firebaseDb.child("notes_drive/files").addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val list = mutableListOf<DriveFile>()
                for (child in snapshot.children) {
                    val f = child.getValue(DriveFile::class.java)
                    if (f != null) list.add(f)
                }
                _driveFiles.value = list
                // Cache to Room DB
                viewModelScope.launch {
                    masterDataDao.insertMasterData(
                        MasterDataEntity(id = "drive_files", json = Gson().toJson(list))
                    )
                }
                if (_notesMode.value == "folder") refreshDriveView()
            }
            override fun onCancelled(error: DatabaseError) {}
        })

        firebaseDb.child("notes_drive/subjects").addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val list = mutableListOf<DriveSubject>()
                for (child in snapshot.children) {
                    val id = child.key ?: ""
                    val name = child.child("name").getValue(String::class.java) ?: ""
                    val parentId = child.child("parentId").getValue(String::class.java) ?: ""
                    val unitsMap = mutableMapOf<String, String>()
                    for (unitChild in child.child("units").children) {
                        unitsMap[unitChild.key ?: ""] = unitChild.getValue(String::class.java) ?: ""
                    }
                    list.add(DriveSubject(id = id, name = name, parentId = parentId, units = unitsMap))
                }
                _driveSubjects.value = list
                viewModelScope.launch {
                    masterDataDao.insertMasterData(
                        MasterDataEntity(id = "drive_subjects", json = Gson().toJson(list))
                    )
                }
                if (_notesMode.value == "folder") refreshDriveView()
            }
            override fun onCancelled(error: DatabaseError) {}
        })

        // Immediately set UI state based on cached mode — no flicker
        refreshDriveView()
    }

    private fun refreshDriveView() {
        if (_notesMode.value == "folder") {
            val currentFolderId = _drivePath.value.last().id
            val folders = _driveFolders.value.filter { it.parentId == currentFolderId }
            val files = _driveFiles.value.filter { it.parentId == currentFolderId }
            val subjects = _driveSubjects.value.filter { it.parentId == currentFolderId }
            _uiState.value = NotesUiState.Browser(NotesViewContent.DriveView(folders, files, subjects))
        } else {
            if (_path.value.isEmpty()) {
                _uiState.value = NotesUiState.Empty
            } else if (_cachedSemesters.isEmpty()) {
                // Cold-start recovery: path is set but semesters aren't loaded yet.
                // Re-trigger a fetch for the root dept so we don't show an empty screen.
                val rootDept = _path.value[0]
                loadNotes(rootDept)
            } else {
                updateViewFromCache()
            }
        }
    }

    fun enterDriveFolder(folder: DriveFolder) {
        _drivePath.value = _drivePath.value + folder
        refreshDriveView()
    }
    
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
        if (_notesMode.value == "folder") {
            if (_drivePath.value.size > 1) {
                _drivePath.value = _drivePath.value.dropLast(1)
                refreshDriveView()
            }
            return
        }

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

    // --- ADMIN ACTIONS ---
    fun createFolder(name: String) {
        val parentId = _drivePath.value.last().id
        val ref = Firebase.database.reference.child("notes_drive/folders").push()
        val folder = DriveFolder(id = ref.key ?: "", name = name, parentId = parentId)
        ref.setValue(folder)
    }

    fun createFileLink(name: String, link: String) {
        val parentId = _drivePath.value.last().id
        val ref = Firebase.database.reference.child("notes_drive/files").push()
        val file = DriveFile(id = ref.key ?: "", name = name, link = link, parentId = parentId)
        ref.setValue(file)
    }

    fun saveSubject(name: String, units: Map<String, String>, subjectId: String? = null) {
        val parentId = _drivePath.value.last().id
        val ref = if (subjectId != null) {
            Firebase.database.reference.child("notes_drive/subjects").child(subjectId)
        } else {
            Firebase.database.reference.child("notes_drive/subjects").push()
        }
        
        val data = mutableMapOf<String, Any>(
            "id" to (subjectId ?: ref.key ?: ""),
            "name" to name,
            "parentId" to parentId,
            "units" to units
        )
        ref.setValue(data)
    }

    fun updateFolder(id: String, newName: String) {
        Firebase.database.reference.child("notes_drive/folders").child(id).child("name").setValue(newName)
    }

    fun updateFile(id: String, newName: String, newLink: String) {
        val ref = Firebase.database.reference.child("notes_drive/files").child(id)
        ref.child("name").setValue(newName)
        ref.child("link").setValue(newLink)
    }

    fun deleteItems(ids: List<String>) {
        val db = Firebase.database.reference
        ids.forEach { id ->
            // Try to delete from all 3 nodes (one will match)
            db.child("notes_drive/folders").child(id).removeValue()
            db.child("notes_drive/subjects").child(id).removeValue()
            db.child("notes_drive/files").child(id).removeValue()
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
    data class DriveView(val folders: List<DriveFolder>, val files: List<DriveFile>, val subjects: List<DriveSubject> = emptyList()) : NotesViewContent
}

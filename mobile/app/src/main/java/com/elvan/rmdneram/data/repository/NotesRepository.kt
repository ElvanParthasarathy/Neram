package com.elvan.rmdneram.data.repository

import com.elvan.rmdneram.data.model.NotesSemester
import com.elvan.rmdneram.data.model.NotesSubject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import org.jsoup.Jsoup

class NotesRepository {

    fun fetchNotes(deptCode: String): Flow<Result<List<NotesSemester>>> = flow {
        try {
            // Map consistent dept codes to URL segments if needed
            // e.g., "IT" -> "it", "CSE" -> "cse"
            val urlSegment = when(deptCode.uppercase()) {
                "IT" -> "it"
                "CSE" -> "cse"
                "ECE" -> "ece"
                "AIML" -> "aiml"
                "CSBS" -> "csbs"
                "SNH", "I YEAR" -> "snh" // First year
                else -> deptCode.lowercase()
            }
            
            val url = "https://rmd.ac.in/dept/$urlSegment/notes.html"
            val doc = Jsoup.connect(url).get()
            
            val semesters = mutableListOf<NotesSemester>()
            
            // Logic for SNH (First Year) is slightly different as it groups by Dept/Semester
            if (urlSegment == "snh") {
                val tables = doc.select("table.table")
                var currentDept = "General"
                var currentSem = ""
                
                for (table in tables) {
                     // Check headers in this table
                     val headers = table.select("thead th")
                     for (header in headers) {
                         val text = header.text().uppercase()
                         if (text.contains("DEPARTMENT")) {
                             currentDept = text.replace("DEPARTMENT OF", "").trim()
                         }
                         if (text.contains("SEMESTER")) {
                             currentSem = text.trim()
                         }
                     }
                     
                     if (currentSem.isNotEmpty()) {
                        val subjects = parseTable(table)
                        if (subjects.isNotEmpty()) {
                            // Use a composite key for SNH: "DEPT | SEMESTER"
                            // If Dept is missing, fallback to just Semester, but usually it's there.
                            val title = if(currentDept != "General") "$currentDept | $currentSem" else currentSem
                            semesters.add(NotesSemester(title, subjects))
                        }
                     }
                }
            } else {
                // Standard Dept Logic
                val tables = doc.select("table")
                
                for (table in tables) {
                    val semesterTitle = extractSemesterFromTable(table)

                    if (semesterTitle.contains("Semester", ignoreCase = true)) {
                        val subjects = parseTable(table)
                        if (subjects.isNotEmpty()) {
                            semesters.add(NotesSemester(semesterTitle, subjects))
                        }
                    }
                }
            }
            
            // Fallback for AIML which might not have standard headers
            if (semesters.isEmpty() && urlSegment == "aiml") {
                 val aimlTables = doc.select("table")
                 for (table in aimlTables) {
                    val headerText = table.select("th").first()?.text() ?: "Course Material"
                     if (headerText.contains("Semester", ignoreCase = true)) {
                         val subjects = parseTable(table)
                         if (subjects.isNotEmpty()) {
                             semesters.add(NotesSemester(headerText, subjects))
                         }
                     }
                 }
            }

            emit(Result.success(semesters))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }.flowOn(Dispatchers.IO)

    private fun parseTable(table: org.jsoup.nodes.Element): List<NotesSubject> {
        val subjects = mutableListOf<NotesSubject>()
        val rows = table.select("tbody tr")
        
        for (row in rows) {
            val tds = row.select("td")
            if (tds.size < 4) continue // Ensure minimal columns
            
            // Subject Name (usually 2nd column, index 1)
            // But we need to be careful.
            // Standard format: S.No | Subject Code | Subject Name | Unit 1 | ...
            // Index: 0 | 1 | 2 | 3... ??
            // Let's check based on HTML analysis:
            // logic in HTML: subject = tds[1].innerText (so 2nd column)
            // units start at index 3 (4th column)
            
            if (tds.size >= 2) {
                var subjectName = tds[1].text().trim()
                
                // AIML logic had subject name cleaning
                if (subjectName.isEmpty() && tds.size > 0) subjectName = tds[0].text()
                
                if (subjectName.isNotEmpty()) {
                    val units = mutableMapOf<String, String>()
                    
                    // Units usually 3, 4, 5, 6, 7 (indices)
                    // We'll iterate starting from 2 or 3 depending on structure
                    // The standard HTML logic says loop i = 3 to 7
                    for (i in 3 until minOf(tds.size, 8)) {
                        val link = tds[i].select("a").attr("href")
                        if (link.isNotEmpty() && link != "#") {
                            val unitName = "Unit ${i - 2}" // 3->Unit 1, 4->Unit 2...
                            units[unitName] = link
                        }
                    }
                    
                    // Add subject if it has at least one unit or just the name
                    subjects.add(NotesSubject(subjectName, units))
                }
            }
        }
        return subjects
    }

    private fun extractSemesterFromTable(table: org.jsoup.nodes.Element): String {
        return table
            .selectFirst("thead tr:first-child")
            ?.text()
            ?.trim()
            ?: "Unknown Semester"
    }
}

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
            if (tds.size < 2) continue // Need at least subject name
            
            // Subject Name: Try second column first (index 1), then first column (index 0)
            var subjectName = tds.getOrNull(1)?.text()?.trim() ?: ""
            if (subjectName.isEmpty() || subjectName.matches(Regex("^\\d+\\.?$"))) {
                // If second column is empty or just a number, try first
                subjectName = tds.getOrNull(0)?.text()?.trim() ?: ""
            }
            // Skip if still empty or if it's just a serial number
            if (subjectName.isEmpty() || subjectName.matches(Regex("^\\d+\\.?$"))) {
                // Try third column as last resort
                subjectName = tds.getOrNull(2)?.text()?.trim() ?: ""
            }
            
            if (subjectName.isNotEmpty() && !subjectName.matches(Regex("^\\d+\\.?$"))) {
                val units = mutableMapOf<String, String>()
                
                // Scan ALL cells for unit links
                for (td in tds) {
                    val links = td.select("a")
                    for (link in links) {
                        val href = link.attr("href")
                        val text = link.text().trim()
                        
                        // Skip if href is empty, just "#", or points back to the notes page itself
                        if (href.isEmpty() || href == "#" || href.endsWith("notes.html")) continue
                        
                        // Match Unit 1, Unit 2, etc. or just "Unit" followed by number
                        val unitMatch = Regex("Unit\\s*(\\d+)", RegexOption.IGNORE_CASE).find(text)
                        if (unitMatch != null) {
                            val unitNumber = unitMatch.groupValues[1].toIntOrNull() ?: continue
                            val unitKey = "Unit $unitNumber"
                            // Only store if not already present (first occurrence wins)
                            if (!units.containsKey(unitKey)) {
                                units[unitKey] = href
                            }
                        }
                    }
                }
                
                // Also try legacy column-based approach for tables without explicit "Unit X" text
                if (units.isEmpty()) {
                    for (i in 2 until minOf(tds.size, 8)) {
                        val link = tds[i].select("a").attr("href")
                        if (link.isNotEmpty() && link != "#" && !link.endsWith("notes.html")) {
                            val unitName = "Unit ${i - 1}" // 2->Unit 1, 3->Unit 2...
                            units[unitName] = link
                        }
                    }
                }
                
                subjects.add(NotesSubject(subjectName, units))
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

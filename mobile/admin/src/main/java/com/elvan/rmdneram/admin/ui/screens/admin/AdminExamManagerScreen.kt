package com.elvan.rmdneram.admin.ui.screens.admin

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.widget.Toast
import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.horizontalScroll
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.elvan.rmdneram.admin.data.model.Course
import com.elvan.rmdneram.admin.data.model.ExamSchedule
import com.elvan.rmdneram.admin.data.model.ExamSubject
import com.elvan.rmdneram.admin.ui.home.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.*

private val PORTION_DEFAULTS = mapOf(
    "CT1" to "Unit 1",
    "IA1" to "Unit 1 & 2",
    "CT2" to "Unit 3",
    "IA2" to "Unit 3 & 4",
    "Model" to "Full Syllabus",
    "Practical" to "All Experiments",
    "Semester" to "Full Syllabus"
)

private val EXAM_TYPES = PORTION_DEFAULTS.keys.toList()

@Composable
fun AdminExamManagerScreen(
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    
    // Navigation State
    var pathBatch by remember { mutableStateOf<String?>(null) }
    var pathDept by remember { mutableStateOf<String?>(null) }
    var pathSec by remember { mutableStateOf<String?>(null) }

    // Data State
    var hierarchy by remember { mutableStateOf<Map<String, Any>>(emptyMap()) }
    var loadingHierarchy by remember { mutableStateOf(true) }
    var courses by remember { mutableStateOf<List<Course>>(emptyList()) }
    var exams by remember { mutableStateOf<List<ExamSchedule>>(emptyList()) }
    var loadingData by remember { mutableStateOf(false) }

    // Editor State
    var showEditor by remember { mutableStateOf(false) }
    var editingExam by remember { mutableStateOf<ExamSchedule?>(null) }
    
    // Internal Back Logic
    BackHandler {
        when {
            showEditor -> showEditor = false
            pathSec != null -> pathSec = null
            pathDept != null -> pathDept = null
            pathBatch != null -> pathBatch = null
            else -> onBack()
        }
    }
    
    // Fetch Hierarchy
    LaunchedEffect(Unit) {
        Firebase.database.getReference("academic_hierarchy").get().addOnSuccessListener { snap ->
            hierarchy = (snap.value as? Map<String, Any>) ?: emptyMap()
            loadingHierarchy = false
        }
    }

    // Fetch Exams & Courses
    LaunchedEffect(pathBatch, pathDept, pathSec) {
        if (pathBatch != null && pathDept != null && pathSec != null) {
            loadingData = true
            Firebase.database.getReference("schedules/$pathBatch/$pathDept/$pathSec").get().addOnSuccessListener { snap ->
                val data = snap.value as? Map<String, Any> ?: emptyMap()
                
                // Parse Courses
                val courseList = mutableListOf<Course>()
                (data["courses"] as? List<Map<String, Any>>)?.forEach { m ->
                    courseList.add(Course(code = m["code"] as? String ?: "", name = m["name"] as? String ?: "", credit = (m["credit"] as? Number)?.toInt() ?: 0, type = m["type"] as? String ?: ""))
                }
                courses = courseList

                // Parse Exams
                val examList = mutableListOf<ExamSchedule>()
                (data["exams"] as? List<Map<String, Any>>)?.forEach { m ->
                    val subjects = mutableListOf<ExamSubject>()
                    (m["subjects"] as? List<Map<String, Any>>)?.forEach { s ->
                        subjects.add(ExamSubject(
                            date = s["date"] as? String ?: "",
                            code = s["code"] as? String ?: "",
                            startTime = s["startTime"] as? String ?: "",
                            endTime = s["endTime"] as? String ?: "",
                            portion = s["portion"] as? String ?: ""
                        ))
                    }
                    examList.add(ExamSchedule(
                        id = (m["id"] as? Number)?.toLong() ?: 0L,
                        title = m["title"] as? String ?: "",
                        type = m["type"] as? String ?: "",
                        startDate = m["startDate"] as? String ?: "",
                        endDate = m["endDate"] as? String ?: "",
                        subjects = subjects
                    ))
                }
                exams = examList
                loadingData = false
            }.addOnFailureListener { loadingData = false }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 24.dp, end = 24.dp, top = 48.dp, bottom = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(colors.surface)
                    .border(1.dp, colors.glassBorder, CircleShape)
                    .clickable { 
                        if (pathSec != null) pathSec = null
                        else if (pathDept != null) pathDept = null
                        else if (pathBatch != null) pathBatch = null
                        else onBack()
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.ArrowBack, "Back", tint = colors.textPrimary, modifier = Modifier.size(20.dp))
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column {
                Text(
                    text = if (pathSec != null) "Section $pathSec" else pathDept ?: pathBatch ?: "Exam Schedules",
                    style = HomeTypography.PageTitle,
                    color = colors.textPrimary
                )
                Text(
                    text = if (pathSec != null) "$pathBatch > $pathDept" else if (pathDept != null) "$pathBatch > Select Section" else if (pathBatch != null) "Select Department" else "Select Batch",
                    style = HomeTypography.FacultyName,
                    color = colors.textSecondary
                )
            }
        }

        if (loadingHierarchy && pathBatch == null) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = colors.accent)
            }
        } else if (pathSec != null) {
            // Exam List
            Box(modifier = Modifier.weight(1f)) {
                if (loadingData) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = colors.accent)
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(24.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(exams) { exam ->
                            ExamAdminCard(exam, colors, 
                                onEdit = { editingExam = exam; showEditor = true },
                                onDelete = {
                                    val updated = exams.filter { it.id != exam.id }
                                    Firebase.database.getReference("schedules/$pathBatch/$pathDept/$pathSec/exams")
                                        .setValue(updated)
                                        .addOnSuccessListener {
                                            exams = updated
                                            Toast.makeText(context, "Timetable deleted", Toast.LENGTH_SHORT).show()
                                        }
                                }
                            )
                        }
                        if (exams.isEmpty()) {
                            item {
                                Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                                    Text("No timetables scheduled.", color = colors.textSecondary, style = HomeTypography.FacultyName)
                                }
                            }
                        }
                    }
                }
                
                // FAB
                FloatingActionButton(
                    onClick = { editingExam = null; showEditor = true },
                    containerColor = colors.accent,
                    contentColor = Color.White,
                    modifier = Modifier.align(Alignment.BottomEnd).padding(24.dp),
                    shape = CircleShape
                ) {
                    Icon(Icons.Default.Add, null)
                }
            }
        } else {
            // Hierarchy Grid
            val data = remember(pathBatch, pathDept, hierarchy) {
                if (pathBatch == null) {
                    hierarchy.keys.sortedDescending().map { AdminExamNavItem(it, "Batch", Icons.Default.People) { pathBatch = it } }
                } else if (pathDept == null) {
                    val depts = (hierarchy[pathBatch] as? Map<String, Any>) ?: emptyMap()
                    depts.keys.filter { it != "initialized" }.sorted().map { AdminExamNavItem(it, "Department", Icons.Default.GridView) { pathDept = it } }
                } else {
                    val secs = (hierarchy[pathBatch] as? Map<String, Any>)?.get(pathDept) as? List<String> ?: emptyList()
                    secs.map { AdminExamNavItem("Section $it", "Manage Exams", Icons.Default.List) { pathSec = it } }
                }
            }
            
            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                contentPadding = PaddingValues(24.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(data) { item ->
                    Column(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .clickable { item.onPress.invoke() }
                            .padding(8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(item.icon, null, tint = Color(0xFFFFD54F), modifier = Modifier.size(32.dp))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(item.name, style = HomeTypography.PillTitle, color = colors.textPrimary, textAlign = androidx.compose.ui.text.style.TextAlign.Center, maxLines = 1)
                        Text(item.sub, fontSize = 10.sp, color = colors.textSecondary, style = HomeTypography.FacultyName)
                    }
                }
            }
        }
    }

    if (showEditor) {
        ExamEditor(
            exam = editingExam,
            courses = courses,
            onDismiss = { showEditor = false },
            onSave = { updatedExam ->
                val id = if (updatedExam.id == 0L) System.currentTimeMillis() else updatedExam.id
                val newExam = updatedExam.copy(id = id)
                val newList = if (editingExam == null) exams + newExam else exams.map { if (it.id == updatedExam.id) newExam else it }
                
                Firebase.database.getReference("schedules/$pathBatch/$pathDept/$pathSec/exams")
                    .setValue(newList)
                    .addOnSuccessListener {
                        exams = newList
                        showEditor = false
                        Toast.makeText(context, "Timetable saved", Toast.LENGTH_SHORT).show()
                    }
            }
        )
    }
}

private data class AdminExamNavItem(val name: String, val sub: String, val icon: ImageVector, val onPress: () -> Unit)

@Composable
private fun ExamAdminCard(
    exam: ExamSchedule,
    colors: HomeColors,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(HomeShapes.Item)
            .background(colors.surface)
            .border(1.dp, colors.glassBorder, HomeShapes.Item)
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(exam.title, style = HomeTypography.PillTitle, color = colors.textPrimary, fontWeight = FontWeight.Bold)
                Text("${exam.startDate} - ${exam.endDate} • ${exam.type}", style = HomeTypography.FacultyName, color = colors.textSecondary)
            }
            IconButton(onClick = onEdit) { Icon(Icons.Default.Edit, null, tint = colors.textPrimary, modifier = Modifier.size(18.dp)) }
            IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, null, tint = colors.danger, modifier = Modifier.size(18.dp)) }
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        Divider(color = colors.glassBorder)
        Spacer(modifier = Modifier.height(12.dp))
        
        exam.subjects.forEachIndexed { index, sub ->
            Row(modifier = Modifier.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Column(
                    modifier = Modifier.size(40.dp).clip(RoundedCornerShape(8.dp)).background(colors.accent.copy(alpha = 0.1f)),
                    horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center
                ) {
                    val dateParts = sub.date.split("-")
                    Text(dateParts.getOrNull(2) ?: "", color = colors.accent, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(
                        text = try { LocalDate.parse(sub.date).format(DateTimeFormatter.ofPattern("MMM")) } catch (e: Exception) { "" },
                        color = colors.accent, fontSize = 9.sp, fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(sub.code, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                    Text(sub.portion, fontSize = 11.sp, color = colors.textSecondary, maxLines = 1)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(sub.startTime, fontSize = 11.sp, color = colors.textSecondary)
                    Text(sub.endTime, fontSize = 11.sp, color = colors.textSecondary)
                }
            }
        }
    }
}

@Composable
private fun ExamEditor(
    exam: ExamSchedule?,
    courses: List<Course>,
    onDismiss: () -> Unit,
    onSave: (ExamSchedule) -> Unit
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    
    var title by remember { mutableStateOf(exam?.title ?: "Model Exam 1") }
    var type by remember { mutableStateOf(exam?.type ?: "CT1") }
    var startDate by remember { mutableStateOf(exam?.startDate ?: LocalDate.now().toString()) }
    var endDate by remember { mutableStateOf(exam?.endDate ?: LocalDate.now().toString()) }
    var subjects by remember { mutableStateOf(exam?.subjects ?: listOf(ExamSubject(LocalDate.now().toString(), "", "09:30 AM", "12:30 PM", "Unit 1"))) }
    
    var showCoursePickerForIndex by remember { mutableStateOf<Int?>(null) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color.Black.copy(alpha = 0.4f)),
            contentAlignment = Alignment.BottomCenter
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.9f)
                    .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .background(colors.surface)
                    .verticalScroll(rememberScrollState())
                    .padding(24.dp)
            ) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, null, tint = colors.textPrimary) }
                    Text(if (exam == null) "New Timetable" else "Edit Timetable", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                    TextButton(onClick = {
                        if (title.isEmpty() || subjects.isEmpty()) {
                            Toast.makeText(context, "Missing details", Toast.LENGTH_SHORT).show()
                            return@TextButton
                        }
                        onSave(ExamSchedule(id = exam?.id ?: 0L, title = title, type = type, startDate = startDate, endDate = endDate, subjects = subjects))
                    }) { Text("Save", color = colors.accent, fontWeight = FontWeight.Bold) }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                // Details Card
                Column(
                    modifier = Modifier.clip(RoundedCornerShape(16.dp)).background(colors.inputBackground).padding(16.dp)
                ) {
                    Text("Exam Title", style = HomeTypography.InfoLabel, color = colors.textSecondary)
                    OutlinedTextField(
                        value = title, onValueChange = { title = it },
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        shape = RoundedCornerShape(12.dp)
                    )
                    
                    Text("Exam Type", style = HomeTypography.InfoLabel, color = colors.textSecondary)
                    Row(Modifier.horizontalScroll(rememberScrollState()).padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        for (t in EXAM_TYPES) {
                            val active = type == t
                            AssistChip(
                                onClick = { 
                                    type = t
                                    val defaultPortion = PORTION_DEFAULTS[t] ?: "Full Syllabus"
                                    subjects = subjects.map { it.copy(portion = defaultPortion) }
                                },
                                label = { Text(t) },
                                colors = AssistChipDefaults.assistChipColors(
                                    labelColor = if (active) Color.White else colors.textSecondary,
                                    containerColor = if (active) colors.accent else Color.Transparent
                                ),
                                border = BorderStroke(1.dp, if (active) colors.accent else colors.glassBorder)
                            )
                        }
                    }
                    
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text("Starts", style = HomeTypography.InfoLabel, color = colors.textSecondary)
                            DateBtn(date = startDate) { startDate = it }
                        }
                        Column(Modifier.weight(1f)) {
                            Text("Ends", style = HomeTypography.InfoLabel, color = colors.textSecondary)
                            DateBtn(date = endDate) { endDate = it }
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                Text("Subjects", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                
                subjects.forEachIndexed { index, sub ->
                    SubjectEditCard(
                        sub = sub,
                        colors = colors,
                        onDelete = { subjects = subjects.filterIndexed { i, _ -> i != index } },
                        onChange = { updated -> subjects = subjects.mapIndexed { i, s -> if (i == index) updated else s } },
                        onPickCourse = { showCoursePickerForIndex = index }
                    )
                }
                
                Button(
                    onClick = { subjects = subjects + ExamSubject(LocalDate.now().toString(), "", "09:30 AM", "12:30 PM", PORTION_DEFAULTS[type] ?: "Unit 1") },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.accent),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.AddCircle, null)
                    Spacer(Modifier.width(8.dp))
                    Text("Add Subject", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    if (showCoursePickerForIndex != null) {
        Dialog(onDismissRequest = { showCoursePickerForIndex = null }) {
            Card(
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier.fillMaxWidth().fillMaxHeight(0.7f).padding(16.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text("Select Course", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                    Spacer(Modifier.height(16.dp))
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(courses) { course ->
                            Row(
                                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(colors.inputBackground).clickable {
                                    val idx = showCoursePickerForIndex ?: return@clickable
                                    subjects = subjects.mapIndexed { i, s -> if (i == idx) s.copy(code = course.code) else s }
                                    showCoursePickerForIndex = null
                                }.padding(16.dp)
                            ) {
                                Text(course.code, fontWeight = FontWeight.Bold, color = colors.accent)
                                Spacer(Modifier.width(12.dp))
                                Text(course.name, style = HomeTypography.FacultyName, color = colors.textPrimary, maxLines = 1)
                            }
                        }
                    }
                    Spacer(Modifier.weight(1f))
                    TextButton(onClick = { showCoursePickerForIndex = null }, modifier = Modifier.align(Alignment.End)) { Text("Cancel", color = colors.accent) }
                }
            }
        }
    }
}

@Composable
private fun SubjectEditCard(
    sub: ExamSubject,
    colors: HomeColors,
    onDelete: () -> Unit,
    onChange: (ExamSubject) -> Unit,
    onPickCourse: () -> Unit
) {
    val context = LocalContext.current
    
    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp).clip(RoundedCornerShape(16.dp)).background(colors.surface).border(1.dp, colors.glassBorder, RoundedCornerShape(16.dp)).padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(50.dp).clip(RoundedCornerShape(12.dp)).background(colors.accent.copy(alpha = 0.1f)).clickable {
                    val current = try { LocalDate.parse(sub.date) } catch(e:Exception) { LocalDate.now() }
                    DatePickerDialog(context, { _, y, m, d ->
                        onChange(sub.copy(date = String.format("%04d-%02d-%02d", y, m + 1, d)))
                    }, current.year, current.monthValue - 1, current.dayOfMonth).show()
                },
                contentAlignment = Alignment.Center
            ) {
                val dateParts = sub.date.split("-")
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(dateParts.getOrNull(2) ?: "", color = colors.accent, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text(
                        text = try { LocalDate.parse(sub.date).format(DateTimeFormatter.ofPattern("MMM")) } catch (e: Exception) { "" },
                        color = colors.accent, fontSize = 10.sp, fontWeight = FontWeight.Bold
                    )
                }
            }
            Spacer(Modifier.weight(1f))
            IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, null, tint = colors.danger) }
        }
        
        Spacer(Modifier.height(12.dp))
        
        // Course Select
        Box(
            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(colors.inputBackground).clickable { onPickCourse() }.padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(sub.code.ifEmpty { "Select Course" }, color = if (sub.code.isEmpty()) colors.placeholder else colors.textPrimary, modifier = Modifier.weight(1f))
                Icon(Icons.Default.KeyboardArrowDown, null, tint = colors.textSecondary)
            }
        }
        
        Spacer(Modifier.height(8.dp))
        
        OutlinedTextField(
            value = sub.portion, onValueChange = { onChange(sub.copy(portion = it)) },
            placeholder = { Text("Portion / Syllabus") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp)
        )
        
        Spacer(Modifier.height(12.dp))
        
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(Modifier.weight(1f)) {
                Text("Start Time", fontSize = 12.sp, color = colors.textSecondary)
                TimePickerBtn(time = sub.startTime) { onChange(sub.copy(startTime = it)) }
            }
            Column(Modifier.weight(1f)) {
                Text("End Time", fontSize = 12.sp, color = colors.textSecondary)
                TimePickerBtn(time = sub.endTime) { onChange(sub.copy(endTime = it)) }
            }
        }
    }
}

@Composable
private fun DateBtn(date: String, onPick: (String) -> Unit) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp).clip(RoundedCornerShape(12.dp)).background(colors.surface).border(1.dp, colors.glassBorder, RoundedCornerShape(12.dp)).clickable {
            val current = try { LocalDate.parse(date) } catch(e:Exception) { LocalDate.now() }
            DatePickerDialog(context, { _, y, m, d ->
                onPick(String.format("%04d-%02d-%02d", y, m + 1, d))
            }, current.year, current.monthValue - 1, current.dayOfMonth).show()
        }.padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Default.CalendarToday, null, tint = colors.accent, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(8.dp))
        Text(date, color = colors.textPrimary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
    }
}

@Composable
private fun TimePickerBtn(time: String, onPick: (String) -> Unit) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp).clip(RoundedCornerShape(10.dp)).background(colors.inputBackground).clickable {
            TimePickerDialog(context, { _, h, m ->
                val ampm = if (h >= 12) "PM" else "AM"
                val h12 = if (h % 12 == 0) 12 else h % 12
                onPick(String.format("%02d:%02d %s", h12, m, ampm))
            }, 9, 30, false).show()
        }.padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(time, color = colors.textPrimary, fontSize = 13.sp, modifier = Modifier.weight(1f))
        Icon(Icons.Default.AccessTime, null, tint = colors.textSecondary, modifier = Modifier.size(14.dp))
    }
}

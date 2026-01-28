package com.elvan.rmdneram.admin.ui.screens.admin

import androidx.activity.compose.BackHandler
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import com.elvan.rmdneram.admin.ui.home.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset

@Composable
fun AdminScheduleManagerScreen(
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    
    // Navigation State
    var pathBatch by remember { mutableStateOf<String?>(null) }
    var pathDept by remember { mutableStateOf<String?>(null) }
    var pathSec by remember { mutableStateOf<String?>(null) }
    var activeTab by remember { mutableStateOf("courses") } // courses, timetable, counseling

    // Data State
    var hierarchy by remember { mutableStateOf<Map<String, Any>>(emptyMap()) }
    var loadingHierarchy by remember { mutableStateOf(true) }
    
    var courses by remember { mutableStateOf<List<Course>>(emptyList()) }
    var counselors by remember { mutableStateOf<List<String>>(emptyList()) }
    var coordinators by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var timetable by remember { mutableStateOf<Map<String, List<String>>>(emptyMap()) }
    var loadingData by remember { mutableStateOf(false) }

    // Editor States
    var showCourseDialog by remember { mutableStateOf(false) }
    var showCounselorDialog by remember { mutableStateOf(false) }
    var showCoordinatorDialog by remember { mutableStateOf(false) }

    // Internal Back Logic
    BackHandler {
        when {
            showCourseDialog -> showCourseDialog = false
            showCounselorDialog -> showCounselorDialog = false
            showCoordinatorDialog -> showCoordinatorDialog = false
            pathSec != null -> pathSec = null
            pathDept != null -> pathDept = null
            pathBatch != null -> pathBatch = null
            else -> onBack()
        }
    }
    var editingCourse by remember { mutableStateOf<Course?>(null) }
    var isEditingTimetable by remember { mutableStateOf(false) }
    var timetableBuffer by remember { mutableStateOf<Map<String, List<String>>>(emptyMap()) }
    var showSmartEditor by remember { mutableStateOf<Pair<String, Int>?>(null) } // Day, Index

    // Fetch Hierarchy
    LaunchedEffect(Unit) {
        Firebase.database.getReference("academic_hierarchy").get().addOnSuccessListener { snap ->
            hierarchy = (snap.value as? Map<String, Any>) ?: emptyMap()
            loadingHierarchy = false
        }
    }

    // Fetch Data
    LaunchedEffect(pathBatch, pathDept, pathSec) {
        if (pathBatch != null && pathDept != null && pathSec != null) {
            loadingData = true
            Firebase.database.getReference("schedules/$pathBatch/$pathDept/$pathSec").get().addOnSuccessListener { snap ->
                val data = snap.value as? Map<String, Any> ?: emptyMap()
                
                // Parse Courses
                val courseList = mutableListOf<Course>()
                (data["courses"] as? List<Map<String, Any>>)?.forEach { m ->
                    courseList.add(Course(code = m["code"] as? String ?: "", name = m["name"] as? String ?: "", credit = (m["credit"] as? Number)?.toInt() ?: 0, type = m["type"] as? String ?: "", faculty = m["faculty"] as? String ?: "", periods = (m["periods"] as? Number)?.toInt() ?: 0))
                }
                courses = courseList

                // Parse Counseling
                val counseling = data["counseling"] as? Map<String, Any> ?: emptyMap()
                counselors = (counseling["counselors"] as? List<String>) ?: emptyList()
                coordinators = (counseling["coordinators"] as? Map<String, String>) ?: emptyMap()

                // Parse Timetable
                timetable = (data["timetable"] as? Map<String, List<String>>) ?: emptyMap()
                loadingData = false
            }.addOnFailureListener { loadingData = false }
        }
    }

    // --- DB Sync Helper ---
    val syncToDB = { updatedData: Map<String, Any> ->
        if (pathBatch != null && pathDept != null && pathSec != null) {
            Firebase.database.getReference("schedules/$pathBatch/$pathDept/$pathSec").updateChildren(updatedData)
                .addOnSuccessListener { Toast.makeText(context, "Saved", Toast.LENGTH_SHORT).show() }
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
                    text = if (pathSec != null) "Section $pathSec" else pathDept ?: pathBatch ?: "Schedule Manager",
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
            // Editor Tabs
            TabRow(
                selectedTabIndex = if (activeTab == "courses") 0 else if (activeTab == "timetable") 1 else 2,
                containerColor = Color.Transparent,
                contentColor = colors.accent,
                divider = { Divider(color = colors.glassBorder) },
                indicator = { tabPositions ->
                    TabRowDefaults.Indicator(
                        Modifier.tabIndicatorOffset(tabPositions[if (activeTab == "courses") 0 else if (activeTab == "timetable") 1 else 2]),
                        color = colors.accent
                    )
                }
            ) {
                Tab(selected = activeTab == "courses", onClick = { activeTab = "courses" }) {
                    Text("Courses", modifier = Modifier.padding(16.dp), style = HomeTypography.PillTitle)
                }
                Tab(selected = activeTab == "timetable", onClick = { activeTab = "timetable" }) {
                    Text("Timetable", modifier = Modifier.padding(16.dp), style = HomeTypography.PillTitle)
                }
                Tab(selected = activeTab == "counseling", onClick = { activeTab = "counseling" }) {
                    Text("Counseling", modifier = Modifier.padding(16.dp), style = HomeTypography.PillTitle)
                }
            }

            Box(modifier = Modifier.weight(1f)) {
                if (loadingData) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = colors.accent)
                } else {
                    when (activeTab) {
                        "courses" -> {
                            LazyColumn(contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                items(courses) { course ->
                                    CourseItem(course, colors, onEdit = { editingCourse = course; showCourseDialog = true }, onDelete = { 
                                        val updated = courses.filter { it.code != course.code }
                                        courses = updated
                                        syncToDB(mapOf("courses" to updated))
                                    })
                                }
                            }
                            FloatingActionButton(
                                onClick = { editingCourse = null; showCourseDialog = true },
                                containerColor = colors.accent,
                                contentColor = Color.White,
                                modifier = Modifier.align(Alignment.BottomEnd).padding(24.dp),
                                shape = CircleShape
                            ) { Icon(Icons.Default.Add, null) }
                        }
                        "timetable" -> {
                            TimetableManager(
                                timetable = if (isEditingTimetable) timetableBuffer else timetable,
                                isEditing = isEditingTimetable,
                                colors = colors,
                                onStartEdit = { timetableBuffer = timetable; isEditingTimetable = true },
                                onCancel = { isEditingTimetable = false },
                                onSave = { 
                                    timetable = timetableBuffer
                                    syncToDB(mapOf("timetable" to timetableBuffer))
                                    isEditingTimetable = false
                                },
                                onCellClick = { day, idx -> if (isEditingTimetable) showSmartEditor = day to idx }
                            )
                        }
                        "counseling" -> {
                            CounselingManager(
                                counselors = counselors,
                                coordinators = coordinators,
                                colors = colors,
                                onUpdateCoordinators = { role, name ->
                                    val updated = coordinators + (role to name)
                                    coordinators = updated
                                    syncToDB(mapOf("counseling/coordinators" to updated))
                                },
                                onAddCounselor = { name ->
                                    val updated = counselors + name
                                    counselors = updated
                                    syncToDB(mapOf("counseling/counselors" to updated))
                                },
                                onDeleteCounselor = { name ->
                                    val updated = counselors.filter { it != name }
                                    counselors = updated
                                    syncToDB(mapOf("counseling/counselors" to updated))
                                }
                            )
                        }
                    }
                }
            }
        } else {
            // Hierarchy Grid
            val data = remember(pathBatch, pathDept, hierarchy) {
                if (pathBatch == null) {
                    hierarchy.keys.sortedDescending().map { 
                        AdminScheduleNavItem(it, "Batch", Icons.Default.People) { pathBatch = it } 
                    }
                } else if (pathDept == null) {
                    val depts = (hierarchy[pathBatch] as? Map<String, Any>) ?: emptyMap()
                    depts.keys.filter { it != "initialized" }.sorted().map { 
                        AdminScheduleNavItem(it, "Department", Icons.Default.GridView) { pathDept = it } 
                    }
                } else {
                    val secs = (hierarchy[pathBatch] as? Map<String, Any>)?.get(pathDept) as? List<String> ?: emptyList()
                    secs.map { 
                        AdminScheduleNavItem("Section $it", "Manage Schedule", Icons.Default.List) { pathSec = it } 
                    }
                }
            }
            LazyVerticalGrid(columns = GridCells.Fixed(3), contentPadding = PaddingValues(24.dp), horizontalArrangement = Arrangement.spacedBy(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                items(data) { item ->
                    Column(modifier = Modifier.clip(RoundedCornerShape(16.dp)).clickable { item.onPress.invoke() }.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(item.icon, null, tint = Color(0xFFFFD54F), modifier = Modifier.size(32.dp))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(item.name, style = HomeTypography.PillTitle, color = colors.textPrimary, textAlign = androidx.compose.ui.text.style.TextAlign.Center, maxLines = 1)
                        Text(item.sub, fontSize = 10.sp, color = colors.textSecondary, style = HomeTypography.FacultyName)
                    }
                }
            }
        }
    }

    // Modals
    if (showCourseDialog) {
        CourseEditorDialog(editingCourse, colors, onDismiss = { showCourseDialog = false }, onSave = { course ->
            val updated = if (editingCourse == null) courses + course else courses.map { if (it.code == editingCourse?.code) course else it }
            courses = updated
            syncToDB(mapOf("courses" to updated))
            showCourseDialog = false
        })
    }

    if (showSmartEditor != null) {
        val (day, idx) = showSmartEditor!!
        SmartCellEditor(
            currentValue = timetableBuffer[day]?.get(idx) ?: "",
            courses = courses,
            colors = colors,
            onDismiss = { showSmartEditor = null },
            onSave = { newVal ->
                val dayList = timetableBuffer[day]?.toMutableList() ?: MutableList(7) { "" }
                dayList[idx] = newVal
                timetableBuffer = timetableBuffer + (day to dayList)
                showSmartEditor = null
            }
        )
    }
}

private data class AdminScheduleNavItem(val name: String, val sub: String, val icon: ImageVector, val onPress: () -> Unit)

@Composable
private fun CourseItem(course: Course, colors: HomeColors, onEdit: () -> Unit, onDelete: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().clip(HomeShapes.Item).background(colors.surface).border(1.dp, colors.glassBorder, HomeShapes.Item).clickable { onEdit() }.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(modifier = Modifier.weight(1f)) {
            Text("${course.code} - ${course.name}", style = HomeTypography.PillTitle, color = colors.textPrimary, fontWeight = FontWeight.Bold)
            Text("${course.faculty} • ${course.periods} Periods", style = HomeTypography.FacultyName, color = colors.textSecondary)
        }
        IconButton(onClick = onEdit) { Icon(Icons.Default.Edit, null, tint = colors.textPrimary, modifier = Modifier.size(18.dp)) }
        IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, null, tint = colors.danger, modifier = Modifier.size(18.dp)) }
    }
}

@Composable
private fun TimetableManager(timetable: Map<String, List<String>>, isEditing: Boolean, colors: HomeColors, onStartEdit: () -> Unit, onCancel: () -> Unit, onSave: () -> Unit, onCellClick: (String, Int) -> Unit) {
    val days = listOf("Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    Column(modifier = Modifier.fillMaxSize()) {
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp, vertical = 12.dp), horizontalArrangement = Arrangement.End) {
            if (isEditing) {
                TextButton(onClick = onCancel, colors = ButtonDefaults.textButtonColors(contentColor = colors.danger)) { Text("Cancel") }
                Spacer(Modifier.width(8.dp))
                Button(onClick = onSave, colors = ButtonDefaults.buttonColors(containerColor = colors.accent)) { Text("Save Updates") }
            } else {
                Button(onClick = onStartEdit, colors = ButtonDefaults.buttonColors(containerColor = colors.accent), shape = RoundedCornerShape(10.dp)) {
                    Icon(Icons.Default.Edit, null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Edit Timetable")
                }
            }
        }
        LazyColumn(contentPadding = PaddingValues(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            items(days) { day ->
                Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(colors.surface).border(1.dp, colors.glassBorder, RoundedCornerShape(16.dp)).padding(16.dp)) {
                    Text(day, style = HomeTypography.PillTitle, color = colors.accent, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(12.dp))
                    Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        val rowData = timetable[day] ?: List(7) { "" }
                        rowData.forEachIndexed { idx, cell ->
                            Column(modifier = Modifier.width(60.dp).clip(RoundedCornerShape(8.dp)).background(if (cell.isEmpty()) colors.inputBackground else colors.accent.copy(alpha = 0.1f)).border(1.dp, if (cell.isEmpty()) colors.glassBorder else colors.accent.copy(alpha = 0.3f), RoundedCornerShape(8.dp)).clickable { onCellClick(day, idx) }.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("P${idx + 1}", fontSize = 10.sp, color = colors.textSecondary)
                                Text(cell.ifEmpty { " - " }, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary, maxLines = 1)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CounselingManager(counselors: List<String>, coordinators: Map<String, String>, colors: HomeColors, onUpdateCoordinators: (String, String) -> Unit, onAddCounselor: (String) -> Unit, onDeleteCounselor: (String) -> Unit) {
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp)) {
        Text("Coordinators", style = HomeTypography.SectionTitle, color = colors.textPrimary)
        Spacer(Modifier.height(12.dp))
        Column(modifier = Modifier.clip(RoundedCornerShape(16.dp)).background(colors.surface).border(1.dp, colors.glassBorder, RoundedCornerShape(16.dp)).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            listOf("Class Advisor", "Year Coordinator", "Chairperson").forEach { role ->
                Column {
                    Text(role, style = HomeTypography.InfoLabel, color = colors.textSecondary)
                    OutlinedTextField(value = coordinators[role] ?: "", onValueChange = { onUpdateCoordinators(role, it) }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                }
            }
        }
        Spacer(Modifier.height(24.dp))
        Text("Counselors", style = HomeTypography.SectionTitle, color = colors.textPrimary)
        Spacer(Modifier.height(12.dp))
        Column(modifier = Modifier.clip(RoundedCornerShape(16.dp)).background(colors.surface).border(1.dp, colors.glassBorder, RoundedCornerShape(16.dp)).padding(16.dp)) {
            var newC by remember { mutableStateOf("") }
            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(value = newC, onValueChange = { newC = it }, placeholder = { Text("Add Counselor...") }, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp))
                Spacer(Modifier.width(8.dp))
                IconButton(onClick = { if (newC.isNotEmpty()) { onAddCounselor(newC); newC = "" } }, modifier = Modifier.clip(CircleShape).background(colors.accent)) { Icon(Icons.Default.Add, null, tint = Color.White) }
            }
            FlowRow(mainAxisSpacing = 8.dp, crossAxisSpacing = 8.dp) {
                counselors.forEach { name ->
                    Row(modifier = Modifier.clip(CircleShape).background(colors.inputBackground).border(1.dp, colors.glassBorder, CircleShape).padding(horizontal = 12.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(name, fontSize = 12.sp, color = colors.textPrimary)
                        Spacer(Modifier.width(4.dp))
                        Icon(Icons.Default.Close, null, modifier = Modifier.size(14.dp).clickable { onDeleteCounselor(name) }, tint = colors.textSecondary)
                    }
                }
            }
        }
    }
}

@Composable
private fun CourseEditorDialog(course: Course?, colors: HomeColors, onDismiss: () -> Unit, onSave: (Course) -> Unit) {
    var code by remember { mutableStateOf(course?.code ?: "") }
    var name by remember { mutableStateOf(course?.name ?: "") }
    var faculty by remember { mutableStateOf(course?.faculty ?: "") }
    var periods by remember { mutableStateOf(course?.periods?.toString() ?: "3") }
    Dialog(onDismissRequest = onDismiss) {
        Card(colors = CardDefaults.cardColors(containerColor = colors.surface), shape = RoundedCornerShape(24.dp), modifier = Modifier.fillMaxWidth().padding(16.dp).border(1.dp, colors.glassBorder, RoundedCornerShape(24.dp))) {
            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text(if (course == null) "New Course" else "Edit Course", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                OutlinedTextField(value = code, onValueChange = { code = it }, label = { Text("Code") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                OutlinedTextField(value = faculty, onValueChange = { faculty = it }, label = { Text("Faculty") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                OutlinedTextField(value = periods, onValueChange = { if (it.all { it.isDigit() }) periods = it }, label = { Text("Periods/Week") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) { Text("Cancel", color = colors.textSecondary) }
                    Button(onClick = { onSave(Course(code = code, name = name, faculty = faculty, credit = 0, type = "", periods = periods.toIntOrNull() ?: 0)) }, colors = ButtonDefaults.buttonColors(containerColor = colors.accent)) { Text("Save") }
                }
            }
        }
    }
}

@Composable
private fun SmartCellEditor(currentValue: String, courses: List<Course>, colors: HomeColors, onDismiss: () -> Unit, onSave: (String) -> Unit) {
    var text by remember { mutableStateOf(currentValue) }
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
            Card(colors = CardDefaults.cardColors(containerColor = colors.surface), shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp), modifier = Modifier.fillMaxWidth().fillMaxHeight(0.8f)) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text("Edit Timetable Slot", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                Spacer(Modifier.height(16.dp))
                OutlinedTextField(value = text, onValueChange = { text = it }, modifier = Modifier.fillMaxWidth(), textStyle = HomeTypography.PillTitle.copy(fontWeight = FontWeight.Bold, color = colors.accent), shape = RoundedCornerShape(12.dp), trailingIcon = { if (text.isNotEmpty()) IconButton(onClick = { text = "" }) { Icon(Icons.Default.Clear, null) } })
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = { text += " / " }, colors = ButtonDefaults.textButtonColors(contentColor = colors.accent)) { Text("+ Split Period ( / )") }
                }
                Text("Suggestions", style = HomeTypography.InfoLabel, color = colors.textSecondary)
                LazyColumn(modifier = Modifier.weight(1f)) {
                    val lastToken = text.split("/").last().trim().lowercase()
                    val filtered = courses.filter { it.code.lowercase().contains(lastToken) || it.name.lowercase().contains(lastToken) }
                    items(filtered) { course ->
                        Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clip(RoundedCornerShape(12.dp)).background(colors.inputBackground).clickable { val parts = text.split("/").map { it.trim() }.toMutableList(); parts[parts.size - 1] = course.code; text = parts.joinToString(" / "); }.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(course.code, fontWeight = FontWeight.Bold, color = colors.accent)
                            Spacer(Modifier.width(12.dp))
                            Text(course.name, style = HomeTypography.FacultyName, color = colors.textPrimary, maxLines = 1)
                            Spacer(Modifier.weight(1f))
                            Icon(Icons.Default.AddCircleOutline, null, tint = colors.accent, modifier = Modifier.size(20.dp))
                        }
                    }
                }
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    TextButton(onClick = onDismiss) { Text("Cancel", color = colors.textSecondary) }
                    Button(onClick = { onSave(text.trim()) }, colors = ButtonDefaults.buttonColors(containerColor = colors.accent)) { Text("Confirm Slot") }
                }
            }
        }
    }
}
}

@Composable
fun FlowRow(mainAxisSpacing: androidx.compose.ui.unit.Dp, crossAxisSpacing: androidx.compose.ui.unit.Dp, content: @Composable () -> Unit) {
    androidx.compose.ui.layout.Layout(content = content) { measurables, constraints ->
        val placeholders = measurables.map { it.measure(constraints.copy(minWidth = 0, minHeight = 0)) }
        val lines = mutableListOf<MutableList<androidx.compose.ui.layout.Placeable>>()
        var currentLine = mutableListOf<androidx.compose.ui.layout.Placeable>()
        var currentLineWidth = 0
        placeholders.forEach { p ->
            if (currentLineWidth + p.width > constraints.maxWidth && currentLine.isNotEmpty()) {
                lines.add(currentLine)
                currentLine = mutableListOf()
                currentLineWidth = 0
            }
            currentLine.add(p)
            currentLineWidth += p.width + mainAxisSpacing.roundToPx()
        }
        if (currentLine.isNotEmpty()) lines.add(currentLine)
        val height = lines.sumOf { it.maxOf { it.height } } + (lines.size - 1) * crossAxisSpacing.roundToPx()
        layout(constraints.maxWidth, height) {
            var y = 0
            lines.forEach { line ->
                var x = 0
                val lineHeight = line.maxOf { it.height }
                line.forEach { p ->
                    p.placeRelative(x, y)
                    x += p.width + mainAxisSpacing.roundToPx()
                }
                y += lineHeight + crossAxisSpacing.roundToPx()
            }
        }
    }
}

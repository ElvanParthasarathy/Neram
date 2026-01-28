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
import com.elvan.rmdneram.admin.data.model.CalendarEvent
import com.elvan.rmdneram.admin.ui.home.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.*

@Composable
fun AdminEventManagerScreen(
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
    var events by remember { mutableStateOf<List<CalendarEvent>>(emptyList()) }
    var loadingEvents by remember { mutableStateOf(false) }

    // Editor State
    var showEditor by remember { mutableStateOf(false) }
    var editingEvent by remember { mutableStateOf<CalendarEvent?>(null) }
    
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

    // Fetch Events when section is selected
    LaunchedEffect(pathBatch, pathDept, pathSec) {
        if (pathBatch != null && pathDept != null && pathSec != null) {
            loadingEvents = true
            Firebase.database.getReference("events/$pathBatch/$pathDept/$pathSec").get().addOnSuccessListener { snap ->
                val list = mutableListOf<CalendarEvent>()
                snap.children.forEach { child ->
                    val map = child.value as? Map<String, Any>
                    if (map != null) {
                        list.add(CalendarEvent(
                            id = child.key ?: "",
                            title = map["title"] as? String ?: "",
                            date = map["date"] as? String ?: "",
                            type = map["type"] as? String ?: "Event",
                            description = map["description"] as? String ?: "",
                            startTime = map["startTime"] as? String ?: "",
                            endTime = map["endTime"] as? String ?: ""
                        ))
                    }
                }
                events = list.sortedBy { it.date }
                loadingEvents = false
            }
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
                    text = if (pathSec != null) "Section $pathSec" else pathDept ?: pathBatch ?: "Events",
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
            // Event List
            Box(modifier = Modifier.weight(1f)) {
                if (loadingEvents) {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center), color = colors.accent)
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(24.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(events) { event ->
                            EventAdminCard(event, colors, 
                                onEdit = { editingEvent = event; showEditor = true },
                                onDelete = {
                                    Firebase.database.getReference("events/$pathBatch/$pathDept/$pathSec/${event.id}").removeValue()
                                        .addOnSuccessListener {
                                            events = events.filter { it.id != event.id }
                                            Toast.makeText(context, "Event deleted", Toast.LENGTH_SHORT).show()
                                        }
                                }
                            )
                        }
                        if (events.isEmpty()) {
                            item {
                                Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                                    Text("No events scheduled.", color = colors.textSecondary, style = HomeTypography.FacultyName)
                                }
                            }
                        }
                    }
                }
                
                // FAB
                FloatingActionButton(
                    onClick = { editingEvent = null; showEditor = true },
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
                    hierarchy.keys.sortedDescending().map { AdminEventNavItem(it, "Batch", Icons.Default.People) { pathBatch = it } }
                } else if (pathDept == null) {
                    val depts = (hierarchy[pathBatch] as? Map<String, Any>) ?: emptyMap()
                    depts.keys.filter { it != "initialized" }.sorted().map { AdminEventNavItem(it, "Department", Icons.Default.GridView) { pathDept = it } }
                } else {
                    val secs = (hierarchy[pathBatch] as? Map<String, Any>)?.get(pathDept) as? List<String> ?: emptyList()
                    secs.map { AdminEventNavItem("Section $it", "Manage Events", Icons.Default.List) { pathSec = it } }
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
        EventEditor(
            event = editingEvent,
            onDismiss = { showEditor = false },
            onSave = { updatedEvent ->
                val id = updatedEvent.id.ifEmpty { System.currentTimeMillis().toString() }
                Firebase.database.getReference("events/$pathBatch/$pathDept/$pathSec/$id")
                    .setValue(updatedEvent.copy(id = id))
                    .addOnSuccessListener {
                        showEditor = false
                        Toast.makeText(context, "Event saved", Toast.LENGTH_SHORT).show()
                    }
            }
        )
    }
}

private data class AdminEventNavItem(val name: String, val sub: String, val icon: ImageVector, val onPress: () -> Unit)

@Composable
private fun EventAdminCard(
    event: CalendarEvent,
    colors: HomeColors,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val typeColor = when (event.type) {
        "FullDay" -> colors.accent
        "HalfDay" -> colors.warning
        else -> colors.success
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(HomeShapes.Item)
            .background(colors.surface)
            .border(1.dp, colors.glassBorder, HomeShapes.Item)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(typeColor.copy(alpha = 0.1f)),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            val dateParts = event.date.split("-")
            Text(dateParts.getOrNull(2) ?: "", color = typeColor, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(
                text = try { LocalDate.parse(event.date).format(DateTimeFormatter.ofPattern("MMM")) } catch (e: Exception) { "" },
                color = typeColor, fontSize = 10.sp, fontWeight = FontWeight.Bold
            )
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(event.title, style = HomeTypography.PillTitle, color = colors.textPrimary, fontWeight = FontWeight.Bold)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Box(modifier = Modifier.clip(RoundedCornerShape(6.dp)).background(typeColor.copy(alpha = 0.15f)).padding(horizontal = 6.dp, vertical = 2.dp)) {
                    Text(event.type, fontSize = 9.sp, color = typeColor, fontWeight = FontWeight.Bold)
                }
                if (event.type == "HalfDay") {
                    Text("${event.startTime} - ${event.endTime}", fontSize = 11.sp, color = colors.textSecondary)
                }
            }
        }
        
        IconButton(onClick = onEdit) { Icon(Icons.Default.Edit, null, tint = colors.textPrimary, modifier = Modifier.size(18.dp)) }
        IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, null, tint = colors.danger, modifier = Modifier.size(18.dp)) }
    }
}

@Composable
private fun EventEditor(
    event: CalendarEvent?,
    onDismiss: () -> Unit,
    onSave: (CalendarEvent) -> Unit
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    
    var title by remember { mutableStateOf(event?.title ?: "") }
    var date by remember { mutableStateOf(event?.date ?: LocalDate.now().toString()) }
    var type by remember { mutableStateOf(event?.type ?: "Event") }
    var description by remember { mutableStateOf(event?.description ?: "") }
    var startTime by remember { mutableStateOf(event?.startTime ?: "09:00 AM") }
    var endTime by remember { mutableStateOf(event?.endTime ?: "12:00 PM") }
    
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
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(if (event == null) "New Event" else "Edit Event", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                    TextButton(onClick = onDismiss) { Text("Cancel", color = colors.accent) }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Text("Event Title", style = HomeTypography.InfoLabel, color = colors.textSecondary)
                OutlinedTextField(
                    value = title, onValueChange = { title = it },
                    placeholder = { Text("e.g. Class Party", color = colors.placeholder) },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    shape = RoundedCornerShape(12.dp)
                )
                
                Text("Date", style = HomeTypography.InfoLabel, color = colors.textSecondary)
                Button(
                    onClick = {
                        val current = try { LocalDate.parse(date) } catch(e:Exception) { LocalDate.now() }
                        DatePickerDialog(context, { _, y, m, d ->
                            date = String.format("%04d-%02d-%02d", y, m + 1, d)
                        }, current.year, current.monthValue - 1, current.dayOfMonth).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = colors.inputBackground),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CalendarMonth, null, tint = colors.accent)
                        Spacer(Modifier.width(8.dp))
                        Text(date, color = colors.textPrimary)
                    }
                }
                
                Text("Event Type", style = HomeTypography.InfoLabel, color = colors.textSecondary)
                Row(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    for ((id, label) in listOf("Event" to "Regular", "FullDay" to "Full Day", "HalfDay" to "Half Day")) {
                        val active = type == id
                        val activeColor = if (active) colors.accent else colors.textSecondary
                        val activeBg = if (active) colors.accent.copy(alpha = 0.1f) else Color.Transparent
                        val activeBorder = if (active) colors.accent else colors.glassBorder
                        
                        AssistChip(
                            onClick = { type = id },
                            label = { Text(label) },
                            colors = AssistChipDefaults.assistChipColors(
                                labelColor = activeColor,
                                containerColor = activeBg
                            ),
                            border = BorderStroke(1.dp, activeBorder)
                        )
                    }
                }
                
                if (type == "HalfDay") {
                    Row(Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Column(Modifier.weight(1f)) {
                            Text("Start Time", fontSize = 12.sp, color = colors.textSecondary)
                            TimeBtn(time = startTime) { startTime = it }
                        }
                        Column(Modifier.weight(1f)) {
                            Text("End Time", fontSize = 12.sp, color = colors.textSecondary)
                            TimeBtn(time = endTime) { endTime = it }
                        }
                    }
                }
                
                Text("Description", style = HomeTypography.InfoLabel, color = colors.textSecondary)
                OutlinedTextField(
                    value = description, onValueChange = { description = it },
                    placeholder = { Text("Optional details...", color = colors.placeholder) },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp).height(100.dp),
                    shape = RoundedCornerShape(12.dp)
                )
                
                Spacer(Modifier.weight(1f))
                
                Button(
                    onClick = {
                        if (title.isEmpty()) return@Button
                        onSave(CalendarEvent(id = event?.id ?: "", title = title, date = date, type = type, description = description, startTime = startTime, endTime = endTime))
                    },
                    modifier = Modifier.fillMaxWidth().height(56.dp).padding(vertical = 8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = colors.accent),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(if (event == null) Icons.Default.Add else Icons.Default.Save, null)
                    Spacer(Modifier.width(8.dp))
                    Text(if (event == null) "Add to Section Calendar" else "Save Changes")
                }
            }
        }
    }
}

@Composable
private fun TimeBtn(time: String, onSelection: (String) -> Unit) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    
    Button(
        onClick = {
            TimePickerDialog(context, { _, h, m ->
                val ampm = if (h >= 12) "PM" else "AM"
                val h12 = if (h % 12 == 0) 12 else h % 12
                onSelection(String.format("%02d:%02d %s", h12, m, ampm))
            }, 9, 0, false).show()
        },
        colors = ButtonDefaults.buttonColors(containerColor = colors.inputBackground),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(time, color = colors.textPrimary, fontSize = 13.sp)
    }
}

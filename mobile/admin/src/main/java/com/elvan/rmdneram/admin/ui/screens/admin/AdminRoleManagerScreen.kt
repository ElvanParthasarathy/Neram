package com.elvan.rmdneram.admin.ui.screens.admin

import androidx.activity.compose.BackHandler
import android.widget.Toast
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.elvan.rmdneram.admin.data.model.UserProfile
import com.elvan.rmdneram.admin.ui.home.*
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase

private data class Role(
    val id: String,
    val label: String,
    val color: Color,
    val icon: ImageVector
)

private val ROLES = listOf(
    Role("admin", "Admin", Color(0xFF6366F1), Icons.Default.Shield),
    Role("cr", "Class Rep (CR)", Color(0xFFF59E0B), Icons.Default.Star),
    Role("student", "Student", Color(0xFF9CA3AF), Icons.Default.Person)
)

@Composable
fun AdminRoleManagerScreen(
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    
    var allUsers by remember { mutableStateOf<List<UserProfile>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var search by remember { mutableStateOf("") }
    var selectedUser by remember { mutableStateOf<UserProfile?>(null) }
    var path by remember { mutableStateOf<List<String>>(emptyList()) }
    
    // Internal Back Logic
    BackHandler {
        when {
            selectedUser != null -> selectedUser = null
            path.isNotEmpty() -> path = path.dropLast(1)
            else -> onBack()
        }
    }

    // Fetch Users
    LaunchedEffect(Unit) {
        val usersRef = Firebase.database.getReference("users")
        usersRef.get().addOnSuccessListener { snap ->
            val list = mutableListOf<UserProfile>()
            snap.children.forEach { child ->
                try {
                    val user = child.getValue(UserProfile::class.java)
                    if (user != null) {
                        list.add(user.copy(uid = child.key ?: ""))
                    }
                } catch (e: Exception) {
                    // Skip malformed profiles
                }
            }
            allUsers = list
            loading = false
        }.addOnFailureListener {
            loading = false
            Toast.makeText(context, "Failed to fetch users", Toast.LENGTH_SHORT).show()
        }
    }

    // Computed Hierarchy
    val hierarchy = remember(allUsers) {
        val tree = mutableMapOf<String, MutableMap<String, MutableMap<String, MutableList<UserProfile>>>>()
        val others = mutableListOf<UserProfile>()

        allUsers.forEach { u ->
            if (u.batch.isNotEmpty() && u.department.isNotEmpty() && u.section.isNotEmpty()) {
                val batchTree = tree.getOrPut(u.batch) { mutableMapOf() }
                val deptTree = batchTree.getOrPut(u.department) { mutableMapOf() }
                val secList = deptTree.getOrPut(u.section) { mutableListOf() }
                secList.add(u)
            } else {
                others.add(u)
            }
        }
        
        // Sort users: Admin > CR > Student, then by name
        val sortUsers = { list: List<UserProfile> ->
            list.sortedWith(compareByDescending<UserProfile> { it.role == "admin" }
                .thenByDescending { it.role == "cr" }
                .thenBy { it.displayName })
        }
        
        tree to sortUsers(others)
    }

    val currentViewData = remember(search, allUsers, hierarchy, path) {
        if (search.trim().isNotEmpty()) {
            val low = search.lowercase()
            return@remember allUsers.filter { 
                it.displayName.lowercase().contains(low) || it.email.lowercase().contains(low) 
            }
        }

        val (tree, others) = hierarchy
        
        if (path.isEmpty()) {
            val batches = tree.keys.sortedDescending().map { FolderItem(it, "folder") }
            val special = if (others.isNotEmpty()) listOf(FolderItem("Unassigned", "folder", isOthers = true)) else emptyList()
            return@remember batches + special
        }

        if (path.first() == "Unassigned") return@remember others

        var pointer: Any = tree
        path.forEach { p ->
            pointer = (pointer as? Map<*, *>)?.get(p) ?: return@remember emptyList<Any>()
        }

        if (pointer is List<*>) {
            return@remember pointer as List<UserProfile>
        } else if (pointer is Map<*, *>) {
            return@remember (pointer as Map<String, *>).keys.sorted().map { FolderItem(it, "folder") }
        }
        
        emptyList<Any>()
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
                        if (path.isNotEmpty()) path = path.dropLast(1) else onBack() 
                    },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.ArrowBack, "Back", tint = colors.textPrimary, modifier = Modifier.size(20.dp))
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column {
                Text("Role Manager", style = HomeTypography.PageTitle, color = colors.textPrimary)
                Text(
                    if (search.isNotEmpty()) "Searching..." else if (path.isEmpty()) "Batches" else path.joinToString(" > "),
                    style = HomeTypography.FacultyName,
                    color = colors.textSecondary
                )
            }
        }

        // Search Bar
        OutlinedTextField(
            value = search,
            onValueChange = { search = it },
            placeholder = { Text("Search any user...", color = colors.placeholder) },
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 12.dp),
            leadingIcon = { Icon(Icons.Default.Search, null, tint = colors.textSecondary) },
            trailingIcon = {
                if (search.isNotEmpty()) {
                    IconButton(onClick = { search = "" }) {
                        Icon(Icons.Default.Close, null, tint = colors.textSecondary)
                    }
                }
            },
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = colors.accent,
                unfocusedBorderColor = colors.glassBorder,
                focusedContainerColor = colors.inputBackground,
                unfocusedContainerColor = colors.inputBackground
            ),
            singleLine = true,
            textStyle = HomeTypography.PillTime.copy(color = colors.textPrimary)
        )

        if (loading) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = colors.accent)
            }
        } else {
            val isFolderView = currentViewData.isNotEmpty() && currentViewData.first() is FolderItem
            
            if (isFolderView) {
                LazyVerticalGrid(
                    columns = GridCells.Fixed(3),
                    contentPadding = PaddingValues(24.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(currentViewData) { item ->
                        val folder = item as FolderItem
                        Column(
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .clickable {
                                    path = if (folder.isOthers) listOf("Unassigned") else path + folder.name
                                }
                                .padding(8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                Icons.Default.Folder,
                                null,
                                tint = Color(0xFFFFD54F),
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                folder.name,
                                style = HomeTypography.FacultyName,
                                color = colors.textPrimary,
                                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                maxLines = 2
                            )
                        }
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(currentViewData) { item ->
                        val user = item as UserProfile
                        UserCard(user, colors) { selectedUser = user }
                    }
                    if (currentViewData.isEmpty()) {
                        item {
                            Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                                Text("Nothing here.", color = colors.textSecondary, style = HomeTypography.FacultyName)
                            }
                        }
                    }
                }
            }
        }
    }

    // Role Picker Modal
    if (selectedUser != null) {
        Dialog(onDismissRequest = { selectedUser = null }) {
            Card(
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                shape = RoundedCornerShape(24.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .border(1.dp, colors.glassBorder, RoundedCornerShape(24.dp))
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Assign Role", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                    Text("For ${selectedUser?.displayName}", style = HomeTypography.FacultyName, color = colors.textSecondary)
                    
                    Spacer(modifier = Modifier.height(24.dp))

                    ROLES.forEach { role ->
                        val isSelected = selectedUser?.role == role.id
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (isSelected) role.color.copy(alpha = 0.1f) else Color.Transparent)
                                .border(1.dp, if (isSelected) role.color else colors.glassBorder, RoundedCornerShape(12.dp))
                                .clickable {
                                    val uid = selectedUser?.uid ?: return@clickable
                                    Firebase.database.getReference("users/$uid/role").setValue(role.id)
                                        .addOnSuccessListener {
                                            allUsers = allUsers.map { if (it.uid == uid) it.copy(role = role.id) else it }
                                            selectedUser = null
                                            Toast.makeText(context, "Role updated", Toast.LENGTH_SHORT).show()
                                        }
                                }
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(role.color),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(role.icon, null, tint = Color.White, modifier = Modifier.size(20.dp))
                            }
                            Spacer(modifier = Modifier.width(16.dp))
                            Text(role.label, style = HomeTypography.PillTitle, color = colors.textPrimary, modifier = Modifier.weight(1f))
                            if (isSelected) {
                                Icon(Icons.Default.CheckCircle, null, tint = role.color, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

private data class FolderItem(val name: String, val type: String, val isOthers: Boolean = false)

@Composable
private fun UserCard(
    user: UserProfile,
    colors: HomeColors,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(HomeShapes.Item)
            .background(colors.surface)
            .border(1.dp, colors.glassBorder, HomeShapes.Item)
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar
        Box(
            modifier = Modifier
                .size(44.dp)
                .clip(CircleShape)
                .background(colors.accent.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            if (user.photoURL != null) {
                AsyncImage(
                    model = user.photoURL,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            } else {
                Text(user.getInitial(), style = HomeTypography.PillTitle, color = colors.accent, fontWeight = FontWeight.Bold)
            }
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    user.displayName.ifEmpty { "Unknown User" },
                    style = HomeTypography.PillTitle,
                    color = colors.textPrimary,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.weight(1f, fill = false),
                    maxLines = 1
                )
                Spacer(modifier = Modifier.width(8.dp))
                val role = ROLES.find { it.id == user.role } ?: ROLES.last()
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(role.color.copy(alpha = 0.15f))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(role.label, fontSize = 10.sp, color = role.color, fontWeight = FontWeight.Bold)
                }
            }
            Text(user.email, style = HomeTypography.FacultyName, color = colors.textSecondary, maxLines = 1)
        }
    }
}

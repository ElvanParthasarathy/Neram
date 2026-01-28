package com.elvan.rmdneram.ui.screens

import androidx.activity.compose.BackHandler
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeTypography
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.google.firebase.auth.ktx.auth
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserDirectoryScreen(
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val user = Firebase.auth.currentUser
    
    // State
    var directoryPath by remember { mutableStateOf(listOf<String>()) }
    var hierarchy by remember { mutableStateOf<Map<String, Map<String, List<String>>>>(emptyMap()) }
    var userBatch by remember { mutableStateOf<String?>(null) }
    
    // Back Handler
    BackHandler {
        if (directoryPath.isNotEmpty()) {
            directoryPath = directoryPath.dropLast(1)
        } else {
            onBack()
        }
    }

    // Load Data
    DisposableEffect(user?.uid) {
        var hierarchyListener: ValueEventListener? = null
        var userListener: ValueEventListener? = null
        var hierarchyRef: com.google.firebase.database.DatabaseReference? = null
        var userRef: com.google.firebase.database.DatabaseReference? = null

        // Load User Batch
        user?.uid?.let { uid ->
            userRef = Firebase.database.getReference("users/$uid")
            userListener = object : ValueEventListener {
                override fun onDataChange(snapshot: DataSnapshot) {
                    userBatch = snapshot.child("batch").value?.toString()
                }
                override fun onCancelled(error: DatabaseError) {}
            }
            userRef?.addValueEventListener(userListener!!)
        }

        // Load Hierarchy
        hierarchyRef = Firebase.database.getReference("academic_hierarchy")
        hierarchyListener = object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                try {
                    val result = mutableMapOf<String, Map<String, List<String>>>()
                    snapshot.children.forEach { batchSnap ->
                        val batch = batchSnap.key ?: return@forEach
                        val depts = mutableMapOf<String, List<String>>()
                        batchSnap.children.forEach { deptSnap ->
                            val dept = deptSnap.key ?: return@forEach
                            val sections = deptSnap.children.mapNotNull { it.getValue(String::class.java) }
                            depts[dept] = sections
                        }
                        result[batch] = depts
                    }
                    hierarchy = result
                } catch (e: Exception) {
                    android.util.Log.e("UserDirectory", "Error parsing hierarchy", e)
                }
            }
            override fun onCancelled(error: DatabaseError) {}
        }
        hierarchyRef?.addValueEventListener(hierarchyListener!!)

        onDispose {
            hierarchyListener?.let { hierarchyRef?.removeEventListener(it) }
            userListener?.let { userRef?.removeEventListener(it) }
        }
    }

    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(scrollBehavior.nestedScrollConnection),
        containerColor = colors.background,
        topBar = {
            LargeTopAppBar(
                title = {
                    Text(
                        "User Directory",
                        style = HomeTypography.PageTitle.copy(fontSize = 28.sp),
                        color = colors.textPrimary
                    )
                },
                navigationIcon = {
                    Box(
                        modifier = Modifier
                            .padding(start = 12.dp)
                            .size(44.dp)
                            .clip(CircleShape)
                            .background(colors.surface)
                            .border(1.dp, colors.glassBorder, CircleShape)
                            .clickable { 
                                if (directoryPath.isNotEmpty()) {
                                    directoryPath = directoryPath.dropLast(1)
                                } else {
                                    onBack()
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.ChevronLeft, "Back", tint = colors.textPrimary, modifier = Modifier.size(20.dp))
                    }
                },
                colors = TopAppBarDefaults.largeTopAppBarColors(
                    containerColor = colors.background,
                    scrolledContainerColor = colors.background,
                    titleContentColor = colors.textPrimary
                ),
                scrollBehavior = scrollBehavior
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            item {
                UserDirectoryContent(
                    hierarchy = hierarchy,
                    colors = colors,
                    userBatch = userBatch,
                    path = directoryPath,
                    onPathChange = { directoryPath = it }
                )
            }
        }
    }
}

@Composable
private fun UserDirectoryContent(
    hierarchy: Map<String, Map<String, List<String>>>,
    colors: HomeColors,
    userBatch: String?,
    path: List<String>,
    onPathChange: (List<String>) -> Unit
) {
    var users by remember { mutableStateOf(listOf<Map<String, String>>()) }
    var usersLoading by remember { mutableStateOf(false) }
    
    // Auto-set path to user's batch if available
    LaunchedEffect(userBatch, hierarchy) {
        if (userBatch != null && hierarchy.containsKey(userBatch) && path.isEmpty()) {
            onPathChange(listOf(userBatch))
        }
    }
    
    // Fetch users when at section level
    LaunchedEffect(path) {
        if (path.size == 3) {
            usersLoading = true
            val batch = path.getOrNull(0) ?: return@LaunchedEffect
            val dept = path.getOrNull(1) ?: return@LaunchedEffect
            val section = path.getOrNull(2) ?: return@LaunchedEffect
            
            try {
                Firebase.database.getReference("users")
                    .addListenerForSingleValueEvent(object : ValueEventListener {
                        override fun onDataChange(snapshot: DataSnapshot) {
                            try {
                                val filtered = mutableListOf<Map<String, String>>()
                                snapshot.children.forEach { child ->
                                    val data = mutableMapOf<String, String>()
                                    child.children.forEach { field ->
                                        try {
                                            field.getValue(String::class.java)?.let { value ->
                                                field.key?.let { key -> data[key] = value }
                                            }
                                        } catch (e: Exception) {
                                            // Skip non-string fields
                                        }
                                    }
                                    if (data["batch"] == batch && 
                                        data["department"] == dept && 
                                        data["section"] == section) {
                                        filtered.add(data)
                                    }
                                }
                                users = filtered.sortedBy { it["displayName"] ?: "" }
                            } catch (e: Exception) {
                                users = emptyList()
                            } finally {
                                usersLoading = false
                            }
                        }
                        override fun onCancelled(error: DatabaseError) {
                            usersLoading = false
                        }
                    })
            } catch (e: Exception) {
                usersLoading = false
            }
        } else {
            // Reset users when navigating away from section level
            users = emptyList()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp)
    ) {
        // CONTENT
        if (path.isEmpty()) {
            // Batch Select
            Text("Select Batch", style = HomeTypography.SectionTitle, color = colors.textPrimary)
            Spacer(modifier = Modifier.height(16.dp))
            hierarchy.keys.sorted().forEach { batch ->
                FolderCard(
                    title = "Batch $batch",
                    subtitle = "${hierarchy[batch]?.size ?: 0} Departments",
                    colors = colors,
                    onClick = { onPathChange(path + batch) }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
        } else if (path.size == 1) {
            // Dept Select
            val batch = path[0]
            val depts = hierarchy[batch] ?: emptyMap()
            
            HeaderWithBack(
                title = "Batch $batch",
                subtitle = "Select Department",
                colors = colors,
                onBack = { onPathChange(path.dropLast(1)) }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            depts.keys.sorted().forEach { dept ->
                FolderCard(
                    title = dept,
                    subtitle = "${depts[dept]?.size ?: 0} Sections",
                    colors = colors,
                    onClick = { onPathChange(path + dept) }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
        } else if (path.size == 2) {
            // Section Select
            val batch = path[0]
            val dept = path[1]
            val sections = hierarchy[batch]?.get(dept) ?: emptyList()
            
            HeaderWithBack(
                title = "$dept",
                subtitle = "Select Section",
                colors = colors,
                onBack = { onPathChange(path.dropLast(1)) }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            sections.sorted().forEach { section ->
                FolderCard(
                    title = "Section $section",
                    subtitle = "View Students",
                    colors = colors,
                    onClick = { onPathChange(path + section) }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
        } else {
            // User List
            val batch = path[0]
            val dept = path[1]
            val section = path[2]
            
            HeaderWithBack(
                title = "$dept - $section",
                subtitle = "Student Directory",
                colors = colors,
                onBack = { onPathChange(path.dropLast(1)) }
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            if (usersLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator(color = colors.accent)
                }
            } else if (users.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No users found in this section.", color = colors.textSecondary)
                }
            } else {
                users.forEach { user ->
                    UserCard(user = user, colors = colors)
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
private fun FolderCard(
    title: String,
    subtitle: String,
    colors: HomeColors,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(HomeShapes.Item)
            .background(colors.surface)
            .border(1.dp, colors.glassBorder, HomeShapes.Item)
            .clickable { onClick() }
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            Icons.Default.Folder,
            null,
            tint = Color(0xFFFFCC00), // Folder yellow color
            modifier = Modifier.size(40.dp)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            title,
            style = HomeTypography.PillTitle,
            color = colors.textPrimary,
            fontWeight = FontWeight.SemiBold,
            textAlign = TextAlign.Center
        )
        Text(
            subtitle,
            style = HomeTypography.PillTime,
            color = colors.textSecondary,
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun HeaderWithBack(
    title: String,
    subtitle: String,
    colors: HomeColors,
    onBack: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(colors.surface)
                .border(1.dp, colors.glassBorder, CircleShape)
                .clickable { onBack() },
            contentAlignment = Alignment.Center
        ) {
            Icon(
                Icons.Default.ChevronLeft,
                null,
                tint = colors.textPrimary,
                modifier = Modifier.size(18.dp)
            )
        }
        
        Spacer(modifier = Modifier.width(12.dp))
        
        Column {
            Text(
                title,
                style = HomeTypography.PillTitle,
                color = colors.textPrimary,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                subtitle,
                style = HomeTypography.PillTime,
                color = colors.textSecondary
            )
        }
    }
}

@Composable
private fun UserCard(
    user: Map<String, String>,
    colors: HomeColors
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(HomeShapes.Item)
            .background(colors.surface)
            .border(1.dp, colors.glassBorder, HomeShapes.Item)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar
        val photoUrl = user["photoURL"]
        if (!photoUrl.isNullOrEmpty()) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(photoUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = "User Photo",
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        } else {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(colors.subtleBackground),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Person,
                    null,
                    tint = colors.textSecondary,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                user["displayName"] ?: "Unknown",
                style = HomeTypography.PillTitle,
                color = colors.textPrimary,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                user["registerNo"] ?: "No Register No",
                style = HomeTypography.FacultyName,
                color = colors.textSecondary
            )
        }
    }
}

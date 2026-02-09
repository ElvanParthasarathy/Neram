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
import androidx.compose.material.icons.filled.KeyboardArrowLeft
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.ChevronRight
import com.elvan.rmdneram.ui.navigation.SecondaryTopBar
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
    directoryPath: List<String>,
    onDirectoryPathChange: (List<String>) -> Unit
) {
    val colors = rememberHomeColors()
    // Removed directoryPath state and BackHandler - hoisted to MainScreen

    // Load Data
    var hierarchy by remember { mutableStateOf<Map<String, Map<String, List<String>>>>(emptyMap()) }
    
    DisposableEffect(Unit) { 
        var hierarchyListener: ValueEventListener? = null
        var hierarchyRef: com.google.firebase.database.DatabaseReference? = null

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
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
    ) {
        // Header is now handled by MainScreen
        
        // Content
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(
                start = com.elvan.rmdneram.ui.home.HomeDimens.ContentPadding,
                end = com.elvan.rmdneram.ui.home.HomeDimens.ContentPadding,
                top = com.elvan.rmdneram.ui.home.rememberStatusBarHeight() + com.elvan.rmdneram.ui.home.HomeDimens.ContentPaddingTop,
                bottom = com.elvan.rmdneram.ui.home.HomeDimens.ContentPaddingBottom
            )
        ) {
            item {
                UserDirectoryContent(
                    hierarchy = hierarchy,
                    colors = colors,
                    path = directoryPath,
                    onPathChange = onDirectoryPathChange
                )
            }
        }
    }
}

@Composable
private fun UserDirectoryContent(
    hierarchy: Map<String, Map<String, List<String>>>,
    colors: HomeColors,
    path: List<String>,
    onPathChange: (List<String>) -> Unit
) {
    var users by remember { mutableStateOf(listOf<Map<String, String>>()) }
    var usersLoading by remember { mutableStateOf(false) }
    
    // Removed auto-set path logic
    
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

    AnimatedContent(
        targetState = path,
        transitionSpec = {
            if (targetState.size > initialState.size) {
                // Forward: Slide In from Right
                slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Left) + fadeIn() togetherWith
                slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Left) + fadeOut()
            } else {
                // Backward: Slide In from Left
                slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Right) + fadeIn() togetherWith
                slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Right) + fadeOut()
            }
        },
        label = "DirectoryTransition"
    ) { currentPath ->
        val level = currentPath.size
        
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            // CONTENT
            if (level == 0) {
                // Batch Select
                Text("Select Batch", style = HomeTypography.SectionTitle, color = colors.textPrimary)
                Spacer(modifier = Modifier.height(16.dp))
                hierarchy.keys.sorted().forEach { batch ->
                    DirectoryFolderItem(
                        name = "Batch $batch",
                        colors = colors,
                        onClick = { onPathChange(currentPath + batch) }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            } else if (level == 1) {
                // Dept Select
                val batch = currentPath[0]
                val depts = hierarchy[batch] ?: emptyMap()
                
                // Header removed - using Screen-level header
                
                Spacer(modifier = Modifier.height(16.dp))
                depts.keys.sorted().forEach { dept ->
                    DirectoryFolderItem(
                        name = dept,
                        colors = colors,
                        onClick = { onPathChange(currentPath + dept) }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            } else if (level == 2) {
                // Section Select
                val batch = currentPath[0]
                val dept = currentPath[1]
                val sections = hierarchy[batch]?.get(dept) ?: emptyList()
                
                // Header removed
                
                Spacer(modifier = Modifier.height(16.dp))
                sections.sorted().forEach { section ->
                    DirectoryFolderItem(
                        name = "Section $section",
                        colors = colors,
                        onClick = { onPathChange(currentPath + section) }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            } else {
                // User List - Keep existing list style
                // path size >= 3
                val batch = currentPath.getOrNull(0) ?: ""
                val dept = currentPath.getOrNull(1) ?: ""
                val section = currentPath.getOrNull(2) ?: ""
                
                // Header removed
                
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
}

@Composable
private fun DirectoryFolderItem(
    name: String,
    colors: HomeColors,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = HomeShapes.Item,
        color = colors.surface,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Folder,
                contentDescription = null,
                tint = colors.accent,
                modifier = Modifier.size(28.dp)
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Text(
                text = name,
                style = HomeTypography.PillTitle,
                color = colors.textPrimary,
                modifier = Modifier.weight(1f)
            )
            
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = null,
                tint = colors.textSecondary.copy(alpha = 0.5f),
                modifier = Modifier.size(20.dp)
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
            // Removed border
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

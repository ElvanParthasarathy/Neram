package com.elvan.neram.ui.directory

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Folder
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.google.firebase.database.DataSnapshot
import com.google.firebase.database.DatabaseError
import com.google.firebase.database.ValueEventListener
import com.google.firebase.database.ktx.database
import com.google.firebase.ktx.Firebase

@Composable
fun UserDirectoryScreen(
    directoryPath: List<String>,
    onDirectoryPathChange: (List<String>) -> Unit,
    onBack: () -> Unit = {},
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val colors = rememberHomeColors()

    // Load Hierarchy Data
    var hierarchy by remember { mutableStateOf<Map<String, Map<String, List<String>>>>(emptyMap()) }
    
    DisposableEffect(Unit) { 
        var hierarchyListener: ValueEventListener? = null
        var hierarchyRef: com.google.firebase.database.DatabaseReference? = null

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

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        item(key = "directory_content") {
            UserDirectoryContent(
                hierarchy = hierarchy,
                colors = colors,
                path = directoryPath,
                onPathChange = onDirectoryPathChange
            )
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
            users = emptyList()
        }
    }

    AnimatedContent(
        targetState = path,
        transitionSpec = {
            if (targetState.size > initialState.size) {
                slideIntoContainer(
                    towards = AnimatedContentTransitionScope.SlideDirection.Left,
                    animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioNoBouncy)
                ) togetherWith fadeOut(targetAlpha = 0.9f, animationSpec = tween(durationMillis = 50))
            } else {
                fadeIn(initialAlpha = 0.9f) togetherWith slideOutOfContainer(
                    towards = AnimatedContentTransitionScope.SlideDirection.Right,
                    animationSpec = spring(stiffness = Spring.StiffnessLow, dampingRatio = Spring.DampingRatioNoBouncy)
                )
            }
        },
        label = "DirectoryTransition"
    ) { currentPath ->
        val level = currentPath.size
        
        when (level) {
            0 -> {
                // Batch Selection
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = "Select Batch",
                        colors = colors
                    ) {
                        val batches = hierarchy.keys.sorted()
                        if (batches.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Loading academic batches...",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colors.textSecondary
                                )
                            }
                        } else {
                            batches.forEachIndexed { index, batch ->
                                ElvanSettingsRow(
                                    icon = Icons.Outlined.Folder,
                                    title = "Batch $batch",
                                    description = "View departments in batch $batch",
                                    onClick = { onPathChange(currentPath + batch) },
                                    colors = colors
                                )
                                if (index < batches.lastIndex) {
                                    ElvanSettingsDivider(colors = colors)
                                }
                            }
                        }
                    }
                }
            }
            1 -> {
                // Dept Selection
                val batch = currentPath[0]
                val depts = (hierarchy[batch] ?: emptyMap()).keys.sorted()
                
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = "Select Department (Batch $batch)",
                        colors = colors
                    ) {
                        if (depts.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No departments found",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colors.textSecondary
                                )
                            }
                        } else {
                            depts.forEachIndexed { index, dept ->
                                ElvanSettingsRow(
                                    icon = Icons.Outlined.Folder,
                                    title = dept,
                                    description = "View sections in $dept",
                                    onClick = { onPathChange(currentPath + dept) },
                                    colors = colors
                                )
                                if (index < depts.lastIndex) {
                                    ElvanSettingsDivider(colors = colors)
                                }
                            }
                        }
                    }
                }
            }
            2 -> {
                // Section Selection
                val batch = currentPath[0]
                val dept = currentPath[1]
                val sections = (hierarchy[batch]?.get(dept) ?: emptyList()).sorted()
                
                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = "Select Section ($dept)",
                        colors = colors
                    ) {
                        if (sections.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No sections found",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colors.textSecondary
                                )
                            }
                        } else {
                            sections.forEachIndexed { index, section ->
                                ElvanSettingsRow(
                                    icon = Icons.Outlined.Folder,
                                    title = "Section $section",
                                    description = "View students in section $section",
                                    onClick = { onPathChange(currentPath + section) },
                                    colors = colors
                                )
                                if (index < sections.lastIndex) {
                                    ElvanSettingsDivider(colors = colors)
                                }
                            }
                        }
                    }
                }
            }
            else -> {
                // Users List
                val batch = currentPath.getOrNull(0) ?: ""
                val dept = currentPath.getOrNull(1) ?: ""
                val section = currentPath.getOrNull(2) ?: ""

                ElvanSectionContainer {
                    ElvanSettingsSection(
                        title = "Students ($dept - Sec $section)",
                        colors = colors
                    ) {
                        if (usersLoading) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(140.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                com.elvan.neram.ui.components.ExpressiveLoadingIndicator(color = colors.accent)
                            }
                        } else if (users.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No students found in this section.",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = colors.textSecondary
                                )
                            }
                        } else {
                            users.forEachIndexed { index, user ->
                                UserDirectoryRow(user = user, colors = colors)
                                if (index < users.lastIndex) {
                                    ElvanSettingsDivider(colors = colors)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun UserDirectoryRow(
    user: Map<String, String>,
    colors: HomeColors
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 14.dp),
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
                    .size(42.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        } else {
            val isDark = colors.isDark
            val iconBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(iconBg),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Outlined.Person,
                    contentDescription = null,
                    tint = colors.textSecondary,
                    modifier = Modifier.size(22.dp)
                )
            }
        }
        
        Spacer(modifier = Modifier.width(14.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = user["displayName"] ?: "Unknown",
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium
                ),
                color = colors.textPrimary
            )
            val regNo = user["registerNo"]
            if (!regNo.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = regNo,
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 13.sp),
                    color = colors.textSecondary
                )
            }
        }
    }
}

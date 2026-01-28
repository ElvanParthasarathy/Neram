package com.elvan.rmdneram.admin.ui.screens.admin

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.PeopleAlt
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material3.*
import androidx.compose.animation.*
import androidx.compose.runtime.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.admin.ui.home.*

private data class AdminMenuItem(
    val title: String,
    val icon: ImageVector,
    val color: Color,
    val route: String
)

private val adminMenu = listOf(
    AdminMenuItem("Role Manager", Icons.Default.PeopleAlt, Color(0xFF6366F1), "roles"),
    AdminMenuItem("Event Manager", Icons.Default.CalendarMonth, Color(0xFF10B981), "events"),
    AdminMenuItem("Exam Manager", Icons.Default.EmojiEvents, Color(0xFFF59E0B), "exams"),
    AdminMenuItem("Schedule Manager", Icons.Default.Schedule, Color(0xFFEC4899), "schedules")
)

@Composable
fun AdminDashboardScreen(
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    var activeManager by remember { mutableStateOf<String?>(null) }
    
    // Internal Back Handler for Admin Sub-screens
    BackHandler(enabled = activeManager != null) {
        activeManager = null
    }

    AnimatedContent(
        targetState = activeManager,
        transitionSpec = {
            if (targetState != null) {
                slideInHorizontally { it } + fadeIn() togetherWith slideOutHorizontally { -it } + fadeOut()
            } else {
                slideInHorizontally { -it } + fadeIn() togetherWith slideOutHorizontally { it } + fadeOut()
            }
        },
        label = "AdminNavigation"
    ) { manager ->
        when (manager) {
            "roles" -> AdminRoleManagerScreen(onBack = { activeManager = null })
            "events" -> AdminEventManagerScreen(onBack = { activeManager = null })
            "exams" -> AdminExamManagerScreen(onBack = { activeManager = null })
            "schedules" -> AdminScheduleManagerScreen(onBack = { activeManager = null })
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(colors.background)
                ) {
                    // Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 24.dp, end = 24.dp, top = 48.dp, bottom = 24.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(colors.surface)
                                .border(1.dp, colors.glassBorder, CircleShape)
                                .clickable { onBack() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.ArrowBack, "Back", tint = colors.textPrimary, modifier = Modifier.size(20.dp))
                        }
                        
                        Spacer(modifier = Modifier.width(16.dp))
                        
                        Column {
                            Text("Admin Panel", style = HomeTypography.PageTitle, color = colors.textPrimary)
                            Text("Manage App Content", style = HomeTypography.FacultyName, color = colors.textSecondary)
                        }
                    }

                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        contentPadding = PaddingValues(24.dp),
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(adminMenu) { item ->
                            Card(
                                colors = CardDefaults.cardColors(containerColor = colors.surface),
                                shape = RoundedCornerShape(20.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .aspectRatio(0.9f)
                                    .border(1.dp, colors.glassBorder, RoundedCornerShape(20.dp))
                                    .clickable { activeManager = item.route }
                            ) {
                                Column(
                                    modifier = Modifier
                                        .fillMaxSize()
                                        .padding(16.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(60.dp)
                                            .clip(RoundedCornerShape(16.dp))
                                            .background(item.color),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(item.icon, null, tint = Color.White, modifier = Modifier.size(32.dp))
                                    }
                                    
                                    Spacer(modifier = Modifier.height(16.dp))
                                    
                                    Text(
                                        item.title,
                                        style = HomeTypography.PillTitle,
                                        color = colors.textPrimary,
                                        fontWeight = FontWeight.Bold
                                    )
                                    
                                    Text(
                                        "Manage ${item.title.split(" ")[0]}s",
                                        style = HomeTypography.FacultyName,
                                        color = colors.textSecondary,
                                        fontSize = 11.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

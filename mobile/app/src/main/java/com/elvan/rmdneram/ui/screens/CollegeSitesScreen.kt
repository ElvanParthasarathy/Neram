package com.elvan.rmdneram.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.*

// Important Links Data
private data class SiteLink(
    val name: String,
    val url: String,
    val description: String,
    val icon: ImageVector
)

private val links = listOf(
    SiteLink("RMD College Website", "https://rmd.ac.in/", "Official RMD college website.", Icons.Outlined.Business),
    SiteLink("ECE Digital Notes", "https://rmd.ac.in/dept/ece/notes.html", "Access the ECE department's digital notes.", Icons.Outlined.MenuBook),
    SiteLink("RMK Nextgen Student", "https://nextgen.rmd.ac.in/", "Nextgen platform for student login and academic tracking.", Icons.Outlined.Person),
    SiteLink("RMK Nextgen Faculty", "https://nextgenfaculty.rmd.ac.in/login.html", "Faculty login for RMK Nextgen academic management.", Icons.Outlined.People),
    SiteLink("IamNeo", "https://rmk685.examly.io/login", "Learning, assessment, and recruitment solutions.", Icons.Outlined.Code),
    SiteLink("Skill Rack", "https://www.skillrack.com/faces/ui/profile.xhtml", "Daily coding challenges and problem-solving tasks.", Icons.Outlined.Terminal),
    SiteLink("ChatGPT", "https://chatgpt.com/", "Access OpenAI's ChatGPT platform for conversational AI.", Icons.Outlined.SmartToy),
    SiteLink("Code Tantra", "https://rmd.codetantra.com/", "Platform for classes, assignments, and assessments.", Icons.Outlined.IntegrationInstructions)
)

@Composable
fun CollegeSitesScreen(
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background),
        contentPadding = PaddingValues(bottom = 100.dp)
    ) {
        // Header
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 20.dp, end = 20.dp, top = 48.dp, bottom = 16.dp),
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
                    Icon(Icons.Default.ChevronLeft, "Back", tint = colors.textPrimary, modifier = Modifier.size(20.dp))
                }
                
                Spacer(modifier = Modifier.width(16.dp))
                
                Column {
                    Text(
                        "Important Sites",
                        style = HomeTypography.PageTitle.copy(fontSize = 28.sp),
                        color = colors.textPrimary,
                        fontWeight = FontWeight.ExtraBold
                    )
                    Text(
                        "Quick access to resources",
                        style = HomeTypography.FacultyName,
                        color = colors.textSecondary,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Links List
        items(links) { link ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .shadow(
                        elevation = 2.dp,
                        shape = HomeShapes.Item,
                        spotColor = colors.textSecondary.copy(alpha = 0.1f)
                    )
                    .clickable {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(link.url))
                        context.startActivity(intent)
                    },
                shape = HomeShapes.Item,
                colors = CardDefaults.cardColors(containerColor = colors.surface),
                border = CardDefaults.outlinedCardBorder().copy(
                    width = 1.dp,
                    brush = androidx.compose.ui.graphics.SolidColor(colors.glassBorder)
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Circular Icon Container (48dp like React Native)
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(CircleShape)
                            .background(colors.accent.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(link.icon, null, tint = colors.accent, modifier = Modifier.size(24.dp))
                    }
                    
                    Spacer(modifier = Modifier.width(16.dp))
                    
                    // Content
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            link.name,
                            style = HomeTypography.PillTitle,
                            color = colors.textPrimary,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            link.description,
                            style = HomeTypography.FacultyName,
                            color = colors.textSecondary,
                            maxLines = 2
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(8.dp))
                    
                    Icon(Icons.Default.ArrowForward, null, tint = colors.textSecondary, modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}

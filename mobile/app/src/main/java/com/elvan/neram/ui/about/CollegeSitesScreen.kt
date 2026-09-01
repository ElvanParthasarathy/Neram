package com.elvan.neram.ui.about

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
import com.elvan.neram.ui.components.shell.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.home.*

// Important Links Data
private data class SiteLink(
    val name: String,
    val url: String,
    val description: String,
    val icon: ImageVector
)

private val links = listOf(
    SiteLink("RMD College Website", "https://rmd.ac.in/", "Official RMD college website.", Icons.Outlined.Business),

    SiteLink("RMK Nextgen Student", "https://nextgenstudent.rmd.ac.in/", "Nextgen platform for student login and academic tracking.", Icons.Outlined.Person),
    SiteLink("Elvan Navil", "https://elvannavil.vercel.app/", "Campus news, articles, and student announcements platform.", Icons.Outlined.Article),
    SiteLink("IamNeo", "https://rmk685.examly.io/login", "Learning, assessment, and recruitment solutions.", Icons.Outlined.Code),
    SiteLink("Skill Rack", "https://www.skillrack.com/faces/ui/profile.xhtml", "Daily coding challenges and problem-solving tasks.", Icons.Outlined.Terminal),

    SiteLink("Code Tantra", "https://rmd.codetantra.com/", "Platform for classes, assignments, and assessments.", Icons.Outlined.IntegrationInstructions)
)

@Composable
fun CollegeSitesScreen(
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
            }

            // Links List
            items(links, key = { it.url }) { link ->
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Item)
                            .background(colors.surface)
                            .clickable { com.elvan.neram.utils.IntentUtils.openUrl(context, link.url) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Circular Icon Container
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
}

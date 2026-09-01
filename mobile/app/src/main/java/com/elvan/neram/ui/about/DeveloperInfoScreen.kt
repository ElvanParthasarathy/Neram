package com.elvan.neram.ui.about

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.theme.AppColors
import androidx.compose.ui.res.vectorResource
import com.elvan.neram.R
import com.elvan.neram.ui.components.shell.LocalElvanScrollState

@Composable
fun DeveloperInfoScreen(
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current

    androidx.compose.foundation.lazy.LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
            item(key = "spacer_top") {
                Spacer(Modifier.height(com.elvan.neram.ui.components.shell.LocalElvanTopSpacerHeight.current))
            }

            item(key = "hero_card") {
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(HomeShapes.Card)
                            .background(
                                brush = Brush.verticalGradient(
                                    colors = listOf(
                                        colors.accent.copy(alpha = 0.8f),
                                        colors.accent.copy(alpha = 0.4f)
                                    )
                                )
                            )
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Text(
                                "Hello, I'm",
                                style = HomeTypography.PillTime,
                                color = Color.White
                            )
                            
                            Spacer(modifier = Modifier.height(4.dp))
                            
                            Text(
                                text = "Elvan Parthasarathy",
                                style = HomeTypography.PageTitle.copy(fontSize = 28.sp, fontWeight = FontWeight.Bold),
                                color = Color.White,
                                modifier = Modifier.padding(bottom = 8.dp)
                            )

                            Text(
                                text = "Vibe Coder | Prompt Engineer",
                                style = HomeTypography.MessageBody.copy(fontSize = 16.sp),
                                color = Color.White.copy(alpha = 0.8f),
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(bottom = 24.dp)
                            )
                            
                            Button(
                                onClick = { com.elvan.neram.utils.IntentUtils.openUrl(context, "https://jaiprakashpartha.vercel.app/") },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = colors.accent,
                                    contentColor = Color.White
                                ),
                                shape = HomeShapes.Pill,
                                modifier = Modifier.height(48.dp)
                            ) {
                                Text("Visit Portfolio", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            item(key = "contact_info") {
                com.elvan.neram.ui.components.shell.ElvanSectionContainer {
                    Column {
                        Text(
                            "Contact Info",
                            style = HomeTypography.SectionTitle,
                            color = colors.textPrimary,
                            modifier = Modifier.padding(bottom = 12.dp, start = 8.dp)
                        )
                        
                        ContactItem(
                            icon = Icons.Default.Phone,
                            label = "+91 93451 28797",
                            color = AppColors.GitHub,
                            onClick = {
                                try {
                                     val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:+919345128797"))
                                     intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                     context.startActivity(intent)
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                }
                            }
                        )
                        ContactItem(
                            icon = Icons.Default.Email,
                            label = "jaiprakashpartha@gmail.com",
                            color = AppColors.Instagram,
                            onClick = {
                                try {
                                    val intent = Intent(Intent.ACTION_SENDTO).apply {
                                        data = Uri.parse("mailto:jaiprakashpartha@gmail.com")
                                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                    }
                                    context.startActivity(intent)
                                } catch (e: Exception) {
                                    e.printStackTrace()
                                }
                            }
                        )
                        ContactItem(
                            icon = ImageVector.vectorResource(id = R.drawable.ic_linkedin),
                            label = "linkedin.com/in/jaiprakashpartha",
                            color = AppColors.LinkedIn,
                            iconTint = Color.Unspecified,
                            onClick = { com.elvan.neram.utils.IntentUtils.openUrl(context, "https://www.linkedin.com/in/jaiprakashpartha") }
                        )
                        ContactItem(
                            icon = ImageVector.vectorResource(id = R.drawable.ic_github),
                            label = "github.com/elvanparthasarathy",
                            color = colors.textPrimary,
                            onClick = { com.elvan.neram.utils.IntentUtils.openUrl(context, "https://github.com/elvanparthasarathy") }
                        )
                        ContactItem(
                            icon = Icons.Default.LocationOn,
                            label = "Arani, Tamil Nadu - 632317",
                            subLabel = "(Currently in Chennai)",
                            color = AppColors.YouTube,
                            onClick = {}
                        )
                    }
                }
            }
        }
}

@Composable
private fun ContactItem(
    icon: ImageVector,
    label: String,
    subLabel: String? = null,
    color: Color,
    iconTint: Color = color, // Default to using the theme color
    onClick: () -> Unit
) {
    val colors = rememberHomeColors()
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp)
            .clip(HomeShapes.Item)
            .background(colors.surface)
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(color.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = iconTint, modifier = Modifier.size(20.dp))
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                label,
                style = HomeTypography.PillTitle,
                color = colors.textPrimary,
                fontWeight = FontWeight.SemiBold
            )
            if (subLabel != null) {
                Text(
                    subLabel,
                    style = HomeTypography.PillTime,
                    color = colors.textSecondary
                )
            }
        }
        
        Icon(
            Icons.Default.ChevronRight,
            null,
            tint = colors.textSecondary.copy(alpha = 0.5f),
            modifier = Modifier.size(20.dp)
        )
    }
}

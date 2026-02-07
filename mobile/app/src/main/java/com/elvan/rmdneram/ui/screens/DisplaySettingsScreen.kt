package com.elvan.rmdneram.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.*
import com.elvan.rmdneram.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DisplaySettingsScreen(
    currentTheme: String,
    onThemeChange: (String) -> Unit,
    onBack: () -> Unit
) {
    val colors = rememberHomeColors()
    val scrollBehavior = TopAppBarDefaults.exitUntilCollapsedScrollBehavior()
    
    // One UI Card Color
    val cardColor = colors.surface

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        containerColor = colors.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Display",
                        style = HomeTypography.PageTitle.copy(fontSize = 28.sp),
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                },
                navigationIcon = {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier.padding(top = 8.dp)
                    ) {
                         Icon(
                             Icons.Default.ChevronLeft, 
                             "Back", 
                             tint = MaterialTheme.colorScheme.onSurface,
                             modifier = Modifier.size(32.dp)
                         )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = colors.background,
                    scrolledContainerColor = colors.background,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                ),
                scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // 1. Light / Dark / Auto Mode Selector Card
            // 1. Light / Dark Mode Selector Card (Auto moved below)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(HomeShapes.Item)
                    .background(cardColor)
                    .padding(24.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    // Light Mode Option
                    ThemeSelectionItem(
                        label = "Light",
                        isSelected = currentTheme == "light",
                        backgroundBrush = Brush.linearGradient(listOf(Color(0xFFF2F2F2), Color(0xFFE0E0E0))),
                        accent = AppColors.Blue, // Blue accent
                        textColor = colors.textPrimary,
                        onClick = { onThemeChange("light") } // Switching to light disables auto
                    )

                    // Dark Mode Option
                    ThemeSelectionItem(
                        label = "Dark",
                        isSelected = currentTheme == "dark",
                        backgroundBrush = Brush.linearGradient(listOf(Color(0xFF1C1C1C), Color.Black)),
                        accent = AppColors.Blue,
                        textColor = colors.textPrimary,
                        onClick = { onThemeChange("dark") } // Switching to dark disables auto
                    )
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Divider(color = colors.glassBorder, thickness = 1.dp)
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // System Auto Toggle
                Row(
                   modifier = Modifier
                       .fillMaxWidth()
                       .clickable { 
                           if (currentTheme != "auto") onThemeChange("auto") else onThemeChange("light") // Toggle logic
                       },
                   verticalAlignment = Alignment.CenterVertically,
                   horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("System Auto", style = MaterialTheme.typography.bodyLarge, color = colors.textPrimary)
                        Text("Switch modes with system", style = MaterialTheme.typography.bodySmall, color = colors.textSecondary)
                    }
                    Switch(
                        checked = currentTheme == "auto",
                        onCheckedChange = { isChecked ->
                             if (isChecked) onThemeChange("auto") else onThemeChange("light") // Default to light if turning auto off
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White, 
                            checkedTrackColor = AppColors.Blue
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun ThemeSelectionItem(
    label: String,
    isSelected: Boolean,
    backgroundBrush: Brush,
    accent: Color,
    textColor: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable { onClick() }
    ) {
        // Preview Box (Phone screen lookalike)
        Box(
            modifier = Modifier
                .width(85.dp) // Slightly narrower to fit 3 items
                .height(80.dp) 
                .clip(RoundedCornerShape(12.dp))
                .background(backgroundBrush)
                .border(
                    width = if (isSelected) 2.dp else 0.dp, 
                    color = if (isSelected) accent else Color.Transparent,
                    shape = RoundedCornerShape(12.dp)
                )
        ) {
            // Mock UI elements inside
            Column(modifier = Modifier.padding(12.dp)) {
                Box(modifier = Modifier.width(30.dp).height(8.dp).clip(RoundedCornerShape(4.dp)).background(accent))
                Spacer(modifier = Modifier.height(8.dp))
                Box(modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color.Gray.copy(alpha=0.5f)))
                Spacer(modifier = Modifier.height(4.dp))
                Box(modifier = Modifier.fillMaxWidth(0.7f).height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color.Gray.copy(alpha=0.5f)))
            }
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        Text(
            text = label, 
            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = if(isSelected) FontWeight.Bold else FontWeight.Normal),
            color = if (isSelected) accent else textColor
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        // Radio Circle
        Icon(
             if (isSelected) Icons.Filled.CheckCircle else Icons.Outlined.Circle,
             contentDescription = null,
             tint = if (isSelected) accent else Color.Gray,
             modifier = Modifier.size(20.dp)
        )
    }
}

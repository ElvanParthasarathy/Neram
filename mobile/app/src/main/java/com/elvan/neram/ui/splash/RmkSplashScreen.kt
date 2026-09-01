package com.elvan.neram.ui.splash

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.R

/**
 * Backup of the original RMK Group of Institutions Splash Screen.
 * Unwired and kept for historical reference.
 */
@Composable
fun RmkSplashScreen(isDarkTheme: Boolean = false) {
    val backgroundColor = if (isDarkTheme) Color(0xFF0A0A0A) else Color(0xFFFAFAFA)
    val shapeColor = if (isDarkTheme) Color.White.copy(alpha = 0.03f) else Color(0xFFE8F0FE)
    val textPrimary = if (isDarkTheme) Color.White else Color(0xFF1A1A1A)
    val textSecondary = if (isDarkTheme) Color.White.copy(alpha = 0.6f) else Color(0xFF666666)
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(backgroundColor)
    ) {
        // Floating background shapes
        Box(
            modifier = Modifier
                .size(200.dp)
                .offset(x = (-50).dp, y = 100.dp)
                .background(shapeColor, shape = CircleShape)
        )
        Box(
            modifier = Modifier
                .size(150.dp)
                .align(Alignment.TopEnd)
                .offset(x = 30.dp, y = (-30).dp)
                .background(shapeColor, shape = CircleShape)
        )
        Box(
            modifier = Modifier
                .size(100.dp)
                .align(Alignment.BottomEnd)
                .offset(x = 20.dp, y = 50.dp)
                .background(shapeColor, shape = CircleShape)
        )
        
        // Centered Content: Text & Logo
        Column(
            modifier = Modifier.align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Image(
                painter = painterResource(id = R.drawable.ic_splash_logo),
                contentDescription = "Neram Logo",
                modifier = Modifier.size(180.dp),
                colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(textPrimary)
            )
        }
        
        // Footer: RMK Group of Institutions
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "RMK",
                style = MaterialTheme.typography.headlineSmall.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = textSecondary,
                    letterSpacing = 3.sp
                )
            )
            
            Spacer(modifier = Modifier.height(2.dp))
            
            Text(
                text = "Group of Institutions",
                style = MaterialTheme.typography.labelSmall.copy(
                    letterSpacing = 1.5.sp,
                    color = textSecondary.copy(alpha = 0.6f),
                    fontWeight = FontWeight.Normal
                )
            )
        }
    }
}

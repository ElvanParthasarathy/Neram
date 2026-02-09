package com.elvan.rmdneram.ui.auth

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.R
import kotlinx.coroutines.delay

@Composable
fun WelcomeScreen(
    onContinue: () -> Unit
) {
    // Staggered reveal states
    var showLogo by remember { mutableStateOf(false) }
    var showTitle by remember { mutableStateOf(false) }
    var showSubtitle by remember { mutableStateOf(false) }
    var showButton by remember { mutableStateOf(false) }

    // Staggered entrance animation
    LaunchedEffect(Unit) {
        delay(300)
        showLogo = true
        delay(500)
        showTitle = true
        delay(300)
        showSubtitle = true
        delay(400)
        showButton = true
    }

    // Floating animation for logo
    val infiniteTransition = rememberInfiniteTransition(label = "logo_float")
    val logoOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 12f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float_offset"
    )
    
    // Pulsing glow for logo
    val logoScale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logo_pulse"
    )

    AuthGradientBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 32.dp)
                .statusBarsPadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.weight(1f))

            // ===== ANIMATED LOGO =====
            AnimatedVisibility(
                visible = showLogo,
                enter = fadeIn(animationSpec = tween(800)) + 
                        scaleIn(initialScale = 0.3f, animationSpec = tween(800, easing = EaseOutBack))
            ) {
                Box(
                    modifier = Modifier
                        .size(200.dp)
                        .graphicsLayer {
                            translationY = -logoOffset
                            scaleX = logoScale
                            scaleY = logoScale
                        },
                    contentAlignment = Alignment.Center
                ) {
                    // Glow effect behind logo
                    Box(
                        modifier = Modifier
                            .size(180.dp)
                            .graphicsLayer {
                                alpha = 0.3f
                                scaleX = 1.3f
                                scaleY = 1.3f
                            }
                    )
                    
                    Image(
                        painter = painterResource(id = R.drawable.ic_splash_logo),
                        contentDescription = "Neram Logo",
                        modifier = Modifier.size(180.dp),
                        colorFilter = androidx.compose.ui.graphics.ColorFilter.tint(AuthColors.textPrimary())
                    )
                }
            }

            Spacer(modifier = Modifier.height(48.dp))

            AnimatedVisibility(
                visible = showTitle,
                enter = fadeIn(animationSpec = tween(600)) + 
                        slideInVertically(initialOffsetY = { 30 }, animationSpec = tween(600))
            ) {
                Text(
                    text = "Welcome to Neram",
                    style = MaterialTheme.typography.displaySmall.copy(
                        fontWeight = FontWeight.ExtraBold,
                        color = AuthColors.textPrimary()
                    ),
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            AnimatedVisibility(
                visible = showSubtitle,
                enter = fadeIn(animationSpec = tween(600)) + 
                        slideInVertically(initialOffsetY = { 20 }, animationSpec = tween(600))
            ) {
                Text(
                    text = "Your College Time, Sorted.",
                    style = MaterialTheme.typography.titleMedium.copy(
                        color = AuthColors.textSecondary(),
                        fontWeight = FontWeight.Medium
                    ),
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            // ===== BOTTOM SECTION =====
            AnimatedVisibility(
                visible = showButton,
                enter = fadeIn(animationSpec = tween(600)) + 
                        slideInVertically(initialOffsetY = { 50 }, animationSpec = tween(600))
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Tap \"Agree and Continue\" to get started with Neram.",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = AuthColors.textMuted(),
                            fontSize = 11.sp,
                            lineHeight = 16.sp
                        ),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(bottom = 20.dp, start = 16.dp, end = 16.dp)
                    )

                    AnimatedAuthButton(
                        text = "Agree and Continue",
                        onClick = onContinue
                    )
                    
                    Spacer(modifier = Modifier.height(40.dp))
                }
            }
        }
    }
}


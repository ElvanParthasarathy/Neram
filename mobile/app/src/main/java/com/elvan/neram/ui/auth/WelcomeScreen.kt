package com.elvan.neram.ui.auth

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
import com.elvan.neram.R
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppLanguage
import kotlinx.coroutines.delay

@Composable
fun WelcomeScreen(
    onContinue: () -> Unit
) {
    val lang = LocalAppLanguage.current
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

    // Continuous floating/pulse animation for logo
    val infiniteTransition = rememberInfiniteTransition(label = "logo_float")
    
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -8f,
        targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float_offset"
    )

    val logoPulse by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logo_pulse"
    )

    AuthBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .statusBarsPadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.weight(1f))

            // ===== LOGO ANIMATION =====
            AnimatedVisibility(
                visible = showLogo,
                enter = scaleIn(
                    initialScale = 0.5f,
                    animationSpec = spring(
                        dampingRatio = Spring.DampingRatioMediumBouncy,
                        stiffness = Spring.StiffnessLow
                    )
                ) + fadeIn(animationSpec = tween(500))
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .offset(y = floatOffset.dp)
                        .scale(logoPulse)
                ) {
                    // Outer glow/pulse ring
                    Box(
                        modifier = Modifier
                            .size(200.dp)
                            .graphicsLayer {
                                alpha = 0.3f
                                scaleX = 1.3f
                                scaleY = 1.3f
                            }
                    )
                    
                    Image(
                        painter = painterResource(id = R.drawable.ic_splash_logo),
                        contentDescription = null,
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
                    text = K.welcomeToNeram.tr(lang),
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
                    text = K.collegeTimeSorted.tr(lang),
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
                        text = K.tapAgreeAndContinue.tr(lang),
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = AuthColors.textMuted(),
                            fontSize = 11.sp,
                            lineHeight = 16.sp
                        ),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(bottom = 20.dp, start = 16.dp, end = 16.dp)
                    )

                    AnimatedAuthButton(
                        text = K.agreeAndContinue.tr(lang),
                        onClick = onContinue
                    )
                    
                    Spacer(modifier = Modifier.height(40.dp))
                }
            }
        }
    }
}


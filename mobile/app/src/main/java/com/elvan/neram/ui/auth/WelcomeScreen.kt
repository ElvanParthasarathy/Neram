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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.R
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import kotlinx.coroutines.delay

@Composable
fun WelcomeScreen(
    onContinue: () -> Unit,
    showBackground: Boolean = true
) {
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current

    // Continuous gentle floating/breathing animation for logo
    val infiniteTransition = rememberInfiniteTransition(label = "logo_float")
    
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = -3f,
        targetValue = 3f,
        animationSpec = infiniteRepeatable(
            animation = tween(4500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float_offset"
    )

    val logoPulse by infiniteTransition.animateFloat(
        initialValue = 0.985f,
        targetValue = 1.015f,
        animationSpec = infiniteRepeatable(
            animation = tween(5000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "logo_pulse"
    )

    val content = @Composable {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .statusBarsPadding()
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.weight(1f))

            // ===== LOGO (Flutter-style static layout + GPU animation) =====
            AuthAnimatedElement(delayIndex = 0) {
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
                                alpha = 0.25f
                                scaleX = 1.2f
                                scaleY = 1.2f
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

            Spacer(modifier = Modifier.height(24.dp))

            // ===== TITLE & SUBTITLE =====
            AuthAnimatedElement(delayIndex = 1) {
                StepHeader(
                    title = K.welcomeToNeram.tr(lang),
                    subtitle = K.collegeTimeSorted.tr(lang)
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            // ===== BOTTOM SECTION =====
            AuthAnimatedElement(delayIndex = 2, modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = K.tapAgreeAndContinue.tr(lang),
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 11.sp,
                            color = AuthColors.textMuted(),
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

    if (showBackground) {
        AuthBackground {
            content()
        }
    } else {
        Box(modifier = Modifier.fillMaxSize()) {
            content()
        }
    }
}


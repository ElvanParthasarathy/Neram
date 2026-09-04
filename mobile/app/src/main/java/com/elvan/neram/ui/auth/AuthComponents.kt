package com.elvan.neram.ui.auth

import android.content.ContextWrapper
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.core.view.WindowCompat
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.components.ExpressiveLoadingIndicator
import kotlin.math.sin

enum class AuthField {
    NONE,
    FIRST_NAME,
    LAST_NAME,
    NAME,
    REGISTER_NUMBER,
    EMAIL,
    PASSWORD,
    GENERAL
}

/**
 * Flutter-style individual element entrance animator.
 * Statically places elements in layout from frame 1 so spacers and siblings never jump
 * or reflow, preventing elements from sticking/hitching mid-animation while sliding up.
 * Renders purely on GPU layer with synchronized smooth EaseOutCubic fade and translation.
 */
@Composable
fun AuthAnimatedElement(
    delayIndex: Int = 0,
    baseDelayMs: Long = 80L,
    stepDelayMs: Long = 90L,
    durationMs: Int = 500,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    var isStarted by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        kotlinx.coroutines.delay(baseDelayMs + delayIndex * stepDelayMs)
        isStarted = true
    }

    val alpha by animateFloatAsState(
        targetValue = if (isStarted) 1f else 0f,
        animationSpec = tween(durationMillis = durationMs, easing = EaseOutCubic),
        label = "auth_elem_alpha"
    )

    val translationY by animateDpAsState(
        targetValue = if (isStarted) 0.dp else 20.dp,
        animationSpec = tween(durationMillis = durationMs, easing = EaseOutCubic),
        label = "auth_elem_transY"
    )

    Box(
        modifier = modifier.graphicsLayer {
            this.alpha = alpha
            this.translationY = translationY.toPx()
        }
    ) {
        content()
    }
}

// ============== THEME-AWARE COLORS ==============
object AuthColors {
    // Accent colors (same for both themes)
    val NeramBlue = Color(0xFF0072DE)
    val NeramBlueLight = Color(0xFF4DA3FF)
    
    // Theme colors will be computed at runtime
    @Composable
    fun background() = if (isSystemInDarkTheme()) Color(0xFF0A0A0A) else Color(0xFFF5F6F8)
    
    @Composable
    fun surface() = if (isSystemInDarkTheme()) Color(0xFF1A1A1A) else Color.White
    
    @Composable
    fun inputBackground() = if (isSystemInDarkTheme()) Color(0xFF1E1E1E) else Color.White
    
    @Composable
    fun textPrimary() = if (isSystemInDarkTheme()) Color.White else Color(0xFF1A1A1A)
    
    @Composable
    fun textSecondary() = if (isSystemInDarkTheme()) Color.White.copy(alpha = 0.6f) else Color(0xFF666666)
    
    @Composable
    fun textMuted() = if (isSystemInDarkTheme()) Color.White.copy(alpha = 0.4f) else Color(0xFF999999)
    
    @Composable
    fun divider() = if (isSystemInDarkTheme()) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
    
    @Composable  
    fun shapeColor() = if (isSystemInDarkTheme()) Color.White.copy(alpha = 0.03f) else Color(0xFFEAEAEA) // Flutter-matching neutral warm gray in light
}

// ============== ANIMATED BACKGROUND WITH MATERIAL 3 SHAPES ==============
@Composable
fun AuthBackground(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) = AuthGradientBackground(modifier = modifier, content = content)

@Composable
fun AuthGradientBackground(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
    val context = LocalContext.current
    val isDark = isSystemInDarkTheme()
    val activity = com.elvan.neram.LocalMainActivity.current
        ?: (context as? ComponentActivity)
        ?: ((context as? ContextWrapper)?.baseContext as? ComponentActivity)

    DisposableEffect(isDark, activity) {
        activity?.enableEdgeToEdge(
            statusBarStyle = if (isDark) {
                SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
            } else {
                SystemBarStyle.light(
                    android.graphics.Color.TRANSPARENT,
                    android.graphics.Color.TRANSPARENT
                )
            },
            navigationBarStyle = if (isDark) {
                SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
            } else {
                SystemBarStyle.light(
                    android.graphics.Color.TRANSPARENT,
                    android.graphics.Color.TRANSPARENT
                )
            }
        )
        val window = activity?.window
        if (window != null) {
            window.statusBarColor = android.graphics.Color.TRANSPARENT
            window.navigationBarColor = android.graphics.Color.TRANSPARENT
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                window.isNavigationBarContrastEnforced = false
                window.isStatusBarContrastEnforced = false
            }
            com.elvan.neram.updateSystemBarsAppearance(window, isDark)
        }
        onDispose { }
    }

    val backgroundColor = AuthColors.background()
    val shapeColor = AuthColors.shapeColor()
    
    val infiniteTransition = rememberInfiniteTransition(label = "shapes_anim")
    
    // Rotation for shapes
    val rotation1 by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(60000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation1"
    )
    
    val rotation2 by infiniteTransition.animateFloat(
        initialValue = 360f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(80000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation2"
    )
    
    // Floating motion
    val floatOffset by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 30f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "float"
    )
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(backgroundColor)
            .drawBehind {
                // Large rounded square (top right)
                rotate(rotation1, pivot = Offset(size.width * 0.85f, size.height * 0.15f)) {
                    drawRoundRect(
                        color = shapeColor,
                        topLeft = Offset(size.width * 0.65f, size.height * 0.02f + floatOffset),
                        size = Size(size.width * 0.5f, size.width * 0.5f),
                        cornerRadius = CornerRadius(80f, 80f)
                    )
                }
                
                // Circle (bottom left)
                drawCircle(
                    color = shapeColor,
                    radius = size.width * 0.35f,
                    center = Offset(
                        size.width * 0.1f,
                        size.height * 0.85f - floatOffset * 0.5f
                    )
                )
                
                // Pill shape (middle left)
                rotate(rotation2 * 0.3f, pivot = Offset(size.width * 0.2f, size.height * 0.4f)) {
                    drawRoundRect(
                        color = shapeColor,
                        topLeft = Offset(-size.width * 0.1f, size.height * 0.35f),
                        size = Size(size.width * 0.4f, size.width * 0.15f),
                        cornerRadius = CornerRadius(100f, 100f)
                    )
                }
                
                // Small diamond (bottom right)
                rotate(rotation1 * 0.5f, pivot = Offset(size.width * 0.9f, size.height * 0.7f)) {
                    drawRoundRect(
                        color = shapeColor,
                        topLeft = Offset(size.width * 0.8f, size.height * 0.6f + floatOffset * 0.3f),
                        size = Size(size.width * 0.2f, size.width * 0.2f),
                        cornerRadius = CornerRadius(30f, 30f)
                    )
                }
            },
        content = content
    )
}

// ============== ANIMATED AUTH BUTTON ==============
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnimatedAuthButton(
    text: String,
    onClick: () -> Unit,
    isLoading: Boolean = false,
    enabled: Boolean = true,
    flat: Boolean = true,
    animateScale: Boolean = false,
    shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(50),
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    // Dark ripple in both light and dark mode for high visibility and tactile feedback on blue surface
    val blueRippleColor = Color.Black.copy(alpha = 0.35f)

    CompositionLocalProvider(
        androidx.compose.foundation.LocalIndication provides androidx.compose.material3.ripple(color = blueRippleColor, bounded = true),
        androidx.compose.material3.LocalRippleConfiguration provides androidx.compose.material3.RippleConfiguration(color = blueRippleColor)
    ) {
        Button(
            onClick = onClick,
            enabled = enabled && !isLoading,
            shape = shape,
            colors = ButtonDefaults.buttonColors(
                containerColor = AuthColors.NeramBlue,
                contentColor = Color.White,
                disabledContainerColor = AuthColors.NeramBlue.copy(alpha = 0.4f),
                disabledContentColor = Color.White.copy(alpha = 0.6f)
            ),
            interactionSource = interactionSource,
            modifier = modifier
                .fillMaxWidth()
                .height(56.dp),
            elevation = ButtonDefaults.buttonElevation(
                defaultElevation = 0.dp,
                pressedElevation = 0.dp,
                focusedElevation = 0.dp,
                hoveredElevation = 0.dp,
                disabledElevation = 0.dp
            )
        ) {
        if (isLoading) {
            ExpressiveLoadingIndicator(
                modifier = Modifier.size(24.dp),
                color = Color.White
            )
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontFamily = LocalAppFontFamily.current,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    letterSpacing = 0.5.sp
                )
            )
        }
    }
}
}

// ============== PILL TEXT FIELD (FILLED STYLE, NO OUTLINE) ==============
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuthTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    leadingIcon: ImageVector? = null,
    isPassword: Boolean = false,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    isError: Boolean = false,
    errorMessage: String? = null
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()
    val isDark = isSystemInDarkTheme()
    
    var passwordVisible by remember { mutableStateOf(false) }
    
    val textPrimary = AuthColors.textPrimary()
    val textSecondary = AuthColors.textSecondary()
    val inputBg = AuthColors.inputBackground()
    val lang = LocalAppLanguage.current
    val fieldShape = RoundedCornerShape(50)

    val shadowElevation by animateDpAsState(
        targetValue = if (isFocused) 6.dp else 3.dp,
        animationSpec = tween(200),
        label = "auth_field_shadow_elevation"
    )
    val shadowAlpha by animateFloatAsState(
        targetValue = if (isFocused) 0.28f else 0.18f,
        animationSpec = tween(200),
        label = "auth_field_shadow_alpha"
    )

    val containerColor by animateColorAsState(
        targetValue = if (isFocused) {
            if (isDark) Color(0xFF262626) else Color.White
        } else {
            inputBg
        },
        animationSpec = tween(200),
        label = "auth_field_bg"
    )

    Column(modifier = modifier) {
        TextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(label, color = textSecondary) },
            leadingIcon = if (leadingIcon != null) {
                { 
                    Icon(
                        leadingIcon, 
                        contentDescription = null, 
                        tint = if (isFocused) AuthColors.NeramBlue else textSecondary
                    ) 
                }
            } else null,
            trailingIcon = if (isPassword) {
                {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                            contentDescription = if (passwordVisible) K.hidePassword.tr(lang) else K.showPassword.tr(lang),
                            tint = if (isFocused) AuthColors.NeramBlue else textSecondary
                        )
                    }
                }
            } else null,
            visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
            shape = fieldShape,
            colors = TextFieldDefaults.colors(
                focusedTextColor = textPrimary,
                unfocusedTextColor = textPrimary,
                focusedContainerColor = containerColor,
                unfocusedContainerColor = containerColor,
                cursorColor = AuthColors.NeramBlue,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                focusedPlaceholderColor = textSecondary,
                unfocusedPlaceholderColor = textSecondary,
                errorContainerColor = containerColor,
                errorIndicatorColor = Color.Transparent
            ),
            modifier = Modifier
                .fillMaxWidth()
                .then(
                    if (isDark) Modifier
                    else Modifier.shadow(
                        elevation = shadowElevation,
                        shape = fieldShape,
                        clip = false,
                        ambientColor = Color.Black.copy(alpha = shadowAlpha),
                        spotColor = Color.Black.copy(alpha = shadowAlpha)
                    )
                ),
            singleLine = true,
            keyboardOptions = keyboardOptions,
            keyboardActions = keyboardActions,
            isError = isError,
            interactionSource = interactionSource
        )
        
        if (isError && errorMessage != null) {
            Text(
                text = errorMessage,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(start = 16.dp, top = 4.dp)
            )
        }
    }
}

// ============== PREMIUM HEADER ==============
@Composable
fun StepHeader(
    title: String, 
    subtitle: String
) {
    val ff = LocalAppFontFamily.current
    val textPrimary = AuthColors.textPrimary()
    val textSecondary = AuthColors.textSecondary()
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = title,
            style = TextStyle(
                fontFamily = ff,
                fontSize = 26.sp,
                fontWeight = FontWeight.Bold,
                color = textPrimary,
                lineHeight = 32.sp
            ),
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(6.dp))
        
        Text(
            text = subtitle,
            style = TextStyle(
                fontFamily = ff,
                fontSize = 14.sp,
                color = textSecondary,
                lineHeight = 20.sp
            ),
            textAlign = TextAlign.Center
        )
    }
}

// ============== GOOGLE BUTTON (FILLED STYLE, NO SCALE, FLAT RIPPLE) ==============
@Composable
fun GoogleAuthButton(
    text: String? = null,
    onClick: () -> Unit,
    isLoading: Boolean = false,
    shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(50),
    modifier: Modifier = Modifier
) {
    val lang = LocalAppLanguage.current
    val displayText = text ?: K.continueWithGoogle.tr(lang)
    val interactionSource = remember { MutableInteractionSource() }
    val isDark = isSystemInDarkTheme()
    
    val textPrimary = AuthColors.textPrimary()
    val inputBg = AuthColors.inputBackground()

    Button(
        onClick = onClick,
        enabled = !isLoading,
        shape = shape,
        colors = ButtonDefaults.buttonColors(
            containerColor = inputBg,
            contentColor = textPrimary
        ),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 0.dp,
            pressedElevation = 0.dp,
            focusedElevation = 0.dp,
            hoveredElevation = 0.dp,
            disabledElevation = 0.dp
        ),
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .then(
                if (isDark) Modifier
                else Modifier.shadow(
                    elevation = 3.dp,
                    shape = shape,
                    clip = false,
                    ambientColor = Color.Black.copy(alpha = 0.18f),
                    spotColor = Color.Black.copy(alpha = 0.20f)
                )
            ),
        interactionSource = interactionSource
    ) {
        if (isLoading) {
            ExpressiveLoadingIndicator(
                modifier = Modifier.size(24.dp),
                color = AuthColors.NeramBlue
            )
        } else {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Google "G"
                Text(
                    "G",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold
                    ),
                    color = Color(0xFFDB4437), // Google Red
                    modifier = Modifier.padding(end = 12.dp)
                )
                Text(
                    text = displayText,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontFamily = LocalAppFontFamily.current,
                        fontWeight = FontWeight.Medium,
                        fontSize = 16.sp
                    )
                )
            }
        }
    }
}

// ============== DIVIDER WITH TEXT ==============
@Composable
fun OrDivider(modifier: Modifier = Modifier) {
    val lang = LocalAppLanguage.current
    val dividerColor = AuthColors.divider()
    val textMuted = AuthColors.textMuted()
    
    Row(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 28.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            thickness = 0.5.dp,
            color = dividerColor
        )
        Text(
            text = K.orDivider.tr(lang),
            style = MaterialTheme.typography.bodySmall.copy(
                fontFamily = LocalAppFontFamily.current,
                fontSize = 12.sp
            ),
            color = textMuted,
            modifier = Modifier.padding(horizontal = 14.dp)
        )
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            thickness = 0.5.dp,
            color = dividerColor
        )
    }
}

// ============== AUTH LINK TEXT (for "Don't have an account?") ==============
@Composable
fun AuthLinkText(
    prefix: String,
    linkText: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val textSecondary = AuthColors.textSecondary()
    val ff = LocalAppFontFamily.current
    
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = prefix,
            color = textSecondary,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontFamily = ff
            )
        )
        Text(
            text = linkText,
            color = AuthColors.NeramBlue,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontFamily = ff,
                fontWeight = FontWeight.Bold
            ),
            modifier = Modifier
                .clip(RoundedCornerShape(4.dp))
                .clickable(onClick = onClick)
                .padding(horizontal = 4.dp, vertical = 2.dp)
        )
    }
}

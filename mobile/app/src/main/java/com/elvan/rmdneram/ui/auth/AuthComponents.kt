package com.elvan.rmdneram.ui.auth

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.components.ExpressiveLoadingIndicator
import kotlin.math.sin

// ============== THEME-AWARE COLORS ==============
object AuthColors {
    // Accent colors (same for both themes)
    val NeramBlue = Color(0xFF007AFF)
    val NeramBlueLight = Color(0xFF4DA3FF)
    
    // Theme colors will be computed at runtime
    @Composable
    fun background() = if (isSystemInDarkTheme()) Color(0xFF0A0A0A) else Color(0xFFFAFAFA)
    
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
    fun divider() = if (isSystemInDarkTheme()) Color.White.copy(alpha = 0.1f) else Color(0xFFE0E0E0)
    
    @Composable  
    fun shapeColor() = if (isSystemInDarkTheme()) Color.White.copy(alpha = 0.03f) else Color(0xFFE8F0FE) // Very subtle blue tint in light
}

// ============== ANIMATED BACKGROUND WITH MATERIAL 3 SHAPES ==============
@Composable
fun AuthGradientBackground(
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit
) {
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
@Composable
fun AnimatedAuthButton(
    text: String,
    onClick: () -> Unit,
    isLoading: Boolean = false,
    enabled: Boolean = true,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessHigh),
        label = "button_scale"
    )

    Button(
        onClick = onClick,
        enabled = enabled && !isLoading,
        shape = RoundedCornerShape(50),
        colors = ButtonDefaults.buttonColors(
            containerColor = AuthColors.NeramBlue,
            contentColor = Color.White,
            disabledContainerColor = AuthColors.NeramBlue.copy(alpha = 0.4f),
            disabledContentColor = Color.White.copy(alpha = 0.6f)
        ),
        interactionSource = interactionSource,
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .scale(scale),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 4.dp,
            pressedElevation = 1.dp,
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
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    letterSpacing = 0.5.sp
                )
            )
        }
    }
}

// ============== PILL TEXT FIELD (FILLED STYLE) ==============
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
    
    var passwordVisible by remember { mutableStateOf(false) }
    
    val textPrimary = AuthColors.textPrimary()
    val textSecondary = AuthColors.textSecondary()
    val inputBg = AuthColors.inputBackground()
    
    // Animate background on focus
    val backgroundColor by animateColorAsState(
        targetValue = if (isFocused) inputBg else inputBg,
        animationSpec = tween(200),
        label = "bg_color"
    )

    Column(modifier = modifier) {
        TextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(label, color = textSecondary) },
            leadingIcon = if (leadingIcon != null) {
                { Icon(leadingIcon, contentDescription = null, tint = AuthColors.NeramBlue) }
            } else null,
            trailingIcon = if (isPassword) {
                {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Filled.VisibilityOff else Icons.Filled.Visibility,
                            contentDescription = if (passwordVisible) "Hide password" else "Show password",
                            tint = textSecondary
                        )
                    }
                }
            } else null,
            visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
            shape = RoundedCornerShape(50), // PILL SHAPE
            colors = TextFieldDefaults.colors(
                focusedTextColor = textPrimary,
                unfocusedTextColor = textPrimary,
                focusedContainerColor = inputBg,
                unfocusedContainerColor = inputBg,
                cursorColor = AuthColors.NeramBlue,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
                focusedPlaceholderColor = textSecondary,
                unfocusedPlaceholderColor = textSecondary,
                errorContainerColor = inputBg,
                errorIndicatorColor = Color.Transparent
            ),
            modifier = Modifier
                .fillMaxWidth()
                .shadow(
                    elevation = if (isSystemInDarkTheme()) 0.dp else 8.dp,
                    shape = RoundedCornerShape(50),
                    ambientColor = Color.Black.copy(alpha = 0.25f),
                    spotColor = Color.Black.copy(alpha = 0.25f)
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
    val textPrimary = AuthColors.textPrimary()
    val textSecondary = AuthColors.textSecondary()
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.headlineLarge.copy(
                fontWeight = FontWeight.Bold
            ),
            color = textPrimary,
            textAlign = TextAlign.Center
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyLarge,
            color = textSecondary,
            textAlign = TextAlign.Center
        )
    }
}

// ============== GOOGLE BUTTON (FILLED STYLE) ==============
@Composable
fun GoogleAuthButton(
    text: String = "Continue with Google",
    onClick: () -> Unit,
    isLoading: Boolean = false,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessHigh),
        label = "google_scale"
    )
    
    val textPrimary = AuthColors.textPrimary()
    val inputBg = AuthColors.inputBackground()

    Button(
        onClick = onClick,
        enabled = !isLoading,
        shape = RoundedCornerShape(50),
        colors = ButtonDefaults.buttonColors(
            containerColor = inputBg,
            contentColor = textPrimary
        ),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = 0.dp,
            pressedElevation = 0.dp
        ),
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .shadow(
                elevation = if (isSystemInDarkTheme()) 0.dp else 8.dp,
                shape = RoundedCornerShape(50),
                ambientColor = Color.Black.copy(alpha = 0.25f),
                spotColor = Color.Black.copy(alpha = 0.25f)
            )
            .scale(scale),
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
                    text = text,
                    style = MaterialTheme.typography.titleMedium.copy(
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
    val dividerColor = AuthColors.divider()
    val textMuted = AuthColors.textMuted()
    
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        HorizontalDivider(
            modifier = Modifier.weight(1f),
            color = dividerColor
        )
        Text(
            " OR ",
            style = MaterialTheme.typography.bodySmall,
            color = textMuted,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        HorizontalDivider(
            modifier = Modifier.weight(1f),
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
    
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = prefix,
            color = textSecondary,
            style = MaterialTheme.typography.bodyMedium
        )
        Text(
            text = linkText,
            color = AuthColors.NeramBlue,
            style = MaterialTheme.typography.bodyMedium.copy(
                fontWeight = FontWeight.Bold
            ),
            modifier = Modifier
                .clip(RoundedCornerShape(4.dp))
                .clickable(onClick = onClick)
                .padding(horizontal = 4.dp, vertical = 2.dp)
        )
    }
}

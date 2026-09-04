package com.elvan.neram.ui.onboarding

import androidx.compose.animation.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.rounded.Language
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.auth.AnimatedAuthButton
import com.elvan.neram.ui.auth.AuthAnimatedElement
import com.elvan.neram.ui.auth.AuthBackground
import com.elvan.neram.ui.auth.AuthColors
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

private data class LanguageOption(
    val code: String,
    val title: String,
    val subtitleKey: String?
)

private val languageOptions = listOf(
    LanguageOption(K.SYSTEM, "", null),
    LanguageOption(K.TAMIL, "தமிழ்", K.tamil),
    LanguageOption(K.TAMIL_LATIN, "Thamizh", K.tamilLatin),
    LanguageOption(K.TAMIL_MALAYALAM, "തമിഴ്", K.tamilMalayalam),
    LanguageOption(K.MALAYALAM, "മലയാളം", K.malayalam),
    LanguageOption(K.MALAYALAM_LATIN, "Malayalam", K.malayalamLatin),
    LanguageOption(K.MALAYALAM_TAMIL, "மலயாளம்", K.malayalamTamil),
    LanguageOption(K.TELUGU, "తెలుగు", K.telugu),
    LanguageOption(K.TELUGU_LATIN, "Telugu", K.teluguLatin),
    LanguageOption(K.ENGLISH, "English", K.english)
)

/**
 * Dedicated Language Selection Screen displayed after login.
 * Matches Elvan Niril's focused, calm, and responsive card design.
 */
@Composable
fun LanguageSelectionScreen(
    currentLanguage: String = K.SYSTEM,
    onLanguageConfirmed: (String) -> Unit,
    showBackground: Boolean = true
) {
    val context = LocalContext.current
    var selectedLanguage by remember {
        mutableStateOf(if (currentLanguage.isBlank()) K.SYSTEM else currentLanguage)
    }

    val previewLang = remember(selectedLanguage) {
        K.getEffectiveLanguage(selectedLanguage, context)
    }

    val content = @Composable {
        val ff = LocalAppFontFamily.current

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(horizontal = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(32.dp))

            // 1. Sleek Globe Icon - Monochrome & Prominent (Industry standard)
            AuthAnimatedElement(delayIndex = 0) {
                Icon(
                    imageVector = Icons.Rounded.Language,
                    contentDescription = null,
                    modifier = Modifier.size(56.dp),
                    tint = AuthColors.textPrimary()
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 2. Title and Subtitle with Live Preview ("Language" header - Big & Balanced)
            AuthAnimatedElement(delayIndex = 1) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = K.language.tr(previewLang),
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Bold,
                            color = AuthColors.textPrimary(),
                            lineHeight = 32.sp
                        ),
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = K.selectPreferredLanguage.tr(previewLang),
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 14.sp,
                            color = AuthColors.textSecondary(),
                            lineHeight = 20.sp
                        ),
                        textAlign = TextAlign.Center
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 3. Flat Grouped Box with internal scroll, auto-hiding scrollbar & top/bottom fade masks
            val scrollState = rememberSaveable(saver = ScrollState.Saver) { ScrollState(0) }
            val isDark = isSystemInDarkTheme()
            val cardBg = AuthColors.inputBackground()
            val dividerColor = if (isDark) Color.White.copy(alpha = 0.055f) else Color.Black.copy(alpha = 0.055f)
            val scrollbarColor = AuthColors.textPrimary().copy(alpha = 0.35f)

            // Auto-hide scrollbar: only visible while actively dragging/scrolling, strictly hidden in rest state
            val isScrolling = scrollState.isScrollInProgress
            val scrollbarAlpha by animateFloatAsState(
                targetValue = if (isScrolling) 1f else 0f,
                animationSpec = tween(durationMillis = 200),
                label = "scrollbarAlpha"
            )

            // Subtle top and bottom fade masks matching Home in ElvanShell
            val canScrollUp = scrollState.value > 0
            val topFadeAlpha by animateFloatAsState(
                targetValue = if (canScrollUp) 1f else 0f,
                animationSpec = tween(durationMillis = 200),
                label = "topFadeAlpha"
            )
            val canScrollDown = scrollState.value < scrollState.maxValue
            val bottomFadeAlpha by animateFloatAsState(
                targetValue = if (canScrollDown) 1f else 0f,
                animationSpec = tween(durationMillis = 200),
                label = "bottomFadeAlpha"
            )

            val cardShape = RoundedCornerShape(24.dp)
            AuthAnimatedElement(
                delayIndex = 2,
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
            ) {
                Surface(
                    shape = cardShape,
                    color = cardBg,
                    contentColor = AuthColors.textPrimary(),
                    tonalElevation = 0.dp,
                    shadowElevation = 0.dp,
                    modifier = Modifier
                        .fillMaxSize()
                        .then(
                            if (isDark) Modifier
                            else Modifier.shadow(
                                elevation = 6.dp,
                                shape = cardShape,
                                clip = false,
                                ambientColor = Color.Black.copy(alpha = 0.18f),
                                spotColor = Color.Black.copy(alpha = 0.20f)
                            )
                        )
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .drawVerticalScrollbar(
                                    scrollState = scrollState,
                                    alpha = scrollbarAlpha,
                                    color = scrollbarColor
                                )
                                .verticalScroll(scrollState)
                                .padding(vertical = 4.dp)
                        ) {
                            languageOptions.forEachIndexed { index, option ->
                                val isSelected = selectedLanguage == option.code
                                val title = if (option.code == K.SYSTEM) {
                                    K.deviceLanguage.tr(previewLang)
                                } else {
                                    option.title
                                }
                                val subtitle = option.subtitleKey?.let { key ->
                                    key.tr(previewLang)
                                }

                                LanguageTileRow(
                                    title = title,
                                    subtitle = subtitle,
                                    isSelected = isSelected,
                                    onClick = {
                                        selectedLanguage = option.code
                                    }
                                )

                                if (index < languageOptions.size - 1) {
                                    HorizontalDivider(
                                        color = dividerColor,
                                        thickness = 0.5.dp,
                                        modifier = Modifier.padding(horizontal = 18.dp)
                                    )
                                }
                            }
                        }

                        // Top Subtle Fade Mask (exact 4-stop gradient from Home ElvanShell)
                        if (topFadeAlpha > 0.01f) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopCenter)
                                    .fillMaxWidth()
                                    .height(26.dp)
                                    .graphicsLayer { alpha = topFadeAlpha }
                                    .background(
                                        Brush.verticalGradient(
                                            0.0f to cardBg,
                                            0.35f to cardBg.copy(alpha = 0.55f),
                                            0.7f to cardBg.copy(alpha = 0.16f),
                                            1.0f to Color.Transparent
                                        )
                                    )
                            )
                        }

                        // Bottom Subtle Fade Mask (exact 4-stop gradient from Home ElvanShell)
                        if (bottomFadeAlpha > 0.01f) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                                    .fillMaxWidth()
                                    .height(26.dp)
                                    .graphicsLayer { alpha = bottomFadeAlpha }
                                    .background(
                                        Brush.verticalGradient(
                                            0.0f to Color.Transparent,
                                            0.3f to cardBg.copy(alpha = 0.16f),
                                            0.65f to cardBg.copy(alpha = 0.55f),
                                            1.0f to cardBg
                                        )
                                    )
                            )
                        }
                    }
                }
            }

            // 4. Subtle Micro-Hint outside card & 5. Continue Action Button
            val hasMoreBelow = scrollState.maxValue > 0 && scrollState.value < scrollState.maxValue - 16
            val hintAlpha by animateFloatAsState(
                targetValue = if (hasMoreBelow && scrollState.value < 20) 1f else 0f,
                animationSpec = tween(durationMillis = 250),
                label = "hintAlpha"
            )
            val coroutineScope = rememberCoroutineScope()

            AuthAnimatedElement(
                delayIndex = 3,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Spacer(modifier = Modifier.height(6.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        if (hintAlpha > 0.01f) {
                            Row(
                                modifier = Modifier
                                    .graphicsLayer { alpha = hintAlpha }
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null
                                    ) {
                                        coroutineScope.launch {
                                            scrollState.animateScrollTo(scrollState.maxValue)
                                        }
                                    },
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.KeyboardArrowDown,
                                    contentDescription = null,
                                    tint = AuthColors.textSecondary().copy(alpha = 0.5f),
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = K.moreLanguagesBelow.tr(previewLang),
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Normal,
                                        color = AuthColors.textSecondary().copy(alpha = 0.5f)
                                    )
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    AnimatedAuthButton(
                        text = K.continueAction.tr(previewLang),
                        onClick = {
                            onLanguageConfirmed(selectedLanguage)
                        },
                        flat = true,
                        animateScale = false
                    )

                    Spacer(modifier = Modifier.height(20.dp))
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

@Composable
private fun LanguageTileRow(
    title: String,
    subtitle: String?,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val ff = LocalAppFontFamily.current
    val isDark = isSystemInDarkTheme()
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = ripple(
                    bounded = true,
                    color = if (isDark) Color.White else Color.Black
                ),
                onClick = onClick
            )
            .padding(horizontal = 18.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = title,
                style = TextStyle(
                    fontFamily = ff,
                    fontSize = 16.sp,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    lineHeight = 21.sp
                ),
                color = if (isSelected) AuthColors.textPrimary() else AuthColors.textPrimary().copy(alpha = 0.75f)
            )
            if (!subtitle.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Normal,
                        lineHeight = 16.sp
                    ),
                    color = AuthColors.textSecondary()
                )
            }
        }

        if (isSelected) {
            Icon(
                imageVector = Icons.Filled.CheckCircle,
                contentDescription = null,
                tint = AuthColors.textPrimary(),
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

/**
 * Clean, subtle vertical scrollbar indicator drawn along the right edge of a scrollable container.
 * Smoothly fades in when scrolling and strictly hidden in rest state.
 */
private fun Modifier.drawVerticalScrollbar(
    scrollState: androidx.compose.foundation.ScrollState,
    alpha: Float,
    color: Color,
    width: Dp = 3.dp
): Modifier = drawWithContent {
    drawContent()
    if (scrollState.maxValue > 0 && alpha > 0.05f) {
        val viewHeight = size.height
        val totalHeight = scrollState.maxValue.toFloat() + viewHeight
        val thumbHeight = ((viewHeight / totalHeight) * viewHeight).coerceAtLeast(20.dp.toPx())
        val scrollProgress = scrollState.value.toFloat() / scrollState.maxValue.toFloat()
        val scrollOffset = scrollProgress * (viewHeight - thumbHeight)
        drawRoundRect(
            color = color.copy(alpha = color.alpha * alpha),
            topLeft = Offset(size.width - width.toPx() - 3.dp.toPx(), scrollOffset),
            size = Size(width.toPx(), thumbHeight),
            cornerRadius = CornerRadius(width.toPx() / 2, width.toPx() / 2)
        )
    }
}

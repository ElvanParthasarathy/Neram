package com.elvan.neram.ui.navigation

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.cssShadow
import com.elvan.neram.ui.home.rememberHomeColors
import com.elvan.neram.ui.theme.AppStrings
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.floor
import kotlin.math.roundToInt

@Composable
fun BottomNavBar(
    selectedTab: NavTab?,
    onTabSelected: (NavTab, Boolean) -> Unit,
    onInteraction: (Boolean) -> Unit = {},
    onDragProgress: (Float) -> Unit = {},
    hideContent: Boolean = false,
    modifier: Modifier = Modifier
) {
    val colors = rememberHomeColors()
    val tabs = NavTab.entries
    val lang = LocalAppLanguage.current
    val coroutineScope = rememberCoroutineScope()

    val itemCount = tabs.size
    // Exact Flutter dimensions from elvan_kizh_pattai.dart
    val layoutWidth = if (itemCount <= 4) 67.dp else 61.dp
    val bgWidth = if (itemCount <= 4) 75.dp else 69.dp
    val horizontalPadding = 8.dp
    val verticalPadding = 4.dp
    val totalWidth = (layoutWidth * itemCount) + (horizontalPadding * 2)

    var isInteracting by remember { mutableStateOf(false) }
    var dragOffsetPx by remember { mutableStateOf<Float?>(null) }
    var touchOffsetFromCenterPx by remember { mutableStateOf(0f) }
    var hoverIndex by remember { mutableStateOf<Int?>(null) }
    var localLockedIndex by remember { mutableStateOf<Int?>(null) }
    var snapNextFrame by remember { mutableStateOf(false) }

    val density = LocalDensity.current
    val layoutWidthPx = with(density) { layoutWidth.toPx() }
    val bgWidthPx = with(density) { bgWidth.toPx() }

    val currentOnTabSelected by rememberUpdatedState(onTabSelected)
    val currentOnInteraction by rememberUpdatedState(onInteraction)
    val currentOnDragProgress by rememberUpdatedState(onDragProgress)

    val actualIndex = tabs.indexOf(selectedTab).coerceAtLeast(0)
    LaunchedEffect(actualIndex) {
        localLockedIndex = null
        snapNextFrame = true
    }
    // Clear snapNextFrame after one composition (mirrors Flutter's addPostFrameCallback)
    LaunchedEffect(snapNextFrame) {
        if (snapNextFrame) {
            kotlinx.coroutines.yield()
            snapNextFrame = false
        }
    }

    // Flutter: (_isInteracting && _hoverIndex != null) ? _hoverIndex! : (_localLockedIndex ?? widget.currentIndex)
    val activeVisualIndex = if (isInteracting && hoverIndex != null) {
        hoverIndex!!
    } else {
        localLockedIndex ?: actualIndex
    }

    // Flutter: AnimatedScale(scale: _isInteracting ? 1.02 : 1.0, duration: 150ms, curve: easeOutCubic)
    val containerScale by animateFloatAsState(
        targetValue = if (isInteracting) 1.02f else 1.0f,
        animationSpec = tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)),
        label = "containerScale"
    )

    // Flutter: AnimatedScale(scale: _isInteracting ? 1.30 : 1.0, duration: 150ms, curve: easeOutCubic)
    val pillScale by animateFloatAsState(
        targetValue = if (isInteracting) 1.30f else 1.0f,
        animationSpec = tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)),
        label = "pillScale"
    )

    // Flutter: hideContent AnimatedOpacity
    val contentAlpha by animateFloatAsState(
        targetValue = if (hideContent) 0f else 1f,
        animationSpec = tween(150),
        label = "contentAlpha"
    )

    // Calculate pill left offset in pixels — exact Flutter math
    val overlapPx = (bgWidthPx - layoutWidthPx) / 2f
    val maxLeftPx = ((itemCount - 1) * layoutWidthPx) - overlapPx
    val minLeftPx = -overlapPx

    val targetLeftPx = if (isInteracting && dragOffsetPx != null) {
        (dragOffsetPx!! - (bgWidthPx / 2f)).coerceIn(minLeftPx, maxLeftPx)
    } else {
        ((activeVisualIndex * layoutWidthPx) - overlapPx).coerceIn(minLeftPx, maxLeftPx)
    }

    // Flutter: AnimatedPositioned duration logic
    val animatedLeftPx by animateFloatAsState(
        targetValue = targetLeftPx,
        animationSpec = if (snapNextFrame || (isInteracting && dragOffsetPx != null)) {
            snap()
        } else {
            tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f))
        },
        label = "pillX"
    )

    // Flutter: isDark from Theme.of(context).brightness
    val isDark = colors.background == Color.Black || colors.background.red < 0.2f

    // ── Outer container: AnimatedScale wrapping ElvanKizhPattaiBase ──
    Box(
        modifier = modifier
            .windowInsetsPadding(WindowInsets.navigationBars)
            .padding(bottom = 16.dp)
            .graphicsLayer {
                scaleX = containerScale
                scaleY = containerScale
                clip = false
            }
            .height(60.dp)
            .width(totalWidth),
        contentAlignment = Alignment.Center
    ) {
        // ── Layer 1: Background Capsule & Border (Drawn FIRST, beneath content) ──
        // This ensures the outer capsule border is rendered UNDER the selection pill,
        // exactly like Flutter's BoxDecoration, so the border never cuts across the pill!
        Box(
            modifier = Modifier
                .matchParentSize()
                .cssShadow(color = Color.Black, alpha = 0.05f, blurRadius = 16.dp, offsetY = 4.dp)
                .background(
                    color = if (isDark) Color(0xFF1E1E1E).copy(alpha = 0.88f)
                            else Color(0xFFFFFFFF).copy(alpha = 0.88f),
                    shape = CircleShape
                )
                .border(
                    width = 0.5.dp,
                    color = if (isDark) Color(0xFF333333).copy(alpha = 0.15f)
                            else Color(0xFFFFFFFF).copy(alpha = 0.6f),
                    shape = CircleShape
                )
        )

        // ── Layer 2: Foreground Content (Drawn SECOND, on top of the border) ──
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = horizontalPadding, vertical = verticalPadding)
                .pointerInput(Unit) {
                    awaitEachGesture {
                        val down = awaitFirstDown(requireUnconsumed = false)
                        isInteracting = true
                        currentOnInteraction(true)

                        val initialX = down.position.x
                        hoverIndex = floor(initialX / layoutWidthPx).toInt().coerceIn(0, itemCount - 1)
                        val slotCenter = (hoverIndex!! * layoutWidthPx) + (layoutWidthPx / 2f)
                        touchOffsetFromCenterPx = initialX - slotCenter
                        dragOffsetPx = null

                        var isDrag = false
                        val pointerId = down.id

                        while (true) {
                            val event = awaitPointerEvent()
                            val change = event.changes.firstOrNull { it.id == pointerId } ?: break
                            if (!change.pressed) {
                                break
                            }
                            val currentPos = change.position
                            if (kotlin.math.abs(currentPos.x - down.position.x) > 4f) {
                                isDrag = true
                                val targetCenter = currentPos.x - touchOffsetFromCenterPx
                                dragOffsetPx = targetCenter
                                hoverIndex = floor(targetCenter / layoutWidthPx).toInt().coerceIn(0, itemCount - 1)
                                currentOnDragProgress(targetCenter / layoutWidthPx)
                                change.consume()
                            }
                        }

                        val finalIndex = hoverIndex
                        if (finalIndex != null) {
                            localLockedIndex = finalIndex
                        }
                        isInteracting = false
                        currentOnInteraction(false)
                        dragOffsetPx = null
                        hoverIndex = null

                        if (finalIndex != null) {
                            coroutineScope.launch {
                                delay(150)
                                currentOnTabSelected(tabs[finalIndex], isDrag)
                            }
                        }
                    }
                },
            contentAlignment = Alignment.CenterStart
        ) {
            Box(
                modifier = Modifier
                    .graphicsLayer {
                        alpha = contentAlpha
                        clip = false
                    }
                    .width(layoutWidth * itemCount)
                    .fillMaxHeight()
            ) {
                // ── Master Background Pill (Detached & Draggable) ──
                // Renders ON TOP of Layer 1's border!
                Box(
                    modifier = Modifier
                        .offset { IntOffset(animatedLeftPx.roundToInt(), 0) }
                        .fillMaxHeight()
                        .width(bgWidth)
                        .graphicsLayer {
                            scaleX = pillScale
                            scaleY = pillScale
                            transformOrigin = TransformOrigin.Center
                            clip = false
                        }
                        .then(
                            if (!isDark) Modifier.cssShadow(color = Color.Black, alpha = 0.04f, blurRadius = 4.dp, offsetY = 1.dp) else Modifier
                        )
                        .background(
                            color = if (isDark) Color(0xFF333333)
                                    else Color(0xFFE5E5E5),
                            shape = CircleShape
                        )
                )

                // ── Foreground Content ──
                Row(
                    modifier = Modifier.fillMaxSize(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    tabs.forEachIndexed { index, tab ->
                        val isActive = index == activeVisualIndex
                        val color = if (isActive) {
                            if (isDark) Color.White else Color(0xFF1A1A1A)
                        } else {
                            if (isDark) Color(0xFF9E9E9E) else Color(0xFF7C7C80)
                        }

                        Column(
                            modifier = Modifier
                                .fillMaxHeight()
                                .width(layoutWidth),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = if (isActive) tab.activeIcon else tab.icon,
                                contentDescription = tab.getLocalizedLabel(lang),
                                tint = color,
                                modifier = Modifier.size(23.dp)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = tab.getLocalizedLabel(lang),
                            color = color,
                            fontSize = 9.5.sp,
                            fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal,
                            fontFamily = LocalAppFontFamily.current,
                            maxLines = 1,
                            lineHeight = 11.sp
                        )
                    }
                }
            }
        }
    }
}
}

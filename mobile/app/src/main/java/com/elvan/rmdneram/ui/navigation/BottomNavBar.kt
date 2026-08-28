package com.elvan.rmdneram.ui.navigation

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.elvan.rmdneram.ui.theme.AppStrings
import com.elvan.rmdneram.ui.theme.LocalAppFontFamily
import com.elvan.rmdneram.ui.theme.LocalAppLanguage
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
    // Flutter: itemCount <= 4 ? 67.0 : 61.0
    val layoutWidth = if (itemCount <= 4) 67.dp else 61.dp
    // Flutter: itemCount <= 4 ? 75.0 : 69.0
    val bgWidth = if (itemCount <= 4) 75.dp else 69.dp
    // Flutter: ElvanKizhPattaiBase defaults
    val horizontalPadding = 8.dp
    val verticalPadding = 4.dp

    var isInteracting by remember { mutableStateOf(false) }
    var dragOffsetPx by remember { mutableStateOf<Float?>(null) }
    var touchOffsetFromCenterPx by remember { mutableStateOf(0f) }
    var hoverIndex by remember { mutableStateOf<Int?>(null) }
    var localLockedIndex by remember { mutableStateOf<Int?>(null) }
    // Flutter: _snapNextFrame — instant snap on external tab change to prevent animation replay
    var snapNextFrame by remember { mutableStateOf(false) }

    val density = LocalDensity.current
    val layoutWidthPx = with(density) { layoutWidth.toPx() }
    val bgWidthPx = with(density) { bgWidth.toPx() }

    // Sync external state changes (mirrors Flutter didUpdateWidget)
    val actualIndex = tabs.indexOf(selectedTab).coerceAtLeast(0)
    LaunchedEffect(actualIndex) {
        localLockedIndex = null
        // Flutter: _snapNextFrame = true, then post-frame callback sets it false
        snapNextFrame = true
    }
    // Clear snapNextFrame after one composition (mirrors Flutter's addPostFrameCallback)
    LaunchedEffect(snapNextFrame) {
        if (snapNextFrame) {
            // Yield one frame so the snap() animationSpec takes effect, then switch back
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

    // Flutter: if (_isInteracting && _dragOffset != null) free-float else snap to slot center
    val targetLeftPx = if (isInteracting && dragOffsetPx != null) {
        (dragOffsetPx!! - (bgWidthPx / 2f)).coerceIn(minLeftPx, maxLeftPx)
    } else {
        ((activeVisualIndex * layoutWidthPx) - overlapPx).coerceIn(minLeftPx, maxLeftPx)
    }

    // Flutter: AnimatedPositioned duration logic:
    //   _snapNextFrame || (_isInteracting && _dragOffset != null) → Duration.zero
    //   else → 150ms easeOutCubic
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
            .padding(bottom = 16.dp)
            .windowInsetsPadding(WindowInsets.navigationBars)
            // Flutter: AnimatedScale on the entire navbar
            .graphicsLayer {
                scaleX = containerScale
                scaleY = containerScale
                // Flutter: Stack(clipBehavior: Clip.none) — allow pill overflow
                clip = false
            }
            // Flutter: ElvanKizhPattaiBase — BoxShadow(blurRadius: 16, offset: Offset(0,4), alpha: 0.05)
            .shadow(
                elevation = 16.dp,
                shape = RoundedCornerShape(50),
                clip = false,
                ambientColor = Color.Black.copy(alpha = 0.05f),
                spotColor = Color.Black.copy(alpha = 0.05f)
            )
            // Flutter: ElvanKizhPattaiBase — color with 0.88 alpha
            .background(
                color = if (isDark) Color(0xFF1E1E1E).copy(alpha = 0.88f)
                        else Color(0xFFFFFFFF).copy(alpha = 0.88f),
                shape = RoundedCornerShape(50)
            )
            // Flutter: ElvanKizhPattaiBase — Border.all(width: 0.5)
            .border(
                width = 0.5.dp,
                color = if (isDark) Color(0xFF333333).copy(alpha = 0.15f)
                        else Color(0xFFFFFFFF).copy(alpha = 0.6f),
                shape = RoundedCornerShape(50)
            )
            // Flutter: Container(height: 60) — total outer height is 60dp
            .height(60.dp)
            // Flutter: Padding inside the 60dp container — content area = 52dp
            .padding(horizontal = horizontalPadding, vertical = verticalPadding)
            .pointerInput(Unit) {
                awaitPointerEventScope {
                    while (true) {
                        var event = awaitPointerEvent()
                        var down = event.changes.firstOrNull { it.pressed }
                        while (down == null) {
                            event = awaitPointerEvent()
                            down = event.changes.firstOrNull { it.pressed }
                        }

                        isInteracting = true
                        onInteraction(true)

                        val initialX = down.position.x
                        // Flutter: .floor().clamp(0, itemCount - 1)
                        hoverIndex = floor(initialX / layoutWidthPx).toInt().coerceIn(0, itemCount - 1)
                        val slotCenter = (hoverIndex!! * layoutWidthPx) + (layoutWidthPx / 2f)
                        // Flutter: _touchOffsetFromCenter = details.localPosition.dx - slotCenter
                        touchOffsetFromCenterPx = initialX - slotCenter
                        // Flutter: _dragOffset = null — prevents "wiggle" on initial touch
                        dragOffsetPx = null

                        var isDrag = false
                        // Flutter: Track if the first actual drag update has been received
                        var hasDragStarted = false

                        while (event.changes.any { it.pressed }) {
                            event = awaitPointerEvent()
                            val change = event.changes.firstOrNull() ?: break

                            val previousPos = change.previousPosition
                            val currentPos = change.position
                            if (currentPos.x != previousPos.x || currentPos.y != previousPos.y) {
                                if (!hasDragStarted) {
                                    // Flutter: first onHorizontalDragUpdate — start tracking
                                    hasDragStarted = true
                                }
                                isDrag = true
                                val currentX = currentPos.x
                                // Flutter: targetCenter = details.localPosition.dx - _touchOffsetFromCenter
                                val targetCenter = currentX - touchOffsetFromCenterPx
                                dragOffsetPx = targetCenter
                                // Flutter: .floor().clamp(0, itemCount - 1)
                                hoverIndex = floor(targetCenter / layoutWidthPx).toInt().coerceIn(0, itemCount - 1)
                                onDragProgress(targetCenter / layoutWidthPx)
                                change.consume()
                            }
                        }

                        // Flutter: onHorizontalDragEnd / onTapUp
                        val finalIndex = hoverIndex
                        if (finalIndex != null) {
                            localLockedIndex = finalIndex
                        }
                        isInteracting = false
                        onInteraction(false)
                        dragOffsetPx = null
                        hoverIndex = null

                        if (finalIndex != null) {
                            // Flutter: Future.delayed(Duration(milliseconds: 150), () => onTabSelected(index))
                            coroutineScope.launch {
                                delay(150)
                                onTabSelected(tabs[finalIndex], isDrag)
                            }
                        }
                    }
                }
            },
        // Flutter: Stack(clipBehavior: Clip.none) — allow 1.30x pill to overflow
        contentAlignment = Alignment.CenterStart
    ) {
        // Flutter: AnimatedOpacity(opacity: hideContent ? 0.0 : 1.0)
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
            // Flutter: AnimatedPositioned + AnimatedScale + Container with decoration
            Box(
                modifier = Modifier
                    .offset { IntOffset(animatedLeftPx.roundToInt(), 0) }
                    .fillMaxHeight()
                    .width(bgWidth)
                    .graphicsLayer {
                        scaleX = pillScale
                        scaleY = pillScale
                        // Flutter: clipBehavior: Clip.none — pill can overflow parent bounds
                        clip = false
                    }
                    // Flutter: light mode BoxShadow(blurRadius: 4, offset: Offset(0,1), alpha: 0.04)
                    .then(
                        if (!isDark) Modifier.shadow(
                            elevation = 4.dp,
                            shape = RoundedCornerShape(50),
                            ambientColor = Color.Black.copy(alpha = 0.04f),
                            spotColor = Color.Black.copy(alpha = 0.04f)
                        ) else Modifier
                    )
                    // Flutter: color: isDark ? Color(0xFF333333).withValues(alpha: 0.95) : Color(0xFFE5E5E5).withValues(alpha: 0.95)
                    .background(
                        color = if (isDark) Color(0xFF333333).copy(alpha = 0.95f)
                                else Color(0xFFE5E5E5).copy(alpha = 0.95f),
                        shape = RoundedCornerShape(50)
                    )
            )

            // ── Foreground Content ──
            // Flutter: Row with CrossAxisAlignment.stretch
            Row(
                modifier = Modifier.fillMaxSize(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                tabs.forEachIndexed { index, tab ->
                    val isActive = index == activeVisualIndex
                    // Flutter: isActive ? (isDark ? white : Color(0xFF1A1A1A)) : (isDark ? grey.shade500 : Color(0xFF7C7C80))
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
                        // Flutter: Icon(size: 23.0)
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.label,
                            tint = color,
                            modifier = Modifier.size(23.dp)
                        )
                        // Flutter: SizedBox(height: 2)
                        Spacer(modifier = Modifier.height(2.dp))
                        // Flutter: Text(fontSize: 9.5, fontWeight: isActive ? w600 : w400, height: 1.2)
                        Text(
                            text = when (tab) {
                                NavTab.Home -> AppStrings.Nav.home(lang)
                                NavTab.Schedule -> AppStrings.Nav.schedule(lang)
                                NavTab.Calendar -> AppStrings.Nav.calendar(lang)
                                NavTab.Notes -> AppStrings.Nav.notes(lang)
                            },
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

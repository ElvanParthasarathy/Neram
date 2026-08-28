package com.elvan.rmdneram.ui.components.shell

import androidx.compose.animation.*
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.gestures.animateScrollBy

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeTypography
import kotlin.math.roundToInt

@Composable
fun ElvanShell(
    scrollState: LazyListState,
    colors: HomeColors,
    showNavbar: Boolean = true,
    useNewDesign: Boolean = true,
    title: String,
    onBack: (() -> Unit)? = null,
    navbar: @Composable () -> Unit = {},
    actions: @Composable RowScope.() -> Unit = {},
    content: @Composable () -> Unit
) {
    var isNavbarVisible by remember { mutableStateOf(true) }

    // Constants for physics
    val expandedHeight = 240.dp
    val pillHeight = 50.dp
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val ceiling = statusBarHeight + 20.dp
    // Flutter exact math for Handoff:
    // maxExtent = 240.0
    // handoffHeight = ceiling + expandedButtonsBottom + kToolbarHeight = (statusBarHeight + 20) + 8 + 56 = statusBarHeight + 84
    // handoffShrinkOffset = maxExtent - handoffHeight = 240 - (statusBarHeight + 84) = 156 - statusBarHeight
    val handoffShrinkOffsetDp = 156.dp - statusBarHeight
    val density = LocalDensity.current
    val maxScrollPx = with(density) { handoffShrinkOffsetDp.toPx() }
    
    // We assume the first item in the LazyColumn is a Spacer of height 320.dp (or similar)
    val currentScrollOffset = if (scrollState.firstVisibleItemIndex == 0) {
        scrollState.firstVisibleItemScrollOffset.toFloat()
    } else {
        with(density) { expandedHeight.toPx() } // Scrolled past the spacer
    }

    // One UI Physics: Velocity-Based Header Snapping
    // When the user stops scrolling, if the header is halfway collapsed, snap it!
    val isScrollInProgress = scrollState.isScrollInProgress
    var lastScrollOffset by remember { mutableFloatStateOf(0f) }
    var lastScrollDelta by remember { mutableFloatStateOf(0f) }
    val coroutineScope = rememberCoroutineScope()
    
    // Track delta for velocity direction
    LaunchedEffect(currentScrollOffset) {
        if (isScrollInProgress) {
            val delta = currentScrollOffset - lastScrollOffset
            if (kotlin.math.abs(delta) > 1f) {
                lastScrollDelta = delta
            }
            lastScrollOffset = currentScrollOffset
        }
    }
    
    // When scrolling stops, check if we need to snap
    LaunchedEffect(isScrollInProgress) {
        if (!isScrollInProgress) {
            if (currentScrollOffset > 0f && currentScrollOffset < maxScrollPx) {
                // Determine target based on velocity
                val targetOffset = if (kotlin.math.abs(lastScrollDelta) > 1f) {
                    if (lastScrollDelta > 0) maxScrollPx else 0f
                } else {
                    if (currentScrollOffset > maxScrollPx / 2f) maxScrollPx else 0f
                }
                
                val distance = kotlin.math.abs(currentScrollOffset - targetOffset)
                // Adaptive duration: 250 to 450 ms
                val durationMs = (250f + (distance * 0.5f)).toInt().coerceIn(250, 450)
                
                coroutineScope.launch {
                    val scrollDistance = targetOffset - currentScrollOffset
                    scrollState.animateScrollBy(
                        value = scrollDistance,
                        animationSpec = tween(
                            durationMillis = durationMs,
                            easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f) // Soft, natural deceleration like a weak magnet
                        )
                    )
                }
            }
            lastScrollDelta = 0f
        }
    }
    
    val collapseProgress = if (useNewDesign) (currentScrollOffset / maxScrollPx).coerceIn(0f, 1f) else 1f

    val nestedScrollConnection = remember {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                val delta = available.y
                if (delta > 0f && !isNavbarVisible) {
                    isNavbarVisible = true
                } else if (delta < -2f && source == NestedScrollSource.SideEffect && isNavbarVisible) {
                    isNavbarVisible = false
                }
                return Offset.Zero
            }
            override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
                if (!isNavbarVisible) isNavbarVisible = true
                return Velocity.Zero
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .nestedScroll(nestedScrollConnection)
            .background(colors.background)
    ) {
        // Layer 1: Content
        content()

        if (useNewDesign) {
            // Layer 2: Top Fade Mask (Solid at top, fading down)
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .fillMaxWidth()
                    .height(96.dp)
                    .zIndex(10f)
                    .background(
                        Brush.verticalGradient(
                            0.0f to colors.background,
                            0.35f to colors.background.copy(alpha = 0.55f),
                            0.7f to colors.background.copy(alpha = 0.16f),
                            1.0f to Color.Transparent
                        )
                    )
            )
            
            // Layer 2.5: The Expanded Header scaling down
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .zIndex(100f) // Guarantee text stays above the fade mask
            ) {
                ElvanExpandedBar(
                    title = title,
                    colors = colors,
                    scrollOffsetPx = currentScrollOffset, // Pass raw px
                    maxScrollPx = maxScrollPx,
                    expandedHeight = expandedHeight,
                    hasLeadingWidget = onBack != null
                )
            }
            
            // Layer 3: ElvanCollapsedBar (Pill)
            ElvanCollapsedBar(
                scrollOffset = currentScrollOffset,
                collisionOffsetPx = maxScrollPx,
                colors = colors,
                expandedHeight = expandedHeight,
                title = if (useNewDesign) null else title,
                onBack = onBack,
                actions = actions
            )
        } else {
            // Legacy Flat Top Bar
            Surface(
                color = colors.background,
                modifier = Modifier.fillMaxWidth().align(Alignment.TopCenter)
            ) {
                Box(modifier = Modifier
                    .fillMaxWidth()
                    .windowInsetsPadding(WindowInsets.statusBars)
                    .height(64.dp)
                ) {
                    if (onBack != null) {
                        IconButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterStart).padding(start = 8.dp)) {
                            Icon(Icons.Filled.ChevronLeft, "Back", tint = colors.textPrimary)
                        }
                    }
                    Text(
                        text = title,
                        style = HomeTypography.SectionTitle.copy(fontSize = 18.sp, color = colors.textPrimary),
                        modifier = Modifier.align(Alignment.Center)
                    )
                    Row(
                        modifier = Modifier.align(Alignment.CenterEnd).padding(end = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        actions()
                    }
                }
            }
        }

        // Layer 4: Bottom Fade Mask and Navbar
        if (showNavbar) {
            val navBarsPadding = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
            
            // Fade mask is ALWAYS present when showNavbar is true, doesn't hide
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(96.dp + 60.dp + 16.dp + navBarsPadding)
                    .background(
                        Brush.verticalGradient(
                            0.0f to Color.Transparent,
                            0.3f to colors.background.copy(alpha = 0.16f),
                            0.65f to colors.background.copy(alpha = 0.55f),
                            1.0f to colors.background
                        )
                    )
            )
            
            AnimatedVisibility(
                visible = isNavbarVisible,
                enter = fadeIn(animationSpec = tween(280, easing = CubicBezierEasing(0.55f, 0.05f, 0.675f, 0.19f))),
                exit = fadeOut(animationSpec = tween(280, easing = CubicBezierEasing(0.215f, 0.61f, 0.355f, 1.0f))),
                modifier = Modifier.align(Alignment.BottomCenter)
            ) {
                navbar()
            }
        }
    }
}

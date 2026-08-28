package com.elvan.rmdneram.ui.components.shell

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.animateScrollBy
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.nestedscroll.NestedScrollConnection
import androidx.compose.ui.input.nestedscroll.NestedScrollSource
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Velocity
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeTypography
import kotlinx.coroutines.launch

@Composable
fun ElvanShell(
    scrollState: LazyListState,
    colors: HomeColors,
    showNavbar: Boolean = true,
    useNewDesign: Boolean = true,
    title: String = "",
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
    navbar: @Composable () -> Unit = {},
    content: @Composable () -> Unit
) {
    var isNavbarVisible by remember { mutableStateOf(true) }

    // Constants for physics
    val expandedHeight = 280.dp
    val pillHeight = 50.dp
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val ceiling = statusBarHeight + 20.dp
    val density = LocalDensity.current
    
    // Exact Flutter collision math:
    // collisionOffset = expandedHeight - (ceiling + pillHeight)
    val collisionOffsetDp = expandedHeight - (ceiling + pillHeight)
    val collisionOffsetPx = with(density) { collisionOffsetDp.toPx() }
    
    // Handoff threshold (when icons reach ceiling)
    val handoffShrinkOffsetDp = 196.dp - statusBarHeight
    val handoffShrinkOffsetPx = with(density) { handoffShrinkOffsetDp.toPx() }
    
    val currentScrollOffset = if (scrollState.firstVisibleItemIndex == 0) {
        scrollState.firstVisibleItemScrollOffset.toFloat()
    } else {
        with(density) { expandedHeight.toPx() }
    }

    // One UI Physics: Velocity-Based Header Snapping & Brick Wall State
    var isHeaderExpanded by remember { mutableStateOf(true) }
    val isScrollInProgress = scrollState.isScrollInProgress
    var lastScrollOffset by remember { mutableFloatStateOf(0f) }
    var lastScrollDelta by remember { mutableFloatStateOf(0f) }
    val coroutineScope = rememberCoroutineScope()
    
    // Track delta and header expansion boundary
    LaunchedEffect(currentScrollOffset) {
        if (isScrollInProgress) {
            val delta = currentScrollOffset - lastScrollOffset
            if (kotlin.math.abs(delta) > 1f) {
                lastScrollDelta = delta
            }
            lastScrollOffset = currentScrollOffset
        }
        if (currentScrollOffset >= handoffShrinkOffsetPx) {
            if (isHeaderExpanded) {
                isHeaderExpanded = false
            }
        }
    }
    
    // When scrolling stops, snap and restore visibility
    LaunchedEffect(isScrollInProgress) {
        if (!isScrollInProgress) {
            if (!isNavbarVisible) {
                isNavbarVisible = true
            }
            // Only snap if user was manually interacting within the header region
            if (isHeaderExpanded && currentScrollOffset > 0f && currentScrollOffset < handoffShrinkOffsetPx) {
                val targetOffset = if (kotlin.math.abs(lastScrollDelta) > 1f) {
                    if (lastScrollDelta > 0) handoffShrinkOffsetPx else 0f
                } else {
                    if (currentScrollOffset > handoffShrinkOffsetPx / 2f) handoffShrinkOffsetPx else 0f
                }
                
                val distance = kotlin.math.abs(currentScrollOffset - targetOffset)
                val durationMs = (250f + (distance * 0.5f)).toInt().coerceIn(250, 450)
                
                coroutineScope.launch {
                    val scrollDistance = targetOffset - currentScrollOffset
                    scrollState.animateScrollBy(
                        value = scrollDistance,
                        animationSpec = tween(
                            durationMillis = durationMs,
                            easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)
                        )
                    )
                    if (targetOffset >= handoffShrinkOffsetPx) {
                        isHeaderExpanded = false
                    }
                }
            }
            lastScrollDelta = 0f
        }
    }

    // True pill threshold: active only when the card has reached the pill
    val isTruePill = currentScrollOffset >= (collisionOffsetPx - with(density) { 4.dp.toPx() })

    // If we're not in true pill mode (naked state), force visibility to true
    LaunchedEffect(isTruePill) {
        if (!isTruePill && !isNavbarVisible) {
            isNavbarVisible = true
        }
    }

    val nestedScrollConnection = remember(isTruePill, isHeaderExpanded, handoffShrinkOffsetPx) {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                val delta = available.y

                // ── Brick Wall Physics (matching Flutter ElvanBrickWallPhysics) ──
                // When the header is collapsed (!isHeaderExpanded):
                // ONLY allow manual drag (UserInput) to pull down and expand the header.
                // Momentum flings (SideEffect) are intercepted and blocked at handoffShrinkOffsetPx!
                if (!isHeaderExpanded) {
                    if (source == NestedScrollSource.UserInput) {
                        if (delta > 0f && currentScrollOffset <= handoffShrinkOffsetPx) {
                            isHeaderExpanded = true
                        }
                    } else if (source == NestedScrollSource.SideEffect && delta > 0f) {
                        if (currentScrollOffset <= handoffShrinkOffsetPx) {
                            // Hit the brick wall: consume all momentum!
                            return Offset(0f, delta)
                        } else if (currentScrollOffset - delta < handoffShrinkOffsetPx) {
                            // Clamp to stop dead at the brick wall
                            val allowed = currentScrollOffset - handoffShrinkOffsetPx
                            val excess = delta - allowed
                            return Offset(0f, excess)
                        }
                    }
                }

                // ── Navbar hide/show logic ──
                if (delta > 2f && !isNavbarVisible) {
                    // Scrolling UP -> Show bars immediately!
                    isNavbarVisible = true
                } else if (delta < -2f && isNavbarVisible && isTruePill && source == NestedScrollSource.SideEffect) {
                    // Momentum fling DOWN -> Hide bars!
                    isNavbarVisible = false
                }
                return Offset.Zero
            }

            override suspend fun onPreFling(available: Velocity): Velocity {
                // If collapsed and fling is travelling upward towards the header, kill it at the brick wall!
                if (!isHeaderExpanded && available.y > 0f && currentScrollOffset <= handoffShrinkOffsetPx) {
                    return available
                }
                if (available.y < -300f && isNavbarVisible && isTruePill) {
                    // High-speed fling downwards -> Hide bars!
                    isNavbarVisible = false
                }
                return Velocity.Zero
            }

            override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
                if (!isNavbarVisible) isNavbarVisible = true
                return Velocity.Zero
            }
        }
    }

    val navOpacity by animateFloatAsState(
        targetValue = if (isNavbarVisible) 1.0f else 0.0f,
        animationSpec = tween(
            durationMillis = 280,
            easing = if (isNavbarVisible) 
                CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f) 
            else 
                CubicBezierEasing(0.4f, 0.0f, 1.0f, 1.0f)
        ),
        label = "navOpacity"
    )

    // Scroll disappear/fade is only enabled once the true pill has formed
    val effectiveNavOpacity = if (isTruePill) navOpacity else 1.0f

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
                    .zIndex(100f)
            ) {
                ElvanExpandedBar(
                    title = title,
                    colors = colors,
                    scrollOffsetPx = currentScrollOffset,
                    collisionOffsetPx = collisionOffsetPx,
                    expandedHeight = expandedHeight,
                    hasLeadingWidget = onBack != null
                )
            }
            
            // Layer 3: ElvanCollapsedBar (Pill) — Fades in only on card collision, and scroll fade operates only when in true pill mode
            ElvanCollapsedBar(
                scrollOffset = currentScrollOffset,
                collisionOffsetPx = collisionOffsetPx,
                colors = colors,
                expandedHeight = expandedHeight,
                title = if (useNewDesign) null else title,
                onBack = onBack,
                navOpacity = effectiveNavOpacity,
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
            
            // Fade mask is ALWAYS present when showNavbar is true
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(96.dp + 60.dp + 28.dp + navBarsPadding)
                    .background(
                        Brush.verticalGradient(
                            0.0f to Color.Transparent,
                            0.3f to colors.background.copy(alpha = 0.16f),
                            0.65f to colors.background.copy(alpha = 0.55f),
                            1.0f to colors.background
                        )
                    )
            )
            
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .graphicsLayer {
                        alpha = effectiveNavOpacity
                    }
            ) {
                navbar()
            }
        }
    }
}

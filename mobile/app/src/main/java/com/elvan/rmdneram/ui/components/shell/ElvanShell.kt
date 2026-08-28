package com.elvan.rmdneram.ui.components.shell

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.animateScrollBy
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyListState
import kotlinx.coroutines.flow.distinctUntilChanged
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
    isHeaderExpanded: Boolean? = null,
    onHeaderExpandedChange: ((Boolean) -> Unit)? = null,
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

    // One UI Physics: Brick Wall State & Reactive Scroll State
    var internalHeaderExpanded by remember { mutableStateOf(true) }
    val effectiveHeaderExpanded = isHeaderExpanded ?: internalHeaderExpanded
    fun setHeaderExpanded(expanded: Boolean) {
        if (isHeaderExpanded != null) {
            onHeaderExpandedChange?.invoke(expanded)
        } else {
            internalHeaderExpanded = expanded
        }
    }
    val currentScrollState by rememberUpdatedState(scrollState)
    val coroutineScope = rememberCoroutineScope()

    // Monitor boundary crossing without recomposing every pixel
    LaunchedEffect(scrollState, handoffShrinkOffsetPx) {
        snapshotFlow {
            scrollState.firstVisibleItemIndex > 0 || scrollState.firstVisibleItemScrollOffset >= handoffShrinkOffsetPx
        }.distinctUntilChanged().collect { isPastBoundary ->
            if (isPastBoundary && effectiveHeaderExpanded) {
                setHeaderExpanded(false)
            }
        }
    }

    // Snap only when user interaction in the header region finishes
    LaunchedEffect(scrollState, handoffShrinkOffsetPx) {
        snapshotFlow { scrollState.isScrollInProgress }.collect { inProgress ->
            if (!inProgress) {
                if (!isNavbarVisible) {
                    isNavbarVisible = true
                }
                if (effectiveHeaderExpanded && scrollState.firstVisibleItemIndex == 0) {
                    val offset = scrollState.firstVisibleItemScrollOffset.toFloat()
                    if (offset > 0f && offset < handoffShrinkOffsetPx) {
                        val targetOffset = if (offset > handoffShrinkOffsetPx / 2f) handoffShrinkOffsetPx else 0f
                        val distance = kotlin.math.abs(offset - targetOffset)
                        val durationMs = (200f + (distance * 0.4f)).toInt().coerceIn(200, 350)
                        
                        coroutineScope.launch {
                            scrollState.animateScrollBy(
                                value = targetOffset - offset,
                                animationSpec = tween(
                                    durationMillis = durationMs,
                                    easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)
                                )
                            )
                            if (targetOffset >= handoffShrinkOffsetPx) {
                                setHeaderExpanded(false)
                            }
                        }
                    }
                }
            }
        }
    }

    // Stable NestedScrollConnection — never reallocated during scroll or tab switch
    val nestedScrollConnection = remember {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                val delta = available.y
                val isItem0 = currentScrollState.firstVisibleItemIndex == 0
                val offset0 = if (isItem0) currentScrollState.firstVisibleItemScrollOffset.toFloat() else (handoffShrinkOffsetPx + 10000f)

                // ── Brick Wall Brake (zero-lag momentum intercept) ──
                if (!effectiveHeaderExpanded) {
                    if (source == NestedScrollSource.UserInput) {
                        // User finger manually pulling down at the wall releases the brake
                        if (delta > 0f && isItem0 && offset0 <= handoffShrinkOffsetPx + with(density) { 10.dp.toPx() }) {
                            setHeaderExpanded(true)
                        }
                    } else if (source == NestedScrollSource.SideEffect && delta > 0f) {
                        // Fast fling moving upward towards top
                        if (isItem0) {
                            if (offset0 <= handoffShrinkOffsetPx) {
                                // Exactly at or below wall: brake completely!
                                return Offset(0f, delta)
                            } else if (offset0 - delta < handoffShrinkOffsetPx) {
                                // Clamp to stop dead at the brick wall
                                val allowed = offset0 - handoffShrinkOffsetPx
                                val excess = delta - allowed
                                return Offset(0f, excess)
                            }
                        }
                    }
                }

                // ── Navbar hide/show logic ──
                if (delta > 2f && !isNavbarVisible) {
                    isNavbarVisible = true
                } else if (delta < -2f && isNavbarVisible && source == NestedScrollSource.SideEffect) {
                    val reachedPill = !isItem0 || offset0 >= (collisionOffsetPx - with(density) { 4.dp.toPx() })
                    if (reachedPill) {
                        isNavbarVisible = false
                    }
                }
                return Offset.Zero
            }

            override fun onPostScroll(
                consumed: Offset,
                available: Offset,
                source: NestedScrollSource
            ): Offset {
                // ── Samsung One UI Magnetic Catch-All ──
                // If a high-speed fling skips past the boundary, instantly pull it back to the collapsed threshold
                if (!effectiveHeaderExpanded && source == NestedScrollSource.SideEffect) {
                    if (currentScrollState.firstVisibleItemIndex == 0 && currentScrollState.firstVisibleItemScrollOffset < handoffShrinkOffsetPx) {
                        coroutineScope.launch {
                            currentScrollState.scrollToItem(0, handoffShrinkOffsetPx.toInt())
                        }
                    }
                }
                return Offset.Zero
            }

            override suspend fun onPreFling(available: Velocity): Velocity {
                val isItem0 = currentScrollState.firstVisibleItemIndex == 0
                val offset0 = if (isItem0) currentScrollState.firstVisibleItemScrollOffset.toFloat() else 10000f
                if (!effectiveHeaderExpanded && available.y > 0f && isItem0 && offset0 <= handoffShrinkOffsetPx) {
                    return available // Absorb remaining fling velocity at the wall
                }
                if (available.y < -300f && isNavbarVisible) {
                    val reachedPill = !isItem0 || offset0 >= (collisionOffsetPx - with(density) { 4.dp.toPx() })
                    if (reachedPill) {
                        isNavbarVisible = false
                    }
                }
                return Velocity.Zero
            }

            override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
                if (!isNavbarVisible) isNavbarVisible = true
                // Magnetic Lock at rest
                if (!effectiveHeaderExpanded && currentScrollState.firstVisibleItemIndex == 0 && currentScrollState.firstVisibleItemScrollOffset < handoffShrinkOffsetPx) {
                    currentScrollState.scrollToItem(0, handoffShrinkOffsetPx.toInt())
                }
                return Velocity.Zero
            }
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

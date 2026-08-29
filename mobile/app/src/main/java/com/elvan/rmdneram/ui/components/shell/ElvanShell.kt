package com.elvan.rmdneram.ui.components.shell

import androidx.compose.animation.*
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import com.elvan.rmdneram.ui.theme.LocalAppFontFamily
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
    hasActions: Boolean = false,
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

    // One UI Physics: Brick Wall State
    var isHeaderExpanded by remember(scrollState) { 
        mutableStateOf(
            scrollState.firstVisibleItemIndex == 0 && 
            scrollState.firstVisibleItemScrollOffset < handoffShrinkOffsetPx
        ) 
    }
    val coroutineScope = rememberCoroutineScope()

    // Monitor boundary crossing without recomposing every pixel
    LaunchedEffect(scrollState, handoffShrinkOffsetPx) {
        snapshotFlow {
            scrollState.firstVisibleItemIndex > 0 || scrollState.firstVisibleItemScrollOffset >= handoffShrinkOffsetPx
        }.distinctUntilChanged().collect { isPastBoundary ->
            if (isPastBoundary && isHeaderExpanded) {
                isHeaderExpanded = false
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
                if (isHeaderExpanded && scrollState.firstVisibleItemIndex == 0) {
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
                                isHeaderExpanded = false
                            }
                        }
                    }
                }
            }
        }
    }

    var isFlinging by remember { mutableStateOf(false) }

    // Stable NestedScrollConnection — never reallocated during scroll to prevent jank
    val nestedScrollConnection = remember(scrollState) {
        object : NestedScrollConnection {
            override fun onPreScroll(available: Offset, source: NestedScrollSource): Offset {
                val delta = available.y
                val isItem0 = scrollState.firstVisibleItemIndex == 0
                val offset0 = if (isItem0) scrollState.firstVisibleItemScrollOffset.toFloat() else (handoffShrinkOffsetPx + 10000f)

                // ── Brick Wall Brake (The region above handoffShrinkOffsetPx physically DOES NOT EXIST when collapsed) ──
                if (!isHeaderExpanded) {
                    if (source == NestedScrollSource.UserInput) {
                        // User finger manually pulling down at the wall unlocks the expanded region
                        if (delta > 0f && isItem0 && offset0 <= handoffShrinkOffsetPx) {
                            isHeaderExpanded = true
                        }
                    } else if (delta > 0f) {
                        // Ballistic fling momentum, inertia, side effects:
                        // Hard physical ceiling at handoffShrinkOffsetPx — zero overshoot!
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
                if (delta > 1f && !isNavbarVisible) {
                    isNavbarVisible = true
                } else if (delta < -2f && isNavbarVisible && isFlinging && source == NestedScrollSource.SideEffect) {
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
                // Hard clamp failsafe: ensure sub-pixel integrity
                if (!isHeaderExpanded && source != NestedScrollSource.UserInput) {
                    if (scrollState.firstVisibleItemIndex == 0 && scrollState.firstVisibleItemScrollOffset < handoffShrinkOffsetPx) {
                        coroutineScope.launch {
                            scrollState.scrollToItem(0, handoffShrinkOffsetPx.toInt())
                        }
                    }
                }
                return Offset.Zero
            }

            override suspend fun onPreFling(available: Velocity): Velocity {
                val isItem0 = scrollState.firstVisibleItemIndex == 0
                val offset0 = if (isItem0) scrollState.firstVisibleItemScrollOffset.toFloat() else 10000f

                // When collapsed: any fling towards the top (available.y > 0) MUST stop dead at the brick wall!
                if (!isHeaderExpanded && available.y > 0f) {
                    if (isItem0 && offset0 <= handoffShrinkOffsetPx) {
                        // Absorb 100% of velocity at the wall — zero movement past the wall!
                        return available
                    }
                }

                // Only fast momentum fling (velocity < -800) triggers hiding when cards reached the pill
                if (available.y < -800f) {
                    isFlinging = true
                    val reachedPill = !isItem0 || offset0 >= (collisionOffsetPx - with(density) { 4.dp.toPx() })
                    if (reachedPill && isNavbarVisible) {
                        isNavbarVisible = false
                    }
                }
                return Velocity.Zero
            }

            override suspend fun onPostFling(consumed: Velocity, available: Velocity): Velocity {
                isFlinging = false
                if (!isNavbarVisible) isNavbarVisible = true
                // Magnetic Lock at rest
                if (!isHeaderExpanded && scrollState.firstVisibleItemIndex == 0 && scrollState.firstVisibleItemScrollOffset < handoffShrinkOffsetPx) {
                    scrollState.scrollToItem(0, handoffShrinkOffsetPx.toInt())
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
                    hasLeadingWidget = onBack != null,
                    onBack = onBack,
                    hasActions = hasActions,
                    actions = actions
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
                hasActions = hasActions,
                actions = actions
            )
        } else {
            // Static Collapsed Top Bar (e.g. Calendar page or inside Notes folder)
            ElvanStaticCollapsedBar(
                colors = colors,
                title = title,
                onBack = onBack,
                actions = actions
            )
        }

        // Layer 4: Bottom Fade Mask and Navbar
        if (showNavbar) {
            val navBarsPadding = WindowInsets.navigationBars.asPaddingValues().calculateBottomPadding()
            
            // Fade mask is ALWAYS present when showNavbar is true
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

/**
 * Master Subpage Shell for Jetpack Compose (matching Flutter's ElvanSubpageShell).
 * A lightweight wrapper around ElvanShell exclusively designed for subpages (Settings, Security, Display, etc.).
 * Inherently disables the bottom navbar and provides full One UI collapsible physics with the floating back chevron.
 */
@Composable
fun ElvanSubShell(
    title: String,
    onBack: () -> Unit,
    scrollState: LazyListState = androidx.compose.foundation.lazy.rememberLazyListState(),
    colors: HomeColors = com.elvan.rmdneram.ui.home.rememberHomeColors(),
    hasActions: Boolean = false,
    actions: @Composable RowScope.() -> Unit = {},
    content: @Composable () -> Unit
) {
    ElvanShell(
        title = title,
        onBack = onBack,
        showNavbar = false,
        scrollState = scrollState,
        colors = colors,
        hasActions = hasActions,
        actions = actions,
        content = content
    )
}

/**
 * Standard default metrics and helpers for ElvanShell pages.
 */
object ElvanShellDefaults {
    /**
     * The recommended minimum height for page content containers below the top spacer
     * to guarantee that the ElvanShell header can always reach its collapsed brink wall
     * state, even on pages/tabs with little or no content (e.g. empty exams or few notes).
     */
    val MinContentHeight: androidx.compose.ui.unit.Dp
        @Composable
        get() = androidx.compose.ui.platform.LocalConfiguration.current.screenHeightDp.dp * 0.75f
}

/**
 * Modifier extension to ensure a content container inside an ElvanShell page
 * has the minimum height necessary for the collapsing header to function.
 * If the content is already larger than the minimum height, it expands naturally.
 */
@Composable
fun Modifier.elvanCollapseMinHeight(): Modifier {
    return this.heightIn(min = ElvanShellDefaults.MinContentHeight)
}

/**
 * Master dynamic collapse spacer for LazyColumn in ElvanShell pages.
 * Dynamically computes the exact minimum height needed so that pages with few or 0 items
 * can smoothly scroll enough to reach the collapsed brink wall state, without allowing
 * tall/normal pages to overscroll into empty blank space.
 */
@Composable
fun ElvanCollapseSpacer(
    itemCount: Int,
    itemHeight: androidx.compose.ui.unit.Dp = 80.dp,
    extraHeight: androidx.compose.ui.unit.Dp = 0.dp
) {
    val configuration = androidx.compose.ui.platform.LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.dp
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val collapsedHeaderHeight = statusBarHeight + 20.dp + 50.dp
    val bottomNavHeight = com.elvan.rmdneram.ui.home.HomeDimens.ContentPaddingBottom
    
    val targetContentArea = screenHeight - collapsedHeaderHeight - bottomNavHeight
    val estimatedContentHeight = (itemCount * itemHeight.value).dp + extraHeight
    
    val neededSpacer = (targetContentArea - estimatedContentHeight).coerceAtLeast(0.dp)
    if (neededSpacer > 0.dp) {
        Spacer(modifier = Modifier.height(neededSpacer))
    }
}

/**
 * Master animated slide section for ElvanShell pages.
 * Runs AnimatedContent edge-to-edge across the screen so swipe transitions never get clipped,
 * and automatically applies standard horizontal content padding to the inner container.
 */
@Composable
fun <T> ElvanSlideSection(
    targetState: T,
    swipeDirection: Int,
    modifier: Modifier = Modifier,
    label: String = "ElvanSlideSection",
    content: @Composable (T) -> Unit
) {
    androidx.compose.animation.AnimatedContent(
        targetState = targetState,
        modifier = modifier.fillMaxWidth(),
        transitionSpec = {
            val directionFactor = swipeDirection
            if (directionFactor != 0) {
                (androidx.compose.animation.slideInHorizontally { width -> directionFactor * width } + androidx.compose.animation.fadeIn()) togetherWith
                (androidx.compose.animation.slideOutHorizontally { width -> -directionFactor * width } + androidx.compose.animation.fadeOut())
            } else {
                (androidx.compose.animation.fadeIn(animationSpec = androidx.compose.animation.core.tween(220, delayMillis = 90)) + 
                 androidx.compose.animation.scaleIn(initialScale = 0.95f, animationSpec = androidx.compose.animation.core.tween(220, delayMillis = 90))) togetherWith
                (androidx.compose.animation.fadeOut(animationSpec = androidx.compose.animation.core.tween(90)))
            }
        },
        label = label
    ) { state ->
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = com.elvan.rmdneram.ui.home.HomeDimens.ContentPadding)
        ) {
            content(state)
        }
    }
}

/**
 * Standard container for static (non-animated) section items in ElvanShell pages.
 */
@Composable
fun ElvanSectionContainer(
    modifier: Modifier = Modifier,
    horizontalAlignment: Alignment.Horizontal = Alignment.Start,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = com.elvan.rmdneram.ui.home.HomeDimens.ContentPadding),
        horizontalAlignment = horizontalAlignment,
        content = content
    )
}

/**
 * Standard section title with consistent start alignment (24.dp) and bottom spacing.
 */
@Composable
fun ElvanSectionTitle(
    title: String,
    colors: com.elvan.rmdneram.ui.home.HomeColors,
    modifier: Modifier = Modifier
) {
    Text(
        text = title,
        style = com.elvan.rmdneram.ui.home.HomeTypography.DateLabel.copy(
            fontFamily = LocalAppFontFamily.current
        ),
        color = colors.textSecondary.copy(alpha = 0.8f),
        modifier = modifier.padding(
            start = com.elvan.rmdneram.ui.home.HomeDimens.SpacingXxxl,
            bottom = com.elvan.rmdneram.ui.home.HomeDimens.SectionTitleBottomPadding
        )
    )
}

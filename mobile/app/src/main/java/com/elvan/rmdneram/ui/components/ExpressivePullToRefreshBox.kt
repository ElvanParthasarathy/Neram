package com.elvan.rmdneram.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.ui.window.Popup
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size

import androidx.compose.material3.ContainedLoadingIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.material3.pulltorefresh.PullToRefreshState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import com.elvan.rmdneram.ui.home.HomeAnimations
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeDimens

/**
 * ExpressivePullToRefreshBox - A shared component for consistent pull-to-refresh UX.
 * 
 * Wraps the material3 PullToRefreshBox and provides the standard "Expressive" 
 * loading indicator animation used across the app (Home, Schedule, Calendar).
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun ExpressivePullToRefreshBox(
    isRefreshing: Boolean,
    onRefresh: () -> Unit,
    pullRefreshState: PullToRefreshState,
    colors: HomeColors,
    modifier: Modifier = Modifier,
    showIndicator: Boolean = true,
    overlay: Boolean = false, // New parameter
    content: @Composable BoxScope.() -> Unit
) {
    val fraction = pullRefreshState.distanceFraction

    // Smoothly animate the offset to prevent jumps between pull and refresh states
    val targetOffset = if (isRefreshing) HomeAnimations.PullRefresh.RefreshingOffset else (fraction * HomeAnimations.PullRefresh.MaxOffset).coerceIn(0f, HomeAnimations.PullRefresh.MaxOffset)
    val animatedOffset by animateFloatAsState(
        targetValue = targetOffset,
        label = "offset"
    )

    PullToRefreshBox(
        state = pullRefreshState,
        isRefreshing = isRefreshing,
        onRefresh = onRefresh,
        modifier = modifier.fillMaxSize(),
        indicator = {
            if (showIndicator && (isRefreshing || fraction > 0f)) {
                 ExpressiveRefreshIndicator(
                     isRefreshing = isRefreshing,
                     fraction = fraction,
                     colors = colors,
                     animatedOffset = animatedOffset,
                     modifier = Modifier.align(Alignment.TopCenter)
                 )
            }
        },
        content = {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer {
                        // If overlay is true, do NOT translate content
                        translationY = if (overlay) 0f else animatedOffset
                    }
            ) {
                content()
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun ExpressiveRefreshIndicator(
    isRefreshing: Boolean,
    fraction: Float,
    colors: HomeColors,
    animatedOffset: Float,
    modifier: Modifier = Modifier
) {
    // Smoothly animate scale to prevent "breaking" appearance/disappearance
    val targetScale = if (isRefreshing) 1f else fraction.coerceIn(0f, 1f)
    val animatedScale by animateFloatAsState(
        targetValue = targetScale,
        label = "scale"
    )

    Box(
        modifier = modifier
            .graphicsLayer {
                translationY = animatedOffset
                scaleX = animatedScale
                scaleY = animatedScale
                alpha = animatedScale
            }
    ) {
        if (isRefreshing) {
            ContainedLoadingIndicator(
                modifier = Modifier.size(HomeDimens.RefreshIndicatorSize),
                containerColor = colors.surface,
                indicatorColor = colors.accent
            )
        } else {
            ContainedLoadingIndicator(
                progress = { fraction.coerceIn(0f, 1f) },
                modifier = Modifier.size(HomeDimens.RefreshIndicatorSize),
                containerColor = colors.surface,
                indicatorColor = colors.accent
            )
        }
    }
}

package com.elvan.rmdneram.ui.components.shell

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeTypography

@Composable
fun ElvanExpandedBar(
    title: String,
    colors: HomeColors,
    scrollOffsetPx: Float,
    collisionOffsetPx: Float,
    expandedHeight: Dp = 280.dp,
    hasLeadingWidget: Boolean = false,
    isHeaderExpanded: Boolean = true
) {
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val density = LocalDensity.current
    val screenWidth = LocalConfiguration.current.screenWidthDp.dp

    val maxExtentPx = with(density) { expandedHeight.toPx() }
    val statusBarHeightPx = with(density) { statusBarHeight.toPx() }
    val ceilingPx = statusBarHeightPx + with(density) { 20.dp.toPx() }

    // Flutter: normalizedProgress 't' hits 1.0 at handoff (when icons reach ceiling)
    val handoffHeightPx = ceilingPx + with(density) { 64.dp.toPx() }
    val handoffShrinkOffsetPx = maxExtentPx - handoffHeightPx
    val t = (scrollOffsetPx / handoffShrinkOffsetPx).coerceIn(0f, 1f)
    
    // 1. Measure text width
    val textMeasurer = rememberTextMeasurer()
    val textLayoutResult = remember(title) {
        textMeasurer.measure(
            text = title,
            style = HomeTypography.PageTitle.copy(fontSize = 34.sp)
        )
    }
    val textWidthPx = textLayoutResult.size.width.toFloat()
    val textHeightPx = textLayoutResult.size.height.toFloat()
    val screenWidthPx = with(density) { screenWidth.toPx() }
    
    // 2. Compute X endpoints
    // START (t=0): text visually centered on screen (clamped to 16dp margin)
    val centeredLeftPx = maxOf(with(density) { 16.dp.toPx() }, (screenWidthPx - textWidthPx) / 2f)
    // END (t=1): matches exactly ElvanCollapsedBar text padding
    val targetLeftPx = with(density) { if (hasLeadingWidget) 78.dp.toPx() else 24.dp.toPx() }
    val currentLeftPx = centeredLeftPx + (targetLeftPx - centeredLeftPx) * t
    val currentLeftDp = with(density) { currentLeftPx.toDp() }
    
    // 3. Compute Y endpoints (Replicating exact Flutter trajectory)
    val startTextBottomPx = maxExtentPx - with(density) { 100.dp.toPx() }
    val targetTextBottomPx = ceilingPx + with(density) { 39.5.dp.toPx() }
    
    val currentTextBottomPx = startTextBottomPx + (targetTextBottomPx - startTextBottomPx) * t
    val currentTopPx = currentTextBottomPx - textHeightPx
    val currentTopDp = with(density) { currentTopPx.toDp() }
    
    val finalScale = 20f / 34f
    val scale = 1.0f - (1.0f - finalScale) * t

    // Lift progress: text fades OUT ONLY when the first card reaches the pill (collision)
    val liftStartOffsetPx = collisionOffsetPx - with(density) { 4.dp.toPx() }
    val liftProgress = if (scrollOffsetPx > liftStartOffsetPx) {
        ((scrollOffsetPx - liftStartOffsetPx) / with(density) { 12.dp.toPx() }).coerceIn(0f, 1f)
    } else {
        0f
    }
    val titleOpacity = if (!isHeaderExpanded) {
        0f
    } else {
        (1.0f - liftProgress).coerceIn(0f, 1f)
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(expandedHeight)
    ) {
        Text(
            text = title,
            style = HomeTypography.PageTitle.copy(fontSize = 34.sp),
            color = colors.textPrimary,
            modifier = Modifier
                .align(Alignment.TopStart)
                .offset(x = currentLeftDp, y = currentTopDp)
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    this.alpha = titleOpacity
                    transformOrigin = TransformOrigin(0f, 1f)
                }
        )
    }
}

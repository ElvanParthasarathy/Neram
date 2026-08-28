package com.elvan.rmdneram.ui.components.shell

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeTypography

@Composable
fun ElvanExpandedBar(
    title: String,
    colors: HomeColors,
    scrollOffsetPx: Float,
    maxScrollPx: Float,
    expandedHeight: androidx.compose.ui.unit.Dp = 240.dp,
    hasLeadingWidget: Boolean = false
) {
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val density = androidx.compose.ui.platform.LocalDensity.current
    val screenWidth = androidx.compose.ui.platform.LocalConfiguration.current.screenWidthDp.dp

    val maxExtentPx = with(density) { expandedHeight.toPx() }
    val statusBarHeightPx = with(density) { statusBarHeight.toPx() }
    val ceilingPx = statusBarHeightPx + with(density) { 20.dp.toPx() }

    // Flutter: normalizedProgress 't' hits 1.0 at handoff
    val t = (scrollOffsetPx / maxScrollPx).coerceIn(0f, 1f)
    
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
    // If hasLeadingWidget: Box padding 16 + Pill 50 + padding 12 = 78.dp
    // If NO leading widget: Box padding 16 + padding 8 = 24.dp
    val targetLeftPx = with(density) { if (hasLeadingWidget) 78.dp.toPx() else 24.dp.toPx() }
    val currentLeftPx = centeredLeftPx + (targetLeftPx - centeredLeftPx) * t
    val currentLeftDp = with(density) { currentLeftPx.toDp() }
    
    // 3. Compute Y endpoints (Replicating exact Flutter trajectory)
    val startTextBottomPx = maxExtentPx - with(density) { 128.dp.toPx() }
    val targetTextBottomPx = ceilingPx + with(density) { 38.5.dp.toPx() }
    
    val currentTextBottomPx = startTextBottomPx + (targetTextBottomPx - startTextBottomPx) * t
    val currentTopPx = currentTextBottomPx - textHeightPx
    val currentTopDp = with(density) { currentTopPx.toDp() }
    
    val finalScale = 20f / 34f
    val scale = 1.0f - (1.0f - finalScale) * t
    val alpha = 1.0f

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(expandedHeight) // Takes exactly expandedHeight
    ) {
        Text(
            text = title,
            style = HomeTypography.PageTitle.copy(fontSize = 34.sp),
            color = colors.textPrimary,
            modifier = Modifier
                .align(Alignment.TopStart) // Using TopStart to position exact X and Y
                .offset(x = currentLeftDp, y = currentTopDp)
                .graphicsLayer {
                    scaleX = scale
                    scaleY = scale
                    this.alpha = alpha
                    transformOrigin = TransformOrigin(0f, 1f) // BottomLeft alignment for scaling
                }
        )
    }
}

package com.elvan.rmdneram.ui.components.shell

import androidx.compose.foundation.background
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.sp
import androidx.compose.material3.Text

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.elvan.rmdneram.ui.home.HomeColors

@Composable
fun ElvanCollapsedBar(
    scrollOffset: Float, // currentScrollOffset
    collisionOffsetPx: Float,
    colors: HomeColors,
    expandedHeight: androidx.compose.ui.unit.Dp = 240.dp,
    title: String? = null,
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {}
) {
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val ceiling = statusBarHeight + 20.dp
    val density = androidx.compose.ui.platform.LocalDensity.current
    val ceilingPx = with(density) { ceiling.toPx() }
    
    // In Flutter, the icons start at a certain distance from the top.
    // They are positioned relative to the bottom of the expanded header.
    // Expanded height = expandedHeight.
    // Current height = expandedHeight - scrollOffset.
    // expandedButtonsBottom = 8.0, kToolbarHeight = 56.0.
    // currentTop = currentHeight - 8.0 - 56.0.
    val expandedHeightPx = with(density) { expandedHeight.toPx() }
    val currentHeightPx = expandedHeightPx - scrollOffset
    val currentTopPx = currentHeightPx - with(density) { 64.dp.toPx() } // 8 + 56
    
    val isPinned = currentTopPx <= ceilingPx
    val finalTopPx = if (isPinned) ceilingPx else currentTopPx
    
    val finalTopDp = with(density) { finalTopPx.toDp() }
    
    // Lift progress: pill fades in during the last 12px before collision.
    // collisionOffsetPx is when the text hits the pill, but wait!
    // liftStartOffset = collisionOffsetPx - 12px
    val liftStartOffsetPx = collisionOffsetPx - with(density) { 12.dp.toPx() }
    val liftProgress = if (scrollOffset > liftStartOffsetPx) {
        ((scrollOffset - liftStartOffsetPx) / with(density) { 12.dp.toPx() }).coerceIn(0f, 1f)
    } else {
        0f
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = finalTopDp)
    ) {
        Box(
            modifier = Modifier.padding(start = 16.dp).align(Alignment.CenterStart)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (onBack != null) {
                    ElvanPill(liftProgress = liftProgress, colors = colors) {
                        IconButton(onClick = onBack, modifier = Modifier.size(50.dp)) {
                            Icon(Icons.Filled.ChevronLeft, "Back", tint = colors.textPrimary)
                        }
                    }
                }
                if (title != null) {
                    Text(
                        text = title,
                        style = com.elvan.rmdneram.ui.home.HomeTypography.SectionTitle.copy(
                            fontSize = 20.sp,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                            color = colors.textPrimary
                        ),
                        modifier = Modifier
                            .padding(start = if (onBack != null) 12.dp else 8.dp)
                            .graphicsLayer {
                                // Fade IN exactly when pill fades IN! (liftProgress)
                                this.alpha = liftProgress
                            }
                    )
                }
            }
        }

        Box(
            modifier = Modifier.padding(end = 16.dp).align(Alignment.CenterEnd)
        ) {
            ElvanPill(liftProgress = liftProgress, colors = colors) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    actions()
                }
            }
        }
    }
}

@Composable
private fun ElvanPill(
    liftProgress: Float,
    colors: HomeColors,
    content: @Composable () -> Unit
) {
    Surface(
        shape = CircleShape,
        color = colors.surface.copy(alpha = (0.88f * liftProgress).coerceIn(0f, 1f)),
        modifier = Modifier
            .height(50.dp)
            .graphicsLayer {
                shadowElevation = if (liftProgress > 0f) (16f * liftProgress) else 0f
                ambientShadowColor = androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.05f)
                spotShadowColor = androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.05f)
            }
    ) {
        Box(
            modifier = Modifier.padding(horizontal = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            content()
        }
    }
}

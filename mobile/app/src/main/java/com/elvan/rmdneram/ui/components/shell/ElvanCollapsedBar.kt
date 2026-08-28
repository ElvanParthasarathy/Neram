package com.elvan.rmdneram.ui.components.shell

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeTypography

@Composable
fun ElvanTopBarIconButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier
            .size(40.dp)
            .clip(CircleShape)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = ripple(bounded = true, radius = 20.dp),
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        content()
    }
}

@Composable
fun ElvanCollapsedBar(
    scrollOffset: Float, // currentScrollOffset
    collisionOffsetPx: Float,
    colors: HomeColors,
    expandedHeight: Dp = 280.dp,
    title: String? = null,
    onBack: (() -> Unit)? = null,
    navOpacity: Float = 1.0f,
    isHeaderExpanded: Boolean = true,
    actions: @Composable RowScope.() -> Unit = {}
) {
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val ceiling = statusBarHeight + 20.dp
    val density = LocalDensity.current
    val ceilingPx = with(density) { ceiling.toPx() }
    
    // In Flutter:
    // currentTop = currentHeight - 8.0 - kToolbarHeight (64px)
    val expandedHeightPx = with(density) { expandedHeight.toPx() }
    val currentHeightPx = expandedHeightPx - scrollOffset
    val currentTopPx = currentHeightPx - with(density) { 64.dp.toPx() }
    
    val isPinned = !isHeaderExpanded || currentTopPx <= ceilingPx
    val finalTopPx = if (isPinned) ceilingPx else currentTopPx
    val finalTopDp = with(density) { finalTopPx.toDp() }
    
    // Exact Flutter liftProgress: pill container fades in ONLY when the first card reaches the pill (collision)
    val liftStartOffsetPx = collisionOffsetPx - with(density) { 4.dp.toPx() }
    val liftProgress = if (!isHeaderExpanded) {
        1.0f
    } else if (scrollOffset > liftStartOffsetPx) {
        ((scrollOffset - liftStartOffsetPx) / with(density) { 12.dp.toPx() }).coerceIn(0f, 1f)
    } else {
        0f
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = finalTopDp)
            .zIndex(150f)
            .graphicsLayer {
                this.alpha = navOpacity
            }
    ) {
        // Left side (Back Button / Title)
        Box(
            modifier = Modifier
                .padding(start = 16.dp)
                .align(Alignment.CenterStart)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (onBack != null) {
                    ElvanPill(liftProgress = liftProgress, colors = colors, modifier = Modifier.size(50.dp)) {
                        ElvanTopBarIconButton(onClick = onBack) {
                            Icon(
                                imageVector = com.elvan.rmdneram.ui.navigation.MaterialSymbols.Rounded.ArrowBack,
                                contentDescription = "Back",
                                tint = colors.textPrimary,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }
                if (title != null) {
                    Text(
                        text = title,
                        style = HomeTypography.SectionTitle.copy(
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
                        ),
                        modifier = Modifier
                            .padding(start = if (onBack != null) 12.dp else 8.dp)
                            .graphicsLayer {
                                this.alpha = liftProgress
                            }
                    )
                }
            }
        }

        // Right side (Action Buttons Pill)
        Box(
            modifier = Modifier
                .padding(end = 16.dp)
                .align(Alignment.CenterEnd)
        ) {
            ElvanPill(liftProgress = liftProgress, colors = colors) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
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
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val isDark = colors.isDark || colors.background == Color.Black || colors.background.red < 0.2f
    val pillBgColor = if (isDark) Color(0xFF1E1E1E) else Color(0xFFFFFFFF)
    val pillBorderColor = if (isDark) Color(0xFF333333).copy(alpha = 0.15f * liftProgress)
                          else Color(0xFFFFFFFF).copy(alpha = 0.6f * liftProgress)
    
    Box(
        modifier = modifier
            .height(50.dp)
            .cssShadow(
                color = Color.Black,
                alpha = 0.05f * liftProgress,
                blurRadius = 16.dp,
                offsetY = 4.dp
            )
            .background(
                color = pillBgColor.copy(alpha = 0.88f * liftProgress),
                shape = CircleShape
            )
            .border(
                width = 0.5.dp,
                color = pillBorderColor,
                shape = CircleShape
            ),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .padding(horizontal = 6.dp),
            contentAlignment = Alignment.Center
        ) {
            content()
        }
    }
}

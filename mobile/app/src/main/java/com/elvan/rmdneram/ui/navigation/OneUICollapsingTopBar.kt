package com.elvan.rmdneram.ui.navigation

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.HomeTypography
import com.elvan.rmdneram.ui.home.rememberHomeColors

/**
 * EXACT Samsung One UI Settings Header.
 * 
 * Behavior:
 * - Single Header (No stacked app bars)
 * - Scroll-driven transformation ONLY (No time-based animation)
 * - Expanded: Large 280dp height, Title Centered horizontally & vertically (~45%), Search Lower
 * - Collapsed: Toolbar height (56dp + StatusBar), Title Left (56dp), Search Right
 */
object OneUICollapsingTopBarDefaults {
    val ExpandedHeight = 280.dp
    val ToolbarHeight = 56.dp // Standard toolbar height (excluding status bar)
    
    // Design Specs
    val ExpandedTitleScale = 1.3f
    val CollapsedTitleScale = 1.0f
    
    val CollapsedTitleStartConfig = 56.dp // Standard toolbar title margin
}

@Composable
fun rememberCollapsingTopBarHeight(scrollState: ScrollState): Dp {
    val density = LocalDensity.current
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    
    val expandedHeightPx = with(density) { OneUICollapsingTopBarDefaults.ExpandedHeight.toPx() } + with(density) { statusBarHeight.toPx() }
    val collapsedHeightPx = with(density) { OneUICollapsingTopBarDefaults.ToolbarHeight.toPx() } + with(density) { statusBarHeight.toPx() }
    val maxScrollOffsetPx = expandedHeightPx - collapsedHeightPx

    // Derived state for performance
    val currentHeight by remember(scrollState, maxScrollOffsetPx) {
        derivedStateOf {
            val progress = (scrollState.value / maxScrollOffsetPx).coerceIn(0f, 1f)
            val heightPx = lerp(expandedHeightPx, collapsedHeightPx, progress)
            heightPx.toDp(density)
        }
    }
    return currentHeight
}

private fun Float.toDp(density: androidx.compose.ui.unit.Density): Dp {
    return with(density) { this@toDp.toDp() }
}

private fun lerp(start: Float, end: Float, fraction: Float): Float {
    return start + (end - start) * fraction
}

@Composable
fun OneUICollapsingTopBar(
    title: String,
    scrollState: ScrollState,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
    onSearch: () -> Unit = {}
) {
    val colors = rememberHomeColors()
    val density = LocalDensity.current
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    
    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .background(colors.background)
    ) {
        val screenWidth = maxWidth
        val screenWidthPx = with(density) { maxWidth.toPx() }
        val statusBarHeightPx = with(density) { statusBarHeight.toPx() }
        
        val expandedHeightPx = with(density) { OneUICollapsingTopBarDefaults.ExpandedHeight.toPx() } + statusBarHeightPx
        val collapsedHeightPx = with(density) { OneUICollapsingTopBarDefaults.ToolbarHeight.toPx() } + statusBarHeightPx
        val toolbarHeightPx = with(density) { OneUICollapsingTopBarDefaults.ToolbarHeight.toPx() }
        
        val maxScrollOffsetPx = expandedHeightPx - collapsedHeightPx
        
        // Progress: 0f (Expanded) -> 1f (Collapsed)
        val progress by remember(scrollState, maxScrollOffsetPx) {
            derivedStateOf {
                (scrollState.value / maxScrollOffsetPx).coerceIn(0f, 1f)
            }
        }
        
        // Current Height
        val currentHeightPx = lerp(expandedHeightPx, collapsedHeightPx, progress)
        
        // --- TITLE MEASUREMENT & POSITIONING ---
        var textWidthPx by remember { mutableFloatStateOf(0f) }
        var textHeightPx by remember { mutableFloatStateOf(0f) }
        
        // Target X Position
        // Expanded: Center of Screen = (ScreenW - TextW) / 2
        // Collapsed: Standard Toolbar margin = 56dp (assumed Back button width)
        val collapsedLeftMarginPx = with(density) { OneUICollapsingTopBarDefaults.CollapsedTitleStartConfig.toPx() }
        val expandedLeftMarginPx = if (textWidthPx > 0) (screenWidthPx - textWidthPx) / 2f else 0f
        
        // Target Y Position
        // Expanded: ~40% down from top (visual balancing) + StatusBar
        // Collapsed: Vertically centered in Toolbar area (StatusBar + (ToolbarH - TextH)/2)
        val expandedTopMarginPx = (expandedHeightPx * 0.40f) 
        val collapsedTopMarginPx = statusBarHeightPx + (toolbarHeightPx - textHeightPx) / 2f
        
        val currentTitleX = lerp(expandedLeftMarginPx, collapsedLeftMarginPx, progress)
        val currentTitleY = lerp(expandedTopMarginPx, collapsedTopMarginPx, progress)
        
        val currentScale = lerp(
            OneUICollapsingTopBarDefaults.ExpandedTitleScale,
            OneUICollapsingTopBarDefaults.CollapsedTitleScale,
            progress
        )

        // --- SEARCH ICON POSITIONING ---
        // Expanded: Lower reachability zone (~65% down)
        // Collapsed: Standard Toolbar (Top Right) centered vertically
        val iconSize = 48.dp // Standard Touch Target
        val iconSizePx = with(density) { iconSize.toPx() }
        
        val searchExpandedY = (expandedHeightPx * 0.65f) 
        val searchCollapsedY = statusBarHeightPx + (toolbarHeightPx - iconSizePx) / 2f
        
        val currentSearchY = lerp(searchExpandedY, searchCollapsedY, progress)

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(with(density) { currentHeightPx.toDp() })
                // Clipping is important so content doesn't overflow during collapse if height mismatch
                .graphicsLayer { clip = true } 
        ) {
            // BACK BUTTON (Fixed Position)
            IconButton(
                onClick = onBack,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(top = statusBarHeight + 4.dp, start = 4.dp) // Align inside Toolbar area
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = colors.textPrimary
                )
            }
            
            // TITLE
            Text(
                text = title,
                style = HomeTypography.PageTitle.copy(fontSize = 20.sp),
                color = colors.textPrimary,
                onTextLayout = { 
                    textWidthPx = it.size.width.toFloat() 
                    textHeightPx = it.size.height.toFloat()
                },
                modifier = Modifier
                    .graphicsLayer {
                        translationX = currentTitleX
                        translationY = currentTitleY
                        scaleX = currentScale
                        scaleY = currentScale
                        transformOrigin = androidx.compose.ui.graphics.TransformOrigin(0f, 0f) // Scale from TopLeft
                    }
            )
            
            // SEARCH ICON
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(end = 4.dp)
                    .graphicsLayer {
                        translationY = currentSearchY
                    }
            ) {
                IconButton(onClick = onSearch) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = colors.textPrimary
                    )
                }
            }
        }
    }
}

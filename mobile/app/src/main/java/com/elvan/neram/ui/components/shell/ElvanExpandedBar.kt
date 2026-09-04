package com.elvan.neram.ui.components.shell

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.data.model.FeatureCard
import com.elvan.neram.ui.home.HomeColors
import com.elvan.neram.ui.home.HomeTypography
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.preventBrokenLigatures

@Composable
fun ElvanExpandedBar(
    title: String,
    colors: HomeColors,
    scrollOffsetPx: Float,
    collisionOffsetPx: Float,
    expandedHeight: Dp = 280.dp,
    hasLeadingWidget: Boolean = false,
    onBack: (() -> Unit)? = null,
    hasActions: Boolean = false,
    banners: List<FeatureCard> = emptyList(),
    onBannerClick: ((String) -> Unit)? = null,
    onDismissBanner: ((String) -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {}
) {
    val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
    val density = LocalDensity.current
    val screenWidth = LocalConfiguration.current.screenWidthDp.dp
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current

    val maxExtentPx = with(density) { expandedHeight.toPx() }
    val statusBarHeightPx = with(density) { statusBarHeight.toPx() }
    val ceilingPx = statusBarHeightPx + with(density) { 20.dp.toPx() }

    // Floating Buttons Traveling trajectory (from bottom of header to ceiling)
    val currentHeightPx = maxExtentPx - scrollOffsetPx
    val expandedButtonsBottomPx = with(density) { 8.dp.toPx() }
    val toolbarHeightPx = with(density) { 56.dp.toPx() }
    var currentButtonsTopPx = currentHeightPx - expandedButtonsBottomPx - toolbarHeightPx
    val isPinned = currentButtonsTopPx <= ceilingPx
    if (isPinned) {
        currentButtonsTopPx = ceilingPx
    }

    // Flutter: normalizedProgress 't' hits 1.0 at handoff (when icons reach ceiling)
    val handoffHeightPx = ceilingPx + with(density) { 64.dp.toPx() }
    val handoffShrinkOffsetPx = maxExtentPx - handoffHeightPx
    val t = (scrollOffsetPx / handoffShrinkOffsetPx).coerceIn(0f, 1f)
    
    val safeTitle = remember(title) { title.preventBrokenLigatures() }
    
    // 1. Butter-Smooth GPU Layout & Dynamic Scaled Max Width Calculation
    val baseStyle = HomeTypography.PageTitle.copy(fontSize = 34.sp)
    val finalScale = 22f / 34f
    val scale = 1.0f - (1.0f - finalScale) * t

    val textMeasurer = rememberTextMeasurer()
    val screenWidthPx = with(density) { screenWidth.toPx() }
    
    val expandedAvailableWidthPx = screenWidthPx - with(density) { 32.dp.toPx() }
    val targetLeftPx = with(density) { if (hasLeadingWidget || onBack != null) 74.dp.toPx() else 24.dp.toPx() }
    val collapsedRightMarginPx = with(density) { if (hasActions) 100.dp.toPx() else 16.dp.toPx() }
    val collapsedAvailableWidthPx = (screenWidthPx - targetLeftPx - collapsedRightMarginPx).coerceAtLeast(100f)
    
    // Convert collapsed width to 34sp equivalent space so text can fit more characters when scaled down
    val collapsedAvailableWidthIn34spPx = collapsedAvailableWidthPx / finalScale
    val currentAvailableWidthIn34spPx = expandedAvailableWidthPx + (collapsedAvailableWidthIn34spPx - expandedAvailableWidthPx) * t
    val currentAvailableWidthIn34spDp = with(density) { currentAvailableWidthIn34spPx.toDp() }

    val textLayoutResult = remember(safeTitle, currentAvailableWidthIn34spPx) {
        textMeasurer.measure(
            text = safeTitle,
            style = baseStyle,
            constraints = androidx.compose.ui.unit.Constraints(maxWidth = currentAvailableWidthIn34spPx.toInt())
        )
    }
    val rawTextWidthPx = textLayoutResult.size.width.toFloat()
    val textWidthPx = minOf(rawTextWidthPx, expandedAvailableWidthPx)
    val textHeightPx = textLayoutResult.size.height.toFloat()
    
    // 2. Compute X endpoints
    val centeredLeftPx = if (rawTextWidthPx > expandedAvailableWidthPx) {
        with(density) { 16.dp.toPx() }
    } else {
        (screenWidthPx - textWidthPx) / 2f
    }
    val currentLeftPx = centeredLeftPx + (targetLeftPx - centeredLeftPx) * t
    val currentLeftDp = with(density) { currentLeftPx.toDp() }
    
    // 3. Compute Y endpoints
    val startTextBottomPx = maxExtentPx - with(density) { 100.dp.toPx() }
    val targetTextBottomPx = ceilingPx + with(density) { 44.dp.toPx() }
    
    val currentTextBottomPx = startTextBottomPx + (targetTextBottomPx - startTextBottomPx) * t
    val currentTopPx = currentTextBottomPx - textHeightPx
    val currentTopDp = with(density) { currentTopPx.toDp() }

    // Lift progress: text fades OUT ONLY when the first card reaches the pill (collision)
    val liftStartOffsetPx = collisionOffsetPx - with(density) { 4.dp.toPx() }
    val liftProgress = if (scrollOffsetPx > liftStartOffsetPx) {
        ((scrollOffsetPx - liftStartOffsetPx) / with(density) { 12.dp.toPx() }).coerceIn(0f, 1f)
    } else {
        0f
    }
    val titleOpacity = (1.0f - liftProgress).coerceIn(0f, 1f)

    // Carousel Box fade out: Fades out smoothly as scrolling starts
    val bannerFadeOffsetPx = with(density) { 50.dp.toPx() }
    val bannerOpacity = (1.0f - (scrollOffsetPx / bannerFadeOffsetPx)).coerceIn(0f, 1f)

    val activeBanners = remember(banners) { banners.filter { it.enabled && it.message.isNotBlank() } }
    var selectedDetailBanner by remember { mutableStateOf<FeatureCard?>(null) }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(expandedHeight)
    ) {
        // 1. Dynamic Title
        // In banner mode: Title is completely hidden until collapsed, then slowly fades in!
        // In normal mode (no banners): Title behaves normally throughout.
        val titleAlpha = if (activeBanners.isNotEmpty()) {
            if (t >= 0.7f) {
                ((t - 0.7f) / 0.3f).coerceIn(0f, 1f) * titleOpacity
            } else {
                0f
            }
        } else {
            titleOpacity
        }

        if (titleAlpha > 0f) {
            Text(
                text = safeTitle,
                maxLines = 1,
                softWrap = false,
                overflow = TextOverflow.Ellipsis,
                style = baseStyle,
                color = colors.textPrimary,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .offset(x = currentLeftDp, y = currentTopDp)
                    .widthIn(max = currentAvailableWidthIn34spDp)
                    .graphicsLayer {
                        scaleX = scale
                        scaleY = scale
                        this.alpha = titleAlpha
                        transformOrigin = TransformOrigin(0f, 1f)
                    }
            )
        }

        // 2. Centered Floating Inset Carousel (With peek side strip & comfortable height)
        if (activeBanners.isNotEmpty() && bannerOpacity > 0f) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopCenter)
                    .offset(y = statusBarHeight + 30.dp)
                    .graphicsLayer {
                        this.alpha = bannerOpacity
                    },
                contentAlignment = Alignment.Center
            ) {
                if (activeBanners.size == 1) {
                    val singleBanner = activeBanners.first()
                    Box(modifier = Modifier.padding(horizontal = 20.dp)) {
                        MonochromeBannerCard(
                            banner = singleBanner,
                            colors = colors,
                            ff = ff,
                            onClick = {
                                if (singleBanner.actionRoute.isNotBlank()) {
                                    onBannerClick?.invoke(singleBanner.actionRoute)
                                }
                            },
                            onDismiss = {
                                onDismissBanner?.invoke(singleBanner.id)
                            },
                            onExpand = {
                                selectedDetailBanner = singleBanner
                            }
                        )
                    }
                } else {
                    val pagerState = rememberPagerState(pageCount = { activeBanners.size })
                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        HorizontalPager(
                            state = pagerState,
                            modifier = Modifier.fillMaxWidth(),
                            contentPadding = PaddingValues(horizontal = 20.dp),
                            pageSpacing = 10.dp
                        ) { page ->
                            val item = activeBanners.getOrNull(page)
                            if (item != null) {
                                MonochromeBannerCard(
                                    banner = item,
                                    colors = colors,
                                    ff = ff,
                                    onClick = {
                                        if (item.actionRoute.isNotBlank()) {
                                            onBannerClick?.invoke(item.actionRoute)
                                        }
                                    },
                                    onDismiss = {
                                        onDismissBanner?.invoke(item.id)
                                    },
                                    onExpand = {
                                        selectedDetailBanner = item
                                    }
                                )
                            }
                        }

                        // Subtle, monochrome minimal dot indicators
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            repeat(activeBanners.size) { index ->
                                val isSelected = pagerState.currentPage == index
                                val dotWidth = if (isSelected) 12.dp else 4.dp
                                val dotColor = if (isSelected) {
                                    if (colors.isDark) Color.White.copy(alpha = 0.9f) else Color.Black.copy(alpha = 0.85f)
                                } else {
                                    if (colors.isDark) Color.White.copy(alpha = 0.2f) else Color.Black.copy(alpha = 0.15f)
                                }

                                Box(
                                    modifier = Modifier
                                        .height(3.5.dp)
                                        .width(dotWidth)
                                        .clip(CircleShape)
                                        .background(dotColor)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal Bottom Sheet when description text is truncated
    selectedDetailBanner?.let { banner ->
        com.elvan.neram.ui.home.components.FeatureCardDetailBottomSheet(
            card = banner,
            colors = colors,
            lang = lang,
            onDismissRequest = { selectedDetailBanner = null },
            onAction = {
                val route = banner.actionRoute
                selectedDetailBanner = null
                if (route.isNotBlank()) {
                    onBannerClick?.invoke(route)
                }
            }
        )
    }
}

@Composable
private fun MonochromeBannerCard(
    banner: FeatureCard,
    colors: HomeColors,
    ff: androidx.compose.ui.text.font.FontFamily?,
    onClick: () -> Unit,
    onDismiss: () -> Unit,
    onExpand: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isClickable = banner.actionRoute.isNotBlank()
    val lang = LocalAppLanguage.current
    val typeStr = banner.getLocalizedBadge(lang)
    val symbol = "✦"
    val desc = banner.getLocalizedMessage(lang)
    var isTruncated by remember { mutableStateOf(false) }
    val isLong = isTruncated || desc.length > 120 || desc.lines().size > 3

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .clickable(
                enabled = isLong || isClickable,
                onClick = {
                    if (isLong) {
                        onExpand()
                    } else {
                        onClick()
                    }
                }
            ),
        shape = RoundedCornerShape(20.dp),
        color = colors.surface,
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 16.dp, end = 12.dp, top = 10.dp, bottom = 12.dp)
        ) {
            // Top Row: Type Pill with Sparkle Symbol + Close (×) Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Monochrome Type Badge with Sparkle Symbol
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .background(colors.textPrimary.copy(alpha = 0.08f))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = symbol,
                        style = TextStyle(
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        ),
                        color = colors.textPrimary,
                        modifier = Modifier.offset(y = (-0.5).dp)
                    )
                    Text(
                        text = typeStr,
                        style = TextStyle(
                            fontFamily = ff,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 10.5.sp,
                            letterSpacing = 0.2.sp
                        ),
                        color = colors.textPrimary
                    )
                }

                // Easy-Touch Close (×) Button
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .clickable(onClick = onDismiss),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Close,
                        contentDescription = K.dismiss.tr(lang),
                        tint = colors.textSecondary.copy(alpha = 0.8f),
                        modifier = Modifier.size(18.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Middle: Message Text (Default 3 lines with visual overflow detection)
            Text(
                text = desc,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis,
                onTextLayout = { textLayoutResult ->
                    if (textLayoutResult.hasVisualOverflow) {
                        isTruncated = true
                    }
                },
                style = TextStyle(
                    fontFamily = ff,
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.Medium,
                    lineHeight = 18.sp
                ),
                color = colors.textPrimary,
                modifier = Modifier.padding(end = 6.dp)
            )

            // Bottom Row: Tappable Monochrome Pill Button (When clickable)
            if (isClickable) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier
                            .clip(RoundedCornerShape(50))
                            .background(colors.textPrimary.copy(alpha = 0.1f))
                            .clickable(onClick = onClick)
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = K.open.tr(lang),
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.SemiBold
                            ),
                            color = colors.textPrimary
                        )
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                            contentDescription = K.open.tr(lang),
                            tint = colors.textPrimary,
                            modifier = Modifier.size(12.dp)
                        )
                    }
                }
            }
        }
    }
}

private fun getCategorySymbol(type: String): String {
    return "★"
}

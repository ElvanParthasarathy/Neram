package com.elvan.neram.ui.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.data.model.FeatureCard
import com.elvan.neram.ui.home.HomeColors
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

/**
 * Banner / Tips Carousel with compact locked height and bottom sheet expansion.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ElvanTipsCarousel(
    cards: List<FeatureCard>,
    colors: HomeColors,
    onDismiss: (String) -> Unit,
    onAction: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    if (cards.isEmpty()) return

    val lang = LocalAppLanguage.current
    var selectedDetailCard by remember { mutableStateOf<FeatureCard?>(null) }

    if (cards.size == 1) {
        val card = cards.first()
        ElvanTipsCard(
            card = card,
            colors = colors,
            lang = lang,
            onDismiss = { onDismiss(card.id) },
            onAction = { onAction(card.actionRoute) },
            onExpand = { selectedDetailCard = card },
            modifier = modifier
        )
    } else {
        val pagerState = rememberPagerState(pageCount = { cards.size })

        Column(
            modifier = modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            val cardHeight = 142.dp
            HorizontalPager(
                state = pagerState,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(cardHeight),
                pageSpacing = 10.dp,
                verticalAlignment = Alignment.Top
            ) { page ->
                val card = cards.getOrNull(page)
                if (card != null) {
                    ElvanTipsCard(
                        card = card,
                        colors = colors,
                        lang = lang,
                        onDismiss = { onDismiss(card.id) },
                        onAction = { onAction(card.actionRoute) },
                        onExpand = { selectedDetailCard = card },
                        modifier = Modifier
                            .fillMaxWidth()
                            .fillMaxHeight()
                    )
                }
            }

            // Minimal Page Indicator Dots
            if (cards.size > 1) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    horizontalArrangement = Arrangement.spacedBy(5.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    repeat(cards.size) { index ->
                        val isSelected = pagerState.currentPage == index
                        val dotWidth = if (isSelected) 14.dp else 4.dp
                        val dotColor = if (isSelected) {
                            colors.accent
                        } else {
                            if (colors.isDark) Color.White.copy(alpha = 0.2f) else Color.Black.copy(alpha = 0.15f)
                        }

                        Box(
                            modifier = Modifier
                                .height(4.dp)
                                .width(dotWidth)
                                .clip(CircleShape)
                                .background(dotColor)
                        )
                    }
                }
            }
        }
    }

    // Detail Bottom Sheet when expanded
    selectedDetailCard?.let { card ->
        FeatureCardDetailBottomSheet(
            card = card,
            colors = colors,
            lang = lang,
            onDismissRequest = { selectedDetailCard = null },
            onAction = {
                selectedDetailCard = null
                onAction(card.actionRoute)
            }
        )
    }
}

/**
 * Compact Locked-Size Banner Card
 */
@Composable
fun ElvanTipsCard(
    card: FeatureCard,
    colors: HomeColors,
    lang: String,
    onDismiss: () -> Unit,
    onAction: () -> Unit,
    onExpand: () -> Unit,
    modifier: Modifier = Modifier
) {
    val ff = LocalAppFontFamily.current
    val isDark = colors.isDark

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = ripple(color = colors.accent.copy(alpha = 0.2f)),
                onClick = onExpand
            ),
        shape = RoundedCornerShape(20.dp),
        color = colors.surface,
        shadowElevation = 0.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            // Top Row: Type Tag & Dismiss (X)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Typable Tag from Admin Panel
                val badgeText = card.getLocalizedBadge(lang)
                if (badgeText.isNotBlank()) {
                    Text(
                        text = badgeText,
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            letterSpacing = 0.4.sp
                        ),
                        color = colors.accent
                    )
                } else {
                    Spacer(modifier = Modifier.width(1.dp))
                }

                // Easy-Touch Close (X) button
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
                        modifier = Modifier.size(18.dp),
                        tint = colors.textSecondary.copy(alpha = 0.8f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            // Title (Max 1 line locked)
            Text(
                text = card.getLocalizedTitle(lang),
                style = MaterialTheme.typography.titleMedium.copy(
                    fontFamily = ff,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp,
                    lineHeight = 19.sp
                ),
                color = colors.textPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            // Description (Max 3 lines)
            val desc = card.getLocalizedDescription(lang)
            if (desc.isNotBlank()) {
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = desc,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontFamily = ff,
                        fontWeight = FontWeight.Normal,
                        fontSize = 12.5.sp,
                        lineHeight = 17.sp
                    ),
                    color = colors.textSecondary,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Bottom Row: Action or Read More
            val hasAction = card.actionRoute.isNotBlank() || card.actionText.isNotBlank()
            val isLongContent = desc.length > 120 || desc.lines().size > 3

            if (hasAction || isLongContent) {
                Spacer(modifier = Modifier.weight(1f))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (hasAction) {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .clickable(onClick = onAction)
                                .padding(vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(
                                text = card.getLocalizedActionText(lang),
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontFamily = ff,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 12.sp
                                ),
                                color = colors.accent
                            )
                            Icon(
                                imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                                contentDescription = null,
                                modifier = Modifier.size(12.dp),
                                tint = colors.accent
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.width(1.dp))
                    }

                    if (isLongContent) {
                        Text(
                            text = K.readMore.tr(lang),
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontFamily = ff,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.5.sp
                            ),
                            color = colors.accent,
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .clickable(onClick = onExpand)
                                .padding(horizontal = 4.dp, vertical = 2.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * Full details bottom sheet modal when user expands a card.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeatureCardDetailBottomSheet(
    card: FeatureCard,
    colors: HomeColors,
    lang: String,
    onDismissRequest: () -> Unit,
    onAction: () -> Unit
) {
    val ff = LocalAppFontFamily.current
    val message = card.getLocalizedMessage(lang)
    val typeStr = card.getLocalizedBadge(lang)
    val symbol = "✦"
    val hasAction = card.actionRoute.isNotBlank() || card.actionText.isNotBlank()

    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        containerColor = colors.surface,
        contentColor = colors.textPrimary,
        scrimColor = Color.Black.copy(alpha = 0.45f),
        dragHandle = {
            BottomSheetDefaults.DragHandle(
                color = colors.textSecondary.copy(alpha = 0.3f),
                width = 36.dp,
                height = 4.dp
            )
        }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 24.dp, end = 24.dp, top = 4.dp, bottom = 28.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Monochrome Type Badge with Sparkle Symbol
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(colors.textPrimary.copy(alpha = 0.08f))
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = symbol,
                    style = androidx.compose.ui.text.TextStyle(
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold
                    ),
                    color = colors.textPrimary,
                    modifier = Modifier.offset(y = (-0.5).dp)
                )
                Text(
                    text = typeStr,
                    style = androidx.compose.ui.text.TextStyle(
                        fontFamily = ff,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 11.sp,
                        letterSpacing = 0.2.sp
                    ),
                    color = colors.textPrimary
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Full Message Content (Rendered only once without repetition)
            Text(
                text = message,
                style = androidx.compose.ui.text.TextStyle(
                    fontFamily = ff,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Normal,
                    lineHeight = 22.sp
                ),
                color = colors.textPrimary
            )

            // Edge-to-Edge Centered Subtle Monochrome Open Button
            if (hasAction) {
                Spacer(modifier = Modifier.height(20.dp))
                Button(
                    onClick = onAction,
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.textPrimary.copy(alpha = 0.08f),
                        contentColor = colors.textPrimary
                    ),
                    elevation = null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Text(
                        text = K.open.tr(lang),
                        style = androidx.compose.ui.text.TextStyle(
                            fontFamily = ff,
                            fontSize = 14.5.sp,
                            fontWeight = FontWeight.SemiBold
                        ),
                        color = colors.textPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                        contentDescription = K.open.tr(lang),
                        tint = colors.textPrimary,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

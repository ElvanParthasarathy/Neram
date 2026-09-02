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
            HorizontalPager(
                state = pagerState,
                modifier = Modifier.fillMaxWidth(),
                pageSpacing = 10.dp
            ) { page ->
                val card = cards.getOrNull(page)
                if (card != null) {
                    ElvanTipsCard(
                        card = card,
                        colors = colors,
                        lang = lang,
                        onDismiss = { onDismiss(card.id) },
                        onAction = { onAction(card.actionRoute) },
                        onExpand = { selectedDetailCard = card }
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
                .fillMaxWidth()
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
                        text = if (lang == "en") badgeText.uppercase() else badgeText,
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

                // Simple Close (X) button
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(CircleShape)
                        .clickable(onClick = onDismiss),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Close,
                        contentDescription = K.dismiss.tr(lang),
                        modifier = Modifier.size(15.dp),
                        tint = colors.textSecondary.copy(alpha = 0.6f)
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

            // Description (Max 2 lines locked)
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
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Bottom Row: Action or Read More
            val hasAction = card.actionRoute.isNotBlank() || card.actionText.isNotBlank()
            val isLongContent = desc.length > 70 || desc.contains("\n")

            if (hasAction || isLongContent) {
                Spacer(modifier = Modifier.height(8.dp))
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

    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
        containerColor = colors.surface,
        contentColor = colors.textPrimary,
        scrimColor = Color.Black.copy(alpha = 0.5f)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Top Badge
            val badgeText = card.getLocalizedBadge(lang)
            if (badgeText.isNotBlank()) {
                Text(
                    text = if (lang == "en") badgeText.uppercase() else badgeText,
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        letterSpacing = 0.5.sp
                    ),
                    color = colors.accent,
                    modifier = Modifier.padding(bottom = 6.dp)
                )
            }

            // Full Title
            Text(
                text = card.getLocalizedTitle(lang),
                style = MaterialTheme.typography.titleLarge.copy(
                    fontFamily = ff,
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    lineHeight = 26.sp
                ),
                color = colors.textPrimary
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Full Description
            val desc = card.getLocalizedDescription(lang)
            if (desc.isNotBlank()) {
                Text(
                    text = desc,
                    style = MaterialTheme.typography.bodyLarge.copy(
                        fontFamily = ff,
                        fontWeight = FontWeight.Normal,
                        fontSize = 15.sp,
                        lineHeight = 22.sp
                    ),
                    color = colors.textSecondary
                )
            }

            // Action Button inside bottom sheet
            val hasAction = card.actionRoute.isNotBlank() || card.actionText.isNotBlank()
            if (hasAction) {
                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = onAction,
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.accent,
                        contentColor = Color.White
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = card.getLocalizedActionText(lang),
                        style = MaterialTheme.typography.labelLarge.copy(
                            fontFamily = ff,
                            fontWeight = FontWeight.Bold
                        ),
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

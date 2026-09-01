package com.elvan.neram.ui.home.components

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
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.data.model.FeatureCard
import com.elvan.neram.ui.home.HomeColors
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage

/**
 * Simple Banner / Tips Carousel
 */
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

    if (cards.size == 1) {
        val card = cards.first()
        ElvanTipsCard(
            card = card,
            colors = colors,
            lang = lang,
            onDismiss = { onDismiss(card.id) },
            onAction = { onAction(card.actionRoute) },
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
                        onAction = { onAction(card.actionRoute) }
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
}

/**
 * Simple Banner Card (Standard Neram Surface Card)
 */
@Composable
fun ElvanTipsCard(
    card: FeatureCard,
    colors: HomeColors,
    lang: String,
    onDismiss: () -> Unit,
    onAction: () -> Unit,
    modifier: Modifier = Modifier
) {
    val ff = LocalAppFontFamily.current
    val isDark = colors.isDark

    Surface(
        modifier = modifier.fillMaxWidth(),
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
                if (card.badge.isNotBlank()) {
                    Text(
                        text = card.badge.uppercase(),
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
                        contentDescription = "Dismiss",
                        modifier = Modifier.size(15.dp),
                        tint = colors.textSecondary.copy(alpha = 0.6f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Title
            Text(
                text = card.getLocalizedTitle(lang),
                style = MaterialTheme.typography.titleMedium.copy(
                    fontFamily = ff,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.5.sp,
                    lineHeight = 20.sp
                ),
                color = colors.textPrimary
            )

            // Description
            val desc = card.getLocalizedDescription(lang)
            if (desc.isNotBlank()) {
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = desc,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontFamily = ff,
                        fontWeight = FontWeight.Normal,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    ),
                    color = colors.textSecondary
                )
            }

            // Action Button
            if (card.actionRoute.isNotBlank() || card.actionText.isNotBlank()) {
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(50))
                        .clickable(onClick = onAction)
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = card.getLocalizedActionText(lang),
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontFamily = ff,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 12.5.sp
                        ),
                        color = colors.accent
                    )
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.ArrowForward,
                        contentDescription = null,
                        modifier = Modifier.size(13.dp),
                        tint = colors.accent
                    )
                }
            }
        }
    }
}

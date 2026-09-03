package com.elvan.neram.ui.calendar

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.material3.ripple
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.elvan.neram.ui.home.HomeColors
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.toMozhiName
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import kotlinx.coroutines.launch
import java.time.Month
import java.time.YearMonth

/**
 * Expressive, modern Month & Year Picker Dialog.
 *
 * Features:
 * - 1:1 real-time finger tracking across years using HorizontalPager.
 * - Month grid physically slides left/right under finger when swiping.
 * - Synchronized animated year header with left/right arrow buttons.
 * - Refined monochrome month tabs (soft tones, not harsh pure black/white).
 * - Animated selection states with spring scale and color morphing.
 * - Fluid selection ripple on month taps.
 * - Instant selection and dismiss on month tap.
 */
@Composable
fun MonthYearPickerDialog(
    visible: Boolean,
    currentMonth: YearMonth,
    onDismissRequest: () -> Unit,
    onMonthYearSelected: (YearMonth) -> Unit,
    colors: HomeColors
) {
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current

    if (visible) {
        val baseYear = currentMonth.year
        val initialPage = 5000
        val pagerState = rememberPagerState(initialPage = initialPage) { 10000 }
        val scope = rememberCoroutineScope()
        var selectedMonth by remember(currentMonth) { mutableStateOf(currentMonth.month) }
        val isDark = colors.surface.luminance() < 0.5f

        val displayedYear = baseYear + (pagerState.currentPage - initialPage)

        Dialog(
            onDismissRequest = onDismissRequest,
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Surface(
                modifier = Modifier
                    .padding(horizontal = 24.dp)
                    .widthIn(max = 336.dp),
                shape = RoundedCornerShape(28.dp),
                color = colors.surface,
                tonalElevation = 6.dp,
                shadowElevation = 10.dp
            ) {
                Column(
                    modifier = Modifier
                        .padding(vertical = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Header: Year Selection with Left/Right Arrows & Animated Transition
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp)
                            .padding(bottom = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Previous Year Button with ripple
                        val prevInteractionSource = remember { MutableInteractionSource() }
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(colors.subtleBackground)
                                .clickable(
                                    interactionSource = prevInteractionSource,
                                    indication = ripple(bounded = true, color = colors.textPrimary)
                                ) {
                                    scope.launch {
                                        pagerState.animateScrollToPage(pagerState.currentPage - 1)
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                                contentDescription = K.previousYear.tr(lang),
                                tint = colors.textPrimary
                            )
                        }

                        // Animated Year Display
                        AnimatedContent(
                            targetState = displayedYear,
                            transitionSpec = {
                                if (targetState > initialState) {
                                    (slideInHorizontally { width -> width } + fadeIn()).togetherWith(
                                        slideOutHorizontally { width -> -width } + fadeOut()
                                    )
                                } else {
                                    (slideInHorizontally { width -> -width } + fadeIn()).togetherWith(
                                        slideOutHorizontally { width -> width } + fadeOut()
                                    )
                                }.using(SizeTransform(clip = false))
                            },
                            label = "year_transition"
                        ) { year ->
                            Text(
                                text = year.toString(),
                                style = MaterialTheme.typography.headlineMedium.copy(
                                    fontFamily = ff,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 24.sp
                                ),
                                color = colors.textPrimary
                            )
                        }

                        // Next Year Button with ripple
                        val nextInteractionSource = remember { MutableInteractionSource() }
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(colors.subtleBackground)
                                .clickable(
                                    interactionSource = nextInteractionSource,
                                    indication = ripple(bounded = true, color = colors.textPrimary)
                                ) {
                                    scope.launch {
                                        pagerState.animateScrollToPage(pagerState.currentPage + 1)
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                contentDescription = K.nextYear.tr(lang),
                                tint = colors.textPrimary
                            )
                        }
                    }

                    // Content: Edge-to-Edge HorizontalPager with 1:1 real-time finger tracking across years
                    HorizontalPager(
                        state = pagerState,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp),
                        contentPadding = PaddingValues(horizontal = 20.dp),
                        pageSpacing = 16.dp,
                        verticalAlignment = Alignment.CenterVertically
                    ) { page ->
                        val pageYear = baseYear + (page - initialPage)
                        val months = Month.values()

                        Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            for (rowIndex in 0..3) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    for (colIndex in 0..2) {
                                        val month = months[rowIndex * 3 + colIndex]
                                        val isSelected = (pageYear == currentMonth.year && month == selectedMonth)

                                        // Subtle pill styling (not flat, compact & refined)
                                        val targetBgColor = if (isSelected) {
                                            if (isDark) Color(0xFFE4E4E7) else Color(0xFF27272A)
                                        } else {
                                            if (isDark) Color(0xFF222226) else Color(0xFFF3F4F6)
                                        }

                                        val targetTextColor = if (isSelected) {
                                            if (isDark) Color(0xFF18181B) else Color(0xFFFAFAFA)
                                        } else {
                                            colors.textPrimary.copy(alpha = 0.88f)
                                        }

                                        val animatedBgColor by animateColorAsState(
                                            targetValue = targetBgColor,
                                            animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
                                            label = "month_bg"
                                        )
                                        val animatedTextColor by animateColorAsState(
                                            targetValue = targetTextColor,
                                            animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
                                            label = "month_text"
                                        )

                                        val interactionSource = remember { MutableInteractionSource() }
                                        val rippleColor = if (isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f)

                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .height(36.dp)
                                                .clip(RoundedCornerShape(50))
                                                .background(animatedBgColor)
                                                .clickable(
                                                    interactionSource = interactionSource,
                                                    indication = ripple(bounded = true, color = rippleColor)
                                                ) {
                                                    selectedMonth = month
                                                    onMonthYearSelected(YearMonth.of(pageYear, month))
                                                    onDismissRequest()
                                                },
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = month.toMozhiName(lang, isShort = true),
                                                color = animatedTextColor,
                                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                                fontSize = 13.sp,
                                                fontFamily = ff
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Footer: Action Buttons (Kept original colors as requested)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Cancel Button (Kept original subtle background & textSecondary)
                        val cancelInteractionSource = remember { MutableInteractionSource() }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(40.dp)
                                .clip(RoundedCornerShape(50))
                                .background(colors.subtleBackground)
                                .clickable(
                                    interactionSource = cancelInteractionSource,
                                    indication = ripple(bounded = true, color = colors.textSecondary)
                                ) { onDismissRequest() },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = K.cancel.tr(lang),
                                color = colors.textSecondary,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp,
                                fontFamily = ff
                            )
                        }

                        // OK Button (Kept original accent background & white text)
                        val okInteractionSource = remember { MutableInteractionSource() }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(40.dp)
                                .clip(RoundedCornerShape(50))
                                .background(colors.accent)
                                .clickable(
                                    interactionSource = okInteractionSource,
                                    indication = ripple(bounded = true, color = Color.White.copy(alpha = 0.3f))
                                ) {
                                    onMonthYearSelected(YearMonth.of(displayedYear, selectedMonth))
                                    onDismissRequest()
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = K.ok.tr(lang),
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                fontFamily = ff
                            )
                        }
                    }
                }
            }
        }
    }
}

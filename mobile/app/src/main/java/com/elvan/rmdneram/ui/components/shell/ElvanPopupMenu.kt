package com.elvan.rmdneram.ui.components.shell

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupProperties
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.theme.LocalAppFontFamily
import kotlinx.coroutines.delay

/**
 * Pixel-perfect reproduction of Flutter Niril's ElvanPopupMenu
 * (from elvan_maeladukku_pattiyal.dart).
 *
 * Spawns directly on top of the 3-dot icon button, scales from 20% to 100%
 * with an easeOutCubic curve anchored at the top-right corner, and uses
 * frosted translucent glass styling with 24dp rounded corners.
 */
class ElvanPopupMenuItem(
    val title: String,
    val icon: ImageVector,
    val onClick: () -> Unit
)

@Composable
fun ElvanPopupMenu(
    expanded: Boolean,
    onDismissRequest: () -> Unit,
    colors: HomeColors,
    items: List<ElvanPopupMenuItem>,
    modifier: Modifier = Modifier
) {
    if (!expanded) return

    val isDark = colors.isDark || colors.background == Color.Black || colors.background.red < 0.2f
    val sharedRippleColor = if (isDark) Color.White.copy(alpha = 0.15f) else Color.Black.copy(alpha = 0.05f)

    var isVisible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        isVisible = true
    }

    val animProgress by animateFloatAsState(
        targetValue = if (isVisible) 1.0f else 0.0f,
        animationSpec = tween(150, easing = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)),
        label = "popupAnim"
    )

    Popup(
        alignment = Alignment.TopEnd,
        offset = IntOffset(x = 8, y = -16),
        onDismissRequest = onDismissRequest,
        properties = PopupProperties(
            focusable = true,
            dismissOnClickOutside = true,
            dismissOnBackPress = true
        )
    ) {
        Box(
            modifier = modifier
                .graphicsLayer {
                    scaleX = 0.2f + (0.8f * animProgress)
                    scaleY = 0.2f + (0.8f * animProgress)
                    transformOrigin = TransformOrigin(1f, 0f) // Anchored at top-right
                    alpha = animProgress
                }
                .cssShadow(
                    color = Color.Black,
                    alpha = 0.05f,
                    blurRadius = 16.dp,
                    offsetY = 4.dp
                )
                .background(
                    color = (if (isDark) Color(0xFF1E1E1E) else Color(0xFFFFFFFF)).copy(alpha = 0.88f),
                    shape = RoundedCornerShape(24.dp)
                )
                .border(
                    width = 0.5.dp,
                    color = if (isDark) Color(0xFF333333).copy(alpha = 0.15f)
                            else Color(0xFFFFFFFF).copy(alpha = 0.6f),
                    shape = RoundedCornerShape(24.dp)
                )
                .width(IntrinsicSize.Max)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth()
            ) {
                items.forEachIndexed { index, item ->
                    val isFirst = index == 0
                    val isLast = index == items.size - 1
                    val shape = when {
                        isFirst && isLast -> RoundedCornerShape(24.dp)
                        isFirst -> RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
                        isLast -> RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                        else -> RoundedCornerShape(0.dp)
                    }

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(50.dp)
                            .clip(shape)
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = ripple(color = sharedRippleColor),
                                onClick = {
                                    onDismissRequest()
                                    item.onClick()
                                }
                            )
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.title,
                            tint = if (isDark) Color.White else Color.Black,
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = item.title,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isDark) Color.White else Color.Black,
                            fontFamily = LocalAppFontFamily.current
                        )
                        // Breathing margin on right to ensure comfortable padding
                        Spacer(modifier = Modifier.width(16.dp))
                    }
                }
            }
        }
    }
}

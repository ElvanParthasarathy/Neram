package com.elvan.rmdneram.ui.navigation

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.HomeShapes
import com.elvan.rmdneram.ui.home.HomeTypography

/**
 * Navigation Components - Reusable widgets for Top and Bottom Bars.
 */

@Composable
fun RowScope.NavItem(
    tab: NavTab,
    isSelected: Boolean,
    accentColor: Color,
    inactiveColor: Color,
    selectionBg: Color,
    onClick: () -> Unit
) {
    // CSS: transition: color 0.3s ease
    val iconColor by animateColorAsState(
        targetValue = if (isSelected) accentColor else inactiveColor,
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "iconColor"
    )
    
    // Interaction Scale State
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.9f else 1f,
        animationSpec = spring(stiffness = Spring.StiffnessMedium),
        label = "scale"
    )
    
    Box(
        modifier = Modifier
            .fillMaxHeight()
            .weight(1f)
            .scale(scale) // Apply press scale effect
            .clip(HomeShapes.Pill) // CSS: --item-radius: 24px -> Pill Style
            // Apply background via then() to mimic CSS behavior
            .then(
                if (isSelected) {
                    Modifier.background(selectionBg)
                } else {
                    Modifier
                }
            )
            .clickable(
                interactionSource = interactionSource,
                indication = null, // No ripple, custom scale effect instead
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = tab.icon,
                contentDescription = tab.label,
                tint = iconColor,
                modifier = Modifier.size(24.dp)
            )
            
            // CSS: .nav-label { font-size: 10px; font-weight: 600 }
            Text(
                text = tab.label,
                color = iconColor,
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.01.sp, // CSS: letter-spacing: 0.01em
                maxLines = 1,
                lineHeight = 10.sp
            )
        }
    }
}

@Composable
fun AppMenuItem(
    icon: ImageVector,
    label: String,
    colors: HomeColors,
    isDestructive: Boolean = false,
    showChevron: Boolean = false,
    onClick: () -> Unit
) {
    // Pill Section Style
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp) // Section separation
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(HomeShapes.Pill) // Pill Shape
                .clickable(onClick = onClick)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isDestructive) colors.danger else colors.textPrimary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(10.dp))
            Text(
                text = label,
                style = HomeTypography.PillTitle,
                color = if (isDestructive) colors.danger else colors.textPrimary,
                fontWeight = FontWeight.Medium
            )
            if (showChevron) {
                Spacer(modifier = Modifier.width(8.dp))
                Icon(
                    Icons.Outlined.ChevronRight,
                    null,
                    tint = colors.textSecondary,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun AppThemeMenuItem(
    icon: ImageVector,
    label: String,
    colors: HomeColors,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(HomeShapes.Pill)
                .background(if (isSelected) colors.accent.copy(alpha = 0.1f) else Color.Transparent)
                .clickable(onClick = onClick)
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) colors.accent else colors.textPrimary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = label,
                style = HomeTypography.PillTitle,
                color = if (isSelected) colors.accent else colors.textPrimary,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.weight(1f)
            )
            if (isSelected) {
                Icon(
                    Icons.Default.Check,
                    null,
                    tint = colors.accent,
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}

@Composable
fun MenuDivider(colors: HomeColors) {
    HorizontalDivider(
        modifier = Modifier.padding(vertical = 4.dp),
        color = colors.glassBorder.copy(alpha = 0.5f),
        thickness = 0.5.dp
    )
}

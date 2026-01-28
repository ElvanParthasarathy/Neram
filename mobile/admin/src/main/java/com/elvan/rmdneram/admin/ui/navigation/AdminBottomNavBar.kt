package com.elvan.rmdneram.admin.ui.navigation

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.admin.ui.home.rememberHomeColors

enum class AdminNavTab(val icon: ImageVector, val label: String) {
    Home(CustomIcons.Home, "Home"),
    Schedule(CustomIcons.Clock, "Schedule"),
    Profile(CustomIcons.User, "Profile")
}

@Composable
fun AdminBottomNavBar(
    selectedTab: AdminNavTab,
    onTabSelected: (AdminNavTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val colors = rememberHomeColors()
    val accentColor = colors.accent
    val inactiveColor = colors.textSecondary
    val selectionBg = colors.subtleBackground

    Box(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .padding(bottom = 24.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight()
                    .clip(RoundedCornerShape(28.dp))
                    .background(colors.surface)
                    .border(1.dp, colors.glassBorder, RoundedCornerShape(28.dp))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                AdminNavTab.entries.forEach { tab ->
                    NavItem(
                        tab = tab,
                        isSelected = selectedTab == tab,
                        accentColor = accentColor,
                        inactiveColor = inactiveColor,
                        selectionBg = selectionBg,
                        onClick = { onTabSelected(tab) }
                    )
                }
            }
        }
    }
}

@Composable
private fun RowScope.NavItem(
    tab: AdminNavTab,
    isSelected: Boolean,
    accentColor: Color,
    inactiveColor: Color,
    selectionBg: Color,
    onClick: () -> Unit
) {
    val iconColor by animateColorAsState(
        targetValue = if (isSelected) accentColor else inactiveColor,
        animationSpec = spring(stiffness = Spring.StiffnessLow),
        label = "iconColor"
    )
    
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
            .scale(scale)
            .clip(RoundedCornerShape(24.dp))
            .then(
                if (isSelected) {
                    Modifier.background(selectionBg)
                } else {
                    Modifier
                }
            )
            .clickable(
                interactionSource = interactionSource,
                indication = null,
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
            
            Text(
                text = tab.label,
                color = iconColor,
                fontSize = 10.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 0.01.sp,
                maxLines = 1,
                lineHeight = 10.sp
            )
        }
    }
}

object CustomIcons {
    val Home: ImageVector
        get() = ImageVector.Builder(
            name = "Home",
            defaultWidth = 24.dp, defaultHeight = 24.dp,
            viewportWidth = 24f, viewportHeight = 24f
        ).addPath(
            fill = SolidColor(Color.Black),
            pathData = androidx.compose.ui.graphics.vector.PathParser().parsePathString(
                "M21.71,11.29l-9-9a1,1,0,0,0-1.42,0l-9,9a1,1,0,0,0-.21,1.09A1,1,0,0,0,3,13H4v7.3A1.77,1.77,0,0,0,5.83,22H8.5a1,1,0,0,0,1-1V16.1a1,1,0,0,1,1-1h3a1,1,0,0,1,1,1V21a1,1,0,0,0,1,1h2.67A1.77,1.77,0,0,0,20,20.3V13h1a1,1,0,0,0,.92-.62A1,1,0,0,0,21.71,11.29Z"
            ).toNodes()
        ).build()

    val Clock: ImageVector
        get() = ImageVector.Builder(
            name = "Clock",
            defaultWidth = 24.dp, defaultHeight = 24.dp,
            viewportWidth = 24f, viewportHeight = 24f
        ).addPath(
            fill = SolidColor(Color.Black),
            pathFillType = androidx.compose.ui.graphics.PathFillType.EvenOdd,
            pathData = androidx.compose.ui.graphics.vector.PathParser().parsePathString(
                "M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12zm11-5a1 1 0 1 0-2 0v3.764a3 3 0 0 0 1.658 2.683l2.895 1.447a1 1 0 1 0 .894-1.788l-2.894-1.448a1 1 0 0 1-.553-.894V7z"
            ).toNodes()
        ).build()

    val User: ImageVector
        get() = ImageVector.Builder(
            name = "User",
            defaultWidth = 24.dp, defaultHeight = 24.dp,
            viewportWidth = 24f, viewportHeight = 24f
        ).addPath(
            fill = SolidColor(Color.Black),
            pathFillType = androidx.compose.ui.graphics.PathFillType.EvenOdd,
            pathData = androidx.compose.ui.graphics.vector.PathParser().parsePathString(
                "M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
            ).toNodes()
        ).build()
}

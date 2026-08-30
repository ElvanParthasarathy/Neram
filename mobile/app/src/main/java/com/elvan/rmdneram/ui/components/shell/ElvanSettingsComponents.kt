package com.elvan.rmdneram.ui.components.shell

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.home.rememberHomeColors
import com.elvan.rmdneram.ui.theme.LocalAppFontFamily

/**
 * ElvanSettingsSection — Groups rows inside a single rounded card with slit dividers.
 * Mirrors Flutter's `ElvanSettingsSection` exactly.
 *
 * Card background: #111111 (Dark) / #FFFFFF (Light)
 * Border Radius: 24.dp (or custom)
 */
@Composable
fun ElvanSettingsSection(
    modifier: Modifier = Modifier,
    title: String? = null,
    borderRadius: Dp = 24.dp,
    cardColor: Color? = null,
    colors: HomeColors = rememberHomeColors(),
    content: @Composable ColumnScope.() -> Unit
) {
    val isDark = colors.isDark
    val finalCardColor = cardColor ?: if (isDark) Color(0xFF111111) else Color.White

    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.Start
    ) {
        if (title != null) {
            val ff = LocalAppFontFamily.current
            Text(
                text = title.uppercase(),
                style = TextStyle(
                    fontFamily = ff,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.5.sp
                ),
                color = colors.textPrimary.copy(alpha = 0.5f),
                modifier = Modifier.padding(start = 20.dp, bottom = 8.dp)
            )
        }

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(borderRadius)),
            shape = RoundedCornerShape(borderRadius),
            color = finalCardColor,
            shadowElevation = 0.dp
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                content = content
            )
        }
    }
}

/**
 * ElvanSettingsRow — A single settings item with circular monochrome icon, title, and description.
 * Mirrors Flutter's `ElvanSettingsRow` exactly.
 *
 * Padding: 16.dp horizontal, 16.dp vertical
 * Icon: 36.dp circle with monochrome background (#FFFFFF 8% in dark, #000000 6% in light)
 * Icon tint: onSurface / textPrimary (Monochrome)
 * Title: 15.sp, FontWeight.Medium
 * Description: 12.sp, textSecondary (onSurface 50%)
 */
@Composable
fun ElvanSettingsRow(
    title: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    iconWidget: (@Composable () -> Unit)? = null,
    description: String? = null,
    customTrailing: (@Composable () -> Unit)? = null,
    iconBgColor: Color? = null,
    iconTint: Color? = null,
    titleColor: Color? = null,
    descColor: Color? = null,
    colors: HomeColors = rememberHomeColors()
) {
    val isDark = colors.isDark
    val defaultIconBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
    val defaultIconTint = iconTint ?: (titleColor ?: colors.textPrimary)
    val ff = LocalAppFontFamily.current
    val rippleColor = if (isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = ripple(color = rippleColor, bounded = true),
                onClick = onClick
            ),
        color = Color.Transparent
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Circular icon container — 36px, monochrome background
            if (icon != null || iconWidget != null) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(iconBgColor ?: defaultIconBg),
                    contentAlignment = Alignment.Center
                ) {
                    if (iconWidget != null) {
                        iconWidget()
                    } else if (icon != null) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = defaultIconTint,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.width(16.dp))
            }

            // Title + Description
            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = title,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        lineHeight = 20.sp
                    ),
                    color = titleColor ?: colors.textPrimary
                )
                if (!description.isNullOrEmpty()) {
                    Text(
                        text = description,
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Normal,
                            lineHeight = 16.sp
                        ),
                        color = descColor ?: colors.textPrimary.copy(alpha = 0.5f),
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }

            if (customTrailing != null) {
                Spacer(modifier = Modifier.width(12.dp))
                customTrailing()
            }
        }
    }
}

/**
 * ElvanSettingsDivider — A slit line divider between settings rows matching Flutter.
 * Color: Colors.white.withAlpha(0.04) (Dark) / Colors.black.withAlpha(0.04) (Light)
 * Indent: 16.dp start, 20.dp end
 */
@Composable
fun ElvanSettingsDivider(
    modifier: Modifier = Modifier,
    indent: Dp = 16.dp,
    endIndent: Dp = 20.dp,
    colors: HomeColors = rememberHomeColors()
) {
    val isDark = colors.isDark
    val dividerColor = if (isDark) Color.White.copy(alpha = 0.04f) else Color.Black.copy(alpha = 0.04f)

    HorizontalDivider(
        modifier = modifier.padding(start = indent, end = endIndent),
        thickness = 1.dp,
        color = dividerColor
    )
}

/**
 * ElvanSettingsSwitch — Monochrome switch matching Flutter's `ElvanSettingsSwitch`.
 */
@Composable
fun ElvanSettingsSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    colors: HomeColors = rememberHomeColors()
) {
    val isDark = colors.isDark
    Switch(
        checked = checked,
        onCheckedChange = onCheckedChange,
        modifier = modifier,
        colors = SwitchDefaults.colors(
            checkedThumbColor = if (isDark) Color(0xFF111111) else Color.White,
            checkedTrackColor = if (isDark) Color.White else Color.Black,
            uncheckedThumbColor = if (isDark) Color.White.copy(alpha = 0.6f) else Color.Black.copy(alpha = 0.6f),
            uncheckedTrackColor = if (isDark) Color.White.copy(alpha = 0.1f) else Color.Black.copy(alpha = 0.1f),
            checkedBorderColor = Color.Transparent,
            uncheckedBorderColor = Color.Transparent
        )
    )
}

/**
 * ElvanProfilePillCard — Big Pill Profile Card (borderRadius: 999.dp) matching Flutter Settings Hub.
 */
@Composable
fun ElvanProfilePillCard(
    title: String,
    subtitle: String,
    photoUrl: String?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    colors: HomeColors = rememberHomeColors()
) {
    val isDark = colors.isDark
    val cardColor = if (isDark) Color(0xFF111111) else Color.White
    val avatarBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)
    val ff = LocalAppFontFamily.current
    val rippleColor = if (isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(999.dp))
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = ripple(color = rippleColor, bounded = true),
                onClick = onClick
            ),
        shape = RoundedCornerShape(999.dp),
        color = cardColor,
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Circular Avatar (56dp)
            Surface(
                shape = CircleShape,
                color = avatarBg,
                modifier = Modifier.size(56.dp)
            ) {
                if (!photoUrl.isNullOrEmpty()) {
                    AsyncImage(
                        model = ImageRequest.Builder(LocalContext.current)
                            .data(photoUrl)
                            .crossfade(true)
                            .build(),
                        contentDescription = "Profile",
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Filled.Person,
                            contentDescription = null,
                            tint = colors.textPrimary,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = title,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                        lineHeight = 22.sp
                    ),
                    color = colors.textPrimary
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = subtitle,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    ),
                    color = colors.textPrimary.copy(alpha = 0.5f),
                    maxLines = 1
                )
            }
        }
    }
}

/**
 * ElvanRadioSettingsRow — A row with title and checkmark matching Flutter's `ElvanRadioSettingsRow`.
 */
@Composable
fun <T> ElvanRadioSettingsRow(
    title: String,
    value: T,
    groupValue: T?,
    onSelected: (T) -> Unit,
    modifier: Modifier = Modifier,
    colors: HomeColors = rememberHomeColors()
) {
    val isDark = colors.isDark
    val isSelected = value == groupValue
    val ff = LocalAppFontFamily.current
    val rippleColor = if (isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = ripple(color = rippleColor, bounded = true),
                onClick = { onSelected(value) }
            ),
        color = Color.Transparent
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                style = TextStyle(
                    fontFamily = ff,
                    fontSize = 16.sp,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                    lineHeight = 21.sp
                ),
                color = colors.textPrimary,
                modifier = Modifier.weight(1f)
            )

            if (isSelected) {
                Icon(
                    imageVector = Icons.Filled.Check,
                    contentDescription = null,
                    tint = colors.textPrimary,
                    modifier = Modifier.size(24.dp)
                )
            } else {
                Spacer(modifier = Modifier.size(24.dp))
            }
        }
    }
}


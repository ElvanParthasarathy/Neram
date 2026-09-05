package com.elvan.neram.ui.components.shell

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material3.*
import androidx.compose.material3.ripple
import android.os.Build
import android.view.ViewParent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.window.DialogWindowProvider
import androidx.core.view.WindowCompat
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.elvan.neram.ui.home.HomeColors
import com.elvan.neram.ui.home.rememberHomeColors
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr

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
 * ElvanSettingsSwitch — One UI Blue switch matching One UI style.
 */
@Composable
fun ElvanSettingsSwitch(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    colors: HomeColors = rememberHomeColors()
) {
    val isDark = colors.isDark
    Switch(
        checked = checked,
        onCheckedChange = onCheckedChange,
        enabled = enabled,
        modifier = modifier,
        colors = SwitchDefaults.colors(
            checkedThumbColor = Color.White,
            checkedTrackColor = colors.accent,
            uncheckedThumbColor = if (isDark) Color.White.copy(alpha = 0.6f) else Color.Black.copy(alpha = 0.6f),
            uncheckedTrackColor = if (isDark) Color.White.copy(alpha = 0.1f) else Color.Black.copy(alpha = 0.1f),
            disabledCheckedThumbColor = Color.White.copy(alpha = 0.6f),
            disabledCheckedTrackColor = (if (isDark) Color.White else Color.Black).copy(alpha = 0.15f),
            disabledUncheckedThumbColor = (if (isDark) Color.White else Color.Black).copy(alpha = 0.3f),
            disabledUncheckedTrackColor = (if (isDark) Color.White else Color.Black).copy(alpha = 0.06f),
            checkedBorderColor = Color.Transparent,
            uncheckedBorderColor = Color.Transparent,
            disabledCheckedBorderColor = Color.Transparent,
            disabledUncheckedBorderColor = Color.Transparent
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
                        contentDescription = K.profile.tr(LocalAppLanguage.current),
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
    description: String? = null,
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
                .padding(horizontal = 16.dp, vertical = if (description != null) 12.dp else 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = title,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 16.sp,
                        fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                        lineHeight = 21.sp
                    ),
                    color = colors.textPrimary
                )
                if (!description.isNullOrEmpty()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = description,
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Normal,
                            lineHeight = 17.sp
                        ),
                        color = colors.textSecondary
                    )
                }
            }

            if (isSelected) {
                Icon(
                    imageVector = Icons.Filled.Check,
                    contentDescription = null,
                    tint = colors.accent,
                    modifier = Modifier.size(24.dp)
                )
            } else {
                Spacer(modifier = Modifier.size(24.dp))
            }
        }
    }
}

/**
 * ElvanSettingsAnimatedExpand — Smoothly expands and collapses between read-only display and edit modes
 * using the native vertical expand and fade transitions.
 */
@Composable
fun ElvanSettingsAnimatedExpand(
    isEditing: Boolean,
    modifier: Modifier = Modifier,
    displayContent: @Composable () -> Unit,
    editContent: @Composable () -> Unit
) {
    Column(modifier = modifier.fillMaxWidth()) {
        AnimatedVisibility(
            visible = !isEditing,
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            displayContent()
        }
        AnimatedVisibility(
            visible = isEditing,
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            editContent()
        }
    }
}

/**
 * ElvanSettingsDisplayRow — Read-only state showing title label, primary value, optional subtitle, and circular edit button.
 * Mirrors Flutter's `ElvanSettingsDisplayRow` exactly.
 *
 * Padding: 16.dp horizontal, 14.dp vertical
 * Title: 14.sp, onSurface 60% alpha
 * Value: 14.sp, FontWeight.Medium
 * Edit button: 40.dp circle with subtle monochrome tint and 20.dp edit icon
 */
@Composable
fun ElvanSettingsDisplayRow(
    title: String,
    primaryValue: String,
    modifier: Modifier = Modifier,
    secondaryValue: String? = null,
    onEdit: (() -> Unit)? = null,
    onTap: (() -> Unit)? = null,
    icon: ImageVector = Icons.Rounded.Edit,
    iconColor: Color? = null,
    primaryWidget: (@Composable () -> Unit)? = null,
    colors: HomeColors = rememberHomeColors()
) {
    val isDark = colors.isDark
    val ff = LocalAppFontFamily.current
    val rippleColor = if (isDark) Color.White.copy(alpha = 0.16f) else Color.Black.copy(alpha = 0.08f)
    val defaultIconBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)

    Surface(
        modifier = modifier
            .fillMaxWidth()
            .then(
                if (onTap != null) Modifier.clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = ripple(color = rippleColor, bounded = true),
                    onClick = onTap
                ) else Modifier
            ),
        color = Color.Transparent
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(
                modifier = Modifier.weight(1f),
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = title,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Normal,
                        lineHeight = 18.sp
                    ),
                    color = colors.textPrimary.copy(alpha = 0.6f)
                )
                Spacer(modifier = Modifier.height(6.dp))
                if (primaryWidget != null) {
                    primaryWidget()
                    Spacer(modifier = Modifier.height(4.dp))
                }
                if (primaryWidget == null || primaryValue.isNotEmpty()) {
                    Text(
                        text = if (primaryValue.isEmpty()) "-" else primaryValue,
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            lineHeight = 18.sp
                        ),
                        color = colors.textPrimary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                if (!secondaryValue.isNullOrEmpty()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = secondaryValue,
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Normal,
                            lineHeight = 16.sp
                        ),
                        color = colors.textPrimary.copy(alpha = 0.6f),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            if (onEdit != null) {
                Spacer(modifier = Modifier.width(12.dp))
                Surface(
                    shape = CircleShape,
                    color = iconColor?.copy(alpha = 0.1f) ?: defaultIconBg,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = ripple(color = rippleColor, bounded = true),
                            onClick = onEdit
                        )
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        val lang = LocalAppLanguage.current
                        Icon(
                            imageVector = icon,
                            contentDescription = K.edit.tr(lang),
                            tint = iconColor ?: colors.textPrimary.copy(alpha = 0.6f),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

/**
 * ElvanSettingsEditContainer — Tinted container for edit mode forms with Cancel and Save buttons.
 * Mirrors Flutter's `ElvanSettingsEditContainer` exactly.
 */
@Composable
fun ElvanSettingsEditContainer(
    title: String? = null,
    onCancel: () -> Unit,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
    cancelText: String? = null,
    saveText: String? = null,
    colors: HomeColors = rememberHomeColors(),
    content: @Composable ColumnScope.() -> Unit
) {
    val ff = LocalAppFontFamily.current
    val lang = LocalAppLanguage.current
    val effectiveCancel = cancelText ?: K.cancel.tr(lang)
    val effectiveSave = saveText ?: K.save.tr(lang)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.Start
    ) {
        if (!title.isNullOrBlank()) {
            Text(
                text = title,
                style = TextStyle(
                    fontFamily = ff,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                ),
                color = colors.textPrimary
            )
            Spacer(modifier = Modifier.height(16.dp))
        }
        content()
        Spacer(modifier = Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(
                onClick = onCancel,
                shape = RoundedCornerShape(50)
            ) {
                Text(
                    text = effectiveCancel,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    ),
                    color = colors.textPrimary.copy(alpha = 0.7f)
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = onSave,
                shape = RoundedCornerShape(50),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colors.accent,
                    contentColor = Color.White
                ),
                elevation = ButtonDefaults.buttonElevation(0.dp)
            ) {
                Text(
                    text = effectiveSave,
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                )
            }
        }
    }
}

/**
 * ElvanSettingsTextField — Pill-shaped text field with dynamic fill color matching Flutter's `ElvanSettingsTextField`.
 */
@Composable
fun ElvanSettingsTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    prefixText: String? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    singleLine: Boolean = true,
    readOnly: Boolean = false,
    onClick: (() -> Unit)? = null,
    trailingIcon: (@Composable () -> Unit)? = null,
    colors: HomeColors = rememberHomeColors()
) {
    val isDark = colors.isDark
    val ff = LocalAppFontFamily.current
    val fieldBg = if (isDark) Color.White.copy(alpha = 0.08f) else Color.Black.copy(alpha = 0.06f)

    Column(
        modifier = modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.Start
    ) {
        Text(
            text = label,
            style = TextStyle(
                fontFamily = ff,
                fontSize = 12.sp,
                fontWeight = FontWeight.Normal,
                letterSpacing = 0.3.sp
            ),
            color = colors.textPrimary.copy(alpha = 0.5f),
            modifier = Modifier.padding(start = 16.dp, bottom = 8.dp)
        )

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp)
                .clip(RoundedCornerShape(100))
                .then(
                    if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier
                ),
            shape = RoundedCornerShape(100),
            color = fieldBg,
            shadowElevation = 0.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (prefixText != null) {
                    Text(
                        text = prefixText,
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Normal
                        ),
                        color = colors.textPrimary.copy(alpha = 0.6f),
                        modifier = Modifier.padding(end = 4.dp)
                    )
                }

                Box(
                    modifier = Modifier.weight(1f),
                    contentAlignment = Alignment.CenterStart
                ) {
                    if (value.isEmpty() && placeholder.isNotEmpty()) {
                        Text(
                            text = placeholder,
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Normal
                            ),
                            color = colors.textPrimary.copy(alpha = 0.35f)
                        )
                    }

                    if (readOnly) {
                        Text(
                            text = value,
                            style = TextStyle(
                                fontFamily = ff,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Normal
                            ),
                            color = colors.textPrimary,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    } else {
                        BasicTextField(
                            value = value,
                            onValueChange = onValueChange,
                            singleLine = singleLine,
                            keyboardOptions = keyboardOptions,
                            textStyle = TextStyle(
                                fontFamily = ff,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Normal,
                                color = colors.textPrimary
                            ),
                            cursorBrush = SolidColor(colors.textPrimary),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                if (trailingIcon != null) {
                    Spacer(modifier = Modifier.width(8.dp))
                    trailingIcon()
                }
            }
        }
    }
}

/**
 * ElvanActionSheet — Flutter-matching floating action sheet popup.
 * Replicates Flutter's `showElvanActionSheet` from `elvan_cheyal_maeladukku.dart`.
 * Features:
 * - Floating transparent modal sheet with rounded pill surface (32.dp).
 * - Semi-transparent background (alpha 0.75 / 0.85).
 * - 14sp w500 centered title with 0.5 alpha onSurface.
 * - Side-by-side action buttons with 16sp typography.
 * - Respects safe area, navigationBarsPadding, and imePadding.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ElvanActionSheet(
    title: String,
    cancelText: String,
    confirmText: String,
    onDismissRequest: () -> Unit,
    onConfirm: () -> Unit,
    modifier: Modifier = Modifier,
    colors: HomeColors = rememberHomeColors(),
    confirmColor: Color? = null,
    isConfirmFilled: Boolean = false,
    customContent: (@Composable () -> Unit)? = null
) {
    val ff = LocalAppFontFamily.current
    val isDark = colors.isDark
    // Flutter: Color(0xFF151515).withValues(alpha: 0.75) in dark, Colors.white.withValues(alpha: 0.75) in light
    val cardBg = if (isDark) Color(0xFF161616) else Color(0xFFFAFAFA)
    val mainColor = confirmColor ?: colors.textPrimary

    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        shape = RoundedCornerShape(32.dp),
        containerColor = Color.Transparent,
        scrimColor = Color.Black.copy(alpha = 0.45f),
        dragHandle = null
    ) {
        val view = LocalView.current
        SideEffect {
            var current: ViewParent? = view.parent
            while (current != null) {
                if (current is DialogWindowProvider) {
                    val window = current.window
                    WindowCompat.setDecorFitsSystemWindows(window, false)
                    window.navigationBarColor = android.graphics.Color.TRANSPARENT
                    window.statusBarColor = android.graphics.Color.TRANSPARENT
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        window.isNavigationBarContrastEnforced = false
                    }
                    break
                }
                current = current.parent
            }
        }

        Box(
            modifier = modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .imePadding()
                .padding(start = 16.dp, end = 16.dp, bottom = 24.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(32.dp),
                color = cardBg,
                shadowElevation = 2.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 16.dp, end = 16.dp, top = 24.dp, bottom = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Title
                    Text(
                        text = title,
                        style = TextStyle(
                            fontFamily = ff,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        ),
                        color = colors.textPrimary.copy(alpha = 0.5f),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (customContent != null) {
                        Spacer(modifier = Modifier.height(16.dp))
                        customContent()
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Buttons Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Cancel button
                        TextButton(
                            onClick = onDismissRequest,
                            modifier = Modifier
                                .weight(1f)
                                .height(44.dp),
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = cancelText,
                                style = TextStyle(
                                    fontFamily = ff,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.SemiBold
                                ),
                                color = colors.textPrimary.copy(alpha = 0.6f)
                            )
                        }

                        // Confirm button
                        if (isConfirmFilled) {
                            Button(
                                onClick = {
                                    onDismissRequest()
                                    onConfirm()
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp),
                                shape = RoundedCornerShape(50),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = mainColor,
                                    contentColor = Color.White
                                )
                            ) {
                                Text(
                                    text = confirmText,
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                        } else {
                            TextButton(
                                onClick = {
                                    onDismissRequest()
                                    onConfirm()
                                },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(44.dp),
                                shape = RoundedCornerShape(50)
                            ) {
                                Text(
                                    text = confirmText,
                                    style = TextStyle(
                                        fontFamily = ff,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold
                                    ),
                                    color = mainColor
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}



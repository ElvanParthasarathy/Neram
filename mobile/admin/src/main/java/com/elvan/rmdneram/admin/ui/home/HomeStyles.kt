package com.elvan.rmdneram.admin.ui.home

import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Home Screen Dimensions - Matching mobileapp.css
 */
object HomeDimens {
    // Layout - matches --screen-edge-spacing: 24px
    val ContentPadding = 24.dp
    val ContentPaddingBottom = 120.dp
    
    // Header
    val HeaderMarginTop = 20.dp
    val HeaderGap = 8.dp
    
    // Page Title - matches .page-title: font-size: 28px
    val PageTitleSize = 28.sp
    
    // Avatar
    val AvatarSize = 56.dp
    val AvatarBorderWidth = 2.dp
    
    // Cards - matches --item-radius: 24px
    val CardRadius = 28.dp
    val ItemRadius = 24.dp
    val PillRadius = 50.dp // matches border-radius: 50px
    
    // Date Picker - matches .date-input-group: height: 56px
    val DatePillHeight = 56.dp
    val CalendarIconSize = 44.dp // matches .round-calendar-btn: 44px
    
    // Event Pills - matches .event-indicator: width: 4px, height: 38px
    val PillIndicatorWidth = 4.dp
    val PillIndicatorHeight = 38.dp
    
    // Table - matches .schedule-table styling
    val TableRadius = 24.dp
    val TableRowPaddingVertical = 12.dp
    val TableRowPaddingHorizontal = 4.dp
    val TableCol1Width = 40.dp
    
    // Sections - matches gap: 32px in .home-container
    val SectionSpacing = 32.dp
    val ItemSpacing = 12.dp
    
    // Shadows
    val CardElevation = 8.dp
    val PillElevation = 4.dp
    
    // Status Badge - matches .status-badge-small
    val StatusBadgePaddingH = 12.dp
    val StatusBadgePaddingV = 6.dp
    val StatusBadgeRadius = 20.dp
    
    // Message Container - matches .message-container: min-height: 80px
    val MessageContainerMinHeight = 80.dp
}

/**
 * Typography styles for Home Screen - Matching mobileapp.css
 */
object HomeTypography {
    // Page Title - matches .page-title: 28px, font-weight: 800
    val PageTitle = TextStyle(
        fontSize = 28.sp,
        fontWeight = FontWeight.ExtraBold,
        letterSpacing = (-1).sp
    )
    
    // Section Title - matches .section-title: 20px, bold
    val SectionTitle = TextStyle(
        fontSize = 20.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Date Label - matches .input-label
    val DateLabel = TextStyle(
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.5.sp
    )
    
    // Date Display - matches .date-display: 17px, font-weight: 600
    val DateText = TextStyle(
        fontSize = 17.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Calendar Title/Event - matches .calendar-text: 15px
    val PillTitle = TextStyle(
        fontSize = 15.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Calendar Subtext - matches .calendar-subtext: 13px
    val PillTime = TextStyle(
        fontSize = 13.sp,
        fontWeight = FontWeight.Medium
    )
    
    // Status Badge - matches .status-badge-small: 11px, font-weight: 700
    val StatusBadge = TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Exam Card Title - matches .exam-info h3: 18px
    val ExamTitle = TextStyle(
        fontSize = 18.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Exam Card Subtitle - matches .exam-info p: 14px
    val ExamSubtitle = TextStyle(
        fontSize = 14.sp,
        fontWeight = FontWeight.Normal
    )
    
    // Exam Tag - matches .exam-tag: 10px, font-weight: 800
    val ExamTag = TextStyle(
        fontSize = 10.sp,
        fontWeight = FontWeight.ExtraBold,
        letterSpacing = 1.sp
    )
    
    // Exam Meta - matches .exam-meta: 12px
    val ExamMeta = TextStyle(
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Table Header - matches th: 10px
    val TableHeader = TextStyle(
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Hour Cell - matches .cell-hour: 11px
    val CellHour = TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.ExtraBold
    )
    
    // Course Code - matches .course-code: 10px
    val CourseCode = TextStyle(
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Course Name - matches .course-name: 12px
    val CourseName = TextStyle(
        fontSize = 12.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 16.sp
    )
    
    // Faculty - matches .cell-faculty: 11px
    val FacultyName = TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 14.sp
    )
    
    // Message Body - matches .message-body: 15px
    val MessageBody = TextStyle(
        fontSize = 15.sp,
        lineHeight = 22.sp
    )
    
    // Author Badge - matches .last-edited-badge: 11px
    val AuthorBadge = TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Edit Trigger - matches .edit-trigger: 11px
    val EditTrigger = TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.5.sp
    )
    
    // Empty State - matches .calendar-text-empty: 15px, italic
    val EmptyState = TextStyle(
        fontSize = 15.sp,
        fontStyle = FontStyle.Italic
    )
    
    // No Classes Msg - matches .no-classes-msg: 16px
    val NoClassesTitle = TextStyle(
        fontSize = 16.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Info Grid - matches .info-label: 10px
    val InfoLabel = TextStyle(
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Info Value - matches .info-value: 14px
    val InfoValue = TextStyle(
        fontSize = 14.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Admin Badge
    val AdminBadge = TextStyle(
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.5.sp
    )
    
    // Offline Badge
    val OfflineBadge = TextStyle(
        fontSize = 9.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Legacy compat aliases
    val Greeting = PageTitle
    val UserName = PageTitle
    val CardTitle = ExamTitle
    val CardSubtitle = ExamSubtitle
    val CardTag = ExamTag
    val TableCell = CellHour
    val UpdateText = MessageBody
    val AuthorText = AuthorBadge
    val FooterLabel = InfoLabel
    val FooterValue = InfoValue
}

/**
 * Shape constants - Matching mobileapp.css
 */
object HomeShapes {
    val Card = RoundedCornerShape(HomeDimens.CardRadius) // 28dp
    val Item = RoundedCornerShape(HomeDimens.ItemRadius) // 24dp
    val Pill = RoundedCornerShape(HomeDimens.PillRadius) // 50dp
    val Table = RoundedCornerShape(HomeDimens.TableRadius) // 24dp
    val Avatar = CircleShape
    val CalendarIcon = CircleShape
    val SmallChip = RoundedCornerShape(20.dp)
    val AdminBadge = RoundedCornerShape(50.dp) // Pill shaped
    val MetaItem = RoundedCornerShape(12.dp)
    val StatusBadge = RoundedCornerShape(20.dp)
}

/**
 * Dynamic colors that depend on Material Theme - Matching mobileapp.css CSS variables
 */
@Immutable
data class HomeColors(
    // Base colors
    val background: Color,        // --bg-body
    val surface: Color,           // --bg-card
    val accent: Color,            // --accent-primary (#007AFF)
    val textPrimary: Color,       // --text-primary
    val textSecondary: Color,     // --text-secondary
    
    // Borders & Glass
    val border: Color,            // --glass-border
    val glassBorder: Color,       // --glass-border (softer)
    
    // Input & Button backgrounds
    val inputBackground: Color,   // --bg-button-secondary
    val subtleBackground: Color,  // Softer variant
    
    // Status colors
    val danger: Color,            // --accent-danger (#FF3B30)
    val warning: Color,           // Orange for offline
    val success: Color,           // Green for notices
    
    // Misc
    val placeholder: Color,
    val shadow: Color = Color.Black
)

/**
 * CSS Color Constants from mobileapp.css
 * These are the exact hex values from the CSS variables
 */
private object CssColors {
    // === LIGHT MODE === (Default :root)
    object Light {
        val BgBody = Color(0xFFF5F5F7)           // --bg-body: #F5F5F7
        val BgCard = Color(0xFFFFFFFF)           // --bg-card: rgba(255,255,255,0.9) -> solid
        val TextPrimary = Color(0xFF1D1D1F)      // --text-primary: #1D1D1F
        val TextSecondary = Color(0xFF6B7280)    // --text-secondary: #6B7280
        val AccentPrimary = Color(0xFF007AFF)    // --accent-primary: #007AFF
        val AccentDanger = Color(0xFFFF3B30)     // --accent-danger: #FF3B30
        val BgButtonSecondary = Color(0x26787880) // --bg-button-secondary: rgba(120,120,128,0.15)
        val NavSelection = Color(0x1A000000)     // --bg-nav-selection: rgba(0,0,0,0.1)
        val GlassBorder = Color(0x14000000)      // --glass-border: rgba(0,0,0,0.08)
    }
    
    // === DARK MODE === (html.dark :root)
    object Dark {
        val BgBody = Color(0xFF121212)           // --bg-body: #121212
        val BgCard = Color(0xFF1C1C1E)           // --bg-card: rgba(28,28,30,0.8) -> solid
        val TextPrimary = Color(0xFFFFFFFF)      // --text-primary: #FFFFFF
        val TextSecondary = Color(0xFF9CA3AF)    // --text-secondary: #9CA3AF
        val AccentPrimary = Color(0xFF0A84FF)    // --accent-primary: #0A84FF
        val AccentDanger = Color(0xFFFF453A)     // --accent-danger: #FF453A
        val BgButtonSecondary = Color(0x1FFFFFFF) // --bg-button-secondary: rgba(255,255,255,0.12)
        val NavSelection = Color(0xE62C2C2E)     // --bg-nav-selection: rgba(44,44,46,0.9)
        val GlassBorder = Color(0x1AFFFFFF)      // --glass-border: rgba(255,255,255,0.1)
    }
    
    // Shared colors (same in both modes)
    val Warning = Color(0xFFF59E0B)              // Orange warning color
    val Success = Color(0xFF22C55E)              // Green success color
}

@Composable
fun rememberHomeColors(): HomeColors {
    val colorScheme = MaterialTheme.colorScheme
    
    // Detect dark mode based on background luminance
    val isDark = colorScheme.background.luminance() < 0.5f
    
    return remember(isDark) {
        if (isDark) {
            HomeColors(
                background = CssColors.Dark.BgBody,
                surface = CssColors.Dark.BgCard,
                accent = CssColors.Dark.AccentPrimary,
                textPrimary = CssColors.Dark.TextPrimary,
                textSecondary = CssColors.Dark.TextSecondary,
                border = CssColors.Dark.GlassBorder,
                glassBorder = CssColors.Dark.GlassBorder,
                inputBackground = CssColors.Dark.BgButtonSecondary,
                subtleBackground = CssColors.Dark.NavSelection,
                danger = CssColors.Dark.AccentDanger,
                warning = CssColors.Warning,
                success = CssColors.Success,
                placeholder = CssColors.Dark.TextSecondary.copy(alpha = 0.6f),
                shadow = Color.Black.copy(alpha = 0.3f)
            )
        } else {
            HomeColors(
                background = CssColors.Light.BgBody,
                surface = CssColors.Light.BgCard,
                accent = CssColors.Light.AccentPrimary,
                textPrimary = CssColors.Light.TextPrimary,
                textSecondary = CssColors.Light.TextSecondary,
                border = CssColors.Light.GlassBorder,
                glassBorder = CssColors.Light.GlassBorder,
                inputBackground = CssColors.Light.BgButtonSecondary,
                subtleBackground = CssColors.Light.NavSelection,
                danger = CssColors.Light.AccentDanger,
                warning = CssColors.Warning,
                success = CssColors.Success,
                placeholder = CssColors.Light.TextSecondary.copy(alpha = 0.6f),
                shadow = Color.Black.copy(alpha = 0.12f) // CSS: rgba(0,0,0,0.12)
            )
        }
    }
}

/**
 * Check if color is light or dark
 */
private fun Color.luminance(): Float {
    val r = red * 0.2126f
    val g = green * 0.7152f
    val b = blue * 0.0722f
    return r + g + b
}

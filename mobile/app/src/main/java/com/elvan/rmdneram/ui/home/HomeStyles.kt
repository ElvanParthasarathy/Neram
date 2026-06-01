package com.elvan.rmdneram.ui.home

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
import com.elvan.rmdneram.ui.theme.GoogleSansFontFamily
import com.elvan.rmdneram.ui.theme.LocalAppFontFamily

/**
 * Home Screen Dimensions - Matching mobileapp.css
 */
object HomeDimens {
    // Layout - matches --screen-edge-spacing: 24px
    val ContentPadding = 12.dp
    val ContentPaddingBottom = 120.dp
    val ContentPaddingTop = 85.dp // Top padding below status bar
    
    // Common Spacing
    val SpacingXxxs = 2.dp
    val SpacingXs = 4.dp
    val SpacingSm = 6.dp
    val SpacingMd = 8.dp
    val SpacingLg = 12.dp
    val SpacingXl = 16.dp
    val SpacingXxl = 20.dp
    val SpacingXxxl = 24.dp
    val Spacing10 = 10.dp // Special: used in timetable
    
    // Header
    val HeaderMarginTop = 20.dp
    val HeaderGap = 8.dp
    val HeaderPillPadding = 12.dp
    
    // Page Title - matches .page-title: font-size: 28px
    val PageTitleSize = 28.sp
    
    // Avatar / Profile Circle
    val AvatarSize = 56.dp
    val AvatarBorderWidth = 2.dp
    val BorderThin = 1.dp
    val BorderMedium = 2.dp
    val LoaderPadding = 10.dp // Padding for loader inside avatar
    
    // Cards - matches --item-radius: 24px
    val CardRadius = 24.dp // Standardized to 24.dp
    val ItemRadius = 24.dp
    val PillRadius = 50.dp // matches border-radius: 50px
    val BigPillRadius = 100.dp // "Big Pill Shape" for header
    val SmallRadius = 4.dp // Small corner radius for chips/boxes
    val MetaChipRadius = 12.dp
    
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
    
    // Sections - matches gap: reduced to 16px
    val SectionSpacing = 16.dp
    val SectionTitleBottomPadding = 8.dp
    val ItemSpacing = 12.dp
    val DateSectionSpacing = 10.dp
    
    // Shadows
    val CardElevation = 8.dp
    val PillElevation = 4.dp
    val NoElevation = 0.dp
    
    // Status Badge - matches .status-badge-small
    val StatusBadgePaddingH = 12.dp
    val StatusBadgePaddingV = 6.dp
    val StatusBadgeRadius = 20.dp
    
    // Message Container - matches .message-container: min-height: 80px
    val MessageContainerMinHeight = 80.dp
    val SkeletonHeight = 100.dp
    
    // Icons
    val IconSizeSm = 20.dp
    val IconSizeMd = 24.dp
    val RefreshIndicatorSize = 48.dp
    
    // Card Content Padding
    val CardPaddingHorizontal = 20.dp
    val CardPaddingVertical = 16.dp
    
    // Skeleton Placeholder Sizes
    val SkeletonTitleWidth = 100.dp
    val SkeletonTitleHeight = 20.dp
    val SkeletonSubtitleWidth = 150.dp
    val SkeletonSubtitleHeight = 14.dp
    
    // Icon Sizes
    val IconSizeXs = 11.dp
    val IconSizeLg = 26.dp
    val IconSizeXl = 32.dp
    val IconSizeXxl = 40.dp
    
    // Meta Chip
    val MetaChipPaddingH = 7.dp
    val MetaChipPaddingV = 3.dp
    
    // TimetableCard
    val TimetableRowRadius = 20.dp
    val TimetableRowPaddingH = 16.dp
    val TimetableRowPaddingV = 14.dp
    
    // NoClassesCard
    val NoClassesPaddingH = 24.dp
    val NoClassesPaddingV = 40.dp
    
    // Info Grid
    val InfoItemPadding = 12.dp
    
    // Font Sizes
    val FontSizeEmoji = 24.sp
    val FontSizeTitle = 20.sp
    val FontSizeSubtitle = 14.sp
    val FontSizeXs = 10.sp
    val FontSizeXxs = 9.sp
    
    // Line Heights & Letter Spacing
    val LineHeightNormal = 20.sp
    val LetterSpacingSm = 0.5.sp
}

/**
 * Typography styles for Home Screen - Matching mobileapp.css
 * 
 * NOTE: This uses GoogleSansFontFamily as a static default. For Tamil support,
 * use the @Composable rememberHomeTypography() instead, which dynamically
 * selects MuktaMalar for Tamil and Inter for English.
 */
object HomeTypography {
    // Page Title - matches .page-title: 28px, font-weight: 800
    val PageTitle = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 28.sp,
        fontWeight = FontWeight.ExtraBold,
        letterSpacing = (-1).sp
    )
    
    // Section Title - reduced to match DateLabel size (13sp)
    val SectionTitle = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.5.sp
    )
    
    // Date Label - matches .input-label
    val DateLabel = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.5.sp
    )
    
    // Date Display - matches .date-display: 17px, font-weight: 600
    val DateText = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 17.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Calendar Title/Event - matches .calendar-text: 15px
    val PillTitle = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 15.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Calendar Subtext - matches .calendar-subtext: 13px
    val PillTime = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 13.sp,
        fontWeight = FontWeight.Medium
    )
    
    // Status Badge - matches .status-badge-small: 11px, font-weight: 700
    val StatusBadge = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Pill Button - for OK/Cancel in dialogs: 14px, font-weight: 700
    val PillButton = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 14.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Exam Card Title - matches .exam-info h3: 18px
    val ExamTitle = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 18.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Exam Card Subtitle - matches .exam-info p: 14px
    val ExamSubtitle = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 14.sp,
        fontWeight = FontWeight.Normal
    )
    
    // Exam Tag - matches .exam-tag: 10px, font-weight: 800
    val ExamTag = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 10.sp,
        fontWeight = FontWeight.ExtraBold,
        letterSpacing = 1.sp
    )
    
    // Exam Meta - matches .exam-meta: 12px
    val ExamMeta = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 12.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Table Header - matches th: 10px
    val TableHeader = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Hour Cell - matches .cell-hour: 11px
    val CellHour = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 11.sp,
        fontWeight = FontWeight.ExtraBold
    )
    
    // Course Code - matches .course-code: 10px
    val CourseCode = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Course Name - matches .course-name: 12px
    val CourseName = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 12.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 16.sp
    )
    
    // Faculty - matches .cell-faculty: 11px
    val FacultyName = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 11.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 14.sp
    )
    
    // Message Body - matches .message-body: 15px
    val MessageBody = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 15.sp,
        lineHeight = 22.sp
    )
    
    // Author Badge - matches .last-edited-badge: 11px
    val AuthorBadge = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Edit Trigger - matches .edit-trigger: 11px
    val EditTrigger = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.5.sp
    )
    
    // Empty State - matches .calendar-text-empty: 15px, italic
    val EmptyState = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 15.sp,
        fontStyle = FontStyle.Italic
    )
    
    // No Classes Msg - matches .no-classes-msg: 16px
    val NoClassesTitle = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 16.sp,
        fontWeight = FontWeight.SemiBold
    )
    
    // Info Grid - matches .info-label: 10px
    val InfoLabel = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Info Value - matches .info-value: 14px
    val InfoValue = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 14.sp,
        fontWeight = FontWeight.Bold
    )
    
    // Admin Badge
    val AdminBadge = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.5.sp
    )
    
    // Offline Badge
    val OfflineBadge = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 9.sp,
        fontWeight = FontWeight.SemiBold
    )

    // Dialog Title - matches .dialog-title
    val DialogTitle = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 18.sp,
        fontWeight = FontWeight.Bold
    )

    // Dialog Body - matches .dialog-body
    val DialogBody = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 14.sp,
        lineHeight = 20.sp
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
    
    // Additional styles for timetable
    val LabBadge = TextStyle(
        fontFamily = GoogleSansFontFamily,
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.5.sp
    )
    
    val CellTime = TextStyle(
        fontSize = 10.sp,
        fontWeight = FontWeight.Medium
    )

    /**
     * Returns all HomeTypography styles with the given fontFamily applied.
     * Use this to get Tamil-localized styles at the composable call site:
     *   val typo = HomeTypography.localized(LocalAppFontFamily.current)
     *   Text(style = typo.PageTitle, ...)
     */
    fun localized(fontFamily: androidx.compose.ui.text.font.FontFamily) = LocalizedHomeTypography(fontFamily)
}

/**
 * Language-aware HomeTypography that uses the provided font family.
 * Receives MuktaMalar for Tamil or Inter for English from LocalAppFontFamily.
 */
class LocalizedHomeTypography(private val ff: androidx.compose.ui.text.font.FontFamily) {
    val PageTitle get() = HomeTypography.PageTitle.copy(fontFamily = ff)
    val SectionTitle get() = HomeTypography.SectionTitle.copy(fontFamily = ff)
    val DateLabel get() = HomeTypography.DateLabel.copy(fontFamily = ff)
    val DateText get() = HomeTypography.DateText.copy(fontFamily = ff)
    val PillTitle get() = HomeTypography.PillTitle.copy(fontFamily = ff)
    val PillTime get() = HomeTypography.PillTime.copy(fontFamily = ff)
    val StatusBadge get() = HomeTypography.StatusBadge.copy(fontFamily = ff)
    val PillButton get() = HomeTypography.PillButton.copy(fontFamily = ff)
    val ExamTitle get() = HomeTypography.ExamTitle.copy(fontFamily = ff)
    val ExamSubtitle get() = HomeTypography.ExamSubtitle.copy(fontFamily = ff)
    val ExamTag get() = HomeTypography.ExamTag.copy(fontFamily = ff)
    val ExamMeta get() = HomeTypography.ExamMeta.copy(fontFamily = ff)
    val TableHeader get() = HomeTypography.TableHeader.copy(fontFamily = ff)
    val CellHour get() = HomeTypography.CellHour.copy(fontFamily = ff)
    val CourseCode get() = HomeTypography.CourseCode.copy(fontFamily = ff)
    val CourseName get() = HomeTypography.CourseName.copy(fontFamily = ff)
    val FacultyName get() = HomeTypography.FacultyName.copy(fontFamily = ff)
    val MessageBody get() = HomeTypography.MessageBody.copy(fontFamily = ff)
    val AuthorBadge get() = HomeTypography.AuthorBadge.copy(fontFamily = ff)
    val EditTrigger get() = HomeTypography.EditTrigger.copy(fontFamily = ff)
    val EmptyState get() = HomeTypography.EmptyState.copy(fontFamily = ff)
    val NoClassesTitle get() = HomeTypography.NoClassesTitle.copy(fontFamily = ff)
    val InfoLabel get() = HomeTypography.InfoLabel.copy(fontFamily = ff)
    val InfoValue get() = HomeTypography.InfoValue.copy(fontFamily = ff)
    val AdminBadge get() = HomeTypography.AdminBadge.copy(fontFamily = ff)
    val OfflineBadge get() = HomeTypography.OfflineBadge.copy(fontFamily = ff)
    val DialogTitle get() = HomeTypography.DialogTitle.copy(fontFamily = ff)
    val DialogBody get() = HomeTypography.DialogBody.copy(fontFamily = ff)
    val LabBadge get() = HomeTypography.LabBadge.copy(fontFamily = ff)
    val CellTime get() = HomeTypography.CellTime.copy(fontFamily = ff)
    // Legacy aliases
    val Greeting get() = PageTitle
    val UserName get() = PageTitle
    val CardTitle get() = ExamTitle
    val CardSubtitle get() = ExamSubtitle
    val CardTag get() = ExamTag
    val TableCell get() = CellHour
    val UpdateText get() = MessageBody
    val AuthorText get() = AuthorBadge
    val FooterLabel get() = InfoLabel
    val FooterValue get() = InfoValue
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
    val isDark: Boolean,          // Added for component-level logic
    // Base colors
    val background: Color,        // --bg-body
    val surface: Color,           // --bg-card
    val accent: Color,            // --accent-primary (#007AFF)
    val textPrimary: Color,       // --text-primary
    val textSecondary: Color,     // --text-secondary
    
    // Calendar Specific
    val calendarBackground: Color, // Top section
    val calendarBottomBackground: Color, // Bottom section
    
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
    val holiday: Color,
    
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
        
        // Calendar Light
        val CalendarBg = Color.White
        val CalendarBottomBg = Color(0xFFF2F2F7) // Light Gray
    }
    
    // === DARK MODE === (html.dark :root) - Pure black for AMOLED
    object Dark {
        val BgBody = Color.Black                 // Pure black for AMOLED
        val BgCard = Color(0xFF0E0E0E)           // --bg-card: Darker Grey for Home Cards
        val TextPrimary = Color(0xFFFFFFFF)      // --text-primary: #FFFFFF
        val TextSecondary = Color(0xFF9CA3AF)    // --text-secondary: #9CA3AF
        val AccentPrimary = Color(0xFF0A84FF)    // --accent-primary: #0A84FF
        val AccentDanger = Color(0xFFFF453A)     // --accent-danger: #FF453A
        val BgButtonSecondary = Color(0x1FFFFFFF) // --bg-button-secondary: rgba(255,255,255,0.12)
        val NavSelection = Color(0xE62C2C2E)     // --bg-nav-selection: rgba(44,44,46,0.9)
        val GlassBorder = Color(0x1AFFFFFF)      // --glass-border: rgba(255,255,255,0.1)
        
        // Calendar Dark - Pure black for AMOLED
        val CalendarBg = Color.Black
        val CalendarBottomBg = Color(0xFF1C1C1E) // Preserving original Card Grey for Calendar
    }
    
    // Shared colors (same in both modes)
    val Warning = Color(0xFFF59E0B)              // Orange warning color
    val Success = Color(0xFF22C55E)              // Green success color
    val Holiday = Color(0xFF8B5CF6)              // Violet holiday color
}

@Composable
fun rememberHomeColors(): HomeColors {
    val colorScheme = MaterialTheme.colorScheme
    
    // Detect dark mode based on background luminance
    val isDark = colorScheme.background.luminance() < 0.5f
    
    return remember(isDark) {
        if (isDark) {
            HomeColors(
                isDark = true,
                background = CssColors.Dark.BgBody,
                surface = CssColors.Dark.BgCard,
                accent = CssColors.Dark.AccentPrimary,
                textPrimary = CssColors.Dark.TextPrimary,
                textSecondary = CssColors.Dark.TextSecondary,
                calendarBackground = CssColors.Dark.BgBody, // Was CalendarBg (Black)
                calendarBottomBackground = CssColors.Dark.CalendarBottomBg, // Preserved Original Grey
                border = CssColors.Dark.GlassBorder,
                glassBorder = CssColors.Dark.GlassBorder,
                inputBackground = CssColors.Dark.BgButtonSecondary,
                subtleBackground = CssColors.Dark.NavSelection,
                danger = CssColors.Dark.AccentDanger,
                warning = CssColors.Warning,
                success = CssColors.Success,
                holiday = CssColors.Holiday,
                placeholder = CssColors.Dark.TextSecondary.copy(alpha = 0.6f),
                shadow = Color.Black.copy(alpha = 0.3f)
            )
        } else {
            HomeColors(
                isDark = false,
                background = CssColors.Light.BgBody,
                surface = CssColors.Light.BgCard,
                accent = CssColors.Light.AccentPrimary,
                textPrimary = CssColors.Light.TextPrimary,
                textSecondary = CssColors.Light.TextSecondary,
                calendarBackground = CssColors.Light.BgBody, // Was CalendarBg (White)
                calendarBottomBackground = CssColors.Light.BgBody, // Unified with top section (was BgCard)
                border = CssColors.Light.GlassBorder,
                glassBorder = CssColors.Light.GlassBorder,
                inputBackground = CssColors.Light.BgButtonSecondary,
                subtleBackground = CssColors.Light.NavSelection,
                danger = CssColors.Light.AccentDanger,
                warning = CssColors.Warning,
                success = CssColors.Success,
                holiday = CssColors.Holiday,
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

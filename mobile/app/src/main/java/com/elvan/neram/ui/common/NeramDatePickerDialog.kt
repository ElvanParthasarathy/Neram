package com.elvan.neram.ui.common

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Today
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.elvan.neram.ui.mozhiyaakkam.*
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.Month
import java.time.YearMonth

/**
 * Compact, beautifully proportioned Neram Date Picker Dialog.
 * Uses 100% unified Neram localization for weekday names (Sunday to Saturday,
 * including Wednesday as அறி / Arivan and Saturday as காரி / Kaari)
 * and custom month names (சனவரி, பிப்ரவரி, etc.).
 */
@Composable
fun NeramDatePickerDialog(
    initialDate: LocalDate = LocalDate.now(),
    onDateSelected: (LocalDate) -> Unit,
    onDismissRequest: () -> Unit,
    minDate: LocalDate? = null,
    maxDate: LocalDate? = null,
    title: String? = null
) {
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current
    val colors = MaterialTheme.colorScheme

    var displayedMonth by remember { mutableStateOf(YearMonth.from(initialDate)) }
    var tempSelectedDate by remember { mutableStateOf(initialDate) }
    val today = remember { LocalDate.now() }

    // Toggle between Month Calendar view and Year Picker view
    var isYearPickerMode by remember { mutableStateOf(false) }

    // Weekdays ordered Sunday -> Saturday
    val daysOfWeek = remember {
        listOf(DayOfWeek.SUNDAY) + DayOfWeek.values().filter { it != DayOfWeek.SUNDAY }
    }

    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = colors.surface,
            tonalElevation = 6.dp,
            modifier = Modifier
                .widthIn(max = 320.dp)
                .fillMaxWidth(0.88f)
                .wrapContentHeight()
        ) {
            Column(
                modifier = Modifier
                    .padding(horizontal = 16.dp, vertical = 16.dp)
            ) {
                // Top Bar: Month/Year Dropdown Title & Today Quick Action Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    // Month / Year Title with Dropdown Indicator
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .clickable { isYearPickerMode = !isYearPickerMode }
                            .padding(horizontal = 6.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = displayedMonth.toMozhiString(lang, isShort = false),
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontFamily = ff,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = colors.onSurface
                            )
                        )
                        Icon(
                            imageVector = Icons.Default.ArrowDropDown,
                            contentDescription = null,
                            tint = colors.primary,
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    // "Today" Button
                    Surface(
                        shape = RoundedCornerShape(50),
                        color = colors.primary.copy(alpha = 0.12f),
                        modifier = Modifier.clickable {
                            displayedMonth = YearMonth.from(today)
                            tempSelectedDate = today
                            isYearPickerMode = false
                        }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Today,
                                contentDescription = K.today.tr(lang),
                                tint = colors.primary,
                                modifier = Modifier.size(12.dp)
                            )
                            Text(
                                text = K.today.tr(lang),
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontFamily = ff,
                                    fontWeight = FontWeight.Bold,
                                    color = colors.primary,
                                    fontSize = 11.sp
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                AnimatedContent(
                    targetState = isYearPickerMode,
                    label = "PickerModeTransition"
                ) { yearMode ->
                    if (yearMode) {
                        // Year & Month Selection Grid
                        YearMonthPickerGrid(
                            currentYearMonth = displayedMonth,
                            lang = lang,
                            colors = colors,
                            onYearMonthSelected = { ym ->
                                displayedMonth = ym
                                isYearPickerMode = false
                            }
                        )
                    } else {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            // Month Navigation Chevrons Bar
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                IconButton(
                                    onClick = { displayedMonth = displayedMonth.minusMonths(1) },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                                        contentDescription = K.previousMonth.tr(lang),
                                        tint = colors.onSurface.copy(alpha = 0.7f),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }

                                Text(
                                    text = tempSelectedDate.toMozhiFullDate(lang),
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontFamily = ff,
                                        fontWeight = FontWeight.Medium,
                                        color = colors.primary,
                                        fontSize = 11.5.sp
                                    )
                                )

                                IconButton(
                                    onClick = { displayedMonth = displayedMonth.plusMonths(1) },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                        contentDescription = K.nextMonth.tr(lang),
                                        tint = colors.onSurface.copy(alpha = 0.7f),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            // Weekday Headers (ஞா, தி, செ, அறி, வியா, வெள், காரி)
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                daysOfWeek.forEach { day ->
                                    val isSunday = day == DayOfWeek.SUNDAY
                                    val dayLabel = day.toMozhiName(lang, isSingleLetter = true)
                                    Text(
                                        text = dayLabel,
                                        style = MaterialTheme.typography.bodySmall.copy(
                                            fontFamily = ff,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 11.sp,
                                            color = if (isSunday) Color(0xFFE53935) else colors.onSurfaceVariant.copy(alpha = 0.6f),
                                            textAlign = TextAlign.Center
                                        ),
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            // Days Grid
                            val firstDayOfMonth = displayedMonth.atDay(1)
                            val daysInMonth = displayedMonth.lengthOfMonth()
                            val startDayOfWeek = (firstDayOfMonth.dayOfWeek.value % 7) // Sunday = 0

                            val totalCells = ((startDayOfWeek + daysInMonth + 6) / 7) * 7
                            val cellList = (0 until totalCells).map { index ->
                                val dayNum = index - startDayOfWeek + 1
                                if (dayNum in 1..daysInMonth) displayedMonth.atDay(dayNum) else null
                            }

                            Column(modifier = Modifier.fillMaxWidth()) {
                                cellList.chunked(7).forEach { week ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 1.dp),
                                        horizontalArrangement = Arrangement.SpaceAround
                                    ) {
                                        week.forEach { date ->
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .aspectRatio(1f),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                if (date != null) {
                                                    val isSelected = date == tempSelectedDate
                                                    val isCurrentDay = date == today
                                                    val isSunday = date.dayOfWeek == DayOfWeek.SUNDAY
                                                    val isEnabled = (minDate == null || !date.isBefore(minDate)) &&
                                                            (maxDate == null || !date.isAfter(maxDate))

                                                    val cellBg = when {
                                                        isSelected -> colors.primary
                                                        else -> Color.Transparent
                                                    }

                                                    val textColor = when {
                                                        isSelected -> colors.onPrimary
                                                        !isEnabled -> colors.onSurface.copy(alpha = 0.25f)
                                                        isCurrentDay -> colors.primary
                                                        isSunday -> Color(0xFFE53935)
                                                        else -> colors.onSurface
                                                    }

                                                    Box(
                                                        modifier = Modifier
                                                            .size(32.dp)
                                                            .clip(CircleShape)
                                                            .background(cellBg)
                                                            .then(
                                                                if (isCurrentDay && !isSelected) {
                                                                    Modifier.border(1.2.dp, colors.primary, CircleShape)
                                                                } else {
                                                                    Modifier
                                                                }
                                                            )
                                                            .clickable(
                                                                enabled = isEnabled,
                                                                interactionSource = remember { MutableInteractionSource() },
                                                                indication = ripple(bounded = true, radius = 16.dp)
                                                            ) {
                                                                tempSelectedDate = date
                                                            },
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Text(
                                                            text = date.dayOfMonth.toString(),
                                                            style = MaterialTheme.typography.bodyMedium.copy(
                                                                fontFamily = ff,
                                                                fontWeight = if (isSelected || isCurrentDay) FontWeight.Bold else FontWeight.Normal,
                                                                color = textColor,
                                                                fontSize = 12.5.sp
                                                            )
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Action Row (Cancel & Done) - Compact sizing
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismissRequest,
                        shape = RoundedCornerShape(50),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = colors.onSurfaceVariant
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .height(38.dp)
                    ) {
                        Text(
                            text = K.cancel.tr(lang),
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontFamily = ff,
                                fontWeight = FontWeight.Medium,
                                fontSize = 13.sp
                            )
                        )
                    }

                    Button(
                        onClick = {
                            onDateSelected(tempSelectedDate)
                            onDismissRequest()
                        },
                        shape = RoundedCornerShape(50),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = colors.primary,
                            contentColor = colors.onPrimary
                        ),
                        modifier = Modifier
                            .weight(1f)
                            .height(38.dp)
                    ) {
                        Text(
                            text = K.done.tr(lang),
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontFamily = ff,
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                        )
                    }
                }
            }
        }
    }
}

/**
 * Fast Year & Month Picker Grid
 */
@Composable
private fun YearMonthPickerGrid(
    currentYearMonth: YearMonth,
    lang: String,
    colors: ColorScheme,
    onYearMonthSelected: (YearMonth) -> Unit
) {
    val ff = LocalAppFontFamily.current
    var selectedYear by remember { mutableStateOf(currentYearMonth.year) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .height(210.dp)
    ) {
        // Year Navigation
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { selectedYear -= 1 },
                modifier = Modifier.size(28.dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                    contentDescription = null,
                    tint = colors.onSurface.copy(alpha = 0.7f),
                    modifier = Modifier.size(18.dp)
                )
            }

            Text(
                text = selectedYear.toString(),
                style = MaterialTheme.typography.titleMedium.copy(
                    fontFamily = ff,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = colors.primary
                )
            )

            IconButton(
                onClick = { selectedYear += 1 },
                modifier = Modifier.size(28.dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = null,
                    tint = colors.onSurface.copy(alpha = 0.7f),
                    modifier = Modifier.size(18.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // 12 Months Grid (3 columns x 4 rows)
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(Month.values()) { month ->
                val isSelected = month == currentYearMonth.month && selectedYear == currentYearMonth.year
                val monthName = month.toMozhiName(lang, isShort = true)

                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = if (isSelected) colors.primary else colors.surfaceVariant.copy(alpha = 0.35f),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(34.dp)
                        .clickable {
                            onYearMonthSelected(YearMonth.of(selectedYear, month))
                        }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = monthName,
                            style = MaterialTheme.typography.bodySmall.copy(
                                fontFamily = ff,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                color = if (isSelected) colors.onPrimary else colors.onSurface,
                                fontSize = 12.sp,
                                textAlign = TextAlign.Center
                            )
                        )
                    }
                }
            }
        }
    }
}

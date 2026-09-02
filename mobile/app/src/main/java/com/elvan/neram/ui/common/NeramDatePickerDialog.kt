package com.elvan.neram.ui.common

import android.content.res.Configuration
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.DialogProperties
import com.elvan.neram.ui.home.rememberHomeColors
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.toMozhiFullDate
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset

/**
 * Official Material 3 Expressive Date Picker Dialog.
 * Styled with exact Neram App Colors, compact button sizing,
 * comfortable screen-edge margin gaps, and zero divider lines.
 */
@OptIn(ExperimentalMaterial3Api::class)
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
    val colors = rememberHomeColors()
    val config = LocalConfiguration.current
    val isLandscape = config.orientation == Configuration.ORIENTATION_LANDSCAPE

    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = initialDate.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli(),
        initialDisplayMode = if (isLandscape) DisplayMode.Input else DisplayMode.Picker,
        selectableDates = object : SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long): Boolean {
                val date = Instant.ofEpochMilli(utcTimeMillis).atZone(ZoneOffset.UTC).toLocalDate()
                if (minDate != null && date.isBefore(minDate)) return false
                if (maxDate != null && date.isAfter(maxDate)) return false
                return true
            }

            override fun isSelectableYear(year: Int): Boolean {
                if (minDate != null && year < minDate.year) return false
                if (maxDate != null && year > maxDate.year) return false
                return true
            }
        }
    )

    DatePickerDialog(
        onDismissRequest = onDismissRequest,
        confirmButton = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 16.dp, end = 16.dp, bottom = 16.dp, top = 6.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = onDismissRequest,
                    shape = RoundedCornerShape(50),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 0.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.subtleBackground,
                        contentColor = colors.textSecondary
                    ),
                    modifier = Modifier
                        .weight(1f)
                        .height(38.dp)
                ) {
                    Text(
                        text = K.cancel.tr(lang),
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontFamily = ff,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.5.sp
                        )
                    )
                }

                Button(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            val selected = Instant.ofEpochMilli(millis)
                                .atZone(ZoneOffset.UTC)
                                .toLocalDate()
                            onDateSelected(selected)
                        }
                        onDismissRequest()
                    },
                    shape = RoundedCornerShape(50),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 0.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = colors.accent,
                        contentColor = Color.White
                    ),
                    modifier = Modifier
                        .weight(1f)
                        .height(38.dp)
                ) {
                    Text(
                        text = K.done.tr(lang),
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontFamily = ff,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.5.sp
                        )
                    )
                }
            }
        },
        dismissButton = null,
        properties = DialogProperties(
            usePlatformDefaultWidth = false
        ),
        modifier = Modifier
            .padding(horizontal = 24.dp)
            .widthIn(max = 336.dp),
        shape = RoundedCornerShape(24.dp),
        colors = DatePickerDefaults.colors(
            containerColor = colors.surface,
            dividerColor = Color.Transparent
        )
    ) {
        DatePicker(
            state = datePickerState,
            showModeToggle = false,
            title = {
                Text(
                    text = title ?: K.selectDate.tr(lang),
                    modifier = Modifier.padding(start = 24.dp, end = 16.dp, top = 16.dp),
                    style = MaterialTheme.typography.labelMedium.copy(
                        fontFamily = ff,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.accent,
                        fontSize = 13.sp
                    )
                )
            },
            headline = {
                val selectedMillis = datePickerState.selectedDateMillis
                val displayDate = if (selectedMillis != null) {
                    Instant.ofEpochMilli(selectedMillis).atZone(ZoneOffset.UTC).toLocalDate()
                } else initialDate
                Text(
                    text = displayDate.toMozhiFullDate(lang),
                    modifier = Modifier.padding(start = 24.dp, end = 16.dp, bottom = 6.dp),
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontFamily = ff,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = colors.textPrimary
                    )
                )
            },
            colors = DatePickerDefaults.colors(
                containerColor = colors.surface,
                titleContentColor = colors.accent,
                headlineContentColor = colors.textPrimary,
                weekdayContentColor = colors.textSecondary,
                subheadContentColor = colors.textSecondary,
                navigationContentColor = colors.textPrimary,
                yearContentColor = colors.textSecondary,
                currentYearContentColor = colors.accent,
                selectedYearContentColor = Color.White,
                selectedYearContainerColor = colors.accent,
                dayContentColor = colors.textPrimary,
                disabledDayContentColor = colors.textSecondary.copy(alpha = 0.35f),
                selectedDayContainerColor = colors.accent,
                selectedDayContentColor = Color.White,
                todayContentColor = colors.accent,
                todayDateBorderColor = colors.accent,
                dividerColor = Color.Transparent
            )
        )
    }
}

package com.elvan.neram.extensions

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import androidx.appcompat.view.ContextThemeWrapper
import androidx.picker.app.SeslDatePickerDialog
import androidx.picker.widget.SeslDatePicker
import com.elvan.neram.R
import java.time.LocalDate
import java.util.Calendar

/**
 * Samsung One UI SESL Date Picker Extensions for Neram.
 */

/**
 * Retrieve parent Activity from Context if available.
 */
val Context.activity: Activity?
    get() {
        var ctx = this
        while (ctx is ContextWrapper) {
            if (ctx is Activity) return ctx
            ctx = ctx.baseContext
        }
        return null
    }

/**
 * Initialize [SeslDatePicker] with [Calendar] and listener.
 */
inline fun SeslDatePicker.init(
    initialValue: Calendar,
    crossinline onDateSelected: (Calendar) -> Unit = {}
) {
    init(
        initialValue.get(Calendar.YEAR),
        initialValue.get(Calendar.MONTH),
        initialValue.get(Calendar.DAY_OF_MONTH)
    ) { _: SeslDatePicker?, yr: Int, moy: Int, dom: Int ->
        onDateSelected.invoke(
            (initialValue.clone() as Calendar).apply { set(yr, moy, dom) }
        )
    }
}

/**
 * Update [SeslDatePicker] date.
 */
fun SeslDatePicker.update(calendar: Calendar) {
    updateDate(
        calendar.get(Calendar.YEAR),
        calendar.get(Calendar.MONTH),
        calendar.get(Calendar.DAY_OF_MONTH)
    )
}

/**
 * Show Samsung One UI native [SeslDatePickerDialog] from Android [Context].
 */
fun Context.showSeslDatePickerDialog(
    initialDate: LocalDate = LocalDate.now(),
    minDate: LocalDate? = null,
    maxDate: LocalDate? = null,
    title: String? = null,
    onDateSelected: (LocalDate) -> Unit
): SeslDatePickerDialog {
    val baseActivity = this.activity ?: this
    val targetContext = ContextThemeWrapper(baseActivity, R.style.Theme_Neram)
    val initialCalendar = initialDate.toCalendar()

    val dialog = SeslDatePickerDialog(
        targetContext,
        { _: SeslDatePicker, year: Int, monthOfYear: Int, dayOfMonth: Int ->
            val selected = LocalDate.of(year, monthOfYear + 1, dayOfMonth)
            onDateSelected(selected)
        },
        initialCalendar.get(Calendar.YEAR),
        initialCalendar.get(Calendar.MONTH),
        initialCalendar.get(Calendar.DAY_OF_MONTH)
    )

    minDate?.let { dialog.datePicker.minDate = it.toUtcEpochMilli() }
    maxDate?.let { dialog.datePicker.maxDate = it.toUtcEpochMilli() }
    if (!title.isNullOrBlank()) {
        dialog.setTitle(title)
    }

    dialog.show()
    return dialog
}

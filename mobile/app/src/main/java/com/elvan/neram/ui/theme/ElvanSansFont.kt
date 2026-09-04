package com.elvan.neram.ui.theme

import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import com.elvan.neram.R

/**
 * Elvan Sans Font Family
 */
val ElvanSansFontFamily = FontFamily(
    Font(R.font.elvan_sans_regular, FontWeight.Light),
    Font(R.font.elvan_sans_regular, FontWeight.Normal),
    Font(R.font.elvan_sans_medium, FontWeight.Medium),
    Font(R.font.elvan_sans_semibold, FontWeight.SemiBold),
    Font(R.font.elvan_sans_bold, FontWeight.Bold)
)

/**
 * Prevents broken/stylized composite ligatures (such as 'fi', 'fl', 'ff')
 * by inserting a Zero-Width Non-Joiner (ZWNJ \u200C).
 */
fun String.preventBrokenLigatures(): String {
    if (isEmpty()) return this
    return this
        .replace("fi", "f\u200Ci")
        .replace("fI", "f\u200CI")
        .replace("fl", "f\u200Cl")
        .replace("ff", "f\u200Cf")
        .replace("fj", "f\u200Cj")
        .replace("fk", "f\u200Ck")
        .replace("fh", "f\u200Ch")
        .replace("ft", "f\u200Ct")
}


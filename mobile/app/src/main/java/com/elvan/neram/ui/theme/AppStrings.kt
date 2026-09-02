package com.elvan.neram.ui.theme

import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.text.font.FontFamily

val LocalAppLanguage = compositionLocalOf { "en" }
val LocalAppFontFamily = compositionLocalOf<FontFamily> { ElvanSansFontFamily }

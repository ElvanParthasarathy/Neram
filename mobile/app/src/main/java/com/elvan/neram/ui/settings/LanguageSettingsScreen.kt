package com.elvan.neram.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage

@Composable
fun LanguageSettingsScreen(
    currentLanguage: String,
    onLanguageChange: (String) -> Unit,
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val lang = LocalAppLanguage.current
    val ff = LocalAppFontFamily.current

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        item(key = "language_section") {
            ElvanSectionContainer {
                ElvanSettingsSection(colors = colors) {
                    // 1. System default (Iyalbunilai / இயல்புநிலை / System Default)
                    ElvanRadioSettingsRow(
                        title = K.deviceLanguage.tr(lang),
                        value = K.SYSTEM,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.SYSTEM) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 2. Tamil (தமிழ்)
                    ElvanRadioSettingsRow(
                        title = "தமிழ்",
                        description = K.tamil.tr(lang),
                        value = K.TAMIL,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.TAMIL) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 3. Tanglish / Tamil Latin (Thamizh)
                    ElvanRadioSettingsRow(
                        title = "Thamizh",
                        description = K.tamilLatin.tr(lang),
                        value = K.TAMIL_LATIN,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.TAMIL_LATIN) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 4. Tamil in Malayalam script (തമിഴ്)
                    ElvanRadioSettingsRow(
                        title = "തമിഴ്",
                        description = K.tamilMalayalam.tr(lang),
                        value = K.TAMIL_MALAYALAM,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.TAMIL_MALAYALAM) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 5. Malayalam (മലയാളം)
                    ElvanRadioSettingsRow(
                        title = "മലയാളം",
                        description = K.malayalam.tr(lang),
                        value = K.MALAYALAM,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.MALAYALAM) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 6. Malayalam Latin (Manglish)
                    ElvanRadioSettingsRow(
                        title = "Malayalam",
                        description = K.malayalamLatin.tr(lang),
                        value = K.MALAYALAM_LATIN,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.MALAYALAM_LATIN) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 7. Malayalam in Tamil Script (மலயாளம்)
                    ElvanRadioSettingsRow(
                        title = "மலயாளம்",
                        description = K.malayalamTamil.tr(lang),
                        value = K.MALAYALAM_TAMIL,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.MALAYALAM_TAMIL) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 8. Telugu (తెలుగు)
                    ElvanRadioSettingsRow(
                        title = "తెలుగు",
                        description = K.telugu.tr(lang),
                        value = K.TELUGU,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.TELUGU) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 9. Telugu Latin (Telugu)
                    ElvanRadioSettingsRow(
                        title = "Telugu",
                        description = K.teluguLatin.tr(lang),
                        value = K.TELUGU_LATIN,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.TELUGU_LATIN) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 10. English (English)
                    ElvanRadioSettingsRow(
                        title = "English",
                        description = K.english.tr(lang),
                        value = K.ENGLISH,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.ENGLISH) },
                        colors = colors
                    )
                }
            }
        }

        item(key = "info_text") {
            ElvanSectionContainer {
                Text(
                    text = K.languageInfo.tr(lang),
                    style = TextStyle(
                        fontFamily = ff,
                        fontSize = 13.sp,
                        lineHeight = 18.sp
                    ),
                    color = colors.textPrimary.copy(alpha = 0.5f),
                    modifier = Modifier.padding(horizontal = 8.dp)
                )
            }
        }
    }
}

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
                    // 1. System default / Device Language Option
                    ElvanRadioSettingsRow(
                        title = K.deviceLanguage.tr(lang),
                        value = K.SYSTEM,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.SYSTEM) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 2. English Option
                    ElvanRadioSettingsRow(
                        title = K.english.tr(lang),
                        value = K.ENGLISH,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.ENGLISH) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 3. Tamil Option (தமிழ்)
                    ElvanRadioSettingsRow(
                        title = K.tamil.tr(lang),
                        value = K.TAMIL,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.TAMIL) },
                        colors = colors
                    )

                    ElvanSettingsDivider(colors = colors)

                    // 4. Tanglish / Tamil Latin Option
                    ElvanRadioSettingsRow(
                        title = K.tamilLatin.tr(lang),
                        value = K.TAMIL_LATIN,
                        groupValue = currentLanguage,
                        onSelected = { onLanguageChange(K.TAMIL_LATIN) },
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

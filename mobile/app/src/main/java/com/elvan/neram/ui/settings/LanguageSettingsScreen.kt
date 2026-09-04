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

private data class LanguageSettingItem(
    val code: String,
    val title: String,
    val descriptionKey: String?
)

private val languageSettingsOptions = listOf(
    LanguageSettingItem(K.SYSTEM, "", null),
    LanguageSettingItem(K.TAMIL, "தமிழ்", K.tamil),
    LanguageSettingItem(K.TAMIL_LATIN, "Thamizh", K.tamilLatin),
    LanguageSettingItem(K.TAMIL_MALAYALAM, "തമിഴ്", K.tamilMalayalam),
    LanguageSettingItem(K.MALAYALAM, "മലയാളം", K.malayalam),
    LanguageSettingItem(K.MALAYALAM_LATIN, "Malayalam", K.malayalamLatin),
    LanguageSettingItem(K.MALAYALAM_TAMIL, "மலயாளம்", K.malayalamTamil),
    LanguageSettingItem(K.TELUGU, "తెలుగు", K.telugu),
    LanguageSettingItem(K.TELUGU_LATIN, "Telugu", K.teluguLatin),
    LanguageSettingItem(K.ENGLISH, "English", K.english)
)

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
                    languageSettingsOptions.forEachIndexed { index, option ->
                        val title = if (option.code == K.SYSTEM) K.deviceLanguage.tr(lang) else option.title
                        val description = option.descriptionKey?.let { it.tr(lang) }

                        ElvanRadioSettingsRow(
                            title = title,
                            description = description,
                            value = option.code,
                            groupValue = currentLanguage,
                            onSelected = { onLanguageChange(option.code) },
                            colors = colors
                        )

                        if (index < languageSettingsOptions.size - 1) {
                            ElvanSettingsDivider(colors = colors)
                        }
                    }
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

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
import com.elvan.neram.ui.theme.AppStrings
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
                Spacer(Modifier.height(280.dp - HomeDimens.SectionSpacing))
            }

            item(key = "language_section") {
                ElvanSectionContainer {
                    ElvanSettingsSection(colors = colors) {
                        // System default / Device Language Option
                        ElvanRadioSettingsRow(
                            title = AppStrings.Settings.deviceLanguage(lang),
                            value = AppStrings.SYSTEM,
                            groupValue = currentLanguage,
                            onSelected = { onLanguageChange(AppStrings.SYSTEM) },
                            colors = colors
                        )

                        ElvanSettingsDivider(colors = colors)

                        // English Option
                        ElvanRadioSettingsRow(
                            title = AppStrings.Settings.english(lang),
                            value = AppStrings.ENGLISH,
                            groupValue = currentLanguage,
                            onSelected = { onLanguageChange(AppStrings.ENGLISH) },
                            colors = colors
                        )

                        ElvanSettingsDivider(colors = colors)

                        // Tamil Option
                        ElvanRadioSettingsRow(
                            title = AppStrings.Settings.tamil(lang),
                            value = AppStrings.TAMIL,
                            groupValue = currentLanguage,
                            onSelected = { onLanguageChange(AppStrings.TAMIL) },
                            colors = colors
                        )
                    }
                }
            }

            item(key = "info_text") {
                ElvanSectionContainer {
                    Text(
                        text = if (lang == AppStrings.TAMIL)
                            "மொழி மாற்றம் வழிசெலுத்தல், முகப்பு மெனு மற்றும் அமைப்புகளுக்கு மட்டுமே பொருந்தும். பாடநேர அட்டவணை தரவு மாறாது."
                        else
                            "Language change applies only to navigation, home menu, and settings. Timetable data will not change.",
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

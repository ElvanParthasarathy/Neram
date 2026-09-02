package com.elvan.neram.ui.about

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage

private data class SiteLink(
    val name: String,
    val url: String,
    val descKey: String,
    val icon: ImageVector
)

private val links = listOf(
    SiteLink("RMD College Website", "https://rmd.ac.in/", K.rmdCollegeWebsiteDesc, Icons.Outlined.Business),
    SiteLink("RMK Nextgen Student", "https://nextgenstudent.rmd.ac.in/", K.rmkNextgenStudentDesc, Icons.Outlined.Person),
    SiteLink("Elvan Navil", "https://elvannavil.vercel.app/", K.elvanNavilSiteDesc, Icons.Outlined.Article),
    SiteLink("IamNeo", "https://rmk685.examly.io/login", K.iamNeoDesc, Icons.Outlined.Code),
    SiteLink("Skill Rack", "https://www.skillrack.com/faces/ui/profile.xhtml", K.skillRackDesc, Icons.Outlined.Terminal),
    SiteLink("Code Tantra", "https://rmd.codetantra.com/", K.codeTantraDesc, Icons.Outlined.IntegrationInstructions)
)

@Composable
fun CollegeSitesScreen(
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: androidx.compose.foundation.lazy.rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    val ff = LocalAppFontFamily.current
    val lang = LocalAppLanguage.current

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        item(key = "sites_list") {
            ElvanSectionContainer {
                ElvanSettingsSection(
                    title = K.officialPortals.tr(lang),
                    colors = colors
                ) {
                    links.forEachIndexed { index, link ->
                        ElvanSettingsRow(
                            icon = link.icon,
                            title = link.name,
                            description = link.descKey.tr(lang),
                            onClick = { com.elvan.neram.utils.IntentUtils.openUrl(context, link.url) },
                            colors = colors
                        )
                        if (index < links.lastIndex) {
                            ElvanSettingsDivider(colors = colors)
                        }
                    }
                }
            }
        }
    }
}

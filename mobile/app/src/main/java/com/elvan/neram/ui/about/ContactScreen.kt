package com.elvan.neram.ui.about

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowForward
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.neram.ui.components.shell.*
import com.elvan.neram.ui.home.*
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.theme.LocalAppFontFamily
import com.elvan.neram.ui.theme.LocalAppLanguage

@Composable
fun ContactScreen(
    isOffline: Boolean = false,
    onSendMessage: (Map<String, Any?>) -> Unit = {},
    scrollState: androidx.compose.foundation.lazy.LazyListState = LocalElvanScrollState.current ?: rememberLazyListState()
) {
    val colors = rememberHomeColors()
    val context = LocalContext.current
    val ff = LocalAppFontFamily.current
    val lang = LocalAppLanguage.current

    val helplines = listOf(
        Triple(Icons.Outlined.Emergency, K.emergencyHelpline.tr(lang), "+91 44 6790 0679"),
        Triple(Icons.Outlined.LocalHospital, K.ambulanceMedical.tr(lang), "+91 44 6790 0600"),
        Triple(Icons.Outlined.Business, K.collegeReception.tr(lang), "+91 44 6790 0640"),
        Triple(Icons.Outlined.AccountBalance, K.principalOffice.tr(lang), "+91 44 6790 0655"),
        Triple(Icons.Outlined.WorkOutline, K.placementCell.tr(lang), "+91 44 6790 0680"),
        Triple(Icons.Outlined.DirectionsBus, K.transportIncharge.tr(lang), "+91 44 6790 0690"),
        Triple(Icons.Outlined.Hotel, K.hostelOffice.tr(lang), "+91 44 6790 0685"),
        Triple(Icons.Outlined.Security, K.securityGate.tr(lang), "+91 44 6790 0601")
    )

    LazyColumn(
        state = scrollState,
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = HomeDimens.SubpageContentPaddingBottom),
        verticalArrangement = Arrangement.spacedBy(HomeDimens.SectionSpacing)
    ) {
        item(key = "spacer_top") {
            Spacer(Modifier.height(LocalElvanTopSpacerHeight.current))
        }

        item(key = "emergency_section") {
            ElvanSectionContainer {
                ElvanSettingsSection(
                    title = K.emergencyHelpline.tr(lang).uppercase(),
                    colors = colors
                ) {
                    helplines.forEachIndexed { index, (icon, title, phone) ->
                        ElvanSettingsRow(
                            icon = icon,
                            title = title,
                            description = phone,
                            onClick = {
                                context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")))
                            },
                            colors = colors
                        )
                        if (index < helplines.lastIndex) {
                            ElvanSettingsDivider(colors = colors)
                        }
                    }
                }
            }
        }
    }
}

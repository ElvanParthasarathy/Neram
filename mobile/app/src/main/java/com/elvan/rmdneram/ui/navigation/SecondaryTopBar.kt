package com.elvan.rmdneram.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.elvan.rmdneram.ui.home.HomeTypography
import com.elvan.rmdneram.ui.home.rememberHomeColors

/**
 * Secondary Top Bar - Simple bar for Settings and other secondary screens.
 * Displays a back button and title.
 */
@Composable
fun SecondaryTopBar(
    title: String,
    onBack: () -> Unit,
    actions: @Composable RowScope.() -> Unit = {},
    modifier: Modifier = Modifier
) {
    val colors = rememberHomeColors()

    Surface(
        modifier = modifier.fillMaxWidth(),
        color = colors.background.copy(alpha = 0.95f),
        shadowElevation = 0.dp
    ) {
        Row(
            modifier = Modifier
                .windowInsetsPadding(WindowInsets.statusBars)
                .fillMaxWidth()
                .height(64.dp)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Back Button
            IconButton(
                onClick = onBack,
                modifier = Modifier.padding(top = 8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.ChevronLeft,
                    contentDescription = "Back",
                    tint = colors.textPrimary,
                    modifier = Modifier.size(32.dp)
                )
            }

            // Title
            Text(
                text = title,
                style = HomeTypography.PageTitle.copy(fontSize = 28.sp),
                color = colors.textPrimary,
                modifier = Modifier
                    .weight(1f)
                    .padding(top = 8.dp)
            )

            // Actions Slot
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                actions()
            }
        }
    }
}

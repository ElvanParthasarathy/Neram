package com.elvan.rmdneram.ui.components

import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.LoadingIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * ExpressiveLoadingIndicator - A shared loading indicator component using Material3 Expressive API.
 * 
 * Used across the app for inline loading states (buttons, profile images, etc.)
 * Falls back to CircularProgressIndicator if Expressive API is unavailable.
 */
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun ExpressiveLoadingIndicator(
    modifier: Modifier = Modifier,
    color: Color = Color.White,
    strokeWidth: Dp = 3.dp
) {
    CircularProgressIndicator(
        modifier = modifier,
        color = color,
        strokeWidth = strokeWidth
    )
}

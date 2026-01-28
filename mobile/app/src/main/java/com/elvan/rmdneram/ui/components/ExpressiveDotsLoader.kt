package com.elvan.rmdneram.ui.components

import androidx.compose.foundation.layout.size
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.LoadingIndicator
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * ExpressiveDotsLoader - The original "dots" morphing loader.
 * 
 * STRICTLY restricted to:
 * 1. Schedule Section (Home Screen)
 * 2. Profile Greeting (Home Screen)
 */
@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun ExpressiveDotsLoader(
    modifier: Modifier = Modifier,
    color: Color = Color.White
) {
    LoadingIndicator(
        modifier = modifier,
        color = color
    )
}

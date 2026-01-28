
package com.elvan.rmdneram.ui.home.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ErrorBanner(error: String) {
    if (error.isEmpty()) return
    
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp, vertical = 8.dp)
            .background(MaterialTheme.colorScheme.errorContainer, RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                Icons.Default.Warning,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error
            )
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = error,
                color = MaterialTheme.colorScheme.onErrorContainer,
                fontSize = 14.sp
            )
        }
    }
}

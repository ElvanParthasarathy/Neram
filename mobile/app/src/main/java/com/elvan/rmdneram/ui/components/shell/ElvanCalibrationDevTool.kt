package com.elvan.rmdneram.ui.components.shell

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.elvan.rmdneram.ui.home.HomeColors
import com.elvan.rmdneram.ui.navigation.MaterialSymbols
import kotlin.math.roundToInt

object ElvanShellCalibration {
    var isDevToolOpen by mutableStateOf(false)
    var targetX by mutableFloatStateOf(72f) // Target X left offset in dp
    var targetY by mutableFloatStateOf(36.5f) // Target Y bottom offset from ceiling in dp
}

@Composable
fun ElvanCalibrationDevTool(
    modifier: Modifier = Modifier
) {
    var isExpanded by remember { mutableStateOf(false) }

    Box(
        modifier = modifier
            .fillMaxSize()
            .zIndex(1000f),
        contentAlignment = Alignment.BottomCenter
    ) {
        if (!isExpanded) {
            // Floating pill toggle button
            Surface(
                onClick = { isExpanded = true },
                shape = CircleShape,
                color = Color(0xFF1E88E5),
                shadowElevation = 8.dp,
                modifier = Modifier
                    .padding(bottom = 32.dp)
                    .height(42.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = MaterialSymbols.Rounded.MoreVert,
                        contentDescription = "Calibrate Title",
                        tint = Color.White,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = "Calibrate Title Alignment",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                }
            }
        } else {
            // Expanded Interactive HUD Card
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = Color(0xFF121212).copy(alpha = 0.96f),
                shadowElevation = 16.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF333333)),
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .background(Color(0xFF00E676), CircleShape)
                            )
                            Text(
                                text = "Live Title Calibration Tool",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            )
                        }
                        IconButton(
                            onClick = { isExpanded = false },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close",
                                tint = Color.LightGray,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }

                    // Target Y Control (Vertical Baseline)
                    CalibrationSliderRow(
                        label = "Target Y (Vertical Baseline)",
                        value = ElvanShellCalibration.targetY,
                        range = 28f..44f,
                        step = 0.2f,
                        unit = "dp",
                        onValueChange = { ElvanShellCalibration.targetY = it }
                    )

                    // Target X Control (Left Offset)
                    CalibrationSliderRow(
                        label = "Target X (Left Spacing)",
                        value = ElvanShellCalibration.targetX,
                        range = 50f..90f,
                        step = 0.5f,
                        unit = "dp",
                        onValueChange = { ElvanShellCalibration.targetX = it }
                    )

                    // Live coordinates readout box
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFF1E1E1E),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "targetY = ${"%.1f".format(ElvanShellCalibration.targetY)}.dp  |  targetX = ${"%.1f".format(ElvanShellCalibration.targetX)}.dp",
                            color = Color(0xFF00E676),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(10.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun CalibrationSliderRow(
    label: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    step: Float,
    unit: String,
    onValueChange: (Float) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                color = Color.LightGray,
                fontSize = 12.sp
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Minus button
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .background(Color(0xFF2A2A2A), CircleShape)
                        .clickable {
                            val next = (value - step).coerceIn(range.start, range.endInclusive)
                            onValueChange((next * 10).roundToInt() / 10f)
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text("-", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }

                Text(
                    text = "${"%.1f".format(value)} $unit",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )

                // Plus button
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .background(Color(0xFF2A2A2A), CircleShape)
                        .clickable {
                            val next = (value + step).coerceIn(range.start, range.endInclusive)
                            onValueChange((next * 10).roundToInt() / 10f)
                        },
                    contentAlignment = Alignment.Center
                ) {
                    Text("+", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
        Slider(
            value = value,
            onValueChange = { onValueChange((it * 10).roundToInt() / 10f) },
            valueRange = range,
            colors = SliderDefaults.colors(
                thumbColor = Color(0xFF1E88E5),
                activeTrackColor = Color(0xFF1E88E5),
                inactiveTrackColor = Color(0xFF333333)
            ),
            modifier = Modifier.height(28.dp)
        )
    }
}
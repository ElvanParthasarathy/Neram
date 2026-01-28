package com.elvan.rmdneram.ui.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.PathEasing
import androidx.compose.ui.graphics.Path

object MotionTokens {
    // Durations (Material 3 Specs)
    const val DurationShort = 250 // Used for small utilities, fades
    const val DurationMedium = 300 // Used for content transitions, shared axis
    const val DurationLong = 500 // Used for full screen transitions
    const val DurationExtraLong = 700 // Complex container transforms

    // Easing Curves (Material 3 Expressive)
    // Emphasized: Begin fast, end very slow. Perfect for entering elements.
    val EmphasizedDecelerate = CubicBezierEasing(0.05f, 0.7f, 0.1f, 1.0f)
    
    // Emphasized Accelerate: Begin slow, end very fast. Good for exits.
    val EmphasizedAccelerate = CubicBezierEasing(0.3f, 0.0f, 0.8f, 0.15f)

    // Standard: Productive and snappy
    val StandardDecelerate = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)
    val StandardAccelerate = CubicBezierEasing(0.4f, 0.0f, 1.0f, 1.0f)
}

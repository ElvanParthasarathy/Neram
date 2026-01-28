package com.elvan.rmdneram.ui.theme

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.ui.Alignment
import androidx.compose.ui.graphics.TransformOrigin

/**
 * Material 3 Transitions
 * Implements standard patterns: Shared Axis, Fade Through, Elevation Scale
 */
object Transitions {

    /**
     * Shared Axis X (Horizontal)
     * Used for hierarchical navigation (Forward/Backward)
     */
    fun sharedAxisX(forward: Boolean): ContentTransform {
        val targetOffsetX = if (forward) 300 else -300
        val initialOffsetX = if (forward) 300 else -300
        
        return (slideInHorizontally(
            initialOffsetX = { initialOffsetX },
            animationSpec = tween(
                durationMillis = MotionTokens.DurationLong,
                easing = MotionTokens.EmphasizedDecelerate
            )
        ) + fadeIn(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationMedium,
                easing = MotionTokens.StandardDecelerate
            )
        )) togetherWith (slideOutHorizontally(
            targetOffsetX = { -targetOffsetX / 4 }, // Parallax effect
            animationSpec = tween(
                durationMillis = MotionTokens.DurationLong,
                easing = MotionTokens.EmphasizedAccelerate
            )
        ) + fadeOut(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationShort,
                easing = MotionTokens.StandardAccelerate
            )
        ))
    }

    /**
     * Shared Axis Y (Vertical)
     * Used for entering/exiting modal-like screens or lists
     */
    fun sharedAxisY(forward: Boolean): ContentTransform {
        val targetOffsetY = if (forward) 300 else -300
        val initialOffsetY = if (forward) 300 else -300

        return (slideInVertically(
            initialOffsetY = { initialOffsetY },
            animationSpec = tween(
                durationMillis = MotionTokens.DurationLong,
                easing = MotionTokens.EmphasizedDecelerate
            )
        ) + fadeIn(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationMedium,
                easing = MotionTokens.StandardDecelerate
            )
        )) togetherWith (slideOutVertically(
            targetOffsetY = { -targetOffsetY / 4 }, // Parallax effect
            animationSpec = tween(
                durationMillis = MotionTokens.DurationLong,
                easing = MotionTokens.EmphasizedAccelerate
            )
        ) + fadeOut(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationShort,
                easing = MotionTokens.StandardAccelerate
            )
        ))
    }

    /**
     * Shared Axis Z (Scale)
     * Used for parent-child transitions where user stays on same "plane" but zooms in
     */
    fun sharedAxisZ(forward: Boolean): ContentTransform {
        val initialScale = if (forward) 0.8f else 1.1f
        val targetScale = if (forward) 1.1f else 0.8f

        return (fadeIn(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationMedium,
                easing = MotionTokens.StandardDecelerate
            )
        ) + scaleIn(
            initialScale = initialScale,
            animationSpec = tween(
                durationMillis = MotionTokens.DurationLong,
                easing = MotionTokens.EmphasizedDecelerate
            )
        )) togetherWith (fadeOut(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationShort,
                easing = MotionTokens.StandardAccelerate
            )
        ) + scaleOut(
            targetScale = targetScale,
            animationSpec = tween(
                durationMillis = MotionTokens.DurationLong,
                easing = MotionTokens.EmphasizedAccelerate
            )
        ))
    }

    /**
     * Fade Through
     * Used for switching between peer UI elements (Tabs, Bottom Nav)
     */
    fun fadeThrough(): ContentTransform {
        return (fadeIn(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationMedium,
                delayMillis = 90, // Wait for outgoing to start fading
                easing = MotionTokens.EmphasizedDecelerate
            )
        ) + scaleIn(
            initialScale = 0.92f,
            animationSpec = tween(
                durationMillis = MotionTokens.DurationMedium,
                delayMillis = 90,
                easing = MotionTokens.EmphasizedDecelerate
            )
        )) togetherWith (fadeOut(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationShort,
                easing = MotionTokens.StandardAccelerate
            )
        ))
    }
    
    /**
     * Menu Popup Enter/Exit
     * Expands from top right corner (Scale/Zoom)
     */
    fun menuPopup(): EnterTransition {
        return scaleIn(
            initialScale = 0.8f,
            transformOrigin = TransformOrigin(1f, 0f), // Top Right
            animationSpec = tween(
                durationMillis = MotionTokens.DurationShort,
                easing = MotionTokens.EmphasizedDecelerate
            )
        ) + fadeIn(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationShort,
                easing = MotionTokens.StandardDecelerate
            )
        )
    }

    fun menuPopupExit(): ExitTransition {
        return scaleOut(
            targetScale = 0.8f,
            transformOrigin = TransformOrigin(1f, 0f), // Top Right
            animationSpec = tween(
                durationMillis = MotionTokens.DurationShort,
                easing = MotionTokens.EmphasizedAccelerate
            )
        ) + fadeOut(
            animationSpec = tween(
                durationMillis = MotionTokens.DurationShort,
                easing = MotionTokens.StandardAccelerate
            )
        )
    }
}

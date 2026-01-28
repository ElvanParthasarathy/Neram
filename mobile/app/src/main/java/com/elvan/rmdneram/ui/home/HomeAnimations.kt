package com.elvan.rmdneram.ui.home

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically

/**
 * Animation specs for Home Screen components
 * Extracted from HomeScreen.kt for maintainability
 */
object HomeAnimations {
    
    /**
     * Skeleton Pulse Animation
     * Used for loading placeholders (Profile, Timetable, etc.)
     */
    object SkeletonPulse {
        const val InitialAlpha = 0.3f
        const val TargetAlpha = 0.7f
        const val DurationMs = 1000
        val Spec = infiniteRepeatable<Float>(
            animation = tween(DurationMs),
            repeatMode = RepeatMode.Reverse
        )
    }
    
    /**
     * Pull-to-Refresh Indicator Animation
     * Smooth offset and scale animations for the refresh indicator
     */
    object PullRefresh {
        const val MaxOffset = 180f
        const val RefreshingOffset = 180f
    }
    
    /**
     * Welcome Animation
     * Content transition timing for the greeting card
     */
    object WelcomeTransition {
        const val DurationMs = 3000 // 3 seconds before transition
        const val ProfileLoaderMinMs = 2000 // 2 seconds min loader visibility
        
        // Motion specs
        val EnterTransition = slideInVertically { height -> height } + fadeIn()
        val ExitTransition = slideOutVertically { height -> -height } + fadeOut()
    }
    
    /**
     * Helper specs
     */
    val DefaultTween = tween<Float>(300)
}

package com.elvan.neram.utils

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import com.elvan.neram.ui.mozhiyaakkam.K

object LauncherManager {
    /**
     * Dynamically switches the Android launcher activity alias to match the chosen language.
     * English: "Neram"
     * Tamil: "நேரம்"
     * Tamil Latin: "Naeram"
     */
    fun updateLauncherName(context: Context, languagePreference: String) {
        try {
            val effectiveLanguage = K.getEffectiveLanguage(languagePreference, context)
            val pm = context.packageManager
            val pkg = context.packageName

            val defaultActivity = "$pkg.MainActivity"
            val tamilAlias = "$pkg.MainActivityTamil"
            val tamilLatinAlias = "$pkg.MainActivityTamilLatin"
            val tamilMalayalamAlias = "$pkg.MainActivityTamilMalayalam"
            val malayalamAlias = "$pkg.MainActivityMalayalam"
            val malayalamLatinAlias = "$pkg.MainActivityMalayalamLatin"
            val malayalamTamilAlias = "$pkg.MainActivityMalayalamTamil"
            val teluguAlias = "$pkg.MainActivityTelugu"
            val teluguLatinAlias = "$pkg.MainActivityTeluguLatin"

            val targetComponent = when (effectiveLanguage) {
                K.TAMIL -> tamilAlias
                K.TAMIL_LATIN -> tamilLatinAlias
                K.TAMIL_MALAYALAM -> tamilMalayalamAlias
                K.MALAYALAM -> malayalamAlias
                K.MALAYALAM_LATIN -> malayalamLatinAlias
                K.MALAYALAM_TAMIL -> malayalamTamilAlias
                K.TELUGU -> teluguAlias
                K.TELUGU_LATIN -> teluguLatinAlias
                else -> defaultActivity
            }

            val allComponents = listOf(defaultActivity, tamilAlias, tamilLatinAlias, tamilMalayalamAlias, malayalamAlias, malayalamLatinAlias, malayalamTamilAlias, teluguAlias, teluguLatinAlias)

            for (componentName in allComponents) {
                val component = ComponentName(pkg, componentName)
                val targetState = if (componentName == targetComponent) {
                    PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                } else {
                    PackageManager.COMPONENT_ENABLED_STATE_DISABLED
                }

                val currentState = pm.getComponentEnabledSetting(component)
                if (currentState != targetState) {
                    pm.setComponentEnabledSetting(
                        component,
                        targetState,
                        PackageManager.DONT_KILL_APP
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

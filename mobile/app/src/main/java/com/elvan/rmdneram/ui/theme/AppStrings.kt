package com.elvan.rmdneram.ui.theme

import android.content.Context
import androidx.compose.runtime.compositionLocalOf
import java.util.Locale

/**
 * CompositionLocal for app language code.
 * Provides the current language setting throughout the app.
 */
val LocalAppLanguage = compositionLocalOf { "en" }

/**
 * Centralized App Strings with Tamil language support.
 * For: Navigation, Home menu, Settings pages (NOT timetable content)
 */
object AppStrings {
    
    // Language codes
    const val SYSTEM = "system"
    const val ENGLISH = "en"
    const val TAMIL = "ta"
    
    /**
     * Get the effective language code based on preference
     */
    fun getEffectiveLanguage(preference: String, context: Context): String {
        return when (preference) {
            SYSTEM -> {
                val locale = context.resources.configuration.locales[0]
                val languageCode = locale.language
                // Check for "ta" (Tamil) including regional variants like "ta-IN"
                if (languageCode == TAMIL || languageCode.startsWith("ta")) TAMIL else ENGLISH
            }
            else -> preference
        }
    }
    
    // =========================================================================
    // NAVIGATION
    // =========================================================================
    object Nav {
        fun home(lang: String) = if (lang == TAMIL) "முகப்பு" else "Home"
        fun schedule(lang: String) = if (lang == TAMIL) "அட்டவணை" else "Schedule"
        fun calendar(lang: String) = if (lang == TAMIL) "நாட்காட்டி" else "Calendar"
        fun notes(lang: String) = if (lang == TAMIL) "குறிப்புகள்" else "Notes"
    }
    
    // =========================================================================
    // HOME SCREEN
    // =========================================================================
    object Home {
        fun selectDate(lang: String) = if (lang == TAMIL) "தேதி தேர்வு" else "Select date"
        fun academicCalendar(lang: String) = if (lang == TAMIL) "கல்வி நாட்காட்டி" else "Academic Calendar"
        fun schedule(lang: String) = if (lang == TAMIL) "அட்டவணை" else "Schedule"
        fun workingDay(lang: String) = if (lang == TAMIL) "வேலை நாள்" else "Working Day"
        fun regularWorkingDay(lang: String) = if (lang == TAMIL) "வழக்கமான வேலை நாள்" else "Regular Working Day"
        fun noEventsScheduled(lang: String) = if (lang == TAMIL) "நிகழ்வுகள் திட்டமிடப்படவில்லை" else "No events scheduled"
        fun offline(lang: String) = if (lang == TAMIL) "இணைப்பில்லை" else "Offline"
        fun ok(lang: String) = if (lang == TAMIL) "சரி" else "OK"
        fun cancel(lang: String) = if (lang == TAMIL) "ரத்து" else "Cancel"
        fun followingOrder(order: String, lang: String) = if (lang == TAMIL) "$order வரிசை பின்பற்றுகிறது" else "FOLLOWING $order ORDER"
        fun greeting(lang: String) = if (lang == TAMIL) "வணக்கம்!" else "Hello!"
    }
    
    // =========================================================================
    // SETTINGS
    // =========================================================================
    object Settings {
        fun title(lang: String) = if (lang == TAMIL) "அமைப்புகள்" else "Settings"
        fun display(lang: String) = if (lang == TAMIL) "காட்சி" else "Display"
        fun displayDesc(lang: String) = if (lang == TAMIL) "பிரகாசம், இருள் பயன்முறை" else "Brightness, Dark mode"
        fun storageData(lang: String) = if (lang == TAMIL) "சேமிப்பு & தரவு" else "Storage & Data"
        fun storageDesc(lang: String) = if (lang == TAMIL) "பழைய புதுப்பிப்புகளை அழி" else "Clear old updates, Manage cache"
        fun security(lang: String) = if (lang == TAMIL) "பாதுகாப்பு" else "Security"
        fun securityDesc(lang: String) = if (lang == TAMIL) "கடவுச்சொல், Google கணக்கு" else "Password, Google Account"
        fun complaints(lang: String) = if (lang == TAMIL) "புகார்கள் & கருத்து" else "Complaints & Feedback"
        fun complaintsDesc(lang: String) = if (lang == TAMIL) "சிக்கல்களை புகாரளி, பரிந்துரைகள்" else "Report issues, Suggestions"
        fun aboutDeveloper(lang: String) = if (lang == TAMIL) "டெவலப்பர் பற்றி" else "About Developer"
        fun aboutPhone(lang: String) = if (lang == TAMIL) "போன் பற்றி" else "About Phone"
        fun signOut(lang: String) = if (lang == TAMIL) "வெளியேறு" else "Sign Out"
        fun signOutConfirm(lang: String) = if (lang == TAMIL) "வெளியேற விரும்புகிறீர்களா?" else "Sign Out?"
        fun signOutMessage(lang: String) = if (lang == TAMIL) "நிச்சயமாக வெளியேற விரும்புகிறீர்களா?" else "Are you sure you want to sign out?"
        
        // Language Settings
        fun language(lang: String) = if (lang == TAMIL) "மொழி" else "Language"
        fun languageDesc(lang: String) = if (lang == TAMIL) "தமிழ், ஆங்கிலம்" else "Tamil, English"
        fun languageOther(lang: String) = if (lang == TAMIL) "மொழி & மற்றவை" else "Language & Other"
        fun deviceLanguage(lang: String) = if (lang == TAMIL) "சாதன மொழி" else "Device Language"
        fun english(lang: String) = if (lang == TAMIL) "ஆங்கிலம்" else "English"
        fun tamil(lang: String) = if (lang == TAMIL) "தமிழ்" else "தமிழ்"
    }
    
    // =========================================================================
    // COMMON
    // =========================================================================
    object Common {
        fun loading(lang: String) = if (lang == TAMIL) "ஏற்றுகிறது..." else "Loading..."
        fun error(lang: String) = if (lang == TAMIL) "பிழை" else "Error"
        fun retry(lang: String) = if (lang == TAMIL) "மீண்டும் முயற்சி" else "Retry"
        fun save(lang: String) = if (lang == TAMIL) "சேமி" else "Save"
        fun delete(lang: String) = if (lang == TAMIL) "நீக்கு" else "Delete"
        fun confirm(lang: String) = if (lang == TAMIL) "உறுதிப்படுத்து" else "Confirm"
    }
}

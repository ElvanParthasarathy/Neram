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
     * Get the effective language code - always returns English
     */
    fun getEffectiveLanguage(preference: String, context: Context): String {
        return ENGLISH
    }
    
    // =========================================================================
    // NAVIGATION
    // =========================================================================
    object Nav {
        fun home(lang: String) = if (lang == TAMIL) "முகப்பு" else "Home"
        fun neram(lang: String) = if (lang == TAMIL) "நேரம்" else "Neram"
        fun schedule(lang: String) = if (lang == TAMIL) "வகுப்புகள்" else "Schedule"
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
        fun regularWorkingDay(lang: String) = if (lang == TAMIL) "வழக்கமான பணி நாள்" else "Regular Working Day"
        fun noEventsScheduled(lang: String) = if (lang == TAMIL) "நிகழ்வுகள் திட்டமிடப்படவில்லை" else "No events scheduled"
        fun offline(lang: String) = if (lang == TAMIL) "இணைப்பில்லை" else "Offline"
        fun offlineMessage(lang: String) = if (lang == TAMIL) "தரவை ஏற்ற இணையம் தேவை." else "Internet is not connected. Connect to internet to sync data."
        fun ok(lang: String) = if (lang == TAMIL) "சரி" else "OK"
        fun cancel(lang: String) = if (lang == TAMIL) "ரத்து" else "Cancel"
        fun followingOrder(order: String, lang: String) = if (lang == TAMIL) "$order வரிசை பின்பற்றுகிறது" else "FOLLOWING $order ORDER"
        fun greeting(lang: String) = if (lang == TAMIL) "வணக்கம்!" else "Hello!"
        fun welcomeToNeram(lang: String) = if (lang == TAMIL) "நேரம் உங்களை வரவேற்கிறது!" else "Welcome to Neram!"
        fun gladYouAreHere(lang: String) = if (lang == TAMIL) "நீங்கள் இணைந்ததில் மகிழ்ச்சி 😊" else "Glad you're here 😊"
        fun vanakkam(lang: String) = if (lang == TAMIL) "வணக்கம்!" else "Vanakkam!"
        fun classesSuspended(lang: String) = if (lang == TAMIL) "வகுப்புகள் ரத்து" else "Classes Suspended"
        fun system(lang: String) = if (lang == TAMIL) "அமைப்பு" else "System"
        fun noUpdates(lang: String) = if (lang == TAMIL) "இன்று அறிவிப்புகள் இல்லை." else "No special updates for today."
        fun todaysEvent(lang: String) = if (lang == TAMIL) "இன்றைய நிகழ்வு" else "TODAY'S EVENT"
        fun specialEvent(lang: String) = if (lang == TAMIL) "சிறப்பு நிகழ்வு" else "SPECIAL EVENT"
        fun fullDay(lang: String) = if (lang == TAMIL) "முழு நாள்" else "Full Day"
        fun noClasses(lang: String) = if (lang == TAMIL) "வகுப்பில்லை" else "No Classes"
        fun event(lang: String) = if (lang == TAMIL) "நிகழ்வு" else "Event"
    }
    
    // =========================================================================
    // SCHEDULE SCREEN
    // =========================================================================
    object Schedule {
        fun weeklySchedule(lang: String) = if (lang == TAMIL) "வார அட்டவணை" else "Weekly Schedule"
        fun noClassesOn(day: String, lang: String) = if (lang == TAMIL) "$day - வகுப்பில்லை" else "No classes on $day"
        fun ongoingExams(lang: String) = if (lang == TAMIL) "நடைபெறும் தேர்வுகள்" else "Ongoing Exams"
        fun upcomingExams(lang: String) = if (lang == TAMIL) "எதிர்வரும் தேர்வுகள்" else "Upcoming Exams"
        fun finishedExams(lang: String) = if (lang == TAMIL) "முடிந்த தேர்வுகள்" else "Finished Exams"
        fun noOngoingExams(lang: String) = if (lang == TAMIL) "நடைபெறும் தேர்வுகள் இல்லை" else "No Ongoing Exams"
        fun noExamTimetables(lang: String) = if (lang == TAMIL) "தேர்வு அட்டவணை வெளியிடப்படவில்லை." else "No Exam Timetables published."
        fun academicCourses(lang: String) = if (lang == TAMIL) "பாடப்பிரிவுகள்" else "Academic Courses"
        fun classCounselors(lang: String) = if (lang == TAMIL) "வகுப்பு வழிகாட்டிகள்" else "Class Counselors"
        fun keyCoordinators(lang: String) = if (lang == TAMIL) "ஒருங்கிணைப்பாளர்கள்" else "Key Coordinators"
        fun periods(lang: String) = if (lang == TAMIL) "பாடவேளை" else "periods"
        fun noSubjectsScheduled(lang: String) = if (lang == TAMIL) "பாடங்கள் திட்டமிடப்படவில்லை" else "No subjects scheduled"
        fun noCoursesFound(lang: String) = if (lang == TAMIL) "பாடங்கள் கிடைக்கவில்லை" else "No courses found"
        fun noInfoAvailable(lang: String) = if (lang == TAMIL) "தகவல் இல்லை" else "No info available"
        fun collapse(lang: String) = if (lang == TAMIL) "சுருக்கு" else "Collapse"
        fun expand(lang: String) = if (lang == TAMIL) "விரிவாக்கு" else "Expand"
    }
    
    // =========================================================================
    // DISPLAY SETTINGS
    // =========================================================================
    object Display {
        fun lightTheme(lang: String) = if (lang == TAMIL) "பகல் முறை" else "Light"
        fun darkTheme(lang: String) = if (lang == TAMIL) "இரவு முறை" else "Dark"
        fun systemAuto(lang: String) = if (lang == TAMIL) "தானியங்கி" else "System Auto"
        fun themeDescription(lang: String) = if (lang == TAMIL) "சிஸ்டம் அமைப்பிற்கேற்ப மாறும்" else "Switch modes with system"
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
        fun changePassword(lang: String) = if (lang == TAMIL) "கடவுச்சொல் மாற்றம்" else "Change Password"
        fun deleteAccount(lang: String) = if (lang == TAMIL) "கணக்கு நீக்கம்" else "Delete Account"
        fun userDirectory(lang: String) = if (lang == TAMIL) "பயனர் பட்டியல்" else "User Directory"
        fun aboutApp(lang: String) = if (lang == TAMIL) "செயலி பற்றி" else "About App"
        fun aboutAppDesc(lang: String) = if (lang == TAMIL) "நேரம் - கல்வி கட்டுப்பாட்டின் பேரவை" else "Your College Time, Sorted"
        
        // Language Settings
        fun language(lang: String) = if (lang == TAMIL) "மொழி" else "Language"
        fun languageDesc(lang: String) = if (lang == TAMIL) "தமிழ், ஆங்கிலம்" else "Tamil, English"
        fun languageOther(lang: String) = if (lang == TAMIL) "மொழி & மற்றவை" else "Language & Other"
        fun deviceLanguage(lang: String) = if (lang == TAMIL) "சாதன மொழி" else "Device Language"
        fun english(lang: String) = if (lang == TAMIL) "ஆங்கிலம்" else "English"
        fun tamil(lang: String) = if (lang == TAMIL) "தமிழ்" else "தமிழ்"
    }
    
    // =========================================================================
    // NOTES
    // =========================================================================
    object Notes {
        fun notUploadedTitle(lang: String) = if (lang == TAMIL) "பதிவேற்றப்படவில்லை" else "Not Uploaded"
        fun notUploadedMessage(lang: String) = if (lang == TAMIL) 
            "இந்த பாடகுறிப்புகள் rmd.ac.in-ல் இன்னும் பதிவேற்றப்படவில்லை. அவை பதிவேற்றப்பட்டவுடன் இங்கே கிடைக்கும்." 
            else "The unit notes not uploaded in rmd.ac.in it will be available here when they upload it."
        fun unit(number: Int, lang: String) = if (lang == TAMIL) "அலகு $number" else "Unit $number"
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

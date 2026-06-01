package com.elvan.rmdneram.ui.theme

import android.content.Context
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.text.font.FontFamily
import java.util.Locale

/**
 * CompositionLocal for app language code.
 * Provides the current language setting throughout the app.
 */
val LocalAppLanguage = compositionLocalOf { "en" }

/**
 * CompositionLocal for app font family.
 * Tamil → MuktaMalar, English → Google Sans. 
 * Provided at the theme level so all components can read it.
 */
val LocalAppFontFamily = compositionLocalOf<FontFamily> { GoogleSansFontFamily }

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
     * Get the effective language code based on user preference.
     * - "system" → resolve from device locale (Tamil if device is ta, else English)
     * - "en" / "ta" → use directly
     */
    fun getEffectiveLanguage(preference: String, context: Context): String {
        return when (preference) {
            ENGLISH -> ENGLISH
            TAMIL -> TAMIL
            SYSTEM -> {
                // Use Resources.getSystem() for true device locale
                // (context.resources may have app-overridden locale from MainActivity)
                val deviceLocale = android.content.res.Resources.getSystem().configuration.locales[0]
                if (deviceLocale.language == "ta") TAMIL else ENGLISH
            }
            else -> ENGLISH
        }
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
        fun welcomeToNeram(lang: String) = if (lang == TAMIL) "வரவேற்கிறோம்!" else "Welcome to Neram!"
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
        fun todaysExam(lang: String) = if (lang == TAMIL) "இன்றைய தேர்வு" else "TODAY'S EXAM"
        fun todaysPracticalExam(lang: String) = if (lang == TAMIL) "இன்றைய செய்முறை தேர்வு" else "TODAY'S PRACTICAL EXAM"
        fun noClassesScheduled(lang: String) = if (lang == TAMIL) "வகுப்புகள் திட்டமிடப்படவில்லை." else "No classes scheduled."
        fun liveUpdates(section: String, lang: String) = if (lang == TAMIL) "நேரடி புதுப்பிப்புகள் ($section)" else "Live Updates ($section)"
        fun generalNotice(lang: String) = if (lang == TAMIL) "பொது அறிவிப்பு" else "General Notice"
        fun noUpdatesForDate(lang: String) = if (lang == TAMIL) "இந்த தேதிக்கு புதுப்பிப்புகள் இல்லை." else "No updates for this date."
        fun noGeneralNotices(lang: String) = if (lang == TAMIL) "பொது அறிவிப்புகள் இல்லை." else "No general notices."
        fun lab(lang: String) = if (lang == TAMIL) "ஆய்வகம்" else "LAB"
        fun specialSession(lang: String) = if (lang == TAMIL) "சிறப்பு அமர்வு" else "Special Session"
        fun fullDayEvent(lang: String) = if (lang == TAMIL) "முழு நாள் நிகழ்வு" else "Full Day Event"
        fun edit(lang: String) = if (lang == TAMIL) "திருத்து" else "EDIT"
        fun postedBy(lang: String) = if (lang == TAMIL) "பதிவிட்டவர் " else "Posted by "
        fun holiday(lang: String) = if (lang == TAMIL) "விடுமுறை" else "HOLIDAY"
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
        fun noBatchesScheduled(lang: String) = if (lang == TAMIL) "தொகுப்புகள் திட்டமிடப்படவில்லை" else "No batches scheduled"
        fun students(count: Int, lang: String) = if (lang == TAMIL) "$count மாணவர்கள்" else "$count Students"
        fun classesTab(lang: String) = if (lang == TAMIL) "வகுப்புகள்" else "Class"
        fun examsTab(lang: String) = if (lang == TAMIL) "தேர்வுகள்" else "Exams"
        fun dayTuesday(lang: String) = if (lang == TAMIL) "செவ்" else "Tue"
        fun dayWednesday(lang: String) = if (lang == TAMIL) "புத" else "Wed"
        fun dayThursday(lang: String) = if (lang == TAMIL) "வியா" else "Thu"
        fun dayFriday(lang: String) = if (lang == TAMIL) "வெள்" else "Fri"
        fun daySaturday(lang: String) = if (lang == TAMIL) "சனி" else "Sat"
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
        fun neramAccount(lang: String) = if (lang == TAMIL) "நேரம் கணக்கு" else "Neram Account"
        fun account(lang: String) = if (lang == TAMIL) "கணக்கு" else "ACCOUNT"
        fun dangerZone(lang: String) = if (lang == TAMIL) "ஆபத்து பகுதி" else "DANGER ZONE"
        fun pushNotifications(lang: String) = if (lang == TAMIL) "புஷ் அறிவிப்புகள்" else "Push Notifications"
        fun notificationTimings(lang: String) = if (lang == TAMIL) "அறிவிப்பு நேரங்கள்" else "Notification Timings"
        fun notificationNote(lang: String) = if (lang == TAMIL) "குறிப்பு: உங்கள் சாதனத்தின் அமைப்புகளிலும் அறிவிப்பு அனுமதிகளை நிர்வகிக்கலாம்." else "Note: You can also manage notification permissions in your device's system settings."
        
        // Language Settings
        fun language(lang: String) = if (lang == TAMIL) "மொழி" else "Language"
        fun languageDesc(lang: String) = if (lang == TAMIL) "தமிழ், ஆங்கிலம்" else "Tamil, English"
        fun languageOther(lang: String) = if (lang == TAMIL) "மொழி & மற்றவை" else "Language & Other"
        fun deviceLanguage(lang: String) = if (lang == TAMIL) "சாதன மொழி" else "Device Language"
        fun english(lang: String) = if (lang == TAMIL) "ஆங்கிலம்" else "English"
        fun tamil(lang: String) = if (lang == TAMIL) "தமிழ்" else "தமிழ்"
        
        // Screen Titles (for SecondaryTopBar)
        fun editProfile(lang: String) = if (lang == TAMIL) "சுயவிவரம் திருத்து" else "Edit Profile"
        fun importantSites(lang: String) = if (lang == TAMIL) "முக்கிய தளங்கள்" else "Important Sites"
        fun contact(lang: String) = if (lang == TAMIL) "தொடர்புக்கு" else "Contact"
        fun calendarSettings(lang: String) = if (lang == TAMIL) "நாட்காட்டி அமைப்புகள்" else "Calendar Settings"
        fun linkedAccounts(lang: String) = if (lang == TAMIL) "இணைக்கப்பட்ட கணக்குகள்" else "Linked Accounts"
        fun notifications(lang: String) = if (lang == TAMIL) "அறிவிப்புகள்" else "Notifications"
        fun notificationSettings(lang: String) = if (lang == TAMIL) "அறிவிப்பு அமைப்புகள்" else "Notification Settings"
        fun documents(lang: String) = if (lang == TAMIL) "ஆவணங்கள்" else "Document"
        fun aboutRmk(lang: String) = if (lang == TAMIL) "RMK குழுமம் பற்றி" else "About RMK Group"
        fun managementTeam(lang: String) = if (lang == TAMIL) "நிர்வாகக் குழு" else "Management Team"
        fun feedback(lang: String) = if (lang == TAMIL) "கருத்து" else "Feedback"
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
        fun back(lang: String) = if (lang == TAMIL) "பின்செல்" else "Back"
    }
    
    // =========================================================================
    // MENU
    // =========================================================================
    object Menu {
        fun importantSites(lang: String) = if (lang == TAMIL) "முக்கிய தளங்கள்" else "Important Sites"
        fun settings(lang: String) = if (lang == TAMIL) "அமைப்புகள்" else "Settings"
        fun systemDefault(lang: String) = if (lang == TAMIL) "இயல்புநிலை" else "System Default"
        fun lightMode(lang: String) = if (lang == TAMIL) "பகல் முறை" else "Light Mode"
        fun darkMode(lang: String) = if (lang == TAMIL) "இரவு முறை" else "Dark Mode"
    }
    
    // =========================================================================
    // STORAGE SETTINGS
    // =========================================================================
    object Storage {
        fun cleanupOptions(lang: String) = if (lang == TAMIL) "சுத்தம் செய்தல்" else "CLEANUP OPTIONS"
        fun clearOldUpdates(lang: String) = if (lang == TAMIL) "பழைய புதுப்பிப்புகளை அழி" else "Clear Old Updates"
        fun clearOldUpdatesDesc(lang: String) = if (lang == TAMIL) "30 நாட்களுக்கு மேலான செய்திகளை நீக்கு" else "Remove news & notices older than 30 days"
        fun customRangeDeletion(lang: String) = if (lang == TAMIL) "தனிப்பயன் வரம்பு நீக்கம்" else "Custom Range Deletion"
        fun customRangeDesc(lang: String) = if (lang == TAMIL) "புதுப்பிப்புகளை அழிக்க தேதி வரம்பு தேர்வு" else "Select a date range to wipe updates"
        fun optimizationInfo(lang: String) = if (lang == TAMIL) "சேமிப்பிடத்தை மேம்படுத்துதல் செயலியை வேகமாக இயங்கச் செய்யும்." else "Optimization helps keep the app responsive and saves local storage by removing old media and text records."
        fun confirmDeletion(lang: String) = if (lang == TAMIL) "நீக்கத்தை உறுதிப்படுத்து" else "Confirm Deletion"
        fun clearNow(lang: String) = if (lang == TAMIL) "இப்போது அழி" else "Clear Now"
        fun deleteData(lang: String) = if (lang == TAMIL) "தரவை நீக்கு" else "Delete Data"
        fun selectRange(lang: String) = if (lang == TAMIL) "வரம்பு தேர்வு" else "Select Range"
        fun selectDateRange(lang: String) = if (lang == TAMIL) "தேதி வரம்பு தேர்வு" else "Select Date Range"
        fun chooseUpdatesToWipe(lang: String) = if (lang == TAMIL) "நீக்க புதுப்பிப்புகளை தேர்வு" else "Choose updates to wipe"
        fun clearConfirmMessage(lang: String) = if (lang == TAMIL) "30 நாட்களுக்கு மேலான அனைத்து புதுப்பிப்புகளும் நீக்கப்படும். இதை மீட்க இயலாது." else "This will delete all live updates and notices older than 30 days. This action cannot be undone."
        fun rangeConfirmMessage(startDate: Any, endDate: Any, lang: String) = if (lang == TAMIL) "$startDate முதல் $endDate வரை அனைத்து புதுப்பிப்புகளையும் நீக்க விரும்புகிறீர்களா?" else "Are you sure you want to delete all daily updates from $startDate to $endDate? This action is permanent."
        fun clearedMessage(lang: String) = if (lang == TAMIL) "30 நாட்களுக்கு மேலான புதுப்பிப்புகள் நீக்கப்பட்டன" else "Cleared updates older than 30 days"
        fun deletedRangeMessage(startDate: Any, endDate: Any, lang: String) = if (lang == TAMIL) "$startDate முதல் $endDate வரை தரவு நீக்கப்பட்டது" else "Deleted data from $startDate to $endDate"
    }
    
    // =========================================================================
    // LINKED ACCOUNTS
    // =========================================================================
    object LinkedAccounts {
        fun signInMethods(lang: String) = if (lang == TAMIL) "உள்நுழைவு முறைகள்" else "SIGN-IN METHODS"
        fun notConnected(lang: String) = if (lang == TAMIL) "இணைக்கப்படவில்லை" else "Not connected"
        fun connected(lang: String) = if (lang == TAMIL) "இணைக்கப்பட்டது" else "Connected"
        fun notLinked(lang: String) = if (lang == TAMIL) "இணைக்கப்படவில்லை" else "Not linked"
        fun unlinkGoogle(lang: String) = if (lang == TAMIL) "Google கணக்கை நீக்கு" else "Unlink Google Account"
        fun linkGoogle(lang: String) = if (lang == TAMIL) "Google கணக்கை இணை" else "Link Google Account"
        fun unlinkConfirm(lang: String) = if (lang == TAMIL) "Google கணக்கை நீக்கவா?" else "Unlink Google Account?"
        fun unlinkMessage(lang: String) = if (lang == TAMIL) "கடவுச்சொல் மூலம் உள்நுழைய வேண்டும்." else "You will need to sign in with your email and password after unlinking."
        fun createPasswordFirst(lang: String) = if (lang == TAMIL) "முதலில் கடவுச்சொல் உருவாக்கு" else "Create a password first"
        fun createPasswordMsg(lang: String) = if (lang == TAMIL) "Google ஐ நீக்கும் முன் கடவுச்சொல் உருவாக்க வேண்டும்." else "You must create a password first before unlinking Google, otherwise you won't be able to sign in."
        fun emailPassword(lang: String) = if (lang == TAMIL) "மின்னஞ்சல் & கடவுச்சொல்" else "EMAIL & PASSWORD"
        fun email(lang: String) = if (lang == TAMIL) "மின்னஞ்சல்" else "Email"
        fun password(lang: String) = if (lang == TAMIL) "கடவுச்சொல்" else "Password"
        fun passwordSet(lang: String) = if (lang == TAMIL) "கடவுச்சொல் அமைக்கப்பட்டது" else "Password set"
        fun noPasswordSet(lang: String) = if (lang == TAMIL) "கடவுச்சொல் இல்லை" else "No password set"
        fun create(lang: String) = if (lang == TAMIL) "உருவாக்கு" else "Create"
        fun unlink(lang: String) = if (lang == TAMIL) "நீக்கு" else "Unlink"
        fun createPassword(lang: String) = if (lang == TAMIL) "கடவுச்சொல் உருவாக்கு" else "Create Password"
        fun infoMessage(lang: String) = if (lang == TAMIL) "பல உள்நுழைவு முறைகளை இணைப்பது உங்கள் கணக்கை பாதுகாப்பாக அணுக உதவும்." else "Linking multiple sign-in methods gives you more ways to access your account securely."
    }
}

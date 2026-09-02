package com.elvan.neram.ui.theme

import android.content.Context
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.ui.text.font.FontFamily
import com.elvan.neram.ui.mozhiyaakkam.K
import com.elvan.neram.ui.mozhiyaakkam.tr
import com.elvan.neram.ui.mozhiyaakkam.trWithLang

/**
 * CompositionLocal for app language code.
 * Provides the current language setting throughout the app ("en", "ta", "ta-Latn").
 */
val LocalAppLanguage = compositionLocalOf { "en" }

/**
 * CompositionLocal for app font family.
 * Tamil ("ta") → MuktaMalar, English ("en") & Tanglish ("ta-Latn") → ElvanSansFontFamily.
 */
val LocalAppFontFamily = compositionLocalOf<FontFamily> { ElvanSansFontFamily }

/**
 * Centralized App Strings with 3-language support (English, Tamil, Tanglish).
 */
object AppStrings {
    // Language codes
    const val SYSTEM = K.SYSTEM
    const val ENGLISH = K.ENGLISH
    const val TAMIL = K.TAMIL
    const val TAMIL_LATIN = K.TAMIL_LATIN

    /**
     * Get the effective language code based on user preference.
     */
    fun getEffectiveLanguage(preference: String, context: Context): String {
        return when (preference) {
            ENGLISH -> ENGLISH
            TAMIL -> TAMIL
            TAMIL_LATIN -> TAMIL_LATIN
            SYSTEM -> {
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
        fun home(lang: String) = K.navHome.tr(lang)
        fun neram(lang: String) = K.navNeram.tr(lang)
        fun schedule(lang: String) = K.navSchedule.tr(lang)
        fun calendar(lang: String) = K.navCalendar.tr(lang)
        fun notes(lang: String) = K.navNotes.tr(lang)
    }

    // =========================================================================
    // HOME SCREEN
    // =========================================================================
    object Home {
        fun selectDate(lang: String) = K.selectDate.tr(lang)
        fun academicCalendar(lang: String) = K.academicCalendar.tr(lang)
        fun schedule(lang: String) = K.schedule.tr(lang)
        fun workingDay(lang: String) = K.workingDay.tr(lang)
        fun regularWorkingDay(lang: String) = K.regularWorkingDay.tr(lang)
        fun noEventsScheduled(lang: String) = K.noEventsScheduled.tr(lang)
        fun offline(lang: String) = K.offline.tr(lang)
        fun offlineMessage(lang: String) = K.offlineMessage.tr(lang)
        fun ok(lang: String) = K.ok.tr(lang)
        fun cancel(lang: String) = K.cancel.tr(lang)
        fun followingOrder(order: String, lang: String) = K.followingOrder.trWithLang(lang, order)
        fun greeting(lang: String) = K.greeting.tr(lang)
        fun welcomeToNeram(lang: String) = K.welcomeToNeram.tr(lang)
        fun gladYouAreHere(lang: String) = K.gladYouAreHere.tr(lang)
        fun vanakkam(lang: String) = K.vanakkam.tr(lang)
        fun classesSuspended(lang: String) = K.classesSuspended.tr(lang)
        fun system(lang: String) = K.system.tr(lang)
        fun noUpdates(lang: String) = K.noUpdates.tr(lang)
        fun todaysEvent(lang: String) = K.todaysEvent.tr(lang)
        fun specialEvent(lang: String) = K.specialEvent.tr(lang)
        fun fullDay(lang: String) = K.fullDay.tr(lang)
        fun noClasses(lang: String) = K.noClasses.tr(lang)
        fun event(lang: String) = K.event.tr(lang)
        fun todaysExam(lang: String) = K.todaysExam.tr(lang)
        fun todaysPracticalExam(lang: String) = K.todaysPracticalExam.tr(lang)
        fun noClassesScheduled(lang: String) = K.noClassesScheduled.tr(lang)
        fun liveUpdates(section: String, lang: String) = K.liveUpdates.trWithLang(lang, section)
        fun generalNotice(lang: String) = K.generalNotice.tr(lang)
        fun noUpdatesForDate(lang: String) = K.noUpdatesForDate.tr(lang)
        fun noGeneralNotices(lang: String) = K.noGeneralNotices.tr(lang)
        fun lab(lang: String) = K.lab.tr(lang)
        fun specialSession(lang: String) = K.specialSession.tr(lang)
        fun fullDayEvent(lang: String) = K.fullDayEvent.tr(lang)
        fun edit(lang: String) = K.edit.tr(lang)
        fun postedBy(lang: String) = K.postedBy.tr(lang)
        fun holiday(lang: String) = K.holiday.tr(lang)
    }

    // =========================================================================
    // SCHEDULE SCREEN
    // =========================================================================
    object Schedule {
        fun schedule(lang: String) = K.schedule.tr(lang)
        fun classCounselors(lang: String) = K.classCounselors.tr(lang)
        fun keyCoordinators(lang: String) = K.keyCoordinators.tr(lang)
        fun noInfoAvailable(lang: String) = K.noInfoAvailable.tr(lang)
        fun noSubjectsScheduled(lang: String) = K.noSubjectsScheduled.tr(lang)
        fun noBatchesScheduled(lang: String) = K.noBatchesScheduled.tr(lang)
        fun students(count: Int, lang: String) = K.students.trWithLang(lang, count)
        fun periods(lang: String) = K.periods.tr(lang)
        fun classesTab(lang: String) = K.classesTab.tr(lang)
        fun examsTab(lang: String) = K.examsTab.tr(lang)
        fun weeklySchedule(lang: String) = K.weeklySchedule.tr(lang)
        fun collapse(lang: String) = K.collapse.tr(lang)
        fun expand(lang: String) = K.expand.tr(lang)
        fun noClassesOn(day: String, lang: String) = K.noClassesOn.trWithLang(lang, day)
        fun ongoingExams(lang: String) = K.ongoingExams.tr(lang)
        fun noOngoingExams(lang: String) = K.noOngoingExams.tr(lang)
        fun noExamTimetables(lang: String) = K.noExamTimetables.tr(lang)
        fun upcomingExams(lang: String) = K.upcomingExams.tr(lang)
        fun finishedExams(lang: String) = K.finishedExams.tr(lang)
        fun academicCourses(lang: String) = K.academicCourses.tr(lang)
        fun dayMonday(lang: String) = K.dayMonday.tr(lang)
        fun dayTuesday(lang: String) = K.dayTuesday.tr(lang)
        fun dayWednesday(lang: String) = K.dayWednesday.tr(lang)
        fun dayThursday(lang: String) = K.dayThursday.tr(lang)
        fun dayFriday(lang: String) = K.dayFriday.tr(lang)
        fun daySaturday(lang: String) = K.daySaturday.tr(lang)
        fun daySunday(lang: String) = K.daySunday.tr(lang)
    }

    // =========================================================================
    // CALENDAR SCREEN
    // =========================================================================
    object Calendar {
        fun academicCalendar(lang: String) = K.academicCalendar.tr(lang)
        fun selectDate(lang: String) = K.selectDate.tr(lang)
        fun workingDay(lang: String) = K.workingDay.tr(lang)
        fun regularWorkingDay(lang: String) = K.regularWorkingDay.tr(lang)
        fun noEventsScheduled(lang: String) = K.noEventsScheduled.tr(lang)
        fun dayMonday(lang: String) = K.dayMonday.tr(lang)
        fun dayTuesday(lang: String) = K.dayTuesday.tr(lang)
        fun dayWednesday(lang: String) = K.dayWednesday.tr(lang)
        fun dayThursday(lang: String) = K.dayThursday.tr(lang)
        fun dayFriday(lang: String) = K.dayFriday.tr(lang)
        fun daySaturday(lang: String) = K.daySaturday.tr(lang)
        fun daySunday(lang: String) = K.daySunday.tr(lang)
    }

    // =========================================================================
    // DISPLAY SETTINGS
    // =========================================================================
    object Display {
        fun lightTheme(lang: String) = K.lightMode.tr(lang)
        fun darkTheme(lang: String) = K.darkMode.tr(lang)
        fun systemAuto(lang: String) = K.systemAuto.tr(lang)
        fun themeDescription(lang: String) = K.themeDescription.tr(lang)
    }

    // =========================================================================
    // SETTINGS
    // =========================================================================
    object Settings {
        fun title(lang: String) = K.settings.tr(lang)
        fun display(lang: String) = K.display.tr(lang)
        fun displayDesc(lang: String) = K.displayDesc.tr(lang)
        fun storageData(lang: String) = K.storageData.tr(lang)
        fun storageDesc(lang: String) = K.storageDesc.tr(lang)
        fun security(lang: String) = K.security.tr(lang)
        fun securityDesc(lang: String) = K.securityDesc.tr(lang)
        fun complaints(lang: String) = K.complaints.tr(lang)
        fun complaintsDesc(lang: String) = K.complaintsDesc.tr(lang)
        fun aboutDeveloper(lang: String) = K.aboutDeveloper.tr(lang)
        fun aboutApp(lang: String) = K.aboutApp.tr(lang)
        fun aboutAppDesc(lang: String) = K.aboutAppDesc.tr(lang)
        fun neramAccount(lang: String) = K.neramAccount.tr(lang)
        fun accounts(lang: String) = K.accounts.tr(lang)
        fun account(lang: String) = K.accounts.tr(lang)
        fun dangerZone(lang: String) = K.dangerZone.tr(lang)
        fun userDirectory(lang: String) = K.userDirectory.tr(lang)
        fun userDirectoryDesc(lang: String) = K.userDirectoryDesc.tr(lang)
        fun signOut(lang: String) = K.signOut.tr(lang)
        fun signOutConfirm(lang: String) = K.signOutConfirm.tr(lang)
        fun signOutMessage(lang: String) = K.signOutMessage.tr(lang)
        fun changePassword(lang: String) = K.changePassword.tr(lang)
        fun deleteAccount(lang: String) = K.deleteAccount.tr(lang)
        fun importantSites(lang: String) = K.importantSites.tr(lang)
        fun importantSitesDesc(lang: String) = K.importantSitesDesc.tr(lang)
        fun aboutRmk(lang: String) = K.aboutRmk.tr(lang)
        fun aboutRmkDesc(lang: String) = K.aboutRmkDesc.tr(lang)
        fun contact(lang: String) = K.contact.tr(lang)
        fun contactDesc(lang: String) = K.contactDesc.tr(lang)
        fun managementTeam(lang: String) = K.managementTeam.tr(lang)

        // Language Settings
        fun language(lang: String) = K.language.tr(lang)
        fun languageDesc(lang: String) = K.languageDesc.tr(lang)
        fun deviceLanguage(lang: String) = K.deviceLanguage.tr(lang)
        fun english(lang: String) = K.english.tr(lang)
        fun tamil(lang: String) = K.tamil.tr(lang)
        fun tamilLatin(lang: String) = K.tamilLatin.tr(lang)
        fun elvanNavil(lang: String) = K.elvanNavil.tr(lang)
        fun elvanNavilDesc(lang: String) = K.elvanNavilDesc.tr(lang)
        fun pushNotifications(lang: String) = K.pushNotifications.tr(lang)
        fun notificationTimings(lang: String) = K.notificationTimings.tr(lang)
        fun notificationNote(lang: String) = K.notificationNote.tr(lang)
        fun editProfile(lang: String) = K.editProfile.tr(lang)
        fun feedback(lang: String) = K.feedback.tr(lang)
        fun calendarSettings(lang: String) = K.academicCalendar.tr(lang)
        fun linkedAccounts(lang: String) = K.linkedAccounts.tr(lang)
        fun notifications(lang: String) = K.pushNotifications.tr(lang)
        fun notificationSettings(lang: String) = K.pushNotifications.tr(lang)
        fun documents(lang: String) = K.documents.tr(lang)
    }

    // =========================================================================
    // NOTES
    // =========================================================================
    object Notes {
        fun notUploadedTitle(lang: String) = K.notUploadedTitle.tr(lang)
        fun notUploadedMessage(lang: String) = K.notUploadedMessage.tr(lang)
        fun unit(number: Int, lang: String) = K.unit.trWithLang(lang, number)
    }

    // =========================================================================
    // COMMON
    // =========================================================================
    object Common {
        fun loading(lang: String) = K.loading.tr(lang)
        fun error(lang: String) = K.error.tr(lang)
        fun retry(lang: String) = K.retry.tr(lang)
        fun save(lang: String) = K.save.tr(lang)
        fun delete(lang: String) = K.delete.tr(lang)
        fun confirm(lang: String) = K.confirm.tr(lang)
        fun back(lang: String) = K.back.tr(lang)
    }

    // =========================================================================
    // STORAGE SETTINGS
    // =========================================================================
    object Storage {
        fun cleanupOptions(lang: String) = K.cleanupOptions.tr(lang)
        fun clearOldUpdates(lang: String) = K.clearOldUpdates.tr(lang)
        fun clearOldUpdatesDesc(lang: String) = K.clearOldUpdatesDesc.tr(lang)
        fun customRangeDeletion(lang: String) = K.customRangeDeletion.tr(lang)
        fun customRangeDesc(lang: String) = K.customRangeDesc.tr(lang)
        fun optimizationInfo(lang: String) = K.optimizationInfo.tr(lang)
        fun confirmDeletion(lang: String) = K.confirmDeletion.tr(lang)
        fun clearNow(lang: String) = K.clearNow.tr(lang)
        fun deleteData(lang: String) = K.deleteData.tr(lang)
        fun selectRange(lang: String) = K.selectRange.tr(lang)
        fun selectDateRange(lang: String) = K.selectDateRange.tr(lang)
        fun chooseUpdatesToWipe(lang: String) = K.chooseUpdatesToWipe.tr(lang)
        fun clearConfirmMessage(lang: String) = K.clearConfirmMessage.tr(lang)
        fun clearedMessage(lang: String) = K.clearedMessage.tr(lang)
    }

    // =========================================================================
    // LINKED ACCOUNTS
    // =========================================================================
    object LinkedAccounts {
        fun signInMethods(lang: String) = K.signInMethods.tr(lang)
        fun emailPassword(lang: String) = K.emailPassword.tr(lang)
        fun email(lang: String) = K.emailAddress.tr(lang)
        fun password(lang: String) = K.password.tr(lang)
        fun passwordSet(lang: String) = K.passwordSet.tr(lang)
        fun noPasswordSet(lang: String) = K.noPasswordSet.tr(lang)
        fun google(lang: String) = K.google.tr(lang)
        fun connected(lang: String) = K.connected.tr(lang)
        fun notConnected(lang: String) = K.notConnected.tr(lang)
        fun notLinked(lang: String) = notConnected(lang)
        fun create(lang: String) = K.create.tr(lang)
        fun createPassword(lang: String) = K.createPassword.tr(lang)
        fun infoText(lang: String) = K.linkedAccountsInfoText.tr(lang)
        fun infoMessage(lang: String) = infoText(lang)
        fun linkGoogle(lang: String) = K.linkGoogle.tr(lang)
        fun unlinkGoogle(lang: String) = K.unlinkGoogle.tr(lang)
        fun unlinkConfirm(lang: String) = K.unlinkConfirm.tr(lang)
        fun unlinkConfirm(provider: String, lang: String) = K.unlinkConfirm.tr(lang)
        fun unlinkMessage(lang: String) = K.unlinkMessage.tr(lang)
        fun unlinkMessage(provider: String, lang: String) = K.unlinkMessage.tr(lang)
        fun createPasswordMsg(lang: String) = K.createPasswordMsg.tr(lang)
        fun createPasswordFirst(lang: String) = K.createPasswordFirst.tr(lang)
        fun unlink(lang: String) = K.unlink.tr(lang)
    }
}

package com.elvan.neram.ui.mozhiyaakkam

fun mlymToTaml(text: String): String {
    val sb = StringBuilder(text.length + 8)
    var i = 0
    val n = text.length

    while (i < n) {
        val c = text[i]

        // Word-final Virama '്' after consonant -> Tamil 'ു' (Kutriyalukaram)
        if (c == '\u0D4D') {
            val isWordEnd = (i == n - 1) || !text[i + 1].isLetter()
            if (isWordEnd && i > 0 && (text[i - 1] in '\u0D15'..'\u0D39')) {
                sb.append('\u0BC1')
                i++
                continue
            }
        }

        val mapped = when (c) {
            // Independent Vowels
            '\u0D05' -> "\u0B85" // അ -> அ
            '\u0D06' -> "\u0B86" // ആ -> ஆ
            '\u0D07' -> "\u0B87" // ഇ -> இ
            '\u0D08' -> "\u0B88" // ഈ -> ஈ
            '\u0D09' -> "\u0B89" // ഉ -> உ
            '\u0D0A' -> "\u0B8A" // ഊ -> ஊ
            '\u0D0B' -> "\u0BB0\u0BBF" // ഋ -> റി
            '\u0D0E' -> "\u0B8E" // എ -> எ
            '\u0D0F' -> "\u0B8F" // ഏ -> ஏ
            '\u0D10' -> "\u0B90" // ഐ -> ஐ
            '\u0D12' -> "\u0B92" // ഒ -> ஒ
            '\u0D13' -> "\u0B93" // ഓ -> ஓ
            '\u0D14' -> "\u0B94" // ഔ -> ஔ

            // Anusvara & Visarga
            '\u0D02' -> "\u0BAE\u0BCD" // ം -> ம்
            '\u0D03' -> "\u0B83"     // ഃ -> ஃ (Aytham)

            // Chillu letters
            '\u0D7B' -> "\u0BA9\u0BCD" // ൻ -> ன்
            '\u0D7A' -> "\u0BA3\u0BCD" // ൺ -> ண்
            '\u0D7C' -> "\u0BB0\u0BCD" // ർ -> ർ
            '\u0D7D' -> "\u0BB2\u0BCD" // ൽ -> ൽ
            '\u0D7E' -> "\u0BB3\u0BCD" // ൾ -> ൾ -> ள்
            '\u0D7F' -> "\u0B95\u0BCD" // ൿ -> க்

            // Consonants
            '\u0D15', '\u0D16', '\u0D17', '\u0D18' -> "\u0B95" // ക, ഖ, ഗ, ഘ -> க
            '\u0D19' -> "\u0B99" // ങ -> ங
            '\u0D1A', '\u0D1B', '\u0D1D' -> "\u0B9A" // ച, ഛ, ഝ -> ச
            '\u0D1C' -> "\u0B9C" // ജ -> ஜ (Grantha Ja)
            '\u0D1E' -> "\u0B9E" // ഞ -> ஞ
            '\u0D1F', '\u0D20', '\u0D21', '\u0D22' -> "\u0B9F" // ട, ഠ, ഡ, ഢ -> ட
            '\u0D23' -> "\u0BA3" // ണ -> ண
            '\u0D24', '\u0D25', '\u0D26', '\u0D27' -> "\u0BA4" // ത, ഥ, ദ, ധ -> த
            '\u0D28' -> "\u0BA8" // ന -> ந
            '\u0D29' -> "\u0BA9" // ഩ -> ன
            '\u0D2A', '\u0D2B', '\u0D2C', '\u0D2D' -> "\u0BAA" // പ, ഫ, ബ, ഭ -> ப
            '\u0D2E' -> "\u0BAE" // മ -> ம
            '\u0D2F' -> "\u0BAF" // യ -> ய
            '\u0D30' -> "\u0BB0" // ര -> ர
            '\u0D31' -> "\u0BB1" // റ -> ற
            '\u0D32' -> "\u0BB2" // ല -> ல
            '\u0D33' -> "\u0BB3" // ള -> ள
            '\u0D34' -> "\u0BB4" // ഴ -> ழ
            '\u0D35' -> "\u0BB5" // വ -> வ
            '\u0D36' -> "\u0BB6" // ശ -> ஶ (Grantha Sha)
            '\u0D37' -> "\u0BB7" // ഷ -> ஷ (Grantha Sha)
            '\u0D38' -> "\u0BB8" // സ -> ஸ (Grantha Sa)
            '\u0D39' -> "\u0BB9" // ഹ -> ഹ (Grantha Ha)

            // Vowel signs
            '\u0D3E' -> "\u0BBE" // ാ -> ா
            '\u0D3F' -> "\u0BBF" // ി -> ி
            '\u0D40' -> "\u0BC0" // ീ -> ீ
            '\u0D41' -> "\u0BC1" // ു -> ു
            '\u0D42' -> "\u0BC2" // ൂ -> ൂ
            '\u0D43' -> "\u0BBF\u0BB0\u0BBF" // ൃ -> ிரி
            '\u0D46' -> "\u0BC6" // െ -> ெ
            '\u0D47' -> "\u0BC7" // േ -> ே
            '\u0D48' -> "\u0BC8" // ൈ -> ை
            '\u0D4A' -> "\u0BCA" // ൊ -> ொ
            '\u0D4B' -> "\u0BCB" // ോ -> ോ
            '\u0D4C', '\u0D57' -> "\u0BCC" // ൌ, ൗ -> ௌ
            '\u0D4D' -> "\u0BCD" // ് -> ்

            else -> c.toString()
        }
        sb.append(mapped)
        i++
    }
    return sb.toString()
}

data class MlVar(
    val ml: String,
    val latn: String,
    val taml: String = mlymToTaml(ml)
)

val ml: Map<String, MlVar> = mapOf(
    K.navHome to MlVar(
        ml = "മുഖപ്പ്",
        latn = "Mukhapp"
    ),
    K.navNeram to MlVar(
        ml = "നേരം",
        latn = "Neram"
    ),
    K.navSchedule to MlVar(
        ml = "നേരപ്പട്ടിക",
        latn = "Nerappattika"
    ),
    K.navCalendar to MlVar(
        ml = "നാൾവഴി",
        latn = "Naalvazhi"
    ),
    K.navNotes to MlVar(
        ml = "കുറിപ്പുകൾ",
        latn = "Kurippukal"
    ),
    K.loading to MlVar(
        ml = "തുടങ്ങുന്നു...",
        latn = "Thudangunnu..."
    ),
    K.error to MlVar(
        ml = "പിഴവ്",
        latn = "Pizhavu"
    ),
    K.retry to MlVar(
        ml = "വീണ്ടും നോക്കുക",
        latn = "Veendum Nookkuka"
    ),
    K.save to MlVar(
        ml = "കാത്തുവെക്കുക",
        latn = "Kaathuvekkuka"
    ),
    K.delete to MlVar(
        ml = "മായ്ക്കുക",
        latn = "Maaykkuka"
    ),
    K.confirm to MlVar(
        ml = "ഉറപ്പാക്കുക",
        latn = "Urappaakkuka"
    ),
    K.back to MlVar(
        ml = "തിരികെ",
        latn = "Thirike"
    ),
    K.cancel to MlVar(
        ml = "വേണ്ട",
        latn = "Venda"
    ),
    K.ok to MlVar(
        ml = "ശരി",
        latn = "Shari"
    ),
    K.edit to MlVar(
        ml = "തിരുത്തുക",
        latn = "Thiruthuka"
    ),
    K.offline to MlVar(
        ml = "നെറ്റ് ഇല്ല",
        latn = "Net Illa"
    ),
    K.offlineMessage to MlVar(
        ml = "വിവരങ്ങൾ എടുക്കാൻ ഇന്റർനെറ്റ് വേണം.",
        latn = "Vivarangal Edukkaan Internet Veenam."
    ),
    K.fromElvanNavil to MlVar(
        ml = "എൽവൻ നവിൽ ഒരുക്കിയത്",
        latn = "Elvan Navil Orukkiyathu"
    ),
    K.elvanNavil to MlVar(
        ml = "എൽവൻ നവിൽ",
        latn = "Elvan Navil"
    ),
    K.elvanNavilDesc to MlVar(
        ml = "എൽവൻ പാർത്തച്ചാരതിയുടെ നിർമ്മിതി",
        latn = "Elvan Paarthachaarathiyude Nirmmithi"
    ),
    K.elvanParthasarathy to MlVar(
        ml = "എൽവൻ പാർത്തച്ചാരതി",
        latn = "Elvan Paarthachaarathi"
    ),
    K.greeting to MlVar(
        ml = "വണക്കം!",
        latn = "Vanakkam!"
    ),
    K.welcomeToNeram to MlVar(
        ml = "വരവേൽപ്പ്!",
        latn = "Varavelppu!"
    ),
    K.gladYouAreHere to MlVar(
        ml = "നിങ്ങളെ കണ്ടതിൽ മകിഴ്ച്ചി 😊",
        latn = "Ningaley Kandathil Makizhchi 😊"
    ),
    K.vanakkam to MlVar(
        ml = "വണക്കം!",
        latn = "Vanakkam!"
    ),
    K.selectDate to MlVar(
        ml = "നാൾ തിരഞ്ഞെടുക്കുക",
        latn = "Naal Thiranjedukkuka"
    ),
    K.academicCalendar to MlVar(
        ml = "പഠന നാൾവഴി",
        latn = "Padana Naalvazhi"
    ),
    K.schedule to MlVar(
        ml = "നേരപ്പട്ടിക",
        latn = "Nerappattika"
    ),
    K.workingDay to MlVar(
        ml = "പണിനാൾ",
        latn = "Paninaal"
    ),
    K.regularWorkingDay to MlVar(
        ml = "പതിവ് പണിനാൾ",
        latn = "Pathivu Paninaal"
    ),
    K.noEventsScheduled to MlVar(
        ml = "പരിപാടികൾ ഒന്നുമില്ല",
        latn = "Paripaadikal Onnumilla"
    ),
    K.followingOrder to MlVar(
        ml = "%s ക്രമം പിന്തുടരുന്നു",
        latn = "%s Kramam Pinthudarunnu"
    ),
    K.classesSuspended to MlVar(
        ml = "ക്ലാസ്സുകൾ അവധിയാണ്",
        latn = "Classukal Avadhiyaanu"
    ),
    K.system to MlVar(
        ml = "സിസ്റ്റം",
        latn = "System"
    ),
    K.noUpdates to MlVar(
        ml = "ഇന്ന് പുതിയ അറിയിപ്പുകളില്ല.",
        latn = "Innu Puthiya Ariyippukalilla."
    ),
    K.todaysEvent to MlVar(
        ml = "ഇന്നത്തെ പരിപാടി",
        latn = "Innathe Paripaadi"
    ),
    K.specialEvent to MlVar(
        ml = "ചിറപ്പ് പരിപാടി",
        latn = "Chirappu Paripaadi"
    ),
    K.fullDay to MlVar(
        ml = "മുഴുനാൾ",
        latn = "Muzhunaal"
    ),
    K.noClasses to MlVar(
        ml = "ക്ലാസ്സില്ല",
        latn = "Classilla"
    ),
    K.event to MlVar(
        ml = "പരിപാടി",
        latn = "Paripaadi"
    ),
    K.todaysExam to MlVar(
        ml = "ഇന്നത്തെ പരീക്ഷ",
        latn = "Innathe Pareeksha"
    ),
    K.todaysPracticalExam to MlVar(
        ml = "ഇന്നത്തെ പ്രാക്ടിക്കൽ പരീക്ഷ",
        latn = "Innathe Practical Pareeksha"
    ),
    K.noClassesScheduled to MlVar(
        ml = "ക്ലാസ്സുകൾ ഇല്ല",
        latn = "Classukal Illa"
    ),
    K.liveUpdates to MlVar(
        ml = "നേരടി പുതുക്കലുകൾ (%s)",
        latn = "Neradi Puthukkalukal (%s)"
    ),
    K.generalNotice to MlVar(
        ml = "പൊതു അറിയിപ്പ്",
        latn = "Pothu Ariyippu"
    ),
    K.noUpdatesForDate to MlVar(
        ml = "ഈ നാളിൽ പുതിയ അറിയിപ്പുകളില്ല.",
        latn = "Ee Naalil Puthiya Ariyippukalilla."
    ),
    K.noGeneralNotices to MlVar(
        ml = "പൊതു അറിയിപ്പുകൾ ഒന്നുമില്ല.",
        latn = "Pothu Ariyippukal Onnumilla."
    ),
    K.lab to MlVar(
        ml = "ലാബ്",
        latn = "Lab"
    ),
    K.specialSession to MlVar(
        ml = "ചിറപ്പ് ക്ലാസ്സ്",
        latn = "Chirappu Class"
    ),
    K.fullDayEvent to MlVar(
        ml = "മുഴുനാൾ പരിപാടി",
        latn = "Muzhunaal Paripaadi"
    ),
    K.postedBy to MlVar(
        ml = "പതിവിട്ടത് ",
        latn = "Pathivittathu "
    ),
    K.typeHere to MlVar(
        ml = "ഇവിടെ ടൈപ്പ് ചെയ്യുക...",
        latn = "Ivide Type Cheyyuka..."
    ),
    K.studentsCount to MlVar(
        ml = "%s പഠിതാക്കൾ",
        latn = "%s Padithaakkal"
    ),
    K.scheduledForToday to MlVar(
        ml = "ഇന്ന് വെച്ചിട്ടുള്ളത്",
        latn = "Innu Vechittullathu"
    ),
    K.noEventsDeclared to MlVar(
        ml = "പരിപാടികൾ അറിയിച്ചിട്ടില്ല",
        latn = "Paripaadikal Ariyichittilla"
    ),
    K.systemReminder to MlVar(
        ml = "സിസ്റ്റം ഓർമ്മപ്പെടുത്തൽ",
        latn = "System Ormmappeduthal"
    ),
    K.bringLabcoatsEssentials to MlVar(
        ml = "📚 ലാബ് കോട്ടുകൾ, ലാപ്ടോപ്പുകൾ, മറ്റ് ലാബ് സാധനങ്ങൾ എന്നിവ എടുത്തുവരിക",
        latn = "📚 Lab Coatukal, Laptopukal, Mettu Lab Saadhanangal Enniva Eduthuvarika"
    ),
    K.studyWellExamWish to MlVar(
        ml = "📖 പരീക്ഷയ്ക്ക് നന്നായി പഠിക്കുക! മുഴുവൻ വെറ്റിയും നേടുക! 🎯",
        latn = "📖 Pareekshakku Nannaayi Padikkuka! Muzhuvan Vetriyum Neduka! 🎯"
    ),
    K.noAcademicCalendarScheduled to MlVar(
        ml = "പഠന നാൾവഴി വിവരങ്ങളില്ല",
        latn = "Padana Naalvazhi Vivarangalilla"
    ),
    K.open to MlVar(
        ml = "തുറക്കുക",
        latn = "Thurakkuka"
    ),
    K.dismiss to MlVar(
        ml = "ഒഴിവാക്കുക",
        latn = "Ozhivaakkuka"
    ),
    K.classesSuspendedDueTo to MlVar(
        ml = "%s മുന്നിട്ട് ക്ലാസ്സുകൾ അവധിയാണ്.",
        latn = "%s Munnittu Classukal Avadhiyaanu."
    ),
    K.userNotLoggedIn to MlVar(
        ml = "ലോഗിൻ ചെയ്തിട്ടില്ല.",
        latn = "Login Cheythittilla."
    ),
    K.failedToSaveUpdate to MlVar(
        ml = "പുതുക്കൽ കാത്തുവെക്കാൻ കഴിഞ്ഞില്ല",
        latn = "Puthukkal Kaathuvekkan Kazhinjilla"
    ),
    K.failedToSaveNotice to MlVar(
        ml = "അറിയിപ്പ് കാത്തുവെക്കാൻ കഴിഞ്ഞില്ല",
        latn = "Ariyippu Kaathuvekkan Kazhinjilla"
    ),
    K.failedToUpdatePlacement to MlVar(
        ml = "പ്ലേസ്മെന്റ് പുതുക്കാൻ കഴിഞ്ഞില്ല",
        latn = "Placement Puthukkan Kazhinjilla"
    ),
    K.dept to MlVar(
        ml = "തുറ",
        latn = "Thura"
    ),
    K.sec to MlVar(
        ml = "പിരിവ്",
        latn = "Pirivu"
    ),
    K.holiday to MlVar(
        ml = "അവധി",
        latn = "Avadhi"
    ),
    K.profile to MlVar(
        ml = "തൻവിവരം",
        latn = "Thanvivaram"
    ),
    K.dayReservedFor to MlVar(
        ml = "ഇന്നത്തെ നാൾ %s പരിപാടിക്കായി ഒതുക്കിയിരിക്കുന്നു.",
        latn = "Innathe Naal %s Paripaadikkaayi Othukkiyirikkunnu."
    ),
    K.regularClassesSuspendedDuring to MlVar(
        ml = "%s വേളയിൽ പതിവ് ക്ലാസ്സുകൾ ഉണ്ടായിരിക്കില്ല.",
        latn = "%s Velayil Pathivu Classukal Undayirikkilla."
    ),
    K.allDay to MlVar(
        ml = "മുഴുനാൾ",
        latn = "Muzhunaal"
    ),
    K.explore to MlVar(
        ml = "കാണുക",
        latn = "Kaanuka"
    ),
    K.monthView to MlVar(
        ml = "തിങ്കൾ കാഴ്ച",
        latn = "Thingal Kaazhcha"
    ),
    K.listView to MlVar(
        ml = "പട്ടിക കാഴ്ച",
        latn = "Pattika Kaazhcha"
    ),
    K.menu to MlVar(
        ml = "പട്ടി",
        latn = "Patti"
    ),
    K.cleanupFailed to MlVar(
        ml = "മായ്ക്കാൻ കഴിഞ്ഞില്ല",
        latn = "Maaykkaan Kazhinjilla"
    ),
    K.pushNotifications to MlVar(
        ml = "അറിയിപ്പുകൾ",
        latn = "Ariyippukal"
    ),
    K.notificationTimings to MlVar(
        ml = "അറിയിപ്പുകൾ, നേരങ്ങൾ & ഒരുക്കങ്ങൾ",
        latn = "Ariyippukal, Nerangal & Orukkangal"
    ),
    K.notificationNote to MlVar(
        ml = "കുറിപ്പ്: നോട്ടിഫിക്കേഷനുകൾ നിങ്ങളുടെ ഫോണിലെ ബാറ്ററിയെയും നെറ്റിനെയും പൊരുത്തിരിക്കും.",
        latn = "Kurippu: Notificationukal Ningalude Phonile Batteriyeyum Netineyum Poruthirikkum."
    ),
    K.classCounselors to MlVar(
        ml = "ക്ലാസ്സ് വഴികാട്ടികൾ",
        latn = "Class Vazhikaattikal"
    ),
    K.keyCoordinators to MlVar(
        ml = "പ്രധാന കോർഡിനേറ്റർമാർ",
        latn = "Pradhana Coordinator-maar"
    ),
    K.noInfoAvailable to MlVar(
        ml = "വിവരങ്ങൾ ലഭ്യമല്ല",
        latn = "Vivarangal Labyamalla"
    ),
    K.noSubjectsScheduled to MlVar(
        ml = "ഇന്ന് പാഠങ്ങൾ വെച്ചിട്ടില്ല",
        latn = "Innu Paadangal Vechittilla"
    ),
    K.noBatchesScheduled to MlVar(
        ml = "പിരിവുകൾ വെച്ചിട്ടില്ല",
        latn = "Pirivukal Vechittilla"
    ),
    K.noCoursesFound to MlVar(
        ml = "കോഴ്സുകൾ കണ്ടില്ല",
        latn = "Courseukal Kandilla"
    ),
    K.students to MlVar(
        ml = "%d പഠിതാക്കൾ",
        latn = "%d Padithaakkal"
    ),
    K.periods to MlVar(
        ml = "വേളകൾ",
        latn = "Velakal"
    ),
    K.classesTab to MlVar(
        ml = "ക്ലാസ്സുകൾ",
        latn = "Classukal"
    ),
    K.examsTab to MlVar(
        ml = "പരീക്ഷകൾ",
        latn = "Pareekshakal"
    ),
    K.weeklySchedule to MlVar(
        ml = "ആഴ്ച നേരപ്പട്ടിക",
        latn = "Aazhcha Nerappattika"
    ),
    K.collapse to MlVar(
        ml = "ചുരുക്കുക",
        latn = "Churukkuka"
    ),
    K.expand to MlVar(
        ml = "വിരിക്കുക",
        latn = "Virikkuka"
    ),
    K.noClassesOn to MlVar(
        ml = "%s ക്ലാസ്സുകൾ ഇല്ല",
        latn = "%s Classukal Illa"
    ),
    K.ongoingExams to MlVar(
        ml = "നടക്കുന്ന പരീക്ഷകൾ",
        latn = "Nadakkunna Pareekshakal"
    ),
    K.noOngoingExams to MlVar(
        ml = "ഇപ്പോൾ പരീക്ഷകൾ നടക്കുന്നില്ല",
        latn = "Ippol Pareekshakal Nadakkunnilla"
    ),
    K.noExamTimetables to MlVar(
        ml = "പരീക്ഷാ നേരപ്പട്ടിക വന്നിട്ടില്ല",
        latn = "Pareeksha Nerappattika Vannittilla"
    ),
    K.upcomingExams to MlVar(
        ml = "വരാനിരിക്കുന്ന പരീക്ഷകൾ",
        latn = "Varaanirikkunna Pareekshakal"
    ),
    K.finishedExams to MlVar(
        ml = "കഴിഞ്ഞ പരീക്ഷകൾ",
        latn = "Kazhinja Pareekshakal"
    ),
    K.academicCourses to MlVar(
        ml = "പഠന പാഠങ്ങൾ",
        latn = "Padana Paadangal"
    ),
    K.cardUpdate to MlVar(
        ml = "പുതുക്കൽ",
        latn = "Puthukkal"
    ),
    K.cardAlert to MlVar(
        ml = "മുന്നറിയിപ്പ്",
        latn = "Munnariyippu"
    ),
    K.cardNews to MlVar(
        ml = "വാർത്ത",
        latn = "Vaartha"
    ),
    K.cardTip to MlVar(
        ml = "കുറിപ്പ്",
        latn = "Kurippu"
    ),
    K.cardNotice to MlVar(
        ml = "അറിയിപ്പ്",
        latn = "Ariyippu"
    ),
    K.cardFeature to MlVar(
        ml = "മേന്മകൾ",
        latn = "Menmakal"
    ),
    K.officialDocuments to MlVar(
        ml = "കോളേജ് രേഖകൾ",
        latn = "College Rekhakal"
    ),
    K.downloadPdfForOffline to MlVar(
        ml = "ഓഫ്‌ലൈനായി കാണാൻ PDF ഡൗൺലോഡ് ചെയ്യുക",
        latn = "Offline-aayi Kaanan PDF Download Cheyyuka"
    ),
    K.linkCopiedToClipboard to MlVar(
        ml = "ലിങ്ക് പകർത്തിയിട്ടുണ്ട്",
        latn = "Link Pakarthiyittundu"
    ),
    K.noAcademicEvents to MlVar(
        ml = "പഠന പരിപാടികൾ ഒന്നുമില്ല",
        latn = "Padana Paripaadikal Onnumilla"
    ),
    K.noAcademicEventsFor to MlVar(
        ml = "%s-ൽ പഠന പരിപാടികൾ ഒന്നുമില്ല",
        latn = "%s-l Padana Paripaadikal Onnumilla"
    ),
    K.noUpcomingEvents to MlVar(
        ml = "വരാനിരിക്കുന്ന പരിപാടികൾ ഒന്നുമില്ല",
        latn = "Varaanirikkunna Paripaadikal Onnumilla"
    ),
    K.rmdCollegeWebsiteDesc to MlVar(
        ml = "RMD കോളേജിന്റെ ഔദ്യോഗിക വെബ്സൈറ്റ്.",
        latn = "RMD Collegeinte Audyogika Website."
    ),
    K.rmkNextgenStudentDesc to MlVar(
        ml = "കുട്ടികൾക്ക് ലോഗിൻ ചെയ്യാനും കാര്യങ്ങൾ അറിയാനുമുള്ള Nextgen പോർട്ടൽ.",
        latn = "Kuttikalkku Login Cheyyanum Karyangal Ariyanumulla Nextgen Portal."
    ),
    K.elvanNavilSiteDesc to MlVar(
        ml = "ചിന്തകളും എഴുത്തുകളും പങ്കുവെക്കുന്ന ഇടം — എൽവൻ നവിൽ.",
        latn = "Chinthakalum Ezhuthukalum Pankuvekkunna Idam — Elvan Navil."
    ),
    K.iamNeoDesc to MlVar(
        ml = "പഠനത്തിനും പ്ലേസ്മെന്റിനുമുള്ള ടൂളുകൾ.",
        latn = "Padanathinum Placementinumulla Toolukal."
    ),
    K.skillRackDesc to MlVar(
        ml = "കോഡിംഗ് പരിശീലിക്കാനുള്ള ടാസ്ക്കുകൾ.",
        latn = "Coding Parisheelikkanulla Taskukal."
    ),
    K.codeTantraDesc to MlVar(
        ml = "ക്ലാസ്സുകൾക്കും അസൈൻമെന്റുകൾക്കുമുള്ള പ്ലാറ്റ്ഫോം.",
        latn = "Classukalkkum Assignmentukalkkumulla Platform."
    ),
    K.google to MlVar(
        ml = "ഗൂഗിൾ",
        latn = "Google"
    ),
    K.googleProfile to MlVar(
        ml = "ഗൂഗിൾ പ്രൊഫൈൽ",
        latn = "Google Profile"
    ),
    K.googleAccountLinked to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് ബന്ധിപ്പിച്ചു!",
        latn = "Google Account Bandhippichu!"
    ),
    K.male to MlVar(
        ml = "ആൺ",
        latn = "Aan"
    ),
    K.female to MlVar(
        ml = "പെൺ",
        latn = "Pen"
    ),
    K.genderOther to MlVar(
        ml = "മറ്റുള്ളവ",
        latn = "Mattullava"
    ),
    K.morningWake to MlVar(
        ml = "കാലത്ത് ഉണരുന്നത്",
        latn = "Kaalathu Unarunnathu"
    ),
    K.preCollege to MlVar(
        ml = "കോളേജിന് മുൻപ്",
        latn = "Collegeinu Munpu"
    ),
    K.collegeEntry to MlVar(
        ml = "കോളേജിൽ നുഴയുമ്പോൾ",
        latn = "Collegil Nuzhayumbol"
    ),
    K.selectTime to MlVar(
        ml = "നേരം തിരഞ്ഞെടുക്കുക",
        latn = "Neram Thiranjedukkuka"
    ),
    K.elvanNavilBranding to MlVar(
        ml = "എൽവൻ നവിൽ",
        latn = "Elvan Navil"
    ),
    K.allRightsReserved to MlVar(
        ml = "© എല്ലാ അവകാശങ്ങളും സംരക്ഷിച്ചിരിക്കുന്നു",
        latn = "© Ella Avakashangalum Samrakshichirikkunnu"
    ),
    K.linkFailed to MlVar(
        ml = "ലിങ്ക് ചെയ്യാൻ കഴിഞ്ഞില്ല",
        latn = "Link Cheyyan Kazhinjilla"
    ),
    K.noIdTokenReceived to MlVar(
        ml = "ID ടോക്കൺ കിട്ടിയില്ല",
        latn = "ID Token Kittiyilla"
    ),
    K.googleSignInFailed to MlVar(
        ml = "ഗൂഗിൾ ലോഗിൻ തോൽവിയടഞ്ഞു",
        latn = "Google Login Tholviyadanju"
    ),
    K.couldNotLaunchGoogleSignIn to MlVar(
        ml = "ഗൂഗിൾ ലോഗിൻ തുടങ്ങാൻ കഴിഞ്ഞില്ല",
        latn = "Google Login Thudangan Kazhinjilla"
    ),
    K.welcomeBack to MlVar(
        ml = "വീണ്ടും വരവേൽപ്പ്",
        latn = "Veendum Varavelppu"
    ),
    K.signInToContinue to MlVar(
        ml = "തുടരാൻ ലോഗിൻ ചെയ്യുക",
        latn = "Thudaraan Login Cheyyuka"
    ),
    K.emailAddress to MlVar(
        ml = "ഇമെയിൽ വിലാസം",
        latn = "Email Vilasam"
    ),
    K.createAccount to MlVar(
        ml = "അക്കൗണ്ട് ഉണ്ടാക്കുക",
        latn = "Account Undaakkuka"
    ),
    K.fillDetailsToGetStarted to MlVar(
        ml = "തുടങ്ങാൻ വിവരങ്ങൾ നൽകുക",
        latn = "Thudangan Vivarangal Nalkuka"
    ),
    K.firstName to MlVar(
        ml = "ആദ്യ പേര്",
        latn = "Aadya Peru"
    ),
    K.lastName to MlVar(
        ml = "അവസാന പേര്",
        latn = "Avasana Peru"
    ),
    K.signUpWithGoogle to MlVar(
        ml = "ഗൂഗിൾ വഴി സൈൻ അപ്പ് ചെയ്യുക",
        latn = "Google Vazhi Sign Up Cheyyuka"
    ),
    K.collegeTimeSorted to MlVar(
        ml = "നിങ്ങളുടെ കോളേജ് നേരം ഇനി എളുപ്പമായി.",
        latn = "Ningalude College Neram Ini Eluppamaayi."
    ),
    K.tapAgreeAndContinue to MlVar(
        ml = "നേരം തുടങ്ങാൻ \"സമ്മതിച്ചു തുടരുക\" എന്നതിൽ തൊടുക.",
        latn = "Neram Thudangan \"Sammathichu Thudaruka\" Ennathil Thoduka."
    ),
    K.agreeAndContinue to MlVar(
        ml = "സമ്മതിച്ചു തുടരുക",
        latn = "Sammathichu Thudaruka"
    ),
    K.profileSetup to MlVar(
        ml = "തൻവിവരം ഒരുക്കുക",
        latn = "Thanvivaram Orukkuka"
    ),
    K.selectAcademicDetailsBelow to MlVar(
        ml = "നിങ്ങളുടെ കോളേജ് വിവരങ്ങൾ താഴെ തിരഞ്ഞെടുക്കുക",
        latn = "Ningalude College Vivarangal Thaazhe Thiranjedukkuka"
    ),
    K.academicBatch to MlVar(
        ml = "പഠന ബാച്ച്",
        latn = "Padana Batch"
    ),
    K.selectYear to MlVar(
        ml = "വർഷം തിരഞ്ഞെടുക്കുക",
        latn = "Varsham Thiranjedukkuka"
    ),
    K.completeSetup to MlVar(
        ml = "ഒരുക്കം തീർക്കുക",
        latn = "Orukkam Theerkkuka"
    ),
    K.previousMonth to MlVar(
        ml = "കഴിഞ്ഞ മാസം",
        latn = "Kazhinja Maasam"
    ),
    K.nextMonth to MlVar(
        ml = "അടുത്ത മാസം",
        latn = "Adutha Maasam"
    ),
    K.previousYear to MlVar(
        ml = "കഴിഞ്ഞ വർഷം",
        latn = "Kazhinja Varsham"
    ),
    K.nextYear to MlVar(
        ml = "അടുത്ത വർഷം",
        latn = "Adutha Varsham"
    ),
    K.noAcademicEventsScheduled to MlVar(
        ml = "പഠന പരിപാടികൾ ഒന്നും വെച്ചിട്ടില്ല.",
        latn = "Padana Paripaadikal Onnum Vechittilla."
    ),
    K.goToToday to MlVar(
        ml = "ഇന്നത്തേക്ക് പോവുക",
        latn = "Innathekku Povuka"
    ),
    K.eventsCount to MlVar(
        ml = "പരിപാടികൾ",
        latn = "Paripaadikal"
    ),
    K.holidaysCount to MlVar(
        ml = "അവധികൾ",
        latn = "Avadhikal"
    ),
    K.downloadingPdf to MlVar(
        ml = "PDF ഡൗൺലോഡ് ചെയ്യുന്നു...",
        latn = "PDF Download Cheyyunnu..."
    ),
    K.failedToLoadDocument to MlVar(
        ml = "രേഖ തുറക്കാൻ കഴിഞ്ഞില്ല",
        latn = "Rekha Thurakkan Kazhinjilla"
    ),
    K.goBack to MlVar(
        ml = "തിരികെ",
        latn = "Thirike"
    ),
    K.noItemsHere to MlVar(
        ml = "ഇവിടെ ഒന്നുമില്ല",
        latn = "Ivide Onnumilla"
    ),
    K.noUnitsAddedYet to MlVar(
        ml = "യൂണിറ്റുകൾ ഇതുവരെ ചേർത്തിട്ടില്ല",
        latn = "Unitukal Ithuvare Cherthittilla"
    ),
    K.noNotifications to MlVar(
        ml = "പുതിയ അറിയിപ്പുകൾ ഒന്നുമില്ല",
        latn = "Puthiya Ariyippukal Onnumilla"
    ),
    K.markAllRead to MlVar(
        ml = "എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക",
        latn = "Ellam Vayichathayi Adayalappeduthuka"
    ),
    K.clearAll to MlVar(
        ml = "എല്ലാം മായ്ക്കുക",
        latn = "Ellam Maaykkuka"
    ),
    K.identityVerifiedTryingAgain to MlVar(
        ml = "ഉറപ്പാക്കൽ തീർന്നു! വീണ്ടും നോക്കുന്നു...",
        latn = "Urappaakkal Theernnu! Veendum Nookkunnu..."
    ),
    K.verifyCustomIdentity to MlVar(
        ml = "നിങ്ങളാണെന്ന് ഉറപ്പാക്കുക",
        latn = "Ningalaanennu Urappaakkuka"
    ),
    K.verifyGoogleForPasswordDesc to MlVar(
        ml = "കാവലിനായി, മറവാക്ക് മാറ്റാൻ ഗൂഗിൾ വഴി വീണ്ടും ലോഗിൻ ചെയ്യുക.",
        latn = "Kaavalinaayi, Maravaakku Maattan Google Vazhi Veendum Login Cheyyuka."
    ),
    K.verify to MlVar(
        ml = "ഉറപ്പാക്കുക",
        latn = "Urappaakkuka"
    ),
    K.googleAccountUnlinked to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് ഒഴിവാക്കി",
        latn = "Google Account Ozhivaakki"
    ),
    K.identityVerifiedDeletingAccount to MlVar(
        ml = "ഉറപ്പാക്കൽ തീർന്നു! അക്കൗണ്ട് മായ്ക്കുന്നു...",
        latn = "Urappaakkal Theernnu! Account Maaykkunnu..."
    ),
    K.accountDeleted to MlVar(
        ml = "അക്കൗണ്ട് മായ്ച്ചു",
        latn = "Account Maaychu"
    ),
    K.verifyIdentityForDeletion to MlVar(
        ml = "മായ്ക്കാൻ നിങ്ങളാണെന്ന് ഉറപ്പാക്കുക",
        latn = "Maaykkaan Ningalaanennu Urappaakkuka"
    ),
    K.verifyGoogleForDeletionDesc to MlVar(
        ml = "അക്കൗണ്ട് കളയുന്നത് വലിയ കാര്യമാണ്. ഉറപ്പാക്കാൻ വീണ്ടും ഗൂഗിൾ വഴി ലോഗിൻ ചെയ്യുക.",
        latn = "Account Kalayunnathu Valiya Karyamaanu. Urappaakkan Veendum Google Vazhi Login Cheyyuka."
    ),
    K.secretary to MlVar(
        ml = "സെക്രട്ടറി",
        latn = "Secretary"
    ),
    K.rsMunirathinamBio to MlVar(
        ml = "തമിഴ്‌നാട് നിയമസഭയിലെ മുൻ അംഗമായി പ്രവർത്തിച്ച്, RMK ഗ്രൂപ്പ് തുടങ്ങിയ ദീർഘദർശി.",
        latn = "Tamil Nadu Niyamasabhayile Mun Angamaayi Pravarthichu, RMK Group Thudangiya Deerghadarshi."
    ),
    K.rmKishoreBio to MlVar(
        ml = "ഇംഗ്ലണ്ടിൽ MBA കഴിഞ്ഞ മെക്കാനിക്കൽ എഞ്ചിനീയർ. കുട്ടികളെ ആഗോള നിലവാരമുള്ളവരാക്കാൻ ശ്രദ്ധിക്കുന്നു.",
        latn = "Englandil MBA Kazhinja Mechanical Engineer. Kuttikale Aagola Nilavaramullavarakkan Shraddhikkunnu."
    ),
    K.manjulaMunirathinamBio to MlVar(
        ml = "പത്തുവർഷത്തിലധികമായി ഈ സ്ഥാപനത്തിനായി അർപ്പണബോധത്തോടെ പ്രവർത്തിക്കുന്ന സാമൂഹ്യ പ്രവർത്തക.",
        latn = "Pathu Varshathiladhikamaayi Ee Sthapanathinaayi Arppanabodhatthode Pravarthikkunna Saamoohya Pravarthaka."
    ),
    K.jothiNaiduBio to MlVar(
        ml = "ബിസിനസ്സ് രംഗത്ത് വലിയ പരിചയമുള്ള ഇദ്ദേഹം 30 വർഷത്തോളമായി ഗ്രൂപ്പിന്റെ ഭാഗമാണ്.",
        latn = "Business Rangathu Valiya Parichayamulla Iddeham 30 Varshatholamaayi Groupinte Bhagamaanu."
    ),
    K.yalamanchiPradeepBio to MlVar(
        ml = "ഗിണ്ടി എഞ്ചിനീയറിംഗ് കോളേജിൽ നിന്നും ECE കഴിഞ്ഞ്, അമേരിക്കയിലെ കാർനെഗീ മെലൻ യൂണിവേഴ്സിറ്റിയിൽ നിന്ന് ബിരുദാനന്തര ബിരുദം നേടിയ വ്യക്തി.",
        latn = "Guindy Engineering Collegil Ninnum ECE Kazhinju, Amerikkayile Carnegie Mellon Universityil Ninnu Birudaananthara Birudam Nediya Vyakthi."
    ),
    K.kavaraipettaiAddress to MlVar(
        ml = "കവരപ്പേട്ടൈ, തിരുവള്ളൂർ ജില്ല",
        latn = "Kavarappettai, Thiruvallur Jilla"
    ),
    K.puduvoyalAddress to MlVar(
        ml = "പുതുവായൽ, തിരുവള്ളൂർ ജില്ല",
        latn = "Puduvoyal, Thiruvallur Jilla"
    ),
    K.thiruverkaduAddress to MlVar(
        ml = "തിരുവേർക്കാട്, ചെന്നൈ",
        latn = "Thiruverkadu, Chennai"
    ),
    K.sriDurgadeviPolytechnic to MlVar(
        ml = "ശ്രീ ദുർഗാദേവി പോളിടെക്നിക് കോളേജ്",
        latn = "Sri Durgadevi Polytechnic College"
    ),
    K.rmkMatricSchool to MlVar(
        ml = "RMK മെട്രിക്കുലേഷൻ സ്കൂൾ",
        latn = "RMK Matriculation School"
    ),
    K.dontHaveAccount to MlVar(
        ml = "അക്കൗണ്ട് ഇല്ലേ? ",
        latn = "Account Ille? "
    ),
    K.alreadyHaveAccount to MlVar(
        ml = "നേരത്തെ അക്കൗണ്ട് ഉണ്ടോ? ",
        latn = "Narathe Account Undo? "
    ),
    K.signUp to MlVar(
        ml = "സൈൻ അപ്പ് ചെയ്യുക",
        latn = "Sign Up Cheyyuka"
    ),
    K.logIn to MlVar(
        ml = "ലോഗിൻ ചെയ്യുക",
        latn = "Login Cheyyuka"
    ),
    K.orDivider to MlVar(
        ml = " അല്ലെങ്കിൽ ",
        latn = " Allengil "
    ),
    K.continueWithGoogle to MlVar(
        ml = "ഗൂഗിൾ വഴി തുടരുക",
        latn = "Google Vazhi Thudaruka"
    ),
    K.dayMonday to MlVar(
        ml = "തിങ്കൾ",
        latn = "Thingal"
    ),
    K.dayTuesday to MlVar(
        ml = "ചൊവ്വ",
        latn = "Chovva"
    ),
    K.dayWednesday to MlVar(
        ml = "ബുധൻ",
        latn = "Budhan"
    ),
    K.dayThursday to MlVar(
        ml = "വ്യാഴം",
        latn = "Vyaazham"
    ),
    K.dayFriday to MlVar(
        ml = "വെള്ളി",
        latn = "Velli"
    ),
    K.daySaturday to MlVar(
        ml = "ശനി",
        latn = "Shani"
    ),
    K.daySunday to MlVar(
        ml = "ഞായർ",
        latn = "Njaayar"
    ),
    K.dayMondayFull to MlVar(
        ml = "തിങ്കൾ",
        latn = "Thingal"
    ),
    K.dayTuesdayFull to MlVar(
        ml = "ചൊവ്വ",
        latn = "Chovva"
    ),
    K.dayWednesdayFull to MlVar(
        ml = "ബുധൻ",
        latn = "Budhan"
    ),
    K.dayThursdayFull to MlVar(
        ml = "വ്യാഴം",
        latn = "Vyaazham"
    ),
    K.dayFridayFull to MlVar(
        ml = "വെള്ളി",
        latn = "Velli"
    ),
    K.daySaturdayFull to MlVar(
        ml = "ശനി",
        latn = "Shani"
    ),
    K.daySundayFull to MlVar(
        ml = "ഞായർ",
        latn = "Njaayar"
    ),
    K.dayMondayLong to MlVar(
        ml = "തിങ്കളാഴ്ച",
        latn = "Thingalaazhcha"
    ),
    K.dayTuesdayLong to MlVar(
        ml = "ചൊവ്വാഴ്ച",
        latn = "Chovvaazhcha"
    ),
    K.dayWednesdayLong to MlVar(
        ml = "ബുധനാഴ്ച",
        latn = "Budhanaazhcha"
    ),
    K.dayThursdayLong to MlVar(
        ml = "വ്യാഴാഴ്ച",
        latn = "Vyaazhaazhcha"
    ),
    K.dayFridayLong to MlVar(
        ml = "വെള്ളിയാഴ്ച",
        latn = "Velliyaazhcha"
    ),
    K.daySaturdayLong to MlVar(
        ml = "ശനിയാഴ്ച",
        latn = "Shaniyaazhcha"
    ),
    K.daySundayLong to MlVar(
        ml = "ഞായറാഴ്ച",
        latn = "Njaayaraazhcha"
    ),
    K.dayMondaySingle to MlVar(
        ml = "തി",
        latn = "Thi"
    ),
    K.dayTuesdaySingle to MlVar(
        ml = "ചൊ",
        latn = "Cho"
    ),
    K.dayWednesdaySingle to MlVar(
        ml = "ബു",
        latn = "Bu"
    ),
    K.dayThursdaySingle to MlVar(
        ml = "വ്യാ",
        latn = "Vyaa"
    ),
    K.dayFridaySingle to MlVar(
        ml = "വെ",
        latn = "Ve"
    ),
    K.daySaturdaySingle to MlVar(
        ml = "ശ",
        latn = "Sha"
    ),
    K.daySundaySingle to MlVar(
        ml = "ഞാ",
        latn = "Njaa"
    ),
    K.monthJan to MlVar(
        ml = "ജനുവരി",
        latn = "Januvari"
    ),
    K.monthFeb to MlVar(
        ml = "ഫെബ്രുവരി",
        latn = "Februvari"
    ),
    K.monthMar to MlVar(
        ml = "മാർച്ച്",
        latn = "March"
    ),
    K.monthApr to MlVar(
        ml = "ഏപ്രിൽ",
        latn = "April"
    ),
    K.monthMay to MlVar(
        ml = "മേയ്",
        latn = "May"
    ),
    K.monthJun to MlVar(
        ml = "ജൂൺ",
        latn = "June"
    ),
    K.monthJul to MlVar(
        ml = "ജൂലൈ",
        latn = "July"
    ),
    K.monthAug to MlVar(
        ml = "ആഗസ്റ്റ്",
        latn = "August"
    ),
    K.monthSep to MlVar(
        ml = "സെപ്റ്റംബർ",
        latn = "September"
    ),
    K.monthOct to MlVar(
        ml = "ഒക്ടോബർ",
        latn = "October"
    ),
    K.monthNov to MlVar(
        ml = "നവംബർ",
        latn = "November"
    ),
    K.monthDec to MlVar(
        ml = "ഡിസംബർ",
        latn = "December"
    ),
    K.monthJanShort to MlVar(
        ml = "ജനു",
        latn = "Jan"
    ),
    K.monthFebShort to MlVar(
        ml = "ഫെബ്രു",
        latn = "Feb"
    ),
    K.monthMarShort to MlVar(
        ml = "മാർ",
        latn = "Mar"
    ),
    K.monthAprShort to MlVar(
        ml = "ഏപ്രി",
        latn = "Apr"
    ),
    K.monthMayShort to MlVar(
        ml = "മേയ്",
        latn = "May"
    ),
    K.monthJunShort to MlVar(
        ml = "ജൂൺ",
        latn = "Jun"
    ),
    K.monthJulShort to MlVar(
        ml = "ജൂലൈ",
        latn = "Jul"
    ),
    K.monthAugShort to MlVar(
        ml = "ആഗ",
        latn = "Aug"
    ),
    K.monthSepShort to MlVar(
        ml = "സെപ്റ്റം",
        latn = "Sep"
    ),
    K.monthOctShort to MlVar(
        ml = "ഒക്ടോ",
        latn = "Oct"
    ),
    K.monthNovShort to MlVar(
        ml = "നവം",
        latn = "Nov"
    ),
    K.monthDecShort to MlVar(
        ml = "ഡിസം",
        latn = "Dec"
    ),
    K.settings to MlVar(
        ml = "ഒരുക്കങ്ങൾ",
        latn = "Orukkangngal"
    ),
    K.neramAccount to MlVar(
        ml = "നേരം അക്കൗണ്ട്",
        latn = "Neram Account"
    ),
    K.accounts to MlVar(
        ml = "അക്കൗണ്ടുകൾ",
        latn = "Accountukal"
    ),
    K.accountsDesc to MlVar(
        ml = "ബന്ധിപ്പിച്ച അക്കൗണ്ടുകൾ, ലോഗൗട്ട്",
        latn = "Bandhippicha Accountukal, Logout"
    ),
    K.security to MlVar(
        ml = "കാവൽ",
        latn = "Kaaval"
    ),
    K.securityDesc to MlVar(
        ml = "മറവാക്ക്, അക്കൗണ്ട് മായ്ക്കുക",
        latn = "Maravaakku, Account Maaykkuka"
    ),
    K.userDirectory to MlVar(
        ml = "ഉപയോക്താക്കൾ",
        latn = "Upayokthaakkal"
    ),
    K.userDirectoryDesc to MlVar(
        ml = "അധ്യാപകർ, ജീവനക്കാർ, പഠിതാക്കൾ",
        latn = "Adhyaapakar, Jeevanakkaar, Padithaakkal"
    ),
    K.display to MlVar(
        ml = "കാഴ്ച",
        latn = "Kaazhcha"
    ),
    K.displayDesc to MlVar(
        ml = "വെളിച്ചം, ഇരുൾ മുറ",
        latn = "Velicham, Irul Mura"
    ),
    K.storageData to MlVar(
        ml = "സൂക്ഷിപ്പും ഡാറ്റയും",
        latn = "Sookshippum Datayum"
    ),
    K.storageDesc to MlVar(
        ml = "പഴയ വിവരങ്ങൾ മായ്ക്കുക",
        latn = "Pazhaya Vivarangal Maaykkuka"
    ),
    K.complaints to MlVar(
        ml = "കുറ്റങ്ങളും കരുത്തും",
        latn = "Kuttangalum Karuthum"
    ),
    K.complaintsDesc to MlVar(
        ml = "പ്രശ്നങ്ങൾ അറിയിക്കുക, നിർദ്ദേശങ്ങൾ",
        latn = "Prashnangal Ariyikkuka, Nirdeshangal"
    ),
    K.aboutDeveloper to MlVar(
        ml = "ഡെവലപ്പറെ കുറിച്ച്",
        latn = "Developere Kurichu"
    ),
    K.aboutDeveloperDesc to MlVar(
        ml = "ഡെവലപ്പർ വിവരങ്ങളും ബന്ധപ്പെടാനും",
        latn = "Developer Vivarangalum Bandhappedanum"
    ),
    K.aboutApp to MlVar(
        ml = "ആപ്പിനെ പറ്റി",
        latn = "Appine Patti"
    ),
    K.aboutAppDesc to MlVar(
        ml = "നേരം - കോളേജ് നേരപ്പട്ടിക",
        latn = "Neram - College Nerappattika"
    ),
    K.importantSites to MlVar(
        ml = "പ്രധാന വെബ്സൈറ്റുകൾ",
        latn = "Pradhana Websiteukal"
    ),
    K.importantSitesDesc to MlVar(
        ml = "കോളേജ് വെബ്സൈറ്റുകളും ലിങ്കുകളും",
        latn = "College Websiteukalum Linkukalum"
    ),
    K.aboutRmk to MlVar(
        ml = "RMK ഗ്രൂപ്പിനെ കുറിച്ച്",
        latn = "RMK Groupine Kurichu"
    ),
    K.aboutRmkDesc to MlVar(
        ml = "പഠന ഇടങ്ങളും നടത്തിപ്പുകാരും",
        latn = "Padana Idangalum Nadathippukaarum"
    ),
    K.contact to MlVar(
        ml = "ബന്ധപ്പെടാൻ",
        latn = "Bandhappedaan"
    ),
    K.contactDesc to MlVar(
        ml = "സഹായ നമ്പറുകൾ, വിലാസം",
        latn = "Sahaaya Numberukal, Vilasam"
    ),
    K.managementTeam to MlVar(
        ml = "നടത്തിപ്പുകാർ",
        latn = "Nadathippukaar"
    ),
    K.language to MlVar(
        ml = "മൊഴി",
        latn = "Mozhi"
    ),
    K.languageDesc to MlVar(
        ml = "മലയാളം, തമിഴ്, ഇംഗ്ലീഷ്, മലയാളം (ലാറ്റിൻ), മലയാളം (തമിഴ് എഴുത്തുരു), തമിഴ് (ലാറ്റിൻ), തമിഴ് (മലയാള എഴുത്തുരു)",
        latn = "Malayalam, Tamil, English, Malayalam (Latin), Malayalam (Thamizh Ezhuthuru), Tamil (Latin), Tamil (Malayala Ezhuthuru)"
    ),
    K.deviceLanguage to MlVar(
        ml = "ഫോണിലെ മൊഴി",
        latn = "Phonile Mozhi"
    ),
    K.english to MlVar(
        ml = "ഇംഗ്ലീഷ്",
        latn = "English"
    ),
    K.tamil to MlVar(
        ml = "തമിഴ്",
        latn = "Tamil"
    ),
    K.tamilLatin to MlVar(
        ml = "തമിഴ് (ലാറ്റിൻ)",
        latn = "Tamil (Latin)"
    ),
    K.tamilMalayalam to MlVar(
        ml = "തമിഴ് (മലയാള എഴുത്തുരു)",
        latn = "Tamil (Malayala Ezhuthuru)"
    ),
    K.malayalam to MlVar(
        ml = "മലയാളം",
        latn = "Malayalam"
    ),
    K.malayalamLatin to MlVar(
        ml = "മലയാളം (ലാറ്റിൻ)",
        latn = "Malayalam (Latin)"
    ),
    K.malayalamTamil to MlVar(
        ml = "മലയാളം (തമിഴ് എഴുത്തുരു)",
        latn = "Malayalam (Thamizh Ezhuthuru)"
    ),
    K.languageInfo to MlVar(
        ml = "മൊഴി മാറ്റിയാൽ ആപ്പിൽ ഉടനീളം ഉടൻ തന്നെ മാറും.",
        latn = "Mozhi maattiyal appil udaneelam udan thanne maarum."
    ),
    K.editProfile to MlVar(
        ml = "തൻവിവരം തിരുത്തുക",
        latn = "Thanvivaram Thiruthuka"
    ),
    K.feedback to MlVar(
        ml = "കരുത്തുകളും സംശയങ്ങളും",
        latn = "Karuthukalum Samshayangalum"
    ),
    K.lightMode to MlVar(
        ml = "വെളിച്ച മുറ",
        latn = "Velichha Mura"
    ),
    K.darkMode to MlVar(
        ml = "ഇരുൾ മുറ",
        latn = "Irul Mura"
    ),
    K.systemAuto to MlVar(
        ml = "തനിയെ",
        latn = "Thaniye"
    ),
    K.themeDescription to MlVar(
        ml = "നിങ്ങളുടെ ഫോണിനനുസരിച്ച് മാറും",
        latn = "Ningalude Phoninanuserichu Maarum"
    ),
    K.linkedAccounts to MlVar(
        ml = "ബന്ധിപ്പിച്ച അക്കൗണ്ടുകൾ",
        latn = "Bandhippicha Accountukal"
    ),
    K.linkedAccountsDesc to MlVar(
        ml = "ഗൂഗിൾ ലോഗിൻ നിയന്ത്രിക്കുക",
        latn = "Google Login Niyanthrikkuka"
    ),
    K.signOut to MlVar(
        ml = "ലോഗൗട്ട്",
        latn = "Logout"
    ),
    K.signOutDesc to MlVar(
        ml = "നേരം അക്കൗണ്ടിൽ നിന്ന് ലോഗൗട്ട് ചെയ്യുക",
        latn = "Neram Accountil Ninnu Logout Cheyyuka"
    ),
    K.signOutConfirm to MlVar(
        ml = "ലോഗൗട്ട് ചെയ്യണോ?",
        latn = "Logout Cheyyano?"
    ),
    K.signOutMessage to MlVar(
        ml = "നിങ്ങൾക്ക് തീർച്ചയായും ലോഗൗട്ട് ചെയ്യണോ?",
        latn = "Ningalkku Theerchayayum Logout Cheyyano?"
    ),
    K.changePassword to MlVar(
        ml = "മറവാക്ക് മാറ്റുക",
        latn = "Maravaakku Mattuka"
    ),
    K.deleteAccount to MlVar(
        ml = "അക്കൗണ്ട് മായ്ക്കുക",
        latn = "Account Maaykkuka"
    ),
    K.dangerZone to MlVar(
        ml = "സൂക്ഷിക്കുക",
        latn = "Sookshikkuka"
    ),
    K.createPassword to MlVar(
        ml = "മറവാക്ക് ഉണ്ടാക്കുക",
        latn = "Maravaakku Undaakkuka"
    ),
    K.cleanupOptions to MlVar(
        ml = "ഡാറ്റ മായ്ക്കുന്നതിനുള്ള വഴികൾ",
        latn = "Data Maaykkunnathinulla Vazhikal"
    ),
    K.clearOldUpdates to MlVar(
        ml = "പഴയ വിവരങ്ങൾ മായ്ക്കുക",
        latn = "Pazhaya Vivarangal Maaykkuka"
    ),
    K.clearOldUpdatesDesc to MlVar(
        ml = "30 നാളിൽ പഴയ വിവരങ്ങൾ കളയുക",
        latn = "30 Naalil Pazhaya Vivarangal Kalayuka"
    ),
    K.customRangeDeletion to MlVar(
        ml = "ഒരു പ്രത്യേക നേരത്തെ വിവരങ്ങൾ കളയുക",
        latn = "Oru Prathyeka Nerathe Vivarangal Kalayuka"
    ),
    K.customRangeDesc to MlVar(
        ml = "വിവരങ്ങൾ മായ്ക്കാൻ ഒരു നാൾ തിരഞ്ഞെടുക്കുക",
        latn = "Vivarangal Maaykkaan Oru Naal Thiranjedukkuka"
    ),
    K.optimizationInfo to MlVar(
        ml = "ഫോണിലെ ഇടം ലാഭിക്കുന്നത് ആപ്പ് വേഗത്തിൽ പ്രവർത്തിക്കാൻ സഹായിക്കും.",
        latn = "Phonile Idam Laabhikkunnathu App Vegathil Pravarthikkaan Sahaayikkum."
    ),
    K.confirmDeletion to MlVar(
        ml = "മായ്ക്കുകയാണെന്ന് ഉറപ്പാക്കുക",
        latn = "Maaykkukayaanennu Urappaakkuka"
    ),
    K.clearNow to MlVar(
        ml = "ഇപ്പോൾ മായ്ക്കുക",
        latn = "Ippol Maaykkuka"
    ),
    K.deleteData to MlVar(
        ml = "ഡാറ്റ കളയുക",
        latn = "Data Kalayuka"
    ),
    K.selectRange to MlVar(
        ml = "നേരം തിരഞ്ഞെടുക്കുക",
        latn = "Neram Thiranjedukkuka"
    ),
    K.selectDateRange to MlVar(
        ml = "നാൾ തിരഞ്ഞെടുക്കുക",
        latn = "Naal Thiranjedukkuka"
    ),
    K.chooseUpdatesToWipe to MlVar(
        ml = "മായ്ക്കാനുള്ള വിവരങ്ങൾ തിരഞ്ഞെടുക്കുക",
        latn = "Maaykkaanulla Vivarangal Thiranjedukkuka"
    ),
    K.clearConfirmMessage to MlVar(
        ml = "30 നാളിൽ പഴയ വിവരങ്ങളെല്ലാം മായ്ക്കപ്പെടും. ഇത് തിരികെ കിട്ടില്ല.",
        latn = "30 Naalil Pazhaya Vivarangalellam Maaykkappedum. Ithu Thirike Kittilla."
    ),
    K.clearedMessage to MlVar(
        ml = "30 നാളിൽ പഴയ വിവരങ്ങൾ മായ്ച്ചു",
        latn = "30 Naalil Pazhaya Vivarangal Maaychu"
    ),
    K.notUploadedTitle to MlVar(
        ml = "അപ്‌ലോഡ് ചെയ്തിട്ടില്ല",
        latn = "Upload Cheythittilla"
    ),
    K.notUploadedMessage to MlVar(
        ml = "ഈ കുറിപ്പുകൾ rmd.ac.in-ൽ ഇനിയും വന്നിട്ടില്ല. അവർ അപ്‌ലോഡ് ചെയ്താലുടൻ ഇവിടെ കിട്ടും.",
        latn = "Ee Kurippukal rmd.ac.in-l Iniyum Vannittilla. Avar Upload Cheythaludan Ivide Kittum."
    ),
    K.noUsersFound to MlVar(
        ml = "ആരെയും കണ്ടെത്താനായില്ല",
        latn = "Aareyum Kandethanayiilla"
    ),
    K.email to MlVar(
        ml = "ഇമെയിൽ",
        latn = "Email"
    ),
    K.whatIsNeram to MlVar(
        ml = "എന്താണ് നേരം?",
        latn = "Enthaanu Neram?"
    ),
    K.aboutNeramDesc to MlVar(
        ml = "കോളേജ് നേരം എളുപ്പമാക്കാനുള്ള ഒരു കിടിലൻ നേരപ്പട്ടിക ആപ്പാണ് നേരം.\n\nഎൽവൻ നവിൽ ഒരുക്കിയത്\nക്ലാസ്സ് നേരം, പരീക്ഷകൾ, അറിയിപ്പുകൾ, കുറിപ്പുകൾ എന്നിവയെല്ലാം ഒരിടത്ത് എളുപ്പത്തിൽ അറിയാം.",
        latn = "College Neram Eluppamaakkanulla Oru Kidilan Nerappattika Appaanu Neram.\n\nElvan Navil Orukkiyathu\nClass Neram, Pareekshakal, Ariyippukal, Kurippukal ennivayellam Oridathu Eluppathil Ariyaam."
    ),
    K.features to MlVar(
        ml = "മേന്മകൾ",
        latn = "Menmakal"
    ),
    K.smartTimetable to MlVar(
        ml = "സ്മാർട്ട് നേരപ്പട്ടിക",
        latn = "Smart Nerappattika"
    ),
    K.smartTimetableDesc to MlVar(
        ml = "ദിവസേനയുള്ള ക്ലാസ്സുകൾ, അധ്യാപകരുടെ വിവരങ്ങൾ, റൂം നമ്പറുകൾ എന്നിവ വേഗത്തിൽ അറിയാം.",
        latn = "Divasenayulla Classukal, Adhyaapakarude Vivarangal, Room Numberukal Enniva Vegathil Ariyaam."
    ),
    K.examCalendar to MlVar(
        ml = "പരീക്ഷാ നാൾവഴി",
        latn = "Pareeksha Naalvazhi"
    ),
    K.examCalendarDesc to MlVar(
        ml = "വരാനിരിക്കുന്ന പരീക്ഷകളും പരിപാടികളും എത്ര നാൾ കൂടിയുണ്ടെന്ന് പെട്ടെന്നറിയാം.",
        latn = "Varaanirikkunna Pareekshakalum Paripaadikalum Ethra Naal Koodiyundennu Pettennariyaam."
    ),
    K.campusAnnouncements to MlVar(
        ml = "കോളേജ് അറിയിപ്പുകൾ",
        latn = "College Ariyippukal"
    ),
    K.campusAnnouncementsDesc to MlVar(
        ml = "കോളേജിൽ നിന്നുള്ള പ്രധാന അറിയിപ്പുകൾ ഫോണിൽ ഉടൻ എത്തും.",
        latn = "Collegil Ninnulla Pradhana Ariyippukal Phonil Udan Etthum."
    ),
    K.offlineSupport to MlVar(
        ml = "ഓഫ്‌ലൈനായും ഉപയോഗിക്കാം",
        latn = "Offline-aayum Upayogikkaam"
    ),
    K.offlineSupportDesc to MlVar(
        ml = "നെറ്റ് ഇല്ലാത്തപ്പോഴും നേരപ്പട്ടിക എളുപ്പത്തിൽ നോക്കാം.",
        latn = "Net Illathappozhum Nerappattika Eluppathil Nookkam."
    ),
    K.cloudSync to MlVar(
        ml = "ക്ലൗഡ് സിങ്ക്",
        latn = "Cloud Sync"
    ),
    K.cloudSyncDesc to MlVar(
        ml = "നിങ്ങളുടെ വിവരങ്ങളെല്ലാം ഫയർബേസിൽ കാത്തുവെച്ചിരിക്കുന്നു.",
        latn = "Ningalude Vivarangalellam Firebase-il Kaathuvechirikkunnu."
    ),
    K.connectWithMe to MlVar(
        ml = "എന്നോട് സംസാരിക്കാൻ",
        latn = "Ennodu Samsarikkaan"
    ),
    K.visitPortfolio to MlVar(
        ml = "എന്റെ വെബ്സൈറ്റ് കാണുക",
        latn = "Ente Website Kaanuka"
    ),
    K.locationChennai to MlVar(
        ml = "ആരണി / ചെന്നൈ, തമിഴ്‌നാട്",
        latn = "Arani / Chennai, Tamil Nadu"
    ),
    K.submitFeedback to MlVar(
        ml = "കരുത്ത് അറിയിക്കുക",
        latn = "Karuthu Ariyikkuka"
    ),
    K.describeIssue to MlVar(
        ml = "നിങ്ങളുടെ കരുത്തോ പ്രശ്നമോ ഇവിടെ വിശദമായി എഴുതുക...",
        latn = "Ningalude Karutho Prashnamo Ivide Vishadamaayi Ezhuthuka..."
    ),
    K.feedbackSubmittedSuccess to MlVar(
        ml = "നന്ദി! നിങ്ങളുടെ കരുത്ത് അയച്ചിട്ടുണ്ട്.",
        latn = "Nandi! Ningalude Karuthu Ayachittundu."
    ),
    K.fillAllFields to MlVar(
        ml = "എല്ലാ വിവരങ്ങളും നൽകുക",
        latn = "Ella Vivarangalum Nalkuka"
    ),
    K.rmkGroupLegacy to MlVar(
        ml = "RMK വിദ്യാഭ്യാസ ഗ്രൂപ്പ്",
        latn = "RMK Vidyabhyasa Group"
    ),
    K.rmkDescription to MlVar(
        ml = "പഠന നിലവാരത്തിലും അച്ചടക്കത്തിലും മുന്നിട്ടു നിൽക്കുന്ന മികച്ച ഇടങ്ങൾ.",
        latn = "Padana Nilavaarathilum Achadakkathilum Munnittu Nilkkunna Mikacha Idangal."
    ),
    K.visionMission to MlVar(
        ml = "നോക്കങ്ങളും കാഴ്ചപ്പാടും",
        latn = "Nokkangalum Kaazhchappaadum"
    ),
    K.institutions to MlVar(
        ml = "പഠന ഇടങ്ങൾ",
        latn = "Padana Idangal"
    ),
    K.rmkEnggCollege to MlVar(
        ml = "RMK എഞ്ചിനീയറിംഗ് കോളേജ്",
        latn = "RMK Engineering College"
    ),
    K.rmdEnggCollege to MlVar(
        ml = "RMD എഞ്ചിനീയറിംഗ് കോളേജ്",
        latn = "RMD Engineering College"
    ),
    K.rmkCet to MlVar(
        ml = "RMK കോളേജ് ഓഫ് എഞ്ചിനീയറിംഗ് ആൻഡ് ടെക്നോളജി",
        latn = "RMK College of Engineering and Technology"
    ),
    K.rmkSchool to MlVar(
        ml = "RMK റസിഡൻഷ്യൽ സീനിയർ സെക്കണ്ടറി സ്കൂൾ",
        latn = "RMK Residential Senior Secondary School"
    ),
    K.founderChairman to MlVar(
        ml = "തുടങ്ങിയവരും ചെയർമാനും",
        latn = "Thudangiyavarum Chairmanum"
    ),
    K.viceChairman to MlVar(
        ml = "വൈസ് ചെയർമാൻ",
        latn = "Vice Chairman"
    ),
    K.chairperson to MlVar(
        ml = "ചെയർപേഴ്സൺ",
        latn = "Chairperson"
    ),
    K.director to MlVar(
        ml = "ഡയറക്ടർ",
        latn = "Director"
    ),
    K.officialPortals to MlVar(
        ml = "കോളേജ് പോർട്ടലുകൾ",
        latn = "College Portalukal"
    ),
    K.emergencyHelpline to MlVar(
        ml = "അടിയന്തര നമ്പറുകൾ",
        latn = "Adiyanthara Numberukal"
    ),
    K.collegeReception to MlVar(
        ml = "കോളേജ് റിസപ്ഷൻ",
        latn = "College Reception"
    ),
    K.principalOffice to MlVar(
        ml = "പ്രിൻസിപ്പൽ ഓഫീസ്",
        latn = "Principal Office"
    ),
    K.placementCell to MlVar(
        ml = "പ്ലേസ്മെന്റ് സെൽ",
        latn = "Placement Cell"
    ),
    K.transportIncharge to MlVar(
        ml = "ട്രാൻസ്പോർട്ട് ഇൻചാർജ്",
        latn = "Transport In-charge"
    ),
    K.hostelOffice to MlVar(
        ml = "ഹോസ്റ്റൽ ഓഫീസ്",
        latn = "Hostel Office"
    ),
    K.ambulanceMedical to MlVar(
        ml = "ആംബുലൻസ് & മെഡിക്കൽ സെന്റർ",
        latn = "Ambulance & Medical Center"
    ),
    K.securityGate to MlVar(
        ml = "മെയിൻ കാവൽ ഗേറ്റ്",
        latn = "Main Kaaval Gate"
    ),
    K.fullName to MlVar(
        ml = "മുഴുവൻ പേര്",
        latn = "Muzhuvan Peru"
    ),
    K.roleStudent to MlVar(
        ml = "പഠിതാവ്",
        latn = "Padithaavu"
    ),
    K.fillDetailsGetStarted to MlVar(
        ml = "തുടങ്ങാൻ വിവരങ്ങൾ നൽകുക",
        latn = "Thudangan Vivarangal Nalkuka"
    ),
    K.welcomeToNeramTitle to MlVar(
        ml = "നേരത്തിലേക്ക് വരവേൽപ്പ്",
        latn = "Neramthilekku Varavelppu"
    ),
    K.yourCollegeTimeSorted to MlVar(
        ml = "നിങ്ങളുടെ കോളേജ് നേരം ഇനി എളുപ്പമായി.",
        latn = "Ningalude College Neram Ini Eluppamaayi."
    ),
    K.personalInfo to MlVar(
        ml = "നിങ്ങളുടെ വിവരങ്ങൾ",
        latn = "Ningalude Vivarangal"
    ),
    K.academicDetails to MlVar(
        ml = "പഠന വിവരങ്ങൾ",
        latn = "Padana Vivarangal"
    ),
    K.editName to MlVar(
        ml = "പേര് തിരുത്തുക",
        latn = "Peru Thiruthuka"
    ),
    K.enterFirstName to MlVar(
        ml = "ആദ്യ പേര് നൽകുക",
        latn = "Aadya Peru Nalkuka"
    ),
    K.enterLastName to MlVar(
        ml = "അവസാന പേര് നൽകുക",
        latn = "Avasana Peru Nalkuka"
    ),
    K.mobileNumber to MlVar(
        ml = "മൊബൈൽ നമ്പർ",
        latn = "Mobile Number"
    ),
    K.editMobileNumber to MlVar(
        ml = "മൊബൈൽ നമ്പർ തിരുത്തുക",
        latn = "Mobile Number Thiruthuka"
    ),
    K.tenDigitNumber to MlVar(
        ml = "10 അക്ക നമ്പർ",
        latn = "10 Akka Number"
    ),
    K.dateOfBirth to MlVar(
        ml = "ജനന നാൾ",
        latn = "Janana Naal"
    ),
    K.editDateOfBirth to MlVar(
        ml = "ജനന നാൾ തിരുത്തുക",
        latn = "Janana Naal Thiruthuka"
    ),
    K.gender to MlVar(
        ml = "ജെൻഡർ",
        latn = "Gender"
    ),
    K.selectGender to MlVar(
        ml = "ജെൻഡർ തിരഞ്ഞെടുക്കുക",
        latn = "Gender Thiranjedukkuka"
    ),
    K.batchDeptSection to MlVar(
        ml = "ബാച്ച്, തുറ & പിരിവ്",
        latn = "Batch, Thura & Pirivu"
    ),
    K.editAcademicDetails to MlVar(
        ml = "പഠന വിവരങ്ങൾ തിരുത്തുക",
        latn = "Padana Vivarangal Thiruthuka"
    ),
    K.batch to MlVar(
        ml = "ബാച്ച്",
        latn = "Batch"
    ),
    K.selectBatch to MlVar(
        ml = "ബാച്ച് തിരഞ്ഞെടുക്കുക",
        latn = "Batch Thiranjedukkuka"
    ),
    K.department to MlVar(
        ml = "തുറ",
        latn = "Thura"
    ),
    K.selectDepartment to MlVar(
        ml = "തുറ തിരഞ്ഞെടുക്കുക",
        latn = "Thura Thiranjedukkuka"
    ),
    K.section to MlVar(
        ml = "പിരിവ്",
        latn = "Pirivu"
    ),
    K.selectSection to MlVar(
        ml = "പിരിവ് തിരഞ്ഞെടുക്കുക",
        latn = "Pirivu Thiranjedukkuka"
    ),
    K.registerNumber to MlVar(
        ml = "രജിസ്റ്റർ നമ്പർ",
        latn = "Register Number"
    ),
    K.editRegisterNumber to MlVar(
        ml = "രജിസ്റ്റർ നമ്പർ തിരുത്തുക",
        latn = "Register Number Thiruthuka"
    ),
    K.enterRegisterNumber to MlVar(
        ml = "രജിസ്റ്റർ നമ്പർ നൽകുക",
        latn = "Register Number Nalkuka"
    ),
    K.updateLoginPassword to MlVar(
        ml = "നിങ്ങളുടെ മറവാക്ക് പുതുക്കുക",
        latn = "Ningalude Maravaakku Puthukkuka"
    ),
    K.createPasswordTitle to MlVar(
        ml = "മറവാക്ക് ഉണ്ടാക്കുക",
        latn = "Maravaakku Undaakkuka"
    ),
    K.setPasswordEmailLogin to MlVar(
        ml = "ഇമെയിൽ ലോഗിൻ ചെയ്യാൻ മറവാക്ക് ഉണ്ടാക്കുക",
        latn = "Email Login Cheyyan Maravaakku Undaakkuka"
    ),
    K.permanentlyRemoveAccount to MlVar(
        ml = "നിങ്ങളുടെ അക്കൗണ്ട് എന്നെന്നേക്കുമായി കളയുക",
        latn = "Ningalude Account Ennennekumayi Kalayuka"
    ),
    K.currentPassword to MlVar(
        ml = "ഇപ്പോഴത്തെ മറവാക്ക്",
        latn = "Ippozhathe Maravaakku"
    ),
    K.enterCurrentPassword to MlVar(
        ml = "ഇപ്പോഴത്തെ മറവാക്ക് നൽകുക",
        latn = "Ippozhathe Maravaakku Nalkuka"
    ),
    K.newPassword to MlVar(
        ml = "പുതിയ മറവാക്ക്",
        latn = "Puthiya Maravaakku"
    ),
    K.enterNewPassword to MlVar(
        ml = "പുതിയ മറവാക്ക് നൽകുക",
        latn = "Puthiya Maravaakku Nalkuka"
    ),
    K.confirmNewPassword to MlVar(
        ml = "പുതിയ മറവാക്ക് ഉറപ്പാക്കുക",
        latn = "Puthiya Maravaakku Urappaakkuka"
    ),
    K.confirmPassword to MlVar(
        ml = "വീണ്ടും നൽകുക",
        latn = "Veendum Nalkuka"
    ),
    K.verifyIdentity to MlVar(
        ml = "നിങ്ങളാണെന്ന് ഉറപ്പാക്കുക",
        latn = "Ningalaanennu Urappaakkuka"
    ),
    K.googleReauthPrompt to MlVar(
        ml = "കാവലിനായി, വീണ്ടും ഗൂഗിൾ വഴി ലോഗിൻ ചെയ്യുക.",
        latn = "Kaavalinaayi, Veendum Google Vazhi Login Cheyyuka."
    ),
    K.signInMethods to MlVar(
        ml = "ലോഗിൻ വഴികൾ",
        latn = "Login Vazhikal"
    ),
    K.allowNotifications to MlVar(
        ml = "എല്ലാ അറിയിപ്പുകളും",
        latn = "Ella Ariyippukalum"
    ),
    K.masterNotificationSwitch to MlVar(
        ml = "ആപ്പിലെ എല്ലാ അറിയിപ്പുകൾക്കും സമ്മതം നൽകുക",
        latn = "Appile Ella Ariyippukalkkum Sammatham Nalkuka"
    ),
    K.dailyUpdates to MlVar(
        ml = "നാൾതോറുമുള്ള വിവരങ്ങൾ",
        latn = "Naalthorumulla Vivarangal"
    ),
    K.dailyUpdatesDesc to MlVar(
        ml = "ഇന്നത്തെ ക്ലാസ്സ് കുറിപ്പുകളും പഠന വിവരങ്ങളും",
        latn = "Innathe Class Kurippukalum Padana Vivarangalum"
    ),
    K.generalNoticesTitle to MlVar(
        ml = "പൊതുവായ അറിയിപ്പുകൾ",
        latn = "Pothuvaaya Ariyippukal"
    ),
    K.generalNoticesDesc to MlVar(
        ml = "കോളേജിൽ നിന്നുള്ള പൊതു അറിയിപ്പുകൾ",
        latn = "Collegil Ninnulla Pothu Ariyippukal"
    ),
    K.classScheduleTitle to MlVar(
        ml = "ക്ലാസ്സ് നേരപ്പട്ടിക",
        latn = "Class Nerappattika"
    ),
    K.classScheduleDesc to MlVar(
        ml = "ഇന്നത്തെ നേരപ്പട്ടികയും പാഠങ്ങളും",
        latn = "Innathe Nerappattikayum Paadangalum"
    ),
    K.labReminders to MlVar(
        ml = "ലാബ് ഓർമ്മപ്പെടുത്തലുകൾ",
        latn = "Lab Ormmappeduthalukal"
    ),
    K.labRemindersDesc to MlVar(
        ml = "ലാബും ലാബ് കോട്ടും സംബന്ധിച്ച ഓർമ്മപ്പെടുത്തലുകൾ",
        latn = "Labum Lab Coatum Sambandhicha Ormmappeduthalukal"
    ),
    K.studyReminders to MlVar(
        ml = "പഠന ഓർമ്മപ്പെടുത്തലുകൾ",
        latn = "Padana Ormmappeduthalukal"
    ),
    K.studyRemindersDesc to MlVar(
        ml = "വരാനിരിക്കുന്ന പരീക്ഷകളെക്കുറിച്ചുള്ള ഓർമ്മപ്പെടുത്തലുകൾ",
        latn = "Varaanirikkunna Pareekshakalekkurichulla Ormmappeduthalukal"
    ),
    K.examAlerts to MlVar(
        ml = "പരീക്ഷാ അറിയിപ്പുകൾ",
        latn = "Pareeksha Ariyippukal"
    ),
    K.examAlertsDesc to MlVar(
        ml = "ഇന്ന് / നാളെയുള്ള പരീക്ഷയുടെ ഓർമ്മപ്പെടുത്തലുകൾ",
        latn = "Innu / Naaleyulla Pareekshayude Ormmappeduthalukal"
    ),
    K.eventReminders to MlVar(
        ml = "പരിപാടി ഓർമ്മപ്പെടുത്തലുകൾ",
        latn = "Paripaadi Ormmappeduthalukal"
    ),
    K.eventRemindersDesc to MlVar(
        ml = "അവധികളും ചിറപ്പ് പരിപാടികളും",
        latn = "Avadhikalum Chirappu Paripaadikalum"
    ),
    K.instantAlerts to MlVar(
        ml = "പെട്ടെന്നുള്ള അറിയിപ്പുകൾ",
        latn = "Pettennulla Ariyippukal"
    ),
    K.instantAlertsDesc to MlVar(
        ml = "പ്രധാനപ്പെട്ട അടിയന്തര അറിയിപ്പുകൾ",
        latn = "Pradhanappetta Adiyanthara Ariyippukal"
    ),
    K.useCustomTimes to MlVar(
        ml = "എനിക്ക് വേണ്ട നേരം ഉപയോഗിക്കുക",
        latn = "Enikku Venda Neram Upayogikkuka"
    ),
    K.usingCustomTimes to MlVar(
        ml = "നിങ്ങൾ നൽകിയ നേരമാണ് ഉപയോഗിക്കുന്നത്",
        latn = "Ningal Nalkiya Neramanu Upayogikkunnathu"
    ),
    K.usingDefaultTimes to MlVar(
        ml = "കോളേജ് നേരമാണ് ഉപയോഗിക്കുന്നത്",
        latn = "College Neramanu Upayogikkunnathu"
    ),
    K.dailyBriefing to MlVar(
        ml = "ഇന്നത്തെ ചുരുക്കം",
        latn = "Innathe Churukkam"
    ),
    K.examToday to MlVar(
        ml = "ഇന്നത്തെ പരീക്ഷ",
        latn = "Innathe Pareeksha"
    ),
    K.examTomorrow to MlVar(
        ml = "നാളത്തെ പരീക്ഷ",
        latn = "Naalathe Pareeksha"
    ),
    K.practicalExamToday to MlVar(
        ml = "ഇന്നത്തെ പ്രാക്ടിക്കൽ പരീക്ഷ",
        latn = "Innathe Practical Pareeksha"
    ),
    K.practicalExamTomorrow to MlVar(
        ml = "നാളത്തെ പ്രാക്ടിക്കൽ പരീക്ഷ",
        latn = "Naalathe Practical Pareeksha"
    ),
    K.specialClassToday to MlVar(
        ml = "ഇന്നത്തെ ചിറപ്പ് ക്ലാസ്സ്",
        latn = "Innathe Chirappu Class"
    ),
    K.bestOfLuckFor to MlVar(
        ml = "വാഴ്ത്തുകൾ",
        latn = "Vaazhthukal"
    ),
    K.prepareFor to MlVar(
        ml = "തയ്യാറെടുക്കുക",
        latn = "Thayyaaredukkuka"
    ),
    K.holidayToday to MlVar(
        ml = "ഇന്ന് അവധിയാണ്",
        latn = "Innu Avadhiyaanu"
    ),
    K.fullDayNotice to MlVar(
        ml = "മുഴുനാൾ അറിയിപ്പ്",
        latn = "Muzhunaal Ariyippu"
    ),
    K.halfDayNotice to MlVar(
        ml = "പകുതി നാൾ അറിയിപ്പ്",
        latn = "Pakuthi Naal Ariyippu"
    ),
    K.sectionNotice to MlVar(
        ml = "പിരിവ് അറിയിപ്പ്",
        latn = "Pirivu Ariyippu"
    ),
    K.academicCalendarUpdate to MlVar(
        ml = "പഠന നാൾവഴി പുതുക്കൽ",
        latn = "Padana Naalvazhi Puthukkal"
    ),
    K.automatedReminders to MlVar(
        ml = "തനിയെ ഉള്ള റിമൈൻഡറുകൾ",
        latn = "Thaniye Ulla Reminderukal"
    ),
    K.todaysSchedule to MlVar(
        ml = "ഇന്നത്തെ നേരപ്പട്ടിക",
        latn = "Innathe Nerappattika"
    ),
    K.time to MlVar(
        ml = "നേരം",
        latn = "Neram"
    ),
    K.user to MlVar(
        ml = "ഉപയോക്താവ്",
        latn = "Upayokthaavu"
    ),
    K.noEmailLinked to MlVar(
        ml = "ഇമെയിൽ ചേർത്തിട്ടില്ല",
        latn = "Email Cherthittilla"
    ),
    K.cannotOpenUrl to MlVar(
        ml = "തുറക്കാൻ കഴിഞ്ഞില്ല: %s",
        latn = "Thurakkan Kazhinjilla: %s"
    ),
    K.selectBatchTitle to MlVar(
        ml = "ബാച്ച് തിരഞ്ഞെടുക്കുക",
        latn = "Batch Thiranjedukkuka"
    ),
    K.viewDeptsInBatch to MlVar(
        ml = "ബാച്ച് %s-ലെ തുറകൾ",
        latn = "Batch %s-le Thurakal"
    ),
    K.selectDeptBatch to MlVar(
        ml = "തുറ തിരഞ്ഞെടുക്കുക (ബാച്ച് %s)",
        latn = "Thura Thiranjedukkuka (Batch %s)"
    ),
    K.viewSectionsInDept to MlVar(
        ml = "%s-ലെ പിരിവുകൾ കാണുക",
        latn = "%s-le Pirivukal Kaanuka"
    ),
    K.selectSectionDept to MlVar(
        ml = "പിരിവ് തിരഞ്ഞെടുക്കുക (%s)",
        latn = "Pirivu Thiranjedukkuka (%s)"
    ),
    K.viewStudentsInSection to MlVar(
        ml = "%s പിരിവിലെ പഠിതാക്കളെ കാണുക",
        latn = "%s Pirivile Padithaakkale Kaanuka"
    ),
    K.viewMonth to MlVar(
        ml = "തിങ്കൾ",
        latn = "Thingal"
    ),
    K.viewSchedule to MlVar(
        ml = "നേരപ്പട്ടിക",
        latn = "Nerappattika"
    ),
    K.viewYear to MlVar(
        ml = "വർഷം",
        latn = "Varsham"
    ),
    K.globalExcellence to MlVar(
        ml = "ആഗോള മികവ്",
        latn = "Aagola Mikavu"
    ),
    K.globalExcellenceDesc to MlVar(
        ml = "എഞ്ചിനീയറിംഗ്, സാങ്കേതിക പഠനത്തിൽ ഇന്ത്യയിലെ മുൻനിര ഇടമായി മാറുക.",
        latn = "Engineering, Sangethika Padanathil Indiyayile Munnira Idamaayi Maaruka."
    ),
    K.transformingLearners to MlVar(
        ml = "പഠിതാക്കളെ മാറ്റിയെടുക്കുക",
        latn = "Padithaakkale Maattiyedukkuka"
    ),
    K.transformingLearnersDesc to MlVar(
        ml = "പഠിതാക്കളെ സാമൂഹികമായി ഉത്തരവാദിത്തമുള്ള ആഗോള വ്യക്തിത്വങ്ങളാക്കി മാറ്റുക.",
        latn = "Padithaakkale Samoohikamaayi Utharavadithamulla Aagola Vyakthithwangalaakki Mattuka."
    ),
    K.location to MlVar(
        ml = "ഇരുപ്പിടം",
        latn = "Iruppidam"
    ),
    K.managementTeamDesc to MlVar(
        ml = "RMK വിദ്യാഭ്യാസ ഗ്രൂപ്പിനെ ദീർഘവീക്ഷണത്തോടെ നയിക്കുന്നവർ.",
        latn = "RMK Vidyabhyasa Groupine Deerghaveekshanathode Nayikkunnavar."
    ),
    K.founders to MlVar(
        ml = "തുടങ്ങിയവർ",
        latn = "Thudangiyavar"
    ),
    K.boardOfDirectors to MlVar(
        ml = "ഡയറക്ടർ ബോർഡ്",
        latn = "Director Board"
    ),
    K.yourName to MlVar(
        ml = "നിങ്ങളുടെ പേര്",
        latn = "Ningalude Peru"
    ),
    K.photoSyncedSuccess to MlVar(
        ml = "ഫോട്ടോ നന്നായി സിങ്ക് ചെയ്തു",
        latn = "Photo Nannaayi Sync Cheythu"
    ),
    K.syncFailed to MlVar(
        ml = "സിങ്ക് ചെയ്യാൻ കഴിഞ്ഞില്ല: ",
        latn = "Sync Cheyyan Kazhinjilla: "
    ),
    K.noGoogleAccountLinked to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് ചേർത്തിട്ടില്ല",
        latn = "Google Account Cherthittilla"
    ),
    K.noPhotoInGoogleAccount to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ടിൽ ഫോട്ടോയില്ല",
        latn = "Google Accountil Photoyilla"
    ),
    K.syncGooglePhoto to MlVar(
        ml = "ഗൂഗിൾ ഫോട്ടോ സിങ്ക് ചെയ്യുക",
        latn = "Google Photo Sync Cheyyuka"
    ),
    K.forgotPassword to MlVar(
        ml = "മറവാക്ക് മറന്നുപോയോ?",
        latn = "Maravaakku Marannupoyo?"
    ),
    K.confirmIdentityBeforeNewPassword to MlVar(
        ml = "തുടരുന്നതിന് മുൻപ് നിങ്ങളാണെന്ന് ഉറപ്പാക്കുക.",
        latn = "Thudarunnathinu Munpu Ningalaanennu Urappaakkuka."
    ),
    K.incorrectPassword to MlVar(
        ml = "തെറ്റായ മറവാക്ക്",
        latn = "Thettaaya Maravaakku"
    ),
    K.verifyAndContinue to MlVar(
        ml = "ഉറപ്പാക്കി തുടരുക",
        latn = "Urappaakki Thudaruka"
    ),
    K.resetEmailSent to MlVar(
        ml = "റീസെറ്റ് ഇമെയിൽ %s എന്ന വിലാസത്തിലേക്ക് അയച്ചിട്ടുണ്ട്",
        latn = "Reset Email %s Enna Vilasathilekku Ayachittundu"
    ),
    K.createNewPassword to MlVar(
        ml = "പുതിയ മറവാക്ക് ഉണ്ടാക്കുക",
        latn = "Puthiya Maravaakku Undaakkuka"
    ),
    K.updatePassword to MlVar(
        ml = "മറവാക്ക് മാറ്റുക",
        latn = "Maravaakku Maattuka"
    ),
    K.atLeast6Chars to MlVar(
        ml = "കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ",
        latn = "Kuranjathu 6 Aksharangal"
    ),
    K.passwordsMatch to MlVar(
        ml = "മറവാക്കുകൾ ചേരുന്നുണ്ട്",
        latn = "Maravaakkukal Cherunnundu"
    ),
    K.passwordUpdated to MlVar(
        ml = "മറവാക്ക് മാറ്റി!",
        latn = "Maravaakku Maatti!"
    ),
    K.returningToSecuritySettings to MlVar(
        ml = "കാവൽ ഒരുക്കങ്ങളിലേക്ക് മടങ്ങുന്നു...",
        latn = "Kaaval Orukkangalilekku Madangunnu..."
    ),
    K.signedInWithGoogleCreatePassword to MlVar(
        ml = "നിങ്ങൾ ഗൂഗിൾ വഴിയാണ് ലോഗിൻ ചെയ്തത്. ഇമെയിൽ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യാൻ ഒരു മറവാക്ക് ഉണ്ടാക്കുക.",
        latn = "Ningal Google Vazhiyaanu Login Cheythathu. Email Upayogichu Login Cheyyan Oru Maravaakku Undaakkuka."
    ),
    K.passwordCreated to MlVar(
        ml = "മറവാക്ക് ഉണ്ടാക്കി!",
        latn = "Maravaakku Undaakki!"
    ),
    K.canNowSignInWithEmail to MlVar(
        ml = "ഇനി നിങ്ങൾക്ക് ഇമെയിൽ ഉപയോഗിച്ചും ലോഗിൻ ചെയ്യാം.",
        latn = "Ini Ningalkku Email Upayogichum Login Cheyyaam."
    ),
    K.unlink to MlVar(
        ml = "വേർപെടുത്തുക",
        latn = "Verpeduthuka"
    ),
    K.unlinkGoogleAccount to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് വേർപെടുത്തണോ?",
        latn = "Google Account Verpeduthano?"
    ),
    K.unlinkGoogleDesc to MlVar(
        ml = "വേർപെടുത്തിയാൽ പിന്നെ ഇമെയിലും മറവാക്കും ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യേണ്ടി വരും.",
        latn = "Verpeduthiyal Pinne Emailum Maravaakkum Upayogichu Login Cheyyendi Varum."
    ),
    K.mustCreatePasswordFirst to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് വേർപെടുത്തുന്നതിന് മുൻപ് ഒരു മറവാക്ക് ഉണ്ടാക്കണം.",
        latn = "Google Account Verpeduthunnathinu Munpu Oru Maravaakku Undaakkanam."
    ),
    K.password to MlVar(
        ml = "മറവാക്ക്",
        latn = "Maravaakku"
    ),
    K.passwordSet to MlVar(
        ml = "മറവാക്ക് വെച്ചു",
        latn = "Maravaakku Vechu"
    ),
    K.noPasswordSet to MlVar(
        ml = "മറവാക്ക് വെച്ചിട്ടില്ല",
        latn = "Maravaakku Vechittilla"
    ),
    K.thisActionIsPermanent to MlVar(
        ml = "ഇത് പിന്നീട് തിരുത്താനാവില്ല",
        latn = "Ithu Pinnidu Thiruthanaavilla"
    ),
    K.deleteAccountWarning to MlVar(
        ml = "അക്കൗണ്ട് കളഞ്ഞാൽ നിങ്ങളുടെ നേരപ്പട്ടിക, കുറിപ്പുകൾ, ഒരുക്കങ്ങൾ എന്നിവയെല്ലാം പോകും. ഇത് തിരികെ കിട്ടില്ല.",
        latn = "Account Kalanjal Ningalude Nerappattika, Kurippukal, Orukkangal Ennivayellam Pokum. Ithu Thirike Kittilla."
    ),
    K.iUnderstandContinue to MlVar(
        ml = "എനിക്ക് മനസ്സിലായി, തുടരുക",
        latn = "Enikku Manassilaayi, Thudaruka"
    ),
    K.confirmDeletionDesc to MlVar(
        ml = "അക്കൗണ്ട് പൂർണ്ണമായും കളയാൻ താഴെയുള്ള ബോക്സിൽ DELETE എന്ന് ടൈപ്പ് ചെയ്യുക.",
        latn = "Account Poornnamaayum Kalayaan Thaazheyulla Boxil DELETE Ennu Type Cheyyuka."
    ),
    K.typeDeleteToConfirm to MlVar(
        ml = "ഉറപ്പാക്കാൻ DELETE എന്ന് ടൈപ്പ് ചെയ്യുക",
        latn = "Urappaakkan DELETE Ennu Type Cheyyuka"
    ),
    K.returningToAuth to MlVar(
        ml = "ലോഗിൻ പേജിലേക്ക് മടങ്ങുന്നു...",
        latn = "Login Pageilekku Madangunnu..."
    ),
    K.deleteAccountPermanently to MlVar(
        ml = "അക്കൗണ്ട് എന്നെന്നേക്കുമായി കളയുക",
        latn = "Account Ennennekumaayi Kalayuka"
    ),
    K.unlinkGoogleDescNoPassword to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് വേർപെടുത്തുന്നതിന് മുൻപ് ഇമെയിലിനായി മറവാക്ക് ഉണ്ടാക്കണം.",
        latn = "Google Account Verpeduthunnathinu Munpu Emailinaayi Maravaakku Undaakkanam."
    ),
    K.unlinkGoogleDescHasPassword to MlVar(
        ml = "നിങ്ങൾക്ക് ഗൂഗിൾ അക്കൗണ്ട് വേർപെടുത്തണോ? ഇമെയിലും മറവാക്കും ഉപയോഗിച്ച് തുടർന്നും ലോഗിൻ ചെയ്യാം.",
        latn = "Ningalkku Google Account Verpeduthano? Emailum Maravaakkum Upayogichu Thudarnnum Login Cheyyaam."
    ),
    K.verificationFailed to MlVar(
        ml = "ഉറപ്പാക്കാൻ കഴിഞ്ഞില്ല",
        latn = "Urappaakkaan Kazhinjilla"
    ),
    K.refresh to MlVar(
        ml = "പുതുക്കുക",
        latn = "Puthukkuka"
    ),
    K.isRequired to MlVar(
        ml = "ഇത് നിർബന്ധമാണ്",
        latn = "Ithu Nirbandhamaanu"
    ),
    K.documents to MlVar(
        ml = "രേഖകൾ",
        latn = "Rekhakal"
    ),
    K.emailPassword to MlVar(
        ml = "ഇമെയിൽ & മറവാക്ക്",
        latn = "Email & Maravaakku"
    ),
    K.connected to MlVar(
        ml = "ചേർത്തു",
        latn = "Cherthu"
    ),
    K.notConnected to MlVar(
        ml = "ചേർത്തിട്ടില്ല",
        latn = "Cherthittilla"
    ),
    K.create to MlVar(
        ml = "ഉണ്ടാക്കുക",
        latn = "Undaakkuka"
    ),
    K.linkedAccountsInfoText to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് ചേർക്കുന്നത് ലോഗിൻ എളുപ്പമാക്കും.",
        latn = "Google Account Cherkkunnathu Login Eluppamaakkum."
    ),
    K.linkGoogle to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് ചേർക്കുക",
        latn = "Google Account Cherkkuka"
    ),
    K.unlinkGoogle to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് ഒഴിവാക്കുക",
        latn = "Google Account Ozhivaakkuka"
    ),
    K.unlinkConfirm to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് ഒഴിവാക്കണോ?",
        latn = "Google Account Ozhivaakkano?"
    ),
    K.unlinkMessage to MlVar(
        ml = "തീർച്ചയായും ഗൂഗിൾ അക്കൗണ്ട് ഒഴിവാക്കണോ?",
        latn = "Theerchayaayum Google Account Ozhivaakkano?"
    ),
    K.createPasswordMsg to MlVar(
        ml = "ഗൂഗിൾ അക്കൗണ്ട് ഒഴിവാക്കുന്നതിന് മുൻപ്, ലോഗിൻ ചെയ്യാൻ ഒരു മറവാക്ക് ഉണ്ടാക്കണം.",
        latn = "Google Account Ozhivaakkunnathinu Munpu, Login Cheyyan Oru Maravaakku Undaakkanam."
    ),
    K.createPasswordFirst to MlVar(
        ml = "ആദ്യം ഒരു മറവാക്ക് ഉണ്ടാക്കുക",
        latn = "Aadyam Oru Maravaakku Undaakkuka"
    ),
    K.noAccountFound to MlVar(
        ml = "ഈ ഇമെയിലിൽ അക്കൗണ്ട് ഒന്നുമില്ല",
        latn = "Ee Emailil Account Onnumilla"
    ),
    K.invalidEmailFormat to MlVar(
        ml = "തെറ്റായ ഇമെയിൽ",
        latn = "Thettaaya Email"
    ),
    K.authFailed to MlVar(
        ml = "ലോഗിൻ തോൽവിയടഞ്ഞു",
        latn = "Login Tholviyadanju"
    ),
    K.firstNameTooShort to MlVar(
        ml = "ആദ്യ പേരിൽ കുറഞ്ഞത് 2 അക്ഷരങ്ങൾ വേണം",
        latn = "Aadya Peril Kuranjathu 2 Aksharangal Venam"
    ),
    K.invalidRegisterNumber to MlVar(
        ml = "തെറ്റായ രജിസ്റ്റർ നമ്പർ",
        latn = "Thettaaya Register Number"
    ),
    K.passwordTooShort to MlVar(
        ml = "മറവാക്കിൽ കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ വേണം",
        latn = "Maravaakkil Kuranjathu 6 Aksharangal Venam"
    ),
    K.signupFailedNoUser to MlVar(
        ml = "അക്കൗണ്ട് ഉണ്ടാക്കാൻ കഴിഞ്ഞില്ല - യൂസറെ ചേർത്തില്ല",
        latn = "Account Undaakkan Kazhinjilla - Usere Cherthilla"
    ),
    K.signupFailed to MlVar(
        ml = "അക്കൗണ്ട് ഉണ്ടാക്കാൻ കഴിഞ്ഞില്ല",
        latn = "Account Undaakkan Kazhinjilla"
    ),
    K.failedToUnlink to MlVar(
        ml = "അൺലിങ്ക് ചെയ്യാൻ കഴിഞ്ഞില്ല",
        latn = "Unlink Cheyyan Kazhinjilla"
    ),
    K.showPassword to MlVar(
        ml = "മറവാക്ക് കാണിക്കുക",
        latn = "Maravaakku Kaanikkuka"
    ),
    K.hidePassword to MlVar(
        ml = "മറവാക്ക് മറയ്ക്കുക",
        latn = "Maravaakku Maraykkuka"
    ),
    K.home to MlVar(
        ml = "മുഖപ്പ്",
        latn = "Mukhapp"
    ),
    K.calendar to MlVar(
        ml = "നാൾവഴി",
        latn = "Naalvazhi"
    ),
    K.notes to MlVar(
        ml = "കുറിപ്പുകൾ",
        latn = "Kurippukal"
    ),
    K.notesDriveTab to MlVar(
        ml = "കുറിപ്പകം",
        latn = "Kurippakam"
    ),
    K.collegeSiteTab to MlVar(
        ml = "വെബ്സൈറ്റ്",
        latn = "Website"
    ),
    K.notAvailable to MlVar(
        ml = "ലഭ്യമല്ല",
        latn = "Labyamalla"
    ),
    K.readMore to MlVar(
        ml = "കൂടുതൽ വായിക്കുക",
        latn = "Kooduthal Vaayikkuka"
    ),
    K.today to MlVar(
        ml = "ഇന്ന്",
        latn = "Innu"
    ),
    K.done to MlVar(
        ml = "ശരി",
        latn = "Shari"
    ),
    K.linkedin to MlVar(
        ml = "ലിങ്ക്ഡ്ഇൻ",
        latn = "LinkedIn"
    ),
    K.github to MlVar(
        ml = "ഗിറ്റ്ഹബ്",
        latn = "GitHub"
    ),
    K.labForBatch to MlVar(
        ml = "ബാച്ച് %s-നുള്ള ലാബ്: %s",
        latn = "Batch %s-nulla Lab: %s"
    ),
    K.authorAttribution to MlVar(
        ml = " - %s",
        latn = " - %s"
    ),
    K.batchLabelFormat to MlVar(
        ml = "ബാച്ച് %s",
        latn = "Batch %s"
    ),
    K.registerRangeFormat to MlVar(
        ml = "രജിസ്റ്റർ നമ്പർ: %s",
        latn = "Register Number: %s"
    ),
    K.studentsCountFormat to MlVar(
        ml = "%s പഠിതാക്കൾ",
        latn = "%s Padithaakkal"
    ),
    K.newExamSchedule to MlVar(
        ml = "പുതിയ പരീക്ഷാ നേരപ്പട്ടിക: %s",
        latn = "Puthiya Pareeksha Nerappattika: %s"
    ),
    K.newExam to MlVar(
        ml = "പുതിയ പരീക്ഷ: %s",
        latn = "Puthiya Pareeksha: %s"
    ),
    K.examDatesRange to MlVar(
        ml = "നാളുകൾ: %s - %s",
        latn = "Naalukal: %s - %s"
    ),
    K.newHolidayAdded to MlVar(
        ml = "പുതിയ അവധി ചേർത്തു",
        latn = "Puthiya Avadhi Cherthu"
    ),
    K.newEvent to MlVar(
        ml = "പുതിയ പരിപാടി: %s",
        latn = "Puthiya Paripaadi: %s"
    ),
    K.eventOnDate to MlVar(
        ml = "%s (%s അന്ന്)",
        latn = "%s (%s Annu)"
    ),
    K.newNotice to MlVar(
        ml = "പുതിയ അറിയിപ്പ്",
        latn = "Puthiya Ariyippu"
    ),
    K.dailyUpdateFormat to MlVar(
        ml = "ഇന്നത്തെ പുതിയവ (%s)",
        latn = "Innathe Puthiyava (%s)"
    ),
    K.newClassEvent to MlVar(
        ml = "പുതിയ ക്ലാസ്സ് പരിപാടി: %s",
        latn = "Puthiya Class Paripaadi: %s"
    ),
    K.clipboardPdfLinkLabel to MlVar(
        ml = "PDF ലിങ്ക്",
        latn = "PDF Link"
    ),
    K.rmkTitle to MlVar(
        ml = "RMK",
        latn = "RMK"
    ),
    K.groupOfInstitutions to MlVar(
        ml = "പഠന ഇടങ്ങൾ",
        latn = "Padana Idangal"
    ),
    K.roleAdmin to MlVar(
        ml = "കാര്യസ്ഥൻ",
        latn = "Kaaryasthan"
    ),
    K.admin to MlVar(
        ml = "കാര്യസ്ഥൻ",
        latn = "Kaaryasthan"
    ),
    K.accessDeniedRoleMustUseAdmin to MlVar(
        ml = "അനുമതിയില്ല: %s കാര്യസ്ഥൻ വെബ്സൈറ്റ് ഉപയോഗിക്കണം.",
        latn = "Anumathiyilla: %s Kaaryasthan Website Upayogikkanam."
    ),
    K.failedToLoadNotes to MlVar(
        ml = "കുറിപ്പുകൾ എടുക്കാൻ കഴിഞ്ഞില്ല",
        latn = "Kurippukal Edukkaan Kazhinjilla"
    ),
    K.unknownError to MlVar(
        ml = "എന്തോ പിഴവുണ്ട്",
        latn = "Entho Pizhavundu"
    ),
    K.notesDrive to MlVar(
        ml = "കുറിപ്പകം",
        latn = "Kurippakam"
    )
)
package com.elvan.neram.ui.mozhiyaakkam

/**
 * Data class representing Tamil variations:
 * - ta: தமிழ் (Pure Tamil script)
 * - latn: Tanglish / Tamil in Latin script
 */
data class TaVar(
    val ta: String,
    val latn: String
)

/**
 * Tamil (ta) Language Dictionary containing both Tamil script and Latin Tanglish variations.
 */
val ta: Map<String, TaVar> = mapOf(
    // ── Navigation ──
    K.navHome to TaVar(
        ta = "முகப்பு",
        latn = "Mugappu"
    ),
    K.navNeram to TaVar(
        ta = "நேரம்",
        latn = "Naeram"
    ),
    K.navSchedule to TaVar(
        ta = "அட்டவணை",
        latn = "Attavanai"
    ),
    K.navCalendar to TaVar(
        ta = "நாட்காட்டி",
        latn = "Naatkaatti"
    ),
    K.navNotes to TaVar(
        ta = "குறிப்புகள்",
        latn = "Kurippugal"
    ),

    // ── Common ──
    K.loading to TaVar(
        ta = "ஏற்றுகிறது...",
        latn = "Aetrugiradhu..."
    ),
    K.error to TaVar(
        ta = "பிழை",
        latn = "Pizhai"
    ),
    K.retry to TaVar(
        ta = "மீண்டும் முயற்சி",
        latn = "Meendum Muyarchi"
    ),
    K.save to TaVar(
        ta = "சேமி",
        latn = "Chaemi"
    ),
    K.delete to TaVar(
        ta = "நீக்கு",
        latn = "Neekku"
    ),
    K.confirm to TaVar(
        ta = "உறுதிப்படுத்து",
        latn = "Urudhippaduthu"
    ),
    K.back to TaVar(
        ta = "பின்செல்",
        latn = "Pinsel"
    ),
    K.cancel to TaVar(
        ta = "கைவிடு",
        latn = "Kaividu"
    ),
    K.ok to TaVar(
        ta = "சரி",
        latn = "Chari"
    ),
    K.edit to TaVar(
        ta = "திருத்து",
        latn = "Thiruthu"
    ),
    K.offline to TaVar(
        ta = "இணையமில்லை",
        latn = "Inaiyamillai"
    ),
    K.offlineMessage to TaVar(
        ta = "தரவை ஏற்ற இணையம் தேவை.",
        latn = "Tharavai aetra inaiyam thevai."
    ),
    K.fromElvanNavil to TaVar(
        ta = "எல்வன் நவில் படைப்பு",
        latn = "Elvan Navil Padaippu"
    ),
    K.elvanNavil to TaVar(
        ta = "எல்வன் நவில்",
        latn = "Elvan Navil"
    ),
    K.elvanNavilDesc to TaVar(
        ta = "எல்வன் பார்த்தசாரதியின் உருவாக்கம்",
        latn = "Elvan Parthasarathiyin Uruvaakkam"
    ),
    K.elvanParthasarathy to TaVar(
        ta = "எல்வன் பார்த்தசாரதி",
        latn = "Elvan Parthasarathy"
    ),

    // ── Home Screen ──
    K.greeting to TaVar(
        ta = "வணக்கம்!",
        latn = "Vanakkam!"
    ),
    K.welcomeToNeram to TaVar(
        ta = "வரவேற்கிறோம்!",
        latn = "Varavaerkiroam!"
    ),
    K.gladYouAreHere to TaVar(
        ta = "நீங்கள் இணைந்ததில் மகிழ்ச்சி 😊",
        latn = "Neengal inaindhadhil magizhchi 😊"
    ),
    K.vanakkam to TaVar(
        ta = "வணக்கம்!",
        latn = "Vanakkam!"
    ),
    K.selectDate to TaVar(
        ta = "நாளைத் தேர்ந்தெடு",
        latn = "Naalaith Thaerndhedu"
    ),
    K.academicCalendar to TaVar(
        ta = "கல்வியாண்டு நாட்காட்டி",
        latn = "Kalviyaandu Naatkaatti"
    ),
    K.schedule to TaVar(
        ta = "அட்டவணை",
        latn = "Attavanai"
    ),
    K.workingDay to TaVar(
        ta = "செயல்நாள்",
        latn = "Cheyalnaal"
    ),
    K.regularWorkingDay to TaVar(
        ta = "வழக்கமான செயல்நாள்",
        latn = "Vazhakkamaana Cheyalnaal"
    ),
    K.noEventsScheduled to TaVar(
        ta = "நிகழ்வுகள் எதுவும் இல்லை",
        latn = "Nigazhvugal Edhuvum Illai"
    ),
    K.followingOrder to TaVar(
        ta = "%s வரிசை பின்பற்றுகிறது",
        latn = "%s Varisai Pinpatrugiradhu"
    ),
    K.classesSuspended to TaVar(
        ta = "வகுப்புகள் இடைநிறுத்தம்",
        latn = "Vaguppugal Idainirutham"
    ),
    K.system to TaVar(
        ta = "அமைப்பு",
        latn = "Amaippu"
    ),
    K.noUpdates to TaVar(
        ta = "இன்று அறிவிப்புகள் இல்லை.",
        latn = "Indru arivippugal illai."
    ),
    K.todaysEvent to TaVar(
        ta = "இன்றைய நிகழ்வு",
        latn = "Indraiya Nigaizhvu"
    ),
    K.specialEvent to TaVar(
        ta = "சிறப்பு நிகழ்வு",
        latn = "Chirappu Nigazhvu"
    ),
    K.fullDay to TaVar(
        ta = "முழுநாள்",
        latn = "Muzhunaal"
    ),
    K.noClasses to TaVar(
        ta = "வகுப்பில்லை",
        latn = "Vaguppillai"
    ),
    K.event to TaVar(
        ta = "நிகழ்வு",
        latn = "Nigazhvu"
    ),
    K.todaysExam to TaVar(
        ta = "இன்றைய தேர்வு",
        latn = "Indraiya Thaervu"
    ),
    K.todaysPracticalExam to TaVar(
        ta = "செய்முறைத் தேர்வு",
        latn = "Cheymuraith Thaervu"
    ),
    K.noClassesScheduled to TaVar(
        ta = "வகுப்புகள் திட்டமிடப்படவில்லை.",
        latn = "Vaguppugal Thittamidappadavillai."
    ),
    K.liveUpdates to TaVar(
        ta = "நேரடி புதுப்பிப்புகள் (%s)",
        latn = "Naeradi Pudhuppippugal (%s)"
    ),
    K.generalNotice to TaVar(
        ta = "பொது அறிவிப்பு",
        latn = "Podhu Arivippu"
    ),
    K.noUpdatesForDate to TaVar(
        ta = "இந்த நாளில் புதுப்பிப்புகள் இல்லை.",
        latn = "Indha naalil pudhuppippugal illai."
    ),
    K.noGeneralNotices to TaVar(
        ta = "பொது அறிவிப்புகள் இல்லை.",
        latn = "Podhu arivippugal illai."
    ),
    K.lab to TaVar(
        ta = "ஆய்வகம்",
        latn = "Aayvagam"
    ),
    K.specialSession to TaVar(
        ta = "சிறப்பு அமர்வு",
        latn = "Chirappu Amarvu"
    ),
    K.fullDayEvent to TaVar(
        ta = "முழு நாள் நிகழ்வு",
        latn = "Muzhu Naal Nigazhvu"
    ),
    K.postedBy to TaVar(
        ta = "பதிவிட்டவர் ",
        latn = "Pathivittavar "
    ),
    K.typeHere to TaVar(
        ta = "இங்கு தட்டச்சு செய்யவும்...",
        latn = "Ingu thattachu seyyavum..."
    ),
    K.studentsCount to TaVar(
        ta = "%s மாணவர்கள்",
        latn = "%s Maanavargal"
    ),
    K.scheduledForToday to TaVar(
        ta = "இன்றைக்கு திட்டமிடப்பட்டுள்ளது",
        latn = "Indraikku thittamidappattulladhu"
    ),
    K.noEventsDeclared to TaVar(
        ta = "நிகழ்வுகள் எதுவும் அறிவிக்கப்படவில்லை",
        latn = "Nigazhvugal edhuvum arivikkappadavillai"
    ),
    K.systemReminder to TaVar(
        ta = "அமைப்பு நினைவூட்டல்",
        latn = "Amaippu ninaivoottal"
    ),
    K.bringLabcoatsEssentials to TaVar(
        ta = "📚 ஆய்வக உடைகள், மடிக்கணினிகள் மற்றும் ஆய்வகப் பொருட்களை எடுத்து வரவும்",
        latn = "📚 Aayvaga udaigal, madikkaninigal matrum aayvagap porutkalai eduthu varavum"
    ),
    K.studyWellExamWish to TaVar(
        ta = "📖 தேர்வுக்கு நன்றாகப் படியுங்கள்! அதிக மதிப்பெண்கள் பெற்று முழு வெற்றி பெறுங்கள்! வாழ்த்துகள்! 🎯",
        latn = "📖 Thaervukku nandraaga padiyungal! Adhiga madhippengal pettru muzhu vetri perungal! Vaazhthugal! 🎯"
    ),
    K.noAcademicCalendarScheduled to TaVar(
        ta = "கல்வி நாள்காட்டி எதுவும் திட்டமிடப்படவில்லை",
        latn = "Kalvi naalkaatti edhuvum thittamidappadavillai"
    ),
    K.open to TaVar(
        ta = "திற",
        latn = "Thira"
    ),
    K.dismiss to TaVar(
        ta = "நிராகரி",
        latn = "Niraagari"
    ),
    K.classesSuspendedDueTo to TaVar(
        ta = "%s காரணமாக வகுப்புகள் இடைநிறுத்தப்பட்டுள்ளன.",
        latn = "%s kaaranamaaga vaguppugal idainiruthippattullana."
    ),
    K.userNotLoggedIn to TaVar(
        ta = "பயனர் உள்நுழையவில்லை.",
        latn = "Payanar ullnuzhaiyavillai."
    ),
    K.failedToSaveUpdate to TaVar(
        ta = "புதுப்பிப்பைச் சேமிக்க முடியவில்லை",
        latn = "Pudhuppippai saemikka mudiyavillai"
    ),
    K.failedToSaveNotice to TaVar(
        ta = "அறிவிப்பைச் சேமிக்க முடியவில்லை",
        latn = "Arivippai saemikka mudiyavillai"
    ),
    K.failedToUpdatePlacement to TaVar(
        ta = "இடவமைப்பைப் புதுப்பிக்க முடியவில்லை",
        latn = "Idavamaippai pudhuppikka mudiyavillai"
    ),
    K.dept to TaVar(
        ta = "துறை",
        latn = "Thurai"
    ),
    K.sec to TaVar(
        ta = "பிரிவு",
        latn = "Pirivu"
    ),
    K.holiday to TaVar(
        ta = "விடுமுறை",
        latn = "Vidumurai"
    ),
    K.profile to TaVar(
        ta = "சுயவிவரம்",
        latn = "Suyavivaram"
    ),
    K.dayReservedFor to TaVar(
        ta = "%s நிகழ்விற்காக இந்நாள் ஒதுக்கப்பட்டுள்ளது.",
        latn = "%s nigazhvirkaaga innaal odhukkappattulladhu."
    ),
    K.regularClassesSuspendedDuring to TaVar(
        ta = "%s கால இடைவெளியில் வழக்கமான வகுப்புகள் இடைநிறுத்தப்பட்டுள்ளன.",
        latn = "%s kaala idaiveliyil vazhakkamaana vaguppugal idainiruthippattullana."
    ),
    K.allDay to TaVar(
        ta = "முழு நாள்",
        latn = "Muzhu Naal"
    ),
    K.explore to TaVar(
        ta = "பார்",
        latn = "Paar"
    ),
    K.monthView to TaVar(
        ta = "மாதப் பார்வை",
        latn = "Maadhap Paarvai"
    ),
    K.listView to TaVar(
        ta = "பட்டியல் பார்வை",
        latn = "Pattiyal Paarvai"
    ),
    K.menu to TaVar(
        ta = "பட்டி",
        latn = "Patti"
    ),
    K.cleanupFailed to TaVar(
        ta = "சுத்தம் செய்ய முடியவில்லை",
        latn = "Suttham seiya mudiyavillai"
    ),
    K.pushNotifications to TaVar(
        ta = "அறிவிப்புகள்",
        latn = "Arivippugal"
    ),
    K.notificationTimings to TaVar(
        ta = "எச்சரிக்கைகள், நேரங்கள் & விருப்பங்கள்",
        latn = "Echarikkaigal, Naerangal & Viruppangal"
    ),
    K.notificationNote to TaVar(
        ta = "குறிப்பு: அறிவிப்புகள் உங்கள் கைப்பேசியின் மின்கலம் மற்றும் இணைய இணைப்பைப் பொறுத்தது.",
        latn = "Kurippu: Arivippugal ungal kaippaesiyin minkalam matrum inaiya inaippaip poruthadhu."
    ),
    K.classCounselors to TaVar(
        ta = "வகுப்பு ஆலோசகர்கள்",
        latn = "Vaguppu Aaloasagargal"
    ),
    K.keyCoordinators to TaVar(
        ta = "முக்கிய ஒருங்கிணைப்பாளர்கள்",
        latn = "Mukkiya Orunginaippaalargal"
    ),
    K.noInfoAvailable to TaVar(
        ta = "தகவல் இல்லை",
        latn = "Thagaval illai"
    ),
    K.noSubjectsScheduled to TaVar(
        ta = "இந்நாளில் பாடங்கள் திட்டமிடப்படவில்லை",
        latn = "Indhanaalil paadangal thittamidappadavillai"
    ),
    K.noBatchesScheduled to TaVar(
        ta = "பிரிவுகள் திட்டமிடப்படவில்லை",
        latn = "Pirivugal thittamidappadavillai"
    ),
    K.noCoursesFound to TaVar(
        ta = "பாடங்கள் எதுவும் காணப்படவில்லை",
        latn = "Paadangal edhuvum kaanappadavillai"
    ),
    K.students to TaVar(
        ta = "%d மாணவர்கள்",
        latn = "%d Maanavargal"
    ),
    K.periods to TaVar(
        ta = "பாடவேளைகள்",
        latn = "Paadavaelaigal"
    ),
    K.classesTab to TaVar(
        ta = "வகுப்புகள்",
        latn = "Vaguppugal"
    ),
    K.examsTab to TaVar(
        ta = "தேர்வுகள்",
        latn = "Thaervugal"
    ),
    K.weeklySchedule to TaVar(
        ta = "கிழமை அட்டவணை",
        latn = "Kizhamai Attavanai"
    ),
    K.collapse to TaVar(
        ta = "சுருக்கு",
        latn = "Churukku"
    ),
    K.expand to TaVar(
        ta = "விரிவாக்கு",
        latn = "Virivaakku"
    ),
    K.noClassesOn to TaVar(
        ta = "%s அன்று வகுப்புகள் இல்லை",
        latn = "%s andru vaguppugal illai"
    ),
    K.ongoingExams to TaVar(
        ta = "நடைபெறும் தேர்வுகள்",
        latn = "Nadaperrum Thaervugal"
    ),
    K.noOngoingExams to TaVar(
        ta = "தற்பொழுது தேர்வுகள் எதுவும் நடைபெறவில்லை",
        latn = "Tharpozhudhu thaervugal edhuvum nadaiperavillai"
    ),
    K.noExamTimetables to TaVar(
        ta = "தேர்வு அட்டவணை வெளியிடப்படவில்லை",
        latn = "Thaervu attavanai veliyidappadavillai"
    ),
    K.upcomingExams to TaVar(
        ta = "வரவிருக்கும் தேர்வுகள்",
        latn = "Varavirukkum thaervugal"
    ),
    K.finishedExams to TaVar(
        ta = "முடிந்த தேர்வுகள்",
        latn = "Mudindha Thaervugal"
    ),
    K.academicCourses to TaVar(
        ta = "கல்விப் பாடங்கள்",
        latn = "Kalvip Paadangal"
    ),
    K.cardUpdate to TaVar(
        ta = "புதுப்பிப்பு",
        latn = "Pudhupippu"
    ),
    K.cardAlert to TaVar(
        ta = "எச்சரிக்கை",
        latn = "Eccharikkai"
    ),
    K.cardNews to TaVar(
        ta = "செய்தி",
        latn = "Seidhi"
    ),
    K.cardTip to TaVar(
        ta = "குறிப்பு",
        latn = "Kurippu"
    ),
    K.cardNotice to TaVar(
        ta = "அறிவிப்பு",
        latn = "Arivippu"
    ),
    K.cardFeature to TaVar(
        ta = "சிறப்பம்சம்",
        latn = "Sirappamsam"
    ),
    K.officialDocuments to TaVar(
        ta = "அதிகாரப்பூர்வ ஆவணங்கள்",
        latn = "Adhigaarappoorva Aavanangal"
    ),
    K.downloadPdfForOffline to TaVar(
        ta = "ஆஃப்லைனில் பயன்படுத்த PDF பதிவிறக்குக",
        latn = "Offlinil payanpadutha PDF padhivirakkuga"
    ),
    K.linkCopiedToClipboard to TaVar(
        ta = "இணைப்பு நகலெடுக்கப்பட்டது",
        latn = "Inaippu nagaledukkappattadhu"
    ),
    K.noAcademicEvents to TaVar(
        ta = "கல்வி நிகழ்வுகள் இல்லை",
        latn = "Kalvi nigazhvugal illai"
    ),
    K.noAcademicEventsFor to TaVar(
        ta = "%s-ல் கல்வி நிகழ்வுகள் இல்லை",
        latn = "%s-il kalvi nigazhvugal illai"
    ),
    K.noUpcomingEvents to TaVar(
        ta = "வரவிருக்கும் நிகழ்வுகள் இல்லை",
        latn = "Varavirukkum nigazhvugal illai"
    ),
    K.rmdCollegeWebsiteDesc to TaVar(
        ta = "அதிகாரப்பூர்வ ஆர்.எம்.டி கல்லூரி இணையதளம்.",
        latn = "Adhigaarappoorva RMD kalloori inaiyathalam."
    ),
    K.rmkNextgenStudentDesc to TaVar(
        ta = "மாணவர் உள்நுழைவு மற்றும் கல்வி கண்காணிப்புக்கான நெக்ஸ்ட்ஜென் தளம்.",
        latn = "Maanavar ulnuzhaivu matrum kalvi kankaanippukkaana Nextgen thalam."
    ),
    K.elvanNavilSiteDesc to TaVar(
        ta = "வளாகச் செய்திகள், கட்டுரைகள் மற்றும் மாணவர் அறிவிப்புகள் தளம்.",
        latn = "Valaagac cheidhigal, katturaigal matrum maanavar arivippugal thalam."
    ),
    K.iamNeoDesc to TaVar(
        ta = "கற்றல், மதிப்பீடு மற்றும் வேலைவாய்ப்பு தீர்வுகள்.",
        latn = "Katral, madhippidu matrum vaelaivaaippu theervugal."
    ),
    K.skillRackDesc to TaVar(
        ta = "தினசரி நிரலாக்க சவால்கள் மற்றும் சிக்கல் தீர்க்கும் பணிகள்.",
        latn = "Dhinachari niralaakka savaalgal matrum sikkal theerkkum panigal."
    ),
    K.codeTantraDesc to TaVar(
        ta = "வகுப்புகள், ஒப்படைப்புகள் மற்றும் மதிப்பீடுகளுக்கான தளம்.",
        latn = "Vaguppugal, oppadaippugal matrum madhippidugalukkaana thalam."
    ),
    K.google to TaVar(
        ta = "கூகிள்",
        latn = "Google"
    ),
    K.googleProfile to TaVar(
        ta = "கூகிள் சுயவிவரம்",
        latn = "Google Suyavivaram"
    ),
    K.googleAccountLinked to TaVar(
        ta = "கூகிள் கணக்கு இணைக்கப்பட்டது!",
        latn = "Google kanakku inaikkappattadhu!"
    ),
    K.male to TaVar(
        ta = "ஆண்",
        latn = "Aan"
    ),
    K.female to TaVar(
        ta = "பெண்",
        latn = "Pen"
    ),
    K.genderOther to TaVar(
        ta = "மற்றவை",
        latn = "Matravai"
    ),
    K.morningWake to TaVar(
        ta = "காலை விழிப்பு",
        latn = "Kaalai Vizhippu"
    ),
    K.preCollege to TaVar(
        ta = "கல்லூரிக்கு முன்",
        latn = "Kalloorikku Mun"
    ),
    K.collegeEntry to TaVar(
        ta = "கல்லூரி நுழைவு",
        latn = "Kalloori Nuzhaivu"
    ),
    K.selectTime to TaVar(
        ta = "நேரத்தைத் தேர்ந்தெடுக்கவும்",
        latn = "Naerathai thernthedu"
    ),
    K.elvanNavilBranding to TaVar(
        ta = "எல்வன் நவில்",
        latn = "Elvan Navil"
    ),
    K.allRightsReserved to TaVar(
        ta = "© அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை",
        latn = "© Anaithu urimaigalum paadhugaakkappattavai"
    ),
    K.linkFailed to TaVar(
        ta = "இணைப்பு தோல்வியடைந்தது",
        latn = "Inaippu tholviyadaindhadhu"
    ),
    K.noIdTokenReceived to TaVar(
        ta = "அடையாள டோக்கன் பெறப்படவில்லை",
        latn = "Adaiyaala token perappadavillai"
    ),
    K.googleSignInFailed to TaVar(
        ta = "கூகிள் உள்நுழைவு தோல்வியடைந்தது",
        latn = "Google ulnuzhaivu tholviyadaindhadhu"
    ),
    K.couldNotLaunchGoogleSignIn to TaVar(
        ta = "கூகிள் உள்நுழைவைத் தொடங்க முடியவில்லை",
        latn = "Google ulnuzhaivai thodanga mudiyavillai"
    ),
    K.welcomeBack to TaVar(
        ta = "மீண்டும் வருக",
        latn = "Meendum Varuga"
    ),
    K.signInToContinue to TaVar(
        ta = "தொடர உள்நுழையவும்",
        latn = "Thodara ulnuzhaiyavum"
    ),
    K.emailAddress to TaVar(
        ta = "மின்னஞ்சல் முகவரி",
        latn = "Minnanjal Mugavari"
    ),
    K.createAccount to TaVar(
        ta = "கணக்கை உருவாக்கவும்",
        latn = "Kanakai uruvaakkavum"
    ),
    K.fillDetailsToGetStarted to TaVar(
        ta = "தொடங்குவதற்கு உங்கள் விவரங்களை நிரப்பவும்",
        latn = "Thodanguvadharku ungal vivarangalai nirappavum"
    ),
    K.firstName to TaVar(
        ta = "முதல் பெயர்",
        latn = "Mudhal Peyar"
    ),
    K.lastName to TaVar(
        ta = "கடைசி பெயர்",
        latn = "Kadaisi Peyar"
    ),
    K.signUpWithGoogle to TaVar(
        ta = "கூகிள் மூலம் பதிவு செய்க",
        latn = "Google moolam padhivu seiga"
    ),
    K.collegeTimeSorted to TaVar(
        ta = "உங்கள் கல்லூரி நேரம், முறைப்படுத்தப்பட்டது.",
        latn = "Ungal kalloori naeram, muraipaduthappattadhu."
    ),
    K.tapAgreeAndContinue to TaVar(
        ta = "நேரத்தைத் தொடங்க \"ஒப்புக்கொண்டு தொடரவும்\" என்பதைத் தட்டவும்.",
        latn = "Nerathai thodanga \"Oppukkondhu thodaravum\" enbadhai thattavum."
    ),
    K.agreeAndContinue to TaVar(
        ta = "ஒப்புக்கொண்டு தொடரவும்",
        latn = "Oppukkondhu thodaravum"
    ),
    K.profileSetup to TaVar(
        ta = "சுயவிவர அமைப்பு",
        latn = "Suyavivara Amaippu"
    ),
    K.selectAcademicDetailsBelow to TaVar(
        ta = "உங்கள் கல்வி விவரங்களை கீழே தேர்ந்தெடுக்கவும்",
        latn = "Ungal kalvi vivarangalai keezhae thernthedukkavum"
    ),
    K.academicBatch to TaVar(
        ta = "கல்வி தொகுதி",
        latn = "Kalvi Thogudhi"
    ),
    K.selectYear to TaVar(
        ta = "ஆண்டைத் தேர்ந்தெடுக்கவும்",
        latn = "Aandai thernthedukkavum"
    ),
    K.completeSetup to TaVar(
        ta = "அமைப்பை முடிக்கவும்",
        latn = "Amaippai mudikkavum"
    ),
    K.previousMonth to TaVar(
        ta = "முந்தைய மாதம்",
        latn = "Mundhaiya Maadham"
    ),
    K.nextMonth to TaVar(
        ta = "அடுத்த மாதம்",
        latn = "Adutha Maadham"
    ),
    K.previousYear to TaVar(
        ta = "முந்தைய ஆண்டு",
        latn = "Mundhaiya Aandu"
    ),
    K.nextYear to TaVar(
        ta = "அடுத்த ஆண்டு",
        latn = "Adutha Aandu"
    ),
    K.noAcademicEventsScheduled to TaVar(
        ta = "கல்வி நிகழ்வுகள் எதுவும் திட்டமிடப்படவில்லை.",
        latn = "Kalvi nigazhvugal edhuvum thittamidalpadavillai."
    ),
    K.goToToday to TaVar(
        ta = "இன்றைய தேதிக்குச் செல்",
        latn = "Indraiya thaedhikku chel"
    ),
    K.eventsCount to TaVar(
        ta = "நிகழ்வுகள்",
        latn = "nigazhvugal"
    ),
    K.holidaysCount to TaVar(
        ta = "விடுமுறைகள்",
        latn = "vidumuraigal"
    ),
    K.downloadingPdf to TaVar(
        ta = "PDF பதிவிறக்கப்படுகிறது...",
        latn = "PDF padhivirakkappadugiradhu..."
    ),
    K.failedToLoadDocument to TaVar(
        ta = "ஆவணத்தை ஏற்ற முடியவில்லை",
        latn = "Aavanathai aetra mudiyavillai"
    ),
    K.goBack to TaVar(
        ta = "பின்செல்",
        latn = "Pinchel"
    ),
    K.noItemsHere to TaVar(
        ta = "இங்கு எந்த உருப்படிகளும் இல்லை",
        latn = "Ingu endha uruppadigalum illai"
    ),
    K.noUnitsAddedYet to TaVar(
        ta = "அலகுகள் எதுவும் இதுவரை சேர்க்கப்படவில்லை",
        latn = "Alagugal edhuvum idhuvarai saerkkappadavillai"
    ),
    K.noNotifications to TaVar(
        ta = "அறிவிப்புகள் எதுவும் இல்லை",
        latn = "Arivippugal edhuvum illai"
    ),
    K.markAllRead to TaVar(
        ta = "அனைத்தையும் படித்ததாகக் குறி",
        latn = "Anaithaiyum padithadhaaga kuri"
    ),
    K.clearAll to TaVar(
        ta = "அனைத்தையும் அழி",
        latn = "Anaithaiyum azhi"
    ),
    K.identityVerifiedTryingAgain to TaVar(
        ta = "அடையாளம் சரிபார்க்கப்பட்டது! மீண்டும் முயற்சிக்கிறது...",
        latn = "Adaiyaalam saripaarkkappattadhu! Meendum muyarchikkiradhu..."
    ),
    K.verifyCustomIdentity to TaVar(
        ta = "அடையாளத்தை சரிபார்க்கவும்",
        latn = "Adaiyaalathai saripaarkkavum"
    ),
    K.verifyGoogleForPasswordDesc to TaVar(
        ta = "பாதுகாப்பிற்காக, கடவுச்சொல்லை உருவாக்க மீண்டும் கூகிள் மூலம் உள்நுழையவும்.",
        latn = "Paadhukaappirkaaga, kadavucchollai uruvaakka meendum Google moolam ulnuzhaiyavum."
    ),
    K.verify to TaVar(
        ta = "சரிபார்",
        latn = "Saripaar"
    ),
    K.googleAccountUnlinked to TaVar(
        ta = "கூகிள் கணக்கு துண்டிக்கப்பட்டது",
        latn = "Google kanakku thundikkappattadhu"
    ),
    K.identityVerifiedDeletingAccount to TaVar(
        ta = "அடையாளம் சரிபார்க்கப்பட்டது! கணக்கு நீக்கப்படுகிறது...",
        latn = "Adaiyaalam saripaarkkappattadhu! Kanakku neekkappadugiradhu..."
    ),
    K.accountDeleted to TaVar(
        ta = "கணக்கு நீக்கப்பட்டது",
        latn = "Kanakku neekkappattadhu"
    ),
    K.verifyIdentityForDeletion to TaVar(
        ta = "நீக்குதலுக்கான அடையாள சரிபார்ப்பு",
        latn = "Neekkudhalukkaana adaiyaala saripaarppu"
    ),
    K.verifyGoogleForDeletionDesc to TaVar(
        ta = "உங்கள் கணக்கை நீக்குவது ஒரு முக்கிய நடவடிக்கை. உறுதிப்படுத்த மீண்டும் கூகிள் மூலம் உள்நுழையவும்.",
        latn = "Ungal kanakkai neekkuvadhu oru mukkiya nadavadikkai. Urudhippadutha meendum Google moolam ulnuzhaiyavum."
    ),
    K.secretary to TaVar(
        ta = "செயலாளர்",
        latn = "Seyalaalar"
    ),
    K.rsMunirathinamBio to TaVar(
        ta = "தமிழ்நாடு சட்டமன்றத்தின் முன்னாள் உறுப்பினராகப் பணியாற்றி, ஆர்.எம்.கே கல்விக் குழுமத்தை நிறுவிய தொலைநோக்கு பார்வையாளர்.",
        latn = "Tamil Nadu sattamandratthin munnaal uruppinaraaga paniyaatri, R.M.K kalvik kuzhumathai niruviya tholainoaku paarvaiyaalar."
    ),
    K.rmKishoreBio to TaVar(
        ta = "இங்கிலாந்தில் எம்பிஏ முடித்த இயந்திரப் பொறியாளர், மாணவர்களை சர்வதேசத் தரத்துடன் வெற்றியாளர்களாக மாற்றுவதில் கவனம் செலுத்துகிறார்.",
        latn = "Englandil MBA mudittha iyandhira poriyaalar, maanavargalai sarvadhaesa tharatthudan vetriyaalargalaaga maatruvadhil gavanam selutthugiraar."
    ),
    K.manjulaMunirathinamBio to TaVar(
        ta = "ஒரு தசாப்தத்திற்கும் மேலாக இக்குழுமத்திற்கு அர்ப்பணிப்புடன் சேவை செய்யும் சமூக சேவகர் மற்றும் கல்வியாளர்.",
        latn = "Oru thasaapdhatthirkkum maelaaga ikkuzhumatthirkku arppanippudan saevai seyyum samooga saevagar matrum kalviyaalar."
    ),
    K.jothiNaiduBio to TaVar(
        ta = "தொழில்துறை நிர்வாகத்தில் பரந்த அனுபவம் கொண்டவர், கிட்டத்தட்ட 30 ஆண்டுகளாக இக்குழுமத்துடன் தொடர்புடையவர்.",
        latn = "Thozhildhurai nirvaagatthil parandha anubavam kondavar, kittathatta 30 aandugalaaga ikkuzhumatthudan thodarbudaiyavar."
    ),
    K.yalamanchiPradeepBio to TaVar(
        ta = "கிண்டி பொறியியல் கல்லூரியின் இசிஇ பொறியாளர், அமெரிக்காவின் கார்னகி மெலன் பல்கலைக்கழகத்தில் முதுகலை பட்டம் பெற்றவர்.",
        latn = "Guindy poriyiyal kalloori ECE poriyaalar, Americavin Carnegie Mellon palkalaikkazhagathil mudhugalaip pattam petravar."
    ),
    K.kavaraipettaiAddress to TaVar(
        ta = "கவரப்பேட்டை, திருவள்ளூர் மாவட்டம்",
        latn = "Kavaraipettai, Thiruvallur Maavattam"
    ),
    K.puduvoyalAddress to TaVar(
        ta = "புதுவாயல், திருவள்ளூர் மாவட்டம்",
        latn = "Puduvoyal, Thiruvallur Maavattam"
    ),
    K.thiruverkaduAddress to TaVar(
        ta = "திருவேற்காடு, சென்னை",
        latn = "Thiruverkadu, Chennai"
    ),
    K.sriDurgadeviPolytechnic to TaVar(
        ta = "ஸ்ரீ துர்காதேவி பாலிடெக்னிக் கல்லூரி",
        latn = "Sri Durgadevi Polytechnic Kalloori"
    ),
    K.rmkMatricSchool to TaVar(
        ta = "ஆர்.எம்.கே மெட்ரிகுலேஷன் பள்ளி",
        latn = "R.M.K. Matriculation Palli"
    ),
    K.dontHaveAccount to TaVar(
        ta = "கணக்கு இல்லையா? ",
        latn = "Kanakku illaiya? "
    ),
    K.alreadyHaveAccount to TaVar(
        ta = "ஏற்கனவே கணக்கு உள்ளதா? ",
        latn = "Aerkannavae kanakku ulladha? "
    ),
    K.signUp to TaVar(
        ta = "பதிவு செய்க",
        latn = "Padhivu seiga"
    ),
    K.logIn to TaVar(
        ta = "உள்நுழைக",
        latn = "Ulnuzhaiga"
    ),
    K.orDivider to TaVar(
        ta = " அல்லது ",
        latn = " Alladhu "
    ),
    K.continueWithGoogle to TaVar(
        ta = "கூகிள் மூலம் தொடரவும்",
        latn = "Google moolam thodaravum"
    ),

    // ── Days of Week ──
    K.dayMonday to TaVar(
        ta = "திங்",
        latn = "Thin"
    ),
    K.dayTuesday to TaVar(
        ta = "செவ்",
        latn = "Chev"
    ),
    K.dayWednesday to TaVar(
        ta = "அறி",
        latn = "Ari"
    ),
    K.dayThursday to TaVar(
        ta = "வியா",
        latn = "Viya"
    ),
    K.dayFriday to TaVar(
        ta = "வெள்",
        latn = "Vell"
    ),
    K.daySaturday to TaVar(
        ta = "காரி",
        latn = "Kaari"
    ),
    K.daySunday to TaVar(
        ta = "ஞா",
        latn = "Nyaa"
    ),

    K.dayMondayFull to TaVar(
        ta = "திங்கள்",
        latn = "Thingal"
    ),
    K.dayTuesdayFull to TaVar(
        ta = "செவ்வாய்",
        latn = "Sevvaai"
    ),
    K.dayWednesdayFull to TaVar(
        ta = "அறிவன்",
        latn = "Arivan"
    ),
    K.dayThursdayFull to TaVar(
        ta = "வியாழன்",
        latn = "Viyazhan"
    ),
    K.dayFridayFull to TaVar(
        ta = "வெள்ளி",
        latn = "Velli"
    ),
    K.daySaturdayFull to TaVar(
        ta = "காரி",
        latn = "Kaari"
    ),
    K.daySundayFull to TaVar(
        ta = "ஞாயிறு",
        latn = "Gnaayiru"
    ),

    K.dayMondayLong to TaVar(
        ta = "திங்கட்கிழமை",
        latn = "Thingatkizhamai"
    ),
    K.dayTuesdayLong to TaVar(
        ta = "செவ்வாய்க்கிழமை",
        latn = "Sevvaaikkizhamai"
    ),
    K.dayWednesdayLong to TaVar(
        ta = "அறிவன்கிழமை",
        latn = "Arivankizhamai"
    ),
    K.dayThursdayLong to TaVar(
        ta = "வியாழக்கிழமை",
        latn = "Viyazhakkizhamai"
    ),
    K.dayFridayLong to TaVar(
        ta = "வெள்ளிக்கிழமை",
        latn = "Vellikkizhamai"
    ),
    K.daySaturdayLong to TaVar(
        ta = "காரிக்கிழமை",
        latn = "Kaarikkizhamai"
    ),
    K.daySundayLong to TaVar(
        ta = "ஞாயிற்றுக்கிழமை",
        latn = "Gnaayitrukizhamai"
    ),

    // ── Months of Year ──
    K.monthJan to TaVar(
        ta = "சனவரி",
        latn = "Sanavari"
    ),
    K.monthFeb to TaVar(
        ta = "பிப்ரவரி",
        latn = "Pibravari"
    ),
    K.monthMar to TaVar(
        ta = "மார்ச்சு",
        latn = "Maarchu"
    ),
    K.monthApr to TaVar(
        ta = "ஏப்ரல்",
        latn = "Aepral"
    ),
    K.monthMay to TaVar(
        ta = "மே",
        latn = "Mae"
    ),
    K.monthJun to TaVar(
        ta = "சூன்",
        latn = "Shoon"
    ),
    K.monthJul to TaVar(
        ta = "சூலை",
        latn = "Shoolai"
    ),
    K.monthAug to TaVar(
        ta = "ஆகத்து",
        latn = "Aagathu"
    ),
    K.monthSep to TaVar(
        ta = "செப்டம்பர்",
        latn = "Septembar"
    ),
    K.monthOct to TaVar(
        ta = "அக்டோபர்",
        latn = "Aktoabar"
    ),
    K.monthNov to TaVar(
        ta = "நவம்பர்",
        latn = "Navambar"
    ),
    K.monthDec to TaVar(
        ta = "திசம்பர்",
        latn = "Dhisambar"
    ),

    K.monthJanShort to TaVar(
        ta = "சன",
        latn = "San"
    ),
    K.monthFebShort to TaVar(
        ta = "பிப்",
        latn = "Pib"
    ),
    K.monthMarShort to TaVar(
        ta = "மார்",
        latn = "Maar"
    ),
    K.monthAprShort to TaVar(
        ta = "ஏப்",
        latn = "Aep"
    ),
    K.monthMayShort to TaVar(
        ta = "மே",
        latn = "Mae"
    ),
    K.monthJunShort to TaVar(
        ta = "சூன்",
        latn = "Shoon"
    ),
    K.monthJulShort to TaVar(
        ta = "சூலை",
        latn = "Shoolai"
    ),
    K.monthAugShort to TaVar(
        ta = "ஆக",
        latn = "Aaga"
    ),
    K.monthSepShort to TaVar(
        ta = "செப்",
        latn = "Sep"
    ),
    K.monthOctShort to TaVar(
        ta = "அக்",
        latn = "Ak"
    ),
    K.monthNovShort to TaVar(
        ta = "நவ",
        latn = "Nava"
    ),
    K.monthDecShort to TaVar(
        ta = "திச",
        latn = "Dhisa"
    ),

    // ── Settings Hub ──
    K.settings to TaVar(
        ta = "அமைப்புகள்",
        latn = "Amaippugal"
    ),
    K.neramAccount to TaVar(
        ta = "நேரம் கணக்கு",
        latn = "Naeram Kanakku"
    ),
    K.accounts to TaVar(
        ta = "கணக்குகள்",
        latn = "Kanakkugal"
    ),
    K.accountsDesc to TaVar(
        ta = "இணைக்கப்பட்ட கணக்குகள், வெளியேறு",
        latn = "Inaikkappatta kanakkugal, veliyaeru"
    ),
    K.security to TaVar(
        ta = "பாதுகாப்பு",
        latn = "Paadhugaappu"
    ),
    K.securityDesc to TaVar(
        ta = "கடவுச்சொல், கணக்கு நீக்கம்",
        latn = "Kadavuchol, Kanakku neekkam"
    ),
    K.userDirectory to TaVar(
        ta = "பயனர் பட்டியல்",
        latn = "Payanar Pattiyal"
    ),
    K.userDirectoryDesc to TaVar(
        ta = "ஆசிரியர்கள், பணியாளர்கள், மாணவர்கள்",
        latn = "Aasiriyargal, Paniyalaargal, Maanavargal"
    ),
    K.display to TaVar(
        ta = "காட்சி",
        latn = "Kaatchi"
    ),
    K.displayDesc to TaVar(
        ta = "ஒளி, இருள் பயன்முறை",
        latn = "Oli, irul payanmurai"
    ),
    K.storageData to TaVar(
        ta = "சேமிப்பு & தரவு",
        latn = "Chaemippu & Tharavu"
    ),
    K.storageDesc to TaVar(
        ta = "பழைய புதுப்பிப்புகளை அழி",
        latn = "Pazhaiya pudhuppippugalai azhi"
    ),
    K.complaints to TaVar(
        ta = "புகார்கள் & கருத்து",
        latn = "Pugaargal & Karuthu"
    ),
    K.complaintsDesc to TaVar(
        ta = "சிக்கல்களை புகாரளி, பரிந்துரைகள்",
        latn = "Sikkalgalai pugaarali, Parindhuraigal"
    ),
    K.aboutDeveloper to TaVar(
        ta = "வடிவாளர் பற்றி",
        latn = "Vadivaalar Patri"
    ),
    K.aboutDeveloperDesc to TaVar(
        ta = "டெவலப்பர் விவரங்கள் & தொடர்புகள்",
        latn = "Developer vivarangal & thodarbugal"
    ),
    K.aboutApp to TaVar(
        ta = "செயலி பற்றி",
        latn = "Cheyali Patri"
    ),
    K.aboutAppDesc to TaVar(
        ta = "நேரம் - கல்வி அட்டவணை",
        latn = "Naeram - Kalvi Attavanai"
    ),
    K.importantSites to TaVar(
        ta = "முக்கிய தளங்கள்",
        latn = "Mukkiya Thalangal"
    ),
    K.importantSitesDesc to TaVar(
        ta = "கல்லூரி இணையதளங்கள், இணைப்புகள்",
        latn = "Kalloori inaiyathalangal, Inaippugal"
    ),
    K.aboutRmk to TaVar(
        ta = "RMK குழுமம் பற்றி",
        latn = "RMK Kuzhumam Patri"
    ),
    K.aboutRmkDesc to TaVar(
        ta = "நிறுவனங்கள், கையாளுமை",
        latn = "Niruvanangal, Kaiyaalumai"
    ),
    K.contact to TaVar(
        ta = "தொடர்பிற்கு",
        latn = "Thodarbirkku"
    ),
    K.contactDesc to TaVar(
        ta = "உதவி எண்கள், முகவரி",
        latn = "Udhavi engal, Mugavari"
    ),
    K.managementTeam to TaVar(
        ta = "கையாளுமைக் குழு",
        latn = "Kaiyaalumaik Kuzhu"
    ),
    K.language to TaVar(
        ta = "மொழி",
        latn = "Mozhi"
    ),
    K.languageDesc to TaVar(
        ta = "தமிழ், ஆங்கிலம், தமிழ் இலத்தீன்",
        latn = "Thamizh, Aangilam, Thamizh Latin"
    ),
    K.deviceLanguage to TaVar(
        ta = "இயல்புமொழி",
        latn = "Iyalbumozhi"
    ),
    K.english to TaVar(
        ta = "ஆங்கிலம்",
        latn = "Aangilam"
    ),
    K.tamil to TaVar(
        ta = "தமிழ்",
        latn = "தமிழ்"
    ),
    K.tamilLatin to TaVar(
        ta = "தமிழ் இலத்தீன்",
        latn = "Thamizh Ilatheen"
    ),
    K.languageInfo to TaVar(
        ta = "மொழி மாற்றம் செயலியில் உள்ள அனைத்து திரைகளிலும் உடனடியாக செயல்படும்.",
        latn = "Mozhi maatram Cheyaliyin anaithu thiraigalilum udanadiyaga seyalpadum."
    ),
    K.editProfile to TaVar(
        ta = "தன்னுறுவை மாற்று",
        latn = "Thannuruvai Maatru"
    ),
    K.feedback to TaVar(
        ta = "கருத்துகள் & வினவல்கள்",
        latn = "Karuthugal & Vinavalgal"
    ),

    // ── Display Settings ──
    K.lightMode to TaVar(
        ta = "ஒளி முறை",
        latn = "Oli Murai"
    ),
    K.darkMode to TaVar(
        ta = "இருள் முறை",
        latn = "Irul Murai"
    ),
    K.systemAuto to TaVar(
        ta = "தானியங்கி",
        latn = "Thaaniyangi"
    ),
    K.themeDescription to TaVar(
        ta = "அமைப்பிற்கேற்ப மாறும்",
        latn = "Amaippirkaerpa maarum"
    ),

    // ── Accounts & Security ──
    K.linkedAccounts to TaVar(
        ta = "இணைந்த கணக்குகள்",
        latn = "Inaindha Kanakkugal"
    ),
    K.linkedAccountsDesc to TaVar(
        ta = "Google உள்நுழைவைக் கையாளு",
        latn = "Google ullnuzhaivaik kaiyaalu"
    ),
    K.signOut to TaVar(
        ta = "வெளியேறு",
        latn = "Veliyaeru"
    ),
    K.signOutDesc to TaVar(
        ta = "நேரம் கணக்கிலிருந்து வெளியேறு",
        latn = "Naeram kanakkilirundhu veliyaeru"
    ),
    K.signOutConfirm to TaVar(
        ta = "வெளியேற விரும்புகிறீர்களா?",
        latn = "Veliyaera virumbugireergalaa?"
    ),
    K.signOutMessage to TaVar(
        ta = "நிச்சயமாக வெளியேற விரும்புகிறீர்களா?",
        latn = "Nichayamaaga veliyaera virumbugireergalaa?"
    ),
    K.changePassword to TaVar(
        ta = "கடவுச்சொல் மாற்றம்",
        latn = "Kadavuchol Maatram"
    ),
    K.deleteAccount to TaVar(
        ta = "கணக்கு நீக்கம்",
        latn = "Kanakku Neekkam"
    ),
    K.dangerZone to TaVar(
        ta = "இடர்ப் பகுதி",
        latn = "Idarp Pagudhi"
    ),
    K.createPassword to TaVar(
        ta = "கடவுச்சொல் உருவாக்கு",
        latn = "Kadavuchol Uruvaakku"
    ),

    // ── Storage Settings ──
    K.cleanupOptions to TaVar(
        ta = "தூய்மைப்படுத்தல்",
        latn = "Thooymaippaduthal"
    ),
    K.clearOldUpdates to TaVar(
        ta = "பழைய புதுப்பிப்புகளை அழி",
        latn = "Pazhaya Pudhuppippugalai Azhi"
    ),
    K.clearOldUpdatesDesc to TaVar(
        ta = "30 நாட்களுக்கு மேலான செய்திகளை நீக்கு",
        latn = "30 naatkalukku maelaana seithigalai neekku"
    ),
    K.customRangeDeletion to TaVar(
        ta = "தனிப்பயன் வரம்பு நீக்கம்",
        latn = "Thanipayal Varambu Neekkam"
    ),
    K.customRangeDesc to TaVar(
        ta = "புதுப்பிப்புகளை அழிக்க நாள் வரம்பு தேர்வு",
        latn = "Pudhuppippugalai azhikka naal varambu thaervu"
    ),
    K.optimizationInfo to TaVar(
        ta = "சேமிப்பிடத்தை மேம்படுத்துதல் செயலியை வேகமாக இயங்கச் செய்யும்.",
        latn = "Chaemippidathai maembaduthudhal cheyaliyai vaegamaaga iyanga seiyum."
    ),
    K.confirmDeletion to TaVar(
        ta = "நீக்கத்தை உறுதிப்படுத்து",
        latn = "Neekkathai Urudhippaduthu"
    ),
    K.clearNow to TaVar(
        ta = "இப்பொழுது அழி",
        latn = "Ippozhudhu Azhi"
    ),
    K.deleteData to TaVar(
        ta = "தரவை நீக்கு",
        latn = "Tharavai Neekku"
    ),
    K.selectRange to TaVar(
        ta = "வரம்பு தேர்வு",
        latn = "Varambu Thaervu"
    ),
    K.selectDateRange to TaVar(
        ta = "நாள் வரம்பு தேர்வு",
        latn = "Naal Varambu Thaervu"
    ),
    K.chooseUpdatesToWipe to TaVar(
        ta = "நீக்க புதுப்பிப்புகளை தேர்வு",
        latn = "Neekka pudhuppippugalai thaervu"
    ),
    K.clearConfirmMessage to TaVar(
        ta = "30 நாட்களுக்கு மேலான அனைத்து புதுப்பிப்புகளும் நீக்கப்படும். இதை மீட்க இயலாது.",
        latn = "30 naatkalukku maelaana anaithu pudhuppippugalum neekkappadum."
    ),
    K.clearedMessage to TaVar(
        ta = "30 நாட்களுக்கு மேலான புதுப்பிப்புகள் நீக்கப்பட்டன",
        latn = "30 naatkalukku maelaana pudhuppippugal neekkappattana"
    ),

    // ── Notes Screen ──
    K.notUploadedTitle to TaVar(
        ta = "பதிவேற்றவில்லை",
        latn = "Pathivaetravillai"
    ),
    K.notUploadedMessage to TaVar(
        ta = "இந்த பாடகுறிப்புகள் rmd.ac.in-ல் இன்னும் பதிவேற்றப்படவில்லை. அவை பதிவேற்றப்பட்டவுடன் இங்கே கிடைக்கும்.",
        latn = "Indha paadakkurippugal rmd.ac.in-il innum pathivaetravillai. Pathivaetrapattavudan ingae kidaikkum."
    ),
    K.unit to TaVar(
        ta = "அலகு %d",
        latn = "Alagu %d"
    ),

    // ── User Directory ──
    K.noUsersFound to TaVar(
        ta = "பயனர்கள் எவரும் கிடைக்கவில்லை.",
        latn = "Payanargal yaarum kidaikkavillai."
    ),
    K.email to TaVar(
        ta = "மின்னஞ்சல்",
        latn = "Minnanjal"
    ),

    // ── About App Screen ──
    K.whatIsNeram to TaVar(
        ta = "நேரம் என்றால் என்ன?",
        latn = "Naeram Endraal Enna?"
    ),
    K.aboutNeramDesc to TaVar(
        ta = "நேரம் உங்கள் கல்லூரி கல்வி பயணத்தை எளிதாக்கும் நுண்ணறிவு நாள்காட்டி மற்றும் அட்டவணை செயலி ஆகும்.\n\nஎல்வன் நவில் படைப்பு\nவகுப்பு அட்டவணை, தேர்வுகள், அறிவிப்புகள் மற்றும் குறிப்புகளை ஒரே இடத்தில் எளிதாக அறிய உருவாக்கப்பட்டது.",
        latn = "Naeram ungal kalloori kalvi payanathai elidhaakkum nunnarivu naatkaatti matrum attavanai seyali aagum.\n\nElvan Navil Padaippu\nVaguppu attavanai, thaervugal, arivippugal matrum kurippugalai orae idathil elidhaaga ariya uruvaakkappattadhu."
    ),
    K.features to TaVar(
        ta = "அம்சங்கள்",
        latn = "Amsangal"
    ),
    K.smartTimetable to TaVar(
        ta = "நுண்ணறிவு அட்டவணை",
        latn = "Nunnarivu Attavanai"
    ),
    K.smartTimetableDesc to TaVar(
        ta = "அன்றாட வகுப்பு நேர்வரிசை, ஆசிரியர் தகவல் மற்றும் அறை எண்களை உடனுக்குடன் காண்க.",
        latn = "Andraada vaguppu nervarisai, aasiriyar thagaval matrum arai engalai udanukkudan kaanga."
    ),
    K.examCalendar to TaVar(
        ta = "தேர்வு நாட்காட்டி",
        latn = "Thaervu Naatkaatti"
    ),
    K.examCalendarDesc to TaVar(
        ta = "வரவிருக்கும் தேர்வுகள், அகத்தேர்வுகள் மற்றும் நிகழ்வுகளை மீதமுள்ள காலத்துடன் அறிக.",
        latn = "Varavirukkum thaervugal, agathaervugal matrum nigazhvugalai meedhamulla kaalathudan ariga."
    ),
    K.campusAnnouncements to TaVar(
        ta = "வளாக அறிவிப்புகள்",
        latn = "Valaaga Arivippugal"
    ),
    K.campusAnnouncementsDesc to TaVar(
        ta = "கல்லூரியின் முக்கிய செய்திகள் மற்றும் சுற்றறிக்கைகளை உடனடியாக அறிவிப்பாக பெறுங்கள்.",
        latn = "Kallooriyin mukkiya seithigal matrum chuttrarikkaikalai udanadiyaaga perungal."
    ),
    K.offlineSupport to TaVar(
        ta = "இணையமில்லா ஆதரவு",
        latn = "Inaiyamillaa Aadharavu"
    ),
    K.offlineSupportDesc to TaVar(
        ta = "இணைய இணைப்பு இல்லாத போதும் அட்டவணையை எளிதாக அணுகலாம்.",
        latn = "Inaiya inaippu illaadha poadhum attavanaiyai elidhaaga anugalaam."
    ),
    K.cloudSync to TaVar(
        ta = "முகில் ஒத்திசைவு",
        latn = "Mugil Othisaivu"
    ),
    K.cloudSyncDesc to TaVar(
        ta = "உங்கள் அட்டவணை மற்றும் விருப்பங்கள் Firebase மூலம் பாதுகாப்பாக சேமிக்கப்படுகிறது.",
        latn = "Ungal attavanai matrum viruppangal Firebase moolam paadhugaappaaga chaemikkappadugiradhu."
    ),

    // ── Developer Info ──
    K.connectWithMe to TaVar(
        ta = "தொடர்பு கொள்க",
        latn = "Thodarbu Kolga"
    ),
    K.visitPortfolio to TaVar(
        ta = "வலைத்தளத்தை காண்க",
        latn = "Valaithalathai Kaanga"
    ),
    K.locationChennai to TaVar(
        ta = "ஆரணி / சென்னை, தமிழ்நாடு",
        latn = "Arani / Chennai, Tamil Nadu"
    ),

    // ── Feedback & Complaints ──
    K.submitFeedback to TaVar(
        ta = "கருத்தைத் தெரிவி",
        latn = "Karuthaith Therivi"
    ),
    K.describeIssue to TaVar(
        ta = "உங்கள் கருத்து அல்லது சிக்கலை விரிவாக விளக்கவும்...",
        latn = "Ungal karuthu alladhu Chikkalai virivaaga vilakkavum..."
    ),
    K.feedbackSubmittedSuccess to TaVar(
        ta = "நன்றி! உங்கள் கருத்து வெற்றிகரமாக அனுப்பப்பட்டது.",
        latn = "Nandri! Ungal karuthu vetrigaramaaga anuppappattadhu."
    ),
    K.fillAllFields to TaVar(
        ta = "தேவையான அனைத்து தரவுகளையும் நிரப்பவும்",
        latn = "Thaevaiyaana anaithu tharavugalaiyum nirappavum"
    ),

    // ── RMK Group & Management ──
    K.rmkGroupLegacy to TaVar(
        ta = "RMK கல்வி குழுமம்",
        latn = "RMK Kalvi Kuzhumam"
    ),
    K.rmkDescription to TaVar(
        ta = "கல்வித் தரம், ஒழுக்கம் மற்றும் நவீன பொறியியல் கல்வியில் சிறந்த முன்னோடி கல்வி நிறுவனங்கள்.",
        latn = "Kalvith tharam, ozhukkam matrum naveena engineering kalviyil chirandha kalvi niruvanangal."
    ),
    K.visionMission to TaVar(
        ta = "நோக்கம் & தொலைநோக்கு",
        latn = "Noakkam & Tholainoakkam"
    ),
    K.institutions to TaVar(
        ta = "கல்வி நிறுவனங்கள்",
        latn = "Kalvi Niruvanangal"
    ),
    K.rmkEnggCollege to TaVar(
        ta = "ஆர்.எம்.கே பொறியியல் கல்லூரி",
        latn = "R.M.K. Engineering College"
    ),
    K.rmdEnggCollege to TaVar(
        ta = "ஆர்.எம்.டி பொறியியல் கல்லூரி",
        latn = "R.M.D. Engineering College"
    ),
    K.rmkCet to TaVar(
        ta = "ஆர்.எம்.கே பொறியியல் மற்றும் தொழில்நுட்பக் கல்லூரி",
        latn = "R.M.K. College of Engineering and Technology"
    ),
    K.rmkSchool to TaVar(
        ta = "ஆர்.எம்.கே உண்டு உறைவிட மேல்நிலைப் பள்ளி",
        latn = "R.M.K. Residential Senior Secondary School"
    ),
    K.founderChairman to TaVar(
        ta = "நிறுவனர் & தலைவர்",
        latn = "Niruvanar & Thalaivar"
    ),
    K.viceChairman to TaVar(
        ta = "துணைத் தலைவர்",
        latn = "Thunai Thalaivar"
    ),
    K.chairperson to TaVar(
        ta = "தலைவர்",
        latn = "Chairperson"
    ),
    K.director to TaVar(
        ta = "இயக்குனர்",
        latn = "Iyakunar"
    ),

    // ── College Sites ──
    K.officialPortals to TaVar(
        ta = "அலுவல் தளங்கள்",
        latn = "Aluval Thalangal"
    ),

    // ── Contact & Emergency ──
    K.emergencyHelpline to TaVar(
        ta = "அவசர உதவி எண்கள்",
        latn = "Avasara Udhavi Engal"
    ),
    K.collegeReception to TaVar(
        ta = "கல்லூரி வரவேற்பறை",
        latn = "Kalloori Varavaerparai"
    ),
    K.principalOffice to TaVar(
        ta = "முதல்வர் அலுவலகம்",
        latn = "Mudhalvar Aluvalagam"
    ),
    K.placementCell to TaVar(
        ta = "வேலைவாய்ப்பு பிரிவு",
        latn = "Vaelaivaaippu Pirivu"
    ),
    K.transportIncharge to TaVar(
        ta = "போக்குவரத்து பொறுப்பாளர்",
        latn = "Poakkuvarathu Poruppaalar"
    ),
    K.hostelOffice to TaVar(
        ta = "விடுதி அலுவலகம்",
        latn = "Vidudhi Aluvalagam"
    ),
    K.ambulanceMedical to TaVar(
        ta = "அவசர ஊர்தி & மருத்துவ மையம்",
        latn = "Avasara Oordhi & Maruthuva Maiyam"
    ),
    K.securityGate to TaVar(
        ta = "முதன்மை பாதுகாப்பு வாயில்",
        latn = "Mudhanmai Paadhugaappu Vaayil"
    ),

    // ── Auth & Onboarding ──
    K.fullName to TaVar(
        ta = "முழு பெயர்",
        latn = "Muzhu Peyar"
    ),
    K.roleStudent to TaVar(
        ta = "மாணவர்",
        latn = "Maanavar"
    ),
    K.fillDetailsGetStarted to TaVar(
        ta = "தொடங்க தரவுகளை நிரப்பவும்",
        latn = "Thodanga tharavugalai nirappavum"
    ),
    K.welcomeToNeramTitle to TaVar(
        ta = "நேரத்திற்கு வரவேற்கிறோம்",
        latn = "Naerathirku Varavaerkiroam"
    ),
    K.yourCollegeTimeSorted to TaVar(
        ta = "உங்கள் கல்லூரி நேரம், எளிதாக.",
        latn = "Ungal Kalloori Naeram, Elidhaaga."
    ),

    // ── Profile Screen & Edit Dialogs ──
    K.personalInfo to TaVar(
        ta = "தன்தகவல்கள்",
        latn = "Than Thagavalkal"
    ),
    K.academicDetails to TaVar(
        ta = "கல்வித் தகவல்கள்",
        latn = "Kalvith Thagavalgal"
    ),
    K.editName to TaVar(
        ta = "பெயரைத் திருத்து",
        latn = "Peyaraith Thiruthu"
    ),
    K.enterFirstName to TaVar(
        ta = "முதற்பெயரை உள்ளிடவும்",
        latn = "Mudharpeyarai ullidavum"
    ),
    K.enterLastName to TaVar(
        ta = "கடைசி பெயரை உள்ளிடவும்",
        latn = "Kadaisi peyarai ullidavum"
    ),
    K.mobileNumber to TaVar(
        ta = "கைப்பேசி எண்",
        latn = "Kaippaesi En"
    ),
    K.editMobileNumber to TaVar(
        ta = "கைப்பேசி எண்ணைத் திருத்து",
        latn = "Kaippaesi Ennaith Thiruthu"
    ),
    K.tenDigitNumber to TaVar(
        ta = "10-இலக்க எண்",
        latn = "10-Ilakka En"
    ),
    K.dateOfBirth to TaVar(
        ta = "பிறந்த நாள்",
        latn = "Pirantha Naal"
    ),
    K.editDateOfBirth to TaVar(
        ta = "பிறந்த நாளைத் திருத்து",
        latn = "Pirantha Naalaith Thiruthu"
    ),
    K.gender to TaVar(
        ta = "பாலினம்",
        latn = "Paalinam"
    ),
    K.selectGender to TaVar(
        ta = "பாலினத்தைத் தேர்ந்தெடுக்கவும்",
        latn = "Paalinathaith Thaerndhedukkavum"
    ),
    K.batchDeptSection to TaVar(
        ta = "கல்வியாண்டு, துறை & பிரிவு",
        latn = "Kalviyaandu, Thurai & Pirivu"
    ),
    K.editAcademicDetails to TaVar(
        ta = "கல்வித் தகவல்களைத் திருத்து",
        latn = "Kalvith Thagavalgalaith Thiruthu"
    ),
    K.batch to TaVar(
        ta = "கல்வியாண்டு",
        latn = "Kalviyaandu"
    ),
    K.selectBatch to TaVar(
        ta = "கல்வியாண்டைத் தேர்ந்தெடுக்கவும்",
        latn = "Kalviyaandaith Thaerndhedukkavum"
    ),
    K.department to TaVar(
        ta = "துறை",
        latn = "Thurai"
    ),
    K.selectDepartment to TaVar(
        ta = "துறையைத் தேர்ந்தெடுக்கவும்",
        latn = "Thuraiyaith Thaerndhedukkavum"
    ),
    K.section to TaVar(
        ta = "பிரிவு",
        latn = "Pirivu"
    ),
    K.selectSection to TaVar(
        ta = "பிரிவைத் தேர்ந்தெடுக்கவும்",
        latn = "Pirivaith Thaerndhedukkavum"
    ),
    K.registerNumber to TaVar(
        ta = "பதிவு எண்",
        latn = "Padhivu En"
    ),
    K.editRegisterNumber to TaVar(
        ta = "பதிவு எண்ணைத் திருத்து",
        latn = "Padhivu Ennaith Thiruthu"
    ),
    K.enterRegisterNumber to TaVar(
        ta = "பதிவு எண்ணை உள்ளிடவும்",
        latn = "Padhivu ennai ullidavum"
    ),

    // ── Security & Account Settings ──
    K.updateLoginPassword to TaVar(
        ta = "உங்கள் கடவுச்சொல்லை புதுப்பிக்கவும்",
        latn = "Ungal kadavuchollai pudhuppikkavum"
    ),
    K.createPasswordTitle to TaVar(
        ta = "கடவுச்சொல் உருவாக்கு",
        latn = "Kadavuchol Uruvaakku"
    ),
    K.setPasswordEmailLogin to TaVar(
        ta = "மின்னஞ்சல் உள்நுழைவுக்கு கடவுச்சொல் அமைக்கவும்",
        latn = "Minnanjal ullnuzhaivukku kadavuchol amaikkavum"
    ),
    K.permanentlyRemoveAccount to TaVar(
        ta = "உங்கள் கணக்கை நிரந்தரமாக நீக்கு",
        latn = "Ungal kanakkai nirandharamaaga neekku"
    ),
    K.currentPassword to TaVar(
        ta = "தற்போதைய கடவுச்சொல்",
        latn = "Tharpoadhaiya Kadavuchol"
    ),
    K.enterCurrentPassword to TaVar(
        ta = "கடவுச்சொல்லை உள்ளிடவும்",
        latn = "Kadavuchollai ullidavum"
    ),
    K.newPassword to TaVar(
        ta = "புதிய கடவுச்சொல்",
        latn = "Pudhiya Kadavuchol"
    ),
    K.enterNewPassword to TaVar(
        ta = "புதிய கடவுச்சொல்லை உள்ளிடவும்",
        latn = "Pudhiya kadavuchollai ullidavum"
    ),
    K.confirmNewPassword to TaVar(
        ta = "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
        latn = "Kadavuchollai urudhippaduthavum"
    ),
    K.confirmPassword to TaVar(
        ta = "மீண்டும் உள்ளிடவும்",
        latn = "Meendum ullidavum"
    ),
    K.verifyIdentity to TaVar(
        ta = "அடையாளத்தை உறுதிப்படுத்து",
        latn = "Adaiyaalathai Urudhippaduthu"
    ),
    K.googleReauthPrompt to TaVar(
        ta = "பாதுகாப்பிற்காக, மீண்டும் Google மூலம் உள்நுழையவும்.",
        latn = "Paadhugaappirkaaga, meendum Google moolam ullnuzhaiyavum."
    ),
    K.signInMethods to TaVar(
        ta = "உள்நுழைவு முறைகள்",
        latn = "Ullnuzhaivu Muraigal"
    ),

    // ── Notification Settings ──
    K.allowNotifications to TaVar(
        ta = "அனைத்து அறிவிப்புகள்",
        latn = "Anaithu Arivippugal"
    ),
    K.masterNotificationSwitch to TaVar(
        ta = "அனைத்து பயன்பாட்டு அறிவிப்புகளையும் அனுமதிக்கவும்",
        latn = "Anaithu payanpaattu arivippugalaiyum anumadhikkavum"
    ),
    K.dailyUpdates to TaVar(
        ta = "அன்றாடப் புதுப்பிப்புகள்",
        latn = "Andraadap Pudhuppippugal"
    ),
    K.dailyUpdatesDesc to TaVar(
        ta = "அன்றாட வகுப்பு குறிப்புகள் & கல்வி புதுப்பிப்புகள்",
        latn = "Andraada vaguppu kurippugal & kalvi pudhuppippugal"
    ),
    K.generalNoticesTitle to TaVar(
        ta = "பொது அறிவிப்புகள்",
        latn = "Podhu Arivippugal"
    ),
    K.generalNoticesDesc to TaVar(
        ta = "கல்லூரியின் பொது அறிவிப்புகள்",
        latn = "Kallooriyin podhu arivippugal"
    ),
    K.classScheduleTitle to TaVar(
        ta = "வகுப்பு அட்டவணை",
        latn = "Vaguppu Attavanai"
    ),
    K.classScheduleDesc to TaVar(
        ta = "இன்றைய நேர அட்டவணை மற்றும் பாடங்கள்",
        latn = "Indraiya naera attavanai matrum paadangal"
    ),
    K.labReminders to TaVar(
        ta = "ஆய்வக நினைவூட்டல்கள்",
        latn = "Aayvaga Ninaivoottalgal"
    ),
    K.labRemindersDesc to TaVar(
        ta = "பிரிவு சார்ந்த ஆய்வகம் மற்றும் ஆடை நினைவூட்டல்கள்",
        latn = "Pirivu chaarndha aayvagam matrum aadai ninaivoottalgal"
    ),
    K.studyReminders to TaVar(
        ta = "படிப்பு நினைவூட்டல்கள்",
        latn = "Padippu Ninaivoottalgal"
    ),
    K.studyRemindersDesc to TaVar(
        ta = "வரவிருக்கும் தேர்வுகளுக்கான நினைவூட்டல்கள்",
        latn = "Varavirukkum thaervugalukkaana ninaivoottalgal"
    ),
    K.examAlerts to TaVar(
        ta = "தேர்வு எச்சரிக்கைகள்",
        latn = "Thaervu Echarikkaigal"
    ),
    K.examAlertsDesc to TaVar(
        ta = "இன்றைய / நாளைய தேர்வு நினைவூட்டல்கள்",
        latn = "Indraiya / naalaiya thaervu ninaivoottalgal"
    ),
    K.eventReminders to TaVar(
        ta = "நிகழ்வு நினைவூட்டல்கள்",
        latn = "Nigazhvu Ninaivoottalgal"
    ),
    K.eventRemindersDesc to TaVar(
        ta = "விடுமுறைகள் மற்றும் சிறப்பு நிகழ்வுகள்",
        latn = "Vidumuraigal matrum chirappu nigazhvugal"
    ),
    K.instantAlerts to TaVar(
        ta = "உடனடி அறிவிப்புகள்",
        latn = "Udanadi Arivippugal"
    ),
    K.instantAlertsDesc to TaVar(
        ta = "முக்கியமான உடனடி அறிவிப்புகள்",
        latn = "Mukkiyamaana udanadi arivippugal"
    ),
    K.useCustomTimes to TaVar(
        ta = "தனிப்பயன் நேரங்களைப் பயன்படுத்து",
        latn = "Thanipayan Naerangalaip Payanpaduthu"
    ),
    K.usingCustomTimes to TaVar(
        ta = "தனிப்பயன் நேரங்கள் பயன்படுத்தப்படுகின்றன",
        latn = "Thanipayan naerangal payanpaduthappaduginrana"
    ),
    K.usingDefaultTimes to TaVar(
        ta = "கல்லூரி நேரங்கள் பயன்படுத்தப்படுகின்றன",
        latn = "Kalloori naerangal payanpaduthappaduginrana"
    ),

    // ── User Directory Navigation ──
    K.selectBatchTitle to TaVar(
        ta = "பிரிவு தேர்வு",
        latn = "Pirivu Thaervu"
    ),
    K.viewDeptsInBatch to TaVar(
        ta = "பிரிவு %s துறைகள்",
        latn = "Pirivu %s thuraigal"
    ),
    K.selectDeptBatch to TaVar(
        ta = "துறை தேர்வு (பிரிவு %s)",
        latn = "Thurai thaervu (Pirivu %s)"
    ),
    K.viewSectionsInDept to TaVar(
        ta = "%s பிரிவுகளைக் காண்க",
        latn = "%s pirivugalaik kaanga"
    ),
    K.selectSectionDept to TaVar(
        ta = "பிரிவு தேர்வு (%s)",
        latn = "Pirivu thaervu (%s)"
    ),
    K.viewStudentsInSection to TaVar(
        ta = "பிரிவு %s மாணவர்களைக் காண்க",
        latn = "Pirivu %s maanavargalaik kaanga"
    ),

    // ── Notes & Notifications Actions ──

    // ── Calendar Views ──
    K.viewMonth to TaVar(
        ta = "திங்கள்",
        latn = "Thingal"
    ),
    K.viewSchedule to TaVar(
        ta = "அட்டவணை",
        latn = "Attavanai"
    ),
    K.viewYear to TaVar(
        ta = "ஆண்டு",
        latn = "Aandu"
    ),

    // ── About & Management & Developer ──
    K.globalExcellence to TaVar(
        ta = "உலகளாவிய சிறப்பு",
        latn = "Ulagalaaviya Chirappu"
    ),
    K.globalExcellenceDesc to TaVar(
        ta = "பொறியியல் மற்றும் தொழில்நுட்ப கல்வியில் இந்தியாவின் முன்னணி நிறுவனமாக திகழ்தல்.",
        latn = "Engineering kalviyil Indhiyaavin munnoadi niruvanamaaga thigazhdhal."
    ),
    K.transformingLearners to TaVar(
        ta = "மாணவர் உருமாற்றம்",
        latn = "Maanavar Urumaatram"
    ),
    K.transformingLearnersDesc to TaVar(
        ta = "மாணவர்களை சமூக பொறுப்புள்ள உலக சாதனையாளர்களாக உருவாக்குதல்.",
        latn = "Maanavargalai samooga poruppulla ulaga saadhanaiyaalargalaaga uruvaakkudhal."
    ),
    K.location to TaVar(
        ta = "இருப்பிடம்",
        latn = "Iruppidam"
    ),
    K.managementTeamDesc to TaVar(
        ta = "RMK கல்வி குழுமத்தை தொலைநோக்குப் பார்வையுடன் வழிநடத்தும் ஆளுமைகள்.",
        latn = "RMK kalvi kuzhumathai tholainoakkup paarvaiyudan vazhinadathum aalumaiyal."
    ),
    K.founders to TaVar(
        ta = "நிறுவனர்கள்",
        latn = "Niruvanargal"
    ),
    K.boardOfDirectors to TaVar(
        ta = "நிர்வாகக் குழு",
        latn = "Nirvaagak Kuzhu"
    ),

    // ── Profile Screen Actions ──
    K.yourName to TaVar(
        ta = "உங்கள் பெயர்",
        latn = "Ungal Peyar"
    ),
    K.photoSyncedSuccess to TaVar(
        ta = "படம் வெற்றிகரமாக ஒத்திசைக்கப்பட்டது",
        latn = "Padam vetrigaramaaga othisaikkappattadhu"
    ),
    K.syncFailed to TaVar(
        ta = "ஒத்திசைவு தோல்வி: ",
        latn = "Othisaivu thoalvi: "
    ),
    K.noGoogleAccountLinked to TaVar(
        ta = "Google கணக்கு இணைக்கப்படவில்லை",
        latn = "Google kanakku inaikkappadavillai"
    ),
    K.noPhotoInGoogleAccount to TaVar(
        ta = "Google கணக்கில் புகைப்படம் இல்லை",
        latn = "Google kanakkil pugaippadam illai"
    ),
    K.syncGooglePhoto to TaVar(
        ta = "Google படத்தை ஒத்திசை",
        latn = "Google padathai othisai"
    ),

    // ── Security & Authentication Dialogs ──
    K.forgotPassword to TaVar(
        ta = "கடவுச்சொல் மறந்துவிட்டதா?",
        latn = "Kadavuchol marandhuvittadhaa?"
    ),
    K.confirmIdentityBeforeNewPassword to TaVar(
        ta = "தொடர்வதற்கு முன் உங்கள் அடையாளத்தை உறுதிப்படுத்தவும்.",
        latn = "Thodarvadharku mun ungal adaiyaalathai urudhippaduthavum."
    ),
    K.incorrectPassword to TaVar(
        ta = "தவறான கடவுச்சொல்",
        latn = "Thavaraana kadavuchol"
    ),
    K.verifyAndContinue to TaVar(
        ta = "சரிபார்த்து தொடரவும்",
        latn = "Saripaarthu thodaravum"
    ),
    K.resetEmailSent to TaVar(
        ta = "மீட்டமைப்பு மின்னஞ்சல் %s முகவரிக்கு அனுப்பப்பட்டது",
        latn = "Meettamaippu minnanjal %s mugavarirku anuppappattadhu"
    ),
    K.createNewPassword to TaVar(
        ta = "புதிய கடவுச்சொல்லை உருவாக்கவும்",
        latn = "Pudhiya kadavuchollai uruvaakkavum"
    ),
    K.updatePassword to TaVar(
        ta = "கடவுச்சொல்லைப் புதுப்பிக்கவும்",
        latn = "Kadavuchollai pudhuppikkavum"
    ),
    K.atLeast6Chars to TaVar(
        ta = "குறைந்தது 6 எழுத்துக்கள்",
        latn = "Kuraindhadhu 6 ezhuthukkal"
    ),
    K.passwordsMatch to TaVar(
        ta = "கடவுச்சொற்கள் பொருந்துகின்றன",
        latn = "Kadavuchorkal porundhugindrana"
    ),
    K.passwordUpdated to TaVar(
        ta = "கடவுச்சொல் புதுப்பிக்கப்பட்டது!",
        latn = "Kadavuchol pudhuppikkappattadhu!"
    ),
    K.returningToSecuritySettings to TaVar(
        ta = "பாதுகாப்பு அமைப்புகளுக்குத் திரும்புகிறது...",
        latn = "Paadhugaappu amaippugalukku thirumbugiradhu..."
    ),
    K.signedInWithGoogleCreatePassword to TaVar(
        ta = "Google மூலம் உள்நுழைந்துள்ளீர்கள். மின்னஞ்சல் மூலமும் உள்நுழைய கடவுச்சொல் ஒன்றை உருவாக்கவும்.",
        latn = "Google moolam ullnuzhaindhulleergal. Minnanjal moolamum ullnuzhaiya kadavuchol ondrai uruvaakkavum."
    ),
    K.passwordCreated to TaVar(
        ta = "கடவுச்சொல் உருவாக்கப்பட்டது!",
        latn = "Kadavuchol uruvaakkappattadhu!"
    ),
    K.canNowSignInWithEmail to TaVar(
        ta = "நீங்கள் இப்போது மின்னஞ்சல் மூலமும் உள்நுழையலாம்.",
        latn = "Neengal ippoadhu minnanjal moolamum ullnuzhaiyalaam."
    ),
    K.unlink to TaVar(
        ta = "துண்டி",
        latn = "Thundi"
    ),
    K.unlinkGoogleAccount to TaVar(
        ta = "Google கணக்கை துண்டிக்கவா?",
        latn = "Google kanakkai thundikkavaa?"
    ),
    K.unlinkGoogleDesc to TaVar(
        ta = "துண்டித்த பிறகு உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல்லைப் பயன்படுத்தி உள்நுழைய வேண்டும்.",
        latn = "Thunditha piragu ungal minnanjal matrum kadavuchollai payanpaduthi ullnuzhaiya vaendum."
    ),
    K.mustCreatePasswordFirst to TaVar(
        ta = "Google கணக்கை துண்டிக்கும் முன் கடவுச்சொல் ஒன்றை உருவாக்க வேண்டும்.",
        latn = "Google kanakkai thundikkum mun kadavuchol ondrai uruvaakka vaendum."
    ),
    K.password to TaVar(
        ta = "கடவுச்சொல்",
        latn = "Kadavuchol"
    ),
    K.passwordSet to TaVar(
        ta = "கடவுச்சொல் அமைக்கப்பட்டுள்ளது",
        latn = "Kadavuchol amaikkappattadhu"
    ),
    K.noPasswordSet to TaVar(
        ta = "கடவுச்சொல் அமைக்கப்படவில்லை",
        latn = "Kadavuchol amaikkappadavillai"
    ),
    K.thisActionIsPermanent to TaVar(
        ta = "இந்த நடவடிக்கை நிரந்தரமானது",
        latn = "Indha nadavadikkai nirandharamaanadhu"
    ),
    K.deleteAccountWarning to TaVar(
        ta = "உங்கள் கணக்கை நீக்குவது உங்கள் அட்டவணை, குறிப்புகள் மற்றும் கல்வி விருப்பங்களை நீக்கும். இதை மீட்டெடுக்க முடியாது.",
        latn = "Ungal kanakkai neekkuvadhu ungal attavanai, kurippugal matrum kalvi viruppangalai neekkum. Idhai meettedukka mudiyaadhu."
    ),
    K.iUnderstandContinue to TaVar(
        ta = "புரிந்து கொண்டேன், தொடரவும்",
        latn = "Purindhu kondaen, thodaravum"
    ),
    K.confirmDeletionDesc to TaVar(
        ta = "உங்கள் கணக்கை நிரந்தரமாக நீக்க கீழே உள்ள பெட்டியில் DELETE என உள்ளிடவும்.",
        latn = "Ungal kanakkai nirandharamaaga neekka keezhe ulla pettiyil DELETE ena ullidavum."
    ),
    K.typeDeleteToConfirm to TaVar(
        ta = "உறுதிப்படுத்த DELETE என உள்ளிடவும்",
        latn = "Urudhippadutha DELETE ena ullidavum"
    ),
    K.returningToAuth to TaVar(
        ta = "உள்நுழைவுத் திரைக்குத் திரும்புகிறது...",
        latn = "Ullnuzhaivuth thiraikku thirumbugiradhu..."
    ),
    K.deleteAccountPermanently to TaVar(
        ta = "கணக்கை நிரந்தரமாக நீக்கு",
        latn = "Kanakkai nirandharamaaga neekku"
    ),
    K.verificationFailed to TaVar("சரிபார்ப்பு தோல்வியடைந்தது", "Saripaarppu tholviyadainthathu"),
    K.unlinkGoogleDescHasPassword to TaVar("உங்கள் கூகிள் கணக்கைத் துண்டிக்க விரும்புகிறீர்களா? உங்கள் மின்னஞ்சல் மற்றும் கடவுச்சொல் மூலம் தொடர்ந்து உள்நுழையலாம்.", "Ungal Google kanakkai thundikka virumbugireergala? Ungal minnanchal matrum kadavuchol moolam thodarnthu ulnuzhaiyalam."),
    K.unlinkGoogleDescNoPassword to TaVar("கூகிளைத் துண்டிக்கும் முன் உங்கள் மின்னஞ்சலுக்கு கடவுச்சொல்லை உருவாக்க வேண்டும்.", "Google-ai thundikkum mun ungal minnanchalukku kadavuchollai uruvaakka vendum."),
    K.refresh to TaVar("புதுப்பி", "Pudhuppi"),
    K.isRequired to TaVar("தேவைப்படுகிறது", "Thevaippadugiradhu"),
    K.documents to TaVar("ஆவணங்கள்", "Aavanangal"),
    K.emailPassword to TaVar("மின்னஞ்சல் & கடவுச்சொல்", "Minnanjal & Kadavuchol"),
    K.connected to TaVar("இணைக்கப்பட்டது", "Inaikkappattadhu"),
    K.notConnected to TaVar("இணைக்கப்படவில்லை", "Inaikkappadavillai"),
    K.create to TaVar("உருவாக்கு", "Uruvaakku"),
    K.linkedAccountsInfoText to TaVar("Google கணக்கை இணைப்பது விரைவான உள்நுழைவை அனுமதிக்கும்.", "Google kanakkai inaippadhu viraivaana ullnuzhaivai anumadhikkum."),
    K.linkGoogle to TaVar("Google கணக்கை இணைக்கவும்", "Google kanakkai inaikkavum"),
    K.unlinkGoogle to TaVar("Google கணக்கை துண்டிக்கவும்", "Google kanakkai thundikkavum"),
    K.unlinkConfirm to TaVar("Google கணக்கை துண்டிக்கவா?", "Google kanakkai thundikkavaa?"),
    K.unlinkMessage to TaVar("நிச்சயமாக Google கணக்கை துண்டிக்க விரும்புகிறீர்களா?", "Nichayamaaga Google kanakkai thundikka virumbugireergalaa?"),
    K.createPasswordMsg to TaVar("Google கணக்கை துண்டிக்கும் முன், உள்நுழைய ஒரு கடவுச்சொல்லை உருவாக்க வேண்டும்.", "Google kanakkai thundikkum mun, ullnuzhaiya oru kadavuchollai uruvaakka vaendum."),
    K.createPasswordFirst to TaVar("முதலில் ஒரு கடவுச்சொல்லை உருவாக்கவும்", "Mudhalil oru kadavuchollai uruvaakkavum"),
    K.noAccountFound to TaVar("இந்த மின்னஞ்சலில் கணக்கு எதுவும் இல்லை", "Indha minnanjalil kanakku edhuvum illai"),
    K.invalidEmailFormat to TaVar("தவறான மின்னஞ்சல் வடிவம்", "Thavarana minnanjal vadivam"),
    K.authFailed to TaVar("அங்கீகரிப்பு தோல்வியடைந்தது", "Angigaripu tholviyadainthathu"),
    K.firstNameTooShort to TaVar("முதல் பெயர் குறைந்தது 2 எழுத்துக்கள் இருக்க வேண்டும்", "Mudhal peyar kuraindhadhu 2 ezhuthukkal irukka vendum"),
    K.invalidRegisterNumber to TaVar("தவறான பதிவு எண்", "Thavarana padhivu en"),
    K.passwordTooShort to TaVar("கடவுச்சொல் குறைந்தது 6 எழுத்துக்கள் இருக்க வேண்டும்", "Kadavuchol kuraindhadhu 6 ezhuthukkal irukka vendum"),
    K.signupFailedNoUser to TaVar("பதிவு தோல்வியடைந்தது - பயனர் உருவாக்கப்படவில்லை", "Padhivu tholviyadainthathu - payanar uruvaakkappadavillai"),
    K.signupFailed to TaVar("பதிவு தோல்வியடைந்தது", "Padhivu tholviyadainthathu"),
    K.failedToUnlink to TaVar("துண்டிப்பது தோல்வியடைந்தது", "Thundippadhu tholviyadainthathu"),
    K.showPassword to TaVar("கடவுச்சொல்லைக் காட்டு", "Kadavuchollai kaattu"),
    K.hidePassword to TaVar("கடவுச்சொல்லை மறை", "Kadavuchollai marai"),
    K.home to TaVar("முகப்பு", "Mugappu"),
    K.calendar to TaVar("நாள்காட்டி", "Naalkatti"),
    K.notes to TaVar("குறிப்புகள்", "Kurippugal"),
    K.notAvailable to TaVar("கிடைக்கவில்லை", "Kidaikkavillai"),
    K.readMore to TaVar("மேலும் படிக்க", "Melum padikka"),
    K.today to TaVar("இன்று", "Indru"),
    K.done to TaVar("சரி", "Sari"),
)

package com.elvan.neram.ui.mozhiyaakkam

/**
 * Data class representing Telugu variations:
 * - te: తెలుగు (Telugu script)
 * - latn: Telugu in Latin script (Telugu Latin)
 */
data class TeVar(
    val te: String,
    val latn: String
)

/**
 * Telugu (te) Language Dictionary containing both Telugu script and Latin transliteration.
 */
val te: Map<String, TeVar> = mapOf(
    K.navHome to TeVar(
        te = "హోమ్",
        latn = "Home"
    ),
    K.navNeram to TeVar(
        te = "నేరం",
        latn = "Neram"
    ),
    K.navSchedule to TeVar(
        te = "షెడ్యూల్",
        latn = "Schedule"
    ),
    K.navCalendar to TeVar(
        te = "క్యాలెండర్",
        latn = "Calendar"
    ),
    K.navNotes to TeVar(
        te = "నోట్స్",
        latn = "Notes"
    ),
    K.loading to TeVar(
        te = "లోడ్ అవుతోంది...",
        latn = "Load avuthoandhi..."
    ),
    K.error to TeVar(
        te = "లోపం",
        latn = "Loapam"
    ),
    K.retry to TeVar(
        te = "మళ్లీ ప్రయత్నించండి",
        latn = "Mallee prayathninchandi"
    ),
    K.save to TeVar(
        te = "సేవ్ చేయండి",
        latn = "Save chaeyandi"
    ),
    K.delete to TeVar(
        te = "డిలీట్ చేయండి",
        latn = "Delete chaeyandi"
    ),
    K.confirm to TeVar(
        te = "నిర్ధారించండి",
        latn = "Nirdhaarinchandi"
    ),
    K.back to TeVar(
        te = "వెనుకకు",
        latn = "Venukakku"
    ),
    K.cancel to TeVar(
        te = "రద్దు చేయండి",
        latn = "Radhdhu chaeyandi"
    ),
    K.ok to TeVar(
        te = "సరే",
        latn = "Sarae"
    ),
    K.edit to TeVar(
        te = "ఎడిట్ చేయండి",
        latn = "Edit chaeyandi"
    ),
    K.offline to TeVar(
        te = "ఆఫ్‌లైన్",
        latn = "Offline"
    ),
    K.offlineMessage to TeVar(
        te = "ఇంటర్నెట్ కనెక్ట్ అవ్వలేదు. డేటాను సింక్ చేయడానికి ఇంటర్నెట్ కనెక్ట్ చేయండి.",
        latn = "Internet connect avvalaedhu. Daetaanu sync chaeyadaaniki internet connect chaeyandi."
    ),
    K.fromElvanNavil to TeVar(
        te = "ఎల్వన్ నవిల్ సమర్పణ",
        latn = "Elvan Navil Samarpana"
    ),
    K.elvanNavil to TeVar(
        te = "ఎల్వన్ నవిల్",
        latn = "Elvan Navil"
    ),
    K.elvanNavilDesc to TeVar(
        te = "ఎల్వన్ పార్థసారథి సృష్టి",
        latn = "Elvan Parthasarathi Srushti"
    ),
    K.elvanParthasarathy to TeVar(
        te = "ఎల్వన్ పార్థసారథి",
        latn = "Elvan Parthasarathi"
    ),
    K.greeting to TeVar(
        te = "వణక్కం!",
        latn = "Vanakkam!"
    ),
    K.welcomeToNeram to TeVar(
        te = "నేరంకి స్వాగతం!",
        latn = "Neram ki svaagatham!"
    ),
    K.gladYouAreHere to TeVar(
        te = "మీరు ఇక్కడ ఉన్నందుకు సంతోషం 😊",
        latn = "Meeru ikkada unnandhuku santhoasham 😊"
    ),
    K.vanakkam to TeVar(
        te = "వణక్కం!",
        latn = "Vanakkam!"
    ),
    K.selectDate to TeVar(
        te = "తేదీని ఎంచుకోండి",
        latn = "Thedeeni enchukoandi"
    ),
    K.academicCalendar to TeVar(
        te = "విద్యా క్యాలెండర్",
        latn = "Vidhyaa Calendar"
    ),
    K.schedule to TeVar(
        te = "షెడ్యూల్",
        latn = "Schedule"
    ),
    K.workingDay to TeVar(
        te = "వర్కింగ్ డే",
        latn = "Working Day"
    ),
    K.regularWorkingDay to TeVar(
        te = "రెగ్యులర్ వర్కింగ్ డే",
        latn = "Regular Working Day"
    ),
    K.noEventsScheduled to TeVar(
        te = "ఏ ఈవెంట్లు షెడ్యూల్ కాలేదు",
        latn = "Ae eventlu schedule kaalaedhu"
    ),
    K.followingOrder to TeVar(
        te = "%s ఆర్డర్ పాటిస్తున్నారు",
        latn = "%s order paatisthunnaaru"
    ),
    K.classesSuspended to TeVar(
        te = "క్లాసులు రద్దు చేయబడ్డాయి",
        latn = "Classulu radhdhu chaeyabaddaayi"
    ),
    K.system to TeVar(
        te = "సిస్టమ్",
        latn = "System"
    ),
    K.noUpdates to TeVar(
        te = "ఈరోజు ఎలాంటి ప్రత్యేక అప్‌డేట్లు లేవు.",
        latn = "Eeroaju elaanti prathyeka updatelu laevu."
    ),
    K.todaysEvent to TeVar(
        te = "నేటి ఈవెంట్",
        latn = "Naeti Event"
    ),
    K.specialEvent to TeVar(
        te = "ప్రత్యేక ఈవెంట్",
        latn = "Prathyeka Event"
    ),
    K.fullDay to TeVar(
        te = "రోజంతా",
        latn = "Roajanthaa"
    ),
    K.noClasses to TeVar(
        te = "క్లాసులు లేవు",
        latn = "Classulu laevu"
    ),
    K.event to TeVar(
        te = "ఈవెంట్",
        latn = "Event"
    ),
    K.todaysExam to TeVar(
        te = "నేటి ఎగ్జామ్",
        latn = "Naeti Exam"
    ),
    K.todaysPracticalExam to TeVar(
        te = "నేటి ప్రాక్టికల్ ఎగ్జామ్",
        latn = "Naeti Practical Exam"
    ),
    K.noClassesScheduled to TeVar(
        te = "క్లాసులు ఏవీ షెడ్యూల్ కాలేదు.",
        latn = "Classulu aevee schedule kaalaedhu."
    ),
    K.liveUpdates to TeVar(
        te = "లైవ్ అప్‌డేట్లు (%s)",
        latn = "Live Updatelu (%s)"
    ),
    K.generalNotice to TeVar(
        te = "జనరల్ నోటీస్",
        latn = "General Notice"
    ),
    K.noUpdatesForDate to TeVar(
        te = "ఈ తేదీకి ఎలాంటి అప్‌డేట్లు లేవు.",
        latn = "Ee thedeeki elaanti updatelu laevu."
    ),
    K.noGeneralNotices to TeVar(
        te = "ఎలాంటి సాధారణ నోటీసులు లేవు.",
        latn = "Elaanti saadhaarana noteesulu laevu."
    ),
    K.lab to TeVar(
        te = "ల్యాబ్",
        latn = "Lab"
    ),
    K.specialSession to TeVar(
        te = "ప్రత్యేక సెషన్",
        latn = "Prathyeka Session"
    ),
    K.fullDayEvent to TeVar(
        te = "రోజంతా ఈవెంట్",
        latn = "Roajanthaa Event"
    ),
    K.postedBy to TeVar(
        te = "పోస్ట్ చేసినవారు ",
        latn = "Post chaesinavaaru "
    ),
    K.typeHere to TeVar(
        te = "ఇక్కడ టైప్ చేయండి...",
        latn = "Ikkada type chaeyandi..."
    ),
    K.studentsCount to TeVar(
        te = "%s విద్యార్థులు",
        latn = "%s Vidhyaarthulu"
    ),
    K.scheduledForToday to TeVar(
        te = "ఈరోజుకు షెడ్యూల్ చేయబడింది",
        latn = "Eeroajuku schedule chaeyabadindhi"
    ),
    K.noEventsDeclared to TeVar(
        te = "ఈవెంట్లు ఏవీ ప్రకటించలేదు",
        latn = "Eventlu aevee prakatinchalaedhu"
    ),
    K.systemReminder to TeVar(
        te = "సిస్టమ్ రిమైండర్",
        latn = "System Reminder"
    ),
    K.bringLabcoatsEssentials to TeVar(
        te = "📚 ల్యాబ్‌కోట్లు, ల్యాప్‌టాప్‌లు & ల్యాబ్ సామాగ్రిని తీసుకురండి",
        latn = "📚 Labcoatlu, laptoplu & lab saamaagrini theesukurandi"
    ),
    K.studyWellExamWish to TeVar(
        te = "📖 ఎగ్జామ్‌కి బాగా ప్రిపేర్ అవ్వండి! మంచి మార్కులు సాధించండి! ఆల్ ది బెస్ట్! 🎯",
        latn = "📖 Exam ki baagaa prepare avvandi! Manchi maarkulu saadhinchandi! All the best! 🎯"
    ),
    K.noAcademicCalendarScheduled to TeVar(
        te = "అకడమిక్ క్యాలెండర్ షెడ్యూల్ కాలేదు",
        latn = "Academic Calendar schedule kaalaedhu"
    ),
    K.open to TeVar(
        te = "ఓపెన్ చేయండి",
        latn = "Open chaeyandi"
    ),
    K.dismiss to TeVar(
        te = "తీసివేయండి",
        latn = "Theesivaeyandi"
    ),
    K.classesSuspendedDueTo to TeVar(
        te = "%s కారణంగా క్లాసులు రద్దు చేయబడ్డాయి.",
        latn = "%s kaaranangaa classulu radhdhu chaeyabaddaayi."
    ),
    K.userNotLoggedIn to TeVar(
        te = "యూజర్ లాగిన్ అవ్వలేదు.",
        latn = "User login avvalaedhu."
    ),
    K.failedToSaveUpdate to TeVar(
        te = "అప్‌డేట్ సేవ్ చేయడం విఫలమైంది",
        latn = "Update save chaeyadam viphalamaindhi"
    ),
    K.failedToSaveNotice to TeVar(
        te = "నోటీస్ సేవ్ చేయడం విఫలమైంది",
        latn = "Notice save chaeyadam viphalamaindhi"
    ),
    K.failedToUpdatePlacement to TeVar(
        te = "ప్లేస్‌మెంట్ అప్‌డేట్ చేయడం విఫలమైంది",
        latn = "Placement update chaeyadam viphalamaindhi"
    ),
    K.dept to TeVar(
        te = "డిపార్ట్‌మెంట్",
        latn = "Department"
    ),
    K.sec to TeVar(
        te = "సెక్షన్",
        latn = "Section"
    ),
    K.holiday to TeVar(
        te = "సెలవు",
        latn = "Selavu"
    ),
    K.profile to TeVar(
        te = "ప్రొఫైల్",
        latn = "Profile"
    ),
    K.dayReservedFor to TeVar(
        te = "ఈ రోజు %s కోసం కేటాయించబడింది.",
        latn = "Ee roaju %s koasam kaetaayinchabadindhi."
    ),
    K.regularClassesSuspendedDuring to TeVar(
        te = "%s సమయంలో రెగ్యులర్ క్లాసులు రద్దు చేయబడతాయి.",
        latn = "%s samayamlo regular classulu radhdhu chaeyabadathaayi."
    ),
    K.allDay to TeVar(
        te = "రోజంతా",
        latn = "Roajanthaa"
    ),
    K.explore to TeVar(
        te = "ఎక్స్‌ప్లోర్ చేయండి",
        latn = "Explore chaeyandi"
    ),
    K.monthView to TeVar(
        te = "నెల వీక్షణ",
        latn = "Nela Veekshana"
    ),
    K.listView to TeVar(
        te = "జాబితా వీక్షణ",
        latn = "Jaabithaa Veekshana"
    ),
    K.menu to TeVar(
        te = "మెనూ",
        latn = "Menu"
    ),
    K.cleanupFailed to TeVar(
        te = "క్లీనప్ విఫలమైంది",
        latn = "Cleanup viphalamaindhi"
    ),
    K.pushNotifications to TeVar(
        te = "నోటిఫికేషన్లు",
        latn = "Notifications"
    ),
    K.notificationTimings to TeVar(
        te = "అలర్ట్‌లు, సమయాలు & ప్రాధాన్యతలు",
        latn = "Alertlu, samayaalu & praadhaanyathalu"
    ),
    K.notificationNote to TeVar(
        te = "గమనిక: నోటిఫికేషన్లు మీ ఫోన్ బ్యాటరీ మరియు నెట్‌వర్క్ లభ్యతపై ఆధారపడి ఉంటాయి.",
        latn = "Gamanika: Notificationlu mee phone battery mariyu network labhyathapai aadhaarapadi untaayi."
    ),
    K.classCounselors to TeVar(
        te = "క్లాస్ కౌన్సెలర్లు",
        latn = "Class Counselors"
    ),
    K.keyCoordinators to TeVar(
        te = "ముఖ్య కోఆర్డినేటర్లు",
        latn = "Mukhya Coordinatorlu"
    ),
    K.noInfoAvailable to TeVar(
        te = "సమాచారం అందుబాటులో లేదు",
        latn = "Samaachaaram andhubbaatulo laedhu"
    ),
    K.noSubjectsScheduled to TeVar(
        te = "ఈ రోజు ఏ సబ్జెక్టులూ షెడ్యూల్ కాలేదు",
        latn = "Ee roaju ae subjectloo schedule kaalaedhu"
    ),
    K.noBatchesScheduled to TeVar(
        te = "బ్యాచ్‌లు ఏవీ షెడ్యూల్ కాలేదు",
        latn = "Batchlu aevee schedule kaalaedhu"
    ),
    K.noCoursesFound to TeVar(
        te = "కోర్సులు ఏవీ కనుగొనబడలేదు",
        latn = "Courselu aevee kanugonabadalaedhu"
    ),
    K.students to TeVar(
        te = "%d విద్యార్థులు",
        latn = "%d Vidhyaarthulu"
    ),
    K.periods to TeVar(
        te = "పీరియడ్లు",
        latn = "Periodlu"
    ),
    K.classesTab to TeVar(
        te = "క్లాసులు",
        latn = "Classulu"
    ),
    K.examsTab to TeVar(
        te = "ఎగ్జామ్స్",
        latn = "Exams"
    ),
    K.weeklySchedule to TeVar(
        te = "వారపు షెడ్యూల్",
        latn = "Vaarapu Schedule"
    ),
    K.collapse to TeVar(
        te = "కుదించు",
        latn = "Kudhinchu"
    ),
    K.expand to TeVar(
        te = "విస్తరించు",
        latn = "Vistharinchu"
    ),
    K.noClassesOn to TeVar(
        te = "%s న క్లాసులు లేవు",
        latn = "%s na classulu laevu"
    ),
    K.ongoingExams to TeVar(
        te = "జరుగుతున్న ఎగ్జామ్స్",
        latn = "Jaruguthunna Exams"
    ),
    K.noOngoingExams to TeVar(
        te = "ప్రస్తుతం ఎలాంటి ఎగ్జామ్స్ జరగడం లేదు",
        latn = "Prasthutham elaanti exams jaragadam laedhu"
    ),
    K.noExamTimetables to TeVar(
        te = "ఎగ్జామ్ టైమ్‌టేబుల్ ఇంకా విడుదల కాలేదు",
        latn = "Exam timetable inkaa vidudhala kaalaedhu"
    ),
    K.upcomingExams to TeVar(
        te = "రాబోయే ఎగ్జామ్స్",
        latn = "Raaboayae Exams"
    ),
    K.finishedExams to TeVar(
        te = "పూర్తయిన ఎగ్జామ్స్",
        latn = "Poorthayina Exams"
    ),
    K.academicCourses to TeVar(
        te = "అకడమిక్ కోర్సులు",
        latn = "Academic Courselu"
    ),
    K.cardUpdate to TeVar(
        te = "అప్‌డేట్",
        latn = "Update"
    ),
    K.cardAlert to TeVar(
        te = "అలర్ట్",
        latn = "Alert"
    ),
    K.cardNews to TeVar(
        te = "న్యూస్",
        latn = "News"
    ),
    K.cardTip to TeVar(
        te = "చిట్కా",
        latn = "Chitkaa"
    ),
    K.cardNotice to TeVar(
        te = "నోటీస్",
        latn = "Notice"
    ),
    K.cardFeature to TeVar(
        te = "ఫీచర్",
        latn = "Feature"
    ),
    K.officialDocuments to TeVar(
        te = "అధికారిక పత్రాలు",
        latn = "Adhikaarika Pathraalu"
    ),
    K.downloadPdfForOffline to TeVar(
        te = "ఆఫ్‌లైన్ కోసం PDF డౌన్‌లోడ్ చేసుకోండి",
        latn = "Offline koasam PDF download chaesukoandi"
    ),
    K.linkCopiedToClipboard to TeVar(
        te = "లింక్ కాపీ చేయబడింది",
        latn = "Link copy chaeyabadindhi"
    ),
    K.noAcademicEvents to TeVar(
        te = "విద్యా ఈవెంట్లు ఏవీ లేవు",
        latn = "Vidhyaa eventlu aevee laevu"
    ),
    K.noAcademicEventsFor to TeVar(
        te = "%s కి విద్యా ఈవెంట్లు ఏవీ లేవు",
        latn = "%s ki vidhyaa eventlu aevee laevu"
    ),
    K.noUpcomingEvents to TeVar(
        te = "రాబోయే ఈవెంట్లు ఏవీ లేవు",
        latn = "Raaboayae eventlu aevee laevu"
    ),
    K.rmdCollegeWebsiteDesc to TeVar(
        te = "అధికారిక ఆర్.ఎం.డి కాలేజీ వెబ్‌సైట్.",
        latn = "Adhikaarika RMD college website."
    ),
    K.rmkNextgenStudentDesc to TeVar(
        te = "విద్యార్థుల లాగిన్ మరియు విద్యా పురోగతి కోసం Nextgen ప్లాట్‌ఫారమ్.",
        latn = "Vidhyaarthula login mariyu vidhyaa puroagathi koasam Nextgen platform."
    ),
    K.elvanNavilSiteDesc to TeVar(
        te = "క్యాంపస్ వార్తలు, కథనాలు మరియు ప్రకటనల వేదిక — ఎల్వన్ నవిల్.",
        latn = "Campus vaarthalu, kathanaalu mariyu prakatanala vaedhika — Elvan Navil."
    ),
    K.iamNeoDesc to TeVar(
        te = "లెర్నింగ్, అసెస్‌మెంట్ మరియు రిక్రూట్‌మెంట్ సొల్యూషన్స్.",
        latn = "Learning, assessment mariyu recruitment solutions."
    ),
    K.skillRackDesc to TeVar(
        te = "రోజువారీ కోడింగ్ సవాళ్లు మరియు సమస్యల పరిష్కార వేదిక.",
        latn = "Roajuvaaree coding savaallu mariyu samasyala parishkaara vaedhika."
    ),
    K.codeTantraDesc to TeVar(
        te = "క్లాసులు, అసైన్‌మెంట్లు మరియు పరీక్షల వేదిక.",
        latn = "Classulu, assignmentlu mariyu pareekshala vaedhika."
    ),
    K.google to TeVar(
        te = "Google",
        latn = "Google"
    ),
    K.googleProfile to TeVar(
        te = "Google ప్రొఫైల్",
        latn = "Google Profile"
    ),
    K.googleAccountLinked to TeVar(
        te = "Google ఖాతా లింక్ చేయబడింది!",
        latn = "Google khaathaa link chaeyabadindhi!"
    ),
    K.male to TeVar(
        te = "పురుషుడు",
        latn = "Purushudu"
    ),
    K.female to TeVar(
        te = "స్త్రీ",
        latn = "Sthree"
    ),
    K.genderOther to TeVar(
        te = "ఇతర",
        latn = "Ithara"
    ),
    K.morningWake to TeVar(
        te = "ఉదయం మేల్కొలుపు",
        latn = "Udhayam Maelkolupu"
    ),
    K.preCollege to TeVar(
        te = "కాలేజీకి ముందు",
        latn = "College ki Mundhu"
    ),
    K.collegeEntry to TeVar(
        te = "కాలేజీ ఎంట్రీ",
        latn = "College Entry"
    ),
    K.selectTime to TeVar(
        te = "సమయాన్ని ఎంచుకోండి",
        latn = "Samayaanni Enchukoandi"
    ),
    K.elvanNavilBranding to TeVar(
        te = "ఎల్వన్ నవిల్",
        latn = "Elvan Navil"
    ),
    K.allRightsReserved to TeVar(
        te = "© సర్వహక్కులు రక్షించబడ్డాయి",
        latn = "© Sarvahakkulu Rakshinchabaddaayi"
    ),
    K.linkFailed to TeVar(
        te = "లింక్ విఫలమైంది",
        latn = "Link viphalamaindhi"
    ),
    K.noIdTokenReceived to TeVar(
        te = "ID టోకెన్ అందలేదు",
        latn = "ID token andhalaedhu"
    ),
    K.googleSignInFailed to TeVar(
        te = "Google సైన్-ఇన్ విఫలమైంది",
        latn = "Google Sign-In viphalamaindhi"
    ),
    K.couldNotLaunchGoogleSignIn to TeVar(
        te = "Google సైన్-ఇన్ ప్రారంభించలేకపోయాము",
        latn = "Google Sign-In praarambhinchalaekapoayaamu"
    ),
    K.welcomeBack to TeVar(
        te = "తిరిగి స్వాగతం",
        latn = "Thirigi Svaagatham"
    ),
    K.signInToContinue to TeVar(
        te = "కొనసాగడానికి సైన్ ఇన్ చేయండి",
        latn = "Konasaagadaaniki sign in chaeyandi"
    ),
    K.emailAddress to TeVar(
        te = "ఈమెయిల్ చిరునామా",
        latn = "Email Chirunaamaa"
    ),
    K.createAccount to TeVar(
        te = "ఖాతా సృష్టించండి",
        latn = "Khaathaa srushtinchandi"
    ),
    K.fillDetailsToGetStarted to TeVar(
        te = "ప్రారంభించడానికి మీ వివరాలను పూరించండి",
        latn = "Praarambhinchadaaniki mee vivaraalanu poorinchandi"
    ),
    K.firstName to TeVar(
        te = "మొదటి పేరు",
        latn = "Modati Paeru"
    ),
    K.lastName to TeVar(
        te = "చివరి పేరు",
        latn = "Chivari Paeru"
    ),
    K.signUpWithGoogle to TeVar(
        te = "Google తో సైన్ అప్ చేయండి",
        latn = "Google tho sign up chaeyandi"
    ),
    K.collegeTimeSorted to TeVar(
        te = "మీ కాలేజీ సమయం, చక్కగా అమర్చబడింది.",
        latn = "Mee college samayam, chakkagaa amarchabadindhi."
    ),
    K.tapAgreeAndContinue to TeVar(
        te = "ప్రారంభించడానికి \"అంగీకరించి కొనసాగించండి\" ని నొక్కండి",
        latn = "Praarambhinchadaaniki \"Angeekarinchi Konasaaginchandi\" ni nokkandi"
    ),
    K.agreeAndContinue to TeVar(
        te = "అంగీకరించి కొనసాగించండి",
        latn = "Angeekarinchi Konasaaginchandi"
    ),
    K.profileSetup to TeVar(
        te = "ప్రొఫైల్ సెటప్",
        latn = "Profile Setup"
    ),
    K.selectAcademicDetailsBelow to TeVar(
        te = "క్రింద మీ విద్యా వివరాలను ఎంచుకోండి",
        latn = "Krindha mee vidhyaa vivaraalanu enchukoandi"
    ),
    K.academicBatch to TeVar(
        te = "అకడమిక్ బ్యాచ్",
        latn = "Academic Batch"
    ),
    K.selectYear to TeVar(
        te = "సంవత్సరాన్ని ఎంచుకోండి",
        latn = "Samvathsaraanni enchukoandi"
    ),
    K.completeSetup to TeVar(
        te = "సెటప్ పూర్తి చేయండి",
        latn = "Setup poorthi chaeyandi"
    ),
    K.previousMonth to TeVar(
        te = "గత నెల",
        latn = "Gatha nela"
    ),
    K.nextMonth to TeVar(
        te = "వచ్చే నెల",
        latn = "Vachae nela"
    ),
    K.previousYear to TeVar(
        te = "గత సంవత్సరం",
        latn = "Gatha samvathsaram"
    ),
    K.nextYear to TeVar(
        te = "వచ్చే సంవత్సరం",
        latn = "Vachae samvathsaram"
    ),
    K.noAcademicEventsScheduled to TeVar(
        te = "విద్యా ఈవెంట్లు ఏవీ షెడ్యూల్ కాలేదు.",
        latn = "Vidhyaa eventlu aevee schedule kaalaedhu."
    ),
    K.goToToday to TeVar(
        te = "ఈరోజుకి వెళ్లండి",
        latn = "Eeroajiki vellandi"
    ),
    K.eventsCount to TeVar(
        te = "ఈవెంట్లు",
        latn = "Eventlu"
    ),
    K.holidaysCount to TeVar(
        te = "సెలవులు",
        latn = "Selavulu"
    ),
    K.downloadingPdf to TeVar(
        te = "PDF డౌన్‌లోడ్ అవుతోంది...",
        latn = "PDF download avuthoandhi..."
    ),
    K.failedToLoadDocument to TeVar(
        te = "డాక్యుమెంట్ లోడ్ చేయడం విఫలమైంది",
        latn = "Document load chaeyadam viphalamaindhi"
    ),
    K.goBack to TeVar(
        te = "వెనుకకు వెళ్లండి",
        latn = "Venukakku vellandi"
    ),
    K.noItemsHere to TeVar(
        te = "ఇక్కడ ఎలాంటి అంశాలు లేవు",
        latn = "Ikkada elaanti amshaalu laevu"
    ),
    K.noUnitsAddedYet to TeVar(
        te = "ఇంకా ఏ యూనిట్లూ చేర్చబడలేదు",
        latn = "Inkaa ae unitloo chaerchabadalaedhu"
    ),
    K.noNotifications to TeVar(
        te = "నోటిఫికేషన్లు లేవు",
        latn = "Notificationlu laevu"
    ),
    K.markAllRead to TeVar(
        te = "అన్నీ చదివినట్లు మార్క్ చేయండి",
        latn = "Annee chadhivinattlu mark chaeyandi"
    ),
    K.clearAll to TeVar(
        te = "అన్నీ క్లియర్ చేయండి",
        latn = "Annee clear chaeyandi"
    ),
    K.identityVerifiedTryingAgain to TeVar(
        te = "గుర్తింపు ధృవీకరించబడింది! మళ్లీ ప్రయత్నిస్తోంది...",
        latn = "Gurthimpu dhruveekarinchabadindhi! Mallee prayathnisthoandhi..."
    ),
    K.verifyCustomIdentity to TeVar(
        te = "గుర్తింపును ధృవీకరించండి",
        latn = "Gurthimpunu dhruveekarinchandi"
    ),
    K.verifyGoogleForPasswordDesc to TeVar(
        te = "భద్రత కోసం, దయచేసి Google తో మళ్లీ సైన్ ఇన్ చేయండి.",
        latn = "Bhadratha koasam, dhayachaesi Google tho mallee sign in chaeyandi."
    ),
    K.verify to TeVar(
        te = "ధృవీకరించండి",
        latn = "Dhruveekarinchandi"
    ),
    K.googleAccountUnlinked to TeVar(
        te = "Google ఖాతా అన్‌లింక్ చేయబడింది",
        latn = "Google khaathaa unlink chaeyabadindhi"
    ),
    K.identityVerifiedDeletingAccount to TeVar(
        te = "గుర్తింపు ధృవీకరించబడింది! ఖాతాను తొలగిస్తోంది...",
        latn = "Gurthimpu dhruveekarinchabadindhi! Khaathaani tholagisthoandhi..."
    ),
    K.accountDeleted to TeVar(
        te = "ఖాతా తొలగించబడింది",
        latn = "Khaathaa tholaginchabadindhi"
    ),
    K.verifyIdentityForDeletion to TeVar(
        te = "ఖాతా తొలగింపు కోసం గుర్తింపును ధృవీకరించండి",
        latn = "Khaathaa tholagimpu koasam gurthimpunu dhruveekarinchandi"
    ),
    K.verifyGoogleForDeletionDesc to TeVar(
        te = "మీ ఖాతాను తొలగించడం సున్నితమైన చర్య. నిర్ధారించడానికి Google తో సైన్ ఇన్ చేయండి.",
        latn = "Mee khaathaani tholaginchadam sunnithamaina charya. Nirdhaarinchadaaniki Google tho sign in chaeyandi."
    ),
    K.secretary to TeVar(
        te = "కార్యదర్శి",
        latn = "Kaaryadharshi"
    ),
    K.rsMunirathinamBio to TeVar(
        te = "తమిళనాడు శాసనసభ మాజీ సభ్యుడిగా పనిచేసి, RMK విద్యా సమూహాన్ని స్థాపించిన దూరదృష్టి గల దార్శనికులు.",
        latn = "Tamil Nadu shaasanasabha maajee sabhyudigaa panichaesi, RMK vidhyaa samoohaanni sthaapinchina dhooradhrushti gala dhaarshanikulu."
    ),
    K.rmKishoreBio to TeVar(
        te = "ఇంగ్లాండ్‌లో MBA పూర్తి చేసిన మెకానికల్ ఇంజనీర్, విద్యార్థులను గ్లోబల్ విజేతలుగా తీర్చిదిద్దడంలో అంకితభావం కలవారు.",
        latn = "England lo MBA poorthi chaesina mechanical engineer, vidhyaarthulanu global vijaethalugaa theerchidhidhdhadamlo ankithabhaavam kalavaaru."
    ),
    K.manjulaMunirathinamBio to TeVar(
        te = "ఒక దశాబ్దానికి పైగా ఈ సంస్థకు అంకితభావంతో సేవ చేస్తున్న ప్రముఖ సామాజిక కార్యకర్త మరియు విద్యావేత్త.",
        latn = "Oka dhashaabdhaaniki paigaa ee samsthaku ankithabhaavantho saeva chaesthunna pramukha saamaajika kaaryakartha mariyu vidhyaavaeththe."
    ),
    K.jothiNaiduBio to TeVar(
        te = "పారిశ్రామిక నిర్వహణలో విస్తారమైన అనుభవం కలిగి, దాదాపు 30 సంవత్సరాలుగా ఈ సమూహంతో అనుబంధం ఉన్నవారు.",
        latn = "Paarishraamika nirvahanalo visthaaramaina anubhavam kaligi, dhaadhaapu 30 samvathsaraalugaa ee samoohantho anubhandham unnavaaru."
    ),
    K.yalamanchiPradeepBio to TeVar(
        te = "గిండీ ఇంజనీరింగ్ కాలేజీ ECE గ్రాడ్యుయేట్, అమెరికా కార్నెగీ మెల్లన్ యూనివర్సిటీ నుండి మాస్టర్స్ డిగ్రీ పొందారు.",
        latn = "Guindy engineering college ECE graduate, America Carnegie Mellon University nundi Master's degree pondaaru."
    ),
    K.kavaraipettaiAddress to TeVar(
        te = "కవరైపేట్టై, తిరువళ్లూరు జిల్లా",
        latn = "Kavaraipeettai, Thiruvalloor Jillaa"
    ),
    K.puduvoyalAddress to TeVar(
        te = "పుదువోయల్, తిరువళ్లూరు జిల్లా",
        latn = "Pudhuvoyal, Thiruvalloor Jillaa"
    ),
    K.thiruverkaduAddress to TeVar(
        te = "తిరువేర్కాడు, చెన్నై",
        latn = "Thiruvaerkaadu, Chennai"
    ),
    K.sriDurgadeviPolytechnic to TeVar(
        te = "శ్రీ దుర్గాదేవి పాలిటెక్నిక్ కాలేజ్",
        latn = "Sri Durgadevi Polytechnic College"
    ),
    K.rmkMatricSchool to TeVar(
        te = "ఆర్.ఎం.కె. మెట్రిక్యులేషన్ స్కూల్",
        latn = "R.M.K. Matriculation School"
    ),
    K.dontHaveAccount to TeVar(
        te = "ఖాతా లేదా? ",
        latn = "Khaathaa laedhaa? "
    ),
    K.alreadyHaveAccount to TeVar(
        te = "ఇప్పటికే ఖాతా ఉందా? ",
        latn = "Ippatikae khaathaa undhaa? "
    ),
    K.signUp to TeVar(
        te = "సైన్ అప్",
        latn = "Sign Up"
    ),
    K.logIn to TeVar(
        te = "లాగిన్",
        latn = "Log In"
    ),
    K.orDivider to TeVar(
        te = " లేదా ",
        latn = " laedhaa "
    ),
    K.continueWithGoogle to TeVar(
        te = "Google తో కొనసాగించండి",
        latn = "Google tho konasaaginchandi"
    ),
    K.dayMonday to TeVar(
        te = "సోమ",
        latn = "Soama"
    ),
    K.dayTuesday to TeVar(
        te = "మంగళ",
        latn = "Mangala"
    ),
    K.dayWednesday to TeVar(
        te = "బుధ",
        latn = "Budha"
    ),
    K.dayThursday to TeVar(
        te = "గురు",
        latn = "Guru"
    ),
    K.dayFriday to TeVar(
        te = "శుక్ర",
        latn = "Shukra"
    ),
    K.daySaturday to TeVar(
        te = "శని",
        latn = "Shani"
    ),
    K.daySunday to TeVar(
        te = "ఆది",
        latn = "Aadhi"
    ),
    K.dayMondayFull to TeVar(
        te = "సోమవారం",
        latn = "Soamavaaram"
    ),
    K.dayTuesdayFull to TeVar(
        te = "మంగళవారం",
        latn = "Mangalavaaram"
    ),
    K.dayWednesdayFull to TeVar(
        te = "బుధవారం",
        latn = "Budhavaaram"
    ),
    K.dayThursdayFull to TeVar(
        te = "గురువారం",
        latn = "Guruvaaram"
    ),
    K.dayFridayFull to TeVar(
        te = "శుక్రవారం",
        latn = "Shukravaaram"
    ),
    K.daySaturdayFull to TeVar(
        te = "శనివారం",
        latn = "Shanivaaram"
    ),
    K.daySundayFull to TeVar(
        te = "ఆదివారం",
        latn = "Aadhivaaram"
    ),
    K.dayMondayLong to TeVar(
        te = "సోమవారం",
        latn = "Soamavaaram"
    ),
    K.dayTuesdayLong to TeVar(
        te = "మంగళవారం",
        latn = "Mangalavaaram"
    ),
    K.dayWednesdayLong to TeVar(
        te = "బుధవారం",
        latn = "Budhavaaram"
    ),
    K.dayThursdayLong to TeVar(
        te = "గురువారం",
        latn = "Guruvaaram"
    ),
    K.dayFridayLong to TeVar(
        te = "శుక్రవారం",
        latn = "Shukravaaram"
    ),
    K.daySaturdayLong to TeVar(
        te = "శనివారం",
        latn = "Shanivaaram"
    ),
    K.daySundayLong to TeVar(
        te = "ఆదివారం",
        latn = "Aadhivaaram"
    ),
    K.dayMondaySingle to TeVar(
        te = "సో",
        latn = "Soa"
    ),
    K.dayTuesdaySingle to TeVar(
        te = "మం",
        latn = "Mam"
    ),
    K.dayWednesdaySingle to TeVar(
        te = "బు",
        latn = "Bu"
    ),
    K.dayThursdaySingle to TeVar(
        te = "గు",
        latn = "Gu"
    ),
    K.dayFridaySingle to TeVar(
        te = "శు",
        latn = "Shu"
    ),
    K.daySaturdaySingle to TeVar(
        te = "శ",
        latn = "Sha"
    ),
    K.daySundaySingle to TeVar(
        te = "ఆ",
        latn = "Aa"
    ),
    K.monthJan to TeVar(
        te = "జనవరి",
        latn = "Janavari"
    ),
    K.monthFeb to TeVar(
        te = "ఫిబ్రవరి",
        latn = "Fibravari"
    ),
    K.monthMar to TeVar(
        te = "మార్చి",
        latn = "Maarchi"
    ),
    K.monthApr to TeVar(
        te = "ఏప్రిల్",
        latn = "Aepril"
    ),
    K.monthMay to TeVar(
        te = "మే",
        latn = "Mae"
    ),
    K.monthJun to TeVar(
        te = "జూన్",
        latn = "Joon"
    ),
    K.monthJul to TeVar(
        te = "జూలై",
        latn = "Joolai"
    ),
    K.monthAug to TeVar(
        te = "ఆగస్టు",
        latn = "Aagastu"
    ),
    K.monthSep to TeVar(
        te = "సెప్టెంబర్",
        latn = "September"
    ),
    K.monthOct to TeVar(
        te = "అక్టోబర్",
        latn = "Aktoabar"
    ),
    K.monthNov to TeVar(
        te = "నవంబర్",
        latn = "Navambar"
    ),
    K.monthDec to TeVar(
        te = "డిసెంబర్",
        latn = "Disambar"
    ),
    K.monthJanShort to TeVar(
        te = "జన",
        latn = "Jana"
    ),
    K.monthFebShort to TeVar(
        te = "ఫిబ్ర",
        latn = "Fibra"
    ),
    K.monthMarShort to TeVar(
        te = "మార్చి",
        latn = "Maarchi"
    ),
    K.monthAprShort to TeVar(
        te = "ఏప్రి",
        latn = "Aepri"
    ),
    K.monthMayShort to TeVar(
        te = "మే",
        latn = "Mae"
    ),
    K.monthJunShort to TeVar(
        te = "జూన్",
        latn = "Joon"
    ),
    K.monthJulShort to TeVar(
        te = "జూలై",
        latn = "Joolai"
    ),
    K.monthAugShort to TeVar(
        te = "ఆగ",
        latn = "Aaga"
    ),
    K.monthSepShort to TeVar(
        te = "సెప్టెం",
        latn = "Septem"
    ),
    K.monthOctShort to TeVar(
        te = "అక్టో",
        latn = "Aktoa"
    ),
    K.monthNovShort to TeVar(
        te = "నవం",
        latn = "Navam"
    ),
    K.monthDecShort to TeVar(
        te = "డిసెం",
        latn = "Disem"
    ),
    K.settings to TeVar(
        te = "సెట్టింగ్స్",
        latn = "Settings"
    ),
    K.neramAccount to TeVar(
        te = "నేరం ఖాతా",
        latn = "Neram Khaathaa"
    ),
    K.accounts to TeVar(
        te = "ఖాతాలు",
        latn = "Khaathaalu"
    ),
    K.accountsDesc to TeVar(
        te = "లింక్ చేయబడిన ఖాతాలు, సైన్ అవుట్",
        latn = "Link chaeyabadina khaathaalu, sign out"
    ),
    K.security to TeVar(
        te = "భద్రత",
        latn = "Bhadratha"
    ),
    K.securityDesc to TeVar(
        te = "పాస్‌వర్డ్, ఖాతా తొలగింపు",
        latn = "Password, khaathaa tholagimpu"
    ),
    K.userDirectory to TeVar(
        te = "యూజర్ డైరెక్టరీ",
        latn = "User Directory"
    ),
    K.userDirectoryDesc to TeVar(
        te = "ఫ్యాకల్టీ, సిబ్బంది, విద్యార్థులు",
        latn = "Faculty, sibbandhi, vidhyaarthulu"
    ),
    K.display to TeVar(
        te = "డిస్‌ప్లే",
        latn = "Display"
    ),
    K.displayDesc to TeVar(
        te = "బ్రైట్‌నెస్, డార్క్ మోడ్",
        latn = "Brightness, dark mode"
    ),
    K.storageData to TeVar(
        te = "స్టోరేజ్ & డేటా",
        latn = "Storage & Data"
    ),
    K.storageDesc to TeVar(
        te = "పాత అప్‌డేట్లను తొలగించండి, కాష్‌ని నిర్వహించండి",
        latn = "Paatha updatelanu tholaginchandi, cache ni nirvahinchandi"
    ),
    K.complaints to TeVar(
        te = "ఫిర్యాదులు & ఫీడ్‌బ్యాక్",
        latn = "Firyaadhulu & Feedback"
    ),
    K.complaintsDesc to TeVar(
        te = "సమస్యలను నివేదించండి, సూచనలు",
        latn = "Samasyalanu nivaedhinchandi, soochanalu"
    ),
    K.aboutDeveloper to TeVar(
        te = "డిజైనర్ గురించి",
        latn = "Designer Gurinchi"
    ),
    K.aboutDeveloperDesc to TeVar(
        te = "డిజైనర్ ప్రొఫైల్ & వివరాలు",
        latn = "Designer profile & vivaraalu"
    ),
    K.aboutApp to TeVar(
        te = "యాప్ గురించి",
        latn = "App Gurinchi"
    ),
    K.aboutAppDesc to TeVar(
        te = "మీ కాలేజీ సమయం, చక్కగా",
        latn = "Mee College Samayam, Chakkagaa"
    ),
    K.importantSites to TeVar(
        te = "ముఖ్యమైన సైట్లు",
        latn = "Mukhyamaina Sitelu"
    ),
    K.importantSitesDesc to TeVar(
        te = "కాలేజీ పోర్టల్స్, క్విక్ లింక్స్",
        latn = "College portals, quick links"
    ),
    K.aboutRmk to TeVar(
        te = "RMK గ్రూప్ గురించి",
        latn = "RMK Group Gurinchi"
    ),
    K.aboutRmkDesc to TeVar(
        te = "సంస్థలు, నాయకత్వం",
        latn = "Samsthalu, naayakathvam"
    ),
    K.contact to TeVar(
        te = "సంప్రదించండి",
        latn = "Sampradhinchandi"
    ),
    K.contactDesc to TeVar(
        te = "క్యాంపస్ హెల్ప్‌లైన్లు, లొకేషన్",
        latn = "Campus helplinelu, location"
    ),
    K.managementTeam to TeVar(
        te = "యాజమాన్య బృందం",
        latn = "Yaajamaanya Brundham"
    ),
    K.language to TeVar(
        te = "భాష",
        latn = "Bhaasha"
    ),
    K.languageDesc to TeVar(
        te = "ఇంగ్లీష్, తమిళం, తెలుగు, మలయాళం",
        latn = "English, Thamizham, Telugu, Malayalam"
    ),
    K.deviceLanguage to TeVar(
        te = "సిస్టమ్ డిఫాల్ట్",
        latn = "System Default"
    ),
    K.english to TeVar(
        te = "ఇంగ్లీష్",
        latn = "English"
    ),
    K.tamil to TeVar(
        te = "తమిళం",
        latn = "Thamizham"
    ),
    K.tamilLatin to TeVar(
        te = "తమిళం (ల్యాటిన్)",
        latn = "Thamizham (Latin)"
    ),
    K.tamilMalayalam to TeVar(
        te = "తమిళం (మలయాళ లిపి)",
        latn = "Thamizham (Malayalam Lipi)"
    ),
    K.malayalam to TeVar(
        te = "మలయాళం",
        latn = "Malayalam"
    ),
    K.malayalamLatin to TeVar(
        te = "మలయాళం (ల్యాటిన్)",
        latn = "Malayalam (Latin)"
    ),
    K.malayalamTamil to TeVar(
        te = "మలయాళం (తమిళ లిపి)",
        latn = "Malayalam (Tamil Lipi)"
    ),
    K.telugu to TeVar(
        te = "తెలుగు",
        latn = "Telugu"
    ),
    K.teluguLatin to TeVar(
        te = "తెలుగు (ల్యాటిన్)",
        latn = "Telugu (Latin)"
    ),
    K.languageInfo to TeVar(
        te = "భాష మార్పు అన్ని పేజీలు, నావిగేషన్ మరియు సెట్టింగ్స్‌లో తక్షణమే వర్తిస్తుంది.",
        latn = "Bhaasha maarpu annee pageelu, navigation mariyu settings lo thakshanamae varthisthundhi."
    ),
    K.chooseLanguage to TeVar(
        te = "భాషను ఎంచుకోండి",
        latn = "Bhaashanu Enchukoandi"
    ),
    K.selectPreferredLanguage to TeVar(
        te = "మీకు నచ్చిన భాషను ఎంచుకోండి",
        latn = "Meeku nachina bhaashanu enchukoandi"
    ),
    K.moreLanguagesBelow to TeVar(
        te = "మరిన్ని భాషల కోసం క్రిందికి జరపండి",
        latn = "Marinni bhaashala koasam krindhiki jarapandi"
    ),
    K.continueAction to TeVar(
        te = "కొనసాగించండి",
        latn = "Konasaaginchandi"
    ),
    K.editProfile to TeVar(
        te = "ప్రొఫైల్",
        latn = "Profile"
    ),
    K.feedback to TeVar(
        te = "ఫీడ్‌బ్యాక్ & సందేహాలు",
        latn = "Feedback & Sandhaehaalu"
    ),
    K.lightMode to TeVar(
        te = "లైట్",
        latn = "Light"
    ),
    K.darkMode to TeVar(
        te = "డార్క్",
        latn = "Dark"
    ),
    K.systemAuto to TeVar(
        te = "సిస్టమ్ ఆటో",
        latn = "System Auto"
    ),
    K.themeDescription to TeVar(
        te = "సిస్టమ్‌తో మోడ్‌లను మార్చండి",
        latn = "System tho modelanu maarchandi"
    ),
    K.linkedAccounts to TeVar(
        te = "లింక్ చేసిన ఖాతాలు",
        latn = "Link chaesina khaathaalu"
    ),
    K.linkedAccountsDesc to TeVar(
        te = "Google సైన్-ఇన్‌ను నిర్వహించండి",
        latn = "Google sign-in nu nirvahinchandi"
    ),
    K.signOut to TeVar(
        te = "సైన్ అవుట్",
        latn = "Sign Out"
    ),
    K.signOutDesc to TeVar(
        te = "మీ నేరం ఖాతా నుండి లాగౌట్ అవ్వండి",
        latn = "Mee Neram khaathaa nundi logout avvandi"
    ),
    K.signOutConfirm to TeVar(
        te = "సైన్ అవుట్ చేయాలా?",
        latn = "Sign Out chaeyaalaa?"
    ),
    K.signOutMessage to TeVar(
        te = "మీరు ఖచ్చితంగా సైన్ అవుట్ చేయాలనుకుంటున్నారా?",
        latn = "Meeru khachchithangaa sign out chaeyalanukuntunnaaraa?"
    ),
    K.changePassword to TeVar(
        te = "పాస్‌వర్డ్ మార్చండి",
        latn = "Password maarchandi"
    ),
    K.deleteAccount to TeVar(
        te = "ఖాతా తొలగించండి",
        latn = "Khaathaa tholaginchandi"
    ),
    K.dangerZone to TeVar(
        te = "డేంజర్ జోన్",
        latn = "Danger Zone"
    ),
    K.createPassword to TeVar(
        te = "పాస్‌వర్డ్ సృష్టించండి",
        latn = "Password srushtinchandi"
    ),
    K.cleanupOptions to TeVar(
        te = "క్లీనప్ ఆప్షన్లు",
        latn = "Cleanup Options"
    ),
    K.clearOldUpdates to TeVar(
        te = "పాత అప్‌డేట్లను తొలగించండి",
        latn = "Paatha updatelanu tholaginchandi"
    ),
    K.clearOldUpdatesDesc to TeVar(
        te = "30 రోజుల కంటే పాత న్యూస్ మరియు నోటీసులను తొలగించండి",
        latn = "30 roajula kante paatha news mariyu noteesulanu tholaginchandi"
    ),
    K.customRangeDeletion to TeVar(
        te = "కస్టమ్ పరిధి తొలగింపు",
        latn = "Custom paridhi tholagimpu"
    ),
    K.customRangeDesc to TeVar(
        te = "అప్‌డేట్లను తుడిచిపెట్టడానికి తేదీ పరిధిని ఎంచుకోండి",
        latn = "Updatelanu thudichipettadaaniki thaedhee paridhini enchukoandi"
    ),
    K.optimizationInfo to TeVar(
        te = "ఆప్టిమైజేషన్ యాప్ వేగంగా స్పందించడానికి సహాయపడుతుంది.",
        latn = "Optimization app vaegangaa spandhinchadaaniki sahaayapaduthundhi."
    ),
    K.confirmDeletion to TeVar(
        te = "తొలగింపును నిర్ధారించండి",
        latn = "Tholagimpunu nirdhaarinchandi"
    ),
    K.clearNow to TeVar(
        te = "ఇప్పుడే తొలగించండి",
        latn = "Ippudae tholaginchandi"
    ),
    K.deleteData to TeVar(
        te = "డేటాను తొలగించండి",
        latn = "Daetaanu tholaginchandi"
    ),
    K.selectRange to TeVar(
        te = "పరిధిని ఎంచుకోండి",
        latn = "Paridhini enchukoandi"
    ),
    K.selectDateRange to TeVar(
        te = "తేదీ పరిధిని ఎంచుకోండి",
        latn = "Thaedhee paridhini enchukoandi"
    ),
    K.chooseUpdatesToWipe to TeVar(
        te = "తొలగించాల్సిన అప్‌డేట్లను ఎంచుకోండి",
        latn = "Tholaginchaalsina updatelanu enchukoandi"
    ),
    K.clearConfirmMessage to TeVar(
        te = "ఇది 30 రోజుల కంటే పాత లైవ్ అప్‌డేట్లు మరియు నోటీసులను శాశ్వతంగా తొలగిస్తుంది. దీన్ని తిరిగి పొందలేరు.",
        latn = "Idhi 30 roajula kante paatha live updatelu mariyu noteesulanu shaashvathangaa tholagisthundhi. Dheennee thirigi pondhalaeru."
    ),
    K.clearedMessage to TeVar(
        te = "30 రోజుల కంటే పాత అప్‌డేట్లు తొలగించబడ్డాయి",
        latn = "30 roajula kante paatha updatelu tholaginchabaddaayi"
    ),
    K.notUploadedTitle to TeVar(
        te = "అప్‌లోడ్ చేయలేదు",
        latn = "Upload chaeyalaedhu"
    ),
    K.notUploadedMessage to TeVar(
        te = "ఈ యూనిట్ నోట్స్ rmd.ac.in లో ఇంకా అప్‌లోడ్ చేయలేదు. అప్‌లోడ్ అయిన వెంటనే ఇక్కడ అందుబాటులో ఉంటాయి.",
        latn = "Ee unit notes rmd.ac.in lo inkaa upload chaeyalaedhu. Upload ayina ventanae ikkada andhubbaatulo untaayi."
    ),
    K.noUsersFound to TeVar(
        te = "శోధనకు సరిపోలే పరిచయాలు ఏవీ లేవు.",
        latn = "Shoadhanaku saripoalae parichayaalu aevee laevu."
    ),
    K.email to TeVar(
        te = "ఈమెయిల్",
        latn = "Email"
    ),
    K.whatIsNeram to TeVar(
        te = "నేరం అంటే ఏమిటి?",
        latn = "Neram antae aemiti?"
    ),
    K.aboutNeramDesc to TeVar(
        te = "నేరం ('Neram', అంటే 'సమయం') మీ కాలేజీ విద్యా ప్రయాణాన్ని సులభతరం చేసే ఇంటెలిజెంట్ టైమ్‌టేబుల్ మరియు క్యాలెండర్ యాప్.\n\nఎల్వన్ నవిల్ సమర్పణ\nక్లాస్ షెడ్యూల్స్, ఎగ్జామ్స్, నోటీసులు మరియు నోట్స్ అన్నీ ఒకే చోట సులభంగా యాక్సెస్ చేయడానికి రూపొందించబడింది.",
        latn = "Neram ('Neram', antae 'Samayam') mee college vidhyaa prayaanaanni sulabhatharam chaesae intelligent timetable mariyu calendar app.\n\nElvan Navil Samarpana\nClass schedules, exams, noteesulu mariyu notes annee okae choata sulabhangaa access chaeyadaaniki roopoandhinchabadindhi."
    ),
    K.features to TeVar(
        te = "ఫీచర్లు",
        latn = "Features"
    ),
    K.smartTimetable to TeVar(
        te = "స్మార్ట్ టైమ్‌టేబుల్",
        latn = "Smart Timetable"
    ),
    K.smartTimetableDesc to TeVar(
        te = "ఫ్యాకల్టీ వివరాలు మరియు రూమ్ నంబర్లతో మీ రోజువారీ క్లాస్ షెడ్యూల్‌ను చూడండి.",
        latn = "Faculty vivaraalu mariyu room numberlatho mee roajuvaaree class schedule nu choodandi."
    ),
    K.examCalendar to TeVar(
        te = "ఎగ్జామ్ క్యాలెండర్",
        latn = "Exam Calendar"
    ),
    K.examCalendarDesc to TeVar(
        te = "రాబోయే ఎగ్జామ్స్, ఇంటర్నల్స్ మరియు ఈవెంట్లను కౌంట్‌డౌన్‌తో ట్రాక్ చేయండి.",
        latn = "Raaboayae exams, internals mariyu eventlanu countdown tho track chaeyandi."
    ),
    K.campusAnnouncements to TeVar(
        te = "క్యాంపస్ అనౌన్స్‌మెంట్లు",
        latn = "Campus Announcements"
    ),
    K.campusAnnouncementsDesc to TeVar(
        te = "న్యూస్, నోటీసులు మరియు అత్యవసర సమాచారం కోసం తక్షణ నోటిఫికేషన్లను పొందండి.",
        latn = "News, noteesulu mariyu athyavasara samaachaaram koasam thakshana notificationlanu pondhandi."
    ),
    K.offlineSupport to TeVar(
        te = "ఆఫ్‌లైన్ సపోర్ట్",
        latn = "Offline Support"
    ),
    K.offlineSupportDesc to TeVar(
        te = "ఇంటర్నెట్ లేనప్పుడు కూడా మీ టైమ్‌టేబుల్ మరియు కాష్ చేసిన డేటాను చూడండి.",
        latn = "Internet laenappudu koodaa mee timetable mariyu cache chaesina daetaanu choodandi."
    ),
    K.cloudSync to TeVar(
        te = "క్లౌడ్ సింక్",
        latn = "Cloud Sync"
    ),
    K.cloudSyncDesc to TeVar(
        te = "మీ షెడ్యూల్ మరియు ప్రాధాన్యతలు Firebase ద్వారా సురక్షితంగా సింక్ అవుతాయి.",
        latn = "Mee schedule mariyu praadhaanyathalu Firebase dvaaraa surakshithangaa sync avuthaayi."
    ),
    K.connectWithMe to TeVar(
        te = "నాతో కనెక్ట్ అవ్వండి",
        latn = "Naatho Connect Avvandi"
    ),
    K.visitPortfolio to TeVar(
        te = "పోర్ట్‌ఫోలియోను సందర్శించండి",
        latn = "Portfolio nu Sandharshinchandi"
    ),
    K.locationChennai to TeVar(
        te = "ఆరణి / చెన్నై, తమిళనాడు",
        latn = "Arani / Chennai, Tamil Nadu"
    ),
    K.submitFeedback to TeVar(
        te = "ఫీడ్‌బ్యాక్ పంపండి",
        latn = "Feedback Pampandi"
    ),
    K.describeIssue to TeVar(
        te = "మీ ఫీడ్‌బ్యాక్ లేదా సమస్యను ఇక్కడ వివరించండి...",
        latn = "Mee feedback laedhaa samasyanu ikkada vivarinchandi..."
    ),
    K.feedbackSubmittedSuccess to TeVar(
        te = "ధన్యవాదాలు! మీ ఫీడ్‌బ్యాక్ విజయవంతంగా పంపబడింది.",
        latn = "Dhanyavaadhaalu! Mee feedback vijayavanthangaa pampabadindhi."
    ),
    K.fillAllFields to TeVar(
        te = "దయచేసి అవసరమైన అన్ని వివరాలను పూరించండి",
        latn = "Dhayachaesi avasaramaina annee vivaraalanu poorinchandi"
    ),
    K.rmkGroupLegacy to TeVar(
        te = "RMK గ్రూప్ ఆఫ్ ఇన్‌స్టిట్యూషన్స్",
        latn = "RMK Group of Institutions"
    ),
    K.rmkDescription to TeVar(
        te = "నాణ్యమైన విద్య, క్రమశిక్షణ మరియు అత్యాధునిక ఇంజనీరింగ్ విద్యకు ప్రతిష్టాత్మక విద్యా సంస్థల సమూహం.",
        latn = "Naanyamaina vidhya, kramashikshana mariyu athyaadhunika engineering vidhyaku prathishtaathmaka vidhyaa samsthala samooham."
    ),
    K.visionMission to TeVar(
        te = "విజన్ & మిషన్",
        latn = "Vision & Mission"
    ),
    K.institutions to TeVar(
        te = "విద్యా సంస్థలు",
        latn = "Vidhyaa Samsthalu"
    ),
    K.rmkEnggCollege to TeVar(
        te = "ఆర్.ఎం.కె. ఇంజనీరింగ్ కాలేజ్",
        latn = "R.M.K. Engineering College"
    ),
    K.rmdEnggCollege to TeVar(
        te = "ఆర్.ఎం.డి. ఇంజనీరింగ్ కాలేజ్",
        latn = "R.M.D. Engineering College"
    ),
    K.rmkCet to TeVar(
        te = "ఆర్.ఎం.కె. కాలేజ్ ఆఫ్ ఇంజనీరింగ్ అండ్ టెక్నాలజీ",
        latn = "R.M.K. College of Engineering and Technology"
    ),
    K.rmkSchool to TeVar(
        te = "ఆర్.ఎం.కె. రెసిడెన్షియల్ సీనియర్ సెకండరీ స్కూల్",
        latn = "R.M.K. Residential Senior Secondary School"
    ),
    K.founderChairman to TeVar(
        te = "వ్యవస్థాపక చైర్మన్",
        latn = "Vyavasthaapaka Chairman"
    ),
    K.viceChairman to TeVar(
        te = "వైస్ చైర్మన్",
        latn = "Vice Chairman"
    ),
    K.chairperson to TeVar(
        te = "చైర్‌పర్సన్",
        latn = "Chairperson"
    ),
    K.director to TeVar(
        te = "డైరెక్టర్",
        latn = "Director"
    ),
    K.officialPortals to TeVar(
        te = "అధికారిక పోర్టల్స్",
        latn = "Adhikaarika Portals"
    ),
    K.emergencyHelpline to TeVar(
        te = "అత్యవసర హెల్ప్‌లైన్లు",
        latn = "Athyavasara Helplinelu"
    ),
    K.collegeReception to TeVar(
        te = "కాలేజీ రిసెప్షన్",
        latn = "College Reception"
    ),
    K.principalOffice to TeVar(
        te = "ప్రిన్సిపాల్ కార్యాలయం",
        latn = "Principal Kaaryaalayam"
    ),
    K.placementCell to TeVar(
        te = "ట్రైనింగ్ & ప్లేస్‌మెంట్ సెల్",
        latn = "Training & Placement Cell"
    ),
    K.transportIncharge to TeVar(
        te = "ట్రాన్స్‌పోర్ట్ ఇన్‌ఛార్జ్",
        latn = "Transport Incharge"
    ),
    K.hostelOffice to TeVar(
        te = "హాస్టల్ ఆఫీస్",
        latn = "Hostel Office"
    ),
    K.ambulanceMedical to TeVar(
        te = "అంబులెన్స్ & మెడికల్ సెంటర్",
        latn = "Ambulance & Medical Center"
    ),
    K.securityGate to TeVar(
        te = "మెయిన్ సెక్యూరిటీ గేట్",
        latn = "Main Security Gate"
    ),
    K.fullName to TeVar(
        te = "పూర్తి పేరు",
        latn = "Poorthi Paeru"
    ),
    K.roleStudent to TeVar(
        te = "విద్యార్థి",
        latn = "Vidhyaarthi"
    ),
    K.fillDetailsGetStarted to TeVar(
        te = "ప్రారంభించడానికి మీ వివరాలను నమోదు చేయండి",
        latn = "Praarambhinchadaaniki mee vivaraalanu namoadhu chaeyandi"
    ),
    K.welcomeToNeramTitle to TeVar(
        te = "నేరంకి స్వాగతం",
        latn = "Neram ki Svaagatham"
    ),
    K.yourCollegeTimeSorted to TeVar(
        te = "మీ కాలేజీ సమయం, చక్కగా అమర్చబడింది.",
        latn = "Mee college samayam, chakkagaa amarchabadindhi."
    ),
    K.personalInfo to TeVar(
        te = "వ్యక్తిగత సమాచారం",
        latn = "Vyakthigatha Samaachaaram"
    ),
    K.academicDetails to TeVar(
        te = "అకడమిక్ వివరాలు",
        latn = "Academic Vivaraalu"
    ),
    K.editName to TeVar(
        te = "పేరును ఎడిట్ చేయండి",
        latn = "Paerunu edit chaeyandi"
    ),
    K.enterFirstName to TeVar(
        te = "మొదటి పేరును నమోదు చేయండి",
        latn = "Modati paerunu namoadhu chaeyandi"
    ),
    K.enterLastName to TeVar(
        te = "చివరి పేరును నమోదు చేయండి",
        latn = "Chivari paerunu namoadhu chaeyandi"
    ),
    K.mobileNumber to TeVar(
        te = "మొబైల్ నంబర్",
        latn = "Mobile Number"
    ),
    K.editMobileNumber to TeVar(
        te = "మొబైల్ నంబర్‌ను ఎడిట్ చేయండి",
        latn = "Mobile number nu edit chaeyandi"
    ),
    K.tenDigitNumber to TeVar(
        te = "10-అంకెల నంబర్",
        latn = "10-ankela number"
    ),
    K.dateOfBirth to TeVar(
        te = "పుట్టిన తేదీ",
        latn = "Puttina Thaedhee"
    ),
    K.editDateOfBirth to TeVar(
        te = "పుట్టిన తేదీని ఎడిట్ చేయండి",
        latn = "Puttina thaedheeni edit chaeyandi"
    ),
    K.gender to TeVar(
        te = "లింగం",
        latn = "Lingam"
    ),
    K.selectGender to TeVar(
        te = "లింగాన్ని ఎంచుకోండి",
        latn = "Lingaanni enchukoandi"
    ),
    K.batchDeptSection to TeVar(
        te = "బ్యాచ్, డిపార్ట్‌మెంట్ & సెక్షన్",
        latn = "Batch, Department & Section"
    ),
    K.editAcademicDetails to TeVar(
        te = "అకడమిక్ వివరాలను ఎడిట్ చేయండి",
        latn = "Academic vivaraalanu edit chaeyandi"
    ),
    K.batch to TeVar(
        te = "బ్యాచ్",
        latn = "Batch"
    ),
    K.selectBatch to TeVar(
        te = "బ్యాచ్‌ను ఎంచుకోండి",
        latn = "Batch nu enchukoandi"
    ),
    K.department to TeVar(
        te = "డిపార్ట్‌మెంట్",
        latn = "Department"
    ),
    K.selectDepartment to TeVar(
        te = "డిపార్ట్‌మెంట్‌ను ఎంచుకోండి",
        latn = "Department nu enchukoandi"
    ),
    K.section to TeVar(
        te = "సెక్షన్",
        latn = "Section"
    ),
    K.selectSection to TeVar(
        te = "సెక్షన్‌ను ఎంచుకోండి",
        latn = "Section nu enchukoandi"
    ),
    K.registerNumber to TeVar(
        te = "రిజిస్టర్ నంబర్",
        latn = "Register Number"
    ),
    K.editRegisterNumber to TeVar(
        te = "రిజిస్టర్ నంబర్‌ను ఎడిట్ చేయండి",
        latn = "Register number nu edit chaeyandi"
    ),
    K.enterRegisterNumber to TeVar(
        te = "రిజిస్టర్ నంబర్‌ను నమోదు చేయండి",
        latn = "Register number nu namoadhu chaeyandi"
    ),
    K.updateLoginPassword to TeVar(
        te = "మీ లాగిన్ పాస్‌వర్డ్‌ను అప్‌డేట్ చేయండి",
        latn = "Mee login password nu update chaeyandi"
    ),
    K.createPasswordTitle to TeVar(
        te = "పాస్‌వర్డ్ సృష్టించండి",
        latn = "Password Srushtinchandi"
    ),
    K.setPasswordEmailLogin to TeVar(
        te = "ఈమెయిల్ లాగిన్ కోసం పాస్‌వర్డ్‌ను సెట్ చేయండి",
        latn = "Email login koasam password nu set chaeyandi"
    ),
    K.permanentlyRemoveAccount to TeVar(
        te = "మీ ఖాతాను శాశ్వతంగా తొలగించండి",
        latn = "Mee khaathaani shaashvathangaa tholaginchandi"
    ),
    K.currentPassword to TeVar(
        te = "ప్రస్తుత పాస్‌వర్డ్",
        latn = "Prasthutha Password"
    ),
    K.enterCurrentPassword to TeVar(
        te = "ప్రస్తుత పాస్‌వర్డ్‌ను నమోదు చేయండి",
        latn = "Prasthutha password nu namoadhu chaeyandi"
    ),
    K.newPassword to TeVar(
        te = "కొత్త పాస్‌వర్డ్",
        latn = "Kottha Password"
    ),
    K.enterNewPassword to TeVar(
        te = "కొత్త పాస్‌వర్డ్‌ను నమోదు చేయండి",
        latn = "Kottha password nu namoadhu chaeyandi"
    ),
    K.confirmNewPassword to TeVar(
        te = "కొత్త పాస్‌వర్డ్‌ను నిర్ధారించండి",
        latn = "Kottha password nu nirdhaarinchandi"
    ),
    K.confirmPassword to TeVar(
        te = "పాస్‌వర్డ్‌ను నిర్ధారించండి",
        latn = "Password nu nirdhaarinchandi"
    ),
    K.verifyIdentity to TeVar(
        te = "గుర్తింపును నిర్ధారించండి",
        latn = "Gurthimpunu nirdhaarinchandi"
    ),
    K.googleReauthPrompt to TeVar(
        te = "భద్రత కోసం, దయచేసి Google తో మళ్లీ సైన్ ఇన్ చేయండి.",
        latn = "Bhadratha koasam, dhayachaesi Google tho mallee sign in chaeyandi."
    ),
    K.signInMethods to TeVar(
        te = "సైన్ ఇన్ పద్ధతులు",
        latn = "Sign In Paddhathulu"
    ),
    K.allowNotifications to TeVar(
        te = "నోటిఫికేషన్లను అనుమతించండి",
        latn = "Notificationlanu anumathinchandi"
    ),
    K.masterNotificationSwitch to TeVar(
        te = "అన్ని యాప్ నోటిఫికేషన్ల కోసం మాస్టర్ స్విచ్",
        latn = "Annee app notificationla koasam master switch"
    ),
    K.dailyUpdates to TeVar(
        te = "రోజువారీ అప్‌డేట్లు",
        latn = "Roajuvaaree Updatelu"
    ),
    K.dailyUpdatesDesc to TeVar(
        te = "రోజువారీ క్లాస్ నోట్స్ & అకడమిక్ అప్‌డేట్లు",
        latn = "Roajuvaaree class notes & academic updatelu"
    ),
    K.generalNoticesTitle to TeVar(
        te = "జనరల్ నోటీసులు",
        latn = "General Noteesulu"
    ),
    K.generalNoticesDesc to TeVar(
        te = "కాలేజీ నుండి సాధారణ ప్రకటనలు",
        latn = "College nundi saadhaarana prakatanalu"
    ),
    K.classScheduleTitle to TeVar(
        te = "క్లాస్ షెడ్యూల్",
        latn = "Class Schedule"
    ),
    K.classScheduleDesc to TeVar(
        te = "నేటి టైమ్‌టేబుల్ మరియు సబ్జెక్టులు",
        latn = "Naeti timetable mariyu subjectlu"
    ),
    K.labReminders to TeVar(
        te = "ల్యాబ్ రిమైండర్లు",
        latn = "Lab Reminderlu"
    ),
    K.labRemindersDesc to TeVar(
        te = "బ్యాచ్ నిర్దిష్ట ల్యాబ్‌లు మరియు ల్యాబ్‌కోట్ అలర్ట్‌లు",
        latn = "Batch nirdhishta lablu mariyu labcoat alertlu"
    ),
    K.studyReminders to TeVar(
        te = "స్టడీ రిమైండర్లు",
        latn = "Study Reminderlu"
    ),
    K.studyRemindersDesc to TeVar(
        te = "రాబోయే ఎగ్జామ్స్ కోసం మోటివేషన్",
        latn = "Raaboayae exams koasam motivation"
    ),
    K.examAlerts to TeVar(
        te = "ఎగ్జామ్ అలర్ట్‌లు",
        latn = "Exam Alertlu"
    ),
    K.examAlertsDesc to TeVar(
        te = "నేటి / రేపటి ఎగ్జామ్ రిమైండర్లు",
        latn = "Naeti / raepati exam reminderlu"
    ),
    K.eventReminders to TeVar(
        te = "ఈవెంట్ రిమైండర్లు",
        latn = "Event Reminderlu"
    ),
    K.eventRemindersDesc to TeVar(
        te = "సెలవులు మరియు ప్రత్యేక ఈవెంట్లు",
        latn = "Selavulu mariyu prathyeka eventlu"
    ),
    K.instantAlerts to TeVar(
        te = "తక్షణ అలర్ట్‌లు",
        latn = "Thakshana Alertlu"
    ),
    K.instantAlertsDesc to TeVar(
        te = "కీలకమైన తక్షణ ప్రకటనలు",
        latn = "Keelakamaina thakshana prakatanalu"
    ),
    K.useCustomTimes to TeVar(
        te = "కస్టమ్ సమయాలను ఉపయోగించండి",
        latn = "Custom samayaalanu upuyoaginchandi"
    ),
    K.usingCustomTimes to TeVar(
        te = "కస్టమ్ అలారం సమయాలను ఉపయోగిస్తున్నారు",
        latn = "Custom alarm samayaalanu upuyoagisthunnaaru"
    ),
    K.usingDefaultTimes to TeVar(
        te = "డిఫాల్ట్ కాలేజీ సమయాలను ఉపయోగిస్తున్నారు",
        latn = "Default college samayaalanu upuyoagisthunnaaru"
    ),
    K.dailyBriefing to TeVar(
        te = "డైలీ బ్రీఫింగ్",
        latn = "Daily Briefing"
    ),
    K.examToday to TeVar(
        te = "నేడు ఎగ్జామ్",
        latn = "Naedu Exam"
    ),
    K.examTomorrow to TeVar(
        te = "రేపు ఎగ్జామ్",
        latn = "Raepu Exam"
    ),
    K.practicalExamToday to TeVar(
        te = "నేడు ప్రాక్టికల్ ఎగ్జామ్",
        latn = "Naedu Practical Exam"
    ),
    K.practicalExamTomorrow to TeVar(
        te = "రేపు ప్రాక్టికల్ ఎగ్జామ్",
        latn = "Raepu Practical Exam"
    ),
    K.specialClassToday to TeVar(
        te = "నేడు ప్రత్యేక క్లాస్",
        latn = "Naedu Prathyeka Class"
    ),
    K.bestOfLuckFor to TeVar(
        te = "ఆల్ ది బెస్ట్",
        latn = "All the best"
    ),
    K.prepareFor to TeVar(
        te = "సిద్ధంగా ఉండండి",
        latn = "Siddhangaa undandi"
    ),
    K.holidayToday to TeVar(
        te = "ఈరోజు సెలవు",
        latn = "Eeroaju Selavu"
    ),
    K.fullDayNotice to TeVar(
        te = "పూర్తి రోజు నోటీస్",
        latn = "Poorthi Roaju Notice"
    ),
    K.halfDayNotice to TeVar(
        te = "హాఫ్ డే నోటీస్",
        latn = "Half Day Notice"
    ),
    K.sectionNotice to TeVar(
        te = "సెక్షన్ నోటీస్",
        latn = "Section Notice"
    ),
    K.academicCalendarUpdate to TeVar(
        te = "అకడమిక్ క్యాలెండర్ అప్‌డేట్",
        latn = "Academic Calendar Update"
    ),
    K.automatedReminders to TeVar(
        te = "ఆటోమేటెడ్ రిమైండర్లు",
        latn = "Automated Reminderlu"
    ),
    K.todaysSchedule to TeVar(
        te = "నేటి షెడ్యూల్",
        latn = "Naeti Schedule"
    ),
    K.time to TeVar(
        te = "సమయం",
        latn = "Samayam"
    ),
    K.user to TeVar(
        te = "యూజర్",
        latn = "User"
    ),
    K.noEmailLinked to TeVar(
        te = "ఈమెయిల్ లింక్ చేయబడలేదు",
        latn = "Email link chaeyabadalaedhu"
    ),
    K.cannotOpenUrl to TeVar(
        te = "ఓపెన్ చేయలేకపోయాము: %s",
        latn = "Open chaeyalaekapoayaamu: %s"
    ),
    K.selectBatchTitle to TeVar(
        te = "బ్యాచ్‌ను ఎంచుకోండి",
        latn = "Batch nu Enchukoandi"
    ),
    K.viewDeptsInBatch to TeVar(
        te = "బ్యాచ్ %s లోని డిపార్ట్‌మెంట్లు",
        latn = "Batch %s loani departmentlu"
    ),
    K.selectDeptBatch to TeVar(
        te = "డిపార్ట్‌మెంట్‌ను ఎంచుకోండి (బ్యాచ్ %s)",
        latn = "Department nu enchukoandi (Batch %s)"
    ),
    K.viewSectionsInDept to TeVar(
        te = "%s లోని సెక్షన్లను చూడండి",
        latn = "%s loani sectionlanu choodandi"
    ),
    K.selectSectionDept to TeVar(
        te = "సెక్షన్‌ను ఎంచుకోండి (%s)",
        latn = "Section nu enchukoandi (%s)"
    ),
    K.viewStudentsInSection to TeVar(
        te = "సెక్షన్ %s లోని విద్యార్థులను చూడండి",
        latn = "Section %s loani vidhyaarthulanu choodandi"
    ),
    K.viewMonth to TeVar(
        te = "నెల",
        latn = "Nela"
    ),
    K.viewSchedule to TeVar(
        te = "షెడ్యూల్",
        latn = "Schedule"
    ),
    K.viewYear to TeVar(
        te = "సంవత్సరం",
        latn = "Samvathsaram"
    ),
    K.globalExcellence to TeVar(
        te = "గ్లోబల్ ఎక్సలెన్స్",
        latn = "Global Excellence"
    ),
    K.globalExcellenceDesc to TeVar(
        te = "ఇంజనీరింగ్ మరియు టెక్నాలజీ విద్యలో అత్యంత ప్రాధాన్యత కలిగిన సంస్థగా నిలవడం.",
        latn = "Engineering mariyu technology vidhyalo athyantha praadhaanyatha kaligina samsthagaa nilavadam."
    ),
    K.transformingLearners to TeVar(
        te = "విద్యార్థుల వికాసం",
        latn = "Vidhyaarthula Vikaasam"
    ),
    K.transformingLearnersDesc to TeVar(
        te = "సామాజిక బాధ్యత గల గ్లోబల్ విజేతలుగా విద్యార్థులను తీర్చిదిద్దడం.",
        latn = "Saamaajika bhaadhyatha gala global vijaethalugaa vidhyaarthulanu theerchidhidhdhadam."
    ),
    K.location to TeVar(
        te = "లొకేషన్",
        latn = "Location"
    ),
    K.managementTeamDesc to TeVar(
        te = "RMK గ్రూప్‌ను నడిపిస్తున్న దూరదృష్టి గల నాయకత్వం.",
        latn = "RMK group nu nadipisthunna dhooradhrushti gala naayakathvam."
    ),
    K.founders to TeVar(
        te = "వ్యవస్థాపకులు",
        latn = "Vyavasthaapakulu"
    ),
    K.boardOfDirectors to TeVar(
        te = "డైరెక్టర్ల బోర్డు",
        latn = "Directorla Board"
    ),
    K.yourName to TeVar(
        te = "మీ పేరు",
        latn = "Mee Paeru"
    ),
    K.photoSyncedSuccess to TeVar(
        te = "ఫోటో విజయవంతంగా సింక్ చేయబడింది",
        latn = "Photo vijayavanthangaa sync chaeyabadindhi"
    ),
    K.syncFailed to TeVar(
        te = "సింక్ విఫలమైంది: ",
        latn = "Sync viphalamaindhi: "
    ),
    K.noGoogleAccountLinked to TeVar(
        te = "Google ఖాతా లింక్ చేయబడలేదు",
        latn = "Google khaathaa link chaeyabadalaedhu"
    ),
    K.noPhotoInGoogleAccount to TeVar(
        te = "Google ఖాతాలో ఫోటో లేదు",
        latn = "Google khaathaalo photo laedhu"
    ),
    K.syncGooglePhoto to TeVar(
        te = "Google ఫోటోను సింక్ చేయండి",
        latn = "Google photo nu sync chaeyandi"
    ),
    K.forgotPassword to TeVar(
        te = "పాస్‌వర్డ్ మర్చిపోయారా?",
        latn = "Password marchipoayaaraa?"
    ),
    K.confirmIdentityBeforeNewPassword to TeVar(
        te = "కొత్త పాస్‌వర్డ్‌ను సెట్ చేయడానికి ముందు మీ గుర్తింపును నిర్ధారించండి.",
        latn = "Kottha password nu set chaeyadaaniki mundhu mee gurthimpunu nirdhaarinchandi."
    ),
    K.incorrectPassword to TeVar(
        te = "తప్పు పాస్‌వర్డ్",
        latn = "Thappu password"
    ),
    K.verifyAndContinue to TeVar(
        te = "ధృవీకరించి కొనసాగించండి",
        latn = "Dhruveekarinchi konasaaginchandi"
    ),
    K.resetEmailSent to TeVar(
        te = "రీసెట్ ఈమెయిల్ %s కి పంపబడింది",
        latn = "Reset email %s ki pampabadindhi"
    ),
    K.createNewPassword to TeVar(
        te = "మీ కొత్త పాస్‌వర్డ్‌ను సృష్టించండి",
        latn = "Mee kottha password nu srushtinchandi"
    ),
    K.updatePassword to TeVar(
        te = "పాస్‌వర్డ్‌ను అప్‌డేట్ చేయండి",
        latn = "Password nu update chaeyandi"
    ),
    K.atLeast6Chars to TeVar(
        te = "కనీసం 6 అక్షరాలు",
        latn = "Kaneesam 6 aksharaalu"
    ),
    K.passwordsMatch to TeVar(
        te = "పాస్‌వర్డ్‌లు సరిపోలాయి",
        latn = "Passwordlu saripoalaayi"
    ),
    K.passwordUpdated to TeVar(
        te = "పాస్‌వర్డ్ అప్‌డేట్ చేయబడింది!",
        latn = "Password update chaeyabadindhi!"
    ),
    K.returningToSecuritySettings to TeVar(
        te = "సెక్యూరిటీ సెట్టింగ్స్‌కి తిరిగి వెళ్తోంది...",
        latn = "Security settings ki thirigi velthoandhi..."
    ),
    K.signedInWithGoogleCreatePassword to TeVar(
        te = "మీరు Google తో సైన్ ఇన్ అయ్యారు. ఈమెయిల్‌తో కూడా లాగిన్ అవ్వడానికి పాస్‌వర్డ్‌ను సృష్టించండి.",
        latn = "Meeru Google tho sign in ayyaaru. Email tho koodaa login avvadaaniki password nu srushtinchandi."
    ),
    K.passwordCreated to TeVar(
        te = "పాస్‌వర్డ్ సృష్టించబడింది!",
        latn = "Password srushtinchabadindhi!"
    ),
    K.canNowSignInWithEmail to TeVar(
        te = "మీరు ఇప్పుడు ఈమెయిల్‌తో కూడా సైన్ ఇన్ అవ్వవచ్చు.",
        latn = "Meeru ippudu email tho koodaa sign in avvavachchu."
    ),
    K.unlink to TeVar(
        te = "అన్‌లింక్",
        latn = "Unlink"
    ),
    K.unlinkGoogleAccount to TeVar(
        te = "Google ఖాతాను అన్‌లింక్ చేయాలా?",
        latn = "Google khaathaani unlink chaeyaalaa?"
    ),
    K.unlinkGoogleDesc to TeVar(
        te = "అన్‌లింక్ చేసిన తర్వాత మీరు ఈమెయిల్ మరియు పాస్‌వర్డ్‌తో సైన్ ఇన్ అవ్వాలి.",
        latn = "Unlink chaesina tharvaatha meeru email mariyu password tho sign in avvaali."
    ),
    K.mustCreatePasswordFirst to TeVar(
        te = "Google ఖాతాను అన్‌లింక్ చేయడానికి ముందు మీరు పాస్‌వర్డ్‌ను సృష్టించాలి.",
        latn = "Google khaathaani unlink chaeyadaaniki mundhu meeru password nu srushtinchaali."
    ),
    K.password to TeVar(
        te = "పాస్‌వర్డ్",
        latn = "Password"
    ),
    K.passwordSet to TeVar(
        te = "పాస్‌వర్డ్ సెట్ చేయబడింది",
        latn = "Password set chaeyabadindhi"
    ),
    K.noPasswordSet to TeVar(
        te = "పాస్‌వర్డ్ సెట్ చేయలేదు",
        latn = "Password set chaeyalaedhu"
    ),
    K.thisActionIsPermanent to TeVar(
        te = "ఈ చర్య శాశ్వతమైనది",
        latn = "Ee charya shaashvathamainadhi"
    ),
    K.deleteAccountWarning to TeVar(
        te = "మీ ఖాతాను తొలగిస్తే మీ షెడ్యూల్, నోట్స్ మరియు విద్యా ప్రాధాన్యతలు తొలగించబడతాయి. దీన్ని తిరిగి పొందలేరు.",
        latn = "Mee khaathaani tholagisthae mee schedule, notes mariyu vidhyaa praadhaanyathalu tholaginchabadathaayi. Dheennee thirigi pondhalaeru."
    ),
    K.iUnderstandContinue to TeVar(
        te = "నాకు అర్థమైంది, కొనసాగించండి",
        latn = "Naaku arthamaindhi, konasaaginchandi"
    ),
    K.confirmDeletionDesc to TeVar(
        te = "మీ ఖాతాను శాశ్వతంగా తొలగించడానికి క్రింద DELETE అని టైప్ చేయండి.",
        latn = "Mee khaathaani shaashvathangaa tholaginchadaaniki krindha DELETE ani type chaeyandi."
    ),
    K.typeDeleteToConfirm to TeVar(
        te = "నిర్ధారించడానికి DELETE అని టైప్ చేయండి",
        latn = "Nirdhaarinchadaaniki DELETE ani type chaeyandi"
    ),
    K.returningToAuth to TeVar(
        te = "లాగిన్ స్క్రీన్‌కి తిరిగి వెళ్తోంది...",
        latn = "Login screen ki thirigi velthoandhi..."
    ),
    K.deleteAccountPermanently to TeVar(
        te = "ఖాతాను శాశ్వతంగా తొలగించండి",
        latn = "Khaathaani shaashvathangaa tholaginchandi"
    ),
    K.unlinkGoogleDescNoPassword to TeVar(
        te = "Google ను అన్‌లింక్ చేయడానికి ముందు మీ ఈమెయిల్ కోసం పాస్‌వర్డ్‌ను సృష్టించాలి.",
        latn = "Google nu unlink chaeyadaaniki mundhu mee email koasam password nu srushtinchaali."
    ),
    K.unlinkGoogleDescHasPassword to TeVar(
        te = "ఖచ్చితంగా Google ఖాతాను అన్‌లింక్ చేయాలనుకుంటున్నారా? మీరు ఈమెయిల్ మరియు పాస్‌వర్డ్‌తో లాగిన్ అవ్వవచ్చు.",
        latn = "Khachchithangaa Google khaathaani unlink chaeyalanukuntunnaaraa? Meeru email mariyu password tho login avvavachchu."
    ),
    K.verificationFailed to TeVar(
        te = "ధృవీకరణ విఫలమైంది",
        latn = "Dhruveekarana viphalamaindhi"
    ),
    K.refresh to TeVar(
        te = "రిఫ్రెష్",
        latn = "Refresh"
    ),
    K.isRequired to TeVar(
        te = "అవసరం",
        latn = "Avasaram"
    ),
    K.documents to TeVar(
        te = "డాక్యుమెంట్లు",
        latn = "Documentlu"
    ),
    K.emailPassword to TeVar(
        te = "ఈమెయిల్ & పాస్‌వర్డ్",
        latn = "Email & Password"
    ),
    K.connected to TeVar(
        te = "కనెక్ట్ అయింది",
        latn = "Connect ayindhi"
    ),
    K.notConnected to TeVar(
        te = "కనెక్ట్ కాలేదు",
        latn = "Connect kaalaedhu"
    ),
    K.create to TeVar(
        te = "సృష్టించండి",
        latn = "Srushtinchandi"
    ),
    K.linkedAccountsInfoText to TeVar(
        te = "Google ఖాతాను లింక్ చేయడం వల్ల వేగంగా సైన్ ఇన్ అవ్వవచ్చు.",
        latn = "Google khaathaani link chaeyadam valla vaegangaa sign in avvavachchu."
    ),
    K.linkGoogle to TeVar(
        te = "Google ఖాతాను లింక్ చేయండి",
        latn = "Google khaathaani link chaeyandi"
    ),
    K.unlinkGoogle to TeVar(
        te = "Google ఖాతాను అన్‌లింక్ చేయండి",
        latn = "Google khaathaani unlink chaeyandi"
    ),
    K.unlinkConfirm to TeVar(
        te = "Google ఖాతాను అన్‌లింక్ చేయాలా?",
        latn = "Google khaathaani unlink chaeyaalaa?"
    ),
    K.unlinkMessage to TeVar(
        te = "మీరు ఖచ్చితంగా మీ Google ఖాతాను అన్‌లింక్ చేయాలనుకుంటున్నారా?",
        latn = "Meeru khachchithangaa mee Google khaathaani unlink chaeyalanukuntunnaaraa?"
    ),
    K.createPasswordMsg to TeVar(
        te = "Google అన్‌లింక్ చేయడానికి ముందు, మీ ఈమెయిల్ కోసం పాస్‌వర్డ్‌ను సెట్ చేయాలి.",
        latn = "Google unlink chaeyadaaniki mundhu, mee email koasam password nu set chaeyaali."
    ),
    K.createPasswordFirst to TeVar(
        te = "దయచేసి ముందుగా పాస్‌వర్డ్‌ను సృష్టించండి",
        latn = "Dhayachaesi mundhuga password nu srushtinchandi"
    ),
    K.noAccountFound to TeVar(
        te = "ఈ ఈమెయిల్‌తో ఏ ఖాతా కనుగొనబడలేదు",
        latn = "Ee email tho ae khaathaa kanugonabadalaedhu"
    ),
    K.invalidEmailFormat to TeVar(
        te = "చెల్లని ఈమెయిల్ ఫార్మాట్",
        latn = "Chellani email format"
    ),
    K.authFailed to TeVar(
        te = "ఆథెంటికేషన్ విఫలమైంది",
        latn = "Authentication viphalamaindhi"
    ),
    K.firstNameTooShort to TeVar(
        te = "మొదటి పేరు కనీసం 2 అక్షరాలు ఉండాలి",
        latn = "Modati paeru kaneesam 2 aksharaalu undaali"
    ),
    K.invalidRegisterNumber to TeVar(
        te = "చెల్లని రిజిస్టర్ నంబర్",
        latn = "Chellani register number"
    ),
    K.passwordTooShort to TeVar(
        te = "పాస్‌వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి",
        latn = "Password kaneesam 6 aksharaalu undaali"
    ),
    K.signupFailedNoUser to TeVar(
        te = "సైన్ అప్ విఫలమైంది - యూజర్ సృష్టించబడలేదు",
        latn = "Sign up viphalamaindhi - user srushtinchabadalaedhu"
    ),
    K.signupFailed to TeVar(
        te = "సైన్ అప్ విఫలమైంది",
        latn = "Sign Up viphalamaindhi"
    ),
    K.failedToUnlink to TeVar(
        te = "అన్‌లింక్ చేయడం విఫలమైంది",
        latn = "Unlink chaeyadam viphalamaindhi"
    ),
    K.showPassword to TeVar(
        te = "పాస్‌వర్డ్ చూపించు",
        latn = "Password choopinchu"
    ),
    K.hidePassword to TeVar(
        te = "పాస్‌వర్డ్ దాచు",
        latn = "Password dhaachu"
    ),
    K.home to TeVar(
        te = "హోమ్",
        latn = "Home"
    ),
    K.calendar to TeVar(
        te = "క్యాలెండర్",
        latn = "Calendar"
    ),
    K.notes to TeVar(
        te = "నోట్స్",
        latn = "Notes"
    ),
    K.notesDriveTab to TeVar(
        te = "నోట్స్ డ్రైవ్",
        latn = "Notes Drive"
    ),
    K.collegeSiteTab to TeVar(
        te = "కాలేజీ సైట్",
        latn = "College Site"
    ),
    K.notAvailable to TeVar(
        te = "అందుబాటులో లేదు",
        latn = "Andhubbaatulo laedhu"
    ),
    K.readMore to TeVar(
        te = "మరింత చదవండి",
        latn = "Marintha chadavandi"
    ),
    K.today to TeVar(
        te = "ఈరోజు",
        latn = "Eeroaju"
    ),
    K.done to TeVar(
        te = "పూర్తయింది",
        latn = "Poorthayindhi"
    ),
    K.linkedin to TeVar(
        te = "LinkedIn",
        latn = "LinkedIn"
    ),
    K.github to TeVar(
        te = "GitHub",
        latn = "GitHub"
    ),
    K.labForBatch to TeVar(
        te = "బ్యాచ్ %s కోసం ల్యాబ్: %s",
        latn = "Batch %s koasam Lab: %s"
    ),
    K.authorAttribution to TeVar(
        te = " - %s",
        latn = " - %s"
    ),
    K.batchLabelFormat to TeVar(
        te = "బ్యాచ్ %s",
        latn = "Batch %s"
    ),
    K.registerRangeFormat to TeVar(
        te = "రిజిస్టర్: %s",
        latn = "Register: %s"
    ),
    K.studentsCountFormat to TeVar(
        te = "%s విద్యార్థులు",
        latn = "%s Vidhyaarthulu"
    ),
    K.newExamSchedule to TeVar(
        te = "కొత్త ఎగ్జామ్ షెడ్యూల్: %s",
        latn = "Kottha Exam Schedule: %s"
    ),
    K.newExam to TeVar(
        te = "కొత్త ఎగ్జామ్: %s",
        latn = "Kottha Exam: %s"
    ),
    K.examDatesRange to TeVar(
        te = "తేదీలు: %s - %s",
        latn = "Thaedheelu: %s - %s"
    ),
    K.newHolidayAdded to TeVar(
        te = "కొత్త సెలవు జోడించబడింది",
        latn = "Kottha selavu joadinchabadindhi"
    ),
    K.newEvent to TeVar(
        te = "కొత్త ఈవెంట్: %s",
        latn = "Kottha Event: %s"
    ),
    K.eventOnDate to TeVar(
        te = "%s నాడు %s",
        latn = "%s naadu %s"
    ),
    K.newNotice to TeVar(
        te = "కొత్త నోటీస్",
        latn = "Kottha Notice"
    ),
    K.dailyUpdateFormat to TeVar(
        te = "రోజువారీ అప్‌డేట్ (%s)",
        latn = "Roajuvaaree Update (%s)"
    ),
    K.newClassEvent to TeVar(
        te = "కొత్త క్లాస్ ఈవెంట్: %s",
        latn = "Kottha Class Event: %s"
    ),
    K.clipboardPdfLinkLabel to TeVar(
        te = "PDF లింక్",
        latn = "PDF Link"
    ),
    K.rmkTitle to TeVar(
        te = "RMK",
        latn = "RMK"
    ),
    K.groupOfInstitutions to TeVar(
        te = "గ్రూప్ ఆఫ్ ఇన్‌స్టిట్యూషన్స్",
        latn = "Group of Institutions"
    ),
    K.roleAdmin to TeVar(
        te = "అడ్మిన్",
        latn = "Admin"
    ),
    K.admin to TeVar(
        te = "అడ్మిన్",
        latn = "Admin"
    ),
    K.accessDeniedRoleMustUseAdmin to TeVar(
        te = "యాక్సెస్ నిరాకరించబడింది: %s రోల్ అడ్మిన్ ప్యానెల్‌ను ఉపయోగించాలి",
        latn = "Access niraakarinchabadindhi: %s role admin panel nu upuyoaginchaali"
    ),
    K.failedToLoadNotes to TeVar(
        te = "నోట్స్ లోడ్ చేయడం విఫలమైంది",
        latn = "Notes load chaeyadam viphalamaindhi"
    ),
    K.unknownError to TeVar(
        te = "తెలియని లోపం",
        latn = "Theliyani loapam"
    ),
    K.notesDrive to TeVar(
        te = "నోట్స్ డ్రైవ్",
        latn = "Notes Drive"
    ),
)

# Neram — Mini Project Presentation
### Real-Time Academic Management System for Engineering Colleges

---

**Project Title:** Neram — A Multi-Platform Academic Portal  
**Department:** Electronics and Communication Engineering  
**Institution:** RMD Engineering College  
**Developer:** Elvan Parthasarathy  
**Batch:** 2023–2027  
**Guide:** *(Faculty Guide Name)*  
**Academic Year:** 2025–2026

---

## Slide 1 — Title Slide

> **NERAM**  
> நேரம் — *A Real-Time Academic Management System*  
> Multi-Platform | Cross-Role | Cloud-Synced  

**Platforms:** Web Application (PWA) · Android Student App · Android Admin App  
**Technologies:** React 19 · Kotlin · Jetpack Compose · Firebase · Tesseract OCR

---

## Slide 2 — Abstract

**Neram** is a full-stack, real-time academic management system that digitizes and centralizes academic workflows for engineering colleges. The system enables administrators and faculty to manage timetables, exam schedules, academic calendars, and study materials through a web-based dashboard — while students access all information instantly through a native Android application or Progressive Web App.

The project addresses the inefficiency of manual timetable distribution and unstructured communication channels (e.g., WhatsApp, printed notices) by providing a unified platform with **role-based access control**, **real-time cloud synchronization**, and **offline-capable mobile access**.

**Key Innovation:** A custom-built OCR engine (**Elvan Agazhi**) that converts printed academic calendar PDFs into structured digital data using Tesseract.js, eliminating the need for manual data entry.

---

## Slide 3 — Problem Statement

Current academic information flow in engineering colleges suffers from:

| # | Problem | Consequence |
|---|---|---|
| 1 | Timetable changes shared via WhatsApp | Information gets buried, missed, or reaches students late |
| 2 | Exam schedules distributed as photos/PDFs | Not searchable, no push notifications, inconsistent formats |
| 3 | No centralized academic calendar | Students miss deadlines, holidays, and events |
| 4 | Study materials scattered across Google Drive links | Difficult to discover, no organization by subject |
| 5 | No real-time announcement system | Critical updates fail to reach all students |
| 6 | Manual timetable preparation | Time-consuming, error-prone, no digital version control |
| 7 | No dedicated mobile application | Students rely on screenshots and browser bookmarks |

**Need:** A unified digital system that provides real-time, structured, role-managed academic data delivery across web and mobile platforms.

---

## Slide 4 — Objectives

1. **Design and develop** a multi-platform academic portal (Web + Android) with real-time data synchronization
2. **Implement** a role-based access control system with four tiers: Super Admin, Faculty, Student Rep, and Student
3. **Build** a native Android application using Kotlin and Jetpack Compose with offline caching and push notifications
4. **Create** a centralized admin dashboard with 16 management modules for academic data operations
5. **Develop** an OCR-based calendar digitization engine (Elvan Agazhi) that converts PDF academic calendars into structured data
6. **Ensure** zero-cost deployment using free-tier cloud services (Firebase, Vercel)

---

## Slide 5 — System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                        │
├──────────────┬──────────────────┬─────────────────────────────┤
│  Student     │  Student         │  Admin                      │
│  Web App     │  Android App     │  Web Portal + Android App   │
│  (React PWA) │  (Jetpack        │  (React + Kotlin WebView)   │
│              │   Compose)       │                              │
├──────────────┴──────────────────┴─────────────────────────────┤
│                     APPLICATION LAYER                         │
├───────────────────────────────────────────────────────────────┤
│  Authentication  │  Role-Based Access  │  Real-Time Listeners │
│  (Firebase Auth) │  Control (RBAC)     │  (Firebase onValue)  │
├──────────────────┴─────────────────────┴──────────────────────┤
│                       DATA LAYER                              │
├───────────────────────────────────────────────────────────────┤
│  Firebase Realtime Database (Cloud)                           │
│  ├── users/           — User profiles & roles                 │
│  ├── schedules/       — Timetables, exams, courses            │
│  ├── calendars/       — Academic calendar events              │
│  ├── updates/         — Live announcements                    │
│  ├── notes_drive/     — Study material metadata               │
│  └── events/          — College events                        │
├───────────────────────────────────────────────────────────────┤
│  Room Database (Local — Android Only)                         │
│  └── Offline cache of schedules, exams, and calendar data     │
├───────────────────────────────────────────────────────────────┤
│                     PROCESSING LAYER                          │
├───────────────────────────────────────────────────────────────┤
│  Elvan Agazhi OCR Engine                                      │
│  pdf.js → Tesseract.js → calendarParser → CalendarBuilder     │
│  (PDF rendering)  (OCR extraction)  (Text parsing)  (Editor)  │
└───────────────────────────────────────────────────────────────┘
```

---

## Slide 6 — Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **Web Frontend** | React 19 + Vite 7 | Component-based SPA, fast HMR, code-splitting |
| **Mobile Frontend** | Kotlin + Jetpack Compose | Modern declarative UI, Material Design 3, native performance |
| **Admin Wrapper** | Kotlin WebView + NativeBridge | Reuses web admin without rewriting; native auth bridge |
| **Backend/Database** | Firebase Realtime Database | NoSQL, real-time listeners, free tier (1GB/10GB transfer) |
| **Authentication** | Firebase Auth + Google OAuth 2.0 | Industry-standard security, supports institutional accounts |
| **OCR Engine** | Tesseract.js 7.0 (WASM) | Client-side OCR, no server required, multi-language support |
| **PDF Processing** | pdf.js 5.4 | Mozilla's PDF renderer, canvas-based page extraction |
| **Offline Storage** | Room (SQLite) | Android Jetpack persistence library, survives app restarts |
| **Background Sync** | WorkManager | Guaranteed periodic sync even when app is killed |
| **Hosting** | Vercel (CDN) | Auto-deploy from Git, global edge network, zero config |
| **Styling** | Vanilla CSS | Full design control, macOS Sequoia-inspired glassmorphism |
| **Routing** | React Router DOM 7 | Client-side routing with hash-based admin routing |

---

## Slide 7 — Module Description

### 7.1 Student Portal Modules

| Module | Description | Platform |
|---|---|---|
| **Home Dashboard** | Daily schedule, live announcements, quick stats | Web + Android |
| **Timetable Viewer** | Weekly period grid with subject, faculty, and room info | Web + Android |
| **Exam Schedules** | CT, IA, Model, Semester, Practical exams — date-sorted display | Web + Android |
| **Academic Calendar** | Monthly calendar view with holiday/event markers | Web + Android |
| **Notes Viewer** | Subject-organized materials with built-in PDF viewer | Web + Android |
| **Settings** | Profile management, theme toggle, security, account deletion | Web + Android |
| **User Directory** | Searchable list of registered students | Web + Android |
| **Onboarding** | First-time setup wizard — batch, department, section selection | Android only |
| **Push Notifications** | Real-time alerts for new exams and schedule changes | Android only |

### 7.2 Admin Portal Modules (16 Total)

| # | Module | Function | Access Level |
|---|---|---|---|
| 1 | **Admin Dashboard** | System overview, quick-access cards | All Admins |
| 2 | **Schedule Manager** | Central timetable builder — edit once, sync to all sections | All Admins |
| 3 | **Exam Manager** | Create/edit/delete exam schedules with date-sorted publishing | All Admins |
| 4 | **Calendar Manager** | Elvan Agazhi OCR pipeline + published event manager | Super + Faculty |
| 5 | **Event Manager** | College event creation with date/time/description | Super + Faculty |
| 6 | **Notes Manager** | Upload/organize study materials with approval workflow | Super + Faculty |
| 7 | **Special Class Manager** | Schedule extra/remedial/makeup sessions | All Admins |
| 8 | **Faculty Directory** | Department-wise faculty listing with contact info | Super only |
| 9 | **User Management** | View/search all registered users | Super only |
| 10 | **Admin Role Manager** | Promote/demote users across role hierarchy | Role-dependent |
| 11 | **Resource Manager** | Share syllabus, regulation docs, academic resources | Super + Faculty |
| 12 | **Pending Requests** | Review and process user approval requests | Super only |
| 13 | **Archive Tool** | Semester transition and data archival | Super (Desktop) |
| 14 | **Live Updates** | Post real-time daily announcements | All Admins |
| 15 | **Admin Profile** | View/edit admin user profile | All Admins |
| 16 | **Admin Settings** | System configuration and preferences | All Admins |

---

## Slide 8 — Elvan Agazhi: OCR Calendar Engine

### Problem
Colleges publish academic calendars as printed PDF documents. Manually entering 100+ events into a digital system is tedious and error-prone.

### Solution — Automated OCR Pipeline

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│  Upload  │───▶│  Render  │───▶│   OCR    │───▶│    Parse     │───▶│  Review  │
│   PDF    │    │  Pages   │    │  Extract │    │  Structure   │    │  & Edit  │
│          │    │ (pdf.js) │    │(Tesseract│    │(calendarParser│   │(Calendar │
│          │    │          │    │   .js)   │    │   .js)       │    │ Builder) │
└─────────┘    └──────────┘    └──────────┘    └──────────────┘    └────┬─────┘
                                                                        │
                                                                        ▼
                                                                  ┌──────────┐
                                                                  │  Push to │
                                                                  │ Firebase │
                                                                  │(1 click) │
                                                                  └──────────┘
```

### Technical Implementation

| Step | Component | Technology | Description |
|---|---|---|---|
| 1 | **PDF Loader** | `pdfLoader.js` (pdf.js) | Renders each page to `<canvas>` at configurable scale |
| 2 | **Crop Selection** | Cropper.js | Admin selects the relevant column on Page 1; same crop applied to all pages |
| 3 | **OCR Engine** | `ocrEngine.js` (Tesseract.js WASM) | Extracts text from cropped canvas regions with configurable PSM modes |
| 4 | **Text Cleanup** | `textCleanup.js` | Removes OCR artifacts, normalizes whitespace |
| 5 | **Calendar Parser** | `calendarParser.js` | Pattern-matching engine: extracts dates, events, working day markers, holidays |
| 6 | **Calendar Builder** | `CalendarBuilder.jsx` | Visual month-by-month editor for reviewing and correcting parsed data |
| 7 | **Firebase Export** | `calendarExport.js` | Converts structured data to RTDB format and pushes to `calendars/{batch}/events` |

### Key Features
- **Batch Processing** — OCR all pages automatically with single crop reference
- **Comparison View** — Side-by-side original PDF vs extracted text for verification
- **Editable Output** — Every field (date, event, type) is editable before publishing
- **Client-Side Only** — Zero server cost; all processing runs in the browser

---

## Slide 9 — Role-Based Access Control (RBAC)

### Hierarchical Role Model

```
          ┌──────────────┐
          │ SUPER ADMIN  │  (HOD / Principal / IT Staff)
          │ Full Access   │
          └──────┬───────┘
                 │ can promote/demote ▼
          ┌──────┴───────┐
          │ FACULTY ADMIN │  (Department Coordinators)
          │ Dept-Level    │
          └──────┬───────┘
                 │ can promote/demote ▼
          ┌──────┴───────┐
          │ STUDENT REP   │  (Class Representatives)
          │ Section-Level │
          └──────┬───────┘
                 │ (no management access) ▼
          ┌──────┴───────┐
          │   STUDENT     │  (All registered students)
          │  Read-Only    │
          └──────────────┘
```

### Permission Matrix

| Action | Super Admin | Faculty | Rep | Student |
|---|---|---|---|---|
| View timetable/exams | ✅ | ✅ | ✅ | ✅ |
| Edit own section schedule | ✅ | ✅ | ✅ | ❌ |
| Edit any section schedule | ✅ | ✅ | ❌ | ❌ |
| Manage calendar/events | ✅ | ✅ | ❌ | ❌ |
| Upload notes | ✅ | ✅ | ❌ | ❌ |
| View all users | ✅ | ✅ | ✅ | ❌ |
| Promote/demote roles | ✅ | ✅ (limited) | ✅ (rep only) | ❌ |
| Manage structure | ✅ | ❌ | ❌ | ❌ |
| Archive/semester tools | ✅ | ❌ | ❌ | ❌ |

### Database Security Rules
Security is enforced at the **database level** using Firebase Security Rules:
```json
"schedules": {
    "$section": {
        ".write": "auth != null && (
            root.child('users/' + auth.uid + '/role').val() === 'super_admin' ||
            root.child('users/' + auth.uid + '/role').val() === 'faculty' ||
            root.child('users/' + auth.uid + '/role').val() === 'rep'
        )"
    }
}
```
Even if the UI is bypassed, unauthorized writes are **rejected by Firebase itself**.

---

## Slide 10 — Data Flow Diagrams

### 10.1 Admin Publishes Exam Schedule

```
Admin (Web)                    Firebase RTDB                    Student Devices
    │                              │                                │
    │  1. Create exam              │                                │
    │  (type, subjects, dates)     │                                │
    │─────────────────────────────▶│                                │
    │                              │  2. Writes to                  │
    │                              │  schedules/{batch}/{dept}/     │
    │                              │  {section}/exams[]             │
    │                              │────────────────────────────────▶│
    │                              │  3. Real-time listener fires   │
    │                              │                                │
    │                              │                     4. UI updates instantly
    │                              │                     (Web: onValue callback)
    │                              │                     (Android: Firebase listener
    │                              │                      → ViewModel → Compose UI)
```

### 10.2 Elvan Agazhi Calendar Pipeline

```
Admin uploads PDF ──▶ pdf.js renders pages ──▶ Cropper.js selects region
                                                        │
           Firebase RTDB ◀── calendarExport ◀── CalendarBuilder ◀── calendarParser
           calendars/{batch}/events[]          (visual editor)    (regex patterns)
                  │                                                      ▲
                  ▼                                                      │
        All Student Apps                                         Tesseract.js OCR
        (instant sync)                                           (WASM, client-side)
```

---

## Slide 11 — Implementation Highlights

### 11.1 Real-Time Synchronization
```javascript
// Firebase Real-Time Listener (React)
onValue(ref(db, `schedules/${batch}/${dept}/${section}`), (snapshot) => {
    setMasterData(snapshot.val());
    // UI re-renders instantly with new data
});
```
**Latency:** Changes appear on all connected devices within **~1-2 seconds**.

### 11.2 Offline-First Android Architecture
```kotlin
// Room Database Entity
@Entity(tableName = "notifications")
data class NotificationEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String, val message: String,
    val timestamp: Long, val type: String
)

// WorkManager Background Sync
class DailyUpdateWorker : CoroutineWorker() {
    override suspend fun doWork(): Result {
        // Fetch latest data from Firebase → Cache in Room DB
        // Generate notifications for changes
    }
}
```

### 11.3 Multi-Entry Web Application
```javascript
// vite.config.js — Two separate entry points
build: {
    rollupOptions: {
        input: {
            main: 'index.html',    // Student Portal (BrowserRouter)
            admin: 'admin.html',   // Admin Portal (HashRouter)
        }
    }
}
```
Student and Admin portals share the same codebase but have **independent routing and authentication flows**.

### 11.4 Native Bridge (Admin WebView)
```kotlin
// AdminMainActivity.kt — JavaScript ↔ Kotlin bridge
webView.addJavascriptInterface(object {
    @JavascriptInterface
    fun setTheme(isDark: Boolean) {
        // Update Android status bar and navigation bar colors
        window.statusBarColor = if (isDark) Color.BLACK else Color.parseColor("#F2F2F7")
    }
}, "NativeBridge")
```

---

## Slide 12 — Testing & Validation

| Test Category | Method | Result |
|---|---|---|
| **Production Build** | `npm run build` (Vite 7) | ✅ 906 modules compiled, zero errors |
| **Role Access Control** | Manual testing across 4 role types | ✅ All permissions enforced correctly |
| **Real-Time Sync** | Admin edit → Student device update | ✅ Updates in 1-2 seconds |
| **Offline Mode** | Android app with WiFi disabled | ✅ Cached data accessible, syncs on reconnect |
| **OCR Accuracy** | Elvan Agazhi on college calendar PDFs | ✅ 90%+ accuracy with manual correction support |
| **Cross-Platform** | Chrome, Firefox, Safari, Android 10+ | ✅ Consistent rendering |
| **Security Rules** | Unauthorized write attempts | ✅ Rejected by Firebase Rules |

---

## Slide 13 — Results & Output

### Project Metrics

| Metric | Value |
|---|---|
| **Development Duration** | 4 months (Dec 2025 – Mar 2026) |
| **Total Git Commits** | 304+ |
| **Web Modules (Vite Build)** | 906 modules |
| **Admin Management Tools** | 16 modules |
| **Android Compose Screens** | 16+ screens |
| **Android Apps** | 2 (Student Native + Admin WebView) |
| **CSS Styling** | 63,000+ lines |
| **Database Security Rules** | 94 lines covering 12 data nodes |
| **Operating Cost** | ₹0/month (Firebase + Vercel free tiers) |

### Platform Availability

| Platform | Type | Technology | Status |
|---|---|---|---|
| **Student Web** | Progressive Web App | React 19 + Vite | ✅ Production |
| **Admin Web** | Single Page App | React 19 (Hash Router) | ✅ Production |
| **Student Android** | Native App | Kotlin + Jetpack Compose | ✅ Production |
| **Admin Android** | WebView Wrapper | Kotlin + WebView | ✅ Production |

---

## Slide 14 — Advantages

1. **Real-Time** — Any admin change reflects on all student devices within seconds
2. **Zero Cost** — Deployed entirely on free-tier cloud services
3. **Offline Capable** — Android app works without internet using Room database
4. **Role-Secure** — Four-tier RBAC with database-level enforcement
5. **Multi-Platform** — Web (desktop + mobile) + Native Android (2 apps)
6. **OCR Innovation** — Elvan Agazhi automates PDF calendar digitization
7. **Custom-Built** — Designed around the actual Batch → Department → Section hierarchy
8. **Scalable** — Supports unlimited departments with no code changes
9. **Portable** — Only 4 config files need changing to deploy for any college
10. **Premium Design** — macOS Sequoia-inspired UI with glassmorphism and micro-animations

---

## Slide 15 — Limitations & Future Scope

### Current Limitations
- No iOS (iPhone/iPad) native app
- OCR accuracy depends on PDF print quality
- Requires internet for admin-side operations
- No built-in attendance tracking or assignment submission

### Future Enhancements

| Feature | Estimated Effort | Description |
|---|---|---|
| iOS App | 4–6 weeks | SwiftUI implementation matching Android feature set |
| Attendance System | 2–3 weeks | Digital attendance for faculty with analytics |
| Assignment Submission | 3–4 weeks | Students submit work through the app |
| GPA Calculator | 1 week | Auto-calculate from exam marks |
| Analytics Dashboard | 2–3 weeks | Usage stats, student engagement metrics |
| Multi-College Support | 4–6 weeks | Deploy for sister institutions without forking |
| Push-to-All | 1 week | Mass emergency notification system |
| AI-Powered OCR | 2 weeks | Improve Agazhi accuracy with ML preprocessing |

---

## Slide 16 — Conclusion

**Neram** successfully demonstrates a complete, production-ready academic management system that:

- ✅ Replaces fragmented communication channels with a **unified, real-time platform**
- ✅ Provides **native mobile access** with offline capability and push notifications
- ✅ Implements **strict role-based security** at both application and database levels
- ✅ Introduces **OCR-based automation** (Elvan Agazhi) to digitize academic calendars
- ✅ Achieves **zero operational cost** using free-tier cloud infrastructure
- ✅ Delivers a **premium user experience** across all platforms

The system is designed to be **institution-agnostic** — with minimal configuration changes, it can be deployed for any engineering college following a Batch → Department → Section hierarchy.

---

## Slide 17 — References

1. Firebase Documentation — https://firebase.google.com/docs
2. React 19 Documentation — https://react.dev
3. Jetpack Compose Documentation — https://developer.android.com/compose
4. Tesseract.js — https://tesseract.projectnaptha.com
5. pdf.js — https://mozilla.github.io/pdf.js
6. Vite Build Tool — https://vite.dev
7. Material Design 3 — https://m3.material.io
8. Android WorkManager — https://developer.android.com/topic/libraries/architecture/workmanager

---

## Slide 18 — Thank You

> **NERAM — நேரம்**  
> *Making academic time management effortless.*

**Developer:** Elvan Parthasarathy  
**Repository:** github.com/ElvanParthasarathy/RmdNeram  
**Department:** ECE, RMD Engineering College

---

*Questions?*

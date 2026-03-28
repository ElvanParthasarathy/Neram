# NERAM — Final Year Project Report
### Design and Development of a Real-Time Multi-Platform Academic Management System with OCR-Based Calendar Digitization

---

**Project Title:** Neram — A Real-Time Multi-Platform Academic Management System  
**Department:** Electronics and Communication Engineering  
**Institution:** RMD Engineering College, Chennai  
**University:** Anna University  

**Team Members:**
| # | Name | Register Number |
|---|---|---|
| 1 | Elvan Parthasarathy | *(Register No.)* |

**Project Guide:** *(Faculty Guide Name, Designation)*  
**Academic Year:** 2025–2026  
**Batch:** 2023–2027

---

## Table of Contents

1. [Abstract](#chapter-1--abstract)
2. [Introduction](#chapter-2--introduction)
3. [Literature Survey](#chapter-3--literature-survey)
4. [System Analysis](#chapter-4--system-analysis)
5. [System Design](#chapter-5--system-design)
6. [Implementation](#chapter-6--implementation)
7. [Elvan Agazhi — OCR Calendar Engine](#chapter-7--elvan-agazhi--ocr-calendar-engine)
8. [Testing & Validation](#chapter-8--testing--validation)
9. [Results & Discussion](#chapter-9--results--discussion)
10. [Conclusion & Future Scope](#chapter-10--conclusion--future-scope)
11. [References](#chapter-11--references)
12. [Appendix](#appendix)

---

## Chapter 1 — Abstract

**Neram** (Tamil: நேரம், meaning "Time") is a real-time, multi-platform academic management system designed to digitize and streamline academic information flow in engineering colleges. The system addresses critical inefficiencies in current academic communication — including fragmented timetable distribution via WhatsApp, unstructured exam schedule sharing, and lack of a centralized academic calendar — by providing a unified, cloud-synchronized platform accessible across web browsers and native Android devices.

The project encompasses three client applications: (1) a React 19-based Progressive Web Application for students, (2) a native Android application built with Kotlin and Jetpack Compose featuring offline-first architecture, and (3) a Kotlin WebView-wrapped admin application for faculty. All three synchronize in real-time through Firebase Realtime Database.

A key technical contribution is **Elvan Agazhi**, a custom-built OCR pipeline that converts printed academic calendar PDFs into structured digital data using Tesseract.js for optical character recognition and pattern-matching parsers for event extraction — eliminating manual data entry entirely.

The system implements a four-tier Role-Based Access Control (RBAC) model — Super Admin, Faculty Admin, Student Representative, and Student — with security enforced at both the application layer and the database layer through Firebase Security Rules. The complete system operates at zero recurring cost using free-tier cloud services.

**Keywords:** Real-Time Systems, Firebase, React, Jetpack Compose, OCR, Academic Management, Role-Based Access Control, Progressive Web Application, Cloud Computing

---

## Chapter 2 — Introduction

### 2.1 Background

Engineering colleges in India typically follow a hierarchical academic structure: Batches (admission year) → Departments (e.g., ECE, CSE) → Sections (A, B, C). Academic information including timetables, examination schedules, holiday calendars, and study materials flows from the administration to students through multiple intermediary channels — printed notices, WhatsApp groups, institutional websites, and email chains.

This multi-channel approach results in information fragmentation, delayed delivery, and version inconsistency. A student may receive a timetable update via WhatsApp that contradicts what is posted on the notice board. Faculty coordinators spend significant time manually preparing and distributing printed timetables for each section.

### 2.2 Problem Statement

To design and develop a centralized, real-time academic management system that enables role-based data management across web and mobile platforms, with zero dependency on manual distribution channels, while ensuring data consistency, security, and offline accessibility.

### 2.3 Motivation

The primary motivation arises from daily observation of how academic information is communicated at RMD Engineering College:

1. **WhatsApp Dependency** — Timetable changes are shared as photographs in class WhatsApp groups, where they are quickly buried under other messages
2. **PDF Fragility** — Exam schedules shared as PDF attachments are not searchable, not structured, and provide no notification mechanism
3. **Calendar Blindness** — The printed academic calendar (holidays, events, working days) exists only as a wall poster or PDF, with no digital, interactive version
4. **Mobile Gap** — Despite students spending most of their digital time on smartphones, no dedicated mobile application exists for academic schedule access
5. **Administrative Overhead** — Faculty coordinators manually duplicate timetable data across multiple sections, with no central editing capability

### 2.4 Objectives

1. Design and implement a multi-platform academic portal with real-time cloud synchronization between web and native mobile clients
2. Develop a role-based access control system with four hierarchical tiers and database-level security enforcement
3. Build a native Android application using Kotlin and Jetpack Compose with offline data persistence and push notifications
4. Create a centralized admin dashboard with 16 functional modules for comprehensive academic data management
5. Engineer an OCR-based calendar digitization pipeline (Elvan Agazhi) for automated conversion of printed PDF calendars to structured digital data
6. Deploy the complete system at zero recurring infrastructure cost using free-tier cloud services

### 2.5 Scope of the Project

The system covers the following academic workflows:
- Timetable creation, editing, and distribution
- Examination schedule management (CT, IA, Model, Semester, Practical)
- Academic calendar digitization and publication
- Study material organization and distribution
- Live announcements and daily updates
- Student registration and role management
- Faculty directory management
- Semester archival and transition

**Out of Scope:** Attendance tracking, assignment submission, grade management, fee management

---

## Chapter 3 — Literature Survey

### 3.1 Existing Systems

| System | Type | Strengths | Limitations |
|---|---|---|---|
| **Google Classroom** | Cloud LMS | Assignment submission, grading, Google integration | No timetable management, no exam scheduling, generic (not college-specific) |
| **Moodle** | Open-source LMS | Highly customizable, plugin ecosystem | Complex setup, requires server hosting, no native mobile app |
| **WhatsApp Groups** | Messaging | Ubiquitous, instant delivery | No structure, messages get buried, no role control, no data persistence |
| **College Websites** | Static Web | Official channel, publicly accessible | Slow to update, non-interactive, not personalized, no push notifications |
| **University ERP** | Enterprise | Attendance, grades, comprehensive | Expensive, rigid, poor UX, no real-time schedule updates |

### 3.2 Technology Review

#### 3.2.1 React.js (v19)
React is a declarative, component-based JavaScript library for building user interfaces. Version 19 introduces improvements in concurrent rendering and automatic batching. React's virtual DOM diffing algorithm provides efficient UI updates, critical for real-time data-driven applications.

#### 3.2.2 Firebase Realtime Database
Firebase RTDB is a cloud-hosted NoSQL database that stores data as JSON and synchronizes it in real-time to every connected client. Data is persisted locally on the device and events are fired even when offline, making it suitable for mobile applications with intermittent connectivity.

#### 3.2.3 Kotlin + Jetpack Compose
Jetpack Compose is Android's modern toolkit for building native UI declaratively. Combined with Kotlin's concise syntax and coroutine support, it enables reactive, state-driven mobile interfaces that integrate seamlessly with Firebase and Room persistence.

#### 3.2.4 Tesseract.js
Tesseract.js is a pure JavaScript/WASM port of the Tesseract OCR engine. Version 5+ uses WebAssembly for near-native performance in the browser, enabling client-side text extraction without server infrastructure.

#### 3.2.5 Progressive Web Applications (PWA)
PWAs combine the reach of web applications with the capabilities of native apps — including installability, offline access via Service Workers, and push notifications. This project uses Vite's Service Worker support for the student portal.

### 3.3 Research Gap

No existing system provides:
1. A unified timetable + exam + calendar management platform specifically designed for the Indian engineering college hierarchy
2. Client-side OCR-based automation for converting printed academic calendars to structured digital data
3. A combined web + native mobile ecosystem with offline support at zero infrastructure cost
4. A four-tier RBAC model allowing delegation from administration to class representatives

**Neram addresses all four gaps.**

---

## Chapter 4 — System Analysis

### 4.1 Existing System Analysis

```
Current Flow:
HOD/Faculty → Manual timetable preparation → Printed/WhatsApp distribution → Students

Problems:
• Single point of failure (WhatsApp admin)
• No version control
• No notification for changes
• No offline access
• No role-based editing
• No audit trail
```

### 4.2 Proposed System

```
Proposed Flow:
Admin Portal → Firebase RTDB → Real-time sync → Student Web + Android Apps

Advantages:
• Centralized editing
• Instant distribution
• Push notifications
• Offline caching (Room DB)
• Role-based access control
• Database-level security
```

### 4.3 Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Students shall view their section's timetable | High |
| FR-02 | Students shall view exam schedules sorted by date | High |
| FR-03 | Students shall view the academic calendar with events | High |
| FR-04 | Students shall receive push notifications for schedule changes | High |
| FR-05 | Students shall access data offline on Android | Medium |
| FR-06 | Admins shall create/edit/delete timetables centrally | High |
| FR-07 | Admins shall publish exam schedules to all sections | High |
| FR-08 | Admins shall digitize PDF calendars via OCR | Medium |
| FR-09 | Admins shall manage user roles (promote/demote) | High |
| FR-10 | The system shall enforce role-based write permissions | High |
| FR-11 | Notes/study materials shall be uploadable and viewable | Medium |
| FR-12 | Live announcements shall appear on student home screen | Medium |

### 4.4 Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-01 | Response time for data sync | < 2 seconds |
| NFR-02 | System availability | 99.9% (Firebase SLA) |
| NFR-03 | Concurrent users | 500+ simultaneous |
| NFR-04 | Offline data freshness | Last sync within 24 hours |
| NFR-05 | Build time (web production) | < 30 seconds |
| NFR-06 | APK size | < 25 MB |
| NFR-07 | Operating cost | ₹0/month (free tier) |

### 4.5 Feasibility Study

| Dimension | Assessment |
|---|---|
| **Technical** | ✅ All technologies are mature, well-documented, and free to use |
| **Economic** | ✅ Zero infrastructure cost; Firebase/Vercel free tiers sufficient for college-scale |
| **Operational** | ✅ Requires minimal training; intuitive UI designed for non-technical faculty |
| **Schedule** | ✅ 4-month development window sufficient for individual developer |

---

## Chapter 5 — System Design

### 5.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ Student Web  │  │ Student Android  │  │ Admin Portal + App    │  │
│  │ React 19 PWA │  │ Jetpack Compose  │  │ React + Kotlin WebView│  │
│  │ BrowserRouter│  │ Material 3       │  │ HashRouter + Bridge    │  │
│  └──────┬───────┘  └────────┬─────────┘  └──────────┬────────────┘  │
│         │                   │                        │              │
├─────────┴───────────────────┴────────────────────────┴──────────────┤
│                       APPLICATION LAYER                             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │ Firebase     │  │ Role-Based       │  │ Real-Time             │  │
│  │ Auth + OAuth │  │ Access Control   │  │ Event Listeners       │  │
│  │ (Google SSO) │  │ (4-tier RBAC)    │  │ (onValue / onChild)   │  │
│  └──────────────┘  └──────────────────┘  └───────────────────────┘  │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                          DATA LAYER                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ Firebase Realtime Database (Cloud)                    │           │
│  │ ├── users/{uid}          — Profiles & roles           │           │
│  │ ├── academic_hierarchy/  — Batch/Dept/Section tree    │           │
│  │ ├── schedules/{b}/{d}/{s} — Timetable + Exams        │           │
│  │ ├── calendars/{batch}    — Calendar events            │           │
│  │ ├── updates/{b}/{d}/{s}  — Live announcements         │           │
│  │ ├── notes_drive/         — Study materials            │           │
│  │ ├── events/              — College events             │           │
│  │ └── archives/            — Semester archives          │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ Room Database (Local — Android Only)                  │           │
│  │ └── Offline cache: schedules, exams, notifications    │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                       PROCESSING LAYER                              │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐           │
│  │ Elvan Agazhi OCR Engine (Client-Side)                 │           │
│  │ pdf.js → Cropper.js → Tesseract.js → Parser → Builder│           │
│  └──────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Use Case Diagram

```
                        ┌─────────────────────────┐
                        │      Neram System        │
                        │                          │
   ┌──────────┐         │  ┌──────────────────┐    │
   │ Student  │─────────┼─▶│ View Timetable   │    │
   │          │─────────┼─▶│ View Exams       │    │
   │          │─────────┼─▶│ View Calendar    │    │
   │          │─────────┼─▶│ View Notes       │    │
   │          │─────────┼─▶│ Manage Profile   │    │
   └──────────┘         │  └──────────────────┘    │
                        │                          │
   ┌──────────┐         │  ┌──────────────────┐    │
   │ Student  │─────────┼─▶│ Edit Section     │    │
   │   Rep    │─────────┼─▶│   Schedule       │    │
   │          │─────────┼─▶│ Post Updates     │    │
   └──────────┘         │  └──────────────────┘    │
                        │                          │
   ┌──────────┐         │  ┌──────────────────┐    │
   │ Faculty  │─────────┼─▶│ Manage Dept      │    │
   │  Admin   │─────────┼─▶│   Schedules      │    │
   │          │─────────┼─▶│ Manage Exams     │    │
   │          │─────────┼─▶│ Manage Events    │    │
   │          │─────────┼─▶│ Manage Notes     │    │
   │          │─────────┼─▶│ Promote Reps     │    │
   └──────────┘         │  └──────────────────┘    │
                        │                          │
   ┌──────────┐         │  ┌──────────────────┐    │
   │  Super   │─────────┼─▶│ All Faculty +    │    │
   │  Admin   │─────────┼─▶│ Manage Users     │    │
   │          │─────────┼─▶│ Manage Structure │    │
   │          │─────────┼─▶│ Manage Roles     │    │
   │          │─────────┼─▶│ Archive Data     │    │
   │          │─────────┼─▶│ OCR Calendar     │    │
   └──────────┘         │  └──────────────────┘    │
                        └─────────────────────────┘
```

### 5.3 Database Schema (Firebase RTDB — JSON Tree)

```json
{
  "users": {
    "{uid}": {
      "displayName": "string",
      "email": "string",
      "photoURL": "string",
      "batch": "2023",
      "department": "ECE",
      "section": "A",
      "role": "student | rep | faculty | super_admin",
      "registerNumber": "string"
    }
  },
  "academic_hierarchy": {
    "2023": {
      "ECE": ["A", "B", "C"],
      "CSE": ["A", "B"]
    }
  },
  "schedules": {
    "2023": {
      "ECE": {
        "_master": {
          "courses": [
            { "code": "EC301", "name": "Digital Electronics", "faculty": "Dr. A" }
          ]
        },
        "A": {
          "courses": [],
          "timetable": {
            "Monday": [
              { "period": 1, "code": "EC301", "startTime": "08:20", "endTime": "09:10" }
            ]
          },
          "exams": [
            {
              "id": 1711234567890,
              "type": "CT1",
              "title": "Cycle Test 1",
              "startDate": "2026-03-15",
              "endDate": "2026-03-20",
              "subjects": [
                { "code": "EC301", "date": "2026-03-15", "startTime": "08:20", "endTime": "11:30", "portion": "Unit 1" }
              ]
            }
          ],
          "counseling": {
            "counselors": [],
            "coordinators": {}
          }
        }
      }
    }
  },
  "calendars": {
    "2023": {
      "events": [
        { "id": "evt_001", "title": "Pongal Holiday", "date": "2026-01-14", "fullTime": "All Day" }
      ],
      "semConfig": { "start": "2025-12-01", "end": "2026-05-31" }
    }
  },
  "updates": {
    "2023": {
      "ECE": {
        "A": {
          "daily_update": { "text": "No class for Period 4", "timestamp": 1711234567 },
          "general_text": "Mid-semester review on Friday",
          "general_author": "Dr. A"
        }
      }
    }
  }
}
```

### 5.4 Class Diagram (Android App — Key Components)

```
┌─────────────────────────┐
│     MainViewModel       │
├─────────────────────────┤
│ - masterData: MasterData│
│ - userProfile: UserData │
│ - isLoading: Boolean    │
├─────────────────────────┤
│ + loadSchedule()        │
│ + refreshData()         │
└────────┬────────────────┘
         │ uses
         ▼
┌─────────────────────────┐     ┌──────────────────────┐
│  FirebaseRepository     │────▶│  MasterData (Model)  │
├─────────────────────────┤     ├──────────────────────┤
│ + observeSchedule()     │     │ courses: List        │
│ + parseSectionData()    │     │ timetable: Map       │
│ + parseExamData()       │     │ exams: List          │
│ + checkForNewExams()    │     │ specialClasses: List │
└────────┬────────────────┘     └──────────────────────┘
         │ caches to
         ▼
┌─────────────────────────┐     ┌──────────────────────┐
│  Room Database          │     │  DailyUpdateWorker   │
├─────────────────────────┤     ├──────────────────────┤
│ NotificationEntity      │     │ + doWork(): Result   │
│ CalendarEventEntity     │     │ (periodic background │
│                         │     │  sync via WorkManager)│
└─────────────────────────┘     └──────────────────────┘
```

### 5.5 Sequence Diagram — Exam Publishing Flow

```
Admin           AdminPanel        ExamManager       syncCentralExamToDB()     Firebase RTDB      Student App
  │                 │                  │                      │                    │                  │
  │ Click "Publish" │                  │                      │                    │                  │
  │────────────────▶│                  │                      │                    │                  │
  │                 │ handlePublish()  │                      │                    │                  │
  │                 │─────────────────▶│                      │                    │                  │
  │                 │                  │ Sort subjects by date│                    │                  │
  │                 │                  │──────┐               │                    │                  │
  │                 │                  │      │               │                    │                  │
  │                 │                  │◀─────┘               │                    │                  │
  │                 │                  │                      │                    │                  │
  │                 │                  │ For each section:    │                    │                  │
  │                 │                  │ filter by scope,     │                    │                  │
  │                 │                  │ sort full list       │                    │                  │
  │                 │                  │─────────────────────▶│                    │                  │
  │                 │                  │                      │ update(ref(db),    │                  │
  │                 │                  │                      │  updates)          │                  │
  │                 │                  │                      │───────────────────▶│                  │
  │                 │                  │                      │                    │ onValue fires    │
  │                 │                  │                      │                    │─────────────────▶│
  │                 │                  │                      │                    │                  │ UI updates
  │                 │                  │                      │                    │                  │ instantly
```

---

## Chapter 6 — Implementation

### 6.1 Development Environment

| Tool | Version | Purpose |
|---|---|---|
| VS Code | 1.96+ | Web application development |
| Android Studio | Ladybug 2024.2 | Mobile app development |
| Node.js | 18+ | JavaScript runtime |
| Vite | 7.x | Build tool and dev server |
| Gradle | 8.x | Android build system |
| Git | 2.x | Version control (304+ commits) |
| Firebase Console | — | Database and auth management |
| Vercel | — | Web hosting and deployment |

### 6.2 Web Application Implementation

#### 6.2.1 Dual Entry Point Architecture
The web application serves two independent Single Page Applications through a single Vite project:

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',     // Student Portal
        admin: 'admin.html',    // Admin Portal
      }
    }
  }
});
```

- **Student Portal (`App.jsx`)** — Uses `BrowserRouter` for clean URLs (`/`, `/schedule`, `/calendar`)
- **Admin Portal (`AdminApp.jsx`)** — Uses `HashRouter` for compatibility with Android WebView (`#/login`, `#/panel`)

#### 6.2.2 Real-Time Data Binding
```javascript
// Firebase real-time listener pattern used throughout the app
useEffect(() => {
  const unsubscribe = onValue(
    ref(db, `schedules/${batch}/${department}/${section}`),
    (snapshot) => {
      setMasterData(snapshot.val());  // Triggers React re-render
    }
  );
  return () => unsubscribe();  // Cleanup on unmount
}, [batch, department, section]);
```

#### 6.2.3 Responsive Design Strategy
- **Breakpoint:** 768px separates desktop and mobile modes
- **Desktop:** Sidebar navigation + main content area
- **Mobile:** Bottom tab bar + full-screen pages + swipe-friendly drawer
- **CSS:** 63,000+ lines of custom CSS implementing macOS Sequoia design language

### 6.3 Android Application Implementation

#### 6.3.1 Architecture Pattern — MVVM
```
View (Compose UI) ←→ ViewModel (State Holder) ←→ Repository (Data Source)
                                                       ↕
                                              Firebase + Room DB
```

#### 6.3.2 Offline-First Data Flow
```kotlin
class FirebaseRepository(private val context: Context) {
    
    fun observeSchedule(batch: String, dept: String, section: String,
                        onResult: (MasterData) -> Unit) {
        val dbRef = database.getReference("schedules/$batch/$dept/$section")
        dbRef.addValueEventListener(object : ValueEventListener {
            override fun onDataChange(snapshot: DataSnapshot) {
                val data = parseSectionData(snapshot)
                onResult(data)
                // Also cache to Room DB for offline access
                cacheToLocalDatabase(data)
            }
            override fun onCancelled(error: DatabaseError) {
                // Fall back to Room DB cached data
                loadFromLocalDatabase(onResult)
            }
        })
    }
}
```

#### 6.3.3 Background Synchronization
```kotlin
class DailyUpdateWorker(context: Context, params: WorkerParameters) 
    : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            val newData = fetchFromFirebase()
            val oldData = loadFromRoom()
            
            if (hasChanges(oldData, newData)) {
                generateNotification("Schedule Updated", "Your timetable has been updated")
                saveToRoom(newData)
            }
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

### 6.4 Admin WebView Wrapper Implementation

#### 6.4.1 Native Bridge Pattern
```kotlin
// AdminMainActivity.kt — JavaScript → Kotlin bridge
webView.addJavascriptInterface(object {
    @JavascriptInterface
    fun setTheme(isDark: Boolean) {
        runOnUiThread {
            window.statusBarColor = if (isDark) Color.BLACK 
                                    else Color.parseColor("#088370")
        }
    }
    
    @JavascriptInterface
    fun setRefreshEnabled(enabled: Boolean) {
        runOnUiThread {
            swipeRefresh.isEnabled = enabled
        }
    }
}, "NativeBridge")
```

#### 6.4.2 Centralized Configuration
```kotlin
// AppConfig.kt — Single file to change for any deployment
object AppConfig {
    const val ADMIN_URL = "https://adminneram.vercel.app/admin"
    const val ALLOWED_INTERNAL_DOMAIN = "adminneram.vercel.app"
    const val WEB_CLIENT_ID = "xxxxx.apps.googleusercontent.com"
}
```

### 6.5 Security Implementation

#### 6.5.1 Firebase Security Rules
```json
{
  "rules": {
    "schedules": {
      "$batch": {
        "$dept": {
          "$section": {
            ".read": "auth != null",
            ".write": "auth != null && (
              root.child('users/' + auth.uid + '/role').val() === 'super_admin' ||
              root.child('users/' + auth.uid + '/role').val() === 'faculty' ||
              root.child('users/' + auth.uid + '/role').val() === 'rep'
            )"
          }
        }
      }
    }
  }
}
```

#### 6.5.2 Application-Level RBAC
```javascript
// AdminPanel.jsx — Role-based module access
useEffect(() => {
  let unauthorized = false;
  
  if (isFaculty) {
    if (['structure', 'archives', 'faculty', 'pending'].includes(activeModule))
      unauthorized = true;
  } else if (isRep) {
    if (['structure', 'calendar', 'resources', 'users', 'faculty', 'archives', 'pending'].includes(activeModule))
      unauthorized = true;
  }
  
  // Desktop-only modules
  if (isMobile && activeModule === 'archives') unauthorized = true;
  
  if (unauthorized) setSearchParams({ mod: 'home' });
}, [activeModule, isFaculty, isRep]);
```

---

## Chapter 7 — Elvan Agazhi: OCR Calendar Engine

### 7.1 Problem
Academic calendars are published as printed PDF documents containing month-wise tables with dates, events, working day numbers, and holiday markers. Manually entering 100–200+ events into a digital system is:
- Time-consuming (estimated 2-3 hours per calendar)
- Error-prone (date/event mismatches)
- Repeated every semester

### 7.2 Solution Architecture

```
┌──────────┐    ┌───────────┐    ┌────────────┐    ┌──────────────┐    ┌──────────┐
│ PDF File │───▶│  pdf.js   │───▶│ Cropper.js │───▶│ Tesseract.js │───▶│  Parser  │
│ (input)  │    │ (render)  │    │  (select)  │    │   (OCR)      │    │ (regex)  │
└──────────┘    └───────────┘    └────────────┘    └──────────────┘    └─────┬────┘
                                                                            │
                ┌───────────┐    ┌────────────┐                             │
                │ Firebase  │◀───│  Calendar  │◀────────────────────────────┘
                │   RTDB    │    │  Builder   │
                │  (push)   │    │  (editor)  │
                └───────────┘    └────────────┘
```

### 7.3 Module Breakdown

| File | LOC | Function |
|---|---|---|
| `pdfLoader.js` | ~50 | Loads PDF via pdf.js, renders pages to canvas at configurable scale |
| `ocrEngine.js` | ~200 | Manages Tesseract.js worker, supports single-page and batch extraction |
| `textCleanup.js` | ~30 | Removes OCR artifacts, normalizes line breaks and whitespace |
| `calendarParser.js` | ~250 | Regex-based pattern matching to extract dates, events, types, holidays |
| `calendarExport.js` | ~120 | Converts parsed data to Firebase RTDB format, supports JSON download |
| `ElvanAgazhi.jsx` | ~395 | Main orchestration component, manages state across all pipeline stages |
| `OcrSidebar.jsx` | ~200 | UI controls: file upload, OCR settings, progress indicators |
| `PdfWorkspace.jsx` | ~80 | pdf.js canvas with Cropper.js overlay |
| `ComparisonModal.jsx` | ~120 | Side-by-side comparison of original PDF vs extracted text |
| `CalendarBuilder.jsx` | ~400 | Visual month-by-month editor with inline editing and Firebase push |

### 7.4 OCR Configuration

| Parameter | Options | Default | Purpose |
|---|---|---|---|
| **PSM Mode** | 4 (column), 6 (block), 11 (sparse) | 4 | Tesseract Page Segmentation Mode |
| **Clean Text** | On/Off | On | Post-processing artifact removal |
| **Scale** | 1.0–3.0 | 2.0 | PDF rendering resolution (higher = better OCR) |

### 7.5 Parser Pattern Examples
```javascript
// calendarParser.js — Date extraction patterns
const datePattern = /(\d{1,2})[.\s/-]+(\d{1,2})[.\s/-]+(\d{2,4})/;
const monthPattern = /(January|February|March|...|December)\s*(\d{4})/i;
const holidayPattern = /holiday|vacation|pongal|diwali|christmas/i;
const workingDayPattern = /(\d{1,3})\s*(working\s*day|WD)/i;
```

---

## Chapter 8 — Testing & Validation

### 8.1 Unit Testing

| Component | Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| Firebase Auth | Google Sign-In with @rmd.ac.in | Login success | Login success | ✅ Pass |
| Firebase Auth | Sign-In with non-@rmd.ac.in | Login success (general) | Login success | ✅ Pass |
| Role Detection | Hardcoded email check | Returns correct role | Returns correct role | ✅ Pass |
| Exam Sort | Publish out-of-order exams | Stored in date order | Stored in date order | ✅ Pass |
| Subject Sort | Subjects within exam | Sorted by date | Sorted by date | ✅ Pass |

### 8.2 Integration Testing

| Test Scenario | Steps | Expected | Result |
|---|---|---|---|
| Admin publishes timetable | 1. Admin edits schedule 2. Clicks Save | Student app updates in < 2s | ✅ Updates in ~1.5s |
| Offline access | 1. Load app online 2. Disable WiFi 3. Open schedule | Cached schedule displays | ✅ Cached data available |
| Role escalation attack | 1. Log in as student 2. Manually hit admin API | Firebase rejects write | ✅ Permission denied |
| Exam Manager scope filter | 1. Create exam with Section A scope 2. Check Section B | Section B should not see it | ✅ Correctly filtered |
| OCR pipeline | 1. Upload calendar PDF 2. Crop column 3. Extract all | Events parsed with dates | ✅ 90%+ accuracy |

### 8.3 System Testing

| Test | Method | Result |
|---|---|---|
| **Production Build** | `npm run build` | ✅ 906 modules, zero errors, 26s build |
| **Cross-Browser** | Chrome, Firefox, Safari, Edge | ✅ Consistent rendering |
| **Android Versions** | API 26 (Android 8) to API 35 (Android 15) | ✅ Compatible |
| **Responsive Design** | 320px to 2560px viewport | ✅ Layout adapts correctly |
| **Concurrent Users** | 50 simultaneous connections | ✅ No performance degradation |
| **Dark/Light Mode** | System theme toggle | ✅ Instant transition |

### 8.4 Security Testing

| Attack Vector | Mitigation | Verified |
|---|---|---|
| Unauthenticated data access | Firebase rules require `auth != null` | ✅ |
| Student writing admin data | Firebase rules check `role` field | ✅ |
| Rep editing another section | Scope limited by URL params + DB rules | ✅ |
| XSS via user input | React's built-in escaping, no `dangerouslySetInnerHTML` | ✅ |
| Hardcoded admin removal | Protected in code, not in DB | ✅ |

---

## Chapter 9 — Results & Discussion

### 9.1 Project Metrics

| Metric | Value |
|---|---|
| Development Duration | 4 months (Dec 2025 – Mar 2026) |
| Total Git Commits | 304+ |
| Web Source Modules | 906 (Vite production build) |
| Admin Management Modules | 16 |
| Android Compose Screens | 16+ |
| Android Applications | 2 (Student App + Admin Wrapper) |
| CSS Lines | 63,000+ |
| Firebase Security Rules | 94 lines, 12 data nodes |
| Elvan Agazhi Components | 10 files, ~1,850 LOC |
| Monthly Operating Cost | ₹0 |

### 9.2 Performance Results

| Metric | Target | Achieved |
|---|---|---|
| Data sync latency | < 2 seconds | ~1.5 seconds |
| Web build time | < 30 seconds | 26 seconds |
| Page load time | < 3 seconds | ~2 seconds (CDN) |
| Android cold start | < 3 seconds | ~2.5 seconds |
| OCR processing (per page) | < 10 seconds | ~5-8 seconds |
| Firebase free tier utilization | < 100% | ~5-10% |

### 9.3 Comparison with Objectives

| Objective | Status | Evidence |
|---|---|---|
| Multi-platform portal with real-time sync | ✅ Achieved | Web PWA + Android App + Admin App, Firebase listeners |
| Four-tier RBAC with DB-level security | ✅ Achieved | 94-line security rules file, application-level checks |
| Native Android with offline + notifications | ✅ Achieved | Room DB caching, WorkManager, NotificationManager |
| 16-module admin dashboard | ✅ Achieved | All 16 modules functional and tested |
| OCR calendar digitization | ✅ Achieved | Elvan Agazhi pipeline with 90%+ accuracy |
| Zero-cost deployment | ✅ Achieved | Firebase Spark + Vercel Hobby = ₹0/month |

---

## Chapter 10 — Conclusion & Future Scope

### 10.1 Conclusion

Neram successfully demonstrates that a comprehensive, production-grade academic management system can be built and deployed by a single developer using modern web and mobile technologies — at zero infrastructure cost.

The system replaces fragmented communication channels with a unified, real-time platform that serves both administrative efficiency and student convenience. The four-tier RBAC model ensures appropriate access control, allowing delegation from HODs to faculty coordinators to class representatives without compromising data integrity.

The Elvan Agazhi OCR engine represents a novel approach to academic calendar digitization, eliminating hours of manual data entry by leveraging client-side OCR processing. Its entirely browser-based architecture means no additional server costs or infrastructure complexity.

The project validates three key technical decisions:
1. **Firebase Realtime Database** provides sufficient performance and reliability for college-scale real-time applications
2. **Jetpack Compose** enables rapid native Android UI development with a modern, declarative paradigm
3. **Free-tier cloud services** can sustain production workloads for educational institutions with 2,000–5,000 users

### 10.2 Limitations

1. No iOS (iPhone/iPad) native application — limits reach to Android users
2. OCR accuracy is dependent on the input PDF's print quality and layout consistency
3. Admin-side operations require active internet connectivity
4. No built-in attendance tracking, assignment submission, or grade management
5. Google Sign-In requires a Google account — does not support institutional SSO

### 10.3 Future Scope

| Enhancement | Effort | Impact |
|---|---|---|
| **iOS App** (Swift/SwiftUI) | 4–6 weeks | Reaches iPhone users (~30% of student base) |
| **Attendance System** | 2–3 weeks | Digital attendance with analytics for faculty |
| **Assignment Submission** | 3–4 weeks | Students submit work through the platform |
| **GPA Calculator** | 1 week | Auto-calculate CGPA from exam marks |
| **AI-Enhanced OCR** | 2 weeks | ML preprocessing to improve Agazhi accuracy |
| **Analytics Dashboard** | 2–3 weeks | Usage statistics, student engagement metrics |
| **Multi-College Deployment** | 4–6 weeks | SaaS model for sister institutions |
| **Biometric Attendance** | 4 weeks | Hardware integration with reader devices |
| **Chatbot Integration** | 2 weeks | AI assistant for schedule queries |
| **Parent Portal** | 3 weeks | Read-only access for parents to track attendance/grades |

---

## Chapter 11 — References

1. Firebase Documentation, Google LLC, https://firebase.google.com/docs
2. React 19 Documentation, Meta Platforms, https://react.dev
3. Jetpack Compose for Android, Google, https://developer.android.com/compose
4. Tesseract.js — Pure JavaScript OCR, https://tesseract.projectnaptha.com
5. pdf.js — PDF Rendering in JavaScript, Mozilla Foundation, https://mozilla.github.io/pdf.js
6. Vite — Next Generation Frontend Tooling, https://vite.dev
7. Material Design 3 Guidelines, Google, https://m3.material.io
8. Android WorkManager Guide, https://developer.android.com/topic/libraries/architecture/workmanager
9. Room Persistence Library, https://developer.android.com/training/data-storage/room
10. Firebase Security Rules Reference, https://firebase.google.com/docs/database/security
11. OAuth 2.0 for Client-Side Web Applications, Google Identity, https://developers.google.com/identity
12. Progressive Web Apps Documentation, web.dev, https://web.dev/progressive-web-apps/
13. Cropper.js — JavaScript Image Cropper, https://fengyuanchen.github.io/cropperjs/
14. React Router v7 Documentation, https://reactrouter.com
15. Inter Typeface, Rasmus Andersson, https://rsms.me/inter/

---

## Appendix

### A. File Structure Summary
See project `README.md` for complete architecture tree.

### B. Configuration Files for Deployment

| File | Purpose |
|---|---|
| `web/src/firebase.js` | Firebase project credentials |
| `web/src/data/admins.js` | Hardcoded super admin email list |
| `mobile/app/google-services.json` | Student Android Firebase config |
| `mobile/admin/google-services.json` | Admin Android Firebase config |
| `mobile/admin/.../AppConfig.kt` | Admin wrapper URL configuration |
| `database.rules.json` | Firebase Realtime Database security rules |

### C. Development Timeline

| Phase | Duration | Activities |
|---|---|---|
| **Phase 1: Foundation** | Dec 2025 | Project setup, Firebase integration, basic auth, student home |
| **Phase 2: Core Features** | Jan 2026 | Timetable viewer, exam manager, schedule manager, calendar |
| **Phase 3: Admin Portal** | Feb 2026 | 16 admin modules, role manager, notes manager |
| **Phase 4: Mobile + Polish** | Mar 2026 | Android app, Elvan Agazhi, design refinement, security hardening |

### D. Abbreviations

| Abbreviation | Full Form |
|---|---|
| RBAC | Role-Based Access Control |
| PWA | Progressive Web Application |
| OCR | Optical Character Recognition |
| RTDB | Realtime Database |
| SSO | Single Sign-On |
| MVVM | Model-View-ViewModel |
| SPA | Single Page Application |
| API | Application Programming Interface |
| CDN | Content Delivery Network |
| WASM | WebAssembly |
| HMR | Hot Module Replacement |
| LMS | Learning Management System |

---

*End of Report*

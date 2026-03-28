<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="web/src/assets/branding/navbar-logo-icon-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="web/src/assets/branding/navbar-logo-icon.svg">
    <img src="web/src/assets/branding/navbar-logo-icon.svg" alt="Neram" width="280" />
  </picture>
</p>

<p align="center">
  <strong>A full-stack academic portal for students, faculty, and administrators.</strong><br />
  Built with React, Firebase, and Kotlin (Jetpack Compose).
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20%7C%20Android-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Mobile-Kotlin%20%7C%20Jetpack%20Compose-7F52FF?style=flat-square&logo=kotlin&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-Firebase%20RTDB-FFCA28?style=flat-square&logo=firebase&logoColor=black" />
  <img src="https://img.shields.io/badge/Design-macOS%20Sequoia-000?style=flat-square&logo=apple&logoColor=white" />
</p>

---

## 📋 Overview

**Neram** (Tamil: நேரம், meaning "Time") is a comprehensive academic management system designed for RMD Engineering College. It provides students with real-time access to their timetables, exam schedules, academic calendars, and notes — while giving administrators a powerful dashboard to manage all academic data centrally.

The project spans **three applications** that work together as a unified ecosystem:

| Application | Technology | Purpose |
|---|---|---|
| **Student Web Portal** | React 19 + Vite | Full-featured PWA for students |
| **Student Mobile App** | Kotlin + Jetpack Compose | Native Android app (Material 3) |
| **Admin Portal** | React 19 (HashRouter) | Full admin dashboard (Web + Android Wrapper) |

---

## ✨ Key Features

### 🎓 Student Portal (Web + Native Android)

- **Home Dashboard** — Live daily updates, announcements, and at-a-glance schedule view
- **Timetable Viewer** — Weekly schedule with day/period navigation and real-time sync
- **Exam Schedules** — CT, IA, Model, Semester & Practical exam timetables sorted by date
- **Academic Calendar** — Powered by **Elvan Agazhi** (OCR-based PDF-to-Calendar engine)
- **Notes Section** — Study materials and resources hub with built-in PDF viewer
- **Profile & Settings** — Account management, display preferences, security (password change, account deletion)
- **User Directory** — Browse registered students
- **Dark/Light Mode** — System-aware theme with smooth transitions
- **Push Notifications** *(Android)* — Alerts for new exams, schedule changes, and announcements
- **Offline Mode** *(Android)* — Room Database caches all data locally
- **Background Sync** *(Android)* — WorkManager-based periodic data refresh

### 🛡️ Admin Portal (Web + Android Wrapper)

<table>
<tr><td>

**Academic Management**
- 📅 **Schedule Manager** — Central timetable editor, syncs across all sections
- 🏆 **Exam Manager** — Create exams (CT, IA, Model, Practical, Semester) with date-sorted publishing
- 📆 **Calendar Manager** — Powered by Elvan Agazhi PDF-to-Calendar engine
- 🎉 **Event Manager** — College event creation and management
- 📝 **Notes Manager** — Upload materials with approval workflow
- 🏫 **Special Class Manager** — Schedule extra/remedial classes

</td><td>

**Administration**
- 🛡️ **Admin Role Manager** — Promote/demote with strict role hierarchy
- 👥 **User Management** — View and manage all registered users
- 👨‍🏫 **Faculty Directory** — Department-wise faculty listing
- 📦 **Resource Manager** — Share academic resources
- ⏳ **Pending Requests** — Review approval queue
- 🗃️ **Archive Tool** — Semester transition management *(Desktop only)*

</td></tr>
</table>

### 🔮 Elvan Agazhi — The Calendar Engine

The calendar system is powered by **Elvan Agazhi**, a custom-built OCR pipeline that converts college academic calendar PDFs into structured digital data:

```
PDF Upload → OCR Extraction → Text Parsing → Calendar Builder → Firebase Push
     │              │               │               │               │
     ▼              ▼               ▼               ▼               ▼
  pdf.js      Tesseract.js    calendarParser   CalendarBuilder   Realtime DB
  renders     extracts text   structures       visual editor     syncs to all
  pages       from crops      into events      for corrections   student apps
```

- **Upload** any academic calendar PDF
- **Crop** the relevant columns on each page
- **OCR** extracts text using Tesseract.js (batch or single-page)
- **Parser** structures raw text into date/event/type entries
- **Calendar Builder** provides a visual editor to review and correct
- **One-Click Push** to Firebase — instantly live on all student devices

> Replaces the old Google Calendar API dependency with a fully self-contained, offline-capable system.

---

## 🏗️ Architecture

```
Neram/
├── web/                          # React Web Application
│   ├── src/
│   │   ├── App.jsx               # Student Portal (BrowserRouter)
│   │   ├── AdminApp.jsx          # Admin Portal (HashRouter)
│   │   ├── firebase.js           # Firebase configuration
│   │   ├── components/
│   │   │   ├── auth/             # Google Sign-In components
│   │   │   ├── features/         # CalendarBuilder, shared components
│   │   │   ├── navigation/       # Sidebar, Navbar, Mobile Nav, Admin Nav
│   │   │   └── ui/               # Splash screen, skeletons, date inputs, theme toggle
│   │   ├── pages/
│   │   │   ├── student/          # Home, Schedule, Calendar, Notes, Settings
│   │   │   ├── admin/
│   │   │   │   └── modules/      # 16 admin sub-modules
│   │   │   │       └── elvan-agazhi/  # OCR Calendar Engine
│   │   │   └── auth/             # Login, Signup, Setup
│   │   ├── styles/               # Domain-organized CSS (admin/, student/, settings/)
│   │   ├── contexts/             # ToastContext (global notifications)
│   │   ├── hooks/                # useSystemTheme, useSectionData
│   │   ├── data/                 # Hardcoded admin list, static data
│   │   └── utils/                # Time formatting, helpers
│   └── public/
│       ├── icons/                # App favicons (Student blue, Admin green)
│       └── manifests/            # PWA manifests (light/dark variants)
│
├── mobile/
│   ├── app/                      # 📱 Student Android App (Jetpack Compose)
│   │   └── src/main/java/.../
│   │       ├── ui/               # 16+ Compose screens
│   │       │   ├── home/         # Home dashboard
│   │       │   ├── schedule/     # Timetable viewer
│   │       │   ├── calendar/     # Academic calendar
│   │       │   ├── notes/        # Study materials
│   │       │   ├── profile/      # User profile
│   │       │   ├── settings/     # App settings
│   │       │   ├── onboarding/   # First-time setup
│   │       │   ├── auth/         # Login/signup
│   │       │   └── ...           # Alerts, directory, notifications, etc.
│   │       ├── data/
│   │       │   ├── repository/   # FirebaseRepository (single source of truth)
│   │       │   ├── model/        # MasterData, ExamSchedule, etc.
│   │       │   ├── local/        # Room Database entities & DAOs
│   │       │   └── preferences/  # SharedPreferences manager
│   │       └── workers/          # DailyUpdateWorker (background sync)
│   │
│   └── admin/                    # 🛡️ Admin Android App (WebView Wrapper)
│       └── src/main/java/.../
│           ├── AdminMainActivity.kt  # WebView shell + Google Sign-In bridge
│           └── AppConfig.kt          # ⚙️ Easy URL/domain configuration
│
├── neram.svg                     # Neram logo (gradient blue)
├── database.rules.json           # Firebase security rules
├── PRIVACY_POLICY.md             # App privacy policy
└── docs/
    ├── DEVELOPER_GUIDE.md        # Technical architecture guide
    ├── STUDENT_USER_MANUAL.md    # Student user manual
    ├── COLLEGE_INTEGRATION_PROPOSAL.md  # Deployment proposal
    └── RESTRUCTURING_WALKTHROUGH.md     # Codebase history
```

---

## 🔐 Role-Based Access Control

Neram uses a strict hierarchical role system:

| Role | Icon | Scope | Capabilities |
|---|---|---|---|
| **Super Admin** | 🔴 | Full system | All modules, manage all roles, archive tool |
| **Faculty Admin** | 🟣 | Department-level | Schedules, exams, events, manage reps, remove faculty |
| **Student Rep** | 🔵 | Section-level | Schedules, exams, events for their section only |
| **Student** | ⚪ | Read-only | View schedule, exams, calendar, notes |

> 🔒 Hardcoded admin emails (in `web/src/data/admins.js`) are protected and cannot be demoted via the UI.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite 7, React Router DOM 7 | Fast SPA with code splitting |
| **Styling** | Vanilla CSS (macOS Sequoia design) | Premium glassmorphism UI |
| **Mobile** | Kotlin, Jetpack Compose, Material 3 | Native Android experience |
| **Admin Wrapper** | Kotlin WebView + NativeBridge | Mobile admin access |
| **Database** | Firebase Realtime Database | Real-time sync across all platforms |
| **Auth** | Firebase Authentication + Google Sign-In | Secure `@rmd.ac.in` login |
| **Offline Storage** | Room Database (Android) | SQLite-based local cache |
| **Background Tasks** | WorkManager (Android) | Periodic data sync |
| **Calendar Engine** | Elvan Agazhi (Tesseract.js + pdf.js) | OCR PDF-to-Calendar pipeline |
| **Notifications** | Firebase + Android NotificationManager | Push alerts |
| **Icons** | React Icons (Remix Icon set) | Consistent iconography |
| **Typography** | Inter Variable (Google Fonts) | Modern, readable typeface |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Android Studio** (for mobile apps)
- **Firebase project** with Realtime Database enabled
- `google-services.json` in `mobile/app/` and `mobile/admin/`

### Web Application

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The web app serves **two entry points**:
- `index.html` → Student Portal (`/`)
- `admin.html` → Admin Portal (`/admin`)

### Android Student App

1. Open `mobile/` in Android Studio
2. Sync Gradle dependencies
3. Select the **`:app`** module
4. Run on emulator or connected device

### Android Admin App

1. Open `mobile/` in Android Studio
2. Select the **`:admin`** module
3. To change the website URL, edit `AppConfig.kt`:
   ```kotlin
   object AppConfig {
       const val ADMIN_URL = "https://your-domain.com/admin"
       const val ALLOWED_INTERNAL_DOMAIN = "your-domain.com"
       const val WEB_CLIENT_ID = "your-google-client-id"
   }
   ```
4. Build and run

---

## 🗄️ Firebase Database Structure

```
├── users/                    # All registered user profiles
│   └── {uid}/                # displayName, email, batch, department, section, role
│
├── academic_hierarchy/       # Batch → Department → Sections mapping
│   └── {batch}/{dept}/       # Array of section IDs ["A", "B", "C"]
│
├── schedules/                # All academic data (core)
│   └── {batch}/{dept}/
│       ├── _master/          # Master course list for the department
│       └── {section}/        # courses[], timetable{}, exams[], counseling{}
│
├── calendars/                # Academic calendar data
│   └── {batch}/
│       ├── config{}          # API configuration (legacy)
│       ├── semConfig{}       # Semester date range
│       └── events[]          # Calendar events (powered by Elvan Agazhi)
│
├── updates/                  # Live announcements
│   └── {batch}/{dept}/{sec}/ # daily_update{}, general_text, general_author
│
├── notes_drive/              # Study materials metadata
├── events/                   # College events
├── faculties_directory/      # Faculty information
├── archives/                 # Semester archive data
└── pending_requests/         # User approval queue
```

---

## 🎨 Design Philosophy

Neram follows a **macOS Sequoia-inspired** design language across both web and mobile:

- **Glassmorphism** — Frosted-glass sidebars, navigation bars, and modal overlays
- **Rounded Cards** — 24–32px border radius for a premium, soft aesthetic
- **Smooth Animations** — Cubic-bezier transitions and slide-in micro-interactions
- **System-Aware Theming** — Automatic dark/light mode matching the OS
- **Safe Area Handling** — Proper status bar/notch padding on Android devices
- **Responsive Layout** — Desktop sidebar collapses to mobile bottom nav at 768px
- **Dual Color Identity**:
  - 🔵 **Student App** — Gradient Blue (`#002DFF` → `#00B1FF`)
  - 🟢 **Admin App** — Elf Green (`#088370`)

---

## 📂 Documentation

| Document | Description |
|---|---|
| [`docs/STUDENT_USER_MANUAL.md`](docs/STUDENT_USER_MANUAL.md) | End-user guide for students |
| [`docs/ADMIN_PORTAL_GUIDE.md`](docs/ADMIN_PORTAL_GUIDE.md) | Admin portal guide for Super Admins, Faculty & Reps |
| [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md) | Technical architecture, setup, and development guide |
| [`docs/COLLEGE_INTEGRATION_PROPOSAL.md`](docs/COLLEGE_INTEGRATION_PROPOSAL.md) | Full deployment & handover proposal |
| [`docs/MINI_PROJECT_PRESENTATION.md`](docs/MINI_PROJECT_PRESENTATION.md) | Mini-project campus presentation |
| [`docs/FINAL_YEAR_PROJECT_REPORT.md`](docs/FINAL_YEAR_PROJECT_REPORT.md) | Final year academic project report |
| [`docs/COMPETITION_PRESENTATION.md`](docs/COMPETITION_PRESENTATION.md) | Inter-college competition pitch |
| [`docs/RESTRUCTURING_WALKTHROUGH.md`](docs/RESTRUCTURING_WALKTHROUGH.md) | Codebase restructuring history |
| [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) | App privacy policy |

---

## 📊 Project Stats

| Metric | Value |
|---|---|
| **Development Period** | December 2025 – March 2026 |
| **Total Commits** | 304+ |
| **Web Modules** | 906 (Vite production build) |
| **Admin Sub-Modules** | 16 management tools |
| **Android Screens** | 16+ Compose screens |
| **Android Apps** | 2 (Student Native + Admin WebView Wrapper) |
| **CSS Lines** | 63,000+ (mobile.css alone) |
| **Calendar Engine** | Elvan Agazhi (Tesseract OCR + pdf.js) |
| **Platforms** | Web (PWA) + Android ×2 |

---

## 👤 Author

**Elvan Parthasarathy**  
RMD Engineering College

---

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="web/src/assets/branding/navbar-logo-icon-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="web/src/assets/branding/navbar-logo-icon.svg">
    <img src="web/src/assets/branding/navbar-logo-icon.svg" alt="Neram Icon" width="40" />
  </picture>
</p>

<p align="center">
  <sub>Built with ❤️ for RMD Engineering College</sub>
</p>

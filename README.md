<p align="center">
  <img src="neram.svg" alt="Neram Logo" width="120" />
</p>

<h1 align="center">Neram</h1>

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
| **Admin Web Wrapper** | Kotlin WebView Shell | Native Android wrapper for the Admin Portal |

---

## ✨ Key Features

### 🎓 Student Portal (Web + Mobile)
- **Home Dashboard** — Live daily updates, announcements, and at-a-glance schedule view
- **Timetable Viewer** — Weekly schedule with day/period navigation and real-time sync
- **Exam Schedules** — CT, IA, Model, Semester & Practical exam timetables sorted by date
- **Academic Calendar** — Google Calendar integration with holiday/event rendering
- **Notes Section** — Study materials and resources hub
- **Profile & Settings** — Account management, display preferences, theme toggle, security (password change, account deletion)
- **User Directory** — Browse registered students
- **Dark/Light Mode** — System-aware theme with smooth transitions

### 🛡️ Admin Portal (Web)
- **Admin Dashboard** — Overview and quick-access module cards
- **Schedule Manager** — Central timetable editor that syncs across all sections
- **Exam Manager** — Create/edit/delete exam schedules (CT, IA, Model, Practical, Semester) with date-sorted publishing
- **Calendar Manager** — Google Calendar API configuration and semester date management
- **Event Manager** — College event creation and management
- **Notes Manager** — Upload and organize study materials with approval workflow
- **Faculty Directory** — Faculty listing with department filtering
- **User Management** — View and manage all registered users
- **Admin Role Manager** — Role-based access control (Super Admin → Faculty → Rep) with promote/demote actions
- **Special Class Manager** — Schedule extra/remedial classes
- **Resource Manager** — Share academic resources
- **Pending Requests** — Review and approve pending user requests
- **Archive Tool** — Semester transition and data archival (Desktop only)

### 📱 Native Android App
- **Jetpack Compose UI** — Fully native Material 3 design
- **Offline Support** — Room database for local caching
- **Push Notifications** — Firebase-powered alerts for new exams, schedule changes, and announcements
- **Background Sync** — WorkManager-based periodic data refresh
- **Onboarding Flow** — Guided setup for new students (batch, department, section selection)
- **Pull-to-Refresh** — Native refresh with WebView scroll sync
- **Landscape Support** — Adaptive layouts for calendar and schedule views

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
│   │   │   ├── features/         # Shared feature components
│   │   │   ├── navigation/       # Sidebar, Navbar, Mobile Nav, Admin Nav
│   │   │   └── ui/               # Splash screen, skeletons, date inputs
│   │   ├── pages/
│   │   │   ├── student/          # Home, Schedule, Calendar, Notes, Settings
│   │   │   ├── admin/            # AdminPanel + 16 sub-modules
│   │   │   └── auth/             # Login, Signup, Setup
│   │   ├── styles/               # Domain-organized CSS (admin/, student/, settings/, navigation/)
│   │   ├── contexts/             # ToastContext (global notifications)
│   │   ├── hooks/                # useSystemTheme, custom hooks
│   │   ├── data/                 # Hardcoded admin list, static data
│   │   └── utils/                # Time formatting, helpers
│   └── public/                   # PWA manifests, icons, assets
│
├── mobile/
│   ├── app/                      # Student Android App (Jetpack Compose)
│   │   └── src/main/java/.../
│   │       ├── ui/               # Screens: Home, Schedule, Calendar, Notes, Settings, etc.
│   │       ├── data/             # Repository, Room DB, Models, Preferences
│   │       └── workers/          # Background sync (WorkManager)
│   │
│   └── admin/                    # Admin Web Wrapper (WebView Shell)
│       └── src/main/java/.../
│           ├── AdminMainActivity.kt  # WebView setup, Google Sign-In bridge
│           └── AppConfig.kt          # ⚙️ Easy URL configuration
│
├── database.rules.json           # Firebase Realtime Database security rules
├── PRIVACY_POLICY.md             # App privacy policy
└── docs/                         # Developer guide, user manual, walkthroughs
```

---

## 🔐 Role-Based Access Control

Neram uses a strict hierarchical role system:

| Role | Scope | Capabilities |
|---|---|---|
| **Super Admin** | Full system | All modules, manage all roles, archive tool |
| **Faculty Admin** | Department-level | Schedules, exams, events, manage reps, remove faculty |
| **Student Rep** | Section-level | Schedules, exams, events for their section |
| **Student** | Read-only | View schedule, exams, calendar, notes |

> Hardcoded admin emails (in `web/src/data/admins.js`) are protected and cannot be demoted via the UI.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, React Router DOM 7 |
| **Styling** | Vanilla CSS (macOS Sequoia-inspired design system) |
| **Backend** | Firebase Realtime Database |
| **Auth** | Firebase Authentication + Google Sign-In |
| **Mobile** | Kotlin, Jetpack Compose, Material 3 |
| **Local Storage** | Room Database (Android), LocalStorage (Web) |
| **Notifications** | Firebase + Android NotificationManager |
| **Calendar** | Google Calendar API v3 |
| **PDF** | pdf.js (web), PDF rendering (notes viewer) |
| **Icons** | React Icons (Remix Icon set) |
| **Typography** | Inter Variable (Google Fonts) |

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

The web app serves two entry points:
- `index.html` → Student Portal (`/`)
- `admin.html` → Admin Portal (`/admin`)

### Android Student App

1. Open `mobile/` in Android Studio
2. Sync Gradle dependencies
3. Select the `:app` module
4. Run on emulator or physical device

### Android Admin Wrapper

1. Open `mobile/` in Android Studio
2. Select the `:admin` module
3. To change the website URL, edit **`mobile/admin/.../AppConfig.kt`**:
   ```kotlin
   object AppConfig {
       const val ADMIN_URL = "https://your-domain.com/admin"
       const val ALLOWED_INTERNAL_DOMAIN = "your-domain.com"
   }
   ```
4. Build and run

---

## 🗄️ Firebase Database Structure

```
├── users/                    # All registered user profiles
│   └── {uid}/                # displayName, email, batch, department, section, role
├── academic_hierarchy/       # Batch → Department → Sections mapping
│   └── {batch}/{dept}/       # Array of section IDs
├── schedules/                # All academic data
│   └── {batch}/{dept}/{sec}/ # courses[], timetable{}, exams[], counseling{}
├── calendars/                # Google Calendar sync data
│   └── {batch}/              # config{}, semConfig{}, events[]
├── updates/                  # Live announcements
│   └── {batch}/{dept}/{sec}/ # daily_update{}, general_text
├── notes/                    # Study materials metadata
├── events/                   # College events
└── pending_requests/         # User approval queue
```

---

## 🎨 Design Philosophy

Neram follows a **macOS Sequoia-inspired** design language:
- **Glassmorphism** — Frosted-glass sidebars and navigation
- **Rounded corners** — 24–32px border radius on cards
- **Smooth animations** — Cubic-bezier transitions throughout
- **System-aware theming** — Automatic dark/light mode detection
- **Safe area handling** — Proper status bar and notch padding for Android
- **Responsive layout** — Desktop sidebar collapses to mobile bottom nav at 768px

---

## 📂 Documentation

| Document | Description |
|---|---|
| [`docs/DEVELOPER_GUIDE.md`](docs/DEVELOPER_GUIDE.md) | Technical architecture and development setup |
| [`docs/STUDENT_USER_MANUAL.md`](docs/STUDENT_USER_MANUAL.md) | End-user guide for students |
| [`docs/RESTRUCTURING_WALKTHROUGH.md`](docs/RESTRUCTURING_WALKTHROUGH.md) | Codebase restructuring history |
| [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) | App privacy policy |

---

## 📊 Project Stats

| Metric | Value |
|---|---|
| **Development Period** | December 2025 – March 2026 |
| **Total Commits** | 304+ |
| **Web Modules** | 906 (Vite build) |
| **Admin Sub-Modules** | 16 management tools |
| **Android Screens** | 16+ Compose screens |
| **CSS Lines** | 63,000+ (mobile.css alone) |
| **Platforms** | Web (PWA) + Android (Native + WebView) |

---

## 👤 Author

**Elvan Parthasarathy**

---

<p align="center">
  <sub>Built with ❤️ for RMD Engineering College</sub>
</p>

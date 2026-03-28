<p align="center">

![Neram — Feature Showcase Cover](C:\Users\jaipr\.gemini\antigravity\brain\0cd2867a-2fb6-45d4-b962-2c367c468a94\neram_pdf_cover_1774727538880.png)

</p>

---

# NERAM — நேரம்
## Complete Academic Management System
### Feature Showcase & Product Overview

**Institution:** RMD Engineering College
**Department:** Electronics & Communication Engineering (ECE)
**Developed by:** Elvan Parthasarathy
**Development Period:** December 2025 – March 2026
**Status:** ✅ Production — Used by 85+ students

---

## 📌 What is Neram?

**Neram** (Tamil: நேரம், meaning **"Time"**) is a full-stack, multi-platform academic management system built from the ground up for RMD Engineering College. It brings together everything students need — timetables, exam schedules, academic calendars, notes, and live announcements — into **one unified digital platform**.

> 💡 **In one sentence:** Neram replaces scattered WhatsApp messages, printed timetables, and random PDF files with a **single, real-time, cloud-synced system** accessible on any device.

---

## 🔴 The Problem We're Solving

![Before vs After — Neram transforms academic information flow](C:\Users\jaipr\.gemini\antigravity\brain\0cd2867a-2fb6-45d4-b962-2c367c468a94\neram_problem_solution_1774727566253.png)

| Current Situation | Problem |
|---|---|
| 📱 Timetable changes on WhatsApp | Messages get buried, outdated, missed |
| 📄 Exam schedules as photos/PDFs | Not searchable, no notifications |
| 📅 Academic calendar — random files | Students miss deadlines and events |
| 📁 Notes on scattered Google Drive links | Disorganized, hard to find |
| 📢 No announcement system | Critical updates don't reach everyone |
| ✍️ Manual timetable preparation | Time-consuming, error-prone |
| 📵 No mobile app | Students rely on screenshots |

### ✅ How Neram Solves Each One:

| Problem | Neram's Answer |
|---|---|
| WhatsApp timetable chaos | **Schedule Manager** — edit once, syncs to all devices instantly |
| PDF exam schedules | **Exam Manager** — structured, searchable, date-sorted |
| Missing calendar events | **Calendar Manager** — OCR-powered PDF-to-Calendar engine |
| Scattered study materials | **Notes Section** — organized by subject, built-in PDF viewer |
| Delayed announcements | **Live Updates** — real-time on student home screen |
| Manual timetable work | **Admin Dashboard** — visual point-and-click timetable builder |
| No mobile access | **Native Android App** — Kotlin + Jetpack Compose, works offline |

---

## 🌐 The Neram Ecosystem — 3 Applications, 1 Platform

![Neram Platform Ecosystem](C:\Users\jaipr\.gemini\antigravity\brain\0cd2867a-2fb6-45d4-b962-2c367c468a94\neram_ecosystem_diagram_1774727580819.png)

Neram is not a single app — it's a **three-application ecosystem** that works together seamlessly:

| # | Application | Technology | Purpose |
|---|---|---|---|
| 1️⃣ | **Student Web Portal** | React 19 + Vite (PWA) | Full-featured web app, installable on any phone |
| 2️⃣ | **Student Android App** | Kotlin + Jetpack Compose | Native Android with offline mode & push notifications |
| 3️⃣ | **Admin Portal** | React + Kotlin WebView Wrapper | Full management dashboard (Web + Android) |

> 🔑 **One Admin Change → All Platforms Update in Real-Time** (within 1-2 seconds)

---

## 🎓 Student Portal — Features

### 🏠 Home Dashboard
- **Today's Classes** at a glance — current period highlighted
- **Live Announcements** from admin/faculty — replaces WhatsApp broadcasts
- **Quick Navigation** to all sections
- **Dark/Light Mode** — automatic system-aware theming

### 📅 Timetable Viewer
- **Full weekly schedule** — Monday through Saturday
- **Period Details** — subject code, name, faculty, room number
- **12-hour time display** with clear start/end times
- **Real-time sync** — any admin change appears instantly

### 📝 Exam Schedules
- **All Exam Types** — CT1, CT2, IA1, IA2, Model, Semester, Practical
- **Chronological sorting** — exams always in date order
- **Detailed information** — date, time, subject, exam portion
- **Practical Exams** — batch-wise scheduling with register number ranges

### 📆 Academic Calendar
- **Powered by Elvan Agazhi** — our custom OCR engine
- **Monthly view** with color-coded event indicators
- **One tap** to see full event details for any date
- **Holidays, working days, exam periods** — all in one place

### 📚 Notes & Materials
- **Subject-organized** — materials grouped by course code
- **Built-in PDF viewer** — no downloads needed, read inside the app
- **Admin-curated** — only approved materials appear

### ⚙️ Settings & Profile
- **Profile management** — student details
- **Theme preferences** — dark/light mode toggle
- **Security** — password change, account deletion
- **User Directory** — browse all registered students

### 📱 Android-Exclusive Features
- 🔔 **Push Notifications** — alerts for new exams, schedule changes
- 📴 **Offline Mode** — Room Database caches everything locally
- 🔄 **Background Sync** — WorkManager refreshes data even when app is closed
- 👋 **Onboarding** — guided first-time setup (batch → department → section)
- ↕️ **Pull-to-Refresh** — native swipe gesture

---

## 🛡️ Admin Portal — 16 Management Modules

The Admin Portal gives faculty and administrators complete control over all academic data:

### Academic Management

| Module | What It Does |
|---|---|
| 📅 **Schedule Manager** | Central timetable builder — visual editor, multi-section sync |
| 🏆 **Exam Manager** | Create/manage all exam types with date-sorted auto-publishing |
| 📆 **Calendar Manager** | OCR-powered PDF-to-Calendar (Elvan Agazhi engine) |
| 🎉 **Event Manager** | Create and manage college events |
| 📝 **Notes Manager** | Upload study materials with approval workflow |
| 🏫 **Special Class Manager** | Schedule extra/remedial sessions |

### Administration

| Module | What It Does |
|---|---|
| 🛡️ **Admin Role Manager** | Promote/demote users with strict role hierarchy |
| 👥 **User Management** | View and search all registered users |
| 👨‍🏫 **Faculty Directory** | Department-wise faculty listing |
| 📦 **Resource Manager** | Share syllabus, regulations, academic resources |
| ⏳ **Pending Requests** | Review user approval queue |
| 🗃️ **Archive Tool** | Semester transition management |

### Plus: Dashboard, Admin Profile, Admin Settings, Live Updates

---

## 🔮 Elvan Agazhi — The OCR Calendar Engine

> **Problem:** Colleges publish academic calendars as printed PDFs. Manually entering 100+ events is tedious and error-prone.

> **Solution:** Elvan Agazhi — a custom-built OCR pipeline that converts any academic calendar PDF into structured digital data, automatically.

### How It Works:

```
📄 Upload PDF  →  🖼️ Render Pages  →  ✂️ Crop Region  →  🔍 OCR Extract  →  📋 Parse Data  →  ✏️ Review & Edit  →  🚀 One-Click Push
   (pdf.js)        (Canvas)          (Cropper.js)     (Tesseract.js)    (calendarParser)  (CalendarBuilder)    (Firebase)
```

### Key Highlights:
- **Batch processing** — OCR all pages with a single crop reference
- **Side-by-side comparison** — original PDF vs extracted text
- **Every field editable** — review and correct before publishing
- **Runs entirely in-browser** — zero server cost, no external API needed
- **One click** to push to Firebase → instantly live on all student devices

---

## 🔐 Role-Based Access Control (4 Tiers)

Neram uses a strict hierarchical security system:

| Role | Who | Access Level |
|---|---|---|
| 🔴 **Super Admin** | HOD / Principal / IT Staff | Full system access — all 16 modules |
| 🟣 **Faculty Admin** | Department Coordinators | Schedules, exams, events, manage reps |
| 🔵 **Student Rep** | Class Representatives | Their own section's schedule & exams only |
| ⚪ **Student** | All registered students | Read-only — view everything, modify nothing |

### Security Enforcement:
- ✅ **Database-level rules** — even if UI is bypassed, unauthorized writes are rejected by Firebase
- ✅ **Hardcoded admin protection** — core admin emails cannot be demoted via UI
- ✅ **Per-section isolation** — reps can only write to their assigned section
- ✅ **Institutional login** — restricted to `@rmd.ac.in` Google accounts

---

## 🛠️ Technology Stack

![Neram Technology Stack](C:\Users\jaipr\.gemini\antigravity\brain\0cd2867a-2fb6-45d4-b962-2c367c468a94\neram_tech_stack_1774727594383.png)

| Layer | Technology | Why |
|---|---|---|
| **Web Frontend** | React 19 + Vite 7 | Fastest build tool, latest framework |
| **Mobile App** | Kotlin + Jetpack Compose | Modern Android standard, Material 3 |
| **Database** | Firebase Realtime Database | Real-time sync, free tier |
| **Authentication** | Firebase Auth + Google Sign-In | Industry-standard, supports @rmd.ac.in |
| **Hosting** | Vercel | Auto-deploy from GitHub, global CDN |
| **Calendar OCR** | Tesseract.js + pdf.js | Client-side, zero server cost |
| **Offline Cache** | Room Database (Android) | SQLite-based, survives restarts |
| **Background Sync** | WorkManager (Android) | Reliable even when app is closed |
| **Design Language** | macOS Sequoia-inspired | Premium glassmorphism UI |
| **Typography** | Inter Variable (Google Fonts) | Modern, readable |

---

## 📊 Project Statistics

| Metric | Value |
|---|---|
| **Development Period** | 4 months (December 2025 – March 2026) |
| **Total Git Commits** | 304+ |
| **Active Users** | 85+ students (single class deployment) |
| **Web Modules** | 906 (Vite production build) |
| **Admin Modules** | 16 management tools |
| **Android Screens** | 16+ Compose screens |
| **Android Apps** | 2 (Student Native + Admin WebView) |
| **CSS Lines** | 63,000+ |
| **Operating Cost** | ₹0/month |

---

## 💰 Cost Analysis — ₹0 per Month

| Service | Free Tier Limit | Neram Usage | Cost |
|---|---|---|---|
| **Firebase Database** | 1 GB storage, 10 GB/month | ~50-100 MB | **₹0** |
| **Firebase Auth** | 10,000 sign-ins/month | ~500-2000 students | **₹0** |
| **Vercel Hosting** | 100 GB bandwidth/month | ~5-10 GB | **₹0** |
| **GitHub** | Unlimited repos | 1 repo | **₹0** |
| **OCR Engine** | Client-side (browser) | No server | **₹0** |

> 🎯 **For a single college with 2,000-5,000 students, the entire system runs completely free.**

---

## 🏫 College Integration — Ready for Handover

### Only 4 Files Need to Change:

| File | What Changes |
|---|---|
| `firebase.js` | Firebase project credentials |
| `admins.js` | Super admin email addresses |
| `google-services.json` | Android app Firebase config |
| `AppConfig.kt` | Admin wrapper URL |

### 5-Day Handover Plan:
- **Day 1-2:** Create college Google & Firebase accounts
- **Day 2-3:** Transfer code, update 4 config files
- **Day 3-4:** Migrate data, import calendar
- **Day 4-5:** Deploy web + build Android APKs + test
- **Week 2:** Pilot with one department → full rollout

### Training Required:
- Super Admins (HOD/Principal): **30 minutes**
- Faculty Admins: **45 minutes**
- Class Representatives: **20 minutes**
- Students: **5 minutes** (self-explanatory UI)

---

## 🚀 Why Neram Stands Out

### vs. WhatsApp Groups
| | WhatsApp | Neram |
|---|---|---|
| Timetable | 📸 Photos get buried | ✅ Always accessible |
| Exam Schedule | 📨 Forwarded messages | ✅ Date-sorted, searchable |
| Notifications | 🔇 Lost in group noise | ✅ Targeted push |
| Access Control | ❌ Anyone can post | ✅ Role-based |

### vs. Commercial LMS (Moodle, etc.)
| | Commercial LMS | Neram |
|---|---|---|
| Cost | 💸 Licensing fees | ✅ **Free** |
| Setup Time | ❌ Weeks/months | ✅ Days |
| Mobile App | ❌ Generic | ✅ Custom native |
| Customization | ❌ Fixed templates | ✅ Full source ownership |

### Unique Innovations:
1. 🧠 **Elvan Agazhi** — OCR engine that converts printed PDFs to digital calendar data
2. 🏗️ **Batch→Department→Section** hierarchy matching RMD's actual structure
3. 🎨 **macOS Sequoia design** — premium glassmorphism UI rivaling commercial apps
4. 📴 **Offline-first mobile** — works without internet
5. 🔄 **Real-time sync** — admin changes appear on all devices in seconds

---

## 🌱 Future Roadmap

| Feature | Effort | Impact |
|---|---|---|
| iOS App (Swift/SwiftUI) | 4-6 weeks | Reach iPhone users |
| Attendance Tracking | 2-3 weeks | Digital attendance for faculty |
| Assignment Submission | 3-4 weeks | Students submit through app |
| GPA Calculator | 1 week | Auto-calculate from marks |
| Analytics Dashboard | 2-3 weeks | Usage stats & engagement |
| Multi-College Support | 4-6 weeks | Deploy for sister institutions |

---

## 📺 Quick Demo Guide

| What to Demo | How |
|---|---|
| **Real-Time Sync** | Change a timetable on admin → watch it update on student app in 2 seconds |
| **Student Experience** | Open web app → navigate Home, Schedule, Calendar, Notes |
| **Admin Power** | Open admin portal → show Schedule Manager, Exam Manager, Role Manager |
| **Offline Mode** | Turn off WiFi on phone → all data still accessible |
| **OCR Engine** | Upload a PDF → watch Agazhi extract calendar data automatically |

---

<p align="center">

**NERAM — நேரம்**
*Making academic time management effortless.*

Developed by **Elvan Parthasarathy**
ECE Department, RMD Engineering College
March 2026

</p>

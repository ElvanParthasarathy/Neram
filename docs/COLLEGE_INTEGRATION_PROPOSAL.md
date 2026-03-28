# Neram — College Integration Proposal
### A Complete Academic Management System for RMD Engineering College

**Presented by:** Elvan Parthasarathy  
**Date:** March 2026  
**Development Period:** December 2025 – March 2026 (304+ commits)

---

## 🔖 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem](#2-the-problem)
3. [The Solution — Neram](#3-the-solution--neram)
4. [Platform Overview](#4-platform-overview)
5. [Student App — Feature Walkthrough](#5-student-app--feature-walkthrough)
6. [Admin Portal — Feature Walkthrough](#6-admin-portal--feature-walkthrough)
7. [Security & Access Control](#7-security--access-control)
8. [Technology & Architecture](#8-technology--architecture)
9. [Current Deployment Status](#9-current-deployment-status)
10. [College Handover Plan](#10-college-handover-plan)
11. [Cost Analysis](#11-cost-analysis)
12. [Competitive Advantages](#12-competitive-advantages)
13. [Scalability & Future Roadmap](#13-scalability--future-roadmap)
14. [Appendix: Screenshots & Demos](#14-appendix)

---

## 1. Executive Summary

**Neram** (Tamil: நேரம், "Time") is a production-ready academic management platform built specifically for RMD Engineering College. It provides students with instant access to timetables, exam schedules, academic calendars, notes, and announcements — while giving faculty and administrators a powerful centralized dashboard to manage all academic data in real time.

### What Makes It Special
- **3-platform ecosystem**: Web App (PWA) + Native Android Student App + Admin Wrapper App
- **Real-time sync**: Every change made by admin reflects instantly on all student devices
- **Zero external cost**: Built entirely on free-tier cloud services (Firebase, Vercel)
- **Custom built for RMD**: Not a generic template — designed around the college's actual batch/department/section hierarchy
- **Offline capable**: Android app caches data locally for use without internet

> **Bottom Line:** This system can replace scattered WhatsApp groups, printed timetables, and manual exam-schedule distribution with a single, unified digital platform — at zero recurring cost.

---

## 2. The Problem

| Current Pain Point | Impact |
|---|---|
| Timetable changes shared via WhatsApp groups | Information gets buried, missed, or outdated |
| Exam schedules distributed as PDFs or photos | Hard to search, no notifications, format inconsistency |
| No centralized academic calendar | Students miss important dates, events, and deadlines |
| Notes shared via random Google Drive links | Disorganized, no version control, hard to discover |
| No real-time announcements system | Critical updates don't reach students in time |
| Manual timetable preparation by HoDs | Time-consuming, error-prone, no digital record |
| No mobile app for instant access | Students must rely on browser bookmarks or screenshots |

---

## 3. The Solution — Neram

Neram solves every problem listed above through a unified digital ecosystem:

| Problem | Neram Solution |
|---|---|
| WhatsApp timetable chaos | **Schedule Manager** — Edit once, syncs to all students instantly |
| PDF exam schedules | **Exam Manager** — Structured, searchable, date-sorted exam data |
| Missing calendar events | **Calendar Manager** — Powered by **Elvan Agazhi** OCR engine, converts PDF calendars to live digital data |
| Scattered notes/materials | **Notes Manager** — Organized by subject, built-in PDF viewer |
| Delayed announcements | **Live Updates** — Real-time daily updates on student home screen |
| Manual timetable creation | **Admin Dashboard** — Point-and-click timetable builder |
| No mobile access | **Native Android App** — Jetpack Compose, offline-capable |

---

## 4. Platform Overview

Neram consists of three applications that form a complete ecosystem:

### 4.1 Student Web Portal (PWA)
- **URL:** Accessed via any browser (desktop or mobile)
- **Technology:** React 19 + Vite
- **Features:** Full timetable, exams, calendar, notes, settings
- **Installable:** Can be installed as a PWA on any phone (Add to Home Screen)

### 4.2 Student Mobile App (Android)
- **Technology:** Kotlin + Jetpack Compose (Material 3 Design)
- **Distribution:** APK or Google Play Store
- **Features:** All student features + Push Notifications + Offline Mode
- **Native Experience:** Smooth animations, swipe gestures, pull-to-refresh
- **Branding:** Gradient Blue icon

### 4.3 Admin Mobile App (Android)
- **Technology:** Kotlin WebView wrapper around the Admin Portal
- **Distribution:** Separate APK for faculty/admins
- **Purpose:** Gives administrators mobile access to the full admin dashboard
- **Features:** Google Sign-In bridge, native status bar theming, back navigation, pull-to-refresh
- **Easy Configuration:** URL and domain stored in `AppConfig.kt` — change one file to repoint
- **Branding:** Elf Green icon (#088370)

### How They Connect

```
┌─────────────────────────────────────────────────────────┐
│                    FIREBASE CLOUD                       │
│            (Realtime Database + Auth)                   │
│                                                         │
│   ┌─────────┐    ┌──────────┐    ┌──────────────────┐   │
│   │  Users   │    │Schedules │    │ Events/Calendar  │   │
│   │  Roles   │    │  Exams   │    │ Notes/Updates    │   │
│   └────┬─────┘    └────┬─────┘    └──────┬───────────┘   │
│        │               │                │               │
└────────┼───────────────┼────────────────┼───────────────┘
         │               │                │
    ┌────▼────┐    ┌─────▼─────┐   ┌──────▼──────┐
    │ Student │    │  Student  │   │   Admin     │
    │ Web App │    │Android App│   │  Web+App    │
    │ (React) │    │ (Kotlin)  │   │  (React)    │
    └─────────┘    └───────────┘   └─────────────┘
```

**Key Principle:** Admin makes ONE change → ALL platforms update in real time.

---

## 5. Student App — Feature Walkthrough

### 5.1 Home Screen
- **Daily Schedule Card** — Shows today's classes at a glance
- **Live Announcements** — Real-time updates from admin/faculty (replaces WhatsApp)
- **Quick Stats** — Current period indicator, upcoming exams countdown
- **Dark/Light Mode** — Automatic system-aware theme switching

### 5.2 Timetable / Schedule
- **Weekly View** — Monday through Saturday grid
- **Period Details** — Subject code, name, faculty, room number
- **Time Display** — 12-hour format with start/end times
- **Real-time Sync** — Any timetable change by admin appears instantly

### 5.3 Exam Schedules
- **All Exam Types** — CT1, CT2, IA1, IA2, Model, Semester, Practical
- **Date-Sorted** — Exams always displayed in chronological order
- **Detailed View** — Date, time, subject, portion, scope (section-specific or common)
- **Practical Exams** — Batch-wise schedule with register ranges and lab timings

### 5.4 Academic Calendar
- **Powered by Elvan Agazhi** — OCR-based PDF-to-Calendar engine (replaces Google Calendar API)
- **Monthly View** — Visual calendar with event indicators
- **Event Details** — Click any date to see full event information

### 5.5 Notes & Materials
- **Subject-Organized** — Materials grouped by course code
- **Built-in PDF Viewer** — No need to download, view directly in app
- **Admin-Curated** — Only approved materials appear

### 5.6 Settings & Profile
- **Profile Management** — View/edit student details
- **Display Settings** — Theme preference, font size
- **Security** — Password change, account deletion
- **User Directory** — Browse all registered students
- **About Section** — App info, developer credits

### 5.7 Android-Exclusive Features
- **Push Notifications** — Alerts for new exams, schedule changes, announcements
- **Offline Mode** — Room Database caches all data locally
- **Background Sync** — WorkManager refreshes data periodically
- **Onboarding** — Guided first-time setup (select batch, department, section)
- **Pull-to-Refresh** — Native refresh gesture

---

## 6. Admin Portal — Feature Walkthrough

The Admin Portal is a comprehensive management dashboard with **16 modules**:

### 6.1 Dashboard
- Quick overview of system status
- One-click access to all management modules
- Role-aware: shows only modules the admin has access to

### 6.2 Schedule Manager ⭐ (Core Module)
- **Central Timetable Editor** — Build timetables visually
- **Course Management** — Add/edit subjects with codes, names, faculty
- **Multi-Section Sync** — One edit distributes to all sections automatically
- **Day/Period Grid** — Drag-and-drop style period assignment
- **Counseling Setup** — Configure counselor assignments

### 6.3 Exam Manager ⭐ (Core Module)
- **Create Exams** — CT1, CT2, IA1, IA2, Model, Semester, Practical
- **Subject Mapping** — Map subjects to dates with time slots and portions
- **Practical Batches** — Multi-batch scheduling with register ranges
- **Scope Control** — Common (all sections) or section-specific exams
- **Auto Date-Sort** — Exams saved in chronological order for all platforms
- **Bulk Delete** — Select multiple exams for batch deletion

### 6.4 Calendar Manager — Powered by Elvan Agazhi
- **PDF Upload** — Upload college academic calendar PDF
- **OCR Extraction** — Tesseract.js extracts text from cropped regions
- **Calendar Builder** — Visual editor to review, correct, and structure events
- **One-Click Push** — Publish to Firebase instantly (all students see it in real-time)
- **Published Events** — Full event manager with add/edit/delete
- **Semester Configuration** — Set semester start/end dates
- **No External API Needed** — Fully self-contained, no Google Calendar dependency

### 6.5 Event Manager
- Create and manage college events
- Date, time, description, and category tagging

### 6.6 Notes Manager
- **Upload Materials** — Add PDF links organized by subject
- **Approval Workflow** — Review and approve student submissions
- **Full-Screen Creator** — Rich editing interface on mobile and desktop

### 6.7 Faculty Directory
- Department-wise faculty listing
- Contact information and designation

### 6.8 User Management
- View all registered users
- Search by name or email
- See user details (batch, department, section, role)

### 6.9 Admin Role Manager ⭐ (Critical Module)
- **Promote Users** — Grant Rep, Faculty, or Super Admin roles
- **Demote Users** — Remove admin privileges
- **Role Hierarchy** — Strict promotion/demotion tracks
- **Hardcoded Protection** — Core admin emails cannot be modified via UI

### 6.10 Special Class Manager
- Schedule extra classes, remedial sessions, or makeup lectures
- Date/time/room selection with student notification

### 6.11 Resource Manager
- Share academic resources (syllabus PDFs, regulation documents)

### 6.12 Pending Requests
- Review and process student/faculty approval requests

### 6.13 Archive Tool (Desktop Only)
- Semester transition management
- Archive old data before starting a new semester

### 6.14 Live Updates (via Dashboard)
- Post real-time daily updates visible on student home screens
- General announcements with author attribution

---

## 7. Security & Access Control

### 7.1 Authentication
- **Google Sign-In** — Students and faculty log in with their `@rmd.ac.in` Google accounts
- **Email/Password** — Alternative auth method available
- **Firebase Authentication** — Industry-standard security by Google

### 7.2 Role Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│                     SUPER ADMIN                          │
│   Full system access. Can manage all modules and roles.  │
│   (HOD / Principal / Designated IT Staff)                │
├──────────────────────────────────────────────────────────┤
│                    FACULTY ADMIN                         │
│   Department-level access. Manage schedules, exams,      │
│   events. Can promote/remove student reps.               │
│   (Department Faculty Coordinators)                      │
├──────────────────────────────────────────────────────────┤
│                    STUDENT REP                           │
│   Section-level access. Manage their own section's       │
│   schedules and exams. Cannot access other sections.     │
│   (Class Representatives)                                │
├──────────────────────────────────────────────────────────┤
│                      STUDENT                             │
│   Read-only access. View schedule, exams, calendar,      │
│   notes. Cannot modify any data.                         │
│   (All registered students)                              │
└──────────────────────────────────────────────────────────┘
```

### 7.3 Database Security Rules
- **Role-based write protection** — Only authorized roles can modify data
- **Read authentication** — All data requires login to read
- **Per-section isolation** — Reps can only write to their assigned section
- **User privacy** — Students can only read their own profile; admins can read all

### 7.4 Hardcoded Admin Protection
- Core administrator emails are stored in code, not in the database
- These accounts cannot be demoted or removed via the admin UI
- Ensures the system always has at least one super admin

---

## 8. Technology & Architecture

### 8.1 Tech Stack Summary

| Component | Technology | Why This Choice |
|---|---|---|
| **Web Frontend** | React 19 + Vite 7 | Fastest build tool, latest React features |
| **Styling** | Vanilla CSS | Full control, no dependency bloat, macOS-quality design |
| **Mobile App** | Kotlin + Jetpack Compose | Modern Android standard, Material 3, native performance |
| **Database** | Firebase Realtime Database | Real-time sync, free tier (1GB storage, 10GB/month transfer) |
| **Authentication** | Firebase Auth + Google Sign-In | Secure, zero-maintenance, supports @rmd.ac.in accounts |
| **Hosting** | Vercel | Free tier, auto-deploys from GitHub, global CDN |
| **Calendar Engine** | Elvan Agazhi (Tesseract.js OCR + pdf.js) | Free, integrates with college's existing Google Workspace |
| **Offline Storage** | Room Database (Android) | SQLite-based, survives app restarts |
| **Background Tasks** | WorkManager (Android) | Reliable background sync even when app is closed |
| **Notifications** | Firebase + Android NotificationManager | Push notifications without a custom server |

### 8.2 Architecture Principles
- **Single Source of Truth** — Firebase is the central database; all apps read from it
- **Real-time Sync** — Firebase listeners ensure instant updates across all devices
- **Offline-First (Mobile)** — Room DB caches data; app works without internet
- **Role-Based Access** — Every database node has security rules tied to user roles
- **Multi-Entry Web** — Student Portal and Admin Portal are separate HTML entry points sharing the same codebase

---

## 9. Current Deployment Status

### What's Currently Active

| Service | Account Owner | Current Status |
|---|---|---|
| **Firebase Project** | Elvan Parthasarathy (personal Google account) | ✅ Active — Free Spark Plan |
| **Vercel Hosting** | Elvan Parthasarathy (GitHub-linked) | ✅ Active — Free Hobby Plan |
| **GitHub Repository** | github.com/ElvanParthasarathy/RmdNeram | ✅ Private repo, 304+ commits |
| **Google Play Console** | Elvan Parthasarathy | ✅ Ready for APK upload |
| **Domain** | adminneram.vercel.app | ✅ Auto-deployed from GitHub |

### What This Means
Everything currently runs under my personal accounts at **zero cost**. For official college adoption, all of these need to be transferred to college-owned accounts (see Section 10).

---

## 10. College Handover Plan

### Step-by-Step Transfer Process

#### Phase 1: Account Setup (Day 1-2)
| Task | Who Does It | Details |
|---|---|---|
| Create college Google account | College IT | e.g., `neram@rmd.ac.in` or `admin@rmd.ac.in` |
| Create Firebase project | Elvan + IT | New project under college Google account |
| Enable Firebase Authentication | Elvan + IT | Turn on Google Sign-In provider |
| Set up Realtime Database | Elvan | Import database rules and initial structure |
| Configure Firebase Storage | Elvan | For notes/materials file storage |
| Create Vercel account | College IT | Link to college GitHub (or transfer repo) |

#### Phase 2: Code Transfer (Day 2-3)
| Task | Details |
|---|---|
| Transfer GitHub repository | Fork or transfer repo to college's GitHub organization |
| Update Firebase config | Replace `firebase.js` credentials with new project's config |
| Update `google-services.json` | New Firebase project's config for both Android apps (`:app` and `:admin`) |
| Update `AppConfig.kt` | Point Admin Wrapper to new Vercel URL and domain |
| Update `admins.js` | Set college staff email(s) as hardcoded super admins |
| Update Google Sign-In Client ID | New OAuth client from college's Firebase project |

#### Phase 3: Data Migration (Day 3-4)
| Task | Details |
|---|---|
| Export current Firebase data | JSON export of all academic hierarchy, schedules, etc. |
| Import into new project | Upload JSON to new Firebase Realtime Database |
| Upload academic calendar | Use Elvan Agazhi to OCR the college PDF and push events |
| Import database security rules | Copy `database.rules.json` to new project |

#### Phase 4: Deployment (Day 4-5)
| Task | Details |
|---|---|
| Deploy web app to Vercel | `git push` triggers automatic deployment |
| Build Student Android APK | Generate signed release APK from `:app` module |
| Build Admin Android APK | Generate signed release APK from `:admin` module |
| Generate Play Store AAB | If publishing to Google Play Store |
| Test all logins | Verify @rmd.ac.in Google Sign-In works |
| Assign initial admin roles | Set HOD and faculty coordinator emails in `admins.js` |

#### Phase 5: Rollout (Week 2)
| Task | Details |
|---|---|
| Pilot with one department | Test with a single class for 1 week |
| Gather feedback | Fix any issues specific to their workflow |
| Full rollout | Open for all departments and batches |
| Train faculty admins | 30-minute walkthrough of Admin Portal |

### What Changes in Code (Summary)
Only **4 files** need modification for the handover:

| File | What Changes |
|---|---|
| `web/src/firebase.js` | Firebase project credentials (API key, project ID) |
| `web/src/data/admins.js` | Hardcoded super admin email addresses |
| `mobile/app/google-services.json` | Firebase config for student Android app |
| `mobile/admin/.../AppConfig.kt` | Admin app URL and Google Sign-In client ID |

> **Everything else remains the same.** The entire codebase is designed to be portable.

---

## 11. Cost Analysis

### Current Cost: ₹0 (Zero)

| Service | Free Tier Limit | Neram Usage | Monthly Cost |
|---|---|---|---|
| **Firebase Realtime DB** | 1 GB storage, 10 GB/month transfer | ~50-100 MB data | **₹0** |
| **Firebase Auth** | 10,000 sign-ins/month | ~500-2000 students | **₹0** |
| **Vercel Hosting** | 100 GB bandwidth/month | ~5-10 GB/month | **₹0** |
| **GitHub** | Unlimited private repos | 1 repo | **₹0** |
| **Google Play Console** | One-time $25 fee | If publishing to Play Store | **~₹2,100 one-time** |

> **Note:** Elvan Agazhi runs entirely client-side (OCR in browser). No external API costs.

### When Would Costs Arise?
- **5,000+ daily active users** — May exceed Firebase free tier → Blaze plan ($0.001/operation)
- **Custom domain** — If college wants `neram.rmd.ac.in` → Domain registration (~₹500/year)
- **Play Store listing** — One-time $25 (~₹2,100) developer account fee

> **For a single college with 2000-3000 students, the system runs entirely free.**

---

## 12. Competitive Advantages

### vs. WhatsApp Groups
| Feature | WhatsApp | Neram |
|---|---|---|
| Structured timetable | ❌ Photos/PDFs get buried | ✅ Always accessible, searchable |
| Exam schedule | ❌ Forwarded messages | ✅ Date-sorted, type-filtered |
| Notifications | ❌ Lost in group noise | ✅ Targeted push notifications |
| Access control | ❌ Anyone can post | ✅ Role-based permissions |
| History | ❌ Messages expire / deleted | ✅ Permanent database record |

### vs. College Websites
| Feature | Traditional Website | Neram |
|---|---|---|
| Real-time updates | ❌ Manual HTML uploads | ✅ Instant Firebase sync |
| Mobile experience | ❌ Non-responsive pages | ✅ Native Android app + PWA |
| Personalization | ❌ Same page for everyone | ✅ Shows YOUR section's data |
| Offline access | ❌ Requires internet | ✅ Cached locally on phone |
| Admin effort | ❌ Needs web developer | ✅ Point-and-click dashboard |

### vs. Commercial LMS (Moodle, Google Classroom)
| Feature | Commercial LMS | Neram |
|---|---|---|
| Cost | 💸 Licensing / hosting fees | ✅ **Free** |
| Complexity | ❌ Over-engineered for simple needs | ✅ Purpose-built for timetable/exam |
| Mobile app | ❌ Generic or none | ✅ Custom native Android app |
| Setup time | ❌ Weeks/months | ✅ Days |
| Customization | ❌ Fixed templates | ✅ Fully custom, source code owned |

### Unique Features Only Neram Has
1. **Batch → Department → Section hierarchy** matching RMD's exact academic structure
2. **Central exam publishing** — One click publishes to all sections simultaneously
3. **Practical exam batches** — Register range tracking with lab session management
4. **Rep delegation** — Class reps can manage their own section's schedule
5. **Semester archive tool** — Clean transition between semesters
6. **Admin preview mode** — Admins can see the student view as any section
7. **macOS-quality design** — Premium UI that rivals commercial apps

---

## 13. Scalability & Future Roadmap

### Current Capacity
- ✅ Supports unlimited batches, departments, and sections
- ✅ Designed for 2,000-5,000+ students
- ✅ Real-time sync handles concurrent users efficiently

### Potential Future Enhancements
| Feature | Effort | Impact |
|---|---|---|
| **iOS App** (Swift/SwiftUI) | 4-6 weeks | Reach iPhone users |
| **Attendance Tracking** | 2-3 weeks | Digital attendance for faculty |
| **Assignment Submission** | 3-4 weeks | Students submit work through app |
| **GPA Calculator** | 1 week | Auto-calculate from exam marks |
| **Bus Route Tracker** | 2 weeks | College transport info |
| **Push to All** | 1 week | Mass notification system for emergencies |
| **Multi-College Support** | 4-6 weeks | Deploy for sister institutions |
| **Analytics Dashboard** | 2-3 weeks | Usage stats, student engagement metrics |

### Multi-Department Expansion
The system is already built to support **any department**. Adding a new department requires:
1. Admin adds it to `academic_hierarchy` in Firebase (2 clicks)
2. Faculty/Rep sets up timetable for their sections
3. Students sign up and select their department

**No code changes required.**

---

## 14. Appendix

### A. How to Demo the System

1. **Student View:** Open the web app URL → Sign in with a test student account → Navigate through Home, Schedule, Calendar, Notes
2. **Admin View:** Open the admin URL → Sign in with a super admin account → Show Schedule Manager, Exam Manager, Role Manager
3. **Mobile App:** Install the APK on a phone → Show native home screen, notifications, offline mode
4. **Real-Time Demo:** Make a timetable change on admin → Watch it update on student app within 2 seconds

### B. Files That Need Changing for Handover

```
web/src/firebase.js           ← Firebase project credentials
web/src/data/admins.js         ← Super admin email list
mobile/app/google-services.json    ← Android Firebase config
mobile/admin/google-services.json  ← Admin app Firebase config
mobile/admin/.../AppConfig.kt      ← Admin wrapper URL
```

### C. Key Contacts for Transfer

| Task | Who |
|---|---|
| Firebase project creation | College IT Administrator |
| Google Workspace Calendar API | College IT / Google Admin |
| GitHub repo transfer | Elvan Parthasarathy → College GitHub Org |
| Vercel deployment | College IT (links to GitHub for auto-deploy) |
| Play Store submission | College IT (Google Play Console account) |

### D. Training Requirement

| Audience | Duration | Content |
|---|---|---|
| Super Admins (HOD/Principal) | 30 minutes | Dashboard overview, role management |
| Faculty Admins | 45 minutes | Schedule Manager, Exam Manager, Notes Manager |
| Class Representatives | 20 minutes | How to update their section's schedule |
| Students | 5 minutes | Download app, sign in, navigate (self-explanatory UI) |

---

> **This document serves as the complete reference for integrating Neram into RMD Engineering College's academic workflow. The system is production-ready, free to operate, and designed to scale with the institution's needs.**

---

*Prepared by Elvan Parthasarathy | March 2026*

# NERAM — நேரம்
# Complete Academic Management System
# Feature Showcase & Product Overview

---

**Institution:** RMD Engineering College
**Department:** Electronics & Communication Engineering (ECE)
**Developed by:** Elvan Parthasarathy
**Batch:** 2023–2027
**Development Period:** December 2025 – March 2026 (304+ commits)
**Status:** Production — Actively used by 85+ students

---

# TABLE OF CONTENTS

1. What is Neram?
2. The Problem — Why This Was Needed
3. The Solution — How Neram Fixes Everything
4. Platform Ecosystem — 3 Apps, 1 System
5. Student Portal Features (Web + Android)
6. Admin Portal — 16 Management Modules
7. Elvan Agazhi — The OCR Calendar Engine
8. Role-Based Access Control (4 Tiers)
9. Technology Stack
10. Design Philosophy
11. Project Statistics
12. Cost Analysis
13. College Integration & Handover Plan
14. Competitive Advantages
15. Scalability & Future Roadmap
16. How to Demo

---

# 1. WHAT IS NERAM?

**Neram** (Tamil: நேரம்) means **"Time"**.

It is a **complete academic management system** built from scratch for RMD Engineering College. Neram gives students instant access to their timetables, exam schedules, academic calendar, study materials, and live announcements — while providing administrators and faculty a powerful centralized dashboard to manage all academic data in real time.

**In one sentence:** Neram replaces scattered WhatsApp messages, printed timetables, paper-based academic calendars, and random PDF files with a single, unified, cloud-synced digital platform accessible on any device.

**Key facts:**
- 3 applications working together as one ecosystem
- Real-time sync — admin changes appear on all student devices in 1-2 seconds
- Works on web (any browser), Android phones (native app), and desktop
- Offline capable — Android app works without internet
- Zero operating cost — runs entirely on free-tier cloud services
- Custom-built for RMD's actual Batch → Department → Section structure
- 85+ students actively using it right now

---

# 2. THE PROBLEM — WHY THIS WAS NEEDED

At RMD Engineering College (and most engineering colleges), academic information is scattered across multiple channels with no centralized system:

**Problem 1: Timetable Distribution**
Timetable changes are shared via WhatsApp group messages. These messages get buried under other conversations, students miss updates, and the information becomes outdated quickly. There is no single, always-updated source of truth for the current timetable.

**Problem 2: Exam Schedule Chaos**
Exam schedules are distributed as photos or PDF files in WhatsApp groups. These cannot be searched, there are no push notifications when new exams are announced, and the format is inconsistent across departments.

**Problem 3: No Centralized Academic Calendar**
The academic calendar exists as a printed PDF document. Students have no easy way to check upcoming holidays, events, or important dates without finding and reading through this physical document. They miss deadlines and events.

**Problem 4: Scattered Study Materials**
Notes and study materials are shared via random Google Drive links in various WhatsApp groups. Materials are disorganized, difficult to discover, and there is no standardized way to find resources for a specific subject.

**Problem 5: No Real-Time Announcement System**
Critical updates (class cancellations, room changes, schedule modifications) fail to reach all students in time because there is no dedicated, structured announcement channel.

**Problem 6: Manual Timetable Preparation**
HODs and faculty coordinators prepare timetables manually every semester. This is time-consuming, error-prone, and produces no digital record that can be instantly distributed.

**Problem 7: No Mobile Application**
Students rely on screenshots, browser bookmarks, and forwarded messages to access their academic information. There is no dedicated mobile application providing a clean, always-available interface.

---

# 3. THE SOLUTION — HOW NERAM FIXES EVERYTHING

Every single problem listed above has a direct, working solution in Neram:

| Problem | Neram's Solution |
|---|---|
| WhatsApp timetable chaos | **Schedule Manager** — Edit one place, syncs to all students instantly |
| PDF/photo exam schedules | **Exam Manager** — Structured, searchable, date-sorted exam data with notifications |
| No centralized calendar | **Calendar Manager** powered by **Elvan Agazhi** OCR engine — converts printed PDF calendars to live digital data |
| Scattered study materials | **Notes Section** — Organized by subject, with a built-in PDF viewer |
| Delayed announcements | **Live Updates** — Real-time daily updates appear on every student's home screen |
| Manual timetable work | **Admin Dashboard** — Visual point-and-click timetable builder |
| No mobile app | **Native Android App** — Kotlin + Jetpack Compose, works offline, sends push notifications |

**The core principle: Admin makes ONE change → ALL platforms update in real-time (1-2 seconds).**

---

# 4. PLATFORM ECOSYSTEM — 3 APPS, 1 SYSTEM

Neram is not a single app. It is a **three-application ecosystem** that works together seamlessly through a shared cloud database:

## 4.1 Student Web Portal
- **Technology:** React 19 + Vite (Progressive Web App)
- **Access:** Any modern browser — Chrome, Safari, Firefox, Edge
- **Works on:** Desktop, laptop, tablet, phone
- **Installable:** Can be installed as a PWA on any device ("Add to Home Screen") — looks and feels like a native app
- **Features:** Full timetable, exam schedules, academic calendar, notes, settings, dark/light mode
- **Branding:** Gradient Blue icon

## 4.2 Student Android App
- **Technology:** Kotlin + Jetpack Compose (Material Design 3)
- **Distribution:** APK installation or Google Play Store
- **All student features PLUS:**
  - Push notifications for new exams, schedule changes, and announcements
  - Offline mode — Room Database caches all data locally, works without internet
  - Background sync — WorkManager refreshes data periodically even when the app is closed
  - Guided onboarding — first-time setup wizard for batch/department/section selection
  - Pull-to-refresh — native swipe gesture
  - Smooth animations, swipe gestures, and native Material 3 UI
- **Branding:** Gradient Blue icon

## 4.3 Admin Portal (Web + Android Wrapper)
- **Web technology:** React 19 (separate entry point with HashRouter)
- **Android wrapper:** Kotlin WebView with native bridge for Google Sign-In and theme syncing
- **Purpose:** Complete management dashboard for faculty and administrators
- **16 management modules** for all academic operations
- **Access:** Web browser (any device) or dedicated Android Admin App
- **Branding:** Elf Green icon (#088370) — visually distinct from the student apps

## How They Connect

All three applications read from and write to the same **Firebase Realtime Database** in the cloud. When an admin updates a timetable through the Admin Portal, the change instantly propagates to both the Student Web Portal and the Student Android App. Every connected device updates within 1-2 seconds.

---

# 5. STUDENT PORTAL — COMPLETE FEATURE BREAKDOWN

## 5.1 Home Dashboard
The landing screen that shows everything a student needs at a glance:

**Today's Schedule Card:**
- Shows today's classes with subject names, faculty, room numbers, and timings
- Automatically highlights the current period with a green indicator
- If no class is happening, shows the next upcoming class

**Live Announcements:**
- Real-time announcements posted by faculty or class reps
- Replaces WhatsApp broadcast messages — structured, persistent, always visible
- Shows the author's name and timestamp

**General Notice:**
- A pinned notice displayed prominently — stays until changed by admin/rep
- Used for important information that should be visible every day

**Quick Color Guide:**
- 🟢 Green = Current period (class happening now)
- 🔵 Blue = Regular class
- 🟡 Yellow = Special/extra class
- 🔴 Red = Important notice or exam alert

## 5.2 Timetable / Schedule Viewer
The complete weekly timetable — a digital version of the paper timetable that is always up-to-date:

**What students see:**
- Full Monday to Saturday grid with all period slots
- Each period shows: Subject Name, Subject Code, Faculty Name, Room Number
- Time slots in 12-hour format (e.g., 8:20 AM – 9:10 AM)
- Current day highlighted automatically

**Desktop vs Mobile layout:**
- On desktop/laptop: Full week grid — all 6 days visible at once
- On mobile phone: One day at a time — swipe left/right to change days

**Real-time updates:**
- If a faculty member changes, a room is swapped, or a subject is rescheduled — the timetable updates automatically within 1-2 seconds on all connected devices. No manual refresh needed.

**Special classes:**
- Extra/remedial classes scheduled by admin appear with a distinctive marker, clearly distinguished from the regular timetable.

## 5.3 Exam Schedules
All exam timetables in one place — organized, searchable, and auto-sorted:

**Exam types supported:**
- CT1 / CT2 (Cycle Test 1 & 2) — short internal tests
- IA1 / IA2 (Internal Assessment 1 & 2) — mid-term assessments
- Model Exam — full-length practice exam before semester finals
- Semester Exam — final university exam
- Practical Exam — hands-on lab exams

**What students see for each exam:**
- Exam title (e.g., "Cycle Test 1 — March 2026")
- Date range
- Subject-wise breakdown: subject name, code, date, start/end time, and portion (syllabus covered)

**For practical exams, additional details:**
- Batch number (e.g., Batch 1, Batch 2)
- Register number range (e.g., 23ECE001 – 23ECE030)
- Lab name and time slot

**Sorting:**
All exams are automatically sorted by date — the nearest upcoming exam always appears first. Students never have to scroll through past exams to find what's next.

## 5.4 Academic Calendar
All holidays, college events, and important dates in one interactive calendar:

**Month View:** Visual calendar grid showing colored dots on days with events. Tap any date to see that day's events below the calendar.

**Navigation:** Swipe left/right to change months. "Today" button jumps back to the current date.

**Event types with color coding:**
- 🔴 Holiday — college closed (Pongal, Diwali, Republic Day, etc.)
- 🟢 Working Day — regular academic day with working day number
- 🔵 Event — cultural events, seminars, workshops
- 🟡 Exam — exam dates from the exam schedule

**Data source:** The academic calendar is digitized from the college's official printed PDF using the Elvan Agazhi OCR engine ("see Section 7"). Any updates by the admin are reflected instantly.

## 5.5 Notes & Study Materials
A structured, organized system for accessing study materials:

**Organization:** Notes are arranged in folders — typically by subject or unit, like a file manager.

**Navigation:** Tap a folder to go inside → tap a PDF file to open it → use the back button to go up one level.

**Built-in PDF viewer features:**
- Opens PDFs directly inside the app — no download needed
- Pinch to zoom on mobile
- Smooth page scrolling
- Full-screen mode for distraction-free reading
- Works offline if the file was previously loaded

**Content curation:** Only admin-approved materials appear, ensuring quality.

## 5.6 Settings & Profile

**Profile:**
- View name, email, photo (from Google account), batch, department, section, role
- Edit display name

**Display Settings:**
- Light Mode (white background — best for outdoor use)
- Dark Mode (dark background — best for nighttime, saves battery on OLED screens)
- Auto Mode (follows the device's system theme setting automatically)

**Security:**
- Change password (with verification)
- Create a password (if signed up with Google, enables email+password login)
- Link/unlink Google account
- Delete account (permanent — removes all data)

**Storage & Data:**
- View cached data size
- Clear cache to free space (app re-downloads when needed)

**User Directory:**
- Browse all registered Neram users
- Filter by batch → department → section
- View classmate profiles

**About Section:**
- App version and build info
- College information
- Management team details
- Developer credits
- Contact & feedback options
- Quick links to important college portals

## 5.7 Android-Only Features

**Push Notifications:**
Automatic alerts delivered to the phone for new exams, timetable changes, and announcements. Students never miss important updates even if they don't open the app.

**Offline Mode:**
The entire timetable, exam schedules, and calendar data are cached locally using Room Database (SQLite). Students can view all their academic data even without an internet connection. When internet reconnects, data syncs automatically.

**Background Sync:**
Android WorkManager runs periodic background tasks to fetch the latest data from Firebase and store it locally. This ensures the cached data is always recent, even if the student hasn't opened the app in a while.

**Onboarding:**
First-time users see a guided welcome slideshow explaining all features, followed by a setup screen to select their Batch, Department, and Section.

**Pull-to-Refresh:**
Native swipe-down gesture on any screen to force-refresh and get the latest data.

**App Permissions — privacy-friendly:**
- Internet (to sync data)
- Notifications (to send alerts)
- No camera, microphone, contacts, or location permissions needed.

## 5.8 Multi-Platform Access

Neram works everywhere:

| Platform | How to Access |
|---|---|
| Android Phone | Native app (APK) or browser |
| iPhone / iPad | Safari → "Add to Home Screen" (PWA) |
| Windows PC | Any browser (Chrome, Edge, Firefox) — installable as app |
| Mac | Safari, Chrome, or Firefox — installable as app |
| Linux | Any browser |
| Chromebook | Chrome browser — installable as PWA |

**Cross-device sync:** Sign in with the same account on any device — data syncs across all of them automatically.

---

# 6. ADMIN PORTAL — ALL 16 MANAGEMENT MODULES

The Admin Portal is a comprehensive management dashboard with 16 modules. It is accessed via a separate web URL or the dedicated Admin Android App (green icon).

## Module 1: Admin Dashboard
**Access:** Super Admin, Faculty, Student Rep

The home screen of the Admin Portal. Shows a welcome message, the admin's name and role, and quick-access cards for every module they have permission to use. Each card has the module name, icon, and brief description. Click any card to navigate directly.

## Module 2: Schedule Manager ⭐ (Core Module)
**Access:** Super Admin ✅ | Faculty ✅ | Rep ✅ (own section only)

The most important admin module — this is where timetables are created and managed.

**How it works, step by step:**

Step 1 — Select Target: Choose Batch → Department → Section (e.g., 2023-2027 → ECE → A)

Step 2 — Manage Courses: Before building the timetable, add all subjects:
- Click "Add Course"
- Enter Subject Code (e.g., EC301), Subject Name (e.g., Digital Electronics), Faculty Name (e.g., Dr. Kumar), Room Number (e.g., Room 204)
- Save and repeat for all subjects

Step 3 — Build the Timetable:
- Visual Monday to Saturday grid with period slots
- Click any empty cell → select a subject from the course list → faculty and room auto-fill
- Save when done

Step 4 — Instant Distribution:
- The timetable is live on all student devices within 1-2 seconds
- No PDFs to create, no WhatsApp messages to send — it just works

**Editing an existing timetable:**
- Click any filled cell → change the subject or clear it → Save
- Changes propagate instantly

**Counseling setup:**
- Separate tab to configure counselor assignments and student groups

## Module 3: Exam Manager ⭐ (Core Module)
**Access:** Super Admin ✅ | Faculty ✅ | Rep ✅

Create, manage, and publish exam schedules for all exam types.

**Supported exam types:** CT1, CT2, IA1, IA2, Model, Semester, Practical

**Creating an exam, step by step:**

Step 1 — Select Batch → Department

Step 2 — Basic Details:
- Exam type (e.g., CT1)
- Title (e.g., "Cycle Test 1 — March 2026")
- Scope: Common (same exam for ALL sections) or Section-specific

Step 3 — Add Subjects:
- For each subject: select the subject, set the date, start time, end time, and portion/syllabus
- For practical exams: additional fields for batch number, register number range, lab name, and time slot

Step 4 — Publish:
- System automatically sorts all subjects by date before saving
- All students in the selected scope see the exam schedule instantly

**Editing:** Click pencil icon → make changes → system re-sorts by date and pushes update

**Deleting:** Click delete icon → confirm → exam removed from all student devices

**Bulk operations:** Select multiple exams for batch deletion

## Module 4: Calendar Manager — Powered by Elvan Agazhi
**Access:** Super Admin ✅ | Faculty ✅ | Rep ❌

Manages the academic calendar. Two tabs:

**Tab 1 — Published Events:**
- View, add, edit, or delete individual calendar events manually
- Each event has: date, title, time (all day or specific), type (holiday/working/event/exam)
- Events appear on student Calendar screen instantly after saving

**Tab 2 — PDF Agazhi (Elvan Agazhi OCR Engine):**
The powerful tool that converts printed academic calendar PDFs into digital data automatically. See Section 7 for full details.

**Semester Configuration:**
- Set semester start and end dates
- Defines the date range for calendar displays on all platforms

## Module 5: Event Manager
**Access:** Super Admin ✅ | Faculty ✅ | Rep ✅

Create and manage college events — cultural events, seminars, workshops, sports events, technical fests.

**Creating an event:**
- Select scope: Batch → Department → Section (or "All")
- Enter title, date, time, description, and category
- Save — appears on student home screens

## Module 6: Notes Manager
**Access:** Super Admin ✅ | Faculty ✅ | Rep ✅

Upload and organize study materials for students in a folder-based structure.

**Features:**
- Create folders organized by subject or unit
- Add study materials by pasting PDF links (Google Drive, etc.)
- Full-screen creator on mobile for easier editing
- Approval workflow for submitted materials
- Materials appear in the student Notes section organized and ready to view

## Module 7: Special Class Manager
**Access:** Super Admin ✅ | Faculty ✅ | Rep ✅

Schedule extra classes, remedial sessions, or makeup lectures outside the regular timetable.

**Creating a special class:**
- Select Batch → Department → Section
- Select subject from course list
- Set date, time, room, and reason (e.g., "Extra class for Unit 3 completion")
- Students see special classes on their Home screen and Schedule with a distinctive marker

## Module 8: Faculty Directory
**Access:** Super Admin ✅ only

Manage the faculty listing visible to students.

**Features:**
- Add faculty with: name, designation, department, email, phone, photo URL
- Edit or delete faculty entries
- Department-wise organization

## Module 9: User Management
**Access:** Super Admin ✅ | Faculty ✅ | Rep ❌

View and manage all registered users in the system.

**Features:**
- Search by name or email
- Browse hierarchically: Batch folders → Department folders → Section folders → Students
- View user details: name, email, role, batch, department, section
- Edit mode for bulk operations

## Module 10: Admin Role Manager ⭐ (Critical Module)
**Access:** Super Admin ✅ (full) | Faculty ✅ (limited) | Rep ✅ (limited)

Promote or demote users — assign admin roles with strict hierarchy enforcement.

**Two views:**

View 1 — Promote: Search any student by name or email → click "Make Rep", "Make Faculty", or "Make Super Admin"

View 2 — Manage Existing Admins: Three tabs (Student Reps | Faculty | Super Admins) showing current admins with demotion options

**Role hierarchy enforcement:**
- Super Admins can promote to any role and demote anyone
- Faculty can promote/remove Reps and remove other Faculty
- Reps can only remove other Reps
- Hardcoded admin emails are protected and cannot be demoted via UI

## Module 11: Resource Manager
**Access:** Super Admin ✅ only

Share academic resources like syllabus documents, regulation PDFs, and reference materials. Students access these from the College Sites/Resources section.

## Module 12: Pending Requests
**Access:** Super Admin ✅ only

Review and process user approval requests. New users who need admin approval appear here. Review request details and click Approve or Reject.

## Module 13: Archive / Semester Transition Tool
**Access:** Super Admin ✅ (Desktop only)

Semester transition management — archive current semester's data before starting fresh.

**When to use:** At the end of each semester. Archives old timetables, exams, and events to the archives node in Firebase. After archiving, create fresh timetables for the new semester.

Hidden on mobile devices to prevent accidental data archival.

## Module 14: Live Updates (via Dashboard)
**Access:** Super Admin ✅ | Faculty ✅ | Rep ✅

Post real-time daily updates visible on every student's home screen. Includes author attribution. Replaces WhatsApp broadcast messages.

## Module 15: Admin Profile
**Access:** All admins

View and edit admin account details, assigned role, and display name.

## Module 16: Admin Settings
**Access:** All admins

System preferences and theme settings for the admin portal.

---

# 7. ELVAN AGAZHI — THE OCR CALENDAR ENGINE

## The Problem
Colleges publish academic calendars as printed PDF documents. These contain 100+ events (holidays, working days, exams, events) spread across multiple pages. Manually entering each event into a digital system takes 3+ hours and is error-prone.

## The Solution
**Elvan Agazhi** is a custom-built OCR (Optical Character Recognition) pipeline that converts any academic calendar PDF into structured digital data automatically, using entirely client-side processing (runs in the browser — no server costs).

## How It Works — Step by Step

**Step 1 — Upload PDF:**
Upload the college's official academic calendar PDF. The system renders the first page using pdf.js (Mozilla's PDF renderer).

**Step 2 — Crop the Calendar Column:**
Draw a crop rectangle around the calendar data column on Page 1. This same crop reference is applied to all subsequent pages automatically.

**Step 3 — OCR Text Extraction:**
Click "Extract" — the system uses Tesseract.js (WebAssembly-based OCR engine) to extract text from the cropped region. Can process a single page or batch-process all pages. Takes approximately 5-8 seconds per page.

**Step 4 — Side-by-Side Comparison:**
Click "Compare" to see the original PDF page side-by-side with the extracted text. This lets the admin verify OCR accuracy and spot any errors.

**Step 5 — Calendar Builder:**
Click "Build Calendar" — a visual editor opens showing month-by-month tables with columns for Date, Day, Event, Working Day Number, and Type. Every field is editable — the admin corrects any OCR errors by clicking and typing.

**Step 6 — One-Click Push to Firebase:**
Select the target Batch → click "Push to Firebase" → confirm. All students in that batch instantly see the calendar events on their devices. Done.

## Key Technical Details
- **pdf.js** renders PDF pages to HTML canvas at configurable resolution
- **Cropper.js** provides the interactive crop selection tool
- **Tesseract.js** (v7.0, WebAssembly) performs OCR with configurable Page Segmentation Modes (PSM)
- **calendarParser.js** uses pattern matching to extract dates, events, and working day markers
- **CalendarBuilder.jsx** provides the visual review and editing interface
- **calendarExport.js** converts structured data to Firebase format

## What Makes Elvan Agazhi Special
- **Entirely client-side** — all processing runs in the user's browser. Zero server cost, zero API fees.
- **Batch processing** — OCR all pages with a single crop reference, not one-by-one
- **Editable output** — every field can be corrected before publishing
- **Comparison view** — side-by-side original vs extracted for quality assurance
- **One-click publish** — instant distribution to all student devices
- **Replaces 3+ hours of manual work with ~15 minutes** of OCR + review

---

# 8. ROLE-BASED ACCESS CONTROL (RBAC)

Neram uses a strict 4-tier hierarchical security system:

## Tier 1: Super Admin 🔴
**Who:** HOD, Principal, IT Staff, Designated administrators
**Access:** Full system access — all 16 modules, all departments, all sections
**Can do:** Everything. Manage all data, promote/demote all roles, archive semesters, manage faculty directory, process pending requests.

## Tier 2: Faculty Admin 🟣
**Who:** Department coordinators, faculty members with management responsibilities
**Access:** Department-level — manage schedules, exams, events, notes, calendar
**Can do:** Edit any section's schedule, publish exams, digitize calendars, promote/remove Reps, view user data
**Cannot do:** Access Faculty Directory, Resources, Pending Requests, or Archive Tool. Cannot promote to Super Admin.

## Tier 3: Student Rep 🔵
**Who:** Elected class representatives
**Access:** Section-level — their own section only
**Can do:** Edit their section's timetable, publish exams for their section, post daily updates, schedule special classes
**Cannot do:** Access Calendar Manager, User Management, or edit other sections

## Tier 4: Student ⚪
**Who:** All registered students (default role for every new user)
**Access:** Read-only — view schedule, exams, calendar, notes, settings
**Cannot do:** Modify any data

## Security Enforcement

**Database-level rules:**
Firebase Security Rules enforce access control at the database level. Even if someone bypasses the UI, unauthorized writes are rejected by Firebase itself. Security is not just UI-level — it's structural.

**Hardcoded admin protection:**
Core administrator email addresses are stored in the source code (not in the database). These accounts cannot be demoted or removed via the admin interface. This ensures the system always has at least one super admin and cannot be locked out.

**Per-section isolation:**
Student Reps can only write data for their assigned section. Even with admin access, they cannot modify other sections' data.

**Institutional login:**
Authentication is restricted to @rmd.ac.in Google accounts using Firebase Authentication + Google Sign-In. This ensures only verified college members can access the system.

---

# 9. TECHNOLOGY STACK

| Layer | Technology | Role |
|---|---|---|
| Web Frontend | React 19 + Vite 7 | Component-based SPA with fast HMR and code splitting |
| Styling | Vanilla CSS | Full design control — no framework dependency. macOS-quality glassmorphism UI |
| Mobile App | Kotlin + Jetpack Compose | Modern Android standard with Material Design 3, native performance |
| Admin Wrapper | Kotlin WebView + NativeBridge | Wraps the web admin portal in a native Android shell with Google Sign-In bridge |
| Database | Firebase Realtime Database | NoSQL, real-time listeners for instant sync, free tier (1GB storage, 10GB/month) |
| Authentication | Firebase Auth + Google OAuth 2.0 | Industry-standard security, supports institutional @rmd.ac.in accounts |
| OCR Engine | Tesseract.js 7.0 (WebAssembly) | Client-side OCR — no server required, multi-language support |
| PDF Processing | pdf.js 5.4 | Mozilla's PDF renderer, canvas-based page extraction |
| Offline Storage | Room Database (SQLite) | Android Jetpack persistence library, survives app restarts |
| Background Sync | WorkManager | Guaranteed periodic sync even when app is killed by OS |
| Hosting | Vercel (CDN) | Auto-deploy from Git push, global edge network, zero configuration |
| Icons | React Icons (Remix Icon set) | Consistent iconography across all screens |
| Typography | Inter Variable (Google Fonts) | Modern, highly readable typeface across all platforms |
| Routing | React Router DOM 7 | Client-side routing with BrowserRouter (student) + HashRouter (admin) |

## Architecture Principles
- **Single Source of Truth** — Firebase Realtime Database is the central data store; all apps read from it
- **Real-Time Sync** — Firebase listeners trigger instant updates on all connected devices
- **Offline-First (Mobile)** — Room Database caches data locally; app works without internet
- **Role-Based Access** — Every database node has security rules tied to user roles
- **Multi-Entry Web** — Student Portal and Admin Portal are separate HTML entry points sharing the same React codebase
- **Portable Design** — Only 4 config files need changing to deploy anywhere

---

# 10. DESIGN PHILOSOPHY

Neram follows a **macOS Sequoia-inspired** design language across both web and mobile:

**Glassmorphism:** Frosted-glass effect on sidebars, navigation bars, and modal overlays — creating depth and visual richness.

**Rounded Cards:** 24–32px border radius on all card elements for a premium, soft aesthetic.

**Smooth Animations:** Cubic-bezier transitions and slide-in micro-interactions throughout the interface — buttons, cards, page transitions all feel fluid and responsive.

**System-Aware Theming:** Automatic dark/light mode that matches the user's operating system setting. Smooth transitions when switching themes.

**Safe Area Handling:** Proper status bar and notch padding on Android devices — the UI never clips behind system elements.

**Responsive Layout:** Desktop shows a full sidebar navigation. Below 768px, it collapses to a mobile bottom navigation bar.

**Dual Color Identity:**
- Student App → Gradient Blue (#002DFF → #00B1FF)
- Admin App → Elf Green (#088370)
This visual separation ensures users always know which portal they're in.

**63,000+ lines of handwritten CSS** — no CSS framework, no shortcuts, every pixel is intentional.

---

# 11. PROJECT STATISTICS

| Metric | Value |
|---|---|
| Development Period | 4 months (December 2025 – March 2026) |
| Total Git Commits | 304+ |
| Active Users | 85+ students (single class deployment) |
| Web Modules (Vite Build) | 906 modules compiled |
| Admin Sub-Modules | 16 management tools |
| Android Compose Screens | 16+ screens |
| Android Apps | 2 (Student Native + Admin WebView Wrapper) |
| CSS Lines Written | 63,000+ |
| Firebase Security Rules | 94 lines covering 12 data nodes |
| Calendar Engine | Elvan Agazhi (custom Tesseract OCR + pdf.js pipeline) |
| Platforms Supported | Web (PWA) + Android × 2 |
| Monthly Operating Cost | ₹0 |

---

# 12. COST ANALYSIS

## Current Cost: ₹0 per Month

| Service | Free Tier Limit | Neram's Usage | Monthly Cost |
|---|---|---|---|
| Firebase Realtime Database | 1 GB storage, 10 GB/month transfer | ~50–100 MB data | ₹0 |
| Firebase Authentication | 10,000 sign-ins/month | ~500–2,000 students | ₹0 |
| Vercel Web Hosting | 100 GB bandwidth/month | ~5–10 GB/month | ₹0 |
| GitHub Repository | Unlimited private repos | 1 repository | ₹0 |
| OCR Engine (Elvan Agazhi) | Client-side (browser) | No server needed | ₹0 |
| **TOTAL** | | | **₹0** |

## When Would Costs Arise?
- 5,000+ daily active users → may exceed Firebase free tier → Blaze plan ($0.001/operation)
- Custom domain (e.g., neram.rmd.ac.in) → domain registration (~₹500/year)
- Google Play Store listing → one-time $25 (~₹2,100) developer account fee

**For a single college with 2,000–5,000 students, the entire system runs completely free.**

---

# 13. COLLEGE INTEGRATION & HANDOVER PLAN

## Only 4 Files Need to Change

The entire codebase is designed to be portable. To deploy Neram for any institution, only four configuration files need modification:

| File | What Changes |
|---|---|
| `web/src/firebase.js` | Firebase project credentials (API key, project ID) |
| `web/src/data/admins.js` | Super admin email addresses (hardcoded protection) |
| `mobile/app/google-services.json` | Android app Firebase configuration |
| `mobile/admin/.../AppConfig.kt` | Admin wrapper URL and Google Sign-In client ID |

Everything else remains the same. No code rewriting needed.

## 5-Day Handover Timeline

**Day 1–2: Account Setup**
- Create college Google account (e.g., neram@rmd.ac.in)
- Create Firebase project under college account
- Enable Firebase Authentication with Google Sign-In
- Set up Realtime Database with security rules

**Day 2–3: Code Transfer**
- Fork or transfer GitHub repository to college's organization
- Update the 4 config files with new credentials
- Update admin email addresses

**Day 3–4: Data Migration**
- Export existing Firebase data (JSON export)
- Import into new Firebase project
- Upload academic calendar using Elvan Agazhi
- Import database security rules

**Day 4–5: Deployment**
- Deploy web app to Vercel (git push triggers auto-deployment)
- Build signed Android APKs (Student + Admin)
- Test all logins with @rmd.ac.in accounts
- Assign initial admin roles

**Week 2: Rollout**
- Pilot with one department for 1 week
- Gather feedback and fix workflow-specific issues
- Full rollout to all departments and batches
- Train faculty admins

## Training Requirements

| Audience | Duration | Content |
|---|---|---|
| Super Admins (HOD / Principal) | 30 minutes | Dashboard overview, role management |
| Faculty Admins | 45 minutes | Schedule Manager, Exam Manager, Calendar Manager, Notes Manager |
| Class Representatives | 20 minutes | How to update section schedule, post updates, publish exams |
| Students | 5 minutes | Download app, sign in, navigate (the UI is self-explanatory) |

---

# 14. COMPETITIVE ADVANTAGES

## vs. WhatsApp Groups

| Feature | WhatsApp | Neram |
|---|---|---|
| Structured timetable | ❌ Photos/PDFs get buried in chat | ✅ Always accessible, always current |
| Exam schedule | ❌ Forwarded messages lost in noise | ✅ Date-sorted, searchable, structured |
| Push notifications | ❌ Lost among group messages | ✅ Targeted, specific alerts |
| Access control | ❌ Anyone can post anything | ✅ Role-based — only authorized users  |
| History | ❌ Messages expire or get deleted | ✅ Permanent database record |
| Search | ❌ Limited message search | ✅ Full search and filtering |

## vs. Traditional College Websites

| Feature | Traditional Website | Neram |
|---|---|---|
| Real-time updates | ❌ Manual HTML uploads by webmaster | ✅ Instant Firebase sync |
| Mobile experience | ❌ Non-responsive pages | ✅ Native Android app + PWA |
| Personalization | ❌ Same page for everyone | ✅ Shows YOUR section's specific data |
| Offline access | ❌ Requires internet | ✅ Cached locally on phone |
| Admin effort | ❌ Needs a web developer | ✅ Point-and-click dashboard |

## vs. Commercial LMS (Moodle, Google Classroom)

| Feature | Commercial LMS | Neram |
|---|---|---|
| Cost | 💸 Licensing/hosting fees | ✅ Completely free |
| Complexity | ❌ Over-engineered, steep learning curve | ✅ Purpose-built, simple and focused |
| Mobile app | ❌ Generic or non-existent | ✅ Custom native Android app |
| Setup time | ❌ Weeks to months | ✅ Days |
| Customization | ❌ Fixed templates | ✅ Full source code ownership |
| Timetable focus | ❌ Not a primary feature | ✅ Core feature with visual builder |

## Unique Features Only Neram Has

1. **Elvan Agazhi OCR Engine** — converts printed PDF calendars to digital data automatically
2. **Batch → Department → Section hierarchy** matching the college's actual academic structure
3. **Central exam publishing** — one click distributes exams to all sections simultaneously
4. **Practical exam batch tracking** — register number ranges with lab session scheduling
5. **Rep delegation** — class reps can manage their own section's schedule independently
6. **Semester archive tool** — clean data transition between semesters
7. **Admin preview** — admins can view the student experience for any section
8. **macOS Sequoia-quality design** — premium glassmorphism UI that rivals commercial applications

---

# 15. SCALABILITY & FUTURE ROADMAP

## Current Capacity
- Supports unlimited batches, departments, and sections
- Designed for 2,000–5,000+ students
- Real-time sync handles concurrent users efficiently
- Adding a new department requires zero code changes — admin adds it in Firebase (2 clicks), and it's live

## Potential Future Enhancements

| Feature | Estimated Effort | Impact |
|---|---|---|
| iOS App (Swift/SwiftUI) | 4–6 weeks | Reach iPhone users with native app |
| Attendance Tracking | 2–3 weeks | Digital attendance system for faculty |
| Assignment Submission | 3–4 weeks | Students submit work through the app |
| GPA Calculator | 1 week | Auto-calculate from exam marks |
| Bus Route Tracker | 2 weeks | College transport information |
| Push-to-All Notifications | 1 week | Mass notification system for emergencies |
| Multi-College Support | 4–6 weeks | Deploy for sister institutions without forking |
| Analytics Dashboard | 2–3 weeks | Usage stats, student engagement metrics |
| AI-Powered OCR | 2 weeks | Machine learning preprocessing for better Agazhi accuracy |

---

# 16. HOW TO DEMO NERAM

For anyone seeing the system for the first time, here's how to demonstrate its capabilities:

**Demo 1 — Real-Time Sync (Most Impressive):**
Open the Admin Portal on one device. Open the Student App on another device. Make a timetable change on the admin → watch it update on the student app within 2 seconds. This single demo communicates the core value of the system.

**Demo 2 — Student Experience:**
Open the web app or Android app → sign in → navigate through Home (today's classes), Schedule (weekly timetable), Exams (exam schedules), Calendar (academic calendar), Notes (study materials). Show how everything is organized and accessible in one place.

**Demo 3 — Admin Power:**
Open the admin portal → show the Dashboard, Schedule Manager (build a timetable visually), Exam Manager (publish an exam), Role Manager (promote a student to rep). Demonstrate how easy it is to manage academic data without any technical knowledge.

**Demo 4 — Offline Mode:**
On the Android app → turn off WiFi and mobile data → show that all timetable, exam, and calendar data is still accessible. Turn internet back on → data syncs automatically.

**Demo 5 — OCR Calendar Engine:**
In Calendar Manager → upload a sample PDF → watch Elvan Agazhi crop, extract text, build calendar → one click to publish. This demonstrates the custom innovation that no other system has.

---

**NERAM — நேரம்**
*Making academic time management effortless.*

Developed by **Elvan Parthasarathy**
Electronics & Communication Engineering
RMD Engineering College
March 2026

**304+ commits • 85+ active users • ₹0 operating cost • 3 platforms • 16 admin modules • Built with ❤️**

---

[Screenshots to be attached: Admin Panel (Light + Dark Mode), Mobile App Screens (Light + Dark Mode)]

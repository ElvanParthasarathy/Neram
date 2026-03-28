# Neram Admin Portal — User Guide
### For Super Admins, Faculty Admins & Student Reps

> This guide explains how to use the **Neram Admin Portal** — the management dashboard for creating timetables, publishing exams, managing calendars, and controlling the entire academic data system.

---

## Table of Contents

1. [Accessing the Admin Portal](#1-accessing-the-admin-portal)
2. [Understanding Your Role](#2-understanding-your-role)
3. [Admin Dashboard](#3-admin-dashboard)
4. [Schedule Manager](#4-schedule-manager)
5. [Exam Manager](#5-exam-manager)
6. [Calendar Manager](#6-calendar-manager)
7. [Event Manager](#7-event-manager)
8. [Notes Manager](#8-notes-manager)
9. [Special Class Manager](#9-special-class-manager)
10. [Admin Role Manager](#10-admin-role-manager)
11. [User Management](#11-user-management)
12. [Faculty Directory](#12-faculty-directory)
13. [Resource Manager](#13-resource-manager)
14. [Pending Requests](#14-pending-requests)
15. [Archive / Semester Transition](#15-archive--semester-transition)
16. [Admin Settings & Profile](#16-admin-settings--profile)
17. [Quick Reference by Role](#17-quick-reference-by-role)

---

## 1. Accessing the Admin Portal

### How to Open

| Platform | How to Access |
|---|---|
| **Desktop Browser** | Go to your college's admin URL (e.g., `adminneram.vercel.app/admin`) |
| **Mobile Browser** | Same URL in Chrome/Safari |
| **Admin Android App** 🟢 | Open the dedicated Admin app (green icon) on your phone |

### Signing In
1. Open the Admin Portal
2. Tap **"Get Started"** → then **"Sign In"**
3. Choose your sign-in method:
   - **Continue with Google** — Use your college Google account (recommended)
   - **Email & Password** — Use your registered email and password
4. If your account has admin privileges, you'll see the Dashboard
5. If not, you'll see a **"Pending Approval"** screen — contact your Super Admin

### Navigation

| Desktop | Mobile |
|---|---|
| **Left sidebar** lists all modules | **Top bar** with ☰ hamburger menu |
| Click any module name to open it | Tap ☰ → tap a module to open it |
| Your profile is shown at the bottom of sidebar | Profile shown at top of the drawer |

---

## 2. Understanding Your Role

### What Can I Access?

| Module | 🔴 Super Admin | 🟣 Faculty | 🔵 Student Rep |
|---|---|---|---|
| **Dashboard** | ✅ | ✅ | ✅ |
| **Schedule Manager** | ✅ All sections | ✅ All sections | ✅ Own section only |
| **Exam Manager** | ✅ All departments | ✅ All departments | ✅ Own section only |
| **Event Manager** | ✅ | ✅ | ✅ |
| **Notes Manager** | ✅ | ✅ | ✅ |
| **Special Class Manager** | ✅ | ✅ | ✅ |
| **Admin Role Manager** | ✅ Full control | ✅ Limited (can manage reps) | ✅ Limited (can manage reps) |
| **Calendar Manager** | ✅ | ✅ | ❌ |
| **User Management** | ✅ | ✅ | ❌ |
| **Faculty Directory** | ✅ | ❌ | ❌ |
| **Resource Manager** | ✅ | ❌ | ❌ |
| **Pending Requests** | ✅ | ❌ | ❌ |
| **Archive Tool** | ✅ Desktop only | ❌ | ❌ |
| **Admin Settings** | ✅ | ✅ | ✅ |
| **Admin Profile** | ✅ | ✅ | ✅ |

> 💡 Modules you don't have access to **won't appear** in your navigation. You don't need to worry about accidentally clicking something you can't use.

---

## 3. Admin Dashboard

**Who can use:** Everyone (Super Admin, Faculty, Rep)

Your home screen when you open the Admin Portal.

### What It Shows
- **Welcome message** with your name and role
- **Quick-access cards** for every module you have access to
- Each card shows the module name, icon, and a brief description

### How to Use
- Click/tap any card to jump directly to that module
- Or use the sidebar (desktop) / drawer menu (mobile) to navigate

---

## 4. Schedule Manager

**Who can use:** Super Admin ✅ | Faculty ✅ | Rep ✅ (own section)

The most important module. This is where you **create and edit timetables** for each section.

### Step-by-Step: Create a Timetable

#### Step 1 — Select Your Target
1. Open **Schedule Manager**
2. Choose: **Batch** → **Department** → **Section**
   - Example: `2023-2027` → `ECE` → `A`

#### Step 2 — Manage Courses
Before building the timetable, add the subjects:
1. Click **"Courses"** tab
2. Click **"Add Course"**
3. Fill in:
   - **Subject Code** (e.g., EC301)
   - **Subject Name** (e.g., Digital Electronics)
   - **Faculty Name** (e.g., Dr. Kumar)
   - **Room Number** (e.g., Room 204)
4. Click **Save**
5. Repeat for all subjects

#### Step 3 — Build the Timetable
1. Click the **"Timetable"** tab
2. You'll see a **Monday to Saturday** grid with period slots
3. For each slot:
   - Click the empty cell
   - Select a **subject** from your course list
   - The faculty and room auto-fill from the course data
4. Click **"Save"** when done

#### Step 4 — Verify
- Open the Student App or Student Web Portal
- Navigate to Schedule → check that your new timetable appears
- Changes sync **within 1-2 seconds**

### Editing an Existing Timetable
- Click any filled cell → change the subject or clear it
- Click **Save** to push updates instantly

### Counseling Setup
1. Click the **"Counseling"** tab
2. Add counselor names and their assigned student groups
3. Save

> ⚠️ **Reps:** You can only edit YOUR own section. If you need to change another section, ask a Faculty Admin or Super Admin.

---

## 5. Exam Manager

**Who can use:** Super Admin ✅ | Faculty ✅ | Rep ✅

### Supported Exam Types

| Type | Code | Description |
|---|---|---|
| Cycle Test 1 | CT1 | Short internal test |
| Cycle Test 2 | CT2 | Short internal test |
| Internal Assessment 1 | IA1 | Mid-term assessment |
| Internal Assessment 2 | IA2 | Mid-term assessment |
| Model Exam | MODEL | Full practice exam |
| Semester Exam | SEM | Final university exam |
| Practical Exam | PRACTICAL | Lab/hands-on exam |

### Step-by-Step: Publish an Exam

#### Step 1 — Select Target
1. Open **Exam Manager**
2. Choose: **Batch** → **Department**
3. Click **"Create New Exam"**

#### Step 2 — Basic Details
1. Select **Exam Type** (e.g., CT1)
2. Enter **Title** (e.g., "Cycle Test 1 — March 2026")
3. Choose **Scope:**
   - **Common** = Same exam for ALL sections in the department
   - **Section-specific** = Only for the section(s) you select

#### Step 3 — Add Subjects
For each subject in the exam:
1. Click **"Add Subject"**
2. Select the **Subject** from your course list
3. Set the **Date** (e.g., March 15, 2026)
4. Set **Start Time** and **End Time**
5. Enter **Portion/Syllabus** (e.g., "Units 1 & 2")

#### Step 4 — Publish
1. Review all subjects and dates
2. Click **"Publish Exam"**
3. The system **automatically sorts subjects by date** before saving
4. All students in the selected scope see the exam schedule instantly

### For Practical Exams
Practical exams have extra fields:
1. Select type as **"Practical"**
2. For each batch:
   - Enter **Batch Number** (e.g., Batch 1)
   - Enter **Register Number Range** (e.g., 23ECE001 – 23ECE030)
   - Set **Lab Name** and **Time Slot**

### Editing an Existing Exam
1. Find the exam in the list
2. Click the **pencil icon** (✏️) to edit
3. Make changes → click **"Resave"**
4. The system **re-sorts all subjects by date** and pushes the update

### Deleting Exams
1. Click the **delete icon** (🗑️) on the exam
2. Confirm the deletion
3. The exam is removed from all student devices

> 💡 **Tip:** Exams are automatically sorted by date when published. Even if you add subjects out of order, they'll appear correctly on student devices.

---

## 6. Calendar Manager

**Who can use:** Super Admin ✅ | Faculty ✅ | Rep ❌

Manages the **academic calendar** — holidays, working days, events, and important dates.

### Two Tabs

#### Tab 1: Published Events
- View, add, edit, or delete individual calendar events
- Each event has: **Date**, **Title**, **Full Time** (All Day or specific time), **Type**
- Click **"Add Event"** to create a new one manually
- Events appear on the student Calendar screen instantly

#### Tab 2: PDF Agazhi (Elvan Agazhi OCR Engine)
This is the powerful tool that converts a **printed academic calendar PDF** into digital events automatically.

##### How to Use Elvan Agazhi:

**Step 1 — Upload PDF**
1. Click **"Upload PDF"**
2. Select your college's official academic calendar PDF
3. The first page renders in the workspace

**Step 2 — Crop the Calendar Column**
1. Draw a **crop rectangle** around the calendar data column on Page 1
2. This same crop will be applied to all pages automatically

**Step 3 — Extract Text (OCR)**
1. Click **"Extract Current Page"** for a single page, OR
2. Click **"Extract All Pages"** to batch-process the entire PDF
3. Wait for Tesseract OCR to process each page (~5-8 seconds per page)
4. Extracted text appears in the sidebar

**Step 4 — Review & Compare**
1. Click **"Compare"** to see side-by-side: original PDF vs extracted text
2. Check for OCR errors (especially in dates and event names)

**Step 5 — Build Calendar**
1. Click **"Build Calendar"**
2. A visual **Calendar Builder** opens showing month-by-month tables
3. Each row has: **Date**, **Day**, **Event**, **Working Day Number**, **Type**
4. **Edit any field** that the OCR got wrong — click the cell and type the correction
5. Delete unwanted rows by clicking the ✕ button

**Step 6 — Push to Firebase**
1. Select the **Batch** to publish for (e.g., "2023-2027")
2. Click **"Push to Firebase"**
3. Confirm the action
4. All students in that batch immediately see the calendar events!

> 💡 **This replaces 3+ hours of manual data entry with ~15 minutes of OCR + review.**

### Semester Configuration
- Set **Semester Start Date** and **Semester End Date**
- This defines the date range for calendar displays

---

## 7. Event Manager

**Who can use:** Super Admin ✅ | Faculty ✅ | Rep ✅

Create and manage **college events** (cultural events, seminars, workshops, etc.).

### Creating an Event
1. Open **Event Manager**
2. Choose: **Batch** → **Department** → **Section** (or "All")
3. Click **"Create Event"**
4. Fill in:
   - **Title** (e.g., "Cultural Fest 2026")
   - **Date** and **Time**
   - **Description** (optional)
   - **Category** (e.g., Cultural, Technical, Sports)
5. Click **Save**

### Managing Events
- **Edit:** Click the pencil icon on any event
- **Delete:** Click the trash icon and confirm

---

## 8. Notes Manager

**Who can use:** Super Admin ✅ | Faculty ✅ | Rep ✅

Upload and organize **study materials** for students.

### How It Works
- Notes are organized in a **folder structure** (like a file manager)
- You can create folders (e.g., by subject or unit) and add files inside them

### Uploading Materials
1. Open **Notes Manager**
2. Navigate to the desired folder (or create a new one)
3. Click **"Add Note"** or **"Upload"**
4. Enter the **title** and paste the **PDF link** (Google Drive, etc.)
5. Save

### Creating Folders
1. Click **"New Folder"**
2. Enter a name (e.g., "EC301 — Digital Electronics")
3. Click Create

### Full-Screen Creator (Mobile)
On mobile, the notes creator expands to **full screen** for easier editing — giving you more space to work.

---

## 9. Special Class Manager

**Who can use:** Super Admin ✅ | Faculty ✅ | Rep ✅

Schedule **extra classes, remedial sessions, or makeup lectures** outside the regular timetable.

### Creating a Special Class
1. Open **Special Class Manager**
2. Choose: **Batch** → **Department** → **Section**
3. Click **"Add Special Class"**
4. Fill in:
   - **Subject** (select from course list)
   - **Date** and **Time**
   - **Room** (optional)
   - **Reason** (e.g., "Extra class for Unit 3 completion")
5. Save

Students see special classes on their Home screen and Schedule with a distinctive marker.

---

## 10. Admin Role Manager

**Who can use:** Super Admin ✅ (full) | Faculty ✅ (limited) | Rep ✅ (limited)

This is where you **promote or demote users** — assign admin roles to students and faculty.

### Understanding the Role Hierarchy

```
Super Admin (highest)
    ↕ can promote/demote
Faculty Admin
    ↕ can promote/demote
Student Rep
    ↕ (no management)
Student (lowest — default for everyone)
```

### Two Views

#### View 1: Promote (Grant Roles)
- Search for any student by name or email
- Click **"Make Rep"**, **"Make Faculty"**, or **"Make Super Admin"** (based on your permissions)

#### View 2: Manage Existing Admins
Three tabs: **Student Reps** | **Faculty** | **Super Admins**

Each tab shows users with that role. Click the **three-dot menu** (⋮) to see available actions:

### What Each Role Can Do Here

#### As Super Admin 🔴
| Target User | Available Actions |
|---|---|
| Student Rep | Remove Admin (demote to student) |
| Faculty Admin | Make Super Admin ↑ OR Remove Faculty ↓ |
| Super Admin | Downgrade to Faculty ↓ |
| Hardcoded Admin | 🔒 No actions (protected) |

#### As Faculty Admin 🟣
| Target User | Available Actions |
|---|---|
| Student Rep | Remove Admin (demote to student) |
| Faculty Admin | Remove Faculty (demote to student) |
| Super Admin | ❌ No access (can't see this tab) |

#### As Student Rep 🔵
| Target User | Available Actions |
|---|---|
| Student Rep | Remove Admin (demote to student) |
| Faculty/Super | ❌ No access |

### Promoting a Student to Rep
1. Go to **Admin Role Manager** → **Promote** tab
2. Search for the student's name or email
3. Click **"Make Rep"**
4. The student now has admin access to their own section

> ⚠️ **Hardcoded Admins:** Some admin emails are protected in the code and cannot be changed via this interface. This ensures the system always has at least one Super Admin.

---

## 11. User Management

**Who can use:** Super Admin ✅ | Faculty ✅ | Rep ❌

View and manage **all registered users** in the system.

### Features
- **Search** by name or email
- **Filter** by batch → department → section
- **View** user details: name, email, role, batch, department, section
- **Browse** through the complete user directory

### Navigation
1. First you see **Batch folders** (e.g., 2023-2027, 2024-2028)
2. Click a batch → see **Department folders** (ECE, CSE, etc.)
3. Click a department → see **Section folders** (A, B, C)
4. Click a section → see **all students** in that section

### Edit Mode
- Toggle **Edit Mode** to make bulk changes
- Select multiple users for batch operations

---

## 12. Faculty Directory

**Who can use:** Super Admin ✅ | Faculty ❌ | Rep ❌

Manage the **faculty listing** that students see.

### Adding Faculty
1. Open **Faculty Directory**
2. Click **"Add Faculty"**
3. Fill in:
   - **Name**
   - **Designation** (e.g., Assistant Professor)
   - **Department**
   - **Email** (optional)
   - **Phone** (optional)
   - **Photo URL** (optional)
4. Save

### Editing / Deleting
- Click any faculty card to edit their details
- Click the delete icon to remove

---

## 13. Resource Manager

**Who can use:** Super Admin ✅ | Faculty ❌ | Rep ❌

Share **academic resources** like syllabus documents, regulation PDFs, and reference materials.

### Adding Resources
1. Open **Resource Manager**
2. Click **"Add Resource"**
3. Enter: **Title**, **Description**, **Link** (URL to the document)
4. Save

Students can access these from the College Sites / Resources section.

---

## 14. Pending Requests

**Who can use:** Super Admin ✅ | Faculty ❌ | Rep ❌

Review and process **user approval requests**.

### How It Works
- When a new user signs up but needs admin approval, their request appears here
- Review the request details (name, email, requested batch/section)
- Click **Approve** to grant access or **Reject** to deny

---

## 15. Archive / Semester Transition

**Who can use:** Super Admin ✅ (Desktop only) | Faculty ❌ | Rep ❌

> ⚠️ This module is **only accessible on desktop**. It is hidden on mobile devices to prevent accidental use.

### What It Does
- **Archive** current semester's data before starting a new semester
- **Transition** — clean up old timetables, exams, and events
- **Backup** data to the archives node in Firebase

### When to Use
At the **end of each semester**, before setting up the next semester's timetables:
1. Open Archive Tool (desktop only)
2. Select the batch to archive
3. Review what will be archived
4. Confirm the archive action
5. Old data is moved to `archives/` in Firebase
6. You can now create fresh timetables for the new semester

---

## 16. Admin Settings & Profile

**Who can use:** Everyone (Super Admin, Faculty, Rep)

### Admin Profile
- View your admin account details
- See your assigned role
- Edit display name

### Admin Settings
- Accessible from the sidebar/drawer menu
- View system preferences
- Theme settings for the admin portal

---

## 17. Quick Reference by Role

### 🔵 I'm a Student Rep — What Do I Do?

| Task | Module | Steps |
|---|---|---|
| **Post a daily update** | Dashboard / Schedule Manager | Navigate to your section → Post update → Students see it on Home screen |
| **Edit my section's timetable** | Schedule Manager | Select your batch/dept/section → Edit periods → Save |
| **Publish an exam** | Exam Manager | Select batch/dept → Create Exam → Add subjects with dates → Publish |
| **Schedule an extra class** | Special Class Manager | Select your section → Add class → Save |
| **Add study notes** | Notes Manager | Create folder → Add PDF links → Save |
| **Create an event** | Event Manager | Select your section → Create Event → Save |
| **Make another student a Rep** | Admin Role Manager → Promote | Search the student → Click "Make Rep" |

#### Things to Remember
- You can **only edit your own section's data**
- You **cannot** access Calendar, User Management, Faculty Directory, Resources, or Archives
- Use the **Student App** (blue icon) for viewing your own timetable
- Use the **Admin Portal** (green icon) for making changes

---

### 🟣 I'm a Faculty Admin — What Do I Do?

| Task | Module | Steps |
|---|---|---|
| **Create timetable for any section** | Schedule Manager | Select batch/dept/section → Add courses → Build timetable → Save |
| **Publish exams for the department** | Exam Manager | Select batch/dept → Create Exam → Set scope (common/section) → Publish |
| **Digitize the academic calendar** | Calendar Manager → PDF Agazhi | Upload PDF → Crop → OCR → Build Calendar → Push to Firebase |
| **Add calendar events manually** | Calendar Manager → Published | Click "Add Event" → Enter details → Save |
| **Upload study materials** | Notes Manager | Create folders → Add PDF links → Save |
| **Create college events** | Event Manager | Select scope → Create Event → Save |
| **Manage student reps** | Admin Role Manager | Promote students to Rep, or remove existing Reps |
| **View all students** | User Management | Browse by batch/dept/section, search by name |
| **Schedule extra classes** | Special Class Manager | Select section → Add class → Save |

#### Things to Remember
- You can edit **any section's** schedule within the departments you manage
- You can **promote and remove Student Reps**
- You can **remove other Faculty Admins** (demote to student)
- You **cannot** promote anyone to Super Admin
- You **cannot** access Faculty Directory, Resources, Pending Requests, or Archives

---

### 🔴 I'm a Super Admin — What Do I Do?

You have **full access to everything**. Here's the typical workflow:

#### Initial Setup (Start of Semester)
1. **Academic Structure** — Ensure all batches, departments, and sections are in the hierarchy
2. **Faculty Directory** — Add/update faculty members
3. **Courses** — Add all subjects via Schedule Manager for each department
4. **Timetables** — Build timetables for every section
5. **Calendar** — Use Elvan Agazhi to digitize the academic calendar PDF
6. **Admin Roles** — Assign Faculty Admins and Student Reps

#### Ongoing Management
| Task | Module |
|---|---|
| Publish exams | Exam Manager |
| Post announcements | Schedule Manager → Updates |
| Update calendar events | Calendar Manager |
| Upload study materials | Notes Manager |
| Handle user issues | User Management |
| Manage admin roles | Admin Role Manager |
| Schedule extra classes | Special Class Manager |
| Process approvals | Pending Requests |

#### End of Semester
1. **Archive** — Use the Archive Tool (desktop) to back up current data
2. **Clean Up** — Remove old exams and events
3. **Transition** — Set up new semester's timetables

#### Super Admin Exclusive Tools

| Tool | What Only You Can Do |
|---|---|
| **Faculty Directory** | Add/edit/remove faculty members |
| **Resource Manager** | Share syllabus and regulation documents |
| **Pending Requests** | Approve or reject new user registrations |
| **Archive Tool** | Archive and transition semester data (desktop only) |
| **Full Role Control** | Promote to Super Admin, demote Super Admins to Faculty |

---

## Common Workflows

### "A faculty changed — how do I update the timetable?"
1. Go to **Schedule Manager**
2. Select the affected section
3. Go to **Courses** tab → find the subject → update the faculty name
4. Save → all timetable slots with that subject automatically reflect the change

### "Mid-semester exam — how do I publish?"
1. Go to **Exam Manager**
2. Select batch and department
3. Create New Exam → type "IA1" or "CT2"
4. Add subjects with dates, times, and portions
5. Set scope (common for all sections, or section-specific)
6. Publish → students see it immediately

### "New academic calendar released — how do I update?"
1. Go to **Calendar Manager** → **PDF Agazhi** tab
2. Upload the new PDF
3. Crop → Extract → Build Calendar → correct any OCR errors
4. Push to Firebase → old events are replaced with new ones

### "A new class rep was elected — how do I change?"
1. Go to **Admin Role Manager**
2. In the **Student Reps** tab, find the old rep → click ⋮ → "Remove Admin"
3. Switch to **Promote** tab → search the new rep → click "Make Rep"

### "Student registered with wrong section — how to fix?"
1. Go to **User Management**
2. Search for the student
3. Contact them to update their profile in Settings, or update from your end

---

## Troubleshooting

### "I can't see a module in my menu"
Your role doesn't have access to that module. Check Section 2 for the access table. Contact your Super Admin if you believe you should have access.

### "I saved a timetable but students don't see it"
1. Make sure you clicked **Save** (not just edited)
2. Ask the student to **pull down to refresh**
3. Check that you selected the correct **batch/dept/section**

### "Elvan Agazhi OCR extracted garbage text"
1. Try a **higher quality PDF** (scanned at higher DPI)
2. Adjust the **crop box** to tightly fit just the calendar column
3. Try different **PSM modes** (Column mode = 4, Block mode = 6)
4. Manually correct errors in the Calendar Builder before pushing

### "I accidentally deleted an exam"
Deleted exams cannot be recovered. You'll need to recreate the exam using the Exam Manager.

### "I can't access the Archive Tool on my phone"
The Archive Tool is **desktop only** to prevent accidental data archival on mobile. Open the Admin Portal on a laptop or desktop computer.

---

*Neram Admin Portal — Manage your college's academics from anywhere.* 🛡️

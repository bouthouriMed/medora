# Medora Manual Test Cases

## Setup
```bash
cd backend
npm run db:up          # Start PostgreSQL + Redis
npm run prisma:migrate # Run migrations
npm run db:seed        # Seed test data
npm run dev            # Start backend on :3000

cd ../frontend
npm run dev            # Start frontend on :5173
```

### Test Credentials
| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Doctor | dr.smith@medora.com    | password123 |
| Nurse  | nurse@medora.com       | password123 |
| Staff  | staff@medora.com       | password123 |
| Admin  | admin@medora.com       | password123 |

---

## TC-001: Authentication Flow

### TC-001a: Login
1. Go to http://localhost:5173
2. Verify redirect to /login
3. Enter `dr.smith@medora.com` / `password123`
4. Click "Sign In"
5. **Expected**: Redirect to Dashboard, see Dr. Smith's name in sidebar

### TC-001b: Invalid Login
1. Enter `wrong@email.com` / `wrongpassword`
2. Click "Sign In"
3. **Expected**: Error message displayed, stays on login page

### TC-001c: Protected Routes
1. Open /patients in a new incognito window
2. **Expected**: Redirected to /login

### TC-001d: Role-Based Access
1. Login as Staff (staff@medora.com)
2. Navigate to Settings, Users
3. **Expected**: Limited access based on permissions

---

## TC-002: Dashboard

### TC-002a: Dashboard Loads
1. Login as doctor
2. **Expected**: Dashboard shows:
   - Total patients count (5)
   - Today's appointments
   - Revenue summary
   - Quick action buttons

### TC-002b: Navigation from Dashboard
1. Click each sidebar navigation item
2. **Expected**: All pages load without errors

---

## TC-003: Patient Management

### TC-003a: View Patient List
1. Navigate to /patients
2. **Expected**: See 5 seeded patients (Alice, Bob, Carol, David, Eva)

### TC-003b: Search Patients
1. Type "Alice" in search box
2. **Expected**: Only Alice Johnson shown
3. Clear search, type "ZZZZZ"
4. **Expected**: Empty state or "no results"

### TC-003c: Create Patient
1. Click "+ Add Patient"
2. Fill: First=Test, Last=Patient, Email=test@example.com, Phone=555-0100
3. Click Save
4. **Expected**: Patient created, toast success, appears in list

### TC-003d: View Patient Detail
1. Click on Alice Johnson's name
2. **Expected**: Navigate to /patients/{id}, shows:
   - Patient info (name, email, phone)
   - Tags (VIP, Insurance)
   - Appointments history
   - Medical history (vitals, diagnoses, prescriptions, allergies, conditions)

### TC-003e: Archive & Restore Patient
1. In patient list, click menu (three dots) on a patient
2. Click "Archive"
3. **Expected**: Patient removed from default list
4. Toggle "Show Archived"
5. **Expected**: Archived patient visible with archive indicator
6. Click "Restore"
7. **Expected**: Patient restored to active list

### TC-003f: Patient Tags
1. Go to patient detail for Alice
2. Add a new tag
3. Remove a tag
4. **Expected**: Tags update in real-time

---

## TC-004: Appointment Management

### TC-004a: View Appointments
1. Navigate to /appointments
2. **Expected**: See today's appointments (seeded data has appointments for various dates)

### TC-004b: Create Appointment
1. Click "New Appointment"
2. Select Patient: Alice Johnson
3. Select Doctor: Dr. Sarah Smith
4. Set date/time to tomorrow 10:00 AM
5. Add reason: "Follow-up checkup"
6. Click Save
7. **Expected**: Appointment created, appears in list

### TC-004c: Calendar View
1. Toggle to Calendar view
2. **Expected**: FullCalendar renders with appointments as events
3. Click on a date to see appointments
4. Navigate between weeks/months

### TC-004d: Status Transitions
1. Find a SCHEDULED appointment
2. Change status to CHECKED_IN
3. **Expected**: Status badge updates, notification created for doctor
4. Change to COMPLETED
5. **Expected**: Status updates

### TC-004e: Complete with Invoice
1. Find a SCHEDULED or CHECKED_IN appointment
2. Click "Complete" button
3. **Expected**: Invoice auto-created with consultation fee ($120 from settings)
4. Verify invoice appears in /invoices

### TC-004f: Cancel Appointment
1. Find a scheduled appointment
2. Click Cancel
3. Confirm cancellation
4. **Expected**: Status changes to CANCELLED

---

## TC-005: Invoices & Billing

### TC-005a: View Invoices
1. Navigate to /invoices
2. **Expected**: See seeded invoices (mix of PAID and UNPAID)

### TC-005b: Filter by Status
1. Click "Paid" filter
2. **Expected**: Only paid invoices shown
3. Click "Unpaid" filter
4. **Expected**: Only unpaid invoices shown

### TC-005c: Mark as Paid
1. Find an UNPAID invoice
2. Click "Mark as Paid"
3. **Expected**: Status changes to PAID, dashboard revenue updates

### TC-005d: Mark as Unpaid
1. Find a PAID invoice
2. Click "Mark as Unpaid"
3. **Expected**: Status reverts to UNPAID

---

## TC-006: Lab Results

### TC-006a: View Lab Results
1. Navigate to /lab-results
2. **Expected**: See seeded labs (CBC, Hemoglobin A1C, Lipid Panel, Urinalysis)

### TC-006b: Create Lab Result
1. Click "Add Lab Result"
2. Select patient, enter test name "Blood Glucose", set category
3. Click Save
4. **Expected**: New lab result created with PENDING status

### TC-006c: Update Lab Result
1. Click on a PENDING lab result
2. Add result values and mark as COMPLETED
3. **Expected**: Status updates, result data saved

---

## TC-007: Tasks

### TC-007a: View Tasks
1. Navigate to /tasks
2. **Expected**: See seeded tasks (Follow up with Alice, Call insurance, etc.)

### TC-007b: Create Task
1. Click "Add Task"
2. Enter title: "Review patient charts"
3. Set priority to HIGH
4. Click Save
5. **Expected**: Task created, appears in list

### TC-007c: Complete Task
1. Check the checkbox on a task
2. **Expected**: Task marked as completed

### TC-007d: Delete Task
1. Click delete on a task
2. **Expected**: Task removed from list

---

## TC-008: Messages

### TC-008a: View Messages
1. Navigate to /messages
2. **Expected**: See conversation threads (seeded messages with Alice, Bob, Carol)

### TC-008b: Send Message
1. Select a conversation or start new
2. Type message and send
3. **Expected**: Message appears in conversation

---

## TC-009: Insurance Claims

### TC-009a: View Claims
1. Navigate to /insurance
2. **Expected**: See 3 seeded claims (APPROVED, SUBMITTED, DENIED)

### TC-009b: Create Claim
1. Click "New Claim"
2. Fill: Patient=Alice, Provider=Cigna, Amount=400
3. Submit
4. **Expected**: Claim created with SUBMITTED status

### TC-009c: View Statistics
1. Check stats section
2. **Expected**: Shows totals for approved, denied, pending claims

---

## TC-010: Waitlist

### TC-010a: View Waitlist
1. Navigate to /waitlist
2. **Expected**: See 2 seeded entries (Carol - HIGH priority, Eva - NORMAL priority)

### TC-010b: Add to Waitlist
1. Click "Add to Waitlist"
2. Select patient, set date/time preference
3. **Expected**: Entry added

### TC-010c: Book from Waitlist
1. Click "Book" on a waitlist entry
2. Set appointment date/time
3. **Expected**: Appointment created, entry removed from waitlist

---

## TC-011: Settings & Administration

### TC-011a: Tags
1. Navigate to /tags
2. **Expected**: See 5 seeded tags (VIP, New Patient, Chronic Condition, etc.)
3. Create a new tag with color
4. Delete a tag

### TC-011b: Presets
1. Navigate to /presets
2. **Expected**: See 10 seeded presets (procedures, diagnoses, prescriptions)
3. Create a new procedure preset

### TC-011c: Note Templates
1. Navigate to /note-templates
2. **Expected**: See 5 seeded templates
3. Create a new template

### TC-011d: Clinic Settings
1. Navigate to /settings
2. Update consultation fee
3. **Expected**: New fee used in future invoice generation

### TC-011e: Users
1. Navigate to /users (as admin)
2. **Expected**: See 4 users (Doctor, Nurse, Staff, Admin)
3. Create a new user with NURSE role
4. **Expected**: User created, can login with new credentials

---

## TC-012: Notifications

### TC-012a: View Notifications
1. Click notification bell in sidebar
2. **Expected**: See 3 unread notifications for doctor
3. Click a notification
4. **Expected**: Marked as read, navigates to relevant page

### TC-012b: Mark All Read
1. Click "Mark All as Read"
2. **Expected**: All notifications marked as read, badge count resets

---

## TC-013: Doctor Ratings

### TC-013a: View Ratings
1. Navigate to /doctor-ratings
2. **Expected**: See Dr. Smith's rating summary (3 ratings, avg ~4.7)
3. See individual reviews

---

## TC-014: Analytics

### TC-014a: View Analytics
1. Navigate to /analytics
2. **Expected**: Charts showing appointment trends, revenue, patient growth

---

## TC-015: Audit Logs

### TC-015a: View Audit Logs
1. Navigate to /audit-logs
2. **Expected**: Recent actions logged (login, patient created, etc.)

---

## TC-016: Quick Search (Ctrl+K)

### TC-016a: Global Search
1. Press Ctrl+K
2. **Expected**: Search dialog opens
3. Type "Alice"
4. **Expected**: Alice Johnson appears in results
5. Click result
6. **Expected**: Navigates to patient detail

---

## TC-017: Dark Mode

### TC-017a: Theme Toggle
1. Find theme toggle in sidebar
2. Click to switch to dark mode
3. **Expected**: All pages render correctly in dark mode
4. Refresh page
5. **Expected**: Dark mode persists

---

## TC-018: Cross-Feature Workflows

### TC-018a: Full Patient Visit Flow
1. Create patient -> Schedule appointment -> Check in -> Complete with invoice -> Mark paid
2. **Expected**: All steps complete without errors, data flows between features

### TC-018b: Waitlist to Appointment
1. Add patient to waitlist -> Book from waitlist -> Complete appointment
2. **Expected**: Seamless flow between waitlist and appointment scheduling

---

## Running E2E Tests
```bash
cd frontend
npm run test:e2e          # Headless
npm run test:e2e:headed   # With browser visible
npm run test:e2e:ui       # Interactive UI mode
```

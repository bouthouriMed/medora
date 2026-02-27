# PRODUCT REQUIREMENTS DOCUMENT
# Project Name: Medora

## 1. Vision

Medora is a SaaS platform built for private doctors who are tired of using paper files, notebooks, Excel sheets, and WhatsApp to manage their clinic.

Medora replaces paper chaos with a simple, fast, modern digital system.

Core promise:
Medora saves doctors time, reduces no-shows, and gives full visibility over patients and revenue.

---

## 2. Target Users

Primary ICP:
- Private solo doctors
- 1–3 practitioner clinics
- No IT department
- Currently using paper or basic tools

User types:
- Doctor (primary owner)
- Staff (receptionist/assistant)

---

## 3. Core Problems We Solve

1. Paper files are slow and disorganized
2. Missed appointments reduce revenue
3. No clear revenue tracking
4. Manual reminders waste time
5. No central patient history

---

## 4. MVP Scope

The MVP must be functional and production-ready.

Includes:

### 4.1 Authentication & Roles
- Doctor registration
- Login / logout
- Role-based access
- Doctor profile
- Staff profile management

### 4.2 Clinic Management
- One clinic per account (MVP)
- Basic clinic settings

### 4.3 Patient Management
- Create patient
- Edit patient
- Archive patient (soft delete)
- Search patients
- View visit history

### 4.4 Appointment Management
- Calendar view (day/week)
- Create appointment
- Assign doctor
- Appointment status:
  - scheduled
  - completed
  - cancelled
  - no-show

### 4.5 Billing (Basic)
- Generate invoice per appointment
- Mark as paid/unpaid
- View revenue summary

### 4.6 Dashboard
- Today’s appointments
- Upcoming appointments
- Monthly revenue
- Unpaid invoices

---

## 5. Non-Functional Requirements

- Fast UI
- Minimal clicks
- Mobile responsive
- Secure data handling
- Multi-tenant architecture ready
- Audit timestamps on all records

---

## 6. UX Principles

- Simplicity over feature overload
- Max 3 clicks for main actions
- Large readable interface
- Clear visual hierarchy
- No unnecessary fields

---

## 7. Out of Scope (MVP)

- AI note generation
- Insurance integration
- Telemedicine
- Advanced analytics
- Marketplace features

---

## 8. Success Metrics

- Doctor can onboard in < 10 minutes
- Create first patient in < 1 minute
- Create appointment in < 20 seconds
- 90% task success without training
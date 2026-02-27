# TECHNICAL ARCHITECTURE
# Project: Medora

## 1. Architecture Overview

Medora is a multi-tenant SaaS platform.

High-level architecture:

Frontend (React + Vite + TypeScript)
        ↓
Backend API (Node.js + Express)
        ↓
PostgreSQL Database
        ↓
Stripe (Subscriptions)

---

## 2. Frontend Stack

- React
- TypeScript
- Redux Toolkit
- RTK Query (API layer)
- Vite
- Tailwind CSS

No direct fetch calls.
All API communication must go through RTK Query.

---

## 3. Backend Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM

Architecture style:
- Controller layer
- Service layer
- Repository layer
- Validation middleware
- Error middleware

No business logic inside controllers.

---

## 4. Multi-Tenancy Strategy

Shared database.
Every business table includes:

- clinic_id

Strict filtering on every query.
No cross-clinic data access allowed.

---

## 5. Core Database Entities

Clinic
User
Patient
Appointment
Invoice

All tables must include:
- id (UUID)
- created_at
- updated_at
- deleted_at (nullable, soft delete)

---

## 6. Security

- Password hashing (bcrypt)
- JWT authentication
- Role-based authorization
- Input validation on all endpoints
- SQL injection protection (Prisma)

---

## 7. Scalability Considerations

- Stateless backend
- Environment-based configuration
- Ready for Docker deployment
- Clean separation of concerns

---

## 8. API Standards

- RESTful
- JSON responses
- Standard error format
- Pagination for list endpoints
- Consistent naming conventions
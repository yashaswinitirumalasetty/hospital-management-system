# Apex Multi-Specialty Hospital Operations & Clinical Platform

A complete, production-grade, commercial healthcare operations platform connecting **Patient → Reception → Doctor → Nurse / Pharmacy → Admin / Hospital Owner** around a single permanent patient identity (`Patient ID`, e.g. `P-100245`).

---

## 1. System Architecture & Workflows

The platform maintains a **single permanent patient identity** across all departments. When an existing patient returns, Reception links new visits to their existing `Patient ID` rather than creating duplicate profiles.

```text
                               ┌────────────────────────────────┐
                               │   PUBLIC LANDING / DIRECTORY   │
                               └───────────────┬────────────────┘
                                               │
                               ┌───────────────▼────────────────┐
                               │         PATIENT PORTAL         │
                               └───────────────┬────────────────┘
                                               │ (Appointment Request)
                               ┌───────────────▼────────────────┐
                               │        RECEPTION DESK          │
                               └───────────────┬────────────────┘
                                               │ (Check-In & Token)
                               ┌───────────────▼────────────────┐
                               │     DOCTOR OPD CONSULTATION    │
                               └───────┬───────────────┬────────┘
                                       │ (e-Rx)        │ (Doctor Instruction)
                                       │               ▼
                                       │        ┌──────────────┐
                                       │        │ NURSE STATION│
                                       │        └──────────────┘
                               ┌───────▼────────────────┐
                               │  MEDICAL STORE / PHARM │
                               └───────────────┬────────┘
                                               │ (Dispensing)
                               ┌───────────────▼────────────────┐
                               │     LONGITUDINAL PATIENT DB    │
                               └───────────────┬────────────────┘
                                               │
                               ┌───────────────▼────────────────┐
                               │  ADMIN OPS & OWNER DASHBOARD   │
                               └────────────────────────────────┘
```

---

## 2. Seven Dedicated Role Applications

| Application / Portal | Primary URL / Switcher | Key Responsibilities | Preloaded Seed Account |
|---|---|---|---|
| **Public Landing Page** | `/` (Public View) | Hospital overview, clinical departments, doctor search, emergency hotline | Guest Access |
| **Patient Portal** | `/portal/patient` | Live hospital care journey, request appointments, longitudinal timeline (2025/2026), e-prescriptions, allergies | `ravi.kumar@gmail.com` / `patient123` (`P-100245`) |
| **Reception Portal** | `/portal/reception` | OPD queue, new patient registration with auto `P-XXXXXX` generation, existing patient search (duplicate-free booking), check-in, payment status (`Received`/`Pending`/`N/A`) | `reception@hospital.com` / `reception123` |
| **Doctor Portal** | `/portal/doctor` | Live OPD queue, consultation suite (chief complaint, diagnosis, physical exam), digital e-prescriptions (`RX-XXXXX`), nurse tasks, doctor schedule | `dr.kumar@hospital.com` / `doctor123` |
| **Nurse Portal** | `/portal/nurse` | Inpatient & OPD triage, vital signs telemetry (BP, Pulse, SpO2, Temp, Weight), doctor clinical instructions (acknowledge & complete) | `nurse.sunita@hospital.com` / `nurse123` |
| **Pharmacy / Medical Store** | `/portal/pharmacy` | Real-time prescription queue, batch-level inventory tracking, controlled dispensing, low stock & expiry warnings, communicate shortage | `pharmacy@hospital.com` / `pharmacy123` |
| **Admin Portal** | `/portal/admin` | Staff provisioning, clinical departments, biomedical equipment tracking, operational incidents, protected immutable audit logs | `admin@hospital.com` / `admin123` |
| **Hospital Owner Dashboard** | `/portal/owner` | High-level executive KPIs, **real-time bottleneck monitoring** (Reception, Doctor, Nurse, Pharmacy), department operational health | `owner@hospital.com` / `owner123` |

> **Global Demo Role Switcher**: A persistent navy bar at the top of the interface enables reviewers and operators to switch between simulated roles with a single click.

---

## 3. Technology Stack

- **Backend**: Node.js & TypeScript, Express REST API, Prisma ORM, SQLite (PostgreSQL compatible), JWT authentication, Bcrypt password hashing.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons.
- **Design System**: White-first (`#FFFFFF`) surface, deep royal navy brand (`#1d1160`), restrained neutral borders (`#E2E8F0`), high-density enterprise tables, and zero generic "AI SaaS" clutter.

---

## 4. Quick Start & Execution

### Backend API Server
```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev
```
*API Server listens at `http://localhost:5000` with health check at `http://localhost:5000/api/health`.*

### Frontend Web Applications
```bash
cd frontend
npm install
npm run dev
```
*Vite frontend listens at `http://localhost:5173/`.*

---

## 5. Automated Verification
To run the automated end-to-end integration test suite verifying all 7 role workflows:
```bash
cd backend
node test_workflows.js
```

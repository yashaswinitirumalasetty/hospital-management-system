# Apex Patient Mobile App (Flutter & Dart)

A production-ready Flutter mobile application designed for patients of the **Apex Multi-Specialty Hospital Operations Platform**.

---

## Features Built

1. **Patient Digital Health ID Card**
   - Displays permanent Patient ID (`P-100245`), Blood Group, Name, and Recorded Allergies.
2. **Live Hospital Care Journey & OPD Token Tracker**
   - Real-time milestone stepper from *Appointment Requested → Reception Review → Confirmed → Checked In → Consultation → Pharmacy Dispensing → Completed*.
   - Live OPD Queue Token number badge (`Token #X`).
3. **Appointment Scheduling**
   - Filter by Clinical Department and Attending Doctors.
   - Choose date, time slot, and reason for consultation.
   - Direct integration with Reception's real-time verification queue.
4. **Digital e-Prescriptions (`RX-XXXXX`)**
   - View physician medication orders, dosage, frequency, and instructions.
5. **Longitudinal Medical Records & Nurse Telemetry**
   - Lifetime timeline displaying clinical consultations, diagnoses, and nurse vitals (Blood Pressure, SpO2, Pulse, Body Temperature, Weight).
6. **Authentication & Session Persistence**
   - JWT-based authentication stored securely with `SharedPreferences`.

---

## Getting Started

### 1. Prerequisites (Install Flutter SDK)
If you don't already have Flutter installed on Windows:
```powershell
winget install Google.Flutter
```
After installation, open a new terminal window and verify:
```bash
flutter doctor
```

### 2. Ensure Backend Server is Running
Make sure the Express API server is active in the `backend/` folder:
```bash
cd backend
npm run dev
```
*(Runs on `http://localhost:5000`)*

### 3. Run the Flutter Mobile App
```bash
cd patient_mobile_app
flutter pub get
flutter run
```

### Testing on Different Devices
- **Android Emulator**: Automatically uses `http://10.0.2.2:5000/api` to communicate with your localhost backend.
- **Physical Phone over Wi-Fi**: Edit `lib/core/constants/api_constants.dart` and set `baseUrl` to your computer's local Wi-Fi IP address (e.g. `http://192.168.1.100:5000/api`).
- **Chrome / Web / Desktop**: Run `flutter run -d chrome` or `flutter run -d windows`.

---

## Pre-loaded Test Account
* **Email:** `ravi.kumar@gmail.com`
* **Password:** `patient123`
* **Patient ID:** `P-100245`

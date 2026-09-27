import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Apex Multi-Specialty Hospital database...');

  // 1. Hospital
  const hospital = await prisma.hospital.upsert({
    where: { code: 'H001' },
    update: {},
    create: {
      code: 'H001',
      name: 'Apex Multi-Specialty Hospital & Research Institute',
      tagline: 'Excellence in Clinical Care, Compassion in Healing',
      address: '742 Healthcare Boulevard, Medical District',
      city: 'Metro City',
      phone: '+1 (555) 019-2834',
      email: 'contact@apexhospital.org',
      workingHours: '24/7 Emergency & Inpatient | OPD: Mon-Sat 08:00 - 20:00',
      queueThresholdMins: 30,
    },
  });

  console.log(`Created Hospital: ${hospital.name} (${hospital.code})`);

  // 2. Departments
  const departmentsData = [
    { name: 'Cardiology', code: 'CARD', description: 'Comprehensive heart & cardiovascular disease diagnosis and care', locationFloor: '2nd Floor, Wing A' },
    { name: 'Neurology', code: 'NEUR', description: 'Advanced brain, nerve, and spine disorders center', locationFloor: '3rd Floor, Wing B' },
    { name: 'Orthopedics', code: 'ORTH', description: 'Bone, joint replacement, trauma, and sports medicine', locationFloor: '1st Floor, Wing C' },
    { name: 'General Medicine', code: 'GMED', description: 'Primary adult care, chronic illness management, and diagnostics', locationFloor: 'Ground Floor, OPD Block' },
    { name: 'Pediatrics', code: 'PED', description: 'Infant, child, and adolescent healthcare and immunization', locationFloor: '2nd Floor, Wing B' },
    { name: 'Dermatology', code: 'DERM', description: 'Skin, hair, allergy, and cosmetic dermatology', locationFloor: '1st Floor, Wing A' },
    { name: 'Emergency', code: 'EMRG', description: '24/7 Level-1 Trauma and acute critical resuscitation unit', locationFloor: 'Ground Floor, Trauma Bay' },
    { name: 'Intensive Care Unit', code: 'ICU', description: 'Advanced critical care and life support telemetry unit', locationFloor: '4th Floor, Critical Wing' },
  ];

  const deptMap = new Map<string, string>();
  for (const d of departmentsData) {
    const createdDept = await prisma.department.create({
      data: {
        hospitalId: hospital.id,
        name: d.name,
        code: d.code,
        description: d.description,
        locationFloor: d.locationFloor,
      },
    });
    deptMap.set(d.code, createdDept.id);
  }

  // Common password hash for test accounts
  const salt = await bcrypt.genSalt(10);
  const commonPasswordHash = await bcrypt.hash('admin123', salt);
  const doctorPasswordHash = await bcrypt.hash('doctor123', salt);
  const nursePasswordHash = await bcrypt.hash('nurse123', salt);
  const receptionPasswordHash = await bcrypt.hash('reception123', salt);
  const pharmacyPasswordHash = await bcrypt.hash('pharmacy123', salt);
  const ownerPasswordHash = await bcrypt.hash('owner123', salt);
  const patientPasswordHash = await bcrypt.hash('patient123', salt);

  // 3. Admin User
  const adminUser = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      email: 'admin@hospital.com',
      passwordHash: commonPasswordHash,
      name: 'Dr. Alok Verma',
      role: 'ADMIN',
      phone: '+1 (555) 100-0001',
    },
  });

  // 4. Hospital Owner User
  const ownerUser = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      email: 'owner@hospital.com',
      passwordHash: ownerPasswordHash,
      name: 'Sunita Reddy',
      role: 'OWNER',
      phone: '+1 (555) 100-0002',
    },
  });

  // 5. Receptionist User
  const receptionUser = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      email: 'reception@hospital.com',
      passwordHash: receptionPasswordHash,
      name: 'Meera Patel',
      role: 'RECEPTION',
      phone: '+1 (555) 200-0001',
    },
  });

  // 6. Pharmacist User
  const pharmacyUser = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      email: 'pharmacy@hospital.com',
      passwordHash: pharmacyPasswordHash,
      name: 'Vikram Joshi',
      role: 'PHARMACY',
      phone: '+1 (555) 300-0001',
    },
  });

  // 7. Doctors
  const doctorsData = [
    {
      email: 'dr.kumar@hospital.com',
      name: 'Dr. Ramesh Kumar',
      deptCode: 'CARD',
      specialty: 'Interventional Cardiology',
      qualification: 'MBBS, MD, DM (Cardiology), FACC',
      experienceYears: 18,
      roomNumber: 'Room 204, OPD Wing A',
      consultationFee: '$120',
      availableDays: 'Mon,Tue,Wed,Thu,Fri',
      scheduleHours: '09:00 - 15:00',
    },
    {
      email: 'dr.priya@hospital.com',
      name: 'Dr. Priya Sharma',
      deptCode: 'NEUR',
      specialty: 'Clinical Neurology & Epilepsy',
      qualification: 'MBBS, MD, DM (Neurology)',
      experienceYears: 14,
      roomNumber: 'Room 312, OPD Wing B',
      consultationFee: '$130',
      availableDays: 'Mon,Wed,Fri,Sat',
      scheduleHours: '10:00 - 16:00',
    },
    {
      email: 'dr.iyer@hospital.com',
      name: 'Dr. Rajesh Iyer',
      deptCode: 'ORTH',
      specialty: 'Joint Reconstruction & Arthroscopy',
      qualification: 'MBBS, MS (Ortho), MCh (UK)',
      experienceYears: 16,
      roomNumber: 'Room 118, OPD Wing C',
      consultationFee: '$110',
      availableDays: 'Tue,Thu,Sat',
      scheduleHours: '08:30 - 14:30',
    },
    {
      email: 'dr.ananya@hospital.com',
      name: 'Dr. Ananya Sen',
      deptCode: 'GMED',
      specialty: 'Internal Medicine & Diabetology',
      qualification: 'MBBS, MD (General Medicine)',
      experienceYears: 9,
      roomNumber: 'Room 102, Ground Floor',
      consultationFee: '$90',
      availableDays: 'Mon,Tue,Wed,Thu,Fri,Sat',
      scheduleHours: '09:00 - 17:00',
    },
  ];

  const doctorProfiles = new Map<string, any>();
  for (const d of doctorsData) {
    const docUser = await prisma.user.create({
      data: {
        hospitalId: hospital.id,
        email: d.email,
        passwordHash: doctorPasswordHash,
        name: d.name,
        role: 'DOCTOR',
        phone: '+1 (555) 400-00' + Math.floor(10 + Math.random() * 89),
      },
    });

    const docProfile = await prisma.staffProfile.create({
      data: {
        userId: docUser.id,
        departmentId: deptMap.get(d.deptCode),
        specialty: d.specialty,
        qualification: d.qualification,
        experienceYears: d.experienceYears,
        roomNumber: d.roomNumber,
        consultationFee: d.consultationFee,
        availableDays: d.availableDays,
        scheduleHours: d.scheduleHours,
      },
    });

    doctorProfiles.set(d.deptCode, { user: docUser, profile: docProfile });
  }

  // 8. Nurses
  const nursesData = [
    {
      email: 'nurse.sunita@hospital.com',
      name: 'Sunita Das, RN',
      deptCode: 'CARD',
      qualification: 'B.Sc Nursing, Critical Care Certified',
      experienceYears: 8,
      roomNumber: 'OPD Triage Station 1',
    },
    {
      email: 'nurse.rajesh@hospital.com',
      name: 'Rajesh Varma, RN',
      deptCode: 'EMRG',
      qualification: 'GNM, Trauma Life Support Certified',
      experienceYears: 6,
      roomNumber: 'Emergency Triage Bay',
    },
  ];

  const nurseProfiles = [];
  for (const n of nursesData) {
    const nurseUser = await prisma.user.create({
      data: {
        hospitalId: hospital.id,
        email: n.email,
        passwordHash: nursePasswordHash,
        name: n.name,
        role: 'NURSE',
        phone: '+1 (555) 500-00' + Math.floor(10 + Math.random() * 89),
      },
    });

    const nurseProfile = await prisma.staffProfile.create({
      data: {
        userId: nurseUser.id,
        departmentId: deptMap.get(n.deptCode),
        specialty: 'Clinical Nursing Care',
        qualification: n.qualification,
        experienceYears: n.experienceYears,
        roomNumber: n.roomNumber,
      },
    });

    nurseProfiles.push(nurseProfile);
  }

  // 9. Patients with permanent unique IDs
  const patient1User = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      email: 'ravi.kumar@gmail.com',
      passwordHash: patientPasswordHash,
      name: 'Ravi Kumar',
      role: 'PATIENT',
      phone: '+1 (555) 782-9901',
    },
  });

  const patient1 = await prisma.patient.create({
    data: {
      hospitalId: hospital.id,
      userId: patient1User.id,
      patientId: 'P-100245',
      firstName: 'Ravi',
      lastName: 'Kumar',
      dateOfBirth: '1985-04-12',
      gender: 'Male',
      phone: '+1 (555) 782-9901',
      email: 'ravi.kumar@gmail.com',
      bloodGroup: 'O+',
      address: '45 Oak Ridge Lane, Metro City',
      emergencyContact: 'Aarti Kumar (Wife) - +1 (555) 782-9902',
      allergies: 'Penicillin, Sulfa drugs',
      chronicConditions: 'Essential Hypertension (Stage 1)',
    },
  });

  const patient2User = await prisma.user.create({
    data: {
      hospitalId: hospital.id,
      email: 'sunita.v@gmail.com',
      passwordHash: patientPasswordHash,
      name: 'Sunita Verma',
      role: 'PATIENT',
      phone: '+1 (555) 671-2299',
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      hospitalId: hospital.id,
      userId: patient2User.id,
      patientId: 'P-100246',
      firstName: 'Sunita',
      lastName: 'Verma',
      dateOfBirth: '1992-08-23',
      gender: 'Female',
      phone: '+1 (555) 671-2299',
      email: 'sunita.v@gmail.com',
      bloodGroup: 'B+',
      address: '108 Greenfield Avenue, Apt 4B',
      emergencyContact: 'Vikash Verma (Brother) - +1 (555) 671-2290',
      allergies: 'No known drug allergies (NKDA)',
      chronicConditions: 'Recurrent Migraines with Aura',
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      hospitalId: hospital.id,
      patientId: 'P-100247',
      firstName: 'Arjun',
      lastName: 'Nair',
      dateOfBirth: '1978-11-05',
      gender: 'Male',
      phone: '+1 (555) 912-3344',
      email: 'arjun.nair@gmail.com',
      bloodGroup: 'A+',
      address: '12 Lake View Residency, Sector 7',
      emergencyContact: 'Meenakshi Nair (Spouse) - +1 (555) 912-3345',
      allergies: 'Aspirin (Mild urticaria)',
      chronicConditions: 'Type 2 Diabetes Mellitus, Mild Osteoarthritis',
    },
  });

  // 10. Longitudinal Patient Records for P-100245 (Ravi Kumar)
  const drKumar = doctorProfiles.get('CARD')!;
  const drPriya = doctorProfiles.get('NEUR')!;
  const drIyer = doctorProfiles.get('ORTH')!;

  // 2025 Visit (Historical)
  const appt2025 = await prisma.appointment.create({
    data: {
      hospitalId: hospital.id,
      patientId: patient1.id,
      departmentId: deptMap.get('CARD')!,
      doctorId: drKumar.profile.id,
      appointmentDate: '2025-08-14',
      timeSlot: '10:00 AM',
      queueNumber: 4,
      status: 'COMPLETED',
      paymentStatus: 'RECEIVED',
      reason: 'Occasional chest tightness and palpitations during exertion',
      checkedInAt: new Date('2025-08-14T09:45:00Z'),
      completedAt: new Date('2025-08-14T10:45:00Z'),
    },
  });

  await prisma.consultation.create({
    data: {
      appointmentId: appt2025.id,
      patientId: patient1.id,
      doctorId: drKumar.profile.id,
      chiefComplaint: 'Intermittent palpitations over the last 3 weeks.',
      symptoms: 'Non-radiating chest tightness with fast heart rate after stairs.',
      physicalExam: 'HR 86 regular, BP 136/88. S1/S2 heard, no murmurs. Lungs clear to auscultation.',
      diagnosis: 'Sinus Tachycardia secondary to stress/fatigue, Pre-hypertension.',
      clinicalNotes: '12-lead ECG showed normal sinus rhythm with occasional PACs. Advised stress reduction, reduced caffeine intake, and baseline lipid profile.',
      instructions: 'Review in 6 months or immediately if chest pain worsens.',
      createdAt: new Date('2025-08-14T10:30:00Z'),
    },
  });

  // 2026 June Visit (Historical)
  const appt2026 = await prisma.appointment.create({
    data: {
      hospitalId: hospital.id,
      patientId: patient1.id,
      departmentId: deptMap.get('CARD')!,
      doctorId: drKumar.profile.id,
      appointmentDate: '2026-06-19',
      timeSlot: '11:00 AM',
      queueNumber: 7,
      status: 'COMPLETED',
      paymentStatus: 'RECEIVED',
      reason: 'Follow-up BP review and mild morning headaches',
      checkedInAt: new Date('2026-06-19T10:40:00Z'),
      completedAt: new Date('2026-06-19T11:40:00Z'),
    },
  });

  await prisma.nurseRecord.create({
    data: {
      patientId: patient1.id,
      appointmentId: appt2026.id,
      nurseId: nurseProfiles[0].id,
      bloodPressure: '138/88 mmHg',
      temperature: '98.4 F',
      pulse: 82,
      spO2: 98,
      respiratoryRate: 16,
      weight: 75.2,
      nursingNotes: 'Patient alert and oriented. Arrived comfortably on time. Vitals stable.',
      recordedAt: new Date('2026-06-19T10:50:00Z'),
    },
  });

  const consult2026 = await prisma.consultation.create({
    data: {
      appointmentId: appt2026.id,
      patientId: patient1.id,
      doctorId: drKumar.profile.id,
      chiefComplaint: 'BP review, morning occipital tension.',
      symptoms: 'Mild morning headache, settles after 1 hour. No dizziness.',
      physicalExam: 'BP 138/88 mmHg. Peripheral pulses intact. No pedal edema.',
      diagnosis: 'Primary Essential Hypertension (mild).',
      clinicalNotes: 'Initiated low dose Amlodipine 5mg OD. Advised daily home BP logging.',
      instructions: 'Low sodium diet, brisk walking 30 mins daily. Repeat BP in 3 months.',
      createdAt: new Date('2026-06-19T11:20:00Z'),
    },
  });

  const rx2026 = await prisma.prescription.create({
    data: {
      prescriptionCode: 'RX-10228',
      consultationId: consult2026.id,
      patientId: patient1.id,
      doctorId: drKumar.profile.id,
      status: 'DISPENSED',
      pharmacyNotes: 'Dispensed 30 tablets of Amlodipine 5mg. Patient counseled on adherence.',
      dispensedAt: new Date('2026-06-19T11:45:00Z'),
      dispensedBy: 'Vikram Joshi (Pharmacist)',
      createdAt: new Date('2026-06-19T11:25:00Z'),
    },
  });

  await prisma.prescriptionItem.create({
    data: {
      prescriptionId: rx2026.id,
      medicineName: 'Amlodipine 5mg',
      genericName: 'Amlodipine Besylate',
      dosage: '5mg',
      frequency: 'Once daily morning',
      duration: '30 days',
      instructions: 'Take after breakfast with water',
      quantityPrescribed: 30,
      isDispensed: true,
    },
  });

  // Current Active Today's Visit for Ravi Kumar (P-100245)
  const todayStr = new Date().toISOString().split('T')[0];
  const apptToday = await prisma.appointment.create({
    data: {
      hospitalId: hospital.id,
      patientId: patient1.id,
      departmentId: deptMap.get('CARD')!,
      doctorId: drKumar.profile.id,
      appointmentDate: todayStr,
      timeSlot: '10:30 AM',
      queueNumber: 1,
      status: 'WAITING_FOR_DOCTOR', // In Doctor's active waiting queue!
      paymentStatus: 'RECEIVED',
      reason: 'Routine quarterly cardiovascular review and prescription refill',
      checkedInAt: new Date(),
    },
  });

  // Nurse recorded vitals for today's appointment
  await prisma.nurseRecord.create({
    data: {
      patientId: patient1.id,
      appointmentId: apptToday.id,
      nurseId: nurseProfiles[0].id,
      bloodPressure: '142/90 mmHg',
      temperature: '98.6 F',
      pulse: 84,
      spO2: 99,
      respiratoryRate: 16,
      weight: 74.5,
      nursingNotes: 'Patient checked in at Reception at 09:45. Reported slight tension due to traffic. BP slightly elevated.',
      recordedAt: new Date(),
    },
  });

  // Doctor instruction active for nurse
  await prisma.doctorInstruction.create({
    data: {
      patientId: patient1.id,
      appointmentId: apptToday.id,
      doctorId: drKumar.profile.id,
      assignedNurseId: nurseProfiles[0].id,
      instruction: 'Perform repeat resting BP check in 15 minutes in quiet room before doctor entry.',
      priority: 'ROUTINE',
      status: 'PENDING',
    },
  });

  // Sunita Verma's Visit: Consultation completed, Waiting for Pharmacy!
  const apptSunita = await prisma.appointment.create({
    data: {
      hospitalId: hospital.id,
      patientId: patient2.id,
      departmentId: deptMap.get('NEUR')!,
      doctorId: drPriya.profile.id,
      appointmentDate: todayStr,
      timeSlot: '09:30 AM',
      queueNumber: 2,
      status: 'WAITING_FOR_PHARMACY', // Waiting for medicine dispensing!
      paymentStatus: 'RECEIVED',
      reason: 'Throbbing hemicranial headache with visual aura and nausea',
      checkedInAt: new Date(Date.now() - 3600000),
    },
  });

  const consultSunita = await prisma.consultation.create({
    data: {
      appointmentId: apptSunita.id,
      patientId: patient2.id,
      doctorId: drPriya.profile.id,
      chiefComplaint: 'Severe throbbing left-sided headache with photophobia.',
      symptoms: 'Nausea, visual zig-zag lines preceding headache for 20 mins, lasts 12 hours.',
      physicalExam: 'Cranial nerves II-XII grossly intact. No neck stiffness. Fundoscopy clear.',
      diagnosis: 'Migraine with Typical Aura (ICD-10 G43.1).',
      clinicalNotes: 'Prescribed acute abortive therapy with Sumatriptan and prophylactic beta-blocker. Avoid trigger foods (aged cheese, erratic sleep).',
      instructions: 'Keep a headache diary. Take abortive tablet at earliest onset of headache phase.',
      followUpDate: '2026-10-25',
    },
  });

  const rxSunita = await prisma.prescription.create({
    data: {
      prescriptionCode: 'RX-10231',
      consultationId: consultSunita.id,
      patientId: patient2.id,
      doctorId: drPriya.profile.id,
      status: 'PENDING', // Waiting in pharmacy queue!
      pharmacyNotes: 'Please counsel patient on Sumatriptan usage at first sign of headache.',
    },
  });

  await prisma.prescriptionItem.createMany({
    data: [
      {
        prescriptionId: rxSunita.id,
        medicineName: 'Sumatriptan 50mg',
        genericName: 'Sumatriptan Succinate',
        dosage: '1 tablet (50mg)',
        frequency: 'As needed at onset of headache',
        duration: 'Single dose (Max 2 tabs in 24 hrs)',
        instructions: 'Take immediately with a glass of water when migraine begins',
        quantityPrescribed: 6,
        isDispensed: false,
      },
      {
        prescriptionId: rxSunita.id,
        medicineName: 'Propranolol 40mg',
        genericName: 'Propranolol Hydrochloride',
        dosage: '1 tablet (40mg)',
        frequency: 'Once daily morning',
        duration: '30 days',
        instructions: 'Take consistently with breakfast for migraine prevention',
        quantityPrescribed: 30,
        isDispensed: false,
      },
      {
        prescriptionId: rxSunita.id,
        medicineName: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        dosage: '1-2 tablets',
        frequency: 'Every 6 hours as needed',
        duration: '5 days',
        instructions: 'After food. Do not exceed 4000mg in 24 hours',
        quantityPrescribed: 15,
        isDispensed: false,
      },
    ],
  });

  // Arjun Nair: Appointment request awaiting Reception verification
  await prisma.appointment.create({
    data: {
      hospitalId: hospital.id,
      patientId: patient3.id,
      departmentId: deptMap.get('ORTH')!,
      doctorId: drIyer.profile.id,
      appointmentDate: todayStr,
      timeSlot: '02:00 PM',
      status: 'APPOINTMENT_REQUESTED', // Waiting in Reception review queue!
      paymentStatus: 'PENDING',
      reason: 'Bilateral knee pain during climbing stairs and prolonged standing',
    },
  });

  // 11. Pharmacy Inventory & Batches
  const medicinesData = [
    {
      name: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      category: 'Analgesics & Antipyretics',
      unit: 'Tablets',
      minStockLevel: 100,
      batches: [
        { batchNumber: 'BAT-2026-04A', quantity: 420, expiryDate: '2027-12-31', locationRack: 'Shelf A-01', unitPrice: 0.15 },
      ],
    },
    {
      name: 'Sumatriptan 50mg',
      genericName: 'Sumatriptan Succinate',
      category: 'Antimigraine',
      unit: 'Tablets',
      minStockLevel: 30,
      batches: [
        { batchNumber: 'BAT-2026-07D', quantity: 85, expiryDate: '2027-04-10', locationRack: 'Shelf B-14', unitPrice: 2.4 },
      ],
    },
    {
      name: 'Propranolol 40mg',
      genericName: 'Propranolol Hydrochloride',
      category: 'Beta-Blocker / Antihypertensive',
      unit: 'Tablets',
      minStockLevel: 40,
      batches: [
        { batchNumber: 'BAT-2026-08K', quantity: 120, expiryDate: '2027-09-15', locationRack: 'Shelf B-08', unitPrice: 0.35 },
      ],
    },
    {
      name: 'Amlodipine 5mg',
      genericName: 'Amlodipine Besylate',
      category: 'Antihypertensive',
      unit: 'Tablets',
      minStockLevel: 50,
      batches: [
        { batchNumber: 'BAT-2026-05C', quantity: 350, expiryDate: '2028-01-15', locationRack: 'Shelf B-02', unitPrice: 0.22 },
      ],
    },
    {
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin Trihydrate',
      category: 'Antibiotics',
      unit: 'Capsules',
      minStockLevel: 50,
      batches: [
        { batchNumber: 'BAT-2026-03B', quantity: 180, expiryDate: '2027-08-30', locationRack: 'Shelf C-05', unitPrice: 0.45 },
      ],
    },
    {
      name: 'Metformin 500mg',
      genericName: 'Metformin Hydrochloride',
      category: 'Antidiabetic',
      unit: 'Tablets',
      minStockLevel: 80,
      batches: [
        { batchNumber: 'BAT-2026-01F', quantity: 500, expiryDate: '2027-11-20', locationRack: 'Shelf A-09', unitPrice: 0.18 },
      ],
    },
    {
      name: 'Atorvastatin 20mg',
      genericName: 'Atorvastatin Calcium',
      category: 'Lipid-Lowering',
      unit: 'Tablets',
      minStockLevel: 60,
      batches: [
        { batchNumber: 'BAT-2026-02A', quantity: 210, expiryDate: '2027-06-30', locationRack: 'Shelf B-04', unitPrice: 0.55 },
      ],
    },
    {
      // Low Stock & Expiring soon item for realistic Pharmacy alerts
      name: 'Cefixime 200mg',
      genericName: 'Cefixime Trihydrate',
      category: 'Antibiotics',
      unit: 'Tablets',
      minStockLevel: 50,
      batches: [
        { batchNumber: 'BAT-2025-11X', quantity: 18, expiryDate: '2026-10-15', locationRack: 'Shelf C-11', unitPrice: 1.1 },
      ],
    },
    {
      // Low stock item
      name: 'Salbutamol Inhaler 100mcg',
      genericName: 'Albuterol Sulfate',
      category: 'Respiratory / Bronchodilator',
      unit: 'Canister',
      minStockLevel: 25,
      batches: [
        { batchNumber: 'BAT-2025-09L', quantity: 8, expiryDate: '2027-01-30', locationRack: 'Shelf D-02', unitPrice: 4.8 },
      ],
    },
  ];

  for (const m of medicinesData) {
    const med = await prisma.medicine.create({
      data: {
        hospitalId: hospital.id,
        name: m.name,
        genericName: m.genericName,
        category: m.category,
        unit: m.unit,
        minStockLevel: m.minStockLevel,
      },
    });

    for (const b of m.batches) {
      await prisma.medicineBatch.create({
        data: {
          medicineId: med.id,
          batchNumber: b.batchNumber,
          quantity: b.quantity,
          expiryDate: b.expiryDate,
          locationRack: b.locationRack,
          unitPrice: b.unitPrice,
        },
      });
    }
  }

  // 12. Equipment
  const equipmentData = [
    { code: 'ECG-E204', name: '12-Lead Diagnostic Electrocardiograph', dept: 'CARD', location: 'Cardiology OPD Room 204', status: 'AVAILABLE', last: '2026-07-10', next: '2027-01-10' },
    { code: 'VENT-V102', name: 'Servo Critical Care Ventilator', dept: 'ICU', location: 'ICU Bed 04 Telemetry Bay', status: 'IN_USE', last: '2026-08-01', next: '2026-11-01' },
    { code: 'XRAY-X01', name: 'High-Frequency Digital Radiography System', dept: 'ORTH', location: 'Radiology Suite Ground Floor', status: 'AVAILABLE', last: '2026-05-15', next: '2026-11-15' },
    { code: 'MON-M108', name: 'Multi-Parameter Patient Monitor', dept: 'EMRG', location: 'Emergency Trauma Bay 3', status: 'UNDER_MAINTENANCE', last: '2026-09-18', next: '2026-10-01', notes: 'Scheduled sensor cable replacement' },
    { code: 'DEFIB-D03', name: 'Biphasic Defibrillator & External Pacemaker', dept: 'EMRG', location: 'Emergency Crash Cart 1', status: 'AVAILABLE', last: '2026-09-01', next: '2026-12-01' },
  ];

  for (const eq of equipmentData) {
    await prisma.equipment.create({
      data: {
        hospitalId: hospital.id,
        equipmentCode: eq.code,
        name: eq.name,
        departmentId: deptMap.get(eq.dept)!,
        location: eq.location,
        status: eq.status,
        lastServiceDate: eq.last,
        nextServiceDate: eq.next,
        notes: eq.notes,
      },
    });
  }

  // 13. Hospital Incidents
  await prisma.incident.createMany({
    data: [
      {
        hospitalId: hospital.id,
        reportedById: adminUser.id,
        departmentId: deptMap.get('EMRG')!,
        title: 'Patient monitor lead connectivity glitch in Bay 3',
        type: 'EQUIPMENT',
        priority: 'HIGH',
        description: 'Lead II intermittently artifacts on screen. Biomedical engineering notified for cable harness check.',
        status: 'IN_PROGRESS',
        assignedTo: 'Biomedical Support Team',
      },
      {
        hospitalId: hospital.id,
        reportedById: receptionUser.id,
        departmentId: deptMap.get('GMED')!,
        title: 'OPD Waiting Room air-handling unit temperature fluctuation',
        type: 'OPERATIONAL',
        priority: 'LOW',
        description: 'Thermostat calibrated and ambient cooling restored to 22C.',
        status: 'RESOLVED',
        assignedTo: 'Facilities Maintenance',
        resolutionNotes: 'Filter cleaned and sensor recalibrated on Sept 25.',
      },
    ],
  });

  // 14. Notifications
  await prisma.notification.createMany({
    data: [
      {
        hospitalId: hospital.id,
        recipientRole: 'RECEPTION',
        title: 'New Appointment Request',
        message: 'Patient Arjun Nair (P-100247) requested an appointment with Dr. Rajesh Iyer (Orthopedics).',
        type: 'INFO',
      },
      {
        hospitalId: hospital.id,
        recipientRole: 'DOCTOR',
        recipientUserId: drKumar.user.id,
        title: 'Patient Checked In',
        message: 'Ravi Kumar (P-100245) has checked in and is waiting in the Cardiology lounge.',
        type: 'SUCCESS',
      },
      {
        hospitalId: hospital.id,
        recipientRole: 'PHARMACY',
        title: 'New Prescription Queued',
        message: 'Prescription RX-10231 issued by Dr. Priya Sharma is pending dispensing.',
        type: 'INFO',
      },
      {
        hospitalId: hospital.id,
        recipientRole: 'PHARMACY',
        title: 'Low Stock Alert',
        message: 'Cefixime 200mg is below threshold (18 remaining) and expires on 2026-10-15.',
        type: 'WARNING',
      },
    ],
  });

  // 15. Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        hospitalId: hospital.id,
        userId: adminUser.id,
        userRole: 'ADMIN',
        action: 'INITIALIZE',
        entity: 'HOSPITAL',
        entityId: hospital.id,
        details: 'Hospital core configuration and department hierarchy initialized.',
      },
      {
        hospitalId: hospital.id,
        userId: receptionUser.id,
        userRole: 'RECEPTION',
        action: 'CHECK_IN',
        entity: 'PATIENT',
        entityId: patient1.id,
        details: 'Patient Ravi Kumar (P-100245) checked in for Dr. Ramesh Kumar consultation.',
      },
      {
        hospitalId: hospital.id,
        userId: drPriya.user.id,
        userRole: 'DOCTOR',
        action: 'CONSULT',
        entity: 'CONSULTATION',
        entityId: consultSunita.id,
        details: 'Completed neurological consultation and generated e-prescription RX-10231 for Sunita Verma (P-100246).',
      },
    ],
  });

  console.log('Database seeding completed successfully with realistic clinical and operational data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

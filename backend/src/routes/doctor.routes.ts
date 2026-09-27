import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { logAuditEvent } from '../middleware/audit.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRoles(['DOCTOR', 'ADMIN']));

// Helper to get doctor profile
const getDoctorProfile = async (req: Request) => {
  if (req.user?.role === 'ADMIN' && req.query.doctorId) {
    return prisma.staffProfile.findUnique({
      where: { id: String(req.query.doctorId) },
      include: { user: true, department: true },
    });
  }
  return prisma.staffProfile.findFirst({
    where: { userId: req.user!.id },
    include: { user: true, department: true },
  });
};

// Doctor Dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const doctor = await getDoctorProfile(req);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found for this user.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        appointmentDate: todayStr,
      },
      include: {
        patient: true,
        consultations: {
          include: {
            prescriptions: { include: { items: true } },
          },
        },
        nurseRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [
        { queueNumber: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const waitingPatients = todayAppointments.filter((a) =>
      ['CHECKED_IN', 'WAITING_FOR_DOCTOR'].includes(a.status)
    );

    const inConsultation = todayAppointments.find((a) => a.status === 'IN_CONSULTATION');
    const completedToday = todayAppointments.filter((a) => ['COMPLETED', 'WAITING_FOR_PHARMACY'].includes(a.status));

    res.json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        department: doctor.department?.name,
        specialty: doctor.specialty,
        roomNumber: doctor.roomNumber,
        scheduleHours: doctor.scheduleHours,
        availableDays: doctor.availableDays,
      },
      metrics: {
        todayTotal: todayAppointments.length,
        waitingCount: waitingPatients.length,
        completedCount: completedToday.length,
        inConsultationPatient: inConsultation ? inConsultation.patient.firstName + ' ' + inConsultation.patient.lastName : null,
      },
      waitingPatients,
      inConsultation,
      completedToday,
      todayAppointments,
    });
  } catch (error) {
    console.error('Doctor dashboard error:', error);
    res.status(500).json({ error: 'Failed to load doctor dashboard.' });
  }
});

// Authorized Patient List
router.get('/patients', async (req: Request, res: Response) => {
  try {
    const doctor = await getDoctorProfile(req);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Extract unique patients
    const patientMap = new Map();
    for (const a of appointments) {
      if (!patientMap.has(a.patient.id)) {
        patientMap.set(a.patient.id, {
          ...a.patient,
          lastVisitDate: a.appointmentDate,
          lastReason: a.reason,
        });
      }
    }

    res.json({ patients: Array.from(patientMap.values()) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor patients.' });
  }
});

// Patient Longitudinal Medical History
router.get('/patient-history/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findFirst({
      where: {
        OR: [{ id: patientId }, { patientId: patientId }],
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const consultations = await prisma.consultation.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { include: { user: true, department: true } },
        prescriptions: { include: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const nurseRecords = await prisma.nurseRecord.findMany({
      where: { patientId: patient.id },
      include: {
        nurse: { include: { user: true } },
      },
      orderBy: { recordedAt: 'desc' },
    });

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        department: true,
        doctor: { include: { user: true } },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    res.json({
      patient,
      consultations,
      nurseRecords,
      appointments,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient medical history.' });
  }
});

// Begin Consultation (Moves status to IN_CONSULTATION)
router.post('/appointments/:id/start-consultation', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'IN_CONSULTATION',
      },
      include: { patient: true },
    });

    res.json({ message: 'Consultation started.', appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start consultation.' });
  }
});

// Submit Consultation & Digital E-Prescription
router.post('/consultations', async (req: Request, res: Response) => {
  try {
    const doctor = await getDoctorProfile(req);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const {
      appointmentId,
      patientId,
      chiefComplaint,
      symptoms,
      physicalExam,
      diagnosis,
      clinicalNotes,
      instructions,
      followUpDate,
      prescriptionItems, // array of { medicineName, genericName, dosage, frequency, duration, instructions, quantityPrescribed }
      nurseInstructions, // optional string for nursing task
      instructionPriority = 'ROUTINE',
    } = req.body;

    if (!appointmentId || !patientId || !chiefComplaint || !diagnosis) {
      return res.status(400).json({ error: 'Appointment ID, Patient ID, Chief Complaint, and Diagnosis are required.' });
    }

    // 1. Create Consultation record
    const consultation = await prisma.consultation.create({
      data: {
        appointmentId,
        patientId,
        doctorId: doctor.id,
        chiefComplaint,
        symptoms: symptoms || chiefComplaint,
        physicalExam,
        diagnosis,
        clinicalNotes,
        instructions,
        followUpDate,
      },
    });

    // 2. Create Prescription if items provided
    let createdPrescription = null;
    if (prescriptionItems && Array.isArray(prescriptionItems) && prescriptionItems.length > 0) {
      const rxCount = await prisma.prescription.count();
      const prescriptionCode = `RX-${10232 + rxCount}`;

      createdPrescription = await prisma.prescription.create({
        data: {
          prescriptionCode,
          consultationId: consultation.id,
          patientId,
          doctorId: doctor.id,
          status: 'PENDING', // Sent automatically to Medical Store / Pharmacy!
          pharmacyNotes: instructions,
        },
      });

      for (const item of prescriptionItems) {
        await prisma.prescriptionItem.create({
          data: {
            prescriptionId: createdPrescription.id,
            medicineName: item.medicineName,
            genericName: item.genericName,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            quantityPrescribed: Number(item.quantityPrescribed) || 1,
            isDispensed: false,
          },
        });
      }

      // Notify Pharmacy
      await prisma.notification.create({
        data: {
          hospitalId: doctor.user.hospitalId,
          recipientRole: 'PHARMACY',
          title: 'New Digital E-Prescription',
          message: `Dr. ${doctor.user.name} issued prescription ${prescriptionCode} awaiting dispensing.`,
          type: 'INFO',
        },
      });
    }

    // 3. Create Doctor Instruction for Nurse if provided
    if (nurseInstructions && nurseInstructions.trim()) {
      await prisma.doctorInstruction.create({
        data: {
          patientId,
          appointmentId,
          doctorId: doctor.id,
          instruction: nurseInstructions,
          priority: instructionPriority,
          status: 'PENDING',
        },
      });

      // Notify Nurse
      await prisma.notification.create({
        data: {
          hospitalId: doctor.user.hospitalId,
          recipientRole: 'NURSE',
          title: 'New Doctor Instruction',
          message: `Dr. ${doctor.user.name} issued care instructions: "${nurseInstructions}"`,
          type: 'WARNING',
        },
      });
    }

    // 4. Update Appointment status
    const nextStatus = createdPrescription ? 'WAITING_FOR_PHARMACY' : 'COMPLETED';
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: nextStatus,
        completedAt: nextStatus === 'COMPLETED' ? new Date() : undefined,
      },
    });

    await logAuditEvent({
      hospitalId: doctor.user.hospitalId,
      userId: req.user!.id,
      userRole: 'DOCTOR',
      action: 'COMPLETE_CONSULTATION',
      entity: 'CONSULTATION',
      entityId: consultation.id,
      details: `Dr. ${doctor.user.name} completed consultation for patient ${patientId}. Diagnosis: ${diagnosis}${createdPrescription ? ` (Prescription: ${createdPrescription.prescriptionCode})` : ''}`,
    });

    res.status(201).json({
      message: 'Consultation completed and saved.',
      consultation,
      prescription: createdPrescription,
      status: nextStatus,
    });
  } catch (error) {
    console.error('Error recording consultation:', error);
    res.status(500).json({ error: 'Failed to record consultation.' });
  }
});

// Update Doctor Schedule
router.put('/schedule', async (req: Request, res: Response) => {
  try {
    const doctor = await getDoctorProfile(req);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const { availableDays, scheduleHours, roomNumber } = req.body;
    const updated = await prisma.staffProfile.update({
      where: { id: doctor.id },
      data: {
        availableDays: availableDays || doctor.availableDays,
        scheduleHours: scheduleHours || doctor.scheduleHours,
        roomNumber: roomNumber || doctor.roomNumber,
      },
    });

    res.json({ message: 'Schedule updated successfully.', profile: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update schedule.' });
  }
});

export default router;

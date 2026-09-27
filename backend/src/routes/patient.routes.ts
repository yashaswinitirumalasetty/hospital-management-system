import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { logAuditEvent } from '../middleware/audit.middleware';

const router = Router();

// Middleware: must be authenticated and have role PATIENT or ADMIN
router.use(authenticate);
router.use(requireRoles(['PATIENT', 'ADMIN']));

// Helper to get patient record from request
const getPatient = async (req: Request) => {
  if (req.user?.role === 'ADMIN' && req.query.patientId) {
    return prisma.patient.findUnique({
      where: { patientId: String(req.query.patientId) },
    });
  }
  return prisma.patient.findFirst({
    where: { userId: req.user!.id },
  });
};

// Patient Dashboard Overview
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const patient = await getPatient(req);
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    // Active or upcoming appointment
    const activeAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
      include: {
        department: true,
        doctor: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Recent prescriptions
    const recentPrescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { include: { user: true, department: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Recent vitals recorded by nurse
    const recentVitals = await prisma.nurseRecord.findMany({
      where: { patientId: patient.id },
      orderBy: { recordedAt: 'desc' },
      take: 3,
    });

    // Notifications
    const notifications = await prisma.notification.findMany({
      where: {
        recipientRole: 'PATIENT',
        recipientUserId: req.user!.id,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      patient: {
        id: patient.id,
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
      },
      activeAppointment,
      recentPrescriptions,
      recentVitals,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching patient dashboard:', error);
    res.status(500).json({ error: 'Failed to load patient dashboard.' });
  }
});

// Full Longitudinal Patient Timeline
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const patient = await getPatient(req);
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
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

    // Merge into chronological timeline items
    const timelineItems: any[] = [];

    consultations.forEach((c) => {
      timelineItems.push({
        id: `consult-${c.id}`,
        date: c.createdAt,
        type: 'CONSULTATION',
        title: `Consultation with ${c.doctor.user.name} (${c.doctor.department?.name || 'OPD'})`,
        department: c.doctor.department?.name,
        doctorName: c.doctor.user.name,
        diagnosis: c.diagnosis,
        symptoms: c.symptoms,
        notes: c.clinicalNotes,
        instructions: c.instructions,
        prescriptions: c.prescriptions,
      });
    });

    nurseRecords.forEach((nr) => {
      timelineItems.push({
        id: `nurse-${nr.id}`,
        date: nr.recordedAt,
        type: 'VITALS',
        title: `Vitals Recorded by ${nr.nurse.user.name}`,
        nurseName: nr.nurse.user.name,
        bloodPressure: nr.bloodPressure,
        pulse: nr.pulse,
        temperature: nr.temperature,
        spO2: nr.spO2,
        weight: nr.weight,
        notes: nr.nursingNotes,
      });
    });

    timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      patientId: patient.patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      timeline: timelineItems,
      appointments,
    });
  } catch (error) {
    console.error('Error fetching patient timeline:', error);
    res.status(500).json({ error: 'Failed to load longitudinal timeline.' });
  }
});

// Patient Appointments List
router.get('/appointments', async (req: Request, res: Response) => {
  try {
    const patient = await getPatient(req);
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        department: true,
        doctor: { include: { user: true } },
        consultations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments.' });
  }
});

// Submit Appointment Request (Sends request to Reception Queue)
router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const patient = await getPatient(req);
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    const { departmentId, doctorId, appointmentDate, timeSlot, reason } = req.body;
    if (!departmentId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ error: 'Department, appointment date, and time slot are required.' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        hospitalId: patient.hospitalId,
        patientId: patient.id,
        departmentId,
        doctorId: doctorId || null,
        appointmentDate,
        timeSlot,
        reason,
        status: 'APPOINTMENT_REQUESTED', // Sent to Reception for review
        paymentStatus: 'PENDING',
      },
      include: {
        department: true,
        doctor: { include: { user: true } },
      },
    });

    // Notify Reception
    await prisma.notification.create({
      data: {
        hospitalId: patient.hospitalId,
        recipientRole: 'RECEPTION',
        title: 'New Appointment Request',
        message: `Patient ${patient.firstName} ${patient.lastName} (${patient.patientId}) submitted an appointment request for ${appointment.appointmentDate} at ${appointment.timeSlot}.`,
        type: 'INFO',
      },
    });

    await logAuditEvent({
      hospitalId: patient.hospitalId,
      userId: req.user!.id,
      userRole: 'PATIENT',
      action: 'REQUEST_APPOINTMENT',
      entity: 'APPOINTMENT',
      entityId: appointment.id,
      details: `Appointment requested for ${appointment.appointmentDate} (${appointment.timeSlot})`,
    });

    res.status(201).json({
      message: 'Appointment request submitted successfully. Awaiting Reception verification.',
      appointment,
    });
  } catch (error) {
    console.error('Error creating appointment request:', error);
    res.status(500).json({ error: 'Failed to submit appointment request.' });
  }
});

// Patient Prescriptions
router.get('/prescriptions', async (req: Request, res: Response) => {
  try {
    const patient = await getPatient(req);
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { include: { user: true, department: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions.' });
  }
});

// Current Patient Journey Status
router.get('/journey', async (req: Request, res: Response) => {
  try {
    const patient = await getPatient(req);
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found.' });
    }

    const currentAppointment = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        status: {
          notIn: ['CANCELLED'],
        },
      },
      include: {
        department: true,
        doctor: { include: { user: true } },
        consultations: {
          include: {
            prescriptions: { include: { items: true } },
          },
        },
        nurseRecords: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentAppointment) {
      return res.json({
        hasActiveJourney: false,
        message: 'No current hospital journey in progress.',
      });
    }

    // Map workflow state to stage index and metadata
    const stages = [
      { key: 'APPOINTMENT_REQUESTED', label: 'Appointment Requested', desc: 'Request submitted online' },
      { key: 'RECEPTION_REVIEW', label: 'Reception Review', desc: 'Front desk reviewing schedule' },
      { key: 'CONFIRMED', label: 'Confirmed', desc: 'Slot confirmed by Reception' },
      { key: 'CHECKED_IN', label: 'Checked In', desc: 'Patient arrived physically at hospital' },
      { key: 'WAITING_FOR_DOCTOR', label: 'Waiting for Doctor', desc: 'In queue for consultation' },
      { key: 'IN_CONSULTATION', label: 'Consultation', desc: 'With doctor' },
      { key: 'WAITING_FOR_PHARMACY', label: 'Pharmacy Dispensing', desc: 'Prescription routing to dispensary' },
      { key: 'COMPLETED', label: 'Completed', desc: 'Visit concluded' },
      { key: 'FOLLOW_UP', label: 'Follow-up', desc: 'Scheduled follow-up review' },
    ];

    const currentStatus = currentAppointment.status;
    let currentStageIndex = stages.findIndex((s) => s.key === currentStatus);
    if (currentStageIndex === -1) {
      currentStageIndex = 0;
    }

    res.json({
      hasActiveJourney: true,
      appointment: currentAppointment,
      currentStatus,
      currentStageIndex,
      stages,
      queueNumber: currentAppointment.queueNumber,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve patient journey.' });
  }
});

export default router;

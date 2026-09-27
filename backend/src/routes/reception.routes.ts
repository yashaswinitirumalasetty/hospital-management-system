import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { logAuditEvent } from '../middleware/audit.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRoles(['RECEPTION', 'ADMIN']));

// Reception Dashboard Metrics & Lists
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const todayStr = new Date().toISOString().split('T')[0];

    const todayAppointments = await prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: todayStr,
      },
      include: {
        patient: true,
        department: true,
        doctor: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingRequests = await prisma.appointment.findMany({
      where: {
        hospitalId,
        status: 'APPOINTMENT_REQUESTED',
      },
      include: {
        patient: true,
        department: true,
        doctor: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const waitingPatients = todayAppointments.filter((a) =>
      ['CHECKED_IN', 'WAITING_FOR_DOCTOR'].includes(a.status)
    );

    const checkedInCount = todayAppointments.filter((a) => a.checkedInAt !== null).length;
    const completedCount = todayAppointments.filter((a) => a.status === 'COMPLETED').length;

    // Doctor availability summary
    const doctors = await prisma.staffProfile.findMany({
      where: {
        departmentId: { not: null },
        user: { role: 'DOCTOR', active: true },
      },
      include: {
        user: true,
        department: true,
      },
    });

    res.json({
      metrics: {
        todayTotal: todayAppointments.length,
        waitingCount: waitingPatients.length,
        checkedInCount,
        completedCount,
        pendingRequestsCount: pendingRequests.length,
      },
      todayAppointments,
      pendingRequests,
      waitingPatients,
      doctors,
    });
  } catch (error) {
    console.error('Reception dashboard error:', error);
    res.status(500).json({ error: 'Failed to load reception dashboard.' });
  }
});

// Search Patients (by Patient ID, Name, Phone)
router.get('/search-patients', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const query = String(req.query.q || '').trim();

    if (!query) {
      const recentPatients = await prisma.patient.findMany({
        where: { hospitalId },
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          appointments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { department: true, doctor: { include: { user: true } } },
          },
        },
      });
      return res.json({ patients: recentPatients });
    }

    const patients = await prisma.patient.findMany({
      where: {
        hospitalId,
        OR: [
          { patientId: { contains: query } },
          { firstName: { contains: query } },
          { lastName: { contains: query } },
          { phone: { contains: query } },
          { email: { contains: query } },
        ],
      },
      include: {
        appointments: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: { department: true, doctor: { include: { user: true } } },
        },
      },
      take: 20,
    });

    res.json({ patients });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search patients.' });
  }
});

// Register New Patient at Reception
router.post('/register-patient', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      email,
      bloodGroup,
      address,
      emergencyContact,
      allergies,
      chronicConditions,
      // Optional initial appointment
      departmentId,
      doctorId,
      appointmentDate,
      timeSlot,
      reason,
      paymentStatus = 'RECEIVED',
    } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ error: 'First name, last name, and phone are required.' });
    }

    // Check if phone or email already matches an existing patient to prevent duplicate profiles
    const existing = await prisma.patient.findFirst({
      where: {
        hospitalId,
        OR: [{ phone }, ...(email ? [{ email }] : [])],
      },
    });

    if (existing) {
      return res.status(409).json({
        error: `A patient profile already exists with this phone/email under Patient ID: ${existing.patientId}. Please link to existing patient instead of creating duplicate.`,
        existingPatient: existing,
      });
    }

    // Generate permanent Patient ID
    const count = await prisma.patient.count({ where: { hospitalId } });
    const patientId = `P-${100245 + count}`;

    const newPatient = await prisma.patient.create({
      data: {
        hospitalId,
        patientId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || '1990-01-01',
        gender: gender || 'Unspecified',
        phone,
        email: email || null,
        bloodGroup: bloodGroup || null,
        address: address || null,
        emergencyContact: emergencyContact || null,
        allergies: allergies || null,
        chronicConditions: chronicConditions || null,
      },
    });

    let initialAppointment = null;
    if (departmentId && appointmentDate && timeSlot) {
      // Calculate next queue number for today
      const apptCount = await prisma.appointment.count({
        where: { hospitalId, appointmentDate },
      });

      initialAppointment = await prisma.appointment.create({
        data: {
          hospitalId,
          patientId: newPatient.id,
          departmentId,
          doctorId: doctorId || null,
          appointmentDate,
          timeSlot,
          reason,
          queueNumber: apptCount + 1,
          status: 'CONFIRMED',
          paymentStatus: paymentStatus || 'RECEIVED',
        },
      });
    }

    await logAuditEvent({
      hospitalId,
      userId: req.user!.id,
      userRole: 'RECEPTION',
      action: 'REGISTER_PATIENT',
      entity: 'PATIENT',
      entityId: newPatient.id,
      details: `Reception registered new patient ${newPatient.firstName} ${newPatient.lastName} (${newPatient.patientId})`,
    });

    res.status(201).json({
      message: 'Patient registered successfully with permanent Patient ID.',
      patient: newPatient,
      appointment: initialAppointment,
    });
  } catch (error) {
    console.error('Error registering patient at reception:', error);
    res.status(500).json({ error: 'Failed to register patient.' });
  }
});

// Book Visit for Existing Patient (Mandatory: connects visit to existing P-ID)
router.post('/book-existing-patient', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { patientId, departmentId, doctorId, appointmentDate, timeSlot, reason, paymentStatus = 'RECEIVED' } = req.body;

    if (!patientId || !departmentId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ error: 'Patient ID, department, appointment date, and time slot are required.' });
    }

    // Verify existing patient
    const patient = await prisma.patient.findFirst({
      where: {
        hospitalId,
        OR: [{ id: patientId }, { patientId: patientId }],
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Existing patient record not found.' });
    }

    const apptCount = await prisma.appointment.count({
      where: { hospitalId, appointmentDate },
    });

    const appointment = await prisma.appointment.create({
      data: {
        hospitalId,
        patientId: patient.id,
        departmentId,
        doctorId: doctorId || null,
        appointmentDate,
        timeSlot,
        reason,
        queueNumber: apptCount + 1,
        status: 'CONFIRMED',
        paymentStatus: paymentStatus || 'RECEIVED',
      },
      include: {
        patient: true,
        department: true,
        doctor: { include: { user: true } },
      },
    });

    await logAuditEvent({
      hospitalId,
      userId: req.user!.id,
      userRole: 'RECEPTION',
      action: 'CREATE_VISIT',
      entity: 'APPOINTMENT',
      entityId: appointment.id,
      details: `New visit linked to existing patient ${patient.patientId} (${patient.firstName} ${patient.lastName})`,
    });

    res.status(201).json({
      message: 'New visit created and linked to permanent patient profile.',
      appointment,
    });
  } catch (error) {
    console.error('Error booking existing patient:', error);
    res.status(500).json({ error: 'Failed to create appointment for existing patient.' });
  }
});

// Verify & Confirm Appointment Request
router.patch('/appointments/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, doctorId, timeSlot, queueNumber, paymentStatus } = req.body;

    const existingAppt = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!existingAppt) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status || 'CONFIRMED',
        doctorId: doctorId !== undefined ? doctorId : existingAppt.doctorId,
        timeSlot: timeSlot || existingAppt.timeSlot,
        queueNumber: queueNumber !== undefined ? queueNumber : existingAppt.queueNumber,
        paymentStatus: paymentStatus || existingAppt.paymentStatus,
      },
      include: {
        patient: true,
        department: true,
        doctor: { include: { user: true } },
      },
    });

    // Notify patient
    if (existingAppt.patient.userId) {
      await prisma.notification.create({
        data: {
          hospitalId: existingAppt.hospitalId,
          recipientUserId: existingAppt.patient.userId,
          recipientRole: 'PATIENT',
          title: `Appointment ${status === 'CANCELLED' ? 'Cancelled' : 'Confirmed'}`,
          message: `Your appointment on ${updated.appointmentDate} at ${updated.timeSlot} has been verified and ${status?.toLowerCase() || 'confirmed'}.`,
          type: status === 'CANCELLED' ? 'WARNING' : 'SUCCESS',
        },
      });
    }

    await logAuditEvent({
      hospitalId: existingAppt.hospitalId,
      userId: req.user!.id,
      userRole: 'RECEPTION',
      action: 'VERIFY_APPOINTMENT',
      entity: 'APPOINTMENT',
      entityId: id,
      details: `Reception updated appointment ${id} to ${status || 'CONFIRMED'}`,
    });

    res.json({ message: 'Appointment updated successfully.', appointment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify appointment.' });
  }
});

// Physical Check-In Workflow (Arrival -> Waiting for Doctor)
router.post('/appointments/:id/check-in', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const existingAppt = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    if (!existingAppt) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Determine next queue number for doctor's OPD today
    const doctorQueueCount = await prisma.appointment.count({
      where: {
        hospitalId: existingAppt.hospitalId,
        doctorId: existingAppt.doctorId,
        appointmentDate: existingAppt.appointmentDate,
        checkedInAt: { not: null },
      },
    });

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'WAITING_FOR_DOCTOR',
        checkedInAt: new Date(),
        queueNumber: doctorQueueCount + 1,
        paymentStatus: paymentStatus || 'RECEIVED',
      },
      include: {
        patient: true,
        department: true,
        doctor: { include: { user: true } },
      },
    });

    // Notify Doctor
    if (existingAppt.doctor?.user?.id) {
      await prisma.notification.create({
        data: {
          hospitalId: existingAppt.hospitalId,
          recipientUserId: existingAppt.doctor.user.id,
          recipientRole: 'DOCTOR',
          title: 'Patient Checked In',
          message: `${existingAppt.patient.firstName} ${existingAppt.patient.lastName} (${existingAppt.patient.patientId}) has checked in. Queue #${updated.queueNumber}.`,
          type: 'INFO',
        },
      });
    }

    await logAuditEvent({
      hospitalId: existingAppt.hospitalId,
      userId: req.user!.id,
      userRole: 'RECEPTION',
      action: 'CHECK_IN',
      entity: 'APPOINTMENT',
      entityId: id,
      details: `Patient checked in: ${existingAppt.patient.patientId} assigned Queue #${updated.queueNumber}`,
    });

    res.json({ message: 'Patient checked in successfully.', appointment: updated });
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ error: 'Failed to process check-in.' });
  }
});

// Update Payment Status (Pending, Received, Not Applicable)
router.patch('/appointments/:id/payment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['PENDING', 'RECEIVED', 'NOT_APPLICABLE'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Payment status must be PENDING, RECEIVED, or NOT_APPLICABLE.' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { paymentStatus },
    });

    res.json({ message: 'Payment status updated.', appointment: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment status.' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { logAuditEvent } from '../middleware/audit.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRoles(['NURSE', 'ADMIN']));

// Helper to get nurse profile
const getNurseProfile = async (req: Request) => {
  if (req.user?.role === 'ADMIN' && req.query.nurseId) {
    return prisma.staffProfile.findUnique({
      where: { id: String(req.query.nurseId) },
      include: { user: true, department: true },
    });
  }
  return prisma.staffProfile.findFirst({
    where: { userId: req.user!.id },
    include: { user: true, department: true },
  });
};

// Nurse Dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const todayStr = new Date().toISOString().split('T')[0];

    // Patients currently in hospital today needing vitals or care
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: todayStr,
        status: {
          in: ['CHECKED_IN', 'WAITING_FOR_DOCTOR', 'IN_CONSULTATION'],
        },
      },
      include: {
        patient: true,
        department: true,
        doctor: { include: { user: true } },
        nurseRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        },
        doctorInstructions: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Pending Doctor Instructions
    const pendingInstructions = await prisma.doctorInstruction.findMany({
      where: {
        status: { in: ['PENDING', 'ACKNOWLEDGED'] },
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Recent vitals logged today
    const recentVitals = await prisma.nurseRecord.findMany({
      where: {
        appointment: {
          hospitalId,
        },
      },
      include: {
        patient: true,
        nurse: { include: { user: true } },
      },
      orderBy: { recordedAt: 'desc' },
      take: 10,
    });

    res.json({
      metrics: {
        activePatientsCount: activeAppointments.length,
        pendingInstructionsCount: pendingInstructions.length,
        vitalsRecordedTodayCount: recentVitals.length,
      },
      activeAppointments,
      pendingInstructions,
      recentVitals,
    });
  } catch (error) {
    console.error('Nurse dashboard error:', error);
    res.status(500).json({ error: 'Failed to load nurse dashboard.' });
  }
});

// Record Patient Vitals
router.post('/vitals', async (req: Request, res: Response) => {
  try {
    const nurse = await getNurseProfile(req);
    if (!nurse) {
      return res.status(404).json({ error: 'Nurse profile not found.' });
    }

    const {
      patientId,
      appointmentId,
      bloodPressure,
      temperature,
      pulse,
      spO2,
      respiratoryRate,
      weight,
      nursingNotes,
    } = req.body;

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    // Resolve patient DB ID if patientId code was provided
    let patient = await prisma.patient.findFirst({
      where: {
        OR: [{ id: patientId }, { patientId }],
      },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const record = await prisma.nurseRecord.create({
      data: {
        patientId: patient.id,
        appointmentId: appointmentId || null,
        nurseId: nurse.id,
        bloodPressure: bloodPressure || null,
        temperature: temperature || null,
        pulse: pulse ? parseInt(pulse, 10) : null,
        spO2: spO2 ? parseInt(spO2, 10) : null,
        respiratoryRate: respiratoryRate ? parseInt(respiratoryRate, 10) : null,
        weight: weight ? parseFloat(weight) : null,
        nursingNotes: nursingNotes || null,
      },
    });

    await logAuditEvent({
      hospitalId: patient.hospitalId,
      userId: req.user!.id,
      userRole: 'NURSE',
      action: 'RECORD_VITALS',
      entity: 'VITALS',
      entityId: record.id,
      details: `Nurse ${nurse.user.name} recorded vitals for patient ${patient.patientId} (BP: ${bloodPressure || 'N/A'}, Pulse: ${pulse || 'N/A'}, SpO2: ${spO2 || 'N/A'}%)`,
    });

    res.status(201).json({
      message: 'Vitals recorded successfully.',
      record,
    });
  } catch (error) {
    console.error('Error recording vitals:', error);
    res.status(500).json({ error: 'Failed to record vitals.' });
  }
});

// Acknowledge or Complete Doctor Instruction
router.patch('/instructions/:id', async (req: Request, res: Response) => {
  try {
    const nurse = await getNurseProfile(req);
    const { id } = req.params;
    const { status, completionNotes } = req.body;

    if (!['ACKNOWLEDGED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be ACKNOWLEDGED or COMPLETED.' });
    }

    const updated = await prisma.doctorInstruction.update({
      where: { id },
      data: {
        status,
        assignedNurseId: nurse?.id || undefined,
        acknowledgedAt: status === 'ACKNOWLEDGED' ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        completionNotes: completionNotes || undefined,
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    await logAuditEvent({
      hospitalId: updated.patient.hospitalId,
      userId: req.user!.id,
      userRole: 'NURSE',
      action: 'UPDATE_INSTRUCTION',
      entity: 'DOCTOR_INSTRUCTION',
      entityId: id,
      details: `Instruction ${id} marked as ${status} by Nurse ${nurse?.user.name || req.user!.name}`,
    });

    res.json({ message: `Instruction marked as ${status}.`, instruction: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update instruction status.' });
  }
});

export default router;

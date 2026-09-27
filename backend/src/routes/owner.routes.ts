import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireRoles } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRoles(['OWNER', 'ADMIN']));

// Hospital Owner Executive Metrics & Bottlenecks
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalPatientsCount,
      todayAppointments,
      activeDoctorsCount,
      activeNursesCount,
      pendingRxCount,
      openIncidents,
      medicines,
    ] = await Promise.all([
      prisma.patient.count({ where: { hospitalId } }),
      prisma.appointment.findMany({
        where: { hospitalId, appointmentDate: todayStr },
        include: { department: true },
      }),
      prisma.user.count({ where: { hospitalId, role: 'DOCTOR', active: true } }),
      prisma.user.count({ where: { hospitalId, role: 'NURSE', active: true } }),
      prisma.prescription.count({ where: { status: { in: ['PENDING', 'READY'] } } }),
      prisma.incident.findMany({
        where: { hospitalId, status: { not: 'CLOSED' } },
        include: { department: true },
      }),
      prisma.medicine.findMany({
        where: { hospitalId },
        include: { batches: true },
      }),
    ]);

    // 1. High-Level Operational Throughput
    const todayTotal = todayAppointments.length;
    const consultationsCompleted = todayAppointments.filter((a) =>
      ['COMPLETED', 'WAITING_FOR_PHARMACY'].includes(a.status)
    ).length;

    // 2. Bottleneck Monitoring (Critical Owner requirement)
    const waitingForDoctor = todayAppointments.filter((a) =>
      ['CHECKED_IN', 'WAITING_FOR_DOCTOR'].includes(a.status)
    ).length;

    const waitingForPharmacy = todayAppointments.filter((a) => a.status === 'WAITING_FOR_PHARMACY').length;

    const registrationPending = await prisma.appointment.count({
      where: { hospitalId, status: 'APPOINTMENT_REQUESTED' },
    });

    const inConsultationCount = todayAppointments.filter((a) => a.status === 'IN_CONSULTATION').length;

    // 3. Department Operational Status
    const departments = await prisma.department.findMany({
      where: { hospitalId },
    });

    const departmentStatus = departments.map((dept) => {
      const deptAppts = todayAppointments.filter((a) => a.departmentId === dept.id);
      const waiting = deptAppts.filter((a) =>
        ['CHECKED_IN', 'WAITING_FOR_DOCTOR'].includes(a.status)
      ).length;

      let status = 'Normal';
      let loadLevel: 'normal' | 'moderate' | 'busy' | 'critical' = 'normal';

      if (waiting >= 5) {
        status = 'Heavy Congestion';
        loadLevel = 'critical';
      } else if (waiting >= 2) {
        status = 'Busy';
        loadLevel = 'busy';
      } else if (dept.code === 'EMRG') {
        status = 'Active Triage';
        loadLevel = 'moderate';
      }

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        todayPatients: deptAppts.length,
        waitingCount: waiting,
        status,
        loadLevel,
      };
    });

    // Pharmacy Status calculation
    let lowStockCount = 0;
    medicines.forEach((m) => {
      const stock = m.batches.reduce((sum, b) => sum + b.quantity, 0);
      if (stock <= m.minStockLevel) lowStockCount++;
    });

    const pharmacyOperationalStatus = lowStockCount > 0 ? `${lowStockCount} Low Stock Items` : 'Optimal Stock';

    res.json({
      summary: {
        todayPatients: todayTotal,
        consultationsCompleted,
        waitingPatients: waitingForDoctor,
        inConsultationCount,
        availableDoctors: activeDoctorsCount,
        activeNurses: activeNursesCount,
        totalRegisteredPatients: totalPatientsCount,
      },
      bottlenecks: [
        { stage: 'Registration / Reception Review', count: registrationPending, threshold: 3, alert: registrationPending > 3 },
        { stage: 'Waiting for Doctor Consultation', count: waitingForDoctor, threshold: 5, alert: waitingForDoctor > 5 },
        { stage: 'In Consultation', count: inConsultationCount, threshold: 10, alert: false },
        { stage: 'Waiting for Pharmacy Dispensing', count: waitingForPharmacy || pendingRxCount, threshold: 4, alert: (waitingForPharmacy || pendingRxCount) > 4 },
      ],
      departmentStatus,
      pharmacyStatus: {
        pendingPrescriptions: pendingRxCount,
        status: pharmacyOperationalStatus,
        lowStockItems: lowStockCount,
      },
      operationalIncidents: openIncidents,
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    res.status(500).json({ error: 'Failed to load owner dashboard.' });
  }
});

export default router;

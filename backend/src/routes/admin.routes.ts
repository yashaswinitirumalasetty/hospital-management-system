import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { logAuditEvent } from '../middleware/audit.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRoles(['ADMIN']));

// Admin Dashboard Overview
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const todayStr = new Date().toISOString().split('T')[0];

    const [
      totalPatients,
      todayAppointments,
      activeDoctors,
      activeNurses,
      pendingRequests,
      pendingPrescriptions,
      openIncidents,
      equipmentUnderMaintenance,
    ] = await Promise.all([
      prisma.patient.count({ where: { hospitalId } }),
      prisma.appointment.count({ where: { hospitalId, appointmentDate: todayStr } }),
      prisma.user.count({ where: { hospitalId, role: 'DOCTOR', active: true } }),
      prisma.user.count({ where: { hospitalId, role: 'NURSE', active: true } }),
      prisma.appointment.count({ where: { hospitalId, status: 'APPOINTMENT_REQUESTED' } }),
      prisma.prescription.count({ where: { status: { in: ['PENDING', 'READY'] } } }),
      prisma.incident.count({ where: { hospitalId, status: { not: 'CLOSED' } } }),
      prisma.equipment.count({ where: { hospitalId, status: 'UNDER_MAINTENANCE' } }),
    ]);

    // Department breakdown
    const departments = await prisma.department.findMany({
      where: { hospitalId },
      include: {
        _count: {
          select: { staffProfiles: true, appointments: true, equipment: true },
        },
      },
    });

    // Recent 5 audit logs
    const recentAuditLogs = await prisma.auditLog.findMany({
      where: { hospitalId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    res.json({
      metrics: {
        totalPatients,
        todayAppointments,
        activeDoctors,
        activeNurses,
        pendingRequests,
        pendingPrescriptions,
        openIncidents,
        equipmentUnderMaintenance,
      },
      departments,
      recentAuditLogs,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to load admin dashboard.' });
  }
});

// Staff Management: List all staff
router.get('/staff', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const role = req.query.role as string;

    const staffUsers = await prisma.user.findMany({
      where: {
        hospitalId,
        role: role ? role : { in: ['DOCTOR', 'NURSE', 'RECEPTION', 'PHARMACY'] },
      },
      include: {
        staffProfile: {
          include: { department: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ staff: staffUsers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch staff members.' });
  }
});

// Staff Management: Create new staff user
router.post('/staff', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const {
      name,
      email,
      password,
      role,
      phone,
      departmentId,
      specialty,
      qualification,
      experienceYears,
      roomNumber,
      availableDays,
      scheduleHours,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        hospitalId,
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        phone,
      },
    });

    const staffProfile = await prisma.staffProfile.create({
      data: {
        userId: user.id,
        departmentId: departmentId || null,
        specialty,
        qualification,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) : 5,
        roomNumber,
        availableDays: availableDays || 'Mon,Tue,Wed,Thu,Fri',
        scheduleHours: scheduleHours || '09:00 - 17:00',
      },
    });

    await logAuditEvent({
      hospitalId,
      userId: req.user!.id,
      userRole: 'ADMIN',
      action: 'CREATE_STAFF',
      entity: 'USER',
      entityId: user.id,
      details: `Created new ${role}: ${name} (${email})`,
    });

    res.status(201).json({ message: 'Staff member created successfully.', user, staffProfile });
  } catch (error) {
    console.error('Error creating staff:', error);
    res.status(500).json({ error: 'Failed to create staff member.' });
  }
});

// Department Management
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const departments = await prisma.department.findMany({
      where: { hospitalId },
      include: {
        staffProfiles: {
          include: { user: true },
        },
      },
    });

    res.json({ departments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
});

router.post('/departments', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { name, code, description, locationFloor } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required.' });
    }

    const department = await prisma.department.create({
      data: {
        hospitalId,
        name,
        code: code.toUpperCase(),
        description,
        locationFloor: locationFloor || '1st Floor',
      },
    });

    res.status(201).json({ message: 'Department created successfully.', department });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department.' });
  }
});

// Equipment Management
router.get('/equipment', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const equipment = await prisma.equipment.findMany({
      where: { hospitalId },
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ equipment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch equipment.' });
  }
});

router.post('/equipment', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { equipmentCode, name, departmentId, location, status, lastServiceDate, nextServiceDate, notes } = req.body;

    if (!equipmentCode || !name || !departmentId) {
      return res.status(400).json({ error: 'Equipment code, name, and department are required.' });
    }

    const item = await prisma.equipment.create({
      data: {
        hospitalId,
        equipmentCode,
        name,
        departmentId,
        location: location || 'Central Store',
        status: status || 'AVAILABLE',
        lastServiceDate,
        nextServiceDate,
        notes,
      },
      include: { department: true },
    });

    res.status(201).json({ message: 'Equipment recorded.', equipment: item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record equipment.' });
  }
});

router.patch('/equipment/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, nextServiceDate } = req.body;

    const item = await prisma.equipment.update({
      where: { id },
      data: {
        status,
        notes: notes || undefined,
        nextServiceDate: nextServiceDate || undefined,
      },
    });

    res.json({ message: 'Equipment status updated.', equipment: item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update equipment.' });
  }
});

// Incident Management
router.get('/incidents', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const incidents = await prisma.incident.findMany({
      where: { hospitalId },
      include: {
        department: true,
        reportedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ incidents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incidents.' });
  }
});

router.post('/incidents', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const { title, departmentId, type, priority, description, assignedTo } = req.body;

    if (!title || !departmentId || !description) {
      return res.status(400).json({ error: 'Title, department, and description are required.' });
    }

    const incident = await prisma.incident.create({
      data: {
        hospitalId,
        reportedById: req.user!.id,
        departmentId,
        title,
        type: type || 'OPERATIONAL',
        priority: priority || 'MEDIUM',
        description,
        status: 'OPEN',
        assignedTo,
      },
      include: { department: true },
    });

    res.status(201).json({ message: 'Incident ticket created.', incident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create incident.' });
  }
});

router.patch('/incidents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes, assignedTo } = req.body;

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        status,
        resolutionNotes: resolutionNotes || undefined,
        assignedTo: assignedTo || undefined,
      },
    });

    res.json({ message: 'Incident updated.', incident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update incident.' });
  }
});

// Protected Audit Logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const logs = await prisma.auditLog.findMany({
      where: { hospitalId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

// Hospital Settings & Configuration
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.user!.hospitalId },
    });
    res.json({ hospital });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings.' });
  }
});

router.put('/settings', async (req: Request, res: Response) => {
  try {
    const { name, tagline, address, city, phone, email, workingHours, queueThresholdMins } = req.body;

    const updated = await prisma.hospital.update({
      where: { id: req.user!.hospitalId },
      data: {
        name,
        tagline,
        address,
        city,
        phone,
        email,
        workingHours,
        queueThresholdMins: queueThresholdMins ? parseInt(queueThresholdMins, 10) : undefined,
      },
    });

    res.json({ message: 'Hospital settings updated.', hospital: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings.' });
  }
});

export default router;

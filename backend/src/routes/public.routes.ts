import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// Hospital Public Overview
router.get('/info', async (req: Request, res: Response) => {
  try {
    const hospital = await prisma.hospital.findFirst({
      where: { code: 'H001' },
      include: {
        departments: {
          where: { active: true },
          include: {
            staffProfiles: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital profile not found.' });
    }

    res.json({ hospital });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hospital information.' });
  }
});

// Search & List Doctors for Booking
router.get('/doctors', async (req: Request, res: Response) => {
  try {
    const { departmentId, search } = req.query;

    const doctors = await prisma.staffProfile.findMany({
      where: {
        user: { role: 'DOCTOR', active: true },
        departmentId: departmentId ? String(departmentId) : undefined,
        ...(search
          ? {
              OR: [
                { user: { name: { contains: String(search) } } },
                { specialty: { contains: String(search) } },
                { department: { name: { contains: String(search) } } },
              ],
            }
          : {}),
      },
      include: {
        user: true,
        department: true,
      },
      orderBy: { experienceYears: 'desc' },
    });

    const formatted = doctors.map((d) => ({
      id: d.id,
      name: d.user.name,
      email: d.user.email,
      departmentId: d.departmentId,
      departmentName: d.department?.name,
      specialty: d.specialty,
      qualification: d.qualification,
      experienceYears: d.experienceYears,
      roomNumber: d.roomNumber,
      availableDays: d.availableDays,
      scheduleHours: d.scheduleHours,
      consultationFee: d.consultationFee,
    }));

    res.json({ doctors: formatted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors list.' });
  }
});

// Departments list
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      where: { active: true },
      include: {
        _count: { select: { staffProfiles: true } },
      },
    });

    res.json({ departments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
});

export default router;

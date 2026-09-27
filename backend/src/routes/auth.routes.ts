import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { config } from '../config';
import { authenticate } from '../middleware/auth.middleware';
import { logAuditEvent } from '../middleware/audit.middleware';

const router = Router();

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        hospital: true,
        patient: true,
        staffProfile: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'This account has been deactivated.' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, hospitalId: user.hospitalId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    await logAuditEvent({
      hospitalId: user.hospitalId,
      userId: user.id,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id,
      details: `Successful login for ${user.email} (${user.role})`,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        hospitalId: user.hospitalId,
        hospitalName: user.hospital.name,
        patientId: user.patient?.patientId,
        patientDbId: user.patient?.id,
        staffProfile: user.staffProfile,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to authenticate user.' });
  }
});

// Register new Patient
router.post('/register-patient', async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      allergies,
      chronicConditions,
      hospitalCode = 'H001',
    } = req.body;

    if (!firstName || !lastName || !phone || !password || !email) {
      return res.status(400).json({ error: 'First name, last name, email, phone, and password are required.' });
    }

    const hospital = await prisma.hospital.findFirst({
      where: { code: hospitalCode },
    });

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Generate unique sequential / formatted Patient ID
    const count = await prisma.patient.count({ where: { hospitalId: hospital.id } });
    const patientIdNumber = 100245 + count;
    const generatedPatientId = `P-${patientIdNumber}`;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        hospitalId: hospital.id,
        email: email.toLowerCase(),
        passwordHash,
        name: `${firstName} ${lastName}`,
        role: 'PATIENT',
        phone,
      },
    });

    const patient = await prisma.patient.create({
      data: {
        hospitalId: hospital.id,
        userId: user.id,
        patientId: generatedPatientId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || '1990-01-01',
        gender: gender || 'Unspecified',
        phone,
        email: email.toLowerCase(),
        bloodGroup,
        address,
        emergencyContact,
        allergies,
        chronicConditions,
      },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, hospitalId: user.hospitalId },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    await logAuditEvent({
      hospitalId: hospital.id,
      userId: user.id,
      userRole: 'PATIENT',
      action: 'REGISTER',
      entity: 'PATIENT',
      entityId: patient.id,
      details: `New patient registered: ${patient.firstName} ${patient.lastName} (ID: ${patient.patientId})`,
    });

    res.status(201).json({
      token,
      patientId: patient.patientId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        patientId: patient.patientId,
        patientDbId: patient.id,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register patient.' });
  }
});

// Current user profile
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        hospital: true,
        patient: true,
        staffProfile: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        hospitalId: user.hospitalId,
        hospitalName: user.hospital.name,
        patientId: user.patient?.patientId,
        patientDbId: user.patient?.id,
        staffProfile: user.staffProfile,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch current user profile.' });
  }
});

// Demo accounts endpoint for easy one-click previewing of all roles
router.get('/demo-accounts', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { active: true },
      include: {
        staffProfile: {
          include: { department: true },
        },
        patient: true,
      },
      take: 20,
    });

    const accounts = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.staffProfile?.department?.name || (u.role === 'PATIENT' ? 'Patient' : 'General'),
      specialty: u.staffProfile?.specialty,
      patientId: u.patient?.patientId,
    }));

    res.json({ accounts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demo accounts.' });
  }
});

export default router;

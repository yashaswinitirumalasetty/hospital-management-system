import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../utils/prisma';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  hospitalId: string;
  patientId?: string;
  staffProfileId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        patient: true,
        staffProfile: true,
      },
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or account deactivated.' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hospitalId: user.hospitalId,
      patientId: user.patient?.id,
      staffProfileId: user.staffProfile?.id,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
};

export const requireRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: [${roles.join(', ')}]. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

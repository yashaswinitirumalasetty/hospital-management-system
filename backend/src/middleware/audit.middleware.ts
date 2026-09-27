import prisma from '../utils/prisma';

export const logAuditEvent = async ({
  hospitalId,
  userId,
  userRole,
  action,
  entity,
  entityId,
  details,
  ipAddress = '127.0.0.1',
}: {
  hospitalId: string;
  userId?: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        hospitalId,
        userId,
        userRole,
        action,
        entity,
        entityId,
        details,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

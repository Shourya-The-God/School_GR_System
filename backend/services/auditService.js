import prisma from '../db.js';
import { logger } from '../utils/logger.js';

export const recordAuditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
  ipAddress = null,
  userAgent = null
}) => {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent
      }
    });
    return log;
  } catch (error) {
    logger.error('Failed to write audit log:', { error: error.message, action, entityType, entityId });
    // Audit log failure should not crash primary transaction, but is reported
    return null;
  }
};

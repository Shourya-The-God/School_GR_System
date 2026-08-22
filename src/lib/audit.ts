import { prisma } from './prisma';
import { UserSession } from './auth';

export interface AuditLogParams {
  user?: UserSession | null;
  actionType:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE_ATTEMPT'
    | 'STATUS_CHANGE'
    | 'TRANSFER'
    | 'IMPORT_BATCH'
    | 'OCR_APPROVE'
    | 'OCR_REJECT'
    | 'EXPORT'
    | 'LOGIN'
    | 'LOGOUT';
  entityType: 'STUDENT' | 'ADMISSION' | 'TRANSFER' | 'DOCUMENT' | 'IMPORT_BATCH' | 'USER' | 'REPORT' | 'AUTH';
  entityId?: string;
  entityIdentifier?: string;
  details: string;
  previousValue?: any;
  newValue?: any;
  studentId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: AuditLogParams) {
  try {
    const prevJson = params.previousValue ? JSON.stringify(params.previousValue) : null;
    const newJson = params.newValue ? JSON.stringify(params.newValue) : null;

    return await prisma.auditLog.create({
      data: {
        userId: params.user?.userId || null,
        userName: params.user?.name || 'System / Anonymous',
        userRole: params.user?.role || 'SYSTEM',
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId || null,
        entityIdentifier: params.entityIdentifier || null,
        details: params.details,
        previousValueJson: prevJson,
        newValueJson: newJson,
        studentId: params.studentId || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
    return null;
  }
}

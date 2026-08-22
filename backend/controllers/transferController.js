import prisma from '../db.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { recordAuditLog } from '../services/auditService.js';
import { validateRequired } from '../utils/validator.js';

export const getTransfers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search.trim()) {
      where.OR = [
        { tcNumber: { contains: search.trim() } },
        { student: { fullName: { contains: search.trim() } } },
        { student: { grNumber: { contains: search.trim() } } }
      ];
    }

    const [total, transfers] = await Promise.all([
      prisma.transfer.count({ where }),
      prisma.transfer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              currentClass: true,
              currentDivision: true
            }
          }
        }
      })
    ]);

    return sendPaginated(res, transfers, total, pageNum, limitNum, 'Transfer records retrieved');
  } catch (error) {
    next(error);
  }
};

export const issueTransferCertificate = async (req, res, next) => {
  try {
    const {
      studentId,
      tcNumber,
      reasonForLeaving,
      leavingDate,
      destinationSchool,
      progressReport,
      conduct,
      remarks
    } = req.body;

    const missing = validateRequired(req.body, ['studentId', 'tcNumber', 'reasonForLeaving', 'leavingDate']);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return sendError(res, 'Student not found.', 404);
    }

    // Check unique TC Number
    const existingTc = await prisma.transfer.findUnique({
      where: { tcNumber: tcNumber.trim() }
    });
    if (existingTc) {
      return sendError(res, `TC Number "${tcNumber}" has already been issued.`, 409);
    }

    // Transaction: Create Transfer record and update student status to TRANSFERRED
    const [transfer, updatedStudent] = await prisma.$transaction([
      prisma.transfer.create({
        data: {
          studentId,
          tcNumber: tcNumber.trim(),
          reasonForLeaving: reasonForLeaving.trim(),
          leavingDate: new Date(leavingDate),
          issueDate: new Date(),
          destinationSchool: destinationSchool ? destinationSchool.trim() : null,
          progressReport: progressReport ? progressReport.trim() : 'Satisfactory',
          conduct: conduct ? conduct.trim() : 'Good',
          status: 'ISSUED',
          remarks: remarks ? remarks.trim() : null
        },
        include: { student: true }
      }),
      prisma.student.update({
        where: { id: studentId },
        data: { status: 'TRANSFERRED' }
      })
    ]);

    await recordAuditLog({
      userId: req.user?.id,
      action: 'ISSUE_TRANSFER_CERTIFICATE',
      entityType: 'Transfer',
      entityId: transfer.id,
      newValue: transfer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, transfer, 'Transfer Certificate issued successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getTransferById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            currentClass: true,
            currentDivision: true,
            admissions: true
          }
        }
      }
    });

    if (!transfer) {
      return sendError(res, 'Transfer record not found.', 404);
    }

    return sendSuccess(res, transfer, 'Transfer details retrieved');
  } catch (error) {
    next(error);
  }
};

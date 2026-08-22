import prisma from '../db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { recordAuditLog } from '../services/auditService.js';
import { validateRequired } from '../utils/validator.js';

export const createAdmission = async (req, res, next) => {
  try {
    const { studentId, admissionDate, admittedClass, previousSchool, lastAttendedStd, remarks } = req.body;

    const missing = validateRequired(req.body, ['studentId', 'admissionDate', 'admittedClass']);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const admission = await prisma.admission.create({
      data: {
        studentId,
        admissionDate: new Date(admissionDate),
        admittedClass,
        previousSchool: previousSchool || null,
        lastAttendedStd: lastAttendedStd || null,
        remarks: remarks || null
      }
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'ADD_ADMISSION_RECORD',
      entityType: 'Admission',
      entityId: admission.id,
      newValue: admission,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, admission, 'Admission record added successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const addAcademicHistory = async (req, res, next) => {
  try {
    const { studentId, academicYear, classId, divisionId, result, percentage, conduct, attendance } = req.body;

    const missing = validateRequired(req.body, ['studentId', 'academicYear', 'classId']);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    const record = await prisma.studentAcademicHistory.create({
      data: {
        studentId,
        academicYear,
        classId,
        divisionId: divisionId || null,
        result: result || null,
        percentage: percentage ? parseFloat(percentage) : null,
        conduct: conduct || null,
        attendance: attendance ? parseFloat(attendance) : null
      },
      include: {
        class: true,
        division: true
      }
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'ADD_ACADEMIC_HISTORY',
      entityType: 'StudentAcademicHistory',
      entityId: record.id,
      newValue: record,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, record, 'Academic history record added successfully', 201);
  } catch (error) {
    next(error);
  }
};

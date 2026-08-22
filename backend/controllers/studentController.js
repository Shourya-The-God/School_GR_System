import prisma from '../db.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { recordAuditLog } from '../services/auditService.js';
import { validateRequired } from '../utils/validator.js';

export const getStudents = async (req, res, next) => {
  try {
    const {
      search = '',
      classId,
      divisionId,
      status,
      gender,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Search filter across GR No, Admission No, and Full Name
    if (search.trim()) {
      const s = search.trim();
      where.OR = [
        { grNumber: { contains: s } },
        { admissionNumber: { contains: s } },
        { fullName: { contains: s } },
        { aadharNumber: { contains: s } }
      ];
    }

    if (classId) where.currentClassId = classId;
    if (divisionId) where.currentDivisionId = divisionId;
    if (status) where.status = status;
    if (gender) where.gender = gender;

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' },
        include: {
          currentClass: true,
          currentDivision: true
        }
      })
    ]);

    return sendPaginated(res, students, total, pageNum, limitNum, 'Students retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        currentClass: true,
        currentDivision: true,
        admissions: { orderBy: { admissionDate: 'desc' } },
        academicHistory: {
          include: { class: true, division: true },
          orderBy: { createdAt: 'desc' }
        },
        transfers: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!student) {
      return sendError(res, 'Student not found.', 404);
    }

    return sendSuccess(res, student, 'Student details retrieved');
  } catch (error) {
    next(error);
  }
};

export const createStudent = async (req, res, next) => {
  try {
    const {
      grNumber,
      admissionNumber,
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      birthPlace,
      religion,
      caste,
      subCaste,
      nationality = 'Indian',
      motherTongue,
      aadharNumber,
      fatherName,
      motherName,
      guardianName,
      parentContact,
      emergencyContact,
      residentialAddress,
      currentClassId,
      currentDivisionId,
      rollNumber,
      status = 'ACTIVE',
      // Optional initial admission info
      admittedClass,
      admissionDate,
      previousSchool
    } = req.body;

    const missing = validateRequired(req.body, ['grNumber', 'firstName', 'lastName', 'gender', 'dateOfBirth']);
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }

    // Check unique GR Number
    const existing = await prisma.student.findUnique({
      where: { grNumber: grNumber.trim() }
    });
    if (existing) {
      return sendError(res, `A student with GR Number "${grNumber}" already exists.`, 409);
    }

    const fullName = [firstName.trim(), middleName?.trim(), lastName.trim()].filter(Boolean).join(' ');

    const newStudent = await prisma.student.create({
      data: {
        grNumber: grNumber.trim(),
        admissionNumber: admissionNumber ? admissionNumber.trim() : null,
        firstName: firstName.trim(),
        middleName: middleName ? middleName.trim() : null,
        lastName: lastName.trim(),
        fullName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        birthPlace: birthPlace ? birthPlace.trim() : null,
        religion: religion ? religion.trim() : null,
        caste: caste ? caste.trim() : null,
        subCaste: subCaste ? subCaste.trim() : null,
        nationality,
        motherTongue: motherTongue ? motherTongue.trim() : null,
        aadharNumber: aadharNumber ? aadharNumber.trim() : null,
        fatherName: fatherName ? fatherName.trim() : null,
        motherName: motherName ? motherName.trim() : null,
        guardianName: guardianName ? guardianName.trim() : null,
        parentContact: parentContact ? parentContact.trim() : null,
        emergencyContact: emergencyContact ? emergencyContact.trim() : null,
        residentialAddress: residentialAddress ? residentialAddress.trim() : null,
        currentClassId: currentClassId || null,
        currentDivisionId: currentDivisionId || null,
        rollNumber: rollNumber ? parseInt(rollNumber, 10) : null,
        status,
        admissions: admissionDate ? {
          create: {
            admissionDate: new Date(admissionDate),
            admittedClass: admittedClass || '1st',
            previousSchool: previousSchool ? previousSchool.trim() : null
          }
        } : undefined
      },
      include: {
        currentClass: true,
        currentDivision: true
      }
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'CREATE_STUDENT',
      entityType: 'Student',
      entityId: newStudent.id,
      newValue: newStudent,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, newStudent, 'Student record created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingStudent = await prisma.student.findUnique({ where: { id } });
    if (!existingStudent) {
      return sendError(res, 'Student not found.', 404);
    }

    const {
      grNumber,
      admissionNumber,
      firstName,
      middleName,
      lastName,
      gender,
      dateOfBirth,
      birthPlace,
      religion,
      caste,
      subCaste,
      nationality,
      motherTongue,
      aadharNumber,
      fatherName,
      motherName,
      guardianName,
      parentContact,
      emergencyContact,
      residentialAddress,
      currentClassId,
      currentDivisionId,
      rollNumber,
      status
    } = req.body;

    const fName = firstName !== undefined ? firstName.trim() : existingStudent.firstName;
    const mName = middleName !== undefined ? (middleName ? middleName.trim() : null) : existingStudent.middleName;
    const lName = lastName !== undefined ? lastName.trim() : existingStudent.lastName;
    const fullName = [fName, mName, lName].filter(Boolean).join(' ');

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        grNumber: grNumber !== undefined ? grNumber.trim() : existingStudent.grNumber,
        admissionNumber: admissionNumber !== undefined ? (admissionNumber ? admissionNumber.trim() : null) : existingStudent.admissionNumber,
        firstName: fName,
        middleName: mName,
        lastName: lName,
        fullName,
        gender: gender || existingStudent.gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingStudent.dateOfBirth,
        birthPlace: birthPlace !== undefined ? birthPlace : existingStudent.birthPlace,
        religion: religion !== undefined ? religion : existingStudent.religion,
        caste: caste !== undefined ? caste : existingStudent.caste,
        subCaste: subCaste !== undefined ? subCaste : existingStudent.subCaste,
        nationality: nationality !== undefined ? nationality : existingStudent.nationality,
        motherTongue: motherTongue !== undefined ? motherTongue : existingStudent.motherTongue,
        aadharNumber: aadharNumber !== undefined ? aadharNumber : existingStudent.aadharNumber,
        fatherName: fatherName !== undefined ? fatherName : existingStudent.fatherName,
        motherName: motherName !== undefined ? motherName : existingStudent.motherName,
        guardianName: guardianName !== undefined ? guardianName : existingStudent.guardianName,
        parentContact: parentContact !== undefined ? parentContact : existingStudent.parentContact,
        emergencyContact: emergencyContact !== undefined ? emergencyContact : existingStudent.emergencyContact,
        residentialAddress: residentialAddress !== undefined ? residentialAddress : existingStudent.residentialAddress,
        currentClassId: currentClassId !== undefined ? (currentClassId || null) : existingStudent.currentClassId,
        currentDivisionId: currentDivisionId !== undefined ? (currentDivisionId || null) : existingStudent.currentDivisionId,
        rollNumber: rollNumber !== undefined ? (rollNumber ? parseInt(rollNumber, 10) : null) : existingStudent.rollNumber,
        status: status || existingStudent.status
      },
      include: {
        currentClass: true,
        currentDivision: true
      }
    });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'UPDATE_STUDENT_GR',
      entityType: 'Student',
      entityId: id,
      oldValue: existingStudent,
      newValue: updatedStudent,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, updatedStudent, 'Student record updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return sendError(res, 'Student not found.', 404);
    }

    await prisma.student.delete({ where: { id } });

    await recordAuditLog({
      userId: req.user?.id,
      action: 'DELETE_STUDENT',
      entityType: 'Student',
      entityId: id,
      oldValue: student,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    return sendSuccess(res, null, 'Student record deleted successfully');
  } catch (error) {
    next(error);
  }
};

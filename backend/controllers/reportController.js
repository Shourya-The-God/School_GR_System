import prisma from '../db.js';
import { sendSuccess } from '../utils/response.js';
import { generateStudentsCSV } from '../services/exportService.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      activeStudents,
      transferredStudents,
      pendingOcrCount,
      totalImports,
      recentStudents,
      classesWithCount,
      genderStats,
      casteStats
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count({ where: { status: 'TRANSFERRED' } }),
      prisma.oCRRecord.count({ where: { verificationStatus: 'PENDING_REVIEW' } }),
      prisma.oCRImport.count(),
      prisma.student.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { currentClass: true, currentDivision: true }
      }),
      prisma.class.findMany({
        include: {
          _count: {
            select: { students: { where: { status: 'ACTIVE' } } }
          }
        },
        orderBy: { numericRank: 'asc' }
      }),
      prisma.student.groupBy({
        by: ['gender'],
        _count: { id: true },
        where: { status: 'ACTIVE' }
      }),
      prisma.student.groupBy({
        by: ['caste'],
        _count: { id: true },
        where: { status: 'ACTIVE' }
      })
    ]);

    return sendSuccess(res, {
      kpi: {
        totalStudents,
        activeStudents,
        transferredStudents,
        pendingOcrCount,
        totalImports
      },
      recentStudents,
      classEnrollment: classesWithCount.map(c => ({
        id: c.id,
        name: c.name,
        count: c._count.students
      })),
      genderDistribution: genderStats.map(g => ({
        gender: g.gender,
        count: g._count.id
      })),
      casteDistribution: casteStats
        .filter(c => c.caste)
        .map(c => ({ caste: c.caste, count: c._count.id }))
    }, 'Dashboard stats retrieved');
  } catch (error) {
    next(error);
  }
};

export const exportStudentsCSV = async (req, res, next) => {
  try {
    const { classId, divisionId, status } = req.query;

    const where = {};
    if (classId) where.currentClassId = classId;
    if (divisionId) where.currentDivisionId = divisionId;
    if (status) where.status = status;

    const students = await prisma.student.findMany({
      where,
      include: {
        currentClass: true,
        currentDivision: true
      },
      orderBy: { grNumber: 'asc' }
    });

    const csvContent = generateStudentsCSV(students);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Students-GR-Export-${new Date().toISOString().split('T')[0]}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const getMetadata = async (req, res, next) => {
  try {
    const [classes, divisions, roles] = await Promise.all([
      prisma.class.findMany({
        orderBy: { numericRank: 'asc' },
        include: { divisions: true }
      }),
      prisma.division.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.role.findMany()
    ]);

    return sendSuccess(res, { classes, divisions, roles }, 'System metadata');
  } catch (error) {
    next(error);
  }
};

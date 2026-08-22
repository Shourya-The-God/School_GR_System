import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      totalStudents,
      activeStudents,
      transferredStudents,
      withdrawnStudents,
      graduatedStudents,
      pendingBatches,
      recentAdmissions,
      recentTransfers,
      recentAuditLogs,
      casteBreakdown,
      classBreakdown,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.student.count({ where: { status: 'TRANSFERRED' } }),
      prisma.student.count({ where: { status: 'WITHDRAWN' } }),
      prisma.student.count({ where: { status: 'GRADUATED' } }),
      prisma.importBatch.count({
        where: {
          status: { in: ['PENDING_REVIEW', 'PARTIALLY_APPROVED'] },
        },
      }),
      prisma.student.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: { admission: true, parent: true },
      }),
      prisma.transferRecord.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { grNumber: true, fullName: true, currentClass: true, currentDivision: true },
          },
        },
      }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.groupBy({
        by: ['casteCategory'],
        _count: { _all: true },
      }),
      prisma.student.groupBy({
        by: ['currentClass'],
        _count: { _all: true },
      }),
    ]);

    // Count pending OCR staged records across all batches
    const pendingOcrRecordsCount = await prisma.ocrStagedRecord.count({
      where: { status: 'PENDING' },
    });

    return NextResponse.json({
      metrics: {
        totalStudents,
        activeStudents,
        transferredStudents,
        withdrawnStudents,
        graduatedStudents,
        pendingBatches,
        pendingOcrRecordsCount,
      },
      recentAdmissions,
      recentTransfers,
      recentAuditLogs,
      casteBreakdown,
      classBreakdown,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}

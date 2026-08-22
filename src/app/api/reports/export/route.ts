import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canExportData')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to export student data' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv'; // csv or json
    const status = searchParams.get('status') || '';
    const standard = searchParams.get('standard') || '';

    const where: any = {};
    if (status) where.status = status;
    if (standard) where.currentClass = standard;

    const students = await prisma.student.findMany({
      where,
      include: {
        parent: true,
        admission: true,
        transfer: true,
      },
      orderBy: { grNumber: 'asc' },
    });

    // Audit log this export for data protection compliance
    await logAuditEvent({
      user,
      actionType: 'EXPORT',
      entityType: 'REPORT',
      entityIdentifier: `Export Format: ${format.toUpperCase()} (${students.length} records)`,
      details: `User ${user.name} exported ${students.length} General Register student records in ${format.toUpperCase()} format.`,
    });

    if (format === 'csv') {
      const headers = [
        'GR Number',
        'Admission No',
        'Full Legal Name',
        'Gender',
        'Date of Birth',
        'DOB in Words',
        'Class',
        'Division',
        'Status',
        'Father Name',
        'Mother Name',
        'Contact Phone',
        'Religion',
        'Caste Category',
        'Sub-caste',
        'Admission Date',
        'Previous School',
        'Leaving Date',
        'Reason for Leaving',
        'TC Number',
      ];

      const csvRows = students.map((s) => [
        `"${s.grNumber}"`,
        `"${s.admissionNumber || ''}"`,
        `"${s.fullName}"`,
        `"${s.gender}"`,
        `"${s.dob.toISOString().slice(0, 10)}"`,
        `"${s.dobInWords || ''}"`,
        `"${s.currentClass}"`,
        `"${s.currentDivision}"`,
        `"${s.status}"`,
        `"${s.parent?.fatherName || ''}"`,
        `"${s.parent?.motherName || ''}"`,
        `"${s.parent?.fatherPhone || s.parent?.motherPhone || ''}"`,
        `"${s.religion || ''}"`,
        `"${s.casteCategory || ''}"`,
        `"${s.subCaste || ''}"`,
        `"${s.admission?.admissionDate ? s.admission.admissionDate.toISOString().slice(0, 10) : ''}"`,
        `"${s.admission?.previousSchoolName || ''}"`,
        `"${s.transfer?.leavingDate ? s.transfer.leavingDate.toISOString().slice(0, 10) : ''}"`,
        `"${s.transfer?.reasonForLeaving || ''}"`,
        `"${s.transfer?.tcNumber || ''}"`,
      ]);

      const csvContent = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\r\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="General_Register_Export_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Error during data export:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

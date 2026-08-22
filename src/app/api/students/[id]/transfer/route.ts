import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canTransferStudents')) {
      return NextResponse.json(
        { error: 'Forbidden: Only School Administrators and Super Admins can issue Transfer Certificates' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      leavingDate,
      leavingClass,
      reasonForLeaving,
      conductRemark = 'Good',
      progressRemark = 'Satisfactory',
      tcNumber,
      destinationSchool,
      feesPaidUpToDate = true,
      duesRemarks,
      notes,
      newStatus = 'TRANSFERRED', // TRANSFERRED, WITHDRAWN, GRADUATED
    } = body;

    if (!leavingDate) {
      return NextResponse.json({ error: 'Date of leaving is required' }, { status: 400 });
    }
    if (!leavingClass?.trim()) {
      return NextResponse.json({ error: 'Leaving class / standard is required' }, { status: 400 });
    }
    if (!reasonForLeaving?.trim()) {
      return NextResponse.json({ error: 'Reason for leaving is required' }, { status: 400 });
    }
    if (!tcNumber?.trim()) {
      return NextResponse.json({ error: 'Transfer Certificate (TC) Number is required' }, { status: 400 });
    }

    // Check student existence
    const student = await prisma.student.findUnique({
      where: { id },
      include: { transfer: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    if (student.status === 'TRANSFERRED' && student.transfer) {
      return NextResponse.json(
        {
          error: `Student ${student.fullName} has already been transferred under TC No: ${student.transfer.tcNumber} on ${student.transfer.leavingDate.toISOString().slice(0, 10)}.`,
        },
        { status: 400 }
      );
    }

    // Check TC number uniqueness
    const existingTc = await prisma.transferRecord.findUnique({
      where: { tcNumber: tcNumber.trim() },
      include: { student: { select: { fullName: true, grNumber: true } } },
    });

    if (existingTc && existingTc.studentId !== id) {
      return NextResponse.json(
        {
          error: `Transfer Certificate number "${tcNumber.trim()}" was already issued to student "${existingTc.student.fullName}" (GR: ${existingTc.student.grNumber}). TC numbers must be strictly unique.`,
        },
        { status: 409 }
      );
    }

    const leaveDate = new Date(leavingDate);

    // Transaction: Create/Update TransferRecord, update Student status and isArchived
    const [updatedStudent, transferRecord] = await prisma.$transaction([
      prisma.student.update({
        where: { id },
        data: {
          status: newStatus,
          isArchived: true,
        },
      }),
      prisma.transferRecord.upsert({
        where: { studentId: id },
        create: {
          studentId: id,
          leavingDate: leaveDate,
          leavingClass: leavingClass.trim(),
          reasonForLeaving: reasonForLeaving.trim(),
          conductRemark: conductRemark.trim(),
          progressRemark: progressRemark.trim(),
          tcNumber: tcNumber.trim(),
          tcIssueDate: new Date(),
          destinationSchool: destinationSchool?.trim() || null,
          feesPaidUpToDate: Boolean(feesPaidUpToDate),
          duesRemarks: duesRemarks?.trim() || null,
          notes: notes?.trim() || null,
          approvedByUserId: user.userId,
          approvedByName: user.name,
        },
        update: {
          leavingDate: leaveDate,
          leavingClass: leavingClass.trim(),
          reasonForLeaving: reasonForLeaving.trim(),
          conductRemark: conductRemark.trim(),
          progressRemark: progressRemark.trim(),
          tcNumber: tcNumber.trim(),
          tcIssueDate: new Date(),
          destinationSchool: destinationSchool?.trim() || null,
          feesPaidUpToDate: Boolean(feesPaidUpToDate),
          duesRemarks: duesRemarks?.trim() || null,
          notes: notes?.trim() || null,
          approvedByUserId: user.userId,
          approvedByName: user.name,
        },
      }),
    ]);

    // Audit Log
    await logAuditEvent({
      user,
      actionType: 'TRANSFER',
      entityType: 'TRANSFER',
      entityId: transferRecord.id,
      entityIdentifier: `${student.grNumber}: ${student.fullName} (TC: ${transferRecord.tcNumber})`,
      details: `Administrator ${user.name} marked student ${student.fullName} (GR: ${student.grNumber}) as ${newStatus}. Issued Transfer Certificate No: ${transferRecord.tcNumber}. Reason: ${transferRecord.reasonForLeaving}`,
      previousValue: { status: student.status, isArchived: student.isArchived },
      newValue: {
        status: updatedStudent.status,
        isArchived: updatedStudent.isArchived,
        tcNumber: transferRecord.tcNumber,
        leavingDate: transferRecord.leavingDate,
      },
      studentId: student.id,
    });

    return NextResponse.json({
      success: true,
      student: updatedStudent,
      transfer: transferRecord,
    });
  } catch (error: any) {
    console.error('Transfer workflow error:', error);
    return NextResponse.json({ error: error.message || 'Failed to execute transfer' }, { status: 500 });
  }
}

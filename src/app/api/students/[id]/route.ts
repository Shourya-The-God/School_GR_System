import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { convertDateToWords } from '@/lib/number-to-words';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        parent: true,
        admission: true,
        transfer: {
          include: {
            approvedBy: {
              select: { name: true, role: true, designation: true },
            },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        stagedRecords: {
          include: {
            importBatch: {
              select: { batchName: true, originalFileName: true, createdAt: true },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    console.error('Error getting student profile:', error);
    return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canEditStudents')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to edit student records' }, { status: 403 });
    }

    const body = await req.json();
    const existing = await prisma.student.findUnique({
      where: { id },
      include: { parent: true, admission: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Check if GR number changed and if new GR number collides
    if (body.grNumber && body.grNumber.trim() !== existing.grNumber) {
      const duplicate = await prisma.student.findUnique({
        where: { grNumber: body.grNumber.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { error: `GR Number "${body.grNumber.trim()}" is already assigned to "${duplicate.fullName}".` },
          { status: 409 }
        );
      }
    }

    const dob = body.dob ? new Date(body.dob) : existing.dob;
    const dobWords = body.dob ? convertDateToWords(dob) : existing.dobInWords;
    const firstName = body.firstName !== undefined ? body.firstName.trim() : existing.firstName;
    const middleName = body.middleName !== undefined ? body.middleName?.trim() : existing.middleName;
    const lastName = body.lastName !== undefined ? body.lastName.trim() : existing.lastName;
    const fullName = `${lastName} ${firstName} ${middleName || ''}`.replace(/\s+/g, ' ').trim();

    const updated = await prisma.student.update({
      where: { id },
      data: {
        grNumber: body.grNumber ? body.grNumber.trim() : existing.grNumber,
        admissionNumber: body.admissionNumber !== undefined ? body.admissionNumber?.trim() : existing.admissionNumber,
        firstName,
        middleName,
        lastName,
        fullName,
        dob,
        dobInWords: dobWords,
        gender: body.gender || existing.gender,
        bloodGroup: body.bloodGroup !== undefined ? body.bloodGroup : existing.bloodGroup,
        aadharNumber: body.aadharNumber !== undefined ? body.aadharNumber : existing.aadharNumber,
        nationality: body.nationality || existing.nationality,
        religion: body.religion || existing.religion,
        casteCategory: body.casteCategory || existing.casteCategory,
        subCaste: body.subCaste !== undefined ? body.subCaste : existing.subCaste,
        motherTongue: body.motherTongue || existing.motherTongue,
        placeOfBirth: body.placeOfBirth !== undefined ? body.placeOfBirth : existing.placeOfBirth,
        taluka: body.taluka !== undefined ? body.taluka : existing.taluka,
        district: body.district !== undefined ? body.district : existing.district,
        state: body.state || existing.state,
        currentClass: body.currentClass || existing.currentClass,
        currentDivision: body.currentDivision || existing.currentDivision,
        rollNumber: body.rollNumber !== undefined ? (body.rollNumber ? parseInt(body.rollNumber, 10) : null) : existing.rollNumber,
        academicYear: body.academicYear || existing.academicYear,
        parent: {
          upsert: {
            create: {
              fatherName: body.fatherName || null,
              fatherOccupation: body.fatherOccupation || null,
              fatherPhone: body.fatherPhone || null,
              fatherEmail: body.fatherEmail || null,
              fatherIncome: body.fatherIncome || null,
              motherName: body.motherName || null,
              motherOccupation: body.motherOccupation || null,
              motherPhone: body.motherPhone || null,
              addressLine1: body.addressLine1 || null,
              city: body.city || null,
              pincode: body.pincode || null,
            },
            update: {
              fatherName: body.fatherName !== undefined ? body.fatherName : existing.parent?.fatherName,
              fatherOccupation: body.fatherOccupation !== undefined ? body.fatherOccupation : existing.parent?.fatherOccupation,
              fatherPhone: body.fatherPhone !== undefined ? body.fatherPhone : existing.parent?.fatherPhone,
              fatherEmail: body.fatherEmail !== undefined ? body.fatherEmail : existing.parent?.fatherEmail,
              fatherIncome: body.fatherIncome !== undefined ? body.fatherIncome : existing.parent?.fatherIncome,
              motherName: body.motherName !== undefined ? body.motherName : existing.parent?.motherName,
              motherOccupation: body.motherOccupation !== undefined ? body.motherOccupation : existing.parent?.motherOccupation,
              motherPhone: body.motherPhone !== undefined ? body.motherPhone : existing.parent?.motherPhone,
              addressLine1: body.addressLine1 !== undefined ? body.addressLine1 : existing.parent?.addressLine1,
              city: body.city !== undefined ? body.city : existing.parent?.city,
              pincode: body.pincode !== undefined ? body.pincode : existing.parent?.pincode,
            },
          },
        },
        admission: {
          upsert: {
            create: {
              admissionDate: body.admissionDate ? new Date(body.admissionDate) : new Date(),
              admittedClass: body.admittedClass || body.currentClass || 'I',
              admittedDivision: body.admittedDivision || 'A',
              previousSchoolName: body.previousSchoolName || null,
              previousSchoolBoard: body.previousSchoolBoard || null,
              previousClassPassed: body.previousClassPassed || null,
              previousTcNumber: body.previousTcNumber || null,
              previousTcDate: body.previousTcDate ? new Date(body.previousTcDate) : null,
            },
            update: {
              admissionDate: body.admissionDate ? new Date(body.admissionDate) : existing.admission?.admissionDate,
              admittedClass: body.admittedClass || existing.admission?.admittedClass,
              admittedDivision: body.admittedDivision || existing.admission?.admittedDivision,
              previousSchoolName: body.previousSchoolName !== undefined ? body.previousSchoolName : existing.admission?.previousSchoolName,
              previousSchoolBoard: body.previousSchoolBoard !== undefined ? body.previousSchoolBoard : existing.admission?.previousSchoolBoard,
              previousClassPassed: body.previousClassPassed !== undefined ? body.previousClassPassed : existing.admission?.previousClassPassed,
              previousTcNumber: body.previousTcNumber !== undefined ? body.previousTcNumber : existing.admission?.previousTcNumber,
              previousTcDate: body.previousTcDate ? new Date(body.previousTcDate) : existing.admission?.previousTcDate,
            },
          },
        },
      },
      include: { parent: true, admission: true },
    });

    // Record Audit Log with Diff
    await logAuditEvent({
      user,
      actionType: 'UPDATE',
      entityType: 'STUDENT',
      entityId: updated.id,
      entityIdentifier: `${updated.grNumber}: ${updated.fullName}`,
      details: `User ${user.name} modified General Register details for ${updated.fullName} (GR: ${updated.grNumber})`,
      previousValue: {
        grNumber: existing.grNumber,
        fullName: existing.fullName,
        dob: existing.dob,
        currentClass: existing.currentClass,
        currentDivision: existing.currentDivision,
        status: existing.status,
      },
      newValue: {
        grNumber: updated.grNumber,
        fullName: updated.fullName,
        dob: updated.dob,
        currentClass: updated.currentClass,
        currentDivision: updated.currentDivision,
        status: updated.status,
      },
      studentId: updated.id,
    });

    return NextResponse.json({ success: true, student: updated });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: error.message || 'Failed to update student' }, { status: 500 });
  }
}

// Statutory Zero-Deletion Enforcement
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser(req);

    // Audit log deletion attempt
    await logAuditEvent({
      user,
      actionType: 'DELETE_ATTEMPT',
      entityType: 'STUDENT',
      entityId: id,
      details: `Attempted hard deletion of student ID ${id} was BLOCKED in compliance with statutory General Register preservation laws.`,
    });

    return NextResponse.json(
      {
        error:
          'STATUTORY PRESERVATION VIOLATION: Student records in the General Register are permanent legal archives and cannot be hard deleted. When a student departs the school, use the Transfer / Withdrawal workflow to archive their active enrollment while retaining their historical register entry.',
        code: 'PERMANENT_ARCHIVE_PROTECTION',
      },
      { status: 403 }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Deletion prevented' }, { status: 403 });
  }
}

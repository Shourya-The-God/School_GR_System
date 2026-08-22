import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { convertDateToWords } from '@/lib/number-to-words';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ stagedId: string }> }
) {
  try {
    const { stagedId } = await params;
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canVerifyOCR')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to verify OCR records' }, { status: 403 });
    }

    const body = await req.json();
    const { action, correctedData, reviewNotes } = body; // action: 'APPROVE' | 'REJECT' | 'UPDATE'

    const staged = await prisma.ocrStagedRecord.findUnique({
      where: { id: stagedId },
      include: {
        importBatch: {
          include: { documents: true },
        },
      },
    });

    if (!staged) {
      return NextResponse.json({ error: 'Staged OCR record not found' }, { status: 404 });
    }

    if (action === 'REJECT') {
      const updatedStaged = await prisma.ocrStagedRecord.update({
        where: { id: stagedId },
        data: {
          status: 'REJECTED',
          reviewedByUserId: user.userId,
          reviewedByName: user.name,
          reviewNotes: reviewNotes || 'Rejected during administrator verification.',
        },
      });

      // Update batch counts
      await updateBatchCounts(staged.importBatchId);

      await logAuditEvent({
        user,
        actionType: 'OCR_REJECT',
        entityType: 'IMPORT_BATCH',
        entityId: staged.importBatchId,
        entityIdentifier: `Staged Record ${staged.id}`,
        details: `Administrator ${user.name} rejected OCR staged record #${staged.rowNumber || 1}. Reason: ${reviewNotes || 'Invalid or unreadable entry'}`,
      });

      return NextResponse.json({ success: true, staged: updatedStaged });
    }

    if (action === 'UPDATE') {
      // Just save reviewer corrections in staged JSON without inserting to DB yet
      const updatedStaged = await prisma.ocrStagedRecord.update({
        where: { id: stagedId },
        data: {
          extractedDataJson: JSON.stringify(correctedData),
          reviewedByUserId: user.userId,
          reviewedByName: user.name,
          reviewNotes: reviewNotes || null,
        },
      });

      return NextResponse.json({ success: true, staged: updatedStaged });
    }

    if (action === 'APPROVE') {
      const dataToInsert = correctedData || JSON.parse(staged.extractedDataJson);

      // Validate required fields
      if (!dataToInsert.grNumber?.trim()) {
        return NextResponse.json({ error: 'GR Number is mandatory for General Register entry' }, { status: 400 });
      }
      if (!dataToInsert.firstName?.trim() || !dataToInsert.lastName?.trim()) {
        return NextResponse.json({ error: 'Student First Name and Last Name are mandatory' }, { status: 400 });
      }
      if (!dataToInsert.dob) {
        return NextResponse.json({ error: 'Date of Birth is mandatory' }, { status: 400 });
      }

      // Check duplicate GR Number in production database
      const cleanGr = dataToInsert.grNumber.trim();
      const duplicateStudent = await prisma.student.findUnique({
        where: { grNumber: cleanGr },
      });

      if (duplicateStudent) {
        return NextResponse.json(
          {
            error: `CONFLICT: General Register Number "${cleanGr}" is already assigned to "${duplicateStudent.fullName}". GR Numbers must be unique. Please correct the GR Number before approving.`,
            isDuplicateGr: true,
          },
          { status: 409 }
        );
      }

      const birthDate = new Date(dataToInsert.dob);
      const dobWords = convertDateToWords(birthDate);
      const fullName = `${dataToInsert.lastName.trim()} ${dataToInsert.firstName.trim()} ${dataToInsert.middleName?.trim() || ''}`.replace(/\s+/g, ' ').trim();

      // Transaction: Create Student, Parent, Admission, attach Document scan, update Staged record
      const result = await prisma.$transaction(async (tx) => {
        const student = await tx.student.create({
          data: {
            grNumber: cleanGr,
            admissionNumber: dataToInsert.admissionNumber?.trim() || `ADM-${birthDate.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
            firstName: dataToInsert.firstName.trim(),
            middleName: dataToInsert.middleName?.trim() || null,
            lastName: dataToInsert.lastName.trim(),
            fullName,
            dob: birthDate,
            dobInWords: dobWords,
            gender: dataToInsert.gender || 'MALE',
            bloodGroup: dataToInsert.bloodGroup || null,
            aadharNumber: dataToInsert.aadharNumber || null,
            nationality: dataToInsert.nationality || 'Indian',
            religion: dataToInsert.religion || 'Hindu',
            casteCategory: dataToInsert.casteCategory || 'General/Open',
            subCaste: dataToInsert.subCaste?.trim() || null,
            motherTongue: dataToInsert.motherTongue || 'Marathi',
            placeOfBirth: dataToInsert.placeOfBirth?.trim() || null,
            taluka: dataToInsert.taluka?.trim() || null,
            district: dataToInsert.district?.trim() || null,
            state: dataToInsert.state || 'Maharashtra',
            currentClass: dataToInsert.currentClass || 'I',
            currentDivision: dataToInsert.currentDivision || 'A',
            rollNumber: dataToInsert.rollNumber ? parseInt(dataToInsert.rollNumber, 10) : null,
            status: dataToInsert.status || 'ACTIVE',
            parent: {
              create: {
                fatherName: dataToInsert.fatherName?.trim() || null,
                fatherOccupation: dataToInsert.fatherOccupation?.trim() || null,
                fatherPhone: dataToInsert.fatherPhone?.trim() || null,
                motherName: dataToInsert.motherName?.trim() || null,
                motherOccupation: dataToInsert.motherOccupation?.trim() || null,
                motherPhone: dataToInsert.motherPhone?.trim() || null,
                addressLine1: dataToInsert.addressLine1?.trim() || null,
                city: dataToInsert.city?.trim() || null,
                pincode: dataToInsert.pincode?.trim() || null,
                state: dataToInsert.state || 'Maharashtra',
              },
            },
            admission: {
              create: {
                admissionDate: dataToInsert.admissionDate ? new Date(dataToInsert.admissionDate) : new Date(),
                admittedClass: dataToInsert.admittedClass || dataToInsert.currentClass || 'I',
                admittedDivision: dataToInsert.admittedDivision || 'A',
                previousSchoolName: dataToInsert.previousSchoolName?.trim() || null,
                previousClassPassed: dataToInsert.previousClassPassed?.trim() || null,
                previousTcNumber: dataToInsert.previousTcNumber?.trim() || null,
              },
            },
          },
          include: { parent: true, admission: true },
        });

        // Link original scanned document if available in batch
        const batchDoc = staged.importBatch.documents[0];
        if (batchDoc) {
          await tx.document.create({
            data: {
              studentId: student.id,
              importBatchId: staged.importBatchId,
              fileName: `GR_Scan_${cleanGr}_${batchDoc.fileName}`,
              fileUrl: batchDoc.fileUrl,
              fileType: batchDoc.fileType,
              fileSize: batchDoc.fileSize,
              documentType: 'GR_SCAN',
              isOriginalGrScan: true,
              pageNumber: staged.pageNumber,
              uploadedByUserId: user.userId,
              notes: `Original historical GR register scan verified and linked by ${user.name}`,
            },
          });
        }

        // Update staged record status to APPROVED
        const approvedStaged = await tx.ocrStagedRecord.update({
          where: { id: stagedId },
          data: {
            status: 'APPROVED',
            studentId: student.id,
            reviewedByUserId: user.userId,
            reviewedByName: user.name,
            reviewNotes: reviewNotes || 'Approved into General Register',
          },
        });

        return { student, approvedStaged };
      });

      // Update batch counts
      await updateBatchCounts(staged.importBatchId);

      // Audit log
      await logAuditEvent({
        user,
        actionType: 'OCR_APPROVE',
        entityType: 'STUDENT',
        entityId: result.student.id,
        entityIdentifier: `${result.student.grNumber}: ${result.student.fullName}`,
        details: `Administrator ${user.name} approved OCR Staged Record #${staged.rowNumber || 1} from batch "${staged.importBatch.batchName}" into permanent General Register under GR No ${result.student.grNumber}`,
        newValue: {
          grNumber: result.student.grNumber,
          fullName: result.student.fullName,
          dob: result.student.dob,
          batchId: staged.importBatchId,
        },
        studentId: result.student.id,
      });

      return NextResponse.json({
        success: true,
        student: result.student,
        staged: result.approvedStaged,
      });
    }

    return NextResponse.json({ error: 'Invalid action requested' }, { status: 400 });
  } catch (error: any) {
    console.error('Error during OCR verification action:', error);
    return NextResponse.json({ error: error.message || 'Verification action failed' }, { status: 500 });
  }
}

async function updateBatchCounts(batchId: string) {
  const records = await prisma.ocrStagedRecord.findMany({
    where: { importBatchId: batchId },
  });

  const total = records.length;
  const pending = records.filter(r => r.status === 'PENDING').length;
  const approved = records.filter(r => r.status === 'APPROVED').length;
  const rejected = records.filter(r => r.status === 'REJECTED').length;

  let status = 'PENDING_REVIEW';
  if (total > 0 && pending === 0) {
    status = approved > 0 ? 'COMPLETED' : 'REJECTED';
  } else if (approved > 0) {
    status = 'PARTIALLY_APPROVED';
  }

  await prisma.importBatch.update({
    where: { id: batchId },
    data: {
      recordsDetected: total,
      recordsPending: pending,
      recordsApproved: approved,
      recordsRejected: rejected,
      status,
    },
  });
}

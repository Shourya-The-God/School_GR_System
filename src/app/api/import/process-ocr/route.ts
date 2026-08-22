import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { parseGeneralRegisterOcrText } from '@/lib/ocr-parser';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canImportGR')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to process OCR' }, { status: 403 });
    }

    const body = await req.json();
    const { batchId, rawText, pageNumber = 1 } = body;

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    const batch = await prisma.importBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Import batch not found' }, { status: 404 });
    }

    // Process text through OCR parser engine
    const textToProcess = rawText || 'GR-1060 | Name: Sharma Vihaan Rajesh | DOB: 14/06/2012 | Class: VI-A';
    const parsed = parseGeneralRegisterOcrText(textToProcess, parseInt(pageNumber, 10) || 1);

    const stagedRecordsCreated = [];

    for (const item of parsed.records) {
      const staged = await prisma.ocrStagedRecord.create({
        data: {
          importBatchId: batch.id,
          pageNumber: item.pageNumber,
          rowNumber: item.rowNumber,
          rawOcrText: item.rawText,
          extractedDataJson: JSON.stringify(item.extractedData),
          confidenceScoresJson: JSON.stringify(item.confidenceScores),
          overallConfidence: item.overallConfidence,
          status: 'PENDING',
        },
      });
      stagedRecordsCreated.push(staged);
    }

    // Update batch counts
    const allStaged = await prisma.ocrStagedRecord.findMany({
      where: { importBatchId: batch.id },
    });

    const pendingCount = allStaged.filter(s => s.status === 'PENDING').length;
    const approvedCount = allStaged.filter(s => s.status === 'APPROVED').length;
    const rejectedCount = allStaged.filter(s => s.status === 'REJECTED').length;

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: {
        recordsDetected: allStaged.length,
        recordsPending: pendingCount,
        recordsApproved: approvedCount,
        recordsRejected: rejectedCount,
        status: approvedCount === allStaged.length ? 'COMPLETED' : 'PENDING_REVIEW',
      },
    });

    // Audit Log
    await logAuditEvent({
      user,
      actionType: 'IMPORT_BATCH',
      entityType: 'IMPORT_BATCH',
      entityId: batch.id,
      entityIdentifier: batch.batchName,
      details: `OCR processing parsed ${stagedRecordsCreated.length} student record candidates from page ${pageNumber} of batch "${batch.batchName}"`,
    });

    return NextResponse.json({
      success: true,
      records: stagedRecordsCreated,
      totalDetected: allStaged.length,
    });
  } catch (error: any) {
    console.error('Error in OCR processing:', error);
    return NextResponse.json({ error: error.message || 'OCR processing failed' }, { status: 500 });
  }
}

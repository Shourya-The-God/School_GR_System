import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batches = await prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { stagedRecords: true, documents: true },
        },
      },
    });

    return NextResponse.json({ batches });
  } catch (error) {
    console.error('Error fetching import batches:', error);
    return NextResponse.json({ error: 'Failed to fetch import batches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canImportGR')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create import batches' }, { status: 403 });
    }

    const body = await req.json();
    const {
      batchName,
      originalFileName,
      fileUrl,
      fileType = 'image/png',
      totalPages = 1,
      notes,
    } = body;

    if (!batchName?.trim() || !originalFileName?.trim()) {
      return NextResponse.json({ error: 'Batch Name and Original File Name are required' }, { status: 400 });
    }

    const batch = await prisma.importBatch.create({
      data: {
        batchName: batchName.trim(),
        originalFileName: originalFileName.trim(),
        fileUrl: fileUrl || null,
        fileType,
        totalPages: parseInt(totalPages, 10) || 1,
        status: 'PENDING_REVIEW',
        createdByUserId: user.userId,
        createdByName: user.name,
        notes: notes?.trim() || null,
      },
    });

    // Also create Document record for the batch
    if (fileUrl) {
      await prisma.document.create({
        data: {
          importBatchId: batch.id,
          fileName: originalFileName,
          fileUrl,
          fileType,
          fileSize: 1024 * 250, // Approximation if base64/preset
          documentType: 'GR_SCAN',
          isOriginalGrScan: true,
          pageNumber: 1,
          uploadedByUserId: user.userId,
        },
      });
    }

    // Audit log
    await logAuditEvent({
      user,
      actionType: 'IMPORT_BATCH',
      entityType: 'IMPORT_BATCH',
      entityId: batch.id,
      entityIdentifier: batch.batchName,
      details: `Created new GR document import batch "${batch.batchName}" containing ${batch.totalPages} page(s)`,
    });

    return NextResponse.json({ success: true, batch }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating import batch:', error);
    return NextResponse.json({ error: error.message || 'Failed to create batch' }, { status: 500 });
  }
}

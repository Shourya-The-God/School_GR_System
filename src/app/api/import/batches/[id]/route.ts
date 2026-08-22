import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

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

    const batch = await prisma.importBatch.findUnique({
      where: { id },
      include: {
        documents: true,
        stagedRecords: {
          orderBy: [{ pageNumber: 'asc' }, { rowNumber: 'asc' }],
          include: {
            student: {
              select: { id: true, grNumber: true, fullName: true, status: true },
            },
          },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Import batch not found' }, { status: 404 });
    }

    return NextResponse.json({ batch });
  } catch (error) {
    console.error('Error getting import batch details:', error);
    return NextResponse.json({ error: 'Failed to fetch batch details' }, { status: 500 });
  }
}

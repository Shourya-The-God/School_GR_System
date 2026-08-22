import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canViewAuditLogs')) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to view audit trail' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const actionType = searchParams.get('actionType') || '';
    const entityType = searchParams.get('entityType') || '';
    const search = searchParams.get('search')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '25', 10)));

    const where: any = {};
    if (actionType) where.actionType = actionType;
    if (entityType) where.entityType = entityType;
    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { entityIdentifier: { contains: search } },
        { details: { contains: search } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

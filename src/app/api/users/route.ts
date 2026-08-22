import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser, hasPermission, hashPassword } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        phone: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || !hasPermission(user.role, 'canManageUsers')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, role = 'DATA_ENTRY_OPERATOR', designation, phone, password } = body;

    if (!email?.trim() || !name?.trim() || !password) {
      return NextResponse.json({ error: 'Email, name, and password are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role,
        designation: designation?.trim() || null,
        phone: phone?.trim() || null,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        designation: true,
        phone: true,
        isActive: true,
      },
    });

    await logAuditEvent({
      user,
      actionType: 'CREATE',
      entityType: 'USER',
      entityId: newUser.id,
      entityIdentifier: `${newUser.name} (${newUser.email})`,
      details: `Super Admin ${user.name} created new staff account with role ${newUser.role}`,
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

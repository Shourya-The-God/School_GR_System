import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, setSessionCookie, UserSession } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserSession['role'],
      designation: user.designation || undefined,
    };

    const response = NextResponse.json({
      success: true,
      user: session,
    });

    setSessionCookie(response, session);

    // Audit log
    await logAuditEvent({
      user: session,
      actionType: 'LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      entityIdentifier: `${user.name} (${user.role})`,
      details: `User ${user.name} logged into General Register System`,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}

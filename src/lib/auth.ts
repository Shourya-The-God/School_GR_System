import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'school_gr_secret_fallback_key_2026';
const COOKIE_NAME = 'school_gr_session';

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DATA_ENTRY_OPERATOR' | 'VIEWER';
  designation?: string;
}

// Role Permissions Hierarchy
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canManageUsers: true,
    canEditStudents: true,
    canTransferStudents: true,
    canDeleteRecords: false, // Statutory zero-deletion policy
    canImportGR: true,
    canVerifyOCR: true,
    canExportData: true,
    canViewAuditLogs: true,
    canEditSettings: true,
  },
  SCHOOL_ADMIN: {
    canManageUsers: false,
    canEditStudents: true,
    canTransferStudents: true,
    canDeleteRecords: false,
    canImportGR: true,
    canVerifyOCR: true,
    canExportData: true,
    canViewAuditLogs: true,
    canEditSettings: false,
  },
  DATA_ENTRY_OPERATOR: {
    canManageUsers: false,
    canEditStudents: true,
    canTransferStudents: false, // Must be approved by Admin
    canDeleteRecords: false,
    canImportGR: true,
    canVerifyOCR: true,
    canExportData: false,
    canViewAuditLogs: false,
    canEditSettings: false,
  },
  VIEWER: {
    canManageUsers: false,
    canEditStudents: false,
    canTransferStudents: false,
    canDeleteRecords: false,
    canImportGR: false,
    canVerifyOCR: false,
    canExportData: false,
    canViewAuditLogs: false,
    canEditSettings: false,
  },
};

export function signToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionUser(req?: NextRequest): Promise<UserSession | null> {
  try {
    let token: string | undefined;

    if (req) {
      token = req.cookies.get(COOKIE_NAME)?.value;
    } else {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    }

    if (!token) return null;
    const session = verifyToken(token);
    if (!session) return null;

    // Verify user is still active in DB
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true, designation: true, isActive: true },
    });

    if (!user || !user.isActive) return null;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserSession['role'],
      designation: user.designation || undefined,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: NextResponse, session: UserSession): void {
  const token = signToken(session);
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function hasPermission(
  role: string | undefined,
  permission: keyof typeof ROLE_PERMISSIONS['SUPER_ADMIN']
): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
  return perms ? perms[permission] : false;
}

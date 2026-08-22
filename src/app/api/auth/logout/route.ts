import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSessionUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const response = NextResponse.json({ success: true, message: 'Logged out' });
    clearSessionCookie(response);

    if (user) {
      await logAuditEvent({
        user,
        actionType: 'LOGOUT',
        entityType: 'AUTH',
        entityId: user.userId,
        entityIdentifier: `${user.name} (${user.role})`,
        details: `User ${user.name} logged out from system`,
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error during logout' }, { status: 500 });
  }
}

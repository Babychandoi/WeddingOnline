import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { PLATFORM_EVENT_SCOPE } from '@dco/shared';
import { isPlatformAdminEmail, requirePlatformAdmin } from '@/lib/adminAuth';
import { formatDate } from '@/lib/adminFormat';
import { publishRealtimeEvent } from '@/lib/realtimeClient';

/**
 * Lock or unlock a customer account. A lock takes effect everywhere at once:
 * sessions stop resolving, Google sign-in is refused, and the user is removed from
 * any live hall. Platform admins cannot be locked from here (no self lock-out).
 */
export async function PATCH(req: NextRequest, context: { params: { id: string } }) {
  const gate = await requirePlatformAdmin(req);
  if (!gate.ok) return gate.response;

  const body = (await req.json().catch(() => null)) as { locked?: unknown; reason?: unknown } | null;
  if (!body || typeof body.locked !== 'boolean') {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 200) : '';

  const target = await dbRepo.getUserById(context.params.id);
  if (!target) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });

  if (body.locked && (target.id === gate.auth.user.id || isPlatformAdminEmail(target.email))) {
    return NextResponse.json(
      { error: 'CANNOT_LOCK_ADMIN', message: 'Không thể khoá tài khoản quản trị viên.' },
      { status: 400 }
    );
  }

  const updated = await dbRepo.setUserLock({
    userId: target.id,
    locked: body.locked,
    reason: reason || null,
    actorId: gate.auth.user.id,
  });
  if (!updated) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });

  if (updated.isLocked) {
    // Best effort: the hall join check also refuses locked accounts on reconnect
    await publishRealtimeEvent({ type: 'ACCOUNT_LOCKED', weddingId: PLATFORM_EVENT_SCOPE, userId: updated.id });
  }

  return NextResponse.json({
    user: {
      id: updated.id,
      isLocked: Boolean(updated.isLocked),
      lockedReason: updated.lockedReason ?? null,
      lockedLabel: updated.lockedAt ? formatDate(updated.lockedAt) : '',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import type { MemberRole, ModerationStatus } from '@dco/shared';
import { signRoleInviteToken } from '@dco/shared/server';
import { publishRealtimeEvent } from '@/lib/realtimeClient';
import { getSessionFromRequest } from '@/lib/session';

const HOST_ROLES = new Set(['OWNER', 'BRIDE', 'GROOM']);

export async function GET(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });

  const actor = await dbRepo.getMember(wedding.id, auth.user.id);
  if (wedding.ownerId !== auth.user.id && (!actor || !HOST_ROLES.has(actor.role))) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  return NextResponse.json({ members: await dbRepo.listMembers(wedding.id) });
}

export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });

  const actor = await dbRepo.getMember(wedding.id, auth.user.id);
  if (wedding.ownerId !== auth.user.id && (!actor || !HOST_ROLES.has(actor.role))) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = (await req.json()) as {
    action?: 'CREATE_INVITE' | 'SET_ROLE' | 'SET_MODERATION';
    userId?: string;
    role?: MemberRole;
    moderationStatus?: ModerationStatus;
  };

  if (body.action === 'CREATE_INVITE') {
    const inviteRole =
      body.role === 'BRIDE' || body.role === 'GROOM' || body.role === 'MC' ? body.role : 'MC';
    const token = signRoleInviteToken({
      weddingId: wedding.id,
      slug: wedding.slug,
      role: inviteRole,
    });
    return NextResponse.json({
      role: inviteRole,
      token,
      invitePath: `/w/${wedding.slug}?roleInvite=${encodeURIComponent(token)}`,
    });
  }

  if (body.action === 'SET_MODERATION' && body.userId && body.moderationStatus) {
    const target = await dbRepo.getMember(wedding.id, body.userId);
    if (!target || target.role === 'OWNER') {
      return NextResponse.json({ error: 'CANNOT_MODERATE_OWNER' }, { status: 400 });
    }
    const updated = await dbRepo.setMemberModeration({
      weddingId: wedding.id,
      targetUserId: body.userId,
      status: body.moderationStatus,
      moderatedById: auth.user.id,
    });
    await publishRealtimeEvent({
      type: 'MOD_BAN_USER',
      weddingId: wedding.id,
      userId: body.userId,
      action:
        body.moderationStatus === 'ACTIVE'
          ? 'UNMUTE'
          : body.moderationStatus === 'MUTED'
          ? 'MUTE'
          : 'BAN',
    });
    return NextResponse.json({ member: updated });
  }

  if (!body.userId || !body.role || !['BRIDE', 'GROOM', 'MC', 'GUEST'].includes(body.role)) {
    return NextResponse.json({ error: 'INVALID_ROLE_ASSIGNMENT' }, { status: 400 });
  }

  const updated = await dbRepo.upsertMember({
    weddingId: wedding.id,
    userId: body.userId,
    role: body.role,
  });
  return NextResponse.json({ member: updated });
}

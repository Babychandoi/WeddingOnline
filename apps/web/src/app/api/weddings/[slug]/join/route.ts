import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { filterVietnameseProfanity, type AvatarConfig, type GuestSide } from '@dco/shared';
import { signJoinToken, verifyPin, verifyRoleInviteToken } from '@dco/shared/server';
import { fetchWeddingShards } from '@/lib/realtimeClient';
import { getRuntimeEnv, isLocalRequestHost } from '@/lib/runtimeEnv';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) {
    return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  }

  if (wedding.status === 'EXPIRED_TRIAL') {
    return NextResponse.json({ error: 'TRIAL_EXPIRED' }, { status: 403 });
  }
  if (wedding.status === 'ARCHIVED_2D_FOREVER') {
    return NextResponse.json({ error: 'ARCHIVED_2D_FOREVER' }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    displayName?: string;
    side?: GuestSide;
    pin?: string;
    shardIndex?: number;
    roleInviteToken?: string;
    avatarConfig?: AvatarConfig;
    guestId?: string;
  };

  const isPlaza = wedding.tier === 'PUBLIC_PLAZA';
  const auth = await getSessionFromRequest(req);

  // Mandatory Social OAuth on ALL non-Plaza weddings (including 24h Trial & Real SaaS)
  if (!isPlaza && !auth) {
    return NextResponse.json(
      {
        error: 'OAUTH_REQUIRED',
        message: 'Vui lòng đăng nhập bằng tài khoản Google để tham dự phòng cưới.',
      },
      { status: 401 }
    );
  }

  if (!isPlaza && wedding.pinHash) {
    if (!body.pin || !verifyPin(body.pin.trim(), wedding.pinHash)) {
      return NextResponse.json({ error: 'INVALID_PIN' }, { status: 403 });
    }
  }

  const userId = auth ? auth.user.id : body.guestId || `plaza_${Date.now()}`;
  const rawName = (body.displayName || auth?.user.displayName || 'Khách Quý').trim().slice(0, 40);
  const displayName = filterVietnameseProfanity(rawName) || 'Khách Quý';
  const side: GuestSide = body.side ?? 'FRIEND';
  const avatarConfig: AvatarConfig = body.avatarConfig ?? {
    outfitId: 'ao_dai_guest',
    hairId: 'hair_1',
    hairColor: '#1f2937',
  };

  let role: 'OWNER' | 'BRIDE' | 'GROOM' | 'MC' | 'GUEST' = 'GUEST';
  let isMuted = false;

  if (!isPlaza && auth) {
    const existingMember = await dbRepo.getMember(wedding.id, auth.user.id);
    if (existingMember?.moderationStatus === 'BANNED') {
      return NextResponse.json({ error: 'USER_BANNED' }, { status: 403 });
    }
    const invitePayload = body.roleInviteToken ? verifyRoleInviteToken(body.roleInviteToken) : null;
    const invitedRole =
      invitePayload && invitePayload.weddingId === wedding.id ? invitePayload.role : undefined;

    const assignedRole =
      wedding.ownerId === auth.user.id
        ? 'OWNER'
        : invitedRole ?? existingMember?.role ?? 'GUEST';

    const member = await dbRepo.upsertMember({
      weddingId: wedding.id,
      userId: auth.user.id,
      role: assignedRole,
      side,
      nicknameOverride: displayName,
      avatarConfig,
    });
    role = member.role;
    isMuted = member.moderationStatus === 'MUTED';
  }

  // Shard selection (< 50 soft cap, 60 hard cap per shard)
  const activeShards = await fetchWeddingShards(wedding.id);
  let targetShard = body.shardIndex ?? 1;
  if (!body.shardIndex && activeShards.length > 0) {
    const available = activeShards.find((s) => s.clients < 50);
    targetShard = available ? available.shardIndex : activeShards[activeShards.length - 1].shardIndex + 1;
  }

  const joinToken = signJoinToken({
    userId,
    displayName,
    weddingId: wedding.id,
    slug: wedding.slug,
    tier: wedding.tier,
    role,
    side,
    shardIndex: targetShard,
    avatarConfig,
    isAnonymousPlaza: isPlaza && !auth,
    isMuted,
  });

  const reqHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const colyseusUrl = isLocalRequestHost(reqHost)
    ? process.env.NEXT_PUBLIC_COLYSEUS_URL || 'ws://127.0.0.1:2567'
    : getRuntimeEnv('PUBLIC_COLYSEUS_URL') || 'wss://ws.poiplegal.online';

  return NextResponse.json({
    joinToken,
    shardIndex: targetShard,
    shards: activeShards,
    role,
    userId,
    displayName,
    colyseusUrl,
  });
}

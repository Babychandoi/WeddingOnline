import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { dbRepo } from '@dco/database';
import { TIER_CATALOG } from '@dco/shared';
import { resolveSecret } from '@dco/shared/server';
import { getRuntimeEnv, isLocalRequestHost } from '@/lib/runtimeEnv';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'OAUTH_REQUIRED' }, { status: 401 });
  }

  const body = (await req.json()) as {
    slug?: string;
    shardIndex?: number;
    tableNo?: number;
    scope?: 'table' | 'stage';
  };

  if (!body.slug) {
    return NextResponse.json({ error: 'MISSING_SLUG' }, { status: 400 });
  }

  const wedding = await dbRepo.getWeddingBySlug(body.slug);
  if (!wedding) {
    return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  }

  // Strictly only VIP_FULFILLMENT allows LiveKit Voice Chat
  if (!TIER_CATALOG[wedding.tier].allowVoiceChat) {
    return NextResponse.json(
      { error: 'VOICE_CHAT_VIP_ONLY', message: 'Voice Chat bàn tiệc chỉ mở ở Gói Viên Mãn VIP.' },
      { status: 403 }
    );
  }

  const member = await dbRepo.getMember(wedding.id, auth.user.id);
  if (member?.moderationStatus === 'BANNED') {
    return NextResponse.json({ error: 'USER_BANNED' }, { status: 403 });
  }

  const scope = body.scope === 'stage' ? 'stage' : 'table';
  const roomName =
    scope === 'stage'
      ? `wedding_${wedding.id}_stage`
      : `wedding_${wedding.id}_shard_${body.shardIndex ?? 1}_table_${body.tableNo ?? 1}`;

  const isHostOrMc =
    wedding.ownerId === auth.user.id ||
    (member !== null && ['OWNER', 'BRIDE', 'GROOM', 'MC'].includes(member.role));

  const canPublish =
    scope === 'stage' ? isHostOrMc : member?.moderationStatus !== 'MUTED';

  const apiKey = getRuntimeEnv('LIVEKIT_API_KEY') || 'devkey';
  const apiSecret = resolveSecret('LIVEKIT_API_SECRET', getRuntimeEnv('LIVEKIT_API_SECRET'));
  if (!apiSecret) {
    console.error('[security] LIVEKIT_API_SECRET is missing or still a development default.');
    return NextResponse.json({ error: 'VOICE_NOT_CONFIGURED' }, { status: 503 });
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: auth.user.id,
    name: member?.nicknameOverride || auth.user.displayName,
    ttl: '2h',
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish,
    canSubscribe: true,
    canPublishData: false,
  });

  const reqHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const livekitUrl = isLocalRequestHost(reqHost)
    ? process.env.LIVEKIT_URL || 'ws://127.0.0.1:7880'
    : getRuntimeEnv('PUBLIC_LIVEKIT_URL') || 'wss://lk.poiplegal.online';

  return NextResponse.json({
    token: await token.toJwt(),
    roomName,
    livekitUrl,
    canPublish,
  });
}

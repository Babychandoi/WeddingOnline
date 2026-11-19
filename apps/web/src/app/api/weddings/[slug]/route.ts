import { NextRequest, NextResponse } from 'next/server';
import { dbRepo, toPublicWedding } from '@dco/database';
import {
  sanitizeExternalVideoUrl,
  validateSceneLayout,
  type CeremonyConfig,
  type SceneLayoutDocument,
} from '@dco/shared';
import { hashPin } from '@dco/shared/server';
import { getSessionFromRequest } from '@/lib/session';

const HOST_ROLES = new Set(['OWNER', 'BRIDE', 'GROOM']);

export async function GET(
  _req: NextRequest,
  context: { params: { slug: string } }
) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) {
    return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  }

  const [scene, photos, guestbook, bouquetCatches] = await Promise.all([
    dbRepo.getSceneByWeddingId(wedding.id),
    dbRepo.listPhotos(wedding.id),
    dbRepo.listGuestbook(wedding.id),
    dbRepo.listBouquetCatches(wedding.id),
  ]);

  return NextResponse.json({
    wedding: toPublicWedding(wedding),
    scene,
    photos,
    guestbook,
    bouquetCatches,
  });
}

export async function PATCH(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });

  const member = await dbRepo.getMember(wedding.id, auth.user.id);
  if (wedding.ownerId !== auth.user.id && (!member || !HOST_ROLES.has(member.role))) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = (await req.json()) as {
    title?: string;
    brideName?: string;
    groomName?: string;
    weddingDate?: string;
    pin?: string | null;
    videoEmbedUrl?: string | null;
    videoIsLive?: boolean;
    bankBin?: string | null;
    bankAccountNo?: string | null;
    bankAccountName?: string | null;
    webhookProvider?: string | null;
    webhookSecret?: string | null;
    ceremonyConfig?: CeremonyConfig | null;
    layoutData?: SceneLayoutDocument;
  };

  // SePay is the only supported bank-notification provider; reject before writing anything
  if (body.webhookProvider !== undefined && body.webhookProvider !== null && body.webhookProvider !== 'SEPAY') {
    return NextResponse.json(
      { error: 'UNSUPPORTED_WEBHOOK_PROVIDER', message: 'Hệ thống chỉ hỗ trợ webhook SePay.' },
      { status: 400 }
    );
  }

  // Validate 3D Scene Builder layout strictly before persisting
  let updatedScene = await dbRepo.getSceneByWeddingId(wedding.id);
  if (body.layoutData) {
    const validation = validateSceneLayout(body.layoutData);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'INVALID_SCENE_LAYOUT',
          errors: validation.errors,
          blockedCells: validation.blockedCells,
        },
        { status: 400 }
      );
    }
    updatedScene = await dbRepo.updateWeddingScene(wedding.id, body.layoutData);
  }

  let sanitizedVideoUrl = wedding.videoEmbedUrl;
  if (body.videoEmbedUrl !== undefined) {
    if (!body.videoEmbedUrl) {
      sanitizedVideoUrl = null;
    } else {
      const parsed = sanitizeExternalVideoUrl(body.videoEmbedUrl);
      if (!parsed) {
        return NextResponse.json(
          { error: 'UNSUPPORTED_VIDEO_URL', message: 'Chỉ hỗ trợ YouTube, Vimeo hoặc Google Drive.' },
          { status: 400 }
        );
      }
      sanitizedVideoUrl = parsed.embedUrl;
    }
  }

  const patch: Parameters<typeof dbRepo.updateWedding>[1] = {};
  if (body.title !== undefined) patch.title = body.title.trim();
  if (body.brideName !== undefined) patch.brideName = body.brideName.trim();
  if (body.groomName !== undefined) patch.groomName = body.groomName.trim();
  if (body.weddingDate !== undefined) patch.weddingDate = new Date(body.weddingDate).toISOString();
  if (body.pin !== undefined) patch.pinHash = body.pin ? hashPin(body.pin) : null;
  if (body.videoEmbedUrl !== undefined) patch.videoEmbedUrl = sanitizedVideoUrl;
  if (body.videoIsLive !== undefined) patch.videoIsLive = body.videoIsLive;
  if (body.bankBin !== undefined) patch.bankBin = body.bankBin;
  if (body.bankAccountNo !== undefined) patch.bankAccountNo = body.bankAccountNo;
  if (body.bankAccountName !== undefined) patch.bankAccountName = body.bankAccountName;
  if (body.webhookProvider !== undefined) patch.webhookProvider = body.webhookProvider;
  if (body.webhookSecret !== undefined) patch.webhookSecretHash = body.webhookSecret;
  if (body.ceremonyConfig !== undefined) patch.ceremonyConfig = body.ceremonyConfig;

  const updatedWedding = (await dbRepo.updateWedding(wedding.id, patch)) ?? wedding;

  return NextResponse.json({
    wedding: toPublicWedding(updatedWedding),
    scene: updatedScene,
  });
}

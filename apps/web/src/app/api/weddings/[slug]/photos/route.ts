import { NextRequest, NextResponse } from 'next/server';
import { dbRepo, type PhotoType } from '@dco/database';
import { TIER_CATALOG } from '@dco/shared';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  context: { params: { slug: string } }
) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ photos: await dbRepo.listPhotos(wedding.id) });
}

export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });

  const auth = await getSessionFromRequest(req);
  if (wedding.tier !== 'PUBLIC_PLAZA' && !auth) {
    return NextResponse.json({ error: 'OAUTH_REQUIRED' }, { status: 401 });
  }

  const body = (await req.json()) as {
    type?: PhotoType;
    r2ObjectKey?: string;
    publicUrl?: string;
    caption?: string;
  };

  if (!body.publicUrl || !body.r2ObjectKey) {
    return NextResponse.json({ error: 'MISSING_PHOTO_URL' }, { status: 400 });
  }

  const type: PhotoType =
    body.type === 'PRE_WEDDING_GALLERY' ? 'PRE_WEDDING_GALLERY' : 'PHOTOBOOTH_SNAPSHOT';

  const existingPhotos = await dbRepo.listPhotos(wedding.id);
  const uploaderId = auth?.user.id ?? 'plaza_guest';

  if (type === 'PRE_WEDDING_GALLERY') {
    const member = auth ? await dbRepo.getMember(wedding.id, auth.user.id) : null;
    if (!auth || (wedding.ownerId !== auth.user.id && !['OWNER', 'BRIDE', 'GROOM'].includes(member?.role ?? ''))) {
      return NextResponse.json({ error: 'HOST_ONLY' }, { status: 403 });
    }
    const galleryCount = existingPhotos.filter((p) => p.type === 'PRE_WEDDING_GALLERY').length;
    if (galleryCount >= TIER_CATALOG[wedding.tier].maxPhotos) {
      return NextResponse.json({ error: 'PHOTO_QUOTA_EXCEEDED' }, { status: 403 });
    }
  } else {
    const guestShots = existingPhotos.filter(
      (p) => p.type === 'PHOTOBOOTH_SNAPSHOT' && p.uploaderId === uploaderId
    ).length;
    if (guestShots >= 3 && wedding.ownerId !== uploaderId) {
      return NextResponse.json({ error: 'GUEST_PHOTOBOOTH_LIMIT' }, { status: 403 });
    }
  }

  const asset = await dbRepo.addPhoto({
    weddingId: wedding.id,
    uploaderId,
    type,
    r2ObjectKey: body.r2ObjectKey,
    publicUrl: body.publicUrl,
    caption: body.caption?.slice(0, 180) ?? null,
    hasWatermark: TIER_CATALOG[wedding.tier].photoboothWatermark,
  });

  return NextResponse.json({ photo: asset }, { status: 201 });
}

import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { createR2PresignedPutUrl } from '@/lib/r2';
import { getSessionFromRequest } from '@/lib/session';

const ALLOWED_MIME = new Set(['image/webp', 'image/png', 'image/jpeg']);

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    slug?: string;
    folder?: 'gallery' | 'photobooth';
    contentType?: string;
    byteSize?: number;
  };

  if (!body.slug || !body.contentType || !ALLOWED_MIME.has(body.contentType)) {
    return NextResponse.json({ error: 'INVALID_UPLOAD_REQUEST' }, { status: 400 });
  }
  if ((body.byteSize ?? 0) > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'FILE_TOO_LARGE_MAX_5MB' }, { status: 400 });
  }

  const wedding = await dbRepo.getWeddingBySlug(body.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });

  const auth = await getSessionFromRequest(req);
  if (wedding.tier !== 'PUBLIC_PLAZA' && !auth) {
    return NextResponse.json({ error: 'OAUTH_REQUIRED' }, { status: 401 });
  }

  const ext = body.contentType === 'image/png' ? 'png' : body.contentType === 'image/webp' ? 'webp' : 'jpg';
  const prefix = wedding.tier === 'TRIAL_24H' ? `trials/${wedding.id}` : `weddings/${wedding.id}`;
  const folder = body.folder === 'gallery' ? 'gallery' : 'photobooth';
  const objectKey = `${prefix}/${folder}/${crypto.randomUUID()}.${ext}`;

  const signed = await createR2PresignedPutUrl({
    objectKey,
    contentType: body.contentType,
  });

  return NextResponse.json({
    objectKey,
    ...signed,
  });
}

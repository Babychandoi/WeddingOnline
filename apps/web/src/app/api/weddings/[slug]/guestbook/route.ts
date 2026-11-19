import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { filterVietnameseProfanity, type GuestSide } from '@dco/shared';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(
  _req: NextRequest,
  context: { params: { slug: string } }
) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });

  return NextResponse.json({ entries: await dbRepo.listGuestbook(wedding.id) });
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
    message?: string;
    authorName?: string;
    side?: GuestSide;
  };

  const cleanMsg = filterVietnameseProfanity((body.message || '').trim().slice(0, 500));
  if (!cleanMsg) {
    return NextResponse.json({ error: 'EMPTY_MESSAGE' }, { status: 400 });
  }

  const authorId = auth?.user.id ?? 'plaza_guest';
  const authorName = filterVietnameseProfanity(
    (body.authorName || auth?.user.displayName || 'Khách Tham Dự').trim().slice(0, 50)
  );

  const entry = await dbRepo.addGuestbookEntry({
    weddingId: wedding.id,
    authorId,
    authorName,
    side: body.side ?? 'FRIEND',
    message: cleanMsg,
  });

  return NextResponse.json({ entry }, { status: 201 });
}

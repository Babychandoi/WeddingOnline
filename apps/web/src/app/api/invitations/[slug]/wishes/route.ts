import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { filterVietnameseProfanity, type GuestSide } from '@dco/shared';
import { allowRequest, clientIp } from '@/lib/rateLimit';

const SIDES: GuestSide[] = ['GROOM_SIDE', 'BRIDE_SIDE', 'FRIEND', 'COLLEAGUE'];

export interface InvitationWish {
  id: string;
  name: string;
  side: GuestSide | null;
  message: string;
  createdAt: string;
  /** Sent together with a wedding gift (the amount is never exposed) */
  withGift: boolean;
}

/** Public wish wall: guestbook entries plus wishes that came with a verified gift */
export async function GET(_req: NextRequest, context: { params: { slug: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });

  const [entries, ledger] = await Promise.all([dbRepo.listGuestbook(wedding.id), dbRepo.getPrivateGiftLedger(wedding.id)]);
  const wishes: InvitationWish[] = [
    ...entries.map((e) => ({ id: e.id, name: e.authorName, side: e.side, message: e.message, createdAt: e.createdAt, withGift: false })),
    ...ledger.map((l) => ({ id: l.id, name: l.guestName, side: null, message: l.wishMessage, createdAt: l.verifiedAt, withGift: true })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 200);

  return NextResponse.json({ wishes }, { headers: { 'Cache-Control': 'no-store' } });
}

/** A guest leaves a wish from the invitation page; no sign-in, rate limited per address */
export async function POST(req: NextRequest, context: { params: { slug: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  // An expired trial room is closed; the permanent 2D memorial still collects wishes
  if (wedding.status === 'EXPIRED_TRIAL') {
    return NextResponse.json({ error: 'INVITATION_CLOSED' }, { status: 410 });
  }

  const ip = clientIp(req);
  if (!allowRequest(`wish:${wedding.id}:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'TOO_MANY_WISHES', message: 'Bạn gửi hơi nhanh, đợi vài phút rồi gửi tiếp nhé.' }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as { name?: unknown; message?: unknown; side?: unknown };
  const name = typeof body.name === 'string' ? filterVietnameseProfanity(body.name.trim().slice(0, 60)) : '';
  const message = typeof body.message === 'string' ? filterVietnameseProfanity(body.message.trim().slice(0, 500)) : '';
  if (name.length < 2) return NextResponse.json({ error: 'NAME_REQUIRED', message: 'Bạn cho cô dâu chú rể biết tên nhé.' }, { status: 400 });
  if (message.length < 2) return NextResponse.json({ error: 'MESSAGE_REQUIRED', message: 'Lời chúc còn trống.' }, { status: 400 });
  const side = SIDES.includes(body.side as GuestSide) ? (body.side as GuestSide) : 'FRIEND';

  const entry = await dbRepo.addGuestbookEntry({ weddingId: wedding.id, authorId: null, authorName: name, side, message });
  const wish: InvitationWish = { id: entry.id, name: entry.authorName, side: entry.side, message: entry.message, createdAt: entry.createdAt, withGift: false };
  return NextResponse.json({ wish }, { status: 201 });
}

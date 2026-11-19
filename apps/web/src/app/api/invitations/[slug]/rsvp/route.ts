import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { filterVietnameseProfanity, type GuestSide } from '@dco/shared';
import { allowRequest, clientIp } from '@/lib/rateLimit';

const SIDES: GuestSide[] = ['GROOM_SIDE', 'BRIDE_SIDE', 'FRIEND', 'COLLEAGUE'];

/** A guest confirms whether they will attend; the answers are private to the couple */
export async function POST(req: NextRequest, context: { params: { slug: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  if (wedding.status === 'EXPIRED_TRIAL' || wedding.status === 'ARCHIVED_2D_FOREVER') {
    return NextResponse.json({ error: 'RSVP_CLOSED', message: 'Thiệp này đã ngừng nhận xác nhận tham dự.' }, { status: 410 });
  }

  if (!allowRequest(`rsvp:${wedding.id}:${clientIp(req)}`, 6, 30 * 60 * 1000)) {
    return NextResponse.json({ error: 'TOO_MANY_RSVPS', message: 'Bạn đã gửi khá nhiều lần, đợi một lúc rồi thử lại nhé.' }, { status: 429 });
  }

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const guestName = typeof b.guestName === 'string' ? filterVietnameseProfanity(b.guestName.trim().slice(0, 80)) : '';
  if (guestName.length < 2) return NextResponse.json({ error: 'NAME_REQUIRED', message: 'Bạn nhập tên giúp mình nhé.' }, { status: 400 });
  if (typeof b.attending !== 'boolean') return NextResponse.json({ error: 'ATTENDING_REQUIRED', message: 'Bạn chọn có đến được không nhé.' }, { status: 400 });

  const phoneRaw = typeof b.phone === 'string' ? b.phone.replace(/[^\d+ ]/g, '').trim().slice(0, 20) : '';
  const headcount = b.attending ? Math.min(10, Math.max(1, Math.round(Number(b.headcount) || 1))) : 0;
  const note = typeof b.note === 'string' ? filterVietnameseProfanity(b.note.trim().slice(0, 300)) : '';

  const rsvp = await dbRepo.createInvitationRsvp({
    weddingId: wedding.id,
    guestName,
    phone: phoneRaw || null,
    attending: b.attending,
    headcount,
    side: SIDES.includes(b.side as GuestSide) ? (b.side as GuestSide) : 'FRIEND',
    note: note || null,
  });
  return NextResponse.json({ ok: true, attending: rsvp.attending, headcount: rsvp.headcount }, { status: 201 });
}

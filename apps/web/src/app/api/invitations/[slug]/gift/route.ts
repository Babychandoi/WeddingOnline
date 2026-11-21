import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { buildVietQrDataUrl, invitationAccess, filterVietnameseProfanity, generateGiftCode } from '@dco/shared';
import { getSessionFromRequest } from '@/lib/session';
import { allowRequest, clientIp } from '@/lib/rateLimit';

/**
 * Gift from the invitation page: the guest gets a VietQR into the couple's own account with a
 * personal transfer code; the couple's SePay webhook then confirms it. Signing in is optional.
 */
export async function POST(req: NextRequest, context: { params: { slug: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });

  if (!invitationAccess(wedding).published) return NextResponse.json({ error: 'INVITATION_NOT_PUBLISHED', message: 'Thiệp chưa được phát hành hoặc đang tạm ngưng.' }, { status: 403 });
  if (!wedding.bankBin || !wedding.bankAccountNo) {
    return NextResponse.json({ error: 'BANK_NOT_CONFIGURED', message: 'Cô dâu chú rể chưa cấu hình tài khoản nhận mừng cưới.' }, { status: 400 });
  }
  if (!allowRequest(`gift:${wedding.id}:${clientIp(req)}`, 8, 30 * 60 * 1000)) {
    return NextResponse.json({ error: 'TOO_MANY_GIFT_CODES', message: 'Bạn đã tạo nhiều mã chuyển khoản, đợi một lúc rồi thử lại nhé.' }, { status: 429 });
  }

  const auth = await getSessionFromRequest(req);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const typedName = typeof b.name === 'string' ? filterVietnameseProfanity(b.name.trim().slice(0, 60)) : '';
  const guestName = typedName || auth?.user.displayName || '';
  if (guestName.length < 2) return NextResponse.json({ error: 'NAME_REQUIRED', message: 'Bạn nhập tên để cô dâu chú rể biết ai gửi lời mừng nhé.' }, { status: 400 });
  const wishMessage =
    (typeof b.wish === 'string' ? filterVietnameseProfanity(b.wish.trim().slice(0, 280)) : '') || 'Chúc hai bạn trăm năm hạnh phúc!';
  const amount = Number(b.amountVnd);
  const suggestedAmountVnd = Number.isFinite(amount) && amount >= 10_000 && amount <= 100_000_000 ? Math.round(amount) : undefined;

  const transferCode = generateGiftCode();
  const intent = await dbRepo.createGiftIntent({
    weddingId: wedding.id,
    guestUserId: auth?.user.id ?? null,
    guestName,
    wishMessage,
    transferCode,
  });
  const qr = await buildVietQrDataUrl({
    bankBin: wedding.bankBin,
    accountNumber: wedding.bankAccountNo,
    amountVnd: suggestedAmountVnd,
    transferCode,
  });

  return NextResponse.json(
    {
      intentId: intent.id,
      transferCode,
      bankBin: wedding.bankBin,
      bankAccountNo: wedding.bankAccountNo,
      bankAccountName: wedding.bankAccountName,
      qrDataUrl: qr.dataUrl,
      expiresAt: intent.expiresAt,
    },
    { status: 201 },
  );
}

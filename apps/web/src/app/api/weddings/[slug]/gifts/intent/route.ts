import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import {
  TIER_CATALOG,
  buildVietQrDataUrl,
  filterVietnameseProfanity,
  generateGiftCode,
} from '@dco/shared';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) {
    return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  }

  // HARD FIREWALL: Physically block VietQR real-money gifting on Free Plaza & 24h Trial
  if (!TIER_CATALOG[wedding.tier].allowVietQr) {
    return NextResponse.json(
      {
        error: 'VIETQR_DISABLED_FOR_FREE_TIER',
        message: 'Hộp mừng cưới VietQR bị khóa ở Quảng Trường Cộng Đồng và Phòng Dùng Thử 24h.',
      },
      { status: 403 }
    );
  }

  const auth = await getSessionFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'OAUTH_REQUIRED' }, { status: 401 });
  }

  if (!wedding.bankBin || !wedding.bankAccountNo) {
    return NextResponse.json(
      { error: 'BANK_NOT_CONFIGURED', message: 'Cô dâu chú rể chưa cấu hình tài khoản ngân hàng.' },
      { status: 400 }
    );
  }

  const body = (await req.json()) as {
    wishMessage?: string;
    suggestedAmountVnd?: number;
  };

  const wishMessage =
    filterVietnameseProfanity((body.wishMessage || '').trim().slice(0, 280)) ||
    'Chúc hai bạn trăm năm hạnh phúc!';

  const transferCode = generateGiftCode();
  const intent = await dbRepo.createGiftIntent({
    weddingId: wedding.id,
    guestUserId: auth.user.id,
    guestName: auth.user.displayName,
    wishMessage,
    transferCode,
  });

  const qr = await buildVietQrDataUrl({
    bankBin: wedding.bankBin,
    accountNumber: wedding.bankAccountNo,
    amountVnd: body.suggestedAmountVnd,
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
      qrPayload: qr.payload,
    },
    { status: 201 }
  );
}

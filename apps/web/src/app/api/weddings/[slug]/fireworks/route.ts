import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import {
  FIREWORK_MESSAGE_MAX,
  FIREWORK_PACKS,
  buildVietQrDataUrl,
  filterVietnameseProfanity,
  generateFireworkCode,
  getFireworkPack,
} from '@dco/shared';
import { getFireworkPrices, getPlatformBankAccount } from '@/lib/platformSettings';
import { getSessionFromRequest } from '@/lib/session';

/** The fireworks shop of a hall: packs and today's prices */
export async function GET(_req: NextRequest, context: { params: { slug: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  const prices = await getFireworkPrices();
  return NextResponse.json({
    packs: FIREWORK_PACKS.map((p) => ({ id: p.id, label: p.label, tagline: p.tagline, priceVnd: prices[p.id] })),
  });
}

/**
 * Buys fireworks: creates an order and returns a VietQR for the platform account. The show
 * plays when SePay reports the transfer (see webhookProcessor).
 */
export async function POST(req: NextRequest, context: { params: { slug: string } }) {
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  if (wedding.status === 'EXPIRED_TRIAL' || wedding.status === 'ARCHIVED_2D_FOREVER') {
    return NextResponse.json({ error: 'ROOM_CLOSED', message: 'Sảnh cưới này đã đóng.' }, { status: 409 });
  }

  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'OAUTH_REQUIRED', message: 'Đăng nhập để mua pháo hoa.' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { packId?: string; message?: string };
  const pack = getFireworkPack(String(body.packId ?? ''));
  if (!pack) return NextResponse.json({ error: 'INVALID_PACK' }, { status: 400 });

  // Never show a QR for a placeholder account: the money would go to a stranger
  const bank = await getPlatformBankAccount();
  if (!bank) {
    return NextResponse.json(
      { error: 'PLATFORM_BANK_NOT_CONFIGURED', message: 'Hệ thống chưa cấu hình tài khoản nhận thanh toán.' },
      { status: 503 },
    );
  }

  const amountVnd = (await getFireworkPrices())[pack.id];
  const message =
    filterVietnameseProfanity(String(body.message ?? '').replace(/\s+/g, ' ').trim().slice(0, FIREWORK_MESSAGE_MAX)) ||
    'Chúc hai bạn trăm năm hạnh phúc!';
  const orderCode = generateFireworkCode();
  const order = await dbRepo.createFireworkOrder({
    weddingId: wedding.id,
    buyerId: auth.user.id,
    buyerName: auth.user.displayName.slice(0, 80),
    packId: pack.id,
    amountVnd,
    message,
    orderCode,
  });

  const qr = await buildVietQrDataUrl({
    bankBin: bank.bankBin,
    accountNumber: bank.accountNumber,
    amountVnd,
    transferCode: orderCode,
  });

  return NextResponse.json(
    {
      orderCode: order.orderCode,
      packId: pack.id,
      amountVnd,
      bankBin: bank.bankBin,
      bankAccountNo: bank.accountNumber,
      bankAccountName: bank.accountName,
      qrDataUrl: qr.dataUrl,
    },
    { status: 201 },
  );
}

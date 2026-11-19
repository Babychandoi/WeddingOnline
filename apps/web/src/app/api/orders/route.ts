import { NextRequest, NextResponse } from 'next/server';
import { dbRepo, toPublicWedding } from '@dco/database';
import { TIER_CATALOG, buildVietQrDataUrl, generatePlanOrderCode, type WeddingTier } from '@dco/shared';
import { getPlatformBankAccount } from '@/lib/platformSettings';
import { publishRealtimeEvent } from '@/lib/realtimeClient';
import { getSessionFromRequest } from '@/lib/session';

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'OAUTH_REQUIRED' }, { status: 401 });

  const body = (await req.json()) as {
    weddingId?: string;
    slug?: string;
    targetTier?: WeddingTier;
    voucherCode?: string;
  };

  const wedding = body.weddingId
    ? await dbRepo.getWeddingById(body.weddingId)
    : body.slug
    ? await dbRepo.getWeddingBySlug(body.slug)
    : null;

  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  if (wedding.ownerId !== auth.user.id) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const targetTier: WeddingTier =
    body.targetTier === 'VIP_FULFILLMENT' ? 'VIP_FULFILLMENT' : 'HAPPINESS';
  const basePrice = TIER_CATALOG[targetTier].priceVnd;
  let finalAmountVnd = basePrice;
  let appliedDiscountPercent = 0;

  // Refuse before touching the voucher if this order would need a bank transfer we can't take:
  // showing a QR for a placeholder account would send real money to a stranger.
  const bank = await getPlatformBankAccount();
  if (!bank) {
    const voucherPeek = body.voucherCode?.trim()
      ? await dbRepo.getVoucherByCode(body.voucherCode.trim())
      : null;
    if (!voucherPeek?.isActive || voucherPeek.discountPercent < 100) {
      return NextResponse.json(
        {
          error: 'PLATFORM_BANK_NOT_CONFIGURED',
          message: 'Hệ thống chưa cấu hình tài khoản nhận thanh toán. Vui lòng liên hệ quản trị viên.',
        },
        { status: 503 }
      );
    }
  }

  if (body.voucherCode && body.voucherCode.trim().length > 0) {
    const redeemed = await dbRepo.redeemVoucher(body.voucherCode.trim(), targetTier);
    if (!redeemed.ok) {
      return NextResponse.json(
        { error: redeemed.reason, message: 'Mã Voucher Studio không hợp lệ hoặc đã hết lượt.' },
        { status: 400 }
      );
    }
    appliedDiscountPercent = redeemed.voucher.discountPercent;
    finalAmountVnd = Math.max(0, Math.round((basePrice * (100 - appliedDiscountPercent)) / 100));
  }

  const orderCode = generatePlanOrderCode();

  // 100% Prepaid Studio Voucher activates room instantly without bank transfer
  if (finalAmountVnd === 0) {
    const activated = await dbRepo.activateWeddingByVoucher({
      weddingId: wedding.id,
      buyerId: auth.user.id,
      targetTier,
      orderCode,
    });
    await publishRealtimeEvent({
      type: 'PLAN_ACTIVATED',
      weddingId: wedding.id,
      tier: targetTier,
    });
    return NextResponse.json(
      {
        instantActivated: true,
        appliedDiscountPercent,
        order: activated.order,
        wedding: toPublicWedding(activated.wedding),
      },
      { status: 201 }
    );
  }

  if (!bank) {
    // Unreachable unless the voucher changed between the check above and redemption
    return NextResponse.json({ error: 'PLATFORM_BANK_NOT_CONFIGURED' }, { status: 503 });
  }

  const order = await dbRepo.createSaasOrder({
    weddingId: wedding.id,
    buyerId: auth.user.id,
    targetTier,
    amountVnd: finalAmountVnd,
    orderCode,
  });

  const { bankBin, accountNumber, accountName } = bank;

  const qr = await buildVietQrDataUrl({
    bankBin,
    accountNumber,
    amountVnd: finalAmountVnd,
    transferCode: orderCode,
  });

  return NextResponse.json(
    {
      instantActivated: false,
      appliedDiscountPercent,
      order,
      bankBin,
      accountNumber,
      accountName,
      qrDataUrl: qr.dataUrl,
      qrPayload: qr.payload,
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('orderCode');
  if (!code) return NextResponse.json({ error: 'MISSING_ORDER_CODE' }, { status: 400 });
  const order = await dbRepo.getSaasOrderByCode(code);
  if (!order) return NextResponse.json({ error: 'ORDER_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ order });
}

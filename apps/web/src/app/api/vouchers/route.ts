import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import type { WeddingTier } from '@dco/shared';
import { requirePlatformAdmin } from '@/lib/adminAuth';

export async function GET(req: NextRequest) {
  // Public: checking a single code at checkout
  const code = req.nextUrl.searchParams.get('code');
  if (code) {
    const voucher = await dbRepo.getVoucherByCode(code);
    if (!voucher || !voucher.isActive || voucher.usedCount >= voucher.maxUses) {
      return NextResponse.json({ valid: false, error: 'VOUCHER_INVALID' }, { status: 404 });
    }
    return NextResponse.json({ valid: true, voucher });
  }

  // Listing every code (incl. 100% prepaid ones) is for platform admins only
  const gate = await requirePlatformAdmin(req);
  if (!gate.ok) return gate.response;
  return NextResponse.json({ vouchers: await dbRepo.listVouchers() });
}

export async function POST(req: NextRequest) {
  // A voucher can activate a paid plan for free, so only platform admins may mint one
  const gate = await requirePlatformAdmin(req);
  if (!gate.ok) return gate.response;

  try {
    const body = (await req.json()) as {
      code?: string;
      studioName?: string;
      discountPercent?: number;
      targetTier?: WeddingTier | null;
      maxUses?: number;
    };

    const code = (body.code || '')
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '');
    if (code.length < 4) {
      return NextResponse.json({ error: 'INVALID_VOUCHER_CODE' }, { status: 400 });
    }

    const created = await dbRepo.createVoucher({
      code,
      studioName: body.studioName || 'Studio Đối Tác',
      discountPercent: Number(body.discountPercent ?? 35),
      targetTier: body.targetTier || null,
      maxUses: Number(body.maxUses ?? 20),
    });

    return NextResponse.json({ voucher: created }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'CREATE_VOUCHER_FAILED';
    return NextResponse.json({ error: msg }, { status: msg === 'VOUCHER_CODE_EXISTS' ? 409 : 400 });
  }
}

/** Enable / disable an existing code */
export async function PATCH(req: NextRequest) {
  const gate = await requirePlatformAdmin(req);
  if (!gate.ok) return gate.response;

  const body = (await req.json().catch(() => ({}))) as { code?: string; isActive?: unknown };
  if (!body.code || typeof body.isActive !== 'boolean') {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }
  const voucher = await dbRepo.setVoucherActive(body.code, body.isActive);
  if (!voucher) return NextResponse.json({ error: 'VOUCHER_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ voucher });
}

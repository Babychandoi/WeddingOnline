import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { TIER_CATALOG } from '@dco/shared';
import { BANK_NAMES } from '@/components/invitation/themes';
import { resolveRequestOrigin } from '@/lib/runtimeEnv';
import { getSessionFromRequest } from '@/lib/session';

const HOST_ROLES = new Set(['OWNER', 'BRIDE', 'GROOM']);

async function hostWedding(req: NextRequest, slug: string) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return { error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) } as const;
  const wedding = await dbRepo.getWeddingBySlug(slug);
  if (!wedding) return { error: NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 }) } as const;
  const member = await dbRepo.getMember(wedding.id, auth.user.id);
  if (wedding.ownerId !== auth.user.id && (!member || !HOST_ROLES.has(member.role))) {
    return { error: NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) } as const;
  }
  return { wedding } as const;
}

type Wedding = NonNullable<Awaited<ReturnType<typeof dbRepo.getWeddingBySlug>>>;

/** What the couple sees in the gift-box settings (their own account and SePay key: host only) */
function view(req: NextRequest, w: Wedding) {
  const allowed = TIER_CATALOG[w.tier].allowVietQr || Boolean(w.invitationOnly);
  const sepayKey = w.webhookProvider === 'SEPAY' && w.webhookSecretHash ? w.webhookSecretHash : '';
  return {
    allowed,
    bankBin: w.bankBin ?? '',
    bankAccountNo: w.bankAccountNo ?? '',
    bankAccountName: w.bankAccountName ?? '',
    banks: Object.entries(BANK_NAMES)
      .map(([bin, name]) => ({ bin, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi')),
    sepayKey,
    webhookUrl: `${resolveRequestOrigin(req)}/api/webhooks/sepay`,
    ready: allowed && Boolean(w.bankBin && w.bankAccountNo),
  };
}

export async function GET(req: NextRequest, context: { params: { slug: string } }) {
  const r = await hostWedding(req, context.params.slug);
  if ('error' in r) return r.error;
  return NextResponse.json(view(req, r.wedding), { headers: { 'Cache-Control': 'no-store' } });
}

/** "Nguyễn Văn Minh" → "NGUYEN VAN MINH", the way banks print account names */
function bankName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'D')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

export async function PUT(req: NextRequest, context: { params: { slug: string } }) {
  const r = await hostWedding(req, context.params.slug);
  if ('error' in r) return r.error;
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Parameters<typeof dbRepo.updateWedding>[1] = {};

  if (b.bankBin !== undefined && b.bankBin !== '') {
    if (typeof b.bankBin !== 'string' || !BANK_NAMES[b.bankBin]) {
      return NextResponse.json({ error: 'UNKNOWN_BANK', message: 'Ngân hàng chưa được hỗ trợ.' }, { status: 400 });
    }
    patch.bankBin = b.bankBin;
  }
  if (b.bankAccountNo !== undefined) {
    const no = typeof b.bankAccountNo === 'string' ? b.bankAccountNo.replace(/[\s.-]/g, '') : '';
    if (no && !/^\d{6,19}$/.test(no)) {
      return NextResponse.json({ error: 'INVALID_ACCOUNT_NO', message: 'Số tài khoản chỉ gồm 6–19 chữ số.' }, { status: 400 });
    }
    patch.bankAccountNo = no || null;
  }
  if (b.bankAccountName !== undefined) {
    const name = typeof b.bankAccountName === 'string' ? bankName(b.bankAccountName) : '';
    patch.bankAccountName = name || null;
  }
  // SePay: the couple pastes this key into their SePay webhook ("API Key" authentication)
  if (b.action === 'generate-key') {
    patch.webhookProvider = 'SEPAY';
    patch.webhookSecretHash = crypto.randomBytes(24).toString('base64url');
  } else if (b.action === 'remove-key') {
    patch.webhookProvider = null;
    patch.webhookSecretHash = null;
  }

  const updated = (await dbRepo.updateWedding(r.wedding.id, patch)) ?? r.wedding;
  return NextResponse.json(view(req, updated), { headers: { 'Cache-Control': 'no-store' } });
}

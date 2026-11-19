import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/adminAuth';
import {
  describePlatformSettings,
  isSettingsEncryptionReady,
  updatePlatformSettings,
} from '@/lib/platformSettings';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gate = await requirePlatformAdmin(req);
  if (!gate.ok) return gate.response;
  return NextResponse.json({
    settings: await describePlatformSettings(),
    encryptionReady: isSettingsEncryptionReady(),
  });
}

export async function PUT(req: NextRequest) {
  const gate = await requirePlatformAdmin(req);
  if (!gate.ok) return gate.response;

  const body = (await req.json().catch(() => null)) as {
    set?: Record<string, unknown>;
    clear?: unknown[];
  } | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
  }

  const result = await updatePlatformSettings(
    { set: body.set, clear: Array.isArray(body.clear) ? body.clear : [] },
    gate.auth.user.id
  );
  if (!result.ok) {
    return NextResponse.json({ error: 'VALIDATION_FAILED', errors: result.errors }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    settings: await describePlatformSettings(),
    encryptionReady: isSettingsEncryptionReady(),
  });
}

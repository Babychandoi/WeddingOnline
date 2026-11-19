import { NextRequest, NextResponse } from 'next/server';
import { getStorageDriver } from '@dco/database';
import { isHardenedProduction, isInsecureSecret } from '@dco/shared/server';
import { getPlatformSetting } from '@/lib/platformSettings';
import { getR2Config } from '@/lib/r2';
import { getRuntimeEnv, resolveRequestOrigin } from '@/lib/runtimeEnv';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const baseUrl = resolveRequestOrigin(req);

  const googleConfigured = Boolean(
    getRuntimeEnv('GOOGLE_CLIENT_ID') && getRuntimeEnv('GOOGLE_CLIENT_SECRET')
  );

  // Admin-managed settings; a broken settings store must not take the health check down
  let r2Configured = false;
  let sepayLiveConfigured = false;
  let platformBankConfigured = false;
  try {
    r2Configured = (await getR2Config()) !== null;
    sepayLiveConfigured = !isInsecureSecret(await getPlatformSetting('PLATFORM_SEPAY_API_KEY'), 16);
    platformBankConfigured = Boolean(
      (await getPlatformSetting('PLATFORM_BANK_BIN')) && (await getPlatformSetting('PLATFORM_BANK_ACCOUNT'))
    );
  } catch (err) {
    console.error('[health] platform settings unavailable:', err instanceof Error ? err.message : err);
  }

  return NextResponse.json({
    ok: true,
    service: '@dco/web',
    storageDriver: getStorageDriver(),
    authMode: 'google-only',
    devAuthEnabled: !isHardenedProduction(),
    publicOrigin: baseUrl,
    oauthConfigured: {
      google: googleConfigured,
    },
    googleRedirectUri: `${baseUrl}/api/auth/oauth/google`,
    sepayWebhookUrl: `${baseUrl}/api/webhooks/sepay`,
    r2Configured,
    sepayLiveConfigured,
    platformBankConfigured,
  });
}

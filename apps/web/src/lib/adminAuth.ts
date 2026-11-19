import { NextResponse, type NextRequest } from 'next/server';
import { isHardenedProduction } from '@dco/shared/server';
import { getSessionFromRequest } from './session';

type Auth = NonNullable<Awaited<ReturnType<typeof getSessionFromRequest>>>;

/**
 * Platform admins come from PLATFORM_ADMIN_EMAILS (comma-separated) in .env — never from
 * the database, so nobody can grant themselves admin through the UI. Read once at boot:
 * changing the list needs a web restart.
 */
function platformAdminEmails(): Set<string> {
  return new Set(
    (process.env.PLATFORM_ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

/** Platform admin accounts can never be locked from the console (no lock-out) */
export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && platformAdminEmails().has(email!.trim().toLowerCase());
}

export function isPlatformAdmin(auth: Auth | null): boolean {
  const email = auth?.user.email?.trim().toLowerCase();
  if (!auth || !email) return false;
  // On production only a Google-verified email counts (the dev login is disabled there anyway)
  if (isHardenedProduction() && auth.session.provider !== 'GOOGLE') return false;
  return platformAdminEmails().has(email);
}

export async function requirePlatformAdmin(
  req: NextRequest
): Promise<{ ok: true; auth: Auth } | { ok: false; response: NextResponse }> {
  const auth = await getSessionFromRequest(req);
  if (!auth) {
    return { ok: false, response: NextResponse.json({ error: 'OAUTH_REQUIRED' }, { status: 401 }) };
  }
  if (!isPlatformAdmin(auth)) {
    return { ok: false, response: NextResponse.json({ error: 'PLATFORM_ADMIN_ONLY' }, { status: 403 }) };
  }
  return { ok: true, auth };
}

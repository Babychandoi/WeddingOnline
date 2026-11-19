import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { requireSecret } from '@dco/shared/server';
import { getRuntimeEnv, resolveRequestOrigin } from '@/lib/runtimeEnv';
import { SESSION_COOKIE_NAME, signSessionCookie } from '@/lib/session';

const OAUTH_STATE_COOKIE = 'dco_oauth_state';

function getOAuthStateSecret(): string {
  return requireSecret('SESSION_SECRET', getRuntimeEnv('SESSION_SECRET'));
}

function sanitizeNextPath(rawNext: string | null | undefined): string {
  if (!rawNext || !rawNext.startsWith('/') || rawNext.startsWith('//')) return '/';
  return rawNext;
}

function signState(nextPath: string, nonce: string): string {
  const payload = {
    next: sanitizeNextPath(nextPath),
    nonce,
    exp: Date.now() + 10 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getOAuthStateSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyState(
  rawState: string | null,
  expectedNonce: string | undefined
): { next: string } | null {
  if (!rawState || !expectedNonce) return null;
  try {
    const parts = rawState.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getOAuthStateSecret())
      .update(encoded)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      next: string;
      nonce: string;
      exp: number;
    };
    if (!parsed.exp || Date.now() > parsed.exp || parsed.nonce !== expectedNonce) return null;
    return { next: sanitizeNextPath(parsed.next) };
  } catch {
    return null;
  }
}

async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{
  providerAccountId: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
}> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error('GOOGLE_TOKEN_EXCHANGE_FAILED');
  }

  const profileRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = (await profileRes.json()) as {
    sub?: string;
    name?: string;
    email?: string;
    email_verified?: boolean;
    picture?: string;
  };
  if (!profile.sub) {
    throw new Error('GOOGLE_PROFILE_FAILED');
  }
  // Only keep an email Google has verified — platform admin access is granted by email
  const verifiedEmail = profile.email && profile.email_verified === true ? profile.email : null;
  return {
    providerAccountId: profile.sub,
    displayName: profile.name || profile.email || 'Khách Google',
    email: verifiedEmail,
    avatarUrl: profile.picture ?? null,
  };
}

export async function GET(
  req: NextRequest,
  context: { params: { provider: string } }
) {
  const rawProvider = context.params.provider.toUpperCase();
  if (rawProvider !== 'GOOGLE') {
    return NextResponse.json(
      { error: 'GOOGLE_ONLY', message: 'Hệ thống chỉ hỗ trợ đăng nhập bằng Google.' },
      { status: 400 }
    );
  }

  const baseUrl = resolveRequestOrigin(req);
  const redirectUri = `${baseUrl}/api/auth/oauth/google`;
  const clientId = getRuntimeEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getRuntimeEnv('GOOGLE_CLIENT_SECRET');

  // Callback branch from Google OAuth 2.0
  const oauthProviderError = req.nextUrl.searchParams.get('error');
  if (oauthProviderError) {
    return NextResponse.redirect(new URL(`/?oauthError=${encodeURIComponent(oauthProviderError)}`, baseUrl));
  }

  const code = req.nextUrl.searchParams.get('code');
  const rawState = req.nextUrl.searchParams.get('state');
  if (code) {
    const cookieNonce = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
    const verified = verifyState(rawState, cookieNonce);
    if (!verified || !clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/?oauthError=invalid_state', baseUrl));
    }

    try {
      const profile = await exchangeGoogleCode(code, redirectUri, clientId, clientSecret);
      const user = await dbRepo.upsertOAuthUser({
        provider: 'GOOGLE',
        providerAccountId: profile.providerAccountId,
        displayName: profile.displayName,
        email: profile.email ?? null,
        avatarUrl: profile.avatarUrl ?? null,
      });

      if (user.isLocked) {
        const lockedRes = NextResponse.redirect(new URL('/?oauthError=account_locked', baseUrl));
        lockedRes.cookies.delete(OAUTH_STATE_COOKIE);
        lockedRes.cookies.delete(SESSION_COOKIE_NAME);
        return lockedRes;
      }

      const sessionToken = signSessionCookie({
        userId: user.id,
        provider: 'GOOGLE',
        displayName: user.displayName,
      });

      const res = NextResponse.redirect(new URL(verified.next, baseUrl));
      res.cookies.delete(OAUTH_STATE_COOKIE);
      res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: baseUrl.startsWith('https://'),
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
      return res;
    } catch {
      const errUrl = new URL(verified.next, baseUrl);
      errUrl.searchParams.set('oauthError', 'exchange_failed');
      return NextResponse.redirect(errUrl);
    }
  }

  // Initial authorization redirect to Google
  const nextPath = sanitizeNextPath(req.nextUrl.searchParams.get('next'));
  if (clientId && clientSecret) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const state = signState(nextPath, nonce);
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid profile email');
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('state', state);

    const res = NextResponse.redirect(authUrl);
    res.cookies.set(OAUTH_STATE_COOKIE, nonce, {
      httpOnly: true,
      sameSite: 'lax',
      secure: baseUrl.startsWith('https://'),
      path: '/',
      maxAge: 600,
    });
    return res;
  }

  const target = new URL(nextPath, baseUrl);
  target.searchParams.set('oauthError', 'google_not_configured');
  return NextResponse.redirect(target);
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}

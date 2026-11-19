import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import type { AuthProvider } from '@dco/shared';
import { isHardenedProduction } from '@dco/shared/server';
import { SESSION_COOKIE_NAME, signSessionCookie } from '@/lib/session';

const VALID_PROVIDERS = new Set<AuthProvider>(['ZALO', 'GOOGLE', 'FACEBOOK']);

/**
 * Dev-only login: trusts whatever identity the client sends, so it is disabled on
 * every production server regardless of whether Google OAuth is configured.
 */
export async function POST(req: NextRequest) {
  try {
    if (isHardenedProduction()) {
      return NextResponse.json(
        {
          error: 'GOOGLE_OAUTH_REQUIRED',
          message: 'Vui lòng đăng nhập qua tài khoản Google chính thức.',
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      provider?: AuthProvider;
      providerAccountId?: string;
      displayName?: string;
      email?: string;
    };

    const provider: AuthProvider =
      body.provider && VALID_PROVIDERS.has(body.provider) ? body.provider : 'GOOGLE';
    const displayName = (body.displayName || '').trim().slice(0, 60) || 'Khách Quý';
    const rawAccountId = (body.providerAccountId || '').trim();
    const providerAccountId =
      rawAccountId || `${provider.toLowerCase()}_${displayName.toLowerCase().replace(/\s+/g, '_')}`;

    const user = await dbRepo.upsertOAuthUser({
      provider,
      providerAccountId,
      displayName,
      email: body.email ?? null,
    });
    if (user.isLocked) {
      return NextResponse.json(
        { error: 'ACCOUNT_LOCKED', message: 'Tài khoản này đã bị khoá.' },
        { status: 403 }
      );
    }

    const cookieToken = signSessionCookie({
      userId: user.id,
      provider,
      displayName: user.displayName,
    });

    const res = NextResponse.json({
      ok: true,
      token: cookieToken,
      user: {
        id: user.id,
        displayName: user.displayName,
        provider,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, cookieToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch {
    return NextResponse.json({ error: 'AUTH_FAILED' }, { status: 400 });
  }
}

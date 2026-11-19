import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { signHandoffToken, verifyHandoffToken } from '@dco/shared/server';
import { SESSION_COOKIE_NAME, getSessionFromRequest, signSessionCookie } from '@/lib/session';

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = (await req.json()) as { slug?: string; tableNo?: number };
  if (!body.slug) {
    return NextResponse.json({ error: 'MISSING_SLUG' }, { status: 400 });
  }
  const token = signHandoffToken({
    userId: auth.user.id,
    slug: body.slug,
    tableNo: Number(body.tableNo ?? -1),
  });
  return NextResponse.json({
    handoffUrl: `/api/auth/handoff?token=${encodeURIComponent(token)}`,
  });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const payload = token ? verifyHandoffToken(token) : null;
  if (!payload) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  const user = await dbRepo.getUserById(payload.userId);
  if (!user) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const sessionToken = signSessionCookie({
    userId: user.id,
    provider: 'ZALO',
    displayName: user.displayName,
  });

  const dest = new URL(`/w/${encodeURIComponent(payload.slug)}`, req.url);
  if (payload.tableNo >= 0) {
    dest.searchParams.set('table', String(payload.tableNo));
  }

  const res = NextResponse.redirect(dest);
  res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}

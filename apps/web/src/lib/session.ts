import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { dbRepo, type UserRecord } from '@dco/database';
import type { AuthProvider } from '@dco/shared';
import { requireSecret } from '@dco/shared/server';

export const SESSION_COOKIE_NAME = 'dco_session';

export interface SessionData {
  userId: string;
  provider: AuthProvider;
  displayName: string;
  exp: number;
}

function getSecret(): string {
  return requireSecret('SESSION_SECRET');
}

export function signSessionCookie(data: Omit<SessionData, 'exp'>, ttlMs = 7 * 24 * 60 * 60 * 1000): string {
  const payload: SessionData = { ...data, exp: Date.now() + ttlMs };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionData | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expected = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionData;
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

  export async function getSessionFromRequest(
    req?: NextRequest
  ): Promise<{ session: SessionData; user: UserRecord } | null> {
    let raw: string | undefined;
    if (req) {
      raw = req.cookies.get(SESSION_COOKIE_NAME)?.value;
      if (!raw) {
        const auth = req.headers.get('authorization');
        if (auth?.startsWith('Bearer ')) raw = auth.slice(7).trim();
      }
    } else {
      raw = cookies().get(SESSION_COOKIE_NAME)?.value;
    }

    const session = verifySessionToken(raw);
    if (!session) return null;
    const user = await dbRepo.getUserById(session.userId);
    // A locked account's existing cookies stop working immediately
    if (!user || user.isLocked) return null;
    return { session, user };
  }

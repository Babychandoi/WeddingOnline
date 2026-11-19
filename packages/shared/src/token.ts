import crypto from 'node:crypto';
import { requireSecret } from './secrets';
import type { HandoffTokenPayload, JoinTokenPayload, RoleInviteTokenPayload } from './types';

export {
  DEV_SECRET_DEFAULTS,
  isHardenedProduction,
  isInsecureSecret,
  requireSecret,
  resolveSecret,
  type ManagedSecretName,
} from './secrets';
export { decryptSettingValue, encryptSettingValue } from './settingsCrypto';

function getSecret(): string {
  return requireSecret('SESSION_SECRET');
}

function signPayload<T extends object>(payload: T): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyPayload<T extends { exp: number }>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;
    const expected = crypto.createHmac('sha256', getSecret()).update(encoded).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T;
    if (!decoded.exp || Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function signJoinToken(payload: Omit<JoinTokenPayload, 'exp'>, ttlMs = 15 * 60 * 1000): string {
  return signPayload<JoinTokenPayload>({
    ...payload,
    exp: Date.now() + ttlMs,
  });
}

export function verifyJoinToken(token: string): JoinTokenPayload | null {
  return verifyPayload<JoinTokenPayload>(token);
}

export function signHandoffToken(payload: Omit<HandoffTokenPayload, 'exp'>, ttlMs = 60 * 1000): string {
  return signPayload<HandoffTokenPayload>({
    ...payload,
    exp: Date.now() + ttlMs,
  });
}

export function verifyHandoffToken(token: string): HandoffTokenPayload | null {
  return verifyPayload<HandoffTokenPayload>(token);
}

export function signRoleInviteToken(
  payload: Omit<RoleInviteTokenPayload, 'exp'>,
  ttlMs = 7 * 24 * 60 * 60 * 1000
): string {
  return signPayload<RoleInviteTokenPayload>({
    ...payload,
    exp: Date.now() + ttlMs,
  });
}

export function verifyRoleInviteToken(token: string): RoleInviteTokenPayload | null {
  return verifyPayload<RoleInviteTokenPayload>(token);
}

export function hashPin(pin: string): string {
  return crypto.createHmac('sha256', getSecret()).update(`pin:${pin}`).digest('hex');
}

export function verifyPin(pin: string, hash: string): boolean {
  const actual = Buffer.from(hashPin(pin));
  const expected = Buffer.from(hash);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

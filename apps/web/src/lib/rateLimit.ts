import type { NextRequest } from 'next/server';

/**
 * Small in-memory sliding-window limiter for anonymous endpoints (invitation wishes, RSVPs,
 * gift codes). One web container serves the site, so process memory is enough; a restart
 * simply forgets the windows.
 */
const hits = new Map<string, number[]>();
let lastSweep = Date.now();

/** Client address as Cloudflare / the proxy reports it */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/** True when the caller may proceed; records the hit */
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastSweep > 10 * 60 * 1000) {
    lastSweep = now;
    hits.forEach((times, k) => {
      if (times.every((t) => now - t > windowMs)) hits.delete(k);
    });
  }
  const times = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (times.length >= limit) {
    hits.set(key, times);
    return false;
  }
  times.push(now);
  hits.set(key, times);
  return true;
}

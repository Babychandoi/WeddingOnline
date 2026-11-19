import fs from 'node:fs';
import path from 'node:path';
import type { NextRequest } from 'next/server';

function findRootEnvPath(): string | null {
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, 'turbo.json'))) {
      return path.join(dir, '.env');
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function readKeyFromDotEnv(key: string): string | undefined {
  const envPath = findRootEnvPath();
  if (!envPath || !fs.existsSync(envPath)) return undefined;

  try {
    for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const k = line.slice(0, eq).trim();
      if (k !== key) continue;
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      return val.trim() || undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Reads dynamic credentials/settings with live reload from mounted/root .env,
 * falling back to process.env when .env does not set a non-empty value.
 */
export function getRuntimeEnv(key: string): string | undefined {
  const liveVal = readKeyFromDotEnv(key);
  if (liveVal !== undefined && liveVal !== '') {
    return liveVal;
  }
  const fromProc = process.env[key];
  if (fromProc !== undefined && fromProc.trim() !== '') {
    return fromProc.trim();
  }
  return undefined;
}

export function isLocalRequestHost(hostHeader: string | null | undefined): boolean {
  const h = (hostHeader || '').toLowerCase();
  return !h || h.startsWith('localhost') || h.startsWith('127.0.0.1') || h.startsWith('0.0.0.0');
}

export function resolveRequestOrigin(req: NextRequest): string {
  const fwdHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (fwdHost) {
    const cleanHost = fwdHost.split(',')[0].trim();
    const isLocal = isLocalRequestHost(cleanHost);
    const fwdProto = req.headers.get('x-forwarded-proto')?.split(',')[0].trim();
    const proto = fwdProto || (isLocal ? 'http' : 'https');
    return `${proto}://${cleanHost}`;
  }
  return (
    getRuntimeEnv('NEXT_PUBLIC_APP_URL') ||
    getRuntimeEnv('NEXTAUTH_URL') ||
    req.nextUrl.origin
  ).replace(/\/$/, '');
}

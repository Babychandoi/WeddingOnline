import fs from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { getLocalUploadDir } from '@/lib/r2';

function resolveSafePath(key: string): string | null {
  const base = getLocalUploadDir();
  const normalized = key.replace(/[^a-zA-Z0-9/_.-]/g, '_');
  const full = path.resolve(base, normalized);
  if (!full.startsWith(path.resolve(base))) return null;
  return full;
}

export async function PUT(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'MISSING_KEY' }, { status: 400 });
  const target = resolveSafePath(key);
  if (!target) return NextResponse.json({ error: 'INVALID_KEY' }, { status: 400 });

  fs.mkdirSync(path.dirname(target), { recursive: true });
  const buf = Buffer.from(await req.arrayBuffer());
  fs.writeFileSync(target, buf);
  return NextResponse.json({ ok: true, key });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'MISSING_KEY' }, { status: 400 });
  const target = resolveSafePath(key);
  if (!target || !fs.existsSync(target)) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
  const data = fs.readFileSync(target);
  const ext = path.extname(target).toLowerCase();
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return new NextResponse(data, {
    status: 200,
    headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=3600' },
  });
}

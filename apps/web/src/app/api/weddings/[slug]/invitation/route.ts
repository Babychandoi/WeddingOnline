import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { resolveInvitationConfig, sanitizeInvitationConfig } from '@dco/shared';
import { getSessionFromRequest } from '@/lib/session';

const HOST_ROLES = new Set(['OWNER', 'BRIDE', 'GROOM']);

async function hostWedding(req: NextRequest, slug: string) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return { error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) } as const;
  const wedding = await dbRepo.getWeddingBySlug(slug);
  if (!wedding) return { error: NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 }) } as const;
  const member = await dbRepo.getMember(wedding.id, auth.user.id);
  if (wedding.ownerId !== auth.user.id && (!member || !HOST_ROLES.has(member.role))) {
    return { error: NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) } as const;
  }
  return { wedding } as const;
}

/** The couple's invitation config plus their private RSVP list */
export async function GET(req: NextRequest, context: { params: { slug: string } }) {
  const r = await hostWedding(req, context.params.slug);
  if ('error' in r) return r.error;
  const config = resolveInvitationConfig(r.wedding.invitationConfig, r.wedding);
  const rsvps = await dbRepo.listInvitationRsvps(r.wedding.id);
  return NextResponse.json({ config, rsvps }, { headers: { 'Cache-Control': 'no-store' } });
}

/** Save the invitation (partial updates are merged over what is stored) */
export async function PUT(req: NextRequest, context: { params: { slug: string } }) {
  const r = await hostWedding(req, context.params.slug);
  if ('error' in r) return r.error;
  const body = (await req.json().catch(() => null)) as { config?: unknown } | null;
  if (!body || typeof body.config !== 'object' || body.config === null) {
    return NextResponse.json({ error: 'CONFIG_REQUIRED' }, { status: 400 });
  }
  const current = resolveInvitationConfig(r.wedding.invitationConfig, r.wedding);
  const next = sanitizeInvitationConfig(body.config, current);
  const updated = await dbRepo.updateWedding(r.wedding.id, { invitationConfig: next });
  if (!updated) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ config: next });
}

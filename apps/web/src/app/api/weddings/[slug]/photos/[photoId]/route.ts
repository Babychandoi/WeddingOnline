import { NextRequest, NextResponse } from 'next/server';
import { dbRepo } from '@dco/database';
import { resolveInvitationConfig } from '@dco/shared';
import { getSessionFromRequest } from '@/lib/session';

const HOST_ROLES = new Set(['OWNER', 'BRIDE', 'GROOM']);

/** The couple removes one of their photos (album, invitation cover, hall easels fall back on their own) */
export async function DELETE(req: NextRequest, context: { params: { slug: string; photoId: string } }) {
  const auth = await getSessionFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  const wedding = await dbRepo.getWeddingBySlug(context.params.slug);
  if (!wedding) return NextResponse.json({ error: 'WEDDING_NOT_FOUND' }, { status: 404 });
  const member = await dbRepo.getMember(wedding.id, auth.user.id);
  if (wedding.ownerId !== auth.user.id && (!member || !HOST_ROLES.has(member.role))) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }
  const removed = await dbRepo.deletePhoto(wedding.id, context.params.photoId);
  if (!removed) return NextResponse.json({ error: 'PHOTO_NOT_FOUND' }, { status: 404 });

  // The invitation must not keep pointing at a photo that is gone
  const config = resolveInvitationConfig(wedding.invitationConfig, wedding);
  if (config.coverPhotoUrl && config.coverPhotoUrl === removed.publicUrl) {
    await dbRepo.updateWedding(wedding.id, { invitationConfig: { ...config, coverPhotoUrl: '' } });
  }
  return NextResponse.json({ ok: true, photoId: removed.id });
}

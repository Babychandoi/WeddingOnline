import { NextRequest, NextResponse } from 'next/server';
import { dbRepo, toPublicWedding } from '@dco/database';
import {
  DEFAULT_VENUE_ID,
  isInvitationTemplateId,
  isVenueId,
  resolveInvitationConfig,
  sanitizeInvitationConfig,
  type TemplateId,
  type WeddingTier,
} from '@dco/shared';
import { getSessionFromRequest } from '@/lib/session';

export async function GET(req: NextRequest) {
  const mineOnly = req.nextUrl.searchParams.get('mine') === '1';
  if (mineOnly) {
    const auth = await getSessionFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    return NextResponse.json({
      weddings: (await dbRepo.listWeddings(auth.user.id)).map(toPublicWedding),
    });
  }
  return NextResponse.json({
    weddings: (await dbRepo.listWeddings()).map(toPublicWedding),
  });
}

export async function POST(req: NextRequest) {
  const auth = await getSessionFromRequest(req);
  if (!auth) {
    return NextResponse.json({ error: 'OAUTH_REQUIRED' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      slug?: string;
      title?: string;
      brideName?: string;
      groomName?: string;
      tier?: WeddingTier;
      templateId?: TemplateId;
      weddingDate?: string;
      /** Invitation template picked in the gallery before signing up */
      invitationTemplateId?: string;
      /** Only an online invitation (offline wedding): free, no 3D hall, never expires */
      invitationOnly?: boolean;
    };
    const invitationOnly = body.invitationOnly === true;

    const slug = (body.slug || '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug || slug.length < 3 || slug === 'plaza') {
      return NextResponse.json({ error: 'INVALID_SLUG' }, { status: 400 });
    }

    const tier: WeddingTier =
      !invitationOnly && (body.tier === 'HAPPINESS' || body.tier === 'VIP_FULFILLMENT') ? body.tier : 'TRIAL_24H';
    const templateId: TemplateId = isVenueId(body.templateId) ? body.templateId : DEFAULT_VENUE_ID;

    const weddingDate = body.weddingDate
      ? new Date(body.weddingDate).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { wedding, scene } = await dbRepo.createWedding({
      slug,
      title: (body.title || '').trim() || `Lễ Thành Hôn ${body.groomName || 'Chú Rể'} & ${body.brideName || 'Cô Dâu'}`,
      brideName: (body.brideName || '').trim() || 'Cô Dâu',
      groomName: (body.groomName || '').trim() || 'Chú Rể',
      ownerId: auth.user.id,
      tier,
      templateId,
      weddingDate,
      invitationOnly,
    });

    if (isInvitationTemplateId(body.invitationTemplateId) || invitationOnly) {
      const base = resolveInvitationConfig(null, wedding);
      await dbRepo.updateWedding(wedding.id, {
        invitationConfig: sanitizeInvitationConfig(
          {
            templateId: isInvitationTemplateId(body.invitationTemplateId) ? body.invitationTemplateId : base.templateId,
            // No 3D hall behind an invitation-only wedding
            sections: invitationOnly ? { ...base.sections, hall: false } : base.sections,
          },
          base,
        ),
      });
    }

    return NextResponse.json({ wedding: toPublicWedding(wedding), scene }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'CREATE_FAILED';
    return NextResponse.json({ error: msg }, { status: msg === 'SLUG_ALREADY_EXISTS' ? 409 : 400 });
  }
}

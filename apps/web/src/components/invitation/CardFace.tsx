'use client';

import React from 'react';
import type { InvitationTemplateId } from '@dco/shared';
import { InvitationCover } from './covers';
import { INVITATION_FONT_VARS } from './fonts';
import { SAMPLE_COUPLE, SAMPLE_PHOTOS } from './sampleInvitation';
import { INVITE_THEMES } from './themes';

/**
 * A template's cover at thumbnail size (gallery, editor picker). It is the real cover from the
 * invitation, laid out in container units, so the card shows exactly what guests will see.
 * Without the couple's own photo it uses the template's sample photos.
 */
export function CardFace({
  templateId,
  groom,
  bride,
  date = SAMPLE_COUPLE.weddingDate,
  cover,
  extras,
  className = '',
}: {
  templateId: InvitationTemplateId;
  groom: string;
  bride: string;
  /** Main ceremony, ISO */
  date?: string;
  cover?: string;
  extras?: string[];
  className?: string;
}) {
  const theme = INVITE_THEMES[templateId];
  const sample = SAMPLE_PHOTOS[templateId];
  const photo = cover || sample.cover;
  const rest = extras && extras.length > 0 ? extras : sample.photos.slice(1, 3).map((p) => p.url);
  return (
    <div className={`${INVITATION_FONT_VARS} relative aspect-[3/4] w-full overflow-hidden ${className}`} style={{ background: theme.paper, fontFamily: theme.body }} aria-hidden="true">
      <InvitationCover theme={theme} thumb data={{ groom, bride, date, headline: '', cover: photo, extras: rest, city: '' }} />
    </div>
  );
}

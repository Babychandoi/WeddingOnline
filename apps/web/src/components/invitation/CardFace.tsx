'use client';

import React from 'react';
import { isWalkthrough3DTemplate, type InvitationTemplateId } from '@dco/shared';
import { InvitationCover } from './covers';
import { INVITATION_FONT_VARS } from './fonts';
import { SAMPLE_COUPLE, SAMPLE_PHOTOS } from './sampleInvitation';
import { INVITE_THEMES } from './themes';
import { WalkthroughCardThumb } from './walkthrough3d/WalkthroughCardThumb';

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
  eager = false,
  className = '',
}: {
  templateId: InvitationTemplateId;
  groom: string;
  bride: string;
  /** Main ceremony, ISO */
  date?: string;
  cover?: string;
  extras?: string[];
  eager?: boolean;
  className?: string;
}) {
  const baseTheme = INVITE_THEMES[templateId];
  // Gallery thumbnails share 3 core preloaded fonts so browsing 100 templates never downloads 45 font files (1.1 MB).
  // Opening any template detail or live invitation still loads its full bespoke typeface.
  const theme = {
    ...baseTheme,
    display: 'var(--f-cormorant)',
    script: 'var(--f-dancing)',
    body: 'var(--f-be-vietnam)',
  };
  const sample = SAMPLE_PHOTOS[templateId];
  const photo = cover || sample.cover;
  const rest = extras && extras.length > 0 ? extras : sample.photos.slice(1, 3).map((p) => p.url);
  if (isWalkthrough3DTemplate(templateId)) {
    return (
      <div className={`${INVITATION_FONT_VARS} relative aspect-[3/4] w-full overflow-hidden ${className}`} style={{ background: theme.paper, fontFamily: theme.body }} aria-hidden="true">
        <WalkthroughCardThumb templateId={templateId} groom={groom} bride={bride} date={date} coupleCutoutUrl={cover} />
      </div>
    );
  }
  return (
    <div className={`${INVITATION_FONT_VARS} relative aspect-[3/4] w-full overflow-hidden ${className}`} style={{ background: theme.paper, fontFamily: theme.body }} aria-hidden="true">
      <InvitationCover theme={theme} thumb eager={eager} data={{ groom, bride, date, headline: '', cover: photo, extras: rest, city: '' }} />
    </div>
  );
}

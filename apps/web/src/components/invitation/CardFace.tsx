'use client';

import React from 'react';
import type { InvitationTemplateId } from '@dco/shared';
import { INVITATION_FONT_VARS } from './fonts';
import { Ornament } from './Ornaments';
import { INVITE_THEMES } from './themes';

const lastInitial = (s: string) => s.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? '';

/**
 * The front of a template's card at thumbnail size (gallery, editor picker). Type is sized in
 * container units so a name stays on one line whether the card is 90 px or 300 px wide.
 */
export function CardFace({ templateId, groom, bride, dateLine, className = '' }: { templateId: InvitationTemplateId; groom: string; bride: string; dateLine: string; className?: string }) {
  const t = INVITE_THEMES[templateId];
  const magazine = t.ornament === 'masthead';
  const accentText = t.accentText ?? t.accent;
  const frame =
    t.cardFrame === 'double'
      ? { border: `3px double ${t.line}` }
      : t.cardFrame === 'gold-inset'
        ? { border: `1px solid ${t.line}`, boxShadow: `inset 0 0 0 3px ${t.paper}, inset 0 0 0 4px ${t.line}88` }
        : t.cardFrame === 'hairline'
          ? { border: `1px solid ${t.line}` }
          : null;

  return (
    <div
      className={`${INVITATION_FONT_VARS} relative flex aspect-[3/4] w-full flex-col items-center overflow-hidden text-center [container-type:inline-size] ${className}`}
      style={{ background: t.paper, color: t.ink, fontFamily: t.body }}
      aria-hidden="true"
    >
      {frame && <div className="pointer-events-none absolute inset-[4cqw]" style={frame} />}
      {magazine ? (
        <div className="flex h-full w-full flex-col text-left">
          <div className="relative flex h-[58%] w-full items-end px-[7cqw] pb-[3cqw]" style={{ background: t.ink }}>
            <div className="absolute inset-x-[7cqw] top-[6cqw] flex justify-between text-[4.2cqw] font-bold uppercase tracking-[0.12em]" style={{ color: t.paper }}>
              <span>Số đặc biệt</span>
              <span>{dateLine.replace(/ /g, '')}</span>
            </div>
            <span className="text-[34cqw] font-black leading-[0.8] tracking-[-0.07em]" style={{ fontFamily: t.display, color: t.paper }}>
              {lastInitial(groom)}
              {lastInitial(bride)}
            </span>
          </div>
          <div className="mx-[7cqw] mt-[4cqw] h-[1.4cqw]" style={{ background: t.accent }} />
          <div className="px-[7cqw] pt-[3cqw] text-[9.5cqw] font-black uppercase leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: t.display }}>
            <span className="block whitespace-nowrap">{groom}</span>
            <span className="block whitespace-nowrap">
              <span className="mr-[1.5cqw] font-normal normal-case" style={{ color: accentText, fontFamily: t.script }}>
                &amp;
              </span>
              {bride}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center px-[6cqw] pt-[9cqw]">
          <div className="w-[78%] overflow-hidden">
            <Ornament kind={t.ornament} theme={t} variant="crown" />
          </div>
          <div
            className={`mt-[1cqw] ${t.namesUpper ? 'uppercase' : ''}`}
            style={
              t.namesIn === 'script'
                ? { fontFamily: t.script, fontSize: '14cqw', lineHeight: 1.05 }
                : { fontFamily: t.display, fontSize: t.namesUpper ? '10.5cqw' : '12cqw', lineHeight: 1.05, fontWeight: t.namesWeight ?? 600, letterSpacing: t.namesUpper ? '0.03em' : undefined }
            }
          >
            <span className="block whitespace-nowrap">{groom}</span>
            <span className="block text-[0.55em]" style={{ color: accentText, fontFamily: t.script }}>
              &amp;
            </span>
            <span className="block whitespace-nowrap">{bride}</span>
          </div>
          <div className="mb-[8cqw] mt-auto whitespace-nowrap border-y px-[4cqw] py-[1.2cqw] text-[5cqw] uppercase tracking-[0.14em]" style={{ borderColor: t.line, fontFamily: t.display }}>
            {dateLine}
          </div>
        </div>
      )}
    </div>
  );
}

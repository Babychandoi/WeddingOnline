'use client';

import React from 'react';
import type { Walkthrough3DTemplateId } from '@dco/shared';
import { CAMERA_FLIGHT_LABELS, formatWalkthroughDate, walkthrough3DTheme } from './themes3d';

/**
 * Pure HTML/CSS/SVG miniature composition of Frame 1 (sky + entrance gate + walkway + couple standee)
 * used in 100-card gallery grids & editors so ZERO WebGL contexts are allocated per thumbnail.
 */
export function WalkthroughCardThumb({
  templateId,
  groom,
  bride,
  date,
  coupleCutoutUrl,
}: {
  templateId: Walkthrough3DTemplateId;
  groom: string;
  bride: string;
  date: string;
  coupleCutoutUrl?: string;
}) {
  const t = walkthrough3DTheme(templateId);
  const standeeSrc = coupleCutoutUrl || `/invitation-3d/standees/standee-${t.standee}.webp`;
  const pathBg =
    t.pathStyle === 'red-carpet' || t.pathStyle === 'brick-red-carpet'
      ? 'linear-gradient(180deg, #9d1620 0%, #6d0d15 100%)'
      : t.pathStyle === 'royal-blue-carpet' || t.pathStyle === 'starlight-glass'
        ? 'linear-gradient(180deg, #324a8f 0%, #1d2c5e 100%)'
        : t.pathStyle === 'cloud-aisle' || t.pathStyle === 'marble-gold'
          ? 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(244,236,225,0.9) 100%)'
          : t.pathStyle === 'blush-carpet'
            ? 'linear-gradient(180deg, #fff5f8 0%, #f5d8e2 100%)'
            : t.pathStyle === 'sand-aisle'
              ? 'linear-gradient(180deg, #faf3e6 0%, #dfc298 100%)'
              : 'linear-gradient(180deg, #8b6a4e 0%, #5b422d 100%)';

  return (
    <div
      className="relative h-full w-full overflow-hidden select-none"
      style={{ backgroundColor: t.cardBgTint }}
    >
      {/* Painterly illustrated sky backdrop across all 100 3D templates */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/invitation-3d/${t.slug}/sky.webp`}
        alt=""
        width={800}
        height={1066}
        loading="lazy"
        className="absolute inset-0 h-[76%] w-full object-cover"
      />

      {/* Horizon & Ground strip */}
      <div
        className="absolute inset-x-0 bottom-0 h-[32%]"
        style={{
          background: `linear-gradient(180deg, ${t.fogColor}66 0%, ${t.groundColor} 42%, ${t.groundColor} 100%)`,
        }}
      />

      {/* Perspective walkway leading to entrance arch */}
      <div
        className="absolute bottom-[-2%] left-1/2 h-[33%] w-[78%] -translate-x-1/2"
        style={{
          background: pathBg,
          clipPath: 'polygon(36% 0%, 64% 0%, 96% 100%, 4% 100%)',
          borderLeft: `2px solid ${t.accentGold}99`,
          borderRight: `2px solid ${t.accentGold}99`,
          boxShadow: 'inset 0 8px 18px rgba(0,0,0,0.22)',
        }}
      />

      {/* Painterly illustrated entrance arch cutout across all 100 3D templates */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/invitation-3d/${t.slug}/arch.webp`}
        alt=""
        width={768}
        height={768}
        loading="lazy"
        className="absolute bottom-[19%] left-1/2 h-[48%] w-[88%] -translate-x-1/2 object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)]"
      />

      {/* Miniature couple standing at the gate */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={standeeSrc}
        alt=""
        width={640}
        height={960}
        loading="lazy"
        className="absolute bottom-[22%] left-[37%] h-[20%] w-auto object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.45)]"
      />

      {/* Top gradient scrim for legible calligraphy */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[44%]"
        style={{
          background: `linear-gradient(180deg, ${t.cardBgTint}cc 0%, ${t.cardBgTint}55 62%, transparent 100%)`,
        }}
      />

      {/* Calligraphic header */}
      <div className="absolute inset-x-2 top-[7%] text-center leading-tight">
        <p
          className="text-[7px] font-semibold uppercase tracking-[0.22em] opacity-90"
          style={{ color: t.titleColor }}
        >
          {t.kickerVi}
        </p>
        <p
          className="mt-1 text-[17px] leading-[1.06] drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] sm:text-[19px]"
          style={{ fontFamily: 'var(--f-imperial), var(--f-dancing), cursive', color: t.titleColor }}
        >
          {bride}
          <span className="mx-1 block text-[11px] opacity-90">&amp;</span>
          {groom}
        </p>
        <p
          className="mt-1 text-[8px] font-medium tracking-[0.14em] drop-shadow"
          style={{ color: '#fff8ec' }}
        >
          {formatWalkthroughDate(date)}
        </p>
      </div>

      {/* Camera choreography indicator pill */}
      <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[8.5px] font-bold tracking-wide text-amber-100 backdrop-blur-sm ring-1 ring-white/25">
        ✨ {CAMERA_FLIGHT_LABELS[t.cameraStyle]}
      </span>
    </div>
  );
}

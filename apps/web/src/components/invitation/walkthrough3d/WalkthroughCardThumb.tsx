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
      {/* Sky backdrop: raster webp for original 10, painterly multi-stop sky + SVG celestial/landscape for 90 procedural */}
      {t.hasRasterAssets ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/invitation-3d/${t.slug}/sky.webp`}
          alt=""
          width={960}
          height={1280}
          loading="lazy"
          className="absolute inset-0 h-[76%] w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 h-[76%] w-full"
          style={{
            background: `linear-gradient(180deg, ${t.skyTop} 0%, ${t.skyMid} 54%, ${t.skyHorizon} 100%)`,
          }}
        >
          {/* Sun / Moon glow */}
          <div
            className="absolute left-1/2 top-[52%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 blur-md"
            style={{ background: 'radial-gradient(circle, #fffbe8 0%, rgba(255,230,175,0) 72%)' }}
          />
          {/* Subtle mountain / skyline silhouette */}
          {(t.skyMood === 'misty-karst' || t.skyMood === 'alpine-dawn' || t.skyMood === 'emerald-forest') && (
            <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="absolute bottom-0 inset-x-0 h-[32%] w-full opacity-45">
              <path d="M0,60 L0,36 L34,14 L68,38 L108,8 L148,34 L178,18 L200,32 L200,60 Z" fill={t.fogColor} />
            </svg>
          )}
        </div>
      )}

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

      {/* Entrance arch: raster cutout for original 10, crisp SVG architectural silhouette for 90 procedural */}
      {t.hasRasterAssets ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/invitation-3d/${t.slug}/arch.webp`}
          alt=""
          width={900}
          height={900}
          loading="lazy"
          className="absolute bottom-[19%] left-1/2 h-[48%] w-[88%] -translate-x-1/2 object-contain drop-shadow-[0_10px_14px_rgba(0,0,0,0.35)]"
        />
      ) : (
        <svg
          viewBox="0 0 200 200"
          className="pointer-events-none absolute bottom-[19%] left-1/2 h-[46%] w-[84%] -translate-x-1/2 drop-shadow-[0_8px_12px_rgba(0,0,0,0.38)]"
        >
          {t.archStyle === 'crescent-moon' || t.archStyle === 'modern-halo' ? (
            <>
              <circle cx="100" cy="108" r="68" fill="none" stroke={t.accentGold} strokeWidth="6" strokeDasharray="320 120" transform="rotate(130 100 108)" />
              <circle cx="104" cy="108" r="60" fill="none" stroke={t.accentColor} strokeWidth="2.5" opacity="0.85" />
            </>
          ) : t.archStyle === 'traditional-tamquan' || t.archStyle === 'zen-torii' || t.archStyle === 'hoian-lanterns' ? (
            <>
              <rect x="36" y="48" width="10" height="142" rx="3" fill={t.archStyle === 'hoian-lanterns' ? '#d99b26' : '#991b1b'} />
              <rect x="154" y="48" width="10" height="142" rx="3" fill={t.archStyle === 'hoian-lanterns' ? '#d99b26' : '#991b1b'} />
              <path d="M18,52 Q100,28 182,52 L174,62 Q100,42 26,62 Z" fill={t.accentGold} />
              <rect x="30" y="66" width="140" height="7" rx="2" fill="#7f1d1d" />
              <circle cx="64" cy="82" r="7" fill="#ef4444" />
              <circle cx="136" cy="82" r="7" fill="#fbbf24" />
            </>
          ) : t.archStyle === 'cinema-marquee' ? (
            <>
              <rect x="34" y="44" width="132" height="146" rx="6" fill="none" stroke="#18181b" strokeWidth="12" />
              <rect x="34" y="40" width="132" height="22" rx="4" fill={t.accentColor} stroke={t.accentGold} strokeWidth="2.5" />
              {[52, 76, 100, 124, 148].map((cx) => (
                <circle key={cx} cx={cx} cy="51" r="3" fill="#fde68a" />
              ))}
            </>
          ) : (
            <>
              <path d="M42,190 L42,96 A58,58 0 0,1 158,96 L158,190" fill="none" stroke="#f8f4ec" strokeWidth="10" />
              <path d="M42,96 A58,58 0 0,1 158,96" fill="none" stroke={t.accentGold} strokeWidth="4" />
              {[46, 68, 100, 132, 154].map((cx, idx) => (
                <circle key={cx} cx={cx} cy={idx === 2 ? 38 : idx === 1 || idx === 3 ? 48 : 74} r="10" fill={idx % 2 === 0 ? t.accentColor : '#fff7ed'} />
              ))}
            </>
          )}
        </svg>
      )}

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

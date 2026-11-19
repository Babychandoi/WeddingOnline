'use client';

import React, { useId } from 'react';
import type { InviteTheme, OrnamentKind } from './themes';

/*
 * Hand-built SVG ornaments, one family per template. `crown` sits above the couple's names,
 * `divider` separates sections, `Seal` closes the envelope.
 */

/** One 喜 in seal style, drawn on a 46×100 grid */
function XiGlyph({ x, fill }: { x: number; fill: string }) {
  return (
    <g transform={`translate(${x} 0)`} fill={fill}>
      {/* 士 */}
      <rect x="3" y="6" width="40" height="6" rx="1" />
      <rect x="20" y="0" width="6" height="25" rx="1" />
      <rect x="9" y="19" width="28" height="5" rx="1" />
      {/* 口 */}
      <path d="M9 29h28v15H9zM15 34v5h16v-5z" fillRule="evenodd" />
      {/* 丷 */}
      <rect x="12" y="47" width="5" height="7" rx="1" transform="rotate(-18 14 50)" />
      <rect x="29" y="47" width="5" height="7" rx="1" transform="rotate(18 31 50)" />
      {/* 一 */}
      <rect x="0" y="56" width="46" height="6" rx="1" />
      {/* 口 */}
      <path d="M7 67h32v27H7zM13 73v15h20V73z" fillRule="evenodd" />
    </g>
  );
}

/** 囍: two 喜 side by side, their long strokes meeting */
export function SongHy({ size = 64, color }: { size?: number; color: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <XiGlyph x={2} fill={color} />
      <XiGlyph x={52} fill={color} />
      <rect x="40" y="6" width="20" height="6" fill={color} />
      <rect x="40" y="56" width="20" height="6" fill={color} />
    </svg>
  );
}

/** Square key-fret (hồi văn) band */
function FretBand({ width, color, y = 0 }: { width: number; color: string; y?: number }) {
  const unit = 12;
  const n = Math.floor(width / unit);
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = i * unit;
    d += `M${x} ${y + 10}V${y + 2}H${x + 9}V${y + 8}H${x + 4}V${y + 5}`;
  }
  return <path d={d} fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="square" />;
}

function CloudScroll({ x, y, s = 1, flip = false, color }: { x: number; y: number; s?: number; flip?: boolean; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} fill="none" stroke={color} strokeWidth={1.6 / s} strokeLinecap="round">
      <path d="M0 0c-8-10 4-22 15-15 6 4 4 13-3 13-5 0-6-6-2-7" />
      <path d="M15-15c4-14 26-14 30 0 3 10-7 17-14 11-5-4-2-11 3-10" />
      <path d="M45 0c10-6 22 2 18 12-3 7-12 6-12 0 0-4 5-5 7-2" />
      <path d="M-4 6c20 4 50 4 70 6" />
    </g>
  );
}

function LotusFlower({ cx, cy, s = 1, petal, petalDeep, leaf }: { cx: number; cy: number; s?: number; petal: string; petalDeep: string; leaf: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`}>
      <defs>
        <linearGradient id={`lp${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={petal} />
          <stop offset="1" stopColor={petalDeep} />
        </linearGradient>
      </defs>
      {/* Leaf pad behind */}
      <path d="M-46 22c10-16 82-16 92 0-20 10-72 10-92 0z" fill={leaf} opacity="0.85" />
      <path d="M0 18v-6M-20 20l10-6M20 20l-10-6" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
      {/* Outer petals */}
      <path d="M0 14C-30 12-38-6-34-18c14 2 28 14 34 32z" fill={`url(#lp${id})`} />
      <path d="M0 14C30 12 38-6 34-18c-14 2-28 14-34 32z" fill={`url(#lp${id})`} />
      <path d="M0 14C-18 4-20-20-12-34 0-24 6-6 0 14z" fill={`url(#lp${id})`} opacity="0.95" />
      <path d="M0 14C18 4 20-20 12-34 0-24-6-6 0 14z" fill={`url(#lp${id})`} opacity="0.95" />
      <path d="M0 16C-8 0-8-26 0-44 8-26 8 0 0 16z" fill={petal} />
      <path d="M0 14V-36" stroke={petalDeep} strokeOpacity="0.35" strokeWidth="0.8" />
    </g>
  );
}

function WatercolorRose({ cx, cy, r, colors, filterId }: { cx: number; cy: number; r: number; colors: [string, string, string]; filterId: string }) {
  const [light, mid, deep] = colors;
  return (
    <g filter={`url(#${filterId})`}>
      <circle cx={cx} cy={cy} r={r} fill={light} opacity="0.75" />
      <ellipse cx={cx - r * 0.18} cy={cy + r * 0.1} rx={r * 0.78} ry={r * 0.64} fill={mid} opacity="0.55" />
      <path
        d={`M${cx - r * 0.45} ${cy}c${r * 0.1}-${r * 0.5} ${r * 0.8}-${r * 0.5} ${r * 0.85} ${r * 0.05}c${r * 0.05} ${r * 0.45}-${r * 0.6} ${r * 0.5}-${r * 0.62} ${r * 0.1}c0-${r * 0.25} ${r * 0.35}-${r * 0.28} ${r * 0.38}-${r * 0.05}`}
        fill="none"
        stroke={deep}
        strokeWidth={r * 0.12}
        strokeLinecap="round"
        opacity="0.6"
      />
    </g>
  );
}

function Leaf({ x, y, rot, len, color, vein }: { x: number; y: number; rot: number; len: number; color: string; vein?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M0 0C${len * 0.3} -${len * 0.32} ${len * 0.75} -${len * 0.3} ${len} 0C${len * 0.75} ${len * 0.3} ${len * 0.3} ${len * 0.32} 0 0z`} fill={color} />
      {vein && <path d={`M0 0H${len * 0.92}`} stroke={vein} strokeWidth="0.7" opacity="0.6" />}
    </g>
  );
}

function EucalyptusBranch({ x, y, rot, scale, theme, flip = false }: { x: number; y: number; rot: number; scale: number; theme: InviteTheme; flip?: boolean }) {
  const leaves = [
    { t: 0.12, side: 1, r: 9 },
    { t: 0.24, side: -1, r: 10 },
    { t: 0.38, side: 1, r: 11 },
    { t: 0.52, side: -1, r: 11 },
    { t: 0.66, side: 1, r: 10 },
    { t: 0.8, side: -1, r: 8.5 },
    { t: 0.93, side: 1, r: 6.5 },
  ];
  const tones = ['#7d9a7a', '#91a98d', '#6c8768', '#a3b79f'];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -scale : scale} ${scale})`}>
      <path d="M0 0C30-8 70-6 120-24" fill="none" stroke="#6e6656" strokeWidth="1.6" strokeLinecap="round" />
      {leaves.map((l, i) => {
        const px = l.t * 120;
        const py = -l.t * l.t * 24 - l.t * 4;
        return <ellipse key={i} cx={px} cy={py + l.side * (l.r * 0.85)} rx={l.r} ry={l.r * 0.86} fill={tones[i % tones.length]} opacity="0.92" />;
      })}
    </g>
  );
}

function BaroqueScroll({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <g transform={flip ? 'scale(-1 1)' : undefined} fill="none" stroke={color} strokeLinecap="round">
      <path d="M8 30c18 0 30-12 52-12 26 0 34 20 18 24-12 3-14-12-4-12" strokeWidth="2" />
      <path d="M60 18c4-14 26-18 34-6 6 9-4 16-10 11-4-4 0-9 4-7" strokeWidth="1.6" />
      <path d="M94 30c14-6 28 0 30 10 2 8-8 11-12 5" strokeWidth="1.4" />
      <path d="M24 36c10 10 30 10 40 4" strokeWidth="1.2" />
      <path d="M40 18c-2-8 4-14 10-12" strokeWidth="1.2" />
    </g>
  );
}

function Heart({ x, y, s, color }: { x: number; y: number; s: number; color: string }) {
  return <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 4C0-2-8-4-8 2c0 5 8 9 8 11 0-2 8-6 8-11 0-6-8-4-8 2z" fill={color} />;
}

/** Single continuous-line rose */
function LineRose({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M0 0c-6-4-4-12 3-12 9 0 10 12 1 14-11 2-15-12-6-19 9-7 24 0 22 13-2 14-22 17-30 6" />
      <path d="M-10 2c-4 12 6 22 18 20 10-2 16-10 14-20" />
      <path d="M4 22c0 16-2 30-8 44" />
      <path d="M2 40c8-6 18-6 24 0-8 4-16 4-24 0z" />
      <path d="M-2 52c-8-5-16-4-20 2 6 3 14 3 20-2z" />
    </g>
  );
}

export function Ornament({ kind, theme, variant }: { kind: OrnamentKind; theme: InviteTheme; variant: 'crown' | 'divider' }) {
  const uid = useId().replace(/:/g, '');
  const a = theme.accent;
  const crown = variant === 'crown';

  switch (kind) {
    case 'song-hy':
      return crown ? (
        <svg viewBox="0 0 280 120" className="mx-auto h-auto w-[min(78%,300px)]" aria-hidden="true">
          <g opacity="0.85">
            <FretBand width={84} color={a} y={52} />
            <g transform="translate(196 0)">
              <FretBand width={84} color={a} y={52} />
            </g>
          </g>
          <circle cx="140" cy="60" r="56" fill="none" stroke={a} strokeWidth="2" />
          <circle cx="140" cy="60" r="49" fill="none" stroke={a} strokeWidth="0.8" />
          <g transform="translate(108 28)">
            <SongHy size={64} color={a} />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 240 24" className="mx-auto h-6 w-60" aria-hidden="true">
          <FretBand width={96} color={a} y={6} />
          <g transform="translate(108 0)">
            <SongHy size={24} color={a} />
          </g>
          <g transform="translate(144 0)">
            <FretBand width={96} color={a} y={6} />
          </g>
        </svg>
      );

    case 'clouds':
      return crown ? (
        <svg viewBox="0 0 300 110" className="mx-auto h-auto w-[min(84%,320px)]" aria-hidden="true">
          <CloudScroll x={34} y={70} s={1.1} color={a} />
          <CloudScroll x={266} y={70} s={1.1} flip color={a} />
          <circle cx="150" cy="56" r="34" fill="none" stroke={a} strokeWidth="1.4" />
          <circle cx="150" cy="56" r="28" fill="#b51a20" />
          <g transform="translate(128 34)">
            <SongHy size={44} color="#f6d48a" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 260 36" className="mx-auto h-9 w-64" aria-hidden="true">
          <CloudScroll x={20} y={26} s={0.7} color={a} />
          <CloudScroll x={240} y={26} s={0.7} flip color={a} />
          <circle cx="130" cy="20" r="3.5" fill={a} />
        </svg>
      );

    case 'lotus':
      return crown ? (
        <svg viewBox="0 0 300 130" className="mx-auto h-auto w-[min(82%,320px)]" aria-hidden="true">
          <LotusFlower cx={150} cy={78} s={1.25} petal="#f4a3b5" petalDeep="#c94f6d" leaf="#2f5d46" />
          <LotusFlower cx={70} cy={98} s={0.6} petal="#f7c0cc" petalDeep="#d9718a" leaf="#3d7058" />
          <LotusFlower cx={232} cy={98} s={0.6} petal="#f7c0cc" petalDeep="#d9718a" leaf="#3d7058" />
        </svg>
      ) : (
        <svg viewBox="0 0 240 40" className="mx-auto h-10 w-60" aria-hidden="true">
          <path d="M10 26H92M148 26H230" stroke={theme.line} strokeWidth="1" />
          <LotusFlower cx={120} cy={24} s={0.42} petal="#f4a3b5" petalDeep="#c94f6d" leaf="#2f5d46" />
        </svg>
      );

    case 'hairline':
      return (
        <svg viewBox="0 0 240 16" className={`mx-auto h-4 ${crown ? 'w-48' : 'w-40'}`} aria-hidden="true">
          <path d="M0 8H108M132 8H240" stroke={theme.ink} strokeWidth="0.75" />
          <path d="M120 2l6 6-6 6-6-6z" fill="none" stroke={theme.ink} strokeWidth="0.75" />
        </svg>
      );

    case 'watercolor': {
      const fid = `wc${uid}`;
      const roses: Array<[number, number, number, [string, string, string]]> = crown
        ? [
            [70, 64, 26, ['#f8c9cf', '#ee9aa6', '#c8737f']],
            [104, 48, 18, ['#fde0cf', '#f6b597', '#d98a6b']],
            [44, 40, 15, ['#fbe1e4', '#f2b5bf', '#c8737f']],
            [230, 64, 26, ['#f8c9cf', '#ee9aa6', '#c8737f']],
            [196, 48, 18, ['#fde0cf', '#f6b597', '#d98a6b']],
            [256, 40, 15, ['#fbe1e4', '#f2b5bf', '#c8737f']],
          ]
        : [[120, 18, 11, ['#f8c9cf', '#ee9aa6', '#c8737f']]];
      return (
        <svg viewBox={crown ? '0 0 300 110' : '0 0 240 36'} className={crown ? 'mx-auto h-auto w-[min(88%,340px)]' : 'mx-auto h-9 w-60'} aria-hidden="true">
          <defs>
            <filter id={fid} x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
              <feDisplacementMap in="SourceGraphic" scale="7" />
              <feGaussianBlur stdDeviation="0.8" />
            </filter>
          </defs>
          {crown ? (
            <>
              <Leaf x={18} y={74} rot={-20} len={34} color="#9db59a" vein="#6f8a6b" />
              <Leaf x={86} y={86} rot={20} len={30} color="#b2c6ac" vein="#6f8a6b" />
              <Leaf x={282} y={74} rot={200} len={34} color="#9db59a" vein="#6f8a6b" />
              <Leaf x={214} y={86} rot={160} len={30} color="#b2c6ac" vein="#6f8a6b" />
              <Leaf x={130} y={56} rot={-160} len={22} color="#c4d4bd" />
              <Leaf x={170} y={56} rot={-20} len={22} color="#c4d4bd" />
            </>
          ) : (
            <path d="M14 18H100M140 18H226" stroke={theme.line} strokeWidth="1" />
          )}
          {roses.map(([cx, cy, r, c], i) => (
            <WatercolorRose key={i} cx={cx} cy={cy} r={r} colors={c} filterId={fid} />
          ))}
        </svg>
      );
    }

    case 'eucalyptus':
      return crown ? (
        <svg viewBox="0 0 300 110" className="mx-auto h-auto w-[min(86%,330px)]" aria-hidden="true">
          <EucalyptusBranch x={150} y={84} rot={-160} scale={1.05} theme={theme} />
          <EucalyptusBranch x={150} y={84} rot={-20} scale={1.05} theme={theme} />
          <EucalyptusBranch x={150} y={90} rot={-98} scale={0.62} theme={theme} />
        </svg>
      ) : (
        <svg viewBox="0 0 240 40" className="mx-auto h-10 w-60" aria-hidden="true">
          <EucalyptusBranch x={120} y={26} rot={-176} scale={0.6} theme={theme} />
          <EucalyptusBranch x={120} y={26} rot={-4} scale={0.6} theme={theme} />
        </svg>
      );

    case 'lace': {
      const scallops = Array.from({ length: crown ? 14 : 10 }, (_, i) => i);
      const w = crown ? 280 : 200;
      const step = w / scallops.length;
      return (
        <svg viewBox={`0 0 ${w} ${crown ? 70 : 26}`} className={crown ? 'mx-auto h-auto w-[min(86%,320px)]' : 'mx-auto h-7 w-52'} aria-hidden="true">
          <g fill="none" stroke={a} strokeWidth="1">
            {scallops.map((i) => (
              <g key={i}>
                <path d={`M${i * step} 8a${step / 2} ${step / 2} 0 0 0 ${step} 0`} />
                <circle cx={i * step + step / 2} cy={8 + step / 4} r="1.4" fill={a} />
              </g>
            ))}
            <path d={`M0 6H${w}`} />
            <path d={`M0 2H${w}`} strokeDasharray="2 3" />
          </g>
          {crown && (
            <g transform={`translate(${w / 2} 46)`} fill="none" stroke={a} strokeWidth="1.2">
              <path d="M-36 0c12-14 24-14 36 0 12-14 24-14 36 0" />
              <path d="M0 0c-6 8-6 14 0 18 6-4 6-10 0-18z" fill={a} fillOpacity="0.25" />
              <circle cx="-44" cy="2" r="2" fill={a} />
              <circle cx="44" cy="2" r="2" fill={a} />
            </g>
          )}
        </svg>
      );
    }

    case 'baroque':
      return crown ? (
        <svg viewBox="0 0 300 90" className="mx-auto h-auto w-[min(86%,330px)]" aria-hidden="true">
          <g transform="translate(150 20)">
            <BaroqueScroll color={a} />
            <BaroqueScroll color={a} flip />
            <path d="M0 4l7 10-7 18-7-18z" fill={a} />
            <circle cx="0" cy="-4" r="4" fill="none" stroke={a} strokeWidth="1.4" />
          </g>
          <path d="M40 78H260" stroke={a} strokeWidth="0.8" />
          <path d="M70 84H230" stroke={a} strokeWidth="0.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 240 40" className="mx-auto h-10 w-60" aria-hidden="true">
          <g transform="translate(120 8) scale(0.62)">
            <BaroqueScroll color={a} />
            <BaroqueScroll color={a} flip />
            <path d="M0 4l6 9-6 14-6-14z" fill={a} />
          </g>
        </svg>
      );

    case 'ribbon':
      return crown ? (
        <svg viewBox="0 0 300 100" className="mx-auto h-auto w-[min(80%,300px)]" aria-hidden="true">
          <path d="M150 44c-22-26-58-26-54-6 3 14 34 12 54 6zM150 44c22-26 58-26 54-6-3 14-34 12-54 6z" fill={theme.line} />
          <path d="M150 44c-10 14-24 34-40 46M150 44c10 14 24 34 40 46" stroke={theme.line} strokeWidth="7" strokeLinecap="round" fill="none" />
          <circle cx="150" cy="44" r="8" fill={a} />
          <Heart x={64} y={34} s={1.4} color={a} />
          <Heart x={236} y={34} s={1.4} color={a} />
          <Heart x={40} y={60} s={0.8} color={theme.line} />
          <Heart x={260} y={60} s={0.8} color={theme.line} />
        </svg>
      ) : (
        <svg viewBox="0 0 240 30" className="mx-auto h-8 w-56" aria-hidden="true">
          <path d="M10 15H96M144 15H230" stroke={theme.line} strokeWidth="1.2" strokeDasharray="1 5" strokeLinecap="round" />
          <Heart x={110} y={8} s={0.9} color={theme.line} />
          <Heart x={130} y={8} s={1.1} color={a} />
        </svg>
      );

    case 'masthead':
      return (
        <svg viewBox="0 0 240 10" className={`mx-auto h-2.5 ${crown ? 'w-full' : 'w-24'}`} preserveAspectRatio="none" aria-hidden="true">
          <rect width="240" height={crown ? 10 : 4} fill={a} />
        </svg>
      );

    case 'waves':
      return (
        <svg viewBox="0 0 300 50" className={crown ? 'mx-auto h-auto w-[min(86%,330px)]' : 'mx-auto h-8 w-60'} aria-hidden="true">
          <path d="M0 22c25-14 50 14 75 0s50 14 75 0 50 14 75 0 50 14 75 0" fill="none" stroke={theme.line} strokeWidth="2" />
          <path d="M0 32c25-14 50 14 75 0s50 14 75 0 50 14 75 0 50 14 75 0" fill="none" stroke={a} strokeWidth="2" />
          {crown && <path d="M0 42c25-14 50 14 75 0s50 14 75 0 50 14 75 0 50 14 75 0" fill="none" stroke="#e9c46a" strokeWidth="1.5" />}
          {crown && <path d="M146 6l8 8-8 2-8-2z M150 4v12" fill="#e9c46a" stroke="#e9c46a" strokeWidth="0.8" />}
        </svg>
      );

    case 'rose-line':
      return crown ? (
        <svg viewBox="0 0 220 110" className="mx-auto h-auto w-[min(60%,240px)]" aria-hidden="true">
          <g transform="translate(110 30)">
            <LineRose color={a} />
          </g>
          <path d="M20 96c40-10 140-10 180 0" fill="none" stroke={theme.line} strokeWidth="1" />
        </svg>
      ) : (
        <svg viewBox="0 0 240 40" className="mx-auto h-10 w-60" aria-hidden="true">
          <path d="M12 22H96M144 22H228" stroke={theme.line} strokeWidth="1" />
          <g transform="translate(120 18) scale(0.45)">
            <LineRose color={a} />
          </g>
        </svg>
      );
  }
}

/** Wax / stamp seal for the envelope */
export function Seal({ theme, monogram }: { theme: InviteTheme; monogram: string }) {
  const { seal, sealInk } = theme.envelope;
  const songHy = theme.ornament === 'song-hy' || theme.ornament === 'clouds';
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]" aria-hidden="true">
      <path
        d="M60 6c8 0 10 6 17 8s14-1 18 5 0 12 3 18 9 9 8 17-8 9-9 16 4 13-1 19-12 3-18 6-9 11-18 11-11-8-18-11-14 1-18-5 0-12-3-18-9-9-8-17 8-9 9-16-4-13 1-19 12-3 18-6 9-11 18-11z"
        fill={seal}
      />
      <circle cx="60" cy="60" r="36" fill="none" stroke={sealInk} strokeOpacity="0.55" strokeWidth="1.5" />
      {songHy ? (
        <g transform="translate(38 38)">
          <SongHy size={44} color={sealInk} />
        </g>
      ) : (
        <text x="60" y="70" textAnchor="middle" fontSize="28" fill={sealInk} style={{ fontFamily: theme.script }}>
          {monogram}
        </text>
      )}
    </svg>
  );
}

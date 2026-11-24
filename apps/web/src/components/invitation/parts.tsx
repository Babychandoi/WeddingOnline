'use client';

import React from 'react';
import { Ornament } from './Ornaments';
import type { InviteTheme } from './themes';

/** Paper grain as a tiny SVG noise tile */
export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.4 0 0 0 0 0.3 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Dark papers take the grain lightened in, light papers darkened in */
export function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 110;
}

export function Grain({ paper, strength }: { paper: string; strength: number }) {
  const dark = isDark(paper);
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: GRAIN, opacity: Math.min(0.55, strength * (dark ? 1.1 : 0.8)), mixBlendMode: dark ? 'screen' : 'multiply' }}
      aria-hidden="true"
    />
  );
}

/** Sample photos ship in two sizes; grids and thumbnails take the 560 px one */
export function sized(url: string, small: boolean): string {
  return small && url.startsWith('/invitation-samples/') && !url.startsWith('/invitation-samples/sm/') ? url.replace('/invitation-samples/', '/invitation-samples/sm/') : url;
}

export function Photo({
  src,
  alt,
  theme,
  small = false,
  eager = false,
  className = '',
  style,
  position,
  zoom = false,
}: {
  src: string;
  alt: string;
  theme: InviteTheme;
  small?: boolean;
  eager?: boolean;
  className?: string;
  style?: React.CSSProperties;
  position?: string;
  /** Slow settle-in on the cover */
  zoom?: boolean;
}) {
  return (
    <img
      src={sized(src, small)}
      alt={alt || 'Ảnh cưới minh họa — DamCuoiOnline.vn'}
      width={small ? 420 : 900}
      height={small ? 560 : 1200}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      draggable={false}
      data-zoom={zoom ? '' : undefined}
      className={`select-none object-cover ${className}`}
      style={{ objectPosition: position, filter: theme.layout.photoFilter, ...style }}
    />
  );
}

/** Stand-in where a photo would go, until the couple uploads one */
export function PhotoSlot({ theme, className = '', style }: { theme: InviteTheme; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`grid place-items-center overflow-hidden ${className}`} style={{ background: `radial-gradient(circle at 50% 42%, ${theme.paper}, ${theme.panel})`, ...style }} aria-hidden="true">
      <div className="w-[62%] opacity-80">
        <Ornament kind={theme.ornament} theme={theme} variant="crown" />
      </div>
    </div>
  );
}

/** A photo, or its stand-in */
export function PhotoOr(props: React.ComponentProps<typeof Photo>) {
  if (!props.src) return <PhotoSlot theme={props.theme} className={props.className} style={props.style} />;
  return <Photo {...props} />;
}

/** Keep abbreviations with the word after them (TP. Huế, Q. 3) */
export const keepAbbr = (s: string) => s.replace(/\b(TP|Tp|Q|P|X|H|TT)\. /g, '$1. ');

/** The city of a Vietnamese address: its last part, without the "TP." prefix */
export function cityOf(address: string): string {
  const last = address.split(',').pop()?.trim() ?? '';
  return last.replace(/^(TP|Tp|Thành phố|Tỉnh)\.?\s+/u, '');
}

/** A person's name never breaks across lines unless it is unusually long */
export function Name({ children }: { children: string }) {
  return <span className={children.length <= 28 ? 'whitespace-nowrap' : undefined}>{children}</span>;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

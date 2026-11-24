'use client';

import React, { useId } from 'react';
import { Ornament, Seal, SongHy } from './Ornaments';
import type { CoverKind, InviteTheme } from './themes';
import { lunarLine, vnParts, vnTime } from './format';
import { PhotoOr, pad2, sized } from './parts';

/*
 * The first screen of each template. Every size inside is in container units (cqw) so the
 * same cover renders as a 120 px gallery thumbnail and as the full-screen opening card:
 * the thumbnail is the real cover, not a drawing of it.
 */

export interface CoverData {
  groom: string;
  bride: string;
  /** The main ceremony, ISO */
  date: string;
  headline: string;
  /** Cover photo URL, or '' */
  cover: string;
  /** Other photos, for covers that show more than one */
  extras: string[];
  /** Where the wedding is, for the date line */
  city: string;
}

interface CoverProps {
  theme: InviteTheme;
  data: CoverData;
  /** Gallery card: tighter, no secondary lines */
  thumb: boolean;
  /** Eager-load cover photo when rendered above the fold */
  eager?: boolean;
}

/** Use h1 only on the full invitation view; gallery/deck thumbnails emit p so hub pages keep a single H1 */
function CoverHeading({
  thumb,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { thumb: boolean; 'data-a'?: '' }) {
  return thumb ? <p {...props} /> : <h1 {...props} />;
}

/** Staggered rise-in when the invitation opens (see .inv-cover-in in InvitationView) */
function rise(d: number, style?: React.CSSProperties): { 'data-a': ''; style: React.CSSProperties } {
  return { 'data-a': '', style: { ...style, ['--d' as string]: d } };
}

const WHITE = '#fffdf8';
/** The panel tone for cover backgrounds: a dark panel (meant for event cards) becomes a light tint */
const softPanel = (t: InviteTheme) => (t.panelInk ? `color-mix(in srgb, ${t.line} 28%, ${t.paper})` : t.panel);
const alt = (d: CoverData) => `${d.groom} và ${d.bride}`;

/* ───────────── Song Hỷ: red dome, 囍 medallion, arched portrait ───────────── */

function DomeCover({ theme, data, thumb, eager = false }: CoverProps) {
  const arcId = `inv-arc-${useId().replace(/:/g, '')}`;
  const gold = theme.line;
  const nameStyle: React.CSSProperties = { fontFamily: theme.display, color: theme.onAccent, fontSize: '6.1cqw', lineHeight: 1.12, letterSpacing: '0.05em', width: 'min-content', margin: '0 auto' };
  return (
    <div className="relative flex h-full flex-col" style={{ background: theme.paper }}>
      <CoverHeading thumb={thumb} className="sr-only">
        {data.groom} &amp; {data.bride}
      </CoverHeading>
      {/* Dome */}
      <div className="relative z-[1] shrink-0" style={{ height: '46cqw' }}>
        <div className="absolute top-0 h-full" style={{ left: '-12cqw', right: '-12cqw', background: `radial-gradient(90% 120% at 50% 0%, ${theme.accent} 40%, ${theme.ground} 100%)`, borderRadius: '0 0 50% 50% / 0 0 52% 52%' }} />
        <div className="absolute top-0" style={{ left: '-9cqw', right: '-9cqw', bottom: '2.2cqw', borderBottom: `0.35cqw solid ${gold}`, borderRadius: '0 0 50% 50% / 0 0 52% 52%', opacity: 0.85 }} />
        <div className="relative grid grid-cols-[1fr_24cqw_1fr] items-start" style={{ paddingTop: '9cqw', paddingInline: '5cqw' }}>
          <p className="text-center uppercase" {...rise(1, nameStyle)}>
            {data.groom}
          </p>
          <div className="relative mx-auto grid place-items-center rounded-full" {...rise(0, { width: '21cqw', height: '21cqw', border: `0.45cqw solid ${gold}`, boxShadow: `inset 0 0 0 0.9cqw ${theme.accent}, inset 0 0 0 1.05cqw ${gold}`, marginTop: '-2cqw' })}>
            <div className="[&_svg]:h-full [&_svg]:w-full" style={{ width: '11cqw', height: '11cqw' }}>
              <SongHy color={gold} />
            </div>
          </div>
          <p className="text-center uppercase" {...rise(1, nameStyle)}>
            {data.bride}
          </p>
        </div>
      </div>

      {/* Arched portrait, rising into the dome */}
      <div className="relative z-[2] min-h-0 flex-1" style={{ marginTop: '-15cqw', paddingInline: '18cqw' }}>
        <svg viewBox="0 0 80 22" className="absolute left-1/2 -translate-x-1/2" style={{ width: '80cqw', top: '-7.2cqw' }} aria-hidden="true">
          <path id={arcId} d="M10.45 16.11 A37.5 37.5 0 0 1 69.55 16.11" fill="none" />
          <text fill={gold} style={{ fontFamily: theme.body, fontSize: 2.5, letterSpacing: '0.42em' }}>
            <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
              {theme.layout.kicker.toUpperCase()}
            </textPath>
          </text>
        </svg>
        <div className="relative h-full" {...rise(2)}>
          <div className="absolute rounded-t-full" style={{ inset: '-1.6cqw', border: `0.3cqw solid ${gold}`, borderBottom: 'none' }} />
          <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb || Boolean(eager)} className="block h-full w-full rounded-t-full" position="50% 30%" />
        </div>
      </div>

      {/* Date block */}
      <div className="shrink-0 text-center" {...rise(3, { padding: thumb ? '4cqw 8cqw 7cqw' : '6cqw 8cqw 9cqw' })}>
        {!thumb && (
          <p className="uppercase" style={{ fontSize: '2.9cqw', letterSpacing: '0.24em', color: theme.inkSoft, marginBottom: '3cqw' }}>
            {data.headline}
          </p>
        )}
        <DateRow theme={theme} date={data.date} />
        {!thumb && (
          <p className="italic" style={{ fontSize: '3.1cqw', color: theme.inkSoft, marginTop: '2.4cqw' }}>
            ({lunarLine(data.date)})
          </p>
        )}
      </div>
    </div>
  );
}

/** Weekday | DAY | month & year, between rules */
function DateRow({ theme, date, color, rule }: { theme: InviteTheme; date: string; color?: string; rule?: string }) {
  const p = vnParts(date);
  const line = rule ?? theme.line;
  const side: React.CSSProperties = { borderTop: `0.25cqw solid ${line}`, borderBottom: `0.25cqw solid ${line}`, padding: '1.4cqw 0', fontSize: '3.3cqw', letterSpacing: '0.16em', lineHeight: 1.25 };
  return (
    <div className="mx-auto grid grid-cols-[1fr_auto_1fr] items-center uppercase" style={{ maxWidth: '74cqw', gap: '4cqw', fontFamily: theme.display, color: color ?? theme.ink }}>
      <div style={side}>{p.weekday}</div>
      <div className="tabular-nums" style={{ fontSize: '13cqw', lineHeight: 1, color: color ?? theme.accentText ?? theme.accent }}>
        {pad2(p.day)}
      </div>
      <div style={side}>
        Tháng {p.month}
        <span className="block tabular-nums">{p.year}</span>
      </div>
    </div>
  );
}

/* ───────────── Sơn mài: lacquer field, round portrait ringed in gold ───────────── */

function MedallionCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const gold = theme.accent;
  const corner = (pos: React.CSSProperties, rot: number) => (
    <svg viewBox="0 0 40 40" className="absolute" style={{ width: '13cqw', height: '13cqw', ...pos, transform: `rotate(${rot}deg)` }} aria-hidden="true">
      <path d="M2 38V8a6 6 0 0 1 6-6h30" fill="none" stroke={gold} strokeWidth="1.2" />
      <path d="M7 38V13a6 6 0 0 1 6-6h25" fill="none" stroke={gold} strokeWidth="0.6" />
      <path d="M13 13c5 0 7 3 7 7-4 0-7-2-7-7z" fill={gold} />
    </svg>
  );
  return (
    <div className="relative flex h-full flex-col items-center justify-center text-center" style={{ background: `radial-gradient(70% 55% at 50% 40%, ${theme.panelInk ? `color-mix(in srgb, ${theme.line} 38%, ${theme.paper})` : theme.panel} 0%, ${theme.paper} 70%)`, gap: thumb ? '2.6cqw' : '4cqw' }}>
      {corner({ left: '6cqw', top: '6cqw' }, 0)}
      {corner({ right: '6cqw', top: '6cqw' }, 90)}
      {corner({ right: '6cqw', bottom: '6cqw' }, 180)}
      {corner({ left: '6cqw', bottom: '6cqw' }, 270)}
      <p className="uppercase" {...rise(0, { fontSize: '3cqw', letterSpacing: '0.42em', color: gold })}>
        {theme.layout.kicker}
      </p>
      <div className="relative rounded-full" {...rise(1, { width: thumb ? '56cqw' : '62cqw', height: thumb ? '56cqw' : '62cqw', padding: '2cqw', border: `0.4cqw solid ${gold}`, boxShadow: `0 0 0 1.4cqw ${theme.paper}, 0 0 0 1.6cqw ${gold}99, 0 2cqw 8cqw rgba(0,0,0,0.5)` })}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="block h-full w-full rounded-full" position="50% 35%" />
      </div>
      <CoverHeading thumb={thumb} className="uppercase" {...rise(2, { fontFamily: theme.display, fontWeight: 600, fontSize: '6.6cqw', lineHeight: 1.15, letterSpacing: '0.08em', color: theme.ink, marginTop: thumb ? 0 : '1cqw' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block normal-case" style={{ fontFamily: theme.script, fontSize: '8cqw', lineHeight: 0.9, color: gold, letterSpacing: 0, fontWeight: 400 }}>
          &amp;
        </span>
        <span className="block whitespace-nowrap">{data.bride}</span>
      </CoverHeading>
      <div {...rise(3)}>
        <div className="flex items-center justify-center" style={{ gap: '3cqw', fontFamily: theme.display, color: gold, fontSize: '4.4cqw', letterSpacing: '0.22em' }}>
          <span style={{ width: '10cqw', height: '0.25cqw', background: gold }} />
          <span className="tabular-nums">
            {pad2(p.day)} · {pad2(p.month)} · {p.year}
          </span>
          <span style={{ width: '10cqw', height: '0.25cqw', background: gold }} />
        </div>
        {!thumb && (
          <p className="italic" style={{ fontSize: '3cqw', color: theme.inkSoft, marginTop: '2cqw' }}>
            {p.weekday} · {lunarLine(data.date)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────── Sen hồng: arched portrait, cut-out peonies across the corners ───────────── */

function ArchFloralCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const floral = theme.layout.floral;
  return (
    <div className="relative flex h-full flex-col items-center text-center" style={{ background: `linear-gradient(${theme.paper}, ${softPanel(theme)})` }}>
      <p className="uppercase" {...rise(0, { fontFamily: theme.display, fontSize: '3.3cqw', letterSpacing: '0.42em', color: theme.inkSoft, paddingTop: thumb ? '8cqw' : '11cqw' })}>
        {theme.layout.kicker}
      </p>
      <div className="relative min-h-0 w-[64cqw] flex-1" {...rise(1, { marginTop: thumb ? '5cqw' : '7cqw' })}>
        <div className="absolute rounded-t-full" style={{ inset: '-2.6cqw', border: `0.3cqw solid ${theme.line}` }} />
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="relative block h-full w-full rounded-t-full rounded-b-[1.2cqw]" position="50% 30%" />
        {floral && (
          <>
            <img src={floral} alt="" aria-hidden="true" width={760} height={437} loading="lazy" decoding="async" className="pointer-events-none absolute max-w-none" style={{ width: '58cqw', left: '-30cqw', top: '6%', transform: 'rotate(-28deg) scaleX(-1)' }} />
            <img src={floral} alt="" aria-hidden="true" width={760} height={437} loading="lazy" decoding="async" className="pointer-events-none absolute max-w-none" style={{ width: '52cqw', right: '-27cqw', bottom: '-6cqw', transform: 'rotate(-12deg)' }} />
          </>
        )}
      </div>
      <CoverHeading thumb={thumb} className="[text-wrap:balance]" {...rise(2, { fontFamily: theme.script, fontSize: '12.5cqw', lineHeight: 1.05, color: theme.accentText ?? theme.accent, padding: thumb ? '4cqw 6cqw 0' : '6cqw 6cqw 0' })}>
        {data.groom} <span style={{ fontSize: '0.6em' }}>&amp;</span> {data.bride}
      </CoverHeading>
      <div {...rise(3, { padding: thumb ? '2cqw 0 7cqw' : '3cqw 0 10cqw' })}>
        <p className="tabular-nums uppercase" style={{ fontFamily: theme.display, fontSize: '4.6cqw', letterSpacing: '0.3em', color: theme.ink }}>
          {pad2(p.day)} · {pad2(p.month)} · {p.year}
        </p>
        {!thumb && (
          <p className="italic" style={{ fontSize: '3.1cqw', color: theme.inkSoft, marginTop: '1.4cqw' }}>
            {p.weekday} · {lunarLine(data.date)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────── Tối giản: stationery-shop minimal ───────────── */

function EditorialCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const small: React.CSSProperties = { fontSize: '2.6cqw', letterSpacing: '0.34em' };
  return (
    <div className="relative flex h-full flex-col" style={{ background: theme.paper, paddingInline: '8cqw' }}>
      <div className="flex shrink-0 items-center justify-between uppercase" {...rise(0, { ...small, paddingTop: '8cqw', paddingBottom: '3cqw', borderBottom: `1px solid ${theme.ink}` })}>
        <span>{theme.layout.kicker}</span>
        <span className="tabular-nums">
          {pad2(p.day)}.{pad2(p.month)}.{String(p.year).slice(2)}
        </span>
      </div>
      <CoverHeading thumb={thumb} className="shrink-0 text-center" {...rise(1, { fontFamily: theme.display, fontWeight: 400, fontSize: '12.6cqw', lineHeight: 1.02, letterSpacing: '-0.01em', padding: thumb ? '7cqw 0 6cqw' : '11cqw 0 9cqw' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block italic" style={{ fontFamily: theme.script, fontSize: '0.42em', lineHeight: 1.5, color: theme.inkSoft }}>
          và
        </span>
        <span className="block whitespace-nowrap">{data.bride}</span>
      </CoverHeading>
      <div className="relative min-h-0 flex-1" {...rise(2)}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="absolute inset-0 h-full w-full" position={theme.layout.coverPosition ?? '50% 50%'} />
      </div>
      <div className="shrink-0 text-center uppercase" {...rise(3, { ...small, padding: thumb ? '5cqw 0 7cqw' : '8cqw 0 10cqw', lineHeight: 2 })}>
        <p>
          {p.weekday} — {p.day} tháng {p.month} — {p.year}
        </p>
        {data.city && !thumb && <p style={{ color: theme.inkSoft }}>{data.city}</p>}
      </div>
    </div>
  );
}

/* ───────────── Màu nước: washes behind an oval portrait ───────────── */

function OvalWashCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const floral = theme.layout.floral;
  const wash = (pos: React.CSSProperties, color: string) => (
    <div className="pointer-events-none absolute rounded-full" style={{ ...pos, background: `radial-gradient(closest-side, ${color}, transparent)`, filter: 'blur(2cqw)' }} aria-hidden="true" />
  );
  return (
    <div className="relative flex h-full flex-col items-center overflow-hidden text-center" style={{ background: theme.paper }}>
      {wash({ width: '90cqw', height: '80cqw', left: '-30cqw', top: '-18cqw' }, `color-mix(in srgb, ${theme.line} 70%, transparent)`)}
      {wash({ width: '80cqw', height: '80cqw', right: '-34cqw', top: '30%' }, `color-mix(in srgb, ${theme.petals[2] ?? theme.petals[0] ?? theme.line} 60%, transparent)`)}
      {wash({ width: '90cqw', height: '70cqw', left: '-20cqw', bottom: '-26cqw' }, `color-mix(in srgb, ${theme.accent} 28%, transparent)`)}
      <p {...rise(0, { fontFamily: theme.script, fontSize: '8.6cqw', color: theme.accentText ?? theme.accent, paddingTop: thumb ? '7cqw' : '10cqw', lineHeight: 1.2 })}>{theme.layout.kicker}</p>
      <div className="relative min-h-0 flex-1" {...rise(1, { width: '60cqw', marginTop: '3cqw' })}>
        <PhotoOr
          src={data.cover}
          alt={alt(data)}
          theme={theme}
          small={thumb}
          eager
          className="block h-full w-full rounded-[50%]"
          style={{ border: '1.4cqw solid #fff', boxShadow: '0 2cqw 6cqw -2cqw rgba(120,60,70,0.35)' }}
          position="50% 35%"
        />
        {floral && (
          <>
            <img src={floral} alt="" aria-hidden="true" width={760} height={437} loading="lazy" decoding="async" className="pointer-events-none absolute max-w-none" style={{ width: '58cqw', left: '-24cqw', bottom: '-7cqw', transform: 'rotate(-14deg)' }} />
            <img src={floral} alt="" aria-hidden="true" width={760} height={437} loading="lazy" decoding="async" className="pointer-events-none absolute max-w-none" style={{ width: '34cqw', right: '-19cqw', top: '52%', transform: 'rotate(118deg)' }} />
          </>
        )}
      </div>
      <CoverHeading thumb={thumb} className="[text-wrap:balance]" {...rise(2, { fontFamily: theme.script, fontSize: '11.4cqw', lineHeight: 1.1, color: theme.ink, padding: thumb ? '4cqw 6cqw 0' : '6cqw 6cqw 0' })}>
        {data.groom} <span style={{ color: theme.accentText ?? theme.accent }}>&amp;</span> {data.bride}
      </CoverHeading>
      <div {...rise(3, { padding: thumb ? '1cqw 0 7cqw' : '2cqw 0 10cqw' })}>
        <p className="tabular-nums uppercase" style={{ fontFamily: theme.display, fontWeight: 500, fontSize: '4.4cqw', letterSpacing: '0.32em' }}>
          {pad2(p.day)} · {pad2(p.month)} · {p.year}
        </p>
        {!thumb && (
          <p className="italic" style={{ fontSize: '3.1cqw', color: theme.inkSoft, marginTop: '1.4cqw' }}>
            {p.weekday} · {lunarLine(data.date)}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────── Full-bleed photo covers ───────────── */

function FullPhoto({ theme, data, thumb, position, overlay }: CoverProps & { position?: string; overlay: string }) {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden" style={{ background: theme.ground }}>
        {data.cover && <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} zoom={!thumb} className="absolute inset-0 h-full w-full" position={position} />}
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ background: overlay }} aria-hidden="true" />
    </>
  );
}

function PosterCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const shade = '#192319';
  return (
    <div className="relative h-full text-center" style={{ color: WHITE }}>
      <FullPhoto theme={theme} data={data} thumb={thumb} position="50% 40%" overlay={`linear-gradient(to bottom, ${shade}a6 0%, ${shade}33 16%, transparent 28%, transparent 46%, ${shade}d9 100%)`} />
      <div className="relative flex items-center justify-center uppercase" {...rise(0, { gap: '3cqw', paddingTop: '9cqw', fontSize: '2.6cqw', letterSpacing: '0.46em', fontFamily: theme.display })}>
        <span style={{ width: '9cqw', height: '1px', background: WHITE }} />
        Save the date
        <span style={{ width: '9cqw', height: '1px', background: WHITE }} />
      </div>
      <div className="absolute inset-x-0 bottom-0" style={{ padding: thumb ? '0 7cqw 8cqw' : '0 7cqw 12cqw' }}>
        <p {...rise(1, { fontFamily: theme.script, fontSize: '9cqw', lineHeight: 1.1 })}>{theme.layout.kicker}</p>
        <CoverHeading thumb={thumb} className="uppercase [text-wrap:balance]" {...rise(2, { fontFamily: theme.display, fontWeight: 300, fontSize: '6.4cqw', letterSpacing: '0.2em', lineHeight: 1.35, marginTop: '2cqw' })}>
          {data.groom} &amp; {data.bride}
        </CoverHeading>
        <div className="flex items-center justify-center tabular-nums" {...rise(3, { gap: '3.4cqw', fontFamily: theme.display, fontSize: '4.4cqw', letterSpacing: '0.18em', marginTop: '4cqw' })}>
          <span>{pad2(p.day)}</span>
          <span style={{ width: '1px', height: '5cqw', background: WHITE }} />
          <span>{pad2(p.month)}</span>
          <span style={{ width: '1px', height: '5cqw', background: WHITE }} />
          <span>{p.year}</span>
        </div>
        {!thumb && (
          <p style={{ fontSize: '3cqw', marginTop: '2.4cqw', opacity: 0.88 }}>
            {p.weekday} · {lunarLine(data.date)}
          </p>
        )}
      </div>
    </div>
  );
}

function NoirCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const gold = theme.accent;
  return (
    <div className="relative h-full text-center" style={{ color: theme.ink }}>
      <FullPhoto
        theme={theme}
        data={data}
        thumb={thumb}
        position="50% 40%"
        overlay="linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.12) 52%, rgba(0,0,0,0.88) 100%), radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)"
      />
      {(thumb || theme.cardFrame === 'none') && (
        <>
          <div className="pointer-events-none absolute" style={{ inset: '4.5cqw', border: `0.35cqw solid ${gold}` }} aria-hidden="true" />
          <div className="pointer-events-none absolute" style={{ inset: '6.2cqw', border: `0.12cqw solid ${gold}aa` }} aria-hidden="true" />
        </>
      )}
      <div className="relative" {...rise(0, { paddingTop: '11cqw' })}>
        <div className="mx-auto" style={{ width: '44cqw' }}>
          <Ornament kind="baroque" theme={theme} variant="divider" />
        </div>
        <p className="uppercase" style={{ fontFamily: theme.display, fontSize: '3.1cqw', letterSpacing: '0.44em', color: gold, marginTop: '1.4cqw' }}>
          {theme.layout.kicker}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0" style={{ padding: thumb ? '0 8cqw 11cqw' : '0 8cqw 15cqw' }}>
        <CoverHeading thumb={thumb} {...rise(1, { fontFamily: theme.script, fontSize: '12.4cqw', lineHeight: 1.05, color: '#f3e6c4' })}>
          <span className="block whitespace-nowrap">{data.groom}</span>
          <span className="block" style={{ fontSize: '0.55em', color: gold }}>
            &amp;
          </span>
          <span className="block whitespace-nowrap">{data.bride}</span>
        </CoverHeading>
        <div className="flex items-center justify-center tabular-nums uppercase" {...rise(2, { gap: '3cqw', fontFamily: theme.display, fontWeight: 500, fontSize: '4cqw', letterSpacing: '0.34em', color: gold, marginTop: '4cqw' })}>
          <span style={{ width: '8cqw', height: '1px', background: gold }} />
          {pad2(p.day)} · {pad2(p.month)} · {p.year}
          <span style={{ width: '8cqw', height: '1px', background: gold }} />
        </div>
        {!thumb && (
          <p className="uppercase" {...rise(3, { fontSize: '2.7cqw', letterSpacing: '0.3em', marginTop: '2.4cqw', color: theme.inkSoft })}>
            {p.weekday}
            {data.city ? ` · ${data.city}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

function MagazineCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const red = theme.accent;
  return (
    <div className="relative h-full" style={{ color: '#ffffff' }}>
      <FullPhoto theme={theme} data={data} thumb={thumb} position="50% 70%" overlay="linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, transparent 26%, transparent 55%, rgba(0,0,0,0.78) 100%)" />
      <div className="relative flex justify-between font-bold uppercase" {...rise(0, { padding: '5cqw 6cqw 0', fontFamily: 'var(--inv-body)', fontSize: '2.5cqw', letterSpacing: '0.2em' })}>
        <span>{theme.layout.kicker}</span>
        <span className="tabular-nums">
          Tháng {p.month} · {p.year}
        </span>
      </div>
      <p className="relative text-center" {...rise(0, { fontFamily: theme.display, fontWeight: 900, fontSize: '33cqw', lineHeight: 0.86, letterSpacing: '-0.03em', marginTop: '1cqw' })}>
        LOVE
      </p>
      <div className="relative" {...rise(1, { padding: '5cqw 6cqw 0', maxWidth: '68cqw' })}>
        <span className="inline-block font-bold uppercase" style={{ background: red, fontFamily: 'var(--inv-body)', fontSize: '2.4cqw', letterSpacing: '0.16em', padding: '0.8cqw 1.8cqw' }}>
          Độc quyền
        </span>
        <p className="italic [text-wrap:balance]" style={{ fontFamily: theme.display, fontSize: '5.4cqw', lineHeight: 1.08, marginTop: '1.6cqw', textShadow: '0 1px 12px rgba(0,0,0,0.35)' }}>
          Hành trình đến lễ đường
        </p>
        {!thumb && (
          <p className="font-bold uppercase" style={{ fontFamily: 'var(--inv-body)', fontSize: '2.4cqw', letterSpacing: '0.14em', marginTop: '1.6cqw', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            Lịch cưới · Album ảnh
          </p>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0" style={{ padding: thumb ? '0 6cqw 6cqw' : '0 6cqw 9cqw' }}>
        <CoverHeading thumb={thumb} className="uppercase" {...rise(2, { fontFamily: theme.display, fontWeight: 900, fontSize: '9.8cqw', lineHeight: 0.94, letterSpacing: '-0.02em' })}>
          <span className="block whitespace-nowrap">{data.groom}</span>
          <span className="block whitespace-nowrap">
            <span className="italic" style={{ color: red, fontWeight: 400 }}>
              &amp;{' '}
            </span>
            {data.bride}
          </span>
        </CoverHeading>
        <div className="flex items-end justify-between" {...rise(3, { marginTop: '3.4cqw', borderTop: '0.4cqw solid #fff', paddingTop: '2cqw' })}>
          <p className="font-bold uppercase tabular-nums" style={{ fontFamily: 'var(--inv-body)', fontSize: '2.8cqw', letterSpacing: '0.12em', lineHeight: 1.4 }}>
            {p.weekday}
            <br />
            {pad2(p.day)}.{pad2(p.month)}.{p.year}
          </p>
          <Barcode />
        </div>
      </div>
    </div>
  );
}

function Barcode() {
  const bars = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2];
  let x = 0;
  return (
    <svg viewBox="0 0 60 22" style={{ width: '17cqw', height: 'auto', background: '#fff', padding: '0.8cqw' }} aria-hidden="true">
      {bars.map((w, i) => {
        const r = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w} height="22" fill="#111" /> : null;
        x += w + 0.6;
        return r;
      })}
    </svg>
  );
}

function PosterScriptCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  return (
    <div className="relative h-full text-center" style={{ color: WHITE }}>
      <FullPhoto theme={theme} data={data} thumb={thumb} position="50% 60%" overlay="linear-gradient(to bottom, rgba(10,32,56,0.42) 0%, transparent 36%, transparent 58%, rgba(8,28,48,0.74) 100%)" />
      <div className="relative" style={{ paddingTop: thumb ? '7cqw' : '10cqw' }}>
        <p className="[text-wrap:balance]" {...rise(0, { fontFamily: theme.script, fontWeight: 700, fontSize: '17cqw', lineHeight: 0.92, padding: '0 6cqw', textShadow: '0 0.6cqw 3cqw rgba(0,30,60,0.35)' })}>
          {theme.layout.kicker}
        </p>
        <p className="uppercase" {...rise(1, { fontSize: '2.6cqw', letterSpacing: '0.42em', marginTop: '3cqw' })}>
          {data.headline}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-0" style={{ padding: thumb ? '0 7cqw 8cqw' : '0 7cqw 12cqw' }}>
        <CoverHeading thumb={thumb} className="uppercase [text-wrap:balance]" {...rise(2, { fontFamily: theme.display, fontWeight: 300, fontSize: '5.6cqw', letterSpacing: '0.24em', lineHeight: 1.4 })}>
          {data.groom} &amp; {data.bride}
        </CoverHeading>
        <p className="tabular-nums" {...rise(3, { fontFamily: theme.display, fontWeight: 300, fontSize: '9.4cqw', letterSpacing: '0.08em', lineHeight: 1.2, marginTop: '1.6cqw' })}>
          {pad2(p.day)}.{pad2(p.month)}.{p.year}
        </p>
        {!thumb && (
          <p className="uppercase" style={{ fontSize: '2.6cqw', letterSpacing: '0.32em', marginTop: '1.4cqw', opacity: 0.9 }}>
            {p.weekday}
            {data.city ? ` · ${data.city}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────── Ren cổ điển: lace-edged oval, sepia print ───────────── */

function VintageCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  return (
    <div className="relative flex h-full flex-col items-center text-center" style={{ background: theme.paper }}>
      <div {...rise(0, { width: '56cqw', paddingTop: thumb ? '9cqw' : '13cqw' })}>
        <Ornament kind="lace" theme={theme} variant="divider" />
      </div>
      <p {...rise(0, { fontFamily: theme.script, fontWeight: 700, fontSize: '12cqw', lineHeight: 1.1, color: theme.accentText ?? theme.accent, marginTop: '1cqw' })}>{theme.layout.kicker}</p>
      <div className="relative min-h-0 flex-1" {...rise(1, { width: '54cqw', marginTop: '3cqw' })}>
        <div className="absolute rounded-[50%]" style={{ inset: '-3.2cqw', border: `0.5cqw dotted ${theme.line}` }} />
        <div className="absolute rounded-[50%]" style={{ inset: '-1.4cqw', border: `0.25cqw solid ${theme.accent}` }} />
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="block h-full w-full rounded-[50%]" position="50% 30%" />
      </div>
      <CoverHeading thumb={thumb} className="uppercase" {...rise(2, { fontFamily: theme.display, fontSize: '5.4cqw', letterSpacing: '0.22em', lineHeight: 1.25, marginTop: thumb ? '5cqw' : '8cqw' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block normal-case" style={{ fontFamily: theme.script, fontWeight: 700, fontSize: '1.7em', lineHeight: 0.9, letterSpacing: 0, color: theme.accentText ?? theme.accent }}>
          &amp;
        </span>
        <span className="block whitespace-nowrap">{data.bride}</span>
      </CoverHeading>
      <p className="italic" {...rise(3, { fontFamily: theme.display, fontSize: '3.5cqw', marginTop: '3cqw', paddingBottom: thumb ? '9cqw' : '13cqw', color: theme.inkSoft })}>
        {p.weekday}, ngày {p.day} tháng {p.month} năm {p.year}
      </p>
    </div>
  );
}

/* ───────────── Hồng pastel: a pinned stack of instant photos ───────────── */

function Polaroid({ src, theme, thumb, width, style, caption, tape }: { src: string; theme: InviteTheme; thumb: boolean; width: string; style: React.CSSProperties; caption?: string; tape?: boolean }) {
  return (
    <div className="absolute bg-white" style={{ width, padding: '2.2cqw 2.2cqw 0', boxShadow: '0 1.6cqw 4cqw -1cqw rgba(92,36,54,0.35)', ...style }}>
      {tape && <span className="absolute left-1/2 top-[-2.6cqw] block -translate-x-1/2 -rotate-3" style={{ width: '20cqw', height: '5.4cqw', background: 'rgba(255,183,201,0.78)' }} aria-hidden="true" />}
      <PhotoOr src={src} alt="" theme={theme} small eager={!thumb} className="block aspect-[4/5] w-full" />
      <p className="text-center" style={{ fontFamily: theme.script, color: theme.ink, fontSize: '4.6cqw', height: caption ? '9cqw' : '6cqw', lineHeight: caption ? '9cqw' : '6cqw' }}>
        {caption}
      </p>
    </div>
  );
}

function PolaroidCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const [a, b] = [data.extras[0] ?? data.cover, data.extras[1] ?? data.cover];
  return (
    <div className="relative flex h-full flex-col items-center text-center" style={{ background: `radial-gradient(${theme.line}66 0.45cqw, transparent 0.6cqw) 0 0 / 6cqw 6cqw, ${theme.paper}` }}>
      <p {...rise(0, { fontFamily: theme.script, fontWeight: 700, fontSize: '8.8cqw', color: theme.accentText ?? theme.accent, paddingTop: thumb ? '7cqw' : '11cqw', transform: 'rotate(-3deg)' })}>{theme.layout.kicker}</p>
      <div className="relative min-h-0 w-full flex-1" {...rise(1)}>
        <Polaroid src={a} theme={theme} thumb={thumb} width="38cqw" style={{ left: '6cqw', top: '12%', transform: 'rotate(-11deg)' }} />
        <Polaroid src={b} theme={theme} thumb={thumb} width="38cqw" style={{ right: '6cqw', top: '4%', transform: 'rotate(9deg)' }} />
        <Polaroid
          src={data.cover}
          theme={theme}
          thumb={thumb}
          width={thumb ? '50cqw' : '58cqw'}
          tape
          caption={`${pad2(p.day)}.${pad2(p.month)}.${p.year}`}
          style={{ left: '50%', top: '52%', transform: 'translate(-50%,-50%) rotate(-2.5deg)' }}
        />
        <svg viewBox="0 0 24 24" className="absolute" style={{ width: '7cqw', right: '13cqw', bottom: '9%', transform: 'rotate(14deg)' }} aria-hidden="true">
          <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill={theme.accent} />
        </svg>
        <svg viewBox="0 0 24 24" className="absolute" style={{ width: '4.4cqw', left: '14cqw', bottom: '14%', transform: 'rotate(-12deg)' }} aria-hidden="true">
          <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill={theme.line} />
        </svg>
      </div>
      <CoverHeading thumb={thumb} className="[text-wrap:balance]" {...rise(2, { fontFamily: theme.script, fontWeight: 700, fontSize: '9.6cqw', lineHeight: 1.15, color: theme.ink, padding: '0 6cqw' })}>
        {data.groom} <span style={{ color: theme.accent }}>♥</span> {data.bride}
      </CoverHeading>
      <p className="inline-flex items-center rounded-full font-semibold tabular-nums" {...rise(3, { background: theme.accent, color: theme.onAccent, fontSize: '3.2cqw', padding: '1.4cqw 4.4cqw', margin: thumb ? '2.6cqw 0 7cqw' : '3.4cqw 0 10cqw' })}>
        {p.weekday} · {pad2(p.day)}.{pad2(p.month)}.{p.year}
      </p>
    </div>
  );
}

/* ───────────── Đỏ đô: the photo tucked into an open envelope ───────────── */

function EnvelopeCover({ theme, data, thumb }: CoverProps) {
  const env = theme.envelope;
  return (
    <div className="relative flex h-full flex-col items-center text-center" style={{ background: `radial-gradient(90% 60% at 50% 30%, #fbf5ec, ${theme.paper})` }}>
      <p className="uppercase" {...rise(0, { fontFamily: 'var(--inv-body)', fontSize: '2.9cqw', letterSpacing: '0.42em', color: theme.inkSoft, paddingTop: thumb ? '8cqw' : '11cqw' })}>
        {theme.layout.kicker}
      </p>
      <div className="relative min-h-0 w-full flex-1" {...rise(1, { marginTop: '3cqw' })}>
        {/* open flap and back of the envelope */}
        <div className="absolute" style={{ left: '12cqw', right: '12cqw', bottom: 0, height: '44%', background: env.flap, borderRadius: '0.8cqw' }} />
        <div className="absolute" style={{ left: '12cqw', right: '12cqw', bottom: '44%', height: '22%', background: env.liner, clipPath: 'polygon(0 100%, 50% 0, 100% 100%)', opacity: 0.95 }} />
        {/* the photo card */}
        <div className="absolute left-1/2 bg-white" style={{ bottom: '16%', height: '80%', aspectRatio: '4 / 5', padding: '1.4cqw', transform: 'translateX(-50%) rotate(-2.5deg)', boxShadow: '0 1.4cqw 4cqw -1cqw rgba(60,10,20,0.45)' }}>
          <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="block h-full w-full" position="50% 30%" />
        </div>
        {/* front pocket */}
        <div
          className="absolute"
          style={{ left: '12cqw', right: '12cqw', bottom: 0, height: '44%', background: `linear-gradient(170deg, ${env.body}, ${theme.panel})`, clipPath: 'polygon(0 0, 50% 52%, 100% 0, 100% 100%, 0 100%)', borderRadius: '0 0 0.8cqw 0.8cqw', boxShadow: '0 2cqw 5cqw -2cqw rgba(0,0,0,0.4)' }}
        />
        <div className="absolute" style={{ left: '12cqw', right: '12cqw', bottom: 0, height: '44%', clipPath: 'polygon(0 100%, 50% 52%, 100% 100%)', background: 'rgba(0,0,0,0.12)' }} />
        <div className="absolute [&_svg]:h-full [&_svg]:w-full" style={{ left: '50%', bottom: 'calc(21% - 8cqw)', width: '16cqw', height: '16cqw', transform: 'translateX(-50%)' }}>
          <Seal theme={theme} monogram={`${data.groom.trim().split(/\s+/).pop()?.charAt(0) ?? ''}${data.bride.trim().split(/\s+/).pop()?.charAt(0) ?? ''}`} />
        </div>
      </div>
      <CoverHeading thumb={thumb} {...rise(2, { fontFamily: theme.display, fontSize: '10.6cqw', lineHeight: 1.08, color: theme.accentText ?? theme.ink, marginTop: thumb ? '4cqw' : '7cqw' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block whitespace-nowrap">
          <span style={{ fontFamily: theme.script, fontSize: '0.8em', color: theme.inkSoft }}>&amp;</span> {data.bride}
        </span>
      </CoverHeading>
      <div {...rise(3, { padding: thumb ? '3cqw 0 7cqw' : '5cqw 0 10cqw', width: '100%' })}>
        <DateRow theme={theme} date={data.date} />
        {!thumb && (
          <p className="italic" style={{ fontSize: '3cqw', color: theme.inkSoft, marginTop: '2.2cqw' }}>
            ({lunarLine(data.date)})
          </p>
        )}
      </div>
    </div>
  );
}


/* ───────────── Khung ảnh: printed photo with a white border, date badge on the edge ───────────── */

function FrameInsetCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const foot = thumb ? 44 : 52;
  return (
    <div className="relative h-full" style={{ background: theme.paper }}>
      <div className="absolute overflow-hidden" {...rise(0, { left: '5cqw', right: '5cqw', top: '5cqw', bottom: `${foot}cqw`, boxShadow: '0 1.5cqw 4cqw -2cqw rgba(0,0,0,0.35)' })}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} zoom={!thumb} className="absolute inset-0 h-full w-full" position={theme.layout.coverPosition ?? '50% 35%'} />
      </div>
      <div className="absolute left-1/2 grid place-items-center rounded-full text-center" {...rise(1, { width: '19cqw', height: '19cqw', bottom: `calc(${foot}cqw - 9.5cqw)`, transform: 'translateX(-50%)', background: theme.accent, color: theme.onAccent, border: `0.9cqw solid ${theme.paper}`, fontFamily: theme.display })}>
        <span style={{ fontSize: '7cqw', lineHeight: 0.9 }}>{pad2(p.day)}</span>
        <span className="uppercase" style={{ fontSize: '1.9cqw', letterSpacing: '0.12em', marginTop: '-2cqw' }}>
          Th {pad2(p.month)}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-center text-center" style={{ height: `${foot}cqw`, paddingTop: '10cqw', paddingInline: '6cqw' }}>
        <p {...rise(1, { fontFamily: theme.script, fontSize: '6.6cqw', color: theme.accentText ?? theme.accent, lineHeight: 1.2 })}>{theme.layout.kicker}</p>
        <CoverHeading thumb={thumb} className={`[text-wrap:balance] ${theme.namesUpper ? 'uppercase' : ''}`} {...rise(2, { fontFamily: theme.namesIn === 'script' ? theme.script : theme.display, fontWeight: theme.namesIn === 'script' ? 400 : theme.namesWeight ?? 500, fontSize: theme.namesIn === 'script' ? '10.4cqw' : '8.2cqw', lineHeight: 1.08 })}>
          {data.groom} <span style={{ color: theme.accentText ?? theme.accent }}>&amp;</span> {data.bride}
        </CoverHeading>
        <p className="uppercase tabular-nums" {...rise(3, { fontSize: '2.8cqw', letterSpacing: '0.3em', color: theme.inkSoft, marginTop: '2.6cqw' })}>
          {p.weekday} · {p.year}
          {data.city && !thumb ? ` · ${data.city}` : ''}
        </p>
      </div>
    </div>
  );
}

/* ───────────── Chia đôi: photo edge to edge on top, editorial type below ───────────── */

function SplitCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  return (
    <div className="relative flex h-full flex-col" style={{ background: theme.paper }}>
      <div className="relative min-h-0 flex-1 overflow-hidden" {...rise(0)}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} zoom={!thumb} className="absolute inset-0 h-full w-full" position={theme.layout.coverPosition ?? '50% 40%'} />
        <div className="absolute inset-x-0 top-0" style={{ height: '22cqw', background: 'linear-gradient(rgba(0,0,0,0.42), transparent)' }} />
        <p className="absolute uppercase" style={{ left: '7cqw', top: '7cqw', color: WHITE, fontSize: '2.6cqw', letterSpacing: '0.42em' }}>
          {theme.layout.kicker}
        </p>
      </div>
      <div className="grid shrink-0 grid-cols-[1fr_auto] items-end" style={{ gap: '4cqw', padding: thumb ? '5cqw 7cqw 7cqw' : '7cqw 7cqw 10cqw', borderTop: `1.2cqw solid ${theme.accent}` }}>
        <CoverHeading thumb={thumb} className={theme.namesUpper ? 'uppercase' : ''} {...rise(1, { fontFamily: theme.namesIn === 'script' ? theme.script : theme.display, fontWeight: theme.namesIn === 'script' ? 400 : theme.namesWeight ?? 500, fontSize: theme.namesIn === 'script' ? '10.6cqw' : '8.4cqw', lineHeight: 1.02 })}>
          <span className="block whitespace-nowrap">{data.groom}</span>
          <span className="block whitespace-nowrap">
            <span style={{ color: theme.accentText ?? theme.accent }}>&amp;</span> {data.bride}
          </span>
        </CoverHeading>
        <div className="text-right" {...rise(2, { fontFamily: theme.display })}>
          <p className="tabular-nums" style={{ fontSize: '15cqw', lineHeight: 0.84, color: theme.accentText ?? theme.accent }}>
            {pad2(p.day)}
          </p>
          <p className="uppercase tabular-nums" style={{ fontSize: '2.6cqw', letterSpacing: '0.2em', marginTop: '1.6cqw' }}>
            Th {pad2(p.month)} · {p.year}
          </p>
          <p className="uppercase" style={{ fontSize: '2.3cqw', letterSpacing: '0.2em', color: theme.inkSoft }}>
            {p.weekday}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Ngày đẹp: giant date numerals with the photo inside them ───────────── */

function BigDateCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const fill: React.CSSProperties = data.cover
    ? { backgroundImage: `url(${sized(data.cover, thumb)})`, backgroundSize: 'cover', backgroundPosition: theme.layout.coverPosition ?? '50% 40%', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextStroke: `0.25cqw color-mix(in srgb, ${theme.ink} 22%, transparent)`, filter: theme.layout.photoFilter }
    : { color: theme.accent };
  return (
    <div className="relative flex h-full flex-col items-center justify-evenly text-center" style={{ background: theme.paper, padding: thumb ? '6cqw 0' : '9cqw 0' }}>
      <p className="uppercase" {...rise(0, { fontSize: '2.8cqw', letterSpacing: '0.46em', color: theme.inkSoft })}>
        {theme.layout.kicker}
      </p>
      <p className="tabular-nums" aria-label={`${p.day} tháng ${p.month}`} {...rise(1, { fontFamily: 'var(--f-playfair), serif', fontWeight: 900, fontSize: thumb ? '46cqw' : '52cqw', lineHeight: 0.8, letterSpacing: '-0.04em', ...fill })}>
        {pad2(p.day)}
        <br />
        {pad2(p.month)}
      </p>
      <div {...rise(2)}>
        <p className="tabular-nums" style={{ fontFamily: theme.display, fontSize: '4cqw', letterSpacing: '0.6em', paddingLeft: '0.6em' }}>
          {p.year}
        </p>
        <CoverHeading thumb={thumb} className="[text-wrap:balance]" style={{ fontFamily: theme.namesIn === 'script' ? theme.script : theme.display, fontSize: theme.namesIn === 'script' ? '9.6cqw' : '7cqw', lineHeight: 1.15, marginTop: '2.4cqw', color: theme.accentText ?? theme.accent, padding: '0 6cqw', textTransform: theme.namesUpper ? 'uppercase' : undefined }}>
          {data.groom} &amp; {data.bride}
        </CoverHeading>
        {!thumb && (
          <p className="uppercase" style={{ fontSize: '2.6cqw', letterSpacing: '0.3em', color: theme.inkSoft, marginTop: '2cqw' }}>
            {p.weekday}
            {data.city ? ` · ${data.city}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────── Album mini: three photos as a small collage ───────────── */

function CollageCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const gap = '1.6cqw';
  return (
    <div className="relative flex h-full flex-col" style={{ background: theme.paper, paddingInline: '5cqw' }}>
      <div className="shrink-0 text-center" style={{ padding: thumb ? '7cqw 0 4cqw' : '10cqw 0 6cqw' }}>
        <p {...rise(0, { fontFamily: theme.script, fontSize: '7.6cqw', lineHeight: 1.15, color: theme.accentText ?? theme.accent })}>{theme.layout.kicker}</p>
        <CoverHeading thumb={thumb} className="uppercase [text-wrap:balance]" {...rise(1, { fontFamily: theme.display, fontSize: '5.6cqw', letterSpacing: '0.16em', lineHeight: 1.3, marginTop: '1.4cqw' })}>
          {data.groom} &amp; {data.bride}
        </CoverHeading>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[1.35fr_1fr]" {...rise(2, { gap })}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="h-full w-full" position={theme.layout.coverPosition ?? '50% 35%'} />
        <div className="grid min-h-0 grid-rows-2" style={{ gap }}>
          <PhotoOr src={data.extras[0] ?? data.cover} alt="" theme={theme} small eager={!thumb} className="h-full w-full" />
          <PhotoOr src={data.extras[1] ?? data.cover} alt="" theme={theme} small eager={!thumb} className="h-full w-full" />
        </div>
      </div>
      <div className="shrink-0 text-center" {...rise(3, { padding: thumb ? '4cqw 0 6cqw' : '6cqw 0 9cqw' })}>
        <p className="tabular-nums" style={{ fontFamily: theme.display, fontSize: '4.8cqw', letterSpacing: '0.3em' }}>
          {pad2(p.day)} · {pad2(p.month)} · {p.year}
        </p>
        {!thumb && (
          <p className="uppercase" style={{ fontSize: '2.6cqw', letterSpacing: '0.3em', color: theme.inkSoft, marginTop: '1.4cqw' }}>
            {p.weekday}
            {data.city ? ` · ${data.city}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

/* ───────────── I love you: colour field, arch portrait, words set vertically ───────────── */

function VerticalCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const ink = theme.onAccent;
  const side: React.CSSProperties = { writingMode: 'vertical-rl', fontFamily: theme.display, letterSpacing: '0.5em', fontSize: '3.2cqw', whiteSpace: 'nowrap' };
  return (
    <div className="relative flex h-full flex-col text-center" style={{ background: `radial-gradient(90% 70% at 50% 35%, color-mix(in srgb, ${theme.accent} 88%, #ffffff), ${theme.accent} 60%, color-mix(in srgb, ${theme.accent} 80%, #000000))`, color: ink }}>
      <p className="uppercase" {...rise(0, { fontSize: '2.6cqw', letterSpacing: '0.5em', paddingTop: thumb ? '7cqw' : '10cqw' })}>
        {theme.layout.kicker}
      </p>
      <div className="flex min-h-0 flex-1 items-stretch" style={{ gap: '3cqw', padding: '5cqw 5cqw 0' }}>
        <div className="grid w-[8cqw] place-items-center uppercase" {...rise(1, { ...side, transform: 'rotate(180deg)' })}>
          I love you
        </div>
        <div className="relative min-w-0 flex-1" {...rise(1)}>
          <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="block h-full w-full rounded-t-full" position={theme.layout.coverPosition ?? '50% 30%'} style={{ border: `0.8cqw solid ${ink}` }} />
        </div>
        <div className="grid w-[8cqw] place-items-center tabular-nums" {...rise(1, side)}>
          {pad2(p.day)} · {pad2(p.month)} · {p.year}
        </div>
      </div>
      <div {...rise(2, { padding: thumb ? '4cqw 4cqw 7cqw' : '6cqw 4cqw 10cqw' })}>
        <p className="uppercase" style={{ fontFamily: theme.display, fontSize: '11.5cqw', letterSpacing: '0.3em', paddingLeft: '0.3em', lineHeight: 1 }}>
          Wedding
        </p>
        <CoverHeading thumb={thumb} className="uppercase" style={{ fontSize: '3.2cqw', letterSpacing: '0.28em', marginTop: '2.4cqw' }}>
          {data.groom} · {data.bride}
        </CoverHeading>
      </div>
    </div>
  );
}

/* ───────────── Tem thư: postage stamp, postmark, airmail stripes ───────────── */

function StampCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const perforated: React.CSSProperties = {
    padding: '1.2cqw',
    WebkitMask: 'radial-gradient(circle 0.95cqw at 1.2cqw 1.2cqw, #0000 96%, #000) -1.2cqw -1.2cqw / 2.4cqw 2.4cqw, linear-gradient(#000 0 0) content-box',
    mask: 'radial-gradient(circle 0.95cqw at 1.2cqw 1.2cqw, #0000 96%, #000) -1.2cqw -1.2cqw / 2.4cqw 2.4cqw, linear-gradient(#000 0 0) content-box',
  };
  return (
    <div className="relative h-full" style={{ background: `repeating-linear-gradient(-45deg, ${theme.accent} 0 3cqw, ${theme.paper} 3cqw 4.5cqw, ${theme.line} 4.5cqw 7.5cqw, ${theme.paper} 7.5cqw 9cqw)` }}>
      <div className="absolute flex flex-col items-center text-center" style={{ inset: '2.4cqw', background: theme.paper }}>
        <p className="uppercase" {...rise(0, { fontSize: '2.6cqw', letterSpacing: '0.36em', color: theme.inkSoft, paddingTop: thumb ? '6cqw' : '9cqw' })}>
          Par avion · {theme.layout.kicker}
        </p>
        <div className="relative flex min-h-0 w-full flex-1 justify-center" {...rise(1, { marginTop: '5cqw' })}>
          <div className="relative h-full" style={{ aspectRatio: '4 / 5', maxWidth: '66cqw', filter: 'drop-shadow(0 1cqw 1.6cqw rgba(0,0,0,0.25))' }}>
            <div className="h-full w-full bg-white" style={perforated}>
              <div className="relative h-full w-full bg-white" style={{ padding: '1.6cqw' }}>
                <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="block h-full w-full" position={theme.layout.coverPosition ?? '50% 35%'} />
                <span className="absolute font-bold tabular-nums" style={{ right: '3cqw', bottom: '2.6cqw', color: WHITE, fontSize: '3cqw', textShadow: '0 0 6px rgba(0,0,0,0.5)', fontFamily: theme.display }}>
                  {p.year}
                </span>
              </div>
            </div>
            <svg viewBox="0 0 100 100" className="absolute" style={{ width: '26cqw', right: '-12cqw', top: '-7cqw', transform: 'rotate(-14deg)', opacity: 0.82 }} aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="none" stroke={theme.ink} strokeWidth="2.4" />
              <circle cx="50" cy="50" r="38" fill="none" stroke={theme.ink} strokeWidth="1.2" />
              <text x="50" y="47" textAnchor="middle" fill={theme.ink} style={{ fontSize: 11, fontFamily: 'var(--inv-body)', fontWeight: 700, letterSpacing: 1 }}>
                {pad2(p.day)}.{pad2(p.month)}
              </text>
              <text x="50" y="62" textAnchor="middle" fill={theme.ink} style={{ fontSize: 9, fontFamily: 'var(--inv-body)', letterSpacing: 2 }}>
                {p.year}
              </text>
              <path d="M-40 30 q10 -6 20 0 t20 0 t20 0 M-40 42 q10 -6 20 0 t20 0 t20 0 M-40 54 q10 -6 20 0 t20 0 t20 0 M-40 66 q10 -6 20 0 t20 0 t20 0" fill="none" stroke={theme.ink} strokeWidth="1.6" transform="translate(-8 0)" />
            </svg>
          </div>
        </div>
        <CoverHeading thumb={thumb} className="[text-wrap:balance]" {...rise(2, { fontFamily: theme.script, fontSize: '10cqw', lineHeight: 1.1, color: theme.accentText ?? theme.accent, padding: '0 6cqw', marginTop: thumb ? '3cqw' : '5cqw' })}>
          {data.groom} &amp; {data.bride}
        </CoverHeading>
        <p className="uppercase tabular-nums" {...rise(3, { fontSize: '2.8cqw', letterSpacing: '0.3em', marginTop: '1.4cqw', paddingBottom: thumb ? '6cqw' : '9cqw' })}>
          {p.weekday} · {pad2(p.day)}.{pad2(p.month)}.{p.year}
        </p>
      </div>
    </div>
  );
}

/* ───────────── Rạp chiếu bóng: film poster with credits ───────────── */

function CinemaCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const credit: React.CSSProperties = { fontSize: '2.1cqw', letterSpacing: '0.2em', lineHeight: 1.6, opacity: 0.75 };
  return (
    <div className="relative flex h-full flex-col text-center" style={{ background: '#0a0a0a', color: '#f3efe6' }}>
      <p className="uppercase" {...rise(0, { fontSize: '2.4cqw', letterSpacing: '0.5em', opacity: 0.7, paddingTop: thumb ? '7cqw' : '10cqw' })}>
        {theme.layout.kicker}
      </p>
      <CoverHeading thumb={thumb} className="uppercase" {...rise(1, { fontFamily: theme.display, fontWeight: theme.namesWeight ?? 600, fontSize: '8.6cqw', letterSpacing: '0.1em', lineHeight: 1.08, padding: '3cqw 5cqw 0' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block" style={{ fontSize: '0.5em', letterSpacing: '0.4em', color: theme.accent, margin: '0.6cqw 0' }}>
          và
        </span>
        <span className="block whitespace-nowrap">{data.bride}</span>
      </CoverHeading>
      <div className="relative min-h-0 flex-1" {...rise(2, { margin: '5cqw 0' })}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} zoom={!thumb} className="absolute inset-0 h-full w-full" position={theme.layout.coverPosition ?? '50% 40%'} />
        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 8cqw rgba(0,0,0,0.75)' }} />
      </div>
      <div {...rise(3, { paddingBottom: thumb ? '6cqw' : '9cqw' })}>
        <p className="uppercase" style={{ fontSize: '2.5cqw', letterSpacing: '0.44em', color: theme.accent }}>
          Khởi chiếu
        </p>
        <p className="tabular-nums" style={{ fontFamily: theme.display, fontSize: '7.4cqw', letterSpacing: '0.12em', lineHeight: 1.15 }}>
          {pad2(p.day)}.{pad2(p.month)}.{p.year}
        </p>
        {!thumb && (
          <div className="mx-auto mt-[3cqw] grid max-w-[80cqw] grid-cols-2 uppercase" style={credit}>
            <span>Đạo diễn · Định mệnh</span>
            <span>Sản xuất · Hai gia đình</span>
            <span>Âm nhạc · Tiếng cười</span>
            <span>{data.city ? `Tại · ${data.city}` : `Suất · ${vnTime(data.date)}`}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── Báo hỷ: a front page announcing the news ───────────── */

function NewspaperCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const rule = `0.3cqw solid ${theme.ink}`;
  return (
    <div className="relative flex h-full flex-col" style={{ background: theme.paper, color: theme.ink, padding: thumb ? '5cqw 5.5cqw' : '7cqw 6cqw' }}>
      <div className="flex shrink-0 justify-between uppercase" {...rise(0, { fontSize: '2.1cqw', letterSpacing: '0.14em', paddingBottom: '1.4cqw', borderBottom: rule })}>
        <span>Số đặc biệt</span>
        <span className="tabular-nums">
          {pad2(p.day)}.{pad2(p.month)}.{p.year}
        </span>
        <span>Giá: một nụ cười</span>
      </div>
      <p className="shrink-0 text-center" {...rise(0, { fontFamily: theme.display, fontWeight: 900, fontSize: '13.6cqw', lineHeight: 1.05, letterSpacing: '-0.02em', borderBottom: `0.9cqw double ${theme.ink}`, padding: '1cqw 0 1.6cqw' })}>
        {theme.layout.kicker}
      </p>
      <CoverHeading thumb={thumb} className="shrink-0 [text-wrap:balance]" {...rise(1, { fontFamily: theme.display, fontWeight: 700, fontSize: '6.8cqw', lineHeight: 1.05, marginTop: '3cqw' })}>
        {data.groom} &amp; {data.bride} chính thức về chung một nhà
      </CoverHeading>
      <div className="relative mt-[3cqw] min-h-0 flex-1" {...rise(2)}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="absolute inset-0 h-full w-full" position={theme.layout.coverPosition ?? '50% 35%'} style={{ filter: 'grayscale(1) contrast(1.08)' }} />
      </div>
      <p className="shrink-0 italic" style={{ fontSize: '2.3cqw', marginTop: '1.2cqw', color: theme.inkSoft }}>
        Ảnh: cô dâu chú rể trong buổi chụp ảnh cưới.
      </p>
      {!thumb && (
        <p className="shrink-0 columns-2 text-justify [hyphens:auto]" lang="vi" {...rise(3, { fontSize: '2.45cqw', lineHeight: 1.4, columnGap: '4cqw', marginTop: '2.4cqw', borderTop: rule, paddingTop: '2cqw' })}>
          <span className="float-left mr-[1cqw] font-bold" style={{ fontFamily: theme.display, fontSize: '7cqw', lineHeight: 0.9 }}>
            H
          </span>
          ôn lễ được cử hành vào {p.weekday.toLowerCase()}, ngày {p.day} tháng {p.month} năm {p.year}
          {data.city ? ` tại ${data.city}` : ''}. Hai bên gia đình trân trọng kính mời quý khách đến chung vui, chứng kiến và gửi lời chúc phúc tới đôi bạn trẻ trong ngày trọng đại.
        </p>
      )}
    </div>
  );
}

/* ───────────── Mặt trời: geometric colour disc behind a round portrait ───────────── */

function CircleCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  return (
    <div className="relative h-full overflow-hidden" style={{ background: theme.paper }}>
      <div className="absolute rounded-full" {...rise(0, { width: '96cqw', height: '96cqw', right: '-34cqw', top: '2cqw', background: theme.accent, opacity: 0.92 })} />
      <div className="absolute rounded-full" style={{ width: '9cqw', height: '9cqw', left: '9cqw', top: '14cqw', background: theme.line }} aria-hidden="true" />
      <div className="absolute overflow-hidden rounded-full" {...rise(1, { width: '70cqw', height: '70cqw', right: '7cqw', top: '13cqw', border: `1.4cqw solid ${theme.paper}` })}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="h-full w-full" position={theme.layout.coverPosition ?? '50% 35%'} />
      </div>
      <div className="absolute text-left" {...rise(2, { left: '7cqw', right: '7cqw', bottom: thumb ? '7cqw' : '12cqw' })}>
        <p className="uppercase" style={{ fontSize: '2.6cqw', letterSpacing: '0.42em', color: theme.accentText ?? theme.accent }}>
          {theme.layout.kicker}
        </p>
        <CoverHeading thumb={thumb} className={theme.namesUpper ? 'uppercase' : ''} style={{ fontFamily: theme.namesIn === 'script' ? theme.script : theme.display, fontWeight: theme.namesIn === 'script' ? 400 : theme.namesWeight ?? 500, fontSize: theme.namesIn === 'script' ? '12cqw' : '10.4cqw', lineHeight: 1.0, marginTop: '2cqw' }}>
          <span className="block whitespace-nowrap">{data.groom}</span>
          <span className="block whitespace-nowrap">
            <span style={{ color: theme.accentText ?? theme.accent }}>&amp;</span> {data.bride}
          </span>
        </CoverHeading>
        <div className="flex items-center" style={{ gap: '3cqw', marginTop: '3.4cqw' }}>
          <span className="tabular-nums" style={{ fontFamily: theme.display, fontSize: '4.6cqw', letterSpacing: '0.08em' }}>
            {pad2(p.day)}.{pad2(p.month)}.{p.year}
          </span>
          <span className="h-px flex-1" style={{ background: theme.ink, opacity: 0.4 }} />
          <span className="uppercase" style={{ fontSize: '2.5cqw', letterSpacing: '0.24em', color: theme.inkSoft }}>
            {p.weekday}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Ba vòm cửa: three arched windows ───────────── */

function TripleArchCover({ theme, data, thumb }: CoverProps) {
  const arch = 'block w-full rounded-t-full';
  return (
    <div className="relative flex h-full flex-col items-center text-center" style={{ background: `linear-gradient(${theme.paper}, ${softPanel(theme)})` }}>
      <p {...rise(0, { fontFamily: theme.script, fontSize: '8.4cqw', lineHeight: 1.2, color: theme.accentText ?? theme.accent, paddingTop: thumb ? '7cqw' : '10cqw' })}>{theme.layout.kicker}</p>
      <CoverHeading thumb={thumb} className="uppercase [text-wrap:balance]" {...rise(1, { fontFamily: theme.display, fontSize: '5.4cqw', letterSpacing: '0.2em', lineHeight: 1.3, marginTop: '1cqw', padding: '0 6cqw' })}>
        {data.groom} &amp; {data.bride}
      </CoverHeading>
      <div className="flex min-h-0 w-full flex-1 items-end" {...rise(2, { gap: '2.4cqw', padding: '6cqw 6cqw 0' })}>
        <div className="h-[76%] flex-1">
          <PhotoOr src={data.extras[0] ?? data.cover} alt="" theme={theme} small eager={!thumb} className={`${arch} h-full`} />
        </div>
        <div className="h-full flex-[1.3]">
          <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className={`${arch} h-full`} position={theme.layout.coverPosition ?? '50% 35%'} />
        </div>
        <div className="h-[76%] flex-1">
          <PhotoOr src={data.extras[1] ?? data.cover} alt="" theme={theme} small eager={!thumb} className={`${arch} h-full`} />
        </div>
      </div>
      <div className="w-full" {...rise(3, { padding: thumb ? '4cqw 0 6cqw' : '6cqw 0 9cqw', borderTop: `0.3cqw solid ${theme.line}` })}>
        <DateRow theme={theme} date={data.date} />
      </div>
    </div>
  );
}

/* ───────────── Vé lên tàu: boarding pass ───────────── */

function BoardingCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const label: React.CSSProperties = { fontSize: '2cqw', letterSpacing: '0.18em', color: theme.inkSoft };
  const value: React.CSSProperties = { fontSize: '3.4cqw', fontWeight: 700, lineHeight: 1.2 };
  return (
    <div className="relative flex h-full" style={{ background: theme.ground, padding: thumb ? '6cqw 6cqw' : '9cqw 6cqw' }}>
      <div className="relative flex min-h-0 w-full flex-col overflow-hidden" {...rise(0, { background: theme.paper, borderRadius: '3cqw', boxShadow: '0 2cqw 6cqw -2cqw rgba(0,0,0,0.4)' })}>
        <div className="flex shrink-0 items-center justify-between font-bold uppercase" style={{ background: theme.accent, color: theme.onAccent, padding: '3cqw 5cqw', fontSize: '2.8cqw', letterSpacing: '0.2em' }}>
          <span>Boarding pass</span>
          <span style={{ fontSize: '2.2cqw' }}>✈ {theme.layout.kicker}</span>
        </div>
        <div className="relative min-h-0 flex-1" style={{ margin: '4cqw 5cqw 0', borderRadius: '2cqw', overflow: 'hidden' }}>
          <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="absolute inset-0 h-full w-full" position={theme.layout.coverPosition ?? '50% 35%'} />
        </div>
        <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-end" style={{ gap: '3cqw', padding: '4cqw 5cqw 0' }}>
          <div className="min-w-0 text-left">
            <p className="uppercase" style={label}>
              Chú rể
            </p>
            <p className="truncate" style={{ fontFamily: theme.display, fontSize: '5.4cqw', lineHeight: 1.15 }}>
              {data.groom}
            </p>
          </div>
          <svg viewBox="0 0 24 24" style={{ width: '6cqw', marginBottom: '1cqw' }} aria-hidden="true">
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" fill={theme.accent} />
          </svg>
          <div className="min-w-0 text-right">
            <p className="uppercase" style={label}>
              Cô dâu
            </p>
            <p className="truncate" style={{ fontFamily: theme.display, fontSize: '5.4cqw', lineHeight: 1.15 }}>
              {data.bride}
            </p>
          </div>
        </div>
        <CoverHeading thumb={thumb} className="sr-only">
          {data.groom} &amp; {data.bride}
        </CoverHeading>
        <div className="grid shrink-0 grid-cols-4 text-left" style={{ gap: '2cqw', padding: '3.4cqw 5cqw 0' }}>
          {[
            ['Ngày', `${pad2(p.day)}/${pad2(p.month)}`],
            ['Giờ', vnTime(data.date)],
            ['Cổng', 'Hạnh phúc'],
            ['Ghế', '01A'],
          ].map(([l, v]) => (
            <div key={l} className="min-w-0">
              <p className="uppercase" style={label}>
                {l}
              </p>
              <p className="truncate tabular-nums" style={value}>
                {v}
              </p>
            </div>
          ))}
        </div>
        <div className="relative shrink-0" style={{ margin: '4cqw 0 0', borderTop: `0.4cqw dashed ${theme.line}` }} aria-hidden="true">
          <span className="absolute rounded-full" style={{ width: '5cqw', height: '5cqw', left: '-2.5cqw', top: '-2.7cqw', background: theme.ground }} />
          <span className="absolute rounded-full" style={{ width: '5cqw', height: '5cqw', right: '-2.5cqw', top: '-2.7cqw', background: theme.ground }} />
        </div>
        <div className="flex shrink-0 items-center justify-between" style={{ padding: '3cqw 5cqw 4cqw' }}>
          <Barcode />
          <p className="text-right uppercase tabular-nums" style={{ fontSize: '2.4cqw', letterSpacing: '0.16em' }}>
            {p.weekday}
            <br />
            {p.year}
            {data.city ? ` · ${data.city}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Lịch: photo above a month page with the day circled ───────────── */

const MONTH_VI = ['Một', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười', 'Mười Một', 'Mười Hai'];

function CalendarCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const offset = (new Date(Date.UTC(p.year, p.month - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
  const cells: Array<number | null> = [...Array.from({ length: offset }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const cell = thumb ? '4.4cqw' : '5.6cqw';
  return (
    <div className="relative flex h-full flex-col" style={{ background: theme.paper }}>
      <div className="relative shrink-0 overflow-hidden" {...rise(0, { height: thumb ? '46%' : '50%' })}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} zoom={!thumb} className="absolute inset-0 h-full w-full" position={theme.layout.coverPosition ?? '50% 35%'} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center text-center" style={{ padding: '0 8cqw' }}>
        <p {...rise(1, { fontFamily: theme.script, fontSize: '8.6cqw', lineHeight: 1.1, color: theme.accentText ?? theme.accent })}>Tháng {MONTH_VI[p.month - 1]}</p>
        <p className="uppercase tabular-nums" style={{ fontSize: '2.4cqw', letterSpacing: '0.46em', color: theme.inkSoft }}>
          {p.year}
        </p>
        <div className="grid grid-cols-7 tabular-nums" {...rise(2, { marginTop: '2.4cqw', fontSize: '3cqw' })}>
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
            <span key={d} style={{ fontSize: '2.2cqw', color: theme.inkSoft, lineHeight: cell }}>
              {d}
            </span>
          ))}
          {cells.map((d, i) =>
            d === p.day ? (
              <span key={i} className="relative grid place-items-center font-bold" style={{ height: cell, color: theme.onAccent }}>
                <svg viewBox="0 0 24 24" className="absolute" style={{ width: '7.6cqw' }} aria-hidden="true">
                  <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill={theme.accent} />
                </svg>
                <span className="relative">{d}</span>
              </span>
            ) : (
              <span key={i} style={{ lineHeight: cell, opacity: d ? 0.85 : 0 }}>
                {d ?? ''}
              </span>
            ),
          )}
        </div>
        <CoverHeading thumb={thumb} className="[text-wrap:balance]" {...rise(3, { fontFamily: theme.namesIn === 'script' ? theme.script : theme.display, fontSize: theme.namesIn === 'script' ? '8cqw' : '5.8cqw', lineHeight: 1.15, marginTop: '2.4cqw', textTransform: theme.namesUpper ? 'uppercase' : undefined })}>
          {data.groom} &amp; {data.bride}
        </CoverHeading>
      </div>
    </div>
  );
}

/* ───────────── Thiệp đỏ: red poster, gold type, a 囍 seal on the photo ───────────── */

function RedPosterCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const gold = theme.line;
  return (
    <div className="relative flex h-full flex-col items-center text-center" style={{ background: `radial-gradient(90% 70% at 50% 30%, color-mix(in srgb, ${theme.accent} 85%, #ffffff), ${theme.accent} 55%, ${theme.ground})`, color: gold }}>
      <p className="self-start" {...rise(0, { fontFamily: theme.script, fontSize: '11cqw', lineHeight: 1.1, paddingTop: thumb ? '6cqw' : '9cqw', paddingLeft: '7cqw', transform: 'rotate(-6deg)', transformOrigin: 'left' })}>
        {theme.layout.kicker}
      </p>
      <p className="self-start uppercase" {...rise(0, { fontSize: '2.8cqw', letterSpacing: '0.22em', paddingLeft: '9cqw', marginTop: '1cqw' })}>
        {data.groom} – {data.bride}
      </p>
      <div className="relative min-h-0 flex-1" {...rise(1, { width: '70cqw', marginTop: '4cqw' })}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="block h-full w-full" position={theme.layout.coverPosition ?? '50% 35%'} style={{ borderRadius: '2cqw', border: `0.5cqw solid ${gold}` }} />
        <div className="absolute grid place-items-center [&_svg]:h-[72%] [&_svg]:w-[72%]" style={{ width: '17cqw', height: '17cqw', right: '-6cqw', bottom: '7cqw', background: '#c8102e', border: `0.5cqw solid ${theme.onAccent}`, borderRadius: '1.4cqw', transform: 'rotate(8deg)', boxShadow: '0 1cqw 3cqw rgba(0,0,0,0.35)' }} aria-hidden="true">
          <SongHy color="#ffffff" />
        </div>
      </div>
      <CoverHeading thumb={thumb} className="sr-only">
        {data.groom} &amp; {data.bride}
      </CoverHeading>
      <p className="tabular-nums" {...rise(2, { fontFamily: theme.display, fontSize: '5.6cqw', letterSpacing: '0.24em', marginTop: '5cqw' })}>
        {pad2(p.day)} . {pad2(p.month)} . {p.year}
      </p>
      <p {...rise(3, { fontFamily: theme.script, fontSize: '5.4cqw', background: theme.paper, color: theme.accent, borderRadius: '99cqw', padding: '0.6cqw 6cqw', margin: thumb ? '3cqw 0 6cqw' : '4cqw 0 9cqw' })}>Wedding Invitation</p>
    </div>
  );
}

/* ───────────── Vườn lá: framed portrait with greenery across three corners ───────────── */

function BotanicalCover({ theme, data, thumb }: CoverProps) {
  const p = vnParts(data.date);
  const floral = theme.layout.floral;
  return (
    <div className="relative flex h-full flex-col items-center overflow-hidden text-center" style={{ background: theme.paper }}>
      <p className="uppercase" {...rise(0, { fontSize: '2.9cqw', letterSpacing: '0.42em', color: theme.inkSoft, paddingTop: thumb ? '8cqw' : '11cqw' })}>
        {theme.layout.kicker}
      </p>
      <div className="relative min-h-0 flex-1" {...rise(1, { width: '62cqw', marginTop: '7cqw' })}>
        <div className="absolute" style={{ inset: '-2.6cqw', border: `0.3cqw solid ${theme.line}` }} />
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager={!thumb} className="relative block h-full w-full" position={theme.layout.coverPosition ?? '50% 35%'} />
        {floral && (
          <>
            <img src={floral} alt="" aria-hidden="true" width={760} height={437} loading="lazy" decoding="async" className="pointer-events-none absolute max-w-none" style={{ width: '52cqw', left: '-27cqw', top: '-12cqw', transform: 'rotate(-28deg)' }} />
            <img src={floral} alt="" aria-hidden="true" width={760} height={437} loading="lazy" decoding="async" className="pointer-events-none absolute max-w-none" style={{ width: '48cqw', right: '-25cqw', bottom: '-12cqw', transform: 'rotate(152deg)' }} />
            <img src={floral} alt="" aria-hidden="true" width={760} height={437} loading="lazy" decoding="async" className="pointer-events-none absolute max-w-none" style={{ width: '28cqw', right: '-15cqw', top: '-8cqw', transform: 'rotate(58deg) scaleX(-1)' }} />
          </>
        )}
      </div>
      <CoverHeading thumb={thumb} className="uppercase" {...rise(2, { fontFamily: theme.display, fontSize: '5.8cqw', letterSpacing: '0.2em', lineHeight: 1.3, marginTop: thumb ? '6cqw' : '9cqw' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block normal-case" style={{ fontFamily: theme.script, fontSize: '1.5em', lineHeight: 0.9, letterSpacing: 0, color: theme.accentText ?? theme.accent }}>
          &amp;
        </span>
        <span className="block whitespace-nowrap">{data.bride}</span>
      </CoverHeading>
      <p className="tabular-nums uppercase" {...rise(3, { fontSize: '3.2cqw', letterSpacing: '0.32em', marginTop: '3cqw', paddingBottom: thumb ? '8cqw' : '11cqw' })}>
        {pad2(p.day)} · {pad2(p.month)} · {p.year}
      </p>
    </div>
  );
}

const COVERS: Record<CoverKind, (p: CoverProps) => React.ReactElement> = {
  dome: DomeCover,
  medallion: MedallionCover,
  'arch-floral': ArchFloralCover,
  editorial: EditorialCover,
  'oval-wash': OvalWashCover,
  poster: PosterCover,
  vintage: VintageCover,
  noir: NoirCover,
  polaroid: PolaroidCover,
  magazine: MagazineCover,
  'poster-script': PosterScriptCover,
  envelope: EnvelopeCover,
  'frame-inset': FrameInsetCover,
  split: SplitCover,
  'big-date': BigDateCover,
  collage: CollageCover,
  vertical: VerticalCover,
  stamp: StampCover,
  cinema: CinemaCover,
  newspaper: NewspaperCover,
  circle: CircleCover,
  'triple-arch': TripleArchCover,
  boarding: BoardingCover,
  calendar: CalendarCover,
  'red-poster': RedPosterCover,
  botanical: BotanicalCover,
};

/**
 * The cover. In the invitation it fills the first screen (between 1.5 and 1.86 times its width
 * tall); as a thumbnail it fills whatever box it is given.
 */
export function InvitationCover({ theme, data, thumb = false, animate = false, eager = false }: { theme: InviteTheme; data: CoverData; thumb?: boolean; animate?: boolean; eager?: boolean }) {
  const Cover = COVERS[theme.layout.cover];
  return (
    <div className={`relative w-full [container-type:inline-size] ${thumb ? 'h-full' : ''}`}>
      <header
        className={`relative w-full overflow-hidden ${animate ? 'inv-cover-in' : ''}`}
        style={{ height: thumb ? '100%' : 'max(150cqw, min(100svh, 186cqw))', color: theme.ink }}
      >
        <Cover theme={theme} data={data} thumb={thumb} eager={eager} />
      </header>
    </div>
  );
}

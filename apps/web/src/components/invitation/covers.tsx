'use client';

import React, { useId } from 'react';
import { Ornament, Seal, SongHy } from './Ornaments';
import type { CoverKind, InviteTheme } from './themes';
import { lunarLine, vnParts } from './format';
import { PhotoOr, pad2 } from './parts';

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
}

/** Staggered rise-in when the invitation opens (see .inv-cover-in in InvitationView) */
function rise(d: number, style?: React.CSSProperties): { 'data-a': ''; style: React.CSSProperties } {
  return { 'data-a': '', style: { ...style, ['--d' as string]: d } };
}

const WHITE = '#fffdf8';
const alt = (d: CoverData) => `${d.groom} và ${d.bride}`;

/* ───────────── Song Hỷ: red dome, 囍 medallion, arched portrait ───────────── */

function DomeCover({ theme, data, thumb }: CoverProps) {
  const arcId = `inv-arc-${useId().replace(/:/g, '')}`;
  const gold = theme.line;
  const nameStyle: React.CSSProperties = { fontFamily: theme.display, color: theme.onAccent, fontSize: '6.1cqw', lineHeight: 1.12, letterSpacing: '0.05em', width: 'min-content', margin: '0 auto' };
  return (
    <div className="relative flex h-full flex-col" style={{ background: theme.paper }}>
      <h1 className="sr-only">
        {data.groom} &amp; {data.bride}
      </h1>
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
          <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager className="block h-full w-full rounded-t-full" position="50% 30%" />
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
    <div className="relative flex h-full flex-col items-center justify-center text-center" style={{ background: `radial-gradient(70% 55% at 50% 40%, #5a1515 0%, ${theme.paper} 70%)`, gap: thumb ? '2.6cqw' : '4cqw' }}>
      {corner({ left: '6cqw', top: '6cqw' }, 0)}
      {corner({ right: '6cqw', top: '6cqw' }, 90)}
      {corner({ right: '6cqw', bottom: '6cqw' }, 180)}
      {corner({ left: '6cqw', bottom: '6cqw' }, 270)}
      <p className="uppercase" {...rise(0, { fontSize: '3cqw', letterSpacing: '0.42em', color: gold })}>
        {theme.layout.kicker}
      </p>
      <div className="relative rounded-full" {...rise(1, { width: thumb ? '56cqw' : '62cqw', height: thumb ? '56cqw' : '62cqw', padding: '2cqw', border: `0.4cqw solid ${gold}`, boxShadow: `0 0 0 1.4cqw ${theme.paper}, 0 0 0 1.6cqw ${gold}99, 0 2cqw 8cqw rgba(0,0,0,0.5)` })}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager className="block h-full w-full rounded-full" position="50% 35%" />
      </div>
      <h1 className="uppercase" {...rise(2, { fontFamily: theme.display, fontWeight: 600, fontSize: '6.6cqw', lineHeight: 1.15, letterSpacing: '0.08em', color: theme.ink, marginTop: thumb ? 0 : '1cqw' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block normal-case" style={{ fontFamily: theme.script, fontSize: '8cqw', lineHeight: 0.9, color: gold, letterSpacing: 0, fontWeight: 400 }}>
          &amp;
        </span>
        <span className="block whitespace-nowrap">{data.bride}</span>
      </h1>
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
    <div className="relative flex h-full flex-col items-center text-center" style={{ background: `linear-gradient(${theme.paper}, ${theme.panel})` }}>
      <p className="uppercase" {...rise(0, { fontFamily: theme.display, fontSize: '3.3cqw', letterSpacing: '0.42em', color: theme.inkSoft, paddingTop: thumb ? '8cqw' : '11cqw' })}>
        {theme.layout.kicker}
      </p>
      <div className="relative min-h-0 w-[64cqw] flex-1" {...rise(1, { marginTop: thumb ? '5cqw' : '7cqw' })}>
        <div className="absolute rounded-t-full" style={{ inset: '-2.6cqw', border: `0.3cqw solid ${theme.line}` }} />
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager className="relative block h-full w-full rounded-t-full rounded-b-[1.2cqw]" position="50% 30%" />
        {floral && (
          <>
            <img src={floral} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none" style={{ width: '58cqw', left: '-30cqw', top: '6%', transform: 'rotate(-28deg) scaleX(-1)' }} />
            <img src={floral} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none" style={{ width: '52cqw', right: '-27cqw', bottom: '-6cqw', transform: 'rotate(-12deg)' }} />
          </>
        )}
      </div>
      <h1 className="[text-wrap:balance]" {...rise(2, { fontFamily: theme.script, fontSize: '12.5cqw', lineHeight: 1.05, color: theme.accentText ?? theme.accent, padding: thumb ? '4cqw 6cqw 0' : '6cqw 6cqw 0' })}>
        {data.groom} <span style={{ fontSize: '0.6em' }}>&amp;</span> {data.bride}
      </h1>
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
      <h1 className="shrink-0 text-center" {...rise(1, { fontFamily: theme.display, fontWeight: 400, fontSize: '12.6cqw', lineHeight: 1.02, letterSpacing: '-0.01em', padding: thumb ? '7cqw 0 6cqw' : '11cqw 0 9cqw' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block italic" style={{ fontFamily: theme.script, fontSize: '0.42em', lineHeight: 1.5, color: theme.inkSoft }}>
          và
        </span>
        <span className="block whitespace-nowrap">{data.bride}</span>
      </h1>
      <div className="relative min-h-0 flex-1" {...rise(2)}>
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager className="absolute inset-0 h-full w-full" position={theme.layout.coverPosition ?? '50% 50%'} />
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
      {wash({ width: '90cqw', height: '80cqw', left: '-30cqw', top: '-18cqw' }, 'rgba(244,182,192,0.55)')}
      {wash({ width: '80cqw', height: '80cqw', right: '-34cqw', top: '30%' }, 'rgba(249,200,170,0.5)')}
      {wash({ width: '90cqw', height: '70cqw', left: '-20cqw', bottom: '-26cqw' }, 'rgba(236,164,176,0.42)')}
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
            <img src={floral} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none" style={{ width: '58cqw', left: '-24cqw', bottom: '-7cqw', transform: 'rotate(-14deg)' }} />
            <img src={floral} alt="" aria-hidden="true" className="pointer-events-none absolute max-w-none" style={{ width: '34cqw', right: '-19cqw', top: '52%', transform: 'rotate(118deg)' }} />
          </>
        )}
      </div>
      <h1 className="[text-wrap:balance]" {...rise(2, { fontFamily: theme.script, fontSize: '11.4cqw', lineHeight: 1.1, color: theme.ink, padding: thumb ? '4cqw 6cqw 0' : '6cqw 6cqw 0' })}>
        {data.groom} <span style={{ color: theme.accentText ?? theme.accent }}>&amp;</span> {data.bride}
      </h1>
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
        {data.cover && <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager zoom={!thumb} className="absolute inset-0 h-full w-full" position={position} />}
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
        <h1 className="uppercase [text-wrap:balance]" {...rise(2, { fontFamily: theme.display, fontWeight: 300, fontSize: '6.4cqw', letterSpacing: '0.2em', lineHeight: 1.35, marginTop: '2cqw' })}>
          {data.groom} &amp; {data.bride}
        </h1>
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
        <h1 {...rise(1, { fontFamily: theme.script, fontSize: '12.4cqw', lineHeight: 1.05, color: '#f3e6c4' })}>
          <span className="block whitespace-nowrap">{data.groom}</span>
          <span className="block" style={{ fontSize: '0.55em', color: gold }}>
            &amp;
          </span>
          <span className="block whitespace-nowrap">{data.bride}</span>
        </h1>
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
        <h1 className="uppercase" {...rise(2, { fontFamily: theme.display, fontWeight: 900, fontSize: '9.8cqw', lineHeight: 0.94, letterSpacing: '-0.02em' })}>
          <span className="block whitespace-nowrap">{data.groom}</span>
          <span className="block whitespace-nowrap">
            <span className="italic" style={{ color: red, fontWeight: 400 }}>
              &amp;{' '}
            </span>
            {data.bride}
          </span>
        </h1>
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
        <h1 className="uppercase [text-wrap:balance]" {...rise(2, { fontFamily: theme.display, fontWeight: 300, fontSize: '5.6cqw', letterSpacing: '0.24em', lineHeight: 1.4 })}>
          {data.groom} &amp; {data.bride}
        </h1>
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
        <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager className="block h-full w-full rounded-[50%]" position="50% 30%" />
      </div>
      <h1 className="uppercase" {...rise(2, { fontFamily: theme.display, fontSize: '5.4cqw', letterSpacing: '0.22em', lineHeight: 1.25, marginTop: thumb ? '5cqw' : '8cqw' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block normal-case" style={{ fontFamily: theme.script, fontWeight: 700, fontSize: '1.7em', lineHeight: 0.9, letterSpacing: 0, color: theme.accentText ?? theme.accent }}>
          &amp;
        </span>
        <span className="block whitespace-nowrap">{data.bride}</span>
      </h1>
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
      <PhotoOr src={src} alt="" theme={theme} small eager className="block aspect-[4/5] w-full" />
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
      <h1 className="[text-wrap:balance]" {...rise(2, { fontFamily: theme.script, fontWeight: 700, fontSize: '9.6cqw', lineHeight: 1.15, color: theme.ink, padding: '0 6cqw' })}>
        {data.groom} <span style={{ color: theme.accent }}>♥</span> {data.bride}
      </h1>
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
          <PhotoOr src={data.cover} alt={alt(data)} theme={theme} small={thumb} eager className="block h-full w-full" position="50% 30%" />
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
      <h1 {...rise(2, { fontFamily: theme.display, fontSize: '10.6cqw', lineHeight: 1.08, color: theme.accentText ?? theme.ink, marginTop: thumb ? '4cqw' : '7cqw' })}>
        <span className="block whitespace-nowrap">{data.groom}</span>
        <span className="block whitespace-nowrap">
          <span style={{ fontFamily: theme.script, fontSize: '0.8em', color: theme.inkSoft }}>&amp;</span> {data.bride}
        </span>
      </h1>
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
};

/**
 * The cover. In the invitation it fills the first screen (between 1.5 and 1.86 times its width
 * tall); as a thumbnail it fills whatever box it is given.
 */
export function InvitationCover({ theme, data, thumb = false, animate = false }: { theme: InviteTheme; data: CoverData; thumb?: boolean; animate?: boolean }) {
  const Cover = COVERS[theme.layout.cover];
  return (
    <div className={`relative w-full [container-type:inline-size] ${thumb ? 'h-full' : ''}`}>
      <header
        className={`relative w-full overflow-hidden ${animate ? 'inv-cover-in' : ''}`}
        style={{ height: thumb ? '100%' : 'max(150cqw, min(100svh, 186cqw))', color: theme.ink }}
      >
        <Cover theme={theme} data={data} thumb={thumb} />
      </header>
    </div>
  );
}

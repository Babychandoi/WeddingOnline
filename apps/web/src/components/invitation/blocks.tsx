'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CalendarPlus, ChevronDown, MapPin } from 'lucide-react';
import { INVITATION_EVENT_LABELS, invitationMapLink, type InvitationEvent } from '@dco/shared';
import { primaryButton } from './InvitationForms';
import { Ornament } from './Ornaments';
import type { InviteTheme } from './themes';
import { calendarLink, lunarLine, lunarShort, vnDate, vnParts, vnTime } from './format';
import type { InvitationPhoto } from './InvitationView';
import { Photo, keepAbbr, pad2 } from './parts';

/* ───────────────────────── Reveal on scroll ───────────────────────── */

/** Adds .is-in once the element is on screen (the fade itself lives in InvitationView's CSS) */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ───────────────────────── Headings ───────────────────────── */

export interface SectionTitle {
  title: string;
  /** Small line above the title (script and numbered headings) */
  kicker: string;
  index: number;
}

export function SectionHeading({ id, theme, t }: { id: string; theme: InviteTheme; t: SectionTitle }) {
  const accent = theme.accentText ?? theme.accent;
  switch (theme.layout.heading) {
    case 'band':
      return (
        <div className="-mx-6 mb-10 sm:-mx-10">
          <h2
            id={`${id}-title`}
            className="relative py-3.5 text-center text-[clamp(1.35rem,5.6vw,1.75rem)] leading-tight"
            style={{ background: theme.accent, color: theme.onAccent, fontFamily: theme.display, boxShadow: `inset 0 4px 0 -2px ${theme.line}, inset 0 -4px 0 -2px ${theme.line}` }}
          >
            {t.title}
          </h2>
        </div>
      );
    case 'caps':
      return (
        <div className="mb-10 flex items-center justify-center gap-4">
          <span className="h-px w-8 shrink-0" style={{ background: theme.ink }} aria-hidden="true" />
          <h2 id={`${id}-title`} className="text-[13px] uppercase leading-snug tracking-[0.3em] [text-wrap:balance]" style={{ fontFamily: theme.body }}>
            {t.title}
          </h2>
          <span className="h-px w-8 shrink-0" style={{ background: theme.ink }} aria-hidden="true" />
        </div>
      );
    case 'script':
      return (
        <div className="mb-9">
          <p className="text-[12.5px] uppercase tracking-[0.36em]" style={{ color: theme.inkSoft, fontFamily: theme.display }}>
            {t.kicker}
          </p>
          <h2 id={`${id}-title`} className="mt-1 text-[clamp(2.3rem,10vw,3rem)] leading-[1.15] [text-wrap:balance]" style={{ fontFamily: theme.script, color: accent }}>
            {t.title}
          </h2>
          <div className="mt-2 opacity-90">
            <Ornament kind={theme.ornament} theme={theme} variant="divider" />
          </div>
        </div>
      );
    case 'numbered':
      return (
        <div className="mb-9 flex items-end gap-4 border-t-[3px] pt-4 text-left" style={{ borderColor: theme.ink }}>
          <span className="text-[3.2rem] font-black leading-[0.8] tabular-nums" style={{ fontFamily: theme.display, color: theme.accent }} aria-hidden="true">
            {pad2(t.index)}
          </span>
          <div className="min-w-0 pb-0.5">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.24em]" style={{ color: theme.inkSoft }}>
              {t.kicker}
            </p>
            <h2 id={`${id}-title`} className="text-[clamp(1.5rem,6.4vw,1.9rem)] font-bold italic leading-tight" style={{ fontFamily: theme.display }}>
              {t.title}
            </h2>
          </div>
        </div>
      );
    default:
      return (
        <>
          <h2
            id={`${id}-title`}
            className="leading-tight [text-wrap:balance]"
            style={theme.namesIn === 'script' ? { fontFamily: theme.script, fontSize: 'clamp(2.2rem,8.6vw,2.8rem)', color: accent } : { fontFamily: theme.display, fontSize: 'clamp(1.55rem,6vw,2rem)' }}
          >
            {t.title}
          </h2>
          <div className="mb-9 mt-3">
            <Ornament kind={theme.ornament} theme={theme} variant="divider" />
          </div>
        </>
      );
  }
}

export function Section({ id, t, theme, children, tight = false, className = '', style }: { id: string; t?: SectionTitle; theme: InviteTheme; children: React.ReactNode; tight?: boolean; className?: string; style?: React.CSSProperties }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} id={id} aria-labelledby={t ? `${id}-title` : undefined} className={`inv-reveal relative px-6 text-center sm:px-10 ${tight ? 'py-11' : 'py-16'} ${className}`} style={style}>
      {t && <SectionHeading id={id} theme={theme} t={t} />}
      {children}
    </section>
  );
}

/* ───────────────────────── Events ───────────────────────── */

interface EventsProps {
  theme: InviteTheme;
  events: InvitationEvent[];
  couple: string;
  message: string;
}

function Actions({ e, couple, message, align = 'center', inkOverride }: { e: InvitationEvent; couple: string; message: string; align?: 'center' | 'start'; inkOverride?: string }) {
  const map = invitationMapLink(e);
  const where = [e.venueName, e.address].filter(Boolean).join(', ');
  return (
    <div className={`mt-5 flex flex-wrap gap-2.5 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
      {map && (
        <a href={map} target="_blank" rel="noopener noreferrer" className={primaryButton}>
          <MapPin className="h-4 w-4" /> Chỉ đường
        </a>
      )}
      <a
        href={calendarLink(`${e.title} · ${couple}`, e.startsAt, where, message)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--inv-btn-r)] border px-6 text-[15px] font-semibold transition hover:brightness-110"
        style={{ borderColor: 'var(--inv-accent)', color: inkOverride ?? 'var(--inv-ink)' }}
      >
        <CalendarPlus className="h-4 w-4" /> Lưu vào lịch
      </a>
    </div>
  );
}

/** "THỨ BẢY | 20 | THÁNG 12 2026" */
function DayRow({ theme, iso, ink, num, rule }: { theme: InviteTheme; iso: string; ink: string; num: string; rule: string }) {
  const p = vnParts(iso);
  const side = 'border-y py-1.5 text-[13.5px] uppercase leading-snug tracking-[0.14em]';
  return (
    <div className="mx-auto mt-4 grid max-w-[330px] grid-cols-[1fr_auto_1fr] items-center gap-4" style={{ fontFamily: theme.display, color: ink }}>
      <div className={side} style={{ borderColor: rule }}>
        {p.weekday}
      </div>
      <div className="text-[clamp(3rem,14vw,3.6rem)] leading-none tabular-nums" style={{ color: num }}>
        {pad2(p.day)}
      </div>
      <div className={side} style={{ borderColor: rule }}>
        Tháng {p.month}
        <span className="block tabular-nums">{p.year}</span>
      </div>
    </div>
  );
}

function ColumnEvent({ theme, e, couple, message, ink, soft, num, rule }: { theme: InviteTheme; e: InvitationEvent; couple: string; message: string; ink: string; soft: string; num: string; rule: string }) {
  return (
    <>
      <h3 className="text-[15px] font-semibold uppercase tracking-[0.26em]" style={{ color: num, fontFamily: theme.display }}>
        {e.title || INVITATION_EVENT_LABELS[e.kind]}
      </h3>
      <p className="mt-3 text-[14px] uppercase tracking-[0.2em]" style={{ color: soft }}>
        Vào lúc{' '}
        <span className="text-[1.3em] font-semibold tabular-nums tracking-[0.08em]" style={{ color: ink }}>
          {vnTime(e.startsAt)}
        </span>
      </p>
      <DayRow theme={theme} iso={e.startsAt} ink={ink} num={num} rule={rule} />
      <p className="mt-3 text-[14.5px] italic" style={{ color: soft }}>
        ({lunarLine(e.startsAt)})
      </p>
      {e.venueName && (
        <p className="mt-5 text-[17px] font-semibold leading-snug [text-wrap:balance]" style={{ color: ink }}>
          {e.venueName}
        </p>
      )}
      {e.address && (
        <p className="mx-auto mt-1 max-w-[34ch] text-[15px] leading-relaxed [text-wrap:balance]" style={{ color: soft }}>
          {keepAbbr(e.address)}
        </p>
      )}
      {e.note && (
        <p className="mt-1 text-[14px] italic" style={{ color: soft }}>
          {e.note}
        </p>
      )}
      <Actions e={e} couple={couple} message={message} inkOverride={ink} />
    </>
  );
}

export function EventsBlock({ theme, events, couple, message }: EventsProps) {
  const accent = theme.accentText ?? theme.accent;
  const kind = theme.layout.events;

  if (kind === 'panel') {
    const ink = theme.panelInk ?? theme.ink;
    const btn = theme.panelInk ? theme.line : theme.accent;
    const btnInk = theme.panelInk ? theme.ink : theme.onAccent;
    return (
      <ol className="space-y-5">
        {events.map((e) => (
          <li
            key={e.id}
            className="relative rounded-[calc(var(--inv-r)+6px)] px-5 py-10 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]"
            style={{ background: theme.panel, color: ink, ['--inv-accent' as string]: btn, ['--inv-on-accent' as string]: btnInk, ['--inv-ink' as string]: ink }}
          >
            <div className="pointer-events-none absolute inset-[7px] rounded-[var(--inv-r)] border" style={{ borderColor: `${theme.line}88` }} aria-hidden="true" />
            <ColumnEvent theme={theme} e={e} couple={couple} message={message} ink={ink} soft={theme.panelInk ? `${ink}c8` : theme.inkSoft} num={btn} rule={`${theme.line}aa`} />
          </li>
        ))}
      </ol>
    );
  }

  if (kind === 'ticket') {
    return (
      <ol className="mx-auto max-w-[420px] space-y-6">
        {events.map((e) => {
          const p = vnParts(e.startsAt);
          return (
            <li key={e.id} className="relative overflow-hidden rounded-[18px] text-left shadow-[0_16px_36px_-20px_rgba(0,0,0,0.4)]" style={{ background: '#ffffff', border: `1px solid ${theme.line}` }}>
              <div className="flex items-center justify-between gap-3 px-5 py-3" style={{ background: theme.accent, color: theme.onAccent }}>
                <h3 className="text-[14px] font-bold uppercase tracking-[0.2em]">{e.title || INVITATION_EVENT_LABELS[e.kind]}</h3>
                <span className="text-[13px] opacity-90">{lunarShort(e.startsAt)}</span>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-5 px-5 pb-5 pt-4">
                <div className="text-center">
                  <p className="text-[12px] uppercase tracking-[0.14em]" style={{ color: theme.inkSoft }}>
                    {p.weekday}
                  </p>
                  <p className="text-[3.1rem] font-semibold leading-none tabular-nums" style={{ color: accent, fontFamily: theme.display }}>
                    {pad2(p.day)}
                  </p>
                  <p className="mt-1 text-[13px] uppercase tracking-[0.1em]">
                    Th{pad2(p.month)} · {p.year}
                  </p>
                </div>
                <div className="min-w-0 border-l pl-5" style={{ borderColor: theme.line }}>
                  <p className="text-[11.5px] uppercase tracking-[0.2em]" style={{ color: theme.inkSoft }}>
                    Giờ
                  </p>
                  <p className="text-[1.9rem] font-semibold leading-tight tabular-nums">{vnTime(e.startsAt)}</p>
                  {e.venueName && (
                    <>
                      <p className="mt-2 text-[11.5px] uppercase tracking-[0.2em]" style={{ color: theme.inkSoft }}>
                        Địa điểm
                      </p>
                      <p className="text-[16px] font-semibold leading-snug">{e.venueName}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="relative mx-5 border-t-2 border-dashed" style={{ borderColor: theme.line }} aria-hidden="true">
                <span className="absolute -left-[31px] -top-[11px] block h-5 w-5 rounded-full" style={{ background: theme.paper, boxShadow: `inset -1px 0 0 ${theme.line}` }} />
                <span className="absolute -right-[31px] -top-[11px] block h-5 w-5 rounded-full" style={{ background: theme.paper, boxShadow: `inset 1px 0 0 ${theme.line}` }} />
              </div>
              <div className="px-5 pb-5 pt-4">
                {e.address && <p className="text-[15px] leading-relaxed" style={{ color: theme.inkSoft }}>{keepAbbr(e.address)}</p>}
                {e.note && <p className="mt-1 text-[14px] italic" style={{ color: theme.inkSoft }}>{e.note}</p>}
                <Actions e={e} couple={couple} message={message} align="start" />
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  if (kind === 'editorial') {
    return (
      <ol className="border-t text-left" style={{ borderColor: theme.ink }}>
        {events.map((e) => {
          const map = invitationMapLink(e);
          const where = [e.venueName, e.address].filter(Boolean).join(', ');
          return (
            <li key={e.id} className="grid grid-cols-[minmax(0,7.2rem)_1fr] gap-5 border-b py-7" style={{ borderColor: theme.line }}>
              <div>
                <p className="text-[2.15rem] leading-none tabular-nums" style={{ fontFamily: theme.display, fontWeight: theme.namesWeight === 900 ? 700 : 400 }}>
                  {vnTime(e.startsAt)}
                </p>
                <p className="mt-2 text-[12px] uppercase tracking-[0.2em]" style={{ color: theme.inkSoft }}>
                  {vnDate(e.startsAt)}
                </p>
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.3em]" style={{ color: theme.accent === theme.ink ? theme.ink : theme.accent }}>
                  {e.title || INVITATION_EVENT_LABELS[e.kind]}
                </h3>
                <p className="mt-1 text-[15px]">
                  {vnParts(e.startsAt).weekday} · {lunarShort(e.startsAt)}
                </p>
                {e.venueName && <p className="mt-3 text-[16.5px] font-semibold leading-snug">{e.venueName}</p>}
                {e.address && <p className="text-[14.5px] leading-relaxed" style={{ color: theme.inkSoft }}>{keepAbbr(e.address)}</p>}
                {e.note && <p className="mt-1 text-[14px] italic" style={{ color: theme.inkSoft }}>{e.note}</p>}
                <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14.5px] font-semibold">
                  {map && (
                    <a href={map} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 underline decoration-1 underline-offset-[6px]">
                      <MapPin className="h-4 w-4" /> Chỉ đường
                    </a>
                  )}
                  <a href={calendarLink(`${e.title} · ${couple}`, e.startsAt, where, message)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1.5 underline decoration-1 underline-offset-[6px]">
                    <CalendarPlus className="h-4 w-4" /> Lưu vào lịch
                  </a>
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol>
      {events.map((e, i) => (
        <li key={e.id}>
          {i > 0 && (
            <div className="my-11 opacity-80" aria-hidden="true">
              <Ornament kind={theme.ornament} theme={theme} variant="divider" />
            </div>
          )}
          <ColumnEvent theme={theme} e={e} couple={couple} message={message} ink={theme.ink} soft={theme.inkSoft} num={accent} rule={theme.line} />
        </li>
      ))}
    </ol>
  );
}

/* ───────────────────────── Month calendar ───────────────────────── */

export function MonthCalendar({ theme, iso }: { theme: InviteTheme; iso: string }) {
  const p = vnParts(iso);
  const first = new Date(Date.UTC(p.year, p.month - 1, 1)).getUTCDay();
  const offset = (first + 6) % 7; // weeks start on Monday
  const days = new Date(Date.UTC(p.year, p.month, 0)).getUTCDate();
  const cells: Array<number | null> = [...Array.from({ length: offset }, () => null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const dark = theme.layout.events === 'panel' && !!theme.panelInk;
  const ink = dark ? theme.panelInk! : theme.ink;
  return (
    <div className="mx-auto max-w-[360px] rounded-[calc(var(--inv-r)+4px)] px-4 pb-5 pt-4" style={{ background: dark ? theme.panel : theme.panel, color: ink, border: `1px solid ${theme.line}${dark ? '66' : ''}` }}>
      <p className="mb-3 text-[15px] uppercase tracking-[0.22em]" style={{ fontFamily: theme.display }}>
        Tháng {p.month} · {p.year}
      </p>
      <div className="grid grid-cols-7 gap-y-1.5 text-[14px] tabular-nums" role="grid" aria-label={`Lịch tháng ${p.month} năm ${p.year}`}>
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <span key={d} className="pb-1 text-[12px] font-semibold" style={{ color: dark ? `${ink}b0` : theme.inkSoft }} role="columnheader">
            {d}
          </span>
        ))}
        {cells.map((d, i) =>
          d === p.day ? (
            <span key={i} className="relative grid h-9 place-items-center font-bold" style={{ color: dark ? theme.ink : theme.onAccent }} aria-label={`Ngày cưới, ${d}`}>
              <svg viewBox="0 0 24 24" className="absolute h-10 w-10 motion-safe:animate-[inv-beat_1.6s_ease-in-out_infinite]" aria-hidden="true">
                <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill={dark ? theme.line : theme.accent} />
              </svg>
              <span className="relative">{d}</span>
            </span>
          ) : (
            <span key={i} className="grid h-9 place-items-center" style={{ opacity: d ? 1 : 0 }}>
              {d ?? ''}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── Album ───────────────────────── */

export function Album({ theme, photos, onOpen }: { theme: InviteTheme; photos: InvitationPhoto[]; onOpen: (i: number) => void }) {
  const kind = theme.layout.album;
  const base = kind === 'tall3' || kind === 'mosaic' ? 9 : kind === 'film' ? 12 : 6;
  // a "show more" for one or two photos is not worth the tap
  const first = photos.length <= base + 2 ? photos.length : base;
  const [all, setAll] = useState(false);
  const shown = all ? photos.slice(0, 18) : photos.slice(0, first);
  const more = !all && photos.length > first;

  const tile = (ph: InvitationPhoto, i: number, className: string, imgClass = 'h-full w-full', style?: React.CSSProperties) => (
    <button key={ph.id} type="button" onClick={() => onOpen(i)} className={`group block overflow-hidden ${className}`} style={style} aria-label={`Xem ảnh ${i + 1}${ph.caption ? `: ${ph.caption}` : ''}`}>
      <Photo src={ph.url} alt={ph.caption ?? `Ảnh cưới ${i + 1}`} theme={theme} small className={`${imgClass} transition duration-700 group-hover:scale-[1.05]`} />
    </button>
  );

  let grid: React.ReactNode;
  switch (kind) {
    case 'tall3':
      grid = <div className="grid grid-cols-3 gap-2">{shown.map((ph, i) => tile(ph, i, 'aspect-[9/16] rounded-[var(--inv-r)]'))}</div>;
      break;
    case 'grid2':
      grid = <div className="grid grid-cols-2 gap-3">{shown.map((ph, i) => tile(ph, i, 'aspect-[4/5]'))}</div>;
      break;
    case 'masonry':
      grid = <div className="columns-2 gap-2.5 [&>button]:mb-2.5">{shown.map((ph, i) => tile(ph, i, 'w-full break-inside-avoid rounded-[var(--inv-r)]', 'block h-auto w-full'))}</div>;
      break;
    case 'polaroid': {
      const tilt = [-2.6, 2, 1.4, -1.8, 2.4, -1.2];
      grid = (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 px-1">
          {shown.map((ph, i) =>
            tile(ph, i, 'bg-white p-2 pb-8 shadow-[0_10px_24px_-12px_rgba(92,36,54,0.45)] transition hover:rotate-0', 'aspect-[4/5] w-full', { transform: `rotate(${tilt[i % tilt.length]}deg)` }),
          )}
        </div>
      );
      break;
    }
    case 'film':
      grid = (
        <div className="-mx-6 py-4 sm:-mx-10" style={{ background: '#0f0f0f' }}>
          <div className="h-3" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 10px, #f4f4f4 10px 20px, transparent 20px 30px)', backgroundSize: '30px 6px', backgroundRepeat: 'repeat-x', backgroundPosition: 'center' }} aria-hidden="true" />
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 py-3 [scrollbar-width:none] sm:px-10">
            {shown.map((ph, i) => (
              <div key={ph.id} className="relative w-[72%] shrink-0 snap-center sm:w-[60%]">
                {tile(ph, i, 'aspect-[3/4] w-full')}
                <span className="absolute left-2 top-2 bg-white px-1.5 text-[11px] font-bold tabular-nums text-black">{pad2(i + 1)}</span>
              </div>
            ))}
          </div>
          <div className="h-3" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 10px, #f4f4f4 10px 20px, transparent 20px 30px)', backgroundSize: '30px 6px', backgroundRepeat: 'repeat-x', backgroundPosition: 'center' }} aria-hidden="true" />
          <p className="mt-2 text-center text-[12px] font-bold uppercase tracking-[0.24em] text-white/80">Vuốt để xem · {photos.length} ảnh</p>
        </div>
      );
      break;
    default:
      grid = <div className="grid grid-cols-3 gap-1.5">{shown.map((ph, i) => tile(ph, i, `${i === 0 ? 'col-span-2 row-span-2' : ''} aspect-square rounded-[calc(var(--inv-r)/2)]`))}</div>;
  }

  return (
    <>
      {grid}
      {more && kind !== 'film' && (
        <button type="button" onClick={() => setAll(true)} className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 px-4 text-[15px] font-semibold" style={{ color: theme.accentText ?? theme.accent }}>
          Xem thêm {photos.length - first} ảnh <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </>
  );
}

/* ───────────────────────── Photo interlude ───────────────────────── */

export function Interlude({ theme, src, alt, quote, eager = false }: { theme: InviteTheme; src: string; alt: string; quote: string; eager?: boolean }) {
  const ref = useReveal<HTMLElement>();
  const kind = theme.layout.interlude;
  if (kind === 'none' || !src) return null;
  const overlayQuote = quote && (
    <figcaption className="absolute inset-x-0 bottom-0 px-7 pb-8 pt-24 text-center" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62), transparent)', color: '#fffdf8' }}>
      <p className="mx-auto max-w-[30ch] text-[clamp(1.15rem,4.8vw,1.4rem)] italic leading-snug [text-wrap:balance]" style={{ fontFamily: theme.display }}>
        “{quote}”
      </p>
    </figcaption>
  );
  if (kind === 'full') {
    return (
      <figure ref={ref} className="inv-reveal relative">
        <Photo src={src} alt={alt} theme={theme} eager={eager} className="block aspect-[4/5] w-full" />
        {overlayQuote}
      </figure>
    );
  }
  if (kind === 'rounded') {
    return (
      <figure ref={ref} className="inv-reveal relative mx-6 overflow-hidden rounded-[22px] sm:mx-10">
        <Photo src={src} alt={alt} theme={theme} eager={eager} className="block aspect-[4/5] w-full" />
        {overlayQuote}
      </figure>
    );
  }
  return (
    <figure ref={ref} className="inv-reveal px-9 text-center sm:px-14">
      <div className="p-2" style={{ border: `1px solid ${theme.line}` }}>
        <Photo src={src} alt={alt} theme={theme} eager={eager} className="block aspect-[4/5] w-full" />
      </div>
      {quote && (
        <figcaption className="mx-auto mt-6 max-w-[32ch] text-[17px] italic leading-relaxed [text-wrap:balance]" style={{ color: theme.inkSoft, fontFamily: theme.display }}>
          “{quote}”
        </figcaption>
      )}
    </figure>
  );
}

/* ───────────────────────── Closing ───────────────────────── */

export function ClosingPhoto({ theme, src, thanks, couple }: { theme: InviteTheme; src: string; thanks: string; couple: string }) {
  const ref = useReveal<HTMLElement>();
  return (
    <section ref={ref} className="inv-reveal relative overflow-hidden" aria-label="Lời cảm ơn">
      <Photo src={src} alt="" theme={theme} className="block aspect-[4/5] min-h-[460px] w-full" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0) 22%, rgba(0,0,0,0.38) 52%, rgba(0,0,0,0.8) 100%)' }} aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 px-7 pb-10 text-center" style={{ color: '#fffdf8', textShadow: '0 1px 14px rgba(0,0,0,0.35)' }}>
        <p className="text-[clamp(3.2rem,15vw,4.4rem)] leading-none" style={{ fontFamily: theme.namesIn === 'script' ? theme.script : 'var(--f-great-vibes), cursive' }}>
          Thank you
        </p>
        {thanks && <p className="mx-auto mt-4 max-w-[34ch] text-[16px] leading-relaxed [text-wrap:pretty]">{thanks}</p>}
        <p className="mt-4 text-[13px] uppercase tracking-[0.32em] opacity-90">{couple}</p>
      </div>
    </section>
  );
}

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarPlus, ChevronLeft, ChevronRight, MapPin, Music2, Share2, Sparkles, VolumeX, X } from 'lucide-react';
import { INVITATION_EVENT_LABELS, invitationMapLink, type InvitationConfig, type InvitationTemplateId } from '@dco/shared';
import type { InvitationWish } from '@/app/api/invitations/[slug]/wishes/route';
import { INVITATION_FONT_VARS } from './fonts';
import { GiftBox, RsvpForm, WishesSection, primaryButton } from './InvitationForms';
import { Ornament, Seal } from './Ornaments';
import { INVITE_THEMES, type InviteTheme } from './themes';
import { MusicBox } from './musicBox';
import { calendarLink, lunarLine, lunarShort, vnDate, vnParts, vnTime } from './format';

export interface InvitationPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export interface InvitationViewProps {
  slug: string;
  groomName: string;
  brideName: string;
  weddingDate: string;
  config: InvitationConfig;
  photos: InvitationPhoto[];
  /** From the personal link (?khach=…) */
  guestName: string | null;
  gift: { enabled: boolean; bankName: string | null };
  hallUrl: string | null;
  venueThumb: string | null;
  initialWishes: InvitationWish[];
  /** Sample invitation in the template gallery: nothing is sent */
  demo?: boolean;
  /** Editor preview: no envelope, no music */
  embedded?: boolean;
}

/** Paper grain as a tiny SVG noise tile */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.4 0 0 0 0 0.3 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

const SHAPE: Record<InviteTheme['shape'], { r: string; btn: string }> = {
  soft: { r: '12px', btn: '999px' },
  gentle: { r: '4px', btn: '4px' },
  square: { r: '0px', btn: '0px' },
};

/** Dark papers take the grain lightened in, light papers darkened in */
function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 110;
}

function Grain({ paper, strength }: { paper: string; strength: number }) {
  const dark = isDark(paper);
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: GRAIN, opacity: Math.min(0.55, strength * (dark ? 1.1 : 0.8)), mixBlendMode: dark ? 'screen' : 'multiply' }}
      aria-hidden="true"
    />
  );
}

/** The border printed around the whole card */
function CardFrame({ theme }: { theme: InviteTheme }) {
  if (theme.cardFrame === 'none') return null;
  const c = theme.line;
  if (theme.cardFrame === 'hairline') return <div className="pointer-events-none absolute inset-[10px] z-[1]" style={{ border: `1px solid ${c}` }} aria-hidden="true" />;
  if (theme.cardFrame === 'double')
    return (
      <>
        <div className="pointer-events-none absolute inset-[8px] z-[1]" style={{ border: `3px double ${c}` }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[16px] z-[1]" style={{ border: `1px dashed ${c}` }} aria-hidden="true" />
      </>
    );
  return (
    <>
      <div className="pointer-events-none absolute inset-[9px] z-[1]" style={{ border: `1.5px solid ${c}` }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-[14px] z-[1]" style={{ border: `1px solid ${c}`, opacity: 0.55 }} aria-hidden="true" />
    </>
  );
}

/** Keep abbreviations with the word after them (TP. Huế, Q. 3) */
const keepAbbr = (s: string) => s.replace(/\b(TP|Tp|Q|P|X|H|TT)\. /g, '$1.\u00a0');

/** A person's name never breaks across lines unless it is unusually long */
function Name({ children }: { children: string }) {
  return <span className={children.length <= 28 ? 'whitespace-nowrap' : undefined}>{children}</span>;
}

function themeVars(t: InviteTheme): React.CSSProperties {
  return {
    '--inv-ground': t.ground,
    '--inv-paper': t.paper,
    '--inv-ink': t.ink,
    '--inv-ink-soft': t.inkSoft,
    '--inv-accent': t.accent,
    '--inv-accent-text': t.accentText ?? t.accent,
    '--inv-r': SHAPE[t.shape].r,
    '--inv-btn-r': SHAPE[t.shape].btn,
    '--inv-btn-shadow': t.shape === 'soft' ? '0 6px 18px -6px rgba(0,0,0,0.45)' : 'none',
    '--inv-on-accent': t.onAccent,
    '--inv-line': t.line,
    '--inv-panel': t.panel,
    '--inv-display': t.display,
    '--inv-script': t.script,
    '--inv-body': t.body,
  } as React.CSSProperties;
}

function initials(a: string, b: string): string {
  const first = (s: string) => s.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() ?? '';
  return `${first(a)}${first(b)}`;
}

/* ───────────────────────── Envelope ───────────────────────── */

function Envelope({ theme, guestName, couple, monogram, onOpen }: { theme: InviteTheme; guestName: string | null; couple: string; monogram: string; onOpen: () => void }) {
  const [phase, setPhase] = useState<'closed' | 'opening' | 'gone'>('closed');
  const env = theme.envelope;

  const open = () => {
    if (phase !== 'closed') return;
    onOpen();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return setPhase('gone');
    setPhase('opening');
    setTimeout(() => setPhase('gone'), 1900);
  };

  if (phase === 'gone') return null;
  const opening = phase === 'opening';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-5 transition-opacity duration-500 ${opening ? 'pointer-events-none opacity-0 [transition-delay:1350ms]' : ''}`}
      style={{ background: theme.ground }}
    >
      <button
        type="button"
        onClick={open}
        aria-label="Mở thiệp cưới"
        className="group relative h-[min(72vh,620px)] w-[min(88vw,460px)] outline-none [perspective:1200px] focus-visible:ring-4 focus-visible:ring-white/60"
      >
        {/* Card inside, rising out */}
        <div
          className="absolute inset-x-[7%] top-[5%] h-[88%] rounded-[3px] shadow-md transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] [transition-delay:520ms]"
          style={{ background: theme.paper, transform: opening ? 'translateY(-70%)' : 'translateY(0)' }}
        >
          <div className="flex h-full flex-col items-center justify-start pt-[9%]">
            <span className="text-[clamp(1.6rem,7vw,2.3rem)] leading-none" style={{ color: theme.accentText ?? theme.accent, fontFamily: theme.script }}>
              {monogram}
            </span>
          </div>
        </div>
        {/* Envelope body with pocket flaps */}
        <div className="absolute inset-0 overflow-hidden rounded-[6px]" style={{ background: env.body, boxShadow: `inset 0 0 0 1px ${theme.line}88, 0 30px 60px -20px rgba(0,0,0,0.6)` }}>
          <Grain paper={env.body} strength={Math.max(0.3, theme.grain)} />
        </div>
        <div className="absolute inset-0 [clip-path:polygon(0_0,54%_50%,0_100%)]" style={{ background: env.flap, filter: 'brightness(0.94)' }} />
        <div className="absolute inset-0 [clip-path:polygon(100%_0,46%_50%,100%_100%)]" style={{ background: env.flap, filter: 'brightness(0.9)' }} />
        <div className="absolute inset-0 [clip-path:polygon(0_100%,50%_44%,100%_100%)]" style={{ background: env.body, filter: 'brightness(1.04)' }} />
        {/* Address */}
        <div className="absolute inset-x-0 bottom-[9%] z-[2] text-center" style={{ color: env.text }}>
          <p className="text-[15px] tracking-[0.22em]" style={{ fontFamily: theme.display }}>
            KÍNH MỜI
          </p>
          <p className="mt-2 px-6 text-[clamp(1.9rem,9vw,2.6rem)] leading-tight [text-wrap:balance]" style={{ fontFamily: theme.script }}>
            {guestName || 'Quý khách'}
          </p>
        </div>
        {/* Top flap, swinging open */}
        <div
          className="absolute inset-x-0 top-0 z-[3] h-[46%] origin-top transition-transform duration-[650ms] ease-[cubic-bezier(0.5,0,0.2,1)] [transform-style:preserve-3d]"
          style={{ transform: opening ? 'rotateX(180deg)' : 'rotateX(0deg)' }}
        >
          <div className="absolute inset-0 [backface-visibility:hidden] [clip-path:polygon(0_0,100%_0,50%_100%)]" style={{ background: env.flap }} />
          <div className="absolute inset-0 flex items-start justify-center pt-[10%] [backface-visibility:hidden] [clip-path:polygon(0_0,100%_0,50%_100%)] [transform:rotateX(180deg)]" style={{ background: env.liner }}>
            <div className="w-[60%] opacity-50">
              <Ornament kind={theme.ornament} theme={{ ...theme, accent: env.flap, line: env.flap, ink: env.flap }} variant="divider" />
            </div>
          </div>
        </div>
        {/* Seal */}
        <div
          className={`absolute left-1/2 top-[46%] z-[4] -translate-x-1/2 -translate-y-1/2 [&_svg]:h-[5.2rem] [&_svg]:w-[5.2rem] transition-all duration-300 ${opening ? 'scale-75 opacity-0' : 'group-hover:scale-105'}`}
        >
          <Seal theme={theme} monogram={monogram} />
        </div>
      </button>
      <p className="mt-7 text-[16px] font-medium" style={{ color: env.text === theme.ground ? theme.ink : env.text }}>
        Chạm vào thiệp để mở
      </p>
    </div>
  );
}

/* ───────────────────────── Petals ───────────────────────── */

function Petals({ colors }: { colors: string[] }) {
  const items = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i * 1.7) % 12,
        dur: 11 + ((i * 5) % 7),
        size: 9 + ((i * 3) % 8),
        color: colors[i % colors.length],
        drift: i % 2 ? 40 : -40,
      })),
    [colors],
  );
  if (colors.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden motion-reduce:hidden" aria-hidden="true">
      {items.map((p, i) => (
        <span
          key={i}
          className="absolute -top-6 block rounded-[80%_0_80%_0] opacity-80"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.8,
              background: p.color,
              animation: `inv-fall ${p.dur}s linear ${p.delay}s infinite`,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/* ───────────────────────── Pieces ───────────────────────── */

function Section({ id, title, theme, children, tight = false }: { id: string; title?: string; theme: InviteTheme; children: React.ReactNode; tight?: boolean }) {
  return (
    <section id={id} aria-labelledby={title ? `${id}-title` : undefined} className={`px-6 text-center sm:px-10 ${tight ? 'py-10' : 'py-14'}`}>
      {title && (
        <>
          <h2 id={`${id}-title`} className="text-[clamp(1.55rem,6vw,2rem)] leading-tight [text-wrap:balance]" style={{ fontFamily: theme.namesIn === 'script' ? theme.script : theme.display, fontSize: theme.namesIn === 'script' ? 'clamp(2.1rem,8vw,2.7rem)' : undefined }}>
            {title}
          </h2>
          <div className="mb-8 mt-3">
            <Ornament kind={theme.ornament} theme={theme} variant="divider" />
          </div>
        </>
      )}
      {children}
    </section>
  );
}

function PhotoFrame({ src, alt, theme, className = '' }: { src: string; alt: string; theme: InviteTheme; className?: string }) {
  const shape =
    theme.frame === 'arch'
      ? 'rounded-t-[999px] rounded-b-[6px]'
      : theme.frame === 'oval'
        ? 'rounded-[50%]'
        : theme.frame === 'circle'
          ? 'rounded-full aspect-square'
          : 'rounded-[2px]';
  return (
    <div className={`relative mx-auto w-[min(76%,330px)] p-[6px] ${className}`} style={{ border: `1px solid ${theme.line}`, borderRadius: theme.frame === 'arch' ? '999px 999px 8px 8px' : theme.frame === 'rect' ? 2 : '50%' }}>
      <img src={src} alt={alt} className={`block w-full object-cover ${shape} ${theme.frame === 'circle' ? '' : 'aspect-[3/4]'}`} />
    </div>
  );
}

function Countdown({ target, theme }: { target: string; theme: InviteTheme }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = Date.parse(target);
  const diff = now === null ? 0 : Math.max(0, end - now);
  const parts = [
    { v: Math.floor(diff / 86_400_000), l: 'Ngày' },
    { v: Math.floor((diff / 3_600_000) % 24), l: 'Giờ' },
    { v: Math.floor((diff / 60_000) % 60), l: 'Phút' },
    { v: Math.floor((diff / 1000) % 60), l: 'Giây' },
  ];
  if (now !== null && diff === 0) {
    return <p className="text-[17px]">Hôn lễ đã diễn ra ngày {vnDate(target)}. Cảm ơn mọi người đã chung vui!</p>;
  }
  if (theme.countdown === 'ruled') {
    return (
      <div className="mx-auto grid max-w-[380px] grid-cols-4 border-y py-4" style={{ borderColor: theme.line }} role="timer" aria-label="Thời gian đến ngày cưới">
        {parts.map((p, i) => (
          <div key={p.l} className={i ? 'border-l' : ''} style={{ borderColor: theme.line }}>
            <div className="text-[clamp(1.9rem,9vw,2.6rem)] leading-none tabular-nums" style={{ fontFamily: theme.display, color: theme.accentText ?? theme.accent }}>
              {now === null ? '–' : String(p.v).padStart(2, '0')}
            </div>
            <div className="mt-2 text-[13px] uppercase tracking-[0.16em]" style={{ color: theme.inkSoft }}>
              {p.l}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mx-auto grid max-w-[360px] grid-cols-4 gap-2.5" role="timer" aria-label="Thời gian đến ngày cưới">
      {parts.map((p) => (
        <div key={p.l} className="rounded-[var(--inv-r)] px-1 py-3" style={{ background: theme.panel, border: `1px solid ${theme.line}` }}>
          <div className="text-[clamp(1.5rem,7vw,2rem)] font-semibold leading-none tabular-nums" style={{ fontFamily: theme.display }}>
            {now === null ? '–' : String(p.v).padStart(2, '0')}
          </div>
          <div className="mt-1.5 text-[13px]" style={{ color: theme.inkSoft }}>
            {p.l}
          </div>
        </div>
      ))}
    </div>
  );
}

function Lightbox({ photos, index, onClose, onMove }: { photos: InvitationPhoto[]; index: number; onClose: () => void; onMove: (d: number) => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onMove(1);
      if (e.key === 'ArrowLeft') onMove(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, onMove]);
  const p = photos[index];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Xem ảnh cưới">
      <img src={p.url} alt={p.caption ?? 'Ảnh cưới'} className="max-h-[86vh] max-w-full rounded-[4px] object-contain" />
      <button type="button" onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
        <X className="h-6 w-6" />
      </button>
      {photos.length > 1 && (
        <>
          <button type="button" onClick={() => onMove(-1)} aria-label="Ảnh trước" className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" onClick={() => onMove(1)} aria-label="Ảnh sau" className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── Invitation ───────────────────────── */

export function InvitationView(props: InvitationViewProps) {
  const { config, slug, demo = false, embedded = false } = props;
  const theme = INVITE_THEMES[config.templateId as InvitationTemplateId] ?? INVITE_THEMES['song-hy-do'];
  const groom = config.groomFullName || props.groomName;
  const bride = config.brideFullName || props.brideName;
  const monogram = initials(groom, bride).split('').join(' & ');
  const guest = props.guestName?.trim() || '';
  const sections = config.sections;

  const events = useMemo(() => [...config.events].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [config.events]);
  const mainDate = events.find((e) => e.kind === 'THANH_HON' || e.kind === 'TIEC_CUOI')?.startsAt ?? props.weddingDate;
  const date = vnParts(mainDate);
  const cover = config.coverPhotoUrl || props.photos[0]?.url || '';

  const [opened, setOpened] = useState(embedded);
  const music = useRef<MusicBox | null>(null);
  const [playing, setPlaying] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => () => music.current?.dispose(), []);

  const startMusic = useCallback(async () => {
    if (embedded || config.music.mode === 'OFF') return;
    if (!music.current) music.current = new MusicBox(config.music.mode === 'URL' && config.music.url ? config.music.url : null);
    setPlaying(await music.current.start());
  }, [config.music, embedded]);

  const toggleMusic = () => {
    if (playing) {
      music.current?.stop();
      setPlaying(false);
    } else {
      void startMusic();
    }
  };

  const share = async () => {
    const url = window.location.href;
    const title = `Thiệp cưới ${groom} & ${bride}`;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(url);
      alert('Đã chép đường dẫn thiệp');
    }
  };

  const familyFilled = [config.groomFamily, config.brideFamily].some((f) => f.father || f.mother || f.address);
  const namesStyle: React.CSSProperties =
    theme.namesIn === 'script'
      ? { fontFamily: theme.script, fontSize: 'clamp(3rem,15vw,4.6rem)', lineHeight: 1.05 }
      : { fontFamily: theme.display, fontSize: theme.namesUpper ? 'clamp(2.2rem,11vw,3.6rem)' : 'clamp(2.6rem,12vw,4rem)', lineHeight: 1, letterSpacing: theme.namesUpper ? '0.04em' : '-0.01em', fontWeight: theme.namesWeight ?? 600 };
  const magazine = theme.ornament === 'masthead';

  return (
    <div className={`${INVITATION_FONT_VARS} inv-root min-h-screen ${embedded ? '' : 'px-3 py-4 sm:px-0 sm:py-10'}`} style={{ ...themeVars(theme), background: theme.ground, color: theme.ink, fontFamily: theme.body }}>
      <style>{`
        @keyframes inv-fall { 0% { transform: translate3d(0,-20px,0) rotate(0deg); } 100% { transform: translate3d(var(--drift),110vh,0) rotate(540deg); } }
        @keyframes inv-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .inv-root ::selection { background: ${theme.accent}; color: ${theme.onAccent}; }
        .inv-root :focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 3px; }
        .inv-root input, .inv-root textarea { caret-color: ${theme.accent}; }
        .inv-root select option { color: #1a1a1a; }
      `}</style>

      {!embedded && !opened && (
        <Envelope
          theme={theme}
          guestName={guest || null}
          couple={`${props.groomName} & ${props.brideName}`.toUpperCase()}
          monogram={monogram.replace(/ /g, '')}
          onOpen={() => {
            setOpened(true);
            void startMusic();
          }}
        />
      )}
      {opened && !embedded && <Petals colors={theme.petals} />}

      <main
        className={`relative mx-auto max-w-[560px] overflow-hidden ${embedded ? '' : 'rounded-[var(--inv-r)] shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)]'}`}
        style={{ background: theme.paper }}
      >
        {/* Paper grain */}
        <Grain paper={theme.paper} strength={theme.grain} />
        <CardFrame theme={theme} />
        <div className="relative">
          {/* ── Cover ── */}
          {magazine ? (
            <header className="relative">
              {cover ? (
                <img src={cover} alt={`${groom} và ${bride}`} className="block aspect-[4/5] w-full object-cover grayscale-[15%]" />
              ) : (
                <div className="flex aspect-[4/5] w-full items-end justify-start px-6 pb-4" style={{ background: theme.ink }}>
                  <span className="text-[clamp(8rem,46vw,15rem)] font-black leading-[0.8] tracking-[-0.07em]" style={{ fontFamily: theme.display, color: theme.paper }}>
                    {initials(groom, bride)}
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-5 text-[13px] font-bold uppercase tracking-[0.16em]" style={{ color: '#ffffff', textShadow: cover ? '0 1px 8px rgba(0,0,0,0.5)' : undefined }}>
                <span>Số đặc biệt</span>
                <span className="tabular-nums">{vnDate(mainDate)}</span>
              </div>
              <div className="px-6 pb-8 pt-6 text-left">
                <Ornament kind="masthead" theme={theme} variant="crown" />
                <h1 className="mt-4 uppercase" style={{ ...namesStyle, fontSize: 'clamp(2.3rem,11vw,3.4rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.95 }}>
                  <span className="block">{groom}</span>
                  <span className="block">
                    <span className="mr-2 font-normal normal-case" style={{ color: theme.accentText ?? theme.accent, fontFamily: theme.script }}>
                      &amp;
                    </span>
                    {bride}
                  </span>
                </h1>
                <p className="mt-3 text-[16px] font-semibold uppercase tracking-[0.12em] [text-wrap:balance]">{config.headline}</p>
                <p className="mt-1 text-[15px]" style={{ color: theme.inkSoft }}>
                  {date.weekday}, {vnDate(mainDate)} · {lunarLine(mainDate)}
                </p>
              </div>
            </header>
          ) : (
            <header className="px-6 pb-12 pt-12 text-center sm:px-10" style={{ animation: opened && !embedded ? 'inv-rise 900ms cubic-bezier(0.16,1,0.3,1) both' : undefined }}>
              <Ornament kind={theme.ornament} theme={theme} variant="crown" />
              <p className="mx-auto mt-6 max-w-[34ch] text-[14px] uppercase tracking-[0.2em] [text-wrap:balance]" style={{ color: theme.inkSoft, fontFamily: theme.display }}>
                {config.headline}
              </p>
              {cover && theme.frame !== 'full' && <PhotoFrame src={cover} alt={`${groom} và ${bride}`} theme={theme} className="mt-8" />}
              <h1 className={`mt-8 [text-wrap:balance] ${theme.namesUpper ? 'uppercase' : ''}`} style={namesStyle}>
                <span className="block">{groom}</span>
                <span className="my-1 block text-[0.5em]" style={{ color: theme.accentText ?? theme.accent, fontFamily: theme.script }}>
                  &amp;
                </span>
                <span className="block">{bride}</span>
              </h1>
              {/* Classic date block: weekday | day | month & year */}
              <div className="mx-auto mt-9 grid max-w-[340px] grid-cols-[1fr_auto_1fr] items-center gap-4" style={{ fontFamily: theme.display }}>
                <div className="border-y py-2 text-[15px] uppercase tracking-[0.12em]" style={{ borderColor: theme.line }}>
                  {date.weekday}
                </div>
                <div className="text-[clamp(3rem,15vw,4.2rem)] font-semibold leading-none tabular-nums" style={{ color: theme.accentText ?? theme.accent }}>
                  {String(date.day).padStart(2, '0')}
                </div>
                <div className="border-y py-2 text-[15px] uppercase tracking-[0.12em]" style={{ borderColor: theme.line }}>
                  Tháng {date.month}
                  <span className="block tabular-nums">{date.year}</span>
                </div>
              </div>
              <p className="mt-4 text-[15px] italic" style={{ color: theme.inkSoft }}>
                ({lunarLine(mainDate)})
              </p>
            </header>
          )}

          {config.quote && (
            <p className="mx-auto max-w-[36ch] px-8 pb-4 text-center text-[17px] italic leading-relaxed [text-wrap:balance]" style={{ color: theme.inkSoft }}>
              “{config.quote}”
            </p>
          )}

          {/* ── Families + invitation wording ── */}
          {sections.family && (
            <Section id="gia-dinh" theme={theme} tight>
              {familyFilled && (
                <div className="mx-auto grid max-w-[460px] grid-cols-1 gap-y-7 text-[16px] leading-relaxed min-[480px]:grid-cols-2 min-[480px]:gap-x-6 min-[480px]:text-[15px]">
                  {[
                    { title: 'Nhà Trai', f: config.groomFamily },
                    { title: 'Nhà Gái', f: config.brideFamily },
                  ].map(({ title, f }) => (
                    <div key={title}>
                      <h3 className="mb-2 text-[17px] font-semibold uppercase tracking-[0.12em]" style={{ color: theme.accentText ?? theme.accent, fontFamily: theme.display }}>
                        {title}
                      </h3>
                      {f.father && <p><Name>{`Ông ${f.father}`}</Name></p>}
                      {f.mother && <p><Name>{`Bà ${f.mother}`}</Name></p>}
                      {f.address && (
                        <p className="mt-1 text-[14px] [text-wrap:balance]" style={{ color: theme.inkSoft }}>
                          {keepAbbr(f.address)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className={familyFilled ? 'mt-10' : ''}>
                <p className="text-[15px] uppercase tracking-[0.2em]" style={{ color: theme.inkSoft, fontFamily: theme.display }}>
                  Trân trọng kính mời
                </p>
                <p className="mt-2 text-[clamp(1.9rem,8vw,2.5rem)] leading-tight" style={{ fontFamily: theme.script, color: theme.accentText ?? theme.accent }}>
                  {guest || 'Quý khách'}
                </p>
                {config.message && <p className="mx-auto mt-4 max-w-[38ch] text-[16px] leading-relaxed [text-wrap:pretty]">{config.message}</p>}
              </div>
            </Section>
          )}

          {sections.countdown && (
            <Section id="dem-nguoc" title="Đếm ngược ngày vui" theme={theme} tight>
              <Countdown target={mainDate} theme={theme} />
            </Section>
          )}

          {/* ── Events ── */}
          {sections.events && events.length > 0 && (
            <Section id="su-kien" title="Lịch trình ngày cưới" theme={theme}>
              <ol className="space-y-10">
                {events.map((e) => {
                  const p = vnParts(e.startsAt);
                  const map = invitationMapLink(e);
                  const where = [e.venueName, e.address].filter(Boolean).join(', ');
                  return (
                    <li key={e.id}>
                      <h3 className="text-[15px] font-semibold uppercase tracking-[0.2em]" style={{ color: theme.accentText ?? theme.accent, fontFamily: theme.display }}>
                        {e.title || INVITATION_EVENT_LABELS[e.kind]}
                      </h3>
                      <p className="mt-2 text-[clamp(2.4rem,11vw,3rem)] font-semibold leading-none tabular-nums" style={{ fontFamily: theme.display }}>
                        {vnTime(e.startsAt)}
                      </p>
                      <p className="mt-2 text-[16px]">
                        {p.weekday}, ngày {vnDate(e.startsAt)}
                      </p>
                      <p className="text-[14px]" style={{ color: theme.inkSoft }}>
                        ({lunarShort(e.startsAt)})
                      </p>
                      {e.venueName && <p className="mt-3 text-[17px] font-semibold">{e.venueName}</p>}
                      {e.address && <p className="mx-auto max-w-[34ch] text-[15px] leading-relaxed" style={{ color: theme.inkSoft }}>{keepAbbr(e.address)}</p>}
                      {e.note && <p className="mt-1 text-[14px] italic" style={{ color: theme.inkSoft }}>{e.note}</p>}
                      <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                        {map && (
                          <a href={map} target="_blank" rel="noopener noreferrer" className={primaryButton}>
                            <MapPin className="h-4 w-4" /> Chỉ đường
                          </a>
                        )}
                        <a
                          href={calendarLink(`${e.title} · ${groom} & ${bride}`, e.startsAt, where, config.message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--inv-btn-r)] border px-6 text-[15px] font-semibold transition hover:brightness-110"
                          style={{ borderColor: theme.accent, color: theme.ink }}
                        >
                          <CalendarPlus className="h-4 w-4" /> Lưu vào lịch
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {config.dressCode && (
                <p className="mt-10 text-[15px]" style={{ color: theme.inkSoft }}>
                  Trang phục gợi ý: <span style={{ color: theme.ink }}>{config.dressCode}</span>
                </p>
              )}
            </Section>
          )}

          {/* ── Story ── */}
          {sections.story && config.story.length > 0 && (
            <Section id="chuyen-tinh" title="Chuyện của chúng mình" theme={theme}>
              <ol className="relative mx-auto max-w-[420px] text-left">
                <span className="absolute bottom-2 left-[7px] top-2 w-px" style={{ background: theme.line }} aria-hidden="true" />
                {config.story.map((s) => (
                  <li key={s.id} className="relative pb-8 pl-9 last:pb-0">
                    <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2" style={{ borderColor: theme.accent, background: theme.paper }} aria-hidden="true" />
                    {s.title && <h3 className="text-[19px] font-semibold leading-snug" style={{ fontFamily: theme.display }}>{s.title}</h3>}
                    {s.when && (
                      <p className="mt-0.5 text-[15px] italic" style={{ color: theme.accentText ?? theme.accent }}>
                        {s.when}
                      </p>
                    )}
                    {s.text && <p className="mt-1.5 text-[15px] leading-relaxed [text-wrap:pretty]" style={{ color: theme.inkSoft }}>{s.text}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* ── Album ── */}
          {sections.album && props.photos.length > 0 && (
            <Section id="album" title="Album ảnh cưới" theme={theme}>
              <div className="grid grid-cols-2 gap-2">
                {props.photos.slice(0, 12).map((ph, i) => (
                  <button
                    key={ph.id}
                    type="button"
                    onClick={() => setLightbox(i)}
                    className={`group overflow-hidden rounded-[var(--inv-r)] ${i === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-[3/4]'}`}
                    aria-label={`Xem ảnh ${i + 1}${ph.caption ? `: ${ph.caption}` : ''}`}
                  >
                    <img src={ph.url} alt={ph.caption ?? `Ảnh cưới ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* ── 3D hall ── */}
          {sections.hall && props.hallUrl && (
            <Section id="sanh-3d" title="Sảnh cưới 3D trực tuyến" theme={theme}>
              {props.venueThumb && (
                <div className="overflow-hidden rounded-[var(--inv-r)]" style={{ border: `1px solid ${theme.line}` }}>
                  <img src={props.venueThumb} alt="Sảnh cưới 3D của cô dâu chú rể" loading="lazy" className="block aspect-[16/10] w-full object-cover" />
                </div>
              )}
              <p className="mx-auto mt-5 max-w-[36ch] text-[16px] leading-relaxed [text-wrap:pretty]">
                Ở xa không về kịp? Mời bạn vào sảnh cưới 3D trên điện thoại: ngồi cùng bàn với mọi người, cụng ly 1-2-3 Dzô và bắt hoa cưới.
              </p>
              <a href={props.hallUrl} className={`${primaryButton} mt-5`}>
                <Sparkles className="h-4 w-4" /> Vào sảnh cưới 3D
              </a>
            </Section>
          )}

          {sections.rsvp && (
            <Section id="xac-nhan" title="Xác nhận tham dự" theme={theme}>
              <RsvpForm slug={slug} demo={demo} guestName={guest} deadline={config.rsvpDeadline ? vnDate(config.rsvpDeadline) : ''} />
            </Section>
          )}

          {sections.wishes && (
            <Section id="loi-chuc" title="Gửi lời chúc" theme={theme}>
              <WishesSection slug={slug} demo={demo} guestName={guest} initial={props.initialWishes} />
            </Section>
          )}

          {sections.gift && (props.gift.enabled || demo) && (
            <Section id="mung-cuoi" title="Hộp mừng cưới" theme={theme}>
              <p className="mx-auto mb-6 max-w-[38ch] text-[16px] leading-relaxed [text-wrap:pretty]">
                Sự hiện diện của bạn là món quà quý nhất. Nếu ở xa không đến được, bạn có thể gửi lời mừng qua mã QR dưới đây.
              </p>
              <GiftBox slug={slug} demo={demo} guestName={guest} bankName={props.gift.bankName} />
            </Section>
          )}

          {/* ── Thank you ── */}
          <footer className="px-6 pb-14 pt-10 text-center sm:px-10">
            <Ornament kind={theme.ornament} theme={theme} variant="divider" />
            {config.thankYou && <p className="mx-auto mt-6 max-w-[36ch] text-[16px] leading-relaxed [text-wrap:pretty]">{config.thankYou}</p>}
            <p className="mt-5 text-[clamp(2rem,9vw,2.8rem)] leading-tight" style={{ fontFamily: theme.script, color: theme.accentText ?? theme.accent }}>
              {groom} &amp; {bride}
            </p>
            {!embedded && (
              <div className="mt-7 flex justify-center">
                <button type="button" onClick={share} className="inline-flex min-h-[48px] items-center gap-2 rounded-[var(--inv-btn-r)] border px-6 text-[15px] font-semibold" style={{ borderColor: theme.accent }}>
                  <Share2 className="h-4 w-4" /> Chia sẻ thiệp
                </button>
              </div>
            )}
            <p className="mt-10 text-[13px]" style={{ color: theme.inkSoft }}>
              Thiệp cưới online · <a href="/thiep-cuoi" className="underline underline-offset-4">DamCuoiOnline</a>
            </p>
          </footer>
        </div>
      </main>

      {!embedded && opened && config.music.mode !== 'OFF' && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}
          aria-pressed={playing}
          className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)]"
          style={{ background: theme.accent, color: theme.onAccent }}
        >
          {playing ? <Music2 className="h-5 w-5 motion-safe:animate-[spin_6s_linear_infinite]" /> : <VolumeX className="h-5 w-5" />}
        </button>
      )}

      {lightbox !== null && (
        <Lightbox photos={props.photos} index={lightbox} onClose={() => setLightbox(null)} onMove={(d) => setLightbox((i) => (i === null ? i : (i + d + props.photos.length) % props.photos.length))} />
      )}
    </div>
  );
}

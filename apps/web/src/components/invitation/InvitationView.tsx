'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Music2, Share2, Sparkles, VolumeX, X } from 'lucide-react';
import type { InvitationConfig, InvitationTemplateId } from '@dco/shared';
import type { InvitationWish } from '@/app/api/invitations/[slug]/wishes/route';
import { INVITATION_FONT_VARS } from './fonts';
import { GiftBox, RsvpForm, WishesSection, primaryButton } from './InvitationForms';
import { Ornament, Seal } from './Ornaments';
import { INVITE_THEMES, type InviteTheme } from './themes';
import { MusicBox } from './musicBox';
import { vnDate } from './format';
import { InvitationCover, type CoverData } from './covers';
import { Album, ClosingPhoto, EventsBlock, Interlude, MonthCalendar, Section, type SectionTitle } from './blocks';
import { Grain, Name, cityOf, isDark, keepAbbr, sized } from './parts';

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

const SHAPE: Record<InviteTheme['shape'], { r: string; btn: string }> = {
  soft: { r: '12px', btn: '999px' },
  gentle: { r: '4px', btn: '4px' },
  square: { r: '0px', btn: '0px' },
};

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
    '--inv-panel': t.field ?? t.panel,
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

function Envelope({ theme, guestName, photo, monogram, couple, date, onOpen }: { theme: InviteTheme; guestName: string | null; photo: string; monogram: string; couple: string; date: string; onOpen: () => void }) {
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
  const headInk = isDark(theme.ground) ? '#fff6ea' : theme.ink;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-5 transition-opacity duration-500 ${opening ? 'pointer-events-none opacity-0 [transition-delay:1350ms]' : ''}`}
      style={{ background: `radial-gradient(120% 80% at 50% 30%, ${theme.ground}, ${theme.ground} 40%, #00000022 100%), ${theme.ground}` }}
    >
      <div className={`text-center transition-all duration-500 ${opening ? '-translate-y-3 opacity-0' : ''}`} style={{ color: headInk }}>
        <p className="text-[12px] uppercase tracking-[0.42em] opacity-85">Thiệp mời cưới</p>
        <p className="mt-1.5 px-2 text-[clamp(2.2rem,10vw,3rem)] leading-tight [text-wrap:balance]" style={{ fontFamily: theme.script }}>
          {couple}
        </p>
        <p className="mt-1 text-[14px] tabular-nums tracking-[0.32em] opacity-90">{date}</p>
      </div>
      <button
        type="button"
        onClick={open}
        aria-label="Mở thiệp cưới"
        className="group relative mt-[11vh] h-[min(50vh,460px)] w-[min(84vw,420px)] outline-none [perspective:1200px] focus-visible:ring-4 focus-visible:ring-white/60"
      >
        {/* Card inside, peeking out, then rising out */}
        <div
          className="absolute inset-x-[7%] top-[-17%] h-[92%] rounded-[3px] shadow-[0_-6px_20px_-8px_rgba(0,0,0,0.4)] transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] [transition-delay:520ms]"
          style={{ background: theme.paper, transform: opening ? 'translateY(-60%)' : 'translateY(0)' }}
        >
          <div className="flex h-full flex-col items-center justify-start p-[4%]">
            {photo && <img src={sized(photo, true)} alt="" className="block h-[52%] w-full object-cover" style={{ filter: theme.layout.photoFilter }} />}
            <span className="mt-[6%] text-[clamp(1.6rem,7vw,2.3rem)] leading-none" style={{ color: theme.accentText ?? theme.accent, fontFamily: theme.script }}>
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
      <p className="mt-6 text-[15px] font-medium motion-safe:animate-pulse" style={{ color: headInk }}>
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

/* ───────────────────────── Hearts ───────────────────────── */

/** "Thả tim": a little burst of hearts from the button */
function HeartButton({ theme }: { theme: InviteTheme }) {
  const [bursts, setBursts] = useState<number[]>([]);
  const fire = () => {
    const id = Date.now();
    setBursts((b) => [...b.slice(-3), id]);
    setTimeout(() => setBursts((b) => b.filter((x) => x !== id)), 2200);
  };
  return (
    <div className="fixed bottom-[84px] right-5 z-40">
      {bursts.map((id) => (
        <span key={id} className="pointer-events-none absolute bottom-6 left-1/2" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Heart
              key={i}
              className="absolute h-5 w-5 motion-reduce:hidden"
              style={{ color: i % 2 ? theme.accent : theme.line, fill: 'currentColor', animation: `inv-heart 1.9s ease-out ${i * 90}ms both`, ['--hx' as string]: `${(i - 2.5) * 16}px` } as React.CSSProperties}
            />
          ))}
        </span>
      ))}
      <button
        type="button"
        onClick={fire}
        aria-label="Thả tim cho cô dâu chú rể"
        className="grid h-12 w-12 place-items-center rounded-full shadow-[0_8px_20px_-6px_rgba(0,0,0,0.5)] transition active:scale-90"
        style={{ background: '#ffffff', color: '#e0315b' }}
      >
        <Heart className="h-5 w-5" fill="currentColor" />
      </button>
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
  const mainEvent = events.find((e) => e.kind === 'THANH_HON' || e.kind === 'TIEC_CUOI');
  const mainDate = mainEvent?.startsAt ?? props.weddingDate;

  // Photo roles: cover, then the interlude and the closing photo from the rest
  const cover = config.coverPhotoUrl || props.photos[0]?.url || '';
  const others = props.photos.map((p) => p.url).filter((u) => u !== cover);
  const interludeSrc = others[0] ?? '';
  const closingSrc = others[1] ?? others[0] ?? cover;
  const coverData: CoverData = {
    groom,
    bride,
    date: mainDate,
    headline: config.headline,
    cover,
    extras: others.slice(0, 2),
    city: cityOf(mainEvent?.address ?? events[events.length - 1]?.address ?? ''),
  };

  const [opened, setOpened] = useState(embedded);
  const [hydrated, setHydrated] = useState(false);
  const music = useRef<MusicBox | null>(null);
  const [playing, setPlaying] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => setHydrated(true), []);
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
  const accent = theme.accentText ?? theme.accent;
  const namesStyle: React.CSSProperties =
    theme.namesIn === 'script'
      ? { fontFamily: theme.script, fontSize: 'clamp(2.8rem,13vw,3.9rem)', lineHeight: 1.08 }
      : { fontFamily: theme.display, fontSize: theme.namesUpper ? 'clamp(2rem,9.5vw,2.9rem)' : 'clamp(2.4rem,11vw,3.3rem)', lineHeight: 1.05, letterSpacing: theme.namesUpper ? '0.03em' : '-0.01em', fontWeight: theme.namesWeight ?? 600 };

  // Section numbering follows what is actually shown
  let n = 0;
  const T = (title: string, kicker: string): SectionTitle => ({ title, kicker, index: ++n });

  return (
    <div className={`${INVITATION_FONT_VARS} inv-root min-h-screen ${hydrated ? 'inv-js' : ''} ${embedded ? '' : 'sm:px-0 sm:py-10'}`} style={{ ...themeVars(theme), background: theme.ground, color: theme.ink, fontFamily: theme.body }}>
      <style>{`
        @keyframes inv-fall { 0% { transform: translate3d(0,-20px,0) rotate(0deg); } 100% { transform: translate3d(var(--drift),110vh,0) rotate(540deg); } }
        @keyframes inv-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
        @keyframes inv-zoom { from { transform: scale(1.12); } to { transform: scale(1); } }
        @keyframes inv-beat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
        @keyframes inv-heart { 0% { opacity: 0; transform: translate(-50%, 0) scale(0.4); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(calc(-50% + var(--hx)), -150px) scale(1.15); } }
        @keyframes inv-cue { 0%, 100% { transform: translateY(0); opacity: 0.55; } 50% { transform: translateY(6px); opacity: 1; } }
        .inv-cover-in [data-a] { animation: inv-rise 1100ms cubic-bezier(0.16,1,0.3,1) both; animation-delay: calc(var(--d, 0) * 160ms + 250ms); }
        .inv-cover-in [data-zoom] { animation: inv-zoom 2800ms cubic-bezier(0.2,0.7,0.2,1) both; }
        .inv-js .inv-reveal { opacity: 0; transform: translateY(28px); transition: opacity 900ms ease, transform 1000ms cubic-bezier(0.16,1,0.3,1); }
        .inv-js .inv-reveal.is-in { opacity: 1; transform: none; }
        .inv-root ::selection { background: ${theme.accent}; color: ${theme.onAccent}; }
        .inv-root :focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 3px; }
        .inv-root input, .inv-root textarea { caret-color: ${theme.accent}; }
        .inv-root select option { color: #1a1a1a; }
        @media (prefers-reduced-motion: reduce) {
          .inv-root *, .inv-root *::before, .inv-root *::after { animation: none !important; }
          .inv-js .inv-reveal { opacity: 1; transform: none; transition: none; }
        }
      `}</style>

      {!embedded && !opened && (
        <Envelope
          theme={theme}
          guestName={guest || null}
          photo={cover}
          monogram={monogram.replace(/ /g, '')}
          couple={`${groom} & ${bride}`}
          date={vnDate(mainDate).replace(/\./g, ' · ')}
          onOpen={() => {
            setOpened(true);
            void startMusic();
          }}
        />
      )}
      {opened && !embedded && <Petals colors={theme.petals} />}

      <main
        className={`relative mx-auto max-w-[560px] overflow-hidden ${embedded ? '' : 'sm:rounded-[var(--inv-r)] sm:shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)]'}`}
        style={{ background: theme.paper }}
      >
        <Grain paper={theme.paper} strength={theme.grain} />
        <CardFrame theme={theme} />
        <div className="relative">
          {/* ── Cover ── */}
          <InvitationCover theme={theme} data={coverData} animate={opened && !embedded} />

          {/* ── Families + invitation wording ── */}
          {sections.family && (
            <Section id="gia-dinh" t={T('Trân trọng báo tin', 'Our families')} theme={theme} tight>
              {familyFilled && (
                <div className="mx-auto grid max-w-[460px] grid-cols-[1fr_1px_1fr] gap-x-4 text-[15px] leading-relaxed min-[420px]:gap-x-6">
                  {[
                    { title: 'Nhà Trai', f: config.groomFamily },
                    null,
                    { title: 'Nhà Gái', f: config.brideFamily },
                  ].map((side) =>
                    side === null ? (
                      <span key="rule" className="block" style={{ background: theme.line }} aria-hidden="true" />
                    ) : (
                      <div key={side.title} className="min-w-0">
                        <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.24em]" style={{ color: accent, fontFamily: theme.display }}>
                          {side.title}
                        </h3>
                        {(side.f.father || side.f.mother) && (
                          <p className="text-[13px]" style={{ color: theme.inkSoft }}>
                            {[side.f.father && 'Ông', side.f.mother && 'Bà'].filter(Boolean).join(' ')}
                          </p>
                        )}
                        {side.f.father && <p className="font-semibold leading-snug">{side.f.father}</p>}
                        {side.f.mother && <p className="font-semibold leading-snug">{side.f.mother}</p>}
                        {side.f.address && (
                          <p className="mt-1.5 text-[13.5px] leading-snug [text-wrap:balance]" style={{ color: theme.inkSoft }}>
                            {keepAbbr(side.f.address)}
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>
              )}
              <p className={`${familyFilled ? 'mt-11' : ''} text-[13px] uppercase leading-relaxed tracking-[0.24em] [text-wrap:balance]`} style={{ color: theme.inkSoft, fontFamily: theme.display }}>
                {config.headline || 'Trân trọng báo tin lễ thành hôn'} của con chúng tôi
              </p>
              <p className={`mt-4 [text-wrap:balance] ${theme.namesUpper ? 'uppercase' : ''}`} style={{ ...namesStyle, color: theme.namesIn === 'script' ? accent : theme.ink }}>
                <Name>{groom}</Name>
                <span className="mx-2 inline-block text-[0.55em]" style={{ color: accent, fontFamily: theme.script }}>
                  &amp;
                </span>
                <Name>{bride}</Name>
              </p>
              <div className="mx-auto mt-10 max-w-[420px] rounded-[calc(var(--inv-r)+4px)] px-5 py-7" style={{ background: theme.panel === theme.paper ? 'transparent' : `${theme.panel}`, color: theme.layout.events === 'panel' && theme.panelInk ? theme.panelInk : theme.ink, border: `1px solid ${theme.line}66` }}>
                <p className="text-[14px] uppercase tracking-[0.26em]" style={{ fontFamily: theme.display, opacity: 0.85 }}>
                  Trân trọng kính mời
                </p>
                <p className="mt-2 text-[clamp(2rem,9vw,2.6rem)] leading-tight [text-wrap:balance]" style={{ fontFamily: theme.script, color: theme.layout.events === 'panel' && theme.panelInk ? theme.line : accent }}>
                  {guest || 'Quý khách'}
                </p>
                {config.message && <p className="mx-auto mt-4 max-w-[36ch] text-[16px] leading-relaxed [text-wrap:pretty]">{config.message}</p>}
              </div>
            </Section>
          )}

          {/* ── A photo between the wording and the schedule ── */}
          <Interlude theme={theme} src={interludeSrc} alt={`${groom} và ${bride}`} quote={config.quote} />
          {(!interludeSrc || theme.layout.interlude === 'none') && config.quote && (
            <p className="mx-auto max-w-[36ch] px-8 py-6 text-center text-[17px] italic leading-relaxed [text-wrap:balance]" style={{ color: theme.inkSoft }}>
              “{config.quote}”
            </p>
          )}

          {/* ── Events ── */}
          {sections.events && events.length > 0 && (
            <Section id="su-kien" t={T('Thông tin lễ cưới', 'When & where')} theme={theme}>
              <EventsBlock theme={theme} events={events} couple={`${groom} & ${bride}`} message={config.message} />
              {config.dressCode && (
                <p className="mt-10 text-[15px]" style={{ color: theme.inkSoft }}>
                  Trang phục gợi ý: <span style={{ color: theme.ink }}>{config.dressCode}</span>
                </p>
              )}
            </Section>
          )}

          {/* ── Calendar + countdown ── */}
          {sections.countdown && (
            <Section id="dem-nguoc" t={T('Ngày chung đôi', 'Save the date')} theme={theme} tight>
              <MonthCalendar theme={theme} iso={mainDate} />
              <div className="mt-8">
                <Countdown target={mainDate} theme={theme} />
              </div>
            </Section>
          )}

          {/* ── Story ── */}
          {sections.story && config.story.length > 0 && (
            <Section id="chuyen-tinh" t={T('Chuyện của chúng mình', 'Our story')} theme={theme}>
              <ol className="relative mx-auto max-w-[420px] text-left">
                <span className="absolute bottom-2 left-[7px] top-2 w-px" style={{ background: theme.line }} aria-hidden="true" />
                {config.story.map((s) => (
                  <li key={s.id} className="relative pb-9 pl-9 last:pb-0">
                    <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2" style={{ borderColor: theme.accent, background: theme.paper }} aria-hidden="true" />
                    {s.when && (
                      <p className="text-[13px] uppercase tracking-[0.2em]" style={{ color: accent }}>
                        {s.when}
                      </p>
                    )}
                    {s.title && (
                      <h3 className="mt-0.5 text-[20px] leading-snug" style={{ fontFamily: theme.display, fontWeight: theme.namesWeight === 400 ? 400 : 600 }}>
                        {s.title}
                      </h3>
                    )}
                    {s.text && <p className="mt-1.5 text-[15.5px] leading-relaxed [text-wrap:pretty]" style={{ color: theme.inkSoft }}>{s.text}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {/* ── Album ── */}
          {sections.album && props.photos.length > 0 && (
            <Section id="album" t={T('Album ảnh cưới', 'Gallery')} theme={theme}>
              <Album theme={theme} photos={props.photos} onOpen={setLightbox} />
            </Section>
          )}

          {/* ── 3D hall ── */}
          {sections.hall && props.hallUrl && (
            <Section id="sanh-3d" t={T('Sảnh cưới 3D', 'Online')} theme={theme}>
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
            <Section id="xac-nhan" t={T('Xác nhận tham dự', 'RSVP')} theme={theme}>
              <RsvpForm slug={slug} demo={demo} guestName={guest} deadline={config.rsvpDeadline ? vnDate(config.rsvpDeadline) : ''} />
            </Section>
          )}

          {sections.wishes && (
            <Section id="loi-chuc" t={T('Gửi lời chúc', 'Wishes')} theme={theme}>
              <WishesSection slug={slug} demo={demo} guestName={guest} initial={props.initialWishes} />
            </Section>
          )}

          {sections.gift && (props.gift.enabled || demo) && (
            <Section id="mung-cuoi" t={T('Hộp mừng cưới', 'Gift')} theme={theme}>
              <p className="mx-auto mb-6 max-w-[38ch] text-[16px] leading-relaxed [text-wrap:pretty]">
                Sự hiện diện của bạn là món quà quý nhất. Nếu ở xa không đến được, bạn có thể gửi lời mừng qua mã QR dưới đây.
              </p>
              <GiftBox slug={slug} demo={demo} guestName={guest} bankName={props.gift.bankName} />
            </Section>
          )}

          {/* ── Thank you ── */}
          {theme.layout.closing === 'photo' && closingSrc && <ClosingPhoto theme={theme} src={closingSrc} thanks={config.thankYou} couple={`${groom} & ${bride}`} />}
          <footer className="px-6 pb-14 pt-10 text-center sm:px-10">
            {!(theme.layout.closing === 'photo' && closingSrc) && (
              <>
                <Ornament kind={theme.ornament} theme={theme} variant="divider" />
                {config.thankYou && <p className="mx-auto mt-6 max-w-[36ch] text-[16px] leading-relaxed [text-wrap:pretty]">{config.thankYou}</p>}
                <p className="mt-5 text-[clamp(2rem,9vw,2.8rem)] leading-tight" style={{ fontFamily: theme.script, color: accent }}>
                  {groom} &amp; {bride}
                </p>
              </>
            )}
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

      {!embedded && opened && <HeartButton theme={theme} />}
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

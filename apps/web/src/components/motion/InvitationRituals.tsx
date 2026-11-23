'use client';

/**
 * Gói 3 — Original ceremonial opening rituals & editorial storytelling components:
 * - CupidBowOpener (pull-and-release Cupid bow shooting a pulsing heart into petal bloom, inspired by Birthday/Love Letter)
 * - LucernaLanternOpener (7 hanging glass lanterns illuminated by brushing cursor/finger across, inspired by Lucerna)
 * - WovenEditorialBanner (3-layer solid-behind + 1px hollow-stroke-over portrait typography spreading on scroll, inspired by Kesten/Glint)
 * - EditorialStoryChapters (numbered 01-05 expandable love story accordion with cross-fading photo frame, inspired by Lunde)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { InvitationStoryItem } from '@dco/shared';
import type { InviteTheme } from '@/components/invitation/themes';
import { isDark, sized } from '@/components/invitation/parts';

/* ───────────────────────── 1. CupidBowOpener (Birthday + Love Letter) ───────────────────────── */

export function CupidBowOpener({
  theme,
  couple,
  guestName,
  date,
  onOpen,
}: {
  theme: InviteTheme;
  couple: string;
  guestName: string | null;
  date: string;
  onOpen: () => void;
}) {
  const [pull, setPull] = useState(0); // 0..1
  const [fired, setFired] = useState(false);
  const [bloom, setBloom] = useState(false);
  const dragStartRef = useRef<{ y: number; x: number } | null>(null);
  const headInk = isDark(theme.ground) ? '#fff6ea' : theme.ink;

  const petals = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2;
        const dist = 75 + (i % 4) * 32;
        return {
          tx: Math.round(Math.cos(angle) * dist),
          ty: Math.round(Math.sin(angle) * dist),
          rot: (i * 37) % 360,
          size: 8 + (i % 3) * 4,
          delay: (i % 5) * 30,
        };
      }),
    [],
  );

  const releaseShot = () => {
    if (fired) return;
    setFired(true);
    setPull(0);
    window.setTimeout(() => setBloom(true), 320);
    window.setTimeout(() => onOpen(), 1050);
  };

  return (
    <div
      data-ritual="cupid"
      className="relative flex w-full max-w-[420px] flex-col items-center justify-center px-4 text-center select-none"
    >
      <p className="text-[11.5px] uppercase tracking-[0.38em] opacity-80" style={{ color: headInk }}>
        Kính mời · {guestName || 'Quý khách'}
      </p>
      <p className="mt-1.5 text-[clamp(2rem,9vw,2.8rem)] leading-tight" style={{ fontFamily: theme.script, color: headInk }}>
        {couple}
      </p>
      <p className="mt-0.5 text-[13px] tabular-nums tracking-[0.28em] opacity-80" style={{ color: headInk }}>
        {date}
      </p>

      {/* Glossy pulsing heart target */}
      <div className="relative my-8 flex h-36 w-36 items-center justify-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full blur-2xl transition-all duration-500"
          style={{
            background: theme.accent,
            opacity: bloom ? 0.65 : 0.28 + pull * 0.22,
            transform: bloom ? 'scale(2.1)' : `scale(${1 + pull * 0.18})`,
          }}
        />
        <button
          type="button"
          onClick={releaseShot}
          aria-label="Bắn mũi tên trái tim mở thiệp"
          className={`relative z-[2] transition-all duration-500 ${
            bloom ? 'scale-125 opacity-0' : 'motion-safe:animate-[inv-beat_2s_ease-in-out_infinite]'
          }`}
        >
          <svg viewBox="0 0 120 110" className="h-28 w-28 drop-shadow-[0_14px_26px_rgba(0,0,0,0.28)]">
            <defs>
              <radialGradient id="cupidHeartGrad" cx="34%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#fff3f6" />
                <stop offset="32%" stopColor={theme.accent} />
                <stop offset="100%" stopColor={`color-mix(in srgb, ${theme.accent} 65%, #1c050a)`} />
              </radialGradient>
            </defs>
            <path
              d="M60 100 C24 76 6 54 6 33 C6 16 19 6 35 6 C46 6 55 12 60 22 C65 12 74 6 85 6 C101 6 114 16 114 33 C114 54 96 76 60 100 Z"
              fill="url(#cupidHeartGrad)"
              stroke={theme.line}
              strokeWidth="1.5"
            />
            <ellipse cx="40" cy="30" rx="11" ry="6.5" transform="rotate(-24 40 30)" fill="rgba(255,255,255,0.45)" />
          </svg>
        </button>

        {/* Petal bloom burst when arrow strikes */}
        {bloom && (
          <span className="pointer-events-none absolute left-1/2 top-1/2 z-[4]" aria-hidden="true">
            {petals.map((pt, i) => (
              <span
                key={i}
                className="absolute block rounded-[80%_0_80%_0]"
                style={
                  {
                    width: pt.size,
                    height: pt.size * 0.78,
                    background: i % 2 === 0 ? theme.line : theme.accent,
                    animation: `inv-spark-burst 850ms cubic-bezier(0.16,1,0.3,1) ${pt.delay}ms both`,
                    '--sx': `${pt.tx}px`,
                    '--sy': `${pt.ty}px`,
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        )}
      </div>

      {/* Interactive Pull & Release Cupid Bow */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Kéo và thả dây cung để mở thiệp cưới"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            releaseShot();
          }
        }}
        onPointerDown={(e) => {
          if (fired) return;
          dragStartRef.current = { x: e.clientX, y: e.clientY };
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // ignore
          }
        }}
        onPointerMove={(e) => {
          if (!dragStartRef.current || fired) return;
          const dy = Math.max(0, e.clientY - dragStartRef.current.y);
          setPull(Math.min(1, dy / 75));
        }}
        onPointerUp={() => {
          if (!dragStartRef.current) return;
          dragStartRef.current = null;
          releaseShot();
        }}
        className="relative flex h-32 w-48 cursor-grab flex-col items-center justify-center touch-none active:cursor-grabbing"
      >
        <svg viewBox="0 0 180 120" className="h-full w-full overflow-visible">
          {/* Bow limbs */}
          <path
            d={`M28 52 Q90 ${8 - pull * 10} 152 52`}
            fill="none"
            stroke={theme.line}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Elastic bowstring */}
          <path
            d={`M28 52 Q90 ${54 + pull * 42} 152 52`}
            fill="none"
            stroke={headInk}
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
          {/* Arrow shaft + heart tip */}
          <g
            style={{
              transform: fired
                ? 'translateY(-195px) scale(0.85)'
                : `translateY(${pull * 32}px)`,
              opacity: bloom ? 0 : 1,
              transition: fired ? 'transform 340ms cubic-bezier(0.2,0.9,0.2,1), opacity 200ms ease 260ms' : 'none',
            }}
          >
            <line x1="90" y1="84" x2="90" y2="20" stroke={theme.line} strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="90,8 82,22 98,22" fill={theme.accent} />
            <path d="M84 82 L90 74 L96 82" fill="none" stroke={headInk} strokeWidth="1.8" />
          </g>
        </svg>
        <span className="mt-1 text-[12px] font-semibold uppercase tracking-[0.26em]" style={{ color: headInk }}>
          {fired ? 'Đang mở thiệp…' : 'Kéo dây cung hoặc chạm để bắn'}
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── 2. LucernaLanternOpener (Lucerna Glass Rail) ───────────────────────── */

export function LucernaLanternOpener({
  theme,
  couple,
  guestName,
  date,
  onOpen,
}: {
  theme: InviteTheme;
  couple: string;
  guestName: string | null;
  date: string;
  onOpen: () => void;
}) {
  const [lit, setLit] = useState<boolean[]>([false, false, false, false, false, false, false]);
  const [opening, setOpening] = useState(false);
  const headInk = isDark(theme.ground) ? '#fff6ea' : theme.ink;
  const litCount = lit.filter(Boolean).length;

  const ignite = (idx: number) => {
    if (opening) return;
    setLit((prev) => {
      if (prev[idx]) return prev;
      const next = [...prev];
      next[idx] = true;
      const total = next.filter(Boolean).length;
      if (total >= 5) {
        setOpening(true);
        window.setTimeout(() => onOpen(), 720);
      }
      return next;
    });
  };

  const openAll = () => {
    if (opening) return;
    setLit([true, true, true, true, true, true, true]);
    setOpening(true);
    window.setTimeout(() => onOpen(), 650);
  };

  return (
    <div
      data-ritual="lanterns"
      className="relative flex w-full max-w-[440px] flex-col items-center px-4 text-center select-none"
    >
      <p className="text-[11.5px] uppercase tracking-[0.38em] opacity-80" style={{ color: headInk }}>
        Thắp sáng đêm tiệc · {guestName || 'Quý khách'}
      </p>
      <p className="mt-1.5 text-[clamp(2rem,9vw,2.8rem)] leading-tight" style={{ fontFamily: theme.script, color: headInk }}>
        {couple}
      </p>
      <p className="mt-0.5 text-[13px] tabular-nums tracking-[0.28em] opacity-80" style={{ color: headInk }}>
        {date}
      </p>

      {/* Frosted glass canopy holding 7 hanging lanterns */}
      <div
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
          const idx = Math.floor(relX * 7);
          if (idx >= 0 && idx < 7) ignite(idx);
        }}
        className="relative mt-8 flex h-[230px] w-full items-start justify-around overflow-hidden rounded-[1.75rem] border px-3 pb-6 pt-0 shadow-[0_24px_56px_-22px_rgba(0,0,0,0.45)] backdrop-blur-md transition-all duration-700"
        style={{
          borderColor: `${theme.line}66`,
          background:
            litCount >= 4
              ? `radial-gradient(100% 80% at 50% 40%, color-mix(in srgb, ${theme.line} 32%, ${theme.paper}), color-mix(in srgb, ${theme.ground} 85%, #120b08))`
              : `linear-gradient(180deg, color-mix(in srgb, ${theme.paper} 18%, transparent), color-mix(in srgb, ${theme.ground} 65%, #0e0a09))`,
        }}
      >
        {[46, 78, 56, 92, 58, 82, 48].map((cordLen, idx) => {
          const isLit = lit[idx];
          return (
            <button
              key={idx}
              type="button"
              onMouseEnter={() => ignite(idx)}
              onClick={() => ignite(idx)}
              aria-label={`Thắp đèn lồng ${idx + 1}`}
              className="group flex flex-col items-center focus:outline-none"
            >
              <span className="block w-px opacity-55" style={{ height: cordLen, background: theme.line }} />
              <span
                className="relative grid h-11 w-9 place-items-center rounded-b-2xl rounded-t-md border transition-all duration-500 sm:h-12 sm:w-10"
                style={{
                  borderColor: isLit ? '#fff5d6' : `${theme.line}77`,
                  background: isLit
                    ? `radial-gradient(circle at 50% 42%, #fffbeb 0%, ${theme.line} 52%, ${theme.accent} 100%)`
                    : `linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))`,
                  boxShadow: isLit
                    ? `0 0 28px 6px color-mix(in srgb, ${theme.line} 70%, transparent), inset 0 0 12px #ffffff`
                    : 'none',
                  transform: isLit ? 'translateY(-3px) scale(1.06)' : 'translateY(0) scale(1)',
                }}
              >
                <span
                  className="h-2 w-2 rounded-full transition-opacity duration-300"
                  style={{ background: '#ffffff', opacity: isLit ? 0.95 : 0.25 }}
                />
              </span>
            </button>
          );
        })}

        <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] font-semibold tracking-[0.2em]" style={{ color: headInk }}>
          {opening ? 'Ánh đèn đã sáng — đang mở thiệp…' : `Lướt tay qua dãy đèn lồng (${litCount}/7)`}
        </div>
      </div>

      <button
        type="button"
        onClick={openAll}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full border px-5 py-2 text-xs font-bold tracking-wide transition hover:brightness-110"
        style={{ background: theme.accent, color: theme.onAccent, borderColor: theme.line }}
      >
        <Sparkles className="h-3.5 w-3.5" /> Thắp tất cả &amp; Mở thiệp
      </button>
    </div>
  );
}

/* ───────────────────────── 3. WovenEditorialBanner (Kesten / Glint) ───────────────────────── */

export function WovenEditorialBanner({
  groom,
  bride,
  src,
  theme,
}: {
  groom: string;
  bride: string;
  src: string;
  theme: InviteTheme;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [spread, setSpread] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      setSpread(progress);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!src) return null;

  const shortGroom = groom.trim().split(/\s+/).slice(-1)[0] || groom;
  const shortBride = bride.trim().split(/\s+/).slice(-1)[0] || bride;
  const wordmark = `${shortGroom} & ${shortBride}`.toUpperCase();
  const accent = theme.accentText ?? theme.accent;
  const darkPaper = isDark(theme.paper);
  const letterSpacing = `${(0.06 + spread * 0.14).toFixed(3)}em`;

  return (
    <div
      ref={ref}
      data-woven-editorial="true"
      className="relative mx-auto my-2 overflow-hidden px-4 py-10 text-center sm:px-6"
    >
      {/* Layer 1: Solid giant display wordmark BEHIND the portrait */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-1/2 select-none whitespace-nowrap text-center font-bold leading-none transition-[letter-spacing] duration-150"
        style={{
          fontFamily: theme.display,
          fontSize: 'clamp(2.8rem, 13vw, 4.6rem)',
          letterSpacing,
          color: darkPaper ? theme.line : accent,
          opacity: darkPaper ? 0.34 : 0.22,
        }}
      >
        {wordmark}
      </div>

      {/* Layer 2: Framed portrait photo in the middle depth plane */}
      <div
        className="relative z-[2] mx-auto w-[74%] overflow-hidden rounded-[var(--inv-r)] shadow-[0_22px_48px_-22px_rgba(0,0,0,0.48)] sm:w-[68%]"
        style={{ border: `1px solid ${theme.line}99` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sized(src, true)}
          alt={`${groom} và ${bride}`}
          loading="lazy"
          className="block aspect-[4/5] w-full object-cover"
          style={{ filter: theme.layout.photoFilter }}
        />
      </div>

      {/* Layer 3: Crisp 1px hollow outline stroke of the EXACT same wordmark IN FRONT of the portrait */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 z-[3] -translate-y-1/2 select-none whitespace-nowrap text-center font-bold leading-none transition-[letter-spacing] duration-150"
        style={{
          fontFamily: theme.display,
          fontSize: 'clamp(2.8rem, 13vw, 4.6rem)',
          letterSpacing,
          color: 'transparent',
          WebkitTextStroke: `1.2px ${darkPaper ? '#fff6e0' : '#ffffff'}`,
          textShadow: '0 2px 14px rgba(0,0,0,0.2)',
        }}
      >
        {wordmark}
      </div>
    </div>
  );
}

/* ───────────────────────── 4. EditorialStoryChapters (Lunde 01–05) ───────────────────────── */

export function EditorialStoryChapters({
  story,
  photos,
  theme,
}: {
  story: InvitationStoryItem[];
  photos: Array<{ id: string; url: string; caption: string | null }>;
  theme: InviteTheme;
}) {
  const [openIdx, setOpenIdx] = useState(0);
  const accent = theme.accentText ?? theme.accent;
  const activePhoto = photos.length > 0 ? photos[openIdx % photos.length] : null;

  return (
    <div data-lunde-story="true" className="mx-auto max-w-[460px] text-left">
      {activePhoto && (
        <div
          className="relative mb-6 overflow-hidden rounded-[var(--inv-r)] shadow-md"
          style={{ border: `1px solid ${theme.line}88` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activePhoto.id}
            src={sized(activePhoto.url, true)}
            alt={activePhoto.caption || 'Kỷ niệm tình yêu'}
            loading="lazy"
            className="block aspect-[16/10] w-full object-cover animate-[inv-rise_500ms_ease_both] motion-reduce:animate-none"
            style={{ filter: theme.layout.photoFilter }}
          />
          <span
            className="absolute bottom-2.5 left-2.5 rounded-full px-3 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.18em] backdrop-blur-sm"
            style={{ background: `color-mix(in srgb, ${theme.paper} 86%, transparent)`, color: accent }}
          >
            Chương {String(openIdx + 1).padStart(2, '0')} / {String(story.length).padStart(2, '0')}
          </span>
        </div>
      )}

      <div className="divide-y" style={{ borderColor: `${theme.line}77` }}>
        {story.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={item.id} style={{ borderColor: `${theme.line}66` }}>
              <button
                type="button"
                onClick={() => setOpenIdx(idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 py-4 text-left transition hover:opacity-90"
              >
                <div className="flex min-w-0 items-baseline gap-3.5">
                  <span
                    className="shrink-0 font-mono text-sm font-bold tabular-nums tracking-wider"
                    style={{ color: isOpen ? accent : theme.inkSoft }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    {item.when && (
                      <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: accent }}>
                        {item.when}
                      </p>
                    )}
                    <h3
                      className="mt-0.5 text-[19px] leading-snug"
                      style={{
                        fontFamily: theme.display,
                        fontWeight: theme.namesWeight === 400 ? 400 : 600,
                        color: theme.ink,
                      }}
                    >
                      {item.title || `Dấu mốc #${idx + 1}`}
                    </h3>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: accent }}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isOpen ? 'max-h-72 pb-4 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {item.text && (
                  <p className="pl-9 text-[15px] leading-relaxed [text-wrap:pretty]" style={{ color: theme.inkSoft }}>
                    {item.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

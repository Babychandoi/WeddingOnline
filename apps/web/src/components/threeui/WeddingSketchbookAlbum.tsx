'use client';

/**
 * Adapted from ThreeUI Community `sketchbook` & `bookshelf` (MengTo/threeui, MIT).
 * Real physical 3D nested-strip curved page-flip wedding album & keepsake book:
 * - 7 nested CSS 3D strips forming a continuous bending sheet (0° -> 180°) with
 *   separate front & back faces, dynamic per-strip lighting, specular crest glint,
 *   and cast gutter shadow on the underlying pages.
 * - Direct pointer/touch drag-to-flip following the user's finger in real time,
 *   spring release physics, click-page & corner-peel turn, and keyboard arrows.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Expand } from 'lucide-react';

export interface AlbumBookPhoto {
  id: string;
  url: string;
  caption?: string | null;
}

export interface AlbumBookWish {
  id: string;
  authorName: string;
  message: string;
}

export interface WeddingSketchbookAlbumProps {
  title: string;
  coupleLabel: string;
  dateLabel?: string;
  photos: AlbumBookPhoto[];
  wishes?: AlbumBookWish[];
  onInspectPhoto?: (photo: AlbumBookPhoto) => void;
  accentColor?: string;
  onAccentColor?: string;
  className?: string;
}

interface BookSheet {
  frontTitle?: string;
  photo?: AlbumBookPhoto;
  wish?: AlbumBookWish;
  isCover?: boolean;
  isEnding?: boolean;
}

interface ActiveTurn {
  dir: 'next' | 'prev';
  from: number;
  to: number;
}

const STRIP_COUNT = 7;
/** Peak curl curvature in radians (~25deg), flat at t=0 and t=1 */
const CURL_BETA = 0.44;
const RAD_TO_DEG = 180 / Math.PI;

/* ───────────────────────── Individual Half-Page Renderers ───────────────────────── */

function LeftPageContent({
  sheet,
  sheetIdx,
  photoCount,
  coupleLabel,
  dateLabel,
  accentColor,
}: {
  sheet: BookSheet;
  sheetIdx: number;
  photoCount: number;
  coupleLabel: string;
  dateLabel?: string;
  accentColor: string;
}) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-[#fffdf9] via-[#fcf7ee] to-[#f4e8d5] px-3.5 py-4 text-left sm:px-6 sm:py-6">
      {/* Subtle paper grain & inner margin frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-[10px] border border-amber-900/[0.08]"
      />
      {/* Book spine binding crease on the right edge of the left page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-amber-950/[0.14] via-amber-950/[0.04] to-transparent"
      />

      {sheet.isCover ? (
        <div className="relative z-[1] flex h-full flex-col items-center justify-center text-center">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200/80 font-serif text-lg font-bold shadow-md sm:h-12 sm:w-12 sm:rounded-2xl sm:text-xl"
            style={{ background: accentColor, color: '#fef3c7' }}
          >
            囍
          </span>
          <p
            className="mt-3 text-[9px] font-bold uppercase tracking-[0.24em] sm:mt-4 sm:text-[10.5px]"
            style={{ color: accentColor, opacity: 0.85 }}
          >
            Sổ Ảnh &amp; Kỷ Niệm 3D
          </p>
          <h3 className="mt-1.5 font-serif text-lg font-bold leading-tight text-slate-900 sm:mt-2 sm:text-2xl [text-wrap:balance]">
            {coupleLabel}
          </h3>
          {dateLabel && (
            <p className="mt-1.5 text-[10px] font-semibold tabular-nums tracking-[0.2em] text-slate-500 sm:text-xs">
              {dateLabel}
            </p>
          )}
          <p className="mt-3 max-w-[24ch] text-[10.5px] leading-relaxed text-slate-600 sm:mt-5 sm:text-xs">
            Kéo góc trang hoặc bấm mũi tên để lật từng tờ album cưới như sách thật.
          </p>
        </div>
      ) : sheet.isEnding ? (
        <div className="relative z-[1] flex h-full flex-col items-center justify-center text-center">
          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8" style={{ color: accentColor }} />
          <h3 className="mt-2.5 font-serif text-lg font-bold text-slate-900 sm:mt-3 sm:text-2xl">
            Cảm Ơn Đã Chung Vui
          </h3>
          <p className="mt-2 max-w-[26ch] text-[10.5px] leading-relaxed text-slate-600 sm:text-xs">
            Mọi khoảnh khắc trong ngày cưới của {coupleLabel} sẽ luôn ở đây như một cuốn sổ kỷ niệm mở ra bất cứ lúc nào.
          </p>
        </div>
      ) : (
        <div className="relative z-[1] flex h-full flex-col justify-between">
          <div>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.22em] sm:text-[10px]"
              style={{ color: accentColor }}
            >
              Trang {String(sheetIdx).padStart(2, '0')} / {String(Math.max(1, photoCount)).padStart(2, '0')}
            </span>
            <h4 className="mt-1.5 line-clamp-3 font-serif text-base font-bold leading-snug text-slate-900 sm:mt-2 sm:text-[21px]">
              {sheet.photo?.caption || `Khoảnh khắc hạnh phúc #${sheetIdx}`}
            </h4>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500 sm:mt-1.5 sm:text-xs">
              {coupleLabel}
              {dateLabel ? ` · ${dateLabel}` : ''}
            </p>
          </div>

          {sheet.wish ? (
            <blockquote className="my-2 rounded-lg border border-amber-300/60 bg-white/80 p-2.5 text-[10.5px] leading-relaxed text-slate-700 shadow-sm sm:rounded-xl sm:p-3.5 sm:text-xs">
              <p className="line-clamp-4 italic">“{sheet.wish.message}”</p>
              <footer className="mt-1.5 font-bold" style={{ color: accentColor }}>
                — {sheet.wish.authorName}
              </footer>
            </blockquote>
          ) : (
            <div className="my-2 h-px w-12 bg-amber-800/20" />
          )}

          <p className="text-[8.5px] uppercase tracking-[0.22em] text-amber-900/55 sm:text-[9.5px]">
            DamCuoiOnline Keepsake
          </p>
        </div>
      )}
    </div>
  );
}

function RightPageContent({
  sheet,
  nextSheet,
  title,
  coupleLabel,
  accentColor,
  onInspectPhoto,
  onOpenFirst,
  onResetCover,
  interactive = true,
}: {
  sheet: BookSheet;
  nextSheet?: BookSheet;
  title: string;
  coupleLabel: string;
  accentColor: string;
  onInspectPhoto?: (photo: AlbumBookPhoto) => void;
  onOpenFirst?: () => void;
  onResetCover?: () => void;
  interactive?: boolean;
}) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-gradient-to-bl from-[#fffdf8] via-[#fbf5ea] to-[#f2e4cc] p-3 sm:p-5">
      {/* Subtle inner frame */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 rounded-[10px] border border-amber-900/[0.08]"
      />
      {/* Spine binding shadow on left edge of right page */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-7 bg-gradient-to-r from-amber-950/[0.15] via-amber-950/[0.04] to-transparent"
      />

      {sheet.isCover && nextSheet?.photo ? (
        <div className="relative z-[1] flex h-full flex-col overflow-hidden rounded-lg border-[3px] border-white bg-white shadow-[0_10px_24px_-10px_rgba(68,31,10,0.4)] sm:rounded-xl sm:border-4">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nextSheet.photo.url}
              alt={nextSheet.photo.caption || title}
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 bg-white px-2.5 py-2 text-[10px] font-semibold text-slate-600 sm:px-3 sm:py-2.5 sm:text-[11px]">
            <span className="truncate">Bìa album cưới</span>
            {interactive ? (
              <button
                type="button"
                data-no-flip="true"
                onClick={onOpenFirst}
                className="shrink-0 font-bold hover:underline"
                style={{ color: accentColor }}
              >
                Mở trang đầu →
              </button>
            ) : (
              <span className="shrink-0 font-bold" style={{ color: accentColor }}>
                Mở trang đầu →
              </span>
            )}
          </div>
        </div>
      ) : sheet.photo ? (
        <div className="group relative z-[1] flex h-full flex-col overflow-hidden rounded-lg border-[3px] border-white bg-white shadow-[0_10px_24px_-10px_rgba(68,31,10,0.4)] sm:rounded-xl sm:border-4">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sheet.photo.url}
              alt={sheet.photo.caption || 'Ảnh cưới'}
              draggable={false}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
            {interactive && onInspectPhoto && (
              <button
                type="button"
                data-no-flip="true"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspectPhoto(sheet.photo!);
                }}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm transition hover:bg-slate-900 sm:text-[11px]"
              >
                <Expand className="h-3 w-3" /> Phóng to
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 bg-white px-2.5 py-1.5 text-[9.5px] text-slate-500 sm:px-3 sm:py-2 sm:text-[10.5px]">
            <span className="truncate italic">{sheet.photo.caption || coupleLabel}</span>
            <span className="shrink-0 font-semibold uppercase tracking-[0.14em] text-amber-800/60">Kéo để lật</span>
          </div>
        </div>
      ) : (
        <div className="relative z-[1] flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-amber-300/90 bg-white/75 p-4 text-center sm:p-6">
          <span className="font-serif text-3xl sm:text-4xl" style={{ color: accentColor }}>
            ♥
          </span>
          <p className="mt-2 font-serif text-base font-bold text-slate-800 sm:text-lg">{coupleLabel}</p>
          {interactive && onResetCover && (
            <button
              type="button"
              data-no-flip="true"
              onClick={(e) => {
                e.stopPropagation();
                onResetCover();
              }}
              className="mt-3 rounded-full border px-3.5 py-1.5 text-[11px] font-bold transition hover:opacity-90 sm:mt-4 sm:px-4 sm:text-xs"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              Lật lại từ bìa
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Recursive 3D Curled Strip Chain ───────────────────────── */

function CurlStripNode({
  index,
  total,
  dir,
  halfWidth,
  frontContent,
  backContent,
  registerStrip,
}: {
  index: number;
  total: number;
  dir: 'next' | 'prev';
  halfWidth: number;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  registerStrip: (i: number, el: HTMLDivElement | null) => void;
}) {
  const sw = halfWidth / total;
  const isNext = dir === 'next';
  const frontOffset = isNext ? -index * sw : -(total - 1 - index) * sw;
  const backOffset = isNext ? -(total - 1 - index) * sw : -index * sw;

  return (
    <div
      ref={(el) => registerStrip(index, el)}
      className="pointer-events-none absolute top-0 h-full will-change-transform"
      style={{
        width: index === 0 ? `${sw}px` : '100%',
        left: isNext ? (index === 0 ? 0 : '100%') : 'auto',
        right: !isNext ? (index === 0 ? 0 : '100%') : 'auto',
        transformOrigin: isNext ? 'left center' : 'right center',
        transformStyle: 'preserve-3d',
        transform:
          index === 0
            ? undefined
            : isNext
              ? 'rotateY(var(--sb-td, 0deg))'
              : 'rotateY(calc(-1 * var(--sb-td, 0deg)))',
      }}
    >
      {/* Front Face (visible 0° -> 90°) — leaf node so overflow-hidden does NOT break preserve-3d on parent */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 overflow-hidden border-y border-amber-900/15 ${
          index === total - 1 ? (isNext ? 'rounded-r-[13px] border-r' : 'rounded-l-[13px] border-l') : ''
        }`}
        style={{
          right: index === total - 1 ? '0px' : '-0.9px',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div
          className="absolute inset-y-0"
          style={{
            width: `${halfWidth}px`,
            left: `${frontOffset}px`,
          }}
        >
          {frontContent}
        </div>
        {/* Curved directional shading across this strip */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: isNext
              ? 'linear-gradient(90deg, rgba(48,32,12,var(--sb-a1,0)), rgba(48,32,12,var(--sb-a2,0)))'
              : 'linear-gradient(90deg, rgba(48,32,12,var(--sb-a2,0)), rgba(48,32,12,var(--sb-a1,0)))',
          }}
        />
        {/* Warm paper specular highlight on the bending ridge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[#fffaf0]"
          style={{ opacity: 'var(--sb-gl, 0)' }}
        />
      </div>

      {/* Back Face (visible 90° -> 180°, flipped upright when landed on opposite side) */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 overflow-hidden border-y border-amber-900/15 ${
          index === total - 1 ? (isNext ? 'rounded-l-[13px] border-l' : 'rounded-r-[13px] border-r') : ''
        }`}
        style={{
          right: index === total - 1 ? '0px' : '-0.9px',
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div
          className="absolute inset-y-0"
          style={{
            width: `${halfWidth}px`,
            left: `${backOffset}px`,
          }}
        >
          {backContent}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: isNext
              ? 'linear-gradient(90deg, rgba(48,32,12,var(--sb-a2,0)), rgba(48,32,12,var(--sb-a1,0)))'
              : 'linear-gradient(90deg, rgba(48,32,12,var(--sb-a1,0)), rgba(48,32,12,var(--sb-a2,0)))',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[#fffaf0]"
          style={{ opacity: 'var(--sb-gl, 0)' }}
        />
      </div>

      {/* Next nested strip continues the curved sheet */}
      {index + 1 < total && (
        <CurlStripNode
          index={index + 1}
          total={total}
          dir={dir}
          halfWidth={halfWidth}
          frontContent={frontContent}
          backContent={backContent}
          registerStrip={registerStrip}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Main Sketchbook Component ───────────────────────── */

export function WeddingSketchbookAlbum({
  title,
  coupleLabel,
  dateLabel,
  photos,
  wishes = [],
  onInspectPhoto,
  accentColor = '#9f1239',
  onAccentColor = '#ffffff',
  className = '',
}: WeddingSketchbookAlbumProps) {
  const sheets: BookSheet[] = useMemo(() => {
    const list: BookSheet[] = [{ isCover: true, frontTitle: title }];
    photos.forEach((photo, idx) => {
      list.push({
        photo,
        wish: wishes[idx % Math.max(1, wishes.length)],
      });
    });
    if (photos.length === 0) {
      list.push({ isEnding: true, wish: wishes[0] });
    } else {
      list.push({ isEnding: true, wish: wishes[wishes.length - 1] });
    }
    return list;
  }, [title, photos, wishes]);

  const [pageIdx, setPageIdx] = useState(0);
  const [turn, setTurn] = useState<ActiveTurn | null>(null);
  const [bookWidth, setBookWidth] = useState(480);
  const [hoverCorner, setHoverCorner] = useState<'next' | 'prev' | null>(null);

  const bookRef = useRef<HTMLDivElement>(null);
  const stripRefs = useRef<Array<HTMLDivElement | null>>([]);
  const turnRef = useRef<ActiveTurn | null>(null);
  const progressRef = useRef(0);
  const velocityRef = useRef(0);
  const springTargetRef = useRef<number | null>(null);
  const pendingLaunchRef = useRef<{ target: 0 | 1; vel: number } | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastTime: number;
    active: boolean;
    dir: 'next' | 'prev' | null;
    vx: number;
  } | null>(null);

  const registerStrip = useCallback((i: number, el: HTMLDivElement | null) => {
    stripRefs.current[i] = el;
  }, []);

  // Measure book width accurately so strip geometry stays pixel-locked across screen sizes
  useEffect(() => {
    const el = bookRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 120) setBookWidth(w);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Apply continuous curved-sheet angles & per-strip shading directly to CSS vars (0 React re-renders)
  const applyProgress = useCallback((rawT: number) => {
    const t = Math.max(0, Math.min(1, rawT));
    progressRef.current = t;
    const host = bookRef.current;
    if (!host) return;

    const th = Math.PI * t;
    const sinPi = Math.sin(th);
    const beta = CURL_BETA * sinPi;
    const tt = th + beta;
    const td = (2 * beta) / STRIP_COUNT;

    host.style.setProperty('--sb-tt', `${(tt * RAD_TO_DEG).toFixed(2)}deg`);
    host.style.setProperty('--sb-td', `${(td * RAD_TO_DEG).toFixed(3)}deg`);
    host.style.setProperty('--sb-shade-left', `${(sinPi * (0.25 + 0.75 * t) * 0.58).toFixed(3)}`);
    host.style.setProperty('--sb-shade-right', `${(sinPi * (1 - 0.7 * t) * 0.52).toFixed(3)}`);

    for (let i = 0; i < STRIP_COUNT; i++) {
      const st = stripRefs.current[i];
      if (!st) continue;
      const l1 = Math.abs(Math.cos(tt - i * td));
      const l2 = Math.abs(Math.cos(tt - (i + 1) * td));
      st.style.setProperty('--sb-a1', ((1 - l1) * 0.46).toFixed(3));
      st.style.setProperty('--sb-a2', ((1 - l2) * 0.46).toFixed(3));
      st.style.setProperty('--sb-gl', (sinPi * l1 * l1 * 0.22).toFixed(3));
    }
  }, []);

  const stopAnim = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    springTargetRef.current = null;
  }, []);

  const finishTurn = useCallback(
    (completed: boolean) => {
      stopAnim();
      const active = turnRef.current;
      turnRef.current = null;
      if (completed && active) {
        setPageIdx(active.to);
      }
      setTurn(null);
      progressRef.current = 0;
      velocityRef.current = 0;
      const host = bookRef.current;
      if (host) {
        host.style.setProperty('--sb-shade-left', '0');
        host.style.setProperty('--sb-shade-right', '0');
      }
    },
    [stopAnim],
  );

  // Damped spring animation loop (matches ThreeUI sketchbook feel)
  const animateToTarget = useCallback(
    (target: 0 | 1, initialVel = 0) => {
      stopAnim();
      springTargetRef.current = target;
      velocityRef.current = initialVel;
      lastFrameRef.current = performance.now();

      const step = (now: number) => {
        const dt = Math.min(0.032, Math.max(0.004, (now - lastFrameRef.current) / 1000));
        lastFrameRef.current = now;
        const tgt = springTargetRef.current;
        if (tgt === null || !turnRef.current) {
          rafRef.current = 0;
          return;
        }

        // Critically tuned spring: crisp launch, soft paper settle
        const stiffness = 135;
        const damping = 19.5;
        const x = progressRef.current - tgt;
        velocityRef.current += (-stiffness * x - damping * velocityRef.current) * dt;
        const nextT = progressRef.current + velocityRef.current * dt;

        if (
          (tgt === 1 && nextT >= 0.996 && Math.abs(velocityRef.current) < 0.08) ||
          (tgt === 0 && nextT <= 0.004 && Math.abs(velocityRef.current) < 0.08) ||
          (Math.abs(nextT - tgt) < 0.003 && Math.abs(velocityRef.current) < 0.04)
        ) {
          applyProgress(tgt);
          finishTurn(tgt === 1);
          return;
        }

        applyProgress(nextT);
        rafRef.current = requestAnimationFrame(step);
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [applyProgress, finishTurn, stopAnim],
  );

  // Re-apply initial progress after strip DOM commits and launch queued programmatic spring
  useEffect(() => {
    if (!turn) return;
    applyProgress(progressRef.current);
    const pending = pendingLaunchRef.current;
    if (pending) {
      pendingLaunchRef.current = null;
      animateToTarget(pending.target, pending.vel);
    }
  }, [turn, applyProgress, animateToTarget]);

  useEffect(() => () => stopAnim(), [stopAnim]);

  const startProgrammaticTurn = useCallback(
    (dir: 'next' | 'prev', targetIdx?: number) => {
      if (turnRef.current) return;
      const to =
        targetIdx !== undefined
          ? Math.max(0, Math.min(sheets.length - 1, targetIdx))
          : dir === 'next'
            ? Math.min(sheets.length - 1, pageIdx + 1)
            : Math.max(0, pageIdx - 1);
      if (to === pageIdx) return;

      const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        setPageIdx(to);
        return;
      }

      const active: ActiveTurn = { dir, from: pageIdx, to };
      turnRef.current = active;
      progressRef.current = 0.008;
      pendingLaunchRef.current = { target: 1, vel: 0.9 };
      setTurn(active);
    },
    [pageIdx, sheets.length],
  );

  const jumpToPage = useCallback(
    (idx: number) => {
      if (idx === pageIdx || turnRef.current) return;
      startProgrammaticTurn(idx > pageIdx ? 'next' : 'prev', idx);
    },
    [pageIdx, startProgrammaticTurn],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowRight') startProgrammaticTurn('next');
      if (e.key === 'ArrowLeft') startProgrammaticTurn('prev');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startProgrammaticTurn]);

  /* ── Interactive Direct Pointer / Touch Drag-to-Turn ── */
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement)?.closest('[data-no-flip="true"]')) return;
    if (turnRef.current && springTargetRef.current !== null) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastTime: performance.now(),
      active: false,
      dir: null,
      vx: 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = bookRef.current;
    // Track subtle corner peel hover when not dragging
    if (!dragRef.current && !turnRef.current && el && e.pointerType !== 'touch') {
      const rect = el.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
      const relY = (e.clientY - rect.top) / Math.max(1, rect.height);
      if (relX > 0.72 && relY > 0.55 && pageIdx < sheets.length - 1) setHoverCorner('next');
      else if (relX < 0.28 && relY > 0.55 && pageIdx > 0) setHoverCorner('prev');
      else setHoverCorner(null);
    }

    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.active) {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
        dragRef.current = null; // user is scrolling vertically
        return;
      }
      if (Math.abs(dx) < 8) return;

      const dir: 'next' | 'prev' = dx < 0 ? 'next' : 'prev';
      if (dir === 'next' && pageIdx >= sheets.length - 1) return;
      if (dir === 'prev' && pageIdx <= 0) return;

      d.active = true;
      d.dir = dir;
      setHoverCorner(null);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore if pointer already captured
      }
      const active: ActiveTurn = {
        dir,
        from: pageIdx,
        to: dir === 'next' ? pageIdx + 1 : pageIdx - 1,
      };
      turnRef.current = active;
      setTurn(active);
    }

    if (d.active && d.dir && el) {
      const now = performance.now();
      const dtSec = Math.max(0.008, (now - d.lastTime) / 1000);
      const span = Math.max(140, el.clientWidth * 0.62);
      const rawT = d.dir === 'next' ? -dx / span : dx / span;
      const clampedT = Math.max(0.005, Math.min(0.995, rawT));
      const stepDx = e.clientX - d.lastX;
      const stepV = (d.dir === 'next' ? -stepDx : stepDx) / span / dtSec;
      d.vx = d.vx * 0.55 + stepV * 0.45;
      d.lastX = e.clientX;
      d.lastTime = now;
      applyProgress(clampedT);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    dragRef.current = null;

    if (d.active && turnRef.current) {
      const shouldCommit = progressRef.current > 0.28 || d.vx > 0.8;
      animateToTarget(shouldCommit ? 1 : 0, Math.max(-2.5, Math.min(3.5, d.vx)));
      return;
    }

    // Simple click / tap on right or left page edge turns the page smoothly
    if ((e.target as HTMLElement)?.closest('[data-no-flip="true"]')) return;
    const el = bookRef.current;
    if (!el || turnRef.current) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / Math.max(1, rect.width);
    if (relX >= 0.52 && pageIdx < sheets.length - 1) {
      startProgrammaticTurn('next');
    } else if (relX <= 0.48 && pageIdx > 0) {
      startProgrammaticTurn('prev');
    }
  };

  const canPrev = pageIdx > 0;
  const canNext = pageIdx < sheets.length - 1;
  const halfWidth = bookWidth / 2;

  // Determine which static pages lie beneath the turning leaf
  const staticLeftIdx = turn ? (turn.dir === 'next' ? turn.from : turn.to) : pageIdx;
  const staticRightIdx = turn ? (turn.dir === 'next' ? turn.to : turn.from) : pageIdx;
  const staticLeftSheet = sheets[staticLeftIdx] ?? sheets[0];
  const staticRightSheet = sheets[staticRightIdx] ?? sheets[0];
  const staticRightNext = sheets[Math.min(sheets.length - 1, staticRightIdx + 1)];

  // Content on front & back of the physical 3D turning sheet
  const turnFrontContent = useMemo(() => {
    if (!turn) return null;
    if (turn.dir === 'next') {
      const s = sheets[turn.from] ?? sheets[0];
      const nxt = sheets[Math.min(sheets.length - 1, turn.from + 1)];
      return (
        <RightPageContent
          sheet={s}
          nextSheet={nxt}
          title={title}
          coupleLabel={coupleLabel}
          accentColor={accentColor}
          interactive={false}
        />
      );
    }
    const s = sheets[turn.from] ?? sheets[0];
    return (
      <LeftPageContent
        sheet={s}
        sheetIdx={turn.from}
        photoCount={photos.length}
        coupleLabel={coupleLabel}
        dateLabel={dateLabel}
        accentColor={accentColor}
      />
    );
  }, [accentColor, coupleLabel, dateLabel, photos.length, sheets, title, turn]);

  const turnBackContent = useMemo(() => {
    if (!turn) return null;
    if (turn.dir === 'next') {
      const s = sheets[turn.to] ?? sheets[0];
      return (
        <LeftPageContent
          sheet={s}
          sheetIdx={turn.to}
          photoCount={photos.length}
          coupleLabel={coupleLabel}
          dateLabel={dateLabel}
          accentColor={accentColor}
        />
      );
    }
    const s = sheets[turn.to] ?? sheets[0];
    const nxt = sheets[Math.min(sheets.length - 1, turn.to + 1)];
    return (
      <RightPageContent
        sheet={s}
        nextSheet={nxt}
        title={title}
        coupleLabel={coupleLabel}
        accentColor={accentColor}
        interactive={false}
      />
    );
  }, [accentColor, coupleLabel, dateLabel, photos.length, sheets, title, turn]);

  const leftStack = Math.min(4, Math.max(1, Math.round((pageIdx / Math.max(1, sheets.length - 1)) * 4)));
  const rightStack = Math.min(4, Math.max(1, 5 - leftStack));

  return (
    <div className={`mx-auto w-full max-w-3xl select-none ${className}`}>
      {/* Desk / tabletop mat framing the 3D book (overflow-visible lets the curling leaf rise in Z-space) */}
      <div className="relative rounded-[1.5rem] border border-amber-300/70 bg-gradient-to-br from-[#f6ebd5] via-[#efe1c5] to-[#e4cfab] px-3 py-5 shadow-[0_26px_60px_-28px_rgba(92,45,12,0.52)] sm:rounded-[1.75rem] sm:px-7 sm:py-7">
        {/* Separate perspective host so preserve-3d children project cleanly in Chrome & Safari */}
        <div className="relative mx-auto w-full" style={{ perspective: '1650px' }}>
          <div
            ref={bookRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUpOrCancel}
            onPointerCancel={handlePointerUpOrCancel}
            onPointerLeave={() => setHoverCorner(null)}
            className="relative mx-auto h-[305px] w-full cursor-grab touch-pan-y active:cursor-grabbing min-[420px]:h-[345px] sm:h-[415px]"
            style={{
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Hardcover board edge peeking underneath */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-[5px] -inset-y-[4px] rounded-[18px] shadow-[0_22px_42px_-16px_rgba(62,28,8,0.55)]"
              style={{
                transform: 'translateZ(-2px)',
                background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 82%, #24120a), color-mix(in srgb, ${accentColor} 62%, #1a0c06))`,
              }}
            />

            {/* Layered paper thickness stacks on outer left & right */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-[3px] left-[-2px] w-3 rounded-l-[12px] bg-[#efe3cf]"
              style={{
                transform: 'translateZ(-1px)',
                boxShadow: Array.from({ length: leftStack }, (_, i) => `-${i + 1}px 0 0 #d8c6a8`).join(', '),
              }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-[3px] right-[-2px] w-3 rounded-r-[12px] bg-[#efe3cf]"
              style={{
                transform: 'translateZ(-1px)',
                boxShadow: Array.from({ length: rightStack }, (_, i) => `${i + 1}px 0 0 #d8c6a8`).join(', '),
              }}
            />

            {/* Base Static Left Half */}
            <div
              className="absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[13px] border-y border-l border-amber-900/20 shadow-inner"
              style={{ transform: 'translateZ(0px)' }}
            >
              <LeftPageContent
                sheet={staticLeftSheet}
                sheetIdx={staticLeftIdx}
                photoCount={photos.length}
                coupleLabel={coupleLabel}
                dateLabel={dateLabel}
                accentColor={accentColor}
              />
              {/* Dynamic shadow cast by the turning leaf onto the left page */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-0 w-[62%] bg-gradient-to-l from-amber-950/45 via-amber-950/15 to-transparent"
                style={{ opacity: 'var(--sb-shade-left, 0)' }}
              />
              {/* Interactive corner peel hint on bottom-left */}
              {canPrev && !turn && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 left-0 transition-all duration-300"
                  style={{
                    width: hoverCorner === 'prev' ? '34px' : '16px',
                    height: hoverCorner === 'prev' ? '34px' : '16px',
                    background: 'linear-gradient(45deg, #e7d7bc 0%, #fffdf8 46%, rgba(82,52,20,0.22) 52%, transparent 64%)',
                    boxShadow: hoverCorner === 'prev' ? '4px -4px 10px rgba(68,38,12,0.18)' : 'none',
                  }}
                />
              )}
            </div>

            {/* Base Static Right Half */}
            <div
              className="absolute inset-y-0 right-0 w-1/2 overflow-hidden rounded-r-[13px] border-y border-r border-amber-900/20 shadow-inner"
              style={{ transform: 'translateZ(0px)' }}
            >
              <RightPageContent
                sheet={staticRightSheet}
                nextSheet={staticRightNext}
                title={title}
                coupleLabel={coupleLabel}
                accentColor={accentColor}
                onInspectPhoto={onInspectPhoto}
                onOpenFirst={() => startProgrammaticTurn('next')}
                onResetCover={() => jumpToPage(0)}
                interactive={!turn}
              />
              {/* Dynamic shadow cast by the turning leaf onto the right page */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-amber-950/45 via-amber-950/15 to-transparent"
                style={{ opacity: 'var(--sb-shade-right, 0)' }}
              />
              {/* Interactive corner peel hint on bottom-right */}
              {canNext && !turn && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 right-0 transition-all duration-300"
                  style={{
                    width: hoverCorner === 'next' ? '36px' : '18px',
                    height: hoverCorner === 'next' ? '36px' : '18px',
                    background: 'linear-gradient(315deg, #e7d7bc 0%, #fffdf8 46%, rgba(82,52,20,0.24) 52%, transparent 64%)',
                    boxShadow: hoverCorner === 'next' ? '-4px -4px 10px rgba(68,38,12,0.2)' : 'none',
                  }}
                />
              )}
            </div>

            {/* Center bookbinding spine crease line */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[2px] -translate-x-1/2 bg-amber-950/20"
              style={{ transform: 'translateX(-50%) translateZ(1px)' }}
            />

            {/* Real 7-Strip Nested 3D Curled Turning Sheet (0° -> 180°) */}
            {turn && (
              <div
                key={`${turn.dir}-${turn.from}-${turn.to}`}
                data-sb-turning={turn.dir}
                className="pointer-events-none absolute top-0 z-30 h-full will-change-transform"
                style={{
                  width: `${halfWidth / STRIP_COUNT}px`,
                  left: turn.dir === 'next' ? '50%' : 'auto',
                  right: turn.dir === 'prev' ? '50%' : 'auto',
                  transformOrigin: turn.dir === 'next' ? 'left center' : 'right center',
                  transformStyle: 'preserve-3d',
                  transform:
                    turn.dir === 'next'
                      ? 'translateZ(2px) rotateY(calc(-1 * var(--sb-tt, 0deg)))'
                      : 'translateZ(2px) rotateY(var(--sb-tt, 0deg))',
                }}
              >
                <CurlStripNode
                  index={0}
                  total={STRIP_COUNT}
                  dir={turn.dir}
                  halfWidth={halfWidth}
                  frontContent={turnFrontContent}
                  backContent={turnBackContent}
                  registerStrip={registerStrip}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom tactile pagination controls matched to template palette */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-0.5">
          <button
            type="button"
            onClick={() => startProgrammaticTurn('prev')}
            disabled={!canPrev || Boolean(turn)}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-full border border-amber-900/15 bg-white/90 px-3.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-white disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Trang trước
          </button>

          <div className="flex items-center gap-1.5">
            {sheets.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Trang ${i + 1}`}
                onClick={() => jumpToPage(i)}
                className="h-2 rounded-full transition-all"
                style={{
                  width: i === pageIdx ? '24px' : '8px',
                  background: i === pageIdx ? accentColor : 'rgba(120, 53, 15, 0.25)',
                }}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => startProgrammaticTurn('next')}
            disabled={!canNext || Boolean(turn)}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-full px-3.5 text-xs font-bold shadow-sm transition hover:brightness-110 disabled:opacity-40"
            style={{ background: accentColor, color: onAccentColor }}
          >
            Lật trang <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

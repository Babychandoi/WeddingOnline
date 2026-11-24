'use client';

/**
 * Upgraded with Gói 2 (Monolith-inspired 3D perspective coverflow with floor reflections,
 * active-card mouse tilt, word-by-word kinetic title & circular SVG autoplay progress ring)
 * and Gói 4 preview (Atlas monochrome-to-color character spotlight carousel).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { VenueTheme } from '@dco/shared';

const AUTOPLAY_MS = 4400;

export function OrbitalVenueGallery({
  venues,
  heading = 'Dạo Vòng Không Gian Cưới 3D',
  headingTag = 'h3',
}: {
  venues: VenueTheme[];
  heading?: string;
  headingTag?: 'h2' | 'h3';
}) {
  const shown = venues.slice(0, 10);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const dragStartRef = useRef<number | null>(null);

  const step = useCallback(
    (delta: number) => {
      if (shown.length <= 1) return;
      setActiveIdx((i) => (i + delta + shown.length) % shown.length);
      setProgress(0);
    },
    [shown.length],
  );

  // Smooth circular SVG autoplay progress ring around Next arrow button
  useEffect(() => {
    if (paused || shown.length <= 1) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    let start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= AUTOPLAY_MS) {
        start = now;
        setActiveIdx((i) => (i + 1) % shown.length);
        setProgress(0);
      } else {
        setProgress(elapsed / AUTOPLAY_MS);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, shown.length, activeIdx]);

  if (!shown.length) return null;
  const active = shown[activeIdx % shown.length];
  const titleWords = active.nameVi.split(/\s+/);
  const ringR = 17;
  const ringC = 2 * Math.PI * ringR;

  return (
    <div
      data-monolith-coverflow="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setTilt({ rx: 0, ry: 0 });
      }}
      onPointerDown={(e) => {
        dragStartRef.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (dragStartRef.current === null) return;
        const dx = e.clientX - dragStartRef.current;
        dragStartRef.current = null;
        if (dx < -40) step(1);
        else if (dx > 40) step(-1);
      }}
      className="relative overflow-hidden rounded-[2rem] border border-amber-200/80 bg-gradient-to-b from-[#fffdf8] via-[#faf3e5] to-[#f3e6cf] px-4 pb-7 pt-7 shadow-sm select-none sm:px-8 sm:pb-9 sm:pt-9"
    >
      {/* Top kicker + index */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-center sm:text-left">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-rose-700">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> {heading}
        </span>
        <span className="font-mono text-xs font-bold tabular-nums tracking-[0.2em] text-slate-600">
          <span className="text-rose-700">{String((activeIdx % shown.length) + 1).padStart(2, '0')}</span> /{' '}
          {String(shown.length).padStart(2, '0')}
        </span>
      </div>

      {/* 3D Perspective Coverflow Stage with subtle floor reflections */}
      <div className="relative mt-5 flex h-[250px] items-center justify-center overflow-hidden sm:h-[310px] [perspective:1350px]">
        {shown.map((v, idx) => {
          let offset = idx - activeIdx;
          if (offset > shown.length / 2) offset -= shown.length;
          if (offset < -shown.length / 2) offset += shown.length;
          const abs = Math.abs(offset);
          if (abs > 3) return null;

          const isCenter = offset === 0;
          const sign = offset === 0 ? 0 : offset > 0 ? 1 : -1;
          const tx = isCenter ? 0 : sign * (175 + (abs - 1) * 112);
          const tz = isCenter ? 32 : -abs * 125;
          const ry = isCenter ? tilt.ry : -sign * (42 + (abs - 1) * 8);
          const rx = isCenter ? tilt.rx : 0;
          const scale = isCenter ? 1 : Math.max(0.68, 0.84 - (abs - 1) * 0.08);
          const opacity = isCenter ? 1 : Math.max(0.28, 0.85 - abs * 0.2);

          return (
            <div
              key={v.id}
              style={{
                transform: `translate3d(${tx}px, 0, ${tz}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${scale})`,
                opacity,
                zIndex: 25 - abs * 3,
              }}
              onPointerMove={
                isCenter
                  ? (e) => {
                      if (e.pointerType === 'touch') return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const px = (e.clientX - rect.left) / Math.max(1, rect.width);
                      const py = (e.clientY - rect.top) / Math.max(1, rect.height);
                      setTilt({ rx: (0.5 - py) * 7, ry: (px - 0.5) * 9 });
                    }
                  : undefined
              }
              onPointerLeave={isCenter ? () => setTilt({ rx: 0, ry: 0 }) : undefined}
              className={`absolute transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isCenter ? 'w-[258px] sm:w-[400px]' : 'w-[180px] sm:w-[235px]'
              }`}
            >
              <Link
                href={`/khong-gian/${v.id.replace(/_/g, '-')}`}
                onClick={(e) => {
                  if (!isCenter) {
                    e.preventDefault();
                    setActiveIdx(idx);
                    setProgress(0);
                  }
                }}
                className={`group block overflow-hidden rounded-2xl border-2 bg-white shadow-[0_26px_54px_-22px_rgba(45,18,12,0.52)] ${
                  isCenter ? 'border-white ring-1 ring-amber-400/50' : 'border-white/75'
                }`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/venues/${v.id}.webp`}
                    alt={`Sảnh cưới 3D ${v.nameVi} — ${v.place}`}
                    width={640}
                    height={400}
                    draggable={false}
                    loading={isCenter ? 'eager' : 'lazy'}
                    fetchPriority={isCenter ? 'high' : undefined}
                    decoding="async"
                    className={`h-full w-full object-cover transition duration-500 ${
                      isCenter ? 'group-hover:scale-105' : 'brightness-90 saturate-90'
                    }`}
                  />
                  {isCenter && (
                    <span className="absolute right-2.5 top-2.5 rounded-full bg-slate-950/75 px-3 py-1 text-[10.5px] font-bold text-amber-100 backdrop-blur-sm">
                      Vào xem 3D →
                    </span>
                  )}
                </div>
              </Link>

              {/* Soft gallery floor reflection underneath active/adjacent plates */}
              <div
                aria-hidden="true"
                className="pointer-events-none mt-1.5 hidden h-8 w-full overflow-hidden rounded-b-xl opacity-30 sm:block"
                style={{
                  WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.48), transparent 85%)',
                  maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.48), transparent 85%)',
                }}
              >
                <div
                  className="h-full w-full -scale-y-100 bg-cover bg-center blur-[1.5px]"
                  style={{ backgroundImage: `url(/venues/${v.id}.webp)` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Word-by-word kinetic venue title & subtitle (Monolith style) */}
      <div key={active.id} className="mt-2 text-center">
        {React.createElement(
          headingTag,
          { className: 'flex flex-wrap items-center justify-center gap-x-2 font-serif text-2xl font-bold text-slate-900 sm:text-4xl' },
          titleWords.map((word, wi) => (
            <span
              key={`${active.id}-${wi}`}
              className="inline-block animate-[inv-rise_420ms_cubic-bezier(0.16,1,0.36,1)_both] motion-reduce:animate-none"
              style={{ animationDelay: `${wi * 45}ms` }}
            >
              {word}
            </span>
          )),
        )}
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-rose-700/85">
          {active.place}
        </p>
        <p className="mx-auto mt-1.5 max-w-xl text-xs leading-relaxed text-slate-600 sm:text-sm">
          {active.descriptionVi}
        </p>
      </div>

      {/* Bottom Controls with Circular SVG Autoplay Progress Ring around Next Button */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Không gian trước"
          onClick={() => step(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-900/20 bg-white/90 text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1.5">
            {shown.map((v, i) => (
              <button
                key={v.id}
                type="button"
                aria-label={v.nameVi}
                onClick={() => {
                  setActiveIdx(i);
                  setProgress(0);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIdx ? 'w-7 bg-rose-700' : 'w-2.5 bg-amber-900/25 hover:bg-amber-900/50'
                }`}
              />
            ))}
          </div>
          <span className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-slate-400">
            KÉO · CHẠM · MŨI TÊN
          </span>
        </div>

        <button
          type="button"
          aria-label="Không gian tiếp theo"
          onClick={() => step(1)}
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-700"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 40 40"
            className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
          >
            <circle cx="20" cy="20" r={ringR} fill="none" stroke="rgba(120,53,15,0.16)" strokeWidth="1.8" />
            <circle
              cx="20"
              cy="20"
              r={ringR}
              fill="none"
              stroke="#be123c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={ringC}
              strokeDashoffset={ringC * (1 - progress)}
            />
          </svg>
          <ChevronRight className="relative z-[1] h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export interface CharacterWaveItem {
  id: string;
  label?: string;
}

/**
 * Gói 4 — Upgraded with Atlas spotlight effect:
 * Flanking character cards stay subtly monochrome/quiet while the active/hovered character
 * pops forward in full vivid color with an arched wave lift.
 */
export function CharacterWaveCarousel({
  people,
  selectedId,
  onSelect,
}: {
  people: readonly CharacterWaveItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <div className="relative" data-atlas-carousel="true">
      <div
        ref={railRef}
        onMouseLeave={() => setHoverIdx(null)}
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2.5 pt-2.5 [scrollbar-width:thin]"
      >
        {people.map((p, idx) => {
          const isSelected = p.id === selectedId;
          const isHovered = hoverIdx === idx;
          const dist = hoverIdx === null ? 99 : Math.abs(hoverIdx - idx);
          const waveY = isSelected ? -6 : dist === 0 ? -6 : dist === 1 ? -3 : 0;
          const waveScale = isSelected ? 1.07 : dist === 0 ? 1.06 : dist === 1 ? 1.02 : 0.96;
          const inSpotlight = isSelected || isHovered;

          return (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setHoverIdx(idx)}
              onClick={() => onSelect(p.id)}
              style={{
                transform: `translateY(${waveY}px) scale(${waveScale})`,
              }}
              className={`w-[78px] shrink-0 overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-white to-[#f6ece6] text-left transition-all duration-300 ${
                isSelected
                  ? 'border-rose-600 shadow-[0_12px_24px_-10px_rgba(190,18,60,0.55)] ring-2 ring-rose-200'
                  : 'border-transparent hover:border-rose-200'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/assets/people/${p.id}.webp`}
                alt={p.label ? `Nhân vật 3D ${p.label}` : 'Nhân vật 3D khách mời'}
                width={160}
                height={160}
                loading={idx < 4 ? 'eager' : 'lazy'}
                decoding="async"
                className={`aspect-square w-full object-cover object-top transition-all duration-300 ${
                  inSpotlight ? 'grayscale-0 brightness-100 saturate-110' : 'grayscale-[75%] opacity-80'
                }`}
              />
              <span
                className={`block truncate px-1 py-1 text-center text-[10px] font-semibold transition-colors ${
                  isSelected ? 'bg-rose-700 text-white' : 'text-slate-700'
                }`}
              >
                {p.label ?? p.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

'use client';

/**
 * Adapted from ThreeUI Community `gallery`, `gallery-heading`, and `character-carousel`
 * (MengTo/threeui, MIT).
 * Provides:
 * - OrbitalVenueGallery: Curved 3D cylindrical editorial ribbon showcasing featured 3D wedding venues.
 * - CharacterWaveCarousel: Interactive wave/filmstrip card selector for the 51 Rocketbox avatars.
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import type { VenueTheme } from '@dco/shared';

export function OrbitalVenueGallery({
  venues,
  heading = 'Dạo Vòng Không Gian Cưới 3D',
}: {
  venues: VenueTheme[];
  heading?: string;
}) {
  const shown = venues.slice(0, 10);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || shown.length <= 1) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      setActiveIdx((i) => (i + 1) % shown.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [paused, shown.length]);

  if (!shown.length) return null;
  const active = shown[activeIdx % shown.length];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative overflow-hidden rounded-[2rem] border border-amber-200/80 bg-gradient-to-b from-[#fffdf8] via-[#fdf5e6] to-[#faeede] px-4 py-8 shadow-sm sm:px-8 sm:py-10"
    >
      {/* Editorial Orbital Heading */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-rose-700">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> {heading}
          </span>
          <h3 className="mt-1 font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
            {active.nameVi}{' '}
            <span className="text-base font-normal text-slate-500">· {active.place}</span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Không gian trước"
            onClick={() => setActiveIdx((i) => (i - 1 + shown.length) % shown.length)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-white text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Không gian tiếp theo"
            onClick={() => setActiveIdx((i) => (i + 1) % shown.length)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-white text-slate-700 shadow-sm transition hover:bg-rose-50 hover:text-rose-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3D Curved Orbital Ribbon */}
      <div className="relative mt-6 flex h-[250px] items-center justify-center overflow-hidden sm:h-[290px] [perspective:1200px]">
        {shown.map((v, idx) => {
          let offset = idx - activeIdx;
          if (offset > shown.length / 2) offset -= shown.length;
          if (offset < -shown.length / 2) offset += shown.length;
          const abs = Math.abs(offset);
          if (abs > 3) return null;

          const tx = offset * 210;
          const tz = -abs * 110;
          const ry = -offset * 22;
          const scale = Math.max(0.72, 1 - abs * 0.11);
          const opacity = Math.max(0.22, 1 - abs * 0.28);

          return (
            <Link
              key={v.id}
              href={`/khong-gian/${v.id}`}
              onClick={(e) => {
                if (idx !== activeIdx) {
                  e.preventDefault();
                  setActiveIdx(idx);
                }
              }}
              style={{
                transform: `translate3d(${tx}px, 0, ${tz}px) rotateY(${ry}deg) scale(${scale})`,
                opacity,
                zIndex: 20 - abs,
              }}
              className="group absolute w-[260px] overflow-hidden rounded-2xl border-2 border-white bg-white shadow-[0_24px_48px_-20px_rgba(60,20,20,0.45)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[320px]"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/venues/${v.id}.webp`}
                  alt={v.nameVi}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute right-2.5 top-2.5 rounded-full bg-slate-950/70 px-2.5 py-0.5 text-[10px] font-bold text-amber-100 backdrop-blur-sm">
                  Xem 3D →
                </span>
              </div>
              <div className="px-3.5 py-2.5">
                <p className="truncate font-serif text-base font-bold text-slate-900">{v.nameVi}</p>
                <p className="truncate text-[11px] text-slate-500">{v.place}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Ribbon Dots */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {shown.map((v, i) => (
          <button
            key={v.id}
            type="button"
            aria-label={v.nameVi}
            onClick={() => setActiveIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIdx ? 'w-7 bg-rose-700' : 'w-2 bg-amber-900/25 hover:bg-amber-900/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export interface CharacterWaveItem {
  id: string;
  label?: string;
}

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
    <div className="relative">
      <div
        ref={railRef}
        onMouseLeave={() => setHoverIdx(null)}
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 pt-2 [scrollbar-width:thin]"
      >
        {people.map((p, idx) => {
          const isSelected = p.id === selectedId;
          const dist = hoverIdx === null ? 99 : Math.abs(hoverIdx - idx);
          const waveY = dist === 0 ? -6 : dist === 1 ? -3 : 0;
          const waveScale = dist === 0 ? 1.07 : dist === 1 ? 1.02 : 1;

          return (
            <button
              key={p.id}
              type="button"
              onMouseEnter={() => setHoverIdx(idx)}
              onClick={() => onSelect(p.id)}
              style={{
                transform: `translateY(${waveY}px) scale(${waveScale})`,
              }}
              className={`w-[76px] shrink-0 overflow-hidden rounded-2xl border-2 bg-gradient-to-b from-white to-[#f6ece6] text-left transition-all duration-200 ${
                isSelected
                  ? 'border-rose-600 shadow-md ring-2 ring-rose-200'
                  : 'border-transparent hover:border-rose-200'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/assets/people/${p.id}.webp`}
                alt={p.label ?? p.id}
                loading="lazy"
                className="aspect-square w-full object-cover object-top"
              />
              <span className="block truncate px-1 py-1 text-center text-[10px] font-semibold text-slate-700">
                {p.label ?? p.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

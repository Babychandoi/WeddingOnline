'use client';

/**
 * Adapted from ThreeUI Community `article-headings`, `cloth-study`, and `ripple-study`
 * (MengTo/threeui, MIT).
 * Editorial wedding typography block with flowing golden silk shimmer sweep and soft hover ripple.
 */

import React from 'react';
import { WeddingHeroAtmosphere, type WeddingAtmosphereMood } from './WeddingHeroAtmosphere';

export interface SilkCoupleHeadingProps {
  badge?: string;
  title: string;
  subtitle?: string;
  mood?: WeddingAtmosphereMood;
  tone?: 'light' | 'crimson';
  children?: React.ReactNode;
  className?: string;
}

export function SilkCoupleHeading({
  badge,
  title,
  subtitle,
  mood = 'silk',
  tone = 'crimson',
  children,
  className = '',
}: SilkCoupleHeadingProps) {
  const isCrimson = tone === 'crimson';
  return (
    <header
      className={`relative overflow-hidden ${
        isCrimson
          ? 'border-b border-amber-300/60 bg-gradient-to-br from-[#6b0f2a] via-[#9f1239] to-[#78350f] text-white'
          : 'border-b border-amber-200/80 bg-gradient-to-b from-[#fffdf8] to-[#fdf3e3] text-slate-900'
      } ${className}`}
    >
      <WeddingHeroAtmosphere mood={mood} tone={tone} />
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-14 text-center sm:py-16">
        {badge && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm ${
              isCrimson
                ? 'border border-amber-200/40 bg-white/15 text-amber-100'
                : 'border border-amber-300 bg-white/80 text-rose-800'
            }`}
          >
            {badge}
          </span>
        )}
        <h1
          className={`mt-4 font-serif text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl ${
            isCrimson
              ? 'bg-gradient-to-r from-amber-100 via-white to-amber-200 bg-clip-text text-transparent'
              : 'text-rose-950'
          }`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={`mx-auto mt-3 max-w-xl text-sm ${isCrimson ? 'text-rose-100/90' : 'text-slate-600'}`}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </header>
  );
}

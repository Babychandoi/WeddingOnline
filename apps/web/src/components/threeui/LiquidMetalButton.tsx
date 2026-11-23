'use client';

/**
 * Adapted from ThreeUI Community `liquid-metal-button`, `spark-badge`, and `animated-top-dock`
 * (MengTo/threeui, MIT).
 * Provides:
 * - LiquidMetalButton: Pointer-following molten gold/crimson specular sheen + press ripple.
 * - SparkBadgePill: Warm ember-shimmer badge.
 * - WeddingTopDock: Proximity-spring magnetic header navigation bar.
 */

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export interface LiquidMetalButtonProps {
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'crimson' | 'gold';
  className?: string;
  children: React.ReactNode;
}

export function LiquidMetalButton({
  href,
  onClick,
  disabled,
  variant = 'crimson',
  className = '',
  children,
}: LiquidMetalButtonProps) {
  const [pos, setPos] = useState({ x: 50, y: 50, hover: false });
  const [ripple, setRipple] = useState(0);

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPos({
      x: ((e.clientX - r.left) / Math.max(1, r.width)) * 100,
      y: ((e.clientY - r.top) / Math.max(1, r.height)) * 100,
      hover: true,
    });
  };

  const baseClasses =
    variant === 'crimson'
      ? 'bg-gradient-to-r from-[#9f1239] via-[#be123c] to-[#881337] text-amber-50 border-amber-300/60 shadow-[0_14px_30px_-12px_rgba(159,18,57,0.75)]'
      : 'bg-gradient-to-r from-[#fff8e7] via-[#fde7b2] to-[#fff8e7] text-rose-950 border-amber-400/80 shadow-[0_12px_26px_-14px_rgba(180,83,9,0.5)]';

  const inner = (
    <>
      {/* Liquid metal specular highlight */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
        style={{
          opacity: pos.hover ? 1 : 0.35,
          background: `radial-gradient(circle 110px at ${pos.x}% ${pos.y}%, rgba(255,250,235,0.52), rgba(251,191,36,0.18) 42%, transparent 72%)`,
        }}
      />
      {/* Prismatic metallic rim shimmer */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/35"
      />
      {ripple > 0 && (
        <span
          key={ripple}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 animate-ping rounded-[inherit] bg-amber-200/20 [animation-duration:420ms] [animation-iteration-count:1]"
        />
      )}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </>
  );

  const shared = `relative inline-flex items-center justify-center overflow-hidden rounded-2xl border px-6 py-3.5 text-sm font-bold transition-transform duration-200 active:scale-[0.98] disabled:opacity-60 ${baseClasses} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        onPointerMove={onMove}
        onPointerLeave={() => setPos((p) => ({ ...p, hover: false }))}
        onPointerDown={() => setRipple((n) => n + 1)}
        className={shared}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onPointerMove={onMove}
      onPointerLeave={() => setPos((p) => ({ ...p, hover: false }))}
      onPointerDown={() => setRipple((n) => n + 1)}
      className={shared}
    >
      {inner}
    </button>
  );
}

export function SparkBadgePill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-50 via-white to-rose-50 px-3.5 py-1 text-[11px] font-bold tracking-wide text-rose-800 shadow-sm ${className}`}
    >
      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
      <span>{children}</span>
    </span>
  );
}

export interface DockNavItem {
  label: string;
  href: string;
  external?: boolean;
}

export function WeddingTopDock({ items }: { items: DockNavItem[] }) {
  const navRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);

  return (
    <div
      ref={navRef}
      onPointerMove={(e) => setMouseX(e.clientX)}
      onPointerLeave={() => setMouseX(null)}
      className="hidden items-center gap-1 rounded-full border border-amber-200/80 bg-white/85 px-2 py-1 shadow-sm backdrop-blur-md md:flex"
    >
      {items.map((item) => (
        <DockLink key={item.href} item={item} mouseX={mouseX} />
      ))}
    </div>
  );
}

function DockLink({ item, mouseX }: { item: DockNavItem; mouseX: number | null }) {
  const elRef = useRef<HTMLAnchorElement>(null);
  let lift = 0;
  let scale = 1;

  if (mouseX !== null && elRef.current) {
    const r = elRef.current.getBoundingClientRect();
    const dist = Math.abs(mouseX - (r.left + r.width / 2));
    const proximity = 120;
    if (dist < proximity) {
      const k = Math.cos(((dist / proximity) * Math.PI) / 2);
      scale = 1 + k * 0.08;
      lift = k * 2.5;
    }
  }

  const cls =
    'inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-[color,background-color] hover:bg-rose-50/90 hover:text-rose-700';

  const style: React.CSSProperties = {
    transform: `translateY(${-lift}px) scale(${scale})`,
    transition: mouseX === null ? 'transform 260ms cubic-bezier(0.22,1,0.36,1)' : 'transform 90ms ease-out',
  };

  if (item.href.startsWith('#')) {
    return (
      <a ref={elRef} href={item.href} className={cls} style={style}>
        {item.label}
      </a>
    );
  }
  return (
    <Link ref={elRef} href={item.href} className={cls} style={style}>
      {item.label}
    </Link>
  );
}

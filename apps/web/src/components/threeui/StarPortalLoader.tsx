'use client';

/**
 * Adapted from ThreeUI Community `star-portal`, `portal-field`, and `uplink-loader`
 * (MengTo/threeui, MIT).
 * Fullscreen Canvas 2D warm gold & rose star-portal transition overlay shown while
 * connecting and streaming a 3D wedding hall — uses ZERO WebGL contexts so it never
 * competes with the Three.js <Canvas> initializing underneath, and unmounts once ready.
 */

import React, { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';

export interface StarPortalLoaderProps {
  title?: string;
  subtitle?: string;
  active?: boolean;
  fullscreen?: boolean;
}

export function StarPortalLoader({
  title = 'Đang Mở Cổng Sảnh Cưới 3D',
  subtitle = 'Đang chuẩn bị không gian, ánh sáng và khách mời…',
  active = true,
  fullscreen = true,
}: StarPortalLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const stars = Array.from({ length: 110 }, (_, i) => ({
      angle: ((i * 137.508) % 360) * (Math.PI / 180),
      depth: (i / 110) * 1,
      speed: 0.0045 + (i % 7) * 0.0009,
      hue: i % 3 === 0 ? '#fde68a' : i % 3 === 1 ? '#fda4af' : '#fffbeb',
    }));

    const draw = (ms: number) => {
      const t = ms * 0.001;
      ctx.clearRect(0, 0, w, h);

      // Deep velvet plum/crimson portal backdrop
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 16, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      bg.addColorStop(0, '#4c0519');
      bg.addColorStop(0.5, '#1f0816');
      bg.addColorStop(1, '#0c040b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;
      const maxR = Math.hypot(cx, cy);

      // Pulsing golden portal rings
      for (let ring = 0; ring < 4; ring++) {
        const phase = ((t * 0.45 + ring * 0.25) % 1);
        const r = 36 + phase * Math.min(w, h) * 0.42;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(253, 224, 71, ${(1 - phase) * 0.34})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Star warp streaks streaming outward from portal center
      for (const s of stars) {
        if (!reduce) {
          s.depth += s.speed;
          if (s.depth >= 1) s.depth = 0.02;
        }
        const r0 = s.depth * s.depth * maxR;
        const r1 = Math.min(maxR, r0 + 10 + s.depth * 32);
        const x0 = cx + Math.cos(s.angle) * r0;
        const y0 = cy + Math.sin(s.angle) * r0;
        const x1 = cx + Math.cos(s.angle) * r1;
        const y1 = cy + Math.sin(s.angle) * r1;

        ctx.strokeStyle = s.hue;
        ctx.globalAlpha = Math.min(0.95, s.depth * 1.15);
        ctx.lineWidth = 0.8 + s.depth * 1.6;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${
        fullscreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-30'
      } flex flex-col items-center justify-center overflow-hidden bg-[#160510] px-6 text-center text-amber-50`}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="relative z-10 flex max-w-md flex-col items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/60 bg-rose-900/75 font-serif text-2xl font-bold text-amber-200 shadow-[0_0_40px_rgba(251,191,36,0.35)] backdrop-blur-md">
          囍
        </div>
        <h2 className="mt-5 font-serif text-2xl font-bold tracking-tight text-amber-50 sm:text-3xl">{title}</h2>
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-200/85 sm:text-sm">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-300" />
          {subtitle}
        </p>
        <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-amber-300 via-rose-400 to-amber-200" />
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Adapted from ThreeUI Community `engraved-certificate` (MengTo/threeui, MIT).
 * Renders a Canvas 2D guilloché lathe-engraved luxury wedding certificate with dual harmonic
 * rosettes, drifting champagne-gold specular sheen, and interactive 3D pointer/touch tilt.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';

export interface EngravedWeddingCertificateProps {
  groomName: string;
  brideName: string;
  weddingDate: string;
  subtitle?: string;
  venueLabel?: string;
  serialCode?: string;
  compact?: boolean;
  className?: string;
}

export function EngravedWeddingCertificate({
  groomName,
  brideName,
  weddingDate,
  subtitle = 'Chứng Nhận Hạnh Phúc Trăm Năm',
  venueLabel = 'DamCuoiOnline.vn · Kỷ Niệm Vĩnh Viễn',
  serialCode,
  compact = false,
  className = '',
}: EngravedWeddingCertificateProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 40, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let visible = true;
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const drawRosette = (cx: number, cy: number, radius: number, phase: number, lobes: number, alpha: number) => {
      ctx.beginPath();
      const steps = 220;
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const r =
          radius *
          (0.76 + 0.14 * Math.sin(a * lobes + phase) + 0.08 * Math.cos(a * (lobes * 2 - 1) - phase * 0.7));
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
      ctx.lineWidth = 0.85;
      ctx.stroke();
    };

    const drawFrame = (ms: number) => {
      if (visible) {
        const t = reduce ? 0.6 : ms * 0.00045;
        ctx.clearRect(0, 0, w, h);

        // Warm parchment & subtle metallic radial undertone
        const bg = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.5, Math.max(w, h) * 0.75);
        bg.addColorStop(0, '#fffdf7');
        bg.addColorStop(0.65, '#f9f1df');
        bg.addColorStop(1, '#efe1c1');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Engraved guilloché horizontal wave plate field
        const rows = 16;
        for (let row = 0; row < rows; row++) {
          const yBase = ((row + 0.5) / rows) * h;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 10) {
            const nx = x / w;
            const wave =
              Math.sin(nx * Math.PI * 6 + t + row * 0.42) * 3.8 +
              Math.cos(nx * Math.PI * 12 - t * 0.8 + row * 0.7) * 1.9;
            if (x === 0) ctx.moveTo(x, yBase + wave);
            else ctx.lineTo(x, yBase + wave);
          }
          ctx.strokeStyle = row % 2 === 0 ? 'rgba(180, 134, 42, 0.13)' : 'rgba(136, 19, 55, 0.075)';
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }

        // Dual guilloché rosettes (left & right corners / background medallion)
        const minSide = Math.min(w, h);
        drawRosette(w * 0.16, h * 0.5, minSide * 0.42, t * 0.9, 12, 0.24);
        drawRosette(w * 0.16, h * 0.5, minSide * 0.3, -t * 0.6, 8, 0.18);
        drawRosette(w * 0.84, h * 0.5, minSide * 0.42, -t * 0.9, 12, 0.24);
        drawRosette(w * 0.84, h * 0.5, minSide * 0.3, t * 0.6, 8, 0.18);
        drawRosette(w * 0.5, h * 0.5, minSide * 0.54, t * 0.4, 16, 0.14);

        // Engraved double gold filigree border
        const pad = 11;
        ctx.strokeStyle = 'rgba(180, 134, 42, 0.55)';
        ctx.lineWidth = 1.25;
        ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
        ctx.strokeStyle = 'rgba(136, 19, 55, 0.32)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(pad + 5, pad + 5, w - (pad + 5) * 2, h - (pad + 5) * 2);
      }

      if (!reduce) raf = requestAnimationFrame(drawFrame);
    };

    raf = requestAnimationFrame(drawFrame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    setTilt({
      rx: (0.5 - py) * 11,
      ry: (px - 0.5) * 13,
      gx: px * 100,
      gy: py * 100,
      active: true,
    });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 40, active: false });
  const formattedDate = (() => {
    const d = new Date(weddingDate);
    return Number.isNaN(d.getTime()) ? weddingDate : d.toLocaleDateString('vi-VN');
  })();
  const certCode = serialCode || `DCO-${groomName.slice(0, 1).toUpperCase()}${brideName.slice(0, 1).toUpperCase()}-${new Date(weddingDate).getFullYear() || 2026}`;

  return (
    <div
      className={`mx-auto w-full select-none [perspective:1100px] ${compact ? 'max-w-[460px]' : 'max-w-[580px]'} ${className}`}
    >
      <div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
        onPointerUp={resetTilt}
        style={{
          transform: `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`,
          transition: tilt.active ? 'transform 80ms ease-out' : 'transform 500ms cubic-bezier(0.22,1,0.36,1)',
        }}
        className="relative overflow-hidden rounded-2xl border border-amber-400/70 bg-[#fbf4e3] shadow-[0_24px_60px_-24px_rgba(120,53,15,0.48),inset_0_1px_0_rgba(255,255,255,0.9)] will-change-transform"
      >
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />

        {/* Dynamic metallic foil reflection following pointer */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: tilt.active ? 0.9 : 0.45,
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255,250,230,0.68) 0%, rgba(212,175,55,0.16) 28%, rgba(136,19,55,0.03) 62%, transparent 80%)`,
            mixBlendMode: 'overlay',
          }}
        />

        <div className={`relative z-10 text-center ${compact ? 'px-6 py-7' : 'px-7 py-9 sm:px-10 sm:py-11'}`}>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-amber-900 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-amber-600" />
            {subtitle}
          </div>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-900/70">
            Trân Trọng Ghi Dấu Ngày Chung Đôi
          </p>

          <h3
            className={`mt-2 bg-gradient-to-r from-rose-900 via-amber-700 to-rose-900 bg-clip-text font-serif font-bold leading-tight text-transparent ${
              compact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'
            }`}
          >
            {groomName} <span className="font-normal text-amber-600">&amp;</span> {brideName}
          </h3>

          <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-xs font-semibold text-amber-950/80">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-amber-500/70" />
            <span className="tabular-nums tracking-[0.2em]">{formattedDate}</span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-amber-500/70" />
          </div>

          {/* Wax-seal Song Hỷ medallion */}
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-amber-500/25 pt-4 text-[10px] font-semibold text-amber-900/75">
            <span className="truncate uppercase tracking-[0.16em]">{venueLabel}</span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden font-mono text-[10px] tracking-wider text-amber-800/70 sm:inline">{certCode}</span>
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-gradient-to-br from-rose-700 via-rose-800 to-amber-900 font-serif text-sm font-bold text-amber-200 shadow-md"
              >
                囍
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Di chuột hoặc chạm nhẹ để nghiêng tấm chứng nhận khắc ánh kim 3D
      </p>
    </div>
  );
}

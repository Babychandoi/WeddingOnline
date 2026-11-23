'use client';

/**
 * Adapted from ThreeUI Community `constellation-field`, `woven-cloth`, and `koi-studies`
 * (MengTo/threeui, MIT).
 * Pure Canvas 2D warm-wedding atmosphere (constellation gold threads, flowing silk waves,
 * or serene swimming Koi silhouettes) — zero extra WebGL contexts, auto-pauses offscreen.
 */

import React, { useEffect, useRef } from 'react';

export type WeddingAtmosphereMood = 'constellation' | 'silk' | 'koi';

export interface WeddingHeroAtmosphereProps {
  mood?: WeddingAtmosphereMood;
  tone?: 'light' | 'crimson';
  className?: string;
}

export function WeddingHeroAtmosphere({
  mood = 'constellation',
  tone = 'light',
  className = '',
}: WeddingHeroAtmosphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.02 }
    );
    io.observe(canvas);

    // Pre-seed deterministic star/petal nodes
    const nodes = Array.from({ length: 38 }, (_, i) => ({
      x: ((i * 97.3) % 100) / 100,
      y: ((i * 61.7) % 100) / 100,
      vx: (((i * 23) % 11) - 5) * 0.000035,
      vy: (((i * 19) % 11) - 5) * 0.000028,
      r: 1.4 + (i % 4) * 0.65,
      phase: i * 0.7,
    }));

    const kois = Array.from({ length: 4 }, (_, i) => ({
      cx: 0.2 + i * 0.22,
      cy: 0.25 + (i % 2) * 0.42,
      rx: 0.14 + (i % 3) * 0.05,
      ry: 0.1 + (i % 2) * 0.06,
      speed: 0.00032 + i * 0.00006,
      phase: i * 1.7,
      color: i % 2 === 0 ? '#e11d48' : '#d97706',
    }));

    const draw = (ms: number) => {
      if (visible) {
        const t = reduce ? 1.2 : ms * 0.001;
        ctx.clearRect(0, 0, w, h);

        // 1. Woven silk wave ribbons (shown in silk & subtly in constellation)
        const ribbons = mood === 'silk' ? 7 : 3;
        for (let r = 0; r < ribbons; r++) {
          ctx.beginPath();
          const yMid = h * (0.18 + (r / Math.max(1, ribbons)) * 0.68);
          for (let x = 0; x <= w; x += 18) {
            const nx = x / w;
            const y =
              yMid +
              Math.sin(nx * Math.PI * 2.5 + t * 0.75 + r * 0.9) * (16 + r * 3) +
              Math.cos(nx * Math.PI * 5 - t * 0.55 + r) * 7;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle =
            tone === 'crimson'
              ? r % 2 === 0
                ? 'rgba(253, 224, 71, 0.22)'
                : 'rgba(255, 241, 242, 0.14)'
              : r % 2 === 0
                ? 'rgba(212, 175, 55, 0.20)'
                : 'rgba(190, 18, 60, 0.10)';
          ctx.lineWidth = mood === 'silk' ? 1.8 : 1.1;
          ctx.stroke();
        }

        // 2. Constellation threads & shimmering champagne dust
        if (mood === 'constellation' || mood === 'silk') {
          const pts = nodes.map((n) => {
            const x = (((n.x + (reduce ? 0 : n.vx * ms)) % 1) + 1) % 1;
            const y = (((n.y + (reduce ? 0 : n.vy * ms)) % 1) + 1) % 1;
            return { px: x * w, py: y * h, r: n.r, phase: n.phase };
          });

          if (mood === 'constellation') {
            for (let i = 0; i < pts.length; i++) {
              for (let j = i + 1; j < pts.length; j++) {
                const d = Math.hypot(pts[i].px - pts[j].px, pts[i].py - pts[j].py);
                if (d < 135) {
                  const a = (1 - d / 135) * (tone === 'crimson' ? 0.25 : 0.18);
                  ctx.strokeStyle =
                    tone === 'crimson' ? `rgba(253, 230, 138, ${a})` : `rgba(212, 175, 55, ${a})`;
                  ctx.lineWidth = 0.8;
                  ctx.beginPath();
                  ctx.moveTo(pts[i].px, pts[i].py);
                  ctx.lineTo(pts[j].px, pts[j].py);
                  ctx.stroke();
                }
              }
            }
          }

          for (const p of pts) {
            const pulse = 0.55 + 0.45 * Math.sin(t * 2 + p.phase);
            ctx.fillStyle =
              tone === 'crimson'
                ? `rgba(254, 243, 199, ${0.35 + pulse * 0.45})`
                : `rgba(190, 18, 60, ${0.14 + pulse * 0.2})`;
            ctx.beginPath();
            ctx.arc(p.px, p.py, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 3. Serene Koi water ripples & curved silhouettes
        if (mood === 'koi') {
          for (const k of kois) {
            const ang = (reduce ? 0 : ms * k.speed) + k.phase;
            const x = (k.cx + Math.cos(ang) * k.rx) * w;
            const y = (k.cy + Math.sin(ang * 1.2) * k.ry) * h;
            const heading = Math.atan2(
              Math.cos(ang * 1.2) * k.ry * 1.2 * h,
              -Math.sin(ang) * k.rx * w
            );

            // Soft concentric water ripple
            const rippleR = 16 + ((ms * 0.02 + k.phase * 15) % 44);
            ctx.strokeStyle =
              tone === 'crimson'
                ? `rgba(253, 230, 138, ${Math.max(0, 0.25 - rippleR / 220)})`
                : `rgba(212, 175, 55, ${Math.max(0, 0.24 - rippleR / 220)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, rippleR, 0, Math.PI * 2);
            ctx.stroke();

            // Articulated 5-segment Koi body
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(heading);
            for (let seg = 0; seg < 6; seg++) {
              const sx = -seg * 6.5;
              const sy = Math.sin(t * 5.2 - seg * 0.7 + k.phase) * (seg * 1.15);
              const sr = Math.max(1.8, 7.2 - seg * 0.95);
              ctx.fillStyle = k.color;
              ctx.globalAlpha = tone === 'crimson' ? 0.34 - seg * 0.035 : 0.22 - seg * 0.025;
              ctx.beginPath();
              ctx.ellipse(sx, sy, sr * 1.35, sr * 0.85, 0, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }
      }

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [mood, tone]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}

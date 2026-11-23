'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Calendar, CheckCircle2, Gift, Images, MessageCircleHeart, Sparkles } from 'lucide-react';
import type { OrnamentKind } from '@/components/invitation/themes';

/* ───────────────────────── Color Helpers ───────────────────────── */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function parseHexColor(input: string, fallback: Rgb = { r: 212, g: 175, b: 55 }): Rgb {
  const clean = input.trim().replace('#', '');
  if (/^[0-9a-f]{3}$/i.test(clean)) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/i.test(clean)) {
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  }
  return fallback;
}

function rgba(c: Rgb, a: number): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.max(0, Math.min(1, a))})`;
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

export type AmbientMood = 'traditional-koi' | 'coastal-waves' | 'luxury-constellation' | 'botanical-silk';

export function resolveInvitationMood(ornament: OrnamentKind): AmbientMood {
  switch (ornament) {
    case 'song-hy':
    case 'clouds':
    case 'lotus':
      return 'traditional-koi';
    case 'waves':
      return 'coastal-waves';
    case 'baroque':
    case 'masthead':
    case 'hairline':
      return 'luxury-constellation';
    default:
      return 'botanical-silk';
  }
}

/* ───────────────────────── 1. Theme-Adaptive Ambient Canvas ───────────────────────── */

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
}

interface StarNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
}

interface KoiSwimmer {
  side: -1 | 1;
  baseX: number;
  baseY: number;
  phase: number;
  speed: number;
  scale: number;
  warm: boolean;
}

export interface InvitationAmbientCanvasProps {
  ornament: OrnamentKind;
  ground: string;
  accent: string;
  line: string;
  dark: boolean;
}

/**
 * ThreeUI-adapted living atmosphere behind the 560px wedding invitation card.
 * Pure Canvas 2D (0 WebGL contexts) automatically tuned to each of the 100 templates:
 * - traditional-koi (woven-cloth + koi-studies)
 * - coastal-waves (elemental-water + ripple-study)
 * - luxury-constellation (constellation-field)
 * - botanical-silk (woven-cloth + semantic-bloom)
 */
export function InvitationAmbientCanvas({ ornament, ground, accent, line, dark }: InvitationAmbientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mood = resolveInvitationMood(ornament);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const accentRgb = parseHexColor(accent, { r: 196, g: 58, b: 84 });
    const lineRgb = parseHexColor(line, { r: 214, g: 180, b: 108 });
    const groundRgb = parseHexColor(ground, { r: 245, g: 240, b: 232 });
    const highlightRgb = dark
      ? mixRgb(lineRgb, { r: 255, g: 245, b: 218 }, 0.48)
      : mixRgb(accentRgb, lineRgb, 0.45);
    const ribbonRgb = dark
      ? mixRgb(accentRgb, lineRgb, 0.55)
      : mixRgb(accentRgb, groundRgb, 0.28);

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const pointer = { x: width * 0.5, y: height * 0.4, active: false };
    const ripples: Ripple[] = [];
    let lastRippleAt = 0;

    const addRipple = (x: number, y: number, maxR = 135) => {
      ripples.push({ x, y, r: 8, maxR, alpha: dark ? 0.34 : 0.24 });
      if (ripples.length > 10) ripples.shift();
    };

    const onPointerMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      const now = performance.now();
      if ((mood === 'coastal-waves' || mood === 'traditional-koi') && now - lastRippleAt > 260) {
        lastRippleAt = now;
        addRipple(e.clientX, e.clientY, mood === 'coastal-waves' ? 155 : 110);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (mood === 'coastal-waves' || mood === 'traditional-koi') {
        addRipple(e.clientX, e.clientY, 175);
      }
    };
    const onPointerLeave = () => {
      pointer.active = false;
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });

    // Deterministic seeds per mood
    const stars: StarNode[] = Array.from({ length: 38 }, (_, i) => {
      const sideBias = i % 3 === 0 ? 0.14 : i % 3 === 1 ? 0.86 : ((i * 37) % 100) / 100;
      return {
        x: (sideBias + (((i * 19) % 17) - 8) * 0.015) * width,
        y: (((i * 53 + 11) % 94) / 100 + 0.03) * height,
        vx: (i % 2 === 0 ? 1 : -1) * (0.09 + (i % 5) * 0.03),
        vy: -0.06 - (i % 4) * 0.025,
        size: 1.2 + (i % 4) * 0.65,
        phase: i * 0.72,
      };
    });

    const kois: KoiSwimmer[] = [
      { side: -1, baseX: 0.12, baseY: 0.28, phase: 0.2, speed: 0.42, scale: 1.0, warm: true },
      { side: 1, baseX: 0.88, baseY: 0.62, phase: 2.1, speed: 0.36, scale: 0.92, warm: false },
      { side: -1, baseX: 0.15, baseY: 0.76, phase: 4.1, speed: 0.32, scale: 0.78, warm: false },
    ];

    const drawSilkRibbons = (t: number, count: number, opacity: number) => {
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        const baseY = height * (0.16 + i * (0.72 / Math.max(1, count - 1)));
        const amp = 24 + i * 7;
        const freq = 0.0028 + i * 0.0005;
        for (let x = -20; x <= width + 20; x += 28) {
          const ptrPull = pointer.active
            ? Math.exp(-Math.hypot(x - pointer.x, baseY - pointer.y) / 260) * 14
            : 0;
          const y =
            baseY +
            Math.sin(x * freq + t * (0.55 + i * 0.12) + i * 1.4) * amp +
            Math.cos(x * freq * 0.6 - t * 0.35) * (amp * 0.4) +
            ptrPull;
          if (x === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(i % 2 === 0 ? highlightRgb : ribbonRgb, opacity * (1 - i * 0.1));
        ctx.lineWidth = 1.25 + (i % 2) * 0.6;
        ctx.stroke();
      }
    };

    const drawKoi = (k: KoiSwimmer, t: number) => {
      if (width < 660) return; // keep side Koi framing desktop margins without crowding small phones
      const cx = k.baseX * width + Math.sin(t * k.speed + k.phase) * 38;
      const cy = k.baseY * height + Math.cos(t * k.speed * 0.82 + k.phase) * 56;
      const dx = Math.cos(t * k.speed + k.phase) * 38 * k.speed;
      const dy = -Math.sin(t * k.speed * 0.82 + k.phase) * 56 * k.speed * 0.82;
      const angle = Math.atan2(dy, dx);
      const wag = Math.sin(t * 4.2 + k.phase) * 0.22;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.scale(k.scale, k.scale);

      const bodyColor = k.warm
        ? rgba(mixRgb(accentRgb, { r: 242, g: 170, b: 82 }, 0.45), dark ? 0.24 : 0.17)
        : rgba(highlightRgb, dark ? 0.2 : 0.15);

      // Soft wake ring
      ctx.beginPath();
      ctx.ellipse(-6, 0, 32, 14, 0, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(highlightRgb, dark ? 0.12 : 0.08);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Fluid fish body
      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.bezierCurveTo(12, -10, -8, -8 + wag * 12, -24, wag * 18);
      ctx.bezierCurveTo(-8, 8 + wag * 12, 12, 10, 22, 0);
      ctx.fillStyle = bodyColor;
      ctx.fill();

      // Tail fin
      ctx.beginPath();
      ctx.moveTo(-22, wag * 17);
      ctx.quadraticCurveTo(-34, -10 + wag * 26, -40, -7 + wag * 28);
      ctx.quadraticCurveTo(-32, wag * 20, -40, 7 + wag * 28);
      ctx.quadraticCurveTo(-34, 10 + wag * 26, -22, wag * 17);
      ctx.fillStyle = rgba(highlightRgb, dark ? 0.18 : 0.13);
      ctx.fill();

      ctx.restore();
    };

    const drawRipples = () => {
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 1.05;
        rp.alpha *= 0.978;
        if (rp.r >= rp.maxR || rp.alpha <= 0.01) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(highlightRgb, rp.alpha);
        ctx.lineWidth = 1.1;
        ctx.stroke();

        if (rp.r > 22) {
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, rp.r * 0.66, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(ribbonRgb, rp.alpha * 0.65);
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    };

    let rafId = 0;
    const start = performance.now();

    const drawFrame = (now: number) => {
      const t = (now - start) * 0.001;
      ctx.clearRect(0, 0, width, height);

      if (mood === 'traditional-koi') {
        drawSilkRibbons(t, 5, dark ? 0.22 : 0.16);
        for (const k of kois) drawKoi(k, t);
        // Gentle periodic ambient ripple near corners
        if (!reduceMotion && Math.floor(t * 10) % 45 === 0 && ripples.length < 3) {
          addRipple(width * (Math.sin(t) > 0 ? 0.14 : 0.86), height * (0.25 + (t % 0.5)), 120);
        }
        drawRipples();
      } else if (mood === 'coastal-waves') {
        // Layered undulating water caustics
        drawSilkRibbons(t * 1.15, 7, dark ? 0.24 : 0.18);
        // Specular foam glints
        for (let i = 0; i < 16; i++) {
          const sx = ((i * 117 + t * 18) % (width + 80)) - 40;
          const sy = ((i * 73) % height) + Math.sin(t * 1.2 + i) * 14;
          const a = (0.12 + 0.12 * Math.sin(t * 2 + i * 1.3)) * (dark ? 1.2 : 0.85);
          ctx.beginPath();
          ctx.ellipse(sx, sy, 14 + (i % 3) * 6, 2.2, 0, 0, Math.PI * 2);
          ctx.fillStyle = rgba(highlightRgb, a);
          ctx.fill();
        }
        if (!reduceMotion && Math.floor(t * 10) % 38 === 0 && ripples.length < 4) {
          addRipple(width * (0.1 + ((t * 0.17) % 0.8)), height * (0.18 + ((t * 0.23) % 0.65)), 150);
        }
        drawRipples();
      } else if (mood === 'luxury-constellation') {
        // Update & connect constellation nodes
        for (const s of stars) {
          if (!reduceMotion) {
            s.x += s.vx;
            s.y += s.vy;
            if (s.x < -20) s.x = width + 20;
            if (s.x > width + 20) s.x = -20;
            if (s.y < -20) s.y = height + 20;
            if (s.y > height + 20) s.y = -20;
          }
          const twinkle = 0.45 + 0.55 * Math.sin(t * 1.8 + s.phase);
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = rgba(highlightRgb, (dark ? 0.52 : 0.34) * twinkle);
          ctx.fill();
        }
        const maxDist = 148;
        for (let i = 0; i < stars.length; i++) {
          const a = stars[i];
          for (let j = i + 1; j < stars.length; j++) {
            const b = stars[j];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (dist < maxDist) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = rgba(highlightRgb, (1 - dist / maxDist) * (dark ? 0.2 : 0.13));
              ctx.lineWidth = 0.85;
              ctx.stroke();
            }
          }
          if (pointer.active) {
            const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
            if (pd < 180) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(pointer.x, pointer.y);
              ctx.strokeStyle = rgba(highlightRgb, (1 - pd / 180) * (dark ? 0.28 : 0.18));
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
          }
        }
      } else {
        // botanical-silk: soft translucent silk threads + floating luminous bloom orbs
        drawSilkRibbons(t * 0.85, 5, dark ? 0.2 : 0.15);
        for (let i = 0; i < 20; i++) {
          const baseX = ((i * 97) % 100) * 0.01 * width;
          const baseY = ((i * 61) % 100) * 0.01 * height;
          const ox = baseX + Math.sin(t * 0.45 + i * 1.1) * 28;
          const oy = baseY + Math.cos(t * 0.38 + i * 0.8) * 24;
          const radius = 5 + (i % 5) * 3.5;
          const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, radius * 2.2);
          g.addColorStop(0, rgba(i % 2 === 0 ? highlightRgb : ribbonRgb, dark ? 0.28 : 0.18));
          g.addColorStop(1, rgba(highlightRgb, 0));
          ctx.beginPath();
          ctx.arc(ox, oy, radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }
      }

      if (!reduceMotion) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else if (!reduceMotion) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    rafId = requestAnimationFrame(drawFrame);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [accent, dark, ground, line, mood]);

  return (
    <canvas
      ref={canvasRef}
      data-inv-ambient={mood}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-95"
    />
  );
}

/* ───────────────────────── 2. Wax Seal Spark Burst ───────────────────────── */

export function SealSparkBurst({ active, accent, secondary }: { active: boolean; accent: string; secondary: string }) {
  const sparks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2 + (i % 2) * 0.14;
        const dist = 54 + (i % 3) * 26;
        return {
          tx: Math.round(Math.cos(angle) * dist),
          ty: Math.round(Math.sin(angle) * dist),
          size: 4 + (i % 3) * 2.5,
          delay: (i % 4) * 28,
          alt: i % 2 === 1,
        };
      }),
    [],
  );

  if (!active) return null;

  return (
    <span className="pointer-events-none absolute left-1/2 top-[46%] z-[5] motion-reduce:hidden" aria-hidden="true">
      {sparks.map((s, idx) => (
        <span
          key={idx}
          className="absolute block rounded-full"
          style={
            {
              width: s.size,
              height: s.size,
              marginLeft: -s.size / 2,
              marginTop: -s.size / 2,
              background: s.alt ? secondary : accent,
              boxShadow: `0 0 10px ${s.alt ? secondary : accent}`,
              animation: `inv-spark-burst 760ms cubic-bezier(0.16,1,0.3,1) ${s.delay}ms both`,
              '--sx': `${s.tx}px`,
              '--sy': `${s.ty}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}

/* ───────────────────────── 3. Foil-Stamped 3D Tilt Wrapper ───────────────────────── */

export interface FoilTiltCardProps {
  children: React.ReactNode;
  accent: string;
  line: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Subtle ThreeUI-inspired 3D paper-foil tilt + metallic specular sweep wrapper.
 * Automatically disables inside visual editor (`embedded` / `onEditPart`) and reduced-motion.
 */
export function FoilTiltCard({ children, accent, line, disabled = false, className = '' }: FoilTiltCardProps) {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return; // preserve native smooth scrolling on touch
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / Math.max(1, rect.width);
    const py = (e.clientY - rect.top) / Math.max(1, rect.height);
    setTilt({
      rx: (0.5 - py) * 7.5,
      ry: (px - 0.5) * 9,
      gx: Math.round(px * 100),
      gy: Math.round(py * 100),
      active: true,
    });
  };

  const handleLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  };

  return (
    <div
      className={`relative [perspective:1000px] ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <div
        className="relative transition-transform duration-300 ease-out will-change-transform motion-reduce:transform-none"
        style={{
          transform: tilt.active
            ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateZ(4px)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px)',
        }}
      >
        {children}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 motion-reduce:hidden"
          style={{
            opacity: tilt.active ? 1 : 0,
            background: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, color-mix(in srgb, #fffaf0 42%, ${line}) 0%, color-mix(in srgb, ${accent} 10%, transparent) 38%, transparent 72%)`,
            mixBlendMode: 'soft-light',
          }}
        />
      </div>
    </div>
  );
}

/* ───────────────────────── 6. Floating Quick-Jump Dock ───────────────────────── */

export interface QuickDockItem {
  id: string;
  label: string;
  icon: 'calendar' | 'images' | 'sparkles' | 'check' | 'wishes' | 'gift';
}

export interface InvitationQuickDockProps {
  items: QuickDockItem[];
  paper: string;
  ink: string;
  accent: string;
  onAccent: string;
  line: string;
}

const DOCK_ICONS = {
  calendar: Calendar,
  images: Images,
  sparkles: Sparkles,
  check: CheckCircle2,
  wishes: MessageCircleHeart,
  gift: Gift,
} as const;

/**
 * ThreeUI `animated-top-dock` adapted into a compact theme-colored bottom quick-jump pill
 * positioned cleanly away from the right-edge Music & Heart buttons (zero overlap on 375px mobile).
 */
export function InvitationQuickDock({ items, paper, ink, accent, onAccent, line }: InvitationQuickDockProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [halo, setHalo] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const sync = () => {
      const btn = btnRefs.current[activeId];
      if (!btn) return;
      setHalo({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [activeId, items.length]);

  useEffect(() => {
    if (items.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const els = items.map((it) => document.getElementById(it.id)).filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-25% 0px -45% 0px', threshold: [0.1, 0.35, 0.65] },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  const jumpTo = (id: string) => {
    setActiveId(id);
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Điều hướng nhanh trong thiệp cưới"
      data-inv-dock="true"
      className="fixed bottom-4 left-3 right-[72px] z-40 flex justify-center animate-[inv-pop_320ms_ease-out_both] motion-reduce:animate-none sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
    >
      <div
        className="relative flex max-w-full items-center gap-1 overflow-x-auto rounded-full px-1.5 py-1.5 shadow-[0_14px_34px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          background: `color-mix(in srgb, ${paper} 88%, transparent)`,
          border: `1px solid color-mix(in srgb, ${line} 75%, transparent)`,
          color: ink,
        }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Arc / Meniscus sliding glowing pill */}
        {halo && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: halo.left,
              width: halo.width,
              background: accent,
              boxShadow: `0 0 18px -4px ${accent}`,
            }}
          />
        )}
        {items.map((item, idx) => {
          const Icon = DOCK_ICONS[item.icon];
          const isActive = activeId === item.id;
          const dist = hoveredIdx === null ? 99 : Math.abs(hoveredIdx - idx);
          const scale = dist === 0 ? 1.06 : dist === 1 ? 1.02 : 1;
          const lift = dist === 0 ? -1.5 : dist === 1 ? -0.5 : 0;

          return (
            <button
              key={item.id}
              ref={(el) => {
                btnRefs.current[item.id] = el;
              }}
              type="button"
              onClick={() => jumpTo(item.id)}
              onMouseEnter={() => setHoveredIdx(idx)}
              aria-current={isActive ? 'true' : undefined}
              className="relative z-[1] inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-[12px] font-semibold tracking-tight transition-all duration-200 sm:px-3 sm:text-[12.5px]"
              style={{
                color: isActive ? onAccent : ink,
                transform: `translateY(${lift}px) scale(${scale})`,
              }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

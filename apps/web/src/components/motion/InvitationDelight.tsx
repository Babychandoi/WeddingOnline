'use client';

/**
 * Gói 1 — Original motion delight components for DamCuoiOnline wedding invitations & archives:
 * - WishesHeart3D (3D rotating constellation + typography heart woven from real guest wishes)
 * - ShareSplayButton (tactile fan-out share tray with Copy, Native/Zalo, Facebook)
 * - VinylMusicButton (miniature spinning vinyl disc + pivoting tonearm for invitation BGM)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Link2, Music2, Share2, Sparkles, VolumeX, X } from 'lucide-react';

/* ───────────────────────── Color Utility ───────────────────────── */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string, fallback: Rgb = { r: 190, g: 38, b: 76 }): Rgb {
  const c = hex.trim().replace('#', '');
  if (/^[0-9a-f]{3}$/i.test(c)) {
    return {
      r: parseInt(c[0] + c[0], 16),
      g: parseInt(c[1] + c[1], 16),
      b: parseInt(c[2] + c[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/i.test(c)) {
    return {
      r: parseInt(c.slice(0, 2), 16),
      g: parseInt(c.slice(2, 4), 16),
      b: parseInt(c.slice(4, 6), 16),
    };
  }
  return fallback;
}

function rgba(c: Rgb, a: number): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.max(0, Math.min(1, a))})`;
}

function isDarkHex(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex, { r: 255, g: 255, b: 255 });
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

/* ───────────────────────── 1. WishesHeart3D (Heartcode + Pulse) ───────────────────────── */

export interface HeartWishItem {
  id: string;
  name: string;
  message: string;
}

export interface WishesHeart3DProps {
  wishes: HeartWishItem[];
  coupleName: string;
  accent?: string;
  line?: string;
  paper?: string;
  ink?: string;
  className?: string;
}

interface HeartPoint3D {
  x: number;
  y: number;
  z: number;
  isStar: boolean;
  label?: string;
  phase: number;
}

const FALLBACK_BLESSINGS = [
  'Trăm năm hạnh phúc',
  'Viên mãn dài lâu',
  'Tình yêu trọn vẹn',
  'Hạnh phúc ngập tràn',
  'Mãi bên nhau',
  'Sớm có tin vui',
  'Yêu thương đong đầy',
  'Rạng rỡ ngày chung đôi',
];

function buildSnippet(w: HeartWishItem): string {
  const clean = w.message.replace(/\s+/g, ' ').trim();
  const shortMsg = clean.length > 26 ? `${clean.slice(0, 24)}…` : clean;
  return w.name ? `${shortMsg} · ${w.name.split(/\s+/).slice(-2).join(' ')}` : shortMsg;
}

/**
 * Parametric 3D rotating heart woven from constellation stars and real guest wishes.
 * Pure Canvas 2D (0 extra WebGL contexts), drag-to-spin, offscreen-paused.
 */
export function WishesHeart3D({
  wishes,
  coupleName,
  accent = '#be123c',
  line = '#d9a441',
  paper = '#fffdf8',
  ink = '#23171b',
  className = '',
}: WishesHeart3DProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showText, setShowText] = useState(true);
  const dragSpinRef = useRef({ dragging: false, lastX: 0, angle: 0, vel: 0.32 });

  const phrases = useMemo(() => {
    const fromWishes = wishes.slice(0, 14).map(buildSnippet).filter(Boolean);
    const merged = [...fromWishes];
    let i = 0;
    while (merged.length < 10) {
      merged.push(FALLBACK_BLESSINGS[i % FALLBACK_BLESSINGS.length]);
      i++;
    }
    return merged;
  }, [wishes]);

  const points = useMemo<HeartPoint3D[]>(() => {
    const pts: HeartPoint3D[] = [];
    // 52 constellation nodes distributed across a plump 3D heart volume
    const layers = [-0.62, -0.32, 0, 0.32, 0.62];
    layers.forEach((zLayer, li) => {
      const scale = Math.sqrt(Math.max(0.2, 1 - zLayer * zLayer * 1.15));
      const count = li === 2 ? 18 : 10;
      for (let i = 0; i < count; i++) {
        const u = (i / count) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(u), 3) * scale;
        const hy = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * scale;
        const hz = zLayer * 9.5 + Math.sin(u * 2 + li) * 1.6;
        pts.push({
          x: hx,
          y: hy,
          z: hz,
          isStar: true,
          phase: u + li * 1.3,
        });
      }
    });

    // 14 floating wish text labels orbiting the outer heart silhouette
    const labelCount = Math.min(14, phrases.length);
    for (let i = 0; i < labelCount; i++) {
      const u = (i / labelCount) * Math.PI * 2 + 0.18;
      const depthBand = ((i % 3) - 1) * 0.42;
      const scale = Math.sqrt(Math.max(0.35, 1 - depthBand * depthBand));
      const hx = 16 * Math.pow(Math.sin(u), 3) * scale * 1.06;
      const hy = -(13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u)) * scale * 1.04;
      const hz = depthBand * 11;
      pts.push({
        x: hx,
        y: hy,
        z: hz,
        isStar: false,
        label: phrases[i % phrases.length],
        phase: i * 0.8,
      });
    }
    return pts;
  }, [phrases]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const accentRgb = hexToRgb(accent);
    const lineRgb = hexToRgb(line, { r: 217, g: 164, b: 65 });
    const inkRgb = hexToRgb(ink, { r: 35, g: 23, b: 27 });
    const dark = isDarkHex(paper);

    let width = wrap.clientWidth || 360;
    let height = 270;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    let visible = true;

    const resize = () => {
      width = Math.max(260, wrap.clientWidth || 360);
      height = width < 400 ? 245 : 275;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(wrap);

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              visible = Boolean(entries[0]?.isIntersecting);
            },
            { threshold: 0.05 },
          )
        : null;
    io?.observe(wrap);

    let rafId = 0;
    let last = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.004, (now - last) / 1000));
      last = now;
      const t = now * 0.001;

      if (!visible || document.hidden) {
        if (!reduceMotion) rafId = requestAnimationFrame(render);
        return;
      }

      const spin = dragSpinRef.current;
      if (!reduceMotion && !spin.dragging) {
        spin.vel += (0.34 - spin.vel) * Math.min(1, dt * 2.4);
        spin.angle += spin.vel * dt;
      }

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2 + 4;
      const pulse = reduceMotion ? 1 : 1 + Math.sin(t * 2.2) * 0.032;
      const unit = Math.min(width, height) * 0.0245 * pulse;

      // Ambient warm halo behind the 3D heart
      const halo = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.min(width, height) * 0.44);
      halo.addColorStop(0, rgba(accentRgb, dark ? 0.24 : 0.14));
      halo.addColorStop(0.55, rgba(lineRgb, dark ? 0.1 : 0.06));
      halo.addColorStop(1, rgba(accentRgb, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(width, height) * 0.44, 0, Math.PI * 2);
      ctx.fill();

      const cosA = Math.cos(spin.angle);
      const sinA = Math.sin(spin.angle);
      const tiltX = 0.14;
      const cosT = Math.cos(tiltX);
      const sinT = Math.sin(tiltX);

      // Project all 3D heart nodes
      const projected = points.map((p) => {
        const rx = p.x * cosA - p.z * sinA;
        const rz1 = p.x * sinA + p.z * cosA;
        const ry = p.y * cosT - rz1 * sinT;
        const rz = p.y * sinT + rz1 * cosT;
        const fov = 46;
        const persp = fov / (fov + rz + 16);
        return {
          ...p,
          sx: cx + rx * unit * persp * 1.42,
          sy: cy + ry * unit * persp * 1.42,
          rz,
          persp,
        };
      });

      // Draw constellation connections between nearby star nodes
      const stars = projected.filter((p) => p.isStar);
      const maxEdge = unit * 11.2;
      ctx.lineWidth = 0.85;
      for (let i = 0; i < stars.length; i++) {
        const a = stars[i];
        for (let j = i + 1; j < stars.length; j++) {
          const b = stars[j];
          const d = Math.hypot(a.sx - b.sx, a.sy - b.sy);
          if (d < maxEdge) {
            const depthAlpha = Math.max(0.08, Math.min(1, ((a.persp + b.persp) * 0.5 - 0.55) * 1.8));
            const alpha = (1 - d / maxEdge) * depthAlpha * (dark ? 0.42 : 0.34);
            ctx.strokeStyle = rgba(i % 2 === 0 ? accentRgb : lineRgb, alpha);
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      // Sort back-to-front for crisp 3D depth occlusion
      projected.sort((a, b) => b.rz - a.rz);

      for (const p of projected) {
        const depthFade = Math.max(0.18, Math.min(1, (p.persp - 0.56) * 2.1));
        if (p.isStar) {
          const twinkle = reduceMotion ? 0.85 : 0.65 + 0.35 * Math.sin(t * 3 + p.phase);
          const radius = Math.max(1.2, 2.35 * p.persp);
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
          ctx.fillStyle = rgba(p.phase > 3 ? lineRgb : accentRgb, depthFade * twinkle * (dark ? 0.95 : 0.88));
          ctx.fill();
        } else if (showText && p.label) {
          const fontSize = Math.max(9.5, Math.min(13.5, 11.2 * p.persp));
          ctx.font = `${p.persp > 0.84 ? '600' : '500'} ${fontSize.toFixed(1)}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = rgba(p.persp > 0.86 ? accentRgb : inkRgb, depthFade * (dark ? 0.92 : 0.86));
          ctx.fillText(p.label, p.sx, p.sy);
        }
      }

      if (!reduceMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      io?.disconnect();
    };
  }, [accent, ink, line, paper, points, showText]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragSpinRef.current.dragging = true;
    dragSpinRef.current.lastX = e.clientX;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragSpinRef.current.dragging) return;
    const dx = e.clientX - dragSpinRef.current.lastX;
    dragSpinRef.current.lastX = e.clientX;
    dragSpinRef.current.angle += dx * 0.012;
    dragSpinRef.current.vel = Math.max(-3.2, Math.min(3.2, dx * 0.14));
  };

  const onPointerEnd = () => {
    dragSpinRef.current.dragging = false;
  };

  return (
    <div
      ref={wrapRef}
      data-wishes-heart-3d="true"
      className={`relative mb-7 overflow-hidden rounded-[calc(var(--inv-r,12px)+4px)] border px-3 pb-3 pt-2.5 text-center ${className}`}
      style={{
        borderColor: `color-mix(in srgb, ${line} 65%, transparent)`,
        background: `radial-gradient(110% 90% at 50% 45%, color-mix(in srgb, ${accent} 7%, ${paper}), ${paper})`,
      }}
    >
      <div className="flex items-center justify-between gap-2 px-1 text-[11px]">
        <span className="inline-flex items-center gap-1 font-semibold tracking-wide" style={{ color: accent }}>
          <Sparkles className="h-3.5 w-3.5" /> Trái tim lời chúc 3D · {wishes.length} lời chúc
        </span>
        <button
          type="button"
          onClick={() => setShowText((s) => !s)}
          className="rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold transition hover:opacity-85"
          style={{ borderColor: `color-mix(in srgb, ${line} 80%, transparent)`, color: ink }}
        >
          {showText ? 'Chỉ hiện chòm sao' : 'Hiện chữ lời chúc'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="mx-auto block cursor-grab touch-pan-y active:cursor-grabbing"
        aria-label={`Trái tim 3D dệt từ lời chúc dành cho ${coupleName}`}
      />

      <p className="text-[11px] opacity-65" style={{ color: ink }}>
        Kéo ngang để xoay trái tim · Lời chúc bạn gửi sẽ lập tức bay vào quỹ đạo
      </p>
    </div>
  );
}

/* ───────────────────────── 2. Fan-Out Share Menu (Splay) ───────────────────────── */

export interface ShareSplayButtonProps {
  title: string;
  accent: string;
  onAccent: string;
  paper: string;
  line: string;
  ink: string;
}

export function ShareSplayButton({ title, accent, onAccent, paper, line, ink }: ShareSplayButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  const nativeShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
    } else {
      await copyLink();
    }
  };

  const shareFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer,width=640,height=520');
  };

  return (
    <div className="mt-7 flex flex-col items-center gap-2.5" data-share-splay="true">
      <div className="relative inline-flex items-center justify-center">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex min-h-[46px] items-center gap-2 rounded-full border px-6 text-[14.5px] font-semibold shadow-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
          style={{
            borderColor: accent,
            background: open ? accent : 'transparent',
            color: open ? onAccent : ink,
          }}
        >
          {open ? <X className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {open ? 'Thu gọn' : 'Chia sẻ thiệp'}
        </button>
      </div>

      {/* Splay fan-out action pills */}
      <div
        className={`flex flex-wrap items-center justify-center gap-2 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open ? 'max-h-24 translate-y-0 opacity-100' : 'pointer-events-none max-h-0 -translate-y-2 opacity-0'
        }`}
      >
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-semibold shadow-sm transition hover:-translate-y-0.5"
          style={{
            background: copied ? accent : paper,
            color: copied ? onAccent : ink,
            borderColor: copied ? accent : line,
          }}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Đã chép link!' : 'Chép link'}
        </button>

        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-semibold shadow-sm transition hover:-translate-y-0.5"
          style={{ background: paper, color: ink, borderColor: line }}
        >
          <Link2 className="h-3.5 w-3.5" style={{ color: accent }} /> Zalo / Gửi nhanh
        </button>

        <button
          type="button"
          onClick={shareFacebook}
          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-semibold shadow-sm transition hover:-translate-y-0.5"
          style={{ background: paper, color: ink, borderColor: line }}
        >
          <Share2 className="h-3.5 w-3.5" style={{ color: accent }} /> Facebook
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── 3. Spinning Vinyl Music Button (Lullo + Relief) ───────────────────────── */

export interface VinylMusicButtonProps {
  playing: boolean;
  pastCover: boolean;
  accent: string;
  onAccent: string;
  line: string;
  onToggle: () => void;
}

export function VinylMusicButton({
  playing,
  pastCover,
  accent,
  onAccent,
  line,
  onToggle,
}: VinylMusicButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={playing ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
      aria-pressed={playing}
      data-vinyl-music={playing ? 'playing' : 'paused'}
      className={`fixed bottom-4 right-4 z-40 grid place-items-center rounded-full shadow-[0_10px_24px_-6px_rgba(0,0,0,0.58)] transition-all duration-300 active:scale-90 ${
        pastCover ? 'h-12 w-12' : 'h-11 w-11 opacity-85 hover:opacity-100'
      }`}
      style={{
        background: playing
          ? 'repeating-radial-gradient(circle at center, #1b1718 0px, #1b1718 2px, #2b2426 2.5px, #141112 4px)'
          : `color-mix(in srgb, ${accent} 85%, #1a1214)`,
        border: `1.5px solid ${line}`,
        color: onAccent,
      }}
    >
      {/* Spinning center vinyl label */}
      <span
        className={`grid h-6 w-6 place-items-center rounded-full shadow-inner ${
          playing ? 'motion-safe:animate-[spin_4.2s_linear_infinite]' : ''
        }`}
        style={{
          background: playing ? accent : 'transparent',
          color: onAccent,
          boxShadow: playing ? `0 0 0 2px ${line}66` : 'none',
        }}
      >
        {playing ? <Music2 className="h-3.5 w-3.5" /> : <VolumeX className="h-4 w-4" />}
      </span>

      {/* Tiny pivoting gold tonearm on top-right edge */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-0.5 -top-0.5 h-5 w-1.5 origin-top rounded-full transition-transform duration-500"
        style={{
          background: `linear-gradient(180deg, ${line}, #fff5d6)`,
          transform: playing ? 'rotate(24deg)' : 'rotate(-16deg)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.45)',
        }}
      />
    </button>
  );
}
